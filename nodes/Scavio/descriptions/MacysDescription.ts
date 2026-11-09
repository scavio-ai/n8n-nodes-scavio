import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['macys'], operation, ...extra },
});

// Macy's (macys.com, US only, USD), 9 operations, 1 credit each. Get Product, Get Reviews
// and Get Store Availability take a product ID or URL; Get Category Products and Get Brand
// Products take an ID or URL. Every route carries a 120s timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const GRID =
	'60 organic items per page, each with ID, title, brand, URL, image, price (price_max when the item sells at a range), regular and sale price, percent off, price label (Sale, Now, Only...), on-sale flag, sale end date, deal label (Black Friday Deal, Clearance, LAST ACT, Today Only...), promotions, rating, review count, colors and is_sponsored. Also returns total, page, total_pages, the sort applied, the facets (name, label and values with counts; any value works in Other Filters) and applied_filters. Ad-only sponsored tiles are dropped (sponsored_dropped counts them) unless Include Sponsored is on; organic items that also hold a paid slot stay, flagged is_sponsored. Totals can differ between sorts, as on the site. Prices in USD.';

const SPECIAL_OFFER_OPTIONS = [
	{ name: 'Black Friday Deal', value: 'black_friday_deal' },
	{ name: 'Clearance', value: 'clearance' },
	{ name: 'Gift with Purchase', value: 'gift_with_purchase' },
	{ name: 'Last Act', value: 'last_act' },
	{ name: 'Limited-Time Special', value: 'limited_time_special' },
	{ name: 'Our Lowest Price', value: 'our_lowest_price' },
	{ name: 'Sales & Discounts', value: 'sales_and_discounts' },
	{ name: 'Special Offer', value: 'special_offer' },
	{ name: 'Today Only', value: 'today_only' },
];

