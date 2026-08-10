import type { INodeProperties } from 'n8n-workflow';

export const homeDepotOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['homeDepot'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a home depot product',
				description:
					'Get full Home Depot item detail: pricing and promotions, images and videos, spec table, dimensions, bullets, documents, return policy. It carries only a 10-review preview, so use Get Reviews for the paginated bodies. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get home depot product reviews',
				description:
					'Get one page of full Home Depot review bodies with the rating distribution, per-attribute ratings, photos and seller responses. Reviews come 30 per page and asking past total_pages returns a 404. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/reviews' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search home depot products',
				description:
					'Search Home Depot: price and promotions, brand and model, ratings, badges, per-store pickup and delivery. Page size is fixed at 12 products, so paging is the only way to read further. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/search' } },
			},
		],
		default: 'search',
	},
];

export const homeDepotFields: INodeProperties[] = [
	// ── Search Products ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cordless drill',
		displayOptions: { show: { resource: ['homeDepot'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// ── Shared item ID (product, reviews) ──
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '206568793',
		displayOptions: { show: { resource: ['homeDepot'], operation: ['product', 'reviews'] } },
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description:
			'Home Depot item ID, or a full product URL; tracking parameters are discarded. An unknown item comes back as a 404.',
	},

	// ── Additional Options: Search Products ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['homeDepot'], operation: ['search'] } },
		options: [
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum price in USD',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Result page to read. Page size is fixed at 12 products and cannot be changed, so paging is the only way to read further.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'best_match',
				description:
					'Result sort order. This list is closed because Home Depot answers an unknown sort with an empty page that still bills, and Newest is rejected on keyword search.',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Top Rated', value: 'top_rated' },
					{ name: 'Top Sellers', value: 'top_sellers' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['homeDepot'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Review page to read. Reviews come 30 per page; total_pages is the last page that exists and asking past it returns a 404.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
