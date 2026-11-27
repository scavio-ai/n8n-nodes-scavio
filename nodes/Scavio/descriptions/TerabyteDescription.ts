import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['terabyte'], operation, ...extra },
});

// Terabyteshop (terabyteshop.com.br, Brazil's PC-parts store), 9 operations, 1 credit each; credits_used is the truth.
// Brazil only, BRL. Search, product and listings usually take 5 to 30 s, up to about 90 s, and carry a 240s timeout;
// reviews, coupons, trending searches and the PC builder take 2 to 6 s and carry 120s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 240000;
const FAST_MS = 120000;

const SITE =
	"Terabyteshop (terabyteshop.com.br, Brazil's PC-parts store), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const ITEM =
	'items (product_id for Get Product, name, URL, image, brand, category, GTIN, MPN, price as the card price, pix_price as the Pix price, list_price, discount_percent, installment, available, open_box, free_shipping, on_promotion, offer with the campaign and its end, units_sold, best_seller_rank, rating, review_count, coupon, labels)';
const GRID = `30 per page, in the site's order or by price, filtered by Subcategory and spec Filters (JSON). Returns category, URL, page, page_size, sort, total, total_pages, has_more, count, ${ITEM} (listing cards carry the Pix price, list price and installments; the card total is on Get Product), facets (price range, subcategories, brands with brand_id, spec attributes with their keys and values), filters_applied and notes.`;
const NOT_BUILT =
	'Not available: shipping by CEP (Terabyteshop quotes it in the cart), stores (it has none) and stock unit counts.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const ID = '={{ String($value).trim() || undefined }}';

const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '41251',
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'The Terabyteshop product ID (product_id of a listing; the number after /produto/ in a product link) or a product link on www.terabyteshop.com.br',
});

const categoryField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Category',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'hardware/placas-de-video',
	displayOptions: show(operations),
	routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
	description:
		'A category path as the site writes it, e.g. hardware/placas-de-video, hardware/processadores, monitores, perifericos/mouse',
});

/** Sort, page and sub-category shared by the category, brand and deal listings. */
const gridOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 400 },
		description: 'Results page, 1-based, 30 products each',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Subcategory',
		name: `${prefix}Subcategory`,
		type: 'string',
		default: '',
		placeholder: 'Placa de Vídeo',
		description: 'A sub-category name exactly as facets subcategories name lists it',
		routing: { request: { body: { subcategory: ID } } },
	},
];

const filtersOption = (prefix: string): INodeProperties => ({
	displayName: 'Filters (JSON)',
	name: `${prefix}Filters`,
	type: 'json',
	default: '{}',
	description:
		'Spec filters, at most 5 keys: key -> value or [values], keys and values exactly as facets attributes key and values list them, e.g. {"modelo": "RTX 5070"}',
	routing: {
		request: {
			body: {
				filters:
					'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
			},
		},
	},
});

