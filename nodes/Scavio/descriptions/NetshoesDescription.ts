import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['netshoes'], operation, ...extra },
});

// Netshoes (netshoes.com.br, Brazil's sporting-goods store, part of Magalu), 11 operations, 1 credit each;
// credits_used is the truth. Brazil only, BRL. Search and list pages usually take 2 to 30 s and carry a 240s timeout;
// the others take 2 to 15 s and carry 180s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const LIST_MS = 240000;
const FAST_MS = 180000;

const SITE =
	"Netshoes (netshoes.com.br, Brazil's sporting-goods store, part of Magalu), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID = (size: number, pages: number) =>
	`${size} per page, pages 1 to ${pages}, in the site's 7 sorts, filtered by Brand, Gender, Size, Seller, a BRL price range and any facet in Filters (JSON). Returns page, page_size, total (the site caps it at 10000: total_capped), total_pages, has_more, count, title, items (product_id as the colour code for Get Product, product_code, name, brand, department, product_type, URL, image, available, price, list_price, discount_percent, installment_count, rating, review_count, badges, colors, flavors, sizes, other_colors), facets (key, name, values with value, label and count), quick_filters, sort, filters_applied and notes.`;
const BUYBOX =
	"The price here is the size's buy-box price and can differ by a few reais from the price Get Product shows.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as one value or an array, or undefined when empty. */
const LIST_VALUE =
	'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length === 0 ? undefined : a.length === 1 ? a[0] : a; })() }}';

const listOption = (displayName: string, name: string, key: string, description: string, placeholder: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: LIST_VALUE } } },
});

const numberOption = (displayName: string, name: string, key: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: 100000 },
	description,
	routing: { request: { body: { [key]: '={{ $value > 0 ? $value : undefined }}' } } },
});

/** Sort, filters and page shared by Search Products and Get List Products. */
const gridOptions = (prefix: string, maxPage: number, perPage: number): INodeProperties[] => [
	listOption('Brand', `${prefix}Brand`, 'brand', 'Brand facet value(s) (marca), comma-separated, e.g. nike, adidas', 'nike'),
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '{}',
		description:
			'Any facet by its key (facets key of an answer): key -> value or [values], up to 12 values, e.g. {"tipo-de-produto": "tenis", "cor-principal": ["preto"]}',
		routing: {
			request: {
				body: {
					filters:
						'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
				},
			},
		},
	},
	listOption('Gender', `${prefix}Gender`, 'gender', 'Gender facet value(s) (genero), comma-separated: masculino, feminino, unissex, menino, menina', 'masculino'),
	numberOption('Max Price (BRL)', `${prefix}PriceMax`, 'price_max', 'Highest price in BRL; 0 means no limit'),
	numberOption('Min Price (BRL)', `${prefix}PriceMin`, 'price_min', 'Lowest price in BRL; 0 means no limit'),
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: maxPage },
		description: `Results page, 1 to ${maxPage} (${perPage} per page)`,
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	listOption('Seller', `${prefix}Seller`, 'seller', "Sold-by facet value(s) (vendido-por), comma-separated: netshoes-netshoes or a marketplace seller's value", 'netshoes-netshoes'),
	listOption('Size', `${prefix}Size`, 'size', 'Size facet value(s) (tamanho), comma-separated, e.g. 42, m', '42'),
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'New Releases', value: 'new_releases' },
			{ name: 'Offers', value: 'offers' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
			{ name: 'Top Rated', value: 'top_rated' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const productField = (name: string, operations: string[], placeholder: string, description: string): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description,
});

const skuField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'SKU',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'FBA-82XQ-006-38',
	displayOptions: show(operations),
	routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
	description: 'A size SKU (sizes sku of Get Product)',
});

const sellerOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Seller ID',
	name,
	type: 'string',
	default: '',
	placeholder: '13644',
	description,
	routing: { request: { body: { seller_id: '={{ String($value).trim() || undefined }}' } } },
});

