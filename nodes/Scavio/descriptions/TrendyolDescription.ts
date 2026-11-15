import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['trendyol'], operation, ...extra },
});

// Trendyol, 12 operations, 1 credit each. 35 markets (Country) with their languages (Language):
// Turkey (TRY; Turkish, English or Arabic), Germany and Austria (EUR; German), France, Belgium,
// Croatia, Denmark, Estonia, Finland, Italy, Latvia, Lithuania, Netherlands, Portugal, Slovenia,
// Spain, Sweden, Luxembourg (EUR; English), Bulgaria (EUR; bg or en), Greece (EUR; el or en),
// Slovakia (EUR; sk or en), Czechia (CZK; cs or en), Hungary (HUF; hu or en), Poland (PLN; pl or
// en), Romania (RON; ro or en), Serbia (RSD; sr or en), Ukraine (UAH; uk or en), Moldova (MDL; ro
// or en), UAE (AED; en or ar), Saudi Arabia (SAR; ar or en), Qatar, Kuwait, Oman, Bahrain (ar or
// en) and Azerbaijan (AZN; Turkish). Get Deals and Get Coupons are Turkey only; Get Rankings is not
// on the 15 English-language EU storefronts. Some operations make two upstream requests, so every
// operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ALL_MARKET_OPS = [
	'search',
	'product',
	'category',
	'brand',
	'reviews',
	'questions',
	'seller',
	'suggestions',
	'delivery',
];
const RANKING_OPS = ['rankings'];
const PRODUCT_REF_OPS = ['product', 'reviews', 'questions', 'coupons', 'delivery'];
const ALL_OPS = [...ALL_MARKET_OPS, ...RANKING_OPS, 'deals', 'coupons'];

const PRICES =
	"Prices are in the market's currency. Each international storefront has its own price list, not a currency conversion of the Turkish price; items there are sold by Trendyol itself or by other sellers (see buy_box and other_sellers on Get Product). original_price is the crossed-out price; lowest_price_badge is the site's 'lowest price of the last N days' tag (a day count only). Trendyol publishes no numeric 30-day lowest price and no price history.";
const GRID =
	"36 items per page (at most 138 pages): count (organic), sponsored_count, total (capped at 100000: total_capped), page, total_pages, sort and items with content_id, listing_id, name, brand, category, URL, images, price, original_price, discount_percent, rrp, plus_price, lowest_price_badge, badges, rating, review_count, favourites and orders (the site's rounded text), seller (ID) and sponsored (flagged, kept, repeating across pages).";
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';
const SPLIT = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const MARKETS: Array<{ name: string; value: string }> = [
	{ name: 'Austria', value: 'at' },
	{ name: 'Azerbaijan', value: 'az' },
	{ name: 'Bahrain', value: 'bh' },
	{ name: 'Belgium', value: 'be' },
	{ name: 'Bulgaria', value: 'bg' },
	{ name: 'Croatia', value: 'hr' },
	{ name: 'Czechia', value: 'cz' },
	{ name: 'Denmark', value: 'dk' },
	{ name: 'Estonia', value: 'ee' },
	{ name: 'Finland', value: 'fi' },
	{ name: 'France', value: 'fr' },
	{ name: 'Germany', value: 'de' },
	{ name: 'Greece', value: 'gr' },
	{ name: 'Hungary', value: 'hu' },
	{ name: 'Italy', value: 'it' },
	{ name: 'Kuwait', value: 'kw' },
	{ name: 'Latvia', value: 'lv' },
	{ name: 'Lithuania', value: 'lt' },
	{ name: 'Luxembourg', value: 'lu' },
	{ name: 'Moldova', value: 'md' },
	{ name: 'Netherlands', value: 'nl' },
	{ name: 'Oman', value: 'om' },
	{ name: 'Poland', value: 'pl' },
	{ name: 'Portugal', value: 'pt' },
	{ name: 'Qatar', value: 'qa' },
	{ name: 'Romania', value: 'ro' },
	{ name: 'Saudi Arabia', value: 'sa' },
	{ name: 'Serbia', value: 'rs' },
	{ name: 'Slovakia', value: 'sk' },
	{ name: 'Slovenia', value: 'si' },
	{ name: 'Spain', value: 'es' },
	{ name: 'Sweden', value: 'se' },
	{ name: 'Turkey', value: 'tr' },
	{ name: 'Ukraine', value: 'ua' },
	{ name: 'United Arab Emirates', value: 'ae' },
];
// The 15 English-language EU storefronts have no ranking lists (400 there).
const NO_RANKINGS = [
	'fr',
	'be',
	'hr',
	'dk',
	'ee',
	'fi',
	'it',
	'lv',
	'lt',
	'nl',
	'pt',
	'si',
	'es',
	'se',
	'lu',
];
const RANKING_MARKETS = MARKETS.filter((m) => !NO_RANKINGS.includes(m.value));

