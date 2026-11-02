import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['petsmart'], operation } });

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

// "store:sku, store:sku" -> [{ store_id, sku }], blanks dropped.
const splitPairs =
	'={{ String($value).split(",").map(s => s.trim()).filter(Boolean).map(p => ({ store_id: p.split(":")[0].trim(), sku: (p.split(":")[1] || "").trim() })) }}';

// Listing options shared by Search Products and Get Deals.
const listingOptions: INodeProperties[] = [
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
		default: 40,
		typeOptions: { minValue: 1, maxValue: 40 },
		description: 'Products per page, 1-40. The API sends 40 when unset.',
		routing: { request: { body: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort By',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'New Arrivals', value: 'new_arrivals' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
			{ name: 'Relevance', value: 'relevance' },
			{ name: 'Top Rated', value: 'top_rated' },
		],
		description: 'Result order',
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '1658',
		description:
			'PetSmart store number from Find Stores. Only products in stock at that store are listed, each with in_stock_at_store.',
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
	},
];

export const petsmartOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['petsmart'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find petsmart stores',
				description:
					'The 12 PetSmart stores nearest a US ZIP code: store number, name, address, phone, coordinates, distance in miles, time zone, the next 7 days of opening hours and services (grooming, PetsHotel, veterinary, adoptions). Set a SKU and each store also carries its unit count and in_stock for that SKU. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/petsmart/stores' } },
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get petsmart availability',
				description:
					'Unit counts for up to 20 store and SKU pairs in one call, mixing stores and SKUs freely: quantity and in_stock per pair. Unknown stores or SKUs read 0. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/petsmart/availability' } },
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get petsmart deals',
				description:
					"Products in PetSmart's Sale section, up to 40 per page, in the same shape as Search Products, plus the current sale events with approximate product counts. Filter by pet, sale event, keyword or a store's stock. The Sale section also lists points and Autoship promotions, so on_sale marks the rows whose price is actually reduced. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/petsmart/deals' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a petsmart product',
				description:
					'One PetSmart product by product ID, SKU or URL with every size and flavor: SKU, UPC, price, original price, sale price and end date, Autoship discount with first-order and recurring price, ship-to-home stock, pickup and same-day options, images and promotions, plus brand, rating, review count, categories and description. Prices are national. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/petsmart/product' } },
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get petsmart store stock',
				description:
					'Stock of up to 20 SKUs at one PetSmart store: units available for in-store pickup, units available to ship to home, and a nearby store with its count when this one has none, plus the store name, address, phone and pickup options. An unknown SKU reads 0. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/petsmart/store-stock' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search petsmart products',
				description:
					'Search PetSmart products, up to 40 per page: SKU, product ID (web_style_id), name, brand, UPC, price, original price, sale price, price range across sizes, rating, review count, image, size, category, promotions, how many stores stock it, pickup and Autoship eligibility and URL. Prices are national. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/petsmart/search' } },
			},
		],
		default: 'search',
	},
];

export const petsmartFields: INodeProperties[] = [
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

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'web_style_id',
		type: 'string',
		default: '',
		placeholder: '570',
		displayOptions: show(['product']),
		routing: { request: { body: { web_style_id: '={{ $value || undefined }}' } } },
		description:
			'The number at the end of a product URL (...-570.html), or the web_style_id field of a search result. One ID covers every size and flavor. Use exactly one of Product ID, SKU or Product URL.',
	},
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		default: '',
		placeholder: '5154856',
		displayOptions: show(['product']),
		routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
		description:
			'One size or flavor SKU (the sku field of a search result). Returns the whole product it belongs to.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.petsmart.com/dog/food/dry-food/hills-science-diet-sensitive-stomach-and-skin-adult-dry-dog-food---chicken-and-barley-570.html',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A petsmart.com product page URL',
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60601',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},

	// -- Get Store Stock --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1658',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'PetSmart store number from Find Stores',
	},
	{
		displayName: 'SKUs',
		name: 'skus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5154856, 5154855',
		displayOptions: show(['storeStock']),
		routing: { send: { type: 'body', property: 'skus', value: splitList } },
		description: '1-20 SKUs separated by commas, such as every variant of a product',
	},

	// -- Get Availability --
	{
		displayName: 'Store and SKU Pairs',
		name: 'pairs',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1658:5252900, 2528:5252900',
		displayOptions: show(['availability']),
		routing: { send: { type: 'body', property: 'pairs', value: splitPairs } },
		description:
			'1-20 pairs written as store number:SKU, separated by commas. Stores and SKUs can be mixed freely.',
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
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, up to 100',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				placeholder: '5154856',
				description: 'A SKU. Each store then carries its unit count of that SKU.',
				routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Deals --
	{
		displayName: 'Additional Options',
		name: 'dealOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			{
				displayName: 'Keyword',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'cat litter',
				description: 'Keywords to search within the sale',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			listingOptions[0],
			{
				displayName: 'Pet',
				name: 'pet',
				type: 'options',
				default: 'dog',
				options: [
					{ name: 'Bird', value: 'bird' },
					{ name: 'Cat', value: 'cat' },
					{ name: 'Dog', value: 'dog' },
					{ name: 'Fish', value: 'fish' },
					{ name: 'Reptile', value: 'reptile' },
					{ name: 'Small Pet', value: 'small_pet' },
				],
				description: 'Only deals for this pet',
				routing: { request: { body: { pet: '={{ $value }}' } } },
			},
			listingOptions[1],
			{
				displayName: 'Sale Event',
				name: 'event',
				type: 'string',
				default: '',
				placeholder: 'Sale > November > Dog Sale',
				description:
					'Only one sale event, by its exact name from the events list of a previous Get Deals answer. Events change with the season.',
				routing: { request: { body: { event: '={{ $value || undefined }}' } } },
			},
			listingOptions[2],
			listingOptions[3],
		],
	},
];
