import { createClient } from "@/lib/supabase/server-client";
import { MAX_PROOF_BYTES, validateProof } from "@/lib/finance/proofs";
export const runtime = "nodejs";
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  if (Number(request.headers.get("content-length")) > MAX_PROOF_BYTES + 65536)
    return Response.json({ error: "The file exceeds 10 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (
      !file ||
      typeof file.arrayBuffer !== "function" ||
      file.size > MAX_PROOF_BYTES
    )
      throw new Error("Choose a file up to 10 MB.");
    const year = form.get("year"),
      section = form.get("section"),
      proofKey = form.get("proofKey");
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid = validateProof({
      name: file.name,
      bytes,
      year,
      section,
      proofKey,
    });
    const id = crypto.randomUUID();
    const path = `${user.id}/${year}/${section}/${id}.${valid.ext}`;
    const { error: uploadError } = await supabase.storage
      .from("tax-proofs")
      .upload(path, bytes, { contentType: valid.mime, upsert: false });
    if (uploadError)
      throw new Error("The document could not be uploaded. Please try again.");
    const { data, error } = await supabase
      .from("tax_documents")
      .insert({
        id,
        user_id: user.id,
        financial_year: year,
        section,
        proof_key: proofKey,
        name: valid.name,
        storage_path: path,
        mime_type: valid.mime,
        size_bytes: file.size,
      })
      .select()
      .single();
    if (error) {
      await supabase.storage.from("tax-proofs").remove([path]);
      throw new Error("The document could not be saved. Please try again.");
    }
    return Response.json({ document: data });
  } catch (error) {
    return Response.json(
      {
        error:
          error.name === "ZodError"
            ? "Choose a valid year and document category."
            : error.message,
      },
      { status: 400 },
    );
  }
}
