import { NextResponse } from 'next/server';
import { saveFormsForSite } from "../../../../lib/formsStore";

function extractAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z-:]+)=("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(tag))) {
    attrs[m[1]] = m[3] ?? m[4] ?? "";
  }
  return attrs;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { siteId, url } = body as { siteId?: string; url?: string };
    if (!siteId || !url) return NextResponse.json({ error: "siteId and url required" }, { status: 400 });

    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: `Failed to fetch url: ${res.status}` }, { status: 502 });
    const text = await res.text();

    const forms: { id?: string; name?: string; fields: { id?: string; name?: string; type?: string }[] }[] = [];

    // extract <form> blocks
    const formRe = /<form\b[^>]*>[\s\S]*?<\/form>/gi;
    let fmatch: RegExpExecArray | null;
    while ((fmatch = formRe.exec(text))) {
      const full = fmatch[0];
      const openTagMatch = full.match(/^<form\b[^>]*>/i);
      const openTag = openTagMatch ? openTagMatch[0] : "<form>";
      const attrs = extractAttributes(openTag);
      const fid = attrs.id || attrs.name || `form-${forms.length + 1}`;

      const fields: { id?: string; name?: string; type?: string }[] = [];
      const inputRe = /<(input|select|textarea)\b[^>]*>/gi;
      let im: RegExpExecArray | null;
      while ((im = inputRe.exec(full))) {
        const tag = im[0];
        const a = extractAttributes(tag);
        fields.push({ id: a.id || a.name || undefined, name: a.name || a.id || undefined, type: a.type || (im[1] === 'select' ? 'select' : im[1]) });
      }

      forms.push({ id: fid, name: attrs.name || fid, fields });
    }

    // extract div/section/article/main with ids (not inside forms)
    const elemRe = /<(div|section|article|main)\b[^>]*\bid=("[^"]+"|'[^']+'|[^\s>]+)[^>]*>/gi;
    let em: RegExpExecArray | null;
    const seen = new Set(forms.map((f) => f.id));
    while ((em = elemRe.exec(text))) {
      const tag = em[0];
      const attrs = extractAttributes(tag);
      const id = attrs.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        forms.push({ id, name: `${em[1]}:${id}`, fields: [] });
      }
    }

    saveFormsForSite(siteId, forms);

    return NextResponse.json({ ok: true, forms });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || String(err) }, { status: 500 });
  }
}
