import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['footlocker'], operation, ...extra },
});

// Foot Locker (footlocker.com + 12 country storefronts, local currency), 10 operations, 1 credit
// each. Search Products, Get Product, Get Category Products, Get Brand Products and Get Deals take
// the Country option (13 storefronts) and, for Canada and Belgium, a Language; Get Release
// Calendar covers the US, Canada and the UK; Find Stores, Get Store Availability, Get Reviews and
// Get Questions are US only. Every route carries a 120s timeout, except Get Reviews and Get
// Questions: they usually take 25-90 s, up to about 3-4 minutes, so they carry 240s.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

// Comma-separated values sent as a list (one value or several, any of them matches).
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const MARKET_OPERATIONS = ['search', 'product', 'category', 'brand', 'deals'];

const COUNTRY_OPTIONS = [
	{ name: 'Australia (AUD)', value: 'au' },
	{ name: 'Austria (EUR)', value: 'at' },
	{ name: 'Belgium (EUR)', value: 'be' },
	{ name: 'Canada (CAD)', value: 'ca' },
	{ name: 'France (EUR)', value: 'fr' },
	{ name: 'Germany (EUR)', value: 'de' },
	{ name: 'Ireland (EUR)', value: 'ie' },
	{ name: 'Italy (EUR)', value: 'it' },
	{ name: 'Netherlands (EUR)', value: 'nl' },
	{ name: 'New Zealand (NZD)', value: 'nz' },
	{ name: 'Spain (EUR)', value: 'es' },
	{ name: 'United Kingdom (GBP)', value: 'gb' },
	{ name: 'United States (Footlocker.com, USD)', value: 'us' },
];

const GRID =
	'48 items per page, each with ID (the SKU, for Get Product), base_product, title, brand, URL, image, price, list_price, percent_off, lowest_price_30d (European storefronts: the lowest price of the last 30 days), on_sale, is_new, is_launch, member_only_sale, rating, review_count, color_count and colors (SKU, color, price, list_price per colorway). Also returns total, page, page_size, total_pages, the sort applied, applied_filters, every facet (ID, label, values with value, label, count; any of them works in Other Filters), country, language, currency and data_as_of: listings can be a few hours old, data_as_of says when this one was built.';

const NOT_FOUND = 'Failed upstream calls are not charged; a not-found is charged.';

const SLOW =
	'Slow: usually 25-90 s, up to about 3-4 minutes when a call is retried; failed calls are not charged. A product without an online page is a charged error. US only.';