export const netshoesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['netshoes'] } },
		options: [
			{
				name: 'Get Daily Deal',
				value: 'daily_deal',
				action: 'Get the netshoes daily deal',
				description: `The ${SITE} daily offer (Barato do Dia): title, starts_at, ends_at (Brasilia time), count and items (position, product_id, name, URL, image, available, seller_ids). The answer carries no prices: send a product_id to Get Product. Captured 2026-11-27: 10 products. ${ONE}`,
				routing: request('/api/v1/netshoes/daily-deal', FAST_MS, true),
			},
			{
				name: 'Get List Products',
				value: 'list',
				action: 'Get netshoes list products',
				description: `A ${SITE} list page by slug or /lst/ link (tenis-black-friday, the Black Friday sneakers, is the default), sorted and filtered like Search Products. ${GRID(45, 250)} Also slug and URL. An unknown list is a charged not-found. Captured 2026-11-27: tenis-black-friday held 736 products. ${ONE}`,
				routing: request('/api/v1/netshoes/list', LIST_MS, true),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get netshoes offers for a size',
				description: `Every seller's offer for one size of ${SITE}, by size SKU: sku, product_id, product_code, name, size, EAN, color, available, URL, offer_count and offers (seller with ID, name, is_store and international, available, price, pix_price, pix_promotion, list_price, discount_percent, installment, installments, free_shipping). An unknown SKU is a charged not-found. ${ONE}`,
				routing: request('/api/v1/netshoes/offers', FAST_MS),
			},
			{
				name: 'Get Online Stock',
				value: 'inventory',
				action: 'Get netshoes online stock',
				description: `The online stock count for one size of ${SITE}, by size SKU and, optionally, seller: sku, seller (ID, name, is_store), quantity (as the site gives it; it may be capped) and in_stock. Without Seller ID the size's buy-box seller is used. Not a store count. Captured 2026-11-27: 549 units of an Adidas Racer TR23 size 38 online from Netshoes. ${ONE}`,
				routing: request('/api/v1/netshoes/inventory', FAST_MS),
			},
			{
				name: 'Get Popular Searches',
				value: 'popular_searches',
				action: 'Get netshoes popular searches',
				description: `The ${SITE} popular searches, as the site's search box lists them: count and searches (position, term). Captured 2026-11-27: 4 terms, the first tenis masculino. ${ONE}`,
				routing: request('/api/v1/netshoes/popular-searches', FAST_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a netshoes product',
				description: `One ${SITE} product by product ID (the colour code), a size SKU or a link: product_code, name, brand, department, product_type, genders, URL, available, listing_type, color, price_min, price_max, sellers, size_count, sizes_available, sizes (sku, size, EAN, available, price, pix_price, list_price, seller, offer_count, every seller's offer, weight_grams, release_date), colors, images, badges, breadcrumbs, specs, NCM, rating, review_count, percent_recommended and question_count. price is the card price; pix_price the Pix price (Pix is Brazil's instant payment) where a Pix promotion applies. No marketing description. An unknown product is a charged not-found. Captured 2026-11-27: an Adidas Racer TR23 men's sneaker at 249.99 BRL (list 499.99) in 8 sizes, rated 4.83 from 780 reviews. ${ONE}`,
				routing: request('/api/v1/netshoes/product', FAST_MS),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get netshoes questions',
				description: `Shoppers' questions on a ${SITE} product, by product code (or a colour ID, SKU or link), 10 per page: product_code, page, total_pages, has_more, total_questions, count and questions (question, asked_at, answer, answered_at, answered_by as the seller or the site's AI assistant, answered_by_ai). No asker names or emails. ${ONE}`,
				routing: request('/api/v1/netshoes/questions', FAST_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get netshoes reviews',
				description: `Product reviews of ${SITE}, by product code (or a colour ID, SKU or link), 13 per page, filtered by stars and photos: product_code, page, total_pages, has_more, total_reviews, total_filtered, count and reviews (review_id, rating, text, date, recommends, photo_count). Reviews are shared by every colour. No reviewer names. Captured 2026-11-27: the Adidas Racer TR23 had 780 reviews. ${ONE}`,
				routing: request('/api/v1/netshoes/reviews', FAST_MS),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a netshoes marketplace seller',
				description: `A ${SITE} marketplace seller by seller ID: name, name_slug, official_store, active, member_since, company_name, CNPJ, address (the company's business address as the seller page shows it), products_sold, logo, URL, rating, review_count, reviews_with_comment, percent_recommended, product_quality_stamp, histogram, likert and the newest reviews without reviewer names. Contacts are not returned. An unknown seller is a charged not-found. Captured 2026-11-27: seller 21072 had sold 163603 products, rated 4.53 from 2978 reviews. ${ONE}`,
				routing: request('/api/v1/netshoes/seller', FAST_MS),
			},
			{
				name: 'Get Shipping',
				value: 'shipping',
				action: 'Get netshoes shipping by cep',
				description: `Delivery options for one size of ${SITE}, by size SKU and CEP (Brazilian postal code): sku, cep, seller, price, pix_price, count, options (type such as NORMAL or COLLECT_MAGALU pickup, service, seller_id, cost, free, min_days, max_days, min_date, max_date), lowest_cost, fastest and free_shipping_threshold. ${BUYBOX} Captured 2026-11-27: an Adidas Racer TR23 size 38 shipped free to CEP 01310-100 in 3 days. ${ONE}`,
				routing: request('/api/v1/netshoes/shipping', FAST_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search netshoes products',
				description: `${SITE} keyword search. ${GRID(100, 100)} Also query and landing_page (a keyword the site sends to a landing page returns that page's products, and says so). No results is an empty, charged answer. Captured 2026-11-27: tenis corrida filtered to nike matched 214 products, the first at 399.99 BRL (list 799.99). ${ONE}`,
				routing: request('/api/v1/netshoes/search', LIST_MS),
			},
		],
		default: 'search',
	},
];

export const netshoesFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'netshoesQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tenis corrida',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 120 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'netshoesSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('netshoesSearch', 100, 100)),
	},

	// -- Get List Products --
	{
		displayName: 'Additional Options',
		name: 'netshoesListOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['list']),
		options: sorted([
			{
				displayName: 'List Slug or URL',
				name: 'netshoesListSlug',
				type: 'string',
				default: '',
				placeholder: 'tenis-black-friday',
				description: 'A list slug or its netshoes.com.br/lst/ link; empty for tenis-black-friday',
				routing: { request: { body: { slug: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('netshoesList', 250, 45),
		]),
	},

	// -- Get Product --
	productField(
		'netshoesProduct',
		['product'],
		'FBA-82XQ-006',
		'The Netshoes product ID (the colour code, product_id of a listing), a size SKU, or a netshoes.com.br product link',
	),

	// -- Get Offers, Get Online Stock, Get Shipping --
	skuField('netshoesOffersSku', ['offers']),
	skuField('netshoesInventorySku', ['inventory']),
	{
		displayName: 'Additional Options',
		name: 'netshoesInventoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['inventory']),
		options: [sellerOption('netshoesInventorySeller', "The seller (sizes offers seller ID; 0 is Netshoes); empty for the size's buy-box seller")],
	},
	skuField('netshoesShippingSku', ['shipping']),
	{
		displayName: 'CEP',
		name: 'netshoesCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['shipping']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'A Brazilian CEP (8 digits)',
	},
	{
		displayName: 'Additional Options',
		name: 'netshoesShippingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['shipping']),
		options: [sellerOption('netshoesShippingSeller', "Quote this seller's offer (sizes offers seller ID); empty for the buy-box seller")],
	},

	// -- Get Reviews --
	productField(
		'netshoesReviewsProduct',
		['reviews'],
		'FBA-82XQ',
		'The product code shared by every colour (product_code), or a colour product ID, size SKU or product link',
	),
	{
		displayName: 'Additional Options',
		name: 'netshoesReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'netshoesReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, 1-based (13 per page)',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'netshoesReviewsRating',
				type: 'options',
				default: 'any',
				options: [
					{ name: '1 Star', value: '1' },
					{ name: '2 Stars', value: '2' },
					{ name: '3 Stars', value: '3' },
					{ name: '4 Stars', value: '4' },
					{ name: '5 Stars', value: '5' },
					{ name: 'Any', value: 'any' },
					{ name: 'Negative (2 and 1 Star)', value: 'negative' },
					{ name: 'Positive (5 and 4 Stars)', value: 'positive' },
				],
				routing: {
					request: {
						body: {
							rating: '={{ $value === "any" ? undefined : /^\\d$/.test($value) ? Number($value) : $value }}',
						},
					},
				},
			},
			{
				displayName: 'With Photos',
				name: 'netshoesReviewsWithPhotos',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews with photos',
				routing: { request: { body: { with_photos: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Questions --
	productField(
		'netshoesQuestionsProduct',
		['questions'],
		'I0Y-0011',
		'The product code (product_code), or a colour product ID, size SKU or product link',
	),
	{
		displayName: 'Page',
		name: 'netshoesQuestionsPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 1000 },
		displayOptions: show(['questions']),
		description: 'Page, 1-based (10 per page)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},

	// -- Get Seller --
	{
		displayName: 'Seller ID',
		name: 'netshoesSellerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '13644',
		displayOptions: show(['seller']),
		routing: { request: { body: { seller_id: '={{ String($value).trim() }}' } } },
		description: 'A marketplace seller ID (sizes offers seller ID of Get Product, seller_ids of Get Daily Deal)',
	},
];
