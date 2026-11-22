import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['action'], operation, ...extra },
});

// Action (action.com, the European non-food discount store), 16 operations, 1 credit each.
// 19 storefronts in 16 countries: Country (Netherlands by default) plus a Language for Belgium
// (Dutch or French) and Switzerland (German, French or Italian). Get Reviews serves the
// Netherlands, Germany, France and Poland only; Search Webshop and Get Webshop Product serve the
// webshop (shop.action.com) in the Netherlands and Belgium only. Calls can queue behind the
// backend's upstream limit, so every operation carries a 240s timeout, like Media Expert.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const MARKET_OPS = [
	'search',
	'product',
	'products',
	'category',
	'categories',
	'brand',
	'brands',
	'newArrivals',
	'weeklyDeals',
	'collection',
	'suggestions',
	'stores',
	'store',
];
const WEBSHOP_OPS = ['webshopSearch', 'webshopProduct'];

const NAME = 'Action (action.com, the European non-food discount store)';
const PRICES =
	"Prices are numbers in the market's currency (EUR; CHF in Switzerland, PLN in Poland, CZK in Czechia, RON in Romania), never converted: price, regular_price (Action's struck-through price), unit_price, discount_percent (computed by Scavio) and price_note (e.g. the EU 30-day lowest price in Poland). Article numbers are the same in every market and prices are set per market. Titles and labels are in the storefront's language, as Action writes them. No price history: schedule a workflow to track changes.";
const ITEM =
	'items with product_code (the article number), title, URL, image, brand, price, regular_price, unit_price, discount_percent, price_note, is_new, is_deal, deal (validity label, valid_from, valid_to, Action Plus loyalty card), labels, rating and review_count';
const LIST =
	'plus total, total_pages, has_more, count and facets (category, price range, brand, new: each value is what the matching filter takes).';
const NO_STOCK = 'Action does not publish store stock.';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const COST = 'Costs 1 credit.';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'acPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 200 },
	description: 'Page, 1 to 200 (24 products a page, 23 on weekly deals; total_pages says how deep the list goes)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'acSort',
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description: "Result order (Relevance is Action's own order, the default)",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const categoryFilterOption: INodeProperties = {
	displayName: 'Department Filter',
	name: 'acCategoryFilter',
	type: 'string',
	default: '',
	placeholder: 'Hobby',
	description: "One department: a value of the category facet (in the storefront's language)",
	routing: { request: { body: { category_filter: '={{ $value || undefined }}' } } },
};

const priceRangeOption: INodeProperties = {
	displayName: 'Price Range',
	name: 'acPriceRange',
	type: 'string',
	default: '',
	placeholder: '2-5',
	description: "A price band: a value of the price_range facet (e.g. 2-5; the bands follow the market's currency)",
	routing: { request: { body: { price_range: '={{ $value || undefined }}' } } },
};

const brandFilterOption: INodeProperties = {
	displayName: 'Brand Filter',
	name: 'acBrandFilter',
	type: 'string',
	default: '',
	placeholder: 'Disney',
	description: 'One brand: a value of the brand facet',
	routing: { request: { body: { brand_filter: '={{ $value || undefined }}' } } },
};

const newOnlyOption: INodeProperties = {
	displayName: 'New Only',
	name: 'acNewOnly',
	type: 'boolean',
	default: false,
	description: "Whether to return only new products (Action's Nieuw / Neu label)",
	routing: { request: { body: { new_only: '={{ $value || undefined }}' } } },
};

const listOptions = [sortOption, pageOption, categoryFilterOption, priceRangeOption, brandFilterOption, newOnlyOption];

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

