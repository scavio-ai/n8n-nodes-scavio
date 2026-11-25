import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bestBuy'], operation, ...extra },
});

// Best Buy (bestbuy.com, US) is the default, 9 operations. US credits: Search Products,
// Get Product, Get Reviews and Get Prices 2; Get Category Products 2 for an abcat ID, 3 for
// a pcmcat page; Get Deal of the Day 3; Find Stores and Get Search Suggestions 1; Get
// Availability 2 flat. Country "Canada" reads Best Buy Canada (bestbuy.ca) on all nine, 1
// credit per call; Get Questions is Best Buy Canada only and sends no country (the API
// defaults it to "ca"). The Country field only sends a value for Canada, so a US workflow
// posts exactly the body it did before Best Buy Canada existed. Every route carries a 120s
// timeout (Get Availability typically takes 5-20 s).
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

const CA = (ops: string[]) => show(ops, { country: ['ca'] });
const US = (ops: string[]) => show(ops, { country: ['us'] });

const languageOption: INodeProperties = {
	displayName: 'Language',
	name: 'language',
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French', value: 'fr' },
	],
	description: 'Best Buy Canada language. SKUs and CAD prices are the same; names, specs and links are in that language.',
	routing: { request: { body: { language: '={{ $value }}' } } },
};

const provinceOption: INodeProperties = {
	displayName: 'Province',
	name: 'province',
	type: 'options',
	default: 'ON',
	options: [
		{ name: 'Alberta', value: 'AB' },
		{ name: 'British Columbia', value: 'BC' },
		{ name: 'Manitoba', value: 'MB' },
		{ name: 'New Brunswick', value: 'NB' },
		{ name: 'Newfoundland and Labrador', value: 'NL' },
		{ name: 'Northwest Territories', value: 'NT' },
		{ name: 'Nova Scotia', value: 'NS' },
		{ name: 'Nunavut', value: 'NU' },
		{ name: 'Ontario', value: 'ON' },
		{ name: 'Prince Edward Island', value: 'PE' },
		{ name: 'Quebec', value: 'QC' },
		{ name: 'Saskatchewan', value: 'SK' },
		{ name: 'Yukon', value: 'YT' },
	],
	description:
		'Province or territory for the environmental handling fee (ehf). Prices are national and do not change by province.',
	routing: { request: { body: { province: '={{ $value }}' } } },
};

