import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['microCenter'], operation } });

export const microCenterOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['microCenter'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a micro center product',
				description:
					"One Micro Center product by ID or URL: SKU, MPN, UPC, brand, description, price, original price, availability, images, rating, review count, up to 10 recent reviews, breadcrumbs with category IDs and the full spec table, plus the chosen store's stock and open-box units, and an in-stock yes/no for every Micro Center store. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/microcenter/product' } },
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get micro center stores',
				description:
					'Every Micro Center store with its 3-digit store ID, name, city, state and store page URL, plus street address and ZIP where known. Optionally filtered by state. The web store 029 is not listed but is accepted as a Store ID. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/microcenter/stores' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search micro center products',
				description:
					'Search Micro Center by keyword or category at one store, up to 96 per page: product ID, SKU, name, brand, category, price and original price, image, URL, highlights, and that store\'s stock (label, quantity, in_stock, not_carried; counts are capped at 25+), plus open-box count and lowest price, rebates and an in-store-only flag. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/microcenter/search' } },
			},
		],
		default: 'search',
	},
];

export const microCenterFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		placeholder: 'rtx 5070',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description: 'Search keywords. Use this, Category, or both.',
	},
	{
		displayName: 'Category',
		name: 'category',
		type: 'string',
		default: '',
		placeholder: '518',
		displayOptions: show(['search']),
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		description:
			'Category ID (518 = Graphics Cards), or a microcenter.com listing URL carrying one. Breadcrumbs on Get Product carry category IDs. Use this, Keyword, or both.',
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '691231',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'Micro Center product ID (the product_id field of a search result, or the number after /product/ in a microcenter.com URL), or the product URL. Not the SKU.',
	},

	// -- Store ID: Search Products + Get Product --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '131',
		displayOptions: show(['search', 'product']),
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
		description:
			"3-digit Micro Center store ID from Get Stores (131 = Dallas, 151 = Chicago). Stock counts and open-box units are that store's. Leave empty for the web store (029), which lists shippable items only.",
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
				displayName: 'Include Out of Stock',
				name: 'include_out_of_stock',
				type: 'boolean',
				default: false,
				description:
					'Whether to also list products the store has no stock of or does not carry (stock.not_carried marks them)',
				routing: { request: { body: { include_out_of_stock: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Results Per Page',
				name: 'per_page',
				type: 'options',
				default: 96,
				options: [
					{ name: '24', value: 24 },
					{ name: '48', value: 48 },
					{ name: '96', value: 96 },
				],
				description: 'Products per page',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Review Count', value: 'review_count' },
				],
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Stores --
	{
		displayName: 'Additional Options',
		name: 'storeOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'State',
				name: 'state',
				type: 'string',
				default: '',
				placeholder: 'TX',
				description: '2-letter US state code to filter by',
				routing: { request: { body: { state: '={{ $value || undefined }}' } } },
			},
		],
	},
];
