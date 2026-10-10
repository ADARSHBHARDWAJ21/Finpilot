import SampleWorkspace from "@/components/marketing/SampleWorkspace";

export const metadata = {
  title: "Explore a sample workspace — Finpilot",
  description: "Explore money management and salary tax planning equally: sample transactions, deductions, HRA, regime comparisons and Copilot examples. No signup needed.",
};

export default async function DemoPage({ searchParams }) {
  const { view, question } = await searchParams;
  const initialView = ["overview", "money", "transactions", "taxation", "copilot"].includes(view) ? view : "overview";
  const initialQuestion = ["spending", "emi", "budget", "regime", "hra", "deductions"].includes(question) ? question : "spending";
  return <SampleWorkspace key={`${initialView}-${initialQuestion}`} initialView={initialView} initialQuestion={initialQuestion} />;
}
