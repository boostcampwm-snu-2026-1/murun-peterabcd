import { requireApproved } from "@/lib/guard";
import {
  BackLink,
  PageHeader,
  PageShell,
  SubNav,
  UtilityCard,
} from "@/components/layout/AppChrome";

import { NewSessionForm } from "./_components/NewSessionForm";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  await requireApproved();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <SubNav title="새 세션">
        <BackLink href="/">취소</BackLink>
      </SubNav>
      <PageShell width="narrow" surface="parchment">
        <PageHeader
          eyebrow="Create"
          title="세션 만들기"
          description="러닝 일정을 만들고 참여 기록을 쌓을 준비를 해요."
        />
        <UtilityCard>
          <NewSessionForm today={today} />
        </UtilityCard>
      </PageShell>
    </>
  );
}
