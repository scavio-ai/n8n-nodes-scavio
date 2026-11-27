import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['boticario'], operation, ...extra },
});

// O Boticario and Eudora (boticario.com.br, eudora.com.br, the beauty brands of Grupo Boticario), 11 operations;
// credits_used is the truth: 1 credit, 2 when a page needs a second route, Get Prices ceil(skus / 5). Brazil only, BRL.
// Page operations usually take 10 to 130 s and carry a 300s timeout; the others take 2 to 25 s and carry 120s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const PAGE_MS = 300000;
const FAST_MS = 120000;

const SITE =
	'O Boticario or Eudora (boticario.com.br, eudora.com.br, the beauty brands of Grupo Boticario; Brand picks the storefront), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const PAGE =
	"Costs 1 credit, 2 when the page needs a second route (credits_used says what was charged). Pages come from the site's own cache: prices can be up to about 15 minutes old. Failed upstream calls and refused inputs are not charged; a not-found is charged.";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID =
	"36 per page in 7 sorts, filtered by product brand, line, category, rating, price and any other facet: page, page_size, total, total_pages, has_more, count, sort, title, redirected_to, items (position, SKU for Get Product, Get Prices and Get Delivery and Pickup, name, product_brand, URL, slug, image, price (card price), pix_price (Pix is Brazil's instant payment), was_price, discount_percent, installments, badges, available, free_shipping, deal_ends_at, rating, review_count), facets (key, name, values; send back in Facets), price_ranges, filters_applied and notes.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as one value or an array, or undefined when empty. */
const LIST =
	'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length === 0 ? undefined : a.length === 1 ? a[0] : a; })() }}';

const ALL_OPS = [
	'search',
	'category',
	'categories',
	'deals',
	'promotions',
	'product',
	'prices',
	'reviews',
	'stores',
	'pickup',
	'suggestions',
];

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

const listOption = (displayName: string, name: string, key: string, description: string, placeholder = ''): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: LIST } } },
});

/** Sort, facet filters, price range and paging shared by Search Products, Get Category Products and Get Deals. */
const gridOptions = (prefix: string): INodeProperties[] => [
	listOption('Category', `${prefix}Category`, 'category', 'Category slug(s), comma-separated (facets key categoria)'),
	{
		displayName: 'Facets (JSON)',
		name: `${prefix}Facets`,
		type: 'json',
		default: '{}',
		description:
			'Any other facet the listing offers, by facets key, with a value or a list of values from facets values of an answer, e.g. {"familia-olfativa": "amadeirado"}',
		routing: {
			request: {
				body: {
					facets:
						'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
				},
			},
		},
	},
	listOption('Line', `${prefix}Line`, 'line', 'Product line slug(s), comma-separated (facets key linha)'),
	{
		displayName: 'Max Price (BRL)',
		name: `${prefix}MaxPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest price in BRL; 0 means no limit',
		routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Min Price (BRL)',
		name: `${prefix}MinPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest price in BRL; 0 means no limit',
		routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Min Rating',
		name: `${prefix}MinRating`,
		type: 'options',
		default: 0,
		options: [
			{ name: 'Any', value: 0 },
			{ name: '1 Star or More', value: 1 },
			{ name: '2 Stars or More', value: 2 },
			{ name: '3 Stars or More', value: 3 },
			{ name: '4 Stars or More', value: 4 },
			{ name: '5 Stars', value: 5 },
		],
		routing: { request: { body: { min_rating: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	pageOption(`${prefix}Page`, 100),
	listOption(
		'Product Brand',
		`${prefix}ProductBrand`,
		'product_brand',
		'Product brand slug(s) as the site writes them, comma-separated (facets key marca), e.g. egeo, floratta, lily',
		'egeo',
	),
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'Discount', value: 'discount' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Rating', value: 'rating' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

/** A product SKU, slug or link, sent as sku, slug or url. */
const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product (SKU, Slug or URL)',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'B01863',
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				sku: '={{ /^[A-Za-z]{0,3}\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
				slug: '={{ /^https?:/i.test(String($value).trim()) || /^[A-Za-z]{0,3}\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
			},
		},
	},
	description: 'A product SKU (e.g. B01863), a product slug (e.g. base-liquida-cor-330-make-b-mate-salicylic-30g) or a boticario.com.br / eudora.com.br product link.',
});

const cepField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'CEP',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '01310-100',
	displayOptions: show(operations),
	routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
	description: 'A Brazilian CEP (postal code, 8 digits)',
});

