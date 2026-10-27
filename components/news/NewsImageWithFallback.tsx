'use client'

import React, { useState } from 'react'
import { getFallbackVisual } from '@/lib/news/visual'

interface NewsImageWithFallbackProps {
  src?: string | null
  alt: string
  judul: string
  kategori?: string
  variant?: 'card' | 'featured' | 'detail' | 'sidebar'
  className?: string
}

export function NewsImageWithFallback({
  src,
  alt,
  judul,
  kategori = 'nasional',
  variant = 'card',
  className = '',
}: NewsImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const visual = getFallbackVisual(judul)
  const labelKategori = kategori === 'internasional' ? 'Internasional' : 'Nasional'
  const isImageValid = Boolean(src && src.trim() !== '' && !src.startsWith('fallback:') && !hasError)

  // 1. DETAIL ARTICLE PAGE
  if (variant === 'detail') {
    return (
      <div className={`relative w-full h-64 md:h-[400px] rounded-2xl overflow-hidden mb-10 bg-gray-50 border border-gray-100 shadow-sm ${className}`}>
        {isImageValid ? (
          <img
            src={src!}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex flex-col justify-between p-8 md:p-12 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="px-4 py-2 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs md:text-sm font-bold shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-azure animate-pulse"></span>
                {labelKategori}
              </span>
              <span className="text-5xl md:text-6xl drop-shadow">{visual.icon}</span>
            </div>
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 bg-black/30 backdrop-blur-sm text-white/95 text-sm md:text-base font-semibold rounded-lg shadow-sm">
                {visual.badge}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent"></div>
          </div>
        )}
      </div>
    )
  }

  // 2. FEATURED CARD
  if (variant === 'featured') {
    return (
      <div className={`relative h-64 lg:h-full min-h-[280px] overflow-hidden ${className}`}>
        {isImageValid ? (
          <>
            <img
              src={src!}
              alt={alt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setHasError(true)}
            />
            <div className="absolute top-6 left-6 z-10">
              <span className="px-4 py-2 bg-azure text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Terbaru
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent"></div>
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex flex-col justify-between p-8 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="px-3.5 py-1.5 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs font-bold shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-azure animate-pulse"></span>
                Terbaru • {labelKategori}
              </span>
              <span className="text-4xl drop-shadow">{visual.icon}</span>
            </div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-black/30 backdrop-blur-sm text-white/90 text-xs font-semibold rounded">
                {visual.badge}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent"></div>
          </div>
        )}
      </div>
    )
  }

  // 3. SIDEBAR CARD THUMBNAIL
  if (variant === 'sidebar') {
    return (
      <div className={`relative w-full h-32 bg-gray-100 rounded-xl overflow-hidden ${className}`}>
        {isImageValid ? (
          <img
            src={src!}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex items-center justify-center p-3 relative overflow-hidden`}>
            <span className="text-3xl drop-shadow">{visual.icon}</span>
          </div>
        )}
      </div>
    )
  }

  // 4. STANDARD CARD (Default)
  return (
    <div className={`relative h-40 overflow-hidden ${className}`}>
      {isImageValid ? (
        <>
          <img
            src={src!}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs font-bold shadow-sm">
              {labelKategori}
            </span>
          </div>
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex flex-col justify-between p-4 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
          <div className="relative z-10 flex items-center justify-between w-full">
            <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs font-bold shadow-sm">
              {labelKategori}
            </span>
            <span className="text-2xl drop-shadow">{visual.icon}</span>
          </div>
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-1 bg-black/30 backdrop-blur-sm text-white/90 text-xs font-semibold rounded">
              {visual.badge}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
