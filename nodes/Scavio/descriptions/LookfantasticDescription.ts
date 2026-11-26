import type { INodeProperties } from 'n8n-workflow';
import { thgBeautyDescriptions } from './ThgBeautyShared';

// Lookfantastic (lookfantastic.com, THG's beauty retailer with 10 country sites), 7 operations, 1
// credit each; credits_used is the truth. Market (10 sites) on every operation; Currency for the
// gb site (22 currencies) and the pl site (PLN or EUR). Every operation carries a 240s timeout
// (set in ThgBeautyShared.ts).

const LF_INTL = [
	'GBP', 'USD', 'EUR', 'AUD', 'CAD', 'CHF', 'SEK', 'DKK', 'NOK', 'JPY', 'KRW', 'HKD', 'SGD', 'AED', 'SAR', 'ILS', 'NZD', 'CNY', 'MYR', 'TWD', 'THB', 'IDR',
];

const d = thgBeautyDescriptions({
	id: 'lookfantastic',
	name: 'Lookfantastic',
	first: "Lookfantastic (lookfantastic.com, THG's beauty retailer with 10 country sites)",
	markets: [
		{ code: 'gb', label: 'UK and International (lookfantastic.com, 22 Currencies)', currencies: LF_INTL },
		{ code: 'de', label: 'Germany (lookfantastic.de, EUR)', currencies: ['EUR'] },
		{ code: 'fr', label: 'France (lookfantastic.fr, EUR)', currencies: ['EUR'] },
		{ code: 'es', label: 'Spain (lookfantastic.es, EUR)', currencies: ['EUR'] },
		{ code: 'it', label: 'Italy (lookfantastic.it, EUR)', currencies: ['EUR'] },
		{ code: 'nl', label: 'Netherlands (lookfantastic.nl, EUR)', currencies: ['EUR'] },
		{ code: 'pl', label: 'Poland (lookfantastic.pl, PLN or EUR)', currencies: ['PLN', 'EUR'] },
		{ code: 'at', label: 'Austria (lookfantastic.at, EUR)', currencies: ['EUR'] },
		{ code: 'ie', label: 'Ireland (lookfantastic.ie, EUR)', currencies: ['EUR'] },
		{ code: 'eu', label: 'EU Site (eu.lookfantastic.com, EUR)', currencies: ['EUR'] },
	],
	marketsNote:
		"Each site answers in its own language (de and at German, fr French, es Spanish, it Italian, nl Dutch, pl Polish, gb, ie and eu English) and its own prices; the eu site has euro prices of its own",
	filters: [
		{ field: 'brand', displayName: 'Brand', placeholder: 'CeraVe', description: 'Brand as the site names it, exact (facets option value)' },
		{ field: 'skin_type', displayName: 'Skin Type', placeholder: 'Dry', description: "Skin type as the site lists it, in the site's language" },
		{ field: 'concern', displayName: 'Concern', placeholder: 'Anti-Ageing', description: 'Skincare concern as the site lists it' },
		{ field: 'spf', displayName: 'SPF', placeholder: 'SPF 50+', description: 'SPF band as the site lists it' },
		{ field: 'key_ingredient', displayName: 'Key Ingredient', placeholder: 'Retinol', description: 'Key ingredient as the site lists it' },
		{ field: 'formulation', displayName: 'Formulation', placeholder: 'Vegan', description: 'Formulation as the site lists it (e.g. Vegan, Fragrance Free, Alcohol Free)' },
	],
	filtersProse: 'brand, skin type, concern, SPF band, key ingredient, formulation',
	listExamples: 'a category (/health-beauty/face/skincare-products/moisturisers), brand (/brands/cerave), sale or offer page (Black Friday: /black-friday)',
	listPlaceholder: '/brands/cerave',
	landingSuffix: 'view-all',
	host: 'lookfantastic.com',
	offersNote: '',
	captured: {
		search:
			'Captured 2026-11-26: PIXI Glow Tonic 250ml (SKU 11200055) at 12.6 GBP against an RRP of 18 (30% off) on lookfantastic.com, and 14.49 EUR (RRP 20.7) on lookfantastic.fr.',
		product:
			'Captured 2026-11-26: PIXI Glow Tonic 250ml (SKU 11200055, barcode 885190821006) at 12.6 GBP with 2 size variants (100ml at 7 GBP) and the offer "Save 30% + Extra 5% off | Use Code: EXTRA".',
		offers: 'Captured 2026-11-26: 7 offers on lookfantastic.com.',
		brands: 'Captured 2026-11-26: 415 brands on lookfantastic.com.',
	},
	examples: { query: 'glow tonic', sku: '11200055', suggest: 'cerave', letter: 'C' },
});

export const lookfantasticOperations: INodeProperties[] = d.operations;
export const lookfantasticFields: INodeProperties[] = d.fields;
