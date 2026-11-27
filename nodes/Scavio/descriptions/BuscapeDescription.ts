import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['buscape'], operation, ...extra },
});

// Buscape and Zoom (buscape.com.br, zoom.com.br, Brazil's price comparison sites), 12 operations, 1 credit each;
// credits_used is the truth. Brazil, BRL. Most calls take 1 to 9 s, page reads (product, categories, deal landing,
// store) 5 to 30 s and up to about 80 s when busy; every operation carries a 180s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 180000 },
});

const SITE =
	"Buscape and Zoom (buscape.com.br and zoom.com.br, Brazil's price comparison sites; one catalog with the same IDs), Portuguese text, prices in BRL";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const NO_LINKS = 'Store links are not returned.';
const GRID =
	'page, page_size, sort, total (capped at 10000: total_capped), total_pages, has_more, count, items (position, type product or offer, product_id for Get Product and Get Offers, offer_id, name, URL, image, category, price as the lowest cash price, installments, store_count, stores, best_offer, price_drop_percent, competitiveness_index, rating, review_count, marketplace, stamps), facets (key, values with counts; send back in Filters), categories, price_range and filters_applied.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** buscape (default) or zoom, sent only when not the default. */
const siteField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Site',
	name,
	type: 'options',
	default: 'buscape',
	options: [
		{ name: 'Buscape', value: 'buscape' },
		{ name: 'Zoom', value: 'zoom' },
	],
	displayOptions: show(operations),
	description: 'One catalog; Site sets the site of the page links returned',
	routing: { request: { body: { site: '={{ $value === "buscape" ? undefined : $value }}' } } },
});

const productIdField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '12755140',
	displayOptions: show(operations),
	routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
	description: 'The product ID (product_id of Search, Get Category Products or Get Deals)',
});

const pageOption = (name: string, max: number): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description: 'Page, 1-based; total_pages reports the last one',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const pageSizeOption = (name: string, max: number, dflt: number, what: string): INodeProperties => ({
	displayName: 'Page Size',
	name,
	type: 'number',
	default: dflt,
	typeOptions: { minValue: 1, maxValue: max },
	description: `${what} per page, 1 to ${max}`,
	routing: { request: { body: { page_size: `={{ $value === ${dflt} ? undefined : $value }}` } } },
});

const offerSortOptions = [
	{ name: 'Cashback Price', value: 'cashback_price_asc' },
	{ name: 'Discount', value: 'discount_desc' },
	{ name: 'Installment Total', value: 'installment_price_asc' },
	{ name: 'Price: High to Low', value: 'price_desc' },
	{ name: 'Price: Low to High', value: 'price_asc' },
	{ name: 'Site Order', value: 'default' },
];

const categoryIdsOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Category IDs',
	name,
	type: 'string',
	default: '',
	placeholder: '8',
	description,
	routing: {
		request: {
			body: {
				category_id:
					'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length ? (a.length === 1 ? a[0] : a) : undefined; })() }}',
			},
		},
	},
});

