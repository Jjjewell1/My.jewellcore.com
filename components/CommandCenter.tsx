"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PortfolioItem, SocialLink, PricingTier, SiteSettings, Lead } from "../src/generated/prisma-node/client";
import {
  login,
  logout,
  upsertPortfolioItem,
  deletePortfolioItem,
  upsertSocialLink,
  deleteSocialLink,
  upsertPricingTier,
  deletePricingTier,
  updateSiteSettings,
  updateLeadStatus,
} from "@/lib/actions";
import { PROVIDERS, resolveProvider } from "@/lib/providers";

const inputCls =
  "w-full rounded-lg border-2 border-paper/15 bg-ink-soft px-3 py-2 font-body text-sm text-paper outline-none focus:border-electric";
const labelCls = "font-body text-xs font-bold text-paper/70";
const btnPri =
  "rounded-full bg-court px-5 py-2 font-body text-sm font-extrabold text-ink transition-transform hover:-translate-y-0.5";

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const act = async (fd: FormData) => {
    setPending(true);
    setError("");
    const res = await login(String(fd.get("username")), String(fd.get("password")));
    setPending(false);
    if (res.ok) router.refresh();
    else setError("Incorrect username or password.");
  };

  return (
    <form action={act} className="w-full max-w-sm rounded-3xl border-2 border-paper/15 bg-ink-soft p-8">
      <p className="font-display text-2xl font-black text-paper">Command Center</p>
      <p className="mt-1 font-body text-sm text-paper/60">Authorized access only.</p>
      <label className={labelCls + " mt-6 block"}>Username</label>
      <input name="username" required autoComplete="username" className={inputCls + " mt-1"} />
      <label className={labelCls + " mt-4 block"}>Password</label>
      <input name="password" type="password" required autoComplete="current-password" className={inputCls + " mt-1"} />
      {error && <p className="mt-3 font-body text-sm text-court">{error}</p>}
      <button type="submit" disabled={pending} className={btnPri + " mt-6 w-full text-center"}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

interface AdminProps {
  portfolioItems: PortfolioItem[];
  socialLinks: SocialLink[];
  pricingTiers: PricingTier[];
  settings: SiteSettings | null;
  leads: Lead[];
}

const TABS = [
  { key: "portfolio", label: "Portfolio" },
  { key: "ai", label: "AI + Pricing" },
  { key: "content", label: "About / Journey" },
  { key: "social", label: "Social & Footer" },
  { key: "leads", label: "Leads" },
  { key: "settings", label: "Settings" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function AdminDashboard(props: AdminProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("portfolio");

  const doLogout = async () => {
    await logout();
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-ink px-4 py-10 text-paper">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black">Command Center</h1>
            <p className="font-body text-sm text-paper/60">jjs.jewellcore.com · everything admin-editable lives here</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-full border-2 border-paper/20 px-5 py-2 font-body text-sm font-bold hover:border-electric hover:text-electric">
              View site →
            </a>
            <button onClick={doLogout} className="rounded-full border-2 border-court px-5 py-2 font-body text-sm font-bold text-court hover:bg-court hover:text-ink">
              Log out
            </button>
          </div>
        </header>

        <nav className="mt-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`rounded-full px-4 py-2 font-body text-sm font-bold transition-colors ${
                tab === t.key ? "bg-electric text-ink" : "border-2 border-paper/20 text-paper/70 hover:border-electric"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          {tab === "portfolio" && <PortfolioTab items={props.portfolioItems} />}
          {tab === "ai" && <AiTab settings={props.settings} tiers={props.pricingTiers} />}
          {tab === "content" && <ContentTab settings={props.settings} />}
          {tab === "social" && <SocialTab links={props.socialLinks} />}
          {tab === "leads" && <LeadsTab leads={props.leads} />}
          {tab === "settings" && <SettingsTab settings={props.settings} />}
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                             */
/* ------------------------------------------------------------------ */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border-2 border-paper/10 bg-ink-soft p-6">
      <h2 className="font-display text-lg font-extrabold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const wrap =
  (fn: (fd: FormData) => Promise<unknown>) =>
  async (fd: FormData) => {
    await fn(fd);
  };

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea,
  required,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  options?: { value: string; label: string }[];
}) {
  const common = {
    name,
    defaultValue: defaultValue ?? "",
    className: inputCls,
    required,
  };
  return (
    <label className="flex flex-col gap-1">
      <span className={labelCls}>{label}</span>
      {options ? (
        <select {...common}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea rows={4} {...common} />
      ) : (
        <input type={type} {...common} />
      )}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  Portfolio                                                         */
/* ------------------------------------------------------------------ */

function PortfolioTab({ items }: { items: PortfolioItem[] }) {
  return (
    <>
      <Panel title="Add a work item">
        <form action={wrap(upsertPortfolioItem)} className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" name="title" required />
          <Field label="Category" name="category" defaultValue="homelab" />
          <Field label="Order" name="order" type="number" />
          <Field label="Live URL" name="liveUrl" />
          <Field label="Image URL" name="imageUrl" />
          <Field label="Tech tags (comma separated)" name="techTags" />
          <label className="flex items-center gap-2 sm:col-span-2">
            <input name="featured" type="checkbox" className="h-4 w-4 accent-[#2FD4E0]" />
            <span className={labelCls}>Featured (shows in hero carousel)</span>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelCls}>Description</span>
            <textarea name="description" rows={3} required className={inputCls} />
          </label>
          <button className={btnPri + " w-fit"}>Add item</button>
        </form>
      </Panel>

      {items.map((it) => (
        <Panel key={it.id} title={`${it.title} · ${it.category} · ${it.featured ? "★" : "·"}`}>
          <form action={wrap(upsertPortfolioItem)} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={it.id} />
            <Field label="Title" name="title" defaultValue={it.title} required />
            <Field label="Category" name="category" defaultValue={it.category} />
            <Field label="Order" name="order" type="number" defaultValue={it.order} />
            <Field label="Live URL" name="liveUrl" defaultValue={it.liveUrl} />
            <Field label="Image URL" name="imageUrl" defaultValue={it.imageUrl} />
            <Field label="Tech tags" name="techTags" defaultValue={it.techTags} />
            <label className="flex items-center gap-2 sm:col-span-2">
              <input name="featured" type="checkbox" defaultChecked={it.featured} className="h-4 w-4 accent-[#2FD4E0]" />
              <span className={labelCls}>Featured</span>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className={labelCls}>Description</span>
              <textarea name="description" rows={3} required defaultValue={it.description} className={inputCls} />
            </label>
            <div className="flex gap-3 sm:col-span-2">
              <button className={btnPri}>Save</button>
              <button
                formAction={wrap(deletePortfolioItem)}
                className="rounded-full border-2 border-court px-5 py-2 font-body text-sm font-bold text-court hover:bg-court hover:text-ink"
              >
                Delete
              </button>
            </div>
          </form>
        </Panel>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  AI + Pricing                                                      */
/* ------------------------------------------------------------------ */

function AiTab({ settings, tiers }: { settings: SiteSettings | null; tiers: PricingTier[] }) {
  return (
    <>
      <Panel title="AI Integration">
        <form action={wrap(updateSiteSettings)} className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Provider"
            name="aiProvider"
            defaultValue={resolveProvider(settings?.aiProvider)}
            options={PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
          />
          <Field label="Model" name="aiModel" defaultValue={settings?.aiModel} />
          <Field label="Endpoint (blank = provider default)" name="aiEndpoint" defaultValue={settings?.aiEndpoint} />
          <Field label="API key (blank = server env var)" name="aiApiKey" defaultValue={settings?.aiApiKey ?? ""} type="password" />
          <Field label="Temperature" name="aiTemperature" type="number" defaultValue={settings?.aiTemperature ?? 0.7} />
          <p className="font-body text-xs text-paper/50 sm:col-span-2">
            Google Gemini is the default backend: leave the endpoint and model blank and it uses{" "}
            <code className="text-electric">gemini-2.5-flash</code> at{" "}
            <code className="text-electric">generativelanguage.googleapis.com</code>. Leave the API key blank to read{" "}
            <code className="text-electric">GEMINI_API_KEY</code> from the server environment. An endpoint left over
            from a different provider is ignored automatically.
          </p>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelCls}>System prompt (Hopper&apos;s brain — gets portfolio + pricing appended live)</span>
            <textarea name="aiSystemPrompt" rows={7} defaultValue={settings?.aiSystemPrompt ?? ""} className={inputCls} />
          </label>
          <button className={btnPri + " w-fit"}>Save AI config</button>
        </form>
      </Panel>

      <Panel title="Pricing tiers (used by Hopper)">
        <form action={wrap(upsertPricingTier)} className="grid gap-3 sm:grid-cols-4">
          <Field label="Name" name="name" required />
          <Field label="Low $" name="rangeLow" type="number" />
          <Field label="High $" name="rangeHigh" type="number" />
          <Field label="Order" name="order" type="number" />
          <Field label="Description" name="description" textarea />
          <button className={btnPri + " w-fit"}>Add tier</button>
        </form>
        <div className="mt-6 space-y-3">
          {tiers.map((t) => (
            <form key={t.id} action={wrap(upsertPricingTier)} className="grid gap-2 rounded-xl border border-paper/10 p-4 sm:grid-cols-[1fr_90px_90px_90px] sm:items-end">
              <input type="hidden" name="id" value={t.id} />
              <Field label="Name" name="name" defaultValue={t.name} required />
              <Field label="Low" name="rangeLow" type="number" defaultValue={t.rangeLow} />
              <Field label="High" name="rangeHigh" type="number" defaultValue={t.rangeHigh} />
              <Field label="Order" name="order" type="number" defaultValue={t.order} />
              <Field label="Description" name="description" defaultValue={t.description} />
              <div className="flex gap-2 sm:col-span-4">
                <button className={btnPri}>Save</button>
                <button formAction={wrap(deletePricingTier)} className="rounded-full border-2 border-court px-4 py-2 font-body text-sm font-bold text-court">
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Content                                                           */
/* ------------------------------------------------------------------ */

function ContentTab({ settings }: { settings: SiteSettings | null }) {
  return (
    <Panel title="About + How I Got Here copy">
      <p className="mb-4 max-w-2xl font-body text-sm text-paper/60">
        Plain text with blank lines between paragraphs. Journey steps: start each paragraph with a year
        (&ldquo;2010 — ...&ldquo;) and it becomes a numbered timeline card.
      </p>
      <form action={wrap(updateSiteSettings)} className="grid gap-4">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>About paragraph(s)</span>
          <textarea name="aboutContent" rows={10} defaultValue={settings?.aboutContent ?? ""} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Journey timeline steps</span>
          <textarea name="journeyContent" rows={8} defaultValue={settings?.journeyContent ?? ""} className={inputCls} />
        </label>
        <button className={btnPri + " w-fit"}>Save content</button>
      </form>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Social                                                            */
/* ------------------------------------------------------------------ */

function SocialTab({ links }: { links: SocialLink[] }) {
  return (
    <>
      <Panel title="Footer social links">
        <form action={wrap(upsertSocialLink)} className="grid gap-3 sm:grid-cols-3">
          <Field label="Platform (github, email, linkedin…)" name="platform" required />
          <Field label="URL" name="url" required />
          <Field label="Order" name="order" type="number" />
          <button className={btnPri + " w-fit"}>Add link</button>
        </form>
        <div className="mt-6 space-y-3">
          {links.map((l) => (
            <form key={l.id} action={wrap(upsertSocialLink)} className="grid gap-2 rounded-xl border border-paper/10 p-4 sm:grid-cols-[1fr_1.6fr_80px_auto] sm:items-end">
              <input type="hidden" name="id" value={l.id} />
              <Field label="Platform" name="platform" defaultValue={l.platform} required />
              <Field label="URL" name="url" defaultValue={l.url} required />
              <Field label="Order" name="order" type="number" defaultValue={l.order} />
              <div className="flex gap-2">
                <button className={btnPri}>Save</button>
                <button formAction={wrap(deleteSocialLink)} className="rounded-full border-2 border-court px-4 py-2 font-body text-sm font-bold text-court">
                  Del
                </button>
              </div>
            </form>
          ))}
        </div>
      </Panel>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Leads                                                             */
/* ------------------------------------------------------------------ */

function LeadsTab({ leads }: { leads: Lead[] }) {
  const badge = (s: string) =>
    s === "new" ? "bg-court text-ink" : s === "contacted" ? "bg-electric text-ink" : "bg-paper text-ink";
  return (
    <Panel title={`Leads (${leads.length})`}>
      {leads.length === 0 && <p className="font-body text-sm text-paper/60">No leads yet. They&apos;ll show up here and ping your phone via ntfy.</p>}
      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className="rounded-xl border border-paper/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-body text-sm font-bold text-paper">
                  {l.name} <span className="font-normal text-paper/50">&lt;{l.email}&gt;</span> — {l.source}
                </p>
                {l.projectType && <p className="font-body text-xs text-electric">{l.projectType}</p>}
              </div>
              <form action={wrap(updateLeadStatus)} className="flex items-center gap-2">
                <input type="hidden" name="id" value={l.id} />
                <select name="status" defaultValue={l.status} className={inputCls + " w-auto"}>
                  <option value="new">new</option>
                  <option value="contacted">contacted</option>
                  <option value="closed">closed</option>
                </select>
                <button className={btnPri}>Set</button>
              </form>
            </div>
            <p className="mt-2 rounded-lg bg-ink p-3 font-body text-sm text-paper/80">{l.message}</p>
            <p className="mt-2 font-body text-xs text-paper/40">{new Date(l.createdAt).toLocaleString()}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-0.5 font-body text-xs font-extrabold ${badge(l.status)}`}>{l.status}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings                                                          */
/* ------------------------------------------------------------------ */

function SettingsTab({ settings }: { settings: SiteSettings | null }) {
  return (
    <Panel title="General settings">
      <form action={wrap(updateSiteSettings)} className="grid gap-3 sm:grid-cols-2">
        <Field label="Site title" name="siteTitle" defaultValue={settings?.siteTitle} />
        <Field label="Tagline" name="tagline" defaultValue={settings?.tagline} />
        <Field label="Contact email" name="contactEmail" defaultValue={settings?.contactEmail} />
        <Field label="ntfy.topic URL" name="ntfyTopic" defaultValue={settings?.ntfyTopic} />
        <button className={btnPri + " w-fit"}>Save settings</button>
      </form>
    </Panel>
  );
}