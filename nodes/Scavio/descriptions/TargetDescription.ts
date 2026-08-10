import type { INodeProperties } from 'n8n-workflow';

const TARGET_SORTS = [
	{ name: 'Best Seller', value: 'best_seller' },
	{ name: 'Featured', value: 'featured' },
	{ name: 'Newest', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
	{ name: 'Rating: High to Low', value: 'rating_high' },
	{ name: 'Relevance', value: 'relevance' },
];

export const targetOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['target'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get target category products',
				description:
					'List products in a Target.com category, same shape as search plus the category breadcrumb. This is the slowest endpoint at roughly 37 seconds, so allow for it in the workflow timeout. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/target/category' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a target product',
				description:
					'Get Target.com product details by TCIN: price, rating, images, specifications, variants, return policy, fulfillment. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/target/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get target product reviews',
				description:
					'Get Target.com reviews with the rating breakdown, per-attribute averages and guest photos. Target publishes 8 review bodies at most and exposes no page or offset param, so Max Review Bodies can only trim that set. Expect roughly 40 seconds. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/target/reviews' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search target products',
				description:
					'Search Target.com, the US retailer, for products with prices, ratings, badges and promotions. Calls take around 9 seconds because Target is reached through a headless browser. A null seller means the item is sold by Target itself; only Target Plus marketplace rows name a vendor. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/target/search' } },
			},
		],
		default: 'search',
	},
];

export const targetFields: INodeProperties[] = [
	// ── Search Products ──
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'office chair',
		displayOptions: { show: { resource: ['target'], operation: ['search'] } },
		routing: { request: { body: { keyword: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// ── Get Category Products ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5xtg5',
		displayOptions: { show: { resource: ['target'], operation: ['category'] } },
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'The segment after N- in a Target.com /c/ category URL',
	},

	// ── Shared TCIN (product, reviews) ──
	{
		displayName: 'TCIN',
		name: 'tcin',
		type: 'string',
		required: true,
		default: '',
		placeholder: '87381098',
		displayOptions: { show: { resource: ['target'], operation: ['product', 'reviews'] } },
		routing: { request: { body: { tcin: '={{ $value }}' } } },
		description:
			'Target catalogue item number. A child TCIN is answered by its variation parent, with the child present under variants.',
	},

	// ── Additional Options: Search Products / Get Category Products ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['target'], operation: ['search', 'category'] } },
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 24,
				typeOptions: { minValue: 1, maxValue: 28 },
				description: 'Products per page. Target rejects anything above 28 outright.',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
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
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				description: 'Result sort order',
				options: TARGET_SORTS,
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '3991',
				description:
					'Target store the results are priced and stocked against. Unlike Walmart this is a real request param, so the store is your choice; it defaults to 3991.',
				routing: { request: { body: { store_id: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Product ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['target'], operation: ['product'] } },
		options: [
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '3991',
				description:
					'Target store the product is priced and stocked against. Unlike Walmart this is a real request param, so the store is your choice; it defaults to 3991.',
				routing: { request: { body: { store_id: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Reviews ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['target'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Max Review Bodies',
				name: 'review_limit',
				type: 'number',
				default: 8,
				typeOptions: { minValue: 1 },
				description:
					'Trims the review bodies returned. Target publishes 8 at most and offers no paging, so a value above 8 changes nothing.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '3991',
				description:
					'Target store the reviews are read against. Unlike Walmart this is a real request param, so the store is your choice; it defaults to 3991.',
				routing: { request: { body: { store_id: '={{ $value }}' } } },
			},
		],
	},
];
