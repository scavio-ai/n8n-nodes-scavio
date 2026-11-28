import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['sallybeauty'], operation, ...extra },
});

// Sally Beauty (sallybeauty.com, the US and Canadian beauty supply chain) and CosmoProf (its professional beauty
// distributor), chosen by Site, 9 operations, 1 credit each; credits_used is the truth. Usually 3 to 20 s with a 180s
// timeout; Get Reviews takes 30 to 120 s and carries 240s.
const request = (url: string, timeout = 180000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const SITE =
	'Sally Beauty (sallybeauty.com, the US and Canadian beauty supply chain) or CosmoProf (its professional beauty distributor), chosen by Site';
const PRICES =
	'Sally Beauty prices in USD or CAD as shown to a visitor who is not signed in; CosmoProf sells to licensed professionals, so its prices and stock are null.';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const LIST =
	"24 per page. Returns page, total, total_pages, has_more, count, items (product_id for Get Product, name, brand, category, URL, image, price, list_price, price_min, price_max, currency, on_sale, clearance, promotions, rating, review_count, variation_count), facets (attribute_id and values for Facet Filters) and price_ranges.";

const ALL_OPS = ['search', 'category', 'clearance', 'product', 'stores', 'suggestions', 'brands'];
const SALLY_OPS = ['storeStock', 'reviews'];

const gridOptions = (prefix: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: [
		{
			displayName: 'Facet Filters',
			name: 'filters',
			type: 'json',
			default: '{}',
			description:
				'Up to 6 facets from a previous answer: facets[].attribute_ID to one value or a list, e.g. {"ValueBrand": "ion"} on Sally Beauty or {"brandcustom": "Redken"} on CosmoProf',
			routing: {
				request: {
					body: {
						filters:
							'={{ (() => { const o = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return o && Object.keys(o).length ? o : undefined; })() }}',
					},
				},
			},
		},
		{
			displayName: 'Max Price',
			name: 'priceMax',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
			description: "Highest price in the site's currency (Sally Beauty sites; 0 = no limit)",
			routing: { request: { body: { price_max: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'priceMin',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
			description: "Lowest price in the site's currency (Sally Beauty sites)",
			routing: { request: { body: { price_min: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 200 },
			description: 'Results page, 1 to 200, 24 products each',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'best_match',
			options: [
				{ name: 'Best Match', value: 'best_match' },
				{ name: 'Brand (CosmoProf)', value: 'brand' },
				{ name: 'Newest (CosmoProf)', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Top Rated (Sally Beauty)', value: 'top_rated' },
			],
			description: "Order of the products (best match is the site's Top Sellers)",
			routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
		},
	],
});

const productField = (name: string, operation: string, placeholder: string): INodeProperties => ({
	displayName: 'Product ID or URL',
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
	description: "A product ID (product_id of a listing item, or a size's SKU) or a product link on the site",
});

const locationFields = (prefix: string, operation: string, placeholder: string): INodeProperties[] => [
	{
		displayName: 'ZIP or Postal Code',
		name: `${prefix}PostalCode`,
		type: 'string',
		required: true,
		default: '',
		placeholder,
		displayOptions: show([operation]),
		routing: { request: { body: { postal_code: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit ZIP code (US sites) or a Canadian postal code (Canadian sites)',
	},
	{
		displayName: 'Radius (Miles)',
		name: `${prefix}Radius`,
		type: 'options',
		default: 15,
		options: [
			{ name: '15', value: 15 },
			{ name: '30', value: 30 },
			{ name: '50', value: 50 },
			{ name: '100', value: 100 },
		],
		displayOptions: show([operation]),
		routing: { request: { body: { radius: '={{ $value === 15 ? undefined : $value }}' } } },
		description: "How far to look, in the site's own choices",
	},
];

export const sallybeautyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['sallybeauty'] } },
		options: [
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get sally beauty brands',
				description: `The brand directory of ${SITE}: brands (name, slug, URL), about 370 on Sally Beauty and 140 on CosmoProf. List a brand's products with Facet Filters (ValueBrand on Sally Beauty, brandcustom on CosmoProf). Captured 2026-11-28: 371 brands on Sally Beauty US. ${ONE}`,
				routing: request('/api/v1/sallybeauty/brands'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get sally beauty category products',
				description: `One category of ${SITE} by category ID, sorted and filtered like search, with category_name. ${LIST} An unknown category ID is a charged not-found. ${PRICES} Captured 2026-11-28: hair-color held 2,126 products. ${ONE}`,
				routing: request('/api/v1/sallybeauty/category'),
			},
			{
				name: 'Get Clearance',
				value: 'clearance',
				action: 'Get sally beauty clearance',
				description: `Clearance products of ${SITE}: Sally Beauty by department, CosmoProf in one list; price is the clearance price and list_price the regular price. ${LIST} ${PRICES} Captured 2026-11-28: the nails clearance listed 219 products. ${ONE}`,
				routing: request('/api/v1/sallybeauty/clearance'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a sally beauty product',
				description: `One product of ${SITE} by product ID or link. Sally Beauty: name, brand, price, list_price, price_range, on_sale, clearance, availability (in_stock and online_units, the exact count the site can sell online), promotions, rating, review_count, variations (each size's SKU), specs, pickup and shipping flags. Send a size's SKU for that size's price and units. CosmoProf: the catalogue facts (name, UPC, manufacturer, rating, sizes, ingredients) with price and availability null. An unknown product is a charged not-found. Captured 2026-11-28: ion Color Defense Sulfate Free Shampoo 10.5 oz at 9.59 USD (regular 11.99), 77,098 units online. ${ONE}`,
				routing: request('/api/v1/sallybeauty/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get sally beauty reviews',
				description: `Customer reviews and questions of one Sally Beauty product (CosmoProf is refused), as the product page shows them: average_rating, total_reviews, rating_distribution, recommended, the first 8 reviews (rating, title, text, submitted_at, verified_purchaser, helpful votes, photos, brand_response) and up to 10 questions with answers. No further pages; no reviewer names or personal details. Captured 2026-11-28: 3.97 from 113 reviews. ${ONE}`,
				routing: request('/api/v1/sallybeauty/reviews', 240000),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get sally beauty store stock',
				description: `In-store stock of one product at the Sally Beauty stores near a ZIP or postal code (CosmoProf is refused): product (name, price, online_units), count, in_stock_count and stores (name, address, distance_miles, phone, hours, stock units: the store's exact count), ordered by distance. A product with sizes is stocked per size: send a size's SKU. Captured 2026-11-28: in stock at 29 of 30 stores near 90012. ${ONE}`,
				routing: request('/api/v1/sallybeauty/store-stock'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get sally beauty stores',
				description: `Stores of ${SITE} near a ZIP or postal code, within 15, 30, 50 or 100 miles, ordered by distance: store_id, name, address, latitude, longitude, distance_miles, phone, hours, pickup_eligible and URL. Captured 2026-11-28: 20 stores within 15 miles of 75201. ${ONE}`,
				routing: request('/api/v1/sallybeauty/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get sally beauty suggestions',
				description: `The search box suggestions of ${SITE} for what a shopper has typed: phrases, products (with price and rating), brands and popular_searches. Captured 2026-11-28: wahl suggested Wahl Clippers, Wahl and Wahl Trimmer. ${ONE}`,
				routing: request('/api/v1/sallybeauty/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search sally beauty products',
				description: `Search ${SITE} by keyword, sorted and filtered by facet or price range. ${LIST} When the site sends a keyword to a category or straight to a product, redirected_to says so. ${PRICES} Captured 2026-11-28: purple shampoo matched 107 products. ${ONE}`,
				routing: request('/api/v1/sallybeauty/search'),
			},
		],
		default: 'search',
	},
];

export const sallybeautyFields: INodeProperties[] = [
	{
		displayName: 'Site',
		name: 'sallybeautySite',
		type: 'options',
		default: 'sally-us',
		options: [
			{ name: 'CosmoProf Canada (No Prices)', value: 'cosmoprof-ca' },
			{ name: 'CosmoProf US (No Prices)', value: 'cosmoprof-us' },
			{ name: 'Sally Beauty Canada (CAD)', value: 'sally-ca' },
			{ name: 'Sally Beauty US (USD)', value: 'sally-us' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { site: '={{ $value === "sally-us" ? undefined : $value }}' } } },
		description: 'Sally Beauty (sallybeauty.com, sallybeauty.ca) or CosmoProf (cosmoprofbeauty.com, cosmoprofbeauty.ca)',
	},
	{
		displayName: 'Site',
		name: 'sallybeautySallySite',
		type: 'options',
		default: 'sally-us',
		options: [
			{ name: 'Sally Beauty Canada (CAD)', value: 'sally-ca' },
			{ name: 'Sally Beauty US (USD)', value: 'sally-us' },
		],
		displayOptions: show(SALLY_OPS),
		routing: { request: { body: { site: '={{ $value === "sally-us" ? undefined : $value }}' } } },
		description: 'Store stock and reviews are Sally Beauty only',
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'sallybeautyQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'purple shampoo',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords (1 to 200 characters)',
	},
	gridOptions('sallybeautySearch', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'sallybeautyCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hair-color',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: "A category ID as the site's menu names it, e.g. hair-color, shampoo, nails-clearance",
	},
	gridOptions('sallybeautyCategory', 'category'),

	// -- Get Clearance --
	{
		displayName: 'Department',
		name: 'sallybeautyDepartment',
		type: 'options',
		default: 'hair_care',
		options: [
			{ name: 'Beauty', value: 'beauty' },
			{ name: 'Hair Care', value: 'hair_care' },
			{ name: 'Hair Color', value: 'hair_color' },
			{ name: 'Nails', value: 'nails' },
			{ name: 'Tools', value: 'tools' },
		],
		displayOptions: show(['clearance']),
		routing: {
			request: {
				body: {
					department:
						'={{ $value === "hair_care" || String($parameter["sallybeautySite"]).startsWith("cosmoprof") ? undefined : $value }}',
				},
			},
		},
		description: 'Sally Beauty clearance department (CosmoProf has one clearance list and ignores it)',
	},
	gridOptions('sallybeautyClearance', 'clearance'),

	// -- Get Product / Get Store Stock / Get Reviews --
	productField('sallybeautyProduct', 'product', 'SBS-302313'),
	productField('sallybeautyStockProduct', 'storeStock', 'SBS-302313'),
	...locationFields('sallybeautyStock', 'storeStock', '90012'),
	productField('sallybeautyReviewsProduct', 'reviews', 'SBS-345331'),

	// -- Get Stores --
	...locationFields('sallybeautyStores', 'stores', '75201'),

	// -- Get Suggestions --
	{
		displayName: 'Typed So Far',
		name: 'sallybeautySuggest',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'wahl',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper has typed so far (1 to 100 characters)',
	},
];
