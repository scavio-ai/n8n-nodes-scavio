import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['digikey'], operation, ...extra },
});

// DigiKey (digikey.com, the electronic component distributor), 3 operations; credits_used is the truth. Markets us
// (USD), ca (CAD; Get Product and Get Categories only) and de (EUR, German labels, prices without VAT). 2 credits per
// call; Get Product by DigiKey part number is held at 4 (2 when it lands straight on a digikey.com product page).
// Every operation carries a 300s timeout (pages take 10 to 40 s, up to about 200).
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 300000 },
});

const SITE =
	'DigiKey (digikey.com, the electronic component distributor), prices as DigiKey lists them to a visitor who is not signed in, with price breaks per packaging; stock is one number for every market, as the page shows it when fetched';
const BILL =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged what it spent. credits_used says what was charged.';

const market = (name: string, operation: string, withCanada: boolean): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: [
		{ name: 'United States (digikey.com, USD)', value: 'us' },
		...(withCanada ? [{ name: 'Canada (digikey.ca, CAD)', value: 'ca' }] : []),
		{ name: 'Germany (digikey.de, EUR, Prices Without VAT)', value: 'de' },
	],
	displayOptions: show([operation]),
	description: withCanada
		? 'The DigiKey storefront; a product link sets its own market'
		: 'Search serves digikey.com and digikey.de; for digikey.ca use Get Product and Get Categories',
	routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
});

export const digikeyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['digikey'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get digikey categories',
				description: `The product categories of ${SITE}: the top-level categories, or one category by ID with its subcategories and product counts; leaf true marks a category whose rows Search Parts returns with a category ID. Costs 2 credits. ${BILL}`,
				routing: request('/api/v1/digikey/categories'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a digikey product',
				description: `One product of ${SITE}, by link or DigiKey part number: price breaks per packaging, minimum order and multiple, stock, the manufacturer's standard lead time, Part Status, RoHS / REACH / MSL / ECCN / HTSUS, documents, related parts and the substitutes DigiKey's page lists. Captured 2026-11-28: 497-1575-5-ND, STMicroelectronics LM317T, 1.19 USD at 1 piece, 30-week standard lead time. Costs 2 credits by link; a DigiKey part number is held at 4 (2 when it lands straight on a digikey.com product page). ${BILL}`,
				routing: request('/api/v1/digikey/product'),
			},
			{
				name: 'Search Parts',
				value: 'search',
				action: 'Search digikey parts',
				description: `Search ${SITE}, by keyword or part number: exact part matches and the categories holding them; with a leaf category ID, page 1 of that category's rows (25, in DigiKey's order; narrow with keywords and Filters) with price breaks, stock and specs, plus filter_check per filter. Captured 2026-11-28: LM317 in category 699 with Manufacturer Texas Instruments and In Stock matched 62 parts. Costs 2 credits. ${BILL}`,
				routing: request('/api/v1/digikey/search'),
			},
		],
		default: 'search',
	},
];

export const digikeyFields: INodeProperties[] = [
	// -- Search Parts --
	{
		displayName: 'Keywords or Part Number',
		name: 'digikeyQuery',
		type: 'string',
		default: '',
		placeholder: 'LM7805',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		description: 'Keywords, a manufacturer part number or a DigiKey part number. Send keywords, a category ID or both.',
	},
	{
		displayName: 'Additional Options',
		name: 'digikeySearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Category ID',
				name: 'digikeyCategoryId',
				type: 'string',
				default: '',
				placeholder: '699',
				description: 'A leaf category ID (categories[].ID where leaf is true) or a DigiKey category link: returns that category\'s product rows',
				routing: { request: { body: { category_id: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Filters (JSON)',
				name: 'digikeyFilters',
				type: 'json',
				default: '{}',
				description: 'With a category ID: {"facet ID": ["option ID", ...]} from facets[] and common_filters[] of a category search, e.g. {"-1": ["296"]} for Manufacturer Texas Instruments, {"-2": ["5"]} for In Stock. Up to 10 filters.',
				routing: {
					request: {
						body: {
							filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}',
						},
					},
				},
			},
		],
	},
	market('digikeySearchCountry', 'search', false),

	// -- Get Product --
	{
		displayName: 'Product URL or DigiKey Part Number',
		name: 'digikeyProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '497-1575-5-ND',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					digikey_part_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A DigiKey product link (its site sets the market) or a DigiKey part number (items[].digikey_part_number)',
	},
	market('digikeyProductCountry', 'product', true),

	// -- Get Categories --
	{
		displayName: 'Category ID',
		name: 'digikeyCategory',
		type: 'string',
		default: '',
		placeholder: '32',
		displayOptions: show(['categories']),
		routing: { request: { body: { category_id: '={{ String($value).trim() || undefined }}' } } },
		description: 'A category ID (categories[].ID) for its subcategories and product counts; leave empty for the top-level categories',
	},
	market('digikeyCategoriesCountry', 'categories', true),
];
