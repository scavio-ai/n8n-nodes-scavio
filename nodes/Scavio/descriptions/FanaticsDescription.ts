import type { INodeProperties } from 'n8n-workflow';

const show = (
	operation: string[],
	extra: Record<string, Array<string | number | boolean>> = {},
) => ({
	show: { resource: ['fanatics'], operation, ...extra },
});

// Fanatics (fanatics.com + 7 country storefronts, local currency, plus 4 US league stores), 5
// operations, 1 credit each. Merchandise and product data, not sportsbook odds. Search Products,
// Get Product, Browse Listing and Get Deals take the Country option (8 storefronts), a Language
// for Canada and a League Store for the US; Get Reviews is US only. Every route carries a 120s
// timeout, except Get Reviews: it usually takes 20-90 s, up to about 4 minutes, so it carries
// 300s.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const MARKET_OPERATIONS = ['search', 'product', 'browse', 'deals'];

const COUNTRY_OPTIONS = [
	{ name: 'Canada (CAD)', value: 'ca' },
	{ name: 'France (EUR)', value: 'fr' },
	{ name: 'Germany (EUR)', value: 'de' },
	{ name: 'Italy (EUR)', value: 'it' },
	{ name: 'Japan (JPY)', value: 'jp' },
	{ name: 'Spain (EUR)', value: 'es' },
	{ name: 'United Kingdom (GBP)', value: 'gb' },
	{ name: 'United States (Fanatics.com, USD)', value: 'us' },
];

const GRID =
	"Items with ID (for Get Product and Get Reviews), title, brand, URL, image, price (current), regular_price, sale_price, clearance_price, with_code_price and code_percent_off (the price with the site's current promo code, when it applies), price_label (none, coupon or clearance), percent_off, top_seller, customizable, ready_to_ship, ship_by, est_delivery, urgency signals and is_sponsored. Also returns total (the US site counts at most 9000: total_capped is true when the real number is 9000 or more), page, page_size, total_pages, the sort, every facet (ID, label, values with label, filter, value and count: any of them works in Other Filters), country, language, currency, site and data_as_of (when Fanatics built the page; listings can be a few minutes old).";

const CHARGE =
	'Failed upstream calls are not charged (they are retried automatically); a not-found is charged. Costs 1 credit.';

const idOption = (
	displayName: string,
	name: string,
	placeholder: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [name]: '={{ $value || undefined }}' } } },
});

const LEAGUE_ID = idOption(
	'League ID',
	'league_id',
	'25',
	'One league: NFL 25, MLB 19, NBA 23, NHL 26, College 5 (IDs from facets)',
);
const TEAM_ID = idOption(
	'Team ID',
	'team_id',
	'3372',
	'One team (from facets): Los Angeles Lakers 3372, Kansas City Chiefs 3433',
);
const DEPARTMENT_ID = idOption(
	'Department ID',
	'department_id',
	'8011',
	'One department (from facets): Jerseys 8011, Hats 8008, T-Shirts 8022; parent-child (8008-8084) for a sub-department',
);
const BRAND_ID = idOption(
	'Brand ID',
	'brand_id',
	'479',
	"One brand (from facets.brands): '47 479, Nike 76, New Era 127",
);

const GENDER: INodeProperties = {
	displayName: 'Gender',
	name: 'gender',
	type: 'options',
	default: 'men',
	options: [
		{ name: 'Baby', value: 'baby' },
		{ name: 'Kids', value: 'kids' },
		{ name: 'Men', value: 'men' },
		{ name: 'Women', value: 'women' },
	],
	description: 'Only items for this gender or age group',
	routing: { request: { body: { gender: '={{ $value }}' } } },
};

const FILTERS: INodeProperties = {
	displayName: 'Other Filters (JSON)',
	name: 'filters',
	type: 'json',
	default: '{}',
	description:
		'Filters from a previous response: facets[].values[].filter to facets[].values[].value, one value per filter (up to 12), e.g. {"ga": "2"} (Women), {"ks": "126"} (a kids size), {"fa": "1"} (Autographed), {"t": "3433"} (a team)',
	routing: {
		request: {
			body: {
				filters:
					'={{ (v => Object.keys(v || {}).length ? v : undefined)(typeof $value === "string" ? JSON.parse($value || "{}") : $value) }}',
			},
		},
	},
};

