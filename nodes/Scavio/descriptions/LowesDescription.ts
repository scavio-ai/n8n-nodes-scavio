import type { INodeProperties } from 'n8n-workflow';

export const lowesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['lowes'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find lowes stores',
				description:
					"Lowe's stores near a US ZIP code, nearest first: store number, name, address, phone, coordinates, distance, time zone, opening hours and features. Pass a store number and that store's ZIP to Search Products and Get Product. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/lowes/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a lowes product',
				description:
					"One Lowe's item at one store: price, was-price and savings, on-hand stock with lead time per fulfillment method, stock at nearby stores, aisle and bay, specifications, UPC, dimensions, rating, images and the store's address and hours. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/lowes/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get lowes product reviews',
				description:
					"One page of an item's customer reviews (10 per page): rating, title, text, date, reviewer, recommended, helpful votes, verified and incentivized flags, photos and brand replies, plus the average rating and count per star. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/lowes/reviews' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search lowes products',
				description:
					"Search Lowe's by keyword or category at one store: the store's price, was-price and savings with the sale end date, brand, model number, rating, review count, and stock for pickup, truck delivery, parcel shipping and same-day delivery. Turn on On Sale Only for that store's deals. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/lowes/search' } },
			},
		],
		default: 'search',
	},
];

export const lowesFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		placeholder: 'cordless drill',
		displayOptions: { show: { resource: ['lowes'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description: 'Search keywords. Use this or Category ID.',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: '4294607842',
		displayOptions: { show: { resource: ['lowes'], operation: ['search'] } },
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description: 'The number at the end of a lowes.com/pl/ category URL. Use this or Keyword.',
	},

	// -- Get Product + Get Reviews --
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5016412045',
		displayOptions: { show: { resource: ['lowes'], operation: ['product', 'reviews'] } },
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description:
			"Lowe's item ID (the number at the end of a lowes.com/pd/ URL, or item_id from a search result), or the full product URL",
	},

	// -- Search Products + Get Product: store --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0595',
		displayOptions: { show: { resource: ['lowes'], operation: ['search', 'product'] } },
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: "Lowe's store number (up to 4 digits) from Find Stores. Prices and stock are that store's.",
	},
	{
		displayName: 'Store ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '28117',
		displayOptions: { show: { resource: ['lowes'], operation: ['search', 'product'] } },
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: "The store's own 5-digit ZIP code, from Find Stores",
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: { show: { resource: ['lowes'], operation: ['stores'] } },
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: '5-digit US ZIP code to find stores near',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['lowes'], operation: ['search'] } },
		options: [
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only items on sale at this store (with a was-price). A page can then hold fewer than 24 results.',
				routing: { request: { body: { on_sale: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 31 },
				description: 'Results page, 24 results per page, up to page 31',
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
		displayOptions: { show: { resource: ['lowes'], operation: ['stores'] } },
		options: [
			{
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Stores to return, nearest first, 1-10. The API sends 10 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'reviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['lowes'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Reviews page, 10 reviews per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Review order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
