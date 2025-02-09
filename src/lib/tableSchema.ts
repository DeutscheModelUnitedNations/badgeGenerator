import { z } from 'zod';

// Define a base schema with the common properties
const baseSchema = z.object({
	name: z.string(),
	committee: z.string().optional(),
	countryName: z.string(),
	countryAlpha2Code: z.string().optional(),
	alternativeImage: z.string().optional()
});

export const placardSchema = z.array(baseSchema);

export type PlacardDataTable = z.infer<typeof placardSchema>;
export type PlacardDataRow = PlacardDataTable[number];

export const badgeSchema = z.array(
	baseSchema.extend({
		pronouns: z.string().optional()
	})
);

export type BadgeDataTable = z.infer<typeof badgeSchema>;
export type BadgeDataRow = BadgeDataTable[number];

export type TableSchema = PlacardDataTable | BadgeDataTable;
