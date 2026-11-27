import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bedbathbeyond'], operation, ...extra },
});

// Bed Bath & Beyond (bedbathandbeyond.com, the US online home goods store), 9 operations. US only, USD. 1 credit;
// Search, Get Category Products and the deal lists of Get Deals 2 (a product occasionally 2); credits_used is the truth.
// The backend ends a request, retries included, inside 88 s, so every operation carries a 120s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 120000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = 'Bed Bath & Beyond (bedbathandbeyond.com, the US online home goods store), US only, prices in USD';
const BILL =
	'Credits_used says what was charged. Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const NO_STORE = 'Bed Bath & Beyond publishes online stock only: no store stock and no store prices.';
const LIST =
	"total, page, total_pages, has_more, sort_applied, count, items (organic) and sponsored_items (the site's sponsored tiles, kept apart) with position, product_id for Get Product, name, URL, image, price, price_max (a range across options), price_text, price_type, base_price, compare_price, compare_type (msrp, was, compare_at), discount_percent, discount_amount, on_sale, sale_ends, promo (the promo badge the page shows, e.g. a code), label (e.g. Best Seller), rating, review_count, option_count, fast_delivery, club_o_rewards; plus facets (ID, name, values with ID, count and URL) and related_searches. Page size varies (about 48 to 81 products); the site serves at most 84 pages of any list.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const isUrl = 'String($value).trim().match(/^https?:/i)';

/** A product ID or a bedbathandbeyond.com product link, routed to product_id or url. */
const productField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '5296998',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				product_id: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
				url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
			},
		},
	},
	description:
		'A Bed Bath & Beyond product ID (the digits before /product.html in a product link; product_id from a list) or a bedbathandbeyond.com product link',
});

const pageOption = (name: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 84 },
	description: 'Page, 1 to 84. The site serves at most 84 pages of any list.',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const outOfStockOption = (name: string): INodeProperties => ({
	displayName: 'Include Out of Stock',
	name,
	type: 'boolean',
	default: false,
	description: 'Whether to include out-of-stock products',
	routing: { request: { body: { include_out_of_stock: '={{ $value ? true : undefined }}' } } },
});

const listSortOption = (name: string, defaultValue: string, description: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: defaultValue,
	options: [
		...(defaultValue === 'default' ? [{ name: "The List's Own Order", value: 'default' }] : []),
		{ name: 'Best Match', value: 'best_match' },
		{ name: 'Best Selling', value: 'best_selling' },
		{ name: 'Customer Rating', value: 'rating' },
		{ name: 'New Arrivals', value: 'newest' },
		{ name: 'On Sale', value: 'on_sale' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
	],
	description,
	routing: { request: { body: { sort: `={{ $value === "${defaultValue}" ? undefined : $value }}` } } },
});

/** A comma-separated string sent as a list of values (absent when empty). */
const LIST_OF =
	'={{ (() => { const v = String($value).split(",").map((s) => s.trim()).filter(Boolean); return v.length ? v : undefined; })() }}';

