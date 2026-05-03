"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Code2, Layers, Wrench, Cloud, Globe, type LucideIcon,
} from "lucide-react";

type SkillCategory = "Language" | "Framework" | "Tool" | "Cloud";

interface Skill {
  name: string;
  category: SkillCategory;
  level: number;
}

const skills: Skill[] = [
  { name: "JavaScript",     category: "Language",  level: 5 },
  { name: "TypeScript",     category: "Language",  level: 4 },
  { name: "Java",           category: "Language",  level: 4 },
  { name: "SQL",            category: "Language",  level: 4 },
  { name: "C / C++",        category: "Language",  level: 3 },
  { name: "C#",             category: "Language",  level: 3 },
  { name: "HTML / CSS",     category: "Language",  level: 5 },
  { name: "React",          category: "Framework", level: 5 },
  { name: "Next.js",        category: "Framework", level: 5 },
  { name: "React Native",   category: "Framework", level: 5 },
  { name: "Node.js",        category: "Framework", level: 4 },
  { name: "Tailwind CSS",   category: "Framework", level: 5 },
  { name: "Spring Boot",    category: "Framework", level: 3 },
  { name: ".NET MAUI",      category: "Framework", level: 3 },
  { name: "Git / GitLab",   category: "Tool",      level: 5 },
  { name: "Android Studio", category: "Tool",      level: 4 },
  { name: "SQLite",         category: "Tool",      level: 4 },
  { name: "Postman",        category: "Tool",      level: 4 },
  { name: "VS Code",        category: "Tool",      level: 5 },
  { name: "AWS Lambda",     category: "Cloud",     level: 4 },
  { name: "AWS Cognito",    category: "Cloud",     level: 4 },
  { name: "AWS RDS",        category: "Cloud",     level: 4 },
  { name: "Vercel",         category: "Cloud",     level: 5 },
];

type Filter = "All" | SkillCategory;
const FILTERS: Filter[] = ["All", "Language", "Framework", "Tool", "Cloud"];

const categoryColor: Record<SkillCategory, string> = {
  Language:  "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  Framework: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  Tool:      "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Cloud:     "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

const categoryIcon: Record<SkillCategory, LucideIcon> = {
  Language:  Code2,
  Framework: Layers,
  Tool:      Wrench,
  Cloud:     Cloud,
};

function CategoryIcon({ category, size = 12 }: { category: SkillCategory; size?: number }) {
  const Icon = categoryIcon[category];
  return <Icon size={size} className="inline mr-1.5" />;
}

function SkillBar({ level }: { level: number }) {
  return (
    <div className="flex gap-1 mt-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-500"
          style={{
            background: i < level ? "#818cf8" : "rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06 },
  }),
};

export default function Skills() {
  const [active, setActive] = useState<Filter>("All");
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const filtered = active === "All" ? skills : skills.filter((s) => s.category === active);

  return (
    <section id="skills" ref={ref} className="section-padding px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            Skills
          </span>
          <span className="flex-1 h-px bg-white/[0.06]" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8"
        >
          My <span className="text-indigo-400">tech stack</span>
        </motion.h2>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={2}
          className="flex flex-wrap gap-2 mb-10"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                active === f
                  ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                  : "bg-white/[0.02] border-white/[0.07] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
              }`}
            >
              {f === "All"
                ? <Globe size={12} className="inline mr-1.5" />
                : <CategoryIcon category={f as SkillCategory} />
              }
              {f}
            </button>
          ))}
        </motion.div>

        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          {filtered.map((skill, i) => {
            const Icon = categoryIcon[skill.category];
            return (
              <motion.div
                key={skill.name}
                layout
                variants={fadeUp}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i + 3}
                whileHover={{ scale: 1.04, y: -4 }}
                className="group relative rounded-2xl p-4 border border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all cursor-default"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ boxShadow: "0 0 20px rgba(129,140,248,0.08)" }}
                />

                <Icon
                  size={20}
                  className="text-slate-500 group-hover:text-indigo-400 transition-colors mb-2"
                />
                <p className="text-sm font-semibold text-slate-200 leading-tight">
                  {skill.name}
                </p>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryColor[skill.category]}`}
                >
                  {skill.category}
                </span>
                <SkillBar level={skill.level} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
