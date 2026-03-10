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
            id="us_platoon_commander",
            name="US Platoon Commander",
            description="1 officer",
            base_points=30,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=9),
                OptionDef(
                    id="extra_men_regular",
                    name="Add up to 6 men with rifles (Regular)",
                    kind="count",
                    points_per=10,
                    max_count=6,
                    group="extra_men",
                ),
                OptionDef(
                    id="extra_men_veteran",
                    name="Add up to 6 men with rifles (Veteran)",
                    kind="count",
                    points_per=13,
                    max_count=6,
                    group="extra_men",
                ),
                OptionDef(id="smg", name="Add SMGs", kind='count', points_per=4, max_count=3),
            ],
        ),


        UnitDef(
            id="us_company_commander",
            name="US Company Commander",
            description="1 officer",
            base_points=60,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=18),
                OptionDef(
                    id="extra_men_regular",
                    name="Add up to 6 men with rifles (Regular)",
                    kind="count",
                    points_per=10,
                    max_count=6,
                    group="extra_men",
                ),
                OptionDef(
                    id="extra_men_veteran",
                    name="Add up to 6 men with rifles (Veteran)",
                    kind="count",
                    points_per=13,
                    max_count=6,
                    group="extra_men",
                ),
                OptionDef(id="smg", name="Add SMGs", kind='count', points_per=4, max_count=3),
            ],
        ),

        UnitDef(
            id="us_medic",
            name="US Medic",
            description="One medic",
            base_points=23,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=7),
            ],
        ),

        UnitDef(
            id="us_paratrooper_squad",
            name="US Paratrooper Squad",
            description="1 NCO + 5 men with rifles (base)",
            base_points=66,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=12),
                OptionDef(id="bar", name="Add BAR", points_delta=6),
                OptionDef(id="lgm", name="Add LMG", points_delta=15),
                OptionDef(id="smg", name="Add SMGs", kind='count', points_per=4, max_count=3, group="smgs"),
                OptionDef(
                    id="extra_men_regular",
                    name="Add up to 6 men with rifles (Regular)",
                    kind="count",
                    points_per=11,
                    max_count=6,
                    group="extra_men",
                ),
                OptionDef(
                    id="extra_men_veteran",
                    name="Add up to 6 men with rifles (Veteran)",
                    kind="count",
                    points_per=14,
                    max_count=6,
                    group="extra_men",
                ),
            ],
        ),


        UnitDef(
            id="us_rangers_squad",
            name="US Ranger Squad",
            description="1 NCO + 4 men with rifles (base)",
            base_points=70,
            options=[
                OptionDef(id="bar", name="Add BAR", points_delta=6),
                OptionDef(id="smg", name="Add SMGs", kind='count', points_per=4, max_count=3, group="smgs"),
                OptionDef(
                    id="extra_men_veteran",
                    name="Add up to 6 men with rifles (Veteran)",
                    kind="count",
                    points_per=14,
                    max_count=6,
                    group="extra_men",
                ),
            ],
        ),

        UnitDef(
            id="us_heavy_machine_gun_team",
            name="US Heavy Machine Gun Team",
            description="One HMG team",
            base_points=70,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=21),
            ],
        ),

        UnitDef(
            id="us_bazooka_team",
            name="US Bazooka Team",
            description="One bazooka team with one bazooka and one rifleman",
            base_points=60,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=18),
            ],
        ),

        UnitDef(
            id="us_sniper_team",
            name="US Sniper Team",
            description="One sniper team with one sniper and one rifleman",
            base_points=52,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=15),
            ],
        ),


        UnitDef(
            id="us_light_mortar_team",
            name="US Light Mortar Team",
            description="One light mortar team (2 men)",
            base_points=30,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=9),
            ],
        ),

        UnitDef(
            id="us_medium_mortar_team",
            name="US Medium Mortar Team",
            description="One medium mortar team (3 men)",
            base_points=52,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=18),
                OptionDef(id="spotter", name="Add spotter", points_delta=10),
            ],
        ),


        UnitDef(
            id="us_57mm_antitank_team",
            name="US 57mm Antitank Team",
            description="One 57mm antitank team (3 men)",
            base_points=70,
            options=[
                OptionDef(id="veteran", name="Veteran", points_delta=21),
            ],
        ),

    ]

    return CatalogResponse(units=units)