export const terabyteOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['terabyte'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get terabyteshop brand products',
				description: `One brand's products in one ${SITE} category, by category path and brand name or brand ID (facets brands of a category answer): brand (brand_id, name, count) and the listing. ${GRID} A brand with no products in the category is a charged not-found listing the brands there. Captured 2026-11-27: Logitech had 91 products in perifericos/mouse. ${ONE}`,
				routing: request('/api/v1/terabyte/brand', SLOW_MS),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get terabyteshop category products',
				description: `One ${SITE} category by path. ${GRID} An unknown category is a charged not-found. Captured 2026-11-27: hardware/placas-de-video held 878 products, the first an RTX 3050 card at 1679.99 BRL by Pix (list 2809.90). ${ONE}`,
				routing: request('/api/v1/terabyte/category', SLOW_MS),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get terabyteshop coupons',
				description: `The active ${SITE} coupons: all of them, one coupon category's, or one code with the products it covers: coupons (code, discount, discount_type, discount_value, scope, units_left, valid_until, minimum_order, free_shipping, conditions, product_count, URL) and coupon_categories (slug, name, coupon_count); with a code, coupon and products. An unknown code or category is a charged not-found. Captured 2026-11-27: 11 active coupons in 4 coupon categories. ${ONE}`,
				routing: request('/api/v1/terabyte/coupons', FAST_MS, true),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get terabyteshop deals',
				description: `The ${SITE} deal listings: Black Friday (the promotions page), Open Box or Free Shipping, sorted, by sub-category or brand. ${GRID} offer ends_at is each deal's end; Get Product adds its units left. Captured 2026-11-27: the Black Friday listing held 6767 products. ${ONE}`,
				routing: request('/api/v1/terabyte/deals', SLOW_MS, true),
			},
			{
				name: 'Get PC Builder',
				value: 'pc_builder',
				action: 'Get the terabyteshop pc builder',
				description: `The Full Custom PC builder of ${SITE}: without inputs, platforms (platform_id, name, URL); with Platform ID, its component groups (group_id, name, optional, max_items, min_items, option_count, note); with Platform ID and Group ID, that group's options (product_id, name, URL, image, brand, price, pix_price, pix_discount_percent, installment, on_offer, new_release, selected_by_default, assembly_available, available, availability_by_distribution_center for SC and ES). Builder prices are the builder's own and can differ from the product page. Nothing is added to a cart or saved. An unknown platform is a charged not-found. Captured 2026-11-27: platform 18613, group 21065 listed 5 processor options. ${ONE}`,
				routing: request('/api/v1/terabyte/pc-builder', FAST_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a terabyteshop product',
				description: `One ${SITE} product by product ID or link: name, URL, brand, category, GTIN (EAN), MPN, part_number, images, price (card total), pix_price (the Pix price; Pix is Brazil's instant payment), list_price, discount_percent, pix_discount_percent, installment, installments (every card plan), available, availability, condition, open_box, warranty, warranty_months, sold_by, best_seller_rank, offer (campaign, ends_at in Brasilia time, units_sold, units_left, stock_label), price_valid_until, coupon, free_shipping, free_shipping_states, rating, review_count, return_days, key_specs, specs and the 5 newest reviews (no reviewer names). ${NOT_BUILT} An unknown product is a charged not-found. Captured 2026-11-27: a Gigabyte GS24F14 monitor at 549.99 BRL by Pix (647.05 by card), in a Black Friday offer ending 2026-11-30 with 6 units left. ${ONE}`,
				routing: request('/api/v1/terabyte/product', SLOW_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get terabyteshop reviews',
				description: `Customer reviews of one ${SITE} product, newest to oldest, 5 per page: product_id, URL, page, page_size, has_more, count and reviews (rating, date, verified_buyer, text); sent with a product ID it also returns average_rating, total_reviews and total_pages. No reviewer names or places. Captured 2026-11-27: a Ryzen 5 processor had 367 reviews. ${ONE}`,
				routing: request('/api/v1/terabyte/reviews', FAST_MS),
			},
			{
				name: 'Get Trending Searches',
				value: 'trending_searches',
				action: 'Get terabyteshop trending searches',
				description: `The top ${SITE} search terms, as the site ranks them, up to 48: count and terms (position, term, search_count, top_product with its price and Pix price). Captured 2026-11-27: 48 terms, the first placa de video, searched 60900 times. ${ONE}`,
				routing: request('/api/v1/terabyte/trending-searches', FAST_MS, true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search terabyteshop products',
				description: `${SITE} keyword search, up to 100 per page: query, page, page_size, sort, total, total_pages, has_more, count, ${ITEM} and notes. The site's search ignores sorting, so Scavio sorts the returned page (by Pix price, units sold, rating or review count) and a note says so. A keyword that matches nothing returns total 0. Captured 2026-11-27: rtx 5060 matched 162 products, the first an RTX 5060 Ti card at 4199.99 BRL by Pix. ${ONE}`,
				routing: request('/api/v1/terabyte/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const terabyteFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'terabyteQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rtx 5060',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 120 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'terabyteSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Page',
				name: 'terabyteSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'terabyteSearchPageSize',
				type: 'number',
				default: 24,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Products per page, 1 to 100',
				routing: { request: { body: { page_size: '={{ $value !== 24 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'terabyteSearchSort',
				type: 'options',
				default: 'relevance',
				description: "Applied by Scavio to the returned page (the site's search ignores sorting)",
				options: [
					{ name: 'Best Sellers', value: 'best_sellers' },
					{ name: 'Most Reviewed', value: 'most_reviewed' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Top Rated', value: 'top_rated' },
				],
				routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Product, Get Reviews --
	productField('terabyteProduct', ['product']),
	productField('terabyteReviewsProduct', ['reviews']),
	{
		displayName: 'Page',
		name: 'terabyteReviewsPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 400 },
		displayOptions: show(['reviews']),
		description: 'Page, 1-based, 5 reviews each (newest to oldest)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},

	// -- Get Category Products --
	categoryField('terabyteCategory', ['category']),
	{
		displayName: 'Additional Options',
		name: 'terabyteCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([...gridOptions('terabyteCategory'), filtersOption('terabyteCategory')]),
	},

	// -- Get Brand Products --
	categoryField('terabyteBrandCategory', ['brand']),
	{
		displayName: 'Brand or Brand ID',
		name: 'terabyteBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Logitech',
		displayOptions: show(['brand']),
		routing: {
			request: {
				body: {
					brand_id: '={{ /^\\d{1,9}$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					brand: '={{ /^\\d{1,9}$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description:
			'A brand name as facets brands name lists it (case and accents ignored), or its brand_id; a number is read as the brand ID',
	},
	{
		displayName: 'Additional Options',
		name: 'terabyteBrandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: sorted([...gridOptions('terabyteBrand'), filtersOption('terabyteBrand')]),
	},

	// -- Get Deals --
	{
		displayName: 'Deal',
		name: 'terabyteDeal',
		type: 'options',
		default: 'black_friday',
		displayOptions: show(['deals']),
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Free Shipping', value: 'free_shipping' },
			{ name: 'Open Box', value: 'open_box' },
		],
		routing: { request: { body: { deal: '={{ $value === "black_friday" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Additional Options',
		name: 'terabyteDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Brand ID',
				name: 'terabyteDealsBrandId',
				type: 'string',
				default: '',
				placeholder: '39',
				description: 'One brand (facets brands brand_id)',
				routing: { request: { body: { brand_id: ID } } },
			},
			...gridOptions('terabyteDeals'),
		]),
	},

	// -- Get Coupons --
	{
		displayName: 'Additional Options',
		name: 'terabyteCouponsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['coupons']),
		options: [
			{
				displayName: 'Coupon Category',
				name: 'terabyteCouponsCategory',
				type: 'string',
				default: '',
				placeholder: 'placa-mae',
				description: 'A coupon category slug (coupon_categories slug), e.g. placa-mae, memoria-ram: its coupons',
				routing: { request: { body: { category: ID } } },
			},
			{
				displayName: 'Coupon Code',
				name: 'terabyteCouponsCode',
				type: 'string',
				default: '',
				placeholder: 'BLACKDT3',
				description: 'One coupon code: the coupon and the products it covers',
				routing: { request: { body: { code: ID } } },
			},
		],
	},

	// -- Get Trending Searches --
	{
		displayName: 'Max Terms',
		name: 'terabyteTrendingMax',
		type: 'number',
		default: 48,
		typeOptions: { minValue: 1, maxValue: 48 },
		displayOptions: show(['trending_searches']),
		description: 'How many terms to return, 1 to 48 (48 is all the site lists)',
		routing: { request: { body: { limit: '={{ $value < 48 ? $value : undefined }}' } } },
	},

	// -- Get PC Builder --
	{
		displayName: 'Additional Options',
		name: 'terabyteBuilderOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['pc_builder']),
		options: [
			{
				displayName: 'Group ID',
				name: 'terabyteBuilderGroupId',
				type: 'string',
				default: '',
				placeholder: '21065',
				description: 'A component group of that platform (groups group_id): its options; needs Platform ID',
				routing: { request: { body: { group_id: ID } } },
			},
			{
				displayName: 'Platform ID',
				name: 'terabyteBuilderPlatformId',
				type: 'string',
				default: '',
				placeholder: '18613',
				description: 'A builder platform (platforms platform_id): its component groups; empty for the list of platforms',
				routing: { request: { body: { platform_id: ID } } },
			},
		],
	},
];
