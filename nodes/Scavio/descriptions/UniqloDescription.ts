import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['uniqlo'], operation, ...extra },
});

// Uniqlo, 12 operations, 1 credit per call; Get Store Stock 2 when resolved from a product ID +
// colour + size (1 by variant ID); Get Prices by Country 1 per country that answered (a country
// that does not sell the product answers too; failed countries are free). The United States,
// Japan and South Korea serve every operation; Taiwan, Hong Kong and China (Uniqlo's Greater
// China sites, own product codes) Search Products and Get Product; 35 more storefronts Get
// Product and Get Prices by Country. Calls can queue and retry on the server, so every
// operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FULL_OPS = [
	'stock',
	'storeStock',
	'stores',
	'reviews',
	'suggestions',
	'category',
	'deals',
	'newArrivals',
	'categories',
];

const PRICES =
	"Prices are numbers in the country's own currency, never converted: price is Uniqlo's regular price, promo_price its promotional price. In the United States, Japan, South Korea and Canada (and on some items Singapore, Malaysia and India) Uniqlo marks a drop with flags only (on_sale, limited_offer, price_flags), so promo_price equals price; in Europe, Australia and most of Southeast Asia promo_price is below price. Only a limited-time offer has a window: quote Uniqlo's own label in price_flags.name (e.g. \"until 11/18\"), not a date read from end; a sale flag carries a start but no end, and Select Colors/Sizes Only carries no dates. No price history: schedule a workflow to track changes.";
const PRICE_GROUPS =
	"Price group: Get Product and Get Prices by Country default to 00, Uniqlo's regular price list. Search can list the same product_id a second time in price group 01, mostly Uniqlo's Select Colors/Sizes Only sale price for some colours / sizes; set Price Group 01 on Get Product to read that price and the colours / sizes it covers. Get Prices by Country compares group 00 unless Price Group is set.";
const GU =
	"GU is a separate brand and not a separate platform here; Uniqlo's own listings can include GU collaboration items (Korea's limited offers did).";
const IDS =
	'Product IDs (E479000-000) are global on uniqlo.com: the same ID opens the product in every country that sells it. Taiwan, Hong Kong and China use their own codes.';
const ITEM =
	'items with product_id, price_group, title, URL, gender, price, promo_price, currency, discount_percent, on_sale, limited_offer, price_flags, colors, sizes, lengths, rating, review_count and image, plus total, page, has_more and facets';
