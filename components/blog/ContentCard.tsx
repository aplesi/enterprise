import Link from 'next/link'
import Image from 'next/image'
import { Calendar } from 'lucide-react'

interface ContentCardProps {
  href: string
  title: string
  image: string
  category?: string
  date?: string
  excerpt?: string
  price?: { price: string; retail: string }
}

export function ContentCard({
  href,
  title,
  image,
  category,
  date,
  excerpt,
  price,
}: ContentCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {category && (
          <span className="absolute left-4 top-4 rounded-full gradient-aqua px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-glow">
            {category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        {date && !price && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </div>
        )}
        <h3 className="mt-2 text-lg font-bold leading-snug text-primary transition-colors group-hover:text-aqua">
          {title}
        </h3>
        {excerpt && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>}
        {price && (
          <div className="mt-4">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Harga Anggota</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-aqua">{price.price}</span>
              <span className="text-xs text-muted-foreground line-through">{price.retail}</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
