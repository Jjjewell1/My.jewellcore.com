"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma";
import { signSession, verifySession, SESSION_COOKIE_NAME } from "./auth";
import { sendNtfy } from "./ntfy";

/* ------------------------------------------------------------------ */
/*  Auth (login / logout / session helper)                             */
/* ------------------------------------------------------------------ */

export async function login(username: string, password: string) {
  const prisma = await getPrisma();
  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) return { ok: false, error: "Invalid credentials." };
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { ok: false, error: "Invalid credentials." };
  const token = await signSession({ u: user.username, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logout() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySession(token);
}

async function requireAdmin(): Promise<boolean> {
  return !!(await getSession());
}

function deny() {
  return { ok: false, error: "unauthorized" } as const;
}

/* ------------------------------------------------------------------ */
/*  Contact / leads                                                   */
/* ------------------------------------------------------------------ */

export async function submitContact(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const projectType = String(formData.get("projectType") || "").trim() || null;
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message) return { ok: false, error: "Please complete all required fields." };

  const prisma = await getPrisma();
  await prisma.lead.create({ data: { name, email, projectType, message, source: "contact_form" } });
  await sendNtfy({ name, email, projectType, message, source: "contact_form" });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Chatbot lead capture                                              */
/* ------------------------------------------------------------------ */

export async function captureChatLead(data: { name: string; email: string; message: string }) {
  const name = data.name.trim();
  const email = data.email.trim();
  const message = data.message.trim();
  if (!email || !message) return { ok: false, error: "missing data" };
  const prisma = await getPrisma();
  await prisma.lead.create({
    data: { name: name || "Chat lead", email, message, source: "chatbot" },
  });
  await sendNtfy({ name: name || "Chat lead", email, message, source: "chatbot" });
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Admin CRUD: Portfolio Items                                       */
/* ------------------------------------------------------------------ */

export async function upsertPortfolioItem(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = formData.get("id") as string | null;
  const data = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    imageUrl: String(formData.get("imageUrl") || "").trim() || null,
    liveUrl: String(formData.get("liveUrl") || "").trim() || null,
    category: String(formData.get("category") || "homelab").trim(),
    techTags: String(formData.get("techTags") || "").trim(),
    featured: formData.get("featured") === "on",
    order: Number(formData.get("order") || 0),
  };

  const prisma = await getPrisma();
  if (id) await prisma.portfolioItem.update({ where: { id }, data });
  else await prisma.portfolioItem.create({ data });
  revalidatePath("/");
  return { ok: true };
}

export async function deletePortfolioItem(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false };
  const prisma = await getPrisma();
  await prisma.portfolioItem.delete({ where: { id } });
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Admin CRUD: Social Links                                          */
/* ------------------------------------------------------------------ */

export async function upsertSocialLink(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = formData.get("id") as string | null;
  const data = {
    platform: String(formData.get("platform") || "").trim(),
    url: String(formData.get("url") || "").trim(),
    order: Number(formData.get("order") || 0),
  };
  const prisma = await getPrisma();
  if (id) await prisma.socialLink.update({ where: { id }, data });
  else await prisma.socialLink.create({ data });
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSocialLink(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false };
  const prisma = await getPrisma();
  await prisma.socialLink.delete({ where: { id } });
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Admin CRUD: Pricing Tiers                                         */
/* ------------------------------------------------------------------ */

export async function upsertPricingTier(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = formData.get("id") as string | null;
  const data = {
    name: String(formData.get("name") || "").trim(),
    rangeLow: Number(formData.get("rangeLow") || 0),
    rangeHigh: Number(formData.get("rangeHigh") || 0),
    description: String(formData.get("description") || "").trim(),
    order: Number(formData.get("order") || 0),
  };
  const prisma = await getPrisma();
  if (id) await prisma.pricingTier.update({ where: { id }, data });
  else await prisma.pricingTier.create({ data });
  revalidatePath("/");
  return { ok: true };
}

export async function deletePricingTier(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = String(formData.get("id") || "");
  if (!id) return { ok: false };
  const prisma = await getPrisma();
  await prisma.pricingTier.delete({ where: { id } });
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Admin CRUD: Site Settings                                         */
/* ------------------------------------------------------------------ */

export async function updateSiteSettings(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const s = {
    siteTitle: String(formData.get("siteTitle") || "").trim(),
    tagline: String(formData.get("tagline") || "").trim(),
    contactEmail: String(formData.get("contactEmail") || "").trim(),
    ntfyTopic: String(formData.get("ntfyTopic") || "").trim(),
    aiProvider: String(formData.get("aiProvider") || "ollama").trim(),
    aiEndpoint: String(formData.get("aiEndpoint") || "").trim(),
    aiModel: String(formData.get("aiModel") || "").trim(),
    aiApiKey: String(formData.get("aiApiKey") || "").trim(),
    aiTemperature: Number(formData.get("aiTemperature") || 0.7),
    aiSystemPrompt: String(formData.get("aiSystemPrompt") || ""),
    aboutContent: String(formData.get("aboutContent") || ""),
    journeyContent: String(formData.get("journeyContent") || ""),
  };
  const prisma = await getPrisma();
  await prisma.siteSettings.upsert({ where: { id: "singleton" }, update: s, create: { id: "singleton", ...s } });
  revalidatePath("/");
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Admin: Leads list + status                                        */
/* ------------------------------------------------------------------ */

export async function updateLeadStatus(formData: FormData) {
  if (!(await requireAdmin())) return deny();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "new").trim();
  if (!id) return { ok: false };
  const prisma = await getPrisma();
  await prisma.lead.update({ where: { id }, data: { status } });
  return { ok: true };
}