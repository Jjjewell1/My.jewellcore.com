import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma-node/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

function resolveDbUrl(url: string): string {
  if (!url.startsWith("file:")) return url;
  const rest = url.slice(5);
  if (rest === ":memory:" || rest === "") return url;
  if (rest.startsWith("/")) return url;
  return url;
}

const url =
  typeof process.env.DATABASE_URL === "string"
    ? resolveDbUrl(process.env.DATABASE_URL)
    : "file:./prisma/dev.db";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const ABOUT = `For more than a decade I ran Jewellz Lawn Service (2010–2021), building a loyal customer base and leading landscape crews day to day. That work taught me what it means to quote honestly, deliver on time, and stand behind what you build — and how difficult it can be for a small business to stay visible online.

Along the way I developed a serious interest in self-hosted technology: my own servers, my own networking, my own AI. That homelab — Unraid, Docker, Coolify, and Cloudflare Tunnels — now runs real family applications and real client sites. Today I am completing IT and cybersecurity coursework (A+, Network+, Security+, Linux+, and cloud certifications) and working independently as Jewellcore, building websites and managing servers for people who want a genuine online presence without agency overhead.

That is the whole proposition: a decade of running a real business, with those instincts rebuilt into software and infrastructure. I work the way I always have — show up, do it properly, and leave it better than I found it.`;

const JOURNEY = `2010 — Founded Jewellz Lawn Service. Started with a single mower and a handshake, and grew it into a steady roster of returning customers over a decade.

Mid-2010s — Took on crew-lead roles, running jobs end to end: scoping, quoting, scheduling, delegation, and collection. Project management, with grass stains.

2021 — Transitioned into technology. Built a homelab, broke it, fixed it, and rebuilt it better — Unraid, Docker, networking, and a great deal of documentation.

Now — IT and cybersecurity coursework alongside cloud foundations, a self-hosted AI rig, and Jewellcore: websites and server administration for small businesses and families.`;

const SYSTEM_PROMPT = `You are Hopper, a professional and courteous assistant representing JJ Jewell (Jewellcore).

Answer questions about JJ: his background (10+ years running Jewellz Lawn Service, crew leader, homelab builder), his skills (web development: WordPress/Elementor/PHP/Tailwind; systems: Unraid/Docker/Coolify/Cloudflare Tunnels/Tailscale/AdGuard Home; AI: Ollama/Open WebUI/ComfyUI/Cline/OpenCode; hardware: 3D printing/CAD/Bambu Lab), and the certifications he is currently pursuing (A+, Network+, Security+, Linux+, AZ-900, AWS Cloud Practitioner).

You know JJ's projects and can discuss them knowledgeably.

If asked about pricing, provide a ballpark range based on the pricing tiers you are given, then always note that an exact quote comes from the contact form — never promise a firm price.

Be warm, polished, and concise. If you do not know something, say so and offer the contact form.`;

