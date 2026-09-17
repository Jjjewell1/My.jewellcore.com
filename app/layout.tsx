import type { Metadata } from "next";
import HopperStage from "../components/HopperStage";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://jjs.jewellcore.com"),
  title: "JJ Jewell — Web Development & Hosting | Jewellcore",
  description:
    "Independent web developer and systems builder. JJ Jewell designs, builds, and hosts websites and custom applications on his own self-managed infrastructure — considered work, delivered directly, with no middlemen.",
  openGraph: {
    title: "JJ Jewell — Web Development & Hosting | Jewellcore",
    description:
      "Websites, hosting, and infrastructure — designed, built, and maintained in-house on self-managed servers.",
    url: "https://jjs.jewellcore.com",
    siteName: "Jewellcore",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-void">
      <body className="bg-void text-paper antialiased">{children}<HopperStage /></body>
    </html>
  );
}