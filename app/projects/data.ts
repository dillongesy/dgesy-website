export interface ProjectDetail {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  featured: boolean;
  status: "Production" | "Active" | "Archived" | "Academic";
  year: string;
  appStore?: string;
  playStore?: string;
  github?: string;
  live?: string;
  screenshots: string[];
  retrospective: {
    overview: string;
    challenges: string;
    learnings: string;
    outcome?: string;
  };
}

export const projects: ProjectDetail[] = [
  {
    slug: "bakeshop",
    title: "The Bakeshop Mobile Ordering App",
    tagline: "Mobile ordering for a local restaurant - iOS, Android, and a full admin portal.",
    description:
      "Mobile ordering app for a local, non-profit's restaurant - iOS and Android. AWS backend with Square payment integration, loyalty rewards, and a Next.js admin portal so staff can update the menu without calling me.",
    tech: ["React Native", "Next.js", "AWS Lambda", "AWS Cognito", "AWS RDS", "Square API", "Firebase FCM", "SQL"],
    featured: true,
    status: "Production",
    year: "2025 - Present",
    screenshots: [
      "/projects/bakeshop/screen-home.png",
      "/projects/bakeshop/screen-menu.png",
      "/projects/bakeshop/screen-rewards.png",
      "/projects/bakeshop/screen-profile.png",
      "/projects/bakeshop/screen-merch.png",
      "/projects/bakeshop/dashboard.png",
      "/projects/bakeshop/announcements.png",
      "/projects/bakeshop/categories.png",
      "/projects/bakeshop/menu-items.png",
      "/projects/bakeshop/merchandise.png",
      "/projects/bakeshop/media-library.png",
      "/projects/bakeshop/store-closures.png",
    ],
    retrospective: {
      overview:
        `A local non-profit company was paying another company an absurd amount yearly. Looking to cut costs and get a bit more flexibility/personalization, they requested my help. 
        I built the entire thing - React Native app for iOS and Android, a serverless AWS backend, Square payment integration, 
        and a Next.js admin portal for staff to make changes without my assistance.`,
      challenges:
        `As someone who only had experience developing Android applications, utilizing React Native to build two apps at the same time was new to me. 
        At first, I started development using Expo Go. Some modules didn't work, so I quickly migrated my project to React Native CLI. 
        Another major roadblock was getting everything to sync with Square utilizing its API. This application required the menu, rewards, names, modifiers, variations, 
        and more to sync.`,
      learnings:
        `Building for non-technical users changed how I think about admin UIs. Every decision has to be obvious - no room for ambiguity. 
        The Firebase push notification flow taught me a lot about how iOS and Android handle background processes differently. 
        This is my first project that utilized AWS. I learned a ton about builing an application with a serverless application, 
        including its benefits, how it works, and how it's billed.`,
      outcome:
        `The app is live and actively used by customers. Staff manage the entire menu, store hours, and promotions through 
        the admin portal without any developer involvement. Download it on the app stores now!`,
    },
  },
  {
    slug: "scanbeep",
    title: "ScanBeep - Inventory Warehouse",
    tagline: "End-to-end inventory management with custom barcodes, Android scanning, and a web dashboard.",
    description:
      "Inventory system built from scratch - custom barcodes, Android scanning app, SQL database, and a web dashboard for reporting. Used internally and by clients.",
    tech: ["Java", "Android Studio", "SQL", "React", "Next.js"],
    featured: true,
    status: "Production",
    year: "2024 - Present",
    screenshots: [
      "/projects/scanbeep/screen-main.png",
      "/projects/scanbeep/screen-customers.png",
      "/projects/scanbeep/screen-customer.png",
      "/projects/scanbeep/screen-items.png",
      "/projects/scanbeep/screen-item.png",
      "/projects/scanbeep/screen-references.png",
      "/projects/scanbeep/screen-reference.png",
      "/projects/scanbeep/dashboard.png",
      "/projects/scanbeep/inventory-dashboard.png",
      "/projects/scanbeep/customer-report.png",
      "/projects/scanbeep/item-report.png",
    ],
    retrospective: {
      overview:
        `The existing inventory process at the company was Excel spreadsheets and memory. The result of this was the 
        company wouldn't get container equipment back (such as steel frames) after shipping seed/fertilizer to clients. 
        I built an Android app on a Tera Android 13 Barcode Scanner P161 for scanning custom-made barcodes, 
        a SQL database to back it, and a Next.js dashboard so managers can view reports and run queries without 
        touching a terminal.`,
      challenges:
        `Although I had prior Android development experience, I've never handled an Android integrated with a laser barcode scanner. 
        While it does come out of the box ready to scan, the app had to work around small gimmicks in the way a barcode is even scanned 
        in the first place. The app includes a set of operations that need to behave differently based on both physical and digital button controls.
        I also had to design a barcode format that worked with both his system and mine. For this approach, I decided a scalable option that utilized Code-128 barcodes. 
        This includes text and numbers, which is how I determined what is what. Another challenge I faced was making a UI for a farmer. While it may seem silly, 
        the application was made in mind that the person operating the scanner needs it to be obvious what each thing does.`,
      learnings:
        `Building something people use at work every day is a different responsibility than a side project. 
        If the scanner crashes, operations cease and work can't be done. That pressure made me much more careful 
        about error processing/handling, offline behavior, and actually testing on real hardware before deployment.
        Furthermore, I've gained tons of experience since this project. It gets the job done, but I would likely choose a different 
        development tech-stack if I were to do it again.`,
      outcome:
        `The scanner sits in the warehouse ready to be used at any time. The software was sold to the client and has data readily-available 
        in the case a client doesn't bring back any shipment containers. Since this software's development, the client now has access to track down where 
        the equipment went and when it went out.`,
    },
  },
  {
    slug: "pokedropper",
    title: "PokeDropper",
    tagline: "A Pokemon-style collecting game on Discord with 50+ daily active players.",
    description:
      "Discord bot running a Pokemon-style collecting game with 50+ daily active users. Runs on my own Linux server, deployed and managed via SSH.",
    tech: ["JavaScript", "Node.js", "Discord.js", "SQLite", "Linux", "SSH"],
    featured: false,
    status: "Active",
    year: "2022 - Present",
    screenshots: [
      "/projects/pokedropper/drop.png",
      "/projects/pokedropper/party.png",
      "/projects/pokedropper/dex.png",
      "/projects/pokedropper/pokemon.png",
    ],
    retrospective: {
      overview:
        `PokeDropper didn't initially start as PokeBot. Similar things to this have been done (and probably better!), 
        but I wanted the dev experience of building an application from the ground up. It started as a weekend project, but
        it people kept using it and wanted more and more features. Before no time, it became a 
        collecting game with spawns, rare encounters, trades, and a persistent economy with various shops. 
        The fact that it has an actual daily user base was not something I planned for - it just kept growing. 
        The project doesn't see too much action these days, but as new Pokemon get added, the bot keeps up.`,
      challenges:
        `SQLite at the scale of thousands of daily transactions has real limits. 
        I had to design the schema carefully to avoid write-lock contention and excessive run-time. 
        Discord's API rate limits are also unforgiving - figuring out how to keep a high uptime and maintain a good user experience 
        took a while to get right. Also, I developed this with the intention to make it totally open-source. Anyone at any point can take 
        this bot's code and make it their own personal, private pokedropper.`,
      learnings:
        `This project taught me the real value of my Software Engineering degree. You can just... do stuff. Anything you want you can just make. 
        Pokedropper has actually lived in three people's homelabs, and even next to some top secret government data. In all three home labs, 
        Pokedropper lived on a Linux server, managed via SSH. Along with Linux came some process managers, log management, and crash handling (thanks systemd). 
        It also taught me that users will find every edge case you didn't test, usually in the worst possible way. Thanks to them, the bot is able to run smooth 
        and properly.`,
    },
  },
  {
    slug: "mars-rover",
    title: "Mars Rover Roomba",
    tagline: "Autonomous embedded navigation through unknown terrain using ping and IR sensors.",
    description:
      "Programmed a Roomba to navigate autonomously through unknown terrain using ping and IR sensors. C++ on embedded hardware.",
    tech: ["C++", "Embedded Systems", "Ping Sensors", "IR Sensors"],
    featured: false,
    status: "Academic",
    year: "2023",
    screenshots: [],
    retrospective: {
      overview:
        `Embedded systems course final project: write C++ firmware for a Roomba to navigate an obstacle course 
        it had never seen, using only ping and infrared sensors for spatial awareness. No maps, no GPS, just 
        sensor readings and logic.`,
      challenges:
        `The sensors create some noisy readings. A reading of 12cm could mean an actual obstacle or just interference. 
        Building a decision algorithm that worked reliably despite noisy input required averaging, filtering, 
        and a lot of physical testing.`,
      learnings:
        `This project was a big experience for learning what "crunch-time" actually means. 
        Working as a team, we spent countless nights going in to lab and working out the edge cases, filtering, and 
        making it work. Also, this project taught me a lot about optimization trade-offs. Scanning every couple of cm isn't 
        viable, so combining readings from previous scans helps to keep the roomba spend more time moving and less time scanning.`,
    },
  },
  {
    slug: "homelab",
    title: "Home Lab",
    tagline: "Full-scale home lab setup built by me.",
    description:
      "A development playground and server hosting through various hardware, software, operating systems, and more.",
    tech: ["Ubiquiti", "Cisco", "Linux", "Windows", "Java", "JavaScript", "Node", "Proxmox", "Docker", "Cloudflare"],
    featured: false,
    status: "Active",
    year: "2026 - Present",
    screenshots: [
      "/projects/homelab/proxmox.png",
      "/projects/homelab/unifi.png",
      "/projects/homelab/nginx.png",
    ],
    retrospective: {
      overview:
        `The home lab is a never-ending project that is fueled off pure creativity. For no reason whatsoever, it is overengineered to 
        learn new processes and refine existing ones I've done before. The home network has VLANs, DDNS, internal firewall rules, and more. 
        Proxmox serves as both a host for production-level code and in-progress development servers.`,
      challenges:
        `Although I do IT full-time, I purchased the hardware I did purely to learn. It might not be the most optimal equipment, but 
        it gets the job done.`,
      learnings:
        `Being both a software engineer and IT Network Admin is awesome. You can create apps and deploy them instantly as developement or prod. 
        Being able to do whatever you want, wherever you are, and whenever you want is super nice.`,
    },
  },
];
