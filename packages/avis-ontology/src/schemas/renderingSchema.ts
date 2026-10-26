import { z } from 'zod';

export const RenderingTargetSchema = z.enum([
  'UNIVERSAL',
  'FLUX',
  'MIDJOURNEY',
  'SD'
]);

export const RenderingPropertySchema = z.object({
  id: z.string().min(1, "Rendering property ID cannot be empty"),
  targetModel: RenderingTargetSchema,
  promptText: z.string().min(1, "Prompt text cannot be empty"),
  weight: z.number().min(0).max(2).default(1.0),
  isNegative: z.boolean().default(false),
});
