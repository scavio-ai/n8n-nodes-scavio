import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['petco'], operation, ...extra },
});

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

// Fields every search and category result carries.
const LISTING =
	'price, list price and Repeat Delivery (autoship) price, rating, review count, brand, part number, cat_entry_id (for Get Store Inventory), pickup, same-day, autoship and in-store-only flags, and every size and flavor variation with its own prices, plus total results, facets and matching categories. 48 per page. Prices are national';

// Listing options shared by Search Products and Get Category Products.
const listingOptions: INodeProperties[] = [
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Results page, 48 products per page',
		routing: { request: { body: { page: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort By',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Name', value: 'name' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price', value: 'price' },
			{ name: 'Rating', value: 'rating' },
			{ name: 'Relevance', value: 'relevance' },
			{ name: 'Top Sold', value: 'top_sold' },
		],
		description: 'Result order. Direction is set by Sort Order.',
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort Order',
		name: 'sort_order',
		type: 'options',
		default: 'asc',
		options: [
			{ name: 'Ascending', value: 'asc' },
			{ name: 'Descending', value: 'desc' },
		],
		description:
			'Sort direction. The API uses ascending for Price and Name and descending for everything else when unset.',
		routing: { request: { body: { sort_order: '={{ $value }}' } } },
	},
];

export const petcoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['petco'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find petco stores',
				description:
					'Petco stores nearest a US ZIP code, up to 10: store ID (for Get Store Inventory), store number, name, address, phone, coordinates, distance in miles, in-store pickup and opening hours per weekday. Costs 1 credit.',
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/petco/stores', timeout: 120000 } },
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get petco category products',
				description: `Products in a Petco category, such as dog/dog-food/dry-dog-food: ${LISTING}. An unknown category is a 404. Can take 10-30 seconds. Costs 1 credit.`,
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/petco/category', timeout: 120000 } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a petco product',
				description:
					'One Petco product by part number or URL with every size and flavor: cat_entry_id, part number, SKU, UPC, price, list price, autoship price, first-autoship promo price, online quantity and status, fulfillment flags, ingredients, guaranteed analysis, directions, specifications, dimensions and images, plus brand, rating, review count and breadcrumbs. Prices are national. Can take 10-30 seconds. Costs 1 credit.',
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/petco/product', timeout: 120000 } },
			},
			{
				name: 'Get Store Inventory',
				value: 'storeInventory',
				action: 'Get petco store inventory',
				description:
					'Units on hand at one Petco store for up to 10 products: qty_available and alert_level (GREEN, YELLOW, RED) per cat_entry_id. Pass a Store ID, or a ZIP code to use the nearest store. Takes cat_entry_id values, not part numbers. Costs 1 credit.',
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: {
					request: { method: 'POST', url: '/api/v1/petco/store-inventory', timeout: 120000 },
				},
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search petco products',
				description: `Search Petco products: ${LISTING}. Costs 1 credit.`,
				// Answers can take 10-30 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/petco/search', timeout: 120000 } },
			},
		],
		default: 'search',
	},
];

export const petcoFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dog food',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'path',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dog/dog-food/dry-dog-food',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value }}' } } },
		description:
			"A petco.com category path (dog/dog-food/dry-dog-food), /category/ followed by the path, or the full URL. The URL of a search result's category works too.",
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.petco.com/product/purina-pro-plan-sensitive-skin-and-stomach-salmon-and-rice-formula-dry-dog-food-40-lbs-3748364',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'Petco product page URL (faster). Use this or Part Number.',
	},
	{
		displayName: 'Part Number',
		name: 'part_number',
		type: 'string',
		default: '',
		placeholder: '3748364',
		displayOptions: show(['product']),
		routing: { request: { body: { part_number: '={{ $value || undefined }}' } } },
		description:
			'Petco part number (the part_number field of a search result). Use this or Product URL.',
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},

	// -- Get Store Inventory --
	{
		displayName: 'Catalog Entry IDs',
		name: 'cat_entry_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6131012, 531503',
		displayOptions: show(['storeInventory']),
		routing: { send: { type: 'body', property: 'cat_entry_ids', value: splitList } },
		description:
			'1-10 cat_entry_id values (from a search result, variation or product variant) separated by commas. Not part numbers. One unknown ID makes the whole answer a 404.',
	},
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'storeId',
		options: [
			{ name: 'Store ID', value: 'storeId' },
			{ name: 'ZIP Code (Nearest Store)', value: 'zip' },
		],
		displayOptions: show(['storeInventory']),
		description: 'Read stock at one store, or at the store nearest a ZIP code',
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '13275',
		displayOptions: show(['storeInventory'], { locateBy: ['storeId'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'Petco store ID: the store_id field of Find Stores, not the store number',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['storeInventory'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code. Stock is read at the nearest store, returned as store.',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listingOptions,
	},

	// -- Additional Options: Get Category Products --
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listingOptions,
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
				default: 5,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Stores to return, nearest first, 1-10. The API sends 5 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},
];
