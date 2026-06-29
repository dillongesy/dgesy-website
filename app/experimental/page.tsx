import type { Metadata } from "next";
import ExperimentalLab from "./ExperimentalLab";

export const metadata: Metadata = {
  title: "Experimental - Dillon Gesy",
  description: "A sandbox of in-progress web experiments.",
};

export default function ExperimentalPage() {
  return <ExperimentalLab />;
}
