// 페이스 / 시간 / 거리 관련 순수 함수.
// 페이스는 저장하지 않고 표시 시점에 계산한다 (docs/wiki/03-Screen-Flow.md §4 메모).

/**
 * 페이스(초/km)를 계산한다. 둘 중 하나라도 없거나 양수가 아니면 null.
 */
export function calcPaceSecPerKm(
  distanceKm: number | null | undefined,
  durationSec: number | null | undefined,
): number | null {
  if (!distanceKm || !durationSec) return null;
  if (distanceKm <= 0 || durationSec <= 0) return null;
  return durationSec / distanceKm;
}

/**
 * 페이스(초/km) → `M'SS"/km` 표기. 분이 두 자리 넘으면 그대로.
 * 입력이 null/NaN/음수면 "—".
 */
export function formatPace(secPerKm: number | null | undefined): string {
  if (secPerKm == null || !Number.isFinite(secPerKm) || secPerKm <= 0) {
    return "—";
  }
  const totalSec = Math.round(secPerKm);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}'${s.toString().padStart(2, "0")}"/km`;
}

/**
 * 초 → `MM:SS` 또는 `H:MM:SS`. null/0/음수면 "—".
 */
export function formatDurationSec(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return "—";
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * 거리 (km) 표시. 소수점 1자리. null/0 → "—".
 */
export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km) || km <= 0) return "—";
  return `${km.toFixed(1)} km`;
}

/**
 * 폼의 분/초 두 input → 초. 둘 다 null/빈값이면 null, 그 외엔 합산.
 * 음수/NaN/너무 큰 값(>24시간)은 null.
 */
export function parseDurationInput(
  minutesRaw: FormDataEntryValue | null | undefined,
  secondsRaw: FormDataEntryValue | null | undefined,
): number | null {
  const min = toNonNegInt(minutesRaw);
  const sec = toNonNegInt(secondsRaw);
  if (min == null && sec == null) return null;
  const total = (min ?? 0) * 60 + (sec ?? 0);
  if (total <= 0) return null;
  if (total > 24 * 3600) return null;
  return total;
}

/**
 * 폼의 거리 input → km (소수점 허용). 빈값이면 null. 음수/NaN/>1000 → null.
 */
export function parseDistanceInput(
  raw: FormDataEntryValue | null | undefined,
): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n) || n <= 0 || n > 1000) return null;
  return n;
}

function toNonNegInt(v: FormDataEntryValue | null | undefined): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * 초를 다시 분/초 분리. 폼 prefill용.
 */
export function splitDurationSec(sec: number | null | undefined): {
  minutes: string;
  seconds: string;
} {
  if (sec == null || sec <= 0) return { minutes: "", seconds: "" };
  const total = Math.round(sec);
  return {
    minutes: Math.floor(total / 60).toString(),
    seconds: (total % 60).toString(),
  };
}
