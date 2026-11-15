import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['nintendo'], operation, ...extra },
});

// Nintendo eShop, 6 operations, 1 credit each. 46 countries (Country) with their languages
// (Language). Search Games, Get Product, Get Deals, Get Releases and Get DLC serve the 42 catalog
// markets: the Americas (US, Canada en / fr, Mexico, Brazil, Argentina, Chile, Colombia, Peru),
// Europe in the market's language (UK, Ireland, Germany, Austria, Switzerland de / fr / it,
// France, Belgium fr / nl, Netherlands, Luxembourg, Italy, Spain, Portugal, Australia, New Zealand,
// South Africa), the European countries without a Nintendo site of their own (the English
// European catalog with that country's own prices) and Japan. Get Prices also serves South Korea,
// Hong Kong, Taiwan and Israel. Americas searches take about 8 to 13 seconds and some operations
// make several upstream requests, so every operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const CATALOG_OPS = ['search', 'product', 'deals', 'releases', 'dlc'];
const PRODUCT_REF_OPS = ['product', 'dlc'];
const ALL_OPS = [...CATALOG_OPS, 'prices'];

const PRICES =
	"Prices are numbers in the country's currency, always that country's eShop price: price, regular_price, sale_price, discount_percent, sale_start and sale_end (the eShop's own sale window), is_free and sales_status. Nintendo shows no price history or historical low: schedule Get Prices to build one.";
const IDS =
	'Item IDs (nsuid) are per eShop region: Americas, Europe (EU / EFTA, UK, Australia, New Zealand, South Africa, Israel), Japan, Korea, and Hong Kong + Taiwan. An ID from one region is not_found in another and there is no cross-region title mapping: look the game up in that region, then call Get Prices for any country of the region.';
const ITEM =
	'items with nsuid, slug (Americas), URL, title, platform (switch / switch_2), release_date, publisher, price, regular_price, sale_price, discount_percent, sale_start, sale_end, currency, sales_status, image, type and age_rating';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const CATALOG_MARKETS: Array<{ name: string; value: string }> = [
	{ name: 'Argentina', value: 'ar' },
	{ name: 'Australia', value: 'au' },
	{ name: 'Austria', value: 'at' },
	{ name: 'Belgium', value: 'be' },
	{ name: 'Brazil', value: 'br' },
	{ name: 'Bulgaria', value: 'bg' },
	{ name: 'Canada', value: 'ca' },
	{ name: 'Chile', value: 'cl' },
	{ name: 'Colombia', value: 'co' },
	{ name: 'Croatia', value: 'hr' },
	{ name: 'Cyprus', value: 'cy' },
	{ name: 'Czechia', value: 'cz' },
	{ name: 'Denmark', value: 'dk' },
	{ name: 'Estonia', value: 'ee' },
	{ name: 'Finland', value: 'fi' },
	{ name: 'France', value: 'fr' },
	{ name: 'Germany', value: 'de' },
	{ name: 'Greece', value: 'gr' },
	{ name: 'Hungary', value: 'hu' },
	{ name: 'Ireland', value: 'ie' },
	{ name: 'Italy', value: 'it' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'Latvia', value: 'lv' },
	{ name: 'Lithuania', value: 'lt' },
	{ name: 'Luxembourg', value: 'lu' },
	{ name: 'Malta', value: 'mt' },
	{ name: 'Mexico', value: 'mx' },
	{ name: 'Netherlands', value: 'nl' },
	{ name: 'New Zealand', value: 'nz' },
	{ name: 'Norway', value: 'no' },
	{ name: 'Peru', value: 'pe' },
	{ name: 'Poland', value: 'pl' },
	{ name: 'Portugal', value: 'pt' },
	{ name: 'Romania', value: 'ro' },
	{ name: 'Slovakia', value: 'sk' },
	{ name: 'Slovenia', value: 'si' },
	{ name: 'South Africa', value: 'za' },
	{ name: 'Spain', value: 'es' },
	{ name: 'Sweden', value: 'se' },
	{ name: 'Switzerland', value: 'ch' },
	{ name: 'United Kingdom', value: 'gb' },
	{ name: 'United States', value: 'us' },
];
// Get Prices also answers these four (no searchable catalog of their own).
const PRICE_MARKETS = [
	...CATALOG_MARKETS,
	{ name: 'Hong Kong', value: 'hk' },
	{ name: 'Israel', value: 'il' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'Taiwan', value: 'tw' },
].sort((a, b) => a.name.localeCompare(b.name));

const countryField = (
	markets: Array<{ name: string; value: string }>,
	operations: string[],
	description: string,
): INodeProperties => ({
	displayName: 'Country',
	name: 'country',
	type: 'options',
	default: 'us',
	options: markets,
	displayOptions: show(operations),
	routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
	description,
});

