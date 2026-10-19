"use client";

import { MotionConfig } from "framer-motion";

/**
 * Honour the visitor's OS "reduce motion" setting for every framer-motion
 * animation on the site: slides and scale-ins are skipped, fades still play.
 */
export default function MotionPreferences({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
