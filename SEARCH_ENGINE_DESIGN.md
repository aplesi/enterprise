# 🔍 Search Engine Hero Design

## Konsep: Google-Inspired Homepage

Design baru mengadopsi pendekatan **search engine** dengan:
- **Search box sebagai focal point** di tengah layar
- **Clean & minimal** tanpa distraction
- **Large logo** di atas search box
- **Quick action buttons** di bawah search box

---

## 🎯 Layout Structure

```
┌─────────────────────────────────────────┐
│           Logo (Large Icon)              │
│         "Aplesi Indonesia"               │
│     "Portal Budidaya Terlengkap"        │
│                                          │
│  ╔═══════════════════════════════════╗  │
│  ║  🔍  [Search Input Box]      🎤   ║  │ ← Google-style
│  ╚═══════════════════════════════════╝  │
│                                          │
│  [Cari Artikel]  [Gabung Sekarang]      │
│                                          │
│  Populer: [Lele] [Pakan] [Penyakit]...  │
│                                          │
│   1000+        12K+         34           │
│  Artikel     Anggota    Provinsi         │
│                                          │
│         ↓ Scroll untuk lebih ↓           │
└─────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. **Large Search Box**
- **Rounded-full** design (pill shape)
- **Shadow-luxury** dengan hover effect
- **Large padding**: px-6 py-5
- **Icons**: Search icon (left) + Voice icon (right)
- **Gradient glow** on hover

### 2. **Google-Style Layout**
- **Centered content** dengan max-width
- **Vertical spacing** yang generous
- **Clean white background**
- **Minimal distractions**

### 3. **Quick Actions**
- **2 buttons** di bawah search
- **Same style** dengan subtle shadow
- **Pearl background** (light gray)

### 4. **Popular Keywords**
- **Pill-shaped badges**
- **Border hover effect**
- **Color change** on hover (border-azure)

### 5. **Stats Icons**
- **Gradient ocean backgrounds**
- **Icon untuk setiap stat**
- **Hover scale effect**

---

## 🎨 Visual Elements

### Search Box
```tsx
- Border: 1px solid gray-200
- Hover: border-gray-300
- Shadow: shadow-luxury
- Shadow Hover: shadow-luxury-lg
- Border Radius: rounded-full
- Gradient glow: opacity-0 → opacity-20 on hover
```

### Action Buttons
```tsx
- Background: bg-pearl
- Hover: bg-mist
- Border: 1px solid gray-200
- Border Radius: rounded-xl
- Shadow: hover:shadow-lg
```

### Quick Links
```tsx
- Background: bg-white
- Hover: bg-gray-50
- Border: 1px solid gray-200
- Hover Border: border-azure
- Text Color: text-gray-700 → text-azure
```

---

## 📐 Spacing

```css
Container: max-w-4xl (untuk search area)
Search box: max-w-3xl
Vertical gaps: space-y-12 (large)
Button gaps: gap-4
Keyword gaps: gap-3
Stats: gap-8
```

---

## 🎭 Animations

### Fade In Up
- Stagger delay: 0s, 0.2s, 0.4s
- Easing: ease-out
- Duration: 0.6s

### Hover Effects
- Search box: shadow transition
- Buttons: shadow + background
- Keywords: border + text color
- Stats: scale-110

### Scroll Indicator
- Animate bounce
- Positioned at bottom
- Text + arrow icon

---

## 🎯 Design Inspiration

Inspired by:
- **Google.com** - Clean search focus
- **DuckDuckGo** - Centered layout
- **Bing** - Large search box
- **Modern SaaS** - Pill-shaped elements

---

## 💡 Why This Works

1. **Immediate Purpose** - User langsung tahu ini search engine
2. **No Cognitive Load** - Satu focal point jelas
3. **Familiar Pattern** - User sudah terbiasa dengan Google
4. **Mobile Friendly** - Vertical layout mudah di-scroll
5. **Professional** - Clean dan trusted look

---

## 📱 Responsive

### Desktop (lg)
- Large logo (w-20 h-20)
- Large text (7xl)
- 3-column stats

### Tablet (md)
- Medium logo (w-20 h-20)
- Medium text (6xl)
- 3-column stats

### Mobile (sm)
- Same logo size
- Smaller text (5xl)
- 3-column stats (stays same)
- Stacked buttons

---

## 🎨 Color Palette

```
Background: white → gray-50 gradient
Logo: gradient-ocean (azure → cyan)
Text: midnight (dark)
Search: white with shadow
Buttons: pearl (light gray)
Keywords: white with border
Stats icons: gradient-ocean
```

---

## ✅ Checklist

- [x] Large centered logo
- [x] Prominent search box
- [x] Google-style shadow
- [x] Voice search icon
- [x] Action buttons
- [x] Popular keywords
- [x] Stats with icons
- [x] Scroll indicator
- [x] Hover animations
- [x] Responsive layout

---

**Version**: 4.0 (Search Engine Style)  
**Updated**: 29 Juni 2026  
**Status**: ✅ Production Ready
