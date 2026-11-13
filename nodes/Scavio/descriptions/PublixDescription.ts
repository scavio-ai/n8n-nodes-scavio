import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['publix'], operation, ...extra },
});

// Publix (publix.com, US), 11 operations, 1 credit each. Every price operation is store-scoped:
// it takes a Publix store number from Find Stores. Every route carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const PRICES =
	'Publix shows prices online only for items on sale and for order-ahead (deli and bakery) items, so price is a number only when the site shows one and null otherwise; it is never estimated (no regular shelf prices). price_text is the price as shown, bundle {quantity, price} for multi-buys (2 for $5.00), starting_price for "Starts at" items, regular_price the crossed-out price.';
const STORE =
	'Aisles, promotions and prices are those of the store you pick (returned in store); they differ by store.';
const ITEM =
	'item_code, base_product_id, title, brand, size, description, image, URL, category_path, aisle, on_sale, price, price_unit, bundle, starting_price, regular_price, price_text, regular_price_text, promo (type single, bogo or multi; message, conditions, savings, valid_from, valid_through), has_coupon and is_order_ahead';
const GRID = `total, page, page_size (48), total_pages, count, sort, applied_filters, facets and items with ${ITEM}.`;
const CHARGE =
	'Failed upstream calls are not charged (they are retried automatically); a not-found is charged.';

const STORE_ID_DESCRIPTION =
	'A Publix store number from Find Stores (stores[].store_id), e.g. 1614 (Miami) or 1825 (Atlanta)';

const PRICE_OPS = [
	'search',
	'product',
	'category',
	'weeklyAd',
	'extraSavings',
	'coupons',
	'savingsSearch',
	'orderAhead',
];

