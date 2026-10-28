import type { INodeProperties } from 'n8n-workflow';

export const decathlonOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['decathlon'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a decathlon product',
				description:
					'Full Decathlon product detail by URL or product ID: description, images, SKU, GTIN, color, price (cents), list price, availability, offers/variants, rating, review count, category and breadcrumbs. Supports FR, ES, IT, IN, UK, PT and NET domains. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/decathlon/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search decathlon products',
				description:
					'Search Decathlon products by keyword across 7 country domains (FR, ES, IT, IN, UK, PT, NET). Returns product name, brand, price (cents), currency, availability, rating, review count and image. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/decathlon/search' } },
			},
		],
		default: 'search',
	},
];

const COUNTRY_OPTIONS = [
	{ name: 'France (FR)', value: 'fr' },
	{ name: 'Spain (ES)', value: 'es' },
	{ name: 'Italy (IT)', value: 'it' },
	{ name: 'India (IN)', value: 'in' },
	{ name: 'United Kingdom (UK)', value: 'uk' },
	{ name: 'Portugal (PT)', value: 'pt' },
	{ name: 'International (NET)', value: 'net' },
];

export const decathlonFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'running shoes',
		displayOptions: { show: { resource: ['decathlon'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		required: true,
		default: 'fr',
		options: COUNTRY_OPTIONS,
		displayOptions: { show: { resource: ['decathlon'], operation: ['search'] } },
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: 'Decathlon country domain to search',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'product_url',
		type: 'string',
		default: '',
		placeholder: '/p/mens-running-shoes/123456/...',
		displayOptions: { show: { resource: ['decathlon'], operation: ['product'] } },
		routing: { request: { body: { product_url: '={{ $value }}' } } },
		description:
			'Full or relative product URL from any Decathlon domain. Preferred over product_id.',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '123456',
		displayOptions: { show: { resource: ['decathlon'], operation: ['product'] } },
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'Decathlon numeric product ID, the number after the slug in a /p/ product URL',
	},
	{
		displayName: 'Country',
		name: 'productCountry',
		type: 'options',
		required: true,
		default: 'fr',
		options: COUNTRY_OPTIONS,
		displayOptions: { show: { resource: ['decathlon'], operation: ['product'] } },
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: 'Decathlon country domain',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['decathlon'], operation: ['search'] } },
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
