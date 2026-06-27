import type { Metadata } from "next";
import ExperimentalLab from "./ExperimentalLab";
import { getAllPosts } from "../blog/lib";

export const metadata: Metadata = {
  title: "Experimental - Dillon Gesy",
  description:
    "A sandbox of in-progress web experiments and a journal of whatever's on my mind.",
};

export default function ExperimentalPage() {
  const posts = getAllPosts();
  return <ExperimentalLab posts={posts} />;
}
