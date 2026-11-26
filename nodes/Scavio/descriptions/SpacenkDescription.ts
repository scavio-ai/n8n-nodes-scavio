import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['spacenk'], operation, ...extra },
});

// Space NK (spacenk.com, the London-based luxury beauty retailer, owned by Ulta Beauty), 9
// operations. Credits: 1 per call; Search Products, Get Category Products and Get Brand Products
// with Fill All Products up to 5 (one extra call per product filled); credits_used is the truth.
// Markets uk (default), ie, nl, au; Get Stores is UK only, Get Offers uk or ie. Calls can queue
// behind the backend's upstream limit, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

// One name, or comma-separated names -> a list.
const nameList =
	'={{ (() => { const a = String($value).split(",").map(s => s.trim()).filter(Boolean); return a.length > 1 ? a : (a[0] || undefined); })() }}';
const trimmed = '={{ String($value).trim() || undefined }}';

const FIRST =
	'Space NK (spacenk.com, the London-based luxury beauty retailer, owned by Ulta Beauty)';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const TILE =
	'items with product_id, sku (the shade or size the tile shows), name, brand, URL, image, price, list_price (struck-through price), currency, on_sale, discount_badge, promo_badges, badges, rating, review_count, in_stock, availability and stock_count (online stock of the shade or size shown)';
const LIST =
	'plus market, page, page_size (36), sort, total, total_pages, has_more and more_product_ids (the page\'s other products when Fill All Products is off).';
const LIST_COST =
	'1 credit with Fill All Products off (the first 12 of the 36-product page in full, the other 24 as IDs); on, all 36 are filled at up to 5 credits (one extra call per product filled; credits_used says what was charged).';
const MARKETS =
	'Markets: United Kingdom (GBP, default), Ireland (EUR), Netherlands (EUR, Dutch copy), Australia (AUD), each in its own currency as Space NK prices it. The US is not offered (Space NK\'s US path shows UK prices).';
const NOT_AVAILABLE =
	'Not available: the US market, a price filter (the site ignores it; sort by price instead), store stock counts, price history, cart or checkout.';
const MARKET_OPS = ['search', 'category', 'brand', 'brands', 'product', 'reviews', 'suggestions'];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const brandFilter = (name: string): INodeProperties => ({
	displayName: 'Brand',
	name,
	type: 'string',
	default: '',
	placeholder: 'Medik8',
	description:
		'Only these brands, by name as Space NK shows it (e.g. Medik8, Drunk Elephant); several comma-separated, up to 10',
	routing: { request: { body: { brand: nameList } } },
});

const listOptions = (prefix: string, withBrand: boolean): INodeProperties[] =>
	sorted([
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 300 },
			description: 'Page, 1-based (36 products a page)',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'Brand', value: 'brand' },
				{ name: 'Discount', value: 'discount' },
				{ name: 'Highly Reviewed', value: 'rating' },
				{ name: 'Most Viewed', value: 'most_viewed' },
				{ name: 'New', value: 'new' },
				{ name: 'Our Favourites', value: 'our_favourites' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Relevance', value: 'relevance' },
			],
			description: "Result order (Space NK's own sorts)",
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Fill All Products',
			name: `${prefix}Full`,
			type: 'boolean',
			default: false,
			description:
				'Whether to fill all 36 products of the page in full (off: the first 12 in full, the other 24 as IDs in more_product_ids). Up to 5 credits.',
			routing: { request: { body: { full: '={{ $value || undefined }}' } } },
		},
		...(withBrand ? [brandFilter(`${prefix}Brand`)] : []),
	]);