const prismaItems = [
  {
    title: "ForgeBase",
    description:
      "An AI application builder — describe an app and it writes, builds, and deploys it to the homelab. This site's generation pipeline in its natural habitat.",
    category: "homelab",
    techTags: "Ollama, OpenCode, Docker, Coolify",
    featured: true,
    order: 0,
    liveUrl: "https://forge.jewellcore.com",
  },
  {
    title: "Arcade Central",
    description:
      "A retro arcade hub with high-score leaderboards, cabinet statistics, and a large glowing button for one more credit. Built out of genuine affection for the game.",
    category: "experiment",
    techTags: "React, Tailwind, SQLite",
    featured: true,
    order: 1,
    liveUrl: "https://arcade.jewellcore.com",
  },
  {
    title: "PickFlick",
    description:
      "An anti-scrolling “what should we watch” app — a quick-fire picker that ends the group movie-night debate before it begins.",
    category: "client",
    techTags: "Next.js, Tailwind, SQLite",
    featured: true,
    order: 2,
    liveUrl: "https://pickflick.jewellcore.com",
  },
  {
    title: "Christmas Wish-List",
    description:
      "A family wish-list app where everyone adds their list, sees one another's, and no one buys the same gift twice. Keeps Christmas running smoothly.",
    category: "client",
    techTags: "Next.js, Prisma, SQLite, Admin",
    featured: true,
    order: 3,
    liveUrl: "https://christmas.jewellcore.com",
  },
  {
    title: "Family Adventures",
    description:
      "A shared journal for family outings — the trails, the trips, and the detours. A living scrapbook the whole family can contribute to.",
    category: "client",
    techTags: "Next.js, Tailwind, SQLite",
    featured: true,
    order: 4,
    liveUrl: "https://adventures.jewellcore.com",
  },
  {
    title: "Vortex",
    description:
      "A homelab experiment in networked complexity — a sandbox service for testing proxies, routing, and self-hosted edge techniques.",
    category: "homelab",
    techTags: "Docker, Traefik, Cloudflare Tunnel",
    featured: false,
    order: 5,
    liveUrl: "https://vortex.jewellcore.com",
  },
  {
    title: "Shotgun Seat Squad",
    description:
      "A road-trip companion — shotgun rotations, music duties, and snack scheduling for the long hauls.",
    category: "experiment",
    techTags: "Next.js, Tailwind, SQLite",
    featured: false,
    order: 6,
    liveUrl: "https://shotgun.jewellcore.com",
  },
  {
    title: "The Golden Ticket",
    description:
      "A small app for grand rewards — scratch-and-win style giveaways for the grandchildren, because Easter deserves a little drama.",
    category: "experiment",
    techTags: "Vanilla JS, HTML, CSS",
    featured: false,
    order: 7,
    liveUrl: "https://goldenticket.jewellcore.com",
  },
  {
    title: "AnythingLLM Study Assistant",
    description:
      "Study notes connected to a self-hosted LLM. Ask your own documents questions and get useful answers before the exam. Runs entirely on the home server.",
    category: "homelab",
    techTags: "Ollama, AnythingLLM, Docker",
    featured: false,
    order: 8,
    liveUrl: "https://study.jewellcore.com",
  },
  {
    title: "StudyStation",
    description:
      "A coursework tracker that syncs assignments from a school portal into Postgres every night, keeping every due date in one place automatically.",
    category: "homelab",
    techTags: "Python, Postgres, Cron, Docker",
    featured: false,
    order: 9,
    liveUrl: "https://studystation.jewellcore.com",
  },
  {
    title: "LaunchBase",
    description:
      "The runbook and control panel behind the jewellcore.com homelab — documenting how every site goes from code to live through Coolify and Cloudflare.",
    category: "homelab",
    techTags: "Coolify, Cloudflare, Docker, Traefik",
    featured: false,
    order: 10,
    liveUrl: "https://launch.jewellcore.com",
  },
  {
    title: "Next \u2014 AI News",
    description:
      "An hourly AI news digest gathered from 20+ sources, curated with business ideas and model releases. Built to run on the homelab.",
    category: "experiment",
    techTags: "Next.js, Python, Cron, SQLite",
    featured: false,
    order: 11,
    liveUrl: "https://next.jewellcore.com",
  },
  {
    title: "Tornado Explorers",
    description:
      "An interactive learning site about tornadoes and Tornado Alley — real-time radar, safety guidance, and the history of storm chasing.",
    category: "experiment",
    techTags: "Next.js, Three.js, GSAP, Weather API",
    featured: false,
    order: 12,
    liveUrl: "https://twister.jewellcore.com",
  },
  {
    title: "YMCA Checklist",
    description:
      "A simple checklist for a visit to the YMCA — packing lists, schedules, and a quick history of past trips.",
    category: "client",
    techTags: "Next.js, Tailwind, SQLite",
    featured: false,
    order: 13,
    liveUrl: "https://ymca.jewellcore.com",
  },
  {
    title: "JewellCore Icon Gallery",
    description:
      "A self-hosted dashboard-icons mirror. Browse and copy SVG URLs for 2,000+ icon sets. Built for the homelab toolbox.",
    category: "homelab",
    techTags: "Next.js, Tailwind, Docker",
    featured: false,
    order: 14,
    liveUrl: "https://icons.jewellcore.com",
  },
  {
    title: "The Grid",
    description:
      "A personal interactive portfolio — a 3D WebGL experience mapping JJ's projects, stack, and contact details. Runs on the homelab.",
    category: "homelab",
    techTags: "Next.js, React Three Fiber, GSAP, Tailwind",
    featured: false,
    order: 15,
    liveUrl: "https://jj.jewellcore.com",
  },
  {
    title: "JJ World \u2014 Digital Forge",
    description:
      "An immersive 3D portfolio showcasing shipped homelab projects: Vortex, PickFlick, Christmas Wish-List, Family Adventures, AnythingLLM, and more.",
    category: "homelab",
    techTags: "Next.js, React Three Fiber, GSAP, Tailwind",
    featured: false,
    order: 16,
    liveUrl: "https://jjsworld.jewellcore.com",
  },
];

