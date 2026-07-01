import Link from "next/link";

import { Button } from "@/components/ui/button";
import { UtilityCard } from "@/components/layout/AppChrome";

export function EmptyState() {
  return (
    <UtilityCard className="flex flex-col items-center gap-5 border-dashed text-center">
      <p className="font-display text-[24px] font-light leading-[1.5] tracking-normal text-apple-muted-80">
        아직 활동 기록이 없어요.
        <br />첫 세션을 만들어 시즌을 시작하세요.
      </p>
      <Button asChild>
        <Link href="/sessions/new">새 세션 만들기</Link>
      </Button>
    </UtilityCard>
  );
}