export const spacenkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['spacenk'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get space nk brand products',
				description: `One brand's products on ${FIRST} by brand ID (from Get Brands), with paging and sorts: ${TILE}, ${LIST} Captured 2026-11-26: medik8 listed 71 products. An unknown brand ID is a charged not-found. ${LIST_COST} ${CHARGE}`,
				routing: request('/api/v1/spacenk/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get space nk brands',
				description: `Every brand ${FIRST} lists, A-Z, or one letter: total and brands with ID (what Get Brand Products takes), name (what the Brand filter takes), URL and letter. Captured 2026-11-26: 245 brands on the UK site. ${ONE}.`,
				routing: request('/api/v1/spacenk/brands', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get space nk category products',
				description: `One category of ${FIRST} by category ID (black-friday is the Black Friday list), with paging, sorts and the Brand filter: ${TILE}, ${LIST} Captured 2026-11-26: black-friday listed 7,607 products on the UK site. An unknown category ID is a charged not-found. ${LIST_COST} ${CHARGE}`,
				routing: request('/api/v1/spacenk/category'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get space nk offers',
				description: `The gifts with purchase on the offers page of ${FIRST}, UK or Ireland: title, validity (the page's own line, e.g. Ends 30th November at 11.45pm (GMT)), terms_url and offers with brand, gift, condition, spend_threshold (amount, currency), brand_url and image. Captured 2026-11-26: 70 brand gifts on the UK site. The Netherlands and Australia offers pages show the UK offers in GBP, so they are not offered. ${ONE}.`,
				routing: request('/api/v1/spacenk/offers', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a space nk product',
				description: `One product of ${FIRST} by product ID or shade / size ID: master_id, type, ean, name, brand, URL, price, list_price, currency, price_text, in_stock, availability, stock_count (online stock of one shade or size), orderable, button, size, short_description, description, key_benefits, how_to_use, kit_contents, ingredients, rating, review_count, images, variant_attribute (color or size), variant_counts, variants (ID, name, in_stock, availability, in_stock_date, swatch_colour), promotions, badges, category_path, skin_suitability, restricted_shipping, hazmat and coming_soon. Captured 2026-11-26: TAKAMI Vitamin B3+ Spot Serum (UK200064992, 30 ML) at 43.5 GBP (list_price 58), stock_count 57. An ID Space NK does not answer for is an uncharged error. ${ONE}.`,
				routing: request('/api/v1/spacenk/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get space nk reviews',
				description: `Customer reviews of one product on ${FIRST} (one English review pool shown on every market), by the product ID starting with M (not a shade / size ID): total, total_pages, has_more, rating_distribution and reviews with ID, rating, title, text, submitted_at, recommended, syndicated, syndication_source, helpful_votes, unhelpful_votes, context (skin_type, skin_tone, best_use, sensitive_skin) and tags. Reviewer names, locations and photos are not returned; a skin-type filter is not offered. Captured 2026-11-26: Charlotte Tilbury Airbrush Flawless Foundation (MUK200057800) had 269 reviews, 184 of them five-star. ${ONE}.`,
				routing: request('/api/v1/spacenk/reviews'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get space nk stores for a product',
				description: `Space NK's UK stores nearest a postcode or point, for one product: store_id, name, address, city, region, postcode, country, latitude, longitude, phone, opening_hours, distance_miles, in_store_available (Space NK's in-store flag for the product, not a count), click_collect_available, click_collect_label (e.g. Click & Collect from Monday 7th December) and express_available. UK only. Captured 2026-11-26: 5 stores within 1.3 miles of W1D 1BS, nearest 0.3 miles away. Store stock counts are not available. ${ONE}.`,
				routing: request('/api/v1/spacenk/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get space nk search suggestions',
				description: `What ${FIRST} suggests for what a shopper has typed: brands (name, URL), categories (name, URL), articles (IDs of editorial articles) and products (the same fields as a search tile). ${ONE}.`,
				routing: request('/api/v1/spacenk/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search space nk products',
				description: `Search the products of ${FIRST} by keywords, with paging (36 a page), Space NK's ten sorts and a Brand filter: ${TILE}, ${LIST} ${MARKETS} ${NOT_AVAILABLE} ${LIST_COST} ${CHARGE} Captured 2026-11-26: "vitamin c" returned 367 products on the UK site, led by Augustinus Bader The Vitamin C Serum at 217.5 GBP (list_price 290, 25% OFF)`,
				routing: request('/api/v1/spacenk/search'),
			},
		],
		default: 'search',
	},
];

export const spacenkFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'spacenkQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vitamin c serum',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords or a brand',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'spacenkCategoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'black-friday',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description: 'A Space NK category ID (e.g. black-friday, skincare-treatment-serum, makeup-complexion-foundation)',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand ID',
		name: 'spacenkBrandId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'medik8',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand_id: '={{ String($value).trim() }}' } } },
		description: 'A brand ID from Get Brands (e.g. medik8, Charlotte Tilbury)',
	},

	// -- Get Brands --
	{
		displayName: 'Letter',
		name: 'spacenkBrandsLetter',
		type: 'string',
		default: '',
		placeholder: 'C',
		displayOptions: show(['brands']),
		routing: { request: { body: { letter: trimmed } } },
		description: 'Only brands under this letter (A-Z or #). Empty: every brand.',
	},

	// -- Get Product, Get Stores --
	{
		displayName: 'Product ID',
		name: 'spacenkProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MUK200057800',
		displayOptions: show(['product', 'stores']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: 'A Space NK product ID (e.g. MUK200057800) or one shade / size ID (e.g. UK200057805).',
	},

	// -- Get Reviews --
	{
		displayName: 'Product ID',
		name: 'spacenkReviewsProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MUK200057800',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: "The product ID starting with M (a search item's product_id or Get Product's master_id): reviews are kept per product, not per shade / size",
	},

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'spacenkSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'charlotte',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper has typed',
	},

	// -- Get Stores --
	{
		displayName: 'UK Postcode',
		name: 'spacenkPostcode',
		type: 'string',
		default: '',
		placeholder: 'W1D 1BS',
		displayOptions: show(['stores']),
		routing: { request: { body: { postcode: trimmed } } },
		description: 'A full UK postcode. Leave empty to send Latitude and Longitude (Additional Options) instead.',
	},

	// -- Market --
	{
		displayName: 'Market',
		name: 'spacenkMarket',
		type: 'options',
		default: 'uk',
		options: [
			{ name: 'Australia (AUD)', value: 'au' },
			{ name: 'Ireland (EUR)', value: 'ie' },
			{ name: 'Netherlands (EUR, Dutch)', value: 'nl' },
			{ name: 'United Kingdom (GBP)', value: 'uk' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { market: '={{ $value === "uk" ? undefined : $value }}' } } },
		description:
			"Space NK's market, each in its own currency as Space NK prices it. The US is not offered (Space NK's US path shows UK prices).",
	},
	{
		displayName: 'Market',
		name: 'spacenkOffersMarket',
		type: 'options',
		default: 'uk',
		options: [
			{ name: 'Ireland (EUR)', value: 'ie' },
			{ name: 'United Kingdom (GBP)', value: 'uk' },
		],
		displayOptions: show(['offers']),
		routing: { request: { body: { market: '={{ $value === "uk" ? undefined : $value }}' } } },
		description: 'UK or Ireland: the Netherlands and Australia offers pages show the UK offers in GBP',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'spacenkSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listOptions('spacenkSearch', true),
	},
	{
		displayName: 'Additional Options',
		name: 'spacenkCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listOptions('spacenkCategory', true),
	},
	{
		displayName: 'Additional Options',
		name: 'spacenkBrandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: listOptions('spacenkBrand', false),
	},
	{
		displayName: 'Additional Options',
		name: 'spacenkReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'spacenkReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page, 1-based (at most 10,000 positions: page x page size)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'spacenkReviewsPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews a page, 1-100',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Search Text',
				name: 'spacenkReviewsSearch',
				type: 'string',
				default: '',
				placeholder: 'shade',
				description: 'Only reviews containing this text',
				routing: { request: { body: { search: trimmed } } },
			},
			{
				displayName: 'Sort',
				name: 'spacenkReviewsSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
				],
				description: 'Review order',
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'spacenkReviewsStars',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with these star ratings',
				routing: { request: { body: { stars: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'spacenkStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Latitude',
				name: 'spacenkStoresLatitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				placeholder: '51.4545',
				description: 'With Longitude, instead of a postcode: a point in the UK',
				routing: { request: { body: { latitude: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'spacenkStoresLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Longitude',
				name: 'spacenkStoresLongitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				placeholder: '-2.5879',
				description: 'With Latitude, instead of a postcode',
				routing: { request: { body: { longitude: '={{ $value || undefined }}' } } },
			},
		],
	},
];
