"use client";

import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type Props = ButtonProps & {
  /** 평상시 라벨. children 으로 노드 대신 텍스트 라벨을 받는다. */
  idleLabel: React.ReactNode;
  /** submit 중일 때 라벨. 미지정 시 "처리 중..." */
  pendingLabel?: React.ReactNode;
};

/**
 * form action 안에서 submit pending 중 자동 disable + 라벨 교체.
 * React 19 의 useFormStatus 는 자신을 감싸고 있는 가장 가까운 <form> 의 상태를 봄.
 */
export function SubmitButton({
  idleLabel,
  pendingLabel = "처리 중...",
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...rest}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
