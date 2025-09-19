// shared animation configuration for consistent motion design
export const ANIMATION_CONFIG = {
  duration: 0.8,
  ease: "easeOut" as const,
  stagger: 0.2
}

// common animation variants for reuse
export const FADE_UP_VARIANT = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 }
}

export const FADE_LEFT_VARIANT = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 }
}

export const FADE_RIGHT_VARIANT = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 }
}