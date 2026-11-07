import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['nordstrom'], operation, ...extra },
});

// The upstream page can take ~15 s and is retried once, so every route carries a 120s timeout.
const request = (url: string) => ({ request: { method: 'POST' as const, url, timeout: 120000 } });

const LISTING_FIELDS =
	'Each product has the same fields as a search result: style ID, URL, name, brand, image, current price and price range in dollars, original price range, percent off and on-sale flag, rating, review count, badges, a low-inventory flag, marketplace seller and every color. Also returns the total result count, page count, and the filter sidebar: each filter group with its options and product counts (groups with more than 100 options, such as Brand, list the 100 with the most products and give the full option_count).';

export const nordstromOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nordstrom'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find nordstrom stores',
				description:
					'Find Nordstrom stores (full-line stores and Nordstrom Local) near a US ZIP code or latitude/longitude within up to 100 miles, nearest first, or look stores up by store number. Each store has store number, name, type (full_line or local), address, phone, weekly hours, holiday hours when posted, open and close times for the next 8 days, time zone, distance in miles, coordinates, whether it offers buy-online pickup and curbside pickup, its amenities and its store page URL. A ZIP with no store in range returns an empty list. Costs 5 credits.',
				routing: request('/api/v1/nordstrom/stores'),
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get nordstrom product availability',
				description:
					'Online and store-pickup availability for every size and color of one nordstrom.com (US) product, by URL or style ID, optionally one SKU. Each SKU has SKU ID, size, color, UPC, in stock, whether it ships and the quantity available to ship, the quantity available for pickup, and the stores where it can be picked up (store number, name, address, phone). Quantities are chain-wide: per store Nordstrom only says whether pickup is available, not how many. Costs 10 credits (the product page plus the store lookup).',
				routing: request('/api/v1/nordstrom/availability'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get nordstrom brand products',
				description:
					"List a brand's products on nordstrom.com (US) from its brand page, 24 per page, sorted by relevance, rating, price, newest or percent off. Returns the brand's name, path, URL, breadcrumbs and sub-pages (Women, Men, Kids...). " +
					LISTING_FIELDS +
					' An unknown brand is an error. Costs 5 credits.',
				routing: request('/api/v1/nordstrom/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get nordstrom category products',
				description:
					"Browse a nordstrom.com (US) category page, 24 products per page, sorted by relevance, rating, price, newest or percent off. Works on any /browse category, including sale (sale/women), new arrivals (/browse/new) and top-level departments (/browse/women). Returns the category's name, page title, path, URL, breadcrumbs and subcategories (name and path, for drilling down). " +
					LISTING_FIELDS +
					' An unknown category is an error. Costs 5 credits.',
				routing: request('/api/v1/nordstrom/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a nordstrom product',
				description:
					'One nordstrom.com (US) product by URL or style ID: name, brand, description, feature bullets, fit notes, final-sale flag, current, original and clearance price ranges, percent off, rating, review count, the star histogram, the size-fit distribution (too small to too big), the AI review summary when the site shows one, the most mentioned praised and criticized features with a quote each, breadcrumbs and images. Every color lists its images and every size as a SKU with SKU ID, size, size type, UPC, price, original price, percent off, price type (regular, clearance, promotion), in stock and the quantity available to ship. In stock means the SKU can be shipped or picked up in a store, so a SKU held only in a store reads in stock with quantity 0 (Get Availability lists its pickup stores). Includes the reviews shown on the product page (up to about 13), with the total review count. Costs 5 credits.',
				routing: request('/api/v1/nordstrom/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get nordstrom search suggestions',
				description:
					'The search-box autocomplete of nordstrom.com: the queries Nordstrom suggests for a partial search term, most likely first. Useful for keyword research and for building queries for Search Products. Costs 5 credits.',
				routing: request('/api/v1/nordstrom/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search nordstrom products',
				description:
					"Search nordstrom.com (US) products, 24 per page, sorted by relevance, rating, price, newest or percent off. Each result has style ID, URL, name, brand, image, current price and price range in dollars, original price range, percent off and on-sale flag, rating, review count, badges such as new or new_markdown, a low-inventory flag, whether it is sold by a marketplace seller (and the seller's name), and every color with its color family and image. Also returns the total result count and page count. Use a result's URL or style ID with Get Product. Costs 5 credits.",
				routing: request('/api/v1/nordstrom/search'),
			},
		],
		default: 'search',
	},
];

export const nordstromFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dress',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search', 'category', 'brand']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 1-based. Defaults to 1. 24 products per page.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Percent Off', value: 'percent_off' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Relevance (default), rating, price_high, price_low, newest or percent_off',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/browse/women/clothing/dresses',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'A nordstrom.com category: the /browse path or full URL of a category page, e.g. /browse/women/clothing/dresses, sale/women, /browse/new or https://www.nordstrom.com/browse/men/shoes. The /browse prefix is optional. Query parameters in a URL (filters) are ignored.',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/brands/astr-the-label--53360',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description:
			"A nordstrom.com brand: the /brands path or full URL of a brand page, usually ending in the brand ID, e.g. /brands/astr-the-label--53360 (a product's brand_url works). Sub-pages such as /brands/astr-the-label--53360/women work too.",
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'Store Numbers', value: 'storeNumbers' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP code or a latitude/longitude pair, or look them up by store number',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
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
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Store Numbers',
		name: 'store_numbers',
		type: 'string',
		required: true,
		default: '',
		placeholder: '210, 220',
		displayOptions: show(['stores'], { locateBy: ['storeNumbers'] }),
		routing: { request: { body: { store_numbers: '={{ $value }}' } } },
		description:
			"Comma-separated Nordstrom store numbers, up to 100 (an availability result's pickup_stores[].store_number)",
	},
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores'], { locateBy: ['zip', 'coordinates'] }),
		options: [
			{
				displayName: 'Distance (Miles)',
				name: 'distance_miles',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: "Search radius in miles, 1-100 (the site's maximum). Defaults to 100.",
				routing: { request: { body: { distance_miles: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nike air',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Additional Options',
		name: 'suggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				// Named apart from `limit`: the API caps it at 20 (default 8), which the lint rule's default of 50 would exceed.
				displayName: 'Max Suggestions',
				name: 'maxSuggestions',
				type: 'number',
				default: 8,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Suggestions to return, 1-20. Defaults to 8. The site may return fewer.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Product / Get Availability --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.nordstrom.com/s/betsy-and-adam-strapless-mixed-media-gown/8098974',
		displayOptions: show(['product', 'availability']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'Product URL on nordstrom.com (the URL of a search, category or brand result). Use this or Style ID.',
	},
	{
		displayName: 'Style ID',
		name: 'style_id',
		type: 'string',
		default: '',
		placeholder: '8098974',
		displayOptions: show(['product', 'availability']),
		routing: { request: { body: { style_id: '={{ $value || undefined }}' } } },
		description:
			'Nordstrom style ID, the number at the end of a product URL (the style_id of a search result). Used when Product URL is not given.',
	},
	{
		displayName: 'SKU ID',
		name: 'sku_id',
		type: 'string',
		default: '',
		placeholder: 'A7578713',
		displayOptions: show(['availability']),
		routing: { request: { body: { sku_id: '={{ $value || undefined }}' } } },
		description:
			"Only this SKU (a product's colors[].skus[].sku_id). An ID that is not a SKU of the product is an error.",
	},
];
