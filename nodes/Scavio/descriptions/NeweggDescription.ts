import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['newegg'], operation, ...extra },
});

// Newegg (newegg.com, the US computer and electronics store), 10 operations, 2 credits each;
// credits_used is the truth. Markets: us (USD), ca (CAD) and the Newegg Global storefronts uk au nz
// jp ph sg kr th mx (local currency, part of the catalog) on Search Products, Get Category
// Products, Get Product and Get Reviews; us and ca on Get Offers, Get Deals, Get Seller, Get Seller
// Products and Get Search Suggestions; us only on Get Categories (it sends no country). Get Reviews
// needs the item's review_params (group ID, subcategory ID) from Get Product or a search item. A
// retried call can take up to about 4 minutes, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const SITE = 'Newegg (newegg.com, the US computer and electronics store)';
const TWO =
	'Costs 2 credits (credits_used says what was charged). Failed calls and refused inputs are not charged; a not-found is charged.';
const PRICES =
	"list_price is the struck-through price, price the price shown after instant_rebate; a promo code's discount is given apart (promo.code_discount) and never taken off price; lowest_price_30_days is Newegg's own figure as given.";
const ITEM =
	'item number, title, brand, model, URL, list_price, price, instant_rebate, lowest_price_30_days, shipping, promo, badges, rating, review_count, seller (name, url_key, marketplace), shipped_by_newegg, in_stock, open_box, refurbished, sponsored, best_selling_rank, category, image and review_params';

// Comma-separated values sent as a list.
const splitList =
	'={{ String($value).split(",").map(s => s.trim()).filter(Boolean).length ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const COUNTRY_ALL = ['search', 'category', 'product', 'reviews'];
const COUNTRY_US_CA = ['offers', 'deals', 'seller', 'sellerProducts', 'suggestions'];

const pageOption = (name: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description:
		'Page, from 1 (36 to 60 items per page as the site lists them). A page past the last answers no items.',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

// Filters, Page and Sort shared by Search Products, Get Category Products and Get Seller Products.
const gridOptions = (prefix: string, withQuery: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Filters',
			name: `${prefix}Filters`,
			type: 'string',
			default: '',
			placeholder: 'in_stock, sold_by_newegg',
			description:
				'Up to 10, separated by commas: sold_by_newegg, in_stock, new, recertified, used, open_box, lowest_price_30_days, 40_percent_off, or a facet option ID from an answer (brands, specs, price bands)',
			routing: { send: { type: 'body', property: 'filters', value: splitList } },
		},
		pageOption(`${prefix}Page`),
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'featured',
			options: [
				{ name: 'Best Selling', value: 'best_selling' },
				{ name: 'Featured', value: 'featured' },
				{ name: 'Most Reviews', value: 'most_reviews' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description: "Featured is the site's own order",
			routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
		},
	];
	if (withQuery) {
		options.push({
			displayName: 'Query',
			name: `${prefix}Query`,
			type: 'string',
			default: '',
			placeholder: 'rtx 5070',
			description: 'Keywords within the listing',
			routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		});
	}
	return sorted(options);
};

