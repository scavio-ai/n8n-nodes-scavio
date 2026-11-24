import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['nike'], operation, ...extra },
});

// Nike (nike.com, including Jordan Brand), 8 operations, 1 credit each (credits_used is the
// truth). Country (62 storefronts in 42 countries, cn is www.nike.com.cn) + Language where a
// country has several (default its primary language). Get Releases and Get Release are not
// offered on vn, cn or jp in English; Get Reviews not on cn. Calls can queue behind the backend's
// upstream limit, so every operation carries a 240s timeout, like Michaels.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = 'Nike (nike.com, including Jordan Brand)';
const PRICES =
	'Price and full_price as Nike shows them; discount_percent as Nike gives it. Prices are per storefront, in its own currency, and differ between markets (also inside the euro zone); no store prices.';
const ITEM =
	"items with style_color (for Get Product, Get Reviews and Get Release), name, subtitle, color, price, full_price, discount_percent, currency, product_type, image, URL, badge, promotions (Nike's offer text with its start and end dates) and colorways";
const LIST =
	"plus market, total and total_pages (as Nike gives them), facets (each option's filter is what Filter Tokens takes) and categories (each path is what Get Category Products takes). First page only: the 24 product groups Nike's page shows first.";
const LAUNCH =
	'per launch item style_color, name, price, full_price, currency, release_start, method (LINE or DRAW, as Nike labels it), entry_start, entry_end, launch_status, thread (slug, title, URL) and sizes with size, GTIN, level (HIGH, MEDIUM, LOW or OOS as Nike gives it) and available';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const IS_URL = '/^https?:/i.test(String($value).trim())';
const IS_STYLE = '/^[a-z0-9]{5,10}-[a-z0-9]{3}$/i.test(String($value).trim())';
const MARKET_OPS = ['search', 'product', 'category', 'brand', 'deals'];
const LAUNCH_OPS = ['releases', 'release'];

const MARKETS: Array<{ name: string; value: string }> = [
	{ name: 'Australia', value: 'au' },
	{ name: 'Austria', value: 'at' },
	{ name: 'Belgium', value: 'be' },
	{ name: 'Bulgaria', value: 'bg' },
	{ name: 'Canada', value: 'ca' },
	{ name: 'China', value: 'cn' },
	{ name: 'Croatia', value: 'hr' },
	{ name: 'Czechia', value: 'cz' },
	{ name: 'Denmark', value: 'dk' },
	{ name: 'Finland', value: 'fi' },
	{ name: 'France', value: 'fr' },
	{ name: 'Germany', value: 'de' },
	{ name: 'Greece', value: 'gr' },
	{ name: 'Hungary', value: 'hu' },
	{ name: 'Indonesia', value: 'id' },
	{ name: 'Ireland', value: 'ie' },
	{ name: 'Israel', value: 'il' },
	{ name: 'Italy', value: 'it' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'Luxembourg', value: 'lu' },
	{ name: 'Malaysia', value: 'my' },
	{ name: 'Mexico', value: 'mx' },
	{ name: 'Netherlands', value: 'nl' },
	{ name: 'Norway', value: 'no' },
	{ name: 'Philippines', value: 'ph' },
	{ name: 'Poland', value: 'pl' },
	{ name: 'Portugal', value: 'pt' },
	{ name: 'Romania', value: 'ro' },
	{ name: 'Singapore', value: 'sg' },
	{ name: 'Slovakia', value: 'sk' },
	{ name: 'Slovenia', value: 'si' },
	{ name: 'South Africa', value: 'za' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'Spain', value: 'es' },
	{ name: 'Sweden', value: 'se' },
	{ name: 'Switzerland', value: 'ch' },
	{ name: 'Taiwan', value: 'tw' },
	{ name: 'Thailand', value: 'th' },
	{ name: 'Turkey', value: 'tr' },
	{ name: 'United Kingdom', value: 'gb' },
	{ name: 'United States', value: 'us' },
	{ name: 'Vietnam', value: 'vn' },
];
// Nike's launch calendar lists no launches on Vietnam or China (nor on Japan in English).
const LAUNCH_MARKETS = MARKETS.filter((m) => m.value !== 'vn' && m.value !== 'cn');
// www.nike.com.cn has no reviews page.
const REVIEW_MARKETS = MARKETS.filter((m) => m.value !== 'cn');

