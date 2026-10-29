import type { INodeProperties } from 'n8n-workflow';

export const specsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['specs'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find specs stores',
				description:
					"Spec's stores in a Texas region: store ID, name, status, address, phone, coordinates and opening hours. Costs 5 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/specs/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a specs product',
				description:
					"One Spec's product with every store's price and stock (about 200 stores) plus the online price, ABV, origin and tasting notes. Costs 5 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/specs/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search specs products',
				description:
					"Search Spec's: online price (cents), case price and quantity, promo and Keyclub flags, stock, size, SKU, UPC and slug. Costs 5 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/specs/search' } },
			},
		],
		default: 'search',
	},
];

export const specsFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'titos',
		displayOptions: { show: { resource: ['specs'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		placeholder: 'titos-texas-vodka-5',
		displayOptions: { show: { resource: ['specs'], operation: ['product'] } },
		routing: { request: { body: { slug: '={{ $value || undefined }}' } } },
		description: 'Product slug from a search result',
	},
	{
		displayName: 'Product URL',
		name: 'product_url',
		type: 'string',
		default: '',
		placeholder: 'https://specsonline.com/shop/spirits/titos-texas-vodka-5/',
		displayOptions: { show: { resource: ['specs'], operation: ['product'] } },
		routing: { request: { body: { product_url: '={{ $value || undefined }}' } } },
		description: "Spec's product URL. Use this or Slug.",
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '169',
		displayOptions: { show: { resource: ['specs'], operation: ['product'] } },
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
		description: "Optional Spec's store number from Find Stores. Puts that store's price and stock at the top.",
	},

	// -- Find Stores --
	{
		displayName: 'Region',
		name: 'region',
		type: 'options',
		required: true,
		default: 'san-antonio',
		options: [
			{ name: 'Austin', value: 'austin' },
			{ name: 'Corpus Christi', value: 'corpus-christi' },
			{ name: 'Dallas', value: 'dallas' },
			{ name: 'El Paso', value: 'el-paso' },
			{ name: 'Fort Worth', value: 'fort-worth' },
			{ name: 'Houston', value: 'houston' },
			{ name: 'San Antonio', value: 'san-antonio' },
		],
		displayOptions: { show: { resource: ['specs'], operation: ['stores'] } },
		routing: { request: { body: { region: '={{ $value }}' } } },
		description: "Spec's store region",
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['specs'], operation: ['search'] } },
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
];