export const neweggOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['newegg'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get newegg categories',
				description: `The newegg.com menu tree: department and category counts and categories (name, category ID, link, children). The category ID is what Get Category Products takes on the US storefront. Captured 2026-11-26: 17 departments and 1055 categories. US only. ${TWO}`,
				routing: request('/api/v1/newegg/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get newegg category products',
				description: `The items of one Newegg category, with keywords, filters and sorts as Search Products: total, items (${ITEM}), facets (the category's spec filters) and breadcrumbs. Category IDs differ per storefront (GPUs: 100007709 on US, 100007708 on Canada): take them from Get Categories (US) or a search answer's categories and breadcrumbs. ${PRICES} Captured 2026-11-26: GPUs in stock on newegg.com listed 5016 items. ${TWO}`,
				routing: request('/api/v1/newegg/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get newegg deals',
				description: `Newegg's deal event stores: Shell Shocker (daily deals) or the Black Friday store, optionally one category: total, ends_at (the Shell Shocker countdown end; one for the whole event), items and categories. A single deal's end shows on Get Product. ${PRICES} Captured 2026-11-26: Shell Shocker listed 38 deals. US and Canada. ${TWO}`,
				routing: request('/api/v1/newegg/deals'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get newegg offers',
				description: `Every seller's offer on one Newegg item (Newegg's own included), by condition: total, pages, tabs (each condition's offer count and lowest price) and offers (item number, price after its instant rebate, list price, shipping, condition, in stock, seller store name with its ratings and top-rated flag, shipped by Newegg, ship-from country, delivery days). Seller names are marketplace store names. Captured 2026-11-26: item 19-113-877 had 28 offers on newegg.com (26 new from 418.99 USD, 2 used from 449.99). US and Canada. ${TWO}`,
				routing: request('/api/v1/newegg/offers'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a newegg product',
				description: `One Newegg item by item number: title, brand, model, MPN, UPC, currency, list, original and current price, instant rebate, Newegg's 30-day lowest price, Black Friday save percent, promo and promo code, badges with dates, stock and quantity limit, shipping, seller, rating, review_params (for Get Reviews), breadcrumbs, bullets, specs, warranty, images, variants, review summary, the reviews the page shows (up to 8, no reviewer names) and questions. When Newegg's own unit is unavailable the page serves a marketplace offer instead: buy_box_changed is true, requested_item is the item number asked for and served_item the offer's. Prices are as the page shows them on this request; there is no separate live price check. ${PRICES} Captured 2026-11-26: AMD Ryzen 7 9800X3D (19-113-877) at 439.99 USD on newegg.com and 549.99 CAD on newegg.ca. An unknown item number is a charged not-found. ${TWO}`,
				routing: request('/api/v1/newegg/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get newegg reviews',
				description: `Customer reviews of one Newegg item, 25 per page, with the Group ID and Subcategory ID from Get Product's review_params: total, pages, star counts and reviews (rating, title, text, pros, cons, date, verified owner, helpful and total votes, the variant reviewed, language, manufacturer reply). No reviewer names. One review pool across Newegg's storefronts. Captured 2026-11-26: item 19-113-877 had 316 reviews over 13 pages. ${TWO}`,
				routing: request('/api/v1/newegg/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get newegg search suggestions',
				description: `Newegg's search box suggestions for what has been typed, with suggested products (item number, title, URL, promo text, rating, review count, image). US and Canada. ${TWO}`,
				routing: request('/api/v1/newegg/suggestions'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a newegg seller',
				description: `A Newegg marketplace seller's public store details: name, seller ID (what Get Seller Products takes), rating, review count, positive percent, about and return policy. Captured 2026-11-26: store TECH-EDGE rated 4.7 from 83 reviews, 93.98% positive. US and Canada. ${TWO}`,
				routing: request('/api/v1/newegg/seller'),
			},
			{
				name: 'Get Seller Products',
				value: 'sellerProducts',
				action: 'Get newegg seller products',
				description: `The items one Newegg marketplace seller lists (seller ID from Get Seller), with keywords, filters and sorts as Search Products: total, items (${ITEM}) and facets. ${PRICES} Captured 2026-11-26: seller 1066805289 listed 2216 items. US and Canada. ${TWO}`,
				routing: request('/api/v1/newegg/seller-products'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search newegg products',
				description: `Keyword search on ${SITE}, newegg.ca or a Newegg Global storefront (local currency, part of the catalog), with named or facet filters and 6 sorts: total, items (${ITEM}), facets (filters: send an option ID back in Filters), categories (this storefront's category IDs) and breadcrumbs. Marketplace items carry the seller's store name and url_key; sponsored items are flagged. ${PRICES} Captured 2026-11-26: "rtx 5070" gave 4556 results on newegg.com, 279 on newegg.ca and 43 on the UK storefront (in GBP). ${TWO}`,
				routing: request('/api/v1/newegg/search'),
			},
		],
		default: 'search',
	},
];

export const neweggFields: INodeProperties[] = [
	// -- Country --
	{
		displayName: 'Country',
		name: 'neweggCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Australia (AUD)', value: 'au' },
			{ name: 'Canada (newegg.ca, CAD)', value: 'ca' },
			{ name: 'Japan (JPY)', value: 'jp' },
			{ name: 'Mexico (MXN)', value: 'mx' },
			{ name: 'New Zealand (NZD)', value: 'nz' },
			{ name: 'Philippines (PHP)', value: 'ph' },
			{ name: 'Singapore (SGD)', value: 'sg' },
			{ name: 'South Korea (KRW)', value: 'kr' },
			{ name: 'Thailand (THB)', value: 'th' },
			{ name: 'United Kingdom (GBP)', value: 'uk' },
			{ name: 'United States (newegg.com, USD)', value: 'us' },
		],
		displayOptions: show(COUNTRY_ALL),
		description:
			'The storefront. The Newegg Global storefronts carry part of the catalog, in English, priced in the local currency.',
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Country',
		name: 'neweggCountryUsCa',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (newegg.ca, CAD)', value: 'ca' },
			{ name: 'United States (newegg.com, USD)', value: 'us' },
		],
		displayOptions: show(COUNTRY_US_CA),
		description: 'The storefront (the Newegg Global storefronts do not serve this operation)',
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'neweggSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rtx 5070',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'neweggSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('neweggSearch', false),
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'neweggCategoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '100007709',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description:
			"A category ID of this storefront: from Get Categories (US) or a search answer's categories and breadcrumbs",
	},
	{
		displayName: 'Additional Options',
		name: 'neweggCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('neweggCategory', true),
	},

	// -- Get Product, Get Offers, Get Reviews --
	{
		displayName: 'Item Number',
		name: 'neweggItemNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '19-113-877',
		displayOptions: show(['product', 'offers', 'reviews']),
		routing: { request: { body: { item_number: '={{ String($value).trim() }}' } } },
		description:
			'A Newegg item number: N82E16819113877 or 19-113-877 (R suffix = open box), 9SIA2W0KDW5195 (a marketplace item), or a search item number',
	},
	{
		displayName: 'Additional Options',
		name: 'neweggOffersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['offers']),
		options: [
			{
				displayName: 'Condition',
				name: 'neweggOffersCondition',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'New', value: 'new' },
					{ name: 'Used', value: 'used' },
				],
				description: 'Offers of every condition (default), new or used',
				routing: {
					request: { body: { condition: '={{ $value === "all" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Page',
				name: 'neweggOffersPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Page, from 1',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'neweggOffersPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Offers per page, 1 to 20',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'neweggOffersSort',
				type: 'options',
				default: 'price',
				options: [
					{ name: 'Price (Low to High)', value: 'price' },
					{ name: 'Seller Rating', value: 'seller_rating' },
				],
				description: 'Price, low to high (default), or seller rating',
				routing: { request: { body: { sort: '={{ $value === "price" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Reviews --
	{
		displayName: 'Group ID',
		name: 'neweggReviewsGroupId',
		type: 'number',
		required: true,
		default: 0,
		placeholder: '196668433',
		displayOptions: show(['reviews']),
		routing: { request: { body: { group_id: '={{ $value }}' } } },
		description: 'Review_params.group_id of Get Product (or a search item) for this item',
	},
	{
		displayName: 'Subcategory ID',
		name: 'neweggReviewsSubcategoryId',
		type: 'number',
		required: true,
		default: 0,
		placeholder: '343',
		displayOptions: show(['reviews']),
		routing: { request: { body: { subcategory_id: '={{ $value }}' } } },
		description: 'Review_params.subcategory_id of Get Product (or a search item) for this item',
	},
	{
		displayName: 'Additional Options',
		name: 'neweggReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'neweggReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 400 },
				description: 'Page of 25 reviews, from 1',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'neweggReviewsRating',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'Only reviews with this star rating, 1 to 5 (0: every rating)',
				routing: { request: { body: { rating: '={{ $value >= 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'neweggReviewsSort',
				type: 'options',
				default: 'most_helpful',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
				],
				description: 'Most helpful first (default), newest, highest or lowest rated',
				routing: {
					request: { body: { sort: '={{ $value === "most_helpful" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Verified Owners Only',
				name: 'neweggReviewsVerifiedOnly',
				type: 'boolean',
				default: false,
				description: "Whether to return verified owners' reviews only",
				routing: { request: { body: { verified_only: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'neweggDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			{
				displayName: 'Category ID',
				name: 'neweggDealsCategoryId',
				type: 'string',
				default: '',
				description: "Deals in this category (the answer's categories[].category_id)",
				routing: {
					request: { body: { category_id: '={{ String($value).trim() || undefined }}' } },
				},
			},
			pageOption('neweggDealsPage'),
			{
				displayName: 'Type',
				name: 'neweggDealsType',
				type: 'options',
				default: 'shell_shocker',
				options: [
					{ name: 'Black Friday', value: 'black_friday' },
					{ name: 'Shell Shocker (Daily Deals)', value: 'shell_shocker' },
				],
				description: "Newegg's daily deals (default) or the Black Friday event store",
				routing: {
					request: { body: { type: '={{ $value === "shell_shocker" ? undefined : $value }}' } },
				},
			},
		],
	},

	// -- Get Seller --
	{
		displayName: 'Seller Store Key',
		name: 'neweggSellerKey',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TECH-EDGE',
		displayOptions: show(['seller']),
		routing: { request: { body: { seller: '={{ String($value).trim() }}' } } },
		description: "A marketplace seller's store key (seller.url_key of a search item or an offer) or a /Seller-Store/ link",
	},

	// -- Get Seller Products --
	{
		displayName: 'Seller ID',
		name: 'neweggSellerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1066805289',
		displayOptions: show(['sellerProducts']),
		routing: { request: { body: { seller_id: '={{ String($value).trim() }}' } } },
		description: 'The seller ID of Get Seller',
	},
	{
		displayName: 'Additional Options',
		name: 'neweggSellerProductsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerProducts']),
		options: gridOptions('neweggSellerProducts', true),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'neweggSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rtx 5',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What has been typed so far (up to 100 characters)',
	},
];
