import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bjs'], operation, ...extra },
});

// BJ's Wholesale Club (bjs.com, the US warehouse club), 7 operations, 1 credit each; credits_used is the truth.
// US only, USD. Search, Get Category Products, Get Reviews and Get Coupons take 15 to 100 s, so every operation
// carries a 240s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = "BJ's Wholesale Club (bjs.com, the US warehouse club), US only, prices in USD";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const MEMBER =
	'Where BJ\'s shows "Member Only Price" to a visitor, member_only_price is true and the answer carries the list price only: no member price, sale price or sale dates.';
const CLUB_ONLY = 'A club-only item (sold in clubs, no online price) has price null and club_only true.';
const NO_CLUB =
	'The club cannot be chosen: there is no price, stock or availability for a club you pick and no club finder by ZIP code.';
const LISTING =
	"total (BJ's own count), count, page_size (40), has_more, priced_for (the club BJ's assigned to the visit, or null; then prices are online prices), results with product_id (what Get Product and Get Reviews take), item_number, name, URL, image, price (online), was_price, sale (price, starts_at, ends_at), club_price, club_was_price and club_sale (for priced_for), member_only_price, club_only, online and in-club availability and stock, fulfillment (same-day delivery, pickup in club, EBT), weighted_item, rating, review_count, coupon, free_shipping, badges, max_quantity, bought_last_month, first_available and categories, plus facets and a note. Up to 40 results: BJ's ignores its own page parameter, so there is no deeper paging.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const STATES = [
	'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
	'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

/** A product ID or bjs.com link: 19 digits go to product_id, an https link to url. */
const productField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '3000000000005430255',
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
		"A BJ's product ID (the 19-digit number at the end of a bjs.com/product/ link; product_id from Search) or the product's bjs.com link",
});

export const bjsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bjs'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get bjs categories',
				description: `${SITE}: the full category tree (about 980 categories), or one category's subtree: root, product_count, count and categories (category_id for Get Category Products, name, product count, URL, level, hidden, children). Captured 2026-11-26: 982 categories over 13503 products. ${ONE}`,
				routing: request('/api/v1/bjs/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get bjs category products',
				description: `The products of one ${SITE} category (IDs from Get Categories), as BJ's lists them: category_id, URL, subcategories, ${LISTING} A category whose page leads to a landing page with no product list is a charged not-found that points to its subcategories. ${MEMBER} ${NO_CLUB} Captured 2026-11-26: TVs held 162 products (40 listed). ${ONE}`,
				routing: request('/api/v1/bjs/category'),
			},
			{
				name: 'Get Clubs',
				value: 'clubs',
				action: 'Get bjs clubs',
				description: `${SITE}: the club directory (about 280 clubs in 22 states, announced openings included), all or one state: state, state_count, count, states (state, state_name, count) and clubs (club_id, name, state, URL). A directory by state only: no club finder by ZIP code and no club-level prices or stock. Captured 2026-11-26: New York had 50 clubs. ${ONE}`,
				routing: request('/api/v1/bjs/clubs', true),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get bjs coupons',
				description: `${SITE}: the guest coupon book, the manufacturer and BJ's coupons a visitor sees on the coupon page (about 570), as the page loads them: total, count (about 240 to 300), has_more, categories and coupons (offer_id, description, brand, manufacturer, summary, value, category, offer_type, min_quantity, redemption limit and frequency, source, active_from, expires_at, UPCs, GTINs, image, disclaimer). Coupons are clipped to a membership on bjs.com; Scavio never clips one. Captured 2026-11-26: 268 of 567 offers across 12 categories. ${ONE}`,
				routing: request('/api/v1/bjs/coupons', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a bjs product',
				description: `One ${SITE} product by product ID or link: item_number, name, brand, model, UPC, URL, price (online; the offer price while an instant saving runs), regular_price, savings, offer dates, map_price, unit price, price_range, member_only_price, club_only, weighted_item, online and in-club availability, estimated_delivery, free_shipping, rating, review_count, description, specifications, breadcrumbs, images, options, variants (item number, attributes, prices, availability, GTIN) and fulfillment per item number. Club prices differ from club to club and are not returned. ${MEMBER} ${CLUB_ONLY} Captured 2026-11-26: Scotch-Brite 420-Sheet Lint Rollers, 4 pk. at 9.99 USD online (regular 12.99). An unknown product ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/bjs/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get bjs product reviews',
				description: `Customer reviews of one ${SITE} product, 10 a page in BJ's order (newest to oldest): page, total, total_pages, has_more, summary (average rating, review count, rating histogram, recommended ratio, themes; page 1), ai_summary (BJ's own AI review summary as given), reviews (review_id, rating, title, text, created_at, would_recommend, verified_buyer, staff_reviewer, helpful votes, photos) and questions with their answers. No reviewer, asker or answerer names or locations. Captured 2026-11-26: a paper towel product had 2967 reviews, average 4.81. ${ONE}`,
				routing: request('/api/v1/bjs/reviews'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search bjs',
				description: `${SITE} keyword search: query, departments, related_searches, ${LISTING} ${MEMBER} ${CLUB_ONLY} ${NO_CLUB} ${ONE} Captured 2026-11-26: coffee gave 125 results. The first 40 were listed.`,
				routing: request('/api/v1/bjs/search'),
			},
		],
		default: 'search',
	},
];

export const bjsFields: INodeProperties[] = [
	// -- Get Product, Get Reviews --
	productField('bjsProductId', 'product'),
	productField('bjsReviewsProductId', 'reviews'),

	// -- Search --
	{
		displayName: 'Query',
		name: 'bjsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coffee',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords (2 to 100 characters)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'bjsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tvs-and-electronics>tvs',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: "A BJ's category ID from Get Categories, or its bjs.com/category/ path or link",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'bjsCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Category',
				name: 'bjsCategoriesCategory',
				type: 'string',
				default: '',
				placeholder: 'grocery',
				description: 'One category ID: the answer is its subtree',
				routing: {
					request: {
						body: { category: '={{ String($value).trim() === "" ? undefined : String($value).trim() }}' },
					},
				},
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'bjsReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'bjsReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Reviews page, 1 to 500 (10 a page)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'bjsClubsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['clubs']),
		options: sorted([
			{
				displayName: 'State',
				name: 'bjsClubsState',
				type: 'options',
				default: 'NY',
				options: STATES.map((s) => ({ name: s, value: s })).sort((a, b) => a.name.localeCompare(b.name)),
				description: "Only this US state's clubs",
				routing: { request: { body: { state: '={{ $value }}' } } },
			},
		]),
	},
];
