import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['dollartree'], operation, ...extra },
});

// Dollar Tree (dollartree.com, the US and Canada discount variety store chain), 10 operations,
// 1 credit each except Find Stores (5); credits_used is the truth. Every operation is US only and
// sends no country, except Get Store, which also takes Canada (Dollar Tree Canada store pages,
// English, no prices). Calls can queue behind the backend's upstream limit, so every operation
// carries a 240s timeout, and Get Store Stock, Find Stores and Get Reviews (slow pages, up to
// about 2.5 minutes) 300s.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false, timeout = 240000) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_TIMEOUT = 300000;

const NAME = 'Dollar Tree (dollartree.com, the US and Canada discount variety store chain)';
const PRICES =
	"Prices are Dollar Tree's online unit prices (USD) from one national online price list (the same at every store and ZIP measured); Dollar Tree notes that prices and availability may vary between stores and online, and in-store shelf prices are not published online. Online orders are by the case: case_price is the price of case_pack units and minimum_quantity the order minimum, as Dollar Tree gives them (null when Dollar Tree gives 0); stores sell single units.";
const ITEM =
	'items with item_id (for Get Product, Get Store Stock and Get Reviews), name, brand, URL, image, price (unit), list_price, on_sale, case_price, case_pack, minimum_quantity, split_case, rating, review_count, in-store-only, clearance and new flags, UPCs as given and categories';
const LIST =
	'plus market, total, page, page_size (48 by default), total_pages and facets (each values[].id is what Filters takes).';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged)';
const SLOW = 'Slow: usually 10-35 s, up to about 2.5 minutes.';
const ITEM_HINT =
	'A Dollar Tree item number (item_id from a list, the number at the end of a dollartree.com product link, e.g. 221159) or a dollartree.com product link. UPCs are not item numbers.';
