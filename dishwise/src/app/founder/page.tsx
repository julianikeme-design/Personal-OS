"use client";
import { useEffect, useState } from "react";
import { IconLock, IconRefresh } from "@/components/icons";
import { Button, Card, Notice, PageTitle, Spinner, TopBar } from "@/components/ui";
import type { Metrics } from "@/lib/analytics/metrics";

interface Payload {
  metrics: Metrics;
  store: "supabase" | "file" | "device";
  storeEphemeral: boolean;
  generatedAt: string;
}

const CODE_KEY = "dw.founderCode";
const INVITED_KEY = "dw.founderInvited";

const LABELS: Record<string, string> = {
  yes: "Yes", no: "No", somewhat: "Somewhat", maybe: "Maybe", unsure: "Not sure",
  familiar: "Ordered something familiar", asked_staff: "Asked staff", searched: "Searched online",
  guessed: "Guessed", others: "Asked companions", other: "Something else",
  yes_small: "Yes, ~£2–3/month", yes_more: "Yes, more", safe: "Safe Pick", adventure: "Adventure Pick",
  value: "Value Pick", "other menu item": "Another menu item", sample: "Sample menu", text: "Pasted text",
  photo: "Photo", pdf: "PDF", ai: "AI", rules: "Rules (no AI)",
};
const label = (k: string) => LABELS[k] ?? k;

