from __future__ import annotations

from backend.app.models import CatalogResponse, OptionDef, UnitDef


def get_demo_catalog() -> CatalogResponse:
    """
    Demo-only catalog to prove the workflow end-to-end.

    Notes:
    - This is intentionally incomplete (v1).
    - Points are placeholders unless you replace them with book-accurate values.
    """

    units: list[UnitDef] = [
        UnitDef(
            id="us_rifle_squad",
            name="US Rifle Squad (Demo)",
            base_points=100,
            options=[
                OptionDef(id="bar", name="Add BAR", points_delta=20),
                OptionDef(id="smg_nco", name="NCO with SMG", points_delta=5),
                OptionDef(id="anti_tank_grenades", name="Anti-tank grenades", points_delta=10),
            ],
        ),
        UnitDef(
            id="us_lieutenant",
            name="US 2nd Lieutenant (Demo)",
            base_points=50,
            options=[
                OptionDef(id="extra_man", name="Extra man", points_delta=10),
            ],
        ),
        UnitDef(
            id="mortar_team",
            name="Medium Mortar Team (Demo)",
            base_points=60,
            options=[
                OptionDef(id="spotter", name="Add spotter", points_delta=10),
            ],
        ),
    ]

    return CatalogResponse(units=units)