const ARRAY = '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}';
const IS_URL = '/^https?:/i.test(String($value).trim())';
const itemBody = {
	url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
	item_id: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
};

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'dollartreePage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 200 },
	description: 'Page, 1-200',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const pageSizeOption: INodeProperties = {
	displayName: 'Page Size',
	name: 'dollartreePageSize',
	type: 'number',
	default: 48,
	typeOptions: { minValue: 1, maxValue: 250 },
	description: "Items per page, 1-250 (48 is the site's own page size)",
	routing: { request: { body: { page_size: '={{ $value === 48 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'dollartreeSort',
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Highest Rated', value: 'rating' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_high' },
		{ name: 'Price: Low to High', value: 'price_low' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description: "Result order (Relevance is Dollar Tree's default)",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'dollartreeFilters',
	type: 'json',
	default: '',
	placeholder: '["3543933063"]',
	description:
		'Up to 10 refinement IDs exactly as an earlier response gives them in its facets (the ID of each value: price point, rating, material, color, collection, dietary needs); several are combined',
	routing: { request: { body: { filters: ARRAY } } },
};

const pricePointOption: INodeProperties = {
	displayName: 'Price Point',
	name: 'dollartreePricePoint',
	type: 'string',
	default: '',
	placeholder: '1.25',
	description: "Only items at this price point, as Dollar Tree's Price facet lists them (e.g. 1.25, 1.50, 5.00)",
	routing: { request: { body: { price_point: '={{ $value || undefined }}' } } },
};

const ratingOption: INodeProperties = {
	displayName: 'Minimum Rating',
	name: 'dollartreeRating',
	type: 'options',
	default: 0,
	options: [
		{ name: '1 Star and Up', value: 1 },
		{ name: '2 Stars and Up', value: 2 },
		{ name: '3 Stars and Up', value: 3 },
		{ name: '4 Stars and Up', value: 4 },
		{ name: '5 Stars', value: 5 },
		{ name: 'Any', value: 0 },
	],
	description: 'Only items rated this many stars and up',
	routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
};

const inStoreOnlyOption: INodeProperties = {
	displayName: 'In-Store Only',
	name: 'dollartreeInStoreOnly',
	type: 'boolean',
	default: false,
	description: 'Whether to return only items Dollar Tree sells in stores only (not shipped)',
	routing: { request: { body: { in_store_only: '={{ $value || undefined }}' } } },
};

const minPriceOption: INodeProperties = {
	displayName: 'Min Price',
	name: 'dollartreeMinPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Lowest unit price in USD (0: no minimum)',
	routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
};

const maxPriceOption: INodeProperties = {
	displayName: 'Max Price',
	name: 'dollartreeMaxPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Highest unit price in USD (0: no maximum)',
	routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
};

const brandOption: INodeProperties = {
	displayName: 'Brand',
	name: 'dollartreeBrandFilter',
	type: 'string',
	default: '',
	placeholder: 'Dixie',
	description: "Only this brand, as Dollar Tree writes it (the Brand facet's labels)",
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const categoryOption: INodeProperties = {
	displayName: 'Category',
	name: 'dollartreeCategoryFilter',
	type: 'string',
	default: '',
	placeholder: '4070223595',
	description: 'Only items in this category (a dimension_id from Get Categories or a Category facet value ID)',
	routing: { request: { body: { category: '={{ $value || undefined }}' } } },
};

const keywordsOption: INodeProperties = {
	displayName: 'Keywords',
	name: 'dollartreeKeywords',
	type: 'string',
	default: '',
	description: 'Keywords inside the listing',
	routing: { request: { body: { q: '={{ $value || undefined }}' } } },
};

const baseListOptions = [
	pageOption,
	pageSizeOption,
	sortOption,
	filtersOption,
	pricePointOption,
	ratingOption,
	inStoreOnlyOption,
	minPriceOption,
	maxPriceOption,
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const collection = (name: string, operation: string, options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...options]),
});

export const dollartreeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['dollartree'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find dollar tree stores near a zip code',
				description: `The ${NAME} stores near a US ZIP or city, as Dollar Tree's store locator lists them (20 per response): store_number, name, address, phone, coordinates, distance_miles, hours, holiday_hours, accepts_ebt, frozen_foods, more_choices, payment options, slug and URL, plus total. ${SLOW} Costs 5 credits (credits_used says what was charged); failed upstream calls and refused inputs are not charged.`,
				routing: request('/api/v1/dollartree/stores', false, SLOW_TIMEOUT),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get dollar tree brand products',
				description: `One brand's ${NAME} items (United States), sorted, filtered and paged, with brand_id and the other spellings Dollar Tree lists the same brand under: ${ITEM}, ${LIST} ${PRICES} A brand Dollar Tree does not list is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dollartree/brand'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get dollar tree categories',
				description: `${NAME}'s category tree (United States): the departments with every sub-category, or one category's sub-categories, each with ID, name, dimension_id (the input of Get Category Products), URL and children. An unknown category is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dollartree/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get dollar tree category products',
				description: `One ${NAME} category listing by dimension_id or dollartree.com category link (United States), sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICES} An unknown category is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dollartree/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get dollar tree deals',
				description: `${NAME}'s sale, clearance, New Arrivals or More Choices (Dollar Tree's multi-price assortment) items (United States), sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICES} Dollar Tree publishes no validity dates and no weekly ad. ${ONE}.`,
				routing: request('/api/v1/dollartree/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a dollar tree product',
				description: `One ${NAME} item in full by item number or link: price (unit), list_price, sale_price, unit_price_text, case_price, case_pack, minimum_quantity, split_case (available, multiple, fee), not_for_individual_sale, UPCs as given, rating, review_count, delivery options, order_limit, online_stock (units Dollar Tree can ship), specifications, categories and child SKUs. ${PRICES} An unknown item is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dollartree/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get dollar tree product reviews',
				description: `The newest English reviews of one ${NAME} item (up to about 98 per call, newest first): rating, title, text, date, recommended, syndicated and syndication_source (many are syndicated from brand sites), secondary ratings, helpful votes, photos and responses, plus rating, review_count and rating_breakdown. No other sort, no star filter, no questions and answers; no reviewer names. An unknown item is a charged not-found. ${SLOW} ${ONE}.`,
				routing: request('/api/v1/dollartree/reviews', false, SLOW_TIMEOUT),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a dollar tree store',
				description: `One ${NAME} store page by link or slug (United States, or Canada: English store pages with no prices): store_number, name, address, phone, coordinates, hours, holiday_hours, services (EBT, frozen foods, More Choices) and nearby stores. An unknown store page is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dollartree/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get dollar tree store stock',
				description: `Units of one ${NAME} item at a store, as Dollar Tree's product page reports them for the store chosen: the store's units and status, up to about 63 nearby stores by store number with their units, nearby_in_stock, ship_to_home (units, cases, ETA) and ship_to_store (ETA). Stores sell single units. A store number is required: a ZIP alone does not pick a store (Find Stores gives the store numbers near a ZIP). Price does not change by store. An unknown item or store is a charged not-found. ${SLOW} ${ONE}.`,
				routing: request('/api/v1/dollartree/store-stock', false, SLOW_TIMEOUT),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search dollar tree products',
				description: `Search ${NAME} United States by keywords or a Dollar Tree item number (an item number answers with that item), sorted, filtered (category, brand, price point, rating, in-store only, price, any facet) and paged: ${ITEM}, ${LIST} ${PRICES} Dollar Tree's search does not match UPCs. Not available: search suggestions, the weekly ad, deal validity dates, Quick Order / bulk ordering, gift cards, Canada products and prices, price history, checkout. ${ONE}.`,
				routing: request('/api/v1/dollartree/search'),
			},
		],
		default: 'search',
	},
];

