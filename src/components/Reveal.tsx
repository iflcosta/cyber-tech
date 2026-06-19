"use client";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * RevealOnScroll — wrapper que aplica fade-in + slide-up ao entrar na viewport.
 *
 * Props:
 *  - delay: segundos de atraso antes da animacao comecar (default 0)
 *  - y: deslocamento vertical inicial em px (default 24)
 *  - duration: duracao em segundos (default 0.6)
 *  - once: se true, so anima na primeira vez que entra na viewport (default true)
 *  - stagger: se usado como pai, os filhos animados entram com stagger
 *  - as: tag HTML a renderizar (default 'div')
 */
type RevealProps = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "footer" | "aside";
};

export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  once = true,
  className,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (reduced) {
    const Tag = as as "div";
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px 0px -80px 0px" }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1], // easeOutExpo-like
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * RevealGroup — pai que faz stagger dos filhos Reveal.
 * Uso:
 *   <RevealGroup stagger={0.1}>
 *     <Reveal as="article">...</Reveal>
 *     <Reveal as="article">...</Reveal>
 *   </RevealGroup>
 */
type RevealGroupProps = {
  children: ReactNode;
  stagger?: number;
  delayChildren?: number;
  className?: string;
  as?: "div" | "section" | "ul" | "ol";
};

export function RevealGroup({
  children,
  stagger = 0.12,
  delayChildren = 0,
  className,
  as = "div",
}: RevealGroupProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  const Tag = as as "div";

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px 0px -80px 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren,
          },
        },
      }}
    >
      {children}
    </MotionTag>
  );
}