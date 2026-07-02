import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function GlobalNav({
  approved = false,
  isAdmin = false,
}: {
  approved?: boolean;
  isAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 bg-apple-black text-white">
      <nav className="mx-auto flex h-11 max-w-[980px] items-center justify-between px-4 font-text text-[12px] leading-none tracking-[-0.12px]">
        <Link href="/" className="font-semibold tracking-[-0.18px]">
          뮤런
        </Link>
        {approved ? (
          <div className="hidden items-center gap-5 sm:flex">
            <Link href="/sessions" className="text-white/80 transition-colors hover:text-white">
              아카이브
            </Link>
            <Link href="/sessions/new" className="text-white/80 transition-colors hover:text-white">
              새 세션
            </Link>
            <Link href="/me" className="text-white/80 transition-colors hover:text-white">
              내 기록
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/members"
                className="text-white/80 transition-colors hover:text-white"
              >
                회원 관리
              </Link>
            ) : null}
          </div>
        ) : null}
        <Link
          href={approved ? "/sessions/new" : "/login"}
          className="text-white/80 transition-colors hover:text-white"
        >
          {approved ? "새 세션" : "로그인"}
        </Link>
      </nav>
    </header>
  );
}

export function PageShell({
  children,
  className,
  width = "content",
  surface = "canvas",
}: {
  children: ReactNode;
  className?: string;
  width?: "narrow" | "content" | "wide";
  surface?: "canvas" | "parchment" | "dark";
}) {
  const widthClass = {
    narrow: "max-w-md",
    content: "max-w-[980px]",
    wide: "max-w-[1440px]",
  }[width];
  const surfaceClass = {
    canvas: "bg-apple-canvas text-apple-ink",
    parchment: "bg-apple-parchment text-apple-ink",
    dark: "bg-apple-tile-1 text-white",
  }[surface];

  return (
    <main className={cn("min-h-[calc(100vh-44px)]", surfaceClass, className)}>
      <div className={cn("mx-auto px-5 py-16 sm:px-6 lg:py-20", widthClass)}>
        {children}
      </div>
    </main>
  );
}

export function SubNav({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className="sticky top-11 z-40 border-b border-apple-hairline/80 bg-apple-parchment/80 backdrop-blur-xl backdrop-saturate-150">
      <div
        className={cn(
          "mx-auto flex h-[52px] max-w-[980px] items-center justify-between gap-4 px-5 sm:px-6",
          className,
        )}
      >
        <span className="font-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-apple-ink">
          {title}
        </span>
        {children ? (
          <div className="flex items-center gap-3 font-text text-sm tracking-[-0.224px]">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-text text-sm leading-[1.29] tracking-[-0.224px] text-apple-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-10 flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow ? (
          <p className="font-text text-sm font-semibold uppercase leading-[1.29] tracking-[0.4px] text-apple-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[34px] font-semibold leading-[1.18] tracking-[-0.374px] text-apple-ink sm:text-[44px] sm:leading-[1.1]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl font-display text-[21px] font-normal leading-[1.35] tracking-[0.231px] text-apple-muted-80 sm:text-[24px] sm:font-light sm:leading-[1.5] sm:tracking-normal">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function HeroBand({
  eyebrow,
  title,
  description,
  actions,
  children,
  tone = "dark",
  align = "left",
  size = "tall",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  tone?: "dark" | "light";
  align?: "left" | "center";
  size?: "tall" | "compact";
}) {
  const isDark = tone === "dark";
  const isCenter = align === "center";
  const isTall = size === "tall";

  return (
    <section
      className={cn(
        "relative overflow-hidden px-5 sm:px-6",
        isTall ? "py-20 lg:py-28" : "py-14 lg:py-16",
        isDark
          ? "bg-apple-tile-1 text-white"
          : "bg-apple-canvas text-apple-ink",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-[980px] flex-col",
          isTall ? "gap-10" : "gap-7",
          isCenter && "items-center text-center",
        )}
      >
        <div
          className={cn(
            "flex max-w-3xl flex-col gap-4",
            isCenter && "items-center",
          )}
        >
          {eyebrow ? (
            <p
              className={cn(
                "font-text text-sm font-semibold uppercase leading-[1.29] tracking-[0.8px]",
                isDark ? "text-apple-primary-on-dark" : "text-apple-primary",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={cn(
              "font-display font-semibold",
              isTall
                ? "text-[44px] leading-[1.05] tracking-[-0.28px] sm:text-[64px] lg:text-[76px] lg:tracking-[-0.4px]"
                : "text-[36px] leading-[1.07] tracking-[-0.28px] sm:text-[48px]",
              isDark ? "text-white" : "text-apple-ink",
            )}
          >
            {title}
          </h1>
          {description ? (
            <p
              className={cn(
                "max-w-2xl font-display text-[21px] font-light leading-[1.4] tracking-normal sm:text-[26px] sm:leading-[1.25]",
                isDark ? "text-apple-body-muted" : "text-apple-muted-80",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-3",
              isCenter && "justify-center",
            )}
          >
            {actions}
          </div>
        ) : null}
        {children ? <div className={cn("w-full", isCenter && "max-w-3xl")}>{children}</div> : null}
      </div>
    </section>
  );
}

export function StatStrip({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-px overflow-hidden rounded-[18px] border border-white/10 bg-white/10 sm:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-white/[0.04] px-6 py-5">
          <dt className="font-text text-xs font-semibold uppercase leading-none tracking-[0.8px] text-apple-body-muted">
            {item.label}
          </dt>
          <dd className="mt-2 font-display text-[28px] font-semibold leading-[1.14] tracking-[-0.28px] text-white">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function UtilityCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-apple-hairline bg-apple-canvas p-6 text-apple-ink",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 font-text text-sm font-semibold uppercase leading-[1.29] tracking-[-0.224px] text-apple-muted-48">
      {children}
    </h2>
  );
}

export function SiteFooter({
  approved = false,
  isAdmin = false,
}: {
  approved?: boolean;
  isAdmin?: boolean;
}) {
  return (
    <footer className="border-t border-apple-hairline bg-apple-parchment">
      <div className="mx-auto flex max-w-[980px] flex-col gap-8 px-5 py-14 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="font-display text-[21px] font-semibold leading-[1.19] tracking-[0.231px] text-apple-ink">
              뮤런
            </span>
            <p className="max-w-xs font-text text-sm leading-[1.43] tracking-[-0.224px] text-apple-muted-48">
              애니뮤 러닝 소모임의 정기 운동 아카이브.
              달린 만큼 남습니다.
            </p>
          </div>
          {approved ? (
            <nav className="grid grid-cols-2 gap-x-16 gap-y-1 font-text text-[14px] leading-[2.2] tracking-[-0.224px] text-apple-muted-80 sm:grid-cols-1 sm:leading-[2.41]">
              <Link href="/sessions" className="hover:text-apple-ink">
                아카이브
              </Link>
              <Link href="/sessions/new" className="hover:text-apple-ink">
                새 세션
              </Link>
              <Link href="/me" className="hover:text-apple-ink">
                내 기록
              </Link>
              {isAdmin ? (
                <Link href="/admin/members" className="hover:text-apple-ink">
                  회원 관리
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
        <p className="border-t border-apple-hairline pt-5 font-text text-xs leading-none tracking-[-0.12px] text-apple-muted-48">
          Animu Running Archive · SNU 구성원 전용
        </p>
      </div>
    </footer>
  );
}
