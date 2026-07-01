import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ErrorAlert } from "@/components/form/ErrorAlert";
import { FilterBar } from "@/app/sessions/_components/FilterBar";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ErrorAlert", () => {
  test("메시지가 없으면 alert를 렌더링하지 않는다", () => {
    render(<ErrorAlert message={null} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("폼 검증 실패 메시지를 접근 가능한 alert로 보여준다", () => {
    render(<ErrorAlert message="초는 59 이하여야 합니다." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "초는 59 이하여야 합니다.",
    );
  });
});

describe("FilterBar", () => {
  test("장소·멤버·월·참여 인원 필터의 현재 값을 화면에 반영한다", () => {
    render(
      <FilterBar
        q="서울숲"
        memberIds={["u1", "u2"]}
        month="2026-06"
        pmin="2"
        pmax="8"
        members={[
          { id: "u1", name: "민지" },
          { id: "u2", name: "현민" },
        ]}
        hasActiveFilters
      />,
    );

    expect(screen.getByLabelText("장소")).toHaveValue("서울숲");
    expect(screen.getByRole("checkbox", { name: "민지" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "현민" })).toBeChecked();
    expect(screen.getByLabelText("월")).toHaveValue("2026-06");
    expect(screen.getByLabelText("참여 인원 최소")).toHaveValue(2);
    expect(screen.getByLabelText("참여 인원 최대")).toHaveValue(8);
    expect(screen.getByRole("link", { name: "필터 초기화" })).toHaveAttribute(
      "href",
      "/sessions",
    );
  });

  test("활성 필터가 없으면 초기화 링크를 숨긴다", () => {
    render(
      <FilterBar
        q=""
        memberIds={[]}
        month=""
        pmin=""
        pmax=""
        members={[]}
        hasActiveFilters={false}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "필터 초기화" }),
    ).not.toBeInTheDocument();
  });
});
