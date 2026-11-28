import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['supplyhouse'], operation, ...extra },
});

// SupplyHouse.com (supplyhouse.com, the US online plumbing, HVAC and electrical supply store), 7 operations, 1 credit
// each; credits_used is the truth. United States, USD. Pages are slow (usually 20 to 120 s, up to about 240 s): every
// operation carries a 250s timeout except Get Categories (180s).
const request = (url: string, timeout: number) => ({
	request: { method: 'POST' as const, url, timeout },
});
const PAGE_MS = 250000;
const MENU_MS = 180000;

const SITE =
	'SupplyHouse.com (supplyhouse.com, the US online plumbing, HVAC and electrical supply store), United States, prices in USD as supplyhouse.com shows them to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	'unit_price is the price of one piece (each), box_price the price of one box of box_quantity pieces; price_tiers are the quantity-break prices; price_hidden true when SupplyHouse does not show the price on the page (no price returned).';
const LIST =
	'Returns page_type, total, page, total_pages, has_more, count, items (product_id for Get Product, name, brand, URL, unit_price, box_price, box_quantity, price_tiers, price_hidden, in_stock, total_available, rating, reviews_count, key_specs), subcategories, groups and facets with counts.';

const pageOption = (prefix: string, operation: string, max: number, each: string): INodeProperties => ({
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
			typeOptions: { minValue: 1, maxValue: max },
			description: `Results page, 1 to ${max}, ${each}`,
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
	],
});

const productField = (name: string, operation: string, placeholder: string): INodeProperties => ({
	displayName: 'SKU or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description: 'A SupplyHouse SKU (product_id of a search item, the part number on a product page) or a supplyhouse.com product link',
});

export const supplyhouseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['supplyhouse'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get supply house brand products',
				description: `One brand's products on ${SITE}, 48 a page in SupplyHouse's order. ${LIST} ${PRICES} An unknown brand is a charged not-found. Captured 2026-11-28: PVI listed 20 products. ${ONE}`,
				routing: request('/api/v1/supplyhouse/brand', PAGE_MS),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get supply house categories',
				description: `The top-level departments of ${SITE} as the site menu lists them, with the path Get Category takes. Captured 2026-11-28: 8 departments. ${ONE}`,
				routing: request('/api/v1/supplyhouse/categories', MENU_MS),
			},
			{
				name: 'Get Category',
				value: 'category',
				action: 'Get a supply house category',
				description: `One category page of ${SITE} by link or path: its subcategories, sub-type groups or products 48 a page (page_type says which). ${LIST} ${PRICES} An unknown category is a charged not-found. Captured 2026-11-28: PEX-Fittings-525000 listed 19 subcategories. ${ONE}`,
				routing: request('/api/v1/supplyhouse/category', PAGE_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a supply house product',
				description: `One product of ${SITE} by SKU or link: unit_price, box_price, box_quantity, price_tiers, price_hidden, in_stock, total_available, lead_times (how many ship by when, from which warehouse), discontinued and replacement, variants, alternatives, accessories, specifications, documents (spec sheets, install instructions, warranty PDFs) and shipping dimensions. Delivery dates for a ZIP code are not returned. Captured 2026-11-28: a 3/8 in. PEX crimp elbow at 0.62 USD each or 27.50 USD a box of 50, 1,919 available. ${ONE}`,
				routing: request('/api/v1/supplyhouse/product', PAGE_MS),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get supply house questions',
				description: `Customer questions and answers of one product of ${SITE}, 10 a page, newest first; is_expert marks SupplyHouse staff answers. No asker or answerer names. Captured 2026-11-28: the Taco 007-F5 circulator had 77 questions. ${ONE}`,
				routing: request('/api/v1/supplyhouse/questions', PAGE_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get supply house reviews',
				description: `Customer reviews of one product of ${SITE}, 10 a page, newest first, with average_rating, rating_count, recommended_ratio and the rating histogram. No reviewer names. Captured 2026-11-28: a PEX crimp elbow averaged 4.47 over 17 ratings. ${ONE}`,
				routing: request('/api/v1/supplyhouse/reviews', PAGE_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search supply house products',
				description: `Search ${SITE} by keyword, part number or SKU, 48 a page in SupplyHouse's order; a keyword the site sends to a category or product answers that page with redirected_to. ${LIST} ${PRICES} Captured 2026-11-28: hot surface igniter matched 551 products. ${ONE}`,
				routing: request('/api/v1/supplyhouse/search', PAGE_MS),
			},
		],
		default: 'search',
	},
];

export const supplyhouseFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'supplyhouseQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hot surface igniter',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords, a part number or a SupplyHouse SKU',
	},
	pageOption('supplyhouseSearch', 'search', 100, '48 products each'),

	// -- Get Category --
	{
		displayName: 'Category Path or URL',
		name: 'supplyhouseCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'PEX-Fittings-525000',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A supplyhouse.com category path (path of Get Categories, subcategories[].path, groups[].path) or a category link',
	},
	pageOption('supplyhouseCategory', 'category', 100, '48 products each'),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'supplyhouseBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Taco',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand as its supplyhouse.com path names it (brand_path of a search item, e.g. Taco, PVI, Bluefin) or a brand link',
	},
	pageOption('supplyhouseBrand', 'brand', 100, '48 products each'),

	// -- Get Product, Get Reviews, Get Questions --
	productField('supplyhouseProduct', 'product', 'PXLE038'),
	productField('supplyhouseReviewsProduct', 'reviews', 'PXLE038'),
	pageOption('supplyhouseReviews', 'reviews', 200, '10 reviews each'),
	productField('supplyhouseQuestionsProduct', 'questions', '007-F5'),
	pageOption('supplyhouseQuestions', 'questions', 200, '10 questions each'),
];
