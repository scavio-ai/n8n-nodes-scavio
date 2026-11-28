import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['mouser'], operation, ...extra },
});

// Mouser Electronics (mouser.com, the electronic component distributor), 4 operations; credits_used is the truth.
// Markets us (USD) and uk (mouser.co.uk, GBP); Get Categories reads mouser.com only. 2 credits per call; every
// operation carries a 300s timeout (pages take 30 to 160 s, up to about 240).
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 300000 },
});

const SITE =
	'Mouser Electronics (mouser.com, the electronic component distributor), prices as the storefront shows them to a visitor who is not signed in, per piece; stock as the page shows it when fetched';
const BILL =
	'Costs 2 credits. Failed upstream calls and refused inputs are not charged; a not-found is charged. credits_used says what was charged.';

const market = (name: string, operation: string): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: [
		{ name: 'United States (mouser.com, USD)', value: 'us' },
		{ name: 'United Kingdom (mouser.co.uk, GBP)', value: 'uk' },
	],
	displayOptions: show([operation]),
	description: 'The Mouser storefront',
	routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
});

export const mouserOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['mouser'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get mouser categories',
				description: `The electronic components category tree of ${SITE}, read from mouser.com. ${BILL} Returns top-level categories, groups and subcategories with part counts; any category value is the Category Path of Search Parts, in either market.`,
				routing: request('/api/v1/mouser/categories'),
			},
			{
				name: 'Get Manufacturer',
				value: 'manufacturer',
				action: 'Get a mouser manufacturer',
				description: `One manufacturer's profile on ${SITE}, by slug or link. ${BILL} Returns the logo, the ECIA authorized flag, sections and the product categories Mouser links for it.`,
				routing: request('/api/v1/mouser/manufacturer'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a mouser product',
				description: `One part of ${SITE}, by Mouser part number or the URL of a search row (a number with a / needs the URL): the full price table per packaging, stock, on-order quantities and dates, factory lead time, minimum and multiple, specifications, documents, trade codes and country of origin. Captured 2026-11-28: 595-NE555P, Texas Instruments NE555P, 0.59 USD at 1 piece, 26-week factory lead time. ${BILL}`,
				routing: request('/api/v1/mouser/product'),
			},
			{
				name: 'Search Parts',
				value: 'search',
				action: 'Search mouser parts',
				description: `Search ${SITE}, by keyword or part number, across the catalog or within a category, 25 parts a page in Mouser's own order (no sort): price breaks per packaging, stock, on-order quantities and dates, factory lead time and lifecycle, with the matching categories and manufacturers. Captured 2026-11-28: LM7805 matched 33 parts on 2 pages. ${BILL}`,
				routing: request('/api/v1/mouser/search'),
			},
		],
		default: 'search',
	},
];

export const mouserFields: INodeProperties[] = [
	// -- Search Parts --
	{
		displayName: 'Keywords or Part Number',
		name: 'mouserQuery',
		type: 'string',
		default: '',
		placeholder: 'LM7805',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		description: 'Keywords, a manufacturer part number or a Mouser part number. Send keywords, a category path or both.',
	},
	{
		displayName: 'Additional Options',
		name: 'mouserSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Category Path',
				name: 'mouserCategory',
				type: 'string',
				default: '',
				placeholder: 'semiconductors/integrated-circuits-ics',
				description: 'A Mouser category path (categories[].category of Get Categories or of a keyword search) or a Mouser category link',
				routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'mouserPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Results page, 1 to 200, 25 parts each',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
		],
	},
	market('mouserSearchCountry', 'search'),

	// -- Get Product --
	{
		displayName: 'Mouser Part Number or URL',
		name: 'mouserProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '595-NE555P',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					mouser_part_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A Mouser part number (items[].mouser_part_number) or the exact product link of a search row (with its qs= part)',
	},
	market('mouserProductCountry', 'product'),

	// -- Get Manufacturer --
	{
		displayName: 'Manufacturer Slug or URL',
		name: 'mouserManufacturer',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'texas-instruments',
		displayOptions: show(['manufacturer']),
		routing: {
			request: {
				body: {
					manufacturer: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The manufacturer\'s Mouser slug (items[].manufacturer_slug) or a Mouser manufacturer link',
	},
	market('mouserManufacturerCountry', 'manufacturer'),
];
