import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['dafiti'], operation, ...extra },
});

// Dafiti (dafiti.com.br, the Brazilian fashion marketplace), 6 operations, 1 credit each; credits_used is the truth.
// Brazil only, BRL. Listings (usually 15 to 160 s) and Get Product (6 to 35 s) carry a 300s timeout; Get Sizes and
// Stock takes 2 to 15 s and carries 180s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;
const FAST_MS = 180000;

const SITE =
	'Dafiti (dafiti.com.br, the Brazilian fashion marketplace), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID = `48 results per page plus the site's sponsored slots, in the site's 5 sorts. Returns title, page, page_size, total, total_pages, has_more, count, sponsored_count, sort, items (sku for Get Sizes and Stock and Get Product, product_id, name, brand, color, URL, image, price as the Pix price where pix_price is set, list_price, discount_percent, pix_price (Pix is Brazil's instant payment), card_price, max_installments, categories, sponsored, marketplace when a partner store sells it) and notes.`;
const SIZES =
	"sizes (size, sku, in_stock, units exact from 0 to 10, more_than_10 when the site gives more than 10 rather than a count, stock_message, delivery_type as proprio for Dafiti's own stock, fulfillment for a partner store's stock delivered by Dafiti or drop_shipping for one sent by the partner store, sold_by_dafiti, delivered_by_dafiti, store_name)";

const listingOptions = (prefix: string, operation: string): INodeProperties => ({
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
			typeOptions: { minValue: 1, maxValue: 2000 },
			description: 'Results page (48 results per page plus the sponsored slots)',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'popularity',
			description: "The site's 5 sorts",
			options: [
				{ name: 'Discount', value: 'discount' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Popularity', value: 'popularity' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
			],
			routing: { request: { body: { sort: '={{ $value === "popularity" ? undefined : $value }}' } } },
		},
	],
});

export const dafitiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['dafiti'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get dafiti brand products',
				description: `One brand's listing of ${SITE}, by the brand as the site writes it in its link, sorted like search. ${GRID} Also brand, URL and breadcrumbs. An unknown brand is a charged not-found. Captured 2026-11-27: asics held 1575 products. ${ONE}`,
				routing: request('/api/v1/dafiti/brand', SLOW_MS),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get dafiti category products',
				description: `One department or category listing of ${SITE}, by its path or link, sorted like search. ${GRID} Also category, URL and breadcrumbs. An unknown category is a charged not-found. Captured 2026-11-27: calcados-femininos/tenis held 13098 products. ${ONE}`,
				routing: request('/api/v1/dafiti/category', SLOW_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get dafiti outlet deals',
				description: `The outlet of ${SITE}: the site's own selection of discounted products, sorted like search (Discount puts the deepest discounts at the top). The site publishes no start or end dates for it. ${GRID} Also deal and URL. Captured 2026-11-27: the outlet held 199 products, the first a children's sneaker at 30.99 BRL (list 99.90). ${ONE}`,
				routing: request('/api/v1/dafiti/deals', SLOW_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a dafiti product',
				description: `One product of ${SITE} by product ID, SKU or link: sku, product_id, name, brand, color, URL, availability (in_stock, limited, out_of_stock), price, list_price, discount_percent, pix_price, card_price, max_installments, installment, rating, review_count, seller (store_name, sold_by_dafiti, delivered_by_dafiti), store_names, size_count, sizes_in_stock, ${SIZES}, colors (the other colours), categories, campaigns, breadcrumbs, specs, details (composition, measures) and images. Marketplace sellers appear by store name only. Not available: marketing description, review texts, shipping quotes, search suggestions, price history; Dafiti Colombia is not covered. An unknown product is a charged not-found. Captured 2026-11-27: an Asics Gel 1130 sneaker at 389.99 BRL by Pix (410.52 by card, list 699.99), 4 of 11 sizes in stock. ${ONE}`,
				routing: request('/api/v1/dafiti/product', SLOW_MS),
			},
			{
				name: 'Get Sizes and Stock',
				value: 'sizes',
				action: 'Get dafiti sizes and stock',
				description: `Every size of one ${SITE} product by SKU, with its stock: sku, product_id, name, brand, color, URL, price, list_price, discount_percent, installment (the plan the size data quotes; the product page's card price can differ), store_names, size_count, sizes_in_stock, ${SIZES}, colors, categories and campaigns; a size SKU also returns requested_size. Faster than Get Product, for a stock check. An unknown SKU is a charged not-found. Captured 2026-11-27: 5 units each of sizes 41 and 42, 2 of size 43, 1 of size 44, the other 7 sizes sold out. ${ONE}`,
				routing: request('/api/v1/dafiti/sizes', FAST_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search dafiti products',
				description: `Search ${SITE} by keyword. ${GRID} Also query. The site matches loosely, so a search with no close match can still list related products. Captured 2026-11-27: vestido matched 19233 products. ${ONE}`,
				routing: request('/api/v1/dafiti/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const dafitiFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'dafitiQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tenis',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as a shopper types them (1 to 100 characters)',
	},
	listingOptions('dafitiSearch', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'dafitiCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'calcados-femininos/tenis',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A department or category path of 1 to 3 levels as the site writes it (breadcrumbs URL), e.g. calcados-femininos, calcados-femininos/tenis, or its dafiti.com.br link',
	},
	listingOptions('dafitiCategory', 'category'),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'dafitiBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'asics',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand as the site writes it in its link, e.g. asics, nike, farm-rio, or its dafiti.com.br link',
	},
	listingOptions('dafitiBrand', 'brand'),

	// -- Get Deals --
	listingOptions('dafitiDeals', 'deals'),

	// -- Get Product --
	{
		displayName: 'Look Up By',
		name: 'dafitiProductBy',
		type: 'options',
		default: 'product_id',
		options: [
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'SKU', value: 'sku' },
			{ name: 'URL', value: 'url' },
		],
		displayOptions: show(['product']),
	},
	{
		displayName: 'Product',
		name: 'dafitiProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '15221282',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_id: '={{ $parameter["dafitiProductBy"] === "product_id" ? String($value).trim() : undefined }}',
					sku: '={{ $parameter["dafitiProductBy"] === "sku" ? String($value).trim() : undefined }}',
					url: '={{ $parameter["dafitiProductBy"] === "url" ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'The number at the end of a Dafiti product link (product_id of a listing), the Dafiti SKU (sku of a listing, or one size of it) or a dafiti.com.br product link, as chosen in Look Up By',
	},

	// -- Get Sizes and Stock --
	{
		displayName: 'SKU',
		name: 'dafitiSizesSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'AS296SCU17ARY',
		displayOptions: show(['sizes']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'The Dafiti SKU (sku of a listing), or one size of it (sizes sku)',
	},
];
