"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, MapPin, Copy, Check, ArrowUpRight } from "lucide-react";
import { Github, Linkedin } from "./BrandIcons";

const EMAIL = "dillon.gesy@yahoo.com";

const socials = [
  {
    icon: Github,
    href: "https://github.com/dillongesy",
    label: "GitHub",
    handle: "@dillongesy",
    color: "hover:border-slate-400/40 hover:bg-white/[0.04]",
    iconColor: "group-hover/social:text-slate-100",
  },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/dillon-gesy",
    label: "LinkedIn",
    handle: "dillon-gesy",
    color: "hover:border-blue-500/40 hover:bg-blue-500/[0.06]",
    iconColor: "group-hover/social:text-blue-300",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the mailto link still works */
    }
  };

  return (
    <section id="contact" ref={ref} className="section-padding px-6">
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="text-center"
        >
          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Get in touch
          </h2>
          <p className="mt-4 text-slate-400 leading-relaxed max-w-md mx-auto">
            Email is the best way to reach me - I check it regularly and always
            reply.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.02]"
        >
          <div className="p-5 sm:p-7 space-y-4">
            {/* Email row */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <a
                href={`mailto:${EMAIL}`}
                className="group flex items-center gap-4 min-w-0 flex-1"
              >
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/15 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                  <Mail size={20} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">
                    Email
                  </p>
                  <p className="text-slate-100 font-medium text-base sm:text-lg truncate group-hover:text-indigo-300 transition-colors">
                    {EMAIL}
                  </p>
                </div>
              </a>
              <button
                onClick={copyEmail}
                aria-label="Copy email address"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs font-medium text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Socials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socials.map(({ icon: Icon, href, label, handle, color, iconColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group/social flex items-center gap-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-colors ${color}`}
                >
                  <Icon
                    size={20}
                    className={`text-slate-400 transition-colors ${iconColor}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200">{label}</p>
                    <p className="text-xs text-slate-500 truncate">{handle}</p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-slate-600 group-hover/social:text-slate-300 transition-colors shrink-0"
                  />
                </a>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-sm text-slate-500">
              <MapPin size={14} className="text-indigo-400" />
              Based in Iowa
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
