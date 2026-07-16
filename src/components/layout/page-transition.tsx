"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Linear-style transition: quick, subtle, no bounce. A soft fade with a
// small upward drift reads as "content settling into place" rather than
// "sliding in," which is what keeps Linear's transitions feeling calm.
const transition = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
