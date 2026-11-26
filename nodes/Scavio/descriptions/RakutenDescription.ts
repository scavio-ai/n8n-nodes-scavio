import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rakuten'], operation, ...extra },
});

// Rakuten (rakuten.com, the cashback site, formerly Ebates), 9 operations, 1 credit each; credits_used is the
// truth. us = rakuten.com (USD), gb = rakuten.co.uk (GBP), ca = rakuten.ca (CAD, English or French); Rakuten
// Japan is not offered. Get Store Coupons and Get Rates take us or gb; Get Suggestions, Get Category Stores,
// Get Deals and Get In-Store Offers are us only. Calls are usually a few seconds; every operation carries a
// 240s timeout to cover a retried call.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const RK = 'Rakuten (rakuten.com, the cashback site, formerly Ebates)';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const LINKS =
	"Rakuten's shopping-trip links are never returned: page_path is the store's Rakuten page path as a plain identifier.";
const NO_DATES =
	'Rakuten publishes no end dates for cash back rates: poll and store the answers to track rate changes.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const SORTS = [
	{ name: 'A to Z', value: 'az' },
	{ name: 'Cash Back (Highest First)', value: 'cashback' },
	{ name: 'Recommended', value: 'recommended' },
	{ name: 'Z to A', value: 'za' },
];

const pageOption = (name: string, perPage: number, description?: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 200 },
	description: description ?? `Page, from 1 (${perPage} a page)`,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const storeField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Store',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'macys',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				store: '={{ /^\\d+$/.test(String($value).trim()) ? Number(String($value).trim()) : String($value).trim() }}',
			},
		},
	},
	description:
		"The store's Rakuten slug (macys: the path after /shop/ on rakuten.com and rakuten.co.uk; best-buy on rakuten.ca), its Rakuten page link, or its numeric store ID (US and UK)",
});

