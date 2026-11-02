import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['iherb'], operation } });

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

export const iherbOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['iherb'] } },
		options: [
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get iherb prices',
				description:
					'Current price, list price, discount, in-stock flag, rating and review count for up to 50 iHerb products in one call (US store, USD). One row per requested ID, in request order; unknown IDs come back with found false and are listed in not_found. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/iherb/prices' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an iherb product',
				description:
					'One iHerb product by ID or URL (US store, USD): name, brand, part number, UPC, price, list price, discount, price per serving or unit, stock status, discontinued and coming-soon flags, quantity limit, expiration date, package quantity, weight and dimensions, rating, review count, breadcrumbs, best-seller rankings, badges, variants with their IDs and prices, supplement facts, description, suggested use, ingredients, warnings and images. Costs 2 credits.',
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/iherb/product', timeout: 120000 } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get iherb reviews',
				description:
					'The review summary for one iHerb product: average rating, total review count, star histogram (count and percent per star), review counts per language, and the full text of the top positive and top critical review with rating, title, author, country, date, verified-purchase flag, helpful votes and images. Not a full review list. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/iherb/reviews' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search iherb products',
				description:
					'Search iHerb (US store, USD), 48 products per page: product ID, part number, name, brand, brand code, URL, image, price, list price, original price and discount percent when discounted, rating, review count, in-stock flag, badges, recent sales (30K+ sold in 30 days) and position, plus total results and brand filters. iHerb is online only, with no stores. Costs 2 credits.',
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/iherb/search', timeout: 120000 } },
			},
		],
		default: 'search',
	},
];

export const iherbFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vitamin d',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},

	// -- Get Product + Get Reviews --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '62118',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			'The iHerb product ID: the number at the end of an iherb.com/pr/ URL, or the product_id field of a search result. Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.iherb.com/pr/california-gold-nutrition-omega-3-premium-fish-oil-100-fish-gelatin-softgels-1-100-mg-per-softgel/62118',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			"An iherb.com product URL. Data is always the US store's, whatever the URL's country. Use this or Product ID.",
	},

	// -- Get Prices --
	{
		displayName: 'Product IDs',
		name: 'product_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '62118, 70316, 77548',
		displayOptions: show(['prices']),
		routing: { send: { type: 'body', property: 'product_ids', value: splitList } },
		description: '1-50 iHerb product IDs separated by commas. Duplicates are answered once.',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Brand Code',
				name: 'brand_code',
				type: 'string',
				default: '',
				placeholder: 'CGN',
				description:
					"Only this brand, by iHerb brand code (CGN = California Gold Nutrition, NOW = NOW Foods): a result's brand_code or a brand_filters entry",
				routing: { request: { body: { brand_code: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Results page, 48 products per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling', value: 'best_selling' },
					{ name: 'Biggest Discount', value: 'percent_off' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Review Count', value: 'review_count' },
				],
				description: "Result order. Leave unset for iHerb's featured order.",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
