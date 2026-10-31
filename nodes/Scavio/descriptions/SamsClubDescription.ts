import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['samsClub'], operation } });

const SORT_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
	{ name: 'Relevance', value: 'relevance' },
	{ name: 'Top Selling', value: 'top_selling' },
];

function listingOptions(operation: string, pageDescription: string): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show([operation]),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: pageDescription,
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: SORT_OPTIONS,
				description: "Result order. Leave unset for the site's own order.",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	};
}

export const samsClubOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['samsClub'] } },
		options: [
			{
				name: 'Find Clubs',
				value: 'clubs',
				action: 'Find sams club clubs',
				description:
					"Sam's Club clubs near a US ZIP code, nearest first, within 100 miles: club ID, name, address, coordinates, distance, phone, opening hours, services and whether the club is temporarily closed. Use the club ID on Get Product. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/samsclub/clubs' } },
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get sams club category products',
				description:
					"Products in a Sam's Club category, paged, with the same fields as Search Products. Clearance is category 1150109. Prices and stock are for a nearby club chosen by location, returned in club. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/samsclub/category' } },
			},
			{
				name: 'Get Instant Savings',
				value: 'savings',
				action: 'Get sams club instant savings',
				description:
					"Every item on Sam's Club Instant Savings, paged: price, was price and savings amount, plus each offer's amount, end date, purchase limit and the channels it applies to. Prices are for a nearby club chosen by location, returned in club. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/samsclub/savings' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a sams club product',
				description:
					"One Sam's Club item: online price and club shelf price (club_price), was price, savings, unit price, Instant Savings, rating histogram, images, UPC, specifications and fulfillment per method with stock and aisle. Set a Club ID to price and stock one club. available_quantity is capped at 8 (8 means 8 or more). Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/samsclub/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get sams club product reviews',
				description:
					"Customer reviews for a Sam's Club item, 10 per page: rating, title, text, author, date, verified purchase and helpful votes, plus the average rating, total count and 1-5 star breakdown. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/samsclub/reviews' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search sams club products',
				description:
					"Search Sam's Club: item ID, price, was price and savings, unit price, Instant Savings (amount, end date, limit), rating, review count, stock, pickup, delivery and shipping availability and aisle. Prices and stock are for a nearby club chosen by location, returned in club. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/samsclub/search' } },
			},
		],
		default: 'search',
	},
];

export const samsClubFields: INodeProperties[] = [
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

	// -- Get Product + Get Reviews --
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '15325822107',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description:
			"Sam's Club item ID: the number at the end of a samsclub.com/ip/ URL, or item_id from a search result",
	},
	{
		displayName: 'Club ID',
		name: 'club_id',
		type: 'string',
		default: '',
		placeholder: '6372',
		displayOptions: show(['product']),
		routing: { request: { body: { club_id: '={{ $value || undefined }}' } } },
		description:
			"Optional club number from Find Clubs. When set, club_price, in-club stock and aisle are that club's.",
	},

	// -- Find Clubs --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75201',
		displayOptions: show(['clubs']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: '5-digit US ZIP code',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1150109',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description:
			'The number at the end of a samsclub.com /browse/ or /cp/ URL. Clearance is 1150109.',
	},

	// -- Additional Options --
	listingOptions('search', 'Results page, up to 45 results per page'),
	listingOptions('savings', 'Results page, up to 45 items per page'),
	listingOptions('category', 'Results page'),
	{
		displayName: 'Additional Options',
		name: 'clubOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['clubs']),
		options: [
			{
				displayName: 'Max Clubs',
				name: 'maxClubs',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Clubs to return, nearest first, 1-20. The API sends 10 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'reviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews page, 10 reviews per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest' },
					{ name: 'Lowest Rating', value: 'lowest' },
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
