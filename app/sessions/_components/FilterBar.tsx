import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Member = {
  id: string;
  name: string;
};

type Props = {
  q: string;
  memberId: string;
  month: string;
  pmin: string;
  pmax: string;
  members: Member[];
  hasActiveFilters: boolean;
};

/**
 * /sessions 상단 필터. GET form 으로 제출 → URL ?q=&member=&month=&pmin=&pmax= 갱신.
 * Server-rendered, 별도 client component 없음. 필터 변경 시 cursor 는 자동으로 리셋
 * (form 이 cursor 를 hidden 으로 안 들고 가니까).
 */
export function FilterBar({
  q,
  memberId,
  month,
  pmin,
  pmax,
  members,
  hasActiveFilters,
}: Props) {
  return (
    <form
      method="get"
      className="mb-6 flex flex-col gap-3 rounded-md border bg-muted/30 p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="f-q" className="text-xs">
            장소
          </Label>
          <Input
            id="f-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="예: 서울숲"
            maxLength={120}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="f-member" className="text-xs">
            참여 멤버
          </Label>
          <select
            id="f-member"
            name="member"
            defaultValue={memberId}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">전체</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="f-month" className="text-xs">
            월
          </Label>
          <Input
            id="f-month"
            name="month"
            type="month"
            defaultValue={month}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs">참여 인원</Label>
          <div className="flex items-center gap-2">
            <Input
              name="pmin"
              type="number"
              min="0"
              max="999"
              defaultValue={pmin}
              placeholder="최소"
              className="w-full"
              aria-label="참여 인원 최소"
            />
            <span className="text-muted-foreground">~</span>
            <Input
              name="pmax"
              type="number"
              min="0"
              max="999"
              defaultValue={pmax}
              placeholder="최대"
              className="w-full"
              aria-label="참여 인원 최대"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {hasActiveFilters && (
          <Link
            href="/sessions"
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            필터 초기화
          </Link>
        )}
        <Button type="submit" size="sm">
          필터 적용
        </Button>
      </div>
    </form>
  );
}
