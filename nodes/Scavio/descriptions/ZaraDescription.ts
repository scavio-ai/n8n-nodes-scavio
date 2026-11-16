import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['zara'], operation, ...extra },
});

// Zara, 12 operations, each billed what the request spent (credits_used in the response): 2 credits
// per call for Search Products, Get Materials, Get Stock, Find Stores, Get Categories and Get
// Category Products; Get Product 2 (4 by reference or when the slug is another market's or
// language's, 6 for both); Get Store Stock 2 by store IDs, 4 by a point; Get Deals 4 (2 when the
// country has no special-prices category); Get New Arrivals 4; Get Prices by Country 2 per country
// that answered; Get Search Suggestions 2 (4 when the English fallback runs). China costs 1 credit
// per call. 102 Zara storefronts (Country) with Zara's own languages (Language): Find Stores and
// Get Store Stock not on Angola or Iraq, Get New Arrivals not on Algeria, Get Search Suggestions
// not on 10 storefronts. Category lists are large, so every operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ALL_MARKET_OPS = [
	'search',
	'product',
	'materials',
	'stock',
	'categories',
	'category',
	'deals',
];
const STORE_OPS = ['stores', 'storeStock'];
const LANGUAGE_OPS = [
	'search',
	'product',
	'materials',
	'stores',
	'storeStock',
	'categories',
	'category',
	'deals',
	'newArrivals',
	'prices',
	'suggestions',
];
const PRODUCT_ID_OPS = ['materials', 'stock', 'storeStock'];

const PRICES =
	"Prices are numbers in the country's own currency, never converted: price, old_price (set only on a markdown) and discount_percent. No price history: schedule a workflow to track changes.";
const IDS =
	"Product IDs (one per colour) and references are global on Zara's international site; China is Zara's separate site with its own IDs, so use the reference there.";
const ITEM =
	'items with product_id, reference, display_reference, title, URL, seo_slug, section, price, old_price, discount_percent, currency, availability, colors, tags and image, plus total, page and has_more';
