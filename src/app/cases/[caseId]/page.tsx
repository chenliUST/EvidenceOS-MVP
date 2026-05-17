import { CaseWorkspace } from "@/components/CaseWorkspace";
import { createFileStore } from "@/lib/storage/fileStore";

export default async function CasePage({ params }: { params: { caseId: string } }) {
  const ledger = await createFileStore().getCase(params.caseId);
  return <CaseWorkspace caseId={params.caseId} initialLedger={ledger} />;
}
