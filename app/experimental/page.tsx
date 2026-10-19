import type { Metadata } from "next";
import ExperimentalLab from "./ExperimentalLab";
import { pageMetadata } from "../lib/site";

export const metadata: Metadata = pageMetadata(
  "Experimental - Dillon Gesy",
  "A sandbox of in-progress web experiments.",
  "/experimental/",
);

export default function ExperimentalPage() {
  return <ExperimentalLab />;
}
