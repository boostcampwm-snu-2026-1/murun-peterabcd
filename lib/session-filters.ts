export type SessionArchiveSearchParams = {
  cursor?: string;
  q?: string;
  member?: string;
  month?: string;
  pmin?: string;
  pmax?: string;
};

export type ParsedSessionArchiveParams = {
  cursorId?: number;
  filters: {
    q?: string;
    memberId?: string;
    month?: string;
    pmin?: number;
    pmax?: number;
  };
  hasActiveFilters: boolean;
};

export function parseSessionArchiveParams(
  params: SessionArchiveSearchParams,
): ParsedSessionArchiveParams {
  const filters = {
    q: params.q?.trim() || undefined,
    memberId: params.member?.trim() || undefined,
    month: parseMonthParam(params.month) ?? undefined,
    pmin: parseNonNegativeInt(params.pmin),
    pmax: parseNonNegativeInt(params.pmax),
  };

  return {
    cursorId: parsePositiveInt(params.cursor),
    filters,
    hasActiveFilters: Boolean(
      filters.q ||
        filters.memberId ||
        filters.month ||
        filters.pmin != null ||
        filters.pmax != null,
    ),
  };
}

export function buildSessionArchiveHref(
  params: Record<string, string | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const trimmed = value?.trim();
    if (trimmed) q.set(key, trimmed);
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
