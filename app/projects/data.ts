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
  /**
   * Art shown behind the text on the preview card, dimmed for legibility.
   * Drop a file at /public/projects/<slug>/card.png to fill the slot.
   * If the file isn't there the card just renders clean.
   */
  cardImage?: string;
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
    cardImage: "/projects/bakeshop/card.png",
    screenshots: [
      "/projects/bakeshop/screen-home.png",
      "/projects/bakeshop/screen-menu.png",
      "/projects/bakeshop/screen-rewards.png",
      "/projects/bakeshop/screen-merch.png",
      "/projects/bakeshop/screen-profile.png",
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
    cardImage: "/projects/scanbeep/card.png",
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
    cardImage: "/projects/pokedropper/card.png",
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
        people kept using it and wanted more and more features. Before no time, it became a 
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
    slug: "field-management",
    title: "Field Management App",
    tagline: "The platform our MSP runs on - an internal portal and a field app, on hardware I built.",
    description:
      "Two apps that run our IT MSP end to end: an encrypted internal portal for billing, inventory, credentials, and analytics, plus a mobile web app the field techs use on site. Self-hosted on Proxmox hardware I built.",
    tech: ["Node.js", "PostgreSQL", "Nginx", "Proxmox", "CI/CD", "systemd", "UFW", "Encryption at Rest"],
    featured: true,
    status: "Production",
    year: "2025 - Present",
    cardImage: "/projects/field-management/card.png",
    screenshots: [
      "/projects/field-management/dashboard.png",
      "/projects/field-management/customer.png",
      "/projects/field-management/portal-workorders.png",
      "/projects/field-management/portal-inventory.png",
      "/projects/field-management/backlog.png",
      "/projects/field-management/billingqueue.png",
      "/projects/field-management/analytics.png",
      "/projects/field-management/field-workorders.jpg",
      "/projects/field-management/field-inventory.jpg",
    ],
    retrospective: {
      overview:
        `This is the software our IT MSP actually runs on, and it is two applications talking to each other.
        The internal portal is where the company lives - billing, inventory, backlog, analytics, job progress,
        client credentials, company data, internal guides, and estimates. Everything in it is encrypted at the
        database layer by default, because a good portion of it is client credentials and company records that
        have no business sitting in plaintext.
        The second app is web-facing and built for a phone browser, because that is what our field guys
        actually have on them. Out on a job they take pictures, jot down work orders, log their hours, and
        record what inventory they burned - and that last part decrements stock directly rather than waiting
        for someone to reconcile it later. When they get back, the portal imports the work orders they created
        in the field, and they log in locally to finalize and send the real thing.`,
      challenges:
        `I own the entire stack down to the metal. I built the Proxmox hardware and stood up every tier
        myself - reverse proxy manager, Linux servers, database VMs, web server VMs - so there is no managed
        platform absorbing my mistakes. That meant the deployment pipeline had to be trustworthy before anyone
        depended on it: webhook-driven CI/CD with GitHub deploy keys, auto-deploying on every push to main
        with zero downtime, no SSH and no maintenance window.
        Letting two separate applications talk without flattening the network between them was its own
        problem. The answer was an explicit allow-list bridging the subsystems rather than opening them up to
        each other, with systemd handling supervision and UFW holding the line at each host.`,
      learnings:
        `Encrypting by default changes how you design. You stop treating encryption as a feature you bolt on
        for the sensitive tables and start treating plaintext as the thing that needs justifying.
        Building for field techs taught me the same lesson the barcode scanner did, in a different accent:
        the app has to work one-handed, on a phone, on bad rural signal, while someone is standing in a server
        closet. Anything clever I wanted to add lost to anything obvious.`,
      outcome:
        `It is live and running on real data. If I am honest about what it did - it turned the company inside
        out. Before it existed, all of this ran on photographs, memory, and Excel sheets parked on a NAS.
        Now the work order that starts on a phone in the field is the same record that gets billed.
        And because I own it end to end, it changes constantly - I can ship a fix the same afternoon someone
        asks for it.`,
    },
  },
  {
    slug: "homelab",
    title: "Home Lab",
    tagline: "Full-scale home lab setup built by me.",
    description:
      "A development playground and server hosting through various hardware, software, operating systems, and more.",
    tech: ["Ubiquiti", "Linux", "Windows", "Java", "JavaScript", "Node", "Proxmox", "Docker", "Cloudflare"],
    featured: false,
    status: "Active",
    year: "2026 - Present",
    cardImage: "/projects/homelab/card.png",
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
