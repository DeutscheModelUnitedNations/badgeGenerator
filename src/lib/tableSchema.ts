import { z } from 'zod';
import WorldCountries from 'world-countries';

// Define a base schema with the common properties
export const rowSchema = z
	.object({
		name: z.string().nonempty({
			message: 'Zelle muss einen Wert enthalten'
		}),
		committee: z.string().optional(),
		countryName: z.string().nonempty({
			message: 'Zelle muss einen Wert enthalten'
		}),
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
		pronouns: z.string().optional()
	})
	.refine((data) => data.countryAlpha2Code || data.alternativeImage, {
		message: `Entweder <span class="badge badge-neutral">countryAlpha2Code</span> oder <span class="badge badge-neutral">alternativeImage</span> muss einen Wert enthalten`
	})
	.refine((data) => !(data.countryAlpha2Code && data.alternativeImage), {
		message: `<span class="badge badge-neutral">countryAlpha2Code</span> und <span class="badge badge-neutral">alternativeImage</span> dürfen nicht gleichzeitig einen Wert enthalten`
	});

export const tableSchema = z.array(rowSchema);

export type TableSchema = z.infer<typeof tableSchema>;
export type TableRow = z.infer<typeof rowSchema>;
