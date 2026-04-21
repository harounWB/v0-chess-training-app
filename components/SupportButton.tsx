'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function SupportButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      setIsVisible(scrollPercent >= 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Link
      href="/support"
      className={`fixed bottom-8 right-8 z-40 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:shadow-xl ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      Support
    </Link>
  );
}
