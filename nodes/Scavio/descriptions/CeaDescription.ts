import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['cea'], operation, ...extra },
});

// C&A Brasil (cea.com.br, the Brazilian arm of the C&A fashion chain), 11 operations, 1 credit each; credits_used is
// the truth. Brazil only, BRL. Listings usually take 5 to 100 s and carry a 300s timeout; reviews take 2 to 20 s, the
// others 2 to 15 s, and carry 180s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;
const FAST_MS = 180000;

const SITE =
	'C&A Brasil (cea.com.br, the Brazilian arm of the C&A fashion chain), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const SIZES =
	"sizes (sku, size, color, available, available_quantity as the site's capped online figure: a round 100, 10000 or 99999 means plenty, 0 none, not a store's units; price, list_price, discount_percent, pix_price)";
const GRID = `Returns page, page_size, total, total_pages (the site pages at most 50 pages deep), has_more, count, sort, items (product_id for Get Product, name, brand, labels as the site's Marcas values, reference, URL, image, available, price as the lowest price among the sizes in stock, list_price, discount_percent, pix_price as the Pix price (Pix is Brazil's instant payment), best_installment, colors, ${SIZES}, categories, collection_ids as the promotion collections the product is in, release_date) and notes. No results is an empty answer.`;

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const ID = '={{ String($value).trim() || undefined }}';

