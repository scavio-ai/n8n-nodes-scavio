import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['kohls'], operation, ...extra },
});

// Kohl's (kohls.com, US only, USD), 9 operations: Find Stores costs 1 credit, every other
// operation 2. Get Product takes a product ID or URL; Get Category Products takes a catalog
// path or URL that carries its CN filter; Get Brand Products takes a brand name or URL; Get
// Store Availability takes a SKU and a ZIP code. Every route carries a 120s timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

// Facet value IDs, one per line (a facet label can itself contain a comma).
const splitLines = '={{ String($value).split("\\n").map(s => s.trim()).filter(Boolean) }}';

const GRID =
	'120 products per page, each with ID, title, URL, image, price (price_max for a range), regular_price, sale_price, price_label (sale, clearance, clearance+regular), on_sale, is_clearance, percent_off, price_suppressed with price_note (Kohl\'s shows some prices only in the cart), with_code_price (the price after a public offer code) with with_code_offer_codes, promotions (BOGO...), rating, review_count, badges (best_seller, top_rated...), colors, is_sephora, coupon_eligible, available_online / available_pickup / available_ship_to_store, and is_sponsored. Sponsored placements (up to about 8) stay in the list, flagged is_sponsored and counted in sponsored_count. Also returns total, page, total_pages, the sort applied, applied_filters and every facet (ID, label and values with their value ID, count and a selected flag; any value ID works in Facet Filters; price is a bucket such as "Price:$25 to $50", there is no free min / max). Average rating and review count only: review text is not available. Prices in USD.';

