import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['kabum'], operation, ...extra },
});

// KaBuM! (kabum.com.br, the Brazilian computer and electronics retailer, part of Magalu), 7 operations, 1 credit each;
// credits_used is the truth. Brazil only, BRL. Calls usually take 2 to 15 s; every operation carries a 120s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 120000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	'KaBuM! (kabum.com.br, the Brazilian computer and electronics retailer, part of Magalu), Brazil only, Portuguese text, prices in BRL';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	'Prices are as KaBuM! shows them to a visitor who is not signed in, never a Prime-member price: price is the card price, cash_price the Pix (Brazil\'s instant payment) / boleto price, list_price the regular price when a lower one applies.';
const GRID =
	'page, page_size, sort, total, total_pages, has_more, count, items (position, product_id for Get Product, name, URL, image, brand, category_path, price, cash_price, list_price, cash_discount_percent, installment_text, offer with start, end and units left, available, stock in units, buy_limit, seller with sold_by, is_marketplace, seller_id, company, CNPJ and state, rating, review_count, stamps, free_shipping, open_box, pre_order), facets (key, label, type, values; send back in Filters) and filters_applied.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A KaBuM! product code or a kabum.com.br product link, sent as product_id or url. */
const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product Code or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '311424',
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
		'A KaBuM! product code (product_id from another answer; the number after /produto/ in a product link, e.g. 311424) or a www.kabum.com.br product link',
});

const pageOption = (name: string, max: number): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description: 'Page, 1-based; total_pages reports the last one',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const pageSizeOption = (name: string, max: number, dflt: number, what: string): INodeProperties => ({
	displayName: 'Page Size',
	name,
	type: 'number',
	default: dflt,
	typeOptions: { minValue: 1, maxValue: max },
	description: `${what} per page, 1 to ${max}`,
	routing: { request: { body: { page_size: `={{ $value === ${dflt} ? undefined : $value }}` } } },
});

