import type { INodeProperties } from 'n8n-workflow';

export const etsyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['etsy'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an etsy listing',
				description:
					'Full details for one listing: description, price, availability, material, category path, ship-from, all images, buyer-selectable variations, aggregate rating and the first page of reviews, plus the shop',
				routing: { request: { method: 'POST', url: '/api/v1/etsy/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get etsy shop reviews',
				description:
					'A shop reviews, paginated across all its listings (~14 per page). Each review carries rating, author, date, text, reviewer avatar and the source listing.',
				routing: { request: { method: 'POST', url: '/api/v1/etsy/reviews' } },
			},
			{
				name: 'Get Shop',
				value: 'shop',
				action: 'Get an etsy shop profile',
				description:
					'A shop profile and stats: headline, location, logo and banner, year opened, sales and admirer counts, rating, review and listing counts, star-seller flag, announcement, about and sections',
				routing: { request: { method: 'POST', url: '/api/v1/etsy/shop' } },
			},
			{
				name: 'Get Shop Products',
				value: 'shopProducts',
				action: 'Get etsy shop listings',
				description:
					'A page of a shop listings, same card shape as search. Paginated by page.',
				routing: { request: { method: 'POST', url: '/api/v1/etsy/shop/products' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search etsy products',
				description:
					'Search Etsy listings: title, price with discounts, image, shop, per-listing rating and review count, ad and free-shipping flags',
				routing: { request: { method: 'POST', url: '/api/v1/etsy/search' } },
			},
		],
		default: 'search',
	},
];

export const etsyFields: INodeProperties[] = [
	// ── Search: query ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ceramic mug',
		displayOptions: { show: { resource: ['etsy'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search query',
	},

	// ── Product: listing ──
	{
		displayName: 'Listing',
		name: 'listing',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1510223855',
		displayOptions: { show: { resource: ['etsy'], operation: ['product'] } },
		routing: { request: { body: { listing: '={{ $value }}' } } },
		description: 'Etsy listing ID or a listing URL containing /listing/&lt;ID&gt;/',
	},

	// ── Shared shop field (shop, shopProducts, reviews) ──
	{
		displayName: 'Shop',
		name: 'shop',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'StonehousePotteryOH',
		displayOptions: {
			show: { resource: ['etsy'], operation: ['shop', 'shopProducts', 'reviews'] },
		},
		routing: { request: { body: { shop: '={{ $value }}' } } },
		description: 'Etsy shop name or a shop URL like https://www.etsy.com/shop/ShopName',
	},

	// ── Additional Options: search ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['etsy'], operation: ['search'] } },
		options: [
			{
				displayName: 'Free Shipping Only',
				name: 'free_shipping',
				type: 'boolean',
				default: false,
				description: 'Whether to only return listings that offer free shipping',
				routing: { request: { body: { free_shipping: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum price filter in USD',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				description: 'Minimum price filter in USD',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description: 'Whether to only return listings currently discounted',
				routing: { request: { body: { on_sale: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Lowest Price', value: 'lowest_price' },
					{ name: 'Highest Price', value: 'highest_price' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: shopProducts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['etsy'], operation: ['shopProducts'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Lowest Price', value: 'lowest_price' },
					{ name: 'Highest Price', value: 'highest_price' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: reviews ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['etsy'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Reviews page, 1-based (~14 per page)',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