const countryField = (
	name: string,
	markets: Array<{ name: string; value: string }>,
	operations: string[],
	description: string,
): INodeProperties => ({
	displayName: 'Country',
	name,
	type: 'options',
	default: 'us',
	options: markets,
	displayOptions: show(operations),
	routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
	description,
});

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'nikeSort',
	type: 'options',
	default: 'featured',
	options: [
		{ name: 'Featured', value: 'featured' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_high' },
		{ name: 'Price: Low to High', value: 'price_low' },
	],
	description: "Result order (Featured is Nike's default)",
	routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filter Tokens',
	name: 'nikeFilters',
	type: 'string',
	default: '',
	placeholder: 'black-90poy',
	description:
		"Up to 6 comma-separated facet tokens exactly as an earlier response gives them in facets[].options[].filter (size, gender, colour, price band, sport, discount band). A token from a filtered response already carries the filters applied there.",
	routing: { request: { body: { filter: '={{ String($value).trim() ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}' } } },
};

const searchFilterOption: INodeProperties = {
	displayName: 'Filter Token',
	name: 'nikeSearchFilter',
	type: 'string',
	default: '',
	placeholder: 'black-90poy',
	description:
		'ONE facet token exactly as an earlier search response gives it in facets[].options[].filter. A token from a filtered response already carries every filter applied there, so one token narrows step by step.',
	routing: { request: { body: { filter: '={{ String($value).trim() || undefined }}' } } },
};

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const listCollection = (name: string, operation: string, options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...options]),
});

export const nikeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nike'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get nike brand products',
				description: `Jordan Brand, ACG or Nike SB products on any ${NAME} storefront, sorted and filtered. Returns ${ITEM}, ${LIST} ${PRICES} ${ONE}.`,
				routing: request('/api/v1/nike/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get nike category products',
				description: `One ${NAME} listing by path token or link (men's shoes, running, a collection, ...), sorted and filtered by up to 6 facet tokens: ${ITEM}, ${LIST} ${PRICES} A listing with no products is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/nike/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get nike deals',
				description: `The Sale listing of ${NAME} on any storefront, optionally for one gender or one category, sorted and filtered (e.g. by discount band). Returns ${ITEM}, ${LIST} ${PRICES} ${ONE}.`,
				routing: request('/api/v1/nike/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a nike product',
				description: `One ${NAME} product by style color or link, on any storefront: price, full_price, discount_percent, every size with its GTIN and Nike's status (sizes, not stock levels: Nike's product page shows no stock), colorways with their prices, status, release_type, launch dates, member_product and by_you flags, features, details and images. ${PRICES} A launch-only product answers a charged not-found pointing to Get Release. ${ONE}.`,
				routing: request('/api/v1/nike/product'),
			},
			{
				name: 'Get Release',
				value: 'release',
				action: 'Get a nike release',
				description: `One launch of ${NAME}'s launch calendar by style color, thread slug or link (past launches too, back to 2022): thread and ${LAUNCH}. Not on Vietnam, China or Japan in English. An unknown launch is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/nike/release'),
			},
			{
				name: 'Get Releases',
				value: 'releases',
				action: 'Get the nike release calendar',
				description: `${NAME}'s launch calendar (the upcoming, feed or in stock tab) on a storefront: ${LAUNCH}. Size levels are as Nike gives them; before a launch Nike can show LOW on every size. Not on Vietnam, China or Japan in English. Read-only launch data: no entry or purchase. ${ONE}.`,
				routing: request('/api/v1/nike/releases', true),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get nike reviews',
				description: `The review summary of one ${NAME} product by style color or link (www.nike.com storefronts): total_reviews, average_rating, average_size_rating, average_comfort_rating, review_summary (Nike's own summary, where Nike shows one) and the 3 newest reviews Nike's page shows (heading, rating, created_at, text, verified_purchase; no reviewer names). No paging. ${ONE}.`,
				routing: request('/api/v1/nike/reviews'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search nike products',
				description: `Search ${NAME} by keywords or a style color on any of its storefronts, sorted (featured, newest, price high or low) and filtered by one facet token: ${ITEM}, ${LIST} ${PRICES} Not available: store locator, in-store or pickup stock, stock levels for regular products, review paging, search suggestions, pages past the first, member prices, gift cards, Nike Factory store prices, Converse, checkout. ${ONE}.`,
				routing: request('/api/v1/nike/search'),
			},
		],
		default: 'product',
	},
];

