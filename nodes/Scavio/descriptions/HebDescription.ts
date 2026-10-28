import type { INodeProperties } from 'n8n-workflow';

export const hebOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['heb'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an heb product',
				description:
					'Full HEB product detail: nutrition facts (serving size, calories, nutrients with daily values), ingredients, description, images, similar products, coupons, EBT/SNAP eligibility, breadcrumbs, aisle location. Pass product_url or slug + product_id, or product_id alone with a Store ID (price, stock and aisle from that store). Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/heb/product' } },
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get heb stores',
				description:
					'Find HEB stores near a US ZIP code or city. Returns store number, address, phone, hours, pharmacy availability, fulfillment channels (curbside, delivery, in-store), distance and store URL. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/heb/stores' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search heb products',
				description:
					'Search HEB grocery products by keyword. Returns price (cents), list price, sale status, unit price, size, UPC, stock, EBT/SNAP eligibility, category, aisle location and product URL. Set a Store ID for prices, stock and assortment from one store. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/heb/search' } },
			},
		],
		default: 'search',
	},
];

export const hebFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'organic milk',
		displayOptions: { show: { resource: ['heb'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'product_url',
		type: 'string',
		default: '',
		placeholder: '/product-detail/central-market-organics-whole-milk-1-gal/931316',
		displayOptions: { show: { resource: ['heb'], operation: ['product'] } },
		routing: { request: { body: { product_url: '={{ $value }}' } } },
		description:
			'Full or relative product URL from heb.com. Preferred over slug + product_id.',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '931316',
		displayOptions: { show: { resource: ['heb'], operation: ['product'] } },
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'HEB product ID (numeric ID at the end of a product URL). Requires slug, unless Store ID is set.',
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		placeholder: 'central-market-organics-whole-milk-1-gal',
		displayOptions: { show: { resource: ['heb'], operation: ['product'] } },
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description:
			'Product slug (readable part of the URL). Required with product_id, unless Store ID is set.',
	},

	// -- Get Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		default: '',
		placeholder: '78701',
		displayOptions: { show: { resource: ['heb'], operation: ['stores'] } },
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: '5-digit US ZIP code. Pass zip or city.',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		default: '',
		placeholder: 'Austin',
		displayOptions: { show: { resource: ['heb'], operation: ['stores'] } },
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'City name. Pass zip or city.',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['heb'], operation: ['search'] } },
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
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 60,
				typeOptions: { minValue: 1, maxValue: 60 },
				description: 'Results per page, max 60',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '441',
				description:
					"HEB store number from Get Stores (field store_number). Prices, stock, aisle location and assortment come from that store and the store used is echoed in data.store. US only. Leave unset for HEB's default store.",
				routing: { request: { body: { store_id: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Product --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['heb'], operation: ['product'] } },
		options: [
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '441',
				description:
					"HEB store number from Get Stores (field store_number). Price, stock and aisle location come from that store and the store used is echoed in data.store. US only. Leave unset for HEB's default store.",
				routing: { request: { body: { store_id: '={{ $value }}' } } },
			},
		],
	},
];
