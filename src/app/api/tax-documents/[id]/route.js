import { createClient } from "@/lib/supabase/server-client";
import { proofHeaders } from "@/lib/finance/proofs";
import { z } from "zod";
export const runtime = "nodejs";
async function owned(params) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return { status: 404 };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 401 };
  const { data, error } = await supabase
    .from("tax_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return { status: 503 };
  if (!data || data.storage_path.split("/")[0] !== user.id)
    return { status: 404 };
  return { supabase, document: data };
}
export async function GET(request, { params }) {
  const { status, supabase, document } = await owned(params);
  if (status)
    return Response.json(
      { error: "Document unavailable. Please sign in and try again." },
      { status },
    );
  const { data, error } = await supabase.storage
    .from("tax-proofs")
    .download(document.storage_path);
  if (error)
    return Response.json(
      { error: "The document could not be downloaded." },
      { status: 503 },
    );
  return new Response(data, { headers: proofHeaders(document) });
}
export async function DELETE(request, { params }) {
  const { status, supabase, document } = await owned(params);
  if (status)
    return Response.json({ error: "Document unavailable." }, { status });
  const { error } = await supabase.storage
    .from("tax-proofs")
    .remove([document.storage_path]);
  if (error)
    return Response.json(
      { error: "Could not remove the document. Please try again." },
      { status: 503 },
    );
  const result = await supabase
    .from("tax_documents")
    .delete()
    .eq("id", document.id)
    .eq("user_id", document.user_id);
  if (result.error)
    return Response.json(
      {
        error:
          "File removed, but the list could not be updated. Retry to finish.",
      },
      { status: 503 },
    );
  return Response.json({ ok: true });
}
