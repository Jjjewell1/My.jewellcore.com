import { PrismaClient } from "../src/generated/prisma-node/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { D1Database } from "@cloudflare/workers-types";

const globalForPrisma = globalThis as unknown as {
  prisma?: unknown;
};

/**
 * The previous Prisma client resolved relative "file:" datasource URLs
 * against the schema directory (prisma/). better-sqlite3 resolves them
 * against the process CWD, so re-apply the historical behavior to keep the
 * dev.db location identical for both local dev and the Coolify deployment.
 *
 * Absolute file: URLs are left unchanged so the SQLite adapter and Prisma CLI
 * both open the same file. Relative "file:" URLs are also left unchanged so
 * that Prisma CLI's relative resolution (CWD‑based) matches better-sqlite3's
 * CWD‑based opening.
 */
function resolveDbUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const rest = url.substring("file:".length);
  if (rest === ":memory:" || rest === "") return url;
  if (rest.startsWith("/")) return url;
  return url;
}

/* ------------------------------------------------------------------ */
/*  Cloudflare Workers data layer                                      */
/*                                                                     */
/*  Prisma's engine-less "workerd" client needs its query compiler as a */
/*  WebAssembly module, which OpenNext's esbuild cannot carry through   */
/*  the Next -> Worker build pipeline and workerd refuses to compile at */
/*  runtime. Rather than fight the bundlers, the worker talks to D1     */
/*  directly with prepared statements shaped like the Prisma calls the  */
/*  app already makes (schema column names match the Prisma schema).    */
/*  Node / Coolify keep using the real Prisma client below.             */
/* ------------------------------------------------------------------ */

type OrderBy =
  | Record<string, "asc" | "desc">
  | Array<Record<string, "asc" | "desc">>;

function orderByClause(orderBy?: OrderBy): { clause: string; params: never[] } {
  if (!orderBy) return { clause: "", params: [] };
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = list.map((o) => {
    const [key, dir] = Object.entries(o)[0];
    return `"${key}" ${dir === "desc" ? "DESC" : "ASC"}`;
  });
  if (!parts.length) return { clause: "", params: [] };
  return { clause: ` ORDER BY ${parts.join(", ")}`, params: [] };
}

function makeModel(db: D1Database, table: string, boolColumns: string[] = []) {
  const isBool = (k: string) => boolColumns.includes(k);

  const mapRow = (row: Record<string, unknown> | null | undefined) => {
    if (!row) return row;
    for (const key of Object.keys(row)) {
      if (isBool(key)) row[key] = Boolean(row[key]);
    }
    return row;
  };

  return {
    async findMany(args?: {
      orderBy?: OrderBy;
      take?: number;
      where?: Record<string, string>;
    }) {
      let sql = `SELECT * FROM "${table}"`;
      const params: unknown[] = [];
      if (args?.where) {
        const entries = Object.entries(args.where);
        if (entries.length) {
          sql += ` WHERE ${entries.map(([k]) => `"${k}" = ?`).join(" AND ")}`;
          params.push(...entries.map(([, v]) => v));
        }
      }
      sql += orderByClause(args?.orderBy).clause;
      if (args?.take != null) {
        sql += " LIMIT ?";
        params.push(args.take);
      }
      const res = await db.prepare(sql).bind(...params).all();
      return (res.results ?? []).map(mapRow);
    },

    async findUnique(args: { where: Record<string, string> }) {
      const entries = Object.entries(args.where);
      const sql = `SELECT * FROM "${table}" WHERE ${entries
        .map(([k]) => `"${k}" = ?`)
        .join(" AND ")} LIMIT 1`;
      const res = await db
        .prepare(sql)
        .bind(...entries.map(([, v]) => v))
        .first<Record<string, unknown>>();
      return mapRow(res);
    },

    async create(args: { data: Record<string, unknown> }) {
      const data = { ...args.data };
      // Match Prisma's @default(cuid()) on TEXT primary keys.
      if (!data.id) data.id = crypto.randomUUID();
      const keys = Object.keys(data);
      const sql = `INSERT INTO "${table}" (${keys
        .map((k) => `"${k}"`)
        .join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`;
      await db.prepare(sql).bind(...keys.map((k) => data[k])).run();
      return mapRow(data);
    },

    async update(args: {
      where: Record<string, string>;
      data: Record<string, unknown>;
    }) {
      const keys = Object.keys(args.data);
      const where = Object.entries(args.where);
      const sql = `UPDATE "${table}" SET ${keys
        .map((k) => `"${k}" = ?`)
        .join(", ")} WHERE ${where.map(([k]) => `"${k}" = ?`).join(" AND ")}`;
      await db
        .prepare(sql)
        .bind(...keys.map((k) => args.data[k]), ...where.map(([, v]) => v))
        .run();
      return { ...args.data, ...args.where };
    },

    async delete(args: { where: Record<string, string> }) {
      const entries = Object.entries(args.where);
      const sql = `DELETE FROM "${table}" WHERE ${entries
        .map(([k]) => `"${k}" = ?`)
        .join(" AND ")}`;
      await db
        .prepare(sql)
        .bind(...entries.map(([, v]) => v))
        .run();
      return { ...args.where };
    },

    async upsert(args: {
      where: Record<string, string>;
      update?: Record<string, unknown>;
      create?: Record<string, unknown>;
    }) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        if (args.update && Object.keys(args.update).length) {
          await this.update({ where: args.where, data: args.update });
        }
        return { ...args.where, ...(args.update ?? {}) };
      }
      return this.create({ data: { ...(args.create ?? {}), ...args.where } });
    },

    async count() {
      const res = await db.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).first<{
        c: number;
      }>();
      return Number(res?.c ?? 0);
    },
  };
}

function makeD1Client(db: D1Database) {
  return {
    portfolioItem: makeModel(db, "PortfolioItem", ["featured"]),
    socialLink: makeModel(db, "SocialLink"),
    pricingTier: makeModel(db, "PricingTier"),
    siteSettings: makeModel(db, "SiteSettings"),
    adminUser: makeModel(db, "AdminUser"),
    lead: makeModel(db, "Lead"),
    $connect: async () => {},
    $disconnect: async () => {},
  };
}

function makeNodeClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: resolveDbUrl(url) }),
  });
}

/* ------------------------------------------------------------------ */
/*  Public client factory                                              */
/* ------------------------------------------------------------------ */

/**
 * Returns the shared database client for the current runtime.
 *
 * - Cloudflare Workers (OpenNext): the `DB` D1 binding is exposed through a
 *   Prisma-shaped shim backed by raw prepared statements (no wasm, no native
 *   engine — safe in workerd).
 * - Everywhere else (local dev, Coolify Docker deploy): the generated Node
 *   Prisma client over SQLite via better-sqlite3.
 *
 * The Cloudflare path only activates inside a real Workers request, so the
 * same code keeps serving the existing Coolify deployment unchanged.
 * The loose return type (any) is deliberate: the shim and the real client
 * share method shapes but not a common class.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPrisma(): Promise<any> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  let prisma: unknown;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as { DB?: D1Database }).DB;
    if (db) {
      prisma = makeD1Client(db);
      console.info("[db] worker: D1 raw adapter active");
    } else {
      prisma = makeNodeClient();
    }
  } catch (e) {
    // Not inside a Workers application (or the context could not be
    // established) — use the standard SQLite instance.
    console.warn("[db] falling back to SQLite:", (e as Error)?.message ?? e);
    prisma = makeNodeClient();
  }

  globalForPrisma.prisma = prisma;
  return prisma;
}