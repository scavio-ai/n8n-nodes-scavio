import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rona'], operation, ...extra },
});

// RONA (rona.ca, the Canadian home improvement retailer: RONA+ and RONA stores), 9 operations.
// Credits: Get Store Prices, Get Categories, Find Stores and Get Store 1; Search Products and Get
// Deals 2 (3 with a Store ID; search 2 more when RONA redirects the term); Get Product 3; Get Store
// Stock 3; Get Category Products 2 (3 with a Store ID), or 1 with a Family ID and a Store ID;
// credits_used is the truth. Canada only, CAD, language en | fr on every operation. Answers can
// take up to about a minute, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

// Comma-separated text -> string array, blanks dropped (article numbers keep leading zeros).
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';
const trimmed = '={{ String($value).trim() || undefined }}';
const isUrl = '/^https?:/i.test(String($value).trim())';

const FIRST =
	'RONA (rona.ca, the Canadian home improvement retailer: RONA+ and RONA stores, about 425 corporate and affiliated dealer stores per RONA inc.)';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const STORE =
	"Without a Store ID the prices and units are for the store RONA's site picks for the visit (store.requested false); with a Store ID every item is priced at that store.";
const UNITS = 'units are exact store units; null means RONA showed no count, not zero.';
const TILE =
	"products with sku (RONA's Article #), name, brand, model, URL, image, price, regular_price, on_sale, unit, rating, review_count, units, availability and price_shown, plus total, total_pages, has_more, the store and facets (Include Facets)";
const NOT_AVAILABLE =
	'Not available: review text (rating and review count only), search suggestions, postal-code store lookup, the printed flyer, cart or checkout, price history (poll and store the answers). For the same item at Home Depot Canada use the Home Depot resource with Country Canada: match the same grade and length, or the same model.';
const POSTAL = 'Postal code lookup is not supported: use a latitude and longitude, or a city or province.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const storeIdOption = (name: string): INodeProperties => ({
	displayName: 'Store ID',
	name,
	type: 'string',
	default: '',
	placeholder: '55130',
	description:
		"A RONA store number (5 digits, from Find Stores; e.g. 55130 RONA+ Toronto Stockyards, 41460 RONA+ Brossard Dix/30, 62860 RONA+ Calgary NE). Prices and units are that store's.",
	routing: { request: { body: { store_id: trimmed } } },
});

const languageOption = (name: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French', value: 'fr' },
	],
	description:
		"French returns RONA's French names, links and labels. Article numbers and CAD prices are the same in both.",
	routing: { request: { body: { language: '={{ $value === "fr" ? "fr" : undefined }}' } } },
});

