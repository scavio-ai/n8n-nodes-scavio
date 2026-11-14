import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['maisonsDuMonde'], operation, ...extra },
});

// Maisons du Monde, 9 operations, 1 credit each. Markets: France, Belgium (French or Dutch),
// Luxembourg, the Netherlands, Germany, Spain, Italy, Portugal (EUR) and Switzerland (French,
// German or Italian; CHF). Find Stores, Get Store and Get Store Stock serve every market but the
// Netherlands and Luxembourg; Get Seller and the seller filters serve the marketplace markets
// France, Germany, Spain and Italy. Some operations make two upstream requests, so every
// operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ALL_OPS = ['search', 'product', 'category', 'deals', 'reviews'];
const STORE_OPS = ['stores', 'store', 'availability'];
const SELLER_OPS = ['seller'];
const GRID_OPS = ['search', 'category', 'deals'];

const PRICES =
	"Prices are in the market's currency, never converted, and can differ by market: measured on 2026-11-14 on about 170 discounted sofas, Belgium differed from France on 19 while the other euro markets matched, and Switzerland is priced separately in CHF. Read each market you report. was_price is the crossed-out price shown next to a discount. Maisons du Monde shows no 30-day lowest price and no price history.";
const GRID =
	'40 items per page: count, sponsored_count, total (exact), page, total_pages, sort, facets and items with ID, name, collection, brand, URL, image, price, was_price, discount_percent, eco_participation (France), badges, rating, review_count, sold_by (mdm or marketplace), sponsored and condition.';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const BELGIUM = { name: 'Belgium', value: 'be' };
const FRANCE = { name: 'France', value: 'fr' };
const GERMANY = { name: 'Germany', value: 'de' };
const ITALY = { name: 'Italy', value: 'it' };
const LUXEMBOURG = { name: 'Luxembourg', value: 'lu' };
const NETHERLANDS = { name: 'Netherlands', value: 'nl' };
const PORTUGAL = { name: 'Portugal', value: 'pt' };
const SPAIN = { name: 'Spain', value: 'es' };
const SWITZERLAND = { name: 'Switzerland (CHF)', value: 'ch' };

const countryField = (
	markets: Array<{ name: string; value: string }>,
	operations: string[],
	description: string,
): INodeProperties => ({
	displayName: 'Country',
	name: 'country',
	type: 'options',
	default: 'fr',
	options: markets,
	displayOptions: show(operations),
	routing: { request: { body: { country: '={{ $value === "fr" ? undefined : $value }}' } } },
	description,
});