export const rakutenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rakuten'] } },
		options: [
			{
				name: 'Get Category Stores',
				value: 'category',
				action: 'Get rakuten category stores',
				description: `One rakuten.com category (US): every store with Cash Back in it, 36 a page, sorted recommended, cash back, A to Z or Z to A. Returns category (ID, name, slug), sort, page, per_page, total, pages, has_more, count and stores (store_id, name, slug, page_path, rate_text, was_text, elevated, reward, was_amount, in_store, image); page 1 adds subcategories and sections (the category page's featured stores, deals, coupons and products). Captured 2026-11-26: Electronics held 258 stores over 8 pages. ${NO_DATES} An unknown category is a charged not-found. ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get rakuten deals',
				description: `Rakuten's event pages on rakuten.com (US): Black Friday, Cyber Monday or the deals and coupons hub, or one store's own Black Friday page. Returns page, store, count and sections (title, kind: stores, coupons or products, total, has_more, count, items): stores with current and was rates, coupons with codes, product deals with sale and was prices and Rakuten's tag as given. Rakuten gives no start or end dates. Captured 2026-11-26: the Black Friday page had 8 sections. ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/deals', true),
			},
			{
				name: 'Get In-Store Offers',
				value: 'inStore',
				action: 'Get rakuten in store offers',
				description: `Rakuten's card-linked in-store cash back offers (US), 21 a page: page, per_page, total, pages, has_more, count and offers (offer_id, store_id, name, slug, page_path, rate_text, amount, type, status, terms as Rakuten writes them, image). The public list only: Scavio never adds an offer to an account. Captured 2026-11-26: 84 offers over 4 pages. ${ONE}`,
				routing: request('/api/v1/rakuten/in-store', true),
			},
			{
				name: 'Get Rates',
				value: 'rates',
				action: 'Get rakuten cash back rates',
				description: `Current cash back rates for up to 100 stores in one call on ${RK}, US or UK: the cheap batch check for rate changes. Returns requested, count, stores in the order asked (store_id, name, slug, page_path, rate_text, rate_with_type_text, amount, type, up_to, was_text, was_amount, elevated, tiered, in_store, image) and not_found. Captured 2026-11-26: Macy's 12% Cash Back, Kohl's 2% Cash Back. ${NO_DATES} ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/rates'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a rakuten store',
				description: `One store on ${RK} by slug, link or ID: rate_text, online rate (rate_text, was_text, amount, type, up_to, tiered), elevated, was_amount, boosted, in_store rate, category_rates, terms (text, exclusions, special terms), in_store_terms, posting_time, free_shipping, about, title, the first coupons and reviews (average, count, rating and text; no reviewer names). Rakuten Canada (English or French) adds special_conditions, days_to_report, total_cash_back_to_date and attributes. Captured 2026-11-26: Macy's on rakuten.com at 12% Cash Back (was 2%); Argos on rakuten.co.uk up to 0.82% Cashback; Best Buy on rakuten.ca in French up to 6% (was 1%). ${NO_DATES} An unknown store is a charged not-found. ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/store'),
			},
			{
				name: 'Get Store Coupons',
				value: 'storeCoupons',
				action: 'Get rakuten store coupons',
				description: `Every coupon and deal one store has on ${RK}, US or UK, 18 a page: store_id, name, page, per_page, total, pages, has_more, count and coupons (coupon_id, description, code (null on a deal), restriction, tag such as ENDS TODAY, rate_text, was_rate_text, image). Rakuten US and UK give no coupon end dates. Captured 2026-11-26: Macy's had 100 coupons and deals over 6 pages. ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/store-coupons'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get rakuten stores',
				description: `The store directory of ${RK} with every store's current cash back rate, in the US, UK or Canada (English or French). US and UK page Rakuten's all-stores list (36 a page; US filters by category); Canada reads its list or one department and filters by flag. Returns sort, category, page, per_page, total, pages, has_more, count, stores (store_id, name, slug, page_path, rate_text, was_text, elevated, reward, was_amount, in_store, image; Canada adds coupons_only and flags), categories (US) or departments and filters (Canada). Captured 2026-11-26: the US list held 3208 stores over 90 pages. ${NO_DATES} ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get rakuten search suggestions',
				description: 'The rakuten.com search box suggestions (US): stores (total and items with store_id, name, slug, page_path, rate_text, amount, type, up_to, in_store_text, logo) and product terms with their categories. Failed upstream calls and refused inputs are not charged. Costs 1 credit (credits_used says what was charged).',
				routing: request('/api/v1/rakuten/suggestions'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search rakuten',
				description: `Search ${RK} for a store, brand or product. Type All (US, UK): top_store, offers_cash_back (false with no_cash_back_message when Rakuten says the store does not offer Cash Back), store_lists, coupons and products (product_id, item_id, name, store_id, store_name, price, was_price, tag, rate_text, store_count, image). Type Stores: every store matching the query, 12 a page (US pages). Type Coupons: the coupons matching it. Canada: stores, products and coupons. Captured 2026-11-26: nike on rakuten.com gave Nike as the top store and 437925 products. ${LINKS} ${ONE}`,
				routing: request('/api/v1/rakuten/search'),
			},
		],
		default: 'stores',
	},
];

