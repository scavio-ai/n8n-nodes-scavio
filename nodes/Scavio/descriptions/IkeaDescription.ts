import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['ikea'], operation, ...extra },
});

// IKEA, 12 operations across 55 markets, 1 credit each; Compare Prices by Country costs 1 credit
// per market that answered. Search Products and Get Product serve 55 markets; Get Category
// Products, Get Deals, Get Search Suggestions and Get Items the 50 ikea.com markets plus China;
// Get Reviews, Get Categories, Find Stores, Get Store Stock and Compare the 50 ikea.com markets;
// Get As-Is Offers 13 markets. A product page can take up to about 100s, so Get Product and Get
// Reviews carry a 180s timeout, the rest 120s.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const MAIN_MARKETS: Array<[string, string]> = [
	['ae', 'United Arab Emirates'],
	['at', 'Austria'],
	['au', 'Australia'],
	['be', 'Belgium'],
	['bh', 'Bahrain'],
	['ca', 'Canada'],
	['ch', 'Switzerland'],
	['cl', 'Chile'],
	['co', 'Colombia'],
	['cz', 'Czech Republic'],
	['de', 'Germany'],
	['dk', 'Denmark'],
	['ee', 'Estonia'],
	['eg', 'Egypt'],
	['es', 'Spain'],
	['fi', 'Finland'],
	['fr', 'France'],
	['gb', 'United Kingdom'],
	['hr', 'Croatia'],
	['hu', 'Hungary'],
	['ie', 'Ireland'],
	['il', 'Israel'],
	['in', 'India'],
	['it', 'Italy'],
	['jo', 'Jordan'],
	['jp', 'Japan'],
	['kr', 'South Korea'],
	['kw', 'Kuwait'],
	['lt', 'Lithuania'],
	['lv', 'Latvia'],
	['ma', 'Morocco'],
	['mx', 'Mexico'],
	['my', 'Malaysia'],
	['nl', 'Netherlands'],
	['no', 'Norway'],
	['nz', 'New Zealand'],
	['om', 'Oman'],
	['ph', 'Philippines'],
	['pl', 'Poland'],
	['pt', 'Portugal'],
	['qa', 'Qatar'],
	['ro', 'Romania'],
	['rs', 'Serbia'],
	['sa', 'Saudi Arabia'],
	['se', 'Sweden'],
	['sg', 'Singapore'],
	['si', 'Slovenia'],
	['sk', 'Slovakia'],
	['th', 'Thailand'],
	['us', 'United States'],
];
const CN: Array<[string, string]> = [['cn', 'China']];
const FRANCHISE: Array<[string, string]> = [
	['do', 'Dominican Republic'],
	['es_islands', 'Spain: Canary and Balearic Islands'],
	['is', 'Iceland'],
	['pr', 'Puerto Rico'],
];
const AS_IS_CODES = ['us', 'gb', 'de', 'fr', 'se', 'jp', 'nl', 'es', 'it', 'pl', 'au', 'ch', 'at'];

const options = (markets: Array<[string, string]>) =>
	markets.map(([value, name]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));

const ALL_OPTIONS = options([...MAIN_MARKETS, ...CN, ...FRANCHISE]);
const MAIN_CN_OPTIONS = options([...MAIN_MARKETS, ...CN]);
const MAIN_OPTIONS = options(MAIN_MARKETS);
const AS_IS_OPTIONS = options(MAIN_MARKETS.filter(([code]) => AS_IS_CODES.includes(code)));

const ALL_OPS = ['search', 'product'];
const MAIN_CN_OPS = ['category', 'deals', 'suggestions', 'items'];
const MAIN_OPS = ['reviews', 'categories', 'stores', 'stock'];
const LANGUAGE_OPS = [...ALL_OPS, ...MAIN_CN_OPS, ...MAIN_OPS, 'asIs'];
const GRID_OPS = ['search', 'category', 'deals'];

const LANG =
	"Data comes in the market's language and prices in its own currency (never converted); every answer echoes country, language and currency.";
const ITEM =
	'item_no, name, type_name, design, measure_text, URL, image, price, previous_price, discount_percent, price_tag (family_price, new_lower_price, time_restricted_offer (a limited-time reduced price), lower_price_in_store, new_product, discontinued or none), lowest_price, rating, rating_count (per market as shown; many markets share one pool, some show none), badge, colors, variants, last_chance, category_path and availability (with a store ID)';