const GRID_OPTIONS: INodeProperties[] = [
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 375 },
		description: 'Results page, 1-based. Fanatics lists at most 9000 products per listing.',
		routing: { request: { body: { page: '={{ $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'page_size',
		type: 'options',
		default: 72,
		options: [
			{ name: '24', value: 24 },
			{ name: '48', value: 48 },
			{ name: '72', value: 72 },
		],
		description: 'Items per page (default 72)',
		routing: { request: { body: { page_size: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'top_sellers',
		options: [
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_high_to_low' },
			{ name: 'Price: Low to High', value: 'price_low_to_high' },
			{ name: 'Top Sellers', value: 'top_sellers' },
		],
		description:
			"Top sellers (default), price or newest. Price sorts follow the site's lowest price, which is the with-code price when a promo code applies.",
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
];

const sorted = (options: INodeProperties[]) =>
	[...options].sort((x, y) => x.displayName.localeCompare(y.displayName));

export const fanaticsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['fanatics'] } },
		options: [
			{
				name: 'Browse Listing',
				value: 'browse',
				action: 'Browse a fanatics listing',
				description:
					"Browse a Fanatics listing by its URL or by IDs: a team (Lakers 5,000+ products), a player (Mahomes), a league section (NFL hats), a department, a brand ('47, Nike, New Era) or a collection, with price band, on sale, gender and any facet as filters (sizes, color style, autographed). The facets list the listing's teams, players (up to 100 on a team page), departments, brands, collections and sizes with their IDs. browse names the league, team, player, department, brand and collection the page shows. Send a URL or IDs, not both; a league alone is a landing page: combine it with another ID or a filter. " +
					GRID +
					' ' +
					CHARGE,
				routing: request('/api/v1/fanatics/browse'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get fanatics deals',
				description:
					"Fanatics deal listings: Sale (default: the site's Sale listing, coupon-eligible items and clearance markdowns), Clearance (each sale page's clearance-priced items; total counts the whole sale listing) or Under 25 (items under 25 in the storefront's currency, by the site's lowest price; not in Japan), optionally for one league, team, department or brand. " +
					GRID +
					' No price history: to track jersey sale prices, poll and store your own. ' +
					CHARGE,
				routing: request('/api/v1/fanatics/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a fanatics product',
				description:
					"One Fanatics product by ID or URL: title, brand, league, team, player, gender, categories, breadcrumb, description, details, images, the price block (price, regular_price, sale_price, clearance_price, with_code_price, code_percent_off, percent_off, price_label), the site's current promo code (code, percent_off, tiered, ends_on, applies_to_product), in_stock, every size (item_id, available, stock_level low / out, price, with_code_price, ship_by, estimated delivery window, promise_ship_days), every colorway, personalization (name / number fields with their rules and the team roster; the price already includes personalization), flags (jersey_assurance, non_returnable, exclusive, authentic for autographed / authenticated items), the rating (average, count, distribution, fit, value, quality), review_count and data_as_of. Stock is a level, never a unit count. " +
					CHARGE,
				routing: request('/api/v1/fanatics/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get fanatics product reviews',
				description:
					"Customer reviews of one Fanatics (fanatics.com, US) product by ID or URL, 1-50 per call (default 10), sorted highest rated (default, the site's order), lowest rated, most recent or most helpful, optionally only one star rating. Returns stats (review_count, rating_count, average, distribution, fit, quality and value averages), the site's own AI-written review summary (ai_summary) and the features reviewers mention. Each review has ID, product_id and product_title, rating, fit, quality, value, recommended, title, text, author nickname, submitted_at, updated_at, incentivized, helpful and unhelpful votes, features with sentiment and photos. Fanatics pools reviews across a style: the list (and matching_reviews) covers sibling products of the same cut, so check each review's product_id. Slow: usually 20-90 s, up to about 4 minutes when a call is retried; when busy it returns an error with Retry-After. Failed calls are not charged; an unknown product is a charged error. US only. Costs 1 credit.",
				routing: request('/api/v1/fanatics/reviews', 300000),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search fanatics products',
				description:
					'Search Fanatics merchandise (jerseys, hats, fan gear, collectibles; product data, not odds) by keyword on 8 storefronts and 4 US league stores. Narrow by gender, league ID, department ID or any facet value through Other Filters (team, player, size, color style, autographed...). Sort by top sellers, price or newest. Misspellings come back corrected (corrected_query). ' +
					GRID +
					' Price filters are on Browse Listing and Get Deals (on a keyword search the site loosens the match). ' +
					CHARGE,
				routing: request('/api/v1/fanatics/search'),
			},
		],
		default: 'search',
	},
];

export const fanaticsFields: INodeProperties[] = [
	// -- Storefront (Search Products, Get Product, Browse Listing, Get Deals) --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: COUNTRY_OPTIONS,
		displayOptions: show(MARKET_OPERATIONS),
		// us is the server default; leaving it out lets a product or listing URL pick its own storefront.
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"The Fanatics storefront. Titles come in the storefront's language, prices in its currency. A URL from another storefront uses its own storefront when Country is United States.",
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Storefront Default (English)', value: '' },
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(MARKET_OPERATIONS, { country: ['ca'] }),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description: 'Canada only: English (default) or French',
	},
	{
		displayName: 'League Store',
		name: 'site',
		type: 'options',
		default: 'fanatics',
		options: [
			{ name: 'Fanatics (Fanatics.com)', value: 'fanatics' },
			{ name: 'MLB Shop', value: 'mlbshop' },
			{ name: 'MLS Store', value: 'mlsstore' },
			{ name: 'NFL Shop', value: 'nflshop' },
			{ name: 'NHL Shop', value: 'nhlshop' },
		],
		displayOptions: show(MARKET_OPERATIONS, { country: ['us'] }),
		routing: { request: { body: { site: '={{ $value === "fanatics" ? undefined : $value }}' } } },
		description:
			'US only: the store to read. Same product IDs on every store; each store writes its own titles. A URL from a league store uses its own store when this is Fanatics.',
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'chiefs jersey',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords. Misspellings are corrected by the site (corrected_query).',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([LEAGUE_ID, DEPARTMENT_ID, GENDER, FILTERS, ...GRID_OPTIONS]),
	},

	// -- Get Product / Get Reviews --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '3892922',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"A Fanatics product ID: a search result's ID. The same ID works on every league store. Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.fanatics.com/x/p-3892922',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A product URL on any covered storefront or league store (Get Reviews: fanatics.com only). Used when Product ID is not given.',
	},

	// -- Browse Listing --
	{
		displayName: 'Listing URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.fanatics.com/nba/los-angeles-lakers/o-23+t-3372',
		displayOptions: show(['browse']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A Fanatics listing URL: a team, player, league section, department, brand or collection page. Leave empty to browse by the IDs in Additional Options.',
	},
	{
		displayName: 'Additional Options',
		name: 'browseOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['browse']),
		options: sorted([
			{
				...LEAGUE_ID,
				description:
					'League: NFL 25, MLB 19, NBA 23, NHL 26, College 5. A league alone is a landing page: combine it with another ID or a filter.',
			},
			TEAM_ID,
			idOption(
				'Player ID',
				'player_id',
				'12072',
				'One player (from facets.players): Patrick Mahomes 12072, Aaron Judge 31',
			),
			DEPARTMENT_ID,
			BRAND_ID,
			idOption(
				'Collection ID',
				'collection_id',
				'11552',
				'One collection (from facets.productGroups): City Edition 11552',
			),
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description: 'Whether to return only sale items',
				routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Band',
				name: 'price_band',
				type: 'options',
				default: 'under_25',
				options: [
					{ name: '100 to 150', value: '100_150' },
					{ name: '25 to 50', value: '25_50' },
					{ name: '50 to 100', value: '50_100' },
					{ name: 'Over 150', value: 'over_150' },
					{ name: 'Under 25', value: 'under_25' },
				],
				description:
					"The site's bands in the storefront's currency, applied to its lowest price (the with-code price when a promo code applies, so a few items list a little above the band). Not in Japan.",
				routing: { request: { body: { price_band: '={{ $value }}' } } },
			},
			GENDER,
			FILTERS,
			...GRID_OPTIONS,
		]),
	},

	// -- Get Deals --
	{
		displayName: 'List',
		name: 'type',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Sale', value: 'sale' },
			{ name: 'Under 25 (Not in Japan)', value: 'under_25' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description:
			"Which deal listing to read: Sale (default), Clearance (the clearance-priced items of each sale page) or Under 25 in the storefront's currency",
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([LEAGUE_ID, TEAM_ID, DEPARTMENT_ID, BRAND_ID, ...GRID_OPTIONS]),
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
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description:
					'Reviews to return, 1-50. Defaults to 10. More than 10 takes a few seconds longer per 8.',
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
				default: 'highest_rated',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				description:
					"Highest rated (default, the site's order), lowest rated, most recent or most helpful",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
