import SampleWorkspace from "@/components/marketing/SampleWorkspace";

export const metadata = {
  title: "Explore a sample workspace — Finpilot",
  description: "Try Finpilot with illustrative transactions, monthly spending and Copilot examples. No signup needed.",
};

export default async function DemoPage({ searchParams }) {
  const { view, question } = await searchParams;
  const initialView = ["overview", "transactions", "copilot"].includes(view) ? view : "overview";
  const initialQuestion = ["spending", "emi", "budget"].includes(question) ? question : "spending";
  return <SampleWorkspace key={`${initialView}-${initialQuestion}`} initialView={initialView} initialQuestion={initialQuestion} />;
}
