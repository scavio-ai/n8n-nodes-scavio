import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['dicks'], operation, ...extra },
});

// Dick's Sporting Goods (dickssportinggoods.com, US, USD), 9 operations, 1 credit each except Get
// Product and Get Reviews (2 credits). Get Product and Get Reviews take a product ID or URL; Get
// Products Summary takes up to 5 product IDs; Get Category Products takes a path, URL or category
// ID; Get Store Availability takes SKUs plus a ZIP code or coordinates. Every route carries a 120s
// timeout, except Get Product and Get Reviews: they usually take 20-75 s, up to about 2.5
// minutes, so they carry 240s.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

// Comma-separated values sent as a list (one value or several, any of them matches).
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const GRID =
	"48 items per page by default (up to 144), each with ID, SKU (the variant the tile shows; null on style-level tiles), title, brand, URL, image, price and price_max (current), list_price and list_price_max, percent_off, map_price_applies (the lowest price only shows in the cart), rating, review_count, badge, sku_count, options, is_pinned (a merchandised placement) and scheduled_prices (the offer-price windows Dick's has planned: price, starts_at, ends_at; set by the retailer and can change, not a forecast or price history). Also returns total, page, page_size, total_pages, the sort applied, applied_filters, every facet (ID, label, values with value, label, count and selected; any of them works in Other Filters) and categories (ID, name, path, count). Pinned items come first on page 1 under the featured sort, so that page can hold a few more than Page Size. Prices in USD.";

const SLOW =
	'Usually 20-75 s, up to about 2.5 minutes when a call is retried; failed calls and unknown products are not charged.';

