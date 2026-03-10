from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from bolt_action_cli.game import BAGame, GameOver


BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@dataclass
class WebState:
    game: BAGame | None = None
    flash: str | None = None
    last_event: dict | None = None
    last_roll: dict | None = None
    history: list[dict] = field(default_factory=list)

    def push_event(self, event: dict):
        self.last_event = event
        self.history.append(event)
        if len(self.history) > 50:
            self.history = self.history[-50:]


state = WebState()

app = FastAPI(title="Bolt Action Dice Bag")
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")


def _redirect(path: str) -> RedirectResponse:
    return RedirectResponse(url=path, status_code=303)


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "state": state,
            "default_factions": [
                "Germany",
                "Soviet Union",
                "USA",
                "United Kingdom",
                "Japan",
                "Italy",
                "France",
                "Hungary",
                "Romania",
                "Finland",
                "Poland",
            ],
        },
    )


@app.post("/start")
def start(
    a_name: str = Form(...),
    b_name: str = Form(...),
    a_units: int = Form(...),
    b_units: int = Form(...),
    n_turns: int = Form(6),
):
    a_units = max(0, int(a_units))
    b_units = max(0, int(b_units))
    n_turns = max(1, int(n_turns))
    state.game = BAGame(A_name=a_name, B_name=b_name, A_units=a_units, B_units=b_units, n_turns=n_turns)
    state.flash = None
    state.last_event = None
    state.last_roll = None
    state.history.clear()
    return _redirect("/game")


@app.get("/game", response_class=HTMLResponse)
def game(request: Request):
    if state.game is None:
        return _redirect("/")
    g = state.game
    status = g.get_status()
    return templates.TemplateResponse(
        "game.html",
        {
            "request": request,
            "status": status,
            "state": state,
            "last_pulled": g.last_pulled,
            "last_roll": g.last_roll,
        },
    )


@app.post("/action/pull")
def action_pull():
    if state.game is None:
        return _redirect("/")
    g = state.game
    if not g.bag.has_remaining_dice:
        state.flash = "Turn over — no dice remaining."
        return _redirect("/game")

    ev = {"type": "pull", **g.pull_die(), "turn": g.turn}
    state.push_event(ev)
    state.flash = None

    if not g.bag.has_remaining_dice:
        state.flash = "Turn over — no dice remaining."
    return _redirect("/game")


@app.post("/action/roll")
def action_roll(n: int = Form(1)):
    if state.game is None:
        return _redirect("/")
    g = state.game
    n = int(n)
    if n <= 0:
        state.flash = "Number of dice must be > 0."
        return _redirect("/game")
    if n > 50:
        n = 50
    roll = g.roll_d6(n)
    ev = {"type": "roll", "turn": g.turn, "n": roll["n"], "counts": roll["counts"]}
    state.push_event(ev)
    state.flash = None
    return _redirect("/game")


@app.post("/action/kill")
def action_kill(army: Literal["A", "B"] = Form(...), n: int = Form(1)):
    if state.game is None:
        return _redirect("/")
    g = state.game
    n = int(n)
    if n <= 0:
        state.flash = "Casualties must be > 0."
        return _redirect("/game")
    g.kill_unit(army=army, n=n)
    name = g.A_name if army == "A" else g.B_name
    ev = {"type": "kill", "turn": g.turn, "army": army, "name": name, "n": n}
    state.push_event(ev)
    state.flash = None
    return _redirect("/game")


@app.post("/action/next_turn")
def action_next_turn():
    if state.game is None:
        return _redirect("/")
    g = state.game
    try:
        g.advance_turn()
        ev = {"type": "next_turn", "turn": g.turn}
        state.push_event(ev)
        state.flash = None
    except GameOver:
        state.flash = "Game over."
    return _redirect("/game")


@app.post("/action/reset")
def action_reset():
    state.game = None
    state.flash = None
    state.last_event = None
    state.last_roll = None
    state.history.clear()
    return _redirect("/")

