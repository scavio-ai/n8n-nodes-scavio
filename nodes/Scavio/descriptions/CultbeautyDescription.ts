import type { INodeProperties } from 'n8n-workflow';
import { thgBeautyDescriptions } from './ThgBeautyShared';

// Cult Beauty (cultbeauty.co.uk, THG's beauty retailer), 7 operations, 1 credit each; credits_used
// is the truth. Market gb (cultbeauty.co.uk) or intl (cultbeauty.com) on every operation, each with
// the same 12 currencies (GBP default on gb, EUR on intl). Get Offers is not available on intl
// (no voucher-codes page: a 400, not charged). Every operation carries a 240s timeout (set in
// ThgBeautyShared.ts).

const CB_OTHER = ['USD', 'AUD', 'CHF', 'AED', 'SAR', 'ILS', 'HKD', 'SGD', 'JPY', 'CNY'];

const d = thgBeautyDescriptions({
	id: 'cultbeauty',
	name: 'Cult Beauty',
	first: "Cult Beauty (cultbeauty.co.uk, THG's beauty retailer)",
	markets: [
		{ code: 'gb', label: 'UK (cultbeauty.co.uk, GBP Default)', currencies: ['GBP', 'EUR', ...CB_OTHER] },
		{ code: 'intl', label: 'International (cultbeauty.com, EUR Default)', currencies: ['EUR', 'GBP', ...CB_OTHER] },
	],
	marketsNote:
		'Both sites are in English and take the same 12 currencies, each with its own price list. Get Offers is not available on International (cultbeauty.com has no voucher-codes page)',
	filters: [
		{ field: 'brand', displayName: 'Brand', placeholder: 'CeraVe', description: 'Brand as Cult Beauty names it, exact (facets option value)' },
		{ field: 'skin_type', displayName: 'Skin Type', placeholder: 'Dry', description: 'Skin type as Cult Beauty lists it' },
		{ field: 'concern', displayName: 'Concern', placeholder: 'Anti-Ageing', description: 'Skin concern as Cult Beauty lists it (e.g. Anti-Ageing, Dry, Dullness)' },
		{ field: 'spf', displayName: 'SPF', placeholder: 'SPF 30+', description: 'SPF content as Cult Beauty lists it (e.g. No SPF, SPF 15+, SPF 30+)' },
		{ field: 'key_ingredient', displayName: 'Key Ingredient', placeholder: 'Retinol', description: 'Key ingredient as Cult Beauty lists it' },
		{ field: 'formulation', displayName: 'Formulation', placeholder: 'Vegan', description: 'Formulation as Cult Beauty lists it (e.g. Vegan, Alcohol Free)' },
		{ field: 'range', displayName: 'Range', placeholder: 'Advanced Snail 96', description: "A brand's product range as Cult Beauty lists it" },
	],
	filtersProse: "brand, skin type, concern, SPF content, key ingredient, formulation, a brand's product range",
	listExamples: 'a category (/skin-care), brand (/brands/cerave), sale or offer page (Black Friday: /black-friday-cyber-monday)',
	listPlaceholder: '/skin-care',
	landingSuffix: 'shop-all',
	host: 'cultbeauty.co.uk',
	offersNote: 'Not available on International (cultbeauty.com has no voucher-codes page): a 400, not charged. ',
	captured: {
		search:
			'Captured 2026-11-26: PIXI Glow Tonic 250ml (SKU 11200055) at 12.6 GBP against an RRP of 18 (30% off) on cultbeauty.co.uk, and 14.21 EUR (RRP 20.3) on cultbeauty.com.',
		product:
			'Captured 2026-11-26: NARS Afterglow Lip Balm - Triple X (SKU 17661748) at 19.18 GBP against an RRP of 29.5 (35% off), with 9 shade variants.',
		offers: 'Captured 2026-11-26: 9 offers on cultbeauty.co.uk.',
		brands: 'Captured 2026-11-26: 289 brands on cultbeauty.co.uk.',
	},
	examples: { query: 'glow tonic', sku: '11200055', suggest: 'olaplex', letter: 'C' },
});

export const cultbeautyOperations: INodeProperties[] = d.operations;
export const cultbeautyFields: INodeProperties[] = d.fields;
