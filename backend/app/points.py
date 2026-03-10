from __future__ import annotations

from backend.app.models import ArmyList, PointsLine, PointsResponse
from backend.app.models import CatalogResponse


def compute_points(catalog: CatalogResponse, army_list: ArmyList) -> PointsResponse:
    units_by_id = {u.id: u for u in catalog.units}

    lines: list[PointsLine] = []
    total = 0

    for item in army_list.items:
        unit = units_by_id.get(item.unit_def_id)
        if unit is None:
            # Unknown unit: treat as zero points for v1 (points-only).
            continue

        options_by_id = {o.id: o for o in unit.options}
        options_points = sum(
            options_by_id[opt_id].points_delta
            for opt_id in item.selected_option_ids
            if opt_id in options_by_id
        )
        per_unit = unit.base_points + options_points
        line_total = per_unit * item.quantity
        total += line_total

        lines.append(
            PointsLine(
                unit_def_id=unit.id,
                unit_name=unit.name,
                quantity=item.quantity,
                per_unit_points=per_unit,
                line_total_points=line_total,
            )
        )

    return PointsResponse(total_points=total, lines=lines)

