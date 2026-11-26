import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['zappos'], operation, ...extra },
});

// Zappos (zappos.com, the US shoe and clothing store, an Amazon company) and 6pm (6pm.com, the
// Zappos outlet site), 7 operations, 1 credit each; credits_used is the truth. US only, USD.
// Search, Get Product, Get Categories and Get Search Suggestions take Site (zappos or 6pm); Get
// Reviews, Get Questions and Get Lowest Prices exist on zappos.com only, so they send no site.
// Calls usually answer in a few seconds; a retried call can take longer, so every operation
// carries a 200s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 200000 },
});

const STORE =
	'Zappos (zappos.com, the US shoe and clothing store, an Amazon company), or 6pm (6pm.com, the Zappos outlet site) with Site 6pm';
const MARKET = 'Every answer carries site, host, country (us), currency (USD) and language (en).';
const ONE =
	'Costs 1 credit (credits_used says what was charged). A not-found is charged; refused inputs and failed calls are not.';
const ITEM =
	'position, product ID, style ID, color ID, name, brand, color, price, original_price, percent_off, on_sale, is_new, rating, review_count, on_hand (units in stock for that color, all sizes), gender, product_type, badges, promo_badges, image, URL';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const productIdField = (operation: string, name: string): INodeProperties => ({
	displayName: 'Product ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '10002909',
	displayOptions: show([operation]),
	routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
	description:
		'A Zappos product ID (product_id of Search Products; the number after /product/ in a Zappos link)',
});

