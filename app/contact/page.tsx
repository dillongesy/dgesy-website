import type { Metadata } from "next";
import Contact from "../components/Contact";
import { pageMetadata } from "../lib/site";

export const metadata: Metadata = pageMetadata(
  "Contact - Dillon Gesy",
  "Get in touch with Dillon Gesy by email, GitHub, or LinkedIn.",
  "/contact/",
);

export default function ContactPage() {
  return (
    <main className="pt-16 flex-1">
      <Contact />
    </main>
  );
}
