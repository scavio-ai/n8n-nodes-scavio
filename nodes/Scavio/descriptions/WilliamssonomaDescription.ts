import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['williamssonoma'], operation, ...extra },
});

// Williams-Sonoma, Inc. brands (Williams Sonoma, Pottery Barn, Pottery Barn Kids, Pottery Barn Teen, West Elm,
// Rejuvenation, Mark and Graham), 12 operations: 1 credit each, Search Products and Get Category Products 5;
// credits_used is the truth. US in USD; Canada (CAD) on Get Product only. Each operation offers only the brands the
// backend serves on it; a product link sets its own brand, so Brand is left out when a link is given. Product pages
// take up to 50 s and listings and reviews up to 60 s, so every operation carries a 180s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 180000 },
});

const SITE =
	'the Williams-Sonoma, Inc. brands (Williams Sonoma, Pottery Barn, Pottery Barn Kids, Pottery Barn Teen, West Elm, Rejuvenation, Mark and Graham)';
const WHERE = 'Every answer carries brand, brand_name, market, currency, language and host, plus notes.';
const NATIONAL =
	"Prices are the brand's online prices in the market's currency, the same at every ZIP code and store.";
const ONE =
	'A not-found is charged; failed upstream calls and refused inputs are not. Costs 1 credit (credits_used says what was charged).';
const FIVE =
	'A not-found is charged; failed upstream calls and refused inputs are not. Costs 5 credits (credits_used says what was charged).';
const LISTING =
	"page (1), page_size, total, count, items (position, product_id for Get Product, name, URL, leader_sku, image, price_min, price_max, regular and sale price ranges, price_type: regular, limited_time_offer or set_savings, max_discount_percent, flags, more_swatches), facets, sort_options and related_searches. Page 1 (20 products) as the site lists it.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const ALL_BRANDS = [
	{ name: 'Mark and Graham', value: 'mark_and_graham' },
	{ name: 'Pottery Barn', value: 'pottery_barn' },
	{ name: 'Pottery Barn Kids', value: 'pottery_barn_kids' },
	{ name: 'Pottery Barn Teen', value: 'pottery_barn_teen' },
	{ name: 'Rejuvenation', value: 'rejuvenation' },
	{ name: 'West Elm', value: 'west_elm' },
	{ name: 'Williams Sonoma', value: 'williams_sonoma' },
];
const STORE_BRANDS = ALL_BRANDS.filter((b) => b.value !== 'mark_and_graham');
const SEARCH_BRANDS = ALL_BRANDS.filter((b) => b.value === 'pottery_barn' || b.value === 'williams_sonoma');

const isUrl = (param: string) => `/^https?:/i.test(String($parameter["${param}"] ?? "").trim())`;
const trimmed = 'String($value).trim()';
const optionalText = `={{ ${trimmed} === "" ? undefined : ${trimmed} }}`;
// Comma-separated values sent as a list.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

/** A Brand field. Left out of the request when the operation's product field holds a link (the link sets the brand). */
const brandField = (
	name: string,
	operation: string,
	options: Array<{ name: string; value: string }>,
	description: string,
	productParam?: string,
): INodeProperties => ({
	displayName: 'Brand',
	name,
	type: 'options',
	required: true,
	default: 'williams_sonoma',
	options,
	displayOptions: show([operation]),
	routing: {
		request: {
			body: { brand: productParam ? `={{ ${isUrl(productParam)} ? undefined : $value }}` : '={{ $value }}' },
		},
	},
	description,
});

/** A product ID or brand-site product link: an https link goes to url, anything else to product. */
const productField = (name: string, operation: string, fixedBrand?: string): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'gabrielle-upholstered-sofa',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				product: `={{ /^https?:/i.test(${trimmed}) ? undefined : ${trimmed} }}`,
				url: `={{ /^https?:/i.test(${trimmed}) ? ${trimmed} : undefined }}`,
				...(fixedBrand ? { brand: `={{ /^https?:/i.test(${trimmed}) ? undefined : "${fixedBrand}" }}` } : {}),
			},
		},
	},
	description:
		'The product ID (the part after /products/ in a product link; product_id from Search Products or Get Category Products) or the product link on the brand site',
});

