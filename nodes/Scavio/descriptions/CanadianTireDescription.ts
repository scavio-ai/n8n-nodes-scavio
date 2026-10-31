import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['canadianTire'], operation, ...extra },
});

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

export const canadianTireOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['canadianTire'] } },
		options: [
			{
				name: 'Find Clearance Items',
				value: 'clearance',
				action: 'Find canadian tire clearance items',
				description:
					'Every clearance item at one Canadian Tire store, 100 per page: clearance price, regular price, stock at the store and the same fields as Search Products. In-stock items only by default. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/canadiantire/clearance' } },
			},
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find canadian tire stores',
				description:
					'Canadian Tire stores near a postal code or coordinates, nearest first: store number, name, address, phone, coordinates, distance, weekly hours and services. Set a SKU to get each store\'s stock quantity and aisle for that item. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/canadiantire/stores' } },
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get canadian tire availability',
				description:
					'Up to 50 SKUs at one store in one call: the store\'s price and regular price, clearance and sale flags, price valid-until date, stock quantity, aisle, online stock, and pickup and delivery dates. Unknown SKUs are listed in not_found. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/canadiantire/availability' } },
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get canadian tire deals',
				description:
					'Items on a deal at one store, 100 per page: this week\'s sale prices, instant rebates, special buys or Triangle Rewards offers, with the same fields as Search Products. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/canadiantire/deals' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a canadian tire product',
				description:
					'One Canadian Tire product by code at one store: breadcrumb, images, videos, rating and review count, descriptions, features, specifications, price and regular price, warranty, manuals, variants with their SKUs, and the store\'s price, stock, and pickup and ship-to-home dates. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/canadiantire/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search canadian tire products',
				description:
					'Search Canadian Tire by keyword or category at one store: the store\'s price and regular price (CAD), price range, savings message, clearance, sale and rebate badges, rating, review count, brand, part number, SKU, and stock at the store and online. Prices differ by store and province. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/canadiantire/search' } },
			},
		],
		default: 'search',
	},
];

export const canadianTireFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		placeholder: 'dewalt drill',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description: 'Search keywords. Use this or Category ID.',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: 'DC0002209',
		displayOptions: show(['search']),
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description:
			'Category ID (DC followed by 7 digits), or a canadiantire.ca category URL ending in one. Use this or Keyword.',
	},

	// -- Get Product --
	{
		displayName: 'Product Code',
		name: 'product_code',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0547273P',
		displayOptions: show(['product']),
		routing: { request: { body: { product_code: '={{ $value }}' } } },
		description: 'Product code: the code field of a search result',
	},

	// -- Get Availability --
	{
		displayName: 'SKUs',
		name: 'skus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0438858, 0547273',
		displayOptions: show(['availability']),
		routing: { send: { type: 'body', property: 'skus', value: splitList } },
		description:
			'1-50 SKUs (7 digits each, the sku field of a search result or product variant) separated by commas',
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'type',
		type: 'options',
		required: true,
		default: 'sale',
		options: [
			{ name: 'Instant Rebate', value: 'instant_rebate' },
			{ name: 'Sale (This Week)', value: 'sale' },
			{ name: 'Special Buy', value: 'special_buy' },
			{ name: 'Triangle Rewards (Loyalty)', value: 'loyalty' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Which deal list to read',
	},

	// -- Store ID: every operation except Find Stores --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '600',
		displayOptions: show(['search', 'product', 'availability', 'clearance', 'deals']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: "Canadian Tire store number from Find Stores. Prices and stock are that store's.",
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'postalCode',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'Postal Code', value: 'postalCode' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a postal code or a latitude/longitude pair',
	},
	{
		displayName: 'Postal Code',
		name: 'postal_code',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'M5V 2T6',
		displayOptions: show(['stores'], { locateBy: ['postalCode'] }),
		routing: { request: { body: { postal_code: '={{ $value }}' } } },
		description: 'Canadian postal code, or its first 3 characters',
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
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
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'In Stock Only',
				name: 'in_stock_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only items in stock at the store',
				routing: { request: { body: { in_stock_only: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 24 results per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling', value: 'bestseller' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Find Clearance Items --
	{
		displayName: 'Additional Options',
		name: 'clearanceOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['clearance']),
		options: [
			{
				displayName: 'In Stock Only',
				name: 'in_stock_only',
				type: 'boolean',
				default: true,
				description: 'Whether to return only clearance items in stock at the store (on by default)',
				routing: { request: { body: { in_stock_only: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 100 results per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Deals --
	{
		displayName: 'Additional Options',
		name: 'dealOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 100 results per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
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
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Stores to return, nearest first, 1-50. The API sends 10 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Km)',
				name: 'radius_km',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Search radius in kilometres, up to 200',
				routing: { request: { body: { radius_km: '={{ $value }}' } } },
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				placeholder: '0438858',
				description: "7-digit SKU. When set, each store also carries its stock quantity and aisle for it.",
				routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
			},
		],
	},
];
