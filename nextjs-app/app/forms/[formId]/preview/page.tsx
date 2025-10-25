"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type FormMeta = {
  id?: string;
  name?: string;
  fields?: any[];
  pageUrl?: string | null;
  pageName?: string | null;
  createdAt?: string | null;
};

export default function FormPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = (params as any)?.formId || "";
  const siteId = searchParams?.get("siteId") || "";

  const [form, setForm] = useState<FormMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        if (!siteId) {
          setError("Missing siteId");
          setForm(null);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/forms/${encodeURIComponent(siteId)}`);
        if (!res.ok) {
          setError(`Failed to load forms (${res.status})`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const found: FormMeta | undefined = (data.forms || []).find((f: any) => f.id === formId || f.formId === formId);
        if (!found) {
          setError("Form not found for this siteId");
          setForm(null);
          setLoading(false);
          return;
        }
        if (mounted) setForm(found);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [formId, siteId]);

  if (loading) return <div className="p-6">Loading preview…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!form) return <div className="p-6">Form not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold">Preview: {form.name || form.id}</h1>
              <div className="text-xs text-gray-600">{form.fields?.length || 0} fields • {form.createdAt ? new Date(form.createdAt).toLocaleString() : ''}</div>
            </div>
            <div>
              {form.pageUrl ? (
                <a href={form.pageUrl} target="_blank" rel="noreferrer" className="btn bg-indigo-600 text-white">Open external page</a>
              ) : (
                <span className="text-sm text-gray-600">No external page URL available</span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Form JSON</div>
            <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto max-h-96">{JSON.stringify(form, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