const CHARGE =
	'Failed upstream calls are not charged; a not-found is charged. China costs 1 credit per call.';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const MARKETS: Array<{ name: string; value: string }> = [
	{ name: 'Abu Dhabi, Al Ain and Ras Al Khaimah', value: 'xe' },
	{ name: 'Albania', value: 'al' },
	{ name: 'Algeria', value: 'dz' },
	{ name: 'Andorra', value: 'ad' },
	{ name: 'Angola', value: 'ao' },
	{ name: 'Argentina', value: 'ar' },
	{ name: 'Armenia', value: 'am' },
	{ name: 'Aruba', value: 'aw' },
	{ name: 'Australia', value: 'au' },
	{ name: 'Austria', value: 'at' },
	{ name: 'Azerbaijan', value: 'az' },
	{ name: 'Bahrain', value: 'bh' },
	{ name: 'Belgium', value: 'be' },
	{ name: 'Bosnia and Herzegovina', value: 'ba' },
	{ name: 'Brazil', value: 'br' },
	{ name: 'Bulgaria', value: 'bg' },
	{ name: 'Cambodia', value: 'kh' },
	{ name: 'Canada', value: 'ca' },
	{ name: 'Canary Islands', value: 'ic' },
	{ name: 'Chile', value: 'cl' },
	{ name: 'China', value: 'cn' },
	{ name: 'Colombia', value: 'co' },
	{ name: 'Costa Rica', value: 'cr' },
	{ name: 'Croatia', value: 'hr' },
	{ name: 'Curacao', value: 'cw' },
	{ name: 'Cyprus', value: 'cy' },
	{ name: 'Czechia', value: 'cz' },
	{ name: 'Denmark', value: 'dk' },
	{ name: 'Dominican Republic', value: 'do' },
	{ name: 'Ecuador', value: 'ec' },
	{ name: 'Egypt', value: 'eg' },
	{ name: 'El Salvador', value: 'sv' },
	{ name: 'Estonia', value: 'ee' },
	{ name: 'Finland', value: 'fi' },
	{ name: 'France', value: 'fr' },
	{ name: 'Georgia', value: 'ge' },
	{ name: 'Germany', value: 'de' },
	{ name: 'Greece', value: 'gr' },
	{ name: 'Guatemala', value: 'gt' },
	{ name: 'Honduras', value: 'hn' },
	{ name: 'Hong Kong', value: 'hk' },
	{ name: 'Hungary', value: 'hu' },
	{ name: 'Iceland', value: 'is' },
	{ name: 'India', value: 'in' },
	{ name: 'Indonesia', value: 'id' },
	{ name: 'Iraq', value: 'iq' },
	{ name: 'Ireland', value: 'ie' },
	{ name: 'Israel', value: 'il' },
	{ name: 'Italy', value: 'it' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'Jordan', value: 'jo' },
	{ name: 'Kazakhstan', value: 'kz' },
	{ name: 'Kosovo', value: 'xk' },
	{ name: 'Kuwait', value: 'kw' },
	{ name: 'Latvia', value: 'lv' },
	{ name: 'Lebanon', value: 'lb' },
	{ name: 'Lithuania', value: 'lt' },
	{ name: 'Luxembourg', value: 'lu' },
	{ name: 'Macau', value: 'mo' },
	{ name: 'Malaysia', value: 'my' },
	{ name: 'Malta', value: 'mt' },
	{ name: 'Mexico', value: 'mx' },
	{ name: 'Monaco', value: 'mc' },
	{ name: 'Montenegro', value: 'me' },
	{ name: 'Morocco', value: 'ma' },
	{ name: 'Netherlands', value: 'nl' },
	{ name: 'New Zealand', value: 'nz' },
	{ name: 'Nicaragua', value: 'ni' },
	{ name: 'North Macedonia', value: 'mk' },
	{ name: 'Norway', value: 'no' },
	{ name: 'Oman', value: 'om' },
	{ name: 'Panama', value: 'pa' },
	{ name: 'Paraguay', value: 'py' },
	{ name: 'Peru', value: 'pe' },
	{ name: 'Philippines', value: 'ph' },
	{ name: 'Poland', value: 'pl' },
	{ name: 'Portugal', value: 'pt' },
	{ name: 'Puerto Rico', value: 'pr' },
	{ name: 'Qatar', value: 'qa' },
	{ name: 'Romania', value: 'ro' },
	{ name: 'Saudi Arabia', value: 'sa' },
	{ name: 'Serbia', value: 'rs' },
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
	{ name: 'Tunisia', value: 'tn' },
	{ name: 'Turkey', value: 'tr' },
	{ name: 'Ukraine', value: 'ua' },
	{ name: 'United Arab Emirates', value: 'ae' },
	{ name: 'United Kingdom', value: 'gb' },
	{ name: 'United States', value: 'us' },
	{ name: 'Uruguay', value: 'uy' },
	{ name: 'Uzbekistan', value: 'uz' },
	{ name: 'Venezuela', value: 've' },
	{ name: 'Vietnam', value: 'vn' },
];
// Find Stores, Get Store Stock: Zara lists no stores in Angola or Iraq.
const STORE_MARKETS = MARKETS.filter((m) => !['ao', 'iq'].includes(m.value));
// Get New Arrivals: Algeria shows no new-arrivals category.
const NEW_ARRIVALS_MARKETS = MARKETS.filter((m) => m.value !== 'dz');
// Get Search Suggestions: no suggestions in the language of these storefronts (use Search Products).
const NO_SUGGESTIONS = ['ad', 'al', 'am', 'az', 'ba', 'dz', 'mk', 'mo', 'uz', 'xk'];
const SUGGESTIONS_MARKETS = MARKETS.filter((m) => !NO_SUGGESTIONS.includes(m.value));

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
	default: 40.7128,
	typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
	displayOptions: show(operations, extra),
	routing: { request: { body: { lat: '={{ $value }}' } } },
	description: 'Latitude of a point in the country, e.g. 40.7128 New York, 51.5072 London',
});
const lngField = (operations: string[], extra: Record<string, string[]> = {}): INodeProperties => ({
	displayName: 'Longitude',
	name: 'lng',
	type: 'number',
	required: true,
	default: -74.006,
	typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
	displayOptions: show(operations, extra),
	routing: { request: { body: { lng: '={{ $value }}' } } },
	description: 'Longitude, e.g. -74.006 New York, -0.1276 London',
});

