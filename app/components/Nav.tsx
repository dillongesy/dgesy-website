"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Eye } from "lucide-react";
import { personal } from "../data/portfolio";

const links = [
  { label: "About",      href: "#about" },
  { label: "Skills",     href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects",   href: "#projects" },
  { label: "Contact",    href: "#contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight active section
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl rounded-2xl transition-all duration-300 ${
          scrolled
            ? "bg-[#0f172a]/80 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/30"
            : "bg-transparent border border-transparent"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-3">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-sm font-mono font-bold tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors uppercase"
          >
            {personal.name.split(" ").map(w => w[0]).join("")}
            <span className="text-cyan-400">.</span>
          </button>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active === link.href.slice(1)
                    ? "text-indigo-400"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {active === link.href.slice(1) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-indigo-500/10"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          <a
            href={personal.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all"
          >
            <Eye size={14} />
            Resume
          </a>

          {/* Mobile burger */}
          <button
            className="md:hidden text-slate-400 hover:text-slate-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-4 right-4 z-40 rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-white/[0.08] p-4 flex flex-col gap-1 shadow-2xl"
          >
            {links.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className={`px-4 py-3 text-sm font-medium rounded-xl text-left transition-colors ${
                  active === link.href.slice(1)
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {link.label}
              </button>
            ))}
            <a
              href={personal.resumeUrl}
              className="mt-2 flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"
            >
              <Eye size={14} /> Resume
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