const countryField = (
	markets: Array<{ name: string; value: string }>,
	operations: string[],
	description: string,
): INodeProperties => ({
	displayName: 'Country',
	name: 'country',
	type: 'options',
	default: 'tr',
	options: markets,
	displayOptions: show(operations),
	routing: { request: { body: { country: '={{ $value === "tr" ? undefined : $value }}' } } },
	description,
});

const sortOption = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'recommended',
	options: [
		{ name: 'Best Seller', value: 'best_seller' },
		{ name: 'Most Favourited', value: 'most_favourited' },
		{ name: 'Most Rated', value: 'most_rated' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Recommended', value: 'recommended' },
	],
	description: 'Result order',
	routing: {
		request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } },
	},
};

const pageOption = {
	displayName: 'Page',
	name: 'page',
	type: 'number' as const,
	default: 1,
	typeOptions: { minValue: 1, maxValue: 138 },
	description: 'Results page, 1-based (36 per page; the site lists at most 138 pages)',
	routing: { request: { body: { page: '={{ $value }}' } } },
};

const brandIdsOption = {
	displayName: 'Brand IDs',
	name: 'brand_id',
	type: 'string' as const,
	default: '',
	placeholder: '794',
	description: '1 to 10 brand IDs (items[].brand.ID, e.g. 794 Samsung), comma-separated',
	routing: { request: { body: { brand_id: SPLIT } } },
};
const categoryIdsOption = {
	displayName: 'Category IDs',
	name: 'category_id',
	type: 'string' as const,
	default: '',
	placeholder: '103498',
	description: '1 to 10 category IDs (category.ID of a product, or the wc facet), comma-separated',
	routing: { request: { body: { category_id: SPLIT } } },
};
const sellerIdOption = {
	displayName: 'Seller ID',
	name: 'seller_id',
	type: 'string' as const,
	default: '',
	placeholder: '4473',
	description: "Only one seller's items (items[].seller.ID)",
	routing: { request: { body: { seller_id: '={{ $value || undefined }}' } } },
};

