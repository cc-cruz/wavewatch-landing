import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WaveWatch | Forecast Agent Console",
  description:
    "WaveWatch is the app layer around a deployed marine forecast agent, combining live conversations, cron management, delivery visibility, and operator controls.",
};

export default function ConsoleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
