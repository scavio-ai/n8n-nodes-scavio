import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const NA_COUNTRIES: INodePropertyOptions[] = [
	{ name: 'Canada (Costco.ca)', value: 'ca' },
	{ name: 'United States (Costco.com)', value: 'us' },
];

const ALL_COUNTRIES: INodePropertyOptions[] = [
	{ name: 'Australia', value: 'au' },
	{ name: 'Canada (Costco.ca)', value: 'ca' },
	{ name: 'Japan', value: 'jp' },
	{ name: 'Mexico', value: 'mx' },
	{ name: 'South Korea', value: 'kr' },
	{ name: 'Taiwan', value: 'tw' },
	{ name: 'United Kingdom', value: 'uk' },
	{ name: 'United States (Costco.com)', value: 'us' },
];

function countryOption(all: boolean): INodeProperties {
	return {
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: all ? ALL_COUNTRIES : NA_COUNTRIES,
		description: all
			? 'Costco site. United States and Canada support every filter; the other sites support keyword, sort and paging only.'
			: 'Costco.com (United States) or Costco.ca (Canada)',
		routing: { request: { body: { country: '={{ $value }}' } } },
	};
}

/** Filters shared by Search Products, Get Category Products and Get Deals. */
function listingOptions(all: boolean): INodeProperties[] {
	return [
		{
			displayName: 'Brands',
			name: 'brands',
			type: 'string',
			default: '',
			placeholder: 'Kirkland Signature',
			description: 'Brand names separated by commas, up to 20',
			routing: { send: { type: 'body', property: 'brands', value: splitList } },
		},
		countryOption(all),
		{
			displayName: 'In Stock Only',
			name: 'in_stock',
			type: 'boolean',
			default: false,
			description: 'Whether to hide out-of-stock items',
			routing: { request: { body: { in_stock: '={{ $value }}' } } },
		},
		{
			displayName: 'In Stock at Warehouse',
			name: 'in_warehouse',
			type: 'boolean',
			default: false,
			description:
				'Whether to keep only items sold and in stock at the warehouse set in Warehouse ID (requires Warehouse ID)',
			routing: { request: { body: { in_warehouse: '={{ $value }}' } } },
		},
		{
			displayName: 'Max Price',
			name: 'max_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, numberPrecision: 2 },
			description: 'Maximum online price, inclusive',
			routing: { request: { body: { max_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'min_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, numberPrecision: 2 },
			description: 'Minimum online price, inclusive',
			routing: { request: { body: { min_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Min Rating',
			name: 'min_rating',
			type: 'number',
			default: 4,
			typeOptions: { minValue: 1, maxValue: 5 },
			description: 'Minimum average star rating, 1-5',
			routing: { request: { body: { min_rating: '={{ $value }}' } } },
		},
		{
			displayName: 'On Sale Only',
			name: 'on_sale',
			type: 'boolean',
			default: false,
			description: 'Whether to keep only items with an active discount',
			routing: { request: { body: { on_sale: '={{ $value }}' } } },
		},
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
			typeOptions: { minValue: 1, maxValue: 120 },
			description: 'Results per page, up to 120. Defaults to 24.',
			routing: { request: { body: { page_size: '={{ $value }}' } } },
		},
		{
			displayName: 'Sort By',
			name: 'sort_by',
			type: 'options',
			default: 'best_match',
			options: [
				{ name: 'Best Match', value: 'best_match' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_high' },
				{ name: 'Price: Low to High', value: 'price_low' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description: 'Result order. Costco broadens matching under any sort other than Best Match.',
			routing: { request: { body: { sort_by: '={{ $value }}' } } },
		},
		{
			displayName: 'Warehouse ID',
			name: 'warehouse_id',
			type: 'string',
			default: '',
			placeholder: '1062',
			description:
				"Adds that warehouse's in-store price, stock status and price code to every result. Warehouse numbers come from Get Warehouses. Leave unset for online prices only.",
			routing: { request: { body: { warehouse_id: '={{ $value }}' } } },
		},
	];
}

function additionalOptions(operation: string[], options: INodeProperties[]): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['costco'], operation } },
		options,
	};
}

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['costco'], operation, ...extra },
});

export const costcoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['costco'] } },
		options: [
			{
				name: 'Find Clearance Items',
				value: 'clearance',
				action: 'Find costco clearance items',
				description:
					'Scan a query or category at one warehouse and return the items whose in-warehouse price carries a markdown code: .97 clearance and .00/.88 manager markdown by default, .49/.79/.89 special buy on request. The codes are the member-community decode; Costco does not publish them, and only items Costco lists online are covered. Costs 2 credits in the United States at any page count, 1 on Costco.ca.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/clearance', timeout: 120000 } },
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get costco warehouse availability',
				description:
					'In-warehouse stock status for one item at up to 10 warehouses, plus pickup and same-day delivery availability. Status only, never quantities. Costs 1 credit per 5 warehouses.',
				routing: {
					request: { method: 'POST', url: '/api/v1/costco/availability', timeout: 120000 },
				},
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get costco categories',
				description:
					'The Costco department list, or the full subcategory tree under one department. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/categories' } },
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get costco category products',
				description:
					'Products in a Costco category, with the same sort, filters and per-warehouse pricing as search. Costs 2 credits in the United States, 1 on Costco.ca.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/category' } },
			},
			{
				name: 'Get Coupon Book',
				value: 'coupons',
				action: 'Get the costco coupon book',
				description:
					"The current Costco member coupon book: every offer with its item number, amount off, final price, warehouse/online scope, limits and the book's valid dates. United States only, no parameters. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/costco/coupons' } },
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get costco deals',
				description:
					'Costco deal feeds: new items, while supplies last, treasure hunt, member favorites, online-only and everything on sale, with the same filters and optional per-warehouse pricing as search. Costs 2 credits in the United States, 1 on Costco.ca.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/deals' } },
			},
			{
				name: 'Get Gas Prices',
				value: 'gas',
				action: 'Get costco gas prices',
				description:
					'Current regular, premium and diesel prices at Costco gas stations near a ZIP code or coordinates, or at specific warehouses. By location costs 1 credit (2 on Costco.ca); by warehouse IDs costs 1 credit per 5 warehouses (2 credits per warehouse on Costco.ca).',
				routing: { request: { method: 'POST', url: '/api/v1/costco/gas', timeout: 120000 } },
			},
			{
				name: 'Get Products',
				value: 'product',
				action: 'Get costco products',
				description:
					'Full details for up to 20 Costco items: description, features, specifications, variants, member-only and purchase limits, delivery fee, and promotions with start and end dates. Costs 1 credit for up to 20 items.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get costco product reviews',
				description:
					'Customer reviews for a Costco product with the rating distribution and recommend count; sort, star filter and up to 100 reviews per page. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/reviews' } },
			},
			{
				name: 'Get Search Suggestions',
				value: 'autocomplete',
				action: 'Get costco search suggestions',
				description:
					'Costco search suggestions for a partial query, plus matching warehouse locations. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/autocomplete' } },
			},
			{
				name: 'Get Warehouse Prices',
				value: 'prices',
				action: 'Get costco warehouse prices',
				description:
					"Online price versus in-warehouse price for up to 20 items across up to 10 warehouses, with each location's discount, final price, promotion start and end dates, per-order and per-member limits and price code. Costs 1 credit for up to 9 warehouses, 2 credits at 10.",
				routing: { request: { method: 'POST', url: '/api/v1/costco/prices', timeout: 120000 } },
			},
			{
				name: 'Get Warehouses',
				value: 'warehouses',
				action: 'Get costco warehouses',
				description:
					'Costco warehouses near a ZIP code or coordinates: address, hours, departments, services, and gas station hours and prices. Costs 1 credit, 2 on Costco.ca.',
				routing: { request: { method: 'POST', url: '/api/v1/costco/warehouses' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search costco products',
				description:
					"Search Costco by keyword or item number: online price and original price, ratings, member-only and stock flags, promotions and facets. Set Warehouse ID to add that warehouse's in-store price, stock and price code to every result. Costs 2 credits in the United States, 1 elsewhere.",
				routing: { request: { method: 'POST', url: '/api/v1/costco/search' } },
			},
		],
		default: 'search',
	},
];

