import type { Metadata } from "next";
import Experience from "../components/Experience";
import { pageMetadata } from "../lib/site";

export const metadata: Metadata = pageMetadata(
  "Experience - Dillon Gesy",
  "Work history of Dillon Gesy across software engineering and IT.",
  "/experience/",
);

export default function ExperiencePage() {
  return (
    <main className="pt-24 flex-1">
      <Experience />
    </main>
  );
}
