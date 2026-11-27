import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['qvc'], operation, ...extra },
});

// QVC + HSN (qvc.com and hsn.com, the video shopping networks of QVC Group), 10 operations, 1 credit each;
// credits_used is the truth. Site qvc (markets us, uk, de, it, jp) or hsn (US). The backend allows up to 160 s per
// request (reviews take 20 to 60 s), so every operation carries a 180s timeout.
const request = (url: string, body?: Record<string, unknown>) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(body ? { body } : {}) },
});

const SITE =
	"QVC (qvc.com) and HSN (hsn.com), the video shopping networks of QVC Group; QVC markets us (USD), uk (GBP), de and it (EUR) and jp (JPY), HSN US only, in each storefront's language and currency";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const QVC_PRICE =
	"price is the current selling price; qvc_price is QVC's own everyday price; special_price names QVC's price code as given (TSV = Today's Special Value, SPB = Black Friday Sale) with its window when given; easy_pay lists Easy Pay instalments as given.";
const HSN_PRICE =
	"price is the current price; original_price is HSN's struck price; flexpay lists FlexPay instalments as given.";
const QVC_ITEM =
	'item_number (what Get Product, Get Products and Get Reviews take), title, brand, URL, image, currency, price, price_max, qvc_price, price with shipping (uk, as given), special_price (code, description, badge, starts_at, ends_at), comparison_price (it), easy_pay, shipping_charge, rating, review_count, added_to_cart_last_week (as given), stock (in_stock, sold_out or waitlist), promo_text, colors and last_on_air';
const HSN_ITEM =
	"item_number (what Get Product and Get Reviews take with Site HSN), SKU, title, brand, URL, image, currency, price, original_price, percent_off, flexpay, shipping_charge, note, flag (Customer Pick, Clearance, Today's Special...), todays_special (today, presale, post_sale), badge, on_air_today, available and categories";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const trimOrUndefined = '={{ String($value).trim() === "" ? undefined : String($value).trim() }}';

const SITE_OPTIONS = [
	{ name: 'HSN (hsn.com, US)', value: 'hsn' },
	{ name: 'QVC', value: 'qvc' },
];

const MARKET_OPTIONS: Record<string, { name: string; value: string }> = {
	de: { name: 'Germany (qvc.de, EUR)', value: 'de' },
	it: { name: 'Italy (qvc.it, EUR)', value: 'it' },
	jp: { name: 'Japan (qvc.jp, JPY)', value: 'jp' },
	uk: { name: 'United Kingdom (qvcuk.com, GBP)', value: 'uk' },
	us: { name: 'United States (qvc.com, USD)', value: 'us' },
};
const markets = (codes: string[]) =>
	codes.map((c) => MARKET_OPTIONS[c]).sort((a, b) => a.name.localeCompare(b.name));

const siteField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Site',
	name,
	type: 'options',
	default: 'qvc',
	options: SITE_OPTIONS,
	displayOptions: show([operation]),
	description: 'QVC (the default) or HSN',
	routing: { request: { body: { site: '={{ $value === "qvc" ? undefined : $value }}' } } },
});

const marketField = (
	name: string,
	operation: string,
	codes: string[],
	siteParam?: string,
): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: markets(codes),
	displayOptions: show([operation], siteParam ? { [siteParam]: ['qvc'] } : {}),
	description: 'The QVC storefront. Defaults to the United States.',
	routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
});

/** An item number or a product link: an https link goes to url, anything else to item_number. */
const itemField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Item Number or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'K341654',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				item_number:
					'={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'The item number from a previous answer (QVC US a letter and digits, e.g. K341654; QVC UK, DE, IT and JP digits; HSN a product ID, e.g. 23550176), or the product link on qvc.com, qvcuk.com, qvc.de, qvc.it, qvc.jp or hsn.com.',
});

const networkOption = (name: string): INodeProperties => ({
	displayName: 'Network',
	name,
	type: 'options',
	default: 'hsn',
	options: [
		{ name: 'HSN', value: 'hsn' },
		{ name: 'HSN2', value: 'hsn2' },
	],
	description: 'HSN: the HSN or HSN2 network',
	routing: { request: { body: { network: '={{ $value }}' } } },
});

const dateOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Date',
	name,
	type: 'string',
	default: '',
	placeholder: '2026-11-27',
	description,
	routing: { request: { body: { date: trimOrUndefined } } },
});

