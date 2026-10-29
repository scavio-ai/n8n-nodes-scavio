import type { INodeProperties } from 'n8n-workflow';

export const totalWineOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['totalWine'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find total wine stores',
				description:
					'Total Wine stores near a ZIP code or city, nearest first: store ID, address, phone, coordinates, distance in miles and delivery availability. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/totalwine/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a total wine product',
				description:
					'One Total Wine product at one store: price (cents), units in stock, aisle, bay, shelf, last restock date, ABV, taste profile and breadcrumbs. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/totalwine/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search total wine products',
				description:
					"Search Total Wine at one store: that store's price (cents), units in stock, purchase limit, aisle, rating and pickup/delivery availability. Costs 10 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/totalwine/search' } },
			},
		],
		default: 'search',
	},
];

export const totalWineFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'titos',
		displayOptions: { show: { resource: ['totalWine'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '96260175',
		displayOptions: { show: { resource: ['totalWine'], operation: ['product'] } },
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description: 'Numeric product ID from a search result or the /p/&lt;ID&gt; part of a product URL',
	},
	{
		displayName: 'Product URL',
		name: 'product_url',
		type: 'string',
		default: '',
		placeholder: 'https://www.totalwine.com/spirits/vodka/vodka/titos-handmade-vodka/p/96260175',
		displayOptions: { show: { resource: ['totalWine'], operation: ['product'] } },
		routing: { request: { body: { product_url: '={{ $value || undefined }}' } } },
		description: 'Total Wine product URL ending in /p/&lt;ID&gt;. Use this or Product ID.',
	},

	// -- Search Products + Get Product --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '503',
		displayOptions: { show: { resource: ['totalWine'], operation: ['search', 'product'] } },
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'Total Wine store number from Find Stores. Prices and stock are per store.',
	},

	// -- Find Stores --
	{
		displayName: 'ZIP or City',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: '78801',
		displayOptions: { show: { resource: ['totalWine'], operation: ['stores'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'ZIP code, city, or "city, state"',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['totalWine'], operation: ['search'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Result page to read',
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
		displayOptions: { show: { resource: ['totalWine'], operation: ['stores'] } },
		options: [
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Search radius in miles',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},
];
