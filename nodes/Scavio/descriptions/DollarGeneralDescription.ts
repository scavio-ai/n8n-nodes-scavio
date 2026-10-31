import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['dollarGeneral'], operation, ...extra },
});

const SORT_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
	{ name: 'Rating', value: 'rating' },
	{ name: 'Recommended', value: 'recommended' },
];

export const dollarGeneralOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['dollarGeneral'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find dollar general stores',
				description:
					'Dollar General stores near a US ZIP code or coordinates, nearest first (up to 25): store number, address, phone, coordinates, distance, opening hours and services. Set a UPC and one call returns that product\'s unit count at every store returned. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/dollargeneral/stores' } },
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get dollar general coupons',
				description:
					'Dollar General\'s current digital coupons, 30 per page: offer ID and code, summary, description, brand, value, offer type, category, minimum quantity, start and expiration dates, and whether it is a manufacturer coupon. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/dollargeneral/coupons' } },
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get dollar general deals',
				description:
					'Products on sale or on clearance, priced and stocked at one store, 24 per page. available_quantity above 0 means in stock at that store. Clearance items carry the current price only (no was-price). Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/dollargeneral/deals' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a dollar general product',
				description:
					'One product by UPC at one store: price, original price, available_quantity (units on hand), nearby stores with stock, rating, review count, SKU, brand, description, highlights, images, categories, digital coupons and promotions. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/dollargeneral/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search dollar general products',
				description:
					'Search Dollar General at one store: that store\'s price and original price, available_quantity (units on hand), rating, review count, categories, digital coupons and promotions, UPC and product URL. Use a result\'s UPC with Get Product. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/dollargeneral/search' } },
			},
		],
		default: 'search',
	},
];

export const dollarGeneralFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'paper towels',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'UPC',
		name: 'upc',
		type: 'string',
		required: true,
		default: '',
		placeholder: '030772156629',
		displayOptions: show(['product']),
		routing: { request: { body: { upc: '={{ $value }}' } } },
		description: 'Product UPC: the upc field of a search result. Leading zeros are optional.',
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'type',
		type: 'options',
		required: true,
		default: 'on_sale',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'On Sale', value: 'on_sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Everything on sale, or the clearance event',
	},

	// -- Store ID: Search Products, Get Product, Get Deals --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12629',
		displayOptions: show(['search', 'product', 'deals']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: "Dollar General store number from Find Stores. Prices and unit counts are that store's.",
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
		placeholder: '75203',
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
				displayName: 'In Stock Only',
				name: 'in_stock_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only products with units on hand at the store',
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
				default: 'recommended',
				options: SORT_OPTIONS,
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
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
				description: 'Results page, 24 results per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'recommended',
				options: SORT_OPTIONS,
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Coupons --
	{
		displayName: 'Additional Options',
		name: 'couponOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['coupons']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Coupons page, 30 coupons per page',
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
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, up to 100',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
			{
				displayName: 'UPC',
				name: 'upc',
				type: 'string',
				default: '',
				placeholder: '030772156629',
				description: "Product UPC. When set, every store also carries its unit count of that product.",
				routing: { request: { body: { upc: '={{ $value || undefined }}' } } },
			},
		],
	},
];
