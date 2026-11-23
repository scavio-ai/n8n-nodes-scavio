import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['acehardware'], operation, ...extra },
});

// Ace Hardware (acehardware.com, the US hardware cooperative), 11 operations. 1 credit each;
// Search Products 2 (3 when Ace redirects the search to a category and the list options are
// applied to it); Get Product 2 (with or without a store); Get Store Stock 1 per 5 stores (Nearby
// 6); Find Nearest Stores with details 1 lookup per store (25 stores 6). An occasional call costs
// 2 instead of 1 (credits_used is the truth). US only, so no operation sends a country. Nearby
// stock and stores with details chain up to 27 lookups and calls can queue behind the backend's
// upstream limit, so every operation carries a 240s timeout, like O'Reilly.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = 'Ace Hardware (acehardware.com, the US hardware cooperative)';
const LISTING =
	"Listing prices are the price Ace shows in its listing (price_list per item; CORP is Ace's online price), not a store's price: for one store's price use Get Product with a store number.";
const ITEM =
	'items with product_code (for Get Product and Get Store Stock), name, brand, URL, image, price, original_price, list_price, sale_price, discount_percent, msrp, price_list, UPC, rating, review_count, Special Offers labels and fulfilment';
const LIST =
	'plus title, total, page, page_size, total_pages, facets (each value carries the filter Filters takes) and subcategories.';