/** Sort, filters, price range, marketplace, store and paging shared by Search, Get Category Products and Get Deals. */
const gridOptions = (prefix: string, extra: INodeProperties[] = []): INodeProperties[] =>
	sorted([
		...extra,
		{
			displayName: 'Best-Selling Store',
			name: `${prefix}Store`,
			type: 'string',
			default: '',
			placeholder: 'Magazine Luiza',
			description: 'Products whose best-selling store is this one, as stores name gives it',
			routing: { request: { body: { store: '={{ String($value).trim() || undefined }}' } } },
		},
		{
			displayName: 'Filters (JSON)',
			name: `${prefix}Filters`,
			type: 'json',
			default: '{}',
			description:
				'Facet filters, at most 8, keys and values exactly as facets key and values of an answer list them, e.g. {"Marca": "Samsung"}',
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
			displayName: 'Marketplace',
			name: `${prefix}Marketplace`,
			type: 'options',
			default: 'any',
			options: [
				{ name: 'Any', value: 'any' },
				{ name: 'Marketplace Sellers Only', value: 'true' },
				{ name: "Stores' Own Offers Only", value: 'false' },
			],
			routing: { request: { body: { marketplace: '={{ $value === "any" ? undefined : $value === "true" }}' } } },
		},
		{
			displayName: 'Max Price (BRL)',
			name: `${prefix}PriceMax`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Highest price in BRL; 0 means no limit',
			routing: { request: { body: { price_max: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Price (BRL)',
			name: `${prefix}PriceMin`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Lowest price in BRL; 0 means no limit',
			routing: { request: { body: { price_min: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		pageOption(`${prefix}Page`, 1000),
		pageSizeOption(`${prefix}PageSize`, 100, 30, 'Items'),
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Price Drop', value: 'price_drop' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Rating', value: 'rating' },
				{ name: 'Relevance', value: 'relevance' },
			],
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
	]);

export const buscapeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['buscape'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get buscape categories',
				description: `The ${SITE} category tree: the top-level branches (slug, URL), or with Branch the branch and its categories (ID for Get Category Products, name, slug, type, URL). An unknown branch is a charged not-found. Captured 2026-11-27: the eletrodomesticos branch held 18 categories. ${ONE}`,
				routing: request('/api/v1/buscape/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get buscape category products',
				description: `One ${SITE} category by ID or slug, sorted and filtered like Search: category, breadcrumb and ${GRID} An unknown category is a charged not-found. ${NO_LINKS} Captured 2026-11-27: category 8 (Geladeira) held 4053 items. ${ONE}`,
				routing: request('/api/v1/buscape/category'),
			},
			{
				name: 'Get Deal Landing',
				value: 'dealLanding',
				action: 'Get a buscape deal landing',
				description: `One ${SITE} campaign landing (black-friday, oferta-do-dia-buscape, black-friday-zoom ...): slug, title, brand, updated_at, URL and sections (kind: featured_offers, search_items or product_highlight, title, subtitle, from, to, items) as the site's editors arrange them. An unknown landing is a charged not-found. ${NO_LINKS} Captured 2026-11-27: black-friday held 6 sections. ${ONE}`,
				routing: request('/api/v1/buscape/deal-landing'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get buscape deals',
				description: `The ${SITE} deals list as the site's Ofertas page builds it (products scoring 0.8 or more on its competitiveness index), by category or keyword, sorted and filtered like Search. Returns ${GRID} ${NO_LINKS} Captured 2026-11-27: a deals list held 305 items. ${ONE}`,
				routing: request('/api/v1/buscape/deals'),
			},
			{
				name: 'Get Lowest Price',
				value: 'lowestPrice',
				action: 'Get a buscape lowest price',
				description: `The lowest current price of one ${SITE} product: product_id, offer_id, store_id, price, list_price (as given), price_drop_percent, stock, active and updated_at. An unknown product is a charged not-found. Captured 2026-11-27: product 12755140 at 4537.84 BRL. ${ONE}`,
				routing: request('/api/v1/buscape/lowest-price'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get buscape offers',
				description: `Every store offer for one ${SITE} product, sorted by cash price, installment total, discount or cashback price and filtered by variant, up to 50 a page: total, store_count, total_pages, offers (offer_id, SKU ID, name, image, store with ID, name and is_marketplace, price as the cash price, installment_total, installments, price_drop_percent, competitiveness_index, stock, condition, cross_border, variants), best_offer, priciest_offer and variant_filters. A product with no offers (or unknown) is a charged not-found. ${NO_LINKS} Captured 2026-11-27: product 13994006 had 54 offers from 5 stores, the lowest 2308 BRL. ${ONE}`,
				routing: request('/api/v1/buscape/offers'),
			},
			{
				name: 'Get Price History',
				value: 'priceHistory',
				action: 'Get a buscape price history',
				description: `The price history of one ${SITE} product: the day's lowest price in BRL and its store, for 40 days or 3 to 12 months: period, months, count, lowest, highest, latest and points (date, price, store_id). A product without history (or unknown) is a charged not-found. Captured 2026-11-27: product 12755140 over 40 days ran from 5057.99 down to 4299 BRL. ${ONE}`,
				routing: request('/api/v1/buscape/price-history'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a buscape product',
				description: `One ${SITE} product by ID or page link: name, URL, status, rating, review_count, category, breadcrumb, category_rank, stamps, images, specs, offer_count, store_count, best_offer, priciest_offer, offers as the page shows them, variant_filters, price_history_40_days, price_tip (the site's own price tip, as given: good_price, regular_price, best_history_price or not_enough_history, with the median price), expert (the site editors' pros and cons, as given) and up to 10 store reviews (no reviewer names). An unknown product is a charged not-found. ${NO_LINKS} Captured 2026-11-27: the iPhone 16 128GB, rated 4.8 from 6077 reviews, 22 offers from 6 stores. ${ONE}`,
				routing: request('/api/v1/buscape/product'),
			},
			{
				name: 'Get Shipping Estimate',
				value: 'shipping',
				action: 'Get a buscape shipping estimate',
				description: `Freight estimates for one ${SITE} product to a Brazilian CEP (postal code), per store offer (up to 50): offers (offer_id, store, price, freight with type, price in BRL, delivery_days and text, and the store's coupon promotions), as the product page shows them. Send the CEP's state and city. Stores that publish no estimate have an empty freight list. A product with no offers (or unknown) is a charged not-found. Captured 2026-11-27: product 13994006 to CEP 01310-100 had estimates for 7 of 10 offers. ${ONE}`,
				routing: request('/api/v1/buscape/shipping'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a buscape store',
				description: `One store on ${SITE} and its coupons: store (ID, name, store_ids, logo, cashback_percent, URL), coupon_count and coupons (coupon_id, type, discount_type, value, code, description, starts_at, expires_at, status, product_id, category_id, devices, brands) as the store page lists them. The sites publish no store ratings. An unknown store is a charged not-found. Coupon links are not returned. Captured 2026-11-27: store 21 (KaBuM!) listed 100 coupons. ${ONE}`,
				routing: request('/api/v1/buscape/store'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get buscape suggestions',
				description: `${SITE} search suggestions as its search box shows them: query, count and suggestions (query, position, category). Captured 2026-11-27: geladeira gave 8 suggestions. ${ONE}`,
				routing: request('/api/v1/buscape/suggestions'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search buscape',
				description: `${SITE} keyword search, up to 100 a page, sorted by relevance, price, rating or price drop and filtered by any facet, price range, category, marketplace or best-selling store: query, ${GRID} category_suggestion is the category the site narrows the keyword to. ${NO_LINKS} Captured 2026-11-27: geladeira gave 4053 results, the first the Geladeira Brastemp BRM46MB from 2308 BRL across 5 stores. ${ONE}`,
				routing: request('/api/v1/buscape/search'),
			},
		],
		default: 'search',
	},
];

export const buscapeFields: INodeProperties[] = [
	siteField('buscapeSite', [
		'search',
		'category',
		'categories',
		'product',
		'offers',
		'priceHistory',
		'lowestPrice',
		'deals',
		'dealLanding',
		'store',
		'suggestions',
		'shipping',
	]),

	// -- Search --
	{
		displayName: 'Query',
		name: 'buscapeQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'geladeira',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'buscapeSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('buscapeSearch', [
			categoryIdsOption('buscapeSearchCategoryIds', 'Category IDs to search in (category ID of an item; Get Categories lists them), comma-separated'),
		]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'buscapeCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					category_id: '={{ /^\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					category: '={{ /^\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A category ID (e.g. 8), slug (e.g. geladeira) or category link.',
	},
	{
		displayName: 'Additional Options',
		name: 'buscapeCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('buscapeCategory', [
			{
				displayName: 'Query',
				name: 'buscapeCategoryQuery',
				type: 'string',
				default: '',
				description: 'Optional keywords inside the category',
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'buscapeDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions('buscapeDeals', [
			categoryIdsOption('buscapeDealsCategoryIds', 'Category IDs to list the deals of, comma-separated'),
			{
				displayName: 'Query',
				name: 'buscapeDealsQuery',
				type: 'string',
				default: '',
				description: 'Optional keywords inside the deals',
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},

	// -- Get Categories --
	{
		displayName: 'Branch',
		name: 'buscapeBranch',
		type: 'string',
		default: '',
		placeholder: 'eletrodomesticos',
		displayOptions: show(['categories']),
		routing: { request: { body: { branch: '={{ String($value).trim() || undefined }}' } } },
		description: 'A branch slug for its categories. Leave empty for the top-level branches.',
	},

	// -- Get Product --
	{
		displayName: 'Product ID or URL',
		name: 'buscapeProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12755140',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_id: '={{ /^(product)?\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					url: '={{ /^(product)?\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A product ID (product_id of Search) or a product page link on www.buscape.com.br or www.zoom.com.br',
	},

	// -- Get Offers, Get Price History, Get Lowest Price, Get Shipping Estimate --
	productIdField('buscapeProductId', ['offers', 'priceHistory', 'lowestPrice', 'shipping']),
	{
		displayName: 'Additional Options',
		name: 'buscapeOffersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['offers']),
		options: sorted([
			pageOption('buscapeOffersPage', 100),
			pageSizeOption('buscapeOffersPageSize', 50, 20, 'Offers'),
			{
				displayName: 'Sort',
				name: 'buscapeOffersSort',
				type: 'options',
				default: 'default',
				options: offerSortOptions,
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Variant ID',
				name: 'buscapeOffersVariantId',
				type: 'string',
				default: '',
				description: 'A variant (variant_filters values variant_id, e.g. a voltage): offers of that variant only',
				routing: { request: { body: { variant_id: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Period',
		name: 'buscapePeriod',
		type: 'options',
		default: 'days',
		options: [
			{ name: '40 Days', value: 'days' },
			{ name: 'Months', value: 'months' },
		],
		displayOptions: show(['priceHistory']),
		routing: { request: { body: { period: '={{ $value === "days" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Months',
		name: 'buscapeMonths',
		type: 'number',
		default: 12,
		typeOptions: { minValue: 3, maxValue: 12 },
		displayOptions: show(['priceHistory'], { buscapePeriod: ['months'] }),
		routing: { request: { body: { months: '={{ $value }}' } } },
		description: 'Months of daily points, 3 to 12',
	},
	{
		displayName: 'CEP',
		name: 'buscapeCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['shipping']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'The Brazilian CEP (postal code, 8 digits) to deliver to',
	},
	{
		displayName: 'State',
		name: 'buscapeState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'SP',
		displayOptions: show(['shipping']),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The CEP's state, a two-letter UF",
	},
	{
		displayName: 'City',
		name: 'buscapeCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'São Paulo',
		displayOptions: show(['shipping']),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: "The CEP's city, as written in Portuguese",
	},
	{
		displayName: 'Additional Options',
		name: 'buscapeShippingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['shipping']),
		options: sorted([
			pageSizeOption('buscapeShippingPageSize', 50, 10, 'Offers to estimate'),
			{
				displayName: 'Sort',
				name: 'buscapeShippingSort',
				type: 'options',
				default: 'price_asc',
				options: offerSortOptions,
				description: 'Which offers to estimate',
				routing: { request: { body: { sort: '={{ $value === "price_asc" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Variant ID',
				name: 'buscapeShippingVariantId',
				type: 'string',
				default: '',
				description: 'A variant (variant_filters values variant_id): offers of that variant only',
				routing: { request: { body: { variant_id: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},

	// -- Get Deal Landing --
	{
		displayName: 'Landing Slug',
		name: 'buscapeSlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'black-friday',
		displayOptions: show(['dealLanding']),
		routing: { request: { body: { slug: '={{ String($value).trim() }}' } } },
		description: 'A campaign landing slug or link, e.g. black-friday, oferta-do-dia-buscape (Buscape) or black-friday-zoom (Zoom)',
	},

	// -- Get Store --
	{
		displayName: 'Store ID or Path',
		name: 'buscapeStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '21',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					store_id: '={{ /^\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					store: '={{ /^\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A store ID (stores ID of an item, e.g. 21), the store page path slug-ID (e.g. kabum!-21) or its link.',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'buscapeSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'geladeira',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Limit',
		name: 'buscapeSuggestionsLimit',
		type: 'number',
		default: 8,
		typeOptions: { minValue: 1, maxValue: 20 },
		displayOptions: show(['suggestions']),
		routing: { request: { body: { limit: '={{ $value === 8 ? undefined : $value }}' } } },
		description: 'Max number of results to return',
	},
];
