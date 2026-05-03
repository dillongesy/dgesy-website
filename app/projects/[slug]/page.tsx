import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Github, ExternalLink, Smartphone, Play } from "lucide-react";
import ScreenshotGallery from "../ScreenshotGallery";
import { projects } from "../data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};
  return { title: `${project.title} - Dillon Gesy` };
}

const statusStyle: Record<string, string> = {
  Production: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  Active:     "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  Archived:   "text-slate-400 border-slate-500/30 bg-slate-500/10",
  Academic:   "text-amber-400 border-amber-500/30 bg-amber-500/10",
};

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h2 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">{title}</h2>
      <p className="text-slate-300 leading-relaxed">{children}</p>
    </div>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <main className="pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-400 transition-colors mb-10"
        >
          <ArrowLeft size={15} />
          All projects
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle[project.status]}`}>
              {project.status}
            </span>
            <span className="text-xs font-mono text-slate-600">{project.year}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-3">
            {project.title}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">{project.tagline}</p>
        </div>

        {/* Store / link buttons */}
        {(project.appStore || project.playStore || project.github || project.live) && (
          <div className="flex flex-wrap gap-3 mb-8">
            {project.appStore && (
              <a
                href={project.appStore}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm font-medium hover:border-white/30 transition-all"
              >
                <Smartphone size={15} />
                App Store
              </a>
            )}
            {project.playStore && (
              <a
                href={project.playStore}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black border border-white/15 text-white text-sm font-medium hover:border-white/30 transition-all"
              >
                <Play size={13} fill="currentColor" />
                Google Play
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 text-sm font-medium hover:bg-white/[0.06] transition-all"
              >
                <Github size={15} />
                GitHub
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 text-sm font-medium hover:bg-white/[0.06] transition-all"
              >
                <ExternalLink size={15} />
                Live
              </a>
            )}
          </div>
        )}

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2 mb-12">
          {project.tech.map((t) => (
            <span
              key={t}
              className="px-3 py-1.5 text-xs font-mono rounded-lg bg-indigo-500/8 border border-indigo-500/20 text-indigo-400"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Screenshots */}
        {project.screenshots.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
              Screenshots
            </h2>
            <ScreenshotGallery screenshots={project.screenshots} />
          </div>
        )}

        {/* Retrospective */}
        <div className="space-y-8">
          <div className="h-px bg-white/[0.05]" />

          <Section title="Overview">{project.retrospective.overview}</Section>
          <div className="h-px bg-white/[0.04]" />
          <Section title="Challenges">{project.retrospective.challenges}</Section>
          <div className="h-px bg-white/[0.04]" />
          <Section title="What I learned">{project.retrospective.learnings}</Section>

          {project.retrospective.outcome && (
            <>
              <div className="h-px bg-white/[0.04]" />
              <Section title="Outcome">{project.retrospective.outcome}</Section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
