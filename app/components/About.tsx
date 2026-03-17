"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Sparkles, GraduationCap, BookOpen } from "lucide-react";
import { personal, stats, education } from "../data/portfolio";

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={sectionRef} className="section-padding px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            01. About
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
          A bit <span className="gradient-text">about me</span>
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Avatar + bio */}
          <div className="space-y-6">
            {/* Avatar card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={2}
              className="relative w-48 h-48"
            >
              {/* Animated ring */}
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #818cf8, #22d3ee, #a78bfa, #818cf8)",
                  backgroundSize: "300% 300%",
                  animation: "shimmer 4s linear infinite",
                  padding: "2px",
                  borderRadius: "16px",
                }}
              >
                <div className="w-full h-full rounded-[14px] bg-[#0f172a] flex items-center justify-center">
                  {/* Placeholder avatar — swap with <Image> once you have a photo */}
                  <div className="text-6xl font-black gradient-text select-none">
                    {personal.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bio */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={3}
              className="space-y-4 text-slate-400 leading-relaxed"
            >
              <p>
                Hey! I&apos;m <strong className="text-slate-100">{personal.name}</strong> - a {personal.title} based in{" "}
                {personal.location}. I graduated from Iowa State University with a 3.63 GPA and have been building
                production software ever since.
              </p>
              <p>
                I thrive working across the full stack - from serverless AWS architectures to pixel-perfect
                React UIs to embedded C++ systems. When I&apos;m not shipping, I&apos;m{" "}
                <span className="text-cyan-400">over-engineering my side projects</span>.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={14} className="text-indigo-400" />
                {personal.location}
              </div>
            </motion.div>

            {/* Fun facts */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={4}
              className="flex flex-wrap gap-2"
            >
              {[
                "IT Network Engineer",
                "React Native · iOS & Android",
                "AWS Serverless",
                "Bot Creator",
                "Embedded C++",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.07] bg-white/[0.03] text-slate-400"
                >
                  <Sparkles size={10} className="text-indigo-400" />
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i + 3}
                className="gradient-border rounded-2xl p-6 group hover:scale-[1.02] transition-transform"
              >
                <div className="text-4xl font-black gradient-text mb-2">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}

            {/* Education card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={7}
              className="col-span-2 rounded-2xl p-5 border border-indigo-500/15 bg-indigo-500/[0.04]"
            >
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap size={15} className="text-indigo-400" />
                <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase">
                  Education
                </p>
              </div>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-slate-100 font-semibold text-sm">{education.degree}</p>
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                    <BookOpen size={11} className="text-slate-500" />
                    {education.minor}
                  </p>
                  <p className="text-indigo-300 text-sm font-medium mt-1">{education.school}</p>
                </div>
                <div className="text-right text-xs text-slate-500 flex-shrink-0">
                  <p>{education.period}</p>
                  <p className="text-emerald-400 font-bold text-sm mt-1">GPA {education.gpa}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