const facetOption = (
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

const pagingOptions = [
	{
		displayName: 'Page',
		name: 'page',
		type: 'number' as const,
		default: 1,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Results page, 1-based',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'page_size',
		type: 'number' as const,
		default: 24,
		typeOptions: { minValue: 1, maxValue: 96 },
		description: 'Items per page, 1 to 96',
		routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options' as const,
		default: 'relevance',
		options: [
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: "Result order (relevance is Zara's own order)",
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];
const SEARCH_SECTIONS = [
	{ name: 'All Sections', value: '' },
	{ name: 'Home', value: 'home' },
	{ name: 'Kids', value: 'kids' },
	{ name: 'Man', value: 'man' },
	{ name: 'Woman', value: 'woman' },
];
const searchSectionOption = {
	displayName: 'Section',
	name: 'section',
	type: 'options' as const,
	default: '',
	options: SEARCH_SECTIONS,
	description: 'Only one section',
	routing: { request: { body: { section: '={{ $value || undefined }}' } } },
};

export const zaraOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['zara'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find zara stores',
				description: `Zara stores near a point of the country, nearest first: store_id, address_lines, city, postal_code, lat, lng, distance_km, phones, opening_hours (7 dated days), sections, services, pickup and status. Pass store_id values to Get Store Stock. Every country except Angola and Iraq. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/zara/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get zara categories',
				description: `The category tree of a country in the request language: each category's ID, name, section, parent_id, level, leaf, redirect_id and key. Category IDs are shared across Zara's northern-hemisphere countries; Australia, South Africa and Brazil run their own. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/zara/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get zara category products',
				description: `Every product of one category (a leaf ID from Get Categories), paged and sorted over the whole list: ${ITEM}, total_pages and on_sale_count. ${PRICES} ${IDS} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/zara/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get zara deals',
				description: `The country's SPECIAL PRICES category for a section (default woman), found live in its category tree: ${ITEM}, with old_price and discount_percent. Zara runs seasonal sales and lists special prices between them; where a country has no special-prices category for the section the response has no items and a note, not an error. ${PRICES} ${CHARGE} Costs 4 credits (2 when the country has no special-prices category).`,
				routing: request('/api/v1/zara/deals'),
			},
			{
				name: 'Get Materials',
				value: 'materials',
				action: 'Get zara materials',
				description: `Composition, care and origin as the product page states them: composition, sustainable_materials, certifications, care, origin (the country of production as Zara states it) and, in France, traceability steps. Zara names no factories. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/zara/materials'),
			},
			{
				name: 'Get New Arrivals',
				value: 'newArrivals',
				action: 'Get zara new arrivals',
				description: `The country's NEW ARRIVALS > THE NEW category for a section (default woman): ${ITEM}. Every country except Algeria. ${PRICES} ${CHARGE} Costs 4 credits.`,
				routing: request('/api/v1/zara/new-arrivals'),
			},
			{
				name: 'Get Prices by Country',
				value: 'prices',
				action: 'Get zara prices by country',
				description: `One reference across up to 10 countries in one call: per country the currency, available, title, price, old_price, discount_percent, product_id and URL, plus not_sold (countries that do not sell it). Each price is in that country's own currency, never converted. ${IDS} Costs 2 credits per country that answered (1 for China); failed countries are not charged.`,
				routing: request('/api/v1/zara/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a zara product',
				description: `One product by link, product ID + slug, or reference: description, the prices, composition and every colour with its sizes and online availability per size (in_stock, out_of_stock, low_on_stock, coming_soon), promotions and images. No reviews (Zara shows none). ${PRICES} ${IDS} ${CHARGE} Costs 2 credits; 4 by reference or when the slug is another country's or language's; 6 for both.`,
				routing: request('/api/v1/zara/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get zara search suggestions',
				description: `Search suggestions for what a shopper has typed, in the country's language: suggestions (text) and language_used (English where Zara has no suggestions in the request language). ${CHARGE} Costs 2 credits, 4 when the English fallback is used.`,
				routing: request('/api/v1/zara/suggestions'),
			},
			{
				name: 'Get Stock',
				value: 'stock',
				action: 'Get zara online stock',
				description: `Online availability per size of one colour: skus (sku, availability), sizes_total and sizes_in_stock. Online stock, not store stock (use Get Store Stock). ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/zara/stock'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get zara store stock',
				description: `Units of one colour in physical stores, per size (units, sales floor and stockroom), by up to 8 store IDs or the 8 stores nearest a point. Every country except Angola and Iraq. ${CHARGE} Costs 2 credits by store IDs, 4 by a point.`,
				routing: request('/api/v1/zara/store-stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search zara products',
				description: `Search one country's catalogue by keyword, or look up a reference (all its colours): ${ITEM}, facets and price_range; sorted by relevance or price and filtered by section, colour, size and price. ${PRICES} ${IDS} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/zara/search'),
			},
		],
		default: 'search',
	},
];

export const zaraFields: INodeProperties[] = [
	// -- Market --
	countryField(
		MARKETS,
		ALL_MARKET_OPS,
		'The Zara storefront. Prices come in its own currency. Belarus and the countries Zara serves only from its worldwide store are not served.',
	),
	countryField(STORE_MARKETS, STORE_OPS, 'The Zara storefront (every one except Angola and Iraq)'),
	countryField(
		NEW_ARRIVALS_MARKETS,
		['newArrivals'],
		'The Zara storefront (every one except Algeria)',
	),
	countryField(
		SUGGESTIONS_MARKETS,
		['suggestions'],
		'The Zara storefront (not Andorra, Albania, Armenia, Azerbaijan, Bosnia and Herzegovina, Algeria, North Macedonia, Macau, Uzbekistan or Kosovo: use Search Products there)',
	),
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Albanian', value: 'sq' },
			{ name: 'Arabic', value: 'ar' },
			{ name: 'Armenian', value: 'hy' },
			{ name: 'Basque', value: 'eu' },
			{ name: 'Bulgarian', value: 'bg' },
			{ name: 'Catalan', value: 'ca' },
			{ name: 'Chinese (Simplified)', value: 'zh' },
			{ name: 'Chinese (Traditional)', value: 'zh-Hant' },
			{ name: 'Croatian', value: 'hr' },
			{ name: 'Czech', value: 'cs' },
			{ name: 'Danish', value: 'da' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'Estonian', value: 'et' },
			{ name: 'Finnish', value: 'fi' },
			{ name: 'French', value: 'fr' },
			{ name: 'Galician', value: 'gl' },
			{ name: 'Georgian', value: 'ka' },
			{ name: 'German', value: 'de' },
			{ name: 'Greek', value: 'el' },
			{ name: 'Hebrew', value: 'he' },
			{ name: 'Hungarian', value: 'hu' },
			{ name: 'Indonesian', value: 'id' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Kazakh', value: 'kk' },
			{ name: 'Korean', value: 'ko' },
			{ name: 'Latvian', value: 'lv' },
			{ name: 'Lithuanian', value: 'lt' },
			{ name: 'Macedonian', value: 'mk' },
			{ name: "Market's Default", value: '' },
			{ name: 'Norwegian', value: 'no' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Romanian', value: 'ro' },
			{ name: 'Russian', value: 'ru' },
			{ name: 'Serbian', value: 'sr' },
			{ name: 'Slovak', value: 'sk' },
			{ name: 'Slovenian', value: 'sl' },
			{ name: 'Spanish', value: 'es' },
			{ name: 'Swedish', value: 'sv' },
			{ name: 'Thai', value: 'th' },
			{ name: 'Turkish', value: 'tr' },
			{ name: 'Ukrainian', value: 'uk' },
			{ name: 'Uzbek', value: 'uz' },
			{ name: 'Vietnamese', value: 'vi' },
		],
		displayOptions: show(LANGUAGE_OPS),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			"Language of the country (default Zara's own default for it). Each storefront serves Zara's own languages for it, usually the local language and English: e.g. United States English or Spanish; Canada English or French; Spain Spanish, English, Basque, Galician or Catalan; Switzerland English, French, German or Italian; Belgium English, Dutch or French; Hong Kong, Macau and Taiwan Traditional Chinese or English; China Simplified Chinese or English. Another language answers 400.",
	},

	// -- Search Products --
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		default: 'keyword',
		options: [
			{ name: 'Keyword', value: 'keyword' },
			{ name: 'Reference', value: 'reference' },
		],
		displayOptions: show(['search']),
		description: 'Search by keyword, or look up one reference (all its colours)',
	},
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'blazer',
		displayOptions: show(['search'], { searchBy: ['keyword'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords in any language',
	},
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'jea',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'productId',
		options: [
			{ name: 'Product ID and Slug', value: 'productId' },
			{ name: 'Product URL', value: 'url' },
			{ name: 'Reference', value: 'reference' },
		],
		displayOptions: show(['product']),
		description:
			'How to identify the product. A product ID alone does not open a Zara product page: it goes with its slug.',
	},
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '553306790',
		displayOptions: show(['product'], { productBy: ['productId'] }),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: "The colour's product ID (items[].product_id of any response)",
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		required: true,
		default: '',
		placeholder: '100-wool-suit-blazer-p04591381',
		displayOptions: show(['product'], { productBy: ['productId'] }),
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description: "The product's slug (items[].seo_slug of a Search Products response)",
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.zara.com/us/en/100-wool-suit-blazer-p04591381.html?v1=553306790',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'A Zara product link from any country; its country is used unless Country is changed',
	},

	// -- Reference: Search Products (by reference), Get Product (by reference), Get Prices by Country --
	{
		displayName: 'Reference',
		name: 'reference',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4591/381',
		displayOptions: show(['search'], { searchBy: ['reference'] }),
		routing: { request: { body: { reference: '={{ $value }}' } } },
		description:
			'A Zara reference as printed on the product page (display_reference of any response)',
	},
	{
		displayName: 'Reference',
		name: 'reference',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4591/381',
		displayOptions: show(['product'], { productBy: ['reference'] }),
		routing: { request: { body: { reference: '={{ $value }}' } } },
		description:
			'A Zara reference as printed on the product page (display_reference of any response)',
	},
	{
		displayName: 'Reference',
		name: 'reference',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4591/381',
		displayOptions: show(['prices']),
		routing: { request: { body: { reference: '={{ $value }}' } } },
		description:
			'A Zara reference as printed on the product page (display_reference of any response). The same reference in every country.',
	},
	{
		displayName: 'Countries',
		name: 'countries',
		type: 'multiOptions',
		required: true,
		default: ['us', 'gb', 'es', 'de', 'fr', 'it', 'jp', 'kr', 'mx', 'pl'],
		options: MARKETS,
		displayOptions: show(['prices']),
		routing: { request: { body: { countries: '={{ $value }}' } } },
		description:
			'1 to 10 Zara storefronts. Costs 2 credits per country that answered (1 for China).',
	},

	// -- Product ID: Get Materials, Get Stock, Get Store Stock --
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '588478514',
		displayOptions: show(PRODUCT_ID_OPS),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			"The colour's product ID (items[].product_id of any response). Global on Zara's international site; China runs its own IDs.",
	},

	// -- Find Stores --
	latField(['stores']),
	lngField(['stores']),

	// -- Get Store Stock --
	{
		displayName: 'Check Stores By',
		name: 'locateBy',
		type: 'options',
		default: 'storeIds',
		options: [
			{ name: 'Store IDs', value: 'storeIds' },
			{ name: 'Point (Nearest 8 Stores)', value: 'point' },
		],
		displayOptions: show(['storeStock']),
		description:
			'Check the store IDs you choose (2 credits), or the 8 stores nearest a point (4 credits)',
	},
	{
		displayName: 'Store IDs',
		name: 'store_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3904, 3862',
		displayOptions: show(['storeStock'], { locateBy: ['storeIds'] }),
		routing: { request: { body: { store_ids: SPLIT } } },
		description: 'Up to 8 Zara store IDs from Find Stores (store_id), separated by commas',
	},
	latField(['storeStock'], { locateBy: ['point'] }),
	lngField(['storeStock'], { locateBy: ['point'] }),

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'categoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2420896',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description:
			"A leaf category ID from Get Categories (or a parent's redirect_id), e.g. 2420896 women's dresses in the United States. Australia, South Africa and Brazil run their own IDs.",
	},

	// -- Get Deals, Get New Arrivals --
	{
		displayName: 'Section',
		name: 'section',
		type: 'options',
		default: 'woman',
		options: [
			{ name: 'Boy', value: 'boy' },
			{ name: 'Girl', value: 'girl' },
			{ name: 'Man', value: 'man' },
			{ name: 'Woman', value: 'woman' },
		],
		displayOptions: show(['deals', 'newArrivals']),
		routing: { request: { body: { section: '={{ $value === "woman" ? undefined : $value }}' } } },
		description: 'Which section',
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
			facetOption(
				'Color',
				'color',
				'black',
				'One value of the color facet of an earlier response in the same country',
			),
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
			...pagingOptions,
			searchSectionOption,
			facetOption('Size', 'size', '38', 'One value of the size facet of an earlier response'),
		],
	},

	// -- Additional Options: Get Search Suggestions --
	{
		displayName: 'Additional Options',
		name: 'suggestionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [searchSectionOption],
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
			{
				displayName: 'Section',
				name: 'section',
				type: 'options',
				default: '',
				options: [
					{ name: 'All Sections', value: '' },
					{ name: 'Beauty', value: 'beauty' },
					{ name: 'Home', value: 'home' },
					{ name: 'Kids', value: 'kids' },
					{ name: 'Man', value: 'man' },
					{ name: 'Woman', value: 'woman' },
				],
				description: 'Only one part of the tree',
				routing: { request: { body: { section: '={{ $value || undefined }}' } } },
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
		options: [
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description: 'Whether to return only marked-down items (with old_price)',
				routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
			},
			...pagingOptions,
		],
	},

	// -- Additional Options: Get Deals, Get New Arrivals --
	{
		displayName: 'Additional Options',
		name: 'listOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals', 'newArrivals']),
		options: pagingOptions,
	},
];
