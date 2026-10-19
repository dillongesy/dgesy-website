import type { Metadata } from "next";
import About from "../components/About";
import Skills from "../components/Skills";
import { pageMetadata } from "../lib/site";

export const metadata: Metadata = pageMetadata(
  "About - Dillon Gesy",
  "Background, skills, and toolset of Dillon Gesy, an Iowa State grad working across software, cloud, and IT infrastructure.",
  "/about/",
);

export default function AboutPage() {
  return (
    <main className="pt-24 flex-1">
      <About />
      <Skills />
    </main>
  );
}
