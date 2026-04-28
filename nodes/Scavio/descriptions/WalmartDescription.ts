import type { INodeProperties } from 'n8n-workflow';

export const walmartOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['walmart'] } },
		options: [
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search walmart products',
				description: 'Search Walmart and return product listings',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/search' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a walmart product',
				description: 'Get detailed information for a Walmart product by ID',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/product' } },
			},
		],
		default: 'search',
	},
];

export const walmartFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'air fryer 6 quart',
		displayOptions: { show: { resource: ['walmart'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search query',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1234567890',
		displayOptions: { show: { resource: ['walmart'], operation: ['product'] } },
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'Walmart product ID, the numeric string from the /ip/.../PRODUCT_ID URL',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['walmart'], operation: ['search'] } },
		options: [
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Best Seller', value: 'best_seller' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				description: 'Minimum price in USD',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum price in USD',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Fulfillment Speed',
				name: 'fulfillment_speed',
				type: 'options',
				default: 'anytime',
				options: [
					{ name: 'Anytime', value: 'anytime' },
					{ name: 'Today', value: 'today' },
					{ name: 'Tomorrow', value: 'tomorrow' },
					{ name: '2 Days', value: '2_days' },
				],
				routing: { request: { body: { fulfillment_speed: '={{ $value }}' } } },
			},
		],
	},
];
