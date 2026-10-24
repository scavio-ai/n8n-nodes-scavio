import type { INodeProperties } from 'n8n-workflow';

export const krogerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['kroger'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a kroger product',
				description:
					'Full Kroger product detail by URL or UPC: nutrition facts (allergens, ingredients, nutrients with daily values), description, images, rating distribution, store aisle location, stock level, dietary flags (organic, non-GMO, gluten-free), SNAP eligibility, dimensions and country of origin. Kroger operates Kroger, Ralphs, Fred Meyer, Harris Teeter, King Soopers and Fry\'s. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/kroger/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search kroger products',
				description:
					'Search Kroger grocery products by keyword. Returns price (cents), promo price, n-for deals, unit price, size, UPC, stock, SNAP eligibility, dietary info, rating and category. Kroger operates Kroger, Ralphs, Fred Meyer, Harris Teeter, King Soopers and Fry\'s. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/kroger/search' } },
			},
		],
		default: 'search',
	},
];

export const krogerFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'organic milk',
		displayOptions: { show: { resource: ['kroger'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'product_url',
		type: 'string',
		default: '',
		placeholder: '/p/kroger-2-reduced-fat-milk-gallon/0001111041700',
		displayOptions: { show: { resource: ['kroger'], operation: ['product'] } },
		routing: { request: { body: { product_url: '={{ $value }}' } } },
		description:
			'Full or relative product URL from kroger.com, e.g. /p/{slug}/{upc}. Preferred over upc.',
	},
	{
		displayName: 'UPC',
		name: 'upc',
		type: 'string',
		default: '',
		placeholder: '0001111041700',
		displayOptions: { show: { resource: ['kroger'], operation: ['product'] } },
		routing: { request: { body: { upc: '={{ $value }}' } } },
		description: 'Kroger product UPC (from search or product URLs: /p/{slug}/{upc})',
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		placeholder: 'kroger-2-reduced-fat-milk-gallon',
		displayOptions: { show: { resource: ['kroger'], operation: ['product'] } },
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description: 'Product slug for readable URL. Optional with upc.',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['kroger'], operation: ['search'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to read',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