const platformOption = {
	displayName: 'Platform',
	name: 'platform',
	type: 'options' as const,
	default: '',
	options: [
		{ name: 'Both', value: '' },
		{ name: 'Nintendo Switch', value: 'switch' },
		{ name: 'Nintendo Switch 2', value: 'switch_2' },
	],
	description: 'Only games for one platform',
	routing: { request: { body: { platform: '={{ $value || undefined }}' } } },
};
const pageOption = {
	displayName: 'Page',
	name: 'page',
	type: 'number' as const,
	default: 1,
	typeOptions: { minValue: 1, maxValue: 400 },
	description: 'Results page, 1-based',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};
const pageSizeOption = {
	displayName: 'Page Size',
	name: 'page_size',
	type: 'number' as const,
	default: 24,
	typeOptions: { minValue: 1, maxValue: 50 },
	description: 'Items per page, 1 to 50 (Europe and Japan; the Americas pages are fixed)',
	routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
};

export const nintendoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nintendo'] } },
		options: [
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get nintendo deals',
				description: `Games on sale now in one country. Europe and Japan: every discounted game in the catalog with the sale price, discount and sale_end. Americas: Nintendo's featured sale pages, not every discounted game (check any ID with Get Prices), with each item's sale page and the list of sale pages (sales). Returns ${ITEM}, plus count, total, page and total_pages. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/nintendo/deals'),
			},
			{
				name: 'Get DLC',
				value: 'dlc',
				action: 'Get nintendo DLC',
				description: `A game's DLC, bundles and upgrade packs by the game's item ID, link or (Americas) slug: game (nsuid, title, URL) and dlc (nsuid, title, URL, type dlc / bundle / upgrade, release_date, prices, sale_start, sale_end, sales_status, image). ${PRICES} ${IDS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/nintendo/dlc'),
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get nintendo eshop prices',
				description: `The eShop price of 1 to 50 item IDs in one country: prices (nsuid, sales_status, price, regular_price, sale_price, discount_percent, sale_start, sale_end, currency, is_free) and not_found. Every country including South Korea, Hong Kong, Taiwan and Israel. Use it to compare one game's price, sale price and sale end date across the countries of its eShop region. ${IDS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/nintendo/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a nintendo product',
				description: `One eShop or My Nintendo Store product by item ID, link or (Americas) slug, as product: nsuid, title, URL, platform, type, release_date, publisher, developer, genres, players, languages, file size, age_rating (system, rating, descriptors), description, prices with the sale window, has_demo, nintendo_switch_online and images; on the Americas store also editions, play modes, the game's DLC with prices and the stock signal for hardware, amiibo and merchandise. No user reviews (age ratings only). ${PRICES} ${IDS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/nintendo/product'),
			},
			{
				name: 'Get Releases',
				value: 'releases',
				action: 'Get nintendo releases',
				description: `New releases (newest first) or upcoming games (soonest first) in one country. Returns ${ITEM}. Europe and Japan are paged; the Americas lists are one page, and titles announced for a year or month only carry release_date null and release_date_text. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/nintendo/releases'),
			},
			{
				name: 'Search Games',
				value: 'search',
				action: 'Search nintendo eshop games',
				description: `Search one country's eShop catalog by keyword. Europe and Japan: ${ITEM}, with total and total_pages, sorted and filtered (platform, on sale, publisher, type; Europe also price range, genre, players, demo). Americas: 40 tiles per page sorted by relevance or newest only, no filters; tiles carry a slug and no nsuid (read Get Product with the slug). An unsupported sort or filter answers 400. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/nintendo/search'),
			},
		],
		default: 'search',
	},
];

