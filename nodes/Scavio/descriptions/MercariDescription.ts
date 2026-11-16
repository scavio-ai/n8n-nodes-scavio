import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['mercari'], operation, ...extra },
});

// Mercari, 11 operations, 1 credit each. Mercari US (us, default; USD, English) and Mercari Japan
// (jp; JPY, Japanese). Search, Get Item, Get Category Listings, Get Categories, Get Brands and Get
// Brand Listings serve both markets; Get Deals and Get Trending are US only; Get Seller, Get Seller
// Reviews and Get Shop are Japan only (the backend defaults each one-market operation to its
// market, so those operations send no country). Japan calls take 10-60s and the backend retries
// once, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const BOTH_OPS = ['search', 'item', 'category', 'categories', 'brands', 'brand'];

const ITEM =
	'items with item_id, title, URL, price, original_price, discount_percent, currency, status (on_sale, trading = sold and in transit, sold), condition, brand, category_id, size, thumbnail, seller_id, free_shipping and created_at (Japan adds is_shop, shop_id, is_auction), plus total, page, page_size, max_page and has_more. Lists carry no likes and no sold time: Get Item has both';
const PRICES =
	"Prices are numbers: US dollars on us, whole yen on jp; original_price is the seller's earlier price when above price, with discount_percent against it.";
const JP =
	'Japan data is in Japanese as sellers wrote it (not translated), and Japan calls are slower (search typically 30-60 seconds).';
const IDS =
	'Item, category, brand and seller IDs are per market: an ID from the US is not valid on Japan.';
const DEPTH = 'US 50 per page up to page 20 (1,000 results), Japan 120 per page up to page 91.';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const statusOption = {
	displayName: 'Status',
	name: 'status',
	type: 'options' as const,
	default: 'on_sale',
	options: [
		{ name: 'All', value: 'all' },
		{ name: 'On Sale', value: 'on_sale' },
		{ name: 'Sold', value: 'sold' },
	],
	description:
		'On Sale (default), Sold (sold listings, including items sold but still in transit: sold prices) or All',
	routing: { request: { body: { status: '={{ $value === "on_sale" ? undefined : $value }}' } } },
};

