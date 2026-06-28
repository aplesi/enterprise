"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 20);
      
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsScrollingDown(true);
      } else {
        setIsScrollingDown(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-500">
      <header 
        className={`pointer-events-auto transition-all duration-500 flex flex-col justify-center ${
          isScrolled 
            ? 'bg-[#021b36]/90 backdrop-blur-xl shadow-2xl border border-white/10 sm:rounded-full w-full sm:w-[98%] xl:w-full max-w-7xl mt-0 sm:mt-3' 
            : 'bg-[#021b36] border-b border-white/10 w-full'
        }`}
      >
      <div className={`w-full mx-auto px-4 md:px-6 flex items-center justify-between gap-2 lg:gap-4 transition-all duration-300 ${
        isScrolled ? 'h-14' : 'h-20'
      }`}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-aqua flex items-center justify-center text-white shadow-glow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 6 6-.06 3.46-2.44 6-6 6-3.56 0-7.56-2.54-8.5-6Z"/><path d="M18 12v.01"/><path d="M11.52 17c-2.28 1.7-5.52 1.46-7.52-1C1.6 13.16 2.5 10 5 9c2.5-1 3.9-3.16 6-5"/></svg>
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <div className="font-black text-white text-lg xl:text-xl tracking-wide leading-tight whitespace-nowrap">APLESI</div>
            <div className="text-[9px] xl:text-[10px] text-blue-200/70 font-semibold tracking-wider leading-none whitespace-nowrap">ASOSIASI PEMBUDIDAYA IKAN INDONESIA</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-2">
          {[
            { href: '/', label: 'Beranda' },
            { href: '/tentang', label: 'Tentang Asosiasi' },
            { href: '/program', label: 'Program' },
            { href: '/artikel', label: 'Artikel' },
            { href: '/produk', label: 'Toko Anggota' },
          ].map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className="px-2 xl:px-4 py-2 text-sm text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              {nav.label}
            </Link>
          ))}
        </nav>

        {/* Kanan */}
        <div className="flex items-center gap-2 xl:gap-3">
          <Link href="/admin" className="hidden sm:flex px-4 py-2 bg-white text-navy font-semibold rounded-full text-sm hover:bg-gray-100 transition-colors whitespace-nowrap">
            Login Portal
          </Link>
          <Link href="#bergabung" className="hidden sm:flex btn-aqua px-4 py-2 font-semibold text-sm shadow-glow hover-lift whitespace-nowrap rounded-full">
            Gabung Anggota
          </Link>
          
          {/* Mobile Menu Icon */}
          <button className="lg:hidden p-2 text-white">
            ☰
          </button>
        </div>
      </div>
      </header>
    </div>
  );
}
