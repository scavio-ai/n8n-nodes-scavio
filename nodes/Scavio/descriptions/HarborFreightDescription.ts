import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['harborFreight'], operation, ...extra },
});

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

// Price fields every listing, product and batch-price answer carries.
const PRICES =
	'price, regular price, on-sale and clearance flags, sale price with end date, public coupon price, code and expiry, Inside Track Club member price and the compare-at price Harbor Freight quotes. Prices are national';

// Listing options shared by Search Products and Find Clearance Items.
const brandOption: INodeProperties = {
	displayName: 'Brand',
	name: 'brand',
	type: 'string',
	default: '',
	placeholder: 'BAUER',
	description:
		'Only this brand, as listed in the brand facet (BAUER, HERCULES, PITTSBURGH). Case-insensitive.',
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const pagingOptions: INodeProperties[] = [
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
		name: 'perPage',
		type: 'number',
		default: 36,
		typeOptions: { minValue: 1, maxValue: 48 },
		description: 'Products per page, 1-48. The API sends 36 when unset.',
		routing: { request: { body: { page_size: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort By',
		name: 'sort',
		type: 'options',
		default: 'best_match',
		options: [
			{ name: 'Best Match', value: 'best_match' },
			{ name: 'Member Price: High to Low', value: 'member_price_high' },
			{ name: 'Member Price: Low to High', value: 'member_price_low' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
			{ name: 'Top Rated', value: 'top_rated' },
		],
		description: 'Result order. Member price is the Inside Track Club price.',
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
];

export const harborFreightOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['harborFreight'] } },
		options: [
			{
				name: 'Find Clearance Items',
				value: 'clearance',
				action: 'Find harbor freight clearance items',
				description:
					"Harbor Freight clearance items, optionally narrowed by keyword, category or brand, in the same shape as Search Products: each item's clearance price and end date are in sale. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/clearance' } },
			},
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find harbor freight stores',
				description:
					'Harbor Freight stores near a ZIP code, city and state, or coordinates, nearest first: store number, name, address, phone, coordinates, distance in miles, status, opening date and hours. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/stores' } },
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get harbor freight availability',
				description:
					'In-store stock for up to 20 items at chosen stores, or at the stores nearest a ZIP code or coordinates. Per store and item: stock status (in_stock, limited, out_of_stock or not_carried), aisle and a nearby store that has it. Stock is a status from a daily snapshot (inventory_updated_at), not a unit count. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/availability' } },
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get harbor freight prices',
				description: `Current prices for up to 50 item numbers in one call: ${PRICES}. Unknown item numbers are listed in not_found. Costs 1 credit.`,
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/prices' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a harbor freight product',
				description: `One Harbor Freight product by item number, ID or URL: title, brand, UPC, ${PRICES}. Plus rating, review count, badges, description, highlights, the full specification table, warranty, shipping notes, owner's manuals, images and variants. Costs 1 credit.`,
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get harbor freight reviews',
				description:
					"Customer reviews for one item, newest first: title, text, star rating, author, review and purchase dates, incentivized flag, helpful votes and the reviewer's answers (would recommend, what they liked), plus the item's average rating and total review count. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/reviews' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search harbor freight products',
				description: `Search Harbor Freight by keyword or category, with brand and clearance filters: item number, ID, title, brand, URL, image, ${PRICES}. Plus badges, rating, review count, in-store-only and online-only flags, total results and facets. When a keyword maps to a category page, redirect carries that category's results. Costs 1 credit.`,
				routing: { request: { method: 'POST', url: '/api/v1/harborfreight/search' } },
			},
		],
		default: 'search',
	},
];

