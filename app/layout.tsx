import type { Metadata } from "next";
import type { ReactNode } from "react";
import { caveat, fraunces, inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "OhMyLife",
  description: "A self-hosted life, kept by whichever AI you already run.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${caveat.variable} ${inter.variable}`}>
      <body>
        <main className="app-main">{children}</main>
      </body>
    </html>
  );
}
