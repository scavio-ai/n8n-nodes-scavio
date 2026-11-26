import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['gap'], operation, ...extra },
});

// Gap Inc. (gap.com: Gap, Old Navy, Banana Republic, Athleta, Gap Factory, Banana Republic
// Factory; US in USD, Canada in CAD, English or French), 11 operations, 1 credit each. Brand,
// Market and Language are sent only when they differ from the defaults (Gap, United States,
// English), so a product or category link sets its own banner and market. Get Prices always
// sends its Default Brand: every item needs one. Every route carries a 120s timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

// Comma-separated values sent as a list.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const PRICES =
	'regular_price is the list price, effective_price the price shown (price_type regular, promotion or markdown; percent_off). A checkout code discount is never applied to a price: it shows as text in flags.';
const ITEM =
	'style_id, pid (color ID, what Get Product and Get Prices take), name, URL, regular_price, effective_price, price_type, percent_off';
const CREDITS = 'Failed calls are not charged; a not-found is charged. Costs 1 credit.';

const BRAND_OPTIONS = [
	{ name: 'Athleta', value: 'athleta' },
	{ name: 'Banana Republic', value: 'banana_republic' },
	{ name: 'Banana Republic Factory', value: 'banana_republic_factory' },
	{ name: 'Gap', value: 'gap' },
	{ name: 'Gap Factory', value: 'gap_factory' },
	{ name: 'Old Navy', value: 'old_navy' },
];

const ALL_OPS = [
	'categories',
	'category',
	'deals',
	'prices',
	'product',
	'search',
	'store',
	'stores',
	'storeStock',
	'suggestions',
	'trending',
];
const BRAND_OPS = ALL_OPS.filter((o) => o !== 'prices');
const LANGUAGE_OPS = ['categories', 'category', 'deals', 'prices', 'product', 'search', 'suggestions', 'trending'];

