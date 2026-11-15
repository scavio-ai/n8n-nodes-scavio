import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['hm'], operation, ...extra },
});

// H&M, 9 operations: Get Product 2 credits, every other operation 1. 47 countries (Country) with
// their languages (Language): 40 with an H&M online store of their own plus Croatia, Cyprus,
// Estonia, Latvia, Lithuania, Luxembourg and Slovenia on H&M's shared English EUR store (the
// answer says store "eu"). Get Product is not served on Macau, Taiwan or the shared EU store
// countries; Find Stores is not served on Macau (H&M lists no stores there). Get Product can take
// up to about a minute, so every operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ARTICLE_OPS = ['product', 'production'];
const ALL_MARKET_OPS = ['search', 'stock', 'category', 'deals', 'newArrivals', 'suggestions', 'production'];
const LANGUAGE_OPS = ['search', 'product', 'stock', 'category', 'deals', 'newArrivals', 'suggestions'];

const PRICES =
	"Prices are numbers in the country's currency: price (what a non-member pays now), regular_price, sale_price, member_price (H&M's member price as shown to signed-in members), discount_percent and prior_price (the earlier price H&M shows next to an EU markdown). No price history: schedule a workflow to track changes.";
const CODES =
	'Article codes are global: the same 10-digit code in every country, so one code compares a price across countries with one call per country.';
const ITEM =
	'items with article_code, product_code, title, URL, the prices, currency, colors, sizes with online stock, in_stock, new_arrival, category (H&M\'s category ID) and image, plus count, total, page, total_pages, facets, on_sale_count and price_range';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';
const SPLIT = '={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}';

const MARKETS: Array<{ name: string; value: string }> = [
	{ name: 'Australia', value: 'au' },
	{ name: 'Austria', value: 'at' },
	{ name: 'Belgium', value: 'be' },
	{ name: 'Bulgaria', value: 'bg' },
	{ name: 'Canada', value: 'ca' },
	{ name: 'Croatia (Shared EU Store)', value: 'hr' },
	{ name: 'Cyprus (Shared EU Store)', value: 'cy' },
	{ name: 'Czechia', value: 'cz' },
	{ name: 'Denmark', value: 'dk' },
	{ name: 'Estonia (Shared EU Store)', value: 'ee' },
	{ name: 'Finland', value: 'fi' },
	{ name: 'France', value: 'fr' },
	{ name: 'Germany', value: 'de' },
	{ name: 'Greece', value: 'gr' },
	{ name: 'Hong Kong', value: 'hk' },
	{ name: 'Hungary', value: 'hu' },
	{ name: 'India', value: 'in' },
	{ name: 'Ireland', value: 'ie' },
	{ name: 'Israel', value: 'il' },
	{ name: 'Italy', value: 'it' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'Latvia (Shared EU Store)', value: 'lv' },
	{ name: 'Lithuania (Shared EU Store)', value: 'lt' },
	{ name: 'Luxembourg (Shared EU Store)', value: 'lu' },
	{ name: 'Macau', value: 'mo' },
	{ name: 'Malaysia', value: 'my' },
	{ name: 'Mexico', value: 'mx' },
	{ name: 'Netherlands', value: 'nl' },
	{ name: 'Norway', value: 'no' },
	{ name: 'Philippines', value: 'ph' },
	{ name: 'Poland', value: 'pl' },
	{ name: 'Portugal', value: 'pt' },
	{ name: 'Romania', value: 'ro' },
	{ name: 'Serbia', value: 'rs' },
	{ name: 'Singapore', value: 'sg' },
	{ name: 'Slovakia', value: 'sk' },
	{ name: 'Slovenia (Shared EU Store)', value: 'si' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'Spain', value: 'es' },
	{ name: 'Sweden', value: 'se' },
	{ name: 'Switzerland', value: 'ch' },
	{ name: 'Taiwan', value: 'tw' },
	{ name: 'Turkey', value: 'tr' },
	{ name: 'Ukraine', value: 'ua' },
	{ name: 'United Kingdom', value: 'gb' },
	{ name: 'United States', value: 'us' },
	{ name: 'Vietnam', value: 'vn' },
];
// Get Product: no product pages on Macau, Taiwan or the shared EU store.
const NO_PRODUCT = ['mo', 'tw', 'hr', 'cy', 'ee', 'lv', 'lt', 'lu', 'si'];
const PRODUCT_MARKETS = MARKETS.filter((m) => !NO_PRODUCT.includes(m.value));
// Find Stores: H&M lists no stores in Macau.
const STORE_MARKETS = MARKETS.filter((m) => m.value !== 'mo');

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

