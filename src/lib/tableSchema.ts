import { z } from 'zod';
import WorldCountries from 'world-countries';

// Define a base schema with the common properties
export const rowSchema = z
	.object({
		name: z.string().optional(),
		committee: z.string().optional(),
		countryName: z.string().optional(),
		countryAlpha2Code: z
			.string()
			.optional()
			.refine(
				(value) => {
					if (
						WorldCountries.map((country) => country.cca2.toLocaleLowerCase()).includes(
							value?.toLocaleLowerCase() ?? ''
						)
					)
						return true;
					if (value?.toLocaleLowerCase() === 'un') return true;
					if (value === '' || value === undefined) return true;
					return false;
				},
				{
					message:
						'Zelle muss ein gültiger <strong>ISO 3166-1 alpha-2 Code</strong> oder <span class="badge badge-neutral">UN</span> für die UN-Flagge sein'
				}
			),

		alternativeImage: z.string().optional(),
		pronouns: z.string().optional(),
		id: z.union([z.string(), z.number()]).optional().transform((val) => val?.toString()),
		mediaConsentStatus: z
			.enum(['NOT_ALLOWED', 'PARTIALLY_ALLOWED', 'ALLOWED_ALL', 'NOT_SET'], {
				description: 'Mediennutzungserlaubnis'
			})
			.optional()
	})
	// Require either name OR committee
	.refine((data) => data.name || data.committee, {
		message: `Entweder <span class="badge badge-neutral">name</span> oder <span class="badge badge-neutral">committee</span> muss einen Wert enthalten`
	})
	// Require either countryAlpha2Code OR alternativeImage
	.refine((data) => data.countryAlpha2Code || data.alternativeImage, {
		message: `Entweder <span class="badge badge-neutral">countryAlpha2Code</span> oder <span class="badge badge-neutral">alternativeImage</span> muss einen Wert enthalten`
	})
	// Don't allow both countryAlpha2Code AND alternativeImage
	.refine((data) => !(data.countryAlpha2Code && data.alternativeImage), {
		message: `<span class="badge badge-neutral">countryAlpha2Code</span> und <span class="badge badge-neutral">alternativeImage</span> dürfen nicht gleichzeitig einen Wert enthalten`
	})
	// Require countryName when using alternativeImage without countryAlpha2Code
	.refine((data) => !(data.alternativeImage && !data.countryAlpha2Code && !data.countryName), {
		message: `<span class="badge badge-neutral">countryName</span> muss einen Wert enthalten, wenn <span class="badge badge-neutral">alternativeImage</span> ohne <span class="badge badge-neutral">countryAlpha2Code</span> verwendet wird`
	});

export const tableSchema = z.array(rowSchema);

export type TableSchema = z.infer<typeof tableSchema>;
export type TableRow = z.infer<typeof rowSchema>;
