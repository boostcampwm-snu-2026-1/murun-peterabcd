import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="container mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">뮤런</h1>
      <p className="text-center text-sm text-muted-foreground">
        애니뮤 러닝 소모임의 정기 운동 아카이브.
        <br />
        Week 2 부트스트랩 — 도메인 페이지는 후속 PR에서.
      </p>
      <Button>준비 중</Button>
    </main>
  );
}
