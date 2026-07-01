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
  memberIds: string[];
  month: string;
  pmin: string;
  pmax: string;
  members: Member[];
  hasActiveFilters: boolean;
};

/**
 * /sessions 상단 필터. GET form 으로 제출 → URL ?q=&member=&member=&month=&pmin=&pmax= 갱신.
 * Server-rendered, 별도 client component 없음. 필터 변경 시 cursor 는 자동으로 리셋
 * (form 이 cursor 를 hidden 으로 안 들고 가니까).
 */
export function FilterBar({
  q,
  memberIds,
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

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="text-xs font-medium text-[#1d1d1f]">
            참여 멤버
          </legend>
          {members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const inputId = `f-member-${m.id}`;
                return (
                  <div key={m.id} className="relative">
                    <input
                      id={inputId}
                      name="member"
                      type="checkbox"
                      value={m.id}
                      defaultChecked={memberIds.includes(m.id)}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={inputId}
                      className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-[#e0e0e0] bg-white px-4 py-2 text-sm text-[#1d1d1f] transition-colors peer-checked:border-[#0066cc] peer-checked:text-[#0066cc] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0071e3]"
                    >
                      {m.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#7a7a7a]">승인된 멤버가 없어요.</p>
          )}
          <p className="text-xs text-[#7a7a7a]">
            여러 명을 선택하면 모두 참여한 세션만 보여줘요.
          </p>
        </fieldset>

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