export const zapposOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['zappos'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get zappos categories',
				description: `The department > category > subcategory tree of ${STORE}, one level per call with item counts: the departments, the categories of a department, or the subcategories of a category. Returns level, department, category, total (items in the level asked), count and categories (name, count, level, facets to send to Search Products). Captured 2026-11-26: department Shoes held 63603 items in 13 categories. ${MARKET} An unknown department or category is a charged not-found. ${ONE}`,
				routing: request('/api/v1/zappos/categories'),
			},
			{
				name: 'Get Lowest Prices',
				value: 'lowestPrices',
				action: 'Get zappos lowest prices',
				description: `The lowest price of each style (color) of one Zappos product as Zappos gives it for its product page (zappos.com only): product ID, count, styles (style ID, price) and a note. Zappos does not state the period these prices cover (they are not a 30-day low), and they can include colors out of stock now. Captured 2026-11-26: product 10002909 listed 20 styles, from 109.95 USD. ${MARKET} A product with no lowest prices is a charged not-found. ${ONE}`,
				routing: request('/api/v1/zappos/lowest-prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a zappos product',
				description: `One product of ${STORE} by product, style, stock ID or ASIN with every color and size: name, brand, product type, category, rating, review count, the leading fit answers of reviewers, a review summary (no reviewer names), description, style and SKU counts, total units on hand, and styles (color, price, original price, percent off, on sale, final sale, units on hand, badges, attributes, images) each with its SKUs (stock ID, size, width, exact units on hand, price, UPC, ASIN). on_hand is the exact number of units in Zappos' warehouse stock (Zappos sells online and has no stores). A color or size out of stock has no price on the site: price is null with a price_note. Captured 2026-11-26: Brooks Adrenaline GTS 25 had 22 colors and 512 sizes, 114 in stock with 5995 units in all. ${MARKET} An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/zappos/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get zappos questions',
				description: `The customer questions of one Zappos product (zappos.com only), all in one answer: total, count, staff_answer_count and questions (text, votes, answer count, top answer, answers with text, date, upvotes, best and is_staff for an answer by Zappos staff). No asker or answerer names. Captured 2026-11-26: product 9405856 had 33 questions with 11 answers by Zappos staff. ${MARKET} An unknown product is a charged not-found. ${ONE}`,
				routing: request('/api/v1/zappos/questions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get zappos reviews',
				description: `Customer reviews of one Zappos product (zappos.com only), 25 per page, most helpful first or latest: name, brand, rating, total reviews, page, total pages and reviews (overall, comfort and look ratings, size, width and arch fit, text, date, upvotes, verified purchase, incentivized, customer reward review, source, media). No reviewer names, locations or bylines. Captured 2026-11-26: HOKA Bondi 9 had 2558 reviews over 103 pages. ${MARKET} A product without a reviews page is a charged not-found. ${ONE}`,
				routing: request('/api/v1/zappos/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get zappos search suggestions',
				description: `The search-box suggestions of ${STORE}: up to 10 keyword completions for a partial query. ${MARKET} Costs 1 credit (credits_used says what was charged); refused inputs and failed calls are not charged.`,
				routing: request('/api/v1/zappos/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search zappos products',
				description: `Search ${STORE}: keywords (or the whole catalog), ONE value per facet (brand, gender, department, category, subcategory, size, width, color, price band, on sale, any attribute facet), sorted by relevance, price, percent off, rating, newest or best sellers; Mode Sale lists items on sale by percent off. Returns total, total_pages, searched_as (the term the site searched when it corrected the query), applied_filters, items (${ITEM}) and facets (field, name, values with counts; send any back in Facets). Captured 2026-11-26: "running shoes" on zappos.com gave 7142 items. ${MARKET} ${ONE}`,
				routing: request('/api/v1/zappos/search'),
			},
		],
		default: 'search',
	},
];

export const zapposFields: INodeProperties[] = [
	// -- Site (Search Products, Get Product, Get Categories, Get Search Suggestions) --
	{
		displayName: 'Site',
		name: 'zapposSite',
		type: 'options',
		default: 'zappos',
		options: [
			{ name: '6pm (6pm.com, Outlet)', value: '6pm' },
			{ name: 'Zappos (zappos.com)', value: 'zappos' },
		],
		displayOptions: show(['search', 'product', 'categories', 'suggestions']),
		description:
			'Zappos (the default) or 6pm, the Zappos outlet site. Both are US stores in USD with the same product, style and stock IDs; prices and stock differ between them.',
		routing: { request: { body: { site: '={{ $value === "zappos" ? undefined : $value }}' } } },
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'zapposSearchQuery',
		type: 'string',
		default: '',
		placeholder: 'running shoes',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		description: 'Search keywords. Leave empty to browse the whole catalog (narrowed by Facets).',
	},
	{
		displayName: 'Additional Options',
		name: 'zapposSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Facets (JSON)',
				name: 'zapposSearchFacets',
				type: 'json',
				default: '{}',
				description:
					'ONE value per facet, up to 12: {"brand": "Brooks", "gender": "Women"}. Names: brand, brand_id, gender, department, category, subcategory, color, price (a band as listed, e.g. "$100 and Under"), on_sale, size and width (with gender Men or Women), or any facets[].field of an answer. Values are matched as the site writes them.',
				routing: {
					request: {
						body: {
							facets:
								'={{ (() => { const v = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return v && Object.keys(v).length ? v : undefined; })() }}',
						},
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'zapposSearchLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Mode',
				name: 'zapposSearchMode',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Sale', value: 'sale' },
				],
				description: 'All items, or items on sale (sorted by percent off unless Sort is set)',
				routing: { request: { body: { mode: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'zapposSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 2000 },
				description:
					'Results page, from 1. A page past the last one is an empty items list with the real total.',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'zapposSearchSort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Sellers', value: 'best_sellers' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Percent Off', value: 'percent_off' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: "The site's sort menu (Relevance is the site's own order)",
				routing: {
					request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
				},
			},
		]),
	},

	// -- Get Product --
	{
		displayName: 'Look Up By',
		name: 'zapposProductLookup',
		type: 'options',
		default: 'product_id',
		options: [
			{ name: 'ASIN', value: 'asin' },
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'Stock ID (One Size of One Color)', value: 'stock_id' },
			{ name: 'Style ID (One Color)', value: 'style_id' },
		],
		displayOptions: show(['product']),
		description: 'Which kind of ID the ID field holds',
	},
	{
		displayName: 'ID',
		name: 'zapposProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10002909',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_id:
						'={{ $parameter.zapposProductLookup === "product_id" ? String($value).trim() : undefined }}',
					style_id:
						'={{ $parameter.zapposProductLookup === "style_id" ? String($value).trim() : undefined }}',
					stock_id:
						'={{ $parameter.zapposProductLookup === "stock_id" ? String($value).trim() : undefined }}',
					asin: '={{ $parameter.zapposProductLookup === "asin" ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A product ID (10002909), style ID (6549810), stock ID (60162981) or ASIN (B0F4JKCMQ2), as Look Up By says',
	},

	// -- Get Reviews --
	productIdField('reviews', 'zapposReviewsProductId'),
	{
		displayName: 'Additional Options',
		name: 'zapposReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'zapposReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Reviews page, from 1, 25 reviews per page (total_pages says how many)',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'zapposReviewsSort',
				type: 'options',
				default: 'best',
				options: [
					{ name: 'Most Helpful', value: 'best' },
					{ name: 'Latest', value: 'latest' },
				],
				description: 'Most helpful first (default) or latest',
				routing: { request: { body: { sort: '={{ $value === "best" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Questions --
	productIdField('questions', 'zapposQuestionsProductId'),

	// -- Get Lowest Prices --
	productIdField('lowestPrices', 'zapposLowestPricesProductId'),

	// -- Get Categories --
	{
		displayName: 'Additional Options',
		name: 'zapposCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Category',
				name: 'zapposCategoriesCategory',
				type: 'string',
				default: '',
				placeholder: 'Sneakers & Athletic Shoes',
				description: 'A category to list its subcategories (with Department, or alone)',
				routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Department',
				name: 'zapposCategoriesDepartment',
				type: 'string',
				default: '',
				placeholder: 'Shoes',
				description: 'A department (a top-level name) to list its categories. Leave empty for the departments.',
				routing: {
					request: { body: { department: '={{ String($value).trim() || undefined }}' } },
				},
			},
		],
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'zapposSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hoka bon',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A partial search query (up to 100 characters)',
	},
];
