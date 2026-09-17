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

const ABOUT = `I spent over a decade running Jewellz Lawn Service (2010\u20132021), building a real customer base and leading landscape crews day in, day out. I know what it is to shake a hand, quote a job, do the work, and stand behind it \u2014 and I know how hard it is to keep a small business visible online.

Somewhere in there I got deep into self-hosted tech. My own servers, my own networking, my own AI. Unraid, Docker, Coolify, Cloudflare Tunnels \u2014 a homelab that runs real family apps and real client sites. Today I'm studying IT and cybersecurity coursework (A+, Network+, Security+, Linux+, and cloud certs), and I freelance as \u201cJewellcore\u201d: building websites and managing servers for people who want a real presence without a bloated agency bill.

That's the whole pitch. I built and ran a real business, then rebuilt those instincts into software and infrastructure. I ship the same way I used to mow a lawn: show up, do it properly, leave it better than I found it.`;

const JOURNEY = `2010 \u2014 Launched Jewellz Lawn Service. Started with a single mower and a handshake. Grew it into a steady book of returning customers over a decade.

Mid-2010s \u2014 Took on crew lead roles. Learned to run jobs end-to-end: scope, quote, schedule, delegate, collect. That's project management, just with grass stains.

2021 \u2014 Pivoted hard into tech. Bought a homelab, broke it, fixed it, broke it better. Unraid, Docker, networking, and a mountain of documentation.

Now \u2014 IT & cybersecurity coursework plus cloud foundations, a self-hosted AI rig, and Jewellcore: websites and server admin for small businesses and family.`;

const SYSTEM_PROMPT = `You are Hopper, a friendly white rabbit who talks for JJ Jewell (Jewellcore).

Answer questions about JJ: background (10+ years running Jewellz Lawn Service, crew leader, homelab builder), skills (web dev: WordPress/Elementor/PHP/Tailwind; systems: Unraid/Docker/Coolify/Cloudflare Tunnels/Tailscale/AdGuard Home; AI: Ollama/Open WebUI/ComfyUI/Cline/OpenCode; hardware: 3D printing/CAD/Bambu Lab), and current certifications in progress (A+, Network+, Security+, Linux+, AZ-900, AWS Cloud Practitioner).

You know JJ's projects and can talk about them.

If asked for pricing, give a ballpark range based on the pricing tiers you're given, then ALWAYS say an exact quote comes from the contact form \u2014 never promise a firm price.

Be warm, a little playful, and concise. If you don't know, say so and offer the contact form.`;

