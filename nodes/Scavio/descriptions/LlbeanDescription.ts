import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['llbean'], operation, ...extra },
});

// L.L.Bean (llbean.com, llbean.ca, global.llbean.com), 11 operations, 1 credit each; credits_used is the truth.
// Store stock, stores, reviews, review summary, delivery estimate and categories serve the US storefront only.
// A request can take one retry of up to 90 s per attempt, so every operation carries a 240s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = 'L.L.Bean (llbean.com, the US outdoor apparel and gear retailer)';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	'Prices are as L.L.Bean shows them to a visitor who is not signed in; member and card prices (L.L.Bean Rewards, L.L.Bean Mastercard) are never returned. Prices are national: the same in every store and online.';
const GRID =
	'market, country, currency, page, page_size (48), total, total_pages, has_more, count, items (us: position, product_id, name, URL, image, item_id for Get Store Stock and Get Delivery Estimate, price, full_price, sale_price, on_sale, rating, review_count, stock as in_stock or backorder, stock_text, new_arrival, features, colors; ca and intl: position, product_id, name, URL, image, price, price_max, list_price as the was price, currency, price_text, on_sale, promotion as given, rating, review_count, colors), facets (key, label, values with counts; send to Filters), filters_applied and notes.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const scoped = ['search', 'category', 'product', 'deals'];

const sortOption = (name: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Best Selling', value: 'best_selling' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
		{ name: 'Top Rated', value: 'top_rated' },
	],
	description: "The site's sort menu",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
});

const pageOption = (name: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 200 },
	description: 'Results page, 1-based, 48 per page (up to 200). total_pages reports the last one.',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const filtersOption = (name: string): INodeProperties => ({
	displayName: 'Filters (JSON)',
	name,
	type: 'json',
	default: '{}',
	description:
		'Facet filters, at most 8 keys, each to one value or a list (values of one key are OR-ed), e.g. {"color": "Blue", "sale": true}. Keys: color, size, brand, gender, and on the US storefront also sale, price, discount, width, department, category, material, shoe_size, features, new; or any facets[].key of an answer with values exactly as facets[].values[].value, e.g. {"price": "0 TO 30"} on us, {"color": "Black"} on ca and intl.',
	routing: {
		request: {
			body: {
				filters:
					'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
			},
		},
	},
});

const gridOptions = (prefix: string, extra: INodeProperties[] = []): INodeProperties[] =>
	sorted([filtersOption(`${prefix}Filters`), pageOption(`${prefix}Page`), sortOption(`${prefix}Sort`), ...extra]);

