import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['aldi'], operation } });

export const aldiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['aldi'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find aldi stores',
				description:
					'ALDI US stores near a ZIP code, nearest first: store ID, name, street address, city, state, ZIP, coordinates and distance in miles. Use the store ID on Search Products and Get Product. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/aldi/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an aldi product',
				description:
					'One ALDI US product by ID or aldi.us URL at one store: price and was-price for that store and shopping mode, unit price, stock, category, brand, size, description, ingredients, allergen warnings, dietary labels and images. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/aldi/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search aldi products',
				description:
					"Search ALDI US at one store: price and was-price, discount label, unit price, stock, category, in-store aisle location, ALDI exclusive brand flag, dietary labels, image and URL. Prices are that store's, for the shopping mode chosen (in-store shelf price by default). ALDI has no product ratings. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/aldi/search' } },
			},
		],
		default: 'search',
	},
];

export const aldiFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cheese',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '16902710',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'ALDI product ID (the product_id field of a search result), or an aldi.us product URL',
	},

	// -- Store: Search Products + Get Product --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '151248',
		displayOptions: show(['search', 'product']),
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
		description:
			"ALDI store ID from Find Stores. Prices and stock are that store's. Use this or ZIP Code.",
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		default: '',
		placeholder: '33133',
		displayOptions: show(['search', 'product']),
		routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
		description: 'US ZIP code. Without a Store ID, the nearest ALDI store to this ZIP is used.',
	},
	{
		displayName: 'Shopping Mode',
		name: 'service_type',
		type: 'options',
		default: 'instore',
		options: [
			{ name: 'Delivery', value: 'delivery' },
			{ name: 'In Store', value: 'instore' },
			{ name: 'Pickup', value: 'pickup' },
		],
		displayOptions: show(['search', 'product']),
		routing: { request: { body: { service_type: '={{ $value }}' } } },
		description:
			'Which price to return: In Store is the shelf price in the store; Pickup and Delivery are the online prices for ordering from that store, often higher than the shelf price',
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '33131',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
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
				displayName: 'Include Related Items',
				name: 'include_related',
				type: 'boolean',
				default: false,
				description:
					'Whether to also return the related items ALDI lists after the exact matches (off: exact matches only)',
				routing: { request: { body: { include_related: '={{ $value }}' } } },
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
				displayName: 'Results Per Page',
				name: 'perPage',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 60 },
				description: 'Products per page, 1-60. The API sends 30 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
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
		],
	},
];
