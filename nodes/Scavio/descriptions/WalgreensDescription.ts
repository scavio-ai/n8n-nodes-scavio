import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['walgreens'], operation, ...extra },
});

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

export const walgreensOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['walgreens'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find walgreens stores',
				description:
					'Walgreens and Duane Reade stores near a US ZIP code or coordinates, nearest first: store number, name, brand, address, phone, coordinates, distance, opening and closing time, time zone and store page URL. Paged. Use store numbers with Search Products and Get Store Stock. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/walgreens/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a walgreens product',
				description:
					'One Walgreens retail product by ID or URL: SKU, UPC, GTIN, brand, size, regular and sale price, savings, unit price, rewards and rebate offers, description, ingredients, warnings, rating, review count, category path, images, ship and pickup availability and clearance flag. Prices are national. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/walgreens/product' } },
			},
			{
				name: 'Get Store Stock',
				value: 'stock',
				action: 'Get walgreens store stock',
				description:
					'Live in-store stock of one product at up to 20 Walgreens stores: per store the status (In Stock, Out of Stock, or Not Available when the store does not carry it), the unit count and in_stock. Unrecognised store numbers are listed in unknown_store_ids. Costs 4 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/walgreens/stock' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search walgreens products',
				description:
					'Search Walgreens retail products (no pharmacy), up to 70 per page: product ID, SKU, UPC, brand, size, regular and sale price, unit price, promotion, coupon, loyalty and rebate messages, rating, review count, image, URL, ship, pickup and delivery availability, online stock and clearance flag. Prices are national. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/walgreens/search' } },
			},
		],
		default: 'search',
	},
];

export const walgreensFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'shampoo',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product + Get Store Stock --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '300452904',
		displayOptions: show(['product', 'stock']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'Walgreens product ID (the product_id field of a search result, such as 300452904 or prod6345045), or a walgreens.com product URL',
	},

	// -- Get Store Stock --
	{
		displayName: 'Store IDs',
		name: 'store_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9438, 14318',
		displayOptions: show(['stock']),
		routing: { send: { type: 'body', property: 'store_ids', value: splitList } },
		description: '1-20 Walgreens store numbers from Find Stores, separated by commas',
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP code or a latitude/longitude pair',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60601',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, up to 70 results per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Brand: A to Z', value: 'brand_name_asc' },
					{ name: 'Brand: Z to A', value: 'brand_name_desc' },
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Most Reviewed', value: 'most_reviewed' },
					{ name: 'Most Viewed', value: 'most_viewed' },
					{ name: 'Newest Arrivals', value: 'newest_arrival' },
					{ name: 'Price: High to Low', value: 'price_high_to_low' },
					{ name: 'Price: Low to High', value: 'price_low_to_high' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Top Sellers', value: 'top_sellers' },
					{ name: 'Unit Price: Low to High', value: 'unit_price_low_to_high' },
				],
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '9438',
				description:
					"Walgreens store number from Find Stores. Each result's availability text then describes that store (for example Not sold at your store).",
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
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 25 },
				description: 'Stores per page, nearest first, 1-25. The API sends 10 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, up to 100',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},
];
