import type { INodeProperties } from 'n8n-workflow';

// Home Depot (US, homedepot.com) is the default. Country "Canada" reads Home Depot Canada
// (homedepot.ca) on Search Products, Get Product and Get Reviews; the five other operations
// are Home Depot Canada only and send no country (the API defaults them to "ca"). The
// Country field only sends a value for Canada, so a US workflow posts exactly the body it
// did before Home Depot Canada existed.

const show = (operation: string[], country?: string[]) => ({
	show: { resource: ['homeDepot'], operation, ...(country ? { country } : {}) },
});

const languageOption: INodeProperties = {
	displayName: 'Language',
	name: 'language',
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French', value: 'fr' },
	],
	description:
		'Home Depot Canada language. IDs and CAD prices are the same; names, links and facets are in that language.',
	routing: { request: { body: { language: '={{ $value }}' } } },
};

const storeIdOption = (description: string): INodeProperties => ({
	displayName: 'Store ID',
	name: 'store_id',
	type: 'string',
	default: '',
	placeholder: '7080',
	description,
	routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
});

/** Home Depot Canada listing options shared by Search Products (Canada) and Get Category Products. */
function caListingOptions(): INodeProperties[] {
	return [
		{
			displayName: 'Deals',
			name: 'deals',
			type: 'multiOptions',
			default: [],
			options: [
				{ name: 'New Lower Price', value: 'new_lower_price' },
				{ name: 'Savings', value: 'savings' },
				{ name: 'Special Buy', value: 'special_buy' },
			],
			description:
				"Home Depot Canada's Special Offers filter. On Search Products with no query, every product with that offer.",
			routing: { request: { body: { deals: '={{ $value && $value.length ? $value : undefined }}' } } },
		},
		{
			displayName: 'Filters (JSON)',
			name: 'filters',
			type: 'json',
			default: '',
			placeholder: '[{ "facet": "manufacturerName", "value": "9wh" }]',
			description:
				"Up to 10 of the site's filters as an earlier response's facets give them: a list of { facet, value }",
			routing: {
				request: {
					body: {
						filters:
							'={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
					},
				},
			},
		},
		{
			displayName: 'Include Facets',
			name: 'include_facets',
			type: 'boolean',
			default: false,
			description: 'Whether to also return facets to filter on',
			routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
		},
		languageOption,
		{
			displayName: 'Max Price',
			name: 'max_price',
			type: 'number',
			default: 0,
			description: 'Highest price in CAD',
			routing: { request: { body: { max_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'min_price',
			type: 'number',
			default: 0,
			description: 'Lowest price in CAD',
			routing: { request: { body: { min_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Result page to read. Past the last page: an empty page, has_more false.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'page_size',
			type: 'number',
			default: 40,
			typeOptions: { minValue: 1, maxValue: 40 },
			description: 'Products per page, 1-40',
			routing: { request: { body: { page_size: '={{ $value }}' } } },
		},
		{
			displayName: 'Sort By',
			name: 'sort_by',
			type: 'options',
			default: 'best_match',
			description: 'Result sort order. Home Depot Canada has no Top Sellers sort.',
			options: [
				{ name: 'Best Match', value: 'best_match' },
				{ name: 'Price: High to Low', value: 'price_high' },
				{ name: 'Price: Low to High', value: 'price_low' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			routing: { request: { body: { sort_by: '={{ $value }}' } } },
		},
		storeIdOption(
			"Home Depot Canada store number whose price and units to read. Without it the site prices at its default store 7274; data.store says which.",
		),
	];
}

export const homeDepotOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['homeDepot'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get home depot canada categories',
				description:
					'Home Depot Canada only: the department tree (about 1,750 nodes) and the current event and collection pages. Each ID is a Category ID for Get Category Products and Search Products. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/categories' } },
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get home depot canada category products',
				description:
					'Home Depot Canada only: one category or collection page by Category ID, priced at a store, with exact units at that store and aisle and bay. Prices in CAD. An unknown category or store is a charged 404. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/category' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a home depot product',
				description:
					'Get full Home Depot item detail: pricing and promotions, images and videos, spec table, dimensions, bullets, documents, return policy. It carries only a 10-review preview, so use Get Reviews for the paginated bodies. Home Depot Canada with a Store ID: price is that store\'s price and online_price the online price, which can differ. Costs 2 credits, 1 for Canada.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get home depot product reviews',
				description:
					'Get one page of full Home Depot review bodies with the rating distribution, per-attribute ratings, photos and seller responses. Reviews come 30 per page and asking past total_pages returns a 404. Home Depot Canada: the first 8 reviews per language and the first page of questions. Costs 2 credits, 1 for Canada.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/reviews' } },
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get home depot canada search suggestions',
				description:
					'Home Depot Canada only: search-box keyword suggestions for typed text, plus the installation services the site suggests. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/suggestions' } },
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a home depot canada store',
				description:
					'Home Depot Canada only: one store by number with address, phone, coordinates, services, 7 dated days of hours and nearby stores. An unknown store is a charged 404. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/store' } },
			},
			{
				name: 'Get Store Stock',
				value: 'stock',
				action: 'Get home depot canada store stock',
				description:
					'Home Depot Canada only: exact units of one item at every store near a postal code or city, in one call. No prices. When Home Depot Canada has no store record for an item that exists, the answer is an unbilled 502. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/stock' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search home depot products',
				description:
					'Search Home Depot: price and promotions, brand and model, ratings, badges, per-store pickup and delivery. Page size is fixed at 12 products, so paging is the only way to read further. Home Depot Canada: CAD prices at a store with exact units and aisle and bay, 1-40 per page. Costs 2 credits, 1 for Canada.',
				routing: { request: { method: 'POST', url: '/api/v1/homedepot/search' } },
			},
		],
		default: 'search',
	},
];

