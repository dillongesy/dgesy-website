import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Markdown journal posts live in /content/blog/*.md and are read at build time
// (this site is a static export, so everything is resolved during `next build`).

export type PostMeta = {
  slug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  excerpt: string;
  tags: string[];
  readingMinutes: number;
};

export type Post = PostMeta & { content: string };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

type RawPost = Post & { draft: boolean };

function readAll(): RawPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const words = content.trim().split(/\s+/).length;

      return {
        slug,
        title: String(data.title ?? slug),
        date: String(data.date ?? "1970-01-01"),
        excerpt: String(data.excerpt ?? ""),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        readingMinutes: Math.max(1, Math.round(words / 200)),
        draft: Boolean(data.draft),
        content,
      };
    })
    .filter((p) => process.env.NODE_ENV === "development" || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPosts(): PostMeta[] {
  return readAll().map(({ content: _content, ...meta }) => meta);
}

export function getPost(slug: string): Post | undefined {
  return readAll().find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return readAll().map((p) => p.slug);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
