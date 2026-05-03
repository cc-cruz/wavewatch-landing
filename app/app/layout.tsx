import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WaveWatch App | Your Ocean Briefing",
  description:
    "Your elite ocean briefing number, tuned to your spots, rituals, and water life.",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

