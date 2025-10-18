import { z } from 'zod';

export const translationResponseSchema = z.object({ text: z.string() });

export type TranslationResponse = z.infer<typeof translationResponseSchema>;
