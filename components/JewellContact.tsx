"use client";

import { useRef, useState } from "react";
import { submitContact } from "../lib/actions";

export default function JewellContact() {
  const form = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<{ ok: boolean; error?: string } | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (fd: FormData) => {
    setPending(true);
    setState(null);
    const res = await submitContact(fd);
    setPending(false);
    setState(res);
    if (res.ok) form.current?.reset();
  };

  return (
    <section id="contact" data-scroll-pose="point" className="relative border-t border-white/10 py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_80%_at_20%_50%,rgba(47,212,224,0.06),transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-black text-paper">
              Let&apos;s build something<span className="text-electric">.</span>
            </h2>
            <p className="mt-4 max-w-md font-body text-white/60">
              A brief note is all it takes. Every engagement starts with a conversation — no commitment, no
              deposit.
            </p>
            <div className="glass mt-8 rounded-2xl p-6">
              <p className="font-display text-xl font-extrabold text-electric">jj@jewellcore.com</p>
              <p className="mt-1 font-body text-sm text-white/50">Evenings and weekends.</p>
            </div>
          </div>

          <form ref={form} action={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="font-display text-sm font-bold text-white/80">Name *</span>
                <input name="name" required className="glass rounded-xl border-white/15 px-4 py-3 font-body text-sm text-paper outline-none placeholder:text-white/30 focus:border-electric" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-display text-sm font-bold text-white/80">Email *</span>
                <input name="email" type="email" required className="glass rounded-xl border-white/15 px-4 py-3 font-body text-sm text-paper outline-none placeholder:text-white/30 focus:border-electric" />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-sm font-bold text-white/80">Project type</span>
              <select name="projectType" className="glass rounded-xl border-white/15 px-4 py-3 font-body text-sm text-paper outline-none focus:border-electric">
                <option value="">Select one (optional)</option>
                <option value="website">Website / landing page</option>
                <option value="web_app">Custom web application</option>
                <option value="hosting">Hosting / management</option>
                <option value="other">Something else</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-sm font-bold text-white/80">Project details *</span>
              <textarea name="message" rows={4} required className="glass rounded-xl border-white/15 px-4 py-3 font-body text-sm text-paper outline-none placeholder:text-white/30 focus:border-electric" />
            </label>

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-electric px-6 py-3 font-display text-base font-extrabold text-void shadow-[0_0_24px_-6px_rgba(47,212,224,0.7)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send message"}
            </button>

            {state && !state.ok && state.error && (
              <p className="font-body text-sm text-amber">{state.error}</p>
            )}
            {state && state.ok && (
              <p className="font-body text-sm font-bold text-electric">
                Thank you — your message has been received. I&apos;ll be in touch shortly.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}