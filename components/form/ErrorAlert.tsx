import { cn } from "@/lib/utils";

type Props = {
  /** 메시지. null/undefined 이면 렌더링 X. */
  message: string | null | undefined;
  className?: string;
};

/**
 * 폼 검증 실패를 알리는 inline 배너. Toast 가 아니라 폼 상단에 들어가는 형태.
 * role="alert" 로 screen reader 가 즉시 읽음.
 */
export function ErrorAlert({ message, className }: Props) {
  if (!message) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive",
        className,
      )}
    >
      {message}
    </div>
  );
}
