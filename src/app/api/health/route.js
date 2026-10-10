export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness only: external providers must not hold up Render's health probes.
export function GET() {
  return Response.json(
    { status: "ok", service: "finpilot" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
