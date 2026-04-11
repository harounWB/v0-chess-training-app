'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function SupportButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll percentage
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      // Show button at 60% scroll
      setIsVisible(scrollPercent >= 60);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Link href="/support">
      <button
        className={`fixed bottom-8 right-8 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        }}
      >
        ☕ Support
      </button>
    </Link>
  );
}