// Grid options shared by Search Products, Get Category Products, Get Brand Products and Get
// Deals (Get Brand Products has no Brands filter: the page is one brand).
const gridOptions = (withBrand: boolean, defaultSort: string): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Max Price',
			name: 'max_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
			description: 'Approximate upper price bound in USD',
			routing: { request: { body: { max_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'min_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
			description:
				"Approximate lower price bound in USD (the site's price filter is loose: a few items just outside the range can appear)",
			routing: { request: { body: { min_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Other Filters (JSON)',
			name: 'filters',
			type: 'json',
			default: '{}',
			description:
				'Any facet from a previous response: its ID to one value or a list (any of them), e.g. {"5495": "Men\'s", "rating": "4+", "price": "50-100"}. Values of one facet are OR, facets combine (AND).',
			routing: {
				request: {
					body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
				},
			},
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description:
				'Results page, 1-based. A page past the last one returns an empty items list with the real total. Defaults to 1.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'page_size',
			type: 'number',
			default: 48,
			typeOptions: { minValue: 1, maxValue: 144 },
			description: 'Items per page, 1-144. Defaults to 48.',
			routing: { request: { body: { page_size: '={{ $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: defaultSort,
			options: [
				{ name: 'Brand A-Z', value: 'brand_az' },
				{ name: 'Featured', value: 'featured' },
				{ name: 'New Arrivals', value: 'new_arrivals' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Relevance', value: 'relevance' },
				{ name: 'Savings', value: 'savings' },
				{ name: 'Top Sellers', value: 'top_sellers' },
			],
			description:
				"Relevance, top sellers, savings (biggest discount first), price, featured (the site's merchandised order: pinned items first), new arrivals or brand A-Z. Search and brand default to relevance; category and deals to featured, like the site.",
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
	];
	if (withBrand) {
		options.push({
			displayName: 'Brands',
			name: 'brand',
			type: 'string',
			default: '',
			placeholder: 'Nike, HOKA',
			description:
				'Only these brands, as the Brand facet lists them (Nike, HOKA, YETI), separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'brand', value: splitList } },
		});
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

export const dicksOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['dicks'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get dicks brand products',
				description:
					"Every Dick's Sporting Goods product of one brand by name (Nike, YETI, Callaway, Under Armour...), optionally narrowed by a keyword, with the same filters and sorts as Search Products. " +
					GRID +
					" brand echoes the brand as Dick's writes it. An unknown brand is an error. Costs 1 credit.",
				routing: request('/api/v1/dicks/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get dicks category products',
				description:
					"Browse one Dick's Sporting Goods category by its page path, URL or ID (Men's Running Shoes, Golf Drivers, Kayaks...), in the site's featured order by default, with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the category's ID, name, path and URL. An unknown category is an error. Costs 1 credit.",
				routing: request('/api/v1/dicks/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get dicks clearance and deals',
				description:
					"Dick's Sporting Goods deal listings: Clearance (default), Sale or This Week's Deals, in the site's featured order by default (sort Savings for the biggest discounts first), with the same filters and sorts as Search Products. " +
					GRID +
					' To track clearance prices over time, poll and store your own: there is no price history. Costs 1 credit.',
				routing: request('/api/v1/dicks/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a dicks product',
				description:
					"One Dick's Sporting Goods product by ID or URL with every SKU: title, brand, description, features, specs, attributes, product type, category, images, rating, review_count, question and answer counts, the price block (min, max, list_min, list_max, percent_off, map_price_applies), clearance flag, the option axes (color, size, width...) and every variant: SKU, UPC, options, color, size, price, list_price, percent_off, map_price_applies (the price only shows in the cart), is_clearance, online_units (units available to ship), buyable, ship_class and lead_time. Prices differ per SKU (one color on clearance, the rest at full price), so read the variant you need. A variant's SKU is what Get Store Availability takes. An unknown ID is an error. " +
					SLOW +
					' Costs 2 credits.',
				routing: request('/api/v1/dicks/product', 240000),
			},
			{
				name: 'Get Products Summary',
				value: 'products',
				action: 'Get a dicks products summary',
				description:
					"Up to 5 Dick's Sporting Goods products in one call: the fast style-level check of title, brand, URL, image, price and list-price ranges, percent_off, map_price_applies, clearance, buyable, option axes, attributes, specs, product type, rating, review_count and description. No per-SKU prices or units: those come from Get Product. Unknown IDs are listed in not_found. Costs 1 credit.",
				routing: request('/api/v1/dicks/products'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get dicks product reviews',
				description:
					"The 15 newest customer reviews of one Dick's Sporting Goods product by ID or URL, with its review statistics: total, average, distribution (1-5 stars), recommended and not-recommended counts, photo count, first and last review dates, question and answer counts, and the average of each secondary rating (fit, comfort, quality, value...). Each review has ID, rating, title, text, pros, cons, author nickname, submitted_at, recommended, helpful and unhelpful votes, verified_purchaser and incentivized badges, syndicated_from (the brand site a review came from), secondary ratings, customer photos and the brand's public response. The newest 15 only: no paging, no sort, no star filter; questions and answers are counts only. An unknown ID is an error. " +
					SLOW +
					' Costs 2 credits.',
				routing: request('/api/v1/dicks/reviews', 240000),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get dicks search suggestions',
				description:
					'The dickssportinggoods.com search-box suggestions for a partial query: keyword completions, brands, categories (ID, name, path, URL, product_count) and products (ID, title, brand, URL, image, color, price and list-price ranges, percent_off). Costs 1 credit.',
				routing: request('/api/v1/dicks/suggestions'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get dicks store stock',
				description:
					"Store unit counts for 1-20 Dick's Sporting Goods SKUs at up to 100 stores near a US ZIP code or a point (latitude and longitude), nearest first, within 25 miles by default (up to 250). Chain picks DICK'S stores (default, incl. House of Sport and Going, Going, Gone!), Golf Galaxy or Public Lands. Each store has store_id, chain, name, address, shopping_center, city, state, ZIP, phone, latitude and longitude, distance_miles, status, weekly hours and per SKU: units (the units the store can sell) and in_store_units (the units on hand). Also returns sku_totals and how many stores have stock. There is no standalone store locator: store details come with a SKU lookup. An unknown SKU reads 0 at every store, so take SKUs from Get Product (variants[].sku). Costs 1 credit.",
				routing: request('/api/v1/dicks/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search dicks products',
				description:
					"Search dickssportinggoods.com (Dick's Sporting Goods, US) by keyword, filtered by brand, an approximate price range and any facet (gender, size, color, rating, sale...), sorted by relevance, top sellers, savings, price, featured, new arrivals or brand A-Z. " +
					GRID +
					" did_you_mean carries Dick's spelling suggestion for a misspelled query. Keywords Dick's sends to a landing page (golf balls, clearance) are followed to that page: redirected_to and category say which. Use a result ID with Get Product. Costs 1 credit.",
				routing: request('/api/v1/dicks/search'),
			},
		],
		default: 'search',
	},
];

export const dicksFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'running shoes',
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
		displayOptions: show(['search']),
		options: gridOptions(true, 'relevance'),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		default: '',
		placeholder: '/f/mens-running-shoes',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value || undefined }}' } } },
		description:
			"A Dick's category page path (/f/... or /c/...), as dickssportinggoods.com category links and a response's categories[].path carry it. Use this, Category URL or Category ID.",
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.dickssportinggoods.com/f/mens-running-shoes',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A dickssportinggoods.com category URL (filters in the URL are not read: set them in Additional Options). Used when Category Path is not given.',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: '202105',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description: "A category ID, as a response's categories list or category object carries it",
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions(true, 'featured'),
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand Name',
		name: 'brandName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YETI',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description:
			"A brand name as Dick's lists it in the Brand facet (Nike, YETI, Callaway, Under Armour); case does not matter",
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: (
			[
				...gridOptions(false, 'relevance'),
				{
					displayName: 'Keyword',
					name: 'query',
					type: 'string',
					default: '',
					placeholder: 'tumbler',
					description: 'Narrow the brand to a keyword',
					routing: { request: { body: { query: '={{ $value || undefined }}' } } },
				},
			] as INodeProperties[]
		).sort((x, y) => x.displayName.localeCompare(y.displayName)),
	},

	// -- Get Deals --
	{
		displayName: 'List',
		name: 'type',
		type: 'options',
		default: 'clearance',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Sale', value: 'sale' },
			{ name: "This Week's Deals", value: 'weekly_deals' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: "Which deal listing to read: Clearance (default), Sale or This Week's Deals",
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions(true, 'featured'),
	},

	// -- Get Product / Get Reviews --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '23FHQMCLFTN9GTXBLMNS',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"A Dick's product ID: a search result's ID, the last part of a product URL (any case). Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.dickssportinggoods.com/p/hoka-mens-clifton-9-gtx-running-shoes-23fhqmclftn9gtxblmns/23fhqmclftn9gtxblmns',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A dickssportinggoods.com product URL (its product ID is used). Used when Product ID is not given.',
	},

	// -- Get Products Summary --
	{
		displayName: 'Product IDs',
		name: 'product_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '23FHQMCLFTN9GTXBLMNS, 26UNDMFITN1HRI9WUAETC',
		displayOptions: show(['products']),
		routing: { send: { type: 'body', property: 'product_ids', value: splitList } },
		description:
			'1 to 5 product IDs, separated by commas, in one call (1 credit). Unknown IDs are listed in not_found.',
	},

	// -- Get Store Availability --
	{
		displayName: 'SKUs',
		name: 'skus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '25535758, 26810079',
		displayOptions: show(['storeAvailability']),
		routing: { send: { type: 'body', property: 'skus', value: splitList } },
		description:
			"1 to 20 SKU IDs from Get Product (variants[].sku), separated by commas. An ID Dick's does not know reads 0 at every store.",
	},
	{
		displayName: 'Locate By',
		name: 'availabilityLocateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['storeAvailability']),
		description: 'Search stores near a ZIP code or a latitude/longitude pair',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60601',
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'Latitude',
		name: 'lat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['coordinates'] }),
		routing: { request: { body: { lat: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'lng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['coordinates'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Additional Options',
		name: 'storeAvailabilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeAvailability']),
		options: [
			{
				displayName: 'Chain',
				name: 'chain',
				type: 'options',
				default: 'dicks',
				options: [
					{ name: "DICK'S Sporting Goods", value: 'dicks' },
					{ name: 'Golf Galaxy', value: 'golf_galaxy' },
					{ name: 'Public Lands', value: 'public_lands' },
				],
				description:
					"DICK'S Sporting Goods (default, incl. House of Sport and Going, Going, Gone! stores), Golf Galaxy or Public Lands.",
				routing: { request: { body: { chain: '={{ $value }}' } } },
			},
			{
				displayName: 'In Stock Only',
				name: 'in_stock_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only the stores that have at least one of the SKUs',
				routing: { request: { body: { in_stock_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 250 },
				description: 'Search radius in miles, 1-250. Defaults to 25. Up to 100 stores are returned.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
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
		placeholder: 'yeti tum',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},
];
