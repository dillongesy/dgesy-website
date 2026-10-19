import type { Metadata } from "next";
import Projects from "../components/Projects";
import { pageMetadata } from "../lib/site";

export const metadata: Metadata = pageMetadata(
  "Projects - Dillon Gesy",
  "Apps and systems built by Dillon Gesy, from mobile ordering and online booking to inventory, field management, and a self-hosted homelab.",
  "/projects/",
);

export default function ProjectsPage() {
  return (
    <main className="pt-24 flex-1">
      <Projects />
    </main>
  );
}
