import { z } from 'zod';

export const translationResponseSchema = z.object({ text: z.string() });

export type TranslationResponse = z.infer<typeof translationResponseSchema>;

export const summaryResponseSchema = z.object({ summary: z.string() });

export type SummaryResponse = z.infer<typeof summaryResponseSchema>;
