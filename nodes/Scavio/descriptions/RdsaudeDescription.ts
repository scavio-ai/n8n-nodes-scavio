import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rdsaude'], operation, ...extra },
});

// Drogasil and Droga Raia (drogasil.com.br, drogaraia.com.br, the pharmacy chains of RD Saude), 11 operations, 1 credit
// each; credits_used is the truth. Brazil only, BRL. Most calls take 2 to 15 s, the menu and the store locator up to
// 35 s; every operation carries a 180s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 180000 },
});

const SITE =
	'Drogasil and Droga Raia (drogasil.com.br and drogaraia.com.br, the pharmacy chains of RD Saude), Brazil only, Portuguese text';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	"Prices in BRL are the site's default online price (a reference price, not a per-store price).";
const GRID =
	'sort, page, page_size, total, total_pages, reachable_pages, has_more, count, items (position, SKU for Get Product, EAN, name, brand, manufacturer, URL, image, type, status, in_stock, price, list_price, discount_percent, price_type, quantity_discount, index_price, labels, categories, quantity, variant_count, is_kit, sold_by, delivered_by, regulatory flags exactly as the site gives them), facets (name, values with counts; send back in Facets) and filters_applied.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as an array, or undefined when empty. */
const list = '={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length ? a : undefined; })() }}';

const ALL_OPS = [
	'search',
	'category',
	'categories',
	'product',
	'prices',
	'storeAvailability',
	'stores',
	'storesSearch',
	'reviews',
	'deals',
	'suggestions',
];

const pageOption = (name: string, max: number): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description: 'Page, 1-based',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