const STORE_HINT =
	'A 5-digit Ace store number (e.g. 18250 or 03085), shown in every Ace store page link (acehardware.com/store-details/NUMBER). There is no store search by ZIP or city.';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (occasionally 2; credits_used says what was charged).`;
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'acehardwarePage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 200 },
	description: 'Page 1-200 (the first item of the page stays within 10,000)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const pageSizeOption: INodeProperties = {
	displayName: 'Page Size',
	name: 'acehardwarePageSize',
	type: 'options',
	default: 30,
	options: [
		{ name: '15', value: 15 },
		{ name: '30', value: 30 },
		{ name: '50', value: 50 },
		{ name: '100', value: 100 },
		{ name: '200', value: 200 },
	],
	description: 'Products per page, as Ace lists them (default 30)',
	routing: { request: { body: { page_size: '={{ $value === 30 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'acehardwareSort',
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Name: A to Z', value: 'name_asc' },
		{ name: 'Name: Z to A', value: 'name_desc' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Oldest', value: 'oldest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description: "Result order (Relevance is Ace's own order, the default)",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const offerOption: INodeProperties = {
	displayName: 'Special Offer',
	name: 'acehardwareOffer',
	type: 'options',
	default: '',
	options: [
		{ name: 'Ace Rewards', value: 'ace_rewards' },
		{ name: 'Any', value: '' },
		{ name: 'Buy & Get', value: 'buy_and_get' },
		{ name: 'Buy More & Save', value: 'buy_more_save' },
		{ name: 'Sale', value: 'sale' },
	],
	description: "Only products in one of Ace's Special Offers",
	routing: { request: { body: { offer: '={{ $value || undefined }}' } } },
};

const onSaleOption: INodeProperties = {
	displayName: 'On Sale Only',
	name: 'acehardwareOnSale',
	type: 'boolean',
	default: false,
	description: 'Whether to return only products on sale (same as Special Offer Sale)',
	routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters',
	name: 'acehardwareFilters',
	type: 'string',
	default: '',
	placeholder: 'tenant~A00317:lithium-ion, price:[100 TO 250]',
	description:
		"Comma-separated facet filters: the filter values from an earlier response's facets. At most 6 in all with brand and special offer.",
	routing: {
		request: {
			body: {
				filters: '={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}',
			},
		},
	},
};

const brandFilterOption: INodeProperties = {
	displayName: 'Brand',
	name: 'acehardwareBrandFilter',
	type: 'string',
	default: '',
	placeholder: 'dewalt',
	description: "Only this brand (the Brand Name facet's value)",
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const listOptions = [pageOption, pageSizeOption, sortOption, offerOption, onSaleOption, filtersOption];

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

export const acehardwareOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['acehardware'] } },
		options: [
			{
				name: 'Find Nearest Stores',
				value: 'stores',
				action: 'Find the ace hardware stores nearest a store',
				description: `The 25 ${NAME} stores Ace lists as nearest an Ace store (Ace has no public store search by ZIP or city), with store_id; with details, each one's name, address, phone, coordinates, distance_miles, hours, services and features. An unknown store number is a charged not-found. ${CHARGE} Costs 1 credit without details; with details 1 lookup per store (25 stores 6 credits).`,
				routing: request('/api/v1/acehardware/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get ace hardware brand products',
				description: `One brand's products on ${NAME} by slug or link, sorted, filtered and paged: ${ITEM}, ${LIST} Without a brand: Ace's brand index (about 5,700 brands, 500 a page, filtered by a name). An unknown brand is a charged not-found. ${LISTING} ${ONE}`,
				routing: request('/api/v1/acehardware/brand', true),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get ace hardware categories',
				description: `${NAME}'s departments and their categories (two levels), or one department's: category_id, name, URL (for Get Category Products), product_count and children. An unknown path is a charged not-found. ${ONE}`,
				routing: request('/api/v1/acehardware/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get ace hardware category products',
				description: `One ${NAME} category's products by link, path or ID, sorted, filtered and paged: ${ITEM}, ${LIST} A department page answers no items with its subcategories. A wrong path is a charged not-found. ${LISTING} ${ONE}`,
				routing: request('/api/v1/acehardware/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get ace hardware deals',
				description: `${NAME}'s sales and specials list, sorted, filtered and paged, plus Ace's site-wide promotions (title, details, promo code, starts, ends): ${ITEM}, ${LIST} ${LISTING} ${ONE}`,
				routing: request('/api/v1/acehardware/deals', true),
			},
			{
				name: 'Get Paint Colors',
				value: 'paintColors',
				action: 'Get ace hardware paint colors',
				description: `${NAME}'s paint colour list (about 5,300 colours: Benjamin Moore, Clark+Kensington, Magnolia Home) with code, name, brand, hex, RGB, families and collections, filtered by name or code, family, brand or collection and paged. ${CHARGE} Costs 1 credit (occasionally 2; credits_used says what was charged).`,
				routing: request('/api/v1/acehardware/paint-colors', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an ace hardware product',
				description: `One ${NAME} product in full by item number or link, priced for an Ace store if you send one. Ace stores are independently owned and operated, and the same item can be priced differently at different stores (Ace's terms: pricing varies by location). Returns priced_for (the store and price list Ace priced it from; CORP is Ace's online price), price, list and sale price, msrp (as Ace gives it; it can be below a store's price), promotions, UPC, specifications, measurements, images, assembly options, fulfilment, rating and review_count (no review text). An unknown product is a charged not-found. ${CHARGE} Costs 2 credits with or without a store.`,
				routing: request('/api/v1/acehardware/product'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an ace hardware store',
				description: `One ${NAME} store by store number: name, address, phone, coordinates, hours, services, departments, brands, programs, features (pickup, curbside, delivery, assembly, propane, Benjamin Moore, Ace Rewards), price zones, the 25 nearest store numbers and same-owner stores. No owner or staff names. An unknown store number is a charged not-found. ${ONE}`,
				routing: request('/api/v1/acehardware/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get ace hardware store stock',
				description: `Exact units on hand as ${NAME} reports them, for one product at up to 25 Ace stores, or at one store and the 25 stores Ace lists as nearest to it (Nearby): per store units_in_stock, soft_units, in_stock, the shelf location_code and the regional distribution centre's units, plus in_stock_count and total_units. Ace answers 0 for a store number or product it does not know, exactly as for one out of stock. Stock is as Ace reports it, not a promise. ${CHARGE} Costs 1 credit per 5 stores (1 store 1, 25 stores 5; Nearby 6).`,
				routing: request('/api/v1/acehardware/store-stock'),
			},
			{
				name: 'Get Weekly Ad',
				value: 'weeklyAd',
				action: 'Get an ace hardware store weekly ad',
				description: `One ${NAME} store's weekly ad, page by page: title, valid_from, valid_to, ad_group (for later pages), total_pages and items with heading, title, price_text, details, the Ace item numbers each tile names and image. Prices and details are in the ad's words. An unknown store number is a charged not-found. ${ONE}`,
				routing: request('/api/v1/acehardware/weekly-ad'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search ace hardware products',
				description: `Search ${NAME} by keywords, an Ace item number or a UPC, sorted, filtered (brand, Special Offers, any facet) and paged (15-200 a page): ${ITEM}, ${LIST} redirected_to names the category or product Ace sent the search to. ${LISTING} Not available: review text, search suggestions, ZIP store search, price history, Ace Rewards member prices, checkout. ${CHARGE} Costs 2 credits (3 when Ace redirects the search to a category and the list options are applied to it).`,
				routing: request('/api/v1/acehardware/search'),
			},
		],
		default: 'product',
	},
];

export const acehardwareFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword, Item Number or UPC',
		name: 'acehardwareQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'brass hose nozzle',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
	},

	// -- Get Product, Get Store Stock --
	{
		displayName: 'Item Number or Product URL',
		name: 'acehardwareProductCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '72779',
		displayOptions: show(['product', 'storeStock']),
		routing: { request: { body: { product_code: '={{ $value }}' } } },
		description: 'An Ace item number (product_code from a list, e.g. 72779) or an acehardware.com product link',
	},
	{
		displayName: 'Store Number',
		name: 'acehardwareProductStore',
		type: 'string',
		default: '',
		placeholder: '10665',
		displayOptions: show(['product']),
		routing: { request: { body: { store: '={{ $value || undefined }}' } } },
		description: `Optional: the price as Ace shows it for this store (priced_for). Without it, priced_for names the price list Ace used (CORP: Ace's online price). ${STORE_HINT}`,
	},

	// -- Get Store Stock --
	{
		displayName: 'Store Numbers',
		name: 'acehardwareStockStores',
		type: 'string',
		required: true,
		default: '',
		placeholder: '18250, 17309',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { stores: SPLIT } } },
		description:
			'1-25 comma-separated Ace store numbers, 5 digits each (e.g. 18250 or 03085), shown in every Ace store page link (acehardware.com/store-details/NUMBER). 1 credit per 5 stores.',
	},
	{
		displayName: 'Nearby',
		name: 'acehardwareStockNearby',
		type: 'boolean',
		default: false,
		displayOptions: show(['storeStock']),
		routing: { request: { body: { nearby: '={{ $value || undefined }}' } } },
		description: 'Whether to add the 25 stores Ace lists as nearest to the one store number given (6 credits)',
	},

	// -- Get Store, Find Nearest Stores, Get Weekly Ad --
	{
		displayName: 'Store Number',
		name: 'acehardwareStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '18250',
		displayOptions: show(['store', 'stores', 'weeklyAd']),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: STORE_HINT,
	},
	{
		displayName: 'Additional Options',
		name: 'acehardwareStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			{
				displayName: 'Details',
				name: 'acehardwareStoresDetails',
				type: 'boolean',
				default: false,
				description:
					"Whether to return each nearest store's name, address, phone, hours and distance (1 lookup per store: 25 stores 6 credits)",
				routing: { request: { body: { details: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'acehardwareStoresLimit',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 25 },
				description: 'How many of the nearest stores (1-25)',
				routing: { request: { body: { limit: '={{ $value === 25 ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'acehardwareWeeklyAdOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['weeklyAd']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'acehardwareAdPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 40 },
				description: 'Page of the weekly ad (total_pages says how many)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Ad Group',
				name: 'acehardwareAdGroup',
				type: 'string',
				default: '',
				placeholder: '261101_WCAS',
				description: 'The ad_group from an earlier answer, with Page for page 2 and later',
				routing: { request: { body: { ad_group: '={{ $value || undefined }}' } } },
			},
		]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'acehardwareCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/departments/tools/power-tools/cordless-drills',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'An Ace category link or path (/departments/... or /c/ID) or a category ID (from Get Categories).',
	},

	// -- Get Categories --
	{
		displayName: 'Department or Category',
		name: 'acehardwareCategoriesRoot',
		type: 'string',
		default: '',
		placeholder: '/departments/tools',
		displayOptions: show(['categories']),
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		description: 'Optional: a department or category (link, path or ID) lists its subcategories. Empty: every department.',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'acehardwareBrand',
		type: 'string',
		default: '',
		placeholder: 'weber',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		description: "A brand slug (weber) or its link (/brands/weber). Empty: Ace's brand index.",
	},
	{
		displayName: 'Brand Name Contains',
		name: 'acehardwareBrandQuery',
		type: 'string',
		default: '',
		placeholder: 'web',
		displayOptions: show(['brand'], { acehardwareBrand: [''] }),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description: 'Brand index only: brands whose name contains this text',
	},

	// -- Get Paint Colors --
	{
		displayName: 'Additional Options',
		name: 'acehardwarePaintOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['paintColors']),
		options: sorted([
			{
				displayName: 'Name or Code Contains',
				name: 'acehardwarePaintQuery',
				type: 'string',
				default: '',
				placeholder: 'pink',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Family',
				name: 'acehardwarePaintFamily',
				type: 'string',
				default: '',
				placeholder: 'Blue',
				description: 'A colour family (families name from an earlier answer, e.g. Blue, Gray / Black)',
				routing: { request: { body: { family: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Paint Brand',
				name: 'acehardwarePaintBrand',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Benjamin Moore', value: 'Benjamin Moore' },
					{ name: 'Clark+Kensington', value: 'Clark+Kensington' },
					{ name: 'Magnolia Home', value: 'Magnolia Home' },
				],
				routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Collection',
				name: 'acehardwarePaintCollection',
				type: 'string',
				default: '',
				description: 'A collection name (colors collections from an earlier answer)',
				routing: { request: { body: { collection: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'acehardwarePaintPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'acehardwarePaintPageSize',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Colours per page (1-500, default 100)',
				routing: { request: { body: { page_size: '={{ $value === 100 ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Additional Options --
	listCollection('acehardwareSearchOptions', 'search', [...listOptions, brandFilterOption]),
	listCollection('acehardwareCategoryOptions', 'category', [...listOptions, brandFilterOption]),
	listCollection('acehardwareBrandOptions', 'brand', listOptions),
	listCollection('acehardwareDealsOptions', 'deals', [...listOptions, brandFilterOption]),
];
