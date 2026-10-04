import { requireUser } from "@/lib/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AITaxCopilotSection from "@/components/taxation/AITaxCopilotSection";
import { createClient } from "@/lib/supabase/server-client";
import { loadCopilotContext } from "@/lib/copilot/context";
import { listCopilotChats } from "@/lib/copilot/chat-store";

export default async function AITaxCopilotPage({ searchParams }) {
  const params = await searchParams;
  const initialQuestion = typeof params?.question === "string" ? params.question.slice(0, 3000) : "";
  const user = await requireUser();
  const supabase = await createClient();
  const [snapshotResult, historyResult] = await Promise.allSettled([
    loadCopilotContext(supabase, user.id),
    listCopilotChats(supabase, user.id),
  ]);
  const snapshot = snapshotResult.status === "fulfilled" ? snapshotResult.value : null;
  const history = historyResult.status === "fulfilled" ? historyResult.value : { chats: [], available: false };

  return (
    <DashboardLayout showRightSidebar={false}>
      <AITaxCopilotSection
        initialSnapshot={snapshot?.view || null}
        initialChats={history.chats}
        historyAvailable={history.available}
        initialError={snapshot?.view ? "" : "Your financial profile could not be loaded. Select Refresh data to try again."}
        aiConfigured={Boolean(process.env.GEMINI_API_KEY?.trim())}
        initialQuestion={initialQuestion}
      />
    </DashboardLayout>
  );
}
