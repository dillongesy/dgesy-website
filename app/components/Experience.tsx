"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { MapPin, Calendar, Network, Code2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Job {
  company: string;
  role: string;
  focus: string;
  period: string;
  location: string;
  logo?: string;
  icon: LucideIcon;
  accent: "cyan" | "indigo";
  bullets: string[];
}

/** Full class strings so Tailwind's scanner can see them - no dynamic concatenation. */
const accents = {
  cyan: {
    text: "text-cyan-400",
    dot: "bg-cyan-500/60",
    iconWrap: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    rule: "from-cyan-500/40",
  },
  indigo: {
    text: "text-indigo-400",
    dot: "bg-indigo-500/60",
    iconWrap: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    rule: "from-indigo-500/40",
  },
} as const;

const experience: Job[] = [
  {
    company: "Advanced Communication Services, LLC",
    role: "IT Network Engineer",
    focus: "Networking & Infrastructure",
    period: "Sept 2024 - Present",
    location: "Manilla, IA",
    logo: "/companies/acs-logo.png",
    icon: Network,
    accent: "cyan",
    bullets: [
      "Own IT infrastructure for a book of 100+ clients, and have built or completely rebuilt the network at 10+ sites from scratch - private businesses and public non-profits alike.",
      "Design segmented networks as a standard, not a special request: a /22 internal, a camera VLAN running without DHCP, a dedicated phone VLAN, and a guest network with real client isolation rather than just a separate SSID.",
      "Run site-to-site VPN for camera redundancy across VLAN-isolated networks, so footage survives a single site going down.",
      "Shoot point-to-point wireless to outbuildings where trenching fiber isn't practical, then hang switches off the far end with complete isolation from the main building.",
      "Install and configure camera servers, and re-network existing camera fleets onto proper segmentation.",
      "Build and maintain per-site firewall policy: inter-VLAN rules, port forwarding, and explicit allow-lists instead of blanket access.",
      "Configure and troubleshoot WAN failover.",
      "Rack and terminate hardware in-house - switches, patch panels, UPS - and document the port maps so the next person isn't guessing.",
    ],
  },
  {
    company: "Advanced Communication Services, LLC",
    role: "Full Stack Solutions Engineer",
    focus: "Software & Platform",
    period: "Sept 2024 - Present",
    location: "Manilla, IA",
    logo: "/companies/acs-logo.png",
    icon: Code2,
    accent: "indigo",
    bullets: [
      "Built and run the platform our MSP operates on - an internal portal covering billing, inventory, backlog, analytics, credentials, and estimates, encrypted at the database layer by default.",
      "Shipped the companion field app as mobile web, so techs on site log work orders, hours, photos, and inventory usage from a phone - decrementing stock directly instead of reconciling it later.",
      "Architected the whole stack on Proxmox hardware I built myself: reverse proxy manager, Linux hosts, database VMs, and web server VMs behind Nginx Proxy Manager.",
      "Built a webhook-driven CI/CD pipeline with GitHub deploy keys that auto-deploys with zero downtime on every push to main - no SSH, no maintenance window.",
      "Hardened production by hand: systemd service supervision, UFW firewall rules, and an explicit allow-list bridging the two applications rather than flattening the network between them.",
      "Shipped a cross-platform mobile ordering app for iOS and Android in React Native CLI, with AWS Cognito handling auth and accounts.",
      "Engineered a serverless backend on AWS (Lambda, API Gateway, RDS) driving all business logic, with Square integrated for live payments and loyalty rewards.",
      "Built a Next.js admin portal that hands non-technical staff full control of the menu, store hours, and FCM push promotions - no developer in the loop.",
      "Delivered barcode-driven inventory systems on Android scanner hardware, including one that writes back to a client's existing SharePoint workbook through the Microsoft Graph API.",
      "Implement key standard software methodoligies, such as Agile sprints and iterative collaboration.",
    ],
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
    <section id="experience" ref={ref} className="pb-10 md:pb-16 px-6">
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
          className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
        >
          Where I&apos;ve worked
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={2}
          className="text-slate-400 mb-14 max-w-2xl leading-relaxed"
        >
          One employer, two jobs. I run the network and build the software that rides on it,
          which means I get to design a system end to end, from the rack to the release.
        </motion.p>

        <div className="space-y-6">
          {experience.map((job, i) => {
            const a = accents[job.accent];
            const Icon = job.icon;

            return (
              <motion.div
                key={job.role}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                custom={i + 3}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
              >
                <div className="p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    {/* Left: role leads, company sits under it */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span
                          className={`grid place-items-center w-7 h-7 rounded-lg border ${a.iconWrap}`}
                        >
                          <Icon size={15} />
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase tracking-widest ${a.text}`}
                        >
                          {job.focus}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-100 mb-1">{job.role}</h3>
                      <p className="text-slate-400 font-medium">{job.company}</p>
                    </div>

                    {/* Right: logo + date/location */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
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

                  <div className={`h-px mb-6 bg-gradient-to-r ${a.rule} to-transparent`} />

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {job.bullets.map((b, j) => (
                      <li key={j} className="flex gap-3 text-slate-400 text-sm leading-relaxed">
                        <span
                          className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.dot}`}
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
