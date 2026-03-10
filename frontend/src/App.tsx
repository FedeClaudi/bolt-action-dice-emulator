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
      selected_option_ids: [],
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
        const set = new Set(it.selected_option_ids);
        if (set.has(optionId)) set.delete(optionId);
        else set.add(optionId);
        return { ...it, selected_option_ids: [...set] };
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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginBottom: 8 }}>Bolt Action Army List Builder (v1)</h1>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          Demo catalog + points-only, persisted as local JSON via the FastAPI backend.
        </p>

        {error ? (
          <div style={{ border: "1px solid #b91c1c", padding: 12, borderRadius: 8 }}>
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "stretch",
            marginTop: 16,
          }}
        >
          <div style={{ flex: 1, border: "1px solid #333", borderRadius: 8, padding: 12 }}>
            <h2 style={{ marginTop: 0 }}>Catalog</h2>
            {!catalog ? (
              <div>Loading…</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {catalog.units.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 8,
                      borderRadius: 8,
                      border: "1px solid #222",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>Base: {u.base_points} pts</div>
                    </div>
                    <button onClick={() => addUnit(u.id)}>Add</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 2, border: "1px solid #333", borderRadius: 8, padding: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <h2 style={{ marginTop: 0, marginBottom: 0, flex: 1 }}>Army</h2>
              <button onClick={onSave}>Save</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
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

            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
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

            <div style={{ marginTop: 16 }}>
              <h3 style={{ marginTop: 0 }}>Units</h3>
              {army.items.length === 0 ? (
                <div style={{ opacity: 0.8 }}>Add units from the catalog to start building.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {army.items.map((it, idx) => {
                    const unit = unitsById.get(it.unit_def_id);
                    return (
                      <div
                        key={`${it.unit_def_id}-${idx}`}
                        style={{ border: "1px solid #222", borderRadius: 8, padding: 12 }}
                      >
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>
                              {unit ? unit.name : it.unit_def_id}
                            </div>
                            <div style={{ opacity: 0.8, fontSize: 12 }}>
                              Unit ID: {it.unit_def_id}
                            </div>
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
                              {unit.options.map((opt) => (
                                <label
                                  key={opt.id}
                                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={it.selected_option_ids.includes(opt.id)}
                                    onChange={() => toggleOption(idx, opt.id)}
                                  />
                                  <span style={{ flex: 1 }}>{opt.name}</span>
                                  <span style={{ opacity: 0.8 }}>{opt.points_delta} pts</span>
                                </label>
                              ))}
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