export const nintendoFields: INodeProperties[] = [
	// -- Market --
	countryField(
		CATALOG_MARKETS,
		CATALOG_OPS,
		'The eShop country. Prices come in its currency. South Korea, Hong Kong, Taiwan and Israel answer Get Prices only. The Philippines, Russia and countries with no eShop data are not served.',
	),
	countryField(
		PRICE_MARKETS,
		['prices'],
		'The eShop country, including South Korea, Hong Kong, Taiwan and Israel (European item IDs). Prices come in its currency.',
	),
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Chinese', value: 'zh' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Korean', value: 'ko' },
			{ name: "Market's Default", value: '' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Spanish', value: 'es' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			'Language of the market (default its first). Canada: English or French; Switzerland: German, French or Italian; Belgium: French or Dutch; Mexico, Argentina, Chile, Colombia, Peru, Spain: Spanish; Brazil, Portugal: Portuguese; Germany, Austria: German; France, Luxembourg: French; Netherlands: Dutch; Italy: Italian; Japan: Japanese; South Korea: Korean; Hong Kong, Taiwan: Chinese; the other countries: English. Another language answers 400.',
	},

	// -- Search Games --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mario',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords (Japanese titles in Japan)',
	},

	// -- Product reference: Get Product, Get DLC --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'nsuid',
		options: [
			{ name: 'Item ID (Nsuid)', value: 'nsuid' },
			{ name: 'Product URL', value: 'url' },
			{ name: 'Store Slug (Americas)', value: 'slug' },
		],
		displayOptions: show(PRODUCT_REF_OPS),
		description:
			'Read the product by its eShop item ID, its nintendo.com link or its Americas store slug',
	},
	{
		displayName: 'Item ID',
		name: 'nsuid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '70010000095431',
		displayOptions: show(PRODUCT_REF_OPS, { productBy: ['nsuid'] }),
		routing: { request: { body: { nsuid: '={{ $value }}' } } },
		description:
			'An eShop item ID (14 digits starting 70; items[].nsuid). IDs are per eShop region: an Americas ID is not found in Europe.',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(PRODUCT_REF_OPS, { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'A nintendo.com product link: an Americas store page, a European game page (ending in the game ID and .html) or a nintendo.com/au game page',
	},
	{
		displayName: 'Store Slug',
		name: 'slug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mario-kart-world-switch-2',
		displayOptions: show(PRODUCT_REF_OPS, { productBy: ['slug'] }),
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description: 'Americas countries only: the store slug (items[].slug of an Americas search)',
	},

	// -- Get Prices --
	{
		displayName: 'Item IDs',
		name: 'ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '70010000095431,70010000063714',
		displayOptions: show(['prices']),
		routing: { request: { body: { ids: SPLIT } } },
		description: '1 to 50 eShop item IDs of one region, comma-separated',
	},

	// -- Get Releases --
	{
		displayName: 'Release Type',
		name: 'releaseType',
		type: 'options',
		default: 'new',
		options: [
			{ name: 'New Releases', value: 'new' },
			{ name: 'Upcoming', value: 'upcoming' },
		],
		displayOptions: show(['releases']),
		routing: { request: { body: { type: '={{ $value === "new" ? undefined : $value }}' } } },
		description: 'Released games (newest first) or future release dates (soonest first)',
	},

	// -- Additional Options: Search Games --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Genre (Europe)',
				name: 'genre',
				type: 'string',
				default: '',
				placeholder: 'RPG',
				description: 'A genre as the catalog names it, in the request language',
				routing: { request: { body: { genre: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Has Demo Only (Europe)',
				name: 'has_demo',
				type: 'boolean',
				default: false,
				description: 'Whether to return only games with a free demo',
				routing: { request: { body: { has_demo: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Maximum Price (Europe)',
				name: 'price_max',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description:
					"Highest price (where the catalog is priced in the country's currency: United Kingdom and the EUR countries with a catalog of their own)",
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Players (Europe)',
				name: 'players',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 99 },
				description: 'At least this many players (0 = any)',
				routing: { request: { body: { players: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Price (Europe)',
				name: 'price_min',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Lowest price (as Maximum Price)',
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'On Sale Only (Europe and Japan)',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description: 'Whether to return only discounted games',
				routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
			},
			pageOption,
			pageSizeOption,
			{ ...platformOption, displayName: 'Platform (Europe and Japan)' },
			{
				displayName: 'Publisher (Europe and Japan)',
				name: 'publisher',
				type: 'string',
				default: '',
				description: 'Exact publisher name (in Japanese in Japan)',
				routing: { request: { body: { publisher: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Discount (Europe)', value: 'discount' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low (Europe and Japan)', value: 'price_desc' },
					{ name: 'Price: Low to High (Europe and Japan)', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Title (Europe)', value: 'title' },
				],
				description: 'Result order (the Americas: relevance or newest only)',
				routing: {
					request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Type (Europe and Japan)',
				name: 'type',
				type: 'options',
				default: 'game',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Bundles (Japan)', value: 'bundle' },
					{ name: 'DLC', value: 'dlc' },
					{ name: 'Games', value: 'game' },
				],
				description: 'What to list',
				routing: { request: { body: { type: '={{ $value === "game" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Deals --
	{
		displayName: 'Additional Options',
		name: 'dealOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			pageOption,
			pageSizeOption,
			platformOption,
			{
				displayName: 'Sale Page (Americas)',
				name: 'sale',
				type: 'string',
				default: '',
				placeholder: 'square-enix',
				description: 'One sale page, by its slug from sales[].sale of a previous response',
				routing: { request: { body: { sale: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: '',
				options: [
					{ name: 'Default (Per Region)', value: '' },
					{ name: 'Discount (Americas and Europe)', value: 'discount' },
					{ name: 'Ending Soon (Americas)', value: 'ending_soon' },
					{ name: 'Featured (Americas)', value: 'featured' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description:
					"Result order. Default: featured (Nintendo's order) in the Americas, discount in Europe, newest in Japan.",
				routing: { request: { body: { sort: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Releases --
	{
		displayName: 'Additional Options',
		name: 'releaseOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['releases']),
		options: [
			{
				...pageOption,
				description: 'Results page, 1-based (Europe and Japan; the Americas lists are one page)',
			},
			pageSizeOption,
			platformOption,
		],
	},
];
