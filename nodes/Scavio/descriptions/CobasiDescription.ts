import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['cobasi'], operation, ...extra },
});

// Cobasi (cobasi.com.br, the Brazilian pet store of Grupo Petz Cobasi), 11 operations, 1 credit each; credits_used is
// the truth. Brazil only, BRL. Listings, product, stores and store take 10 to 90 s and carry a 300s timeout; reviews,
// questions, availability and suggestions take 2 to 6 s and carry 120s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;
const FAST_MS = 120000;

const SITE =
	'Cobasi (cobasi.com.br, the Brazilian pet store of Grupo Petz Cobasi), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID =
	'20 products per page; Cobasi stops paging at page 50 (1,000 products). Returns page, page_size, sort, total, total_pages, has_more, count, items (product_id for Get Product, name, URL, image, brand, price, list_price as the regular price when a lower price applies, discount_percent, available, rating, skus with the sku_id Get Pickup and Delivery takes) and note.';
const NOT_BUILT = 'Pix prices, per-store prices or units and marketplace sellers are not returned.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const pageOption = (name: string, max: number, description: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description,
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const searchSortOption = (name: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Largest Discount', value: 'discount_desc' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
});

const listingSortOption = (name: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: 'top_selling',
	options: [
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Top Selling', value: 'top_selling' },
	],
	routing: { request: { body: { sort: '={{ $value === "top_selling" ? undefined : $value }}' } } },
});

const listingOptions = (prefix: string, operations: string[]): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show(operations),
	options: sorted([
		pageOption(`${prefix}Page`, 50, 'Results page, 1 to 50, 20 products each'),
		listingSortOption(`${prefix}Sort`),
	]),
});

const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '3934097',
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
		'The Cobasi product ID (product_id of a listing; the number before /p in a product link) or a Cobasi product link',
});

