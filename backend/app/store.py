from __future__ import annotations

import json
from pathlib import Path

from backend.app.models import ArmyList, ArmyListId, ArmyListSummary


def _lists_dir(repo_root: Path) -> Path:
    return repo_root / "data" / "army_lists"


def ensure_store(repo_root: Path) -> Path:
    lists_dir = _lists_dir(repo_root)
    lists_dir.mkdir(parents=True, exist_ok=True)
    return lists_dir


def list_summaries(repo_root: Path) -> list[ArmyListSummary]:
    lists_dir = ensure_store(repo_root)
    out: list[ArmyListSummary] = []
    for path in sorted(lists_dir.glob("*.json")):
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(raw, dict) and "id" in raw and "name" in raw:
                out.append(ArmyListSummary(id=str(raw["id"]), name=str(raw["name"])))
        except Exception:
            # Skip malformed files (v1).
            continue
    return out


def load_list(repo_root: Path, list_id: ArmyListId) -> ArmyList | None:
    path = ensure_store(repo_root) / f"{list_id}.json"
    if not path.exists():
        return None
    raw = json.loads(path.read_text(encoding="utf-8"))
    return ArmyList.model_validate(raw)


def save_list(repo_root: Path, army_list: ArmyList) -> None:
    path = ensure_store(repo_root) / f"{army_list.id}.json"
    path.write_text(army_list.model_dump_json(indent=2), encoding="utf-8")

