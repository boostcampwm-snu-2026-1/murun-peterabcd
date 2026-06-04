import Image from "next/image";
import Link from "next/link";

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
    ? `/api/uploads/${encodePath(props.groupPhotoPath)}`
    : null;

  return (
    <Link
      href={`/sessions/${props.id}`}
      className="block overflow-hidden rounded-md border bg-card transition-colors hover:bg-accent/30"
    >
      <div className="relative aspect-video w-full bg-muted">
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
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            사진 없음
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{formatDate(props.date)}</span>
          <span className="text-xs text-muted-foreground">
            참여 {props.participantCount}명
          </span>
        </div>
        <p className="text-sm">{props.location}</p>
        <p className="text-xs text-muted-foreground">
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

function encodePath(relPath: string): string {
  return relPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
}