/** Sort, page and page size shared by Search Products, Get Category Products and Get Deals. */
const gridOptions = (prefix: string): INodeProperties[] => [
	pageOption(`${prefix}Page`, 100),
	{
		displayName: 'Page Size',
		name: `${prefix}PageSize`,
		type: 'options',
		default: 24,
		options: [
			{ name: '24', value: 24 },
			{ name: '36', value: 36 },
			{ name: '48', value: 48 },
		],
		description: "The site's own page sizes",
		routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: "The price sort uses the search index's price, which can differ from the live price",
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const brandOption = (name: string): INodeProperties => ({
	displayName: 'Brand',
	name,
	type: 'string',
	default: '',
	placeholder: 'Neutrogena',
	description: 'A brand as the filters.Marca facet lists it',
	routing: { request: { body: { brand: '={{ String($value).trim() || undefined }}' } } },
});

const categoryIdOption = (name: string): INodeProperties => ({
	displayName: 'Category ID',
	name,
	type: 'string',
	default: '',
	description: 'Products of this category (ID from Get Categories)',
	routing: { request: { body: { category_id: '={{ String($value).trim() || undefined }}' } } },
});

/** Brand, seller, highlight, pickup store, price range and facets shared by Search Products and Get Category Products. */
const filterOptions = (prefix: string): INodeProperties[] => [
	brandOption(`${prefix}Brand`),
	{
		displayName: 'Facets (JSON)',
		name: `${prefix}Facets`,
		type: 'json',
		default: '{}',
		description:
			'Other filters, at most 8: {facet name: value} exactly as facets name and values of an answer list them, e.g. {"filters.Marca": "Nivea"}',
		routing: {
			request: {
				body: {
					facets:
						'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
				},
			},
		},
	},
	{
		displayName: 'Highlight',
		name: `${prefix}Highlight`,
		type: 'string',
		default: '',
		placeholder: 'Oferta do Dia',
		description: 'A highlight as the filters.Destaques facet lists it: Oferta do Dia, % Especial, Black Friday, a coupon such as Cupom NIVEABRAND',
		routing: { request: { body: { highlight: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Max Price (BRL)',
		name: `${prefix}MaxPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest index price in BRL; 0 means no limit',
		routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Min Price (BRL)',
		name: `${prefix}MinPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest index price in BRL; 0 means no limit',
		routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Pickup Store ID',
		name: `${prefix}StoreId`,
		type: 'string',
		default: '',
		description: 'Products offered for pickup at this store (store_id from Get Stores)',
		routing: { request: { body: { store_id: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Seller',
		name: `${prefix}Seller`,
		type: 'options',
		default: 'any',
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Marketplace Partners', value: 'partner' },
			{ name: 'Drogasil / Droga Raia', value: 'own' },
		],
		routing: { request: { body: { seller: '={{ $value === "any" ? undefined : $value }}' } } },
	},
];

export const rdsaudeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rdsaude'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get rdsaude categories',
				description: `The ${SITE} menu tree, three levels: department_count, category_count and categories (ID for Get Category Products, name, URL, level, children). Category IDs differ per banner. Captured 2026-11-27: Droga Raia listed 9 departments and 379 categories. ${ONE}`,
				routing: request('/api/v1/rdsaude/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get rdsaude category products',
				description: `One ${SITE} category by ID or category page link, sorted and filtered like Search Products: category_id, name, URL and ${GRID} ${PRICES} An unknown or empty category is a charged not-found. Captured 2026-11-27: a Droga Raia sunscreen category held 353 products. ${ONE}`,
				routing: request('/api/v1/rdsaude/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get rdsaude deals',
				description: `The ${SITE} deals: Oferta do Dia, % Especial, Black Friday, or coupons (the running coupons with code, label and count, or with Coupon that coupon's products), by brand or category: ${GRID} ${PRICES} The site gives no start or end dates for deals. Captured 2026-11-27: the Droga Raia coupon NIVEABRAND covered 195 products. ${ONE}`,
				routing: request('/api/v1/rdsaude/deals'),
			},
			{
				name: 'Get Prices',
				value: 'prices',
				action: 'Get rdsaude prices',
				description: `Current prices of up to 48 ${SITE} products in one call: requested, found and items (SKU, found, name, in_stock, price, list_price, discount_percent, price_type, quantity_discount, variant_count). ${PRICES} Captured 2026-11-27: 3 Drogasil codes, all found. ${ONE}`,
				routing: request('/api/v1/rdsaude/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an rdsaude product',
				description: `One ${SITE} product by SKU or page link: name, URL, EAN, brand, manufacturer, breadcrumb, images, labels, in_stock, price, list_price, discount_percent, price_ladder (offers, quantity discount, lab program, payment discounts, as given), quantity, dosage, weight_kg, refrigerated, regulatory flags (as given), seller (the marketplace business name), variants and kit. ${PRICES} No descriptions or package-insert text. An unknown product is a charged not-found. Captured 2026-11-27: the Kit Nivea Sun Protect & Hidrata FPS 50 on Drogasil at 43.99 BRL (list 72.99). ${ONE}`,
				routing: request('/api/v1/rdsaude/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get rdsaude reviews',
				description: `Customer reviews of one ${SITE} product, up to 50 a page, filtered by stars: total, average_rating, recommended_by, rating_distribution, the site's own summary, tags and use cases (as given), reviews (review_id, rating, text, date, verified, incentivized, helpful, unhelpful, replies) and next_cursor. No reviewer names. Each banner has its own reviews. Captured 2026-11-27: an Episol sunscreen powder on Droga Raia averaged 4.82 from 164 reviews. ${ONE}`,
				routing: request('/api/v1/rdsaude/reviews'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get rdsaude store availability',
				description: `Store pickup availability at ${SITE} for products (codes or EANs) at stores, up to 5 product x store checks per call: skus (code, code_type, SKU, name, stores with store_id and pickup_available). A yes / no from the site's own store-pickup filter: no unit counts, and the price is the same at every store. Captured 2026-11-27: one product available for pickup at 2 Droga Raia stores. ${ONE}`,
				routing: request('/api/v1/rdsaude/store-availability'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get rdsaude stores near a CEP',
				description: `The nearest stores (up to 6) of one ${SITE} banner to a Brazilian CEP (postal code): stores (store_id, banner, name, address, latitude, longitude, distance_km, phone, open_24h, parking, farmacia_popular, hours). An empty list: no store of that banner near the CEP. Captured 2026-11-27: CEP 01310-100 listed 6 Drogasil stores. ${ONE}`,
				routing: request('/api/v1/rdsaude/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get rdsaude suggestions',
				description: `The ${SITE} search box suggestions for what has been typed: suggestions, quick_filters and product_count. Captured 2026-11-27: shamp on Droga Raia gave 8 suggestions. ${ONE}`,
				routing: request('/api/v1/rdsaude/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search rdsaude products',
				description: `${SITE} search by keyword, product code or EAN, sorted by relevance or price and filtered by brand, own or partner store, highlight, pickup store, a price range and any facet; 24, 36 or 48 a page: query, ${GRID} ${PRICES} The site's search reaches about 2016 results by relevance and about 1008 sorted by price. Captured 2026-11-27: protetor solar on Drogasil gave 5583 results, the first at 84.99 BRL. ${ONE}`,
				routing: request('/api/v1/rdsaude/search'),
			},
			{
				name: 'Search Stores',
				value: 'storesSearch',
				action: 'Search rdsaude stores',
				description: `The ${SITE} store locator (about 4,000 stores across the two banners) by state, city, neighborhood or free text, filtered by open 24 hours, parking and Farmacia Popular, up to 50 a page: total, total_pages and stores (store_id, banner, name, address, latitude, longitude, phone, open_24h, parking, farmacia_popular, hours). Captured 2026-11-27: a Droga Raia city search listed 48 stores. ${ONE}`,
				routing: request('/api/v1/rdsaude/stores/search'),
			},
		],
		default: 'search',
	},
];

export const rdsaudeFields: INodeProperties[] = [
	{
		displayName: 'Site',
		name: 'rdsaudeSite',
		type: 'options',
		default: 'drogasil',
		options: [
			{ name: 'Droga Raia', value: 'drogaraia' },
			{ name: 'Drogasil', value: 'drogasil' },
		],
		displayOptions: show(ALL_OPS),
		description: 'The banner: prices, category IDs, stores and reviews differ per banner',
		routing: { request: { body: { site: '={{ $value === "drogasil" ? undefined : $value }}' } } },
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'rdsaudeQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'protetor solar',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords, a product code or an EAN, in Portuguese as shoppers type them',
	},
	{
		displayName: 'Additional Options',
		name: 'rdsaudeSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([...gridOptions('rdsaudeSearch'), ...filterOptions('rdsaudeSearch'), categoryIdOption('rdsaudeSearchCategoryId')]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID or URL',
		name: 'rdsaudeCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8222',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					category_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A category ID (from Get Categories) or a category page link on either site (its host sets the site)',
	},
	{
		displayName: 'Additional Options',
		name: 'rdsaudeCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([...gridOptions('rdsaudeCategory'), ...filterOptions('rdsaudeCategory')]),
	},

	// -- Get Product --
	{
		displayName: 'SKU or URL',
		name: 'rdsaudeProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '72654',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A product code (SKU from another answer) or a product page link on either site (its host sets the site)',
	},

	// -- Get Prices --
	{
		displayName: 'SKUs',
		name: 'rdsaudeSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '72654, 38155',
		displayOptions: show(['prices']),
		routing: { request: { body: { skus: list } } },
		description: '1 to 48 product codes, comma-separated',
	},

	// -- Get Store Availability --
	{
		displayName: 'SKUs or EANs',
		name: 'rdsaudeAvailabilitySkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '38155',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { skus: list } } },
		description: 'Product codes or EANs, comma-separated. At most 5 product x store checks per call.',
	},
	{
		displayName: 'Store IDs',
		name: 'rdsaudeAvailabilityStoreIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '200, 210',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { store_ids: list } } },
		description: 'Store IDs (store_id from Get Stores or Search Stores), comma-separated',
	},

	// -- Get Stores --
	{
		displayName: 'CEP',
		name: 'rdsaudeCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['stores']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'A Brazilian CEP (postal code, 8 digits)',
	},

	// -- Search Stores --
	{
		displayName: 'Additional Options',
		name: 'rdsaudeStoresSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storesSearch']),
		options: sorted([
			{
				displayName: 'City',
				name: 'rdsaudeStoresCity',
				type: 'string',
				default: '',
				placeholder: 'Porto Alegre',
				description: 'A city (needs State)',
				routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Farmacia Popular Only',
				name: 'rdsaudeStoresFarmaciaPopular',
				type: 'boolean',
				default: false,
				description: 'Whether to list only stores in the Farmacia Popular program',
				routing: { request: { body: { farmacia_popular: '={{ $value ? true : undefined }}' } } },
			},
			{
				displayName: 'Neighborhood',
				name: 'rdsaudeStoresNeighborhood',
				type: 'string',
				default: '',
				description: 'A neighborhood (needs State and City)',
				routing: { request: { body: { neighborhood: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Open 24 Hours Only',
				name: 'rdsaudeStoresOpen24h',
				type: 'boolean',
				default: false,
				description: 'Whether to list only stores open 24 hours',
				routing: { request: { body: { open_24h: '={{ $value ? true : undefined }}' } } },
			},
			pageOption('rdsaudeStoresPage', 300),
			{
				displayName: 'Page Size',
				name: 'rdsaudeStoresPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Stores per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Parking Only',
				name: 'rdsaudeStoresParking',
				type: 'boolean',
				default: false,
				description: 'Whether to list only stores with parking',
				routing: { request: { body: { parking: '={{ $value ? true : undefined }}' } } },
			},
			{
				displayName: 'Query',
				name: 'rdsaudeStoresQuery',
				type: 'string',
				default: '',
				description: "The locator's free-text search (fuzzy)",
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'rdsaudeStoresState',
				type: 'string',
				default: '',
				placeholder: 'RS',
				description: 'A state: UF code (SP, RJ, RS) or name',
				routing: { request: { body: { state: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},

	// -- Get Reviews --
	{
		displayName: 'SKU',
		name: 'rdsaudeReviewsSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '38155',
		displayOptions: show(['reviews']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'A product code (SKU from another answer)',
	},
	{
		displayName: 'Additional Options',
		name: 'rdsaudeReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Cursor',
				name: 'rdsaudeReviewsCursor',
				type: 'string',
				default: '',
				description: 'Next_cursor of the previous page',
				routing: { request: { body: { cursor: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'rdsaudeReviewsPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'rdsaudeReviewsRating',
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
				routing: { request: { body: { rating: '={{ $value > 0 ? $value : undefined }}' } } },
			},
		]),
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'rdsaudeDealType',
		type: 'options',
		default: 'oferta_do_dia',
		options: [
			{ name: '% Especial', value: 'especial' },
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Coupons', value: 'coupons' },
			{ name: 'Oferta Do Dia', value: 'oferta_do_dia' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "oferta_do_dia" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Coupon Code',
		name: 'rdsaudeDealCoupon',
		type: 'string',
		default: '',
		placeholder: 'NIVEABRAND',
		displayOptions: show(['deals'], { rdsaudeDealType: ['coupons'] }),
		routing: { request: { body: { coupon: '={{ String($value).trim() || undefined }}' } } },
		description: 'A coupon code for its products. Leave empty for the running coupons.',
	},
	{
		displayName: 'Additional Options',
		name: 'rdsaudeDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([...gridOptions('rdsaudeDeals'), brandOption('rdsaudeDealsBrand'), categoryIdOption('rdsaudeDealsCategoryId')]),
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'rdsaudeSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'shamp',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What has been typed so far',
	},
];
