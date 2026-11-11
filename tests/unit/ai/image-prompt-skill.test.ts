import { describe, it, expect } from 'vitest'
import {
  cleanAiBuzzwords,
  enhanceImagePromptToRealPhoto,
  detectAquacultureCommodity,
  shouldEnforceDryLandPosture,
  CAMERA_SPECS,
  REALISTIC_TEXTURES,
  SPATIAL_REALISM,
  NATURAL_LIGHTING,
  CORE_RAW_STYLE,
  COMMODITY_SPECIES_VISUALS,
} from '@/lib/ai/skills/image-prompt-skill'
import { buildFallbackImagePrompt } from '@/lib/ai/groq'

describe('Image Prompt Master Skill ("Anti-AI Raw Realism")', () => {
  describe('cleanAiBuzzwords', () => {
    it('strips all common AI rendering buzzwords', () => {
      const dirtyPrompt =
        'Indonesian farmer inspecting catfish pond, photorealistic, hyperrealistic, 8K resolution, 4K, unreal engine 5, octane render, trending on artstation, cinematic lighting, smooth plastic skin, CGI, 3D render, digital illustration'

      const cleaned = cleanAiBuzzwords(dirtyPrompt)

      expect(cleaned).toBe('Indonesian farmer inspecting catfish pond')
      expect(cleaned).not.toContain('photorealistic')
      expect(cleaned).not.toContain('hyperrealistic')
      expect(cleaned).not.toContain('8K')
      expect(cleaned).not.toContain('4K')
      expect(cleaned).not.toContain('unreal engine')
      expect(cleaned).not.toContain('octane render')
      expect(cleaned).not.toContain('artstation')
      expect(cleaned).not.toContain('cinematic lighting')
      expect(cleaned).not.toContain('plastic skin')
      expect(cleaned).not.toContain('CGI')
      expect(cleaned).not.toContain('3D render')
    })

    it('handles mixed case and variants', () => {
      const dirtyPrompt = 'Pond scene, PhotoRealistic, HYPER-REALISTIC, 8k, UNREAL ENGINE, Octane Rendering, AIRBRUSHED'
      const cleaned = cleanAiBuzzwords(dirtyPrompt)
      expect(cleaned).toBe('Pond scene')
    })

    it('strips newer and extended AI rendering buzzwords without leaving stray suffixes', () => {
      const extendedDirty =
        'catfish farm, unreal engine 5.4, unreal engine 4, 16k resolution, ultra hd, full hd, blender render, vray, ray-tracing, raytracing, octane-rendered, vfx, 3d graphics, 3d animation, digital render, highly detailed, ultra-detailed, intricate details, doll-like, wax figure'

      const cleaned = cleanAiBuzzwords(extendedDirty)
      expect(cleaned).toBe('catfish farm')
      expect(cleaned).not.toContain('.4')
      expect(cleaned).not.toContain('16k')
      expect(cleaned).not.toContain('ultra hd')
      expect(cleaned).not.toContain('ray-tracing')
      expect(cleaned).not.toContain('octane')
      expect(cleaned).not.toContain('vfx')
      expect(cleaned).not.toContain('detailed')
    })

    it('preserves valid negative clauses and does not leave dangling negation words', () => {
      const withNegatives = 'Indonesian pond, no cinematic lighting, without CGI, without 3D render, avoid plastic skin, no artificial studio glow'
      const cleaned = cleanAiBuzzwords(withNegatives)

      expect(cleaned).toContain('no cinematic lighting')
      expect(cleaned).toContain('without CGI')
      expect(cleaned).toContain('without 3D render')
      expect(cleaned).toContain('avoid plastic skin')
      expect(cleaned).toContain('no artificial studio glow')
      expect(cleaned).not.toMatch(/\b(?:no|without|avoid)\s*[,;.]/)
    })

    it('cleans dangling negation words when positive buzzwords are stripped', () => {
      const dangling = 'Pond scene, no, without, authentic farmer'
      const cleaned = cleanAiBuzzwords(dangling)
      expect(cleaned).toBe('Pond scene, authentic farmer')
    })

    it('cleans dangling punctuation, double commas, quotes, and brackets', () => {
      const dirty = '"`A biofloc pond (photorealistic, 8k), with aeration system; octane render;`"'
      const cleaned = cleanAiBuzzwords(dirty)
      expect(cleaned).toBe('A biofloc pond, with aeration system')
    })

    it('preserves authentic aquaculture and technical terminology', () => {
      const text = 'Farmer holding DO meter probe at biofloc pond edge, dissolved oxygen 4.5 mg/L, paddlewheel aerator splashing'
      const cleaned = cleanAiBuzzwords(text)
      expect(cleaned).toBe(text)
    })

    it('handles empty and whitespace-only strings gracefully', () => {
      expect(cleanAiBuzzwords('')).toBe('')
      expect(cleanAiBuzzwords('   ')).toBe('')
      // @ts-expect-error testing invalid input runtime safety
      expect(cleanAiBuzzwords(null)).toBe('')
      // @ts-expect-error testing invalid input runtime safety
      expect(cleanAiBuzzwords(undefined)).toBe('')
    })
  })

  describe('detectAquacultureCommodity', () => {
    it('detects common Indonesian aquaculture species', () => {
      expect(detectAquacultureCommodity('budidaya ikan lele sangkuriang')).toBe('lele')
      expect(detectAquacultureCommodity('feeding african catfish in round tanks')).toBe('lele')
      expect(detectAquacultureCommodity('tebar benih nila merah nirwana')).toBe('nila')
      expect(detectAquacultureCommodity('panen udang vaname intensif')).toBe('vaname')
      expect(detectAquacultureCommodity('budidaya udang air payau')).toBe('vaname')
      expect(detectAquacultureCommodity('kolam tanah gurame soang')).toBe('gurame')
      expect(detectAquacultureCommodity('pembesaran ikan patin siam')).toBe('patin')
      expect(detectAquacultureCommodity('ekstraksi albumin ikan gabus haruan')).toBe('gabus')
      expect(detectAquacultureCommodity('pembesaran ikan bawal bintang air tawar')).toBe('bawal')
      expect(detectAquacultureCommodity('pembenihan lobster air tawar red claw')).toBe('lobster')
      expect(detectAquacultureCommodity('apartemen kepiting bakau soka')).toBe('kepiting')
      expect(detectAquacultureCommodity('tambak ikan bandeng')).toBe('bandeng')
      expect(detectAquacultureCommodity('keramba jaring apung kakap putih barramundi')).toBe('kakap')
      expect(detectAquacultureCommodity('tambak udang galah')).toBe('udang_galah')
    })

    it('returns null when no species is mentioned', () => {
      expect(detectAquacultureCommodity('pengukuran parameter kualitas air kolam')).toBeNull()
    })
  })

  describe('enhanceImagePromptToRealPhoto (Core Realism & Metadata)', () => {
    it('injects 35mm camera specs, natural lighting, textures, and anti-AI core style', () => {
      const prompt = 'Indonesian fish farmer feeding biofloc pond'
      const enhanced = enhanceImagePromptToRealPhoto(prompt)

      expect(enhanced).toContain(CAMERA_SPECS)
      expect(enhanced).toContain(REALISTIC_TEXTURES)
      expect(enhanced).toContain(SPATIAL_REALISM)
      expect(enhanced).toContain(NATURAL_LIGHTING)
      expect(enhanced).toContain(CORE_RAW_STYLE)
      expect(enhanced).not.toContain('rubber farm boots')
    })

    it('does not force dry-land posture on explicit seine-net earthen pond harvesting', () => {
      expect(shouldEnforceDryLandPosture('Indonesian farmers wading with seine net to harvest large earthen pond')).toBe(false)
      expect(shouldEnforceDryLandPosture('Indonesian farmer scattering pellets at tarpaulin catfish pond')).toBe(true)
    })

    it('strips buzzwords while enhancing', () => {
      const dirtyPrompt = 'Catfish pond, photorealistic, 8k, unreal engine, cinematic lighting'
      const enhanced = enhanceImagePromptToRealPhoto(dirtyPrompt)

      expect(enhanced).not.toContain('photorealistic')
      expect(enhanced).not.toContain('8k')
      expect(enhanced).not.toContain('unreal engine')
      expect(enhanced).not.toContain('cinematic lighting')
      expect(enhanced).toContain(CAMERA_SPECS)
      expect(enhanced).toContain(CORE_RAW_STYLE)
    })
  })

  describe('Commodity-specific Anatomical Mapping', () => {
    it('maps lele to African catfish Clarias gariepinus with barbels and scaleless body', () => {
      const enhanced = enhanceImagePromptToRealPhoto('Farmer inspecting lele pond')
      expect(enhanced).toContain(COMMODITY_SPECIES_VISUALS.lele.visualDescription)
      expect(enhanced).toContain('Clarias gariepinus')
      expect(enhanced).toContain('distinct barbels/whiskers')
    })

    it('maps nila to Nile tilapia Oreochromis niloticus with vertical stripes', () => {
      const enhanced = enhanceImagePromptToRealPhoto('Nila feeding time in freshwater pond')
      expect(enhanced).toContain(COMMODITY_SPECIES_VISUALS.nila.visualDescription)
      expect(enhanced).toContain('Oreochromis niloticus')
      expect(enhanced).toContain('vertical dark stripes')
    })

    it('maps vaname to Whiteleg shrimp Litopenaeus vannamei with paddlewheel splash', () => {
      const enhanced = enhanceImagePromptToRealPhoto('Checking shrimp on anco tray', {
        judul: 'Manajemen Pakan Udang Vaname Tambak Intensif',
      })
      expect(enhanced).toContain(COMMODITY_SPECIES_VISUALS.vaname.visualDescription)
      expect(enhanced).toContain('Litopenaeus vannamei')
      expect(enhanced).toContain('paddlewheel splash')
    })

    it('maps gurame, patin, gabus, bawal, lobster, and kepiting accurately', () => {
      expect(enhanceImagePromptToRealPhoto('Kolam gurame')).toContain('Osphronemus goramy')
      expect(enhanceImagePromptToRealPhoto('Panen patin')).toContain('Pangasianodon hypophthalmus')
      expect(enhanceImagePromptToRealPhoto('Kolam gabus')).toContain('Channa striata')
      expect(enhanceImagePromptToRealPhoto('Kolam bawal')).toContain('Colossoma macropomum')
      expect(enhanceImagePromptToRealPhoto('Shelter lobster')).toContain('Cherax quadricarinatus')
      expect(enhanceImagePromptToRealPhoto('Box apartemen kepiting')).toContain('Scylla serrata')
    })

    it('detects commodity from context.judul when prompt does not state it', () => {
      const enhanced = enhanceImagePromptToRealPhoto('Farmer checking pond aeration in early morning', {
        judul: 'Rahasia Sukses Budidaya Ikan Nila Bioflok',
        kategori: 'Pembenihan',
      })
      expect(enhanced).toContain('Oreochromis niloticus')
    })
  })

  describe('Edge Cases and Idempotency', () => {
    it('handles empty prompt with context judul', () => {
      const enhanced = enhanceImagePromptToRealPhoto('', {
        judul: 'Cara Budidaya Ikan Lele Pemula',
        kategori: 'Tips',
      })
      expect(enhanced).toContain('Indonesian aquaculture documentary scene')
      expect(enhanced).toContain('Clarias gariepinus')
      expect(enhanced).toContain(CAMERA_SPECS)
    })

    it('handles empty prompt without context gracefully', () => {
      const enhanced = enhanceImagePromptToRealPhoto('')
      expect(enhanced).toContain('Authentic Indonesian aquaculture facility')
      expect(enhanced).toContain(CAMERA_SPECS)
      expect(enhanced).toContain(CORE_RAW_STYLE)
    })

    it('is idempotent across multiple passes (does not duplicate metadata on 2nd and 3rd pass)', () => {
      const firstPass = enhanceImagePromptToRealPhoto('catfish pond')
      const secondPass = enhanceImagePromptToRealPhoto(firstPass)
      const thirdPass = enhanceImagePromptToRealPhoto(secondPass)

      // Count occurrences of CAMERA_SPECS in passes
      const matchesPass2 = secondPass.split(CAMERA_SPECS).length - 1
      const matchesPass3 = thirdPass.split(CAMERA_SPECS).length - 1
      expect(matchesPass2).toBe(1)
      expect(matchesPass3).toBe(1)
      expect(secondPass).toBe(firstPass)
      expect(thirdPass).toBe(firstPass)
    })

    it('does not duplicate species description if already in prompt', () => {
      const prompt =
        'African catfish (Clarias gariepinus), smooth dark black skin, distinct barbels/whiskers, scaleless elongated body in biofloc pond'
      const enhanced = enhanceImagePromptToRealPhoto(prompt)
      const count = enhanced.split('Clarias gariepinus').length - 1
      expect(count).toBe(1)
    })

    it('handles prompt consisting exclusively of buzzwords', () => {
      const enhanced = enhanceImagePromptToRealPhoto('photorealistic, 8k, unreal engine, octane render')
      expect(enhanced).toContain('Authentic Indonesian aquaculture facility')
      expect(enhanced).toContain(CAMERA_SPECS)
      expect(enhanced).toContain(CORE_RAW_STYLE)
    })
  })

  describe('Integration with buildFallbackImagePrompt', () => {
    it('produces prompt containing anti-AI raw realism metadata and species features', () => {
      const fallbackPrompt = buildFallbackImagePrompt('Teknik Budidaya Lele Bioflok Intensif', 'Manajemen Kolam')

      expect(fallbackPrompt).toContain(CAMERA_SPECS)
      expect(fallbackPrompt).toContain(REALISTIC_TEXTURES)
      expect(fallbackPrompt).toContain(NATURAL_LIGHTING)
      expect(fallbackPrompt).toContain(CORE_RAW_STYLE)
      expect(fallbackPrompt).toContain('Clarias gariepinus')
      expect(fallbackPrompt).not.toContain('photorealistic')
      expect(fallbackPrompt).not.toContain('hyperrealistic')
      expect(fallbackPrompt).not.toContain('unreal engine')
      expect(fallbackPrompt).toContain('no CGI')
      expect(fallbackPrompt).toContain('no 3D render')
    })

    it('produces prompt for shrimp vaname correctly', () => {
      const fallbackPrompt = buildFallbackImagePrompt('Strategi Manajemen Kualitas Air Tambak Vaname', 'Manajemen Kolam')

      expect(fallbackPrompt).toContain('Litopenaeus vannamei')
      expect(fallbackPrompt).toContain(CAMERA_SPECS)
      expect(fallbackPrompt).toContain(CORE_RAW_STYLE)
    })

    it('produces prompt for bawal correctly', () => {
      const fallbackPrompt = buildFallbackImagePrompt('Cara Pembesaran Ikan Bawal di Kolam Terpal', 'Manajemen Kolam')

      expect(fallbackPrompt).toContain('Colossoma macropomum')
      expect(fallbackPrompt).toContain(CAMERA_SPECS)
      expect(fallbackPrompt).toContain(CORE_RAW_STYLE)
    })
  })
})