export const publixOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['publix'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find publix stores',
				description: `Publix stores near a ZIP, in a city (with state), or one store by number: store_id (for every other operation), name, short_name, type, address, phone, hours for the next 7 days, time_zone, departments, services, pharmacy (phone, hours), liquor_store, latitude, longitude, distance_miles, weekly_ad_break_day (the day the store's weekly ad starts), opening_date, closing_date and image. Publix operates in FL, GA, AL, SC, NC, TN, VA and KY. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get publix categories',
				description: `The Publix category tree: departments with their categories and sub-categories, each with ID (for Get Category Products), name, URL, parent_id, level and children; plus count. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get publix category products',
				description: `One Publix category's products at one store, by category URL or ID, with the search sorts and filters. Returns category (ID, name, path), store and ${GRID} ${STORE} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/category'),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get publix digital coupons',
				description: `The store's Publix digital coupons (about 100-130): ID, title, description, brand, savings_text, value, min_quantity, limit_per_transaction, categories, valid_from, valid_to, terms and image; plus store and count. Listing only: coupons are never clipped and no account is used. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/coupons'),
			},
			{
				name: 'Get Extra Savings',
				value: 'extraSavings',
				action: 'Get publix extra savings',
				description: `The store's Publix Extra Savings (temporary price reductions): ID, base_product_id, title, size, brand, categories, savings_text, savings, additional_savings, final_price (as the site lists it), min_quantity, image and URL; plus store, count and period (start_date, end_date). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/extra-savings'),
			},
			{
				name: 'Get Order Ahead Menu',
				value: 'orderAhead',
				action: 'Get publix order ahead menu',
				description: `The store's Publix deli and bakery order-ahead menu with this store's prices: Pub Subs or the whole catalog of subs, platters, cakes, wings and meals (60 per page). Each item: ${ITEM}, short_description, lead_time, serves, calories and pay_online. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/order-ahead'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a publix product',
				description: `One Publix product by item code at one store: the product card (${ITEM}) and its nutrition facts (every nutrient with amount, unit and percent daily value; null when Publix has none). Publix does not publish ingredients, allergens, UPC or reviews online. ${STORE} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get publix search suggestions',
				description: `The suggestions the Publix search box shows for a partial query: up to 10 popular searches and, with a store ID, up to 4 products (item_code, title, description, image, URL). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/suggestions'),
			},
			{
				name: 'Get Weekly Ad',
				value: 'weeklyAd',
				action: 'Get publix weekly ad',
				description: `The store's current Publix weekly ad (English), about 700 items: BOGO deals (about 230 a week), sale prices, multi-buys and percent-off deals, with ad (start_date, end_date), departments and items with savings_text, deal_type (bogo, b2g1, multi, price, percent_off or other), price (only for a plain price), price_unit, bundle, save_up_to, department, promotion, valid_from and valid_to. Ads run Thursday to Wednesday in Florida and Wednesday to Tuesday in Georgia and North Carolina. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/weekly-ad'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search publix products',
				description: `Search Publix products at one store by keyword. Returns query, corrected_query, store and ${GRID} Keywords the site sends to an order-ahead page set redirected_to. ${STORE} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/search'),
			},
			{
				name: 'Search Savings',
				value: 'savingsSearch',
				action: 'Search publix savings',
				description: `Find a keyword across the store's Publix weekly ad, Extra Savings and digital coupons in one call: query, store, count and items, each with saving_type (weekly_ad, extra_savings or coupon) and that feed's fields. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/publix/savings-search'),
			},
		],
		default: 'search',
	},
];

export const publixFields: INodeProperties[] = [
	// -- Store ID: every price operation --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1614',
		displayOptions: show(PRICE_OPS),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: STORE_ID_DESCRIPTION,
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'chicken',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Item Code',
		name: 'itemCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90355',
		displayOptions: show(['product']),
		routing: { request: { body: { item_code: '={{ $value }}' } } },
		description:
			'A Publix item code (not a UPC): items[].item_code of Search Products, Get Category Products or Get Order Ahead Menu',
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'categoryBy',
		type: 'options',
		default: 'url',
		options: [
			{ name: 'Category ID', value: 'id' },
			{ name: 'Category URL', value: 'url' },
		],
		displayOptions: show(['category']),
		description: 'Read a category by its publix.com link or by its ID from Get Categories',
	},
	{
		displayName: 'Category URL',
		name: 'category_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.publix.com/c/chicken/6772da29-55bf-4051-83d5-104d73ae9a96',
		displayOptions: show(['category'], { categoryBy: ['url'] }),
		routing: { request: { body: { category_url: '={{ $value }}' } } },
		description: 'A publix.com category link (/c/&lt;name&gt;/&lt;ID&gt;)',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6772da29-55bf-4051-83d5-104d73ae9a96',
		displayOptions: show(['category'], { categoryBy: ['id'] }),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'A category ID (categories[].ID of Get Categories)',
	},

	// -- Search Savings --
	{
		displayName: 'Keyword',
		name: 'savingsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coffee',
		displayOptions: show(['savingsSearch']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "A keyword to find in the store's weekly ad, Extra Savings and digital coupons",
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'findBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'Store ID', value: 'storeId' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP or in a city, or read one store by number',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '33101',
		displayOptions: show(['stores'], { findBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP code: the stores nearest to it',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Nashville',
		displayOptions: show(['stores'], { findBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'A city name',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TN',
		displayOptions: show(['stores'], { findBy: ['city'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: 'A 2-letter state code (FL, GA, AL, SC, NC, TN, VA or KY)',
	},
	{
		displayName: 'Store ID',
		name: 'storeLookupId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1825',
		displayOptions: show(['stores'], { findBy: ['storeId'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A Publix store number',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'suggestionQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'chick',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What a shopper has typed so far',
	},

	// -- Get Order Ahead Menu --
	{
		displayName: 'Section',
		name: 'orderAheadSection',
		type: 'options',
		default: 'subs',
		options: [
			{ name: 'All (Subs, Platters, Cakes, Meals)', value: 'all' },
			{ name: 'Pub Subs', value: 'subs' },
		],
		displayOptions: show(['orderAhead']),
		routing: { request: { body: { section: '={{ $value }}' } } },
		description: 'The Pub Sub menu or the whole deli and bakery order-ahead catalog',
	},

	// -- Additional Options: Search Products, Get Category Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search', 'category']),
		options: [
			{
				displayName: 'BOGO Only',
				name: 'bogo',
				type: 'boolean',
				default: false,
				description: 'Whether to return only Buy One Get One Free items at the store',
				routing: { request: { body: { bogo: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Brand',
				name: 'brand',
				type: 'string',
				default: '',
				placeholder: 'Tyson',
				description: 'Only this brand, as the site lists it (facets: Brand values)',
				routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only items on sale at the store (weekly ad, BOGO, multi-buy or extra savings)',
				routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 48 products per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Featured', value: 'featured' },
					{ name: 'Most Viewed', value: 'most_viewed' },
					{ name: 'Name: A to Z', value: 'name_asc' },
					{ name: 'Name: Z to A', value: 'name_desc' },
					{ name: 'Popularity', value: 'popularity' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Savings Amount (Biggest First)', value: 'savings_amount' },
				],
				description: 'Result order',
				routing: {
					request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
				},
			},
		],
	},

	// -- Additional Options: Get Weekly Ad --
	{
		displayName: 'Additional Options',
		name: 'weeklyAdOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['weeklyAd']),
		options: [
			{
				displayName: 'BOGO Only',
				name: 'bogo_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only Buy 1 Get 1 Free and Buy 2 Get 1 Free items',
				routing: { request: { body: { bogo_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Department',
				name: 'department',
				type: 'string',
				default: '',
				placeholder: 'Produce',
				description:
					'Only items of this department (departments of the answer, e.g. Meat, Deli, Wine)',
				routing: { request: { body: { department: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Text Match',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'apple',
				description: 'Only items whose title, description or brand contains this text',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Order Ahead Menu --
	{
		displayName: 'Additional Options',
		name: 'orderAheadOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['orderAhead']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Results page, 60 items per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
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
				displayName: 'Parent ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				description: "Return only this department's or category's subtree (categories[].ID)",
				routing: { request: { body: { parent_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '1614',
				description: STORE_ID_DESCRIPTION,
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Find Stores --
	{
		displayName: 'Additional Options',
		name: 'storeOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Stores to Return',
				name: 'storeCount',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Stores to return, 1 to 30',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius_miles',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles',
				routing: { request: { body: { radius_miles: '={{ $value }}' } } },
			},
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
		options: [
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '1614',
				description: `${STORE_ID_DESCRIPTION}. With a store the answer also carries up to 4 products.`,
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
		],
	},
];
