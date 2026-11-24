import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['michaels'], operation, ...extra },
});

// Michaels (michaels.com, the US and Canada arts and crafts retailer), 11 operations. 2 credits
// each; Get Category Products and Get Deals 4 with a category given as a /shop/ link or path (one
// more call finds its code path). credits_used is the truth. Country us (www.michaels.com, USD)
// or ca (canada.michaels.com, CAD), language en or fr (Canada only); Find Stores, Get Categories
// and Get Search Suggestions are US only and send no country. Calls can queue behind the
// backend's upstream limit, so every operation carries a 240s timeout, like Tractor Supply.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = 'Michaels (michaels.com, the US and Canada arts and crafts retailer)';
const PRICES =
	"Price and was_price as Michaels shows them (was_price_text keeps its own Reg. label); discount_percent is computed by Scavio from the two. Prices are national per country (USD or CAD): the store does not change them, it matters for stock.";
const ITEM =
	'items with sku (for Get Product, Get Store Stock and Get Store Inventory), name, URL, image, price, was_price, price_text, was_price_text, on_sale, discount_percent, unit_price, rating, review_count, seller_type (Michaels, Marketplace or Pro items mixed in the list), pickup and delivery flags, colors and promotions with Michaels\'s own start and end dates';
const LIST =
	'plus market, total, page, page_size, total_pages and facets (each key and value is what Filters takes).';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const TWO = `${CHARGE} Costs 2 credits (credits_used says what was charged)`;
const CAT_COST = `${CHARGE} Costs 2 credits with a category code path, 4 with a /shop/ link or path (credits_used says what was charged)`;
const STORE_HINT = 'A Michaels store number (e.g. 1040 Chicago IL, 4936 Toronto ON). Get Store Stock and Find Stores list them.';
const SKU_HINT = 'A Michaels SKU (sku from a list, e.g. 10228177)';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';
const MARKET_OPS = ['search', 'product', 'storeStock', 'storeInventory', 'store', 'category', 'brand', 'deals'];

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'michaelsPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1 },
	description: 'Page, from 1 ((page - 1) x page size at most 8000)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const pageSizeOption: INodeProperties = {
	displayName: 'Page Size',
	name: 'michaelsPageSize',
	type: 'number',
	default: 40,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Products per page, 1-100 (default 40)',
	routing: { request: { body: { page_size: '={{ $value === 40 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'michaelsSort',
	type: 'options',
	default: 'best_match',
	options: [
		{ name: 'Best Match', value: 'best_match' },
		{ name: 'Best Sellers', value: 'best_sellers' },
		{ name: 'New Arrivals', value: 'new_arrivals' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Rating', value: 'rating' },
	],
	description: "Result order (Best Match is Michaels's default)",
	routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
};

const minPriceOption: INodeProperties = {
	displayName: 'Min Price',
	name: 'michaelsMinPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Lowest price (0: no minimum)',
	routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
};

const maxPriceOption: INodeProperties = {
	displayName: 'Max Price',
	name: 'michaelsMaxPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Highest price (0: no maximum)',
	routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
};

const ratingOption: INodeProperties = {
	displayName: 'Minimum Rating',
	name: 'michaelsMinRating',
	type: 'options',
	default: 0,
	options: [
		{ name: '1 Star & Up', value: 1 },
		{ name: '2 Stars & Up', value: 2 },
		{ name: '3 Stars & Up', value: 3 },
		{ name: '4 Stars & Up', value: 4 },
		{ name: 'Any', value: 0 },
	],
	description: 'Only products rated at least this many stars',
	routing: { request: { body: { min_rating: '={{ $value || undefined }}' } } },
};

const pickupStoreOption: INodeProperties = {
	displayName: 'Pickup Store Number',
	name: 'michaelsPickupStore',
	type: 'string',
	default: '',
	placeholder: '1040',
	description: 'Only products with free store pickup at this Michaels store',
	routing: { request: { body: { store: '={{ $value || undefined }}', pickup: '={{ $value ? true : undefined }}' } } },
};

const flag = (displayName: string, name: string, wire: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [wire]: '={{ $value || undefined }}' } } },
});

