import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bestBuy'], operation, ...extra },
});

// Best Buy (bestbuy.com, US only), 9 operations. Credits: Search Products, Get Product,
// Get Reviews and Get Prices 2; Get Category Products 2 for an abcat ID, 3 for a pcmcat
// page; Get Deal of the Day 3; Find Stores and Get Search Suggestions 1; Get Availability
// 2 flat. Every route carries a 120s timeout (Get Availability typically takes 5-20 s).
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const TILE_FIELDS =
	'Each product has SKU, BSIN, name, brand, model number, URL, image, price, regular price, savings in dollars and percent, on-sale flag, deal badge (e.g. Clearance, Holiday Deal), condition (new, refurbished excellent...), rating, review count, seller type (best_buy or marketplace), product type, badges and release date. Also returns the total result count and page count, the applied sort and filters, the category, the filter sidebar (every facet with its values and product counts; category_facet values carry category IDs), the sort options, related searches and any spelling correction. Sponsored tiles are left out unless Include Sponsored is on.';

// Listing options shared by Search Products and Get Category Products.
const listingOptions = (
	sorts: Array<{ name: string; value: string }>,
	sortDefault: string,
	sortDescription: string,
) => [
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'string' as const,
		default: '',
		placeholder: 'Samsung',
		description: 'Only this brand, as spelled in the Brand filter (a brand_facet value)',
		routing: { request: { body: { filters: { brand: '={{ $value || undefined }}' } } } },
	},
	{
		displayName: 'Clearance Only',
		name: 'clearance',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to return only clearance products',
		routing: { request: { body: { filters: { clearance: '={{ $value || undefined }}' } } } },
	},
	{
		displayName: 'Include Sponsored',
		name: 'include_sponsored',
		type: 'boolean' as const,
		default: false,
		description:
			'Whether to include the sponsored tiles Best Buy mixes into the grid (flagged sponsored: true with position null)',
		routing: { request: { body: { include_sponsored: '={{ $value }}' } } },
	},
	{
		displayName: 'Max Price',
		name: 'max_price',
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest price in dollars. Set Min Price too: both bounds are required.',
		routing: { request: { body: { filters: { max_price: '={{ $value }}' } } } },
	},
	{
		displayName: 'Min Price',
		name: 'min_price',
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest price in dollars. Set Max Price too: both bounds are required.',
		routing: { request: { body: { filters: { min_price: '={{ $value }}' } } } },
	},
	{
		displayName: 'On Sale Only',
		name: 'on_sale',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to return only products on sale',
		routing: { request: { body: { filters: { on_sale: '={{ $value || undefined }}' } } } },
	},
	{
		displayName: 'Open Box Only',
		name: 'open_box',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to return only products with an open-box offer',
		routing: { request: { body: { filters: { open_box: '={{ $value || undefined }}' } } } },
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number' as const,
		default: 1,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Results page, 1-based, up to 100. Defaults to 1. 18 products per page.',
		routing: { request: { body: { page: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options' as const,
		default: sortDefault,
		options: sorts,
		description: sortDescription,
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
];

const CATEGORY_SORTS = [
	{ name: 'Best Discount', value: 'best_discount' },
	{ name: 'Best Selling', value: 'best_selling' },
	{ name: 'Customer Rating', value: 'rating' },
	{ name: 'Newest', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
];

const SEARCH_SORTS = [
	{ name: 'Best Discount', value: 'best_discount' },
	{ name: 'Best Match', value: 'best_match' },
	{ name: 'Best Selling', value: 'best_selling' },
	{ name: 'Customer Rating', value: 'rating' },
	{ name: 'Newest', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
];

export const bestBuyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bestBuy'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find best buy stores',
				description:
					'Best Buy stores near a US ZIP code, nearest first (up to 15): store ID, name, address, city, state, ZIP, phone, open status, store type, distance in miles, and dated opening hours for the next 35 days (holiday hours and closed days included). Use a store ID with Get Availability. Costs 1 credit.',
				routing: request('/api/v1/bestbuy/stores'),
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get best buy store pickup availability',
				description:
					'Store pickup availability of one bestbuy.com SKU at up to 8 stores: the stores nearest a ZIP code or the store IDs you pass. Each store has a status: in_stock, limited (with the real quantity when Best Buy shows "only N left"), ship_to_store (not on the shelf; can be shipped there for pickup by the pickup date), out_of_stock, not_available_for_pickup, or unknown (with a reason; never reported as out of stock). Also the pickup date, the minimum hours until pickup, and the nearby store Best Buy suggests when this one cannot fill it. Best Buy does not publish unit counts for well-stocked items, so quantity is null for in_stock. Takes 5-20s. Costs 2 credits flat.',
				routing: request('/api/v1/bestbuy/availability'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get best buy category products',
				description:
					'Browse a bestbuy.com (US) category or deals page by category ID or URL, 18 products per page, sorted by best selling, best discount, price, rating or newest, with the same filters as Search Products. Works on catalogue categories (abcat0101001 All Flat-Screen TVs) and merchandised pages such as All Electronics on Sale (pcmcat1674241939957), whose built-in filters are read from the page itself. ' +
					TILE_FIELDS +
					' An unknown category, or a page without a product grid, is an error. Costs 2 credits for an abcat ID and 3 for a pcmcat page.',
				routing: request('/api/v1/bestbuy/category'),
			},
			{
				name: 'Get Deal of the Day',
				value: 'deals',
				action: 'Get the best buy deal of the day',
				description:
					"Today's Best Buy Deal of the Day and the more-deals row under it, with live prices: SKU, name, URL, image, rating, review count, price, regular price, savings in dollars and percent, on-sale flag and deal badge, plus the countdown end as the page shows it. Up to 15 products. No parameters. Costs 3 credits.",
				routing: {
					request: { method: 'POST', url: '/api/v1/bestbuy/deals', timeout: 120000, body: {} },
				},
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get best buy prices for up to 15 skus',
				description:
					'Current bestbuy.com prices for up to 15 SKUs in one call: price, regular price, savings in dollars and percent, on-sale flag, deal badge and deal end time per SKU. A SKU Best Buy does not know comes back found: false; all unknown is an error. Costs 2 credits per call, whatever the number of SKUs.',
				routing: request('/api/v1/bestbuy/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a best buy product',
				description:
					"One bestbuy.com (US) product by SKU or URL: name, brand, model, UPC, URL, status, condition, product type, category path, price, regular price, savings, on-sale flag, deal badge, financing offer, every open-box offer by condition (fair, good, excellent) with its price, savings against new and against the regular price, other sellers' and conditions' SKUs of the same product, rating, review count, the AI review summary and what customers love, description, feature list, what's included, the full specification table by group, dimensions, full-size images, manuals and badges. An unknown SKU is an error. Costs 2 credits.",
				routing: request('/api/v1/bestbuy/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get best buy product reviews',
				description:
					"Customer reviews of one bestbuy.com (US) product by SKU or URL, 20 per page, sorted most relevant (default), most helpful, newest, oldest, highest or lowest rated, optionally only one star rating. Returns the review summary (average rating, review count, recommended percent, star histogram, the most mentioned pros and cons with mention counts), total_results for the filter, page count and has_more. Each review has ID, title, text, rating, author, date, recommended flag, verified-purchase and incentivized flags, days of ownership, helpful and not-helpful votes, badges, photos, the site it was syndicated from and the brand's response. Costs 2 credits.",
				routing: request('/api/v1/bestbuy/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get best buy search suggestions',
				description:
					'The bestbuy.com search-box autocomplete for a partial query (e.g. "ps5 con"): suggested search terms, each with the categories (ID and name) and SKUs Best Buy shows for it, plus any spelling correction. Costs 1 credit.',
				routing: request('/api/v1/bestbuy/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search best buy products',
				description:
					'Search bestbuy.com (US), 18 products per page, sorted by best match, best selling, best discount, price, rating or newest, filtered by brand, on sale, clearance, open box or a price range. ' +
					TILE_FIELDS +
					' Use a result SKU with Get Product, Get Reviews, Get Availability or Get Prices. Costs 2 credits.',
				routing: request('/api/v1/bestbuy/search'),
			},
		],
		default: 'search',
	},
];

export const bestBuyFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tv',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listingOptions(
			SEARCH_SORTS,
			'best_match',
			'Best match (default), best selling, best discount, price, customer rating or newest',
		),
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: 'abcat0101001',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description:
			'Best Buy category ID: abcat... (catalogue categories, e.g. abcat0101001 All Flat-Screen TVs) or pcmcat... (merchandised pages, e.g. pcmcat1674241939957 All Electronics on Sale). A search result lists category IDs under category_facet. Use this or Category URL.',
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.bestbuy.com/site/tvs/all-flat-screen-tvs/abcat0101001.c',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A bestbuy.com category page URL. Filters in the URL (qp=...) are kept; its sort is not, use Sort. Used when Category ID is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listingOptions(
			CATEGORY_SORTS,
			'best_selling',
			'Best selling (the default on most pages), best discount, price, customer rating or newest',
		),
	},

	// -- Get Product / Get Reviews / Get Availability --
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		default: '',
		placeholder: '6607832',
		displayOptions: show(['product', 'reviews', 'availability']),
		routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
		description:
			'Best Buy SKU, the number after /sku/ in a product URL (the sku of a search result). Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.bestbuy.com/site/insignia-55-class-f50-series-led-4k-uhd-smart-fire-tv/6607832.p?skuId=6607832',
		displayOptions: show(['product', 'reviews', 'availability']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A bestbuy.com product URL that names a SKU. Used when SKU is not given.',
	},

	// -- Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'reviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Reviews page, 1-based, 20 reviews per page, up to 500. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_relevant',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Relevant', value: 'most_relevant' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description:
					'Most relevant (default), most helpful, newest, oldest, highest or lowest rated',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'rating',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this many stars',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Availability --
	{
		displayName: 'Check Stores By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Store IDs', value: 'storeIds' },
			{ name: 'ZIP Code (Nearest Stores)', value: 'zip' },
		],
		displayOptions: show(['availability']),
		description: 'Check the stores nearest a ZIP code, or the store IDs you choose',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '94103',
		displayOptions: show(['availability'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'Check the stores nearest this US ZIP code',
	},
	{
		displayName: 'Store IDs',
		name: 'store_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '187, 873',
		displayOptions: show(['availability'], { locateBy: ['storeIds'] }),
		routing: { send: { type: 'body', property: 'store_ids', value: splitList } },
		description: 'Up to 8 Best Buy store numbers from Find Stores (store_id), separated by commas',
	},
	{
		displayName: 'Additional Options',
		name: 'availabilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['availability'], { locateBy: ['zip'] }),
		options: [
			{
				displayName: 'Max Stores',
				name: 'max_stores',
				type: 'number',
				default: 5,
				typeOptions: { minValue: 1, maxValue: 8 },
				description: 'How many of the nearest stores to check, 1-8. Defaults to 5.',
				routing: { request: { body: { max_stores: '={{ $value }}' } } },
			},
		],
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '94103',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ps5 con',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Prices --
	{
		displayName: 'SKUs',
		name: 'skus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6607832, 6673112, 6679316',
		displayOptions: show(['prices']),
		routing: { send: { type: 'body', property: 'skus', value: splitList } },
		description: '1-15 Best Buy SKUs separated by commas',
	},
];
