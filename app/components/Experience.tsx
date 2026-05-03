"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";

interface Job {
  company: string;
  role: string;
  period: string;
  location: string;
  logo?: string;
  bullets: string[];
  tech: string[];
}

const experience: Job[] = [
  {
    company: "Advanced Communication Services, LLC",
    role: "IT Network Engineer & Full Stack Developer",
    period: "Sept 2024 - Present",
    location: "Manilla, IA",
    logo: "/companies/acs-logo.png", //undefined, // drop logo at /public/companies/acs-logo.png and set to "/companies/acs-logo.png"
    bullets: [
      "Maintain IT infrastructure for 100+ clients - networking hardware, camera systems, and custom software.",
      "Built a cross-platform mobile ordering app (iOS/Android) for a local restaurant using React Native, with AWS Cognito auth and Square for payments.",
      "Designed the serverless backend on AWS (Lambda, API Gateway, RDS) including a full loyalty rewards system.",
      "Built a Next.js admin portal so non-technical staff can manage menus, hours, and push notifications without touching code.",
      "Developed inventory management tools for internal use and client deployments.",
    ],
    tech: ["React Native", "Next.js", "AWS", "Square API", "Firebase FCM", "SQL"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

export default function Experience() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" ref={ref} className="section-padding px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            Experience
          </span>
          <span className="flex-1 h-px bg-white/[0.06]" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-14"
        >
          Where I&apos;ve <span className="text-indigo-400">worked</span>
        </motion.h2>

        <div className="space-y-6">
          {experience.map((job, i) => (
            <motion.div
              key={job.company}
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={i + 2}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
            >
              {/* Card header */}
              <div className="p-7 pb-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  {/* Left: company info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                        Current
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-1">{job.company}</h3>
                    <p className="text-indigo-400 font-medium">{job.role}</p>
                  </div>

                  {/* Right: logo + date/location */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    {/* Logo */}
                    <div className="w-16 h-16 rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden flex items-center justify-center">
                      {job.logo ? (
                        <Image
                          src={job.logo}
                          alt={`${job.company} logo`}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-[9px] text-slate-700 font-mono text-center leading-tight px-1">
                          logo
                        </span>
                      )}
                    </div>

                    {/* Date / location */}
                    <div className="flex flex-col items-end gap-1.5 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {job.period}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {job.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/[0.05] mb-6" />

                {/* Bullets in two-column grid */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {job.bullets.map((b, j) => (
                    <li key={j} className="flex gap-3 text-slate-400 text-sm leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500/60 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech footer */}
              <div className="px-7 py-4 border-t border-white/[0.05] bg-white/[0.01] flex flex-wrap gap-2">
                {job.tech.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-lg bg-indigo-500/8 text-indigo-400 border border-indigo-500/15"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