export const actionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['action'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find action stores',
				description: `The 20 ${NAME} stores nearest a city, town, postcode or point, as Action's store finder lists them (they may cross a border: each store names its country_code): store_id, name, store (for Get Store), URL, address, coordinates, distance_km (coordinates input only), opening_date, closing_date and hours (7 dated days). ${NO_STOCK} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get action brand products',
				description: `One brand's products on ${NAME} (Get Own Brands slug or a product's brand_info.slug), with sorts, paging and filters: ${ITEM}, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/action/brand'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get action categories',
				description: `${NAME}'s category tree on one market (15 departments, about 300 categories in 3 levels): category_id, name, path (for Get Category Products), URL, level, child_count and children. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get action category products',
				description: `One ${NAME} category's products by path, with filters, sorts and paging: ${ITEM}, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/action/category'),
			},
			{
				name: 'Get Collection Products',
				value: 'collection',
				action: 'Get action collection products',
				description: `One ${NAME} collection, a seasonal moment page (black-friday, kerst, sinterklaas, basics), with sorts, paging and filters: collection, collection_tag, ${ITEM}, ${LIST} An unknown slug is a charged not-found. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/collection'),
			},
			{
				name: 'Get New Arrivals',
				value: 'newArrivals',
				action: 'Get action new arrivals',
				description: `${NAME}'s new products on one market (about 200), with sorts, paging and filters: ${ITEM}, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/action/new-arrivals', true),
			},
			{
				name: 'Get Own Brands',
				value: 'brands',
				action: 'Get action own brands',
				description: `${NAME}'s own brands (about 54 private labels, e.g. Max & More, Magic Village): total_brands and brands (name, slug for Get Brand Products, URL, image). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/brands', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an action product',
				description: `One ${NAME} product in full on one market, by article number or link: the list item fields plus images, brand_info, long_description, highlights, specifications, aisle, category, sustainability, hazards, availability and related products. An article the market does not sell is a charged not-found. No EAN here (Get Webshop Product has it). ${NO_STOCK} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/product'),
			},
			{
				name: 'Get Products by Article Number',
				value: 'products',
				action: 'Get action products by article number',
				description: `Up to 60 ${NAME} article numbers priced on one market in one call: requested, count, not_sold (codes the market does not sell) and ${ITEM}. To compare an article's price across markets, run once per country. None sold: a charged not-found. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/products'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get action reviews',
				description: `Customer reviews of one ${NAME} article, up to 100 per call with offset paging, on the four storefronts where Action publishes reviews (Netherlands, Germany, France, Poland): total, local_total, international_total, has_more and reviews (review_id, language, rating, title, text, reviewed_at, recommends, aspect_ratings, pros, cons). Scope Local (default) is the reviews written on that storefront, in its language; International the other three; All both (offset + limit up to 100). No reviewer identity. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get action search suggestions',
				description: `${NAME}'s search suggestions for a partial query: suggestions (search terms), category_suggestion and up to 5 products. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an action store',
				description: `One ${NAME} store by its reference (Find Stores store), link, slug or store ID: address, coordinates, opening_date, closing_date and hours (7 dated days). No phone or services. ${NO_STOCK} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/store'),
			},
			{
				name: 'Get Webshop Product',
				value: 'webshopProduct',
				action: 'Get an action webshop product',
				description: `One ${NAME} webshop product (shop.action.com, Netherlands and Belgium) by EAN or link: EAN, product_code, price, regular_price, stock_level (online stock, not store stock), order_limit, order_minimum, order_multiple, shipping_cost, availability (status, release_date, end_date), description, specifications, supplier and other_markets. An EAN the webshop does not sell is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/webshop-product'),
			},
			{
				name: 'Get Weekly Deals',
				value: 'weeklyDeals',
				action: 'Get action weekly deals',
				description: `This week's ${NAME} deals on one market (about 130 to 190, 23 a page): week_id (e.g. Promo2026Week47), label, valid_from and valid_to (ISO dates; a deal week runs Wednesday to Tuesday and the assortment changes weekly), loyalty_deals (Belgium: Action Plus card deals) and ${ITEM}; regular_price is the price outside the deal. ${LIST} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/weekly-deals', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search action products',
				description: `Search ${NAME}, 24 products a page: ${ITEM}, ${LIST} A search with no match answers total 0. Not available: store stock (Action does not publish it), price history, leaflets, checkout. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/search'),
			},
			{
				name: 'Search Webshop',
				value: 'webshopSearch',
				action: 'Search the action webshop',
				description: `Search the ${NAME} webshop (shop.action.com, Netherlands and Belgium) or list one webshop category: total, total_pages and items (EAN, product_code, title, price, regular_price, stock_level: online stock, not store stock, stock_label, order_limit, shipping_cost, is_deal, promo_label). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/action/webshop-search'),
			},
		],
		default: 'weeklyDeals',
	},
];

