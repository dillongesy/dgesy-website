"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Github, Linkedin, MapPin } from "lucide-react";

const socials = [
  {
    icon: Github,
    href: "https://github.com/dillongesy",
    label: "GitHub",
    color: "hover:text-slate-100 hover:border-slate-400/30 hover:bg-white/5",
  },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/dillon-gesy",
    label: "LinkedIn",
    color: "hover:text-blue-300 hover:border-blue-500/30 hover:bg-blue-500/10",
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

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" ref={ref} className="section-padding px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            Contact
          </span>
          <span className="flex-1 h-px bg-white/[0.06]" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
        >
          Get in <span className="text-indigo-400">touch</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={2}
          className="text-slate-400 max-w-xl mb-12 leading-relaxed"
        >
          Email is the best way to reach me. I check it regularly and will get back to you.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={3}
          className="space-y-6"
        >
          <a
            href="mailto:dillon.gesy@yahoo.com"
            className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-indigo-500/20 hover:bg-indigo-500/[0.03] transition-all group w-fit"
          >
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15 group-hover:bg-indigo-500/20 transition-all">
              <Mail size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Email</p>
              <p className="text-slate-100 font-medium text-lg">dillon.gesy@yahoo.com</p>
            </div>
          </a>

          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <MapPin size={14} className="text-indigo-400" />
            Iowa
          </div>

          <div>
            <p className="text-xs font-mono tracking-widest text-slate-600 uppercase mb-3">
              Also on
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] text-slate-500 transition-all ${color}`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
