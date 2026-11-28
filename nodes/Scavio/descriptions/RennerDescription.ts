import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['renner'], operation, ...extra },
});

// Lojas Renner (lojasrenner.com.br, the Brazilian fashion retailer), 7 operations, 1 credit each; credits_used is the
// truth. Brazil only, BRL. Listings are slow at the source (usually 30 to 200 s) and carry a 300s timeout; product,
// SKU price and stores take 5 to 30 s, reviews 2 to 20 s, and carry 240s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const LIST_MS = 300000;
const FAST_MS = 240000;

const SITE =
	'Lojas Renner (lojasrenner.com.br, the Brazilian fashion retailer), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID = `48 per page, pages 1 to 200, in the site's sorts, filtered by refinement IDs: category, sold by (Lojas Renner or its partner stores), brand, size, colour, gender and the states with stock. Returns page, page_size, total, total_pages, has_more, count, items (product_id for Get Product, name, brand, URL, image, color, default_sku, price, list_price, discount_percent, on_sale, installment, stock_level as the unit count the site lists for the product, stock_status, sold_last_15_days, marketplace, seller as Lojas Renner or a partner store, gender, categories, colors, sizes), refinements (name, label, multi_select, values with label, count and the filter ID), applied, search_terms, sort, filters_applied and notes.`;
const INSTALLMENTS =
	'installments (store_card as the Cartao Renner plan, credit_card as the plan for other cards)';
const FLAGS =
	'available, purchasable, out_of_stock, omni_stock, back_order, pre_order, pre_launch, discontinued, max_quantity';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as one value or an array, or undefined when empty. */
const LIST_VALUE =
	'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length === 0 ? undefined : a.length === 1 ? a[0] : a; })() }}';

/** Filters, page and sort shared by every listing. */
const gridOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Filters',
		name: `${prefix}Filters`,
		type: 'string',
		default: '',
		placeholder: 'xv9uau',
		description:
			'Refinement ID(s) from a listing (refinements values filter), comma-separated, up to 10: category, sold by, brand, size, colour, gender or region',
		routing: { request: { body: { filters: LIST_VALUE } } },
	},
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: 'Results page, 1 to 200 (48 per page)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		description: "The site's sorts",
		options: [
			{ name: 'Best Selling', value: 'best_selling' },
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

const listingOptions = (name: string, operation: string, extra: INodeProperties[] = []): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...gridOptions(name), ...extra]),
});

const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '931758127',
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description: 'The Lojas Renner product ID (product_id of a listing) or a lojasrenner.com.br product link',
});

export const rennerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['renner'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get lojas renner category products',
				description: `One category listing of ${SITE}, by navigation ID (4zo6za is Feminino) or a /c/ link, sorted and filtered like search. ${GRID} Also category. An unknown category is a charged not-found. Captured 2026-11-27: 4zo6za (Feminino) held 82688 products. ${ONE}`,
				routing: request('/api/v1/renner/category', LIST_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get lojas renner deals',
				description: `A product list of ${SITE}: the list of every discounted product (default) or another list by navigation ID or /lista/ link, sorted and filtered like search. The site publishes no start or end dates for its deals. ${GRID} Also list. An unknown list is a charged not-found. Captured 2026-11-27: the discounted-products list held 106896 products. ${ONE}`,
				routing: request('/api/v1/renner/deals', LIST_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a lojas renner product',
				description: `One product of ${SITE} by product ID or link, optionally a SKU to pick the colour and size: product_id, requested_sku, sku, sku_matched, name, brand, URL, color, size, price, list_price, on_sale, discount_percent, ${INSTALLMENTS}, rating, review_count, ${FLAGS}, marketplace, seller, gender, categories, breadcrumbs, composition, details, images, colors with their sizes and SKUs, size_count, sizes_available and sizes (the sizes of the colour shown, with the site's availability flags: flags, not unit counts). rating is the aggregate; the reviews themselves come from Get Reviews. Not available: shipping quotes by CEP, the marketing description. An unknown product is a charged not-found. Captured 2026-11-27: a pair of trousers at 199.90 BRL (list 219.90), 6 interest-free Cartao Renner installments of 33.32, rated 4.4 from 21 reviews. ${ONE}`,
				routing: request('/api/v1/renner/product', FAST_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get lojas renner product reviews',
				description: `The customer reviews of one product of ${SITE}, by product ID or link, as the product page shows them: product_id, page, per_page, sort, filter, rating_filter, total (the product's review count; null with a filter or star rating, which the store gives no count for), has_more, count, product_name, rating (average and count; the store shows no star histogram), reviews (ID, rating, title, text, date, purchase_date as the date of the order the review is linked to, recommends, helpful_votes, unhelpful_votes, photos, attributes as the store's follow-up questions such as size and fit, store_reply, imported, influencer) and notes. Sorted newest (default) or most helpful; filtered positive (ratings 3 to 5), negative (ratings 1 to 2) or with photos, or one star rating (one or the other); up to 100 per page. Reviews can lag the product page by up to 4 hours. Review text is the customer's own; reviewer names are never returned. No questions and answers. A product ID the reviews do not know is a charged not-found, or an empty answer (count 0, charged). Captured 2026-11-28: a satin shirt rated 4.6 from 742 reviews. ${ONE}`,
				routing: request('/api/v1/renner/reviews', FAST_MS),
			},
			{
				name: 'Get SKU Price',
				value: 'sku_price',
				action: 'Get the price of a lojas renner size',
				description: `Price and stock flags for one size of ${SITE}, by product ID (or link) and SKU: product_id, sku, name, color, size, price, list_price, on_sale, discount_percent, ${INSTALLMENTS}, ${FLAGS} and image (flags, not unit counts). An unknown SKU, or a SKU of another product, is a charged not-found. Captured 2026-11-27: size 36 of product 931758127 at 199.90 BRL, available, order limit 100. ${ONE}`,
				routing: request('/api/v1/renner/sku-price', FAST_MS),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get lojas renner stores for a cep',
				description: `The physical stores of ${SITE}: the store locator's list for a CEP's city or region: cep, cep_state, count, stores (store_number, name, address, phone as the chain's shared number where you enter the store_number, hours), excluded_count and notes. Stores outside the CEP's state that the site returns are left out and reported in a note. In the site's order; no coordinates or distances. Captured 2026-11-27: CEP 01310-100 (SP) listed 5 stores. ${ONE}`,
				routing: request('/api/v1/renner/stores', FAST_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search lojas renner products',
				description: `Search ${SITE} by keyword. ${GRID} Also query. No results is an empty answer (charged). Captured 2026-11-27: camiseta matched 9468 products, the first a seamless t-shirt at 69.90 BRL (list 79.90) with 17 units listed and 163 sold in the last 15 days. ${ONE}`,
				routing: request('/api/v1/renner/search', LIST_MS),
			},
		],
		default: 'search',
	},
];