const GRID = `total, page, page_size, total_pages, count, sort, applied_filters, facets and items with ${ITEM}.`;
const CHARGE =
	'Failed upstream calls are not charged (they are retried automatically); a not-found is charged.';

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

export const ikeaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ikea'] } },
		options: [
			{
				name: 'Compare Prices by Country',
				value: 'compare',
				action: 'Compare ikea prices by country',
				description:
					"IKEA prices by country: one article number on 2 to 10 IKEA markets in one call. Returns item_no, count, found_count, markets (country, language, currency, found, name, type_name, design, price, previous_price, price_tag, URL), errors and note. Prices are in each market's own currency, never converted. Some markets (US, Canada, Japan, Australia, South Korea, India, Malaysia, Singapore, Philippines ...) sell the same product under a different article number, so found is false there. A market that fails is listed in errors and not charged. Costs 1 credit per market that answered.",
				routing: request('/api/v1/ikea/compare'),
			},
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find ikea stores',
				description: `The market's IKEA stores and pick-up / plan-and-order points: store_id (for Get Store Stock, Get As-Is Offers and the store filter), name, type, address, latitude, longitude, opening hours, restaurant, bistro, cafe, click and collect, Swedish Food Market and Smaland hours, store_url and opening_date; distance_km when sorted by distance. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/stores'),
			},
			{
				name: 'Get As-Is Offers',
				value: 'asIs',
				action: 'Get ikea as is offers',
				description: `One IKEA store's As-is offers (ex-display, returned and second-hand items at reduced prices): per product title, description, article_numbers, currency, original_price, min_price, max_price, image and offers (offer_id, price, condition, in_box, reason_discount); plus total and total_pages. A store of another market is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/as-is'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get ikea categories',
				description: `The market's IKEA category tree (about 1,500 categories): ID (for Get Category Products), name, URL and children. ${LANG} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get ikea category products',
				description: `One IKEA category's products by category ID or URL, with the search sorts and filters. Returns category (ID, name, URL, parents) and ${GRID} ${LANG} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get ikea deals',
				description: `One of the market's IKEA deal lists (new products, IKEA Family price, new lower price, last chance, lowest price, top seller, limited edition ...), with the search sorts and filters. Returns type and ${GRID} ${LANG} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/deals'),
			},
			{
				name: 'Get Items',
				value: 'items',
				action: 'Get ikea items',
				description: `Up to 100 IKEA article numbers on one market in one call, each with the search item fields (${ITEM}); numbers the market does not sell are listed in not_found. ${LANG} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/items'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an ikea product',
				description: `One IKEA product by article number or product URL: name, type_name, description, price, previous_price, family_price, currency, images, rating, rating_count, measurements, materials, care, packaging (packages, dimensions, weight), assembly_pdfs, manuals, designer, variants, secondary_ratings, the 3 newest reviews and detail_level. Franchise markets (Puerto Rico, Dominican Republic, the Spanish islands, Iceland) return basic detail. Can take up to about 100 seconds. ${LANG} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/product', 180000),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get ikea product reviews',
				description: `An IKEA product's rating, rating_count, secondary_ratings and the 20 most recent reviews the product page shows (title, text, rating, date, author, country), plus highlighted reviews. No paging, sort or star filter. Ratings are per market as shown: many markets share one pool (KALLAX: 8,241 in Germany, Spain, Sweden), others have their own (France 2,760, Italy 1,887), and some show none (Estonia, Latvia, Lithuania, Israel, Iceland). Can take up to about 100 seconds. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/reviews', 180000),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get ikea search suggestions',
				description: `What the IKEA search box suggests for a partial query: suggestions with text, type (completion, category, product, planner, content), label, URL, category_id and item_no when given. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/suggestions'),
			},
			{
				name: 'Get Store Stock',
				value: 'stock',
				action: 'Get ikea store stock',
				description: `Stock at one IKEA store for up to 100 article numbers: per item store_availability (status in_stock_high, in_stock_low or out_of_stock, and the site's text) and home_delivery (with a postal code). A level, not a quantity: IKEA does not publish unit counts. Numbers the market does not sell are listed in not_found; an unknown store ID is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search ikea products',
				description: `Search IKEA products by keyword on any of 55 markets. Returns query, did_you_mean, related_searches, content and ${GRID} Puerto Rico, Dominican Republic and the Spanish islands take keyword and page only and return the first 40 results; Iceland takes keyword and page. ${LANG} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/ikea/search'),
			},
		],
		default: 'search',
	},
];

export const ikeaFields: INodeProperties[] = [
	// -- Country (each operation's own market list) --
	countryField(
		ALL_OPTIONS,
		ALL_OPS,
		'The IKEA market: 50 ikea.com markets plus China, Puerto Rico, the Dominican Republic, the Canary and Balearic Islands and Iceland',
	),
	countryField(MAIN_CN_OPTIONS, MAIN_CN_OPS, 'The IKEA market: the 50 ikea.com markets plus China'),
	countryField(MAIN_OPTIONS, MAIN_OPS, 'The IKEA market: the 50 ikea.com markets'),
	countryField(
		AS_IS_OPTIONS,
		['asIs'],
		"The store's market: As-is offers are served in 13 markets",
	),
	{
		displayName: 'Island',
		name: 'island',
		type: 'options',
		default: 'tenerife',
		options: [
			{ name: 'El Hierro', value: 'elhierro' },
			{ name: 'Fuerteventura', value: 'fuerteventura' },
			{ name: 'Gran Canaria', value: 'grancanaria' },
			{ name: 'Ibiza', value: 'ibiza' },
			{ name: 'La Gomera', value: 'lagomera' },
			{ name: 'La Palma', value: 'lapalma' },
			{ name: 'Lanzarote', value: 'lanzarote' },
			{ name: 'Mallorca', value: 'mallorca' },
			{ name: 'Menorca', value: 'menorca' },
			{ name: 'Tenerife', value: 'tenerife' },
		],
		displayOptions: show(ALL_OPS, { country: ['es_islands'] }),
		routing: { request: { body: { island: '={{ $value }}' } } },
		description: 'Which island storefront',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'string',
		default: '',
		placeholder: 'en',
		displayOptions: show(LANGUAGE_OPS),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			"Optional language code the market serves (default: the market's first), e.g. Canada en or fr, Belgium nl, fr or en, Switzerland de, fr, it or en, United States en or es",
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'kallax',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords, in any language the market serves',
	},

	// -- Get Product, Get Reviews --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'itemNo',
		options: [
			{ name: 'Article Number', value: 'itemNo' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product', 'reviews']),
		description: 'Read a product by its IKEA article number or by its product page link',
	},
	{
		displayName: 'Article Number',
		name: 'itemNo',
		type: 'string',
		required: true,
		default: '',
		placeholder: '80275887',
		displayOptions: show(['product', 'reviews'], { productBy: ['itemNo'] }),
		routing: { request: { body: { item_no: '={{ $value }}' } } },
		description: 'An IKEA article number: 8 digits, dots allowed (802.758.87)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.ikea.com/de/de/p/kallax-regal-weiss-80275887/',
		displayOptions: show(['product', 'reviews'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'An IKEA product page; the market and language are read from it, so leave Country on its default or set the same market',
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'categoryBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Category ID', value: 'id' },
			{ name: 'Category URL', value: 'url' },
		],
		displayOptions: show(['category']),
		description: 'Read a category by its ID from Get Categories or by its IKEA link',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10382',
		displayOptions: show(['category'], { categoryBy: ['id'] }),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'A category ID (categories[].ID of Get Categories), e.g. 10382 = bookcases',
	},
	{
		displayName: 'Category URL',
		name: 'category_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.ikea.com/us/en/cat/bookcases-10382/',
		displayOptions: show(['category'], { categoryBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'An IKEA category page',
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'dealType',
		type: 'options',
		default: 'new_lower_price',
		options: [
			{ name: 'IKEA Family Price', value: 'family_price' },
			{ name: 'In-Store Price Only', value: 'in_store_price_only' },
			{ name: 'Last Chance', value: 'last_chance' },
			{ name: 'Limited Edition', value: 'limited_edition' },
			{ name: 'Lowest Price', value: 'lowest_price' },
			{ name: 'New Lower Price', value: 'new_lower_price' },
			{ name: 'New Products', value: 'new_products' },
			{ name: 'Reduced Price Offer', value: 'reduced_price_offer' },
			{ name: 'Time Restricted', value: 'time_restricted' },
			{ name: 'Top Seller', value: 'top_seller' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'The deal list to read',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'suggestionQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sof',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What a shopper has typed so far',
	},

	// -- Get Store Stock, Get Items: article numbers --
	{
		displayName: 'Article Numbers',
		name: 'itemNos',
		type: 'string',
		required: true,
		default: '',
		placeholder: '20522046,20631663',
		displayOptions: show(['stock', 'items']),
		routing: { request: { body: { item_nos: '={{ $value }}' } } },
		description: '1 to 100 IKEA article numbers, comma-separated',
	},

	// -- Get Store Stock, Get As-Is Offers: store --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '399',
		displayOptions: show(['stock', 'asIs']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'An IKEA store ID from Find Stores (stores[].store_id), on the same market',
	},

	// -- Compare Prices by Country --
	{
		displayName: 'Article Number',
		name: 'compareItemNo',
		type: 'string',
		required: true,
		default: '',
		placeholder: '80275887',
		displayOptions: show(['compare']),
		routing: { request: { body: { item_no: '={{ $value }}' } } },
		description: 'The IKEA article number to price on every market',
	},
	{
		displayName: 'Countries',
		name: 'countries',
		type: 'multiOptions',
		required: true,
		default: ['de', 'fr', 'se'],
		options: MAIN_OPTIONS,
		displayOptions: show(['compare']),
		routing: { request: { body: { countries: '={{ $value }}' } } },
		description: '2 to 10 ikea.com markets. Costs 1 credit per market that answered.',
	},

	// -- Additional Options: Search Products, Get Category Products, Get Deals --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(GRID_OPS),
		options: [
			{
				displayName: 'Availability',
				name: 'availability',
				type: 'options',
				default: 'in_store',
				options: [
					{ name: 'Click and Collect', value: 'click_collect' },
					{ name: 'In Stock at the Store', value: 'in_store' },
					{ name: 'Online', value: 'online' },
				],
				description: 'With a Store ID: only products available this way',
				routing: { request: { body: { availability: '={{ $value }}' } } },
			},
			{
				displayName: 'Best Sellers Only',
				name: 'top_seller',
				type: 'boolean',
				default: false,
				description: 'Whether to return only best sellers',
				routing: { request: { body: { top_seller: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Colors',
				name: 'shades',
				type: 'string',
				default: '',
				placeholder: '10156',
				description: 'Color IDs from facets (f-colors), e.g. 10156 = white',
				routing: { request: { body: { color: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'IKEA Family Price Only',
				name: 'family_price',
				type: 'boolean',
				default: false,
				description: 'Whether to return only products with an IKEA Family member price',
				routing: { request: { body: { family_price: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Last Chance Only',
				name: 'last_chance',
				type: 'boolean',
				default: false,
				description: 'Whether to return only last-chance (being discontinued) products',
				routing: { request: { body: { last_chance: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'New Only',
				name: 'new_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only new products',
				routing: { request: { body: { new_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 24,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Products per page, up to 100',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Range ID',
				name: 'price_bucket',
				type: 'string',
				default: '',
				placeholder: 'PRICE_0_5000',
				description:
					'A price range ID from facets (f-price-buckets), e.g. PRICE_0_5000 = 0 to 49.99',
				routing: { request: { body: { price_bucket: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Most Popular', value: 'most_popular' },
					{ name: 'Name: A to Z', value: 'name_asc' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Result order',
				routing: {
					request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '399',
				description:
					"A store ID from Find Stores: adds each product's availability at that store (stock level, home delivery)",
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Search Options: Search Products --
	{
		displayName: 'Search Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: 'st002',
				description: 'Narrow to a category ID from facets (f-subcategories)',
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
		],
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
				displayName: 'Parent Category ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				placeholder: 'fu003',
				description: "Return only this category's subtree",
				routing: { request: { body: { parent_id: '={{ $value || undefined }}' } } },
			},
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
			{
				displayName: 'Latitude',
				name: 'lat',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
				description: 'With Longitude: sort stores by distance from this point',
				routing: { request: { body: { lat: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Longitude',
				name: 'lng',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
				description: 'With Latitude: sort stores by distance from this point',
				routing: { request: { body: { lng: '={{ $value }}' } } },
			},
			{
				displayName: 'Text Match',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'Burbank',
				description: 'Only stores whose name, city, postal code or address contains this text',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Store Stock --
	{
		displayName: 'Additional Options',
		name: 'stockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stock']),
		options: [
			{
				displayName: 'Postal Code',
				name: 'zip',
				type: 'string',
				default: '',
				placeholder: '91502',
				description: 'Adds home-delivery availability to this address',
				routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get As-Is Offers --
	{
		displayName: 'Additional Options',
		name: 'asIsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['asIs']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 24,
				typeOptions: { minValue: 1, maxValue: 48 },
				description: 'Products per page, up to 48',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
		],
	},
];
