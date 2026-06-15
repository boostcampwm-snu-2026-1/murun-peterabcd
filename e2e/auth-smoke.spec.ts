import { expect, test } from "@playwright/test";

test("비로그인 사용자는 홈에서 로그인 화면으로 이동한다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "뮤런" })).toBeVisible();
  await expect(page.getByRole("button", { name: "SNU 구글로 계속하기" })).toBeVisible();
});

test("OAuth 설정 오류는 Auth.js 기본 에러 페이지 대신 로그인 화면에서 안내한다", async ({
  page,
}) => {
  await page.goto("/login?error=Configuration");

  await expect(
    page.getByText("서버의 Google 로그인 설정 또는 외부 연결 상태를 확인해야 합니다."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "SNU 구글로 계속하기" })).toBeVisible();
});
