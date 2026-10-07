import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaxWorkspaceSection from "@/components/finance/TaxWorkspaceSection";
import { getCategoryBySlug, getCategorySlugs } from "@/lib/taxation/categories";
import { loadFinanceProfile } from "@/lib/finance/load";
import { loadTaxWorkspace } from "@/lib/finance/data";
import { resolveFinancialYear } from "@/lib/finance/model";
import { buildFinanceReport } from "@/lib/finance/reports";

export function generateStaticParams() {
  return getCategorySlugs().map((slug) => ({ slug }));
}

export default async function TaxCategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const user = await requireUser();
  const supabase = await createClient();
  const base = await loadFinanceProfile(supabase, user.id);
  const year = resolveFinancialYear(
    (await searchParams).year,
    base.profile.financial_year,
  );
  const workspace = await loadTaxWorkspace(supabase, user.id, year);
  const report = buildFinanceReport({ ...base, workspace });

  return (
    <DashboardLayout showRightSidebar={false}>
      <TaxWorkspaceSection
        key={`${slug}-${year}`}
        slug={slug}
        year={year}
        base={base}
        workspace={workspace}
        report={report}
      />
    </DashboardLayout>
  );
}
