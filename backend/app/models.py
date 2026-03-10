from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field


UnitId = Annotated[str, Field(min_length=1)]
OptionId = Annotated[str, Field(min_length=1)]
ArmyListId = Annotated[str, Field(min_length=1)]


class OptionDef(BaseModel):
    id: OptionId
    name: str
    kind: Literal["toggle", "count"] = "toggle"
    # For kind="toggle"
    points_delta: int = 0
    # For kind="count"
    points_per: int = 0
    max_count: int | None = None
    # If set, options in the same group are mutually exclusive (v1 behavior: best-effort)
    group: str | None = None


class UnitDef(BaseModel):
    id: UnitId
    name: str
    base_points: int
    options: list[OptionDef] = Field(default_factory=list)


class CatalogResponse(BaseModel):
    units: list[UnitDef]


class SelectedOption(BaseModel):
    id: OptionId
    count: int = Field(default=1, ge=0)


class ArmyItem(BaseModel):
    unit_def_id: UnitId
    quantity: int = Field(default=1, ge=1)
    selected_options: list[SelectedOption] = Field(default_factory=list)


class ArmyList(BaseModel):
    id: ArmyListId
    name: str
    faction: str | None = None
    items: list[ArmyItem] = Field(default_factory=list)


class ArmyListSummary(BaseModel):
    id: ArmyListId
    name: str


class PointsLine(BaseModel):
    unit_def_id: UnitId
    unit_name: str
    quantity: int
    per_unit_points: int
    line_total_points: int


class PointsResponse(BaseModel):
    total_points: int
    lines: list[PointsLine]


class ApiError(BaseModel):
    detail: str
    code: Literal["NOT_FOUND", "BAD_REQUEST", "INTERNAL_ERROR"] = "BAD_REQUEST"