/** Page, page size and sort shared by every listing. */
const gridOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 50 },
		description: 'Results page, 1 to 50 (the site pages at most 50 pages deep)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Page Size',
		name: `${prefix}PageSize`,
		type: 'number',
		default: 24,
		typeOptions: { minValue: 1, maxValue: 24 },
		description: 'Products per page, 1 to 24',
		routing: { request: { body: { page_size: '={{ $value !== 24 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		description: "The site's sorts",
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'Discount', value: 'discount' },
			{ name: 'Name: A to Z', value: 'name_asc' },
			{ name: 'Name: Z to A', value: 'name_desc' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const listingOptions = (name: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: gridOptions(name),
});

const CATEGORY_HELP =
	'A category path of 1 to 3 levels (path of Get Categories: department, category, subcategory), e.g. moda-feminina, moda-feminina/roupas, moda-feminina/roupas/blusas, or its cea.com.br link';
const BRAND_HELP =
	"A brand as the site's Marcas filter writes it (Get Facets, key marcas), e.g. palomino, clock-house, yessica, angelo-litrico, or a partner brand";

const cepField = (name: string, operation: string, description: string): INodeProperties => ({
	displayName: 'CEP',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '01310-100',
	displayOptions: show([operation]),
	routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
	description,
});

export const ceaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['cea'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get c and a brasil brand products',
				description: `One brand's products on ${SITE}, by the brand value of the site's Marcas filter (C&A's own labels such as Palomino, Clock House, Yessica, Angelo Litrico, and partner brands), sorted like search. ${GRID} Also brand. Captured 2026-11-27: palomino held 20216 products. ${ONE}`,
				routing: request('/api/v1/cea/brand', SLOW_MS),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get the c and a brasil department tree',
				description: `The department tree of ${SITE}: count, node_count and categories (category_id, name, path, URL, children) over three levels. Use path as Category in Get Category Products and Get Facets. Captured 2026-11-27: 8 departments, 363 nodes. ${ONE}`,
				routing: request('/api/v1/cea/categories', FAST_MS, true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get c and a brasil category products',
				description: `One department, category or subcategory listing of ${SITE}, by category path, sorted like search. ${GRID} Also category and URL. Captured 2026-11-27: moda-feminina/roupas held 93575 products. ${ONE}`,
				routing: request('/api/v1/cea/category', SLOW_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get c and a brasil promotion collection products',
				description: `One promotion collection of ${SITE}, by collection ID (collection_ids of a listing, e.g. a Black Friday or free-shipping collection), with list price, sale price and discount_percent; the Discount sort puts the deepest discounts first. ${GRID} Also collection_id. Collections are given by ID only. Captured 2026-11-27: collection 19727 sorted by discount held 1302 products, the first a skirt at 39.99 BRL (list 139.99, 71% off). ${ONE}`,
				routing: request('/api/v1/cea/deals', SLOW_MS),
			},
			{
				name: 'Get Facets',
				value: 'facets',
				action: 'Get c and a brasil filter values',
				description: `The filter values of ${SITE} for a query, or one category, brand or collection: count and facets (key, label, param, values with value, label, count and selected, or price ranges) for department, category, subcategory, type, gender, size, color, Marcas, material, price range and more, with product counts. param names the request field a value goes back into: category values make a category path, marcas values go into Brand. Send a query, and at most one of Category, Brand or Collection ID. Captured 2026-11-27: vestido returned 13 facets. ${ONE}`,
				routing: request('/api/v1/cea/facets', FAST_MS, true),
			},
			{
				name: 'Get Pickup Points',
				value: 'stores',
				action: 'Get c and a brasil pickup points near a cep',
				description: `The pickup points near a CEP on ${SITE}, nearest first: cep, total (the site's count of pickup entries near the CEP, of which the nearest are listed), count and stores (store_code, pickup_point_ids, name, type as cea_store or partner_point, partner, active, distance_km, address, latitude, longitude, phone, opening hours). The list includes third-party pickup lockers and counters (Clique Retire) next to the C&A stores. Which of them can hand a given size over: Get Shipping. Captured 2026-11-27: CEP 01310-100 listed 18 pickup points, 17 C&A stores and 1 Clique Retire point. ${ONE}`,
				routing: request('/api/v1/cea/stores', FAST_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a c and a brasil product',
				description: `One product of ${SITE} by product ID, size SKU, slug or link: product_id, name, brand, labels, reference, model_id, URL, images, available, price, list_price, discount_percent, pix_price, best_installment, installments (each payment method's longest plan, e.g. C&A Pay), colors, ${SIZES} with each size's seller, categories, specifications (material, fit, sleeve, made in...), collection_ids and release_date. The reviews and the rating summary come from Get Reviews. Not available: marketing description, EAN (the site leaves it empty), Q&A, store units, price history. An unknown product is a charged not-found. Captured 2026-11-27: an oversized cotton t-shirt at 99.99 BRL in 5 sizes, payable in 3 interest-free C&A Pay installments of 33.33. ${ONE}`,
				routing: request('/api/v1/cea/product', FAST_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get c and a brasil product reviews',
				description: `The customer reviews of one product of ${SITE}, by product ID, as the product page shows them: product_id, page, per_page, sort, filter, rating_filter, total (the reviews matching the request, from the rating summary), has_more, count, product_name, rating (average, count, histogram per star), review_counts (total, positive as ratings 3 to 5, negative as ratings 1 to 2, with_photos), reviews (ID, rating, title, text, date, purchase_date as the date of the order the review is linked to, recommends, helpful_votes, unhelpful_votes, photos, attributes as the store's follow-up questions such as size, fit and height, store_reply, imported, influencer, purchased as the size SKU, size and colour bought where the review carries it) and notes. Sorted newest (default) or most helpful; filtered positive (ratings 3 to 5), negative (ratings 1 to 2) or with photos, or one star rating (one or the other); up to 100 per page. Reviews can lag the product page by up to 4 hours. Review text is the customer's own; reviewer names are never returned. No questions and answers. A product ID the reviews do not know answers with no reviews (count 0, charged), or a charged not-found. Captured 2026-11-28: a white low-top sneaker rated 4.5 from 1189 reviews, 854 of them five-star. ${ONE}`,
				routing: request('/api/v1/cea/reviews', FAST_MS),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get c and a brasil search suggestions',
				description: `The search box of ${SITE}: for the start of a search, suggestions (term, count, and for some the department or category they point to) and top_searches (term, count); with no query, the top searches alone. Captured 2026-11-27: the top search was vestido, searched 190040 times. ${ONE}`,
				routing: request('/api/v1/cea/suggestions', FAST_MS, true),
			},
			{
				name: 'Get Shipping',
				value: 'shipping',
				action: 'Get a c and a brasil delivery quote',
				description: `The delivery quote of ${SITE} for one size (SKU) and a CEP, as the product page gives it: availability, price, list_price, can_deliver, can_pick_up, delivery_options (name, price with 0 = free, list_price before a shipping promotion, estimate, business_days, estimated_date), pickup_stores (the stores near the CEP that can hand this size over, nearest first, with distance_km, address, price and estimate) and messages (e.g. the site's cannot-be-delivered notice). The quote is for 1 unit; nothing is added to a cart or ordered. An unknown SKU is a charged not-found. Captured 2026-11-27: free delivery to CEP 01310-100 in 6 business days, and 5 nearby stores could hand the size over. ${ONE}`,
				routing: request('/api/v1/cea/shipping', FAST_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search c and a brasil products',
				description: `Search ${SITE} by keyword, in the site's sorts (price, best sellers, newest, discount, name), up to 24 per page. ${GRID} Also query. Captured 2026-11-27: vestido matched 13549 products, the first a midi dress at 219.99 BRL (list 239.99). ${ONE}`,
				routing: request('/api/v1/cea/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const ceaFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'ceaQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vestido',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese (1 to 100 characters)',
	},
	listingOptions('ceaSearchOptions', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'ceaCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'moda-feminina/roupas',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: CATEGORY_HELP,
	},
	listingOptions('ceaCategoryOptions', 'category'),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'ceaBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'palomino',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: BRAND_HELP,
	},
	listingOptions('ceaBrandOptions', 'brand'),

	// -- Get Deals --
	{
		displayName: 'Collection ID',
		name: 'ceaCollectionId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '19727',
		displayOptions: show(['deals']),
		routing: { request: { body: { collection_id: '={{ String($value).trim() }}' } } },
		description: 'A promotion collection ID (collection_ids of a listing)',
	},
	listingOptions('ceaDealsOptions', 'deals'),

	// -- Get Facets --
	{
		displayName: 'Query',
		name: 'ceaFacetsQuery',
		type: 'string',
		default: '',
		placeholder: 'jeans',
		displayOptions: show(['facets']),
		routing: { request: { body: { query: ID } } },
		description: 'Search keywords; or leave empty and give one of Category, Brand or Collection ID',
	},
	{
		displayName: 'Additional Options',
		name: 'ceaFacetsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['facets']),
		description: 'At most one of Brand, Category or Collection ID',
		options: sorted([
			{
				displayName: 'Brand',
				name: 'ceaFacetsBrand',
				type: 'string',
				default: '',
				placeholder: 'palomino',
				description: BRAND_HELP,
				routing: { request: { body: { brand: ID } } },
			},
			{
				displayName: 'Category',
				name: 'ceaFacetsCategory',
				type: 'string',
				default: '',
				placeholder: 'moda-feminina/roupas',
				description: CATEGORY_HELP,
				routing: { request: { body: { category: ID } } },
			},
			{
				displayName: 'Collection ID',
				name: 'ceaFacetsCollectionId',
				type: 'string',
				default: '',
				placeholder: '19727',
				description: 'A promotion collection ID (collection_ids of a listing)',
				routing: { request: { body: { collection_id: ID } } },
			},
		]),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'ceaSuggestionsQuery',
		type: 'string',
		default: '',
		placeholder: 'jaq',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: ID } } },
		description: 'The start of a search; leave empty for the top searches alone',
	},

	// -- Get Product --
	{
		displayName: 'Look Up By',
		name: 'ceaProductBy',
		type: 'options',
		default: 'product_id',
		options: [
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'Size SKU', value: 'sku' },
			{ name: 'Slug', value: 'slug' },
			{ name: 'URL', value: 'url' },
		],
		displayOptions: show(['product']),
	},
	{
		displayName: 'Product',
		name: 'ceaProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4536055',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_id: '={{ $parameter["ceaProductBy"] === "product_id" ? String($value).trim() : undefined }}',
					sku: '={{ $parameter["ceaProductBy"] === "sku" ? String($value).trim() : undefined }}',
					slug: '={{ $parameter["ceaProductBy"] === "slug" ? String($value).trim() : undefined }}',
					url: '={{ $parameter["ceaProductBy"] === "url" ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'The product ID (product_id of a listing), the SKU of one size (sizes sku), the product slug (the link path before /p) or a cea.com.br product link, as chosen in Look Up By',
	},

	// -- Get Reviews --
	{
		displayName: 'Product ID',
		name: 'ceaReviewsProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3700395',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: 'The product ID (product_id of a listing or of Get Product), not a size SKU or the reference',
	},
	{
		displayName: 'Additional Options',
		name: 'ceaReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Filter',
				name: 'ceaReviewsFilter',
				type: 'options',
				default: 'all',
				description: 'Positive is ratings 3 to 5, negative ratings 1 to 2. Not combined with Star Rating.',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Negative', value: 'negative' },
					{ name: 'Positive', value: 'positive' },
					{ name: 'With Photos', value: 'with_photos' },
				],
				routing: { request: { body: { filter: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'ceaReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Reviews page, 1 to 200',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Reviews Per Page',
				name: 'ceaReviewsPerPage',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews per page, 1 to 100',
				routing: { request: { body: { per_page: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'ceaReviewsSort',
				type: 'options',
				default: 'newest',
				description: 'Newest first, or the most helpful votes at the top',
				options: [
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
				],
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'ceaReviewsRating',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'Only reviews with this many stars, 1 to 5 (0 for every rating). Not combined with Filter.',
				routing: { request: { body: { rating: '={{ $value > 0 ? $value : undefined }}' } } },
			},
		],
	},

	// -- Get Shipping --
	{
		displayName: 'SKU',
		name: 'ceaShippingSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6493983',
		displayOptions: show(['shipping']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'The ID of one size (sizes sku from Get Product or a listing)',
	},
	cepField('ceaShippingCep', 'shipping', 'The Brazilian CEP (postal code, 8 digits) to deliver to'),

	// -- Get Pickup Points --
	cepField('ceaStoresCep', 'stores', 'The Brazilian CEP (postal code, 8 digits) to list the pickup points near'),
];
