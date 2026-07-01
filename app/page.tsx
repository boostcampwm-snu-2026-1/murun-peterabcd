import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  HeroBand,
  PageShell,
  UtilityCard,
} from "@/components/layout/AppChrome";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.approved) redirect("/pending");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <HeroBand
        eyebrow="Animu Running Archive"
        title="뮤런"
        description={<>안녕하세요, {session.user.name}. 오늘의 러닝 기록을 남겨요.</>}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/sessions/new">새 세션 만들기</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white bg-transparent text-white">
              <Link href="/sessions">아카이브 보기</Link>
            </Button>
          </>
        }
      >
        <div className="grid gap-px overflow-hidden rounded-[18px] border border-white/10 bg-white/10 sm:grid-cols-3">
          <HeroStat label="Surface" value="Parchment" />
          <HeroStat label="Accent" value="Action Blue" />
          <HeroStat label="Rhythm" value="Run log" />
        </div>
      </HeroBand>

      <PageShell width="content" surface="parchment">

      <div className="grid gap-4 md:grid-cols-3">
        <UtilityCard className="flex flex-col gap-4">
          <span className="font-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px]">Create</span>
          <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
            오늘의 세션을 만들고 사진과 기록을 이어 붙입니다.
          </p>
          <Button asChild className="mt-auto w-full">
            <Link href="/sessions/new">새 세션</Link>
          </Button>
        </UtilityCard>
        <UtilityCard className="flex flex-col gap-4">
          <span className="font-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px]">Archive</span>
          <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
            날짜, 장소, 멤버로 지난 러닝의 맥락을 다시 찾습니다.
          </p>
          <Button asChild variant="outline" className="mt-auto w-full">
            <Link href="/sessions">전체 아카이브</Link>
          </Button>
        </UtilityCard>
        <UtilityCard className="flex flex-col gap-4">
          <span className="font-display text-[28px] font-semibold leading-[1.14] tracking-[0.196px]">Me</span>
          <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
            누적 거리와 페이스 흐름을 한 화면에서 확인합니다.
          </p>
          <Button asChild variant="secondary" className="mt-auto w-full">
            <Link href="/me">내 기록</Link>
          </Button>
        </UtilityCard>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5 font-text text-sm leading-[1.29] tracking-[-0.224px]">
        {session.user.role === "ADMIN" && (
          <Link href="/admin/members" className="text-apple-primary underline-offset-4 hover:underline">
            회원 관리
          </Link>
        )}
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            로그아웃
          </Button>
        </form>
      </div>
      </PageShell>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] p-5">
      <span className="block font-text text-xs uppercase leading-none tracking-[-0.12px] text-apple-body-muted">
        {label}
      </span>
      <span className="mt-2 block font-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-white">
        {value}
      </span>
    </div>
  );
}