const pageOption = (name: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Results page, 1 to 100; total_pages reports the last one',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const QVC_SORT_OPTIONS = [
	{ name: 'Newest', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_desc' },
	{ name: 'Price: Low to High', value: 'price_asc' },
	{ name: 'Rating', value: 'rating' },
	{ name: 'Recently On Air', value: 'recently_on_air' },
	{ name: 'Relevance', value: 'relevance' },
	{ name: 'Top Sellers', value: 'top_sellers' },
];

export const qvcOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['qvc'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get qvc category products',
				description: `One category or collection grid of QVC (qvc.com, US), 96 a page: path, URL, title, page, total, total_pages, has_more, count, sort and items (item_number, title, URL, image, price, was_price, price_code such as TSV or SPB, easy_pay_count, promo_text, rating, review_count, added_to_cart_last_week). HSN categories are not offered yet: Search Products with Site HSN and a department covers HSN's departments. An unknown link is a charged not-found. Captured 2026-11-27: the QVC Clearance Sale collection held 8551 items over 90 pages. ${ONE}`,
				routing: request('/api/v1/qvc/category'),
			},
			{
				name: 'Get On Air Now',
				value: 'onAir',
				action: 'Get qvc on air now',
				description: `What is on air now on each QVC channel (qvc.com, US: QVC, QVC2, QVC3, QVC Home; HSN has none): count and channels (channel_code, channel, item_number and the item's price summary, null when QVC gave none). Captured 2026-11-27: 4 channels, each with its item on air. ${ONE}`,
				routing: request('/api/v1/qvc/on-air', {}),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a qvc product',
				description: `One product of ${SITE}, by item number or link. QVC: the search item fields plus description, bullets, retail_value with its reason as given, price excluding tax and tax (jp), shipping text, auto_delivery, first_available, sold_last_30_days (as given), max_order_quantity, categories, images, promotions, protection plans and variants (color, size, stock flag, buyable, price, qvc_price, retail_value, delivery_days); QVC publishes no unit counts. HSN: SKU, item code, price, original_price, flexpay and its options, flag, todays_special, sale_time_remaining (HSN's countdown as given), on_air_today, rating, review_count, has_warranty, primary_category, description, images and variants (color, size, plus_size, stock: available, low_inventory or sold_out, units_left when HSN shows it). ${QVC_PRICE} Captured 2026-11-27: the GE Profile Opal Mini Pro Nugget Ice Maker w/ Side Tank (K341654) at 279.98 USD against a QVC price of 379, a Today's Special Value to 2026-12-01. An unknown item is a charged not-found. ${ONE}`,
				routing: request('/api/v1/qvc/product'),
			},
			{
				name: 'Get Products',
				value: 'products',
				action: 'Get qvc products',
				description: `Up to 20 QVC products in one call (qvc.com US or qvc.it Italy; HSN has no batch): requested, count, items in the order asked (item_number, title, brand, URL, image, currency, price, price_max, qvc_price, retail_value, special_price, easy_pay, rating, review_count, stock) and not_found. A summary per item: Get Product has the variants and full detail. ${ONE}`,
				routing: request('/api/v1/qvc/products'),
			},
			{
				name: 'Get Program Guide',
				value: 'programGuide',
				action: 'Get qvc program guide',
				description: `The TV program guide of QVC (qvc.com, US) or HSN. QVC: one day for every channel (or one) in Eastern, Central, Mountain or Pacific time, 14 days back to 17 ahead: channels with shows (start, end, duration_hours, show_name, show_code, source_code, description). HSN: one day of HSN or HSN2, hourly, Eastern time: shows (time, start, hour, show_name, network, items_aired: the input for Get Recently Aired Items). Show names are as the guide lists them; on-air host and guest names are not included. Captured 2026-11-27: the QVC channel listed 14 shows on 2026-11-26; HSN listed 24 hourly shows. ${ONE}`,
				routing: request('/api/v1/qvc/program-guide'),
			},
			{
				name: 'Get Recently Aired Items',
				value: 'recentlyAired',
				action: 'Get hsn recently aired items',
				description: `The items HSN (hsn.com) presented in one show hour of HSN or HSN2 (Eastern time; QVC is not offered here): date, hour, network, show (time, start, hour, show_name), count, items (${HSN_ITEM}) and shows (the day's other hours). Defaults to the latest show; an hour that has not aired yet can be empty. ${HSN_PRICE} Captured 2026-11-27: the 9 PM show listed 2 items, the first at 49.99 USD (was 59.99). ${ONE}`,
				routing: request('/api/v1/qvc/recently-aired', { site: 'hsn' }),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get qvc product reviews',
				description: `The first page of reviews of one QVC (qvc.com, US) or HSN product, as the product page shows it: QVC the 8 newest, HSN the 12 highest rated. First page only: no paging, sort or star filter. Returns total (written reviews), average_rating, review_count (rating-only reviews included), ratings_only_count, rating_distribution, recommended and not-recommended counts, reviews (review_id, rating, title, text, submitted_at, recommended, syndicated, syndicated_from, helpful votes, pros, cons, verified_purchaser, badges, secondary ratings, language, photo_count) and questions with answers. No reviewer names, nicknames or locations. Takes 20 to 60 s. Captured 2026-11-27: the Ninja Professional Plus Duo Blender (K82223) showed its 8 newest of 918 written reviews, 950 ratings averaging 4.67. ${ONE}`,
				routing: request('/api/v1/qvc/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get qvc search suggestions',
				description: `The QVC search-box suggestions for a partial query (US, UK or Germany; HSN has none): query, count, suggestions (search terms) and products (the suggested items, with the search item fields). Captured 2026-11-27: blen on QVC US gave 7 suggestions and 4 products. ${ONE}`,
				routing: request('/api/v1/qvc/suggestions'),
			},
			{
				name: "Get Today's Special",
				value: 'todaysSpecial',
				action: 'Get qvc todays special',
				description: `Today's special on QVC (qvc.com, US) or HSN. QVC: the Today's Special Value item with headline, subline, item_number, window (code, description, starts_at, ends_at in UTC as QVC gives it; QVC can extend TSV pricing past the TV day) and the full product. HSN: current (item_number, title, price, original_price, flexpay, sale_time_remaining), the current item in full, the Today's Specials list (about 9, each flagged today, presale or post_sale) and list_complete (false when the list could not be read this time). Captured 2026-11-27: QVC's Today's Special Value was the Diamonique Set of 5 Boxed Jewelry Gifts at 49.98 USD (QVC price 67) to 2026-12-05. ${ONE}`,
				routing: request('/api/v1/qvc/todays-special'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search qvc products',
				description: `${SITE}: keyword search. QVC: 7 sorts, 1 to 96 a page (default 24), facet filters on us, uk and de; page, total, total_pages, has_more, count, sort, filters_applied, facets (ID, name, values with their filter tokens) and items (${QVC_ITEM}). HSN: 6 sorts, 60 a page, a department filter; the same paging fields, departments (code, name, count) and items (${HSN_ITEM}); no star rating in HSN results. ${QVC_PRICE} Captured 2026-11-27: blender on QVC US gave 102 results over 5 pages, the first at 99.98 USD against a QVC price of 159.99; ring on HSN gave 687 results over 12 pages. ${ONE}`,
				routing: request('/api/v1/qvc/search'),
			},
		],
		default: 'search',
	},
];

