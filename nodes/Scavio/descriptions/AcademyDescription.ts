import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['academy'], operation, ...extra },
});

// Academy Sports + Outdoors (academy.com, the US sporting goods retailer; US only, USD, prices
// national), 9 operations, 1 credit each; credits_used is the truth. Calls usually take 2-20 s, so
// every operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const NAME = 'Academy Sports + Outdoors';
const ONE =
	'A not-found is charged; failed upstream calls and refused inputs are not. Costs 1 credit (credits_used says what was charged).';

const ITEM =
	"position, ID, part_number (what Get Store Availability takes), name, brand, slug and URL (what Get Product takes), image, price and price_max (current), was_price, saving and percent_off (the tile's default variant, as Academy lists them), price_in_cart (Academy shows the lowest price only in the cart), promotion (message, promo_price), rating, review_count, badges (Academy's deal tags: Hot Deal, Clearance, New...), color_count, ecom_code (Academy's selling code as given), special_order, ships_to_store, same_day_delivery, free_shipping and default_variant";
const GRID = `Up to 29 organic results per page, each with ${ITEM}. Also returns page, page_size, total, total_pages, has_more, count, sort, sponsored (paid placements, flagged apart from the organic items), facets (ID, label, values with value, label, count, selected; any of them works in Facets), subcategories, title, filters_applied and notes. Prices in USD, the same at every store.`;

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);

// Grid options shared by Search Products, Get Category Products and Get Deals.
const gridOptions = (prefix: string): INodeProperties[] =>
	(
		[
			{
				displayName: 'Facets (JSON)',
				name: `${prefix}Facets`,
				type: 'json',
				default: '{}',
				description:
					'Facet filters from a previous answer: its facets[].ID to one value or a list, e.g. {"facet_Brand": "Nike"} or {"facet_Deals": "Clearance"}. Values are case-sensitive, exactly as the site lists them ("Yeti" and "YETI" differ). Facets combine.',
				routing: {
					request: {
						body: { facets: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
					},
				},
			},
			{
				displayName: 'Max Price',
				name: `${prefix}MaxPrice`,
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
				description: 'Highest price in USD',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: `${prefix}MinPrice`,
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000, numberPrecision: 2 },
				description: "Lowest price in USD (the site's price filter)",
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: `${prefix}Page`,
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description:
					'Results page, 1-based. A page past the last one returns an empty items list (total 0).',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: `${prefix}Sort`,
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling', value: 'best_selling' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Top Rated', value: 'top_rated' },
				],
				description:
					"Relevance is the site's own order. Price sorts follow Academy's list price, so promotions and cart prices can sit slightly out of order.",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		] as INodeProperties[]
	).sort(byName);

