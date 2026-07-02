import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  HeroBand,
  PageShell,
  StatStrip,
  UtilityCard,
} from "@/components/layout/AppChrome";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.approved) redirect("/pending");

  const [sessionCount, memberCount, distanceSum] = await Promise.all([
    db.session.count(),
    db.user.count({ where: { approved: true } }),
    db.participation.aggregate({ _sum: { distanceKm: true } }),
  ]);
  const totalKm = distanceSum._sum.distanceKm ?? 0;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <>
      <HeroBand
        align="center"
        eyebrow="Animu Running Archive"
        title="뮤런"
        description={<>안녕하세요, {session.user.name}. 달린 만큼 남습니다.</>}
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/sessions/new">새 세션 만들기</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white bg-transparent text-white"
            >
              <Link href="/sessions">아카이브 보기</Link>
            </Button>
          </>
        }
      >
        <StatStrip
          items={[
            { label: "Sessions", value: `${sessionCount}회` },
            { label: "Distance", value: `${formatKm(totalKm)} km` },
            { label: "Runners", value: `${memberCount}명` },
          ]}
        />
      </HeroBand>

      <PageShell width="content" surface="parchment">
        <div className="grid gap-5 md:grid-cols-3">
          <HomeCard
            eyebrow="Create"
            title="새 세션"
            body="오늘의 세션을 만들고 사진과 기록을 이어 붙입니다."
            href="/sessions/new"
            cta="세션 만들기"
          />
          <HomeCard
            eyebrow="Archive"
            title="아카이브"
            body="날짜, 장소, 멤버로 지난 러닝의 맥락을 다시 찾습니다."
            href="/sessions"
            cta="전체 보기"
          />
          <HomeCard
            eyebrow="Me"
            title="내 기록"
            body="누적 거리와 페이스 흐름을 한 화면에서 확인합니다."
            href="/me"
            cta="기록 보기"
          />
        </div>

        <div className="mt-10 flex items-center justify-center gap-5 font-text text-sm leading-[1.29] tracking-[-0.224px]">
          {session.user.role === "ADMIN" && (
            <Link
              href="/admin/members"
              className="text-apple-primary underline-offset-4 hover:underline"
            >
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

function HomeCard({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <UtilityCard className="flex flex-col gap-3 p-7">
      <span className="font-text text-xs font-semibold uppercase leading-none tracking-[0.8px] text-apple-primary">
        {eyebrow}
      </span>
      <span className="font-display text-[28px] font-semibold leading-[1.14] tracking-[-0.28px]">
        {title}
      </span>
      <p className="font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
        {body}
      </p>
      <Link
        href={href}
        className="mt-auto pt-2 font-text text-[15px] leading-[1.29] tracking-[-0.224px] text-apple-primary underline-offset-4 hover:underline"
      >
        {cta} &rsaquo;
      </Link>
    </UtilityCard>
  );
}

function formatKm(km: number): string {
  return km >= 100 ? String(Math.round(km)) : km.toFixed(1);
}