export const bedbathbeyondOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bedbathbeyond'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get bed bath and beyond categories',
				description: `The ${SITE} department menu: count, link_count and departments (name, URL, category_id, slug, filtered, groups with their links). Slug and category_id go into Get Category Products; filtered marks a link with a filter on top of its category (e.g. Best Sellers). Captured 2026-11-27: 13 departments with 541 links. Costs 1 credit. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get bed bath and beyond category products',
				description: `One ${SITE} category's product list by slug + category ID or a /c/ link, in the site's category sorts with attribute, price range, rating, brand, promotion, fast delivery, expedited shipping and out-of-stock filters: category, sort, requested_filters, selected_facets (what the site applied), breadcrumbs, child_categories (with product counts), ${LIST} Captured 2026-11-27: bedding/bedding-sets (276) sorted by price counted 4548 products over 76 pages, the first at 16.71 USD. An unknown category is a charged not-found. Costs 2 credits. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get bed bath and beyond deals',
				description: `The ${SITE} deals. The deals page (default, 1 credit): event (the sale countdown text and ends_at), count, sections (the page's product grids, e.g. DOORBUSTERS, with price, compare_price, savings, sale_end and qty_on_hand per item) and deal_lists. A deal list (Black Friday, On Sale, Doorbusters, Holiday Brand Deals; 2 credits) answers like Search: type, name, sort, ${LIST} Captured 2026-11-27: the deals page counted down to a Black Friday Sale ending 2026-11-30 with 12 doorbusters; the Doorbusters list held 1133 products over 19 pages. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/deals', true),
			},
			{
				name: 'Get Delivery Estimate',
				value: 'deliveryEstimate',
				action: 'Get a bed bath and beyond delivery estimate',
				description: `The delivery date and shipping charge of one ${SITE} product option, for a quantity, to a US ZIP code: requested_option_id, requested_quantity, option_id, product_id, ZIP, quantity, in_stock, can_ship, ship_charge_total, ground_days, one_day, two_day, holiday, pre_release, options (level, name, charge, charge_text, estimated_date, estimate_type, estimate_text, freight) and errors (as the site gives them). Captured 2026-11-27: option 94445783 to ZIP 10001 shipped Standard, FREE, on 2026-11-30. Costs 1 credit. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/delivery-estimate'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a bed bath and beyond product',
				description: `One ${SITE} product by product ID or link: name, brand, MPN, SKU, URL, in_stock, online, discontinued, price and price_label (e.g. Sale Starts at), compare_price and compare_label (MSRP or Was), savings, price_min, price_max, on_sale, rating, review_count, rating_histogram, free_shipping, freight, country_of_origin, first_onsite_date, label, breadcrumbs, taxonomy, specs, images, option_count, original_option_count and options (option_id for Get Delivery Estimate, attributes, price, compare_price, sale_start, sale_end, qty_on_hand as exact online stock, max_quantity, in_stock, backorder). The site leaves out-of-stock options out. A product no longer sold answers in_stock false with no options. No UPC or GTIN. ${NO_STORE} Captured 2026-11-27: the Superior Egyptian Cotton 6 Piece Towel Set from 63.98 USD (MSRP 157.50), rated 4.5 from 5165 reviews, 26 of 49 options listed. Costs 1 credit, occasionally 2. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get bed bath and beyond questions',
				description: `Customer questions and answers of one ${SITE} product, 20 questions per page: page, page_size, total_pages, total_questions, total_answers, has_more, count and questions (question_id, text, asked_at, type, answer_count, answers with text and answered_at). No screen names. Captured 2026-11-27: a rug runner had 159 questions with 693 answers. Costs 1 credit. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/questions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get bed bath and beyond reviews',
				description: `Customer reviews of one ${SITE} product, sorted newest, most helpful, highest or lowest, with a star filter and a text search: total, total_matching, average_rating, rating_count, media_count, rating_histogram, page, total_pages, has_more and reviews (review_id, rating, title, text, submitted_at, helpful_votes, unhelpful_votes, verified_purchase, rewards_received, recommended, media). No reviewer names or locations. Captured 2026-11-27: the Superior towel set had 5165 reviews averaging 4.5, 57 with media. Costs 1 credit. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/reviews'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get bed bath and beyond stores',
				description: `The stores of the Bed Bath & Beyond family (Bed Bath & Beyond / The Container Store co-branded stores, Kirkland's and The Container Store) near a US ZIP code or a point (nearest first, within a radius), in a state, or all of them, filtered by banner: total_stores, count and stores (name, banner, brands, address, phone, coordinates, time_zone, hours, services, distance_miles as straight-line miles). ${NO_STORE} Captured 2026-11-27: 333 stores in all; ZIP 75201 had 16 within 50 miles. Costs 1 credit. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/stores', true),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search bed bath and beyond',
				description: `${SITE} keyword search by query or a facet link from an earlier answer, in the site's sorts: query, sort, ${LIST} Also matching_categories and redirected_to (a keyword the site sends to a category answers that category's list; one it sends to a product page answers its product_id). The price filter is left out of keyword facets: use Get Category Products. Captured 2026-11-27: bath towels gave 7835 results, the first a towel set from 63.98 USD against an MSRP of 157.50. Costs 2 credits. ${BILL}`,
				routing: request('/api/v1/bedbathbeyond/search'),
			},
		],
		default: 'search',
	},
];

