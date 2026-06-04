import Link from "next/link";

import { requireApproved } from "@/lib/guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createSession } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  await requireApproved();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="container mx-auto max-w-md p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">세션 만들기</h1>
        <Link
          href="/"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          취소
        </Link>
      </header>

      <form action={createSession} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date">날짜</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">시작 시간 (선택)</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            placeholder="예: 19:30"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="location">장소</Label>
          <Input
            id="location"
            name="location"
            type="text"
            required
            maxLength={120}
            placeholder="예: 서울숲 입구"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="weather">날씨 (선택)</Label>
          <Input
            id="weather"
            name="weather"
            type="text"
            maxLength={120}
            placeholder="예: 맑음 / 22°C"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">코스 메모 (선택)</Label>
          <Textarea
            id="notes"
            name="notes"
            maxLength={2000}
            placeholder="코스, 페이스 권장, 모임 후 식당 등"
            rows={4}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          단체사진은 후속 PR에서 추가됩니다.
        </p>

        <Button type="submit" size="lg">
          세션 만들기
        </Button>
      </form>
    </main>
  );
}