export const rakutenFields: INodeProperties[] = [
	// -- Country (Get Stores, Get Store, Search) --
	{
		displayName: 'Country',
		name: 'rakutenCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (Rakuten.ca, CAD)', value: 'ca' },
			{ name: 'United Kingdom (Rakuten.co.uk, GBP)', value: 'gb' },
			{ name: 'United States (Rakuten.com, USD)', value: 'us' },
		],
		displayOptions: show(['stores', 'store', 'search']),
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: 'The Rakuten market',
	},
	{
		displayName: 'Language',
		name: 'rakutenLanguage',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(['stores', 'store', 'search'], { rakutenCountry: ['ca'] }),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'Rakuten Canada pages in English or French',
	},
	// -- Country (Get Store Coupons, Get Rates) --
	{
		displayName: 'Country',
		name: 'rakutenCountryUsGb',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'United Kingdom (Rakuten.co.uk, GBP)', value: 'gb' },
			{ name: 'United States (Rakuten.com, USD)', value: 'us' },
		],
		displayOptions: show(['storeCoupons', 'rates']),
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: 'The Rakuten market (US or UK)',
	},

	// -- Get Store, Get Store Coupons --
	storeField('rakutenStore', 'store'),
	storeField('rakutenCouponsStore', 'storeCoupons'),

	// -- Get Rates --
	{
		displayName: 'Store IDs',
		name: 'rakutenStoreIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8333, 7206, 3930',
		displayOptions: show(['rates']),
		routing: {
			request: {
				body: {
					store_ids: '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}',
				},
			},
		},
		description: '1 to 100 Rakuten store IDs (store_id from Get Stores), separated by commas',
	},

	// -- Search, Get Suggestions --
	{
		displayName: 'Query',
		name: 'rakutenQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nike',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A store, brand or product',
	},
	{
		displayName: 'Query',
		name: 'rakutenSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'target',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "What a member types in rakuten.com's search box (up to 60 characters)",
	},

	// -- Get Category Stores --
	{
		displayName: 'Category',
		name: 'rakutenCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'electronics',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A rakuten.com category slug (Get Stores categories slug: electronics, clothing, travel-vacations; subcategories such as electronics/computers-tablets)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'rakutenStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			{
				displayName: 'Category',
				name: 'rakutenStoresCategory',
				type: 'string',
				default: '',
				placeholder: 'electronics',
				description:
					'US: a Rakuten category slug or ID (electronics or 651). Canada: a department slug (health-beauty, sports-outdoor). Not on the UK list.',
				routing: {
					request: {
						body: {
							category:
								'={{ String($value).trim() === "" ? undefined : (/^\\d+$/.test(String($value).trim()) ? Number(String($value).trim()) : String($value).trim()) }}',
						},
					},
				},
			},
			{
				displayName: 'Canada Filters',
				name: 'rakutenStoresFilter',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Buy Now, Pay Later', value: 'bnpl' },
					{ name: 'Canadian Stores', value: 'canadian' },
					{ name: 'Increased Cash Back', value: 'increased' },
					{ name: 'New Stores', value: 'new' },
					{ name: 'Top Stores', value: 'top' },
				],
				description: 'Rakuten Canada only: store flags to combine',
				routing: { request: { body: { filter: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			pageOption('rakutenStoresPage', 36),
			{
				displayName: 'Sort',
				name: 'rakutenStoresSort',
				type: 'options',
				default: 'cashback',
				options: SORTS,
				description: "The store order (default: the site's own: US cash back, UK A to Z, Canada recommended)",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rakutenCouponsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeCoupons']),
		options: [pageOption('rakutenCouponsPage', 18)],
	},
	{
		displayName: 'Additional Options',
		name: 'rakutenSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			pageOption('rakutenSearchPage', 12, 'US with Type Stores only: page, from 1 (12 stores a page)'),
			{
				displayName: 'Type',
				name: 'rakutenSearchType',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Coupons', value: 'coupons' },
					{ name: 'Stores', value: 'stores' },
				],
				description: 'All (top store, stores, coupons, products), Stores (every matching store) or Coupons',
				routing: { request: { body: { type: '={{ $value === "all" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rakutenCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			pageOption('rakutenCategoryPage', 36),
			{
				displayName: 'Sort',
				name: 'rakutenCategorySort',
				type: 'options',
				default: 'recommended',
				options: SORTS,
				description: 'The store order (default recommended)',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rakutenDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Event Page',
				name: 'rakutenDealsPage',
				type: 'options',
				default: 'black_friday',
				options: [
					{ name: 'Black Friday', value: 'black_friday' },
					{ name: 'Coupons Hub', value: 'coupons' },
					{ name: 'Cyber Monday', value: 'cyber_monday' },
				],
				description: "Rakuten's event page (default Black Friday)",
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Store',
				name: 'rakutenDealsStore',
				type: 'string',
				default: '',
				placeholder: 'macys',
				description: "With Black Friday: a store slug for that store's own Black Friday page",
				routing: {
					request: { body: { store: '={{ String($value).trim() === "" ? undefined : String($value).trim() }}' } },
				},
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rakutenInStoreOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['inStore']),
		options: [pageOption('rakutenInStorePage', 21)],
	},
];
