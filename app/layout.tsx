import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "../components/nav/sidebar";
import { caveat, fraunces, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeAllHateLife!",
  description: "A self-hosted life, kept by whichever AI you already run.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${caveat.variable} ${inter.variable}`}>
      <body>
        <div className="app-shell">
          <Sidebar />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
