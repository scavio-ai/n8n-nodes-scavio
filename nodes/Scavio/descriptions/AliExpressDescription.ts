import type { INodeProperties } from 'n8n-workflow';

export const aliexpressOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['aliexpress'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get aliexpress category products',
				description:
					'Products within an AliExpress category, with the same product shape and filters as search. Sort by orders for the category best sellers.',
				routing: { request: { method: 'POST', url: '/api/v1/aliexpress/category' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an aliexpress product',
				description:
					'Full details for one AliExpress product: title, current and original price, discount, rating, review count, every SKU variant group with its options, the full image gallery, free-shipping flag, and the seller. Typically responds in 20-60 seconds.',
				routing: { request: { method: 'POST', url: '/api/v1/aliexpress/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get aliexpress product reviews',
				description:
					'Customer reviews for an AliExpress product: text with English translation, star rating, buyer country, per-SKU variant, photos, votes and the full rating breakdown. Up to 50 reviews per call.',
				routing: { request: { method: 'POST', url: '/api/v1/aliexpress/reviews' } },
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get an aliexpress seller profile',
				description:
					'A storefront profile: name, store ID and follower count, plus rating, opening date and catalogue size when AliExpress publishes them. Typically responds in 20-60 seconds.',
				routing: { request: { method: 'POST', url: '/api/v1/aliexpress/seller' } },
			},
			{
				name: 'Get Seller Products',
				value: 'sellerProducts',
				action: 'Get aliexpress seller products',
				description:
					'A seller catalogue, 30 items per page: per item the ID, title, price, list price, currency, rating, order count and image. Typically responds in 20-60 seconds.',
				routing: { request: { method: 'POST', url: '/api/v1/aliexpress/seller-products' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search aliexpress products',
				description:
					'Search AliExpress products: prices with discounts, ratings, units sold, delivery estimates, ship-from country and images, plus related search terms',
				routing: { request: { method: 'POST', url: '/api/v1/aliexpress/search' } },
			},
		],
		default: 'search',
	},
];

export const aliexpressFields: INodeProperties[] = [
	// ── Search: query ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'usb c hub',
		displayOptions: { show: { resource: ['aliexpress'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search query',
	},

	// ── Category: category_id ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '44',
		displayOptions: { show: { resource: ['aliexpress'], operation: ['category'] } },
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'AliExpress category ID (the number in a /category/&lt;ID&gt;/... URL).',
	},

	// ── Product / Reviews: product_id ──
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1005006677984952',
		displayOptions: {
			show: { resource: ['aliexpress'], operation: ['product', 'reviews'] },
		},
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'AliExpress product ID or product URL. Both ID spaces are accepted (canonical 1005... or the 3256... alias search pages emit).',
	},

	// ── Seller / Seller Products: store_id ──
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1101547016',
		displayOptions: {
			show: { resource: ['aliexpress'], operation: ['seller', 'sellerProducts'] },
		},
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'AliExpress store ID, or any storefront URL containing /store/&lt;ID&gt;. Every product response returns its seller store_id.',
	},

	// ── Additional Options: search + category (shared listing filters) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['aliexpress'], operation: ['search', 'category'] } },
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				placeholder: 'USD',
				description: '3-letter ISO currency for returned prices, default USD',
				routing: { request: { body: { currency: '={{ $value }}' } } },
			},
			{
				displayName: 'Free Shipping Only',
				name: 'free_shipping',
				type: 'boolean',
				default: false,
				description: 'Whether to only return items with free shipping',
				routing: { request: { body: { free_shipping: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum price filter in the selected currency',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				description: 'Minimum price filter in the selected currency',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Results page, 1-based (60 items per full page)',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Ship From',
				name: 'ship_from',
				type: 'string',
				default: '',
				placeholder: 'US',
				description: 'Only items shipped from this 2-letter country (e.g. US for local warehouses, CN). Omit for all origins.',
				routing: { request: { body: { ship_from: '={{ $value }}' } } },
			},
			{
				displayName: 'Ship To',
				name: 'ship_to',
				type: 'string',
				default: '',
				placeholder: 'US',
				description: '2-letter ISO destination country, default US. Changes prices, VAT, delivery estimates and which items appear.',
				routing: { request: { body: { ship_to: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Orders', value: 'orders' },
					{ name: 'Price Low', value: 'price_low' },
					{ name: 'Price High', value: 'price_high' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: search (category_id filter) ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: '44',
		displayOptions: { show: { resource: ['aliexpress'], operation: ['search'] } },
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'Restrict the search to one AliExpress category ID',
	},

	// ── Additional Options: reviews ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['aliexpress'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Reviews page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews per page, 1-50. Default 20.',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'Additional Reviews', value: 'additional' },
					{ name: 'All', value: 'all' },
					{ name: 'Local Buyers', value: 'local' },
					{ name: 'With Image', value: 'image' },
					{ name: 'With Personal Info', value: 'with_personal' },
				],
				routing: { request: { body: { filter: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: product ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['aliexpress'], operation: ['product'] } },
		options: [
			{
				displayName: 'Ship To',
				name: 'ship_to',
				type: 'string',
				default: '',
				placeholder: 'US',
				description: '2-letter ISO destination country, default US',
				routing: { request: { body: { ship_to: '={{ $value }}' } } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				placeholder: 'USD',
				description: '3-letter ISO currency for returned prices, default USD',
				routing: { request: { body: { currency: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: sellerProducts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['aliexpress'], operation: ['sellerProducts'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Catalogue page, 1-based (30 items per page)',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
