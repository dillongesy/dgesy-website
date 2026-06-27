import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPost, getAllSlugs, formatDate } from "../lib";
import VineBackground from "../../components/VineBackground";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Dillon Gesy`,
    description: post.excerpt,
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="relative pt-28 pb-24 px-6">
      {/* Calm, static experimental backdrop — grows once, then holds still */}
      <VineBackground loop={false} laneCount={2} opacity={0.32} />
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_35%,#020806_92%)]"
        aria-hidden="true"
      />

      <article className="max-w-2xl mx-auto">
        <Link
          href="/experimental"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-400 transition-colors mb-10"
        >
          <ArrowLeft size={15} />
          Back to Experimental
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mb-4">
            <CalendarDays size={12} />
            {formatDate(post.date)}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[1.1]">
            {post.title}
          </h1>
        </header>

        <div className="prose-blog">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
}
