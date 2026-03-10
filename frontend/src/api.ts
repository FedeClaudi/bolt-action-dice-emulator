export type OptionDef = {
  id: string;
  name: string;
  points_delta: number;
};

export type UnitDef = {
  id: string;
  name: string;
  base_points: number;
  options: OptionDef[];
};

export type CatalogResponse = {
  units: UnitDef[];
};

export type ArmyItem = {
  unit_def_id: string;
  quantity: number;
  selected_option_ids: string[];
};

export type ArmyList = {
  id: string;
  name: string;
  faction?: string | null;
  items: ArmyItem[];
};

export type ArmyListSummary = {
  id: string;
  name: string;
};

export type PointsLine = {
  unit_def_id: string;
  unit_name: string;
  quantity: number;
  per_unit_points: number;
  line_total_points: number;
};

export type PointsResponse = {
  total_points: number;
  lines: PointsLine[];
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function getCatalog(): Promise<CatalogResponse> {
  return fetchJson("/api/catalog");
}

export function listArmyLists(): Promise<ArmyListSummary[]> {
  return fetchJson("/api/lists");
}

export function loadArmyList(id: string): Promise<ArmyList> {
  return fetchJson(`/api/lists/${encodeURIComponent(id)}`);
}

export function saveArmyList(payload: ArmyList): Promise<ArmyList> {
  return fetchJson("/api/lists", { method: "POST", body: JSON.stringify(payload) });
}

export function computePoints(payload: ArmyList): Promise<PointsResponse> {
  return fetchJson("/api/points", { method: "POST", body: JSON.stringify(payload) });
}

