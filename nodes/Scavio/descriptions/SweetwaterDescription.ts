import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['sweetwater'], operation, ...extra },
});

// Sweetwater (sweetwater.com, the US online music instrument and pro audio retailer), 6 operations, 1 credit each;
// credits_used is the truth. US only, USD. Calls usually take 2 to 15 s; every operation carries a 180s timeout (the
// backend allows 90 s per attempt with one retry).
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = 'Sweetwater (sweetwater.com, the US online music instrument and pro audio retailer), US only, prices in USD';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const MARKET = 'Every answer carries store, host, country (us), currency (USD) and language (en).';
const HIT =
	'position, item_id for Get Product, name, brand, type, category, URL, image, condition, price (the price now), retail_price, base_price, has_price_drop, instant_rebate, mail_in_rebate, bundle_savings, special_offer, in_stock, on_hand (units on hand), available (units available to sell; can be negative when more are sold than on hand), on_order (units on order), pre_order, special_order, free_shipping, open_box (Demo units with item_id and price), rating, review_count';
const CARD =
	'position, item_id, name, URL, image, price, offer (the offer text as shown), rating, review_count, stock (the stock text as shown, e.g. In Stock or Only 6 Left), open_box, serial (number and weight of a serial-numbered instrument), bundle_savings_available';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const listSortOptions = [
	{ name: 'Brand: A - Z', value: 'brand' },
	{ name: 'Customer Rating', value: 'rating' },
	{ name: 'Lightest Guitar', value: 'lightest' },
	{ name: 'Most Popular', value: 'popular' },
	{ name: 'Newest Arrivals', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_desc' },
	{ name: 'Price: Low to High', value: 'price_asc' },
];

const pageOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 120 },
	description,
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

/** An item ID or a sweetwater.com product link, sent as item_id or url. */
const itemField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Item ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'DD8',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				item_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'A Sweetwater item ID (item_id from another answer; the part before -- in a sweetwater.com/store/detail/ link, e.g. DD8) or a sweetwater.com product link. An open-box unit has its own ID (open_box item_id); a ?cond= open-box link selects that unit.',
});

export const sweetwaterOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['sweetwater'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get sweetwater category products',
				description: `One ${SITE} category listing, 42 products per page with the site's 7 sorts and facet filters: category (ID, name, URL), breadcrumbs, sort, page, total (as the site counts it, at most 5,000), total_pages, per_page, requested_facets, applied_facets, count, items (${CARD}) and facets (name, values with counts; send back in Facets). ${MARKET} Captured 2026-11-27: c590 (Solidbody Guitars) counted 5,000 products; sorted Price: Low to High the first was at 149 USD. An unknown category is a charged not-found. ${ONE}`,
				routing: request('/api/v1/sweetwater/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get sweetwater deals',
				description: `The ${SITE} Deal Zone: the whole Deal Zone or one of its pages (guitar-deals, price-drops, demos, bundles, rebates-and-promos ...), 42 per page, with the Deal Zone's sort menu: deal, deal_name, sort, page, total, total_pages, per_page, sale_event (name, starts, ends as the page gives them; the page states no time zone), count, items (${HIT}) and deal_pages (slug for Deal Page, name). ${MARKET} Captured 2026-11-27: guitar-deals held 8,493 items under the Black Friday event to 2026-11-30, and the Deal Zone listed 145 deal pages. An unknown deal page is a charged not-found. ${ONE}`,
				routing: request('/api/v1/sweetwater/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a sweetwater product',
				description: `One ${SITE} product by item ID or link: item_id, requested, name, full_name, brand, MPN, type, category, breadcrumbs, URL, condition (New, or Used for an open-box unit), open_box, serial_number, price, currency, was_price, price_drop, instant_savings, new_price (the new price, on an open-box unit), availability (InStock, BackOrder ... as given), stock_text (as shown), estimated_by (the backorder date text), warehouse_flags (the page's in-stock flags per warehouse, as given), ship_weight_lbs, free_shipping, return_days, rating, review_count, dimensions, images and specs (name, value). ${MARKET} Captured 2026-11-27: the Boss DD-8 Digital Delay Pedal at 168.88 USD (was 197.99), In Stock!, rated 5 from 39 reviews. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/sweetwater/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get sweetwater reviews',
				description: `Customer reviews of one ${SITE} product: every review the product has, filtered by stars, sorted newest, oldest, highest or lowest and paged: item_id, requested, name, brand, average_rating, total_reviews, star_percent, stars, sort, page, limit, total (reviews matching stars), total_pages, count and reviews (rating, title, text, date). No reviewer names, locations or backgrounds. ${MARKET} Captured 2026-11-27: the Shure SM58 averaged 4.7 from 372 reviews. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/sweetwater/reviews'),
			},
			{
				name: 'Get Serial Units',
				value: 'serialUnits',
				action: 'Get sweetwater serial units',
				description: `The serial-numbered units of one ${SITE} item (Sweetwater photographs and weighs many guitars and basses one by one): item_id, requested, name, brand, condition, price, parent_item_id, parent_price, URL, serial_sold, serial_reserved (the flags of the requested unit, as given), open_box, count, units (position, serial_number, item_id, weight_lbs as its shipping weight, URL, photos) and note. An item sold without serial numbers has an empty units list. ${MARKET} Captured 2026-11-27: the Fender American Ultra II Stratocaster HSS in Ultraburst at 2359.99 USD listed 6 units, the first 8.05 lbs. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/sweetwater/serial-units'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search sweetwater products',
				description: `${SITE} keyword search. Free-text keywords show 42 results in Sweetwater's relevance order (the site does not page or sort free-text results): items (${HIT}). A keyword that matches a category opens that category instead (landed_on category): items are then its listing cards with Sort and Page applied, plus facets. A keyword that opens one product page answers landed_on product and landed_url. Returns query, landed_on, category, sort, page, total, total_pages, per_page, count, items, facets and note. ${MARKET} Captured 2026-11-27: boss delay pedal gave 20 results, the first the Boss DD-8 Digital Delay Pedal at 168.88 USD with 204 units available. ${ONE}`,
				routing: request('/api/v1/sweetwater/search'),
			},
		],
		default: 'search',
	},
];

