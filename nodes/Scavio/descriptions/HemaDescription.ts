import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['hema'], operation, ...extra },
});

// HEMA (hema.com, the Dutch variety store), 13 operations, 1 credit each.
// Webshops: Netherlands (default), Belgium (Dutch or French), France and Germany. HEMA also has
// stores in Luxembourg and Austria: only Get Store Stock, Find Stores and Get Store serve them.
// Get Sale serves the Netherlands, Belgium and Germany; Get Weekly Offers the Netherlands and
// Belgium. Reviews take 15 to 70 s and calls can queue behind the backend's upstream limit, so
// every operation carries a 240s timeout, like Action.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const MARKET_OPS = ['search', 'product', 'category', 'categories', 'newArrivals', 'campaign', 'suggestions', 'reviews'];
const STORE_OPS = ['storeStock', 'stores'];
const LOCATION_OPS = ['storeStock', 'stores'];

const NAME = 'HEMA (hema.com, the Dutch variety store)';
const PRICES =
	"Prices are numbers in EUR: price, was_price (HEMA's struck-through price), price_from (a from-price across sizes or colours), discount_percent (computed by Scavio from was_price) and promotion (HEMA's promotion text as it writes it, e.g. 2+1 gratis). Article numbers are the same in every market and prices are set per market; HEMA notes that online prices can differ from store prices. Names and labels are in the market's language, as HEMA writes them. No price history: schedule a workflow to track changes.";
const ITEM =
	'items with sku (the article number), name, URL, image, price, was_price, price_from, discount_percent, promotion, labels, product_type, colour, sizes, stock_status, online stock flags and rating';
const LIST =
	'plus redirected_to, list_type, total, total_pages, has_more, count and facets (each facet key and value is what Filters takes).';
const STOCK =
	"per store the sellable units HEMA's store service reports and the stock level (full, regular or limited), shelf locations, address, hours and distance. Stock as HEMA reports it, not a promise that the shelf has it.";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const COST = 'Costs 1 credit.';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'hemaPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Page, 1 to 100 (24 products a page; total_pages says how deep the list goes)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'hemaSort',
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Best Selling', value: 'best_selling' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description:
		"Result order (Relevance is HEMA's own order, the default). A from-price tile is placed by one of its variants' prices, so a price sort is not always strictly ordered by the price shown.",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'hemaFilters',
	type: 'json',
	default: '',
	placeholder: '{ "maincolour": "zwart" }',
	description:
		"Up to 6 facets: { facet: value or [values] }, with keys and values from an earlier response's facets list (e.g. size, maincolour, producttype; values in the market's language)",
	routing: {
		request: {
			body: {
				filters: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
			},
		},
	},
};

const newOnlyOption: INodeProperties = {
	displayName: 'New Only',
	name: 'hemaNewOnly',
	type: 'boolean',
	default: false,
	description: "Whether to return only HEMA's new collection",
	routing: { request: { body: { new_only: '={{ $value || undefined }}' } } },
};

const priceMinOption: INodeProperties = {
	displayName: 'Min Price',
	name: 'hemaPriceMin',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Lowest price, EUR',
	routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
};

const priceMaxOption: INodeProperties = {
	displayName: 'Max Price',
	name: 'hemaPriceMax',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Highest price, EUR',
	routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
};

const listOptions = [sortOption, pageOption, filtersOption, newOnlyOption, priceMinOption, priceMaxOption];

const radiusOption: INodeProperties = {
	displayName: 'Radius (Km)',
	name: 'hemaRadius',
	type: 'number',
	default: 50,
	typeOptions: { minValue: 1, maxValue: 300 },
	description: "Search radius around the place in km (50 by default, as HEMA's site uses)",
	routing: { request: { body: { radius_km: '={{ $value === 50 ? undefined : $value }}' } } },
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

const belgianLanguage = (name: string, operations: string[], countryField: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'nl',
	options: [
		{ name: 'Dutch', value: 'nl' },
		{ name: 'French', value: 'fr' },
	],
	displayOptions: show(operations, { [countryField]: ['be'] }),
	routing: { request: { body: { language: '={{ $value === "nl" ? undefined : $value }}' } } },
	description: 'The Belgian webshop in Dutch or French',
});