export const cobasiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['cobasi'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get cobasi brand products',
				description: `The products of one brand at ${SITE}, by brand slug, sorted by best sellers or price: brand (slug, name, URL). ${GRID} An unknown brand is a charged not-found. Captured 2026-11-27: golden had 67 products. ${ONE}`,
				routing: request('/api/v1/cobasi/brand', SLOW_MS),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get cobasi category products',
				description: `One ${SITE} category by path, sorted by best sellers or price: category, URL, subcategories (category_id, name, path, has_children) and facets with counts. ${GRID} total is null when the category page does not count its products. An unknown category is a charged not-found. Captured 2026-11-27: cachorro/racao had 4 subcategories. ${ONE}`,
				routing: request('/api/v1/cobasi/category', SLOW_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get cobasi deals',
				description: `The ${SITE} deals page (Promocoes): products on promotion with the deal price next to the regular price (list_price) and discount_percent, sorted by relevance, price or discount. ${GRID} Cobasi publishes no validity dates for these deals. Captured 2026-11-27: 1293 products on promotion. ${ONE}`,
				routing: request('/api/v1/cobasi/deals', SLOW_MS, true),
			},
			{
				name: 'Get Pickup and Delivery',
				value: 'availability',
				action: 'Get cobasi pickup and delivery',
				description: `Pickup and delivery for one ${SITE} SKU at a Brazilian CEP (postal code), for the quantity asked: pickup (available, ready_in, store_count, stores near the CEP that can hand the SKU over, usually in 45 minutes) and delivery options (option_id, name, price in BRL, free, estimate). Flags, not unit counts: Cobasi publishes no per-store stock or per-store prices. Captured 2026-11-27: SKU 934097 at CEP 01310-100 could be picked up at 11 stores or delivered for 7.90 BRL in 2 business days. ${ONE}`,
				routing: request('/api/v1/cobasi/availability', FAST_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a cobasi product',
				description: `One ${SITE} product by product ID or link: name, URL, brand, brand_id, categories, images, available, sold_by, main_sku_id, skus (sku_id, size name, EAN, available, price, list_price, discount_percent, subscription_price as the Compra Programada price, null unless can_subscribe, installments, price_per_measure such as the price per kg, best_value, is_kit, price_valid_until), subscription frequencies when the product can be bought on subscription, specs, dimensions, rating and 4 recent reviews without reviewer names. available is a flag, not a unit count. ${NOT_BUILT} An unknown product is a charged not-found. Captured 2026-11-27: a Formula Natural Fresh Meat dog food, 1 kg at 59.99 BRL (list 74.99), rated 4.9 from 669 reviews. ${ONE}`,
				routing: request('/api/v1/cobasi/product', SLOW_MS),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get cobasi questions',
				description: `Shopper questions about one ${SITE} product with Cobasi's answers, 4 per page: total, total_pages, has_more and questions (question_id, question, answer, answered_at). The answer's opening greeting, which names the asker, is removed; no asker names. ${ONE}`,
				routing: request('/api/v1/cobasi/questions', FAST_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get cobasi reviews',
				description: `Customer reviews of one ${SITE} product, in Cobasi's own recent-review order, 4 per page: total, total_pages, average_rating, stars, recommend_percent and reviews (date, purchase_date, rating, recommends, text). No reviewer names. ${ONE}`,
				routing: request('/api/v1/cobasi/reviews', FAST_MS),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get cobasi search suggestions',
				description: `The ${SITE} search suggestions for the start of a search: query, misspelled (Cobasi corrected the spelling), count and up to 5 suggestions. Captured 2026-11-27: areia gato gave 5 suggestions. ${ONE}`,
				routing: request('/api/v1/cobasi/suggestions', FAST_MS),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a cobasi store',
				description: `One ${SITE} store by slug or link: name, URL, address, latitude, longitude, phone, WhatsApp link, hours per weekday, holiday_hours, grooming_hours and vet_hours where offered, services, pet_services and online_scheduling. An unknown store is a charged not-found. ${ONE}`,
				routing: request('/api/v1/cobasi/store', SLOW_MS),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get cobasi stores',
				description: `The ${SITE} store directory, narrowed by state and city: total, count and stores (store_id, slug for Get Store, name, URL, address, latitude, longitude, services such as pickup in 45 minutes, vet pharmacy or grooming). Captured 2026-11-27: 253 stores, 149 in SP. ${ONE}`,
				routing: request('/api/v1/cobasi/stores', SLOW_MS, true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search cobasi products',
				description: `${SITE} keyword search, sorted by relevance, price or discount and narrowed by any facet (brand, department, pet size, age, flavour and more). ${GRID} Also query, facets (key, label, values with value, label, count, selected; send values in Filters) and filters_applied. Subscription prices are on Get Product. Captured 2026-11-27: racao golden matched 237 products, the first at 159.99 BRL. ${ONE}`,
				routing: request('/api/v1/cobasi/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const cobasiFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'cobasiQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ração golden',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'cobasiSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Filters',
				name: 'cobasiSearchFilters',
				type: 'string',
				default: '',
				placeholder: 'brand/golden, porte/racas-pequenas',
				description:
					'Facet filter values exactly as facets values value lists them, comma-separated, up to 10, e.g. brand/golden, category-1/cachorro',
				routing: {
					request: {
						body: {
							filters:
								'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length ? a : undefined; })() }}',
						},
					},
				},
			},
			pageOption('cobasiSearchPage', 50, 'Results page, 1 to 50, 20 products each'),
			searchSortOption('cobasiSearchSort'),
		]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'cobasiCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cachorro/racao',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			"A category path (a product's categories path, a category's subcategories path, or the path after /c/ in a category link), e.g. cachorro or cachorro/racao/racao-seca",
	},
	listingOptions('cobasiCategory', ['category']),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'cobasiBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'golden',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand as its Cobasi link shows it (the part after /m/), e.g. golden, premier or gran-plus',
	},
	listingOptions('cobasiBrand', ['brand']),

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'cobasiDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			pageOption('cobasiDealsPage', 50, 'Results page, 1 to 50, 20 products each'),
			searchSortOption('cobasiDealsSort'),
		]),
	},

	// -- Get Product, Get Reviews, Get Questions --
	productField('cobasiProduct', ['product']),
	productField('cobasiReviewsProduct', ['reviews', 'questions']),
	{
		displayName: 'Page',
		name: 'cobasiReviewsPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 500 },
		displayOptions: show(['reviews', 'questions']),
		description: 'Page, 1-based, 4 per page',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},

	// -- Get Pickup and Delivery --
	{
		displayName: 'SKU ID',
		name: 'cobasiSkuId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '934097',
		displayOptions: show(['availability']),
		routing: { request: { body: { sku_id: '={{ String($value).trim() }}' } } },
		description: 'The Cobasi SKU ID (skus sku_id of a product or a listing item; one size or variant)',
	},
	{
		displayName: 'CEP',
		name: 'cobasiCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['availability']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'The Brazilian CEP to pick up near or deliver to (8 digits)',
	},
	{
		displayName: 'Quantity',
		name: 'cobasiQuantity',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 10 },
		displayOptions: show(['availability']),
		description: 'Units, 1 to 10',
		routing: { request: { body: { quantity: '={{ $value > 1 ? $value : undefined }}' } } },
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'cobasiSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'areia gato',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a search, as a shopper types it (1 to 100 characters)',
	},

	// -- Get Stores --
	{
		displayName: 'Additional Options',
		name: 'cobasiStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'City',
				name: 'cobasiStoresCity',
				type: 'string',
				default: '',
				placeholder: 'São Paulo',
				description: 'A city name; accents and case are ignored',
				routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'cobasiStoresState',
				type: 'string',
				default: '',
				placeholder: 'SP',
				description: 'A Brazilian state code (UF), e.g. SP or RJ',
				routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() || undefined }}' } } },
			},
		],
	},

	// -- Get Store --
	{
		displayName: 'Store Slug or URL',
		name: 'cobasiStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cobasi-americana',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The store slug (stores slug of Get Stores) or a Cobasi store link (www.cobasi.com.br/lojas/slug)',
	},
];
