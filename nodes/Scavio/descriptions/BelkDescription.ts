import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['belk'], operation, ...extra },
});

// Belk (belk.com, the US Southern department store), 10 operations, billed on actual cost; credits_used is the truth.
// US only, USD. The backend answers inside a 90 s client timeout (retries included), so every operation carries 120s.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 120000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = 'Belk (belk.com, the US Southern department store), US only, prices in USD';
const TAIL =
	'credits_used says what was charged. Failed upstream calls and refused inputs are not charged; a not-found is charged what it spent.';
const TWO = `Costs 2 credits (${TAIL})`;
const PRICES =
	"Prices are as belk.com shows them to visitors who are not signed in: original_price and sale_price (min, max), on_sale, belk_rewards_tier_prices (Belk's Belk Rewards+ insider, premier and elite prices as shown there, when Belk lists them), coupons (code, discount_percent, promo_price: Belk's own price with the code as given, ends as Belk writes it, requirement) and promotions.";
const GRID =
	'60 items a page: title, page, page_size, total (null past Belk\'s count), total_is_lower_bound (Belk shows "10,000+"), total_pages, count, sort, applied_filters, items (position, ID for Get Product and Get Reviews, title, brand, URL, image, rating, review_count, prices, coupons, promotions, badge, is_doorbuster, is_belk_market, colors), facets (name, ID, values with counts; any value works in Filters) and categories.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as an array, or undefined when empty. */
const list = (v = '$value') =>
	`={{ (() => { const a = String(${v} ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length ? (a.length === 1 ? a[0] : a) : undefined; })() }}`;

const listOption = (displayName: string, name: string, key: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: list() } } },
});

const promotionOption = (name: string): INodeProperties => ({
	displayName: 'Sales Promotion',
	name,
	type: 'multiOptions',
	default: [],
	options: [
		{ name: 'Belk Market (Marketplace)', value: 'belk_market' },
		{ name: 'Clearance', value: 'clearance' },
		{ name: 'Doorbusters', value: 'doorbusters' },
		{ name: 'Sale Items', value: 'sale' },
		{ name: 'Super Buys', value: 'super_buys' },
		{ name: "Today's Offers", value: 'todays_offers' },
	],
	description: "Items in Belk's Sales & Promotions; several match any of them",
	routing: { request: { body: { sales_promotion: '={{ $value && $value.length ? $value : undefined }}' } } },
});

/** The sorts, filters and paging shared by Search, Get Category Products and Get Deals. */
const gridOptions = (prefix: string, withPromotion: boolean): INodeProperties[] =>
	sorted([
		listOption('Brand', `${prefix}Brand`, 'brand', 'Calvin Klein, Michael Kors', 'Brands as the Brand facet spells them, comma-separated; several match any of them'),
		listOption('Color', `${prefix}Color`, 'color', 'Red', 'Colour groups (the Color facet: Black, Blue, Red ...), comma-separated'),
		listOption('Coupon Code', `${prefix}Coupon`, 'coupon_code', 'BFISHERE', 'Items a Belk coupon applies to (the Coupon Eligible facet), comma-separated'),
		listOption('Size', `${prefix}Size`, 'size', "Women's Regular/10", 'Sizes as group/size from the size facets (hierarchical_sizes values), comma-separated'),
		{
			displayName: 'Filters (JSON)',
			name: `${prefix}Filters`,
			type: 'json',
			default: '{}',
			description:
				'Any other facet from a previous answer\'s facets: its ID to one value or a list, up to 8, e.g. {"Gender": "Women", "Occasion": "Casual"}',
			routing: {
				request: {
					body: {
						filters:
							'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
					},
				},
			},
		},
		{
			displayName: 'Free Pickup Store ID',
			name: `${prefix}PickupStore`,
			type: 'string',
			default: '',
			placeholder: '452',
			description: 'Items available for free store pickup at this Belk store (store_id from Get Stores)',
			routing: { request: { body: { pickup_store_id: '={{ String($value).trim() || undefined }}' } } },
		},
		{
			displayName: 'Max Price',
			name: `${prefix}MaxPrice`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, numberPrecision: 2 },
			description: 'Maximum price in USD (0 = no maximum)',
			routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Discount',
			name: `${prefix}MinDiscount`,
			type: 'options',
			default: 0,
			options: [
				{ name: 'Any', value: 0 },
				{ name: '20% Off or More', value: 20 },
				{ name: '30% Off or More', value: 30 },
				{ name: '40% Off or More', value: 40 },
				{ name: '50% Off or More', value: 50 },
				{ name: '60% Off or More', value: 60 },
				{ name: '70% Off or More', value: 70 },
				{ name: '80% Off or More', value: 80 },
			],
			description: "Items at least this percent off (Belk's discount bands)",
			routing: { request: { body: { min_discount: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Price',
			name: `${prefix}MinPrice`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, numberPrecision: 2 },
			description: 'Minimum price in USD (0 = no minimum)',
			routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 200 },
			description: 'Page, 1 to 200 (60 items a page)',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Discount (Highest % Off)', value: 'discount' },
				{ name: 'Doorbusters First', value: 'doorbusters_first' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Relevance', value: 'relevance' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description: "Belk's 7 sorts",
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
		...(withPromotion ? [promotionOption(`${prefix}Promotion`)] : []),
	]);

/** A Belk product id or a belk.com product link. */
const productField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '18000269151219',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'A Belk product ID (the item ID from a listing, or the part before .html in a product link) or a belk.com product link',
});