export const hemaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['hema'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find hema stores',
				description: `${NAME} stores of one country (about 570 in the Netherlands, 111 Belgium, 69 France, 17 Germany, 5 Austria, 4 Luxembourg), or the ones near a city, postcode or coordinates: store_id (for Get Store), name, status, operator, address, coordinates, distance_km, phone, hours, special_hours, closed_dates and services. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hema/stores', true),
			},
			{
				name: 'Get Campaign Products',
				value: 'campaign',
				action: 'Get hema campaign products',
				description: `A ${NAME} campaign page with its products and promotion texts: christmas (every market), sinterklaas (Netherlands and Belgium) or a campaign slug: campaign, slug, ${ITEM}, carousels, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/campaign'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get hema categories',
				description: `${NAME}'s category menu on one market (13 to 18 departments, 3 levels): name, path (for Get Category Products), URL, level, child_count and children. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hema/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get hema category products',
				description: `One ${NAME} category's products by path or link, with filters, sorts and paging: ${ITEM}, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/category'),
			},
			{
				name: 'Get New Arrivals',
				value: 'newArrivals',
				action: 'Get hema new arrivals',
				description: `${NAME}'s new collection on one market (about 550 to 1,100 products), with sorts, paging and filters: ${ITEM}, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/new-arrivals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a hema product',
				description: `One ${NAME} product in full on one market, by article number or link: EAN, description, specifications, colour / size variants with stock flags, price, was_price, unit_price, promotion (label, valid_from, valid_to), price_schedule (HEMA's dated prices, upcoming promotions included), online_stock, sellable_in_store and order_limit. An article number HEMA does not have is a charged not-found. ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get hema reviews',
				description: `Customer reviews of one ${NAME} article, from HEMA's own product reviews, pages 1 to 5 (8, then 30 more a page): review_pool (the Netherlands, France and Germany read the shared Dutch pool; Belgium its own), total_text_reviews, total_ratings, average_rating, rating_distribution and reviews (review_id, language, rating, title, text, submitted_at, recommends, verified_purchaser). No reviewer identity. Slower than the other operations (15 to 70 s). ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/reviews'),
			},
			{
				name: 'Get Sale Products',
				value: 'sale',
				action: 'Get hema sale products',
				description: `${NAME}'s sale page (Netherlands) or outlet page (Belgium, Germany), with sorts, paging and filters: ${ITEM}, ${LIST} France has no sale page. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hema/sale', true),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get hema search suggestions',
				description: `${NAME}'s search suggestions for a partial query: phrases, categories, up to 5 products, terms and content links. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hema/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a hema store',
				description: `One ${NAME} store by ID, in any HEMA country: address, coordinates, phone, hours, special hours, services and status, plus one article's stock (sellable units, stock level, shelf locations) when an article number is given. An unknown store ID is a charged not-found. ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get hema store stock',
				description: `HEMA store stock: up to 12 ${NAME} articles in the stores near a city, postcode or coordinates (or across a country) in the Netherlands, Belgium, France, Germany, Luxembourg and Austria: summary (stores with stock per article) and ${STOCK} Pair it with Get Product for the article's dated promotion. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/hema/store-stock'),
			},
			{
				name: 'Get Weekly Offers',
				value: 'offers',
				action: 'Get hema weekly offers',
				description: `${NAME}'s weekly offers page (Netherlands, Belgium): label (HEMA's validity text as shown, e.g. geldig t/m 22 november), valid_to (ISO date), week (HEMA's offer week) and sections of promotion cards with the category path of each promotion's product list (for Get Category Products). The page lists promotion cards, not products. ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/offers', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search hema products',
				description: `Search ${NAME}, 24 products a page: ${ITEM}, ${LIST} A keyword HEMA sends to a landing page (e.g. kerst) comes back as that page's carousels. Not available: price history, brands (HEMA sells its own brand), checkout, the photo service and cake ordering. ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/hema/search'),
			},
		],
		default: 'storeStock',
	},
];

export const hemaFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'hemaCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Belgium', value: 'be' },
			{ name: 'France', value: 'fr' },
			{ name: 'Germany', value: 'de' },
			{ name: 'Netherlands', value: 'nl' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description:
			"The HEMA webshop. Data comes in the market's language and prices in EUR. Article numbers are the same in every market; prices are set per market.",
	},
	belgianLanguage('hemaLanguage', MARKET_OPS, 'hemaCountry'),
	{
		displayName: 'Country',
		name: 'hemaStoreCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Austria', value: 'at' },
			{ name: 'Belgium', value: 'be' },
			{ name: 'France', value: 'fr' },
			{ name: 'Germany', value: 'de' },
			{ name: 'Luxembourg', value: 'lu' },
			{ name: 'Netherlands', value: 'nl' },
		],
		displayOptions: show(STORE_OPS),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: 'Every country with HEMA stores',
	},
	belgianLanguage('hemaStoreLanguage', STORE_OPS, 'hemaStoreCountry'),
	{
		displayName: 'Country',
		name: 'hemaSaleCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Belgium (Outlet)', value: 'be' },
			{ name: 'Germany (Outlet)', value: 'de' },
			{ name: 'Netherlands (Sale)', value: 'nl' },
		],
		displayOptions: show(['sale']),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: 'HEMA has a sale page in the Netherlands and an outlet page in Belgium and Germany; France has none',
	},
	belgianLanguage('hemaSaleLanguage', ['sale'], 'hemaSaleCountry'),
	{
		displayName: 'Country',
		name: 'hemaOffersCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Belgium', value: 'be' },
			{ name: 'Netherlands', value: 'nl' },
		],
		displayOptions: show(['offers']),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: "The two markets with HEMA's weekly offers page",
	},
	belgianLanguage('hemaOffersLanguage', ['offers'], 'hemaOffersCountry'),

	// -- Search Products, Get Search Suggestions --
	{
		displayName: 'Keyword',
		name: 'hemaQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sokken',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "Search text (the market's language works best: sokken, kaars, bougie, Kerze)",
	},
	{
		displayName: 'Partial Query',
		name: 'hemaSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'kerst',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'hemaProductBy',
		type: 'options',
		default: 'sku',
		options: [
			{ name: 'Article Number', value: 'sku' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the product',
	},
	{
		displayName: 'Article Number',
		name: 'hemaSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '15300147',
		displayOptions: show(['product'], { hemaProductBy: ['sku'] }),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: 'HEMA article number (items[].sku, 6 to 8 digits, the same in every market)',
	},
	{
		displayName: 'Product URL',
		name: 'hemaProductUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.hema.nl/...-15300147.html',
		displayOptions: show(['product'], { hemaProductBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A HEMA product link (its market is used)',
	},

	// -- Get Category Products, Get Campaign Products --
	{
		displayName: 'Category Path',
		name: 'hemaCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'baby/babykleding',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A category path from Get Categories (path) or Get Weekly Offers (category), or its HEMA link',
	},
	{
		displayName: 'Campaign',
		name: 'hemaCampaign',
		type: 'string',
		required: true,
		default: 'christmas',
		placeholder: 'christmas',
		displayOptions: show(['campaign']),
		routing: { request: { body: { campaign: '={{ $value }}' } } },
		description: 'A campaign: christmas (every market), sinterklaas (Netherlands and Belgium), a campaign slug (kerst, noel, weihnachten, saint-nicolas) or its HEMA link',
	},

	// -- Get Store Stock --
	{
		displayName: 'Article Numbers',
		name: 'hemaSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '15300147, 10860090',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { skus: SPLIT } } },
		description: '1 to 12 HEMA article numbers of one size and colour, separated by commas',
	},

	// -- Get Store Stock, Find Stores --
	{
		displayName: 'Stores Near',
		name: 'hemaStoresBy',
		type: 'options',
		default: 'place',
		options: [
			{ name: 'City, Town or Postcode', value: 'place' },
			{ name: 'Coordinates', value: 'point' },
			{ name: 'Whole Country', value: 'country' },
		],
		displayOptions: show(LOCATION_OPS),
		description: 'Stores near a place or coordinates, or every store of the country',
	},
	{
		displayName: 'Place',
		name: 'hemaPlace',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Utrecht',
		displayOptions: show(LOCATION_OPS, { hemaStoresBy: ['place'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "A city, town or postcode (HEMA's own store finder places it; a place it cannot find is a charged not-found)",
	},
	{
		displayName: 'Latitude',
		name: 'hemaLat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(LOCATION_OPS, { hemaStoresBy: ['point'] }),
		routing: { request: { body: { lat: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: 'hemaLng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(LOCATION_OPS, { hemaStoresBy: ['point'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
	},

	// -- Get Store --
	{
		displayName: 'Store ID',
		name: 'hemaStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0013',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A HEMA store ID (Find Stores store_id, up to 4 digits)',
	},
	{
		displayName: 'Article Number',
		name: 'hemaStoreSku',
		type: 'string',
		default: '',
		placeholder: '15300147',
		displayOptions: show(['store']),
		routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
		description: "Optional: adds that article's stock in this store",
	},

	// -- Get Reviews --
	{
		displayName: 'Article Number',
		name: 'hemaReviewSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10860090',
		displayOptions: show(['reviews']),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: 'HEMA article number (items[].sku)',
	},

	// -- Additional Options --
	listCollection('hemaSearchOptions', 'search', listOptions),
	listCollection('hemaCategoryOptions', 'category', listOptions),
	listCollection('hemaNewOptions', 'newArrivals', listOptions.filter((o) => o.name !== 'hemaNewOnly')),
	listCollection('hemaSaleOptions', 'sale', listOptions),
	{
		displayName: 'Additional Options',
		name: 'hemaCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Depth',
				name: 'hemaDepth',
				type: 'number',
				default: 3,
				typeOptions: { minValue: 1, maxValue: 3 },
				description: 'Levels to return, 1 to 3',
				routing: { request: { body: { depth: '={{ $value === 3 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'hemaStockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeStock']),
		options: sorted([
			{
				displayName: 'In Stock Only',
				name: 'hemaInStockOnly',
				type: 'boolean',
				default: false,
				description: 'Whether to return only stores that hold at least one of the articles',
				routing: { request: { body: { in_stock_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'hemaStockLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			{ ...radiusOption, name: 'hemaStockRadius' },
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'hemaStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			{
				displayName: 'Limit',
				name: 'hemaStoresLimit',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Max number of results to return (by default 20 near a place, every store of the country without one)',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{ ...radiusOption, name: 'hemaStoresRadius' },
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'hemaReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'hemaReviewPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: '1 = the first 8 reviews, each later page the next 30, up to 5',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'hemaReviewSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest' },
					{ name: 'Newest', value: 'newest' },
				],
				description: 'Review order (Newest by default)',
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
		]),
	},
];