// Grid options shared by Search Products, Get Category Products, Get Brand Products and
// Get Deals (Get Deals has no Special Offer).
const gridOptions = (withSpecialOffer: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Brands',
			name: 'brand',
			type: 'string',
			default: '',
			placeholder: "Levi's, Calvin Klein",
			description:
				'Only these brands, spelled as the BRAND facet lists them, separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'brand', value: splitList } },
		},
		{
			displayName: 'Colors',
			name: 'shades',
			type: 'string',
			default: '',
			placeholder: 'Black, Blue',
			description:
				'Only these colors, as the COLOR_NORMAL facet lists them, separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'color', value: splitList } },
		},
		{
			displayName: 'Include Sponsored',
			name: 'include_sponsored',
			type: 'boolean',
			default: false,
			description:
				'Whether to keep ad-only sponsored tiles (flagged is_sponsored). Off by default: they are dropped.',
			routing: { request: { body: { include_sponsored: '={{ $value }}' } } },
		},
		{
			displayName: 'Max Price',
			name: 'max_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Maximum price in USD',
			routing: { request: { body: { max_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'min_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: "Minimum price in USD. Any bound works, not only the site's price buckets.",
			routing: { request: { body: { min_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Other Filters (JSON)',
			name: 'filters',
			type: 'json',
			default: '{}',
			description:
				'Any other facet from a previous response\'s facets: its name to one value or a list, e.g. {"GENDER": "Women", "CUSTRATINGS": "4 stars & up"}',
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
			typeOptions: { minValue: 1, maxValue: 1000 },
			description: 'Results page, 1-based (60 organic items per page). Defaults to 1.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Pickup Store ID',
			name: 'pickup_store_id',
			type: 'string',
			default: '',
			placeholder: '4592',
			description: 'Only items available for pickup at this store (a store_id from Find Stores)',
			routing: { request: { body: { pickup_store_id: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'featured',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'Featured', value: 'featured' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description:
				'Featured (default), price, top rated, best sellers or newest. The total can differ between sorts, as on the site.',
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
	];
	if (withSpecialOffer) {
		options.push({
			displayName: 'Special Offers',
			name: 'special_offer',
			type: 'multiOptions',
			default: [],
			options: SPECIAL_OFFER_OPTIONS,
			description: 'Only items with one of these offers',
			routing: {
				request: { body: { special_offer: '={{ $value.length ? $value : undefined }}' } },
			},
		});
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

// Location fields shared by Find Stores and Get Store Availability.
const locationFields = (operation: string, modeName: string): INodeProperties[] => [
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show([operation], { [modeName]: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Atlanta',
		displayOptions: show([operation], { [modeName]: ['cityState'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'US city to search around',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'GA',
		displayOptions: show([operation], { [modeName]: ['cityState'] }),
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
		displayOptions: show([operation], { [modeName]: ['coordinates'] }),
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
		displayOptions: show([operation], { [modeName]: ['coordinates'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Additional Options',
		name: `${operation}LocationOptions`,
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show([operation], { [modeName]: ['zip', 'cityState', 'coordinates'] }),
		options: [
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Search radius in miles, 1-100. Defaults to 100.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},
];

export const macysOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['macys'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find macys stores',
				description:
					"Macy's stores near a US ZIP code, a point (latitude and longitude) or a city and state, nearest first (up to 15, within 100 miles by default): store_id (what Get Store Availability and Pickup Store ID take), name, address, phone, latitude and longitude, distance in miles, today's and tomorrow's hours, curbside hours and the order cut-off for same-day pickup. Costs 1 credit.",
				routing: request('/api/v1/macys/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get macys brand products',
				description:
					"Browse one brand's macys.com page by its page ID or URL (a product's brand_page_id), with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the brand's page ID, name and URL. To filter by brand name instead, use Search Products with Brands. Costs 1 credit.",
				routing: request('/api/v1/macys/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get macys category products',
				description:
					'Browse one macys.com category by ID or URL, with the same filters and sorts as Search Products. ' +
					GRID +
					" Also returns the category's ID, name and URL. An unknown ID is an error. Costs 1 credit.",
				routing: request('/api/v1/macys/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get macys deals',
				description:
					"Macy's sale listings: all Sales & Offers (default), Clearance, Today Only, Last Act (final-sale markdowns), Limited-Time Specials or Black Friday Deals, with the same filters and sorts as Search Products. " +
					GRID +
					" sale_ends carries the end date when Macy's states one. Costs 1 credit.",
				routing: request('/api/v1/macys/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a macys product',
				description:
					"One macys.com product by ID or URL, or up to 10 by Product IDs in one call: title, brand (with brand_page_id for Get Brand Products), type, description, bullets, category path, price, regular and sale price, percent off, on-sale flag, sale end, promotions, rating, review_count and text_review_count (ratings without text count in review_count only), rating_distribution, recommended count, fit slider, AI review summary, purchased message, question and answer counts, images, colors with their prices, sizes and every variant (UPC, color, size, available, availability message, low-stock flag, ship days). A collection member's ID answers with the collection product (requested_id echoes the ID asked for). In a batch, unknown IDs are listed in not_found and Macy's serves its summary view: no rating histogram, and a collection without its members' variants. An unknown ID is an error. Costs 1 credit.",
				routing: request('/api/v1/macys/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get macys product reviews',
				description:
					"Customer reviews of one macys.com product by ID or URL, newest (default), highest rated, lowest rated or with photos first, up to 100 per page, optionally only one star rating or only reviews mentioning a word: rating, title, text, date, nickname, location as the reviewer gave it, recommended, helpful yes / no votes, incentivized and syndicated flags, badges, fit and other slider ratings, photo URLs and the brand's response. Also total, total_pages and has_more. total counts written reviews only: ratings without text are not returned (Get Product has the full rating histogram). Costs 1 credit.",
				routing: request('/api/v1/macys/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get macys search suggestions',
				description:
					'The macys.com search-box autocomplete for a partial query: up to 7 suggested searches. Costs 1 credit.',
				routing: request('/api/v1/macys/suggestions'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get macys store pickup availability',
				description:
					"Can a macys.com product be picked up in store? Near a ZIP code, a point or a city and state: every store with available true / false and available_items_count (how many of the product's items it has). At one store ID: the store's hours, pickup cut-off and pickup options, and for every variant (UPC, color, size) pickup_available and in_store_available. Macy's publishes no unit quantities, so there are no stock counts. An unknown store ID is an error. Costs 1 credit.",
				routing: request('/api/v1/macys/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search macys products',
				description:
					'Search macys.com (US) by keyword, filtered by brand, color, special offer (clearance, Last Act, Today Only, Black Friday deal...), any price range, a pickup store and any other facet, sorted by featured, price, top rated, best sellers or newest. ' +
					GRID +
					' A keyword the site maps to a category comes back with redirected_to_category (its ID works with Get Category Products). Use a result ID with Get Product, Get Reviews or Get Store Availability. Costs 1 credit.',
				routing: request('/api/v1/macys/search'),
			},
		],
		default: 'search',
	},
];

export const macysFields: INodeProperties[] = [
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
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: '3763',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description:
			"Macy's category ID: the ID= number of a macys.com /shop/ URL, a category ID from a product's categories, or the ID in a search's redirected_to_category (3763 is Men's Coats & Jackets). Use this or Category URL.",
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.macys.com/shop/mens/clothing/coats?ID=3763',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A macys.com category URL with its ID=. Filters, page and sort already in the URL are kept. Used when Category ID is not given.',
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
		displayName: 'Brand Page ID',
		name: 'brand_id',
		type: 'string',
		default: '',
		placeholder: '337747',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand_id: '={{ $value || undefined }}' } } },
		description:
			"The brand page ID: a product's brand_page_id, or the ID= number of a macys.com /shop/brands/ URL (337747 is Calvin Klein). Use this or Brand Page URL.",
	},
	{
		displayName: 'Brand Page URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.macys.com/shop/brands/calvin-klein?ID=337747',
		displayOptions: show(['brand']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A macys.com brand page URL with its ID=. Used when Brand Page ID is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: gridOptions(true),
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'type',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'Black Friday Deals', value: 'black_friday' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Last Act (Final-Sale Markdowns)', value: 'last_act' },
			{ name: 'Limited-Time Specials', value: 'limited_time_special' },
			{ name: 'Sales & Offers (All)', value: 'sale' },
			{ name: 'Today Only', value: 'today_only' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Which sale listing to read',
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions(false),
	},

	// -- Get Product / Get Reviews / Get Store Availability --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '25822310',
		displayOptions: show(['product', 'reviews', 'storeAvailability']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"Macy's product ID: a search result's ID, or the ID= number in a macys.com product URL. Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.macys.com/shop/product/calvin-klein-mens-straight-fit-stretch-denim-jeans?ID=25822310',
		displayOptions: show(['product', 'reviews', 'storeAvailability']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A macys.com product URL (its ID= is used). Used when Product ID is not given.',
	},
	{
		displayName: 'Product IDs (Batch)',
		name: 'product_ids',
		type: 'string',
		default: '',
		placeholder: '25822310, 719388, 19206874',
		displayOptions: show(['product']),
		routing: {
			send: {
				type: 'body',
				property: 'product_ids',
				value:
					'={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}',
			},
		},
		description:
			"Up to 10 product IDs separated by commas, instead of Product ID / URL. A batch gets Macy's summary view: no rating histogram, and a collection without its members' variants.",
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
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Reviews per page, 1 to 100. The API default is 20.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Search Text',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'soft',
				description: 'Only reviews mentioning this text',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'With Photos', value: 'with_photos' },
				],
				description: 'Newest (default), highest rated, lowest rated or with photos first',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'rating',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this star rating',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Store Availability --
	{
		displayName: 'Check By',
		name: 'checkBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State (Nearby Stores)', value: 'cityState' },
			{ name: 'Coordinates (Nearby Stores)', value: 'coordinates' },
			{ name: 'One Store ID (Per Variant)', value: 'storeId' },
			{ name: 'ZIP Code (Nearby Stores)', value: 'zip' },
		],
		displayOptions: show(['storeAvailability']),
		description:
			'Which nearby stores can hand the product over, or per-variant pickup and in-store flags at one store',
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4592',
		displayOptions: show(['storeAvailability'], { checkBy: ['storeId'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A store_id from Find Stores',
	},
	...locationFields('storeAvailability', 'checkBy'),

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'cityState' },
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP code, a city and state, or a latitude/longitude pair',
	},
	...locationFields('stores', 'locateBy'),

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
