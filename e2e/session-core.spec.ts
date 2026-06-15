import { expect, test } from "@playwright/test";

test.use({
  extraHTTPHeaders: {
    "x-murun-e2e-email": "e2e.runner@snu.ac.kr",
    "x-murun-e2e-name": "E2E Runner",
    "x-murun-e2e-role": "ADMIN",
  },
});

test("승인된 사용자가 세션 생성, 기록 입력, 세션 수정까지 수행한다", async ({ page }) => {
  const suffix = Date.now().toString(36);
  const originalLocation = `E2E 서울숲 ${suffix}`;
  const editedLocation = `E2E 보라매 ${suffix}`;

  await page.goto("/sessions/new");
  await page.getByLabel("날짜").fill("2026-06-15");
  await page.getByLabel("시작 시간").fill("19:30");
  await page.getByLabel("장소").fill(originalLocation);
  await page.getByLabel("날씨").fill("맑음");
  await page.getByLabel("코스 메모").fill("E2E 생성 smoke");
  await page.getByRole("button", { name: "세션 만들기" }).click();

  await expect(page).toHaveURL(/\/sessions\/\d+$/);
  await expect(page.getByRole("heading", { name: new RegExp(originalLocation) })).toBeVisible();

  await page.getByLabel("거리 (km)").fill("5.5");
  await page.getByLabel("기록 (분)").fill("32");
  await page.getByLabel("기록 (초)").fill("15");
  await page.getByLabel("메모 (선택)").fill("E2E 기록");
  await page.getByRole("button", { name: "추가" }).click();

  await expect(page.getByText("5.5 km", { exact: true })).toBeVisible();
  await expect(page.getByText("32:15")).toBeVisible();
  await expect(page.getByText("5'52\"/km")).toBeVisible();

  await page.getByRole("link", { name: "세션 수정" }).click();
  await expect(page.getByRole("heading", { name: "세션 수정" })).toBeVisible();
  await page.getByLabel("장소").fill(editedLocation);
  await page.getByRole("button", { name: "세션 수정" }).click();

  await expect(page).toHaveURL(/\/sessions\/\d+$/);
  await expect(page.getByRole("heading", { name: new RegExp(editedLocation) })).toBeVisible();

  await page.getByRole("link", { name: "세션 수정" }).click();
  await page.getByLabel("이 세션을 삭제한다는 것을 확인했습니다.").check();
  await page.getByRole("button", { name: "세션 삭제" }).click();

  await expect(page).toHaveURL(/\/sessions$/);
  await expect(page.getByText(editedLocation)).not.toBeVisible();
});
