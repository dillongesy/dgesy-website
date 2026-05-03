import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollbarHover from "./components/ScrollbarHover";
import Nav from "./components/Nav";
import ParticleCanvas from "./components/ParticleCanvas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dillon Gesy - Software Engineer",
  description: "Personal site of Dillon Gesy - software and IT engineer based in Iowa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#030712] text-slate-100 overflow-x-hidden`}
      >
        <ScrollbarHover />

        {/* Global page background — grid + particles */}
        <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <ParticleCanvas />
        </div>

        <Nav />
        {children}
        <footer className="py-10 px-6 border-t border-white/[0.04] text-center">
          <p className="text-sm text-slate-600 font-mono">
            Built by{" "}
            <span className="text-indigo-400">Dillon Gesy</span>
            {" - "}
            <span className="text-slate-700">{new Date().getFullYear()}</span>
          </p>
        </footer>
      </body>
    </html>
  );
}