export const bedbathbeyondFields: INodeProperties[] = [
	// -- Search --
	{
		displayName: 'Search By',
		name: 'bedbathbeyondSearchBy',
		type: 'options',
		default: 'query',
		options: [
			{ name: 'Keywords', value: 'query' },
			{ name: 'Facet URL', value: 'facet' },
		],
		displayOptions: show(['search']),
		description: 'Search by keywords, or open the link of a facet value from an earlier search answer',
	},
	{
		displayName: 'Query',
		name: 'bedbathbeyondQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bath towels',
		displayOptions: show(['search'], { bedbathbeyondSearchBy: ['query'] }),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords (1 to 150 characters)',
	},
	{
		displayName: 'Facet URL',
		name: 'bedbathbeyondFacetUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['search'], { bedbathbeyondSearchBy: ['facet'] }),
		routing: { request: { body: { facet_url: '={{ String($value).trim() }}' } } },
		description:
			'The link of a facet value from a search answer (a filtered keyword list, e.g. On Sale, a color or a brand). Price filter links are refused: use Get Category Products with a price range.',
	},
	{
		displayName: 'Additional Options',
		name: 'bedbathbeyondSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			outOfStockOption('bedbathbeyondSearchOutOfStock'),
			pageOption('bedbathbeyondSearchPage'),
			listSortOption('bedbathbeyondSearchSort', 'best_match', "The site's search sorts"),
		]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'bedbathbeyondCategoryBy',
		type: 'options',
		default: 'slug',
		options: [
			{ name: 'Slug and Category ID', value: 'slug' },
			{ name: 'Category URL', value: 'url' },
		],
		displayOptions: show(['category']),
		description: 'Pick the category by its slug and ID (from Get Categories) or by a bedbathandbeyond.com /c/ link',
	},
	{
		displayName: 'Slug',
		name: 'bedbathbeyondCategorySlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bedding/bedding-sets',
		displayOptions: show(['category'], { bedbathbeyondCategoryBy: ['slug'] }),
		routing: { request: { body: { slug: '={{ String($value).trim() }}' } } },
		description: 'The category path after /c/ (slug from Get Categories or child_categories)',
	},
	{
		displayName: 'Category ID',
		name: 'bedbathbeyondCategoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '276',
		displayOptions: show(['category'], { bedbathbeyondCategoryBy: ['slug'] }),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description: 'The category ID (category_id from Get Categories; the t= value of its link)',
	},
	{
		displayName: 'Category URL',
		name: 'bedbathbeyondCategoryUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['category'], { bedbathbeyondCategoryBy: ['url'] }),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description: 'A bedbathandbeyond.com /c/ link (from categories, breadcrumbs, child_categories or a facet value). Its filters are kept.',
	},
	{
		displayName: 'Additional Options',
		name: 'bedbathbeyondCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			{
				displayName: 'Attributes (JSON)',
				name: 'bedbathbeyondCategoryAttributes',
				type: 'json',
				default: '{}',
				description:
					'Attribute filters: facet ID to value IDs, as the facets of an answer list them, e.g. {"2415": ["2913"]}. At most 8 facets.',
				routing: {
					request: {
						body: {
							attributes:
								'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
						},
					},
				},
			},
			{
				displayName: 'Brands',
				name: 'bedbathbeyondCategoryBrand',
				type: 'string',
				default: '',
				placeholder: 'safavieh',
				description: 'Brand names as the Brand facet lists them, comma-separated (up to 10)',
				routing: { request: { body: { brand: LIST_OF } } },
			},
			{
				displayName: 'Expedited Shipping Only',
				name: 'bedbathbeyondCategoryExpedited',
				type: 'boolean',
				default: false,
				description: 'Whether to limit the list to Expedited Shipping Available products',
				routing: { request: { body: { expedited: '={{ $value ? true : undefined }}' } } },
			},
			{
				displayName: 'Fast Delivery Only',
				name: 'bedbathbeyondCategoryFastDelivery',
				type: 'boolean',
				default: false,
				description: 'Whether to limit the list to Fast Delivery products',
				routing: { request: { body: { fast_delivery: '={{ $value ? true : undefined }}' } } },
			},
			outOfStockOption('bedbathbeyondCategoryOutOfStock'),
			pageOption('bedbathbeyondCategoryPage'),
			{
				displayName: 'Price Max (USD)',
				name: 'bedbathbeyondCategoryPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				description: 'Price range high end in USD (set Price Min (USD) too; above it)',
				routing: { request: { body: { price_max: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Min (USD)',
				name: 'bedbathbeyondCategoryPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				description: 'Price range low end in USD (set Price Max (USD) too)',
				routing: { request: { body: { price_min: '={{ $value }}' } } },
			},
			{
				displayName: 'Promotions',
				name: 'bedbathbeyondCategoryPromotion',
				type: 'string',
				default: '',
				placeholder: 'on sale',
				description:
					'Sales and Promotions values as the facet lists them, comma-separated: on sale, top rated, best selling, new products',
				routing: { request: { body: { promotion: LIST_OF } } },
			},
			{
				displayName: 'Rating',
				name: 'bedbathbeyondCategoryRating',
				type: 'options',
				default: 4,
				options: [
					{ name: '1 Star and Up', value: 1 },
					{ name: '2 Stars and Up', value: 2 },
					{ name: '3 Stars and Up', value: 3 },
					{ name: '4 Stars and Up', value: 4 },
				],
				description: 'Customer rating: this many stars and up',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'bedbathbeyondCategorySort',
				type: 'options',
				default: 'best_selling',
				options: [
					{ name: 'Best Selling', value: 'best_selling' },
					{ name: 'Customer Rating', value: 'rating' },
					{ name: 'New Arrivals', value: 'newest' },
					{ name: 'On Sale', value: 'on_sale' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: "The site's category sorts",
				routing: { request: { body: { sort: '={{ $value === "best_selling" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Product, Get Reviews, Get Questions --
	productField('bedbathbeyondProductId', 'product'),
	productField('bedbathbeyondReviewsProductId', 'reviews'),
	{
		displayName: 'Additional Options',
		name: 'bedbathbeyondReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'bedbathbeyondReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100000 },
				description: 'Page, from 1',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'bedbathbeyondReviewsPageSize',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'bedbathbeyondReviewsRating',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Reviews with exactly this many stars',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Search Text',
				name: 'bedbathbeyondReviewsSearch',
				type: 'string',
				default: '',
				description: 'Reviews containing this text (1 to 100 characters)',
				routing: { request: { body: { search: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'bedbathbeyondReviewsSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest' },
					{ name: 'Lowest Rating', value: 'lowest' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
				],
				description: 'Review order',
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
		]),
	},
	productField('bedbathbeyondQuestionsProductId', 'questions'),
	{
		displayName: 'Page',
		name: 'bedbathbeyondQuestionsPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 10000 },
		displayOptions: show(['questions']),
		description: 'Page, from 1; 20 questions per page',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},

	// -- Get Delivery Estimate --
	{
		displayName: 'Option ID',
		name: 'bedbathbeyondDeliveryOptionId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '94445783',
		displayOptions: show(['deliveryEstimate']),
		routing: { request: { body: { option_id: '={{ String($value).trim() }}' } } },
		description: "The product's options[].option_id from Get Product",
	},
	{
		displayName: 'ZIP Code',
		name: 'bedbathbeyondDeliveryZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['deliveryEstimate']),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'The US ZIP code to deliver to',
	},
	{
		displayName: 'Quantity',
		name: 'bedbathbeyondDeliveryQuantity',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 99 },
		displayOptions: show(['deliveryEstimate']),
		routing: { request: { body: { quantity: '={{ $value }}' } } },
		description: 'Quantity, 1 to 99',
	},

	// -- Get Stores --
	{
		displayName: 'Find By',
		name: 'bedbathbeyondStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'ZIP Code', value: 'zip' },
			{ name: 'State', value: 'state' },
			{ name: 'Coordinates', value: 'point' },
			{ name: 'All Stores', value: 'all' },
		],
		displayOptions: show(['stores']),
		description: 'Stores near a ZIP code or a point (nearest first, within the radius), in a state, or every store',
	},
	{
		displayName: 'ZIP Code',
		name: 'bedbathbeyondStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75201',
		displayOptions: show(['stores'], { bedbathbeyondStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: "A US ZIP code: stores within the radius of its center, nearest first",
	},
	{
		displayName: 'State',
		name: 'bedbathbeyondStoresState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['stores'], { bedbathbeyondStoresBy: ['state'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'A 2-letter US state code: every store in the state',
	},
	{
		displayName: 'Latitude',
		name: 'bedbathbeyondStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { bedbathbeyondStoresBy: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point, e.g. 32.788',
	},
	{
		displayName: 'Longitude',
		name: 'bedbathbeyondStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { bedbathbeyondStoresBy: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point, e.g. -96.8',
	},
	{
		displayName: 'Radius (Miles)',
		name: 'bedbathbeyondStoresRadius',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 500 },
		displayOptions: show(['stores'], { bedbathbeyondStoresBy: ['zip', 'point'] }),
		routing: { request: { body: { radius: '={{ $value === 50 ? undefined : $value }}' } } },
		description: 'Radius in miles, 1 to 500',
	},
	{
		displayName: 'Banner',
		name: 'bedbathbeyondStoresBanner',
		type: 'options',
		default: 'any',
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Bed Bath & Beyond / The Container Store', value: 'bed_bath_beyond' },
			{ name: "Kirkland's", value: 'kirklands' },
			{ name: 'The Container Store (Co-Branded Included)', value: 'container_store' },
		],
		displayOptions: show(['stores']),
		routing: { request: { body: { banner: '={{ $value === "any" ? undefined : $value }}' } } },
		description: 'Which store banner to list',
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'bedbathbeyondDealsType',
		type: 'options',
		default: 'page',
		options: [
			{ name: 'Black Friday List', value: 'black_friday' },
			{ name: 'Deals Page', value: 'page' },
			{ name: 'Doorbusters List', value: 'doorbusters' },
			{ name: 'Holiday Brand Deals List', value: 'holiday_brand_deals' },
			{ name: 'On Sale List', value: 'on_sale' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "page" ? undefined : $value }}' } } },
		description:
			'The deals page (its sale countdown and doorbuster grid, 1 credit) or a deal list with sorts and pages (2 credits)',
	},
	{
		displayName: 'Additional Options',
		name: 'bedbathbeyondDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals'], {
			bedbathbeyondDealsType: ['black_friday', 'on_sale', 'doorbusters', 'holiday_brand_deals'],
		}),
		options: sorted([
			outOfStockOption('bedbathbeyondDealsOutOfStock'),
			pageOption('bedbathbeyondDealsPage'),
			listSortOption('bedbathbeyondDealsSort', 'default', "The deal list's order; by default the list's own order"),
		]),
	},
];
