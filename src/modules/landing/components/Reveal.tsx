'use client';

import { motion } from 'framer-motion';

/**
 * Wrapper de entrada al hacer scroll (fade + slide sutil), reutilizado por
 * las secciones de la landing en vez de reimplementar el mismo
 * `initial`/`whileInView` en cada archivo.
 */

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

export function Reveal({ children, delay = 0, y = 24, className = '' }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;
