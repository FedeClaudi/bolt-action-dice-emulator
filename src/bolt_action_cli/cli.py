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


@app.command()
def web(
    host: str = "127.0.0.1",
    port: int = 8001,
    reload: bool = True,
):
    """Run the server-rendered webapp."""
    import uvicorn

    uvicorn.run(
        "bolt_action_cli.web.app:app",
        host=host,
        port=port,
        reload=reload,
    )


if __name__ == "__main__":
    app()