export const belkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['belk'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get belk categories',
				description: `The ${SITE} department menu: count, node_count and categories (name, path for Get Category Products, URL, cgid, children). Captured 2026-11-27: 15 departments and 728 nodes. ${TWO}`,
				routing: request('/api/v1/belk/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get belk category products',
				description: `One ${SITE} category's products by path or link, with the same sorts and filters as Search: category (path, cgid, name) and ${GRID} ${PRICES} Captured 2026-11-27: Women's Sweaters held 2334 items over 39 pages. An unknown category is a charged not-found. ${TWO}`,
				routing: request('/api/v1/belk/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get belk deals',
				description: `${SITE} deal listings: Doorbusters, Super Buys, Clearance, Sale Items or Today's Offers, across Belk or inside one category, with the same sorts and filters as Search: type, belk_filter, category and ${GRID} ${PRICES} A variant's sale end date is on Get Variant (sale_ends), a coupon's in coupons[].ends. Belk's weekly ad and coupon pages are not available. Captured 2026-11-27: Doorbusters across Belk showed 10,000+ items. ${TWO}`,
				routing: request('/api/v1/belk/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a belk product',
				description: `One ${SITE} product by link or product ID: ID, name, brand, URL, style_number, availability, prices, price_label (e.g. Doorbuster), coupons, promotions, rating, review_count, breadcrumbs, details (details, specifications, material and care), images, size_chart_url, is_belk_market, dropship, colors, sizes and variants (variant_id, color, size, online_units: Belk's online stock, out_of_stock). Per-variant UPC, orin and sale end date: Get Variant. ${PRICES} Captured 2026-11-27: the Vince Camuto Women's Dolman Sleeve Crew Neck Sweater at 29.99 USD (original 69, Doorbuster), 29 colours, 7 sizes, 147 variants. An unknown ID is a charged not-found. Costs 2 credits for Belk's canonical product link, 4 when Belk redirects to it, as an older link and a product ID alone do (${TAIL})`,
				routing: request('/api/v1/belk/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get belk reviews',
				description: `The 8 newest reviews of one ${SITE} product as Belk shows them (no further pages, sort or star filter): product_id, total (the count in Belk's review block), count and reviews (review_id, rating, title, text, date, incentivized). No reviewer names. A product without reviews answers an empty list. Captured 2026-11-27: a product with 2267 reviews gave its 8 newest. ${TWO}`,
				routing: request('/api/v1/belk/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a belk store',
				description: `One Belk store by ID: store_id, name, address, phone, latitude, longitude, this_week_hours (day, hours, differs_from_regular), pickup_location (where in the store orders are picked up) and events. Captured 2026-11-27: store 452, Charlotte NC - Southpark, pickup at the Mens Shoe Department. An unknown store is a charged not-found. ${TWO}`,
				routing: request('/api/v1/belk/store'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get belk store availability',
				description: `Exact store stock for 1 to 5 ${SITE} variants at 1 to 10 Belk stores, as Belk's store pickup check reports it: store_ids, count and variants (variant_id, orin, orin_source, in_stock_store_count, stores with store_id, units and status: in_stock, limited = Belk's "Only N left!" at 1 to 5, out_of_stock), plus UPC and the national price fields when the variant was looked up. Belk prices are the same in every store. Captured 2026-11-27: one variant at 3 stores showed 2, 3 and 4 units. A wrong orin answers 0 at every store. Costs 1 credit when every orin is given (from Get Variant), plus 2 per variant whose orin is looked up (${TAIL})`,
				routing: request('/api/v1/belk/store-availability'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get belk stores',
				description: `The Belk stores near a US ZIP code: every store within about 150 miles, nearest first (Belk takes no radius; a ZIP far from any Belk answers an empty list): zip, count and stores (store_id for Get Store and Get Store Availability, name, address, distance_miles, phone, regular_hours, this_week_hours with the holiday hours Belk flags, pickup, closed_today). Captured 2026-11-27: ZIP 28202 listed 79 stores, the nearest at 5.2 miles. ${TWO}`,
				routing: request('/api/v1/belk/stores'),
			},
			{
				name: 'Get Variant',
				value: 'variant',
				action: 'Get a belk variant',
				description: `One ${SITE} variant (a colour + size of a product): variant_id, product_id, UPC, orin (what Get Store Availability takes), availability, pickup_eligible, ship_eligible, online_only, dropship, max_buy_quantity, price_type (Doorbuster, Sale ...), original_price, sale_price, sale_ends (Belk's sale end date), badge, coupons, coupon_excluded, promotions and images; with Include Color Prices also color_prices for every colour at this size. Captured 2026-11-27: size M of the Dolman sweater at 29.99 USD, original 69, a Doorbuster until 2026-11-28. An unknown variant is a charged not-found. Costs 2 credits, 4 with Include Color Prices (${TAIL})`,
				routing: request('/api/v1/belk/variant'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search belk',
				description: `${SITE} keyword search, sorted with Belk's 7 sorts and filtered by brand, colour, size, sales promotion, coupon code, discount band, price range, free-pickup store and any other facet: query, ${GRID} ${PRICES} Belk answers a query it cannot match with its closest matches. Captured 2026-11-27: sweater gave 7193 results, the first at 29.99 USD (original 69). ${TWO}`,
				routing: request('/api/v1/belk/search'),
			},
		],
		default: 'search',
	},
];

export const belkFields: INodeProperties[] = [
	// -- Search --
	{
		displayName: 'Query',
		name: 'belkQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sweater',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'belkSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('belkSearch', true),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path or URL',
		name: 'belkCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'women/womens-clothing/sweaters',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A Belk category path (path from Get Categories) or a belk.com category link',
	},
	{
		displayName: 'Additional Options',
		name: 'belkCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('belkCategory', true),
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'belkDealsType',
		type: 'options',
		default: 'doorbusters',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Doorbusters', value: 'doorbusters' },
			{ name: 'Sale Items', value: 'sale' },
			{ name: 'Super Buys', value: 'super_buys' },
			{ name: "Today's Offers", value: 'todays_offers' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "doorbusters" ? undefined : $value }}' } } },
		description: 'Which deal listing to read',
	},
	{
		displayName: 'Additional Options',
		name: 'belkDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Category Path',
				name: 'belkDealsCategory',
				type: 'string',
				default: '',
				placeholder: 'women',
				description: 'Deals inside this Belk category (a path from Get Categories). Empty: all of Belk.',
				routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('belkDeals', false),
		]),
	},

	// -- Get Product, Get Reviews --
	productField('belkProductId', 'product'),
	productField('belkReviewsProductId', 'reviews'),

	// -- Get Variant --
	{
		displayName: 'Variant ID',
		name: 'belkVariantId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0480046046048',
		displayOptions: show(['variant']),
		routing: { request: { body: { variant_id: '={{ String($value).trim() }}' } } },
		description: 'A Belk variant ID (variants[].variant_id from Get Product)',
	},
	{
		displayName: 'Include Color Prices',
		name: 'belkVariantColorPrices',
		type: 'boolean',
		default: false,
		displayOptions: show(['variant']),
		routing: { request: { body: { include_color_prices: '={{ $value ? true : undefined }}' } } },
		description: 'Whether to also return the price and stock flag of every colour at this size (4 credits instead of 2)',
	},

	// -- Get Store Availability --
	{
		displayName: 'Variant IDs',
		name: 'belkAvailabilityVariants',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0480046046048',
		displayOptions: show(['storeAvailability']),
		routing: {
			request: {
				body: {
					items:
						'={{ (() => { const v = String($value).split(",").map((s) => s.trim()).filter(Boolean); const o = String($parameter.belkAvailabilityOrins ?? "").split(",").map((s) => s.trim()); return v.map((id, i) => (o[i] ? { variant_id: id, orin: o[i] } : { variant_id: id })); })() }}',
				},
			},
		},
		description: '1 to 5 Belk variant IDs (variants[].variant_id from Get Product), comma-separated',
	},
	{
		displayName: 'Orins',
		name: 'belkAvailabilityOrins',
		type: 'string',
		default: '',
		placeholder: '472209216',
		displayOptions: show(['storeAvailability']),
		description:
			'Optional: the orin of each variant from Get Variant, comma-separated in the same order as Variant IDs. A variant with its orin costs no lookup (1 credit a call instead of 2 more per variant). A wrong orin answers 0 at every store.',
	},
	{
		displayName: 'Store IDs',
		name: 'belkAvailabilityStores',
		type: 'string',
		required: true,
		default: '',
		placeholder: '452, 329, 270',
		displayOptions: show(['storeAvailability']),
		routing: {
			request: {
				body: {
					store_ids:
						'={{ String($value).split(",").map((s) => s.trim()).filter(Boolean) }}',
				},
			},
		},
		description: '1 to 10 Belk store IDs (store_id from Get Stores), comma-separated',
	},

	// -- Get Stores --
	{
		displayName: 'ZIP Code',
		name: 'belkStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '28202',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A US ZIP code',
	},

	// -- Get Store --
	{
		displayName: 'Store ID',
		name: 'belkStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '452',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'A Belk store ID (store_id from Get Stores)',
	},
];