const FULL =
	'United States, Japan and South Korea only; other countries answer 400 before anything is charged.';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const FULL_MARKETS = [
	{ name: 'Japan', value: 'jp' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'United States', value: 'us' },
];
const SEARCH_MARKETS = [
	{ name: 'China', value: 'cn' },
	{ name: 'Hong Kong', value: 'hk' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'Taiwan', value: 'tw' },
	{ name: 'United States', value: 'us' },
];
// The 38 uniqlo.com markets (Get Prices by Country); Get Product adds Taiwan, Hong Kong, China.
const PRICES_MARKETS = [
	{ name: 'Australia', value: 'au' },
	{ name: 'Austria (EU Store)', value: 'at' },
	{ name: 'Belgium', value: 'be' },
	{ name: 'Bulgaria (EU Store)', value: 'bg' },
	{ name: 'Canada', value: 'ca' },
	{ name: 'Croatia (EU Store)', value: 'hr' },
	{ name: 'Czechia (EU Store)', value: 'cz' },
	{ name: 'Denmark', value: 'dk' },
	{ name: 'Estonia (EU Store)', value: 'ee' },
	{ name: 'Finland (EU Store)', value: 'fi' },
	{ name: 'France', value: 'fr' },
	{ name: 'Germany', value: 'de' },
	{ name: 'Greece (EU Store)', value: 'gr' },
	{ name: 'Hungary (EU Store)', value: 'hu' },
	{ name: 'India', value: 'in' },
	{ name: 'Indonesia', value: 'id' },
	{ name: 'Ireland (EU Store)', value: 'ie' },
	{ name: 'Italy', value: 'it' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'Latvia (EU Store)', value: 'lv' },
	{ name: 'Lithuania (EU Store)', value: 'lt' },
	{ name: 'Luxembourg (EU Store)', value: 'lu' },
	{ name: 'Malaysia', value: 'my' },
	{ name: 'Netherlands', value: 'nl' },
	{ name: 'Philippines', value: 'ph' },
	{ name: 'Poland (EU Store)', value: 'pl' },
	{ name: 'Portugal (EU Store)', value: 'pt' },
	{ name: 'Romania (EU Store)', value: 'ro' },
	{ name: 'Singapore', value: 'sg' },
	{ name: 'Slovakia (EU Store)', value: 'sk' },
	{ name: 'Slovenia (EU Store)', value: 'si' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'Spain', value: 'es' },
	{ name: 'Sweden', value: 'se' },
	{ name: 'Thailand', value: 'th' },
	{ name: 'United Kingdom', value: 'gb' },
	{ name: 'United States', value: 'us' },
	{ name: 'Vietnam', value: 'vn' },
];
const PRODUCT_MARKETS = [
	...PRICES_MARKETS,
	{ name: 'China', value: 'cn' },
	{ name: 'Hong Kong', value: 'hk' },
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

const latField = (operations: string[], extra: Record<string, string[]> = {}): INodeProperties => ({
	displayName: 'Latitude',
	name: 'lat',
	type: 'number',
	required: true,
	default: 40.758,
	typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
	displayOptions: show(operations, extra),
	routing: { request: { body: { lat: '={{ $value }}' } } },
	description:
		'Latitude of a point in the country, e.g. 40.758 New York, 35.6595 Tokyo, 37.5636 Seoul',
});
const lngField = (operations: string[], extra: Record<string, string[]> = {}): INodeProperties => ({
	displayName: 'Longitude',
	name: 'lng',
	type: 'number',
	required: true,
	default: -73.9855,
	typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
	displayOptions: show(operations, extra),
	routing: { request: { body: { lng: '={{ $value }}' } } },
	description: 'Longitude, e.g. -73.9855 New York, 139.7005 Tokyo, 126.9826 Seoul',
});

const productIdField = (
	operations: string[],
	extra: Record<string, string[]> = {},
	description = 'A Uniqlo product ID (items[].product_id), e.g. E479000-000. The same on uniqlo.com in every country.',
): INodeProperties => ({
	displayName: 'Product ID',
	name: 'productId',
	type: 'string',
	required: true,
	default: '',
	placeholder: 'E479000-000',
	displayOptions: show(operations, extra),
	routing: { request: { body: { product_id: '={{ $value }}' } } },
	description,
});

const textOption = (
	displayName: string,
	name: string,
	placeholder: string,
	description: string,
) => ({
	displayName,
	name,
	type: 'string' as const,
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [name]: '={{ $value || undefined }}' } } },
});
const priceGroupOption = textOption(
	'Price Group',
	'price_group',
	'00',
	'Price group (items[].price_group, default 00 = Uniqlo\'s regular price list; 01 is mostly the Select Colors/Sizes Only sale price search lists for some colours / sizes)',
);
const storeStockPriceGroupOption = textOption(
	'Price Group',
	'price_group',
	'00',
	'Price group the variant came from (items[].price_group or the product\'s price_group, default 00), with a variant ID or with product ID + colour + size. A variant of price group 01 asked as 00 reads out of stock in every store.',
);
const GENDERS = [
	{ name: 'All', value: '' },
	{ name: 'Baby', value: 'baby' },
	{ name: 'Kids', value: 'kids' },
	{ name: 'Men', value: 'men' },
	{ name: 'Women', value: 'women' },
];
const genderOption = {
	displayName: 'Gender',
	name: 'gender',
	type: 'options' as const,
	default: '',
	options: GENDERS,
	description: 'Only one gender',
	routing: { request: { body: { gender: '={{ $value || undefined }}' } } },
};
const FLAGS = [
	{ name: 'Any', value: '' },
	{ name: 'Coming Soon', value: 'coming_soon' },
	{ name: 'Limited-Time Offer', value: 'limited_offer' },
	{ name: 'New', value: 'new' },
	{ name: 'New Color', value: 'new_color' },
	{ name: 'Online Only (Japan)', value: 'online_only' },
	{ name: 'Sale', value: 'sale' },
];
const flagOption = {
	displayName: 'Flag',
	name: 'flag',
	type: 'options' as const,
	default: '',
	options: FLAGS,
	description: 'Only items Uniqlo flags this way (Online Only is offered in Japan only)',
	routing: { request: { body: { flag: '={{ $value || undefined }}' } } },
};
const SORTS = [
	{ name: 'Featured', value: 'featured' },
	{ name: 'Newest', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_desc' },
	{ name: 'Price: Low to High', value: 'price_asc' },
	{ name: 'Top Rated', value: 'top_rated' },
];
const sortOption = (options: Array<{ name: string; value: string }>, description: string) => ({
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'featured',
	options,
	description,
	routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
});
const pageOption = {
	displayName: 'Page',
	name: 'page',
	type: 'number' as const,
	default: 1,
	typeOptions: { minValue: 1, maxValue: 500 },
	description: 'Results page, 1-based',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};
const pageSizeOption = {
	displayName: 'Page Size',
	name: 'page_size',
	type: 'number' as const,
	default: 24,
	typeOptions: { minValue: 1, maxValue: 100 },
	description:
		'Items per page, 1 to 100 (48 at most on Taiwan, Hong Kong and China). Uniqlo answers up to offset 500.',
	routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
};
const listPaging = [
	pageOption,
	pageSizeOption,
	sortOption(SORTS, "Result order (Featured is Uniqlo's own order)"),
];
const limitOption = {
	displayName: 'Limit',
	name: 'limit',
	type: 'number' as const,
	default: 10,
	typeOptions: { minValue: 1, maxValue: 10 },
	description: 'Max number of results to return',
	routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
};

export const uniqloOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['uniqlo'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find uniqlo stores',
				description: `Uniqlo stores nearest a point, or one store by ID: store_id, address, lat, lng, distance_km, phone, opening_hours (Monday to Sunday), store_type, click_and_collect, sections and services, plus total (every store of the country). ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get uniqlo categories',
				description: `The category tree of a country in its language: each node's ID, name, level (gender, class, category, subcategory), parent and path (the IDs to pass as Category Path). IDs are per country. ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get uniqlo category products',
				description: `Every product of one category path (IDs from Get Categories), paged and sorted: ${ITEM}. ${PRICES} ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get uniqlo deals',
				description: `Uniqlo's sale or limited-time-offer list of a country, optionally for one gender: ${ITEM}, with limited_offer (name: Uniqlo's own label, start and end its window) where Uniqlo shows them. ${GU} ${PRICES} ${PRICE_GROUPS} ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/deals'),
			},
			{
				name: 'Get New Arrivals',
				value: 'newArrivals',
				action: 'Get uniqlo new arrivals',
				description: `Items Uniqlo flags New in a country, optionally for one gender: ${ITEM}. ${PRICES} ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/new-arrivals'),
			},
			{
				name: 'Get Prices by Country',
				value: 'prices',
				action: 'Get uniqlo prices by country',
				description: `One uniqlo.com product across up to 10 countries in one call: per country the currency, available, title, price, promo_price, discount_percent, on_sale, limited_offer, price_flags, lowest_price_30d (Europe), tax and URL, plus not_sold (countries that do not sell it). Each price is in that country's own currency, never converted. Taiwan, Hong Kong and China use their own product codes and are not offered. ${PRICES} ${PRICE_GROUPS} ${IDS} Costs 1 credit per country that answered; failed countries are not charged.`,
				routing: request('/api/v1/uniqlo/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a uniqlo product',
				description: `One product by ID or link in 41 countries: description, composition, care, countries_of_origin, category, price, promo_price, on_sale, limited_offer, price_flags, lowest_price_30d (Europe), tax, colors, sizes, lengths, rating with fit and images; variants with variant IDs (l2_id) in the United States, Japan and South Korea. A product a country does not sell is a charged 404. Ratings are per region (Europe shares one pool). Not available: price history, store-level prices. ${GU} ${PRICES} ${PRICE_GROUPS} ${IDS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get uniqlo reviews',
				description: `Reviews of a product: rating (average, count, fit, distribution) and reviews with rating, title, text, date, fit (1 tight to 5 loose, null when not given), purchased size and colour, and height, weight and age ranges. No reviewer names or locations. Totals are pooled per region. ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get uniqlo search suggestions',
				description: `Search suggestions, categories and feature pages for what a shopper has typed, in the country's language; with no keyword, Uniqlo's trending search words. ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/suggestions'),
			},
			{
				name: 'Get Stock',
				value: 'stock',
				action: 'Get uniqlo online stock',
				description: `Online stock of every colour x size x length variant: l2_id, SKU, colour, size, status (in_stock, low_stock, out_of_stock), quantity (Uniqlo shows at most 11; quantity_capped marks it), back_in_stock and in_transit, plus variants_total and variants_in_stock. Online stock, not store stock (use Get Store Stock). ${FULL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/stock'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get uniqlo store stock',
				description: `Stock status of one variant in the stores nearest a point (in_stock, low_stock, out_of_stock; no unit counts), by variant ID or by product ID + colour + size, with the price group the variant came from (default 00): a variant of price group 01 asked as 00 reads out of stock in every store. ${FULL} ${CHARGE} Costs 1 credit by variant ID, 2 by product ID + colour + size.`,
				routing: request('/api/v1/uniqlo/store-stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search uniqlo products',
				description: `Search Uniqlo's catalogue by keyword: ${ITEM}, plus related_keywords. United States, Japan and South Korea, and Uniqlo's Greater China sites (Taiwan, Hong Kong, China; in Chinese, with their own product codes). ${PRICES} ${PRICE_GROUPS} ${IDS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/uniqlo/search'),
			},
		],
		default: 'search',
	},
];

export const uniqloFields: INodeProperties[] = [
	// -- Market --
	countryField(
		SEARCH_MARKETS,
		['search'],
		'The Uniqlo market. Search is served in the United States, Japan, South Korea and on the Greater China sites (Taiwan, Hong Kong, China).',
	),
	countryField(
		PRODUCT_MARKETS,
		['product'],
		"The Uniqlo market. Prices come in its own currency. EU Store countries are Uniqlo's EU store (euros, English). Countries with no Uniqlo online store (Switzerland, Norway, New Zealand, Mexico, Turkey, UAE, Israel, Russia) are not served.",
	),
	countryField(FULL_MARKETS, FULL_OPS, 'The Uniqlo market (United States, Japan or South Korea)'),
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Chinese (Simplified)', value: 'zh-Hans' },
			{ name: 'Chinese (Traditional)', value: 'zh-Hant' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Indonesian', value: 'id' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Korean', value: 'ko' },
			{ name: "Market's Default", value: '' },
			{ name: 'Spanish', value: 'es' },
			{ name: 'Thai', value: 'th' },
			{ name: 'Vietnamese', value: 'vi' },
		],
		displayOptions: { show: { resource: ['uniqlo'] } },
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			'Language of the country (default its local language): United States English; Japan Japanese; South Korea Korean; Belgium Dutch, French or English; Canada English or French; Germany, Spain, France, Italy and the Netherlands their language or English; Indonesia Indonesian or English; Thailand Thai or English; Vietnam Vietnamese or English; Taiwan and Hong Kong Traditional Chinese; China Simplified Chinese; English elsewhere. Another language answers 400.',
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'heattech',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			"Search keywords in the country's language (Chinese on Taiwan, Hong Kong and China)",
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		placeholder: 'jea',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description:
			"What the shopper has typed so far. Leave empty for Uniqlo's trending search words.",
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'productId',
		options: [
			{ name: 'Product ID', value: 'productId' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the product',
	},
	productIdField(
		['product'],
		{ productBy: ['productId'] },
		"A Uniqlo product ID (items[].product_id): E479000-000 on uniqlo.com, the same in every country; Uniqlo's own codes (u0000000055478) on Taiwan, Hong Kong and China",
	),
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.uniqlo.com/us/en/products/E479000-000/00',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'A Uniqlo product link from any country; its country is used unless Country is changed',
	},

	// -- Product ID: Get Stock, Get Reviews, Get Prices by Country --
	productIdField(['stock', 'reviews']),
	productIdField(
		['prices'],
		{},
		'A uniqlo.com product ID (items[].product_id), e.g. E479000-000. The same ID in every country.',
	),
	{
		displayName: 'Countries',
		name: 'countries',
		type: 'multiOptions',
		required: true,
		default: ['jp', 'us', 'gb', 'de', 'fr', 'kr', 'au', 'ca', 'sg', 'th'],
		options: PRICES_MARKETS,
		displayOptions: show(['prices']),
		routing: { request: { body: { countries: '={{ $value }}' } } },
		description: '1 to 10 Uniqlo markets. Costs 1 credit per country that answered.',
	},

	// -- Get Store Stock --
	{
		displayName: 'Variant By',
		name: 'variantBy',
		type: 'options',
		default: 'l2Id',
		options: [
			{ name: 'Variant ID (L2 ID)', value: 'l2Id' },
			{ name: 'Product ID, Colour and Size', value: 'product' },
		],
		displayOptions: show(['storeStock']),
		description:
			'A variant ID from Get Stock or Get Product (1 credit), or a product ID with colour and size codes (2 credits)',
	},
	{
		displayName: 'Variant ID',
		name: 'l2Id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '08665900',
		displayOptions: show(['storeStock'], { variantBy: ['l2Id'] }),
		routing: { request: { body: { l2_id: '={{ $value }}' } } },
		description: 'The variant ID (variants[].l2_id of Get Stock or Get Product)',
	},
	productIdField(['storeStock'], { variantBy: ['product'] }),
	{
		displayName: 'Colour Code',
		name: 'swatchCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'COL04',
		displayOptions: show(['storeStock'], { variantBy: ['product'] }),
		routing: { request: { body: { color: '={{ $value }}' } } },
		description: 'Colour code (colors[].code of Get Product)',
	},
	{
		displayName: 'Size Code',
		name: 'size',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'INS022',
		displayOptions: show(['storeStock'], { variantBy: ['product'] }),
		routing: { request: { body: { size: '={{ $value }}' } } },
		description: 'Size code (sizes[].code of Get Product)',
	},
	latField(['storeStock']),
	lngField(['storeStock']),

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'findBy',
		type: 'options',
		default: 'point',
		options: [
			{ name: 'Point (Nearest Stores)', value: 'point' },
			{ name: 'Store ID', value: 'storeId' },
		],
		displayOptions: show(['stores']),
		description: 'Stores nearest a point, or one store by ID',
	},
	latField(['stores'], { findBy: ['point'] }),
	lngField(['stores'], { findBy: ['point'] }),
	{
		displayName: 'Store ID',
		name: 'storeId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['stores'], { findBy: ['storeId'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'One store by ID (stores[].store_id of an earlier response)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'categoryPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '22210,23296,23339',
		displayOptions: show(['category']),
		routing: { request: { body: { category_path: '={{ $value }}' } } },
		description:
			"1 to 4 category IDs (gender, class, category, subcategory) separated by commas: a node's path from Get Categories. IDs are per country (22210,23296,23339 is women > bottoms > jeans in the United States).",
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'dealType',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'Limited-Time Offer', value: 'limited_offer' },
			{ name: 'Sale', value: 'sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "sale" ? undefined : $value }}' } } },
		description: 'Items flagged Sale, or items flagged Limited-Time Offer',
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
				displayName: 'Category Path',
				name: 'category_path',
				type: 'string',
				default: '',
				placeholder: '22210,23296,23339',
				description: 'Category IDs separated by commas: a path from Get Categories',
				routing: { request: { body: { category_path: '={{ $value || undefined }}' } } },
			},
			textOption(
				'Color',
				'color',
				'COL09',
				'Colour code from facets.colors (COL09) or its 2-digit display code (09)',
			),
			flagOption,
			genderOption,
			{
				displayName: 'Max Price',
				name: 'price_max',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: "Highest price, in the country's currency",
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'price_min',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: "Lowest price, in the country's currency",
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			pageOption,
			pageSizeOption,
			textOption(
				'Size',
				'size',
				'SMA004',
				'Size code from facets.sizes (SMA004 = M, INS030 = 30 inch)',
			),
			sortOption(
				[...SORTS, { name: 'Best Selling (Greater China)', value: 'best_selling' }].sort((a, b) =>
					a.name.localeCompare(b.name),
				),
				"Result order (Featured is Uniqlo's own order). Top Rated is offered in the United States, Japan and South Korea, Best Selling on Taiwan, Hong Kong and China.",
			),
		],
	},

	// -- Additional Options: Get Product, Get Stock, Get Prices by Country --
	{
		displayName: 'Additional Options',
		name: 'productOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product', 'stock', 'prices']),
		options: [priceGroupOption],
	},

	// -- Additional Options: Get Store Stock --
	{
		displayName: 'Additional Options',
		name: 'storeStockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeStock']),
		options: [
			textOption(
				'Length Code',
				'length',
				'',
				'With a product ID, when the product comes in lengths: length code (lengths[].code)',
			),
			limitOption,
			storeStockPriceGroupOption,
		],
	},

	// -- Additional Options: Find Stores --
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			limitOption,
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'reviewOptions',
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
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 25 },
				description: 'Reviews per page, 1 to 25',
				routing: { request: { body: { page_size: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest' },
					{ name: 'Lowest Rating', value: 'lowest' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Review order',
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Category Products --
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: [flagOption, ...listPaging],
	},

	// -- Additional Options: Get Deals, Get New Arrivals --
	{
		displayName: 'Additional Options',
		name: 'listOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals', 'newArrivals']),
		options: [genderOption, ...listPaging],
	},

	// -- Additional Options: Get Categories --
	{
		displayName: 'Additional Options',
		name: 'categoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			genderOption,
			{
				displayName: 'Include Subcategories',
				name: 'include_subcategories',
				type: 'boolean',
				default: false,
				description: 'Whether to add the subcategory level (a much larger response)',
				routing: { request: { body: { include_subcategories: '={{ $value || undefined }}' } } },
			},
		],
	},
];