export const boticarioOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['boticario'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get boticario categories',
				description: `The ${SITE} category menu: departments (name, path, groups with links); every path works in Get Category Products. Captured 2026-11-27: O Boticario listed 30 departments. ${PAGE}`,
				routing: request('/api/v1/boticario/categories', PAGE_MS, true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get boticario category products',
				description: `One ${SITE} listing: a department, category or product-brand page by path or link, sorted and filtered like Search Products. Also path and URL. ${GRID} An unknown path is a charged not-found. Captured 2026-11-27: /perfumaria/ held 911 products over 26 pages. ${PAGE}`,
				routing: request('/api/v1/boticario/category', PAGE_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get boticario deals',
				description: `The ${SITE} deal listings: Beauty Week (the site's Black Friday event) or the promotions hub, optionally one section, sorted and filtered like Search Products; each item carries its own countdown end (deal_ends_at) and its deal badges. Also type, section, path and URL. ${GRID} Captured 2026-11-27: Beauty Week held 1216 items, the first a lipstick at 7.50 BRL (was 37.90, 80% off) with a countdown to 2026-11-28. ${PAGE}`,
				routing: request('/api/v1/boticario/deals', PAGE_MS, true),
			},
			{
				name: 'Get Delivery and Pickup',
				value: 'pickup',
				action: 'Get boticario delivery and pickup',
				description: `Delivery and pickup for one ${SITE} product at a Brazilian CEP: available, seller_id, delivery (type, description, expected_days, shipping_cost) and click_and_collect (whether the site offers pickup at a store near the CEP). Which store and per-store stock are not published. Captured 2026-11-27: B2022081233 to CEP 01310-100 had free normal delivery in 1 business day and store pickup offered. ${ONE}`,
				routing: request('/api/v1/boticario/pickup', FAST_MS),
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get boticario prices',
				description: `Current prices of up to 10 SKUs on ${SITE}, one SKU lookup per SKU: requested, count, found and items (SKU, found, name, slug, URL, product_brand, department, price, was_price, discount_percent, pix_price, installments, shade, presentation, image, seller). Unknown SKUs come back found false; if none is found, a charged not-found. Costs 1 credit per 5 SKUs (credits_used says what was charged); failed upstream calls and refused inputs are not charged. Captured 2026-11-27: 3 SKUs all found for 1 credit, B01863 at 59.90 BRL (was 99.90).`,
				routing: request('/api/v1/boticario/prices', FAST_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a boticario product',
				description: `One ${SITE} product by SKU, slug or link: SKU, name, product_brand, URL, slug, GTIN, image, price (card price), pix_price, pix_discount_percent, was_price, discount_percent, installments, price_text, availability, stock_units (the site's online stock count, as given), seller, categories, breadcrumbs, specs (the datasheet), product_group_id (for Get Reviews over every shade), varies_by, variants (every shade / size with price and availability), kit_components, kits_containing and review_summary (average_rating, count, histogram, recommend_percent and the site's own AI summary, as given). Per-store stock and loyalty prices are not published. An unknown product is a charged not-found. Captured 2026-11-27: B01863, the Base Liquida Cor 330 Make B. Mate Salicylic 30g, at 59.90 BRL (was 99.90) with 440 units in online stock, rated 4.88 from 3860 reviews. ${PAGE}`,
				routing: request('/api/v1/boticario/product', PAGE_MS),
			},
			{
				name: 'Get Promotion Conditions',
				value: 'promotions',
				action: 'Get boticario promotion conditions',
				description: `The promotions conditions page of ${SITE}: URL, valid_from, valid_to and campaigns (name, section, valid_from, valid_to, coupons), each campaign's validity dates and coupon codes as written on the page. Captured 2026-11-27: O Boticario listed 19 campaigns from 2026-11-03. ${PAGE}`,
				routing: request('/api/v1/boticario/promotions', PAGE_MS, true),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get boticario reviews',
				description: `Reviews of one ${SITE} product, by SKU (that shade) or by product_group_id (every shade together): product_id, sort, stars, page, page_size, total, total_pages, has_more, count and reviews (review_id, rating, text, created_at, modified_at, most_useful, upvotes, downvotes, reviewer_state, reviewer_type, SKU, product_name, variant, photo_count). Up to 50 per page. No reviewer names, cities or gender. Captured 2026-11-27: B2022081233 had 43 reviews. ${ONE}`,
				routing: request('/api/v1/boticario/reviews', FAST_MS),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get boticario search suggestions',
				description: `The ${SITE} search suggestions: query, count, terms (term, departments) and up to 5 products (SKU, name, slug, URL, product_brand, department, price, was_price, discount_percent, pix_price, installments, shade, presentation, image, seller). A SKU works as the query too. Captured 2026-11-27: perfume suggested 5 terms and 5 products. ${ONE}`,
				routing: request('/api/v1/boticario/suggestions', FAST_MS),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get boticario stores',
				description: `The ${SITE} stores that offer pickup of online orders near a Brazilian CEP, nearest first: cep, radius_km, total, total_pages, has_more, count and stores (store_id, name, pickup_time, distance_m, distance_km, weekday and weekend hours, address). Store stock and prices are not published. Captured 2026-11-27: CEP 01310-100 had 348 pickup stores, the nearest 55 m away. ${ONE}`,
				routing: request('/api/v1/boticario/stores', FAST_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search boticario products',
				description: `${SITE} keyword search. ${GRID} A keyword the site sends to a category landing (Eudora does this for broad terms) is followed as the site does it (redirected_to). Captured 2026-11-27: perfume on O Boticario gave 1823 results, the first the Combo Lily Le Parfum at 434.80 BRL by card or 391.32 BRL by Pix, rated 4.98 from 43 reviews. ${PAGE}`,
				routing: request('/api/v1/boticario/search', PAGE_MS),
			},
		],
		default: 'search',
	},
];

export const boticarioFields: INodeProperties[] = [
	{
		displayName: 'Brand',
		name: 'boticarioBrand',
		type: 'options',
		default: 'boticario',
		options: [
			{ name: 'Eudora', value: 'eudora' },
			{ name: 'O Boticario', value: 'boticario' },
		],
		displayOptions: show(ALL_OPS),
		description: 'The storefront: O Boticario (www.boticario.com.br) or Eudora (www.eudora.com.br)',
		routing: { request: { body: { brand: '={{ $value === "boticario" ? undefined : $value }}' } } },
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'boticarioQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'perfume',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'boticarioSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('boticarioSearch')),
	},

	// -- Get Category Products --
	{
		displayName: 'Path',
		name: 'boticarioPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/perfumaria/',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description:
			'A listing path or link: a department (/perfumaria/), a category (/maquiagem/boca/batom/), a product brand (/egeo/) or a path from Get Categories',
	},
	{
		displayName: 'Additional Options',
		name: 'boticarioCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(gridOptions('boticarioCategory')),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'boticarioDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Deal Type',
				name: 'boticarioDealsType',
				type: 'options',
				default: 'beauty_week',
				options: [
					{ name: 'Beauty Week (Black Friday)', value: 'beauty_week' },
					{ name: 'Promotions Hub', value: 'promotions' },
				],
				routing: { request: { body: { type: '={{ $value === "beauty_week" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Section',
				name: 'boticarioDealsSection',
				type: 'string',
				default: '',
				placeholder: 'perfumaria',
				description:
					"Optional sub-page as the site's links write it: a department (perfumaria, maquiagem, cabelos) or a promotion (menor-preco-do-mes, leve-x-pague-y, desconto-progressivo, cashback)",
				routing: { request: { body: { section: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('boticarioDeals'),
		]),
	},

	// -- Get Product, Get Delivery and Pickup --
	productField('boticarioProduct', ['product', 'pickup']),
	cepField('boticarioPickupCep', ['pickup']),

	// -- Get Prices --
	{
		displayName: 'SKUs',
		name: 'boticarioSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'B01863, B48734, B2022081233',
		displayOptions: show(['prices']),
		routing: { request: { body: { skus: '={{ String($value).trim() }}' } } },
		description: '1 to 10 SKUs, comma-separated; 1 credit per 5 SKUs',
	},

	// -- Get Reviews --
	{
		displayName: 'Product ID',
		name: 'boticarioReviewsProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'B2022081233',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: "A SKU (that shade's reviews) or the product_group_id from Get Product (every shade together)",
	},
	{
		displayName: 'Additional Options',
		name: 'boticarioReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			pageOption('boticarioReviewsPage', 1000),
			pageSizeOption('boticarioReviewsPageSize', 50, 20, 'Reviews'),
			{
				displayName: 'Sort',
				name: 'boticarioReviewsSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: "Default (Site's Order)", value: 'default' },
					{ name: 'Most Recent', value: 'most_recent' },
					{ name: 'Most Useful', value: 'most_useful' },
					{ name: 'Oldest', value: 'oldest' },
				],
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'boticarioReviewsStars',
				type: 'options',
				default: 0,
				options: [
					{ name: 'All', value: 0 },
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this many stars',
				routing: { request: { body: { stars: '={{ $value > 0 ? $value : undefined }}' } } },
			},
		]),
	},

	// -- Get Stores --
	cepField('boticarioStoresCep', ['stores']),
	{
		displayName: 'Additional Options',
		name: 'boticarioStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			pageOption('boticarioStoresPage', 100),
			pageSizeOption('boticarioStoresPageSize', 50, 20, 'Stores'),
			{
				displayName: 'Radius (Km)',
				name: 'boticarioStoresRadius',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100 },
				description: 'Radius around the CEP in km, 1 to 100; 0 means no radius',
				routing: { request: { body: { radius_km: '={{ $value > 0 ? $value : undefined }}' } } },
			},
		]),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'boticarioSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'perfume',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper types; a SKU works too (1 to 100 characters)',
	},
];
