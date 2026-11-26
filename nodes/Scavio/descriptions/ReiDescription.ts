import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rei'], operation, ...extra },
});

// REI (rei.com, the US outdoor co-op; US only, USD), 9 operations, 2 credits each; credits_used is
// the truth. Calls usually take 3-20 s, so every operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const TWO =
	'A not-found is charged; failed upstream calls and refused inputs are not. Costs 2 credits (credits_used says what was charged).';

const ITEM =
	"position, product_id (what Get Product and Get Reviews take), name, brand, URL, image, rating, review_count, price and price_max (current), compare_at, regular_price, percent_off, savings_text, price_type (regular, sale or outlet), sale, clearance, outlet, members_only (REI's Just for Members badge), available, online_only, badges, flair (dated promo text as given, e.g. Sale Ends Dec 1), attributes, colors and sizes (with the sku_id Get Store Stock takes)";
const GRID = `30 or 90 items per page, each with ${ITEM}. Also returns page, page_size, total, total_pages, has_more, count, sort, title, facets (key, title, values with value, label, count, selected; any of them works in Facets), categories, breadcrumbs, store_filter and notes. Prices in USD as shown to a visitor who is not signed in.`;

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);

// Grid options shared by Search Products, Get Category Products and Get Deals.
const gridOptions = (prefix: string): INodeProperties[] =>
	(
		[
			{
				displayName: 'Facets (JSON)',
				name: `${prefix}Facets`,
				type: 'json',
				default: '{}',
				description:
					'Facet filters from a previous answer: its facets[].key to one value or a list (OR-ed), at most 10 keys, e.g. {"brand": "arcteryx"}, {"price": "$20.00 to $49.99"}, {"average-rating": "4 to 5"}. Values exactly as REI writes them. Keys combine.',
				routing: {
					request: {
						body: { facets: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
					},
				},
			},
			{
				displayName: 'Page',
				name: `${prefix}Page`,
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 400 },
				description: 'Results page, 1-based. Total_pages reports the last one.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: `${prefix}PageSize`,
				type: 'options',
				default: 30,
				options: [
					{ name: '30', value: 30 },
					{ name: '90', value: 90 },
				],
				description: 'Results per page, the two sizes REI offers',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: `${prefix}Sort`,
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling', value: 'best_selling' },
					{ name: 'Brand A-Z', value: 'brand_a_z' },
					{ name: 'Brand Z-A', value: 'brand_z_a' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Percent Off', value: 'percent_off' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Top Rated', value: 'top_rated' },
				],
				description: "Relevance is REI's Best Match; top rated orders by rating, then review count",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Store Number',
				name: `${prefix}Store`,
				type: 'string',
				default: '',
				placeholder: '18',
				description:
					'Limit results to items REI shows as available at this store (store_number from Find Stores). Store_filter reports the store and its count.',
				routing: { request: { body: { store: '={{ String($value).trim() || undefined }}' } } },
			},
		] as INodeProperties[]
	).sort(byName);

/** A product ID-or-link field: an https link goes to url, anything else to product_id. */
const productField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '243702',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				product_id:
					'={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'An REI product ID (items[].product_id, e.g. 243702 or C09719) or an rei.com product link',
});