// Grid options shared by Search Products, Get Category Products, Get Brand Products and Get
// Deals (Get Brand Products has no Brands filter: the page is one brand).
const gridOptions = (withBrand: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Colors',
			name: 'shades',
			type: 'string',
			default: '',
			placeholder: 'Black, White',
			description:
				'Only these colors, as facets.primaryColor lists them, separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'color', value: splitList } },
		},
		{
			displayName: 'Genders',
			name: 'gender',
			type: 'string',
			default: '',
			placeholder: "Men's",
			description:
				"Gender filter values as facets.gender lists them (Men's, Women's; in the storefront's language), separated by commas",
			routing: { send: { type: 'body', property: 'gender', value: splitList } },
		},
		{
			displayName: 'On Sale Only',
			name: 'on_sale',
			type: 'boolean',
			default: false,
			description: 'Whether to return only items on sale',
			routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Other Filters (JSON)',
			name: 'filters',
			type: 'json',
			default: '{}',
			description:
				'Any filter from a previous response: its facet ID to one value or a list (any of them), e.g. {"mensShoesSize": "10.0"}, {"womensShoesSize": "8.0"}, {"style": "Casual Sneakers"}, {"sport": "Running"}. Several filters combine (AND).',
			routing: {
				request: {
					body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
				},
			},
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 200 },
			description:
				'Results page, 1-based (48 items per page). A page past the last one returns an empty items list with the real total. Defaults to 1.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Price Ranges',
			name: 'price_range',
			type: 'string',
			default: '',
			placeholder: '100-150',
			description:
				'Price bucket values as facets.price lists them (25-50, 50-75, 75-100, 100-150, 150-inf), separated by commas',
			routing: { send: { type: 'body', property: 'price_range', value: splitList } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Brand A-Z', value: 'brand_az' },
				{ name: 'Name A-Z', value: 'name_az' },
				{ name: 'New Arrivals', value: 'new_arrivals' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Relevance', value: 'relevance' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description:
				"Relevance (the site's Featured order, default), price, new arrivals, top rated, name or brand",
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
	];
	if (withBrand) {
		options.push({
			displayName: 'Brands',
			name: 'brand',
			type: 'string',
			default: '',
			placeholder: 'Nike, Jordan',
			description:
				'Only these brands (Nike, Jordan, adidas, New Balance, HOKA), separated by commas; case does not matter. Several match any of them.',
			routing: { send: { type: 'body', property: 'brand', value: splitList } },
		});
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

export const footlockerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['footlocker'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find foot locker stores',
				description:
					'Foot Locker stores near a US ZIP code, a city and state or a point (latitude and longitude), nearest first (up to 50, default 10, within 25 miles by default, up to 120): store_id, name, name_secondary, address, city, state, ZIP, phone, latitude and longitude, distance_miles, weekly hours, opened_at, alert and closure notices, and the store page URL. Foot Locker banner stores only (no Kids Foot Locker or Champs). US only. Costs 1 credit.',
				routing: request('/api/v1/footlocker/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get foot locker brand products',
				description:
					'Every Foot Locker product of one brand by name (any case) or a brand page URL (Nike, Jordan, adidas, New Balance, HOKA...), optionally narrowed by a keyword, with the same filters and sorts as Search Products. ' +
					GRID +
					' brand echoes the brand as the site writes it, brand_id its ID. An unknown brand is an error. ' +
					NOT_FOUND +
					' Costs 1 credit.',
				routing: request('/api/v1/footlocker/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get foot locker category products',
				description:
					"Browse one Foot Locker category by its page path, URL or collection ID (Men's Shoes, Women's Clothing, Kids...), in the site's order by default, with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the category's ID (collection ID), name, path and URL. An unknown category is an error. " +
					NOT_FOUND +
					' Costs 1 credit.',
				routing: request('/api/v1/footlocker/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get foot locker deals',
				description:
					'Foot Locker deal listings: Sale (default; every storefront), Foot Locker Exclusives (US and Canada only) or Promo Code Eligible (the items a promo code applies to), with the same filters and sorts as Search Products. ' +
					GRID +
					' No price history: to track prices over time, poll and store your own. Costs 1 credit.',
				routing: request('/api/v1/footlocker/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a foot locker product',
				description:
					'One Foot Locker product by SKU or URL: title, brand, description, genders, sports, category, color, style code, images, rating, review_count, the price block (price, list_price, percent_off, lowest_price_30d on European storefronts), availability online / to ship / for pickup, launch info (is_launch, launch_type, launch_date, web_only), flags, the size chart, every colorway (SKU, color, price, availability) and every size: available, ship, pickup, stores_available (how many stores show that size as available: a store count, not units), UPC and store SKU. Availability is yes / no per size: Foot Locker publishes no unit counts. A SKU without an online page (unknown, store-only or not launched yet) is an error. ' +
					NOT_FOUND +
					' Costs 1 credit.',
				routing: request('/api/v1/footlocker/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get foot locker product questions',
				description:
					'Shopper questions about one Foot Locker (US) product by SKU or URL, 1-50 per call (default 10), newest answered first, with every answer: question, details, author, submitted_at, answer_count, helpful votes, and per answer its text, author, author_type (brand, retailer or customer), best-answer flag, date and votes. Also returns total_questions. ' +
					SLOW +
					' Costs 1 credit.',
				routing: request('/api/v1/footlocker/questions', 240000),
			},
			{
				name: 'Get Release Calendar',
				value: 'releases',
				action: 'Get the foot locker release calendar',
				description:
					'The Foot Locker sneaker release calendar as monitoring data (US, Canada, UK): SKU, title, brand, colorway (style), style_code, gender, launch_at, online_at, heat_level, in_stock, image, URL, retail_price and currency (US and Canada; the UK has no prices), the reservation status and windows where the storefront runs them (status open / closed / store_only, starts_at, ends_at, assignment_at, awarding_at, online_reveal_at, store procedures; not in the UK) and sizes (US, EU, UK, participating channels). Also returns total, count and data_as_of. Filter by status, a date window and brand. Read-only: nothing here enters, reserves or buys a release. Costs 1 credit.',
				routing: request('/api/v1/footlocker/releases'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get foot locker product reviews',
				description:
					"Customer reviews of one Foot Locker (US) product by SKU or URL, 1-98 per call (default 38), sorted most recent (default), most helpful, highest or lowest rating, or relevance, optionally only one star rating. Returns the review statistics: total_reviews (every language), displayed_reviews (the English reviews the site pages through), average_rating, rating_distribution, recommended_percent, secondary rating averages (fit, comfort, quality...) and photo_count, plus matching_reviews. Each review has ID, rating, title, text, author nickname, submitted_at, recommended, helpful and unhelpful votes, verified_purchaser, incentivized, syndicated and its source, secondary ratings, photos, videos and the brand's response. Reviewer age, gender, location and IP are never returned. More reviews take longer (about 4 s per 30). " +
					SLOW +
					' Costs 1 credit.',
				routing: request('/api/v1/footlocker/reviews', 240000),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get foot locker store availability',
				description:
					'Which Foot Locker stores near a US ZIP code or a point show a product (or one size) as available: each store (as in Find Stores) with available and sizes_available, plus per size whether it ships online, can be picked up and in how many of the listed stores it shows (stores_in_results), and stores_with_availability. Yes / no only: Foot Locker publishes no unit counts. Foot Locker banner stores only. US only. ' +
					NOT_FOUND +
					' Costs 1 credit.',
				routing: request('/api/v1/footlocker/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search foot locker products',
				description:
					'Search Foot Locker by keyword on any of 13 storefronts, filtered by brand, gender, color, price bucket, on sale and any facet (shoe size per gender, style, sport, rating...), sorted by relevance, price, new arrivals, top rated, name or brand. ' +
					GRID +
					" A bare brand keyword (nike, hoka) is answered by the site with a landing page: the brand's listing is returned instead and redirected_to says which. A keyword the site sends to a landing page without a product listing (samba, clearance) is an unbilled error: use Get Brand Products, Get Category Products or Get Deals instead. Costs 1 credit.",
				routing: request('/api/v1/footlocker/search'),
			},
		],
		default: 'search',
	},
];

export const footlockerFields: INodeProperties[] = [
	// -- Storefront (Search Products, Get Product, Get Category Products, Get Brand Products, Get Deals) --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: COUNTRY_OPTIONS,
		displayOptions: show(MARKET_OPERATIONS),
		// us is the server default; leaving it out lets a product, category or brand URL pick its own storefront.
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"The Foot Locker storefront. Titles come in the storefront's language, prices in its currency. Foot Locker Exclusives are US and Canada only. A URL from another storefront uses its own storefront when Country is United States.",
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Storefront Default (Canada: English, Belgium: Dutch)', value: '' },
			{ name: 'Dutch (Belgium)', value: 'nl' },
			{ name: 'English (Canada)', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(MARKET_OPERATIONS, { country: ['ca', 'be'] }),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description: 'Canada: English (default) or French. Belgium: Dutch (default) or French.',
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nike dunk',
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
		options: gridOptions(true),
	},

	// -- Get Product --
	{
		displayName: 'Product SKU',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: 'Q5495005',
		displayOptions: show(['product', 'storeAvailability', 'reviews', 'questions']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"A Foot Locker SKU: a search result's ID, the last part of a product URL (Q5495005 in the US, 12 digits such as 316707025504 in Europe). Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.footlocker.com/product/jordan-retro-1-high-og-mens/Q5495005.html',
		displayOptions: show(['product', 'storeAvailability', 'reviews', 'questions']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A Foot Locker product URL (its storefront and SKU are used). Used when Product SKU is not given.',
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		default: '',
		placeholder: '/category/mens/shoes.html',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value || undefined }}' } } },
		description:
			"A Foot Locker category page path (/category/... .html), as the site's category links carry it. Use this, Category URL or Collection ID.",
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.footlocker.com/category/mens/shoes.html',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A Foot Locker category URL (its storefront and page are used)',
	},
	{
		displayName: 'Collection ID',
		name: 'collection_id',
		type: 'string',
		default: '',
		placeholder: 'men-s-shoes',
		displayOptions: show(['category']),
		routing: { request: { body: { collection_id: '={{ $value || undefined }}' } } },
		description: "A collection ID: a previous response's category.ID (saves time on page 2+)",
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions(true),
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand Name',
		name: 'brandName',
		type: 'string',
		default: '',
		placeholder: 'New Balance',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		description:
			'A brand name (Nike, Jordan, adidas, New Balance, HOKA, PUMA); case does not matter. Use this or Brand Page URL.',
	},
	{
		displayName: 'Brand Page URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.footlocker.com/category/brands/new-balance.html',
		displayOptions: show(['brand']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A Foot Locker brand page URL (/category/brands/... .html). Used when Brand Name is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: (
			[
				...gridOptions(false),
				{
					displayName: 'Keyword',
					name: 'query',
					type: 'string',
					default: '',
					placeholder: 'running shoes',
					description: 'Narrow the brand to a keyword',
					routing: { request: { body: { query: '={{ $value || undefined }}' } } },
				},
			] as INodeProperties[]
		).sort((x, y) => x.displayName.localeCompare(y.displayName)),
	},

	// -- Get Deals --
	{
		displayName: 'List',
		name: 'type',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'Foot Locker Exclusives (US and Canada)', value: 'exclusives' },
			{ name: 'Promo Code Eligible', value: 'discount_eligible' },
			{ name: 'Sale', value: 'sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description:
			'Which deal listing to read: Sale (default; every storefront), Foot Locker Exclusives (US and Canada only) or the items a promo code applies to',
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions(true),
	},

	// -- Get Release Calendar --
	{
		displayName: 'Country',
		name: 'releaseCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (CAD)', value: 'ca' },
			{ name: 'United Kingdom (No Prices or Reservation Windows)', value: 'gb' },
			{ name: 'United States (USD)', value: 'us' },
		],
		displayOptions: show(['releases']),
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: 'The storefront whose release calendar to read: US (default), Canada or UK',
	},
	{
		displayName: 'Additional Options',
		name: 'releasesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['releases']),
		options: [
			{
				displayName: 'Brand',
				name: 'brand',
				type: 'string',
				default: '',
				placeholder: 'Nike',
				description: 'Only this brand (case does not matter)',
				routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				default: '',
				placeholder: '2026-11-01',
				description: 'Only releases launching on or after this ISO date',
				routing: { request: { body: { from: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Language (Canada)',
				name: 'language',
				type: 'options',
				default: 'en',
				options: [
					{ name: 'English', value: 'en' },
					{ name: 'French', value: 'fr' },
				],
				description: 'Canada only: English (default) or French',
				routing: { request: { body: { language: '={{ $value }}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Launched', value: 'launched' },
					{ name: 'Upcoming', value: 'upcoming' },
				],
				description: 'All (default), upcoming (launch date ahead) or launched',
				routing: { request: { body: { status: '={{ $value }}' } } },
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				default: '',
				placeholder: '2026-12-31',
				description: 'Only releases launching on or before this ISO date',
				routing: { request: { body: { to: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Store Availability --
	{
		displayName: 'Size',
		name: 'size',
		type: 'string',
		default: '',
		placeholder: '10.0',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { size: '={{ $value || undefined }}' } } },
		description:
			"One size as Get Product's sizes[].size lists it (10.0, 10, XL). Leave empty for every size.",
	},

	// -- Find Stores / Get Store Availability: location --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Search near a ZIP code, a city and state, or a latitude/longitude pair',
	},
	{
		displayName: 'Locate By',
		name: 'availabilityLocateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['storeAvailability']),
		description: 'Check the stores nearest to a ZIP code or a latitude/longitude pair',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Atlanta',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'US city to search around (with State)',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'GA',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: '2-letter US state code',
	},
	{
		displayName: 'Latitude',
		name: 'lat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { lat: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'lng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Latitude',
		name: 'lat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['coordinates'] }),
		routing: { request: { body: { lat: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'lng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['coordinates'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores', 'storeAvailability']),
		options: [
			{
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Stores to return, nearest first, 1-50. Defaults to 10.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 120 },
				description: 'Search radius in miles, 1-120. Defaults to 25.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
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
				displayName: 'Max Reviews',
				name: 'maxReviews',
				type: 'number',
				default: 38,
				typeOptions: { minValue: 1, maxValue: 98 },
				description:
					'Reviews to return, 1-98. Defaults to 38. More reviews take longer (about 4 s per 30).',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Rating',
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
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_recent',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Most recent (default), most helpful, highest or lowest rating, or relevance',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Questions --
	{
		displayName: 'Additional Options',
		name: 'questionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['questions']),
		options: [
			{
				displayName: 'Max Questions',
				name: 'maxQuestions',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Questions to return, 1-50. Defaults to 10.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},
];
