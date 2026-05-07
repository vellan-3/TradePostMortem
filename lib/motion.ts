// lib/motion.ts

// Ease curve used for all entrances — fast start, settles smoothly
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// fadeUp — the only entrance variant you need
export const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.055,        // stagger delay passed as custom prop
      ease: EASE_OUT_EXPO,
    },
  }),
};