export const llbeanOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['llbean'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get l l bean categories',
				description: `The department menu of ${SITE}, US storefront: category_id, count and categories (category_id, name, slug, URL, children; 11 departments, about 570 nodes), or one department or category with its children when Category ID is set. Captured 2026-11-27: category 474 (Footwear) held 50 nodes. ${ONE}`,
				routing: request('/api/v1/llbean/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get l l bean category products',
				description: `One ${SITE} category by ID on the US, Canadian or international storefront, sorted and filtered like Search: category_id, URL, sort, ${GRID} ${PRICES} An unknown category is a charged not-found. Captured 2026-11-27: category 474 (US Footwear) counted 439 products. ${ONE}`,
				routing: request('/api/v1/llbean/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get l l bean deals',
				description: `The Sale category of ${SITE} on the US, Canadian or international storefront, sorted and filtered like Search; on us also by % Off (Min Discount): category_id (32), URL, min_discount, sort, ${GRID} ${PRICES} The site gives no end dates for sale items. Captured 2026-11-27: Sale at 40% and up on us counted 204 products, the first at 19.99 USD against a full price of 34.95. ${ONE}`,
				routing: request('/api/v1/llbean/deals', true),
			},
			{
				name: 'Get Delivery Estimate',
				value: 'deliveryEstimate',
				action: 'Get an l l bean delivery estimate',
				description: `The standard delivery date of one ${SITE} item to a US ZIP code, US storefront: item_id, ZIP and standard_delivery_date (as given, no year in the text). An invalid ZIP is an unbilled refusal; an unknown item a charged not-found. Captured 2026-11-27: item 112644 to ZIP 10001 was Sat, November 28. ${ONE}`,
				routing: request('/api/v1/llbean/delivery-estimate'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an l l bean product',
				description: `One ${SITE} product by ID. On us: name, URL, rating, review_count, specs, materials, size_fit, items (item_id, name such as Regular, Tall or a size range, colors with price, full_price, sale_price, percent_saved, sold_out), in_stock_count, backorder_count, out_of_stock_count and skus (SKU, item, color, size, width, stock as in_stock, backorder or out_of_stock, status as given, backorder_date, price, full_price, sale_price, percent_saved). On ca and intl: name, brand, URL, image, currency, price, list_price, price_text, availability, promotions as given, colors, items and attributes for the variant shown; no unit counts, store stock, reviews or delivery dates there. ${PRICES} An unknown product is a charged not-found. Captured 2026-11-27: the Boat and Tote, Zip-Top was rated 4.8 from 9735 reviews, with 97 SKUs from 34.99 to 69.95 USD. ${ONE}`,
				routing: request('/api/v1/llbean/product'),
			},
			{
				name: 'Get Review Summary',
				value: 'reviewSummary',
				action: 'Get an l l bean review summary',
				description: `L.L.Bean's own summary of the reviews of one ${SITE} product, US storefront, as the site gives it: product_id, summary, disclaimer and created_at. A product without one is a charged not-found. ${ONE}`,
				routing: request('/api/v1/llbean/review-summary'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get l l bean reviews',
				description: `Written reviews of one ${SITE} product, US storefront, in 4 sorts, up to 100 a page, filtered by stars, reviewer height or weight band, or words: total, total_pages, has_more, count, reviews (review_id, rating, title, text, submitted_at, recommended, verified_purchaser, syndicated, helpful votes, item_id, fit, size_purchased, size_range, height, weight, used_for, brand_responses), stats (average_rating, total_reviews, ratings_only_count, rating_distribution, fit averages, size purchased, height and weight histograms) and upcs per item. No reviewer names, nicknames, locations or IDs. Captured 2026-11-27: the Men's L.L.Bean Sweater Fleece Full-Zip Jacket had 1400 written reviews out of 4402 ratings, average 4.67. ${ONE}`,
				routing: request('/api/v1/llbean/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get l l bean search suggestions',
				description: `The search-box suggestions of ${SITE} for a partial query: count, suggestions, popular_searches, products (product_id, name) and categories (category_id, name, parent). On us: up to 10 keyword suggestions. On ca: the storefront's suggested terms, its popular searches, products and categories. Captured 2026-11-27: fle gave 10 suggestions on us. ${ONE}`,
				routing: request('/api/v1/llbean/suggestions'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get l l bean store stock',
				description: `Exact store units of one ${SITE} item (one fit or size range of a product), US stores, for up to 20 stores or every store: item_id, product_id, store_ids, sku_count, store_count, stores (store_id, units, skus_in_stock), skus (SKU, status, units, stores with units and status) and unlisted_sku_count. Units is the site's exact available quantity per SKU per store. With Product ID each SKU also carries item, color, size, width and its national price. An unknown item is a charged not-found. Captured 2026-11-27: item 112644 (Boat and Tote Medium) held 506 units at store 0040. ${ONE}`,
				routing: request('/api/v1/llbean/store-stock'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get l l bean stores',
				description: `The ${SITE} stores, US: near a ZIP code, a point or a city and state, by store IDs, or all of them: count and stores (store_id, name, shopping_center, type as Retail or Outlet, address, phone, coordinates, distance_miles, time_zone, opened, open, inventory_online, store_pickup, curbside_pickup, URL, hours for 7 dated days). Ordered by distance when a place is given. Captured 2026-11-27: ZIP 04032 gave 5 stores, the nearest at 0.13 miles. ${ONE}`,
				routing: request('/api/v1/llbean/stores'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search l l bean',
				description: ', keyword search on the US, Canadian or international storefront, sorted, 48 a page, filtered by any facet: query, redirected_to (a keyword the site sends to a category comes back with the category ID and the sort, page and filters applied), , , Captured 2026-11-27: fleece jacket gave 24 results on us and 73 on ca (the first at 159 CAD) and on intl gb (110 GBP). ,.',
				routing: request('/api/v1/llbean/search'),
			},
		],
		default: 'search',
	},
];

export const llbeanFields: INodeProperties[] = [
	// -- Market and Country (Search, Get Category Products, Get Product, Get Deals) --
	{
		displayName: 'Market',
		name: 'llbeanMarket',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (llbean.ca, CAD)', value: 'ca' },
			{ name: 'International (global.llbean.com, Local Currency)', value: 'intl' },
			{ name: 'United States (llbean.com, USD)', value: 'us' },
		],
		displayOptions: show(scoped),
		routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'Which L.L.Bean storefront to read. International needs a Country.',
	},
	{
		displayName: 'Country',
		name: 'llbeanCountry',
		type: 'options',
		default: 'gb',
		options: [
			{ name: 'Australia (AUD)', value: 'au' },
			{ name: 'Brazil (BRL)', value: 'br' },
			{ name: 'China (CNY)', value: 'cn' },
			{ name: 'France (EUR)', value: 'fr' },
			{ name: 'Germany (EUR)', value: 'de' },
			{ name: 'India (INR)', value: 'in' },
			{ name: 'Mexico (MXN)', value: 'mx' },
			{ name: 'Netherlands (EUR)', value: 'nl' },
			{ name: 'Singapore (SGD)', value: 'sg' },
			{ name: 'Sweden (SEK)', value: 'se' },
			{ name: 'Switzerland (CHF)', value: 'ch' },
			{ name: 'United Kingdom (GBP)', value: 'gb' },
		],
		displayOptions: show(scoped, { llbeanMarket: ['intl'] }),
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: "The international storefront's country; prices come in its currency",
	},

	// -- Search --
	{
		displayName: 'Query',
		name: 'llbeanQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'fleece jacket',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'llbeanSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('llbeanSearch'),
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'llbeanCategoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '474',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description:
			'A category ID: category_id from Get Categories (US) or the number after /llb/shop/ in a storefront category link (474 is US Footwear; 32 is Sale, see Get Deals)',
	},
	{
		displayName: 'Additional Options',
		name: 'llbeanCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('llbeanCategory'),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'llbeanDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions('llbeanDeals', [
			{
				displayName: 'Min Discount',
				name: 'llbeanDealsMinDiscount',
				type: 'options',
				default: 20,
				options: [
					{ name: '20% & Up', value: 20 },
					{ name: '30% & Up', value: 30 },
					{ name: '40% & Up', value: 40 },
					{ name: '50% & Up', value: 50 },
					{ name: '60% & Up', value: 60 },
					{ name: '70% & Up', value: 70 },
				],
				description: "US storefront only: the Sale page's % Off filter",
				routing: { request: { body: { min_discount: '={{ $value }}' } } },
			},
		]),
	},

	// -- Get Categories --
	{
		displayName: 'Category ID',
		name: 'llbeanCategoriesId',
		type: 'string',
		default: '',
		placeholder: '474',
		displayOptions: show(['categories']),
		routing: { request: { body: { category_id: '={{ String($value).trim() || undefined }}' } } },
		description: 'Optional: return this one department or category with its children; empty for the whole menu',
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'llbeanProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '37037',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: 'The product ID (product_id from a list; the number after /llb/shop/ in a product link)',
	},

	// -- Get Store Stock --
	{
		displayName: 'Item ID',
		name: 'llbeanStockItemId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '112644',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { item_id: '={{ String($value).trim() }}' } } },
		description: 'An item ID: items[].item_id from Get Product (one fit or size range), not the product ID',
	},
	{
		displayName: 'Stores',
		name: 'llbeanStockScope',
		type: 'options',
		default: 'ids',
		options: [
			{ name: 'Store IDs', value: 'ids' },
			{ name: 'All Stores', value: 'all' },
		],
		displayOptions: show(['storeStock']),
		routing: { request: { body: { all_stores: '={{ $value === "all" ? true : undefined }}' } } },
		description: 'Check up to 20 stores by ID, or every L.L.Bean store',
	},
	{
		displayName: 'Store IDs',
		name: 'llbeanStockStoreIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0040, 1350, 2140',
		displayOptions: show(['storeStock'], { llbeanStockScope: ['ids'] }),
		routing: {
			request: {
				body: {
					store_ids:
						'={{ String($value).split(",").map((s) => s.trim()).filter((s) => s.length > 0) }}',
				},
			},
		},
		description: 'Up to 20 store IDs (store_id from Get Stores), comma-separated',
	},
	{
		displayName: 'Product ID',
		name: 'llbeanStockProductId',
		type: 'string',
		default: '',
		placeholder: '37037',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { product_id: '={{ String($value).trim() || undefined }}' } } },
		description: "Optional, the item's product ID: labels each SKU with its color, size and price (same 1 credit)",
	},

	// -- Get Stores --
	{
		displayName: 'Find By',
		name: 'llbeanStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'All Stores', value: 'all' },
			{ name: 'City and State', value: 'city' },
			{ name: 'Coordinates', value: 'point' },
			{ name: 'Store IDs', value: 'ids' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		routing: { request: { body: { all_stores: '={{ $value === "all" ? true : undefined }}' } } },
		description: 'How to find stores',
	},
	{
		displayName: 'ZIP Code',
		name: 'llbeanStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '04032',
		displayOptions: show(['stores'], { llbeanStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A US ZIP code: stores ordered by distance',
	},
	{
		displayName: 'Latitude',
		name: 'llbeanStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { llbeanStoresBy: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point, e.g. 43.8558',
	},
	{
		displayName: 'Longitude',
		name: 'llbeanStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { llbeanStoresBy: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point, e.g. -70.1028',
	},
	{
		displayName: 'Radius (Miles)',
		name: 'llbeanStoresRadius',
		type: 'number',
		default: 100,
		typeOptions: { minValue: 1, maxValue: 500 },
		displayOptions: show(['stores'], { llbeanStoresBy: ['point'] }),
		routing: { request: { body: { radius: '={{ $value }}' } } },
		description: 'Miles around the point, 1 to 500',
	},
	{
		displayName: 'City',
		name: 'llbeanStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Denver',
		displayOptions: show(['stores'], { llbeanStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city',
	},
	{
		displayName: 'State',
		name: 'llbeanStoresState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CO',
		displayOptions: show(['stores'], { llbeanStoresBy: ['city'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'The 2-letter state code',
	},
	{
		displayName: 'Store IDs',
		name: 'llbeanStoresIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0040, 0080',
		displayOptions: show(['stores'], { llbeanStoresBy: ['ids'] }),
		routing: {
			request: {
				body: {
					store_ids:
						'={{ String($value).split(",").map((s) => s.trim()).filter((s) => s.length > 0) }}',
				},
			},
		},
		description: 'Up to 20 store IDs, comma-separated',
	},
	{
		displayName: 'Limit',
		name: 'llbeanStoresLimit',
		type: 'number',
		default: 10,
		typeOptions: { minValue: 1, maxValue: 75 },
		displayOptions: show(['stores']),
		routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
		description: 'Max number of results to return',
	},

	// -- Get Reviews --
	{
		displayName: 'Product ID',
		name: 'llbeanReviewsProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '120785',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
	},
	{
		displayName: 'Additional Options',
		name: 'llbeanReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Sort',
				name: 'llbeanReviewsSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Most Helpful', value: 'helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Rating: High to Low', value: 'rating_desc' },
					{ name: 'Rating: Low to High', value: 'rating_asc' },
				],
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'llbeanReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'llbeanReviewsLimit',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Filters (JSON)',
				name: 'llbeanReviewsFilters',
				type: 'json',
				default: '{}',
				description: 'Optional review filters: rating (1 to 5), height and weight (a band from stats.context, e.g. "5ft10in", "170180Lbs"), text (words in the review), e.g. {"rating": 5, "text": "warm"}.',
				routing: {
					request: {
						body: {
							filters:
								'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
						},
					},
				},
			},
		]),
	},

	// -- Get Review Summary --
	{
		displayName: 'Product ID',
		name: 'llbeanSummaryProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '37037',
		displayOptions: show(['reviewSummary']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
	},

	// -- Get Delivery Estimate --
	{
		displayName: 'Item ID',
		name: 'llbeanDeliveryItemId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '112644',
		displayOptions: show(['deliveryEstimate']),
		routing: { request: { body: { item_id: '={{ String($value).trim() }}' } } },
		description: 'An item ID (items[].item_id from Get Product)',
	},
	{
		displayName: 'ZIP Code',
		name: 'llbeanDeliveryZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['deliveryEstimate']),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A US ZIP code',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'llbeanSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'fle',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far (1 to 100 characters)',
	},
	{
		displayName: 'Market',
		name: 'llbeanSuggestionsMarket',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (llbean.ca)', value: 'ca' },
			{ name: 'United States (llbean.com)', value: 'us' },
		],
		displayOptions: show(['suggestions']),
		routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'Which storefront to ask',
	},
];
