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
        {children}
        <Footer />
      </body>
    </html>
  );
}