// Grid options shared by Search Products, Get Category Products, Get Brand Products and
// Get Deals (Get Brand Products has no Brand filter: the page is one brand).
const gridOptions = (withBrand: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Clearance Only',
			name: 'clearance',
			type: 'boolean',
			default: false,
			description: 'Whether to return only clearance items',
			routing: { request: { body: { clearance: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Color',
			name: 'shade',
			type: 'string',
			default: '',
			placeholder: 'Black',
			description: 'Only this color, as the Color facet lists it (Black, Blue, Beig/khaki...)',
			routing: { request: { body: { color: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Facet Filters',
			name: 'filters',
			type: 'string',
			typeOptions: { rows: 3 },
			default: '',
			placeholder: 'Gender:Womens\nPrice:$25 to $50',
			description:
				"Facet value IDs from a previous response's facets[].values[].value, one per line, e.g. Gender:Womens, Price:%2425%20to%20%2450 (price buckets), TopRated:4, InStoreOnline:Pick%20Up%20in%20Store. Several combine (AND). Unencoded values work too (Price:$25 to $50).",
			routing: { send: { type: 'body', property: 'filters', value: splitLines } },
		},
		{
			displayName: 'On Sale Only',
			name: 'on_sale',
			type: 'boolean',
			default: false,
			description: 'Whether to return only items on sale',
			routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Results page, 1-based (120 products per page). Defaults to 1.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Size',
			name: 'size',
			type: 'string',
			default: '',
			placeholder: 'M',
			description: 'Only this size, as the Size facet lists it (M, 32X30, 10...)',
			routing: { request: { body: { size: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'featured',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'Featured', value: 'featured' },
				{ name: 'Highest Rated', value: 'highest_rated' },
				{ name: 'New Arrivals', value: 'new_arrivals' },
				{ name: 'Percent Off', value: 'percent_off' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
			],
			description:
				'Featured (default), new arrivals, best sellers, price, highest rated or percent off',
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
	];
	if (withBrand) {
		options.push({
			displayName: 'Brand',
			name: 'brand',
			type: 'string',
			default: '',
			placeholder: "Levi's",
			description:
				'Only this brand, as the Brand facet lists it ("Levi\'s", "Hamilton Beach", "BLACK+DECKER")',
			routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		});
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

export const kohlsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['kohls'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find kohls stores',
				description:
					"Kohl's stores near a US ZIP code, a city and state or a point (latitude and longitude), within 25 miles by default (up to 100): store_id (what Get Product's Store ID takes), name, address, city, state, ZIP, phone, latitude and longitude, distance in miles, weekly opening hours with the UTC offset, store badges (Sephora, Fine Jewelry, Lands' End...), services (In-Store Pickup, Amazon Returns...) and the store page URL. Costs 1 credit.",
				routing: request('/api/v1/kohls/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get kohls brand products',
				description:
					"Browse one brand at Kohl's by name or URL (Nike, Hamilton Beach, Levi's...), with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the brand's name, facet value and URL. An unknown brand is an error. Costs 2 credits.",
				routing: request('/api/v1/kohls/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get kohls category products',
				description:
					"Browse one Kohl's catalog listing by its path or URL (Small Appliances, Women's Clothing, Men's Shoes...), with the same filters and sorts as Search Products. The path must carry its CN=... filter, the way kohls.com category links and a product's breadcrumbs[].url do. " +
					GRID +
					" Also returns the category's name, breadcrumbs, path and URL. Costs 2 credits.",
				routing: request('/api/v1/kohls/category'),
			},
			{
				name: 'Get Coupon Codes',
				value: 'coupons',
				action: 'Get kohls coupon codes',
				description:
					"Today's public Kohl's coupon codes: code, description (the offer, minimum purchase and exclusions as stated), end date, whether it needs a Kohl's Card (requires_kohls_card), the terms page URL and the URL of the eligible products. Public codes only, no account offers or Kohl's Rewards balances. Costs 2 credits.",
				routing: {
					request: { method: 'POST', url: '/api/v1/kohls/coupons', timeout: 120000, body: {} },
				},
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get kohls clearance and deals',
				description:
					"Kohl's deal listings: Clearance (default), Sale, items that earn Kohl's Cash right now, or Sephora at Kohl's, with the same filters and sorts as Search Products. " +
					GRID +
					' To track clearance prices over time, poll and store your own: there is no price history. Costs 2 credits.',
				routing: request('/api/v1/kohls/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a kohls product',
				description:
					"One kohls.com product by ID or URL: title, brand, status, dept (what Get Store Availability can take), breadcrumbs, Sephora at Kohl's flag, average rating, review_count and recommended_percent (review text is not available), is_new / best_seller / top_rated, badges, description, details, ingredients (beauty), images, videos, return policy, the price block (regular, sale, sale_status, percent_off, lowest_applicable_price, price_suppressed with price_note for cart-only prices, with_code_price with its savings and offer codes), kohls_cash (earn and redeem windows, amount earned) when the product has it, the public offers that apply (code, description, terms, start and end dates), pickup / ship-to-store eligibility, online_units, and every variant: SKU, UPC, color, size, availability, online_units, max_per_order, price, sale price, with-code price, Kohl's Cash earned and pickup eligibility. Add a Store ID (from Find Stores) for that store's availability and in-store price on each variant. A variants[].sku is what Get Store Availability takes. An unknown ID is an error. Costs 2 credits.",
				routing: request('/api/v1/kohls/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get kohls search suggestions',
				description:
					'The kohls.com search-box suggestions for a partial query: keyword completions (Terms, default), or matching products with ID, title, URL and image (Products). Costs 2 credits.',
				routing: request('/api/v1/kohls/suggestions'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get kohls store pickup stock',
				description:
					"Pickup stock for one Kohl's SKU at every store within about 50 miles of a US ZIP code, with unit counts: per store pickup_units, stock_level (In Stock, Low Stock, Out of Stock), in_stock, ship_to_store_units with the ship-to-store pickup window, pickup and ship-to-store eligibility, clearance and Sephora flags, and the store's address, phone, distance and hours for the week. Also returns how many stores have it (in_stock_count) and total_pickup_units. Take the SKU (variants[].sku) and dept from Get Product. Costs 2 credits.",
				routing: request('/api/v1/kohls/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search kohls products',
				description:
					'Search kohls.com (US) by keyword, filtered by brand, color, size, on sale, clearance and any facet value (price buckets, gender, rating, store pickup...), sorted by featured, new arrivals, best sellers, price, highest rated or percent off. ' +
					GRID +
					' When the site autocorrects the keyword, corrected_query says so. Use a result ID with Get Product. Costs 2 credits.',
				routing: request('/api/v1/kohls/search'),
			},
		],
		default: 'search',
	},
];

export const kohlsFields: INodeProperties[] = [
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
		options: gridOptions(true),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		default: '',
		placeholder:
			'/catalog/small-appliances-kitchen-dining.jsp?CN=Category:Small%20Appliances+Department:Kitchen%20%26%20Dining',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value || undefined }}' } } },
		description:
			"A Kohl's catalog path with its CN=... part, as kohls.com category links and a product's breadcrumbs[].URL carry it. Use this or Category URL.",
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.kohls.com/catalog/womens-clothing.jsp?CN=Gender:Womens+Department:Clothing',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A kohls.com catalog URL. Its CN facets define the listing; a sort or page in the URL is kept. Used when Category Path is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions(true),
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand Name',
		name: 'brandName',
		type: 'string',
		default: '',
		placeholder: 'Hamilton Beach',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		description:
			"A brand name as Kohl's lists it in the Brand facet (Nike, Hamilton Beach, Levi's). Use this or Brand Page URL.",
	},
	{
		displayName: 'Brand Page URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.kohls.com/catalog/hamilton-beach.jsp?CN=Brand:Hamilton%20Beach',
		displayOptions: show(['brand']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A kohls.com brand page URL (its CN carries Brand:...). Used when Brand Name is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: gridOptions(false),
	},

	// -- Get Deals --
	{
		displayName: 'List',
		name: 'type',
		type: 'options',
		default: 'clearance',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: "Earn Kohl's Cash", value: 'kohls_cash' },
			{ name: 'Sale', value: 'sale' },
			{ name: "Sephora at Kohl's", value: 'sephora' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description:
			"Which deal listing to read: Clearance (default), Sale, items that earn Kohl's Cash now, or Sephora at Kohl's",
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions(true),
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '6251213',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"Kohl's product ID: a search result's ID, the number after prd- in a product URL. Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.kohls.com/product/prd-6251213/hamilton-beach-17-liter-black-electric-kettle.jsp',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A kohls.com product URL (its prd- number is used). Used when Product ID is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'productOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '725',
				description:
					"A Kohl's store number (store_id from Find Stores): adds that store's availability and in-store price to every variant",
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Store Availability --
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '73519108',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: "A Kohl's SKU code: a product's variants[].sku from Get Product",
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code: stores within about 50 miles are listed',
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
				displayName: 'Department Code',
				name: 'dept',
				type: 'string',
				default: '',
				placeholder: '063',
				description: "The product's department code (dept from Get Product)",
				routing: { request: { body: { dept: '={{ $value || undefined }}' } } },
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
		placeholder: '60601',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
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
		description: '2-letter US state code',
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

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coff',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Suggestion Type',
		name: 'type',
		type: 'options',
		default: 'terms',
		options: [
			{ name: 'Products', value: 'products' },
			{ name: 'Terms', value: 'terms' },
		],
		displayOptions: show(['suggestions']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Terms: keyword completions. Products: matching products (ID, title, URL, image).',
	},
];