async function main() {
  // Reconcile portfolio items by title: upsert on every run so the seed
  // remains the canonical source of truth and redeploys fix/add cards.
  for (const item of prismaItems) {
    const existing = await prisma.portfolioItem.findFirst({
      where: { title: item.title },
    });

    if (existing) {
      await prisma.portfolioItem.update({
        where: { id: existing.id },
        data: item,
      });
      console.log(`Updated portfolio item: ${item.title}`);
    } else {
      await prisma.portfolioItem.create({ data: item });
      console.log(`Created portfolio item: ${item.title}`);
    }
  }

  // Social links, pricing tiers, site settings, admin user: keep idempotent
  // create-only to avoid clobbering admin edits.
  const [socialCount, tierCount] = await Promise.all([
    prisma.socialLink.count(),
    prisma.pricingTier.count(),
  ]);

  if (socialCount === 0) {
    await prisma.socialLink.createMany({
      data: [
        { platform: "GitHub", url: "https://github.com/Jjjewell1", order: 1 },
        { platform: "Email", url: "mailto:jj@jewellcore.com", order: 2 },
      ],
    });
  }

  if (tierCount === 0) {
    await prisma.pricingTier.createMany({
      data: [
        {
          name: "Starter website",
          rangeLow: 650,
          rangeHigh: 1200,
          description:
            "A polished WordPress or static site, including hosting setup. Ideal for a business that needs a credible presence, quickly.",
          order: 1,
        },
        {
          name: "Custom web app",
          rangeLow: 2500,
          rangeHigh: 8000,
          description:
            "A purpose-built application with custom logic — bookings, member areas, admin tools — built on modern foundations and self-hosted.",
          order: 2,
        },
        {
          name: "Hosting & management retainer",
          rangeLow: 50,
          rangeHigh: 250,
          description:
            "Monthly hosting, updates, backups, and responsive support. Billed per month.",
          order: 3,
        },
      ],
    });
  }

  // Wording fields are kept in sync with the seed on every run so copy updates
  // ship with a redeploy. Operational settings are left untouched.
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {
      siteTitle: "JJ Jewell — Jewellcore",
      tagline: "Independent web developer and systems builder.",
      aboutContent: ABOUT,
      journeyContent: JOURNEY,
      aiSystemPrompt: SYSTEM_PROMPT,
    },
    create: {
      id: "singleton",
      siteTitle: "JJ Jewell — Jewellcore",
      tagline: "Independent web developer and systems builder.",
      aboutContent: ABOUT,
      journeyContent: JOURNEY,
      aiEndpoint: "https://ollama.jewellcore.com",
      aiSystemPrompt: SYSTEM_PROMPT,
    },
  });

  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD;
    if (password) {
      await prisma.adminUser.create({
        data: {
          username: "jj",
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
      console.log("Seeded admin user 'jj'.");
    } else {
      console.warn("ADMIN_PASSWORD not set \u2014 no admin user created. Set it and run the seed again.");
    }
  } else if (process.env.ADMIN_PASSWORD && process.env.FORCE_ADMIN_RESET === "true") {
    await prisma.adminUser.update({
      where: { username: "jj" },
      data: { passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) },
    });
    console.log("Admin password reset from ADMIN_PASSWORD.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());