"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Briefcase, Calendar, MapPin } from "lucide-react";
import { experience } from "../data/portfolio";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15 },
  }),
};

export default function Experience() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" ref={ref} className="section-padding px-6">
      <div className="max-w-4xl mx-auto">
        {/* Label */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            03. Experience
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-14"
        >
          Where I&apos;ve <span className="gradient-text">worked</span>
        </motion.h2>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-cyan-500/20 to-transparent" />

          <div className="space-y-12">
            {experience.map((job, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={`${job.company}-${i}`}
                  variants={fadeUp}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  custom={i + 2}
                  className={`relative flex flex-col md:flex-row gap-8 md:gap-0 pl-12 md:pl-0 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-6 w-8 h-8 rounded-full border-2 border-indigo-500/50 bg-[#030712] flex items-center justify-center z-10"
                    style={{ boxShadow: "0 0 16px rgba(99,102,241,0.4)" }}
                  >
                    <Briefcase size={14} className="text-indigo-400" />
                  </div>

                  {/* Card */}
                  <div className={`md:w-[calc(50%-2rem)] ${isEven ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}>
                    <div className="group rounded-2xl p-6 border border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/20 hover:bg-indigo-500/[0.03] transition-all">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {job.role}
                          </h3>
                          <p className="text-indigo-400 font-semibold text-sm">{job.company}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
                          <Calendar size={11} />
                          <span>{job.period}</span>
                          <span className="text-slate-700">·</span>
                          <MapPin size={11} />
                          <span>{job.location}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-white/[0.05] mb-4" />

                      {/* Bullets */}
                      <ul className="space-y-2">
                        {job.bullets.map((b, j) => (
                          <li key={j} className="flex gap-3 text-slate-400 text-sm leading-relaxed">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/60 flex-shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>

                      {/* Tech tags */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {job.tech.map((t) => (
                          <span
                            key={t}
                            className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-indigo-500/8 text-indigo-400 border border-indigo-500/15"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
