"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Github, Linkedin, Twitter, Send, CheckCircle2, MapPin } from "lucide-react";
import { personal } from "../data/portfolio";

const socials = [
  { icon: Github,   href: personal.github,   label: "GitHub",   color: "hover:text-slate-100 hover:border-slate-400/30 hover:bg-white/5" },
  { icon: Linkedin, href: personal.linkedin,  label: "LinkedIn", color: "hover:text-blue-300 hover:border-blue-500/30 hover:bg-blue-500/10" },
  { icon: Mail,     href: `mailto:${personal.email}`, label: "Email", color: "hover:text-indigo-300 hover:border-indigo-500/30 hover:bg-indigo-500/10" },
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

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Compose mailto link
    const subject = encodeURIComponent(`Message from ${form.name}`);
    const body = encodeURIComponent(`From: ${form.name} <${form.email}>\n\n${form.message}`);
    window.open(`mailto:${personal.email}?subject=${subject}&body=${body}`);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" ref={ref} className="section-padding px-6">
      <div className="max-w-5xl mx-auto">
        {/* Label */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={0}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-xs font-mono tracking-widest text-indigo-400 uppercase">
            05. Contact
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-indigo-500/30 to-transparent" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={1}
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
        >
          Let&apos;s <span className="gradient-text">work together</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={2}
          className="text-slate-400 max-w-xl mb-14"
        >
          Have a question, a project idea, or just want to say hi? My inbox is always open.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form */}
          <motion.form
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            custom={3}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/40 focus:bg-indigo-500/5 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/40 focus:bg-indigo-500/5 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Message
              </label>
              <textarea
                required
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={5}
                placeholder="Tell me about your project..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500/40 focus:bg-indigo-500/5 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{
                background: submitted
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #6366f1, #06b6d4)",
                boxShadow: "0 0 30px rgba(99,102,241,0.25)",
              }}
            >
              {submitted ? (
                <>
                  <CheckCircle2 size={16} />
                  Message sent!
                </>
              ) : (
                <>
                  Send Message
                  <Send size={15} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </motion.form>

          {/* Right side info */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            custom={4}
            className="space-y-8"
          >

            {/* Location */}
            <div className="flex items-center gap-3 text-slate-400 text-sm">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <MapPin size={16} className="text-indigo-400" />
              </div>
              {personal.location}
            </div>

            {/* Email */}
            <a
              href={`mailto:${personal.email}`}
              className="flex items-center gap-3 text-slate-300 text-sm hover:text-indigo-300 transition-colors group"
            >
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                <Mail size={16} className="text-indigo-400" />
              </div>
              {personal.email}
            </a>

            {/* Socials */}
            <div>
              <p className="text-xs font-mono tracking-widest text-slate-600 uppercase mb-3">
                Find me on
              </p>
              <div className="flex gap-3">
                {socials.map(({ icon: Icon, href, label, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`p-3 rounded-xl border border-white/[0.07] bg-white/[0.02] text-slate-500 transition-all ${color}`}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
