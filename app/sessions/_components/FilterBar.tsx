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
      className="mb-10 rounded-[18px] border border-apple-hairline bg-apple-canvas p-6"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-q">장소</Label>
          <Input
            id="f-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="예: 서울숲"
            maxLength={120}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="f-month">월</Label>
          <Input
            id="f-month"
            name="month"
            type="month"
            defaultValue={month}
          />
        </div>

        <fieldset className="flex flex-col gap-3 sm:col-span-2">
          <legend className="font-text text-sm font-semibold leading-[1.29] tracking-[-0.224px] text-apple-ink">
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
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-apple-hairline bg-apple-canvas px-4 py-2 font-text text-sm font-normal leading-[1.43] tracking-[-0.224px] text-apple-ink transition-transform active:scale-95 peer-checked:border-apple-focus peer-checked:text-apple-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-apple-focus"
                    >
                      {m.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
              승인된 멤버가 없어요.
            </p>
          )}
          <p className="font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
            여러 명을 선택하면 모두 참여한 세션만 보여줘요.
          </p>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label className="text-sm">참여 인원</Label>
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
            <span className="text-apple-muted-48">~</span>
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

      <div className="mt-6 flex items-center justify-end gap-3">
        {hasActiveFilters && (
          <Link
            href="/sessions"
            className="font-text text-sm leading-[1.29] tracking-[-0.224px] text-apple-primary underline-offset-4 hover:underline"
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
