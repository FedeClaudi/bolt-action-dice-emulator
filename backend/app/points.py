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
        # Sum option costs. Supports toggle options and counted options.
        # Best-effort mutual exclusion: if options share a group, only count the highest-cost
        # selected option in that group.
        grouped_costs: dict[str, list[int]] = {}
        ungrouped_total = 0

        for sel in item.selected_options:
            opt = options_by_id.get(sel.id)
            if opt is None:
                continue
            if sel.count <= 0:
                continue

            if opt.kind == "count":
                count = sel.count
                if opt.max_count is not None:
                    count = min(count, opt.max_count)
                cost = opt.points_per * count
            else:
                cost = opt.points_delta

            if opt.group:
                grouped_costs.setdefault(opt.group, []).append(cost)
            else:
                ungrouped_total += cost

        options_points = ungrouped_total + sum(max(costs) for costs in grouped_costs.values())
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

