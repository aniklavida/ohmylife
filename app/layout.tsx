import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "../components/nav/sidebar";
import { resolveLifeRoot } from "../lib/index/runtime";
import { getActiveTheme } from "../lib/theme/load";
import { serializeThemeCss } from "../lib/theme/resolve";
import { caveat, fraunces, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeAllHateLife!",
  description: "A self-hosted life, kept by whichever AI you already run.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const lifeRoot = resolveLifeRoot();
  const theme = getActiveTheme(lifeRoot);
  const themeCss = serializeThemeCss(theme);

  return (
    <html lang="en" className={`${fraunces.variable} ${caveat.variable} ${inter.variable}`}>
      <head>
        <style id="theme-tokens" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
