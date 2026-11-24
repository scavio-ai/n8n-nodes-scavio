import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['tractorsupply'], operation, ...extra },
});

// Tractor Supply (tractorsupply.com, the US rural lifestyle retailer), 12 operations. 1 credit
// each; Get Product 2 on the first call for a store not yet looked up; Get Store Prices 1 per 5
// lookups (each store's price, a store's details when not yet known, the item: 25 new stores 11).
// credits_used is the truth. US only, so no operation sends a country. Search, Get Product, Get
// Category Products, Get Brand Products and Get Deals need a store number or a ZIP (Price For).
// Store prices chain up to 51 lookups and calls can queue behind the backend's upstream limit,
// so every operation carries a 240s timeout, like Ace Hardware.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = 'Tractor Supply (tractorsupply.com, the US rural lifestyle retailer)';
const PRICED =
	"Tractor Supply prices by store, so send a store number or a ZIP (the nearest store Tractor Supply lists for it): priced_for (store_id, zone, city, state) names the store the prices are for. Tractor Supply's terms note that prices may vary in different geographic markets, so the same item can be priced differently at different stores.";
const ITEM =
	'items with item_number (for Get Product, Get Store Prices, Get Store Stock, Get Fulfillment and Get Promotions), part_number, name, brand, URL, image, price, price_min, price_max, was_price, on_sale, clearance, discount_percent, unit_price, badge, rating, review_count, availability, pickup and delivery flags';
