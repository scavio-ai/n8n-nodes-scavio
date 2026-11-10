import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['jcpenney'], operation, ...extra },
});

// JCPenney (jcpenney.com, US incl. Puerto Rico stores, USD), 9 operations, 1 credit each. Get
// Product takes a product ID, a URL or up to 20 product IDs; Get Category Products takes a /g/
// path or URL that carries its id=cat...; Get Brand Products takes a brand name or URL; Get
// Store Availability takes a SKU plus a ZIP code or coordinates. Every route carries a 120s
// timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

// Comma-separated values sent as a list (one value or several, any of them matches).
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const GRID =
	"48 products per page (at most 25 pages = 1,200 items), each with ID, title, brand, URL, image, sku_id, price and price_max (current), regular_price and regular_price_max, price_type (sale, clearance, original), percent_off, deal_label (BIG BUY!, CLEARANCE...), coupon_price with coupon_code (the price after today's coupon), rating, review_count, badge (Only at JCP, NEW, Few Left), availability_label (Same Day Pickup, Online Only...), colors with their SKU IDs, and is_marketplace with the seller for third-party items. Also returns total, page, total_pages, the sort applied, applied_filters and every facet (ID, label and values with their value, count and a selected flag; any of them works in Other Filters). Prices are product-level ranges: JCPenney does not expose a price per size or color. Average rating and review count only: review text is not available. Prices in USD.";

