from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.catalog import get_demo_catalog
from backend.app.models import ArmyList, ArmyListSummary, CatalogResponse, PointsResponse
from backend.app.points import compute_points
from backend.app.store import list_summaries, load_list, save_list


def create_app() -> FastAPI:
    app = FastAPI(title="Bolt Action Army List Builder API", version="0.1.0")

    # Dev-friendly CORS for Vite.
    # If you change the frontend port, update this list.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    repo_root = Path(__file__).resolve().parents[2]

    @app.get("/api/catalog", response_model=CatalogResponse)
    def get_catalog() -> CatalogResponse:
        return get_demo_catalog()

    @app.get("/api/lists", response_model=list[ArmyListSummary])
    def get_lists() -> list[ArmyListSummary]:
        return list_summaries(repo_root)

    @app.get("/api/lists/{list_id}", response_model=ArmyList)
    def get_list(list_id: str) -> ArmyList:
        army_list = load_list(repo_root, list_id)
        if army_list is None:
            raise HTTPException(status_code=404, detail="List not found")
        return army_list

    @app.post("/api/lists", response_model=ArmyList)
    def post_list(payload: ArmyList) -> ArmyList:
        save_list(repo_root, payload)
        return payload

    @app.post("/api/points", response_model=PointsResponse)
    def post_points(payload: ArmyList) -> PointsResponse:
        return compute_points(get_demo_catalog(), payload)

    return app


app = create_app()