export const dollartreeFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword or Item Number',
		name: 'dollartreeQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'paper plates',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ $value }}' } } },
	},

	// -- Get Product, Get Store Stock, Get Reviews --
	{
		displayName: 'Item Number or Product URL',
		name: 'dollartreeItem',
		type: 'string',
		required: true,
		default: '',
		placeholder: '221159',
		displayOptions: show(['product', 'storeStock', 'reviews']),
		routing: { request: { body: itemBody } },
		description: ITEM_HINT,
	},
	{
		displayName: 'Store Number',
		name: 'dollartreeStockStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5126',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: 'A Dollar Tree store number (store_number from Find Stores)',
	},
	collection('dollartreeStockOptions', 'storeStock', [
		{
			displayName: 'Store ZIP Code',
			name: 'dollartreeStockZip',
			type: 'string',
			default: '',
			placeholder: '10035',
			description: "Optional: the store's ZIP, sent along with the store as Dollar Tree's own store picker does",
			routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Store State',
			name: 'dollartreeStockState',
			type: 'string',
			default: '',
			placeholder: 'NY',
			description: "Optional: the store's two-letter state, sent along with the store",
			routing: { request: { body: { state: '={{ $value || undefined }}' } } },
		},
	]),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'dollartreeCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3804024826',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A Dollar Tree category: a dimension_id from Get Categories (e.g. 3804024826, Christmas Decor) or a dollartree.com category link',
	},

	// -- Get Categories --
	{
		displayName: 'Parent Category',
		name: 'dollartreeParentCategory',
		type: 'string',
		default: '',
		placeholder: '2264625405',
		displayOptions: show(['categories']),
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		description: 'Optional: one category (dimension_id, ID or link) lists its sub-categories. Empty: the departments with every sub-category.',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'dollartreeBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Dixie',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: "A brand as Dollar Tree writes it (search's Brand facet labels); matched case-insensitively",
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'dollartreeDealType',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'More Choices', value: 'more_choices' },
			{ name: 'New Arrivals', value: 'new' },
			{ name: 'Sale', value: 'sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "sale" ? undefined : $value }}' } } },
		description: "Dollar Tree's deal listing (Sale is the default; More Choices is Dollar Tree's multi-price department). Category applies to Sale and Clearance only.",
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'dollartreeStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find the stores near a US ZIP code or a city',
	},
	{
		displayName: 'ZIP Code',
		name: 'dollartreeStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60540',
		displayOptions: show(['stores'], { dollartreeStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP code',
	},
	{
		displayName: 'City',
		name: 'dollartreeStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Naperville, IL',
		displayOptions: show(['stores'], { dollartreeStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'A US city and state, e.g. Naperville, IL',
	},

	// -- Get Store --
	{
		displayName: 'Store Page URL or Slug',
		name: 'dollartreeStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ny/new-york/2182-3rd-avenue',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
					slug: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
				},
			},
		},
		description: 'A Dollar Tree store page (the URL from Find Stores) or its slug, e.g. ny/new-york/2182-3rd-avenue (Canada: on/toronto/2340-eglinton-ave-west)',
	},
	{
		displayName: 'Country',
		name: 'dollartreeStoreCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['store']),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'United States (Dollar Tree store pages) or Canada (Dollar Tree Canada store pages, English, no prices)',
	},

	// -- Additional Options --
	collection('dollartreeSearchOptions', 'search', [...baseListOptions, brandOption, categoryOption]),
	collection('dollartreeCategoryOptions', 'category', [...baseListOptions, brandOption, keywordsOption]),
	collection('dollartreeBrandOptions', 'brand', [...baseListOptions, categoryOption]),
	collection('dollartreeDealsOptions', 'deals', [...baseListOptions, brandOption, categoryOption, keywordsOption]),
];
