import { TAX_CATEGORIES } from "@/lib/taxation/categories";
/** Completion is explicit user review, never inferred from onboarding or tax amounts. */
export function getCategoryProgress(ctx) {
  return Object.fromEntries(
    TAX_CATEGORIES.map((category) => {
      const checks = ctx.workspace?.sections?.[category.slug]?.checklist || {};
      const items = category.checklist.map((item) => ({
        ...item,
        done: checks[item.id] === true,
      }));
      const completed = items.filter((item) => item.done).length;
      return [
        category.slug,
        {
          completed,
          total: items.length,
          percent: Math.round((completed / items.length) * 100),
          items,
        },
      ];
    }),
  );
}