const LIST =
	'plus priced_for, total, page, page_size, total_pages, breadcrumbs and facets (each value carries the filter Filters takes).';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged).`;
const STORE_HINT = 'A Tractor Supply store number (e.g. 1933, Glendive MT). Find Stores lists them near a ZIP.';
const ITEM_HINT = 'A 7-digit Tractor Supply item number (item_number from a list, e.g. 2340147)';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';
const PRICED_OPS = ['search', 'product', 'category', 'brand', 'deals'];
const MULTI_OPS = ['storePrices', 'storeStock'];

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'tractorsupplyPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Page 1-100',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const pageSizeOption: INodeProperties = {
	displayName: 'Page Size',
	name: 'tractorsupplyPageSize',
	type: 'options',
	default: 24,
	options: [
		{ name: '24', value: 24 },
		{ name: '48', value: 48 },
		{ name: '96', value: 96 },
		{ name: '200', value: 200 },
	],
	description: 'Products per page, as Tractor Supply lists them (default 24)',
	routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'tractorsupplySort',
	type: 'options',
	default: 'popular',
	options: [
		{ name: 'Most Popular', value: 'popular' },
		{ name: 'Name: A to Z', value: 'name_asc' },
		{ name: 'Name: Z to A', value: 'name_desc' },
		{ name: 'New Arrivals', value: 'new_arrivals' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Rating', value: 'rating' },
		{ name: 'Recent', value: 'recent' },
	],
	description: "Result order (Most Popular is Tractor Supply's default)",
	routing: { request: { body: { sort: '={{ $value === "popular" ? undefined : $value }}' } } },
};

const onSaleOption: INodeProperties = {
	displayName: 'On Sale Only',
	name: 'tractorsupplyOnSale',
	type: 'boolean',
	default: false,
	description: 'Whether to return only products on sale',
	routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
};

const newOption: INodeProperties = {
	displayName: 'New Arrivals Only',
	name: 'tractorsupplyNew',
	type: 'boolean',
	default: false,
	description: 'Whether to return only new arrivals',
	routing: { request: { body: { new: '={{ $value || undefined }}' } } },
};

const pickupOption: INodeProperties = {
	displayName: 'Pickup Only',
	name: 'tractorsupplyPickup',
	type: 'boolean',
	default: false,
	description: 'Whether to return only products the store offers for pickup',
	routing: { request: { body: { pickup: '={{ $value || undefined }}' } } },
};

const ratingOption: INodeProperties = {
	displayName: 'Minimum Rating',
	name: 'tractorsupplyRating',
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
	routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters',
	name: 'tractorsupplyFilters',
	type: 'string',
	default: '',
	placeholder: '2bb%3A%2250%20lb%22',
	description:
		"Comma-separated facet filters: the filter values from an earlier response's facets, sent exactly as given. At most 6 in all with brand, on sale, new, pickup and rating.",
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
	name: 'tractorsupplyBrandFilter',
	type: 'string',
	default: '',
	placeholder: 'Purina',
	description: "Only this brand (the Brand facet's value)",
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const keywordsOption: INodeProperties = {
	displayName: 'Keywords',
	name: 'tractorsupplyKeywords',
	type: 'string',
	default: '',
	description: 'Only products matching these keywords',
	routing: { request: { body: { query: '={{ $value || undefined }}' } } },
};

const baseListOptions = [pageOption, pageSizeOption, sortOption, pickupOption, ratingOption, filtersOption];

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

export const tractorsupplyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tractorsupply'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find tractor supply stores near a zip code',
				description: `The ${NAME} stores nearest a US ZIP code, in Tractor Supply's order: store_id, name, address, phone, coordinates, distance_miles, zone (the store's price zone), hours, services (propane, trailer rental, PetVet, pet wash, ...), store_pickup and dated store events. A ZIP with no store is a charged not-found. ${ONE}`,
				routing: request('/api/v1/tractorsupply/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get tractor supply brand products',
				description: `One brand's products on ${NAME}, priced for one store, optionally matching keywords, sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICED} A brand with no products is a charged not-found. ${CHARGE} Costs 1 credit (credits_used says what was charged).`,
				routing: request('/api/v1/tractorsupply/brand'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get tractor supply categories',
				description: `${NAME}'s departments, or one department's or category's categories (two levels): tree_id (for Parent ID), name, URL (for Get Category Products) and children. An unknown tree ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/tractorsupply/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get tractor supply category products',
				description: `One ${NAME} category's products by link, path, slug or listing ID, priced for one store, sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICED} A wrong category is a charged not-found. ${CHARGE} Costs 1 credit (credits_used says what was charged).`,
				routing: request('/api/v1/tractorsupply/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get tractor supply deals',
				description: `${NAME}'s products on sale or its new arrivals, priced for one store, optionally matching keywords, sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICED} ${ONE}`,
				routing: request('/api/v1/tractorsupply/deals'),
			},
			{
				name: 'Get Fulfillment',
				value: 'fulfillment',
				action: 'Get tractor supply fulfillment options',
				description: `How one ${NAME} item can reach a ZIP from one store, as Tractor Supply gives it: pickup (units at the store, status, in transit) and delivery options (standard delivery, same day delivery, ship to store) with delivery_date and the order cut-off. ${CHARGE} Costs 1 credit (credits_used says what was charged).`,
				routing: request('/api/v1/tractorsupply/fulfillment'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a tractor supply product',
				description: `One ${NAME} product or size in full by item number or link, priced for one store. ${PRICED} Returns priced_for, price, price_max, was_price, pickup_price, price_type, discount_percent, mapp (the manufacturer's minimum advertised price where Tractor Supply flags it; reported as given; flagged items can still show different prices at different stores), UPC, description, specifications, variants, breadcrumbs, fulfilment, promotions, rating and review_count (no review text). An unknown item is a charged not-found. ${CHARGE} Costs 1 credit (2 on the first call for a store not yet looked up).`,
				routing: request('/api/v1/tractorsupply/product'),
			},
			{
				name: 'Get Promotions',
				value: 'promotions',
				action: 'Get tractor supply item promotions',
				description: `The promotions ${NAME} lists for one item, with their dates: name, description, type, kind (product or shipping), site_wide, starts and ends (empty: open-ended). Ended promotions are left out. An unknown item is a charged not-found. ${ONE}`,
				routing: request('/api/v1/tractorsupply/promotions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a tractor supply store',
				description: `One ${NAME} store by store number: name, address, phone, coordinates, zone (the store's price zone), store_pickup, hours, services and dated store events. An unknown store number is a charged not-found. ${ONE}`,
				routing: request('/api/v1/tractorsupply/store'),
			},
			{
				name: 'Get Store Prices',
				value: 'storePrices',
				action: 'Get tractor supply prices across stores',
				description: `One ${NAME} item's price at up to 25 stores, or at the stores nearest a ZIP, as Tractor Supply shows it for each store: per store store_id, city, state, zone, price, was_price, pickup_price, price_type, on_sale, discount_percent and mapp, plus price_range (min, max). An unknown item is a charged not-found. ${CHARGE} Costs 1 credit per 5 lookups (each store's price, a store's details when not yet known, the item): 25 new stores cost 11.`,
				routing: request('/api/v1/tractorsupply/store-prices'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get tractor supply store stock',
				description: `Units on hand as ${NAME} reports them, for one item at up to 25 stores or at the stores nearest a ZIP: per store units, status, in_stock and in-transit units with the pickup date Tractor Supply gives, plus in_stock_count, total_units and in_transit_units. Stock is as Tractor Supply reports it, not a promise. An unknown item is a charged not-found. ${ONE}`,
				routing: request('/api/v1/tractorsupply/store-stock'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search tractor supply products',
				description: `Search ${NAME} by keywords, an item number or a UPC, priced for one store, sorted, filtered (brand, on sale, new, pickup, rating, any facet) and paged (24-200 a page): ${ITEM}, ${LIST} redirected_to names the category Tractor Supply sent the search to. ${PRICED} Not available: review text, search suggestions, the weekly ad, a clearance list, price history, Neighbor's Club member prices, checkout. ${ONE}`,
				routing: request('/api/v1/tractorsupply/search'),
			},
		],
		default: 'product',
	},
];

export const tractorsupplyFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword, Item Number or UPC',
		name: 'tractorsupplyQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'layer pellets',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
	},

	// -- Get Product --
	{
		displayName: 'Item Number or Product URL',
		name: 'tractorsupplyProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2340147',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					item_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: `${ITEM_HINT} or a tractorsupply.com product link`,
	},

	// -- Get Store Prices, Get Store Stock, Get Fulfillment, Get Promotions --
	{
		displayName: 'Item Number',
		name: 'tractorsupplyItemNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2340147',
		displayOptions: show([...MULTI_OPS, 'fulfillment', 'promotions']),
		routing: { request: { body: { item_number: '={{ $value }}' } } },
		description: ITEM_HINT,
	},

	// -- Category and Brand inputs come before the store choice --
	{
		displayName: 'Category',
		name: 'tractorsupplyCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/tsc/catalog/poultry-feed',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'A Tractor Supply category link or path (/tsc/catalog/poultry-feed), its slug (poultry-feed) or a listing category ID. Get Categories lists them.',
	},
	{
		displayName: 'Brand',
		name: 'tractorsupplyBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: "Producer's Pride",
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: "A brand as Tractor Supply names it (brand from a list, e.g. Purina, Producer's Pride, 4health)",
	},
	{
		displayName: 'Deal Type',
		name: 'tractorsupplyDealType',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'New Arrivals', value: 'new' },
			{ name: 'On Sale', value: 'sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "sale" ? undefined : $value }}' } } },
		description: 'Products on sale (default) or new arrivals',
	},

	// -- Price For (Search, Get Product, Get Category Products, Get Brand Products, Get Deals) --
	{
		displayName: 'Price For',
		name: 'tractorsupplyPriceBy',
		type: 'options',
		default: 'store',
		options: [
			{ name: 'Store Number', value: 'store' },
			{ name: 'ZIP Code (Nearest Store)', value: 'zip' },
		],
		displayOptions: show(PRICED_OPS),
		description:
			'Tractor Supply prices by store: price for a store number, or for the nearest store Tractor Supply lists for a ZIP code. One is required.',
	},
	{
		displayName: 'Store Number',
		name: 'tractorsupplyPriceStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1933',
		displayOptions: show(PRICED_OPS, { tractorsupplyPriceBy: ['store'] }),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: STORE_HINT,
	},
	{
		displayName: 'ZIP Code',
		name: 'tractorsupplyPriceZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '59330',
		displayOptions: show(PRICED_OPS, { tractorsupplyPriceBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP code: prices are for the nearest store Tractor Supply lists for it',
	},

	// -- Get Store Prices, Get Store Stock --
	{
		displayName: 'Check Stores By',
		name: 'tractorsupplyCheckBy',
		type: 'options',
		default: 'stores',
		options: [
			{ name: 'Store Numbers', value: 'stores' },
			{ name: 'ZIP Code (Nearest Stores)', value: 'zip' },
		],
		displayOptions: show(MULTI_OPS),
		description: 'Check the store numbers you choose (up to 25), or the stores nearest a ZIP code',
	},
	{
		displayName: 'Store Numbers',
		name: 'tractorsupplyStores',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1933, 1923',
		displayOptions: show(MULTI_OPS, { tractorsupplyCheckBy: ['stores'] }),
		routing: { request: { body: { stores: SPLIT } } },
		description: '1-25 comma-separated Tractor Supply store numbers (Find Stores lists them near a ZIP)',
	},
	{
		displayName: 'ZIP Code',
		name: 'tractorsupplyCheckZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '59301',
		displayOptions: show(MULTI_OPS, { tractorsupplyCheckBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'Check the stores nearest this US ZIP code',
	},
	{
		displayName: 'Additional Options',
		name: 'tractorsupplyCheckOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(MULTI_OPS, { tractorsupplyCheckBy: ['zip'] }),
		options: [
			{
				displayName: 'Max Stores',
				name: 'tractorsupplyCheckLimit',
				type: 'number',
				default: 5,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'How many of the nearest stores to check, 1-10. Defaults to 5.',
				routing: { request: { body: { limit: '={{ $value === 5 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Fulfillment, Get Store --
	{
		displayName: 'Store Number',
		name: 'tractorsupplyStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1933',
		displayOptions: show(['fulfillment', 'store']),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: STORE_HINT,
	},
	{
		displayName: 'Delivery ZIP Code',
		name: 'tractorsupplyFulfillmentZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '59330',
		displayOptions: show(['fulfillment']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'The 5-digit US ZIP code to deliver to',
	},
	{
		displayName: 'Additional Options',
		name: 'tractorsupplyFulfillmentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['fulfillment']),
		options: [
			{
				displayName: 'Quantity',
				name: 'tractorsupplyQuantity',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 999 },
				routing: { request: { body: { quantity: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'tractorsupplyStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '59301',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'The stores nearest this US ZIP code',
	},
	{
		displayName: 'Additional Options',
		name: 'tractorsupplyStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Limit',
				name: 'tractorsupplyStoresLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'How many stores (1-10)',
				routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Categories --
	{
		displayName: 'Parent ID',
		name: 'tractorsupplyParentId',
		type: 'string',
		default: '',
		placeholder: '1004851',
		displayOptions: show(['categories']),
		routing: { request: { body: { parent_id: '={{ $value || undefined }}' } } },
		description: 'Optional: a category tree ID (tree_id from an earlier answer) lists its categories, two levels. Empty: the departments.',
	},

	// -- Additional Options --
	listCollection('tractorsupplySearchOptions', 'search', [
		...baseListOptions,
		brandFilterOption,
		onSaleOption,
		newOption,
	]),
	listCollection('tractorsupplyCategoryOptions', 'category', [
		...baseListOptions,
		brandFilterOption,
		onSaleOption,
		newOption,
	]),
	listCollection('tractorsupplyBrandOptions', 'brand', [...baseListOptions, keywordsOption, onSaleOption, newOption]),
	listCollection('tractorsupplyDealsOptions', 'deals', [...baseListOptions, keywordsOption, brandFilterOption]),
];