const sameDayOption = flag('Same-Day Delivery Only', 'michaelsSameDay', 'same_day', 'Whether to return only products offered for same-day delivery');
const shipToMeOption = flag('Ship to Me Only', 'michaelsShipToMe', 'ship_to_me', 'Whether to return only products Michaels ships');
const onSaleOption = flag('Sale Only', 'michaelsOnSale', 'on_sale', "Whether to return only products in Michaels's Sale filter");
const newOption = flag('New Only', 'michaelsNew', 'new', "Whether to return only products in Michaels's New filter");
const clearanceOption = flag('Clearance Only', 'michaelsClearance', 'clearance', "Whether to return only products in Michaels's Clearance filter");
const greatBuyOption = flag('Great Buy Only', 'michaelsGreatBuy', 'great_buy', "Whether to return only products in Michaels's Great Buy filter (United States)");

const sellerOption: INodeProperties = {
	displayName: 'Seller',
	name: 'michaelsSeller',
	type: 'options',
	default: '',
	options: [
		{ name: 'Any', value: '' },
		{ name: 'Marketplace (MakerPlace Sellers)', value: 'marketplace' },
		{ name: 'Michaels', value: 'michaels' },
		{ name: 'Michaels Pro (Bulk Packs)', value: 'michaels_pro' },
	],
	description: 'Only this seller type (United States)',
	routing: { request: { body: { seller: '={{ $value || undefined }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'michaelsFilters',
	type: 'json',
	default: '',
	placeholder: '{ "material": ["Acrylic"] }',
	description:
		"Facet filters: { facets[].key: [facets[].values[].value] } from an earlier response, sent exactly as given (e.g. refinementColor, size, material, yarnWeight)",
	routing: {
		request: {
			body: {
				filters: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
			},
		},
	},
};

const brandFilterOption: INodeProperties = {
	displayName: 'Brand',
	name: 'michaelsBrandFilter',
	type: 'string',
	default: '',
	placeholder: 'Lion Brand Yarn',
	description: "Only this brand (the Brand facet's values)",
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const keywordsOption: INodeProperties = {
	displayName: 'Keywords',
	name: 'michaelsKeywords',
	type: 'string',
	default: '',
	description: 'Only products matching these keywords',
	routing: { request: { body: { q: '={{ $value || undefined }}' } } },
};

const categoryCodeOption: INodeProperties = {
	displayName: 'Category Code Path',
	name: 'michaelsCategoryCode',
	type: 'string',
	default: '',
	placeholder: 'root//Categories//809187838',
	description: 'Only this category: a code path (code_path from Get Categories, or a By category code facet value)',
	routing: { request: { body: { category: '={{ $value || undefined }}' } } },
};

const baseListOptions = [
	pageOption,
	pageSizeOption,
	sortOption,
	minPriceOption,
	maxPriceOption,
	ratingOption,
	pickupStoreOption,
	sameDayOption,
	shipToMeOption,
	sellerOption,
	filtersOption,
];
const dealFlags = [onSaleOption, newOption, clearanceOption, greatBuyOption];

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

export const michaelsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['michaels'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find michaels stores near a zip code',
				description: `The ${NAME} stores near a US ZIP, a city or a point (United States; for Canada, Get Store Stock lists the stores near a postal code): store_id, name, address, phone, coordinates, distance_miles, hours (the 7 entries Michaels lists for the current week), open_now and services (custom framing, curbside pickup, same-day delivery, ...). ${TWO}.`,
				routing: request('/api/v1/michaels/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get michaels brand products',
				description: `One brand's products on ${NAME} (Michaels's Brand filter), optionally matching keywords or within a category, sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICES} A brand with no products is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/michaels/brand'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get michaels categories',
				description: `${NAME}'s departments, or one category's subcategories (United States): name, path (for Path), URL, code_path (the category input of Search Products, Get Category Products, Get Brand Products and Get Deals), leaf and children. An unknown path is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/michaels/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get michaels category products',
				description: `One ${NAME} category's products by /shop/ link or path or by code path, optionally matching keywords, sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICES} With Country Canada the category is a code path. A wrong category is a charged not-found. ${CAT_COST}.`,
				routing: request('/api/v1/michaels/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get michaels deals',
				description: `${NAME}'s Sale, New, Clearance or Great Buy (United States) products matching keywords or within a category, sorted, filtered and paged: Michaels's own More Ways to Shop filters. ${ITEM}, ${LIST} ${PRICES} ${CAT_COST}.`,
				routing: request('/api/v1/michaels/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a michaels product',
				description: `One ${NAME} product in full by SKU or link: price, was_price, was_price_text (Michaels's own Reg. label), discount_percent, variants (colours and sizes with price, sale price and UPC), promotions with Michaels's own start and end dates, online_stock (Michaels's online stock, not a store's), pro_pack unit price, specifications, breadcrumbs, seller_id for Marketplace items (no seller name), rating and review_count (no review text). ${PRICES} An unknown SKU is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/michaels/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get michaels search suggestions',
				description: `The search suggestions ${NAME} shows as you type (United States): term, categories and brands per suggestion. ${TWO}.`,
				routing: request('/api/v1/michaels/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a michaels store',
				description: `One ${NAME} store by store number (United States or Canada): name, address, phone, coordinates, time_zone, hours, services, open_date and closing dates. An unknown store number is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/michaels/store'),
			},
			{
				name: 'Get Store Inventory',
				value: 'storeInventory',
				action: 'Get michaels store inventory',
				description: `Units of up to 30 SKUs at one ${NAME} store, as Michaels reports them: per SKU units, plus in_stock_count, total_units and not_reported (SKUs Michaels gave no units for). ${TWO}.`,
				routing: request('/api/v1/michaels/store-inventory'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get michaels store stock near a zip code',
				description: `Units of one SKU at the ${NAME} stores near a US ZIP or a Canadian postal code, exactly as Michaels reports them for pickup: per store store_id, name, address, distance_miles, units, in_stock, pickup_text (Michaels's own pickup message), hours and virtual (pop-up stores, shown with 0 units), plus in_stock_count and total_units. Stock is as Michaels reports it, not a promise. ${TWO}.`,
				routing: request('/api/v1/michaels/store-stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search michaels products',
				description: `Search ${NAME} by keywords, an item number or a UPC (a UPC answers with the product group's lead SKU), sorted, filtered (brand, price, rating, store pickup, same-day, ship to me, sale, new, clearance, great buy, seller, any facet) and paged (up to 100 a page): ${ITEM}, ${LIST} ${PRICES} Not available: review text, the weekly ad, coupons, classes and events, aisle locations, Marketplace seller names, price history, checkout. ${TWO}.`,
				routing: request('/api/v1/michaels/search'),
			},
		],
		default: 'storeStock',
	},
];

export const michaelsFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword, Item Number or UPC',
		name: 'michaelsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yarn',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ $value }}' } } },
	},

	// -- Get Product --
	{
		displayName: 'SKU or Product URL',
		name: 'michaelsProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10228177',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: `${SKU_HINT} or a www.michaels.com or canada.michaels.com product link (the link sets the country)`,
	},

	// -- Get Store Stock --
	{
		displayName: 'SKU',
		name: 'michaelsSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10228177',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: SKU_HINT,
	},
	{
		displayName: 'ZIP or Postal Code',
		name: 'michaelsStockZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP code (10001), or with Country Canada a Canadian postal code (M5V 2T6)',
	},
	{
		displayName: 'Additional Options',
		name: 'michaelsStockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeStock']),
		options: [
			{
				displayName: 'Radius (Miles)',
				name: 'michaelsStockRadius',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Miles around the location, 1-200. Defaults to 20.',
				routing: { request: { body: { radius: '={{ $value === 20 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Store Inventory, Get Store --
	{
		displayName: 'Store Number',
		name: 'michaelsStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1040',
		displayOptions: show(['storeInventory', 'store']),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: STORE_HINT,
	},
	{
		displayName: 'SKUs',
		name: 'michaelsSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10228177, 10816737',
		displayOptions: show(['storeInventory']),
		routing: { request: { body: { skus: SPLIT } } },
		description: '1-30 comma-separated Michaels SKUs',
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'michaelsStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'Coordinates', value: 'point' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find the stores near a US ZIP code, a city or a latitude and longitude',
	},
	{
		displayName: 'ZIP Code',
		name: 'michaelsStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60657',
		displayOptions: show(['stores'], { michaelsStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP code',
	},
	{
		displayName: 'City',
		name: 'michaelsStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'San Francisco, CA',
		displayOptions: show(['stores'], { michaelsStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'A US city, e.g. San Francisco, CA',
	},
	{
		displayName: 'Latitude',
		name: 'michaelsStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { michaelsStoresBy: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: 'michaelsStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { michaelsStoresBy: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Additional Options',
		name: 'michaelsStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Radius (Miles)',
				name: 'michaelsStoresRadius',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Miles around the location, 1-200. Defaults to 20.',
				routing: { request: { body: { radius: '={{ $value === 20 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'michaelsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/shop/art-supplies/artist-canvas',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'A Michaels /shop/ link or path (4 credits) or its code path (code_path from Get Categories, 2 credits). With Country Canada: a code path.',
	},

	// -- Get Categories --
	{
		displayName: 'Path',
		name: 'michaelsCategoriesPath',
		type: 'string',
		default: '',
		placeholder: '/shop/art-supplies',
		displayOptions: show(['categories']),
		routing: { request: { body: { path: '={{ $value || undefined }}' } } },
		description: "Optional: a category's /shop/ path or link (path from an earlier answer) lists its subcategories. Empty: the departments.",
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'michaelsBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Cricut',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'A brand as Michaels names it (the Brand facet values of a search, e.g. Cricut, Lion Brand Yarn)',
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'michaelsDealType',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Great Buy (United States)', value: 'great_buy' },
			{ name: 'New', value: 'new' },
			{ name: 'Sale', value: 'sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "sale" ? undefined : $value }}' } } },
		description: "Michaels's More Ways to Shop filter (Sale is the default)",
	},
	{
		displayName: 'Deals Within',
		name: 'michaelsDealsBy',
		type: 'options',
		default: 'keywords',
		options: [
			{ name: 'Keywords', value: 'keywords' },
			{ name: 'Category', value: 'category' },
		],
		displayOptions: show(['deals']),
		description: 'Michaels lists deals within a search or a category: one is required',
	},
	{
		displayName: 'Keywords',
		name: 'michaelsDealsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'christmas',
		displayOptions: show(['deals'], { michaelsDealsBy: ['keywords'] }),
		routing: { request: { body: { q: '={{ $value }}' } } },
	},
	{
		displayName: 'Category',
		name: 'michaelsDealsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'root//Categories//809187838',
		displayOptions: show(['deals'], { michaelsDealsBy: ['category'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A category code path (2 credits), or in the United States a /shop/ path (4 credits)',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Text',
		name: 'michaelsSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yarn',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { q: '={{ $value }}' } } },
		description: 'The text typed so far',
	},

	// -- Country and Language --
	{
		displayName: 'Country',
		name: 'michaelsCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'United States (www.michaels.com, USD) or Canada (canada.michaels.com, CAD)',
	},
	{
		displayName: 'Language',
		name: 'michaelsLanguage',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(MARKET_OPS, { michaelsCountry: ['ca'] }),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'French returns names and texts as canada.michaels.com/fr shows them',
	},

	// -- Additional Options --
	listCollection('michaelsSearchOptions', 'search', [
		...baseListOptions,
		...dealFlags,
		brandFilterOption,
		categoryCodeOption,
	]),
	listCollection('michaelsCategoryOptions', 'category', [
		...baseListOptions,
		...dealFlags,
		brandFilterOption,
		keywordsOption,
	]),
	listCollection('michaelsBrandOptions', 'brand', [
		...baseListOptions,
		...dealFlags,
		keywordsOption,
		categoryCodeOption,
	]),
	listCollection('michaelsDealsOptions', 'deals', [...baseListOptions, brandFilterOption]),
];