export const costcoFields: INodeProperties[] = [
	// ── Search Products / Get Search Suggestions ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'olive oil',
		displayOptions: show(['search', 'autocomplete']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Keywords or a Costco item number. On Get Search Suggestions, a partial query such as "kirk".',
	},

	// ── Get Category Products ──
	{
		displayName: 'Category',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'televisions',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'Category slug from Get Categories, or a costco.com category URL',
	},

	// ── Get Deals ──
	{
		displayName: 'Deal Type',
		name: 'type',
		type: 'options',
		required: true,
		default: 'while_supplies_last',
		options: [
			{ name: 'Member Favorites', value: 'member_favorites' },
			{ name: 'New Items', value: 'new' },
			{ name: 'On Sale', value: 'on_sale' },
			{ name: 'Online Only', value: 'online_only' },
			{ name: 'Treasure Hunt', value: 'treasure_hunt' },
			{ name: 'While Supplies Last', value: 'while_supplies_last' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Which Costco deal feed to read',
	},

	// ── Get Products / Get Warehouse Prices ──
	{
		displayName: 'Item IDs',
		name: 'item_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '100334960, 1492456',
		displayOptions: show(['product', 'prices']),
		routing: { send: { type: 'body', property: 'item_ids', value: splitList } },
		description:
			'Costco item numbers, product IDs or costco.com product URLs, separated by commas, up to 20. Sites outside the United States and Canada take one item per call.',
	},

	// ── Get Availability ──
	{
		displayName: 'Item Number',
		name: 'item_number',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1492456',
		displayOptions: show(['availability']),
		routing: { request: { body: { item_number: '={{ $value }}' } } },
		description: 'Costco item number or product ID, or a costco.com product URL',
	},

	// ── Get Warehouse Prices / Get Availability: warehouses ──
	{
		displayName: 'Warehouse IDs',
		name: 'warehouse_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1062, 1107',
		displayOptions: show(['prices', 'availability']),
		routing: { send: { type: 'body', property: 'warehouse_ids', value: splitList } },
		description:
			'Costco warehouse numbers separated by commas, up to 10. Find them with Get Warehouses. On Get Warehouse Prices the online price is always included.',
	},

	// ── Get Reviews ──
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '100334960',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'Costco product ID: the product_id field from Search Products or Get Products',
	},

	// ── Get Warehouses / Get Gas Prices: location ──
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['warehouses']),
		description: 'Find warehouses near a ZIP code or a latitude/longitude pair',
	},
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'Warehouse IDs', value: 'warehouses' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['gas']),
		description: 'Find gas stations near a ZIP code or coordinates, or read specific warehouses',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10025',
		displayOptions: show(['warehouses', 'gas'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['warehouses', 'gas'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['warehouses', 'gas'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Warehouse IDs',
		name: 'gas_warehouse_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1062, 1107',
		displayOptions: show(['gas'], { locateBy: ['warehouses'] }),
		routing: { send: { type: 'body', property: 'warehouse_ids', value: splitList } },
		description:
			'Costco warehouse numbers separated by commas, up to 10. 1 credit per 5 warehouses; on Costco.ca, 2 credits per warehouse.',
	},

	// ── Find Clearance Items ──
	{
		displayName: 'Warehouse ID',
		name: 'warehouse_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1062',
		displayOptions: show(['clearance']),
		routing: { request: { body: { warehouse_id: '={{ $value }}' } } },
		description: 'Costco warehouse number to scan, from Get Warehouses',
	},
	{
		displayName: 'Scan By',
		name: 'scanBy',
		type: 'options',
		default: 'query',
		options: [
			{ name: 'Category', value: 'category' },
			{ name: 'Query', value: 'query' },
		],
		displayOptions: show(['clearance']),
		description: 'Scan the results of a keyword query or of a category',
	},
	{
		displayName: 'Query',
		name: 'clearance_query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tv',
		displayOptions: show(['clearance'], { scanBy: ['query'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Keywords whose results are scanned for markdown codes',
	},
	{
		displayName: 'Category',
		name: 'clearance_category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'televisions',
		displayOptions: show(['clearance'], { scanBy: ['category'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'Category slug from Get Categories to scan instead of a query',
	},

	// ── Additional Options ──
	additionalOptions(['search'], listingOptions(true)),
	additionalOptions(['category', 'deals'], listingOptions(false)),
	additionalOptions(
		['categories'],
		[
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: '30001',
				description:
					'Leave unset for the top-level departments; set a category ID for its full subcategory tree',
				routing: { request: { body: { category_id: '={{ $value }}' } } },
			},
			countryOption(false),
		],
	),
	additionalOptions(['product'], [countryOption(true)]),
	additionalOptions(['prices', 'availability', 'autocomplete'], [countryOption(false)]),
	additionalOptions(
		['reviews'],
		[
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Reviews per page, 1 to 100. The API default is 25.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Review page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'rating',
				type: 'number',
				default: 5,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: 'Only reviews with this star rating, 1-5',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Review order. Defaults to Newest.',
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['warehouses'],
		[
			countryOption(true),
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Nearest warehouses to return, 1 to 50. The API default is 10.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['gas'],
		[
			countryOption(false),
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Nearest stations to return, 1 to 50, when locating by ZIP code or coordinates. The API default is 10.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['clearance'],
		[
			countryOption(false),
			{
				displayName: 'Pages',
				name: 'pages',
				type: 'number',
				default: 3,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: 'Result pages of 120 items to scan, up to 5. Defaults to 3.',
				routing: { request: { body: { pages: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Codes',
				name: 'price_codes',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Clearance (.97)', value: 'clearance' },
					{ name: 'Manager Markdown (.00 / .88)', value: 'manager_markdown' },
					{ name: 'Special Buy (.49 / .79 / .89)', value: 'special_buy' },
				],
				description:
					'Which markdown codes to keep. Defaults to Clearance and Manager Markdown; Special Buy endings are common on regular grocery prices.',
				routing: {
					request: { body: { price_codes: '={{ $value.length ? $value : undefined }}' } },
				},
			},
		],
	),
];