const listOptions = (withSearchFilters: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Other Filters (JSON)',
			name: 'facets',
			type: 'json',
			default: '{}',
			description:
				'Other filters as facet name to value, from an answer\'s facets (name and options[].value), e.g. {"fit": "Baggy"}',
			routing: {
				request: {
					body: { facets: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
				},
			},
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 1000 },
			description: 'Page, from 1. A page past the last is a charged not-found.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'page_size',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 200 },
			description: 'Per page, 1 to 200 (default 50). Large pages are slow (200 items can take 25 s).',
			routing: { request: { body: { page_size: '={{ $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'featured',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'Featured', value: 'featured' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description: "Featured (default, the site's order), price, top rated or best sellers",
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
	];
	if (withSearchFilters) {
		options.push(
			{
				displayName: 'Color Family',
				name: 'shadeFamily',
				type: 'string',
				default: '',
				placeholder: 'Black',
				description: 'A color family as the facets list it',
				routing: { request: { body: { color: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Department',
				name: 'department',
				type: 'string',
				default: '',
				placeholder: 'Women',
				description: 'A department as the facets list it (Women, Men, Girls, Boys)',
				routing: { request: { body: { department: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
				description: "Highest price, in the market's currency",
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
				description: "Lowest price, in the market's currency",
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Minimum Rating',
				name: 'rating',
				type: 'number',
				default: 4,
				typeOptions: { minValue: 1, maxValue: 4 },
				description: 'Minimum star rating, 1 to 4 ("4 & up")',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Pickup Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '4132',
				description: 'Only products available for pickup at this store (from Get Stores)',
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sale Type',
				name: 'sale_type',
				type: 'options',
				default: 'sale',
				options: [
					{ name: 'Clearance (Markdown)', value: 'clearance' },
					{ name: 'Regular', value: 'regular' },
					{ name: 'Sale (Promotion)', value: 'sale' },
				],
				description: 'Styles with at least one color of that price type',
				routing: { request: { body: { sale_type: '={{ $value }}' } } },
			},
		);
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

export const gapOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['gap'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get gap categories',
				description: `One banner's navigation tree as its site menu lists it: division_count, category_count, categories (name, type: division, section or category; cid, style, URL, children). cid and style are what Get Category Products takes. ${CREDITS}`,
				routing: request('/api/v1/gap/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get gap category products',
				description: `The items of one category by cid (and style) from Get Categories, or a category link, sorted and filtered by facets, with each color's online unit count as given: total_colors, pages, has_more, count, items (${ITEM}, rating, review_count, product_type, flags, colors with pid, name, prices, online_units, online_status, backorder_units, badges and image), groups and facets. Page Size counts colors. ${PRICES} An unknown cid is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/gap/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get gap deals',
				description: `A banner's current promotions as its promo drawer words them (promo_id, text, message, applied e.g. "Applied at checkout", links) and its menu's sale, deal and clearance links (name, path, cid, style, URL: cid and style work in Get Category Products). Scavio never computes a price after a checkout code, and the site gives no end dates. ${CREDITS}`,
				routing: request('/api/v1/gap/deals'),
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get gap prices',
				description: `Current prices for up to 100 colors in one call, banners may mix: requested, found, items (brand, pid, found, style_id, name, color, category, URL, currency, regular_price, effective_price, max_regular_price, max_effective_price, percent_off, price_types, online_status, rating, review_count, flags, badges, image). For price monitoring, poll and store the answers: there is no price history. ${PRICES} ${CREDITS}`,
				routing: request('/api/v1/gap/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a gap product',
				description: `One product by color ID or product link: style_id, brand, name, URL, currency, category, product_type, rating, review_count, review_summary (the site's own summary of its reviews with likes and dislikes; no review texts or reviewer names), highlights, details, flags, max_order_quantity, fully_out_of_stock, pickup_available and variants (Regular, Tall, Petite: sizes, colors with pid, prices, stock_status and skus: sku_id, size, regular_price, effective_price, price_type, discount_percentage, discount_saving, on_clearance, stock_status (in_stock, low_stock, out_of_stock, on_order), backorder and ship dates, UPC). A sku_id is what Get Store Stock takes. ${PRICES} A dead or other-market ID is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/gap/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get gap search suggestions',
				description: "A banner's search box suggestions for what has been typed: suggestions (query, display_query, department filters) and products (pid, name, URL, regular_price, effective_price, price_type, sale_price_range, colors, image). Failed calls are not charged; a not-found is charged. Costs 1 credit.",
				routing: request('/api/v1/gap/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a gap store',
				description: `One store's public details by store ID: name, status, opened, address, phone, latitude, longitude, time_zone, languages, pickup and services (in_store_pickup, ship_from_store, order_in_store). Hours are on Get Stores. An unknown ID is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/gap/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get gap store stock',
				description: `Pickup stock at up to 10 stores for up to 20 SKUs (or every SKU of one style), as the site's buckets: skus (sku_id; pid, variant and status for a style; stores with store_id and status: in_stock, low_stock or out_of_stock). No unit counts and no per-store price exist (an in-store price may differ from the online price). ${CREDITS}`,
				routing: request('/api/v1/gap/store-stock'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get gap stores',
				description: `Stores of one banner near a US ZIP / Canadian postal code or a point, nearest first: store_id, name, address, phone, latitude, longitude, distance_mi, time_zone, hours, holiday_hours (dated) and pickup. An invalid ZIP or postal code is refused. ${CREDITS}`,
				routing: request('/api/v1/gap/stores'),
			},
			{
				name: 'Get Trending Searches',
				value: 'trending',
				action: 'Get gap trending searches',
				description: "The trending searches a banner's search box shows, in its order. Failed calls are not charged; a not-found is charged. Costs 1 credit.",
				routing: request('/api/v1/gap/trending'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search gap products',
				description: `Keyword search on one banner (Gap, Old Navy, Banana Republic, Athleta, Gap Factory, Banana Republic Factory), filtered by department, sale type, color, price, rating, pickup store and any facet, sorted featured, by price, top rated or best sellers, up to 200 per page: total, pages, has_more, count, items (${ITEM}, price ranges, rating, review_count, product_type, free_shipping, color_count, image, badges, flags, colors) and facets. ${PRICES} A query the site cannot match answers its closest products. ${CREDITS}`,
				routing: request('/api/v1/gap/search'),
			},
		],
		default: 'search',
	},
];

export const gapFields: INodeProperties[] = [
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'options',
		default: 'gap',
		options: BRAND_OPTIONS,
		displayOptions: show(BRAND_OPS),
		routing: { request: { body: { brand: '={{ $value === "gap" ? undefined : $value }}' } } },
		description:
			"Which Gap Inc. banner to read. Leave it on Gap with a product or category link: the link's site sets the banner.",
	},
	{
		displayName: 'Market',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (CAD)', value: 'ca' },
			{ name: 'United States (USD)', value: 'us' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'The US sites (USD) or the Canadian sites (CAD). IDs are per banner and market.',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French (Canada Only)', value: 'fr' },
		],
		displayOptions: show(LANGUAGE_OPS),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'English, or French on the Canadian site',
	},

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
		description: 'Keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listOptions(true),
	},

	// -- Get Category Products --
	{
		displayName: 'Category CID',
		name: 'cid',
		type: 'string',
		default: '',
		placeholder: '3033077',
		displayOptions: show(['category']),
		routing: { request: { body: { cid: '={{ $value || undefined }}' } } },
		description: 'A category cid from Get Categories (the cid of the category link). Use this or Category URL.',
	},
	{
		displayName: 'Category Style',
		name: 'style',
		type: 'string',
		default: '',
		displayOptions: show(['category']),
		routing: { request: { body: { style: '={{ $value || undefined }}' } } },
		description: "The link's style= (categories[].style), when it has one",
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://oldnavy.gap.com/browse/todays-deals/for-fam-1?cid=3033077',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A Gap Inc. category link (sets the banner and market). Used when Category CID is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listOptions(false),
	},

	// -- Get Product --
	{
		displayName: 'Color ID (PID)',
		name: 'pid',
		type: 'string',
		default: '',
		placeholder: '403540002',
		displayOptions: show(['product']),
		routing: { request: { body: { pid: '={{ $value || undefined }}' } } },
		description: 'A color ID from search (items[].pid or colors[].pid; the pid= of a product link). Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.gap.com/browse/product.do?pid=403540002',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A Gap Inc. product link (sets the banner and market). Used when Color ID is not given.',
	},

	// -- Get Prices --
	{
		displayName: 'Items',
		name: 'items',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'old_navy:903453022, athleta:1177198082',
		displayOptions: show(['prices']),
		routing: { send: { type: 'body', property: 'items', value: splitList } },
		description:
			'Up to 100 colors, separated by commas, as brand:pid or a bare pid (then Default Brand applies). Banners may mix.',
	},
	{
		displayName: 'Default Brand',
		name: 'pricesBrand',
		type: 'options',
		default: 'gap',
		options: BRAND_OPTIONS,
		displayOptions: show(['prices']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'The banner of items given as a bare pid',
	},

	// -- Get Stores --
	{
		displayName: 'Locate By',
		name: 'storesLocateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP or Postal Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Search around a ZIP / postal code or a point',
	},
	{
		displayName: 'ZIP or Postal Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores'], { storesLocateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP (Market United States) or a Canadian postal code (A1A 1A1, Market Canada)',
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { storesLocateBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point to search around',
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { storesLocateBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point to search around',
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
				displayName: 'Store Count',
				name: 'storeCount',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Stores to return, 1 to 20 (default 10)',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: "Search radius in miles (the site's default when not set)",
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Store --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4132',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A store ID, as Get Stores lists it',
	},

	// -- Get Store Stock --
	{
		displayName: 'Store IDs',
		name: 'store_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '220, 1519, 1456',
		displayOptions: show(['storeStock']),
		routing: { send: { type: 'body', property: 'store_ids', value: splitList } },
		description: '1 to 10 store IDs from Get Stores (same banner and market), separated by commas',
	},
	{
		displayName: 'Look Up',
		name: 'stockLookUp',
		type: 'options',
		default: 'skus',
		options: [
			{ name: 'SKU IDs', value: 'skus' },
			{ name: 'Every SKU of a Style', value: 'style' },
		],
		displayOptions: show(['storeStock']),
		description: 'Chosen SKUs, or every SKU of one style',
	},
	{
		displayName: 'SKU IDs',
		name: 'sku_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4035400023503, 4035400023202',
		displayOptions: show(['storeStock'], { stockLookUp: ['skus'] }),
		routing: { send: { type: 'body', property: 'sku_ids', value: splitList } },
		description: '1 to 20 SKU IDs from Get Product (colors[].skus[].sku_id), separated by commas',
	},
	{
		displayName: 'Style ID',
		name: 'style_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '403540',
		displayOptions: show(['storeStock'], { stockLookUp: ['style'] }),
		routing: { request: { body: { style_id: '={{ $value }}' } } },
		description: 'A style ID from Get Product (style_id) or search (items[].style_id)',
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
		description: 'What has been typed so far',
	},
];
