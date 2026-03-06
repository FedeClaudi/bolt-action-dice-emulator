import typer
from .game import BAGame

app = typer.Typer()


@app.command()
def play(
    army_a: str,
    army_b: str,
    units_a: int,
    units_b: int,
    turns: int = 6,
):
    game = BAGame(
        A_name=army_a,
        B_name=army_b,
        A_units=units_a,
        B_units=units_b,
        n_turns=turns,
    )

    game.play()


if __name__ == "__main__":
    app()