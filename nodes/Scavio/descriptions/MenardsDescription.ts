import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['menards'], operation, ...extra },
});

export const menardsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['menards'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find menards stores',
				description:
					"Menards stores near a US ZIP code or a city and state, nearest first: store number, name, address, coordinates, distance in miles and services (garden center, grocery, rental center, propane and more). Use a store number with Search Products or Get Product for that store's stock. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/menards/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a menards product',
				description:
					"One Menards product by item ID or URL (find item IDs with Search Products): name, brand, model number, SKU, description, bullets, specifications, images, videos and documents, with the full price ladder: everyday price, sale price and end date, mail-in rebates such as the 11% rebate (text, amount, dates), final price after rebates and the you-save amount, plus pickup, delivery and ship-to-store flags. Set a Store ID for that store's stock quantity, stock message and aisle. Costs 1 credit, 2 with a Store ID.",
				// A store-specific answer can take 10-40 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/menards/product', timeout: 120000 } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search menards products at a store',
				description:
					"Search menards.com at one store, 40 products a page: item ID, SKU, name, URL, image, price, everyday price, sale price, price type (regular, sale, clearance, minimum advertised), mail-in rebates, final price after rebates, and that store's stock quantity, stock message, pickup and delivery flags. Also total results and facets. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/menards/search' } },
			},
		],
		default: 'product',
	},
];

export const menardsFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sledge hammer',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Store ID',
		name: 'searchStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3181',
		displayOptions: show(['search']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: "Menards store number from Find Stores. Stock is that store's. An unknown store number is an error.",
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'In Stock Today',
				name: 'in_stock_today',
				type: 'boolean',
				default: false,
				description: 'Whether to return only products in stock at the store today',
				routing: { request: { body: { in_stock_today: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				description: 'Highest price in dollars',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				description: 'Lowest price in dollars',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 40 products a page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Brand: A to Z', value: 'brand_asc' },
					{ name: 'Brand: Z to A', value: 'brand_desc' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Result order. Price sorts order by the everyday price, not the sale price.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Product --
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		default: '',
		placeholder: '60893666613',
		displayOptions: show(['product']),
		routing: { request: { body: { item_id: '={{ $value || undefined }}' } } },
		description:
			'Menards item ID: the number after p- in a menards.com product URL. Not the SKU or model number. Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.menards.com/main/p-60893666613.htm',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A menards.com product URL. Use this or Item ID.',
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '3181',
		displayOptions: show(['product']),
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
		description:
			"Menards store number from Find Stores. Adds that store's stock quantity, stock message, aisle and whether it is sold there, priced for that store. Costs 2 credits instead of 1 and typically takes 10-40 seconds. Leave empty for default-store prices and no stock.",
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP code or a city and state',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '55401',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Madison',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'City to search around',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'WI',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: '2-letter US state code',
	},
];
