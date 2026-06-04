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
 * 폼 입력 검증 결과.
 *   - { value: number, error: null }  → 정상 입력값
 *   - { value: null,   error: null }  → 빈 값 (optional 필드 OK)
 *   - { value: null,   error: "..." } → 유효성 실패, 사용자에게 보일 메시지
 */
export type ParsedNumber =
  | { value: number; error: null }
  | { value: null; error: null }
  | { value: null; error: string };

type ParseOpts = {
  min: number;
  max: number;
  field: string;
  /** true 면 정수 강제 (10진 소수점 거부). */
  integer?: boolean;
};

/**
 * Optional number 입력 검증. 빈 문자열/null 은 OK (value=null, error=null).
 * 문자/음수/범위 밖은 한국어 에러 메시지.
 */
export function parseOptionalNumber(
  raw: FormDataEntryValue | null | undefined,
  opts: ParseOpts,
): ParsedNumber {
  if (raw == null) return { value: null, error: null };
  const s = String(raw).trim();
  if (!s) return { value: null, error: null };
  const n = Number(s);
  if (!Number.isFinite(n)) {
    return { value: null, error: `${opts.field}는 숫자만 입력하세요.` };
  }
  if (opts.integer && !Number.isInteger(n)) {
    return { value: null, error: `${opts.field}는 정수만 입력하세요.` };
  }
  if (n < opts.min) {
    return {
      value: null,
      error: `${opts.field}는 ${opts.min} 이상이어야 합니다.`,
    };
  }
  if (n > opts.max) {
    return {
      value: null,
      error: `${opts.field}는 ${opts.max} 이하여야 합니다.`,
    };
  }
  return { value: n, error: null };
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
