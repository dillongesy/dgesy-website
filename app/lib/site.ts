// Single place for the facts that show up in link previews, the sitemap and
// search-engine structured data, so they can't drift apart.
export const SITE_URL = "https://dgesy.org";
export const SITE_NAME = "Dillon Gesy";
export const SITE_TITLE = "Dillon Gesy - Software Engineer";
export const SITE_DESCRIPTION =
  "Software and IT engineer based in Iowa. Mobile apps, cloud backends, web portals, and network infrastructure.";

// Link-preview card, generated at build time by app/og.png/route.tsx
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Dillon Gesy - Software Engineer",
};

/**
 * Per-page metadata. Next merges metadata shallowly, so a page that sets its own
 * `openGraph` replaces the root one wholesale — this rebuilds the shared fields
 * each time so every page keeps the site name, type and preview card.
 */
export function pageMetadata(title: string, description: string, path: string) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website" as const,
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image" as const, title, description, images: [OG_IMAGE] },
  };
}
