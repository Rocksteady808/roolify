"use client";

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FormSelect from "@/components/FormSelect";

type Field = { id?: string; name?: string; type?: string };

type Condition = {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_filled";
  value?: string;
};

type Action =
  | { type: "show_field"; targetFieldId: string }
  | { type: "hide_field"; targetFieldId: string }
  | { type: "require_field"; targetFieldId: string }
  | { type: "optional_field"; targetFieldId: string }
  | { type: "route_to"; url: string }
  | { type: "send_email"; to: string; subject?: string };

type Rule = { id: string; name: string; anyOrAll: "ANY" | "ALL"; conditions: Condition[]; actions: Action[] };

type FormMeta = { id?: string; name?: string; fields: Field[] };

export default function RuleBuilderPage({ params, searchParams }: { params: { formId: string }; searchParams: { siteId?: string } }) {
  const formId = params.formId;
  const siteId = (searchParams?.siteId as string) || "";
  const [form, setForm] = useState<FormMeta | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  useEffect(() => {
    async function load() {
      if (!siteId) return setError("Missing siteId in query params");
      try {
        const res = await fetch(`/api/forms/form-specific?siteId=${encodeURIComponent(siteId)}&multiPage=true`);
        if (!res.ok) throw new Error(`Failed to load forms (${res.status})`);
        const data = await res.json();
        const fm: FormMeta | undefined = (data.forms || []).find((f: FormMeta) => f.id === formId);
        if (!fm) setError("Form not found for this siteId");
        setForm(fm || null);
      } catch (e) {
        setError((e as Error).message);
      }
    }
    load();
  }, [siteId, formId]);

  // Auto-refresh disabled to prevent flash/blank state issues
  // useEffect(() => {
  //   if (!siteId || !formId) return;

  //   const refreshInterval = setInterval(() => {
  //     console.log('[Rules] Auto-refreshing form data...');
  //     setLastRefreshTime(Date.now());
  //     // Reload the form data
  //     fetch(`/api/forms/form-specific?siteId=${encodeURIComponent(siteId)}&multiPage=true`)
  //       .then(res => res.ok ? res.json() : null)
  //       .then(data => {
  //         if (data) {
  //           const fm: FormMeta | undefined = (data.forms || []).find((f: FormMeta) => f.id === formId);
  //           if (fm) setForm(fm);
  //         }
  //       })
  //       .catch(e => console.error('Auto-refresh failed:', e));
  //   }, 30000); // 30 seconds

  //   return () => clearInterval(refreshInterval);
  // }, [siteId, formId]);

  const fields = useMemo(() => form?.fields || [], [form]);

  function addRule() {
    setRules((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Rule ${prev.length + 1}`,
        anyOrAll: "ALL",
        conditions: fields[0]
          ? [{ fieldId: fields[0].id || "", operator: "equals", value: "" }]
          : [],
        actions: [],
      },
    ]);
  }

  function updateRule(id: string, updater: (r: Rule) => Rule) {
    setRules((prev) => prev.map((r) => (r.id === id ? updater(r) : r)));
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function RuleCard({ r }: { r: Rule }) {
    return (
      <div className="border rounded-md bg-white p-4">
        <div className="flex items-center justify-between">
          <input
            className="text-base font-medium px-2 py-1 border rounded"
            value={r.name}
            onChange={(e) => updateRule(r.id, (x) => ({ ...x, name: e.target.value }))}
          />
          <button className="text-red-600 text-sm" onClick={() => removeRule(r.id)}>
            Delete
          </button>
        </div>
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Conditions</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">Match</span>
            <FormSelect
              className={`px-2 py-1 border rounded text-sm ${r.anyOrAll ? 'text-gray-800' : 'text-gray-600'}`}
              value={r.anyOrAll}
              onChange={(e) => updateRule(r.id, (x) => ({ ...x, anyOrAll: e.target.value as Rule["anyOrAll"] }))}
            >
              <option value="ALL">all</option>
              <option value="ANY">any</option>
            </FormSelect>
            <span className="text-sm">of the following</span>
          </div>
          <div className="grid gap-2">
            {r.conditions.map((c, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <FormSelect
                  className={`px-2 py-1 border rounded text-sm ${c.fieldId ? 'text-gray-800' : 'text-gray-600'}`}
                  value={c.fieldId}
                  onChange={(e) =>
                    updateRule(r.id, (x) => {
                      const cs = [...x.conditions];
                      cs[i] = { ...cs[i], fieldId: e.target.value };
                      return { ...x, conditions: cs };
                    })
                  }
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.id}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  className="px-2 py-1 border rounded text-sm"
                  value={c.operator}
                  onChange={(e) =>
                    updateRule(r.id, (x) => {
                      const cs = [...x.conditions];
                      cs[i] = { ...cs[i], operator: e.target.value as Condition["operator"] };
                      return { ...x, conditions: cs };
                    })
                  }
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                  <option value="greater_than">greater than</option>
                  <option value="less_than">less than</option>
                  <option value="is_empty">is empty</option>
                  <option value="is_filled">is filled</option>
                </FormSelect>
                {!(c.operator === "is_empty" || c.operator === "is_filled") && (
                  <input
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="value"
                    value={c.value || ""}
                    onChange={(e) =>
                      updateRule(r.id, (x) => {
                        const cs = [...x.conditions];
                        cs[i] = { ...cs[i], value: e.target.value };
                        return { ...x, conditions: cs };
                      })
                    }
                  />
                )}
                <button
                  className="text-sm text-gray-600 px-2 py-1"
                  onClick={() =>
                    updateRule(r.id, (x) => ({ ...x, conditions: x.conditions.filter((_, idx) => idx !== i) }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="text-sm text-indigo-600"
              onClick={() =>
                updateRule(r.id, (x) => ({
                  ...x,
                  conditions: [
                    ...x.conditions,
                    { fieldId: fields[0]?.id || "", operator: "equals", value: "" },
                  ],
                }))
              }
            >
              + Add condition
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Actions</div>
          <div className="grid gap-2">
            {r.actions.map((a, i) => (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <FormSelect
                  className="px-2 py-1 border rounded text-sm"
                  value={a.type}
                  onChange={(e) =>
                    updateRule(r.id, (x) => {
                      const as = [...x.actions];
                      const t = e.target.value as Action["type"];
                      let replacement: Action = a;
                      if (t === "route_to") replacement = { type: "route_to", url: "" };
                      else if (t === "send_email") replacement = { type: "send_email", to: "" };
                      else replacement = { type: t as any, targetFieldId: fields[0]?.id || "" };
                      as[i] = replacement;
                      return { ...x, actions: as };
                    })
                  }
                >
                  <option value="show_field">Show field</option>
                  <option value="hide_field">Hide field</option>
                  <option value="require_field">Require field</option>
                  <option value="optional_field">Optional field</option>
                  <option value="route_to">Route to URL</option>
                  <option value="send_email">Send email</option>
                </FormSelect>

                {"targetFieldId" in a && (
                  <FormSelect
                    className={`px-2 py-1 border rounded text-sm ${a.targetFieldId ? 'text-gray-800' : 'text-gray-600'}`}
                    value={a.targetFieldId}
                    onChange={(e) =>
                      updateRule(r.id, (x) => {
                        const as = [...x.actions];
                        (as[i] as any).targetFieldId = e.target.value;
                        return { ...x, actions: as };
                      })
                    }
                  >
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name || f.id}
                      </option>
                    ))}
                  </FormSelect>
                )}

                {a.type === "route_to" && (
                  <input
                    className="px-2 py-1 border rounded text-sm"
                    placeholder="https://example.com/thank-you"
                    value={(a as any).url || ""}
                    onChange={(e) =>
                      updateRule(r.id, (x) => {
                        const as = [...x.actions];
                        (as[i] as any).url = e.target.value;
                        return { ...x, actions: as };
                      })
                    }
                  />
                )}

                {a.type === "send_email" && (
                  <>
                    <input
                      className="px-2 py-1 border rounded text-sm"
                      placeholder="recipient@example.com"
                      value={(a as any).to || ""}
                      onChange={(e) =>
                        updateRule(r.id, (x) => {
                          const as = [...x.actions];
                          (as[i] as any).to = e.target.value;
                          return { ...x, actions: as };
                        })
                      }
                    />
                    <input
                      className="px-2 py-1 border rounded text-sm"
                      placeholder="Subject (optional)"
                      value={(a as any).subject || ""}
                      onChange={(e) =>
                        updateRule(r.id, (x) => {
                          const as = [...x.actions];
                          (as[i] as any).subject = e.target.value;
                          return { ...x, actions: as };
                        })
                      }
                    />
                  </>
                )}

                <button
                  className="text-sm text-gray-600 px-2 py-1"
                  onClick={() => updateRule(r.id, (x) => ({ ...x, actions: x.actions.filter((_, idx) => idx !== i) }))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="text-sm text-indigo-600"
              onClick={() =>
                updateRule(r.id, (x) => ({
                  ...x,
                  actions: [
                    ...x.actions,
                    fields[0] ? ({ type: "show_field", targetFieldId: fields[0].id || "" } as Action) : ({ type: "route_to", url: "" } as Action),
                  ],
                }))
              }
            >
              + Add action
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href={`/dashboard?siteId=${encodeURIComponent(siteId)}`} className="hover:underline">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Rule Builder</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/notifications/${encodeURIComponent(formId)}?siteId=${encodeURIComponent(siteId)}`}
              className="btn border bg-white hover:bg-gray-50 text-sm"
            >
              Email notifications
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900">{form?.name || form?.id || "Rule Builder"}</h1>
        {error && <div className="mt-3 text-red-600">{error}</div>}
        {!form && !error && <div className="mt-3 text-gray-600">Loading form…</div>}

        {form && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <div className="bg-white border rounded p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Fields</div>
                <ul className="grid gap-1">
                  {fields.map((f) => (
                    <li key={f.id} className="px-2 py-1 rounded hover:bg-gray-50 text-sm border">
                      {f.name || f.id}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
            <section className="lg:col-span-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-600">Define conditional logic for this form</div>
                <button onClick={addRule} className="btn bg-indigo-600 text-white">
                  + New rule
                </button>
              </div>
              <div className="grid gap-4">
                {rules.length === 0 ? (
                  <div className="p-6 border rounded bg-white text-gray-600 text-sm">No rules yet. Click “New rule”.</div>
                ) : (
                  rules.map((r) => <RuleCard key={r.id} r={r} />)
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
