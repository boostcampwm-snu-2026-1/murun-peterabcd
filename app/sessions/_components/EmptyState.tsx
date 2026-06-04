import Link from "next/link";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-md border border-dashed p-10 text-center">
      <p className="text-sm text-muted-foreground">
        아직 활동 기록이 없어요.
        <br />첫 세션을 만들어 시즌을 시작하세요.
      </p>
      <Link href="/sessions/new">
        <Button>새 세션 만들기</Button>
      </Link>
    </section>
  );
}