const sortOption = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'relevance',
	options: [
		{ name: 'Likes (Japan Only)', value: 'likes' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Recently Sold (US Only)', value: 'recently_sold' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description:
		"Result order. On Japan, Newest follows Mercari Japan's own order (relisted items move up).",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const pageOption = (maxValue: number, description: string) => ({
	displayName: 'Page',
	name: 'page',
	type: 'number' as const,
	default: 1,
	typeOptions: { minValue: 1, maxValue },
	description,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const filterOptions = [
	{
		displayName: 'Condition',
		name: 'condition',
		type: 'multiOptions' as const,
		default: [],
		options: [
			{ name: 'Bad (Japan Only)', value: 'bad' },
			{ name: 'Fair', value: 'fair' },
			{ name: 'Good', value: 'good' },
			{ name: 'Like New', value: 'like_new' },
			{ name: 'New', value: 'new' },
			{ name: 'Poor', value: 'poor' },
		],
		description: 'One or more conditions; several are ORed',
		routing: {
			request: { body: { condition: '={{ $value && $value.length ? $value : undefined }}' } },
		},
	},
	{
		displayName: 'Max Price',
		name: 'price_max',
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest price: US dollars on us, whole yen on jp',
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'price_min',
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest price: US dollars on us, whole yen on jp',
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Shipping',
		name: 'shipping',
		type: 'options' as const,
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Buyer Pays', value: 'buyer_pays' },
			{ name: 'Free (Seller Pays)', value: 'free' },
		],
		description: 'Who pays shipping',
		routing: { request: { body: { shipping: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Size ID (US Only)',
		name: 'size_id',
		type: 'string' as const,
		default: '',
		description: 'A Mercari US size ID',
		routing: { request: { body: { size_id: '={{ $value || undefined }}' } } },
	},
	sortOption,
	statusOption,
];

const marketFilterOptions = [
	{
		displayName: 'Deals Only (US Only)',
		name: 'deals_only',
		type: 'boolean' as const,
		default: false,
		description:
			"Whether to return only listings on Mercari's deals filter (price dropped below the seller's earlier price)",
		routing: { request: { body: { deals_only: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Mercari Shops Only (Japan Only)',
		name: 'shops_only',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to return only Mercari Shops products (business sellers)',
		routing: { request: { body: { shops_only: '={{ $value || undefined }}' } } },
	},
];

const idOption = (displayName: string, name: string, placeholder: string, description: string) => ({
	displayName,
	name,
	type: 'string' as const,
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [name]: '={{ $value || undefined }}' } } },
});

const keywordOption = (description: string) => ({
	displayName: 'Keyword',
	name: 'query',
	type: 'string' as const,
	default: '',
	description,
	routing: { request: { body: { query: '={{ $value || undefined }}' } } },
});

const gridPage = pageOption(91, `Results page, 1-based: ${DEPTH}`);

const byDisplayName = <T extends { displayName: string }>(items: T[]) =>
	[...items].sort((a, b) => a.displayName.localeCompare(b.displayName));

export const mercariOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['mercari'] } },
		options: [
			{
				name: 'Get Brand Listings',
				value: 'brand',
				action: 'Get mercari brand listings',
				description: `Listings of one brand (a brand_id from Get Brands), paged and sorted, optionally within a category or with keywords: brand and ${ITEM}. Depth: ${DEPTH} ${PRICES} ${JP} ${IDS} US and Japan. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get mercari brands',
				description: `Mercari's brand list (US about 28,800, Japan about 52,600), filtered by name and paged by 1,000: brand_id and name (Japan adds the katakana reading), total and has_more. ${IDS} US and Japan. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/brands'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get mercari categories',
				description: `Mercari's category tree: category_id, name, parent_id, level and has_children. US answers one level at a time (the 17 top-level categories, or one parent's children); Japan the whole tree (8,700+ categories, Japanese names) or one parent's children. ${IDS} US and Japan. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/categories'),
			},
			{
				name: 'Get Category Listings',
				value: 'category',
				action: 'Get mercari category listings',
				description: `Listings in one category (a category_id from Get Categories), paged and sorted, optionally with keywords: category and ${ITEM}. Depth: ${DEPTH} ${PRICES} ${JP} ${IDS} US and Japan. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/category'),
			},
			{
				name: 'Get Deals (US)',
				value: 'deals',
				action: 'Get mercari deals',
				description: `Listings on Mercari's deals filter, US only: listings whose price the seller dropped, each with original_price and discount_percent, optionally narrowed by keywords, category, brand and filters, 50 per page up to page 20: ${ITEM}. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/deals'),
			},
			{
				name: 'Get Item',
				value: 'item',
				action: 'Get a mercari item',
				description: `One listing by item ID or link: description, price, original_price, discount_percent, status, sold_at (when it sold), condition, category path, size, color, shipping (payer, method, fee, days to ship, ships from), likes, photos and the seller summary (US sold_count, Japan good / normal / bad ratings). A sold listing keeps its full data. Japan adds the full public comment list (text, date, is_seller; no commenter names) and Mercari Shops products. ${PRICES} ${JP} ${IDS} US and Japan. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/item'),
			},
			{
				name: 'Get Seller (Japan)',
				value: 'seller',
				action: 'Get a mercari seller',
				description: `A Mercari Japan seller's public profile by seller ID or link: rating, good / normal / bad ratings, review_count, listings_count, followers, badges, joined and bio, plus the first 30 listings. Japan only: US seller profiles and reviews are not available. ${JP} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/seller'),
			},
			{
				name: 'Get Seller Reviews (Japan)',
				value: 'sellerReviews',
				action: 'Get mercari seller reviews',
				description: `The most recent 100 reviews of a Mercari Japan user by seller ID or link: summary (rating, good / normal / bad counts, review_count) and reviews (rating, text, date, role seller or buyer). No reviewer names. Japan only. ${JP} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/seller-reviews'),
			},
			{
				name: 'Get Shop (Japan)',
				value: 'shop',
				action: 'Get a mercari shop',
				description: `A Mercari Shops shop (a business seller on Mercari Japan) by shop ID or link: name, description, rating, review_count, followers, is_open, badges and created_at. No product list: use Search Listings with Mercari Shops Only, or Get Item. Japan only. ${JP} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/shop'),
			},
			{
				name: 'Get Trending (US)',
				value: 'trending',
				action: 'Get mercari trending',
				description: `Mercari's trending keywords (keyword, search_rank, rank_change, search_volume_change_percent, trend) and brands (brand_id, name, demand, demand_change, sold_rate_7d, recent_listings) as Mercari shows them. US only. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/trending'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search mercari listings',
				description: `Search listings by keyword: ${ITEM}. Status Sold returns sold listings (sold and in transit) with their prices, so asking prices and sold prices for the same query come from one operation. Depth: ${DEPTH} ${PRICES} ${JP} ${IDS} US and Japan. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/mercari/search'),
			},
		],
		default: 'search',
	},
];

export const mercariFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Japan (Mercari Japan, JPY, Japanese)', value: 'jp' },
			{ name: 'United States (Mercari US, USD, English)', value: 'us' },
		],
		displayOptions: show(BOTH_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			'The Mercari market. IDs are per market. Mercari UK has closed. Get Deals and Get Trending are US only; Get Seller, Get Seller Reviews and Get Shop are Japan only.',
	},

	// -- Search Listings --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nintendo switch',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords. On Japan, Japanese keywords match best.',
	},

	// -- Get Item --
	{
		displayName: 'Item By',
		name: 'itemBy',
		type: 'options',
		default: 'itemId',
		options: [
			{ name: 'Item ID', value: 'itemId' },
			{ name: 'Item URL', value: 'url' },
		],
		displayOptions: show(['item']),
		description: 'How to identify the listing',
	},
	{
		displayName: 'Item ID',
		name: 'itemId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'm38943035688',
		displayOptions: show(['item'], { itemBy: ['itemId'] }),
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description:
			'A Mercari item ID (items[].item_id of a search response): m and 11 digits, or on Japan a 22-character Mercari Shops product ID',
	},
	{
		displayName: 'Item URL',
		name: 'itemUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.mercari.com/us/item/m38943035688/',
		displayOptions: show(['item'], { itemBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			"A Mercari item link (mercari.com/us/item/..., jp.mercari.com/item/... or a Mercari Shops product link); the link's market is used.",
	},

	// -- Get Category Listings --
	{
		displayName: 'Category ID',
		name: 'categoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '797',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'A category ID of the market from Get Categories, e.g. US 797 Consoles',
	},

	// -- Get Categories --
	{
		displayName: 'Parent Category ID',
		name: 'parentId',
		type: 'string',
		default: '',
		placeholder: '7',
		displayOptions: show(['categories']),
		routing: { request: { body: { parent_id: '={{ $value || undefined }}' } } },
		description:
			'A category ID: its children. Empty: US answers the 17 top-level categories, Japan the whole tree.',
	},

	// -- Get Brand Listings --
	{
		displayName: 'Brand ID',
		name: 'brandId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4591',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand_id: '={{ $value }}' } } },
		description: 'A brand ID of the market from Get Brands, e.g. US 4591 Nintendo, Japan 539 COACH',
	},

	// -- Get Seller, Get Seller Reviews --
	{
		displayName: 'Seller By',
		name: 'sellerBy',
		type: 'options',
		default: 'sellerId',
		options: [
			{ name: 'Profile URL', value: 'url' },
			{ name: 'Seller ID', value: 'sellerId' },
		],
		displayOptions: show(['seller', 'sellerReviews']),
		description: 'How to identify the Mercari Japan seller',
	},
	{
		displayName: 'Seller ID',
		name: 'sellerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '477123966',
		displayOptions: show(['seller', 'sellerReviews'], { sellerBy: ['sellerId'] }),
		routing: { request: { body: { seller_id: '={{ $value }}' } } },
		description: 'A Mercari Japan seller ID (seller_id of a search or item response)',
	},
	{
		displayName: 'Profile URL',
		name: 'sellerUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://jp.mercari.com/user/profile/477123966',
		displayOptions: show(['seller', 'sellerReviews'], { sellerBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A Mercari Japan profile link',
	},

	// -- Get Shop --
	{
		displayName: 'Shop By',
		name: 'shopBy',
		type: 'options',
		default: 'shopId',
		options: [
			{ name: 'Shop ID', value: 'shopId' },
			{ name: 'Shop URL', value: 'url' },
		],
		displayOptions: show(['shop']),
		description: 'How to identify the Mercari Shops shop',
	},
	{
		displayName: 'Shop ID',
		name: 'shopId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'LThudSk3aoGvKcW6R3sA6m',
		displayOptions: show(['shop'], { shopBy: ['shopId'] }),
		routing: { request: { body: { shop_id: '={{ $value }}' } } },
		description:
			'A Mercari Shops shop ID (22 characters; shop_id of a search response, shop.shop_id of an item response)',
	},
	{
		displayName: 'Shop URL',
		name: 'shopUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://jp.mercari.com/shops/profile/LThudSk3aoGvKcW6R3sA6m',
		displayOptions: show(['shop'], { shopBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A Mercari Shops link',
	},

	// -- Additional Options: Search Listings --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: byDisplayName([
			...filterOptions,
			...marketFilterOptions,
			gridPage,
			idOption('Brand ID', 'brand_id', '4591', 'A brand ID of the same market (Get Brands)'),
			idOption(
				'Category ID',
				'category_id',
				'797',
				'A category ID of the same market (Get Categories) to search within',
			),
		]),
	},

	// -- Additional Options: Get Category Listings --
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: byDisplayName([
			...filterOptions,
			...marketFilterOptions,
			gridPage,
			idOption('Brand ID', 'brand_id', '4591', 'A brand ID of the same market (Get Brands)'),
			keywordOption('Optional keywords within the category'),
		]),
	},

	// -- Additional Options: Get Brand Listings --
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: byDisplayName([
			...filterOptions,
			...marketFilterOptions,
			gridPage,
			idOption(
				'Category ID',
				'category_id',
				'797',
				'A category ID of the same market (Get Categories)',
			),
			keywordOption('Optional keywords within the brand'),
		]),
	},

	// -- Additional Options: Get Deals --
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: byDisplayName([
			...filterOptions,
			pageOption(20, 'Results page, 1-based (50 per page, up to page 20)'),
			idOption('Brand ID', 'brand_id', '4591', 'A US brand ID (Get Brands)'),
			idOption('Category ID', 'category_id', '797', 'A US category ID (Get Categories)'),
			keywordOption('Optional keywords'),
		]),
	},

	// -- Additional Options: Get Brands --
	{
		displayName: 'Additional Options',
		name: 'brandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands']),
		options: [
			{
				displayName: 'Name Filter',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'nike',
				description: 'Filter brands by name (case-insensitive; on Japan also the katakana reading)',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			pageOption(100, 'Page of 1,000 brands, 1-based'),
		],
	},
];
