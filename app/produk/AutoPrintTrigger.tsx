'use client';
import { useEffect } from 'react';

export default function AutoPrintTrigger({ active = true }: { active?: boolean }) {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return null;
}
