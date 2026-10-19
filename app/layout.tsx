import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollbarHover from "./components/ScrollbarHover";
import Nav from "./components/Nav";
import SiteBackground from "./components/SiteBackground";
import Footer from "./components/Footer";
import MotionPreferences from "./components/MotionPreferences";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, OG_IMAGE } from "./lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// Tells search engines who the site is about, so a search for the name can show
// the site with its GitHub/LinkedIn attached. Not rendered on the page.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/me.JPG`,
  jobTitle: "Software Engineer",
  description: SITE_DESCRIPTION,
  address: { "@type": "PostalAddress", addressRegion: "IA", addressCountry: "US" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Iowa State University" },
  sameAs: ["https://github.com/dillongesy", "https://www.linkedin.com/in/dillon-gesy"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <ScrollbarHover />

        {/* Global page background — grid + particles (hidden on /experimental) */}
        <SiteBackground />

        <MotionPreferences>
          <Nav />
          {/* overflow-clip: the hero orb's canvas is CANVAS_SCALE x its box so
              explosions aren't cut off, but it hangs past the footer and made the
              home page scroll into empty space. Clip (not hidden) doesn't create a
              scroll container, so long pages still scroll and the fixed nav is untouched. */}
          <div className="flex-1 flex flex-col overflow-clip">
            {children}
            <Footer />
          </div>
        </MotionPreferences>
      </body>
    </html>
  );
}
