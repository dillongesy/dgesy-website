"use client";

import { useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Star, ArrowRight } from "lucide-react";
import { Github } from "./BrandIcons";
import { projects, type ProjectDetail } from "../projects/data";

function TiltCard({ project, i }: { project: ProjectDetail; i: number }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  // Card art comes from `cardImage` in data.ts. If the file isn't there the
  // card just renders clean rather than showing a broken image.
  const [artFailed, setArtFailed] = useState(false);
  const cardArt = artFailed ? undefined : project.cardImage;

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    setTransform(`perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`);
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const onMouseLeave = () => {
    setTransform("rotateX(0deg) rotateY(0deg) scale3d(1,1,1)");
    setGlowPos({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay: i * 0.1 },
        },
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={() => router.push(`/projects/${project.slug}`)}
      style={{ transform, transition: "transform 0.15s ease-out", cursor: "pointer" }}
      className="group relative w-full rounded-2xl border border-white/[0.07] bg-[#0a0f1e] overflow-hidden flex flex-col"
    >
      {/* Card art. Two copies of the same image share one opacity wrapper: a
          sharp base, and a blurred copy on top masked to a soft ellipse over
          the text column. Because the blurred copy is fully opaque inside the
          mask it replaces the sharp one rather than stacking with it, so the
          only visible effect is that the middle goes soft. The mask fades out
          well before the edges, so there is no rectangle - the art stays crisp
          in the corners and blurs only where the copy sits. */}
      {cardArt && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardArt}
              alt=""
              onError={() => setArtFailed(true)}
              className="h-full w-full object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardArt}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-[6px]"
              style={{
                maskImage:
                  "radial-gradient(ellipse 70% 56% at 50% 52%, #000 40%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 70% 56% at 50% 52%, #000 40%, transparent 100%)",
              }}
            />
          </div>
          {/* Scrim ramps up toward the bottom, where the copy and chips get
              dense. Keep it light up top or the art disappears entirely. */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1e]/35 via-[#0a0f1e]/60 to-[#0a0f1e]/85" />
        </div>
      )}

      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, rgba(99,102,241,0.12) 0%, transparent 60%)`,
        }}
      />

      <div className="relative h-[20px] w-full bg-indigo-500/40" />

      <div className="relative p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {project.featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Star size={9} fill="currentColor" />
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
            )}
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
                onClick={(e) => e.stopPropagation()}
                aria-label="Live demo"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mb-2">
          {project.title}
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-2 mb-5">
          {project.tech.slice(0, 5).map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400"
            >
              {t}
            </span>
          ))}
          {project.tech.length > 5 && (
            <span className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-600">
              +{project.tech.length - 5}
            </span>
          )}
        </div>

        {/* Detail link */}
        <Link
          href={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Read more
          <ArrowRight size={12} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });

  // Featured first, everything else after - one flat list feeding one grid.
  const ordered = [
    ...projects.filter((p) => p.featured),
    ...projects.filter((p) => !p.featured),
  ];

  return (
    <section id="projects" ref={ref} className="pb-10 md:pb-16 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            Projects
          </span>
          <span className="flex-1 h-px bg-white/[0.06]" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
        >
          Things I&apos;ve built
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-400 mb-12 sm:whitespace-nowrap"
        >
          Some are side projects, some are production systems. Click any card to read the full story.
        </motion.p>

        {/* One centered flex row rather than two grids. A grid leaves the odd
            card stranded in a half-width column; flex-wrap with justify-center
            keeps every row balanced no matter how many projects there are.
            Featured lead, so the top row is the strongest work. */}
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex flex-wrap justify-center gap-5"
        >
          {ordered.map((p, i) => (
            <div
              key={p.slug}
              className="flex w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
            >
              <TiltCard project={p} i={i} />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