export const rennerFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'rennerQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'camiseta',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as a shopper types them (1 to 120 characters)',
	},
	listingOptions('rennerSearchOptions', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'rennerCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4zo6za',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A category by its navigation ID (4zo6za is Feminino; breadcrumbs URL and the category refinements carry them), or a lojasrenner.com.br /c/ link or path ending in /-/N-(ID)',
	},
	listingOptions('rennerCategoryOptions', 'category'),

	// -- Get Deals --
	listingOptions('rennerDealsOptions', 'deals', [
		{
			displayName: 'List',
			name: 'rennerDealsList',
			type: 'string',
			default: '',
			placeholder: '1l95pyv',
			description:
				"A list by its navigation ID or a lojasrenner.com.br /lista/ link; empty for 1l95pyv, the site's list of every discounted product",
			routing: { request: { body: { list: '={{ String($value).trim() || undefined }}' } } },
		},
	]),

	// -- Get Product --
	productField('rennerProduct', ['product']),
	{
		displayName: 'SKU',
		name: 'rennerProductSku',
		type: 'string',
		default: '',
		placeholder: '931758282',
		displayOptions: show(['product']),
		routing: { request: { body: { sku: '={{ String($value).trim() || undefined }}' } } },
		description: "Optional SKU to show (colors sku or a size's SKU): picks the colour and size",
	},

	// -- Get SKU Price --
	productField('rennerSkuProduct', ['sku_price']),
	{
		displayName: 'SKU',
		name: 'rennerSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '931758135',
		displayOptions: show(['sku_price']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'The size SKU (sizes sku of Get Product)',
	},

	// -- Get Reviews --
	productField('rennerReviewsProduct', ['reviews']),
	{
		displayName: 'Additional Options',
		name: 'rennerReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Filter',
				name: 'rennerReviewsFilter',
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
				name: 'rennerReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Reviews page, 1 to 200',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Reviews Per Page',
				name: 'rennerReviewsPerPage',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews per page, 1 to 100',
				routing: { request: { body: { per_page: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'rennerReviewsSort',
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
				name: 'rennerReviewsRating',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'Only reviews with this many stars, 1 to 5 (0 for every rating). Not combined with Filter.',
				routing: { request: { body: { rating: '={{ $value > 0 ? $value : undefined }}' } } },
			},
		],
	},

	// -- Get Stores --
	{
		displayName: 'CEP',
		name: 'rennerStoresCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['stores']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'A Brazilian CEP (postal code, 8 digits)',
	},
];
