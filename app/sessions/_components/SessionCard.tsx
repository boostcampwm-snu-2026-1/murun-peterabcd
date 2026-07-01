import Image from "next/image";
import Link from "next/link";

import { encodeUploadPath } from "@/lib/upload-url";

type Props = {
  id: number;
  date: Date;
  startTime: string | null;
  location: string;
  weather: string | null;
  groupPhotoPath: string | null;
  hostName: string;
  participantCount: number;
};

export function SessionCard(props: Props) {
  const photoSrc = props.groupPhotoPath
    ? `/api/uploads/${encodeUploadPath(props.groupPhotoPath)}`
    : null;

  return (
    <Link
      href={`/sessions/${props.id}`}
      className="group block overflow-hidden rounded-[18px] border border-apple-hairline bg-apple-canvas p-3 text-apple-ink transition-transform active:scale-[0.99]"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-apple-parchment">
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={`${formatDate(props.date)} ${props.location} 단체사진`}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 480px"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
            사진 없음
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 px-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <span className="font-text text-[17px] font-semibold leading-[1.24] tracking-[-0.374px]">
            {formatDate(props.date)}
          </span>
          <span className="rounded-full bg-apple-parchment px-3 py-1 font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
            참여 {props.participantCount}명
          </span>
        </div>
        <p className="font-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px]">
          {props.location}
        </p>
        <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
          {props.startTime && <span>시작 {props.startTime} · </span>}
          {props.weather && <span>{props.weather} · </span>}
          호스트 {props.hostName}
        </p>
      </div>
    </Link>
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(d);
}