const zipField = (name: string, operation: string, required: boolean, description: string): INodeProperties => ({
	displayName: 'ZIP Code',
	name,
	type: 'string',
	required,
	default: '',
	placeholder: '94103',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: required ? `={{ ${trimmed} }}` : optionalText } } },
	description,
});

const pointOptions = (prefix: string, defaultRadius: number): INodeProperties[] => [
	{
		displayName: 'Latitude',
		name: `${prefix}Latitude`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		description: 'Latitude (with Longitude), instead of ZIP Code. Leave ZIP Code empty when you set it.',
		routing: { request: { body: { latitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: `${prefix}Longitude`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		description: 'Longitude (with Latitude)',
		routing: { request: { body: { longitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Radius (Miles)',
		name: `${prefix}Radius`,
		type: 'number',
		default: defaultRadius,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: `Radius in miles, 1 to 200 (default ${defaultRadius})`,
		routing: { request: { body: { radius: `={{ $value === ${defaultRadius} ? undefined : $value }}` } } },
	},
];

const CATEGORIES_DESC =
	`The category tree of one brand of ${SITE} (US), the Sale and Black Friday listings included: without Category the top-level categories (ID, name, type, path, child_count); with Category (an ID) its full subtree (ID, name, type, path for Get Category Products, children). ${WHERE} Captured 2026-11-27: Pottery Barn had 24 top-level categories. ${ONE}`;
const FLOOR_DESC =
	`The US stores showing one furniture piece on their floor, for ${SITE} (every brand with stores), by product, link or SKU near a ZIP code or a point, by distance as the brand lists them: radius_miles, radius_extended (the brand widened the radius to find one), count and stores (store_number, brand, name, address, phone, coordinates, distance_miles, hours). ${WHERE} Captured 2026-11-27: the Pottery Barn Gabrielle sofa near ZIP 94103 was on the floor at 9 stores within an extended 200 miles. ${ONE}`;
const PICKUP_DESC =
	`Store pickup per SKU per store, for ${SITE} (US; every brand with stores): up to 20 SKUs at up to 10 stores (store codes from Find Stores): skus (sku, ship_mode, stores: pickup_location_code, available_for_pickup true or false with no unit counts, and the dated ship_to_store window). ${NATIONAL} ${WHERE} Captured 2026-11-27: SKU 1468824 was not available for pickup at ST:0859 and ST:6016, ship to store 2026-12-01 to 2026-12-08. ${ONE}`;

export const williamssonomaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['williamssonoma'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find williams sonoma stores',
				description: `The US stores of ${SITE}, near a ZIP code or a point, every brand with stores in one call (or the brands chosen), by distance: brands, zip, latitude, longitude, radius_miles, count and stores (store_number, pickup_location_code for Get Store Pickup, name, brand, store_type, address, coordinates, phone, distance_miles, pickup, ship_to_store and this week's hours; holiday closures show as Closed). A ZIP is placed at its US Census centroid. Mark and Graham has no stores. Captured 2026-11-27: ZIP 60611 gave 10 stores across 6 brands within 25 miles. ${ONE}`,
				routing: request('/api/v1/williamssonoma/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get williams sonoma categories',
				description: CATEGORIES_DESC,
				routing: request('/api/v1/williamssonoma/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get williams sonoma category products',
				description: `One Pottery Barn category listing (US) by path or category link, in the site's sorts (featured, price low to high, price high to low, newest, best selling): path, sort, ${LISTING} Sale and Black Friday listings are category paths. ${NATIONAL} ${WHERE} An unknown category is a charged not-found (5 credits). ${FIVE}`,
				routing: request('/api/v1/williamssonoma/category'),
			},
			{
				name: 'Get Configurator',
				value: 'configurator',
				action: 'Get a williams sonoma furniture configurator',
				description: `The fabric configurator of a made-to-order Pottery Barn piece (US), by base SKU (configurator_base_skus from Get Product), product ID or link: base_sku, name, price range across fabrics and options (min, max, regular, discount_percent_max, discount_type; the exact price per fabric is set in the cart), production_lead_time as given, dimensions_in, fabric_count and fabrics (ID, name, color, fabric, features, fiber content, rub_count, price_tier). ${NATIONAL} ${WHERE} Captured 2026-11-27: the Gabrielle Sofa (base SKU 4889446) offered 50 fabrics from 1999 to 2899 USD. A product with no configurator is a charged not-found. ${ONE}`,
				routing: request('/api/v1/williamssonoma/configurator'),
			},
			{
				name: 'Get Delivery Estimate',
				value: 'deliveryEstimate',
				action: 'Get a williams sonoma delivery estimate',
				description: `Standard-delivery dates to a US ZIP code for every SKU of one product, or for up to 20 SKUs, of ${SITE}: zip, count and skus (sku, ship_mode, availability such as in_stock_ready_to_ship, special_order or coming_soon, service_level, earliest_date, latest_date, min_days, max_days, message, and holiday with the order cutoff when the brand publishes one). Dates are the brand's own estimate, as given. ${WHERE} Captured 2026-11-27: the Pottery Barn Gabrielle sofa to ZIP 94103, a special order, 2027-02-26 to 2027-03-12. ${ONE}`,
				routing: request('/api/v1/williamssonoma/delivery-estimate'),
			},
			{
				name: 'Get Floor Samples',
				value: 'floorSamples',
				action: 'Get williams sonoma floor samples',
				description: FLOOR_DESC,
				routing: request('/api/v1/williamssonoma/floor-samples'),
			},
			{
				name: 'Get Online Stock',
				value: 'stock',
				action: 'Get williams sonoma online stock',
				description: `Online stock ranges per SKU of one product of ${SITE} (US): product_id, zip, regions, count and skus (sku, available_now as a unit range as given such as 1-10 or 401+, available_now_min, available_now_max, null on an open range, within_2_weeks, and regional: in_stock, quick_ship or not_available for the ZIP's delivery region). The unit ranges are national. ${WHERE} Captured 2026-11-27: the W\u00dcSTHOF Classic Chef's Knife listed 18 SKUs, the first 1-10 available now. ${ONE}`,
				routing: request('/api/v1/williamssonoma/stock'),
			},
			{
				name: 'Get Popular Searches',
				value: 'popularSearches',
				action: 'Get williams sonoma popular searches',
				description: `The day's most searched terms on one brand of ${SITE} (US), the list the brand's own search box shows: date (Pacific time), count and terms (rank, term, count as given). The newest published list is returned. ${WHERE} ${ONE}`,
				routing: request('/api/v1/williamssonoma/popular-searches'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a williams sonoma product',
				description: `One product of ${SITE} by brand + product ID or a product link, US or Canada (Williams Sonoma, Pottery Barn and West Elm, CAD): product_id, name, URL, page_type, available, breadcrumbs, price range with regular prices and discount_type, on_sale, rating and review_count (Williams Sonoma; the other brands show no ratings, so both are null), flags, today's promotion messages as given, dimension lines, materials, configurator_base_skus, sku_count and skus (up to 500: sku, options such as size and color, price, regular_price, on_sale, personalization price, surcharge, stock: on_hand, back_ordered or not_available, back_ordered_date, ship_mode, delivery services, white_glove, pickup services, furniture, direct_ship, special_order, width, height and depth in inches). No UPC. ${NATIONAL} ${WHERE} Captured 2026-11-27: the Williams Sonoma W\u00dcSTHOF Classic Chef's Knife had 19 SKUs from 99 to 200 USD, rated 4.81 from 564 reviews; a West Elm rug on westelm.ca ran 524 to 1274 CAD. An unknown product is a charged not-found. ${ONE}`,
				routing: request('/api/v1/williamssonoma/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get williams sonoma product reviews',
				description: `Customer reviews of one Williams Sonoma product (US; the other brands show no reviews), newest to oldest: page, offset, page_size, total, total_pages, has_more, statistics (average_rating, review_count, recommended and not recommended counts, rating_distribution) and reviews (review_id, rating, title, text, submitted_at, recommended, verified_purchaser, badges, syndicated and syndication_source, helpful and unhelpful votes, secondary_ratings, product_name). Page 1 holds 8 reviews, pages 2 to 5 hold 30 each; no sort or star filter. No reviewer names, locations or photos. ${WHERE} ${ONE}`,
				routing: request('/api/v1/williamssonoma/reviews'),
			},
			{
				name: 'Get Store Pickup',
				value: 'storePickup',
				action: 'Get williams sonoma store pickup',
				description: PICKUP_DESC,
				routing: request('/api/v1/williamssonoma/store-pickup'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search williams sonoma products',
				description: `Keyword search on Williams Sonoma or Pottery Barn (US): query, ${LISTING} Results come in the site's relevance order (no sort). West Elm search is not served. ${NATIONAL} ${WHERE} ${FIVE}`,
				routing: request('/api/v1/williamssonoma/search'),
			},
		],
		default: 'product',
	},
];

export const williamssonomaFields: INodeProperties[] = [
	// -- Brand --
	brandField('wsProductBrand', 'product', ALL_BRANDS, 'The brand. Canada serves Williams Sonoma, Pottery Barn and West Elm. Left out when Product ID or URL is a link.', 'wsProductId'),
	brandField('wsDeliveryBrand', 'deliveryEstimate', ALL_BRANDS, 'The brand. Left out when Product ID, URL or SKUs is a link.', 'wsDeliveryTarget'),
	brandField('wsStockBrand', 'stock', ALL_BRANDS, 'The brand. Left out when Product ID or URL is a link.', 'wsStockProductId'),
	brandField('wsPickupBrand', 'storePickup', STORE_BRANDS, 'The brand (every brand with stores)'),
	brandField('wsFloorBrand', 'floorSamples', STORE_BRANDS, 'The brand (every brand with stores). Left out when Product ID, URL or SKU is a link.', 'wsFloorTarget'),
	brandField('wsCategoriesBrand', 'categories', ALL_BRANDS, 'The brand'),
	brandField('wsSearchBrand', 'search', SEARCH_BRANDS, 'Williams Sonoma or Pottery Barn (West Elm search is not served)'),
	brandField('wsPopularBrand', 'popularSearches', ALL_BRANDS, 'The brand'),

	// -- Get Product, Get Online Stock, Get Reviews --
	productField('wsProductId', 'product'),
	productField('wsStockProductId', 'stock'),
	productField('wsReviewsProductId', 'reviews', 'williams_sonoma'),

	// -- Get Configurator --
	{
		displayName: 'Base SKU, Product ID or URL',
		name: 'wsConfiguratorTarget',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4889446',
		displayOptions: show(['configurator']),
		routing: {
			request: {
				body: {
					base_sku: `={{ /^\\d+$/.test(${trimmed}) ? ${trimmed} : undefined }}`,
					url: `={{ /^https?:/i.test(${trimmed}) ? ${trimmed} : undefined }}`,
					product: `={{ /^\\d+$/.test(${trimmed}) || /^https?:/i.test(${trimmed}) ? undefined : ${trimmed} }}`,
					brand: `={{ /^https?:/i.test(${trimmed}) ? undefined : "pottery_barn" }}`,
				},
			},
		},
		description:
			'A Pottery Barn configurator base SKU (digits, configurator_base_skus from Get Product), a product ID, or a potterybarn.com product link',
	},

	// -- Get Delivery Estimate --
	{
		displayName: 'Product ID, URL or SKUs',
		name: 'wsDeliveryTarget',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'gabrielle-upholstered-sofa',
		displayOptions: show(['deliveryEstimate']),
		routing: {
			request: {
				body: {
					skus: `={{ /^[\\d,\\s]+$/.test(${trimmed}) ? ${trimmed}.split(",").map(s => s.trim()).filter(Boolean) : undefined }}`,
					url: `={{ /^https?:/i.test(${trimmed}) ? ${trimmed} : undefined }}`,
					product: `={{ /^[\\d,\\s]+$/.test(${trimmed}) || /^https?:/i.test(${trimmed}) ? undefined : ${trimmed} }}`,
				},
			},
		},
		description:
			'A product ID or product link (every SKU of the product), or up to 20 SKU IDs separated by commas (skus from Get Product)',
	},
	zipField('wsDeliveryZip', 'deliveryEstimate', true, 'The US ZIP code to deliver to'),

	// -- Get Store Pickup --
	{
		displayName: 'SKUs',
		name: 'wsPickupSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1468824,2600435',
		displayOptions: show(['storePickup']),
		routing: { request: { body: { skus: splitList } } },
		description: 'Up to 20 SKU IDs separated by commas (skus from Get Product)',
	},
	{
		displayName: 'Store Codes',
		name: 'wsPickupStores',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ST:0859,ST:6016',
		displayOptions: show(['storePickup']),
		routing: { request: { body: { stores: splitList } } },
		description: 'Up to 10 store codes separated by commas (pickup_location_code from Find Stores)',
	},

	// -- Find Stores --
	zipField('wsStoresZip', 'stores', false, 'A US ZIP code. Leave empty to search by Latitude and Longitude (Additional Options).'),

	// -- Get Floor Samples --
	{
		displayName: 'Product ID, URL or SKU',
		name: 'wsFloorTarget',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'gabrielle-upholstered-sofa',
		displayOptions: show(['floorSamples']),
		routing: {
			request: {
				body: {
					sku: `={{ /^\\d+$/.test(${trimmed}) ? ${trimmed} : undefined }}`,
					url: `={{ /^https?:/i.test(${trimmed}) ? ${trimmed} : undefined }}`,
					product: `={{ /^\\d+$/.test(${trimmed}) || /^https?:/i.test(${trimmed}) ? undefined : ${trimmed} }}`,
				},
			},
		},
		description: 'A product ID, a product link, or one SKU ID (digits, from Get Product)',
	},
	zipField('wsFloorZip', 'floorSamples', false, 'A US ZIP code. Leave empty to search by Latitude and Longitude (Additional Options).'),

	// -- Get Category Products --
	{
		displayName: 'Category Path or URL',
		name: 'wsCategoryPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'furniture/sofas',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					path: `={{ /^https?:/i.test(${trimmed}) ? undefined : ${trimmed} }}`,
					url: `={{ /^https?:/i.test(${trimmed}) ? ${trimmed} : undefined }}`,
					brand: 'pottery_barn',
				},
			},
		},
		description:
			'A Pottery Barn category path under /shop/ (path from Get Categories, e.g. furniture/sofas or a sale path) or a potterybarn.com category link',
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'wsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'chef knife',
		displayOptions: show(['search']),
		routing: { request: { body: { query: `={{ ${trimmed} }}` } } },
		description: 'Search keywords (1 to 100 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'wsProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Market',
				name: 'wsProductMarket',
				type: 'options',
				default: 'us',
				options: [
					{ name: 'Canada (CAD)', value: 'ca' },
					{ name: 'United States (USD)', value: 'us' },
				],
				description:
					"The brand's US site (default) or Canadian site in English (Williams Sonoma, Pottery Barn and West Elm). A product link sets its own market.",
				routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'wsStockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stock']),
		options: sorted([
			{
				displayName: 'SKUs',
				name: 'wsStockSkus',
				type: 'string',
				default: '',
				placeholder: '1468824',
				description: 'Limit the answer to these SKU IDs of the product (up to 20, separated by commas)',
				routing: { request: { body: { skus: splitList } } },
			},
			{
				displayName: 'ZIP Code',
				name: 'wsStockZip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description: 'US ZIP code for the regional in-stock lists (default 10001). The unit ranges are national.',
				routing: { request: { body: { zip: optionalText } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'wsStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			{
				displayName: 'Brands',
				name: 'wsStoresBrands',
				type: 'multiOptions',
				default: [],
				options: STORE_BRANDS,
				description: 'Brands to list (default every brand with stores)',
				routing: {
					request: { body: { brands: '={{ $value.length ? $value : undefined }}' } },
				},
			},
			{
				displayName: 'Include Outlets',
				name: 'wsStoresOutlets',
				type: 'boolean',
				default: false,
				description: 'Whether to include outlet stores',
				routing: { request: { body: { include_outlets: '={{ $value ? true : undefined }}' } } },
			},
			...pointOptions('wsStores', 25),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'wsFloorOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['floorSamples']),
		options: sorted(pointOptions('wsFloor', 50)),
	},
	{
		displayName: 'Additional Options',
		name: 'wsCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Category',
				name: 'wsCategoriesCategory',
				type: 'string',
				default: '',
				placeholder: 'furniture',
				description: 'A top-level category ID: the answer is its full subtree',
				routing: { request: { body: { category: optionalText } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'wsCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: [
			{
				displayName: 'Sort',
				name: 'wsCategorySort',
				type: 'options',
				default: 'featured',
				options: [
					{ name: 'Best Selling', value: 'best_selling' },
					{ name: 'Featured', value: 'featured' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: "The site's category sort",
				routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'wsReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'wsReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: 'Reviews page, 1 to 5: page 1 holds 8 reviews, every later page 30',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
];
