type SearchParamValue = string | string[] | undefined;

export type SessionArchiveSearchParams = {
  cursor?: SearchParamValue;
  q?: SearchParamValue;
  member?: SearchParamValue;
  month?: SearchParamValue;
  pmin?: SearchParamValue;
  pmax?: SearchParamValue;
};

export type ParsedSessionArchiveParams = {
  cursorId?: number;
  filters: {
    q?: string;
    memberIds?: string[];
    month?: string;
    pmin?: number;
    pmax?: number;
  };
  hasActiveFilters: boolean;
};

export function parseSessionArchiveParams(
  params: SessionArchiveSearchParams,
): ParsedSessionArchiveParams {
  const memberIds = parseStringListParam(params.member);
  const filters = {
    q: firstSearchParam(params.q)?.trim() || undefined,
    memberIds: memberIds.length > 0 ? memberIds : undefined,
    month: parseMonthParam(firstSearchParam(params.month)) ?? undefined,
    pmin: parseNonNegativeInt(firstSearchParam(params.pmin)),
    pmax: parseNonNegativeInt(firstSearchParam(params.pmax)),
  };

  return {
    cursorId: parsePositiveInt(firstSearchParam(params.cursor)),
    filters,
    hasActiveFilters: Boolean(
      filters.q ||
        filters.memberIds?.length ||
        filters.month ||
        filters.pmin != null ||
        filters.pmax != null,
    ),
  };
}

export function buildSessionArchiveHref(
  params: Record<string, SearchParamValue>,
): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      const trimmed = item?.trim();
      if (trimmed) q.append(key, trimmed);
    }
  }
  const query = q.toString();
  return query ? `/sessions?${query}` : "/sessions";
}

export function parseMonthRange(month: string | undefined): {
  start: Date;
  endExclusive: Date;
} | null {
  const parsed = parseMonthParam(month);
  if (!parsed) return null;

  const [yearText, monthText] = parsed.split("-");
  const year = Number.parseInt(yearText, 10);
  const monthNumber = Number.parseInt(monthText, 10);

  return {
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
    endExclusive: new Date(Date.UTC(year, monthNumber, 1)),
  };
}

function firstSearchParam(raw: SearchParamValue): string | undefined {
  if (Array.isArray(raw)) {
    return raw.find((value) => value.trim());
  }
  return raw;
}

function parseStringListParam(raw: SearchParamValue): string[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const seen = new Set<string>();
  const parsed: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    parsed.push(trimmed);
  }

  return parsed;
}
function parseMonthParam(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;

  const month = Number.parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  return value;
}

function parsePositiveInt(raw: string | undefined): number | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) return undefined;

  const n = Number.parseInt(value, 10);
  return n > 0 ? n : undefined;
}

function parseNonNegativeInt(raw: string | undefined): number | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) return undefined;

  const n = Number.parseInt(value, 10);
  return n >= 0 ? n : undefined;
}