export const nikeFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword or Style Color',
		name: 'nikeQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dunk low',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ $value }}' } } },
	},

	// -- Get Product, Get Reviews --
	{
		displayName: 'Style Color or Product URL',
		name: 'nikeProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'DD1503-103',
		displayOptions: show(['product', 'reviews']),
		routing: {
			request: {
				body: {
					style_color: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A Nike style color (style_color from a list: style code, dash, color code, e.g. DD1503-103) or a Nike product link (its storefront comes from the link)',
	},

	// -- Get Release --
	{
		displayName: 'Style Color, Thread Slug or Launch URL',
		name: 'nikeRelease',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'IX8180-001',
		displayOptions: show(['release']),
		routing: {
			request: {
				body: {
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
					style_color: `={{ !${IS_URL} && ${IS_STYLE} ? String($value).trim() : undefined }}`,
					slug: `={{ !${IS_URL} && !${IS_STYLE} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description: 'The style color of a launch-calendar product (e.g. IX8180-001), a launch thread slug (thread.slug, e.g. air-jordan-4-bred) or a Nike launch link (its storefront comes from the link).',
	},

	// -- Get Releases --
	{
		displayName: 'View',
		name: 'nikeReleasesView',
		type: 'options',
		default: 'upcoming',
		options: [
			{ name: 'Feed', value: 'feed' },
			{ name: 'In Stock', value: 'in_stock' },
			{ name: 'Upcoming', value: 'upcoming' },
		],
		displayOptions: show(['releases']),
		routing: { request: { body: { view: '={{ $value === "upcoming" ? undefined : $value }}' } } },
		description: "The launch calendar's tab (Upcoming is the default)",
	},

	// -- Get Category Products --
	{
		displayName: 'Path Token or Listing URL',
		name: 'nikeCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mens-shoes-nik1zy7ok',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					path: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A Nike listing path token (categories[].path from an earlier response, or the part after /w/ of a Nike listing link) or a Nike listing link (its storefront comes from the link)',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'nikeBrand',
		type: 'options',
		default: 'jordan',
		options: [
			{ name: 'ACG', value: 'acg' },
			{ name: 'Jordan Brand', value: 'jordan' },
			{ name: 'Nike SB', value: 'sb' },
		],
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
	},

	// -- Get Deals --
	{
		displayName: 'Gender',
		name: 'nikeDealsGender',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Boys', value: 'boys' },
			{ name: 'Girls', value: 'girls' },
			{ name: 'Men', value: 'men' },
			{ name: 'Unisex', value: 'unisex' },
			{ name: 'Women', value: 'women' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { gender: '={{ $value || undefined }}' } } },
	},

	// -- Country and Language --
	countryField('nikeCountry', MARKETS, MARKET_OPS, 'The Nike storefront. Prices come in its currency and differ between markets.'),
	countryField(
		'nikeLaunchCountry',
		LAUNCH_MARKETS,
		LAUNCH_OPS,
		"The Nike storefront (every one except Vietnam and China; Japan in Japanese only): Nike's launch calendar lists no launches there",
	),
	countryField('nikeReviewCountry', REVIEW_MARKETS, ['reviews'], 'The Nike storefront (every www.nike.com storefront; China has no reviews page)'),
	{
		displayName: 'Language',
		name: 'nikeLanguage',
		type: 'options',
		default: '',
		options: [
			{ name: 'Catalan', value: 'ca' },
			{ name: 'Chinese (Simplified)', value: 'zh-Hans' },
			{ name: 'Chinese (Traditional)', value: 'zh-Hant' },
			{ name: "Country's Default", value: '' },
			{ name: 'Czech', value: 'cs' },
			{ name: 'Danish', value: 'da' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Greek', value: 'el' },
			{ name: 'Hungarian', value: 'hu' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Korean', value: 'ko' },
			{ name: 'Norwegian', value: 'no' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Spanish', value: 'es' },
			{ name: 'Swedish', value: 'sv' },
			{ name: 'Thai', value: 'th' },
			{ name: 'Turkish', value: 'tr' },
		],
		displayOptions: show([...MARKET_OPS, ...LAUNCH_OPS, 'reviews']),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			"The storefront language where a country has several (default its primary language). Switzerland: German, English, French or Italian; Belgium: Dutch, German, English or French; Luxembourg: French, German or English; Canada: English or French; United States: English or Spanish; Japan: Japanese or English; Spain: Spanish or Catalan; Austria, Czechia, Denmark, Hungary, Netherlands, Norway, Portugal, Sweden: the local language or English. Another language answers 400.",
	},

	// -- Additional Options --
	listCollection('nikeSearchOptions', 'search', [sortOption, searchFilterOption]),
	listCollection('nikeCategoryOptions', 'category', [sortOption, filtersOption]),
	listCollection('nikeBrandOptions', 'brand', [sortOption, filtersOption]),
	listCollection('nikeDealsOptions', 'deals', [
		sortOption,
		filtersOption,
		{
			displayName: 'Category Path Token',
			name: 'nikeDealsCategory',
			type: 'string',
			default: '',
			placeholder: 'shoes-y7ok',
			description: 'Only this listing path token (categories[].path from an earlier Get Deals response)',
			routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
		},
	]),
];
