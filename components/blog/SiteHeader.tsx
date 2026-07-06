"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-2xl shadow-lg border-b border-gray-200' 
          : 'bg-white/80 backdrop-blur-xl border-b border-gray-100'
      }`}
    >
      <div className="container-custom">
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'py-3' : 'py-4'
        }`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`rounded-2xl bg-gradient-ocean flex items-center justify-center transition-all duration-300 ${
              isScrolled ? 'w-10 h-10' : 'w-12 h-12'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width={isScrolled ? "20" : "24"} height={isScrolled ? "20" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 6 6-.06 3.46-2.44 6-6 6-3.56 0-7.56-2.54-8.5-6Z"/>
                <path d="M18 12v.01"/>
                <path d="M11.52 17c-2.28 1.7-5.52 1.46-7.52-1C1.6 13.16 2.5 10 5 9c2.5-1 3.9-3.16 6-5"/>
              </svg>
            </div>
            <div>
              <div className={`font-bold text-midnight transition-all duration-300 ${
                isScrolled ? 'text-lg' : 'text-xl'
              }`}>
                APLESI
              </div>
              <div className={`text-gray-600 font-semibold tracking-wider transition-all duration-300 ${
                isScrolled ? 'text-[9px]' : 'text-[10px]'
              }`}>
                ASOSIASI PEMBUDIDAYA IKAN
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { href: '/', label: 'Beranda' },
              { href: '/tentang', label: 'Tentang' },
              { href: '/program', label: 'Program' },
              { href: '/artikel', label: 'Artikel' },
              { href: '/news', label: 'News' },
              { href: '/produk', label: 'Toko' },
            ].map((nav) => (
              <Link
                key={nav.href}
                href={nav.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:text-midnight hover:bg-gray-100 transition-all duration-300"
              >
                {nav.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link 
              href="/admin" 
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Login
            </Link>
            <Link href="#bergabung" className="btn-primary text-sm py-2.5 px-5">
              Gabung
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </Link>
            
            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
