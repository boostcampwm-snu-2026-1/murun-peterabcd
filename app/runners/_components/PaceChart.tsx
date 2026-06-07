import type { PaceHistoryPoint } from "@/lib/members";

import { formatPace } from "@/lib/pace";

// SVG line chart — 추가 라이브러리 없이 한 화면 한 차트만 필요해서 직접 그림.
// y 축: 페이스 (sec/km, 낮을수록 빠름). x 축: 참여 순서 (시간순).
//
// 단일 포인트면 점 하나만, 0 포인트면 placeholder.

type Props = {
  points: PaceHistoryPoint[];
};

const VB_WIDTH = 600;
const VB_HEIGHT = 240;
const PAD_TOP = 24;
const PAD_RIGHT = 24;
const PAD_BOTTOM = 32;
const PAD_LEFT = 64;

export function PaceChart({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="flex aspect-[5/2] w-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
        페이스 데이터가 아직 없어요.
      </div>
    );
  }

  const innerW = VB_WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = VB_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const paces = points.map((p) => p.paceSecPerKm);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  // y axis: padding 으로 약간 여유.
  const yMin = Math.max(0, minPace - 15);
  const yMax = maxPace + 15;
  const ySpan = yMax - yMin || 1;

  const xCoord = (i: number) => {
    if (points.length === 1) return innerW / 2;
    return (i * innerW) / (points.length - 1);
  };
  const yCoord = (pace: number) =>
    innerH - ((pace - yMin) / ySpan) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xCoord(i)} ${yCoord(p.paceSecPerKm)}`)
    .join(" ");

  // y axis 눈금: min/mid/max
  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  // x axis 라벨: 첫/마지막 날짜
  const firstDate = points[0].date;
  const lastDate = points[points.length - 1].date;

  return (
    <svg
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      role="img"
      aria-label="최근 페이스 추이"
      className="w-full text-foreground"
    >
      <g transform={`translate(${PAD_LEFT} ${PAD_TOP})`}>
        {/* grid */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={0}
            y1={yCoord(tick)}
            x2={innerW}
            y2={yCoord(tick)}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeDasharray="3 3"
          />
        ))}
        {/* axes */}
        <line
          x1={0}
          y1={innerH}
          x2={innerW}
          y2={innerH}
          stroke="currentColor"
          strokeOpacity={0.3}
        />
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={innerH}
          stroke="currentColor"
          strokeOpacity={0.3}
        />

        {/* y labels */}
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={-8}
            y={yCoord(tick) + 4}
            textAnchor="end"
            fontSize={11}
            fill="currentColor"
            opacity={0.6}
          >
            {formatPace(tick)}
          </text>
        ))}

        {/* line */}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeOpacity={0.85}
        />

        {/* points */}
        {points.map((p, i) => (
          <circle
            key={p.sessionId}
            cx={xCoord(i)}
            cy={yCoord(p.paceSecPerKm)}
            r={3.5}
            fill="currentColor"
          />
        ))}
      </g>

      {/* x axis label */}
      <text
        x={PAD_LEFT}
        y={VB_HEIGHT - 10}
        textAnchor="start"
        fontSize={11}
        fill="currentColor"
        opacity={0.6}
      >
        {formatShortDate(firstDate)}
      </text>
      <text
        x={VB_WIDTH - PAD_RIGHT}
        y={VB_HEIGHT - 10}
        textAnchor="end"
        fontSize={11}
        fill="currentColor"
        opacity={0.6}
      >
        {formatShortDate(lastDate)}
      </text>
    </svg>
  );
}

function formatShortDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
