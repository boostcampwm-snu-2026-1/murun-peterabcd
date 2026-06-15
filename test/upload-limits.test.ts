import { describe, expect, test } from "vitest";

import { checkUploadFile, MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

describe("checkUploadFile", () => {
  test("허용 MIME과 크기 이하의 사진은 통과한다", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "run.jpg", {
      type: "image/jpeg",
    });

    expect(checkUploadFile(file)).toBeNull();
  });

  test("파일이 없거나 비어 있으면 한국어 에러를 반환한다", () => {
    expect(checkUploadFile(null)).toBe("사진 파일을 선택하세요.");
    expect(checkUploadFile(new File([], "empty.jpg", { type: "image/jpeg" }))).toBe(
      "빈 파일입니다.",
    );
  });

  test("15MB 초과 파일은 서버 액션 본문 한도 전에 사용자 메시지로 거부한다", () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    expect(checkUploadFile(file)).toContain("파일이 너무 큽니다");
  });

  test("허용하지 않는 MIME은 거부한다", () => {
    const file = new File([new Uint8Array([1])], "run.gif", {
      type: "image/gif",
    });

    expect(checkUploadFile(file)).toBe(
      "지원하지 않는 파일 형식입니다. (jpg / png / webp / heic)",
    );
  });
});