export const sweetwaterFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'sweetwaterQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'boss delay pedal',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'sweetwaterSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			pageOption(
				'sweetwaterSearchPage',
				'Page, 1-based. Free-text search shows 42 results on one page (a page past 1 is an empty list); when the keyword opens a category, pages of 42 apply.',
			),
			{
				displayName: 'Sort',
				name: 'sweetwaterSearchSort',
				type: 'options',
				default: 'relevance',
				options: [...listSortOptions, { name: 'Relevance', value: 'relevance' }],
				description:
					'Free-text results stay in relevance order; a sort applies when the keyword opens a category (landed_on category)',
				routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'sweetwaterCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'c590--Solid_Body_Guitars',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A Sweetwater category: an ID (c590), a path (c590--Solid_Body_Guitars) or a sweetwater.com category link (facets on a pasted link are kept when Facets is not set)',
	},
	{
		displayName: 'Additional Options',
		name: 'sweetwaterCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			{
				displayName: 'Facets (JSON)',
				name: 'sweetwaterCategoryFacets',
				type: 'json',
				default: '{}',
				description:
					'Facet filters as the site names them (facets name and values from an answer), several values per facet, up to 12 facets, e.g. {"Availability": ["In Stock"], "Brand": ["Fender", "Gibson"], "Price Range": ["$500 - $1,000"]}',
				routing: {
					request: {
						body: {
							facets:
								'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
						},
					},
				},
			},
			pageOption(
				'sweetwaterCategoryPage',
				'Page, 1-based, 42 products per page. Sweetwater counts at most 5,000 products in a listing, so the last page is 120.',
			),
			{
				displayName: 'Sort',
				name: 'sweetwaterCategorySort',
				type: 'options',
				default: 'popular',
				options: listSortOptions,
				description: "The site's sort menu",
				routing: { request: { body: { sort: '={{ $value === "popular" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Product, Get Serial Units, Get Reviews --
	itemField('sweetwaterProductItem', 'product'),
	itemField('sweetwaterSerialUnitsItem', 'serialUnits'),
	itemField('sweetwaterReviewsItem', 'reviews'),
	{
		displayName: 'Additional Options',
		name: 'sweetwaterReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Limit',
				name: 'sweetwaterReviewsLimit',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'sweetwaterReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Reviews page, 1-based',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sweetwaterReviewsSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rated', value: 'highest' },
					{ name: 'Lowest Rated', value: 'lowest' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: "The site's review sort menu",
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'sweetwaterReviewsStars',
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
				description: "Reviews with this many stars (the site's own filter)",
				routing: { request: { body: { stars: '={{ $value ? $value : undefined }}' } } },
			},
		]),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'sweetwaterDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Deal Page',
				name: 'sweetwaterDealsDeal',
				type: 'string',
				default: '',
				placeholder: 'guitar-deals',
				description:
					'A Deal Zone page (deal_pages slug from an answer: guitar-deals, price-drops, demos, bundles, rebates-and-promos ...). Leave empty for the whole Deal Zone.',
				routing: { request: { body: { deal: '={{ String($value).trim() || undefined }}' } } },
			},
			pageOption('sweetwaterDealsPage', 'Page, 1-based, 42 items per page (up to 120)'),
			{
				displayName: 'Sort',
				name: 'sweetwaterDealsSort',
				type: 'options',
				default: 'featured',
				options: [
					{ name: 'Best Deals', value: 'best_deals' },
					{ name: 'Brand: A - Z', value: 'brand' },
					{ name: 'Ending Soon', value: 'ending_soon' },
					{ name: 'Featured', value: 'featured' },
					{ name: 'Most Popular', value: 'popular' },
					{ name: 'Newest Arrivals', value: 'newest' },
					{ name: 'Newest Deals', value: 'newest_deals' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: "The Deal Zone sort menu (Featured is the Deal Zone's own order)",
				routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
			},
		]),
	},
];
