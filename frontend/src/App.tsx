import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  computePoints,
  getCatalog,
  listArmyLists,
  loadArmyList,
  saveArmyList,
} from "./api";
import type { ArmyItem, ArmyList, ArmyListSummary, CatalogResponse, PointsResponse, UnitDef } from "./api";

function App() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [lists, setLists] = useState<ArmyListSummary[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [army, setArmy] = useState<ArmyList>(() => ({
    id: crypto.randomUUID(),
    name: "New Army",
    faction: null,
    items: [],
  }));
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [error, setError] = useState<string>("");

  const [platoons, setPlatoons] = useState<string[]>(["platoon_1"]);
  const [activePlatoonId, setActivePlatoonId] = useState<string>("platoon_1");

  const unitsById = useMemo(() => {
    const map = new Map<string, UnitDef>();
    for (const u of catalog?.units ?? []) map.set(u.id, u);
    return map;
  }, [catalog]);

  async function refreshIndex() {
    const idx = await listArmyLists();
    setLists(idx);
  }

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setCatalog(await getCatalog());
        await refreshIndex();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setPoints(await computePoints(army));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [army]);

  function addUnit(unitId: string) {
    const item: ArmyItem = {
      unit_def_id: unitId,
      quantity: 1,
      selected_options: [],
      platoon: activePlatoonId,
    };
    setArmy((a) => ({ ...a, items: [...a.items, item] }));
  }

  function removeItem(idx: number) {
    setArmy((a) => ({ ...a, items: a.items.filter((_, i) => i !== idx) }));
  }

  function setQuantity(idx: number, quantity: number) {
    setArmy((a) => ({
      ...a,
      items: a.items.map((it, i) => (i === idx ? { ...it, quantity } : it)),
    }));
  }

  function toggleOption(idx: number, optionId: string) {
    setArmy((a) => ({
      ...a,
      items: a.items.map((it, i) => {
        if (i !== idx) return it;
        const existing = it.selected_options.find((o) => o.id === optionId);
        const next =
          existing && existing.count > 0
            ? it.selected_options.filter((o) => o.id !== optionId)
            : [...it.selected_options, { id: optionId, count: 1 }];
        return { ...it, selected_options: next };
      }),
    }));
  }

  function setOptionCount(idx: number, optionId: string, count: number, group?: string | null) {
    setArmy((a) => ({
      ...a,
      items: a.items.map((it, i) => {
        if (i !== idx) return it;

        const updated = it.selected_options.filter((o) => o.id !== optionId);
        if (count > 0) updated.push({ id: optionId, count });

        // If the option belongs to a group, enforce mutual exclusion in the UI by
        // removing any other options in the same group.
        if (group) {
          const unit = unitsById.get(it.unit_def_id);
          const inGroup = new Set((unit?.options ?? []).filter((o) => o.group === group).map((o) => o.id));
          return {
            ...it,
            selected_options: updated.filter((o) => o.id === optionId || !inGroup.has(o.id)),
          };
        }

        return { ...it, selected_options: updated };
      }),
    }));
  }

  async function onSave() {
    try {
      setError("");
      const saved = await saveArmyList(army);
      setArmy(saved);
      await refreshIndex();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onLoad(id: string) {
    try {
      setError("");
      const loaded = await loadArmyList(id);
      setArmy(loaded);
      setSelectedListId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "20px 16px 32px",
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ marginBottom: 4, fontSize: 26 }}>Bolt Action Army List Builder</h1>
          <p style={{ marginTop: 0, opacity: 0.8, fontSize: 13 }}>
            Demo catalog + points-only, saved locally via the FastAPI backend.
          </p>
        </header>

        {error ? (
          <div style={{ border: "1px solid #b91c1c", padding: 12, borderRadius: 8 }}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              padding: 14,
              background: "rgba(15,23,42,0.92)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
              border: "1px solid rgba(55,65,81,0.8)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Catalog</h2>
            {!catalog ? (
              <div>Loading…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {catalog.units.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(31,41,55,0.9)",
                      background:
                        "radial-gradient(circle at top left, rgba(31,41,55,0.95), rgba(15,23,42,0.98))",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                      <div style={{ opacity: 0.75, fontSize: 11 }}>{u.description}</div>
                      <div style={{ opacity: 0.7, fontSize: 11, marginTop: 2 }}>
                        Base: {u.base_points} pts
                      </div>
                    </div>
                    <button onClick={() => addUnit(u.id)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              flex: 2,
              borderRadius: 16,
              padding: 16,
              background: "rgba(15,23,42,0.96)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
              border: "1px solid rgba(55,65,81,0.9)",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <h2 style={{ marginTop: 0, marginBottom: 0, flex: 1 }}>Army</h2>
              <button onClick={onSave}>Save</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 64, opacity: 0.8 }}>ID</span>
                <input
                  style={{ minWidth: 320 }}
                  value={army.id}
                  onChange={(e) => setArmy((a) => ({ ...a, id: e.target.value }))}
                />
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 64, opacity: 0.8 }}>Name</span>
                <input
                  style={{ minWidth: 320 }}
                  value={army.name}
                  onChange={(e) => setArmy((a) => ({ ...a, name: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 64, opacity: 0.8 }}>Load</span>
                <select
                  value={selectedListId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedListId(id);
                    if (id) void onLoad(id);
                  }}
                >
                  <option value="">(select saved list)</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.id})
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={() => void refreshIndex()}>Refresh index</button>
            </div>

            <div style={{ marginTop: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 0 }}>Units</h3>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {platoons.map((pid, idx) => (
                      <button
                        key={pid}
                        type="button"
                        onClick={() => setActivePlatoonId(pid)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          border:
                            pid === activePlatoonId
                              ? "1px solid rgba(248,250,252,0.9)"
                              : "1px solid rgba(75,85,99,0.9)",
                          background:
                            pid === activePlatoonId
                              ? "rgba(248,250,252,0.08)"
                              : "rgba(15,23,42,0.9)",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {`Platoon ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = `platoon_${platoons.length + 1}`;
                      setPlatoons((prev) => [...prev, nextId]);
                      setActivePlatoonId(nextId);
                    }}
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999 }}
                  >
                    + Add platoon
                  </button>
                </div>
              </div>
              {army.items.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Add units from the catalog to start building.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {army.items
                    .map((it, idx) => ({ it, idx }))
                    .filter(({ it }) => it.platoon === activePlatoonId)
                    .map(({ it, idx }) => {
                    const unit = unitsById.get(it.unit_def_id);
                    return (
                      <div
                        key={`${it.unit_def_id}-${idx}`}
                        style={{
                          border: "1px solid rgba(31,41,55,0.9)",
                          borderRadius: 14,
                          padding: 12,
                          background:
                            "radial-gradient(circle at top left, rgba(17,24,39,0.98), rgba(15,23,42,1))",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>
                              {unit ? unit.name : it.unit_def_id}
                            </div>
                            <div style={{ opacity: 0.8, fontSize: 11 }}>Unit ID: {it.unit_def_id}</div>
                            {unit ? (
                              <div style={{ opacity: 0.75, fontSize: 11 }}>{unit.description}</div>
                            ) : null}
                          </div>
                          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            Qty
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) => setQuantity(idx, Number(e.target.value))}
                              style={{ width: 80 }}
                            />
                          </label>
                          <button onClick={() => removeItem(idx)}>Remove</button>
                        </div>

                        {unit?.options?.length ? (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>Upgrades</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {unit.options.map((opt) => {
                                const kind = opt.kind ?? "toggle";
                                const sel = it.selected_options.find((o) => o.id === opt.id);
                                const checked = !!sel && sel.count > 0;
                                const count = sel?.count ?? 0;

                                if (kind === "count") {
                                  const max = opt.max_count ?? undefined;
                                  const per = opt.points_per ?? 0;
                                  return (
                                    <div
                                      key={opt.id}
                                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                                    >
                                      <span style={{ flex: 1 }}>{opt.name}</span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={max}
                                        value={count}
                                        onChange={(e) =>
                                          setOptionCount(
                                            idx,
                                            opt.id,
                                            Number(e.target.value),
                                            opt.group ?? null,
                                          )
                                        }
                                        style={{ width: 90 }}
                                      />
                                      <span style={{ opacity: 0.8 }}>
                                        +{per} ea{max ? ` (max ${max})` : ""}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <label
                                    key={opt.id}
                                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleOption(idx, opt.id)}
                                    />
                                    <span style={{ flex: 1 }}>{opt.name}</span>
                                    <span style={{ opacity: 0.8 }}>{opt.points_delta} pts</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, borderTop: "1px solid #222", paddingTop: 12 }}>
              <h3 style={{ marginTop: 0 }}>Points</h3>
              {!points ? (
                <div>Computing…</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    Total: {points.total_points} pts
                  </div>
                  <div style={{ opacity: 0.8, fontSize: 12 }}>
                    Breakdown (server-calculated via <code>/api/points</code>)
                  </div>
                  {points.lines.map((l) => (
                    <div
                      key={`${l.unit_def_id}-${l.quantity}-${l.per_unit_points}`}
                      style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                    >
                      <span>
                        {l.unit_name} × {l.quantity}
                      </span>
                      <span style={{ opacity: 0.8 }}>
                        {l.per_unit_points} ea → {l.line_total_points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App