const facetOption = (displayName: string, name: string, placeholder: string, description: string) => ({
	displayName,
	name,
	type: 'string' as const,
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [name]: SPLIT } } },
});
const gridOptions = [
	facetOption(
		'Color',
		'color',
		'black_000000',
		'Values of the color facet of an earlier response in the same country, comma-separated (several are ORed)',
	),
	facetOption('Fit', 'fit', 'Slim fit', 'Values of the fit facet, comma-separated'),
	facetOption('Material', 'material', 'Cotton', "Values of the material facet (in the country's language), comma-separated"),
	{
		displayName: 'Page',
		name: 'page',
		type: 'number' as const,
		default: 1,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: 'Results page, 1-based',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'page_size',
		type: 'number' as const,
		default: 36,
		typeOptions: { minValue: 1, maxValue: 72 },
		description: 'Items per page, 1 to 72',
		routing: { request: { body: { page_size: '={{ $value === 36 ? undefined : $value }}' } } },
	},
	facetOption('Product Type', 'product_type', 'Jeans', 'Values of the product_type facet, comma-separated'),
	facetOption('Size', 'size', 'womenswear;NO_FORMAT[Numeric];8', 'Values of the size facet, comma-separated'),
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options' as const,
		default: 'relevance',
		options: [
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: 'Result order',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];
const onSaleOption = {
	displayName: 'On Sale Only',
	name: 'on_sale',
	type: 'boolean' as const,
	default: false,
	description: 'Whether to return only marked-down items',
	routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
};
const DEPARTMENTS = [
	{ name: 'Baby', value: 'baby' },
	{ name: 'Home', value: 'home' },
	{ name: 'Kids', value: 'kids' },
	{ name: 'Men', value: 'men' },
	{ name: 'Women', value: 'women' },
];

export const hmOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['hm'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find H&M stores',
				description: `H&M stores of a country: store_code, name, status, store_class, address, city, postal_code, lat, lng, phone, opening_hours, opening_hour_exceptions and departments; filtered by city, postal code or a radius around a point. Pass a store_code to Search Products as Store. Every country except Macau. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/stores'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get H&M category products',
				description: `One category grid by H&M's category ID (the same IDs in every country, e.g. ladies_dresses, men_jeans): ${ITEM}. A category returns everything H&M files under that ID, which can be more than the site's curated page. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get H&M deals',
				description: `A department's sale grid (default women): every marked-down item with sale_price, regular_price and discount_percent. Returns ${ITEM}. H&M runs sales in seasons, so the grid may be empty between sales. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/deals'),
			},
			{
				name: 'Get New Arrivals',
				value: 'newArrivals',
				action: 'Get H&M new arrivals',
				description: `A department's new-arrivals grid (default women). Returns ${ITEM}. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/new-arrivals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an H&M product',
				description: `One article by article code or link: description, composition, materials, care, fit attributes, the prices with price_disclosure, every colourway with its own prices, sizes with online stock and few_left, rating and the latest reviews H&M shows (up to 10, with fit feedback; no full review list). Not served on Macau, Taiwan or the shared EU store. Can take up to about a minute. ${PRICES} ${CODES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/hm/product'),
			},
			{
				name: 'Get Production Info',
				value: 'production',
				action: 'Get H&M production info',
				description: `Where an article is made, as H&M publishes it: production_countries and countries (suppliers and factories with name, city and workers range; no street addresses). The same in every country. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/production'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get H&M search suggestions',
				description: `Search suggestions for what a shopper has typed, in the country's language: suggestions (text, type query or content, URL for content pages). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/suggestions'),
			},
			{
				name: 'Get Stock',
				value: 'stock',
				action: 'Get H&M online stock',
				description: `Online stock per size for every colour of a product, by article or product code: colors (article_code, name, sizes with in_stock and few_left), sizes_total and sizes_in_stock. Online stock, not store stock (H&M publishes no per-size store stock). ${CODES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search H&M products',
				description: `Search one country's catalog by keyword or article code: ${ITEM}, plus departments and did_you_mean; sorted and filtered by department, store assortment, colour, size, material, fit, product type and on sale. ${PRICES} ${CODES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hm/search'),
			},
		],
		default: 'search',
	},
];

export const hmFields: INodeProperties[] = [
	// -- Market --
	countryField(
		MARKETS,
		ALL_MARKET_OPS,
		"The H&M country. Prices come in its currency. Croatia, Cyprus, Estonia, Latvia, Lithuania, Luxembourg and Slovenia read H&M's shared English EUR store. Countries where H&M runs a separate site or has no online store are not served.",
	),
	countryField(
		PRODUCT_MARKETS,
		['product'],
		'The H&M country. Prices come in its currency. Macau, Taiwan and the shared EU store countries have no product pages: use Search Products or Get Stock there.',
	),
	countryField(STORE_MARKETS, ['stores'], 'The H&M country (every country except Macau)'),
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Bulgarian', value: 'bg' },
			{ name: 'Chinese', value: 'zh' },
			{ name: 'Czech', value: 'cs' },
			{ name: 'Danish', value: 'da' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'Finnish', value: 'fi' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Greek', value: 'el' },
			{ name: 'Hebrew', value: 'he' },
			{ name: 'Hungarian', value: 'hu' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Korean', value: 'ko' },
			{ name: "Market's Default", value: '' },
			{ name: 'Norwegian', value: 'no' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Romanian', value: 'ro' },
			{ name: 'Serbian', value: 'sr' },
			{ name: 'Slovak', value: 'sk' },
			{ name: 'Spanish', value: 'es' },
			{ name: 'Swedish', value: 'sv' },
			{ name: 'Turkish', value: 'tr' },
			{ name: 'Ukrainian', value: 'uk' },
			{ name: 'Vietnamese', value: 'vi' },
		],
		displayOptions: show(LANGUAGE_OPS),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			"Language of the country (default its first). Canada: English or French; Switzerland: German, French or Italian; Belgium: Dutch or French; Finland: Finnish or Swedish; Hong Kong, Macau, Taiwan: Chinese or English; every other country its own language (English in the UK, Ireland, US, India, Malaysia, the Philippines, Singapore, Australia and on the shared EU store). Another language answers 400.",
	},

	// -- Search Products, Get Search Suggestions --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'jeans',
		displayOptions: show(['search', 'suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords in any language, or an article code (Search Products)',
	},

	// -- Article reference: Get Product, Get Production Info --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'articleCode',
		options: [
			{ name: 'Article Code', value: 'articleCode' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(ARTICLE_OPS),
		description: 'How to identify the article',
	},
	{
		displayName: 'Article Code',
		name: 'articleCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1310382004',
		displayOptions: show(ARTICLE_OPS, { productBy: ['articleCode'] }),
		routing: { request: { body: { article_code: '={{ $value }}' } } },
		description: 'An H&M article code: 10 digits (7-digit product code + 3-digit colour). The same code in every country.',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www2.hm.com/en_us/productpage.1310382004.html',
		displayOptions: show(ARTICLE_OPS, { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: "An hm.com product link; its country is used unless Country is set to another",
	},

	// -- Get Stock --
	{
		displayName: 'Stock By',
		name: 'stockBy',
		type: 'options',
		default: 'articleCode',
		options: [
			{ name: 'Article Code', value: 'articleCode' },
			{ name: 'Product Code', value: 'productCode' },
		],
		displayOptions: show(['stock']),
		description: 'How to identify the product (either returns every colour)',
	},
	{
		displayName: 'Article Code',
		name: 'stockArticleCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1310382004',
		displayOptions: show(['stock'], { stockBy: ['articleCode'] }),
		routing: { request: { body: { article_code: '={{ $value }}' } } },
		description: 'An H&M article code: 10 digits',
	},
	{
		displayName: 'Product Code',
		name: 'productCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1310382',
		displayOptions: show(['stock'], { stockBy: ['productCode'] }),
		routing: { request: { body: { product_code: '={{ $value }}' } } },
		description: 'An H&M product code: 7 digits (the first 7 of an article code)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ladies_dresses',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			"H&M's category ID, the same in every country (items[].category of any response), e.g. ladies_dresses, ladies_tops, men_jeans, kids_all",
	},

	// -- Get Deals, Get New Arrivals --
	{
		displayName: 'Department',
		name: 'department',
		type: 'options',
		default: 'women',
		options: DEPARTMENTS,
		displayOptions: show(['deals', 'newArrivals']),
		routing: { request: { body: { department: '={{ $value === "women" ? undefined : $value }}' } } },
		description: 'Which department',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Department',
				name: 'department',
				type: 'options',
				default: '',
				options: [{ name: 'All', value: '' }, ...DEPARTMENTS],
				description: 'Only one department',
				routing: { request: { body: { department: '={{ $value || undefined }}' } } },
			},
			onSaleOption,
			{
				displayName: 'Store Code',
				name: 'store',
				type: 'string',
				default: '',
				placeholder: 'US0760',
				description: "Only items in that store's assortment (store_code from Find Stores)",
				routing: { request: { body: { store: '={{ $value || undefined }}' } } },
			},
			...gridOptions,
		],
	},

	// -- Additional Options: Get Category Products, Get New Arrivals --
	{
		displayName: 'Additional Options',
		name: 'gridOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category', 'newArrivals']),
		options: [onSaleOption, ...gridOptions],
	},

	// -- Additional Options: Get Deals --
	{
		displayName: 'Additional Options',
		name: 'dealOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions,
	},

	// -- Additional Options: Find Stores --
	{
		displayName: 'Additional Options',
		name: 'storeOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				placeholder: 'New York',
				description: 'Only stores whose city or address contains this (case and accents ignored)',
				routing: { request: { body: { city: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Latitude',
				name: 'lat',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
				description: 'Stores within the radius of this point, nearest first (set with Longitude)',
				routing: { request: { body: { lat: '={{ $value }}' } } },
			},
			{
				displayName: 'Longitude',
				name: 'lng',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
				description: 'Longitude (set with Latitude)',
				routing: { request: { body: { lng: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Stores per page, 1 to 100',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Postal Code',
				name: 'postal_code',
				type: 'string',
				default: '',
				description: 'Only stores whose postal code starts with this',
				routing: { request: { body: { postal_code: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Radius (Km)',
				name: 'radius_km',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 0.1, maxValue: 1000 },
				description: 'Radius around Latitude / Longitude in km',
				routing: { request: { body: { radius_km: '={{ $value === 25 ? undefined : $value }}' } } },
			},
		],
	},
];