export const academyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['academy'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find academy stores',
				description: `${NAME} stores near a US ZIP code or coordinates, nearest first, within 50 miles by default (up to 250): store_id, name, address, neighborhood, phone, coordinates, distance_miles, status, today, next_change, hours, hours_by_day, services, pickup, ship-to-store, special-order and DoorDash flags, temporarily_closed, future_store and nearby_store_ids. Academy has stores in 21 states; a place with none in range is an empty list. ${ONE}`,
				routing: request('/api/v1/academy/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get academy categories',
				description: `The ${NAME} category navigation as the site's header shows it: departments (name, path, URL, ID, children groups with their links) with count, group_count and link_count. Any path works in Get Category Products. ${ONE}`,
				routing: request('/api/v1/academy/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get academy category products',
				description: `Browse one ${NAME} category by path or link (Coolers, Men's Running Shoes...), sorted and filtered like Search Products. ${GRID} An unknown category is a charged not-found. ${ONE}`,
				routing: request('/api/v1/academy/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get academy deals',
				description: `${NAME} deal listings: Hot Deals, Clearance, Black Friday (and one of its sub-shops) or the Flash Sale, sorted and filtered like Search Products. ${GRID} Also type, sub_shop, sub_shops and site_banner (the schedule of the banner the page shows, as the site gives it). Listings carry no end date per item; there is no price history (poll and store). ${ONE}`,
				routing: request('/api/v1/academy/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an academy product',
				description: `One ${NAME} product by slug or link with every variant: ID, part_number, name, brand, description, breadcrumbs, images, rating, review_count, price range, badges, ecom_code, product_type, is_firearm, is_ammo, returnable, shippable, notices and warnings (Academy's own text, as given), rebate, promotion, option axes, features, specifications, what's in the box and variants (sku_id, item_id, SKU, UPC, attributes, price, was_price, saving, percent_off, unit_price_text, price_valid_until, availability, clearance, pickup and ship-to-store eligibility, online_units, online_status). Review text is not available (rating and count only). An unknown product is a charged not-found. ${ONE}`,
				routing: request('/api/v1/academy/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get academy search suggestions',
				description:
					', search-box suggestions for a partial query: keyword completions, products (the same item fields as Search Products) and, optionally, popular searches. ,.',
				routing: request('/api/v1/academy/suggestions'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get academy store availability',
				description: `Per-variant stock of one ${NAME} product at one store: variants_in_stock_at_store, in_store_units_total and per variant (item_id, sku_id) store_status, store_message, fulfillment (BOPIS, STS or LSI), in_store_units (exact units at the store for pickup), ship_to_store_units, available_today_units, nearest_store_with_stock, online_units and online_status. Match variants to Get Product by item_id. An unknown part number is a charged not-found. ${ONE}`,
				routing: request('/api/v1/academy/store-availability'),
			},
			{
				name: 'Get Store Details',
				value: 'store',
				action: 'Get academy store details',
				description: `1 to 20 ${NAME} stores by ID, in the order asked, with the same fields as Find Stores (distance excepted) and not_found for IDs Academy does not know. When none is found it is a charged not-found. ${ONE}`,
				routing: request('/api/v1/academy/store'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search academy products',
				description:
					'Search , (academy.com, US) by keyword, sorted by relevance, best selling, newest, top rated or price, filtered by any facet (brand, product type, color, deals, size...) and a price range. , ,.',
				routing: request('/api/v1/academy/search'),
			},
		],
		default: 'search',
	},
];

export const academyFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'academySearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yeti tumbler',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'academySearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('academySearch'),
	},

	// -- Get Product --
	{
		displayName: 'Product Slug or URL',
		name: 'academyProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yeti-duracoat-rambler-20-oz-tumbler',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'The product slug (items[].slug, the part after /p/) or an academy.com product link. Every variant is returned.',
	},

	// -- Get Store Availability --
	{
		displayName: 'Part Number',
		name: 'academyPartNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '111805768',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { part_number: '={{ String($value).trim() }}' } } },
		description: "The product's part number: items[].part_number or Get Product part_number",
	},
	{
		displayName: 'Store ID',
		name: 'academyAvailabilityStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '19',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'The store: stores[].store_id from Find Stores (19, 0019 and store-0019 all work)',
	},
	{
		displayName: 'Store State',
		name: 'academyAvailabilityState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The store's 2-letter state code (stores[].address.state)",
	},

	// -- Find Stores --
	{
		displayName: 'Location By',
		name: 'academyStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Search around a US ZIP code or a latitude and longitude',
	},
	{
		displayName: 'ZIP Code',
		name: 'academyStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '77098',
		displayOptions: show(['stores'], { academyStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code',
	},
	{
		displayName: 'Latitude',
		name: 'academyStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { academyStoresBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point to search around',
	},
	{
		displayName: 'Longitude',
		name: 'academyStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { academyStoresBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point to search around',
	},
	{
		displayName: 'Additional Options',
		name: 'academyStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Radius (Miles)',
				name: 'academyStoresRadius',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 250 },
				description: 'Search radius in miles, 1-250',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Store Details --
	{
		displayName: 'Store IDs',
		name: 'academyStoreIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '19, 327, 256',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					store_ids: '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}',
				},
			},
		},
		description: '1 to 20 store IDs (stores[].store_id from Find Stores), separated by commas',
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path or URL',
		name: 'academyCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/c/outdoors/coolers',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					path: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A category path (/c/...) from Get Categories or subcategories[].path, or an academy.com category link (its query string is not read: set Facets instead)',
	},
	{
		displayName: 'Additional Options',
		name: 'academyCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('academyCategory'),
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'academyDealType',
		type: 'options',
		default: 'hot_deals',
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Flash Sale', value: 'flash_sale' },
			{ name: 'Hot Deals', value: 'hot_deals' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Which Academy deal listing to read',
	},
	{
		displayName: 'Additional Options',
		name: 'academyDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: (
			[
				...gridOptions('academyDeals'),
				{
					displayName: 'Sub-Shop',
					name: 'academyDealsSubShop',
					type: 'string',
					default: '',
					placeholder: 'gun-deals',
					description: 'Black Friday only: one sub-shop, sub_shops[].slug of a Black Friday answer',
					routing: { request: { body: { sub_shop: '={{ String($value).trim() || undefined }}' } } },
				},
			] as INodeProperties[]
		).sort(byName),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'academySuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'yeti',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Additional Options',
		name: 'academySuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Include Popular Searches',
				name: 'academySuggestionsPopular',
				type: 'boolean',
				default: false,
				description: "Whether to also return the site's popular searches",
				routing: { request: { body: { include_popular: '={{ $value }}' } } },
			},
		],
	},
];
