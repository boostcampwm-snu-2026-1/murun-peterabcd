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
            <Link href="/sessions" className="text-white/80 hover:text-white">
              아카이브
            </Link>
            <Link href="/sessions/new" className="text-white/80 hover:text-white">
              새 세션
            </Link>
            <Link href="/me" className="text-white/80 hover:text-white">
              내 기록
            </Link>
            {isAdmin ? (
              <Link
                href="/admin/members"
                className="text-white/80 hover:text-white"
              >
                회원 관리
              </Link>
            ) : null}
          </div>
        ) : null}
        <Link
          href={approved ? "/sessions/new" : "/login"}
          className="text-white/80 hover:text-white"
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
        "mb-10 flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-3", align === "center" && "items-center")}>
        {eyebrow ? (
          <p className="font-text text-sm font-semibold leading-[1.29] tracking-[-0.224px] text-apple-muted-48">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-apple-ink sm:text-[56px] sm:leading-[1.07]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl font-display text-[24px] font-light leading-[1.5] tracking-normal text-apple-muted-80 sm:text-[28px] sm:leading-[1.14] sm:tracking-[0.196px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
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
