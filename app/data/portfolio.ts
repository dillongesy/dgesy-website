// ─── Personal ────────────────────────────────────────────────────────────────

export const personal = {
  name: "Dillon Gesy",
  title: "Software Engineer & IT Network Engineer",
  taglines: [
    "IT Network Engineer",
    "Full Stack Engineer",
    "Mobile App Developer",
    "Cloud Architect",
    "Embedded System Solver",
  ],
  bio: "Full-stack software engineer & IT network engineer with a BS in Software Engineering from Iowa State. I build production-ready systems — from serverless AWS backends to cross-platform mobile apps — and ship things real users actually use.",
  location: "Iowa",
  email: "dillon.gesy@yahoo.com",
  phone: "(+1) 712-269-4631",
  github: "https://github.com/dillongesy",
  linkedin: "https://www.linkedin.com/in/dillon-gesy",
  resumeUrl: "/resume.pdf", // Drop your PDF at /public/resume.pdf
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const stats = [
  { label: "Years Coding",  value: 5,  suffix: "+" },
  { label: "Apps Shipped",  value: 6,  suffix: "+" },
  { label: "Technologies",  value: 20, suffix: "+" },
  { label: "Active Users",  value: 50, suffix: "+" },
];

// ─── Education ────────────────────────────────────────────────────────────────

export const education = {
  school: "Iowa State University",
  degree: "Bachelor of Science in Software Engineering",
  minor: "Minor in Mathematics",
  period: "Aug 2020 — May 2024",
  location: "Ames, IA",
  gpa: "3.63 / 4.0",
};

// ─── Skills ──────────────────────────────────────────────────────────────────

export type SkillCategory = "Language" | "Framework" | "Tool" | "Cloud";

export interface Skill {
  name: string;
  category: SkillCategory;
  level: number; // 1–5
}

export const skills: Skill[] = [
  // Languages
  { name: "JavaScript",     category: "Language",  level: 5 },
  { name: "TypeScript",     category: "Language",  level: 4 },
  { name: "Java",           category: "Language",  level: 4 },
  { name: "SQL",            category: "Language",  level: 4 },
  { name: "C / C++",        category: "Language",  level: 3 },
  { name: "C#",             category: "Language",  level: 3 },
  { name: "HTML / CSS",     category: "Language",  level: 5 },
  // Frameworks
  { name: "React",          category: "Framework", level: 5 },
  { name: "Next.js",        category: "Framework", level: 5 },
  { name: "React Native",   category: "Framework", level: 5 },
  { name: "Node.js",        category: "Framework", level: 4 },
  { name: "Tailwind CSS",   category: "Framework", level: 5 },
  { name: "Spring Boot",    category: "Framework", level: 3 },
  { name: ".NET MAUI",      category: "Framework", level: 3 },
  // Tools
  { name: "Git / GitLab",   category: "Tool",      level: 5 },
  { name: "Android Studio", category: "Tool",      level: 4 },
  { name: "SQLite",         category: "Tool",      level: 4 },
  { name: "Postman",        category: "Tool",      level: 4 },
  { name: "VS Code",        category: "Tool",      level: 5 },
  // Cloud
  { name: "AWS Lambda",     category: "Cloud",     level: 4 },
  { name: "AWS Cognito",    category: "Cloud",     level: 4 },
  { name: "AWS RDS",        category: "Cloud",     level: 4 },
  { name: "Vercel",         category: "Cloud",     level: 5 },
];

// ─── Experience ──────────────────────────────────────────────────────────────

export interface Job {
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
  tech: string[];
}

export const experience: Job[] = [
  {
    company: "Advanced Communication Services, LLC",
    role: "IT Network Engineer · Full Stack Solutions Engineer",
    period: "Sept 2024 — Present",
    location: "Manilla, IA",
    bullets: [
      "Oversee and maintain IT infrastructure for 100+ clients including camera systems, networking hardware, and custom software solutions.",
      "Spearheaded the design and development of a cross-platform mobile ordering app (iOS/Android) for a non-profit using React Native CLI, secured with AWS Cognito authentication.",
      "Engineered a scalable serverless AWS backend (Lambda, API Gateway, RDS) integrating the Square API for real-time payment processing and a full loyalty rewards program.",
      "Built a full-stack Next.js admin portal empowering non-technical staff with dynamic control over menus, store hours, and a Firebase push notification system (FCM) for promotions.",
      "Developed inventory management software solutions for both internal and external client use."
    ],
    tech: ["React Native", "Next.js", "AWS", "Square API", "Firebase FCM", "SQL"],
  },
];

// ─── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  title: string;
  description: string;
  tech: string[];
  github?: string;
  live?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    title: "The Bakeshop Mobile Ordering App",
    description:
      "Production cross-platform mobile app (iOS/Android) for an empowering restaurant. AWS Cognito auth, serverless backend, Square payment processing, loyalty rewards, and a full Next.js admin portal with Firebase push notifications.",
    tech: ["React Native", "Next.js", "AWS", "Square API", "FCM", "SQL"],
    featured: true,
  },
  {
    title: "PokeBot",
    description:
      "Fully deployed Discord bot serving 50+ active daily users as an ongoing Pokémon-style collecting game. Maintained on a dedicated Linux server via SSH and Kasm Workspace.",
    tech: ["JavaScript", "Discord API", "SQLite", "Node.js", "Linux"],
    featured: false,
  },
  {
    title: "Inventory Warehouse (ScanBeep)",
    description:
      "End-to-end inventory management solution featuring custom barcodes, Android barcode scanner software, an SQL database, and a web-based reporting dashboard.",
    tech: ["Java", "SQL", "Android Studio", "React", "Next.js"],
    featured: true,
  },
  {
    title: "Airarret",
    description:
      "Team-built 2D sandbox mobile game inspired by Terraria. Served as front-end developer using Java and Spring Boot RESTful services for backend data exchange.",
    tech: ["Java", "Spring Boot", "REST", "Android", "GitLab CI/CD"],
    featured: false,
  },
  {
    title: "Mars Rover Roomba",
    description:
      "Embedded C++ software enabling a Roomba to navigate autonomously through unknown terrain using ping and infrared sensors for real-time obstacle detection.",
    tech: ["C++", "Embedded Systems", "Sensors"],
    featured: false,
  },
];
