import random
from dataclasses import dataclass
from typing import Literal

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt
from rich.box import SIMPLE_HEAVY

console = Console()


def roll_die(n_faces: int = 6) -> int:
    return random.randint(1, n_faces)


def roll_dice(n: int) -> list[int]:
    return [roll_die() for _ in range(n)]


class GameOver(Exception):
    """Raised when attempting to advance beyond the last turn."""


class ActionDiceBag:
    def __init__(self, n_units_A: int, n_units_B: int):
        self.n_units = {"A": n_units_A, "B": n_units_B}
        self.reset()

    def reset(self):
        self.bag = ["A"] * self.n_units["A"] + ["B"] * self.n_units["B"]
        random.shuffle(self.bag)

    @property
    def has_remaining_dice(self) -> bool:
        return len(self.bag) > 0

    def pull(self) -> Literal["A", "B"]:
        return self.bag.pop()

    def remaining(self):
        return {"A": self.bag.count("A"), "B": self.bag.count("B")}


@dataclass
class BAGame:
    A_name: str
    B_name: str
    A_units: int
    B_units: int
    n_turns: int = 6

    def __post_init__(self):
        self.turn = 1
        self.turn_status_shown = -1
        self.bag = ActionDiceBag(self.A_units, self.B_units)
        # Web-friendly ephemeral state (optional)
        self.last_pulled: dict | None = None
        self.last_roll: dict | None = None

    # ----------------------------
    # Web-friendly methods (no Rich/Prompt)
    # ----------------------------
    def get_status(self) -> dict:
        remaining = self.bag.remaining()
        return {
            "turn": self.turn,
            "n_turns": self.n_turns,
            "A": {"name": self.A_name, "units": self.A_units, "dice_remaining": remaining["A"]},
            "B": {"name": self.B_name, "units": self.B_units, "dice_remaining": remaining["B"]},
            "has_remaining_dice": self.bag.has_remaining_dice,
        }

    def pull_die(self) -> dict:
        army = self.bag.pull()
        name = self.A_name if army == "A" else self.B_name
        payload = {"army": army, "name": name}
        self.last_pulled = payload
        return payload

    def roll_d6(self, n: int) -> dict:
        results = roll_dice(n)
        counts = {i: results.count(i) for i in range(1, 7)}
        payload = {"n": n, "results": results, "counts": counts}
        self.last_roll = payload
        return payload

    def kill_unit(self, army: Literal["A", "B"], n: int = 1) -> dict:
        """Decrement unit count for an army and constrain remaining dice in the bag accordingly."""
        if n <= 0:
            return self.get_status()

        if army == "A":
            self.A_units = max(0, self.A_units - n)
            self.bag.n_units["A"] = self.A_units
            limit = self.A_units
        else:
            self.B_units = max(0, self.B_units - n)
            self.bag.n_units["B"] = self.B_units
            limit = self.B_units

        # Remove any excess remaining dice for that army (does not reshuffle).
        kept: list[Literal["A", "B"]] = []
        kept_army = 0
        for d in self.bag.bag:
            if d == army:
                if kept_army < limit:
                    kept.append(d)
                    kept_army += 1
            else:
                kept.append(d)
        self.bag.bag = kept
        return self.get_status()

    def advance_turn(self) -> dict:
        self.turn += 1
        if self.turn > self.n_turns:
            raise GameOver
        self.bag.reset()
        return self.get_status()

    def status(self):
        remaining = self.bag.remaining()

        table = Table(title=f"Turn {self.turn}/{self.n_turns}", box=SIMPLE_HEAVY,)
        table.add_column("Army", style='red')
        table.add_column("Units", style='green')
        table.add_column("Dice Remaining", style='white')

        table.add_row(self.A_name, str(self.A_units), str(remaining["A"]))
        table.add_row(self.B_name, str(self.B_units), str(remaining["B"]))

        console.print('\n')
        console.print(table)

    def pull(self):
        payload = self.pull_die()
        console.print(Panel(f"[bold green]{payload['name']} activates[/bold green]"))

    def roll(self, n_dice:int|None):
        if n_dice is None:
            while True:
                try:
                    n = int(Prompt.ask("How many dice?", default="1"))
                    break
                except ValueError:
                    console.print("Bad value try again")
                
        else:
            n = n_dice
        counts = self.roll_d6(n)["counts"]

        table = Table(title="Dice Results", box=SIMPLE_HEAVY)
        table.add_column("Face", style='red')
        table.add_column("Count", style='white')

        for face, count in counts.items():
            if count:
                table.add_row(str(face), str(count))

        console.print('\n')
        console.print(table)

    def next_turn(self):
        try:
            self.advance_turn()
        except GameOver:
            console.print(Panel("[bold red]GAME OVER[/bold red]"))
            raise SystemExit

        console.print(Panel(f"[bold yellow]Turn {self.turn}[/bold yellow]", expand=True))

    def play(self):
        console.print(Panel(f"{self.A_name} vs {self.B_name}", title="Bolt Action"))

        while True:
            if self.turn_status_shown != self.turn:
                self.turn_status_shown = self.turn
                self.status()

            action = Prompt.ask(
                "Action (p/r/s/q)",
            )

            if action == "p":
                if not self.bag.has_remaining_dice:
                    console.print(Panel("[bold yellow]TURN OVER[/bold yellow]"))
                    self.next_turn()
                    continue

                self.pull()

                if not self.bag.has_remaining_dice:
                    console.print(Panel("[bold yellow]TURN OVER[/bold yellow]"))
                    self.next_turn()
            elif action == "q":
                break
            elif action == 's':
                self.status()
            elif action.startswith('r'):
                splits = action.split(' ')
                assert len(splits) <= 2, splits
                if len(splits)==2:
                    n_dice = int(splits[1])
                else:
                    n_dice = None

                self.roll(n_dice)