export const harborFreightFields: INodeProperties[] = [
	// -- Search Products + Find Clearance Items --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		placeholder: 'cordless drill',
		displayOptions: show(['search', 'clearance']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description: 'Search keywords. Search Products needs this, Category ID, or both.',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: '1827',
		displayOptions: show(['search', 'clearance']),
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description:
			'Harbor Freight category ID (1827 = Drills, Drivers & Drill Presses). IDs are the value of the category facet in any search answer.',
	},

	// -- Get Product --
	{
		displayName: 'Item Number',
		name: 'sku',
		type: 'string',
		default: '',
		placeholder: '73216',
		displayOptions: show(['product']),
		routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
		description:
			'Harbor Freight item number (the sku field of a search result). Use this, Product ID or Product URL.',
	},
	{
		displayName: 'Product ID',
		name: 'id',
		type: 'number',
		default: 0,
		placeholder: '48725',
		displayOptions: show(['product']),
		routing: { request: { body: { id: '={{ $value || undefined }}' } } },
		description:
			'Numeric product ID (the ID field of a search result). Use this, Item Number or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.harborfreight.com/20v-cordless-12-in-drilldriver-kit-with-2-ah-battery-and-charger-73216.html',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A harborfreight.com product URL. Use this, Item Number or Product ID.',
	},

	// -- Get Prices --
	{
		displayName: 'Item Numbers',
		name: 'skus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '73216, 59716, 64508',
		displayOptions: show(['prices']),
		routing: { send: { type: 'body', property: 'skus', value: splitList } },
		description: '1-50 Harbor Freight item numbers separated by commas',
	},

	// -- Get Availability --
	{
		displayName: 'Item Numbers',
		name: 'skus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '73216, 58139',
		displayOptions: show(['availability']),
		routing: { send: { type: 'body', property: 'skus', value: splitList } },
		description: '1-20 Harbor Freight item numbers separated by commas',
	},
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'storeIds',
		options: [
			{ name: 'Coordinates (Nearest Stores)', value: 'coordinates' },
			{ name: 'Store IDs', value: 'storeIds' },
			{ name: 'ZIP Code (Nearest Stores)', value: 'zip' },
		],
		displayOptions: show(['availability']),
		description: 'Check chosen stores, or the stores nearest a ZIP code or coordinates',
	},
	{
		displayName: 'Store IDs',
		name: 'store_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '374, 820',
		displayOptions: show(['availability'], { locateBy: ['storeIds'] }),
		routing: { send: { type: 'body', property: 'store_ids', value: splitList } },
		description: '1-20 Harbor Freight store numbers from Find Stores, separated by commas',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90012',
		displayOptions: show(['availability'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code: stock at the stores nearest to it',
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'place',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code or City', value: 'place' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP code or city, or a latitude/longitude pair',
	},
	{
		displayName: 'ZIP Code or City',
		name: 'place',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60601',
		displayOptions: show(['stores'], { locateBy: ['place'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'US ZIP code, or city and state as "City, ST" (Los Angeles, CA)',
	},

	// -- Coordinates: Find Stores + Get Availability --
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores', 'availability'], { locateBy: ['coordinates'] }),
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
		displayOptions: show(['stores', 'availability'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},

	// -- Get Reviews --
	{
		displayName: 'Item Number',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '73216',
		displayOptions: show(['reviews']),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: 'Harbor Freight item number (the sku field of a search result)',
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
			brandOption,
			{
				displayName: 'Clearance Only',
				name: 'clearance',
				type: 'boolean',
				default: false,
				description: 'Whether to list only clearance items',
				routing: { request: { body: { clearance: '={{ $value }}' } } },
			},
			...pagingOptions,
		],
	},

	// -- Additional Options: Find Clearance Items --
	{
		displayName: 'Additional Options',
		name: 'clearanceOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['clearance']),
		options: [brandOption, ...pagingOptions],
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
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Most stores to return, nearest first, 1-50. The API sends 10 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, up to 100',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Availability --
	{
		displayName: 'Additional Options',
		name: 'availabilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['availability'], { locateBy: ['zip', 'coordinates'] }),
		options: [
			{
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Nearest stores to check, 1-100. The API sends 10 when unset.',
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
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Reviews to skip, for paging',
				routing: { request: { body: { offset: '={{ $value }}' } } },
			},
			{
				displayName: 'Reviews Per Call',
				name: 'perPage',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews per call, 1-50. The API sends 10 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},
];