// Grid options shared by Search Products, Get Category Products, Get Brand Products and
// Get Deals (Get Brand Products has no Brands filter: the page is one brand; Get Deals has
// no Deal Labels filter: the list is the deal).
const gridOptions = (withBrand: boolean, withDeal: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Colors',
			name: 'shades',
			type: 'string',
			default: '',
			placeholder: 'black, blue',
			description:
				'Only these colors, as the Color facet lists them, separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'color', value: splitList } },
		},
		{
			displayName: 'Other Filters (JSON)',
			name: 'filters',
			type: 'json',
			default: '{}',
			description:
				'Any facet from a previous response: its ID to one value or a list (any of them), e.g. {"gender": "women", "store_availability": "same day pickup", "average_rating": "4 rating"}. Several facets combine (AND).',
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
			typeOptions: { minValue: 1, maxValue: 25 },
			description:
				'Results page, 1-based (48 items per page, at most 25 pages). A page past the last one returns an empty items list with the real total. Defaults to 1.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Price Ranges',
			name: 'price_range',
			type: 'string',
			default: '',
			placeholder: '$20 - $24',
			description:
				'Price Range facet values ("under $5", "$20 - $24"...), separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'price_range', value: splitList } },
		},
		{
			displayName: 'Sizes',
			name: 'size',
			type: 'string',
			default: '',
			placeholder: 'm',
			description:
				'Only these sizes, as the Size facet lists them (m, 12, 32x30...), separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'size', value: splitList } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'New Arrivals', value: 'new_arrivals' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Rating', value: 'rating' },
				{ name: 'Relevance', value: 'relevance' },
			],
			description:
				"Relevance (default), new arrivals, best sellers, rating (highest rated first) or price. The price orders are JCPenney's own and loose: sort the items yourself when you need a strict order.",
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
	];
	if (withBrand) {
		options.push({
			displayName: 'Brands',
			name: 'brand',
			type: 'string',
			default: '',
			placeholder: "levi's",
			description:
				'Only these brands, as the Brand facet lists them ("levi\'s", "nike", "st. john\'s bay"), separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'brand', value: splitList } },
		});
	}
	if (withDeal) {
		options.push({
			displayName: 'Deal Labels',
			name: 'deal',
			type: 'string',
			default: '',
			placeholder: 'CLEARANCE',
			description:
				'Only items with these Deals & Promotions labels (SALE, CLEARANCE, BIG BUY!...), as the facet lists them, separated by commas',
			routing: { send: { type: 'body', property: 'deal', value: splitList } },
		});
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

export const jcpenneyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['jcpenney'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find jcpenney stores',
				description:
					'JCPenney stores near a US or Puerto Rico ZIP code, a city and state or a point (latitude and longitude), within 25 miles by default (up to 100), paged: store_id, name, address, city, state, ZIP, phone, latitude and longitude, distance in miles, weekly opening hours, timezone, services (Curbside Pickup, salon, portrait studio, JCPenney Beauty...), curbside and in-store pickup directions, bookable appointments (Sephora, salon) and the store page URL. Costs 1 credit.',
				routing: request('/api/v1/jcpenney/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get jcpenney brand products',
				description:
					"Every JCPenney product of one brand by name (Nike, St. John's Bay, Carter's...) or a brand page URL, with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the brand's name, facet value and URL. An unknown brand is an error. Costs 1 credit.",
				routing: request('/api/v1/jcpenney/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get jcpenney category products',
				description:
					"Browse one JCPenney category by its path or URL (Dresses, Sheets, Women's Boots...), with the same filters and sorts as Search Products. The path needs its id=cat... part, the way jcpenney.com /g/ category links and a response's breadcrumbs carry it. " +
					GRID +
					" Also returns the category's name, ID, path, URL and breadcrumbs. A department page (dept...) lists no products by itself: it needs a deal or another filter. Costs 1 credit.",
				routing: request('/api/v1/jcpenney/category'),
			},
			{
				name: 'Get Coupon Codes',
				value: 'coupons',
				action: 'Get jcpenney coupon codes',
				description:
					"Today's public JCPenney coupons: code (null for in-store offers that need none), channel (online, in store or both), headline and details of each offer, start and end dates, the full disclaimer with its exclusions, and the URL of the eligible products. Public codes only, no account offers or JCPenney Rewards balances. Costs 1 credit.",
				routing: {
					request: { method: 'POST', url: '/api/v1/jcpenney/coupons', timeout: 120000, body: {} },
				},
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get jcpenney clearance and deals',
				description:
					'JCPenney deal listings across all products or one department: Clearance (default), Sale, Black Friday deals, Big Buy, Limited Time Special, Best Value, Gotta Have It, Closeout, Buy 1 Get 1, or any Deals & Promotions label, with the same filters and sorts as Search Products. ' +
					GRID +
					' Seasonal labels (Black Friday) list nothing once the event ends. To track clearance prices over time, poll and store your own: there is no price history. Costs 1 credit.',
				routing: request('/api/v1/jcpenney/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a jcpenney product',
				description:
					'One jcpenney.com product by ID or URL, or up to 20 by Product IDs in one call: title, brand, description, features, category and breadcrumbs, product and item type, images, average rating, review_count, question and answer counts (review text is not available), the price block (regular, sale and clearance min / max ranges, percent off, price type, deal label, the after-coupon price with its coupon code, and when the price window starts and ends), channel (Omnichannel / OnlineOnly), in-store pickup, marketplace flag, and every variant: SKU, UPC, color, size, all options, status, max per order and online_stock (high, low or out; single product only, a level, not a count). Prices are product-level ranges: JCPenney does not expose a price per size or color. A variants[].sku is what Get Store Availability takes. An unknown ID is an error; unknown IDs in a batch are listed in not_found. Costs 1 credit.',
				routing: request('/api/v1/jcpenney/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get jcpenney search suggestions',
				description:
					'The jcpenney.com search-box suggestions for a partial query: keyword completions with their search URL and, where JCPenney offers them, department refinements (nike shoes women -> sneakers, running shoes...). Costs 1 credit.',
				routing: request('/api/v1/jcpenney/suggestions'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get jcpenney store stock',
				description:
					"Real unit counts for one JCPenney SKU at the 5 nearest stores to a US or Puerto Rico ZIP code (or latitude and longitude): per store quantity, status (in_stock, low, out_of_stock, not_stocked), when the count was refreshed (updated_at), and the store's address, phone, distance and hours. Also returns how many of them have it (stores_with_stock) and total_quantity. In Stock Only drops the stores that have none. Take the SKU from Get Product (variants[].sku). Costs 1 credit.",
				routing: request('/api/v1/jcpenney/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search jcpenney products',
				description:
					'Search jcpenney.com (US) by keyword, filtered by brand, color, size, price range, deal label (SALE, CLEARANCE...) and any facet value (gender, store availability, rating, rise...), sorted by relevance, new arrivals, best sellers, rating or price. ' +
					GRID +
					" When the site autocorrects the keyword, corrected_query says so; when it sends a keyword to a deal or category listing (doorbusters), redirected_to says where and the items are that listing's. Use a result ID with Get Product. Costs 1 credit.",
				routing: request('/api/v1/jcpenney/search'),
			},
		],
		default: 'search',
	},
];

export const jcpenneyFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'jeans',
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
		options: (
			[
				...gridOptions(true, true),
				{
					displayName: 'Exact Keyword',
					name: 'exact',
					type: 'boolean',
					default: false,
					description:
						'Whether to search the keyword across every category. JCPenney narrows many keywords to a category on its own (jeans -> the Jeans category, visible in applied_filters).',
					routing: { request: { body: { exact: '={{ $value || undefined }}' } } },
				},
			] as INodeProperties[]
		).sort((x, y) => x.displayName.localeCompare(y.displayName)),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		default: '',
		// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
		placeholder: '/g/women/dresses?id=cat100210008',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value || undefined }}' } } },
		// eslint-disable-next-line n8n-nodes-base/node-param-description-miscased-id
		description:
			"A JCPenney category path with its id=cat... part, as jcpenney.com category links and a response's breadcrumbs carry it. Use this or Category URL.",
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
		placeholder: 'https://www.jcpenney.com/g/women/dresses?id=cat100210008',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A jcpenney.com category URL. Filters, a sort or a page in the URL are kept. Used when Category Path is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions(true, true),
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand Name',
		name: 'brandName',
		type: 'string',
		default: '',
		placeholder: 'Nike',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		description:
			"A brand name as JCPenney lists it in the Brand facet (Nike, St. John's Bay, Carter's). Use this or Brand Page URL.",
	},
	{
		displayName: 'Brand Page URL',
		name: 'url',
		type: 'string',
		default: '',
		// eslint-disable-next-line n8n-nodes-base/node-param-placeholder-miscased-id
		placeholder: 'https://www.jcpenney.com/g/brands/nike?id=cat11100023787',
		displayOptions: show(['brand']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			"A jcpenney.com brand page URL (JCPenney's curated brand page; its assortment can differ slightly from the brand name listing). Used when Brand Name is not given.",
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: gridOptions(false, true),
	},

	// -- Get Deals --
	{
		displayName: 'List',
		name: 'type',
		type: 'options',
		default: 'clearance',
		options: [
			{ name: 'Best Value', value: 'best_value' },
			{ name: 'Big Buy', value: 'big_buy' },
			{ name: 'Black Friday Deals', value: 'black_friday' },
			{ name: 'Buy 1 Get 1', value: 'bogo' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Closeout', value: 'closeout' },
			{ name: 'Gotta Have It', value: 'gotta_have_it' },
			{ name: 'Limited Time Special', value: 'limited_time_special' },
			{ name: 'Sale', value: 'sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description:
			'Which deal listing to read: Clearance (default), Sale, Black Friday deals, Big Buy, Limited Time Special, Best Value, Gotta Have It, Closeout or Buy 1 Get 1 (every BOGO offer)',
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: (
			[
				...gridOptions(true, false),
				{
					displayName: 'Department ID',
					name: 'department',
					type: 'string',
					default: '',
					placeholder: 'dept20000011',
					description:
						'Limit the deal to one department or category ID (dept... / cat..., from breadcrumbs or a category URL).',
					routing: { request: { body: { department: '={{ $value || undefined }}' } } },
				},
				{
					displayName: 'Deal Label',
					name: 'label',
					type: 'string',
					default: '',
					placeholder: 'BUY 1 GET 1 50% OFF',
					description:
						"Any Deals & Promotions label verbatim from a previous response's facets (s1_deals_and_promotions), instead of List",
					routing: { request: { body: { label: '={{ $value || undefined }}' } } },
				},
			] as INodeProperties[]
		).sort((x, y) => x.displayName.localeCompare(y.displayName)),
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: 'ppr5008604049',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"A JCPenney product ID (ppr / ppm / pp + digits): a search result's ID, the last part of a product URL. Use this, Product URL or Product IDs.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.jcpenney.com/p/st-johns-bay-womens-mid-rise-straight-leg-jean/ppr5008604049',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A jcpenney.com product URL (its product ID is used). Used when Product ID is not given.',
	},
	{
		displayName: 'Product IDs',
		name: 'product_ids',
		type: 'string',
		default: '',
		placeholder: 'ppr5008604049, ppr5008212471',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_ids:
						'={{ (a => a.length ? a : undefined)(String($value).split(",").map(s => s.trim()).filter(Boolean)) }}',
				},
			},
		},
		description:
			'Up to 20 product IDs, separated by commas, in one call (still 1 credit). Unknown IDs are listed in not_found. Batch results carry no online stock.',
	},

	// -- Get Store Availability --
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '84630160042',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description:
			"A JCPenney SKU ID: a product's variants[].sku from Get Product (or a search result's sku_id)",
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
		description: 'Check the 5 stores nearest to a ZIP code or a latitude/longitude pair',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90012',
		displayOptions: show(['storeAvailability'], { availabilityLocateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US or Puerto Rico ZIP code: the 5 nearest stores are checked',
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
				displayName: 'In Stock Only',
				name: 'in_stock_only',
				type: 'boolean',
				default: false,
				description: 'Whether to drop the stores (of the 5 nearest) that have none',
				routing: { request: { body: { in_stock_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, 1-100. Defaults to 25.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Search near a ZIP code, a city and state, or a latitude/longitude pair',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75024',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US or Puerto Rico ZIP code to search around',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'City to search around (with State)',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: '2-letter state code',
	},
	{
		displayName: 'Latitude',
		name: 'lat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
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
		displayOptions: show(['stores'], { locateBy: ['coordinates'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Results page, 1-based. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, 1-100. Defaults to 25.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
			{
				displayName: 'Stores per Page',
				name: 'page_size',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Stores per page, 1-20. Defaults to 10.',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
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
		placeholder: 'jea',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},
];
