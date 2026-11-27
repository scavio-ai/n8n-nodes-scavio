import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['pichau'], operation, ...extra },
});

// Pichau (pichau.com.br, Brazil's PC-parts store), 11 operations, 1 credit each; credits_used is the truth. Brazil
// only, BRL. Listings took 5 to 170 s in Black Friday week, product pages 5 to 60 s, Get Product Live and Get Search
// Suggestions 30 to 160 s: all carry a 300s timeout. Reviews take 2 to 8 s and carry 120s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;
const FAST_MS = 120000;

const SITE =
	"Pichau (pichau.com.br, Brazil's PC-parts store), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const ITEM =
	"items (product_id, sku, url_key for Get Product, URL, name, brand, brand_slug, category, category_path, image, price as the card price, pix_price as the Pix price (Pix is Brazil's instant payment), list_price, discount_percent, pix_discount_percent, installment, available, stock_status, only_x_left, on_promotion, offer with the campaign, ends_at, promo_price, units_left and units_sold, open_box, open_box_state, pre_order, free_shipping, labels, EAN, warranty, product_type, rating, rating_percent, review_count)";
const GRID = `36 per page, in the site's order, by price or by name, filtered by the listing's own facets in Filters (JSON). Returns URL, page, page_size, sort, total, total_pages, has_more, count, ${ITEM}, facets (key, label, values with value, label and count) and filters_applied.`;
const NOT_BUILT =
	"Not available: shipping by CEP (Pichau quotes it in the cart), stores (one physical store, no per-store data), stock unit counts (a running promotion's units left are given) and the PC builder.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** Filters, page and sort shared by every listing. */
const gridOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '{}',
		description:
			'Filters, at most 5 keys: key -> value, exactly as facets key and values value of an answer list them (e.g. marcas for the brand, price as a range such as 0_1000, rgpu, socket), e.g. {"marcas": "34"}. One value per key.',
		routing: {
			request: {
				body: {
					filters:
						'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
				},
			},
		},
	},
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: 'Results page, 1-based, 36 products each',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Name: A to Z', value: 'name_asc' },
			{ name: 'Name: Z to A', value: 'name_desc' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const listingOptions = (name: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted(gridOptions(name)),
});

const URL_KEY_BODY = {
	url_key: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
	url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
};
const URL_KEY_HELP =
	"The product's url_key (url_key of a listing; the part after www.pichau.com.br/ in a product link) or a product link on www.pichau.com.br";
const SAMPLE_KEY = 'placa-de-video-inno3d-geforce-rtx-5060-twin-x2-8gb-gddr7-128-bit-n50602-08d7-195071n-nac';

const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'URL Key or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: SAMPLE_KEY,
	displayOptions: show(operations),
	routing: { request: { body: URL_KEY_BODY } },
	description: URL_KEY_HELP,
});