// Grid filters shared by Search Products, Get Category Products, Get Brand Products, Get Deals and
// Get Seller (with Include Products). Sorted by display name, as n8n requires.
const filterOptions = (exclude: string[] = []) =>
	[
		brandIdsOption,
		categoryIdsOption,
		{
			displayName: 'Fast Delivery Only',
			name: 'fast_delivery',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only items with rush delivery',
			routing: { request: { body: { fast_delivery: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Filters',
			name: 'filters',
			type: 'json' as const,
			default: '{}',
			description:
				'Any other facet of a previous response (send Include Facets once to read them): facets[].param to options[].value values, e.g. {"attr": ["348|1"]} (a color) or {"wg": "1"} (a gender)',
			routing: {
				request: {
					body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
				},
			},
		},
		{
			displayName: 'Flash Sale Only',
			name: 'flash_sale',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only flash-sale items',
			routing: { request: { body: { flash_sale: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Free Shipping Only',
			name: 'free_shipping',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only items with free shipping',
			routing: { request: { body: { free_shipping: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Has Coupon Only',
			name: 'has_coupon',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only items with a collectable coupon',
			routing: { request: { body: { has_coupon: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Include Facets',
			name: 'include_facets',
			type: 'boolean' as const,
			default: false,
			description:
				'Whether to also return facets (filter groups with option values and counts). Still 1 credit.',
			routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Lowest-Price Badge',
			name: 'lowest_price_days',
			type: 'options' as const,
			default: 0,
			options: [
				{ name: 'Any', value: 0 },
				{ name: 'Lowest of 10 Days (Turkey)', value: 10 },
				{ name: 'Lowest of 14 Days', value: 14 },
				{ name: 'Lowest of 30 Days', value: 30 },
				{ name: 'Lowest of 7 Days (International)', value: 7 },
				{ name: 'Lowest of 90 Days (Turkey)', value: 90 },
			],
			description: "Only items carrying the site's lowest-price badge for that many days",
			routing: { request: { body: { lowest_price_days: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Maximum Price',
			name: 'price_max',
			type: 'number' as const,
			default: 0,
			typeOptions: { minValue: 0 },
			description: "Highest price, in the market's currency",
			routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Minimum Discount (%)',
			name: 'min_discount',
			type: 'number' as const,
			default: 0,
			typeOptions: { minValue: 0, maxValue: 90 },
			description: 'Only items at least this many percent off (0 = any)',
			routing: { request: { body: { min_discount: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Minimum Price',
			name: 'price_min',
			type: 'number' as const,
			default: 0,
			typeOptions: { minValue: 0 },
			description: "Lowest price, in the market's currency",
			routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Minimum Rating',
			name: 'min_rating',
			type: 'options' as const,
			default: 0,
			options: [
				{ name: '1 Star and Up', value: 1 },
				{ name: '2 Stars and Up', value: 2 },
				{ name: '3 Stars and Up', value: 3 },
				{ name: '4 Stars and Up', value: 4 },
				{ name: '4.5 Stars and Up', value: 4.5 },
				{ name: 'Any', value: 0 },
			],
			description: 'Product rating',
			routing: { request: { body: { min_rating: '={{ $value || undefined }}' } } },
		},
		pageOption,
		sellerIdOption,
		{
			displayName: 'Seller Type',
			name: 'seller_type',
			type: 'options' as const,
			default: '',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Authorized Sellers', value: 'authorized' },
				{ name: 'Official (Brand) Sellers', value: 'official' },
				{ name: 'Successful Sellers', value: 'successful' },
			],
			description: 'Only one kind of seller',
			routing: { request: { body: { seller_type: '={{ $value || undefined }}' } } },
		},
		sortOption,
	].filter((o) => !exclude.includes(o.name));

const refFields = (
	ops: string[],
	by: string,
	label: string,
	idName: string,
	idField: string,
	idPlaceholder: string,
	idDescription: string,
	urlName: string,
	urlDescription: string,
): INodeProperties[] => [
	{
		displayName: `${label} By`,
		name: by,
		type: 'options',
		// 'id' is one of the two options below; the rule cannot read templated option names.
		// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
		default: 'id',
		options: [
			{ name: `${label} ID`, value: 'id' },
			{ name: `${label} URL`, value: 'url' },
		],
		displayOptions: show(ops),
		description: `Read the ${label.toLowerCase()} by its ID or by its link`,
	},
	{
		displayName: `${label} ID`,
		name: idName,
		type: 'string',
		required: true,
		default: '',
		placeholder: idPlaceholder,
		displayOptions: show(ops, { [by]: ['id'] }),
		routing: { request: { body: { [idField]: '={{ $value }}' } } },
		description: idDescription,
	},
	{
		displayName: `${label} URL`,
		name: urlName,
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(ops, { [by]: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: urlDescription,
	},
];

export const trendyolOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['trendyol'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get trendyol brand products',
				description: `One brand's products by brand ID or link, with the search sorts and filters. Returns brand (ID, name, URL) and ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get trendyol category products',
				description: `One category's products by category ID or link (IDs are the same on every market), with the search sorts and filters. Returns category (ID, name, URL) and ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/category'),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get trendyol coupons',
				description: `The collectable coupons on one product's listing (the buy box, or another seller's with Seller ID): discount, discount_type, min_basket, max_discount, valid_until (Turkey time), issued_by, seller_id, mega_coupon, plus_members_only, plus product (name, seller, price). Coupons belong to each seller's listing: the buy box often has none while another seller has some. Turkey only. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/coupons'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get trendyol deals',
				description: `Flash deals (slots plus the live or a chosen slot's items) or Super Firsatlar super discounts, with the search sorts and filters. Returns ${GRID} ${PRICES} Turkey only. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/deals'),
			},
			{
				name: 'Get Delivery Estimate',
				value: 'delivery',
				action: 'Get a trendyol delivery estimate',
				description: `Delivery estimate for one product variant from every seller listing it: time_zone and listings (listing_id, seller, buy_box, delivery start and end, ships_by, ships_in_days, cutoffs, rush_delivery_hours, local_delivery, carriers). In Turkey, City ID and District ID narrow it to an address (Istanbul 133, Sisli 54; there is no city list). No pickup points. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/delivery'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a trendyol product',
				description: `One product by content ID or link, with the buy-box seller and every other seller's offer: prices, lowest_price_badge, stock, variants (with barcode), attributes, images, rating, review_count, favourite_count, category_rankings, buy_box (seller ID, name, score out of 10, badges, city; listing_id, prices, free_shipping, rush_delivery_hours, has_coupon), other_sellers (each seller's price, score, badges, lowest_price_badge, promotions), promotions, returnable, max_installments and vat_percent. Trendyol's developer FAQ says the buy box is chosen by algorithm metrics, not price alone. No seller e-mail, tax number or address. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get trendyol seller questions',
				description: `A product's answered seller questions: questions (text, date, verified_buyer, answer with text and seller), topics, total, page and total_pages. Askers are not named. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/questions'),
			},
			{
				name: 'Get Rankings',
				value: 'rankings',
				action: 'Get trendyol rankings',
				description: `A category's top-100 list (best sellers, most favourited, most rated or top viewed), 20 per page: items (rank, content_id, name, brand, prices, lowest_price_badge, rating, review_count, in_stock, seller), total, page and total_pages. Not on the 15 English-language EU storefronts, which have no ranking lists. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/rankings'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get trendyol reviews',
				description: `A product's reviews: rating, rating_count, rating_histogram, topics (with positive / negative counts), sizes, review_summary (Trendyol's own) and reviews (rating, text, date, likes, author as the site shows it, already masked, verified_buyer, seller, size, fit, photos), page and total_pages. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get trendyol search suggestions',
				description: `Search-box suggestions for a partial query: text, type (keyword, category, brand, store), URL, category_ids, seller_id, brand_id and image. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/suggestions'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a trendyol seller',
				description: `A seller's store profile by seller ID or store link: score out of 10, product_count, follower_count, badges, city, on_trendyol_for, average_shipping_time, question_response_time, average ratings, metrics, logo and store_url, plus (with Include Products) the seller's products as a grid. No e-mail, tax number, address or legal name. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/seller'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search trendyol products',
				description: `Search Trendyol by keyword, sorted by recommended, price, newest, best seller, most favourited or most rated and filtered by price, brand, category, seller, rating, free shipping, rush delivery, discount, lowest-price badge, seller type, flash sale, coupon or any facet. Returns ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/trendyol/search'),
			},
		],
		default: 'search',
	},
];

export const trendyolFields: INodeProperties[] = [
	// -- Market --
	countryField(
		MARKETS,
		ALL_MARKET_OPS,
		"The Trendyol market. Data comes in the market's language and prices in its currency.",
	),
	countryField(
		RANKING_MARKETS,
		RANKING_OPS,
		'The Trendyol market (the 15 English-language EU storefronts have no ranking lists)',
	),
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Arabic', value: 'ar' },
			{ name: 'Bulgarian', value: 'bg' },
			{ name: 'Czech', value: 'cs' },
			{ name: 'English', value: 'en' },
			{ name: 'German', value: 'de' },
			{ name: 'Greek', value: 'el' },
			{ name: 'Hungarian', value: 'hu' },
			{ name: "Market's Default", value: '' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Romanian', value: 'ro' },
			{ name: 'Serbian', value: 'sr' },
			{ name: 'Slovak', value: 'sk' },
			{ name: 'Turkish', value: 'tr' },
			{ name: 'Ukrainian', value: 'uk' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			'Language of the market (default its first). Turkey: Turkish, English or Arabic; Germany and Austria: German; the 15 EU English storefronts: English; Bulgaria, Greece, Slovakia, Czechia, Hungary, Poland, Romania, Serbia, Ukraine: the local language or English; Moldova: Romanian or English; UAE: English or Arabic; Saudi Arabia, Qatar, Kuwait, Oman, Bahrain: Arabic or English; Azerbaijan: Turkish. Another language answers 400.',
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'telefon',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "Search keywords, in the market's language",
	},

	// -- Product reference: Get Product, Get Reviews, Get Questions, Get Coupons, Get Delivery Estimate --
	...refFields(
		PRODUCT_REF_OPS,
		'productBy',
		'Product',
		'contentId',
		'content_id',
		'975557855',
		'A product content ID (items[].content_id, the number after -p- in a product link)',
		'productUrl',
		'A product link of any Trendyol storefront (a language-only path like /en/... needs Country)',
	),

	// -- Get Category Products --
	...refFields(
		['category'],
		'categoryBy',
		'Category',
		'categoryId',
		'category_id',
		'103498',
		'A category ID (103498 phones, 56 dresses; the same ID on every market)',
		'categoryUrl',
		'A category link (<name>-x-c<ID>)',
	),

	// -- Get Brand Products --
	...refFields(
		['brand'],
		'brandBy',
		'Brand',
		'brandId',
		'brand_id',
		'794',
		'A brand ID (items[].brand.ID, e.g. 794 Samsung)',
		'brandUrl',
		'A brand link (<brand>-x-b<ID>)',
	),

	// -- Get Seller --
	...refFields(
		['seller'],
		'sellerBy',
		'Seller',
		'sellerId',
		'seller_id',
		'4473',
		'A seller ID (items[].seller.ID, buy_box.seller.ID or other_sellers[].seller.ID)',
		'sellerUrl',
		'A seller store link (/magaza/<name>-m-<ID>, or /store/<name>-m-<ID> on international storefronts)',
	),
	{
		displayName: 'Include Products',
		name: 'include_products',
		type: 'boolean',
		default: false,
		displayOptions: show(['seller']),
		routing: { request: { body: { include_products: '={{ $value || undefined }}' } } },
		description: "Whether to also return the seller's products as a grid. Still 1 credit.",
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'dealType',
		type: 'options',
		default: 'flash',
		options: [
			{ name: 'Flash Deals', value: 'flash' },
			{ name: 'Super Discounts (Super Firsatlar)', value: 'super_discounts' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "flash" ? undefined : $value }}' } } },
		description: 'Flash deals (the live slot unless Slot is set) or super discounts. Turkey only.',
	},
	{
		displayName: 'Slot',
		name: 'slot',
		type: 'string',
		default: '',
		placeholder: 'fs_15_11_2026_21_24',
		displayOptions: show(['deals'], { dealType: ['flash'] }),
		routing: { request: { body: { slot: '={{ $value || undefined }}' } } },
		description:
			'A flash slot tag from slots[].tag of a previous response (tags are dated); empty = the live slot',
	},

	// -- Get Rankings --
	{
		displayName: 'Category ID',
		name: 'rankingCategoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '56',
		displayOptions: show(['rankings']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'A category ID: 56 dresses, 103498 phones, 1156 lipsticks',
	},
	{
		displayName: 'Ranking',
		name: 'ranking',
		type: 'options',
		default: 'best_seller',
		options: [
			{ name: 'Best Sellers', value: 'best_seller' },
			{ name: 'Most Favourited', value: 'most_favourited' },
			{ name: 'Most Rated', value: 'most_rated' },
			{ name: 'Top Viewed', value: 'top_viewed' },
		],
		displayOptions: show(['rankings']),
		routing: {
			request: { body: { ranking: '={{ $value === "best_seller" ? undefined : $value }}' } },
		},
		description: 'Which top-100 list',
	},
	{
		displayName: 'Page',
		name: 'rankingPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 5 },
		displayOptions: show(['rankings']),
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		description: 'Page of 20, 1 to 5 (the top 100)',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'suggestionQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'iph',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Additional Options: grids --
	{
		displayName: 'Additional Options',
		name: 'gridOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search', 'deals']),
		options: filterOptions(),
	},
	{
		displayName: 'Additional Options',
		name: 'gridOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: filterOptions(['category_id']),
	},
	{
		displayName: 'Additional Options',
		name: 'gridOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: filterOptions(['brand_id']),
	},
	{
		displayName: 'Additional Options',
		name: 'sellerOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['seller']),
		options: [
			// Applied with Include Products. Query sits between Page and Seller Type alphabetically.
			...filterOptions(['seller_id']).slice(0, -2),
			{
				displayName: 'Query',
				name: 'query',
				type: 'string' as const,
				default: '',
				description: "Search within the seller's products",
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			...filterOptions(['seller_id']).slice(-2),
		],
	},

	// -- Additional Options: Get Product --
	{
		displayName: 'Additional Options',
		name: 'productOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Include Description',
				name: 'include_description',
				type: 'boolean',
				default: false,
				description:
					"Whether to also return the seller's description (text and HTML). Still 1 credit.",
				routing: { request: { body: { include_description: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'reviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'rating',
				type: 'options',
				default: 0,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
					{ name: 'Any', value: 0 },
				],
				description: 'Only reviews with this many stars',
				routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Reviews Per Page',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Rating: High to Low', value: 'rating_desc' },
					{ name: 'Rating: Low to High', value: 'rating_asc' },
					{ name: 'Recommended', value: 'recommended' },
				],
				description: 'Review order',
				routing: {
					request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'With Photos Only',
				name: 'with_media',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews with photos',
				routing: { request: { body: { with_media: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Questions --
	{
		displayName: 'Additional Options',
		name: 'questionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['questions']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Questions Per Page',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Questions per page, 1 to 20',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Coupons --
	{
		displayName: 'Additional Options',
		name: 'couponOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['coupons']),
		options: [
			{
				displayName: 'Seller ID',
				name: 'seller_id',
				type: 'string',
				default: '',
				placeholder: '1188867',
				description:
					"Which seller's listing to read coupons for (default the buy box; another seller from Get Product's other_sellers[].seller.ID)",
				routing: { request: { body: { seller_id: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Delivery Estimate --
	{
		displayName: 'Additional Options',
		name: 'deliveryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['delivery']),
		options: [
			{
				displayName: 'City ID (Turkey)',
				name: 'city_id',
				type: 'string',
				default: '',
				placeholder: '133',
				description: 'A Turkish city ID (Turkey only; Istanbul is 133)',
				routing: { request: { body: { city_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'District ID (Turkey)',
				name: 'district_id',
				type: 'string',
				default: '',
				placeholder: '54',
				description:
					"A district ID of that city (Turkey only, needs City ID; Istanbul's Sisli is 54)",
				routing: { request: { body: { district_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Item Number',
				name: 'item_number',
				type: 'string',
				default: '',
				description:
					"The variant (variants[].item_number or buy_box.item_number); default the buy box's",
				routing: { request: { body: { item_number: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Listing ID',
				name: 'listing_id',
				type: 'string',
				default: '',
				description:
					"The default listing (buy_box.listing_id, 32 characters); default the buy box's",
				routing: { request: { body: { listing_id: '={{ $value || undefined }}' } } },
			},
		],
	},
];