/** Sort, filters, price range and paging shared by Search Products and Get Category Products. */
const gridOptions = (prefix: string): INodeProperties[] =>
	sorted([
		{
			displayName: 'Filters (JSON)',
			name: `${prefix}Filters`,
			type: 'json',
			default: '{}',
			description:
				'Facet filters, at most 8 keys, exactly as facets key and values of an answer list them, e.g. {"manufacturer": "Husky", "has_offer": true, "highlighted_stamp": "BLACK FRIDAY"}. Boolean facets (has_offer, kabum_product, has_open_box, has_flash) take true.',
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
			displayName: 'Max Price (BRL)',
			name: `${prefix}PriceMax`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Highest card price in BRL; 0 means no limit',
			routing: { request: { body: { price_max: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Price (BRL)',
			name: `${prefix}PriceMin`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Lowest card price in BRL; 0 means no limit',
			routing: { request: { body: { price_min: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		pageOption(`${prefix}Page`, 500),
		pageSizeOption(`${prefix}PageSize`, 100, 20, 'Products'),
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'most_searched',
			options: [
				{ name: 'Most Reviewed', value: 'most_reviewed' },
				{ name: 'Most Searched (KaBuM! Order)', value: 'most_searched' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
			],
			routing: { request: { body: { sort: '={{ $value === "most_searched" ? undefined : $value }}' } } },
		},
	]);

export const kabumOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['kabum'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get kabum categories',
				description: `The ${SITE} departments (slug, path, URL; about 30), or with Department that department's category tree (slug, path for Get Category Products, URL, children). An unknown department is a charged not-found. Captured 2026-11-27: the hardware department held 14 top categories. ${ONE}`,
				routing: request('/api/v1/kabum/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get kabum category products',
				description: `One ${SITE} category by path, sorted and filtered like Search Products: category, URL, breadcrumb and ${GRID} ${PRICES} An unknown category is a charged not-found. Captured 2026-11-27: hardware/placa-de-video-vga held 459 products. ${ONE}`,
				routing: request('/api/v1/kabum/category'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get kabum offers',
				description: `The products of one ${SITE} offer campaign: campaign (slug, name, title, starts_at, ends_at, rules_url), total, total_pages and items (product_id, name, URL, brand, department, category, price, cash_price, list_price, discount_percent, installment_text, offer_id, offer_units_left, offer_units_sold, stock, starts_at, ends_at, available, seller, stamp, free_shipping, open_box, rating, review_count), up to 100 a page. ${PRICES} A campaign that is not running is a charged not-found. Captured 2026-11-27: blackfriday held 620 products, the first the Mesa Gamer Husky Snow at 349.99 BRL Pix (29% off) with 28 offer units left. ${ONE}`,
				routing: request('/api/v1/kabum/offers', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a kabum product',
				description: `One ${SITE} product by product code or link: product_id, name, URL, brand, categories, images, price, cash_price, list_price, cash_discount_percent, installment_text, offer, payment_methods (boleto, Pix, card and NuPay plans with every installment), available, discontinued, stock (units), buy_limit, pre_order, open_box, free_shipping, weight_grams, warranty, rating, review_count, stamps, seller (type 1P, 2P or 3P, sold_by, is_marketplace, seller_id, company, CNPJ, state and the seller's score: rating, NPS, delivery rating, orders over 30 days), specs and the Anatel and Inmetro codes. ${PRICES} A discontinued product returns available false and stock 0. An unknown product is a charged not-found. Captured 2026-11-27: the Cadeira Gamer Husky Storm 100 at 389.99 BRL by Pix or boleto, rated 4.8 from 159 reviews. ${ONE}`,
				routing: request('/api/v1/kabum/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get kabum reviews',
				description: `Customer reviews of one ${SITE} product, newest or oldest first, up to 50 a page, filtered by stars: average_rating, total_reviews, total (matching), total_pages, has_more, summary (KaBuM!'s own summary, as given, or null) and reviews (review_id, rating, title, text, date, likes, media). No reviewer names. Captured 2026-11-27: product 311424 averaged 4.8 from 156 reviews. ${ONE}`,
				routing: request('/api/v1/kabum/reviews'),
			},
			{
				name: 'Get Shipping Quote',
				value: 'shipping',
				action: 'Get a kabum shipping quote',
				description: `The delivery options for one unit of a ${SITE} product to a Brazilian CEP (postal code), as KaBuM! quotes them: the CEP's address (state, city, district, street), sold_by, available and options (name, type, price in BRL, max_days, arrival_date, arrival_text, arrives_tomorrow, carrier, flash, seller). Marketplace sellers quote their own options. An invalid CEP is refused (not charged); an unknown product is a charged not-found. Captured 2026-11-27: product 311424 to CEP 01310-100 had 4 options, the lowest 34.59 BRL by 2026-12-15. ${ONE}`,
				routing: request('/api/v1/kabum/shipping'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search kabum products',
				description: `${SITE} keyword search, up to 100 a page, sorted and filtered by brand, any facet, running offers, KaBuM!-sold or a price range: query, site_category, ${GRID} ${PRICES} A keyword with no products returns total 0. Captured 2026-11-27: cadeira gamer gave 648 results, the first the Cadeira Gamer Husky Storm 100 at 433.32 BRL card / 389.99 BRL Pix with 35 offer units left. ${ONE}`,
				routing: request('/api/v1/kabum/search'),
			},
		],
		default: 'search',
	},
];

export const kabumFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'kabumQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cadeira gamer',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'kabumSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('kabumSearch'),
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'kabumCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hardware/placa-de-video-vga',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A category path (path from Get Categories, or a category link\'s path), e.g. tv or hardware/placa-de-video-vga',
	},
	{
		displayName: 'Additional Options',
		name: 'kabumCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('kabumCategory'),
	},

	// -- Get Categories --
	{
		displayName: 'Department',
		name: 'kabumDepartment',
		type: 'string',
		default: '',
		placeholder: 'hardware',
		displayOptions: show(['categories']),
		routing: { request: { body: { department: '={{ String($value).trim() || undefined }}' } } },
		description: 'A department slug (slug from a departments answer) for its category tree. Leave empty for the departments.',
	},

	// -- Get Product, Get Shipping Quote, Get Reviews --
	productField('kabumProduct', ['product', 'shipping', 'reviews']),
	{
		displayName: 'CEP',
		name: 'kabumCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['shipping']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'The Brazilian CEP (postal code, 8 digits) to deliver to',
	},
	{
		displayName: 'Additional Options',
		name: 'kabumReviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			pageOption('kabumReviewPage', 500),
			pageSizeOption('kabumReviewPageSize', 50, 10, 'Reviews'),
			{
				displayName: 'Rating',
				name: 'kabumReviewRating',
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
				description: 'Only reviews with this many stars',
				routing: { request: { body: { rating: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'kabumReviewSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Offers --
	{
		displayName: 'Additional Options',
		name: 'kabumOffersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['offers']),
		options: sorted([
			{
				displayName: 'Campaign',
				name: 'kabumOffersCampaign',
				type: 'string',
				default: 'blackfriday',
				placeholder: 'blackfriday',
				description: 'A KaBuM! campaign slug: blackfriday (Black Friday 2026) or ofertaskabum (KaBuM!\'s standing offers)',
				routing: { request: { body: { campaign: '={{ String($value).trim() || undefined }}' } } },
			},
			pageOption('kabumOffersPage', 500),
			pageSizeOption('kabumOffersPageSize', 100, 20, 'Products'),
		]),
	},
];
