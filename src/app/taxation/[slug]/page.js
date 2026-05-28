import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server-client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaxCategoryDetailSection from "@/components/taxation/TaxCategoryDetailSection";
import { getCategoryBySlug, getCategorySlugs } from "@/lib/taxation/categories";
import { loadTaxContext } from "@/lib/taxation/load-tax-context";
import { getCategoryProgress } from "@/lib/taxation/category-progress";

export function generateStaticParams() {
  return getCategorySlugs().map((slug) => ({ slug }));
}

export default async function TaxCategoryPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const user = await requireUser();
  const supabase = await createClient();
  const taxContext = await loadTaxContext(supabase, user.id);
  const categoryProgress = getCategoryProgress(taxContext);
  const progress = categoryProgress[slug];

  const salaryFormProps = {
    initialProfile: taxContext.salaryProfile || undefined,
    initialDeductions: taxContext.deductions,
    initialTaxCalculation: taxContext.taxCalculation || undefined,
  };

  return (
    <DashboardLayout showRightSidebar={false}>
      <TaxCategoryDetailSection
        categorySlug={slug}
        taxContext={taxContext}
        progress={progress}
        salaryFormProps={salaryFormProps}
      />
    </DashboardLayout>
  );
}
