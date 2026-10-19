import type { MetadataRoute } from "next";
import { projects } from "./projects/data";
import { SITE_URL } from "./lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // trailing slashes match next.config's trailingSlash, so these are the canonical URLs
  const pages = ["/", "/about/", "/experience/", "/projects/", "/contact/", "/experimental/"];
  return [
    ...pages.map((path) => ({
      url: `${SITE_URL}${path}`,
      priority: path === "/" ? 1 : 0.8,
    })),
    ...projects.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}/`,
      priority: 0.6,
    })),
  ];
}
