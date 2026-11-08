import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['nordstromRack'], operation, ...extra },
});

// Nordstrom Rack (nordstromrack.com, US): a separate resource from Nordstrom with the same
// request shapes and credits. Every route carries a 120s timeout; Get Reviews takes 15-60 s,
// up to about 100 s at 200 reviews, so it carries 150s.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const LISTING_FIELDS =
	'Each product has the same fields as a search result: style ID, URL, name, brand, image, current price and price range in dollars, the compare-at price range Rack strikes through, percent off and on-sale flag, the clearance price range, any promotion on top (promotion_price_range and promotion_percent_off, the extra percent off during Clear the Rack), rating, review count, badges, a low-inventory flag, marketplace seller and every color. Also returns the total result count, page count, and the filter sidebar: each filter group with its options and product counts (groups with more than 100 options, such as Brand, list the 100 with the most products and give the full option_count).';

export const nordstromRackOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nordstromRack'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find nordstrom rack stores',
				description:
					'Find Nordstrom Rack stores near a US ZIP code or latitude/longitude within up to 100 miles, nearest first, or look Rack stores up by store number. Each store has store number, name, type (rack), address, phone, weekly hours, holiday hours when posted, open and close times for the next 8 days, time zone, distance in miles, coordinates, whether it offers buy-online pickup and curbside pickup, its amenities and its store page URL. A ZIP with no store in range returns an empty list. Costs 5 credits.',
				routing: request('/api/v1/nordstromrack/stores'),
			},
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get nordstrom rack product availability',
				description:
					'Online and Rack store-pickup availability for every size and color of one nordstromrack.com (US) product, by URL or style ID, optionally one SKU. Each SKU has SKU ID, size, color, UPC, in stock, whether it ships and the quantity available to ship, the quantity available for pickup, and the Rack stores where it can be picked up (store number, name, address, phone). Quantities are chain-wide: per store the site only says whether pickup is available, not how many. Costs 10 credits (the product page plus the store lookup).',
				routing: request('/api/v1/nordstromrack/availability'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get nordstrom rack brand products',
				description:
					"List a brand's products on nordstromrack.com (US) from its brand page (/brands/adidas), 24 per page, sorted by relevance, rating, price, newest or percent off. Returns the brand's name, path, URL and breadcrumbs. " +
					LISTING_FIELDS +
					' An unknown brand is an error. Costs 5 credits.',
				routing: request('/api/v1/nordstromrack/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get nordstrom rack category products',
				description:
					"Browse a nordstromrack.com (US) category page, 24 products per page, sorted by relevance, rating, price, newest or percent off. Works on every /shop and /clearance listing: departments (/shop/women), deals (/shop/deals/black-friday), new arrivals (/shop/new-arrivals), Clear the Rack (/clearance, /clearance/women/clothing) and flash events: /shop/flash lists the live events as subcategories (it has no products of its own), and each event (/shop/flash/event-7) is a listing whose first page shows the event's featured products first. Returns the category's name, page title, path, URL, breadcrumbs and subcategories (name and path, for drilling down). " +
					LISTING_FIELDS +
					' An unknown category is an error. Costs 5 credits.',
				routing: request('/api/v1/nordstromrack/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a nordstrom rack product',
				description:
					"One nordstromrack.com (US) product by URL or style ID: name, brand, brand page URL, description, feature bullets, fit notes, final-sale flag, current, compare-at and clearance price ranges, percent off, any promotion on top (promotion_price_range and promotion_percent_off, e.g. Clear the Rack's extra 25% off clearance), rating, review count, the star histogram, the size-fit distribution (too small to too big), the AI review summary when the site shows one, the most mentioned praised and criticized features with a quote each, breadcrumbs and images. Every color lists its images and every size as a SKU with SKU ID, size, size type, UPC, price, compare-at price, percent off, price type (regular, clearance, promotion), in stock and the quantity available to ship. In stock means the SKU can be shipped or picked up in a Rack store, so a SKU held only in a store reads in stock with quantity 0 (Get Availability lists its pickup stores). Includes the reviews shown on the product page (up to about 13), with the total review count; Get Reviews returns the full review history. Ratings and reviews are Rack's own, separate from nordstrom.com's. Costs 5 credits.",
				routing: request('/api/v1/nordstromrack/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get nordstrom rack product reviews',
				description:
					"Customer reviews of one nordstromrack.com (US) product by URL or style ID, up to 200 per call (default 60), sorted most helpful (default), most recent, highest rated or lowest rated, optionally filtered to star ratings, verified purchases, reviews with photos, or a text search. Rack has its own review pool, separate from nordstrom.com's. Returns the product's review summary (average rating, total reviews, star histogram, size rating 1 runs small to 5 runs big, width rating where the site has one, the most mentioned praised and criticized features with a quote each, and the count of rating-only reviews), the AI review summary when the site shows one, the number of reviews matching the filters (total_results), returned and has_more. Each review has ID, title, text, star rating, size rating, author, date, helpful votes, verified-purchase flag, reviewer badges, size and color purchased, the reviewer's height, weight, body type and usual sizes when given, and photos. Rating-only reviews are included with title and text null. Takes 15-60s, up to about 100s at 200 reviews. Costs 10 credits.",
				routing: request('/api/v1/nordstromrack/reviews', 150000),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get nordstrom rack search suggestions',
				description:
					'The search-box autocomplete of nordstromrack.com: the queries Nordstrom Rack suggests for a partial search term, most likely first. Useful for keyword research and for building queries for Search Products. Costs 5 credits.',
				routing: request('/api/v1/nordstromrack/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search nordstrom rack products',
				description:
					"Search nordstromrack.com (US) products, 24 per page, sorted by relevance, rating, price, newest or percent off. Each result has style ID, URL, name, brand, image, current price and price range in dollars, the compare-at price range Rack strikes through, percent off and on-sale flag, the clearance price range, any promotion on top (promotion_price_range and promotion_percent_off, the extra percent off during Clear the Rack), rating, review count (Rack's own reviews), badges such as new_markdown or final_sale, a low-inventory flag, whether it is sold by a marketplace seller (and the seller's name), and every color with its color family and image. Also returns the total result count and page count. Use a result's URL or style ID with Get Product. Costs 5 credits.",
				routing: request('/api/v1/nordstromrack/search'),
			},
		],
		default: 'search',
	},
];

export const nordstromRackFields: INodeProperties[] = [
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
		placeholder: '/clearance/women',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'A nordstromrack.com category: the /shop or /clearance path or full URL of a category page, e.g. /shop/women/clothing/dresses, /shop/deals/black-friday, /shop/new-arrivals, /clearance, /clearance/women/clothing, /shop/flash or a flash event such as /shop/flash/event-7. A path without a prefix is read as /shop/... . Query parameters in a URL (filters) are ignored.',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/brands/adidas',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description:
			"A nordstromrack.com brand: the /brands path or full URL of a brand page, e.g. /brands/adidas, /brands/sam-edelman or https://www.nordstromrack.com/brands/ugg (a product's brand_url works). Rack brand pages carry no brand ID: the nordstrom.com form /brands/name--ID is an error here.",
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
		description:
			'Find stores near a ZIP code or a latitude/longitude pair, or look them up by store number',
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
		placeholder: '229, 242',
		displayOptions: show(['stores'], { locateBy: ['storeNumbers'] }),
		routing: { request: { body: { store_numbers: '={{ $value }}' } } },
		description:
			"Comma-separated Nordstrom Rack store numbers, up to 100 (an availability result's pickup_stores[].store_number). Numbers of Nordstrom full-line stores are left out.",
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
		placeholder: 'dre',
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

	// -- Get Product / Get Reviews / Get Availability --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.nordstromrack.com/s/maeve-midi-dress/7737947',
		displayOptions: show(['product', 'reviews', 'availability']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'Product URL on nordstromrack.com (the URL of a search, category or brand result). Use this or Style ID.',
	},
	{
		displayName: 'Style ID',
		name: 'style_id',
		type: 'string',
		default: '',
		placeholder: '7737947',
		displayOptions: show(['product', 'reviews', 'availability']),
		routing: { request: { body: { style_id: '={{ $value || undefined }}' } } },
		description:
			'Nordstrom Rack style ID, the number at the end of a product URL (the style_id of a search result). Used when Product URL is not given.',
	},
	{
		displayName: 'SKU ID',
		name: 'sku_id',
		type: 'string',
		default: '',
		placeholder: 'A5819201',
		displayOptions: show(['availability']),
		routing: { request: { body: { sku_id: '={{ $value || undefined }}' } } },
		description:
			"Only this SKU (a product's colors[].skus[].sku_id). An ID that is not a SKU of the product is an error.",
	},

	// -- Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'reviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Max Reviews',
				name: 'max_reviews',
				type: 'number',
				default: 60,
				typeOptions: { minValue: 1, maxValue: 200 },
				description:
					'Reviews to return, 1-200. Defaults to 60. Larger values take longer (about 50-100s for 200).',
				routing: { request: { body: { max_reviews: '={{ $value }}' } } },
			},
			{
				displayName: 'Search Text',
				name: 'search',
				type: 'string',
				default: '',
				placeholder: 'comfortable',
				description:
					"Only reviews mentioning this text (the review search box), 1-100 characters. Results come in the site's search order, so Sort cannot be set with it.",
				routing: { request: { body: { search: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_helpful',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				description:
					'Most helpful (default), most recent, highest rated or lowest rated. Cannot be combined with Search Text.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Star Ratings',
				name: 'stars',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with these star ratings, e.g. 1 and 2 for the critical ones',
				routing: { request: { body: { stars: '={{ $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Verified Purchases Only',
				name: 'verified_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews from verified purchasers',
				routing: { request: { body: { verified_only: '={{ $value }}' } } },
			},
			{
				displayName: 'With Photos Only',
				name: 'with_photos',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews that include customer photos',
				routing: { request: { body: { with_photos: '={{ $value }}' } } },
			},
		],
	},
];