const prismaItems = [
  {
    title: "ForgeBase",
    description:
      "An AI app builder \u2014 describe an app and it writes, builds, and ships it to the homelab. This site's AI pipeline in its natural habitat.",
    category: "homelab",
    techTags: "Ollama, OpenCode, Docker, Coolify",
    featured: true,
    order: 0,
    liveUrl: "https://forge.jewellcore.com",
  },
  {
    title: "Arcade Central",
    description:
      "A retro arcade hub project \u2014 high-score leaderboards, cabinet stats, and a big glowing button for one more credit. Built for the love of the game.",
    category: "experiment",
    techTags: "React, Tailwind, SQLite",
    featured: true,
    order: 1,
    liveUrl: "https://arcade.jewellcore.com",
  },
  {
    title: "PickFlick",
    description:
      "The anti-scrolling \u201cwhat do we watch\u201d app. A quick-fire picker that ends group movie night arguments before they start.",
    category: "client",
    techTags: "Next.js, Tailwind, SQLite",
    featured: true,
    order: 2,
    liveUrl: "https://pickflick.jewellcore.com",
  },
  {
    title: "Christmas Wish-List",
    description:
      "A family wish-list app where everyone adds their list, sees each other's, and no one buys the same gift twice. Keeps Christmas running.",
    category: "client",
    techTags: "Next.js, Prisma, SQLite, Admin",
    featured: true,
    order: 3,
    liveUrl: "https://christmas.jewellcore.com",
  },
  {
    title: "Family Adventures",
    description:
      "A shared log for family outings \u2014 the trails, the trips, the detours. A living scrapbook the whole crew can add to.",
    category: "client",
    techTags: "Next.js, Tailwind, SQLite",
    featured: true,
    order: 4,
    liveUrl: "https://adventures.jewellcore.com",
  },
  {
    title: "Vortex",
    description:
      "A homelab experiment in networked chaos \u2014 a playground service for testing proxies, routing, and self-hosted edge tricks.",
    category: "homelab",
    techTags: "Docker, Traefik, Cloudflare Tunnel",
    featured: false,
    order: 5,
    liveUrl: "https://vortex.jewellcore.com",
  },
  {
    title: "Shotgun Seat Squad",
    description:
      "A crew road-trip tracker \u2014 next-up shotgun rotations, music royalties, and snack duty scheduling for long hauls.",
    category: "experiment",
    techTags: "Next.js, Tailwind, SQLite",
    featured: false,
    order: 6,
    liveUrl: "https://shotgun.jewellcore.com",
  },
  {
    title: "The Golden Ticket",
    description:
      "A tiny app for big rewards \u2014 scratch-and-win style giveaways for the grandkids, because Easter should have drama.",
    category: "experiment",
    techTags: "Vanilla JS, HTML, CSS",
    featured: false,
    order: 7,
    liveUrl: "https://goldenticket.jewellcore.com",
  },
  {
    title: "AnythingLLM Study Assistant",
    description:
      "Study notes plugged into a self-hosted LLM. Ask your own documents questions; get passable answers before the test. Runs entirely on the home rig.",
    category: "homelab",
    techTags: "Ollama, AnythingLLM, Docker",
    featured: false,
    order: 8,
    liveUrl: "https://study.jewellcore.com",
  },
  {
    title: "StudyStation",
    description:
      "A coursework tracker that syncs assignments from a school portal into Postgres every night. Keeps every due date in one place, automatically.",
    category: "homelab",
    techTags: "Python, Postgres, Cron, Docker",
    featured: false,
    order: 9,
    liveUrl: "https://studystation.jewellcore.com",
  },
  {
    title: "LaunchBase",
    description:
      "The runbook and control panel behind the jewellcore.com homelab \u2014 how every site goes from code to live through Coolify and Cloudflare.",
    category: "homelab",
    techTags: "Coolify, Cloudflare, Docker, Traefik",
    featured: false,
    order: 10,
    liveUrl: "https://launch.jewellcore.com",
  },
  {
    title: "Next \u2014 AI News",
    description:
      "Hourly AI news digest scraped from 20+ sources, curated with business ideas and model releases. Built to run on the homelab.",
    category: "experiment",
    techTags: "Next.js, Python, Cron, SQLite",
    featured: false,
    order: 11,
    liveUrl: "https://next.jewellcore.com",
  },
  {
    title: "Tornado Explorers",
    description:
      "An interactive learning site about tornadoes and Tornado Alley \u2014 real-time radar, safety guides, and storm chasing history.",
    category: "experiment",
    techTags: "Next.js, Three.js, GSAP, Weather API",
    featured: false,
    order: 12,
    liveUrl: "https://twister.jewellcore.com",
  },
  {
    title: "YMCA Checklist",
    description:
      "A simple checklist for a visit to the YMCA \u2014 packing lists, schedules, and quick history of past trips.",
    category: "client",
    techTags: "Next.js, Tailwind, SQLite",
    featured: false,
    order: 13,
    liveUrl: "https://ymca.jewellcore.com",
  },
  {
    title: "JewellCore Icon Gallery",
    description:
      "Self-hosted dashboard-icons mirror. Browse and copy SVG URLs for 2000+ icon sets. Built for the homelab toolbox.",
    category: "homelab",
    techTags: "Next.js, Tailwind, Docker",
    featured: false,
    order: 14,
    liveUrl: "https://icons.jewellcore.com",
  },
  {
    title: "The Grid",
    description:
      "Personal interactive portfolio \u2014 a 3D WebGL experience mapping JJ's projects, stack, and contact. Runs on the homelab.",
    category: "homelab",
    techTags: "Next.js, React Three Fiber, GSAP, Tailwind",
    featured: false,
    order: 15,
    liveUrl: "https://jj.jewellcore.com",
  },
  {
    title: "JJ World \u2014 Digital Forge",
    description:
      "Immersive 3D portfolio showcasing shipped projects from the homelab: Vortex, PickFlick, Christmas Wish-List, Family Adventures, AnythingLLM, and more.",
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
            "A clean WordPress or static site with hosting setup. Best for a business that needs to look legit, fast.",
          order: 1,
        },
        {
          name: "Custom web app",
          rangeLow: 2500,
          rangeHigh: 8000,
          description:
            "A real app with custom logic \u2014 bookings, member areas, admin tools \u2014 built on modern tech and self-hosted.",
          order: 2,
        },
        {
          name: "Hosting & management retainer",
          rangeLow: 50,
          rangeHigh: 250,
          description:
            "Monthly hosting, updates, backups, and someone who answers when it breaks. Per month.",
          order: 3,
        },
      ],
    });
  }

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteTitle: "JJ Jewell \u2014 Jewellcore",
      tagline: "Builder, tinkerer, rabbit in a snapback.",
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