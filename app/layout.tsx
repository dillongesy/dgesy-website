import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollbarHover from "./components/ScrollbarHover";
import Nav from "./components/Nav";
import SiteBackground from "./components/SiteBackground";
import Footer from "./components/Footer";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#030712] text-slate-100 overflow-x-hidden min-h-screen flex flex-col`}
      >
        <ScrollbarHover />

        {/* Global page background — grid + particles (hidden on /experimental) */}
        <SiteBackground />

        <Nav />
        {/* overflow-clip: the hero orb's canvas is CANVAS_SCALE x its box so
            explosions aren't cut off, but it hangs past the footer and made the
            home page scroll into empty space. Clip (not hidden) doesn't create a
            scroll container, so long pages still scroll and the fixed nav is untouched. */}
        <div className="flex-1 flex flex-col overflow-clip">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