export const homeDepotFields: INodeProperties[] = [
	// ── Country (shared US / Canada operations) ──
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['search', 'product', 'reviews']),
		description:
			"Home Depot (homedepot.com) or Home Depot Canada (homedepot.ca, The Home Depot's Canadian store: 182 stores in 10 provinces; prices in CAD, 1 credit per call)",
		routing: { request: { body: { country: '={{ $value === "ca" ? "ca" : undefined }}' } } },
	},

	// ── Search Products ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cordless drill',
		displayOptions: show(['search'], ['us']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'cordless drill',
		displayOptions: show(['search'], ['ca']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description:
			'Product search keyword. Optional when Canada Options sets a Category ID or Deals.',
	},

	// ── Get Search Suggestions ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'christ',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What has been typed so far',
	},

	// ── Shared item ID (product, reviews, stock) ──
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '206568793',
		displayOptions: show(['product', 'reviews', 'stock']),
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description:
			'Home Depot item ID, or a full product URL; tracking parameters are discarded. For Home Depot Canada a 10-digit item ID or a homedepot.ca link. An unknown item comes back as a 404.',
	},

	// ── Get Category Products ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'l4-drill-drivers',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'A category or collection ID from Get Categories, e.g. 661103 for Christmas Trees',
	},

	// ── Get Store Stock ──
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'H3B 1A1',
		displayOptions: show(['stock']),
		routing: { request: { body: { location: '={{ $value }}' } } },
		description: 'A Canadian postal code or a city: stores near it',
	},

	// ── Get Store ──
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7076',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A Home Depot Canada store number (4 digits)',
	},

	// ── Additional Options: Search Products (United States) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search'], ['us']),
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

	// ── Canada Options: Search Products (Canada) ──
	{
		displayName: 'Canada Options',
		name: 'canadaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search'], ['ca']),
		options: [
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: 'l4-drill-drivers',
				description: 'A category ID from Get Categories; the query is then optional',
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
			...caListingOptions(),
		],
	},

	// ── Additional Options: Get Category Products ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: [
			...caListingOptions(),
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Optional keywords inside the category',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
		],
	},

	// ── Canada Options: Get Product (Canada) ──
	{
		displayName: 'Canada Options',
		name: 'canadaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product'], ['ca']),
		options: [
			languageOption,
			storeIdOption(
				"A Home Depot Canada store number: price is then that store's price (price_source store), with units at the store and aisle and bay; online_price stays the online price. When the site has no store record for the item, the online price comes back with store_price_returned false.",
			),
		],
	},

	// ── Additional Options: Get Reviews (United States) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews'], ['us']),
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

	// ── Canada Options: Get Reviews (Canada) ──
	{
		displayName: 'Canada Options',
		name: 'canadaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews'], ['ca']),
		options: [
			{
				...languageOption,
				description: 'Home Depot Canada review language (English and French are different review sets)',
			},
		],
	},

	// ── Additional Options: Get Categories ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Depth',
				name: 'depth',
				type: 'number',
				default: 4,
				typeOptions: { minValue: 1, maxValue: 4 },
				description: 'Levels of the tree to return, 1-4',
				routing: { request: { body: { depth: '={{ $value }}' } } },
			},
			languageOption,
		],
	},

	// ── Additional Options: Get Store Stock ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stock']),
		options: [
			languageOption,
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Stores per page, 1 to 50. The API default is 20.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Result page to read',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Store and Get Search Suggestions ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['store']),
		options: [languageOption],
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [languageOption, storeIdOption('Optional Home Depot Canada store number')],
	},
];