export default function FounderPage() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invited, setInvited] = useState("");

  async function load(c: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/founder", { headers: { "x-founder-code": c }, cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't load.");
      setData(json);
      try { sessionStorage.setItem(CODE_KEY, c); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(CODE_KEY) ?? "";
      setInvited(localStorage.getItem(INVITED_KEY) ?? "");
    } catch {}
    void load(saved);
  }, []);

  if (!data) {
    return (
      <div className="fade-in">
        <TopBar back="/profile" title="Founder dashboard" />
        <PageTitle title="Validation dashboard" sub="Private. Aggregated, anonymous test metrics." />
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(code);
          }}
        >
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"><IconLock size={14} /> Passcode</span>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="current-password"
              className="h-12 w-full rounded-2xl border border-line bg-surface px-4 outline-none focus:border-ink"
            />
          </label>
          <Button type="submit" disabled={loading}>{loading ? <Spinner /> : "Open dashboard"}</Button>
          {error && <Notice tone="danger">{error}</Notice>}
        </form>
      </div>
    );
  }

  const m = data.metrics;
  const invitedN = Number(invited) || 0;
  const recsUsers = m.funnel.find((f) => f.key === "recs")?.users ?? 0;
  const confYes = m.feedback.confident.yes ?? 0;

  return (
    <div className="fade-in">
      <TopBar
        back="/profile"
        title="Founder dashboard"
        right={
          <button onClick={() => load(sessionStorage.getItem(CODE_KEY) ?? "")} aria-label="Refresh" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2">
            {loading ? <Spinner className="h-4 w-4" /> : <IconRefresh size={18} />}
          </button>
        }
      />
      <PageTitle title="Is Dishwise useful?" sub={`${m.uniqueUsers} anonymous testers · ${m.totalEvents} events · updated ${new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`} />

      {data.storeEphemeral && (
        <Notice tone="warn" className="mb-5">
          Events are stored in temporary server storage and will be lost. Connect Supabase (see README) before your real test.
        </Notice>
      )}
      {data.store === "device" && (
        <Notice className="mb-5">Preview mode: this shows only the activity in this browser. The deployed app collects every tester&apos;s results in one place.</Notice>
      )}
      {data.store === "file" && !data.storeEphemeral && (
        <Notice className="mb-5">Events are stored in a local file (<code>.data/events.ndjson</code>). Fine for local testing.</Notice>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Got recommendations" value={recsUsers} sub={invitedN ? `of ${invitedN} invited (${pct(recsUsers, invitedN)})` : "testers"} />
        <Kpi label="Chose more confidently" value={m.feedback.responses ? pct(confYes, m.feedback.responses) : "–"} sub={`${confYes} of ${m.feedback.responses} answered “Yes”`} />
        <Kpi label="Median time to picks" value={m.timeToRecs.medianSec != null ? `${m.timeToRecs.medianSec}s` : "–"} sub={m.timeToRecs.total ? `${m.timeToRecs.under60}/${m.timeToRecs.total} within 60s` : "no data"} />
        <Kpi label="Actually came back" value={m.repeat.actualReturners} sub={`vs ${m.repeat.statedYes} who said they would`} />
      </div>

      <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm">
        <span>People you invited <span className="text-muted">(entered by you, saved in this browser)</span></span>
        <input
          inputMode="numeric"
          value={invited}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 5);
            setInvited(v);
            try { localStorage.setItem(INVITED_KEY, v); } catch {}
          }}
          aria-label="Number of people invited"
          className="h-9 w-20 rounded-xl border border-line bg-surface px-2 text-right outline-none focus:border-ink"
        />
      </label>

      <Section title="Journey funnel" note="Unique testers reaching each step.">
        <BarList rows={[...(invitedN ? [{ k: "Invited", v: invitedN }] : []), ...m.funnel.map((f) => ({ k: f.label, v: f.users }))]} max={Math.max(invitedN, m.uniqueUsers, 1)} />
        {m.sampleOnlyUsers > 0 && <p className="mt-3 text-xs text-muted">{m.sampleOnlyUsers} tester(s) only tried sample menus. Sample use shows curiosity, not real-world need.</p>}
      </Section>

      <Section title="Did Dishwise help you choose more confidently?">
        <Dist counts={m.feedback.confident} order={["yes", "somewhat", "no"]} />
      </Section>
      <Section title="What would you have done without Dishwise?">
        <Dist counts={m.feedback.without} />
      </Section>
      <Section title="Would you use it again at another restaurant?" note="Stated intention. Compare with “Actually came back” above.">
        <Dist counts={m.feedback.useAgain} order={["yes", "maybe", "no"]} />
      </Section>
      <Section title="Willingness to pay for extras">
        <Dist counts={m.feedback.wtp} order={["no", "maybe", "yes_small", "yes_more"]} />
      </Section>
      <Section title="Was the recommendation useful?">
        <Dist counts={m.feedback.recHelpful} order={["yes", "unsure", "no"]} />
        <p className="mt-2 text-sm text-muted">Average dish rating: {m.feedback.avgRating ?? "–"} / 5</p>
      </Section>
      <Section title="Which dish did people choose?">
        <Dist counts={m.pickChoice} />
      </Section>
      <Section title="How menus arrived" note={`${m.interpretFailures} failed attempt(s) to read a menu.`}>
        <Dist counts={m.inputMethods} />
      </Section>
      <Section title="Recommendation engine">
        <Dist counts={m.engines} />
      </Section>

      {m.invites.length > 0 && (
        <Section title="By invite link" note="Share links like /?invite=alex to track who started.">
          <table className="w-full text-sm">
            <thead className="text-left text-muted"><tr><th className="py-1 font-medium">Invite</th><th className="font-medium">Testers</th><th className="font-medium">Got picks</th></tr></thead>
            <tbody>{m.invites.map((i) => <tr key={i.code} className="border-t border-line"><td className="py-1.5">{i.code}</td><td>{i.users}</td><td>{i.recs}</td></tr>)}</tbody>
          </table>
        </Section>
      )}

      <Section title="What testers said">
        {m.comments.length === 0 ? (
          <p className="text-sm text-muted">No comments yet.</p>
        ) : (
          <ul className="grid gap-2">
            {m.comments.map((c, i) => (
              <li key={i} className="rounded-xl bg-surface-2 px-3 py-2 text-sm">
                <span className="text-xs text-muted">{c.kind} · {new Date(c.ts).toLocaleDateString("en-GB")}</span>
                <p className="mt-0.5">{c.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Daily activity">
        <table className="w-full text-sm">
          <thead className="text-left text-muted"><tr><th className="py-1 font-medium">Day</th><th className="font-medium">Active testers</th><th className="font-medium">Recommendations</th></tr></thead>
          <tbody>{m.daily.map((d) => <tr key={d.day} className="border-t border-line"><td className="py-1.5">{d.day}</td><td>{d.users}</td><td>{d.scans}</td></tr>)}</tbody>
        </table>
      </Section>

      <p className="mt-8 text-xs leading-relaxed text-muted">
        Reminder: with around 20 testers this is exploratory evidence, not proof of product-market fit. Weigh what people
        did (picked a dish, came back) above what they said.
      </p>
    </div>
  );
}

function pct(a: number, b: number) {
  return b ? `${Math.round((a / b) * 100)}%` : "–";
}

function Kpi({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <Card className="p-4 shadow-none">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </Card>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-medium">{title}</h2>
      {note && <p className="mt-0.5 text-sm text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function BarList({ rows, max }: { rows: { k: string; v: number }[]; max: number }) {
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.k} title={`${r.k}: ${r.v}`}>
          <div className="flex justify-between gap-3 text-sm">
            <span>{r.k}</span>
            <span className="font-medium tabular-nums">{r.v}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${max ? Math.max(r.v ? 2 : 0, (r.v / max) * 100) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Dist({ counts, order }: { counts: Record<string, number>; order?: string[] }) {
  const keys = order ? [...order, ...Object.keys(counts).filter((k) => !order.includes(k))] : Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (!total) return <p className="text-sm text-muted">No responses yet.</p>;
  return <BarList rows={keys.map((k) => ({ k: `${label(k)} (${pct(counts[k] ?? 0, total)})`, v: counts[k] ?? 0 }))} max={Math.max(...Object.values(counts))} />;
}
