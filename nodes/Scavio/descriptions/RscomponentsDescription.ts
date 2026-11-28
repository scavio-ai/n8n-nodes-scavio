import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rscomponents'], operation, ...extra },
});

// RS Components (rs-online.com, RS Group's electronic and industrial component distributor), 4 operations;
// credits_used is the truth. Markets uk (GBP), de (EUR, German text) and au (AUD); stock differs per market. RS
// Americas (us.rs-online.com) is not covered. 2 credits per call; every operation carries a 240s timeout (pages take
// 15 to 120 s).
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const SITE =
	"RS Components (rs-online.com, RS Group's electronic and industrial component distributor), prices excluding VAT as shown to a visitor who is not signed in; stock is the market's own, as the page shows it when fetched";
const BILL =
	'Costs 2 credits. Failed upstream calls and refused inputs are not charged; a not-found is charged. credits_used says what was charged.';
const GRID =
	"20 a page with stock number, title, MPN, brand, unit price and pack price labelled, pack size, stock status, lifecycle and key specs; facets are the site's filters listed with counts (not applicable as filters). No sort.";

const market = (name: string, operation: string): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'uk',
	options: [
		{ name: 'United Kingdom (uk.rs-online.com, GBP)', value: 'uk' },
		{ name: 'Germany (de.rs-online.com, EUR)', value: 'de' },
		{ name: 'Australia (au.rs-online.com, AUD)', value: 'au' },
	],
	displayOptions: show([operation]),
	description: 'The RS market; a link picks its own market. RS Americas (us.rs-online.com) is not covered.',
	routing: { request: { body: { country: '={{ $value === "uk" ? undefined : $value }}' } } },
});

const pageOption = (prefix: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: [
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Results page, 1 to 500, 20 products each',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
	],
});

export const rscomponentsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rscomponents'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get rs components brand products',
				description: `One brand's products on ${SITE}, by slug or link: ${GRID} ${BILL}`,
				routing: request('/api/v1/rscomponents/brand'),
			},
			{
				name: 'Get Category',
				value: 'category',
				action: 'Get an rs components category',
				description: `One category of ${SITE}, by path or link: breadcrumbs, child categories, the site's curated filtered listings and its products, ${GRID} ${BILL}`,
				routing: request('/api/v1/rscomponents/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an rs components product',
				description: `One product of ${SITE}, by stock number or link: price breaks, the VAT-inclusive unit price, unit and pack price, pack size, the market's own stock with its ship-date schedule (no lead time in weeks), RoHS, country of origin, datasheets and specs. Alternative products are not returned. Captured 2026-11-28: 221-5535, Texas Instruments NE555P, 0.304 GBP a unit (0.365 with VAT) in packs of 50. ${BILL}`,
				routing: request('/api/v1/rscomponents/product'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search rs components products',
				description: `Search ${SITE}, by keyword, MPN or stock number. ${BILL} Returns ${GRID} Captured 2026-11-28 on uk.rs-online.com: BC547 matched 10 products.`,
				routing: request('/api/v1/rscomponents/search'),
			},
		],
		default: 'search',
	},
];

export const rscomponentsFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords or Part Number',
		name: 'rscomponentsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BC547',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords, a manufacturer part number (MPN) or an RS stock number',
	},
	pageOption('rscomponentsSearch', 'search'),
	market('rscomponentsSearchCountry', 'search'),

	// -- Get Product --
	{
		displayName: 'Stock Number or URL',
		name: 'rscomponentsProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '221-5535',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					stock_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'An RS stock number (items[].stock_number, with or without the dash) or an RS product link',
	},
	market('rscomponentsProductCountry', 'product'),

	// -- Get Category --
	{
		displayName: 'Category Path or URL',
		name: 'rscomponentsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'semiconductors/power-management-ics/voltage-regulators',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description: 'A category path as the market writes it (child_categories[].path) or its /web/c/ link',
	},
	pageOption('rscomponentsCategory', 'category'),
	market('rscomponentsCategoryCountry', 'category'),

	// -- Get Brand Products --
	{
		displayName: 'Brand Slug or URL',
		name: 'rscomponentsBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'texas-instruments',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand slug (brand_slug of a product) or its /web/b/ link',
	},
	pageOption('rscomponentsBrand', 'brand'),
	market('rscomponentsBrandCountry', 'brand'),
];
