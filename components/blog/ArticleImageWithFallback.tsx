'use client'

import React, { useState } from 'react'
import { getFallbackVisual } from '@/lib/news/visual'

interface ArticleImageWithFallbackProps {
  src?: string | null
  alt: string
  judul: string
  kategori?: string
  variant?: 'card' | 'detail' | 'sidebar' | 'thumbnail'
  className?: string
  priority?: boolean
}

export function ArticleImageWithFallback({
  src,
  alt,
  judul,
  kategori = 'Budidaya',
  variant = 'card',
  className = '',
  priority = false,
}: ArticleImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const visual = getFallbackVisual(judul)
  const isImageValid = Boolean(src && src.trim() !== '' && !src.startsWith('fallback:') && !hasError)

  // 1. DETAIL HERO IMAGE
  if (variant === 'detail') {
    return (
      <div className={`relative w-full h-64 md:h-[420px] rounded-2xl overflow-hidden mb-8 bg-gray-900 border border-border shadow-md ${className}`}>
        {isImageValid ? (
          <img
            src={src!}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover"
            loading={priority ? undefined : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex flex-col justify-between p-8 md:p-12 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
            <div className="relative z-10 flex items-center justify-between w-full">
              <span className="px-4 py-2 bg-white/95 backdrop-blur-sm text-midnight rounded-full text-xs md:text-sm font-bold shadow-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {kategori}
              </span>
              <span className="text-5xl md:text-6xl drop-shadow">{visual.icon}</span>
            </div>
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 bg-black/40 backdrop-blur-sm text-white/95 text-sm md:text-base font-semibold rounded-lg shadow-sm">
                {visual.badge}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
      </div>
    )
  }

  // 2. SIDEBAR THUMBNAIL (Small rectangular)
  if (variant === 'sidebar' || variant === 'thumbnail') {
    return (
      <div className={`relative w-16 h-16 flex-shrink-0 bg-secondary rounded-xl overflow-hidden border border-border/50 ${className}`}>
        {isImageValid ? (
          <img
            src={src!}
            alt={alt}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex items-center justify-center p-2 relative overflow-hidden`}>
            <span className="text-2xl drop-shadow">{visual.icon}</span>
          </div>
        )}
      </div>
    )
  }

  // 3. CARD THUMBNAIL (Standard 16:10 aspect ratio)
  return (
    <div className={`relative aspect-[16/10] overflow-hidden bg-secondary ${className}`}>
      {isImageValid ? (
        <img
          src={src!}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${visual.bg} flex flex-col justify-between p-4 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="relative z-10 flex items-center justify-between w-full">
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
