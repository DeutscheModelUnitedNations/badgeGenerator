import WorldCountries from 'world-countries';
import type { CountryNameLanguage } from './types';
import type { TableRow, TableSchema } from './tableSchema';

// Resolved row type where name and countryName are guaranteed to be present
export type ResolvedTableRow = Omit<TableRow, 'name' | 'countryName'> & {
	name: string;
	countryName: string;
};
export type ResolvedTableSchema = ResolvedTableRow[];

// UN name translations for all supported languages
export const UN_TRANSLATIONS: Record<CountryNameLanguage, string> = {
	ara: 'الأمم المتحدة',
	ces: 'Spojené národy',
	deu: 'Vereinte Nationen',
	eng: 'United Nations',
	est: 'Ühendatud Rahvaste Organisatsioon',
	fin: 'Yhdistyneet kansakunnat',
	fra: 'Nations Unies',
	hrv: 'Ujedinjeni narodi',
	hun: 'Egyesült Nemzetek',
	ita: 'Nazioni Unite',
	jpn: '国際連合',
	kor: '국제 연합',
	nld: 'Verenigde Naties',
	per: 'سازمان ملل متحد',
	pol: 'Organizacja Narodów Zjednoczonych',
	por: 'Nações Unidas',
	rus: 'Организация Объединённых Наций',
	slk: 'Organizácia Spojených národov',
	spa: 'Naciones Unidas',
	srp: 'Уједињене нације',
	swe: 'Förenta nationerna',
	tur: 'Birleşmiş Milletler',
	urd: 'اقوام متحدہ',
	zho: '联合国'
};

/**
 * Resolves a country name from an alpha-2 code using world-countries library
 */
export function resolveCountryName(
	alpha2Code: string,
	language: CountryNameLanguage = 'deu'
): string | undefined {
	const code = alpha2Code.toUpperCase();

	// Handle UN special case
	if (code === 'UN') {
		return UN_TRANSLATIONS[language];
	}

	// Find the country in world-countries
	const country = WorldCountries.find((c) => c.cca2.toUpperCase() === code);
	if (!country) {
		return undefined;
	}

	// Try to get the translation for the specified language
	const translation = country.translations[language];
	if (translation?.common) {
		return translation.common;
	}

	// Fallback to English common name
	return country.name.common;
}

/**
 * Resolves table data by filling in missing countryName and name fields
 * - countryName: auto-filled from countryAlpha2Code using the specified language
 * - name: auto-filled from committee if name is missing
 * User-provided values are never overwritten
 * Returns data with guaranteed name and countryName fields
 */
export function resolveTableData(
	data: TableSchema,
	language: CountryNameLanguage = 'deu'
): ResolvedTableSchema {
	return data.map((row) => {
		const resolved = { ...row };

		// Resolve countryName from countryAlpha2Code if missing
		if (!resolved.countryName && resolved.countryAlpha2Code) {
			const resolvedName = resolveCountryName(resolved.countryAlpha2Code, language);
			if (resolvedName) {
				resolved.countryName = resolvedName;
			} else {
				// Fallback to the code itself if resolution fails
				resolved.countryName = resolved.countryAlpha2Code.toUpperCase();
			}
		}

		// Resolve name from committee if name is missing
		// Clear committee when used as name to avoid duplication in display
		if (!resolved.name && resolved.committee) {
			resolved.name = resolved.committee;
			resolved.committee = undefined;
		}

		// Default mediaConsentStatus to ALLOWED_ALL if missing or empty
		if (!resolved.mediaConsentStatus) {
			resolved.mediaConsentStatus = 'ALLOWED_ALL';
		}

		// Ensure name and countryName are always strings (validation should have caught this)
		return {
			...resolved,
			name: resolved.name ?? '',
			countryName: resolved.countryName ?? ''
		} as ResolvedTableRow;
	});
}
