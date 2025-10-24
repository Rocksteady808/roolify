import { NextResponse } from "next/server";
import { getFormsForSite } from "../../../../lib/formsStore";

export async function GET(req: Request, { params }: { params: { siteId: string } }) {
  const { siteId } = params;
  if (!siteId) return NextResponse.json({ error: "siteId required" }, { status: 400 });
  const forms = getFormsForSite(siteId);
  return NextResponse.json({ siteId, forms });
}
