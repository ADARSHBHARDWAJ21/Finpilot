import { createClient } from "@/lib/supabase/server-client";
import { loadFinanceReport } from "@/lib/finance/load";
import { yearSchema, csvExport } from "@/lib/finance/model";
import { transactionCsv, summaryRows } from "@/lib/finance/reports";
import { reportPdf } from "@/lib/finance/export";
import { zipSync, strToU8 } from "fflate";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return Response.json(
      { error: "Please sign in to download reports." },
      { status: 401 },
    );
  const url = new URL(request.url),
    year = url.searchParams.get("year"),
    format = url.searchParams.get("format");
  if (
    !yearSchema.safeParse(year).success ||
    !["csv", "pdf", "zip"].includes(format)
  )
    return Response.json(
      { error: "Choose a valid financial year and format." },
      { status: 400 },
    );
  try {
    const report = await loadFinanceReport(supabase, user.id, year);
    let body, contentType;
    if (format === "csv") {
      body = transactionCsv(report);
      contentType = "text/csv;charset=utf-8";
    }
    if (format === "pdf") {
      body = await reportPdf(report);
      contentType = "application/pdf";
    }
    if (format === "zip") {
      if (
        report.documents.reduce((sum, d) => sum + Number(d.size_bytes), 0) >
        50 * 1024 * 1024
      )
        throw new Error(
          "This package exceeds 50 MB. Download the report and documents individually.",
        );
      const files = {
        "financial-report.pdf": await reportPdf(report),
        "transactions.csv": strToU8(transactionCsv(report)),
        "summary.csv": strToU8(
          csvExport([["Field", "Value"], ...summaryRows(report)]),
        ),
        "year-details.json": strToU8(
          JSON.stringify(
            {
              year,
              filing: report.filing,
              rent: report.rent,
              banking: report.banking,
              checklist: report.checklist,
            },
            null,
            2,
          ),
        ),
      };
      for (const doc of report.documents) {
        if (
          doc.user_id !== user.id ||
          doc.financial_year !== year ||
          doc.storage_path.split("/")[0] !== user.id
        )
          throw new Error("Document ownership could not be verified.");
        const { data, error } = await supabase.storage
          .from("tax-proofs")
          .download(doc.storage_path);
        if (error)
          throw new Error(
            "A document could not be downloaded. Please retry; an incomplete package has not been created.",
          );
        const name = doc.name
          .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
          .replace(/^\.+/, "_");
        files[`documents/${doc.section}/${doc.id}-${name}`] = new Uint8Array(
          await data.arrayBuffer(),
        );
      }
      body = zipSync(files, { level: 1 });
      contentType = "application/zip";
    }
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="Finpilot-${year}.${format}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Report could not be prepared. Please retry." },
      { status: 503 },
    );
  }
}