const sortOption = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'relevance',
	options: [
		{ name: 'Customer Rating', value: 'rating' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description:
		'Result order. The German site does not sort keyword results (Search Products on Germany comes back in relevance order with a note).',
	routing: {
		request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
	},
};

const pageOption = {
	displayName: 'Page',
	name: 'page',
	type: 'number' as const,
	default: 1,
	typeOptions: { minValue: 1, maxValue: 250 },
	description: 'Results page, 1-based (40 per page)',
	routing: { request: { body: { page: '={{ $value }}' } } },
};

const facetIds = (displayName: string, name: string, facet: string) => ({
	displayName,
	name,
	type: 'string' as const,
	default: '',
	description: `1 to 5 ${displayName.toLowerCase()} option IDs (facet ${facet} of a previous response), comma-separated`,
	routing: { request: { body: { [name]: SPLIT } } },
});

export const maisonsDuMondeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['maisonsDuMonde'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find maisons du monde stores',
				description: `Up to 10 Maisons du Monde stores nearest a postcode: ID, name, address, postcode, city, lat, lng, distance_km, URL, open_now, hours and click_collect. Use Get Store for the phone and services and Get Store Stock for an item's stock. ${CHARGE} Not on the Netherlands or Luxembourg. Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/stores'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get maisons du monde category products',
				description: `One category's products by category hash or URL (the hash is the same on every market), with the search sorts and filters. Returns category (ID, name, URL, breadcrumbs) and ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get maisons du monde deals',
				description: `Black Friday (every market while it runs), Seconde Chance (France: used and returned items) or one category's discounted items, with the search sorts and filters. Returns event (type, name, URL, category_id) and ${GRID} ${PRICES} An event that is not running is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a maisons du monde product',
				description: `One product by reference or product URL: gtin13, price, was_price, discount_percent, eco_participation (France), badges, stock (status and online quantity), sold_by, seller (marketplace items), variants, dimensions, weight, materials, made_in, composition, assembly, care, documents, images, breadcrumbs, description, rating, review_count, review_summary, questions and markets (the same product's URL on every other market). ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get maisons du monde reviews',
				description: `A product's customer reviews, pooled across every Maisons du Monde market and shown translated into the request language: rating, review_count, rating_histogram, criteria and reviews (rating, text, date, author, country, source_market, criteria scores, brand_reply, images), plus next_cursor for the next page. No star filter. A product with no reviews is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/reviews'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a maisons du monde marketplace seller',
				description: `A marketplace seller by ID or URL: seller (ID, name, code, rating, review_count, orders, member_since, order_approval, shipping, returns, description) plus the seller's catalog as a grid: ${GRID} ${PRICES} ${CHARGE} France, Germany, Spain and Italy only. Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/seller'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a maisons du monde store',
				description: `One store by ID or store page URL: address, postcode, city, phone, lat, lng, URL, hours (every day of the week), services, click_collect and hours_today. ${CHARGE} Not on the Netherlands or Luxembourg. Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'availability',
				action: 'Get maisons du monde store stock',
				description: `One item's stock at one store plus the delivery options: in_stock, quantity, stock_text, display_model, click_collect, on_shelf and delivery (home, store_pickup, in_store with from_price). Home delivery is a from-price per product and market (no postcode-exact cost). Maisons du Monde items only (marketplace items are not stocked in stores). ${CHARGE} Not on the Netherlands or Luxembourg. Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search maisons du monde products',
				description: `Search Maisons du Monde by keyword, sorted by price or rating and filtered by price, discount, stock, rating, color, material, style, brand, seller or any facet. A keyword that names a category answers that category (redirected_to). Returns ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/maisonsdumonde/search'),
			},
		],
		default: 'search',
	},
];

export const maisonsDuMondeFields: INodeProperties[] = [
	// -- Market --
	countryField(
		[BELGIUM, FRANCE, GERMANY, ITALY, LUXEMBOURG, NETHERLANDS, PORTUGAL, SPAIN, SWITZERLAND],
		ALL_OPS,
		"The Maisons du Monde market. Data comes in the market's language and prices in its currency (EUR, or CHF in Switzerland). Maisons du Monde closed its Austrian store in 2026 and its UK business in 2023.",
	),
	countryField(
		[BELGIUM, FRANCE, GERMANY, ITALY, PORTUGAL, SPAIN, SWITZERLAND],
		STORE_OPS,
		'The Maisons du Monde market (the store finder answers no stores in the Netherlands or Luxembourg)',
	),
	countryField(
		[FRANCE, GERMANY, ITALY, SPAIN],
		SELLER_OPS,
		'The Maisons du Monde market (marketplace sellers exist in France, Germany, Spain and Italy only)',
	),
	{
		displayName: 'Language',
		name: 'languageBe',
		type: 'options',
		default: 'fr',
		options: [
			{ name: 'Dutch', value: 'nl' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show([...ALL_OPS, ...STORE_OPS], { country: ['be'] }),
		routing: { request: { body: { language: '={{ $value === "fr" ? undefined : $value }}' } } },
		description: 'The Belgian site in French or Dutch',
	},
	{
		displayName: 'Language',
		name: 'languageCh',
		type: 'options',
		default: 'fr',
		options: [
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Italian', value: 'it' },
		],
		displayOptions: show([...ALL_OPS, ...STORE_OPS], { country: ['ch'] }),
		routing: { request: { body: { language: '={{ $value === "fr" ? undefined : $value }}' } } },
		description: 'The Swiss site in French, German or Italian',
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'table',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "Search keywords, in the market's language (e.g. table in France, couchtisch in Germany)",
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Product ID', value: 'id' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'Read a product by its reference or by its product page link',
	},
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '186339',
		displayOptions: show(['product'], { productBy: ['id'] }),
		routing: { request: { body: { id: '={{ $value }}' } } },
		description:
			'A product reference (items[].ID): digits for Maisons du Monde items, M + digits for marketplace items (e.g. M24132196)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.maisonsdumonde.com/FR/fr/p/x-186339.htm',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'A product page of any market; its market and language are used unless Country is set to another market',
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'categoryBy',
		type: 'options',
		default: 'hash',
		options: [
			{ name: 'Category Hash', value: 'hash' },
			{ name: 'Category URL', value: 'url' },
		],
		displayOptions: show(['category']),
		description: 'Read a category by its hash or by its category page link',
	},
	{
		displayName: 'Category Hash',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'canapes-n4dc562d7bb509362a3a2102db4cbf90b6454f1f',
		displayOptions: show(['category'], { categoryBy: ['hash'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'The end of a /c/ category URL (the same on every market), optionally with its name, or redirected_to.category_id of a search',
	},
	{
		displayName: 'Category URL',
		name: 'category_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.maisonsdumonde.com/FR/fr/c/canapes-n4dc562d7bb509362a3a2102db4cbf90b6454f1f',
		displayOptions: show(['category'], { categoryBy: ['url'] }),
		routing: { request: { body: { category_url: '={{ $value }}' } } },
		description: 'A category page of any market; filters in it are kept',
	},

	// -- Get Deals --
	{
		displayName: 'Deals',
		name: 'event',
		type: 'options',
		default: 'black_friday',
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Category Discounts', value: 'category' },
			{ name: 'Seconde Chance (France)', value: 'second_chance' },
		],
		displayOptions: show(['deals']),
		routing: {
			request: {
				body: { event: '={{ $value === "second_chance" ? $value : undefined }}' },
			},
		},
		description:
			"Black Friday (every market while it runs), Seconde Chance (France: used and returned items) or one category's discounted items",
	},
	{
		displayName: 'Category Hash',
		name: 'dealsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'canapes-n4dc562d7bb509362a3a2102db4cbf90b6454f1f',
		displayOptions: show(['deals'], { event: ['category'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'The category whose discounted items to list (the end of a /c/ URL, the same on every market). Add Minimum Discount for a deeper cut.',
	},

	// -- Additional Options: Search Products, Get Category Products, Get Deals --
	{
		displayName: 'Additional Options',
		name: 'gridOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(GRID_OPS),
		options: [
			facetIds('Brand', 'brand', 'bra'),
			facetIds('Color', 'color', 'c'),
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'json',
				default: '{}',
				description:
					'Any other facet of a previous response: facets[].ID to options[].ID values, e.g. {"nbs": ["CAPACITY_2_places"]}; dimension ranges (dd, dh, dw) as "min-max" in cm',
				routing: {
					request: {
						body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
					},
				},
			},
			{
				displayName: 'In Stock Only',
				name: 'in_stock',
				type: 'boolean',
				default: false,
				description: 'Whether to return only items in stock online',
				routing: { request: { body: { in_stock: '={{ $value || undefined }}' } } },
			},
			facetIds('Material', 'material', 'f'),
			{
				displayName: 'Maximum Price',
				name: 'price_max',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: "Highest price, in the market's currency",
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Discount',
				name: 'min_discount',
				type: 'options',
				default: 0,
				options: [
					{ name: '20% Off or More', value: 20 },
					{ name: '30% Off or More', value: 30 },
					{ name: '40% Off or More', value: 40 },
					{ name: '50% Off or More', value: 50 },
					{ name: 'Any', value: 0 },
				],
				description: 'Only items at least this many percent off',
				routing: { request: { body: { min_discount: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Price',
				name: 'price_min',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: "Lowest price, in the market's currency",
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Rating',
				name: 'min_rating',
				type: 'options',
				default: 0,
				options: [
					{ name: '3 Stars and Up', value: 3 },
					{ name: '4 Stars and Up', value: 4 },
					{ name: '5 Stars Only', value: 5 },
					{ name: 'Any', value: 0 },
				],
				description: 'Customer rating',
				routing: { request: { body: { min_rating: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description: 'Whether to return only discounted items',
				routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
			},
			pageOption,
			{
				displayName: 'Seller Code',
				name: 'seller',
				type: 'string',
				default: '',
				placeholder: 'BESTMOBILIER',
				description:
					"One marketplace seller's items: seller.code from Get Seller or a Seller facet (se) option ID. France, Germany, Spain and Italy only.",
				routing: { request: { body: { seller: '={{ $value || undefined }}' } } },
			},
			{
				// Maisons du Monde is the retailer's brand name; title case would misspell it.
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
				displayName: 'Sold by Maisons du Monde Only',
				name: 'sold_by',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only items sold by Maisons du Monde itself, not marketplace sellers (France, Germany, Spain and Italy; elsewhere every item is)',
				routing: { request: { body: { sold_by: '={{ $value ? "mdm" : undefined }}' } } },
			},
			sortOption,
			facetIds('Style', 'style', 'st'),
		],
	},

	// -- Get Reviews --
	{
		displayName: 'Product ID',
		name: 'reviewProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '186339',
		displayOptions: show(['reviews']),
		routing: { request: { body: { id: '={{ $value }}' } } },
		description: 'A Maisons du Monde product reference (marketplace items have no listed reviews)',
	},
	{
		displayName: 'Additional Options',
		name: 'reviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'The next_cursor of the previous response, for the next page (keep the same sort)',
				routing: { request: { body: { cursor: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Reviews Per Page',
				name: 'reviewsPerPage',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Reviews per page, 1 to 30',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Rating: High to Low', value: 'rating_desc' },
					{ name: 'Rating: Low to High', value: 'rating_asc' },
				],
				description: 'Review order (the site has no star filter)',
				routing: {
					request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } },
				},
			},
		],
	},

	// -- Find Stores --
	{
		displayName: 'Postcode',
		name: 'postcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75011',
		displayOptions: show(['stores']),
		routing: { request: { body: { postcode: '={{ $value }}' } } },
		description:
			'A postcode of the market: 5 digits in France, Germany, Spain and Italy, 4 in Belgium and Switzerland, 1000-001 in Portugal',
	},
	{
		displayName: 'Number of Stores',
		name: 'storeCount',
		type: 'number',
		default: 10,
		typeOptions: { minValue: 1, maxValue: 10 },
		displayOptions: show(['stores']),
		routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
		description: 'Stores to return, nearest first (1 to 10)',
	},

	// -- Get Store --
	{
		displayName: 'Store By',
		name: 'storeBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Store ID', value: 'id' },
			{ name: 'Store URL', value: 'url' },
		],
		displayOptions: show(['store']),
		description: 'Read a store by its ID from Find Stores or by its store page link',
	},
	{
		displayName: 'Store ID',
		name: 'storeId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '41',
		displayOptions: show(['store'], { storeBy: ['id'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A store ID from Find Stores (stores[].ID) of the market in Country',
	},
	{
		displayName: 'Store URL',
		name: 'storeUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['store'], { storeBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A store page (the store link Find Stores returns)',
	},

	// -- Get Store Stock --
	{
		displayName: 'Item ID',
		name: 'stockItemId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '204172',
		displayOptions: show(['availability']),
		routing: { request: { body: { id: '={{ $value }}' } } },
		description: 'A Maisons du Monde item reference (digits; marketplace items are not stocked in stores)',
	},
	{
		displayName: 'Store ID',
		name: 'stockStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '125',
		displayOptions: show(['availability']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A store ID from Find Stores (stores[].ID)',
	},

	// -- Get Seller --
	{
		displayName: 'Seller By',
		name: 'sellerBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Seller ID', value: 'id' },
			{ name: 'Seller URL', value: 'url' },
		],
		displayOptions: show(['seller']),
		description: "Read a seller by its ID (a product's seller.ID) or by its seller page link",
	},
	{
		displayName: 'Seller ID',
		name: 'sellerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2066',
		displayOptions: show(['seller'], { sellerBy: ['id'] }),
		routing: { request: { body: { seller_id: '={{ $value }}' } } },
		description: "A marketplace seller ID (a product's seller.ID)",
	},
	{
		displayName: 'Seller URL',
		name: 'sellerUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['seller'], { sellerBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A seller page (seller.URL)',
	},
	{
		displayName: 'Additional Options',
		name: 'sellerOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['seller']),
		options: [pageOption, sortOption],
	},
];
