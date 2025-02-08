import { z } from 'zod';

export const placardSchema = z.array(
	z.object({
		name: z.string(),
		committee: z.string().optional(),
		countryName: z.string(),
		countryAlpha2Code: z.string().optional(),
		alternativeImage: z.string().optional()
	})
);

export type PlacardDataTable = z.infer<typeof placardSchema>;
export type PlacardDataRow = PlacardDataTable[number];

export const badgeSchema = z.array(
	z.object({
		name: z.string(),
		pronouns: z.string().optional(),
		committee: z.string().optional(),
		countryName: z.string(),
		countryAlpha2Code: z.string().optional(),
		alternativeImage: z.string().optional()
	})
);

export type BadgeDataTable = z.infer<typeof badgeSchema>;
export type BadgeDataRow = BadgeDataTable[number];