const CA_SORTS = [
	{ name: 'Best Match', value: 'best_match' },
	{ name: 'Customer Rating', value: 'rating' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
];

/** Best Buy Canada listing options shared by Search Products, Get Category Products and Get Deals (Canada). */
function caListingOptions(): INodeProperties[] {
	const us = listingOptions(CA_SORTS, 'best_match', 'Best match (default), price, or customer rating').filter(
		(o) => o.name !== 'page',
	);
	return [
		...us,
		{
			displayName: 'Facet Filters (JSON)',
			name: 'facets',
			type: 'json' as const,
			default: '',
			placeholder: '[{ "facet": "brandName", "value": "SAMSUNG" }]',
			description: "Up to 10 of the site's filters as an earlier response's facets give them: a list of { facet, value }",
			routing: {
				request: {
					body: {
						filters: {
							facets: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
						},
					},
				},
			},
		},
		{
			displayName: 'In Stock Online Only',
			name: 'in_stock_online',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only products in stock online',
			routing: { request: { body: { filters: { in_stock_online: '={{ $value || undefined }}' } } } },
		},
		languageOption,
		{
			displayName: 'Minimum Rating',
			name: 'rating',
			type: 'options' as const,
			default: 4,
			options: [
				{ name: '3 Stars & Up', value: 3 },
				{ name: '4 Stars & Up', value: 4 },
				{ name: '5 Stars', value: 5 },
			],
			description: 'Only products rated this many stars and up',
			routing: { request: { body: { filters: { rating: '={{ $value }}' } } } },
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number' as const,
			default: 1,
			typeOptions: { minValue: 1, maxValue: 2000 },
			description: 'Results page, 1-based. Best Buy Canada serves the first 2,000 results of a query.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'page_size',
			type: 'number' as const,
			default: 24,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Products per page, 1-100',
			routing: { request: { body: { page_size: '={{ $value }}' } } },
		},
		provinceOption,
		{
			displayName: 'Seller',
			name: 'seller',
			type: 'string' as const,
			default: '',
			description: 'Only this marketplace seller, as its Sellers facet value',
			routing: { request: { body: { filters: { seller: '={{ $value || undefined }}' } } } },
		},
		{
			displayName: 'Sold By',
			name: 'sold_by',
			type: 'options' as const,
			default: 'best_buy',
			options: [
				{ name: 'Best Buy', value: 'best_buy' },
				{ name: 'Marketplace Sellers', value: 'marketplace' },
			],
			description: 'Only products sold by Best Buy, or only by marketplace sellers',
			routing: { request: { body: { filters: { sold_by: '={{ $value }}' } } } },
		},
	].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

const canada = (name: string, ops: string[], options: INodeProperties[]): INodeProperties => ({
	displayName: 'Canada Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: CA(ops),
	options,
});

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
					'Best Buy stores near a US ZIP code, nearest first (up to 15): store ID, name, address, city, state, ZIP, phone, open status, store type, distance in miles, and dated opening hours for the next 35 days (holiday hours and closed days included). Use a store ID with Get Availability. Best Buy Canada: near a postal code, a city or latitude and longitude, with distance in km, 7 dated days of hours and services. Costs 1 credit.',
				routing: request('/api/v1/bestbuy/stores'),
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get best buy store pickup availability',
				description:
					'Store pickup availability of one bestbuy.com SKU at up to 8 stores: the stores nearest a ZIP code or the store IDs you pass. Each store has a status: in_stock, limited (with the real quantity when Best Buy shows "only N left"), ship_to_store (not on the shelf; can be shipped there for pickup by the pickup date), out_of_stock, not_available_for_pickup, or unknown (with a reason; never reported as out of stock). Also the pickup date, the minimum hours until pickup, and the nearby store Best Buy suggests when this one cannot fill it. Best Buy does not publish unit counts for well-stocked items, so quantity is null for in_stock. Takes 5-20s. Best Buy Canada: exact units per store for up to 20 SKUs at the stores nearest a postal code or up to 50 store IDs; a store with no stock record comes back unknown, never out of stock; no prices (they are national). Costs 2 credits flat, 1 for Canada.',
				routing: request('/api/v1/bestbuy/availability'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get best buy category products',
				description:
					'Browse a bestbuy.com (US) category or deals page by category ID or URL, 18 products per page, sorted by best selling, best discount, price, rating or newest, with the same filters as Search Products. Works on catalogue categories (abcat0101001 All Flat-Screen TVs) and merchandised pages such as All Electronics on Sale (pcmcat1674241939957), whose built-in filters are read from the page itself. ' +
					TILE_FIELDS +
					' An unknown category, or a page without a product grid, is an error. Best Buy Canada: a numeric category ID (e.g. 21344 Televisions) or departments, with the category tree, CAD prices, sale end dates and EHF. Costs 2 credits for an abcat ID and 3 for a pcmcat page, 1 for Canada.',
				routing: request('/api/v1/bestbuy/category'),
			},
			{
				name: 'Get Deal of the Day',
				value: 'deals',
				action: 'Get the best buy deal of the day',
				description:
					"Today's Best Buy Deal of the Day and the more-deals row under it, with live prices: SKU, name, URL, image, rating, review count, price, regular price, savings in dollars and percent, on-sale flag and deal badge, plus the countdown end as the page shows it. Up to 15 products. Best Buy Canada has no Deal of the Day: with Country Canada, one deal collection (Black Friday, Top Deals, Clearance, Open Box, Refurbished) as a listing, with the collection's own dates text when its page states them. Costs 3 credits, 1 for Canada.",
				routing: {
					request: { method: 'POST', url: '/api/v1/bestbuy/deals', timeout: 120000, body: {} },
				},
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get best buy prices for up to 15 skus',
				description:
					'Current bestbuy.com prices for up to 15 SKUs in one call: price, regular price, savings in dollars and percent, on-sale flag, deal badge and deal end time per SKU. A SKU Best Buy does not know comes back found: false; all unknown is an error. Best Buy Canada: up to 20 SKUs with CAD price, sale end, EHF by province, rating and review count. Costs 2 credits per call, whatever the number of SKUs, 1 for Canada.',
				routing: request('/api/v1/bestbuy/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a best buy product',
				description:
					"One bestbuy.com (US) product by SKU or URL: name, brand, model, UPC, URL, status, condition, product type, category path, price, regular price, savings, on-sale flag, deal badge, financing offer, every open-box offer by condition (fair, good, excellent) with its price, savings against new and against the regular price, other sellers' and conditions' SKUs of the same product, rating, review count, the AI review summary and what customers love, description, feature list, what's included, the full specification table by group, dimensions, full-size images, manuals and badges. An unknown SKU is an error. Best Buy Canada: UPC, CAD price, sale start and end (UTC), EHF by province, seller, online units, and open-box and refurbished SKUs with their own prices; rating and review count are null for Canada (use Get Reviews). Costs 2 credits, 1 for Canada.",
				routing: request('/api/v1/bestbuy/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get best buy product reviews',
				description:
					"Customer reviews of one bestbuy.com (US) product by SKU or URL, 20 per page, sorted most relevant (default), most helpful, newest, oldest, highest or lowest rated, optionally only one star rating. Returns the review summary (average rating, review count, recommended percent, star histogram, the most mentioned pros and cons with mention counts), total_results for the filter, page count and has_more. Each review has ID, title, text, rating, author, date, recommended flag, verified-purchase and incentivized flags, days of ownership, helpful and not-helpful votes, badges, photos, the site it was syndicated from and the brand's response. Best Buy Canada: up to 100 per page, verified-only, with-photos and French-only filters, Best Buy Canada's own AI summary, no reviewer names. Costs 2 credits, 1 for Canada.",
				routing: request('/api/v1/bestbuy/reviews'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get best buy canada product questions',
				description:
					'Best Buy Canada only: customer questions about one product, each with its answer count and top answer (text, date, verified purchase, helpful votes), most answered first or newest. Questions syndicated from bestbuy.com are flagged. No asker or answerer names. An unknown SKU is a charged error. Costs 1 credit.',
				routing: request('/api/v1/bestbuy/questions'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get best buy search suggestions',
				description:
					'The bestbuy.com search-box autocomplete for a partial query (e.g. "ps5 con"): suggested search terms, each with the categories (ID and name) and SKUs Best Buy shows for it, plus any spelling correction. Best Buy Canada: search terms only, each flagged is_brand. Costs 1 credit.',
				routing: request('/api/v1/bestbuy/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search best buy products',
				description:
					'Search bestbuy.com (US), 18 products per page, sorted by best match, best selling, best discount, price, rating or newest, filtered by brand, on sale, clearance, open box or a price range. ' +
					TILE_FIELDS +
					' Best Buy Canada: CAD prices with sale end dates and EHF, up to 100 per page, the first 2,000 results of a query, marketplace sellers as returned. Use a result SKU with Get Product, Get Reviews, Get Availability or Get Prices. Costs 2 credits, 1 for Canada.',
				routing: request('/api/v1/bestbuy/search'),
			},
		],
		default: 'search',
	},
];

export const bestBuyFields: INodeProperties[] = [
	// -- Country (all operations but Get Questions) --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show([
			'search',
			'product',
			'reviews',
			'category',
			'deals',
			'stores',
			'availability',
			'suggestions',
			'prices',
		]),
		description:
			"Best Buy (bestbuy.com) or Best Buy Canada (bestbuy.ca, Best Buy's Canadian store: 142 stores across Canada per Best Buy's FY2026 10-K, plus a marketplace of third-party sellers; prices in CAD, 1 credit per call)",
		routing: { request: { body: { country: '={{ $value === "ca" ? "ca" : undefined }}' } } },
	},

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
		displayOptions: US(['search']),
		options: listingOptions(
			SEARCH_SORTS,
			'best_match',
			'Best match (default), best selling, best discount, price, customer rating or newest',
		),
	},
	canada('canadaOptions', ['search'], caListingOptions()),

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
			'Best Buy category ID: abcat... (catalogue categories, e.g. abcat0101001 All Flat-Screen TVs) or pcmcat... (merchandised pages, e.g. pcmcat1674241939957 All Electronics on Sale). A search result lists category IDs under category_facet. For Best Buy Canada a numeric ID (e.g. 21344 Televisions), a slug ID or departments. Use this or Category URL.',
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
			'A bestbuy.com category page URL (filters in the URL are kept; its sort is not, use Sort), or a bestbuy.ca category link for Canada. Used when Category ID is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: US(['category']),
		options: listingOptions(
			CATEGORY_SORTS,
			'best_selling',
			'Best selling (the default on most pages), best discount, price, customer rating or newest',
		),
	},
	canada('canadaOptions', ['category'], caListingOptions()),

	// -- Get Deal of the Day (Canada: deal collections) --
	{
		displayName: 'Collection',
		name: 'collection',
		type: 'options',
		default: 'top_deals',
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Open Box', value: 'open_box' },
			{ name: 'Refurbished', value: 'refurbished' },
			{ name: 'Top Deals', value: 'top_deals' },
		],
		displayOptions: CA(['deals']),
		routing: { request: { body: { collection: '={{ $value }}' } } },
		description: 'The Best Buy Canada deal collection to list',
	},
	canada('canadaOptions', ['deals'], caListingOptions()),

	// -- Get Product / Get Reviews / Get Availability --
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		default: '',
		placeholder: '6607832',
		displayOptions: show(['product', 'reviews', 'availability', 'questions']),
		routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
		description:
			"Best Buy SKU, the sku of a search result; for Best Buy Canada its own 8-digit SKU (e.g. 19791103). Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.bestbuy.com/site/insignia-55-class-f50-series-led-4k-uhd-smart-fire-tv/6607832.p?skuId=6607832',
		displayOptions: show(['product', 'reviews', 'availability', 'questions']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A bestbuy.com (or, for Canada, bestbuy.ca) product URL that names a SKU. Used when SKU is not given.',
	},
	canada('canadaOptions', ['product'], [languageOption, provinceOption]),

	// -- Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'reviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: US(['reviews']),
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

	canada('canadaOptions', ['reviews'], [
		{
			...languageOption,
			description: 'Review language: French returns French-language reviews only',
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1 },
			description: 'Reviews page, 1-based',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'page_size',
			type: 'number',
			default: 20,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Reviews per page, 1-100',
			routing: { request: { body: { page_size: '={{ $value }}' } } },
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
			description: 'Most relevant (default), most helpful, newest, oldest, highest or lowest rated',
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
		{
			displayName: 'Verified Purchases Only',
			name: 'verified_only',
			type: 'boolean',
			default: false,
			description: 'Whether to return only verified purchases',
			routing: { request: { body: { verified_only: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'With Photos Only',
			name: 'with_photos',
			type: 'boolean',
			default: false,
			description: 'Whether to return only reviews with photos',
			routing: { request: { body: { with_photos: '={{ $value || undefined }}' } } },
		},
	]),

	// -- Get Questions (Best Buy Canada only) --
	{
		displayName: 'Additional Options',
		name: 'questionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['questions']),
		options: [
			languageOption,
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Questions page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Questions per page, 1-50',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_answered',
				options: [
					{ name: 'Most Answered', value: 'most_answered' },
					{ name: 'Newest', value: 'newest' },
				],
				description: 'Most answered (default) or newest',
				routing: { request: { body: { sort: '={{ $value }}' } } },
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
		displayOptions: US(['availability']),
		description: 'Check the stores nearest a ZIP code, or the store IDs you choose',
	},
	{
		displayName: 'Check Stores By',
		name: 'locateByCa',
		type: 'options',
		default: 'postalCode',
		options: [
			{ name: 'Postal Code (Nearest Stores)', value: 'postalCode' },
			{ name: 'Store IDs', value: 'storeIds' },
		],
		displayOptions: CA(['availability']),
		description: 'Check the Best Buy Canada stores nearest a postal code, or the store IDs you choose',
	},
	{
		displayName: 'Postal Code',
		name: 'postal_code',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'H3B 4W8',
		displayOptions: show(['availability'], { country: ['ca'], locateByCa: ['postalCode'] }),
		routing: { request: { body: { postal_code: '={{ $value }}' } } },
		description: 'Check the Best Buy Canada stores nearest this postal code',
	},
	{
		displayName: 'Store IDs',
		name: 'store_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '651, 705',
		displayOptions: show(['availability'], { country: ['ca'], locateByCa: ['storeIds'] }),
		routing: { send: { type: 'body', property: 'store_ids', value: splitList } },
		description: 'Up to 50 Best Buy Canada store numbers from Find Stores (store_id), separated by commas',
	},
	canada('canadaOptions', ['availability'], [
		languageOption,
		{
			displayName: 'Max Stores',
			name: 'max_stores',
			type: 'number',
			default: 10,
			typeOptions: { minValue: 1, maxValue: 50 },
			description: 'With a postal code: how many of the nearest stores to check, 1-50',
			routing: { request: { body: { max_stores: '={{ $value }}' } } },
		},
		{
			displayName: 'SKUs',
			name: 'skus',
			type: 'string',
			default: '',
			placeholder: '19791103, 19296507',
			description: 'Up to 20 Best Buy Canada SKUs in one call, separated by commas, instead of SKU',
			routing: {
				send: {
					type: 'body',
					property: 'skus',
					value: '={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}',
				},
			},
		},
	]),
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '94103',
		displayOptions: show(['availability'], { country: ['us'], locateBy: ['zip'] }),
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
		displayOptions: show(['availability'], { country: ['us'], locateBy: ['storeIds'] }),
		routing: { send: { type: 'body', property: 'store_ids', value: splitList } },
		description: 'Up to 8 Best Buy store numbers from Find Stores (store_id), separated by commas',
	},
	{
		displayName: 'Additional Options',
		name: 'availabilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['availability'], { country: ['us'], locateBy: ['zip'] }),
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
		displayOptions: US(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'Find Stores By',
		name: 'storesBy',
		type: 'options',
		default: 'postalCode',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'Latitude and Longitude', value: 'coordinates' },
			{ name: 'Postal Code', value: 'postalCode' },
		],
		displayOptions: CA(['stores']),
		description: 'Find Best Buy Canada stores near a postal code, in a city, or near a point',
	},
	{
		displayName: 'Postal Code',
		name: 'postal_code',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'M5V 3L9',
		displayOptions: show(['stores'], { country: ['ca'], storesBy: ['postalCode'] }),
		routing: { request: { body: { postal_code: '={{ $value }}' } } },
		description: 'A Canadian postal code to search around',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Winnipeg',
		displayOptions: show(['stores'], { country: ['ca'], storesBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'A Canadian city',
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 6 },
		displayOptions: show(['stores'], { country: ['ca'], storesBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point to search around',
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 6 },
		displayOptions: show(['stores'], { country: ['ca'], storesBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point to search around',
	},
	canada('canadaOptions', ['stores'], [
		languageOption,
		{
			displayName: 'Max Stores',
			name: 'maxStores',
			type: 'number',
			default: 20,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Stores to return, nearest first, 1-100',
			routing: { request: { body: { limit: '={{ $value }}' } } },
		},
		{
			displayName: 'Radius (Km)',
			name: 'radius_km',
			type: 'number',
			default: 25,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Search radius around a postal code, 1-100 km',
			routing: { request: { body: { radius_km: '={{ $value }}' } } },
		},
	]),

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
	canada('canadaOptions', ['suggestions'], [languageOption]),

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
		description: '1-15 Best Buy SKUs separated by commas (1-20 for Best Buy Canada)',
	},
	canada('canadaOptions', ['prices'], [languageOption, provinceOption]),
];