const listOptions = (prefix: string, withSort: boolean, pageSizes = true): INodeProperties[] => [
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		description: 'Page, 1-based',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	pageSizes
		? {
				displayName: 'Page Size',
				name: `${prefix}PageSize`,
				type: 'options',
				default: 48,
				options: [
					{ name: '24', value: 24 },
					{ name: '48', value: 48 },
					{ name: '96', value: 96 },
				],
				description: 'Products per page',
				routing: { request: { body: { page_size: '={{ $value === 48 ? undefined : $value }}' } } },
			}
		: {
				displayName: 'Page Size',
				name: `${prefix}PageSize`,
				type: 'number',
				default: 48,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Products per page: 24, 48 or 96 on a category page; 1-100 with a Family ID',
				routing: { request: { body: { page_size: '={{ $value === 48 ? undefined : $value }}' } } },
			},
	...(withSort
		? [
				{
					displayName: 'Sort',
					name: `${prefix}Sort`,
					type: 'options' as const,
					default: 'relevance',
					options: [
						{ name: 'Best Sellers', value: 'best_sellers' },
						{ name: 'Highest Rated', value: 'highest_rated' },
						{ name: 'Newest', value: 'newest' },
						{ name: 'Price: High to Low', value: 'price_high_to_low' },
						{ name: 'Price: Low to High', value: 'price_low_to_high' },
						{ name: 'Relevance', value: 'relevance' },
					],
					description: 'Result order',
					routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
				},
			]
		: []),
	{
		displayName: 'Filters',
		name: `${prefix}Filters`,
		type: 'string',
		default: '',
		placeholder: '1000337236',
		description:
			'Up to 10 facet values, comma-separated (facets[].values[].value from Include Facets): brand, price band, rating, offer, in-store or online-only products, category',
		routing: {
			request: { body: { filters: '={{ String($value).trim() ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}' } },
		},
	},
	{
		displayName: 'On Sale Only',
		name: `${prefix}OnSale`,
		type: 'boolean',
		default: false,
		description: 'Whether to return only products on sale',
		routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Clearance Only',
		name: `${prefix}Clearance`,
		type: 'boolean',
		default: false,
		description: 'Whether to return only clearance products',
		routing: { request: { body: { clearance: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Include Facets',
		name: `${prefix}IncludeFacets`,
		type: 'boolean',
		default: false,
		description: 'Whether to also return the facets (filter values with counts) for these results',
		routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
	},
	storeIdOption(`${prefix}StoreId`),
	languageOption(`${prefix}Language`),
];

export const ronaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rona'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find rona stores',
				description: `Every store on RONA's store locator (${FIRST}): RONA+ and RONA stores, corporate and dealer, filtered by province, city and banner, or nearest a latitude and longitude: store_id, name, banner, format, relationship (corporate, dealer, franchisee), address, postal_code, phone, coordinates, distance_km and services. Captured 2026-11-26: 403 stores. ${POSTAL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/rona/stores', true),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get rona categories',
				description: `The department tree of ${FIRST}: departments with name, path, URL, category_id and children. Paths are what Get Category Products takes. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/rona/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get rona category products',
				description: `Browse one category of ${FIRST} by path (from Get Categories) with paging, sorts, filters and facets: the category (path, name, category_id, family_id) and ${TILE}. With a Family ID and a Store ID and no sort or filters, the category's products at that store for 1 credit. ${STORE} ${UNITS} ${CHARGE} Costs 2 credits (3 with a Store ID), or 1 with a Family ID and a Store ID.`,
				routing: request('/api/v1/rona/category', true),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get rona deals',
				description: `RONA's weekly deals (or clearance) listing on ${FIRST}: every promoted product with its sale price and regular price, paged and filtered like Search Products, in RONA's own order (no sort): ${TILE}. A product's sale end is on Get Product. Not the printed flyer. ${STORE} ${UNITS} ${CHARGE} Costs 2 credits; 3 with a Store ID.`,
				routing: request('/api/v1/rona/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a rona product',
				description: `One product of ${FIRST} by article number or link: price, regular_price, rebate, on_sale, sale_ends_text (the sale end as RONA shows it, e.g. "until Dec 10th, 2026"), sale_ends (ISO date only when unambiguous), units, aisle, DC and parcel units, nearby stores with units, UPC, model, specs, images, rating and review_count (no review text). ${STORE} ${UNITS} An unknown article is a charged not-found. ${CHARGE} Costs 3 credits.`,
				routing: request('/api/v1/rona/product'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a rona store',
				description: `One RONA store by store number or link: name, banner, address, phone, coordinates, hours, special hours, department hours, relationship and services. Hours are local store time. An unknown store is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/rona/store'),
			},
			{
				name: 'Get Store Prices',
				value: 'prices',
				action: 'Get rona store prices',
				description: `Prices and exact stock for up to 60 articles at one RONA store, from ${FIRST}: price, regular_price, rebate, on_sale, units, DC and parcel units, aisle, UPC, model and availability per article, plus not_found. RONA prices some goods per store: captured 2026-11-26, 2-in x 4-in x 8-ft SPF Select Lumber (0971073) was 4.35 CAD at store 41460 (Quebec), 4.22 at 55130 (Ontario) and 4.19 at 62860 (Alberta). ${UNITS} An unknown store or no known article is a charged not-found. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/rona/prices'),
			},
			{
				name: 'Get Store Stock',
				value: 'stock',
				action: 'Get rona store stock',
				description: `Which RONA stores near a store (or a latitude and longitude) have one article, from ${FIRST}: each store's name, distance_km, address, exact units, in_stock and pickup message, nearest first. RONA offers no nearby-store list for some articles (lumber), and the list can come back empty now and then: run it once more. ${POSTAL} An unknown article or store is a charged not-found. ${CHARGE} Costs 3 credits.`,
				routing: request('/api/v1/rona/stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search rona products',
				description: `Search the products of ${FIRST} by keywords, with paging (24, 48 or 96 a page), six sorts and RONA's filters: query, redirected_to (when RONA sends the term to a category) and ${TILE}. ${STORE} ${UNITS} ${NOT_AVAILABLE} ${CHARGE} Costs 2 credits; 3 with a Store ID; 2 more when RONA redirects the term.`,
				routing: request('/api/v1/rona/search'),
			},
		],
		default: 'search',
	},
];

export const ronaFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'ronaQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2x4',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords to search RONA products for',
	},

	// -- Get Product --
	{
		displayName: 'Article Number or URL',
		name: 'ronaProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00277649',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
					url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description: "A RONA article number (Article #, sku from Search Products; leading zeros count) or a rona.ca product link",
	},

	// -- Get Store Prices --
	{
		displayName: 'Article Numbers',
		name: 'ronaSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0971073, 0938002, 00277649',
		displayOptions: show(['prices']),
		routing: { request: { body: { skus: splitList } } },
		description: '1-60 RONA article numbers, comma-separated (leading zeros count)',
	},
	{
		displayName: 'Store ID',
		name: 'ronaPricesStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '55130',
		displayOptions: show(['prices']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'A RONA store number (5 digits, from Find Stores)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'ronaCategory',
		type: 'string',
		default: '',
		placeholder: '/en/tools/power-tools-158001/cordless-drills-and-drivers-158003',
		displayOptions: show(['category']),
		routing: { request: { body: { category: trimmed } } },
		description:
			'A category path from Get Categories or a rona.ca category link. Its language (/en or /fr) is the answer\'s language. Leave empty only when you set a Family ID and a Store ID.',
	},

	// -- Get Store --
	{
		displayName: 'Store ID or URL',
		name: 'ronaStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '55130',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					store_id: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
					url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description: 'A RONA store number (5 digits, from Find Stores) or a rona.ca store link',
	},

	// -- Get Store Stock --
	{
		displayName: 'Article Number',
		name: 'ronaStockSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00277649',
		displayOptions: show(['stock']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'A RONA article number (sku from Search Products; leading zeros count)',
	},
	{
		displayName: 'Near',
		name: 'ronaStockNear',
		type: 'options',
		default: 'store',
		options: [
			{ name: 'A Store', value: 'store' },
			{ name: 'Coordinates', value: 'coordinates' },
		],
		displayOptions: show(['stock']),
		description: 'The stores near a RONA store or near a latitude and longitude',
	},
	{
		displayName: 'Store ID',
		name: 'ronaStockStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '62860',
		displayOptions: show(['stock'], { ronaStockNear: ['store'] }),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'The stores near this RONA store (5 digits, from Find Stores)',
	},
	{
		displayName: 'Latitude',
		name: 'ronaStockLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stock'], { ronaStockNear: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'ronaStockLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stock'], { ronaStockNear: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'ronaStoresBy',
		type: 'options',
		default: 'filters',
		options: [
			{ name: 'Coordinates (Nearest First)', value: 'coordinates' },
			{ name: 'Province, City or Banner', value: 'filters' },
		],
		displayOptions: show(['stores']),
		description: 'Stores nearest a latitude and longitude, or filtered by province, city and banner (no filter: every store)',
	},
	{
		displayName: 'Latitude',
		name: 'ronaStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { ronaStoresBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'ronaStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { ronaStoresBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'ronaSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(listOptions('ronaSearch', true)),
	},
	{
		displayName: 'Additional Options',
		name: 'ronaDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			...listOptions('ronaDeals', false),
			{
				displayName: 'Type',
				name: 'ronaDealsType',
				type: 'options',
				default: 'weekly',
				options: [
					{ name: 'Clearance', value: 'clearance' },
					{ name: 'Weekly Deals', value: 'weekly' },
				],
				description: "RONA's weekly deals or the clearance listing",
				routing: { request: { body: { type: '={{ $value === "weekly" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'ronaCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			...listOptions('ronaCategory', true, false),
			{
				displayName: 'Family ID',
				name: 'ronaCategoryFamilyId',
				type: 'string',
				default: '',
				placeholder: '318485',
				description:
					"A category answer's family_id: with a Store ID and no sort, filters or facets, the category's products at that store for 1 credit",
				routing: { request: { body: { family_id: trimmed } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'ronaProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [languageOption('ronaProductLanguage'), storeIdOption('ronaProductStoreId')],
	},
	{
		displayName: 'Additional Options',
		name: 'ronaPricesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['prices']),
		options: [languageOption('ronaPricesLanguage')],
	},
	{
		displayName: 'Additional Options',
		name: 'ronaCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Depth',
				name: 'ronaCategoriesDepth',
				type: 'options',
				default: 3,
				options: [
					{ name: '1 (Departments)', value: 1 },
					{ name: '2 (Categories)', value: 2 },
					{ name: '3 (Sub-Categories)', value: 3 },
				],
				description: 'Levels to return',
				routing: { request: { body: { depth: '={{ $value === 3 ? undefined : $value }}' } } },
			},
			languageOption('ronaCategoriesLanguage'),
		],
	},
	{
		displayName: 'Additional Options',
		name: 'ronaStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Banner',
				name: 'ronaStoresBanner',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'RONA', value: 'rona' },
					{ name: 'RONA+', value: 'rona_plus' },
				],
				description: 'RONA stores or RONA+ stores',
				routing: { request: { body: { banner: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'City',
				name: 'ronaStoresCity',
				type: 'string',
				default: '',
				placeholder: 'Calgary',
				description: 'Stores whose city contains this (accents and case ignored)',
				routing: { request: { body: { city: trimmed } } },
			},
			languageOption('ronaStoresLanguage'),
			{
				displayName: 'Limit',
				name: 'ronaStoresLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 403 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Province',
				name: 'ronaStoresProvince',
				type: 'string',
				default: '',
				placeholder: 'qc',
				description: 'A province code (qc, on, ab, bc ...) or name',
				routing: { request: { body: { province: trimmed } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'ronaStoreOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['store', 'stock']),
		options: [languageOption('ronaStoreLanguage')],
	},
];