export const actionFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'acCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Austria', value: 'at' },
			{ name: 'Belgium', value: 'be' },
			{ name: 'Croatia', value: 'hr' },
			{ name: 'Czechia (CZK)', value: 'cz' },
			{ name: 'France', value: 'fr' },
			{ name: 'Germany', value: 'de' },
			{ name: 'Italy', value: 'it' },
			{ name: 'Luxembourg', value: 'lu' },
			{ name: 'Netherlands', value: 'nl' },
			{ name: 'Poland (PLN)', value: 'pl' },
			{ name: 'Portugal', value: 'pt' },
			{ name: 'Romania (RON)', value: 'ro' },
			{ name: 'Slovakia', value: 'sk' },
			{ name: 'Slovenia', value: 'si' },
			{ name: 'Spain', value: 'es' },
			{ name: 'Switzerland (CHF)', value: 'ch' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description:
			"The Action storefront. Data comes in the storefront's language and prices in its currency (EUR unless marked). Article numbers are the same in every market; prices are set per market.",
	},
	{
		displayName: 'Language',
		name: 'acLanguageBe',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Dutch', value: 'nl' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(MARKET_OPS, { acCountry: ['be'] }),
		routing: { request: { body: { language: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: 'The Belgian storefront in Dutch or French',
	},
	{
		displayName: 'Language',
		name: 'acLanguageCh',
		type: 'options',
		default: 'de',
		options: [
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Italian', value: 'it' },
		],
		displayOptions: show(MARKET_OPS, { acCountry: ['ch'] }),
		routing: { request: { body: { language: '={{ $value === "de" ? undefined : $value }}' } } },
		description: 'The Swiss storefront in German, French or Italian',
	},
	{
		displayName: 'Country',
		name: 'acReviewCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'France', value: 'fr' },
			{ name: 'Germany', value: 'de' },
			{ name: 'Netherlands', value: 'nl' },
			{ name: 'Poland', value: 'pl' },
		],
		displayOptions: show(['reviews']),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: 'The storefront whose reviews to read (Action publishes reviews on these four only)',
	},
	{
		displayName: 'Country',
		name: 'acWebshopCountry',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Belgium', value: 'be' },
			{ name: 'Netherlands', value: 'nl' },
		],
		displayOptions: show(WEBSHOP_OPS),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: 'The Action webshop (shop.action.com) serves the Netherlands and Belgium only',
	},
	{
		displayName: 'Language',
		name: 'acWebshopLanguage',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Dutch', value: 'nl' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(WEBSHOP_OPS, { acWebshopCountry: ['be'] }),
		routing: { request: { body: { language: '={{ $value === "nl" ? undefined : $value }}' } } },
		description: 'The Belgian webshop in Dutch or French',
	},

	// -- Search Products, Get Search Suggestions --
	{
		displayName: 'Keyword',
		name: 'acQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'kerst',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "Search text (the storefront's language works best: kerst, weihnachten, noel, opbergbox)",
	},
	{
		displayName: 'Partial Query',
		name: 'acSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'opberg',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'acProductBy',
		type: 'options',
		default: 'code',
		options: [
			{ name: 'Article Number', value: 'code' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the product',
	},
	{
		displayName: 'Article Number',
		name: 'acProductCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3225277',
		displayOptions: show(['product'], { acProductBy: ['code'] }),
		routing: { request: { body: { product_code: '={{ $value }}' } } },
		description: 'Action article number (items[].product_code, 7 digits, the same in every market)',
	},
	{
		displayName: 'Product URL',
		name: 'acProductUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.action.com/nl-nl/p/3225277/...',
		displayOptions: show(['product'], { acProductBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'An action.com product link (its market is used)',
	},

	// -- Get Products by Article Number --
	{
		displayName: 'Article Numbers',
		name: 'acProductCodes',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3225277, 3011615, 3225488',
		displayOptions: show(['products']),
		routing: { request: { body: { product_codes: SPLIT } } },
		description: '1 to 60 Action article numbers, separated by commas',
	},

	// -- Get Category Products, Get Brand Products, Get Collection Products --
	{
		displayName: 'Category Path',
		name: 'acCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'wonen/woonaccessoires',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A category path from Get Categories (path), or its action.com category link',
	},
	{
		displayName: 'Brand',
		name: 'acBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'max-more',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: "A brand slug from Get Own Brands (slug) or a product's brand_info.slug, or its action.com brand link",
	},
	{
		displayName: 'Collection',
		name: 'acCollection',
		type: 'string',
		required: true,
		default: 'black-friday',
		placeholder: 'black-friday',
		displayOptions: show(['collection']),
		routing: { request: { body: { collection: '={{ $value }}' } } },
		description: 'A collection (seasonal moment page) slug: black-friday, kerst, sinterklaas, basics, or its action.com moment link',
	},

	// -- Find Stores --
	{
		displayName: 'Stores Near',
		name: 'acStoresBy',
		type: 'options',
		default: 'place',
		options: [
			{ name: 'City, Town or Postcode', value: 'place' },
			{ name: 'Coordinates', value: 'point' },
		],
		displayOptions: show(['stores']),
		description: 'Find the 20 nearest stores to a place or to coordinates (coordinates add distance_km)',
	},
	{
		displayName: 'Place',
		name: 'acStoresQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Amsterdam',
		displayOptions: show(['stores'], { acStoresBy: ['place'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'A city, town or postcode',
	},
	{
		displayName: 'Latitude',
		name: 'acLat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { acStoresBy: ['point'] }),
		routing: { request: { body: { lat: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: 'acLng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { acStoresBy: ['point'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
	},

	// -- Get Store --
	{
		displayName: 'Store By',
		name: 'acStoreBy',
		type: 'options',
		default: 'store',
		options: [
			{ name: 'Store Reference, Link or Slug', value: 'store' },
			{ name: 'Store ID', value: 'id' },
		],
		displayOptions: show(['store']),
		description: 'How to identify the store',
	},
	{
		displayName: 'Store',
		name: 'acStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/nl-nl/winkels/amsterdam-kinkerstraat/',
		displayOptions: show(['store'], { acStoreBy: ['store'] }),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: "The store of a Find Stores response, the store's action.com link, or its slug with Country",
	},
	{
		displayName: 'Store ID',
		name: 'acStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1260',
		displayOptions: show(['store'], { acStoreBy: ['id'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'An Action store ID (Find Stores store_id, e.g. 1260 or 3A11)',
	},

	// -- Get Reviews --
	{
		displayName: 'Article Number',
		name: 'acReviewCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3224838',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_code: '={{ $value }}' } } },
		description: 'Action article number (items[].product_code)',
	},

	// -- Search Webshop --
	{
		displayName: 'Search By',
		name: 'acWebshopBy',
		type: 'options',
		default: 'query',
		options: [
			{ name: 'Keyword', value: 'query' },
			{ name: 'Webshop Category', value: 'category' },
		],
		displayOptions: show(['webshopSearch']),
		description: 'Search the webshop or list one of its categories',
	},
	{
		displayName: 'Keyword',
		name: 'acWebshopQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'stofzuiger',
		displayOptions: show(['webshopSearch'], { acWebshopBy: ['query'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search text',
	},
	{
		displayName: 'Webshop Category',
		name: 'acWebshopCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'alle-tijdelijke-deals',
		displayOptions: show(['webshopSearch'], { acWebshopBy: ['category'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A webshop category slug (the part after /c/ in a shop.action.com link)',
	},

	// -- Get Webshop Product --
	{
		displayName: 'Product By',
		name: 'acWebshopProductBy',
		type: 'options',
		default: 'ean',
		options: [
			{ name: 'EAN', value: 'ean' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['webshopProduct']),
		description: 'How to identify the webshop product',
	},
	{
		displayName: 'EAN',
		name: 'acEan',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8718969571098',
		displayOptions: show(['webshopProduct'], { acWebshopProductBy: ['ean'] }),
		routing: { request: { body: { ean: '={{ $value }}' } } },
		description: "The product's EAN (Search Webshop items[].ean)",
	},
	{
		displayName: 'Product URL',
		name: 'acWebshopUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://shop.action.com/nl-nl/p/...',
		displayOptions: show(['webshopProduct'], { acWebshopProductBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A shop.action.com product link',
	},

	// -- Additional Options --
	listCollection('acSearchOptions', 'search', listOptions),
	listCollection('acCategoryOptions', 'category', listOptions),
	listCollection('acBrandOptions', 'brand', listOptions.filter((o) => o.name !== 'acBrandFilter')),
	listCollection('acNewOptions', 'newArrivals', listOptions.filter((o) => o.name !== 'acNewOnly')),
	listCollection('acWeeklyOptions', 'weeklyDeals', listOptions),
	listCollection('acCollectionOptions', 'collection', listOptions),
	{
		displayName: 'Additional Options',
		name: 'acCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Depth',
				name: 'acDepth',
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
		name: 'acBrandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands']),
		options: [
			{
				displayName: 'Name Contains',
				name: 'acBrandQuery',
				type: 'string',
				default: '',
				placeholder: 'max',
				description: 'Only brands whose name contains this text',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'acReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Mentions',
				name: 'acReviewQuery',
				type: 'string',
				default: '',
				description: 'Only reviews that mention this text',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Offset',
				name: 'acReviewOffset',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Reviews to skip (paging)',
				routing: { request: { body: { offset: '={{ $value === 0 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Per Call',
				name: 'acReviewLimit',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews per call, 1 to 100 (with Scope All, offset + this must be at most 100)',
				routing: { request: { body: { limit: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Ratings',
				name: 'acReviewRating',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with these star ratings',
				routing: {
					request: { body: { rating: '={{ $value && $value.length ? $value : undefined }}' } },
				},
			},
			{
				displayName: 'Scope',
				name: 'acReviewScope',
				type: 'options',
				default: 'local',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'International', value: 'international' },
					{ name: 'Local', value: 'local' },
				],
				description: "Local (default): reviews written on this storefront, in its language. International: the reviews written on the other three. All: both.",
				routing: { request: { body: { scope: '={{ $value === "local" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'acReviewSort',
				type: 'options',
				default: 'relevant',
				options: [
					{ name: 'Highest Rating', value: 'highest' },
					{ name: 'Lowest Rating', value: 'lowest' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Relevant', value: 'relevant' },
				],
				description: "Review order (Relevant is Action's own order, the default)",
				routing: { request: { body: { sort: '={{ $value === "relevant" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'acWebshopOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['webshopSearch']),
		options: [
			{
				displayName: 'Page',
				name: 'acWebshopPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page of results',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
];