export const reiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rei'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find rei stores',
				description: `REI stores near a US ZIP code or coordinates, ordered by distance, up to 10 within 100 miles by default (up to 250): store_number, name, type, address, phone, coordinates, distance_miles, URL, open_for_shopping, curbside_pickup, product_count and events (upcoming special hours as given, e.g. Thanksgiving and #OptOutside closures, plus normal hours). A place with no store in range is an empty list. ${TWO}`,
				routing: request('/api/v1/rei/stores'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get rei category products',
				description: `Browse one REI category by slug or link (tents, mens-rain-jackets, camping-and-hiking...), sorted and filtered like Search Products. ${GRID} Categories holds the child categories with counts. An unknown category is a charged not-found. ${TWO}`,
				routing: request('/api/v1/rei/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get rei deals',
				description: `REI deal listings: Deals (everything on sale or clearance) or REI Outlet, optionally in one category, sorted and filtered like Search Products. ${GRID} Per-item end dates come as flair text as REI gives it; there is no price history (poll and store). ${TWO}`,
				routing: request('/api/v1/rei/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an rei product',
				description: `One REI product by ID or link: name, brand, description, features, specs, breadcrumbs, price range with compare-at, outlet, badges, members_only, member_reward_estimate (REI's estimate of the co-op member reward; not a member price), return_days, colors, sizes, images and every SKU (sku_id, color, size, available, status, price, compare_at, price_type, savings, UPC, new_arrival, store_pickup_only), the review summary (count, average, histogram, recommended percent, fit) and questions with answers (no author names). An unknown product is a charged not-found. ${TWO}`,
				routing: request('/api/v1/rei/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get rei reviews',
				description: `Reviews of one REI product, 10 per page in the site's 5 sorts, optionally filtered by star rating: total (matching reviews), total_reviews, total_pages, has_more and reviews (review_id, rating, title, text, dates, would_recommend, helpful votes, badges, verified_purchaser, incentivized, syndicated_from, fit, reviewer_context bands, purchased_size, photo_count, brand_responses, original_product_name). No reviewer names or locations; staff and reviewer names are taken out of brand responses. ${TWO}`,
				routing: request('/api/v1/rei/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get rei search suggestions',
				description:
					'REI search-term suggestions for a partial query (term, top_products_available): terms that start with the query, then terms that contain it. ,.',
				routing: request('/api/v1/rei/suggestions'),
			},
			{
				name: 'Get Store Details',
				value: 'store',
				action: 'Get rei store details',
				description: `One REI store by store number: name, type, address, phone, coordinates, time zone, URL, opened, open and closure flags, curbside, rentals, bike shop, ski shop, used gear and trade-in flags, services, rentals, departments, hours (normal, curbside and dated special hours as given) and holidays. An unknown store is a charged not-found. ${TWO}`,
				routing: request('/api/v1/rei/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get rei store stock',
				description: `Store pickup status of one REI SKU at the 4-10 REI stores nearest a US ZIP code, a city and state, or coordinates: count, in_stock_count, ship_to_store_count and stores (status: in_stock = on the shelf for pickup, ship_to_store = free shipping to that store, unavailable; status_text, estimated_arrival and the store). These are REI's pickup flags: REI publishes no unit counts. A location REI cannot place is an uncharged error. ${TWO}`,
				routing: request('/api/v1/rei/store-stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search rei products',
				description: `Search REI (rei.com, US) by keyword in the site's 9 sorts, filtered by any facet (brand, price, rating, deals, features, color, size...) and by one store. ${GRID} Used gear is not listed: REI does not sell it online. ${TWO}`,
				routing: request('/api/v1/rei/search'),
			},
		],
		default: 'search',
	},
];

export const reiFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'reiSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rain jacket',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'reiSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('reiSearch'),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Slug or URL',
		name: 'reiCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tents',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A category slug (categories[].slug, the part after /c/ in an rei.com link) or an rei.com category link (its query string is not read: set Facets instead)',
	},
	{
		displayName: 'Additional Options',
		name: 'reiCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('reiCategory'),
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'reiDealType',
		type: 'options',
		default: 'deals',
		options: [
			{ name: 'Deals (Sale and Clearance)', value: 'deals' },
			{ name: 'REI Outlet', value: 'outlet' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Which REI deal listing to read',
	},
	{
		displayName: 'Additional Options',
		name: 'reiDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: (
			[
				...gridOptions('reiDeals'),
				{
					displayName: 'Category Slug',
					name: 'reiDealsCategory',
					type: 'string',
					default: '',
					placeholder: 'tents',
					description: 'Limit the deals to one category',
					routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
				},
			] as INodeProperties[]
		).sort(byName),
	},

	// -- Get Product --
	productField('reiProduct', 'product'),

	// -- Get Reviews --
	productField('reiReviewsProduct', 'reviews'),
	{
		displayName: 'Additional Options',
		name: 'reiReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'reiReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page of 10 reviews, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Ratings',
				name: 'reiReviewsRating',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description:
					'Only reviews with these star ratings (empty: any). Total then counts the matching reviews.',
				routing: {
					request: { body: { rating: '={{ $value && $value.length ? $value : undefined }}' } },
				},
			},
			{
				displayName: 'Sort',
				name: 'reiReviewsSort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Review order, as on the site',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Store Stock --
	{
		displayName: 'SKU',
		name: 'reiStockSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2437020001',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'A SKU ID: Get Product skus[].sku_id or items[].sizes[].skus[].sku_id',
	},
	{
		displayName: 'Location By',
		name: 'reiStockBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['storeStock']),
		description:
			'Find the nearest stores by a US ZIP code, a city and state, or a latitude and longitude',
	},
	{
		displayName: 'ZIP Code',
		name: 'reiStockZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '98101',
		displayOptions: show(['storeStock'], { reiStockBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code',
	},
	{
		displayName: 'City',
		name: 'reiStockCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Portland',
		displayOptions: show(['storeStock'], { reiStockBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city',
	},
	{
		displayName: 'State',
		name: 'reiStockState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'OR',
		displayOptions: show(['storeStock'], { reiStockBy: ['city'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The city's 2-letter state code",
	},
	{
		displayName: 'Latitude',
		name: 'reiStockLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['storeStock'], { reiStockBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point to search around',
	},
	{
		displayName: 'Longitude',
		name: 'reiStockLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['storeStock'], { reiStockBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point to search around',
	},

	// -- Find Stores --
	{
		displayName: 'Location By',
		name: 'reiStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Search around a US ZIP code or a latitude and longitude',
	},
	{
		displayName: 'ZIP Code',
		name: 'reiStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '80202',
		displayOptions: show(['stores'], { reiStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code',
	},
	{
		displayName: 'Latitude',
		name: 'reiStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { reiStoresBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point to search around',
	},
	{
		displayName: 'Longitude',
		name: 'reiStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { reiStoresBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point to search around',
	},
	{
		displayName: 'Additional Options',
		name: 'reiStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Limit',
				name: 'reiStoresLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'reiStoresRadius',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 250 },
				description: 'Search radius in miles, 1-250',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Store Details --
	{
		displayName: 'Store Number',
		name: 'reiStoreNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '18',
		displayOptions: show(['store']),
		routing: { request: { body: { store_number: '={{ String($value).trim() }}' } } },
		description:
			'The store number (stores[].store_number from Find Stores), e.g. 18 for Denver Flagship',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'reiSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tent',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Additional Options',
		name: 'reiSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Limit',
				name: 'reiSuggestionsLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},
];