export const pichauOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pichau'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get pichau brand products',
				description: `One brand's products on ${SITE} by brand slug. ${GRID} Adds brand_info (brand_id, name, slug). An unknown brand is a charged not-found. Captured 2026-11-27: corsair held 875 products. ${ONE}`,
				routing: request('/api/v1/pichau/brand', SLOW_MS),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get the pichau category menu',
				description: `The category menu of ${SITE}: count, departments and categories (category_id, name, path, level, children) as the site's menu shows them; All Nodes adds the campaign and partner pages the site keeps out of its menu. Send a path to Get Category Products. Captured 2026-11-27: 18 departments, 119 categories. ${ONE}`,
				routing: request('/api/v1/pichau/categories', SLOW_MS, true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get pichau category products',
				description: `One category of ${SITE} by category path. ${GRID} Adds category_info (category_id, name, path, product_count, breadcrumbs). An unknown category is a charged not-found. Captured 2026-11-27: hardware/placa-de-video held 948 products. ${ONE}`,
				routing: request('/api/v1/pichau/category', SLOW_MS),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get pichau coupons',
				description: `The coupons of ${SITE}, as the coupons page lists them: coupons (code, percent, kind as the site's own type, applies_to as product or category, valid_until, null when the site shows no end, status, image) and upcoming (announced, not active yet). The page does not say which products a coupon covers. Captured 2026-11-27: 18 active coupons. ${ONE}`,
				routing: request('/api/v1/pichau/coupons', SLOW_MS, true),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get pichau deals',
				description: `The deal listings of ${SITE}: Black Friday (the Black Friday 2026 campaign page), Open Box or another campaign by slug. ${GRID} Adds campaign_info (campaign_id, slug, title, state, starts_at, ends_at) on a campaign; each item's offer is its countdown (ends_at, units_left, units_sold). An unknown campaign is a charged not-found. Captured 2026-11-27: Black Friday held 1467 products, the first a Ryzen 7 9800X3D processor at 2149.99 BRL by Pix with 85 units left. ${ONE}`,
				routing: request('/api/v1/pichau/deals', SLOW_MS, true),
			},
			{
				name: 'Get Installments',
				value: 'installments',
				action: 'Get pichau installment plans',
				description: `Every card plan of one ${SITE} product, by product ID and price (fast) or by URL key or link (the product page is read first for its ID and price): installments (count, amount, total, discount_percent, discount_value, interest_free, label; Pichau discounts short card plans too), price and product. Pix is priced separately (the product's pix_price). Captured 2026-11-27: 12 plans at 3717.64 BRL, from 1 payment of 3345.88 (10% off) to 12 interest-free installments of 309.80. ${ONE}`,
				routing: request('/api/v1/pichau/installments', SLOW_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a pichau product',
				description: `One product of ${SITE} by URL key or link: product_id (for Get Reviews and Get Installments), sku, MPN, EAN, NCM, name, URL, brand, category, categories, images, price (card), pix_price, pix_discount_percent, list_price, discount_percent, installment, available, stock_status, only_x_left, on_promotion, offer (campaign, ends_at in Brasilia time, promo_price, discount_percent, units_left, units_sold), open_box, open_box_state, open_box_condition, pre_order, free_shipping, labels, warranty, distribution_center, club_exclusive, product_type (simple, bundle), rating, rating_percent, review_count and specs. ${NOT_BUILT} An unknown product is a charged not-found. Captured 2026-11-27: an INNO3D RTX 5060 card at 3159.99 BRL by Pix (3717.64 by card, list 3835.28), in a Black Friday offer ending 2026-11-30 with 2 units left. ${ONE}`,
				routing: request('/api/v1/pichau/product', SLOW_MS),
			},
			{
				name: 'Get Product Live',
				value: 'product_live',
				action: 'Get a pichau product page as loaded',
				description: `One product page of ${SITE} as a visitor sees it, by URL key or link: product_id, sku, name, product_type, available, stock_status, only_x_left, price, pix_price, list_price, installment, on_promotion, offer (live units left and sold), benchmark (overall, CPU and GPU scores and FPS per game at Full HD, 1080p ultra, Quad HD and 4K, the UL benchmark the site shows on PCs; an FPS of 0 is the site's 'under 20 FPS'), components (a prebuilt PC's or kit's parts per group: the selected part and the choices offered), rating and review_count. Slower than Get Product. An unknown product is a charged not-found. Captured 2026-11-27: a Pichau prebuilt PC listed 22 component groups and FPS for 14 games, with 48 Black Friday units left. ${ONE}`,
				routing: request('/api/v1/pichau/product-live', SLOW_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get pichau reviews',
				description: `Customer reviews of one ${SITE} product by product ID, newest first, 10 per page, filtered by stars or media: average_rating (0-5), rating_percent (0-100), total_reviews, breakdown per star, page, total_pages, has_more, count and reviews (title, text, rating, date, verified_purchase, media). No reviewer names. Captured 2026-11-27: a processor had 57 reviews, average 5. ${ONE}`,
				routing: request('/api/v1/pichau/reviews', FAST_MS),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get pichau search suggestions',
				description: `What the search box of ${SITE} suggests for what a shopper typed: terms (term, count of matching products), categories (name, path, URL) and products (name, url_key, URL, image, price as the box shows it, available, pre_order), up to 10. Captured 2026-11-27: rtx 5070 suggested 10 products. ${ONE}`,
				routing: request('/api/v1/pichau/suggestions', SLOW_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search pichau products',
				description: `Search ${SITE} by keyword. ${GRID} Some keywords are sent by the site to one of its categories (e.g. cadeira gamer to cadeiras/gamer): the answer is then that category's grid, as the site shows it, with redirected_to (category, URL). Captured 2026-11-27: rtx 5060 matched 1385 products, the first a Gainward RTX 5060 card at 3179.99 BRL by Pix (3741.17 by card). ${ONE}`,
				routing: request('/api/v1/pichau/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const pichauFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'pichauQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rtx 5060',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 120 characters)',
	},
	listingOptions('pichauSearchOptions', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'pichauCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hardware/placa-de-video',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A category path as the site writes it (path of Get Categories), e.g. hardware/placa-de-video, monitores, perifericos/teclado, cadeiras/gamer',
	},
	listingOptions('pichauCategoryOptions', 'category'),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'pichauBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'corsair',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand slug (brand_slug of a listing, or the part after /marca/ in a brand link), e.g. corsair, asus, redragon',
	},
	listingOptions('pichauBrandOptions', 'brand'),

	// -- Get Deals --
	{
		displayName: 'Deal',
		name: 'pichauDeal',
		type: 'options',
		default: 'black_friday',
		displayOptions: show(['deals']),
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Open Box', value: 'open_box' },
			{ name: 'Other Campaign', value: 'campaign' },
		],
		routing: {
			request: { body: { deal: '={{ $value === "black_friday" || $value === "campaign" ? undefined : $value }}' } },
		},
	},
	{
		displayName: 'Campaign',
		name: 'pichauDealsCampaign',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'blackfriday',
		displayOptions: show(['deals'], { pichauDeal: ['campaign'] }),
		routing: { request: { body: { campaign: '={{ String($value).trim() }}' } } },
		description: 'A campaign slug (offer campaign_path of a listing without promocao/)',
	},
	listingOptions('pichauDealsOptions', 'deals'),

	// -- Get Product, Get Product Live --
	productField('pichauProduct', ['product']),
	productField('pichauLiveProduct', ['product_live']),

	// -- Get Reviews --
	{
		displayName: 'Product ID',
		name: 'pichauReviewsProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '31201',
		displayOptions: show(['reviews']),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: 'The Pichau product ID (product_id of a listing or of Get Product)',
	},
	{
		displayName: 'Additional Options',
		name: 'pichauReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'pichauReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based, 10 reviews each (newest first)',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'pichauReviewsRating',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'Only reviews with this many stars, 1 to 5 (0 for every review)',
				routing: { request: { body: { rating: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'With Media Only',
				name: 'pichauReviewsWithMedia',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews with photos or videos',
				routing: { request: { body: { with_media: '={{ $value ? true : undefined }}' } } },
			},
		],
	},

	// -- Get Installments --
	{
		displayName: 'Look Up By',
		name: 'pichauInstallmentsBy',
		type: 'options',
		default: 'product_id',
		options: [
			{ name: 'Product ID and Price', value: 'product_id' },
			{ name: 'URL Key or URL', value: 'url_key' },
		],
		displayOptions: show(['installments']),
	},
	{
		displayName: 'Product ID',
		name: 'pichauInstallmentsProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '61004',
		displayOptions: show(['installments'], { pichauInstallmentsBy: ['product_id'] }),
		routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
		description: 'The Pichau product ID (product_id of a listing)',
	},
	{
		displayName: 'Price',
		name: 'pichauInstallmentsPrice',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000, numberPrecision: 2 },
		displayOptions: show(['installments'], { pichauInstallmentsBy: ['product_id'] }),
		routing: { request: { body: { price: '={{ $value }}' } } },
		description: "The product's card price in BRL (price of a listing), e.g. 3717.64",
	},
	{
		displayName: 'URL Key or URL',
		name: 'pichauInstallmentsProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: SAMPLE_KEY,
		displayOptions: show(['installments'], { pichauInstallmentsBy: ['url_key'] }),
		routing: { request: { body: URL_KEY_BODY } },
		description: `${URL_KEY_HELP}; the product page is read first for its ID and price`,
	},

	// -- Get Categories --
	{
		displayName: 'All Nodes',
		name: 'pichauCategoriesAll',
		type: 'boolean',
		default: false,
		displayOptions: show(['categories']),
		description:
			'Whether to return every node of the menu, including the campaign and partner pages the site keeps out of its menu',
		routing: { request: { body: { all: '={{ $value ? true : undefined }}' } } },
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'pichauSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rtx 5070',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper has typed into the search box (2 to 60 characters)',
	},
];
