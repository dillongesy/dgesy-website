"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, GraduationCap, BookOpen } from "lucide-react";

const stats = [
  { label: "Years Coding",  value: 5,  suffix: "+" },
  { label: "Apps Shipped",  value: 6,  suffix: "+" },
  { label: "Technologies",  value: 20, suffix: "+" },
  { label: "Active Users",  value: 50, suffix: "+" },
];

const education = {
  school: "Iowa State University",
  degree: "Bachelor of Science in Software Engineering",
  minor: "Minor in Mathematics",
  period: "Aug 2020 - May 2024",
  location: "Ames, IA",
  gpa: "3.63 / 4.0",
};

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
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            About
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
          A bit <span className="text-indigo-400">about me</span>
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={2}
              className="relative w-48 h-48"
            >
              <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/30 p-[2px]">
                <div className="w-full h-full rounded-[14px] bg-[#0f172a] flex items-center justify-center">
                  <div className="text-6xl font-black text-indigo-400 select-none">
                    DG
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={3}
              className="space-y-4 text-slate-400 leading-relaxed"
            >
              <p>
                I grew up in Iowa and studied Software Engineering at Iowa State, graduating in 2024
                with a 3.63 GPA. Since then I&apos;ve been doing full-stack development and network
                engineering at Advanced Communication Services, a local IT company in Western Iowa.
              </p>
              <p>
                I work across a lot of layers - React Native and Next.js on the front, AWS Lambda
                and RDS on the back, Android and embedded C++ when the job calls for it. Outside of
                work, I host an overengineered homelab (like this website!) for app development, experiments, 
                and more.
              </p>
              <p>
                Outside of software engineering, I'm a full-time IT Engineer setting up enterprise networks with 
                VLANs, TLANs, and standard cyber security practices. I have experience with Ubiquiti, SonicWall, and 
                Meraki products. The types of offices you may catch me in (but not limited to) are dentistries, 
                insurance offices, agriculture offices, and various government agencies.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={14} className="text-indigo-400" />
                Iowa
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              custom={4}
              className="flex flex-wrap gap-2"
            >
              {[
                "IT Network Engineer",
                "Full Stack Software Engineer",
                "React Native / iOS & Android",
                "AWS Services"
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-white/[0.07] bg-white/[0.03] text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i + 3}
                className="rounded-2xl p-6 border border-cyan-500/40 bg-[#0f172a] group hover:scale-[1.02] transition-transform"
              >
                <div className="text-4xl font-black text-indigo-400 mb-2">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}

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