export const qvcFields: INodeProperties[] = [
	// -- Site (Search Products, Get Product, Get Today's Special, Get Program Guide, Get Reviews) --
	siteField('qvcSearchSite', 'search'),
	siteField('qvcProductSite', 'product'),
	siteField('qvcTodaysSpecialSite', 'todaysSpecial'),
	siteField('qvcProgramGuideSite', 'programGuide'),
	siteField('qvcReviewsSite', 'reviews'),

	// -- Market --
	marketField('qvcSearchMarket', 'search', ['us', 'uk', 'de', 'it', 'jp'], 'qvcSearchSite'),
	marketField('qvcProductMarket', 'product', ['us', 'uk', 'de', 'it', 'jp'], 'qvcProductSite'),
	marketField('qvcProductsMarket', 'products', ['us', 'it']),
	marketField('qvcSuggestionsMarket', 'suggestions', ['us', 'uk', 'de']),

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'qvcSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'blender',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "Search keywords (1 to 200 characters), in the market's language",
	},

	// -- Get Product, Get Reviews --
	itemField('qvcProductItem', 'product'),
	itemField('qvcReviewsItem', 'reviews'),

	// -- Get Products --
	{
		displayName: 'Item Numbers',
		name: 'qvcProductsItems',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'K341654, K82223, A700206',
		displayOptions: show(['products']),
		routing: {
			request: {
				body: {
					item_numbers: '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}',
				},
			},
		},
		description: '1 to 20 QVC item numbers, separated by commas',
	},

	// -- Get Category Products --
	{
		displayName: 'Category URL or Path',
		name: 'qvcCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/collections/deals-clearance.html',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					path: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description:
			'A qvc.com category (/c/&lt;name&gt;/-/&lt;group&gt;/c.html) or collection (/collections/&lt;name&gt;.html) link, or its path',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'qvcSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'blen',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far (1 to 100 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'qvcSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Department',
				name: 'qvcSearchDepartment',
				type: 'string',
				default: '',
				placeholder: 'j',
				description:
					"HSN: a department code from a previous answer's departments (j Jewelry, fa Fashion, ho Home...)",
				routing: { request: { body: { department: trimOrUndefined } } },
			},
			{
				displayName: 'Filters',
				name: 'qvcSearchFilters',
				type: 'string',
				default: '',
				placeholder: '8c::1z139k3',
				description:
					"QVC us, uk and de: up to 10 facet tokens from a previous answer's facets values (filter), separated by commas; one category token at most",
				routing: {
					request: {
						body: {
							filters:
								'={{ String($value).trim() === "" ? undefined : String($value).split(",").map(s => s.trim()).filter(Boolean) }}',
						},
					},
				},
			},
			pageOption('qvcSearchPage'),
			{
				displayName: 'Page Size',
				name: 'qvcSearchPageSize',
				type: 'number',
				default: 24,
				typeOptions: { minValue: 1, maxValue: 96 },
				description:
					'QVC: 1 to 96 results a page (default 24). HSN pages are 60 (fixed): leave this unset for HSN.',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'qvcSearchSort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling (HSN)', value: 'best_selling' },
					{ name: 'Featured (HSN Default)', value: 'featured' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Recently On Air (QVC, Not Japan)', value: 'recently_on_air' },
					{ name: 'Relevance (QVC Default)', value: 'relevance' },
					{ name: 'Top Sellers (QVC)', value: 'top_sellers' },
				],
				description:
					'QVC takes relevance, newest, top sellers, rating, recently on air and the price sorts; HSN takes featured, best selling, rating, newest and the price sorts',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'qvcProgramGuideOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['programGuide']),
		options: sorted([
			{
				displayName: 'Channel',
				name: 'qvcProgramGuideChannel',
				type: 'string',
				default: '',
				placeholder: 'QVC',
				description:
					'QVC: one channel by code or name (QVC, 2CH / QVC2, STA / QVC3, ONQ / QVC Home). Defaults to all.',
				routing: { request: { body: { channel: trimOrUndefined } } },
			},
			dateOption(
				'qvcProgramGuideDate',
				'YYYY-MM-DD (US Eastern day). Defaults to today. QVC: 14 days back to 17 ahead.',
			),
			networkOption('qvcProgramGuideNetwork'),
			{
				displayName: 'Time Zone',
				name: 'qvcProgramGuideTimeZone',
				type: 'options',
				default: 'eastern',
				options: [
					{ name: 'Central', value: 'central' },
					{ name: 'Eastern', value: 'eastern' },
					{ name: 'Mountain', value: 'mountain' },
					{ name: 'Pacific', value: 'pacific' },
				],
				description: 'QVC: the time zone of show times. Defaults to Eastern.',
				routing: { request: { body: { time_zone: '={{ $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'qvcRecentlyAiredOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['recentlyAired']),
		options: sorted([
			dateOption('qvcRecentlyAiredDate', 'YYYY-MM-DD (Eastern). Defaults to today.'),
			{
				displayName: 'Hour',
				name: 'qvcRecentlyAiredHour',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 0, maxValue: 23 },
				description:
					"Show hour 0-23 (Eastern), with Date: a program guide row's items_aired hour. Defaults to the latest show.",
				routing: { request: { body: { hour: '={{ $value }}' } } },
			},
			networkOption('qvcRecentlyAiredNetwork'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'qvcCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			pageOption('qvcCategoryPage'),
			{
				displayName: 'Sort',
				name: 'qvcCategorySort',
				type: 'options',
				default: 'relevance',
				options: QVC_SORT_OPTIONS,
				description: 'The order of the grid. Defaults to relevance.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		]),
	},
];
