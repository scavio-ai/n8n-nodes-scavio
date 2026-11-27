import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['petz'], operation, ...extra },
});

// Petz (petz.com.br, the Brazilian pet store of Grupo Petz Cobasi), 7 operations, 1 credit each; credits_used is the
// truth. Brazil only, BRL. Listings take 50 to 150 s (up to about 245 s); product, stores and store 30 to 95 s. Every
// operation carries a 300s timeout.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;

const SITE =
	'Petz (petz.com.br, the Brazilian pet store of Grupo Petz Cobasi), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID =
	'20 products per page, pages 1 to 50; a search counts at most 1,000 products (total_capped). Returns page, page_size, sort, total, total_capped, total_pages, has_more, count and items (product_id for Get Product, sku, EAN, name, URL, image, brand, sub_brand, categories, price, list_price as the regular price when a deal price applies, discount_percent, subscription_price as the Assinatura Petz repeat-delivery price rounded to cents, subscription_discount_percent, clubz with the price Petz shows for Clubz loyalty members, available, availability, stock_units capped at 100, stock_capped when 100 or more, has_variations, variations with their own prices).';
const NOT_BUILT =
	'Per-store stock and prices, prices by CEP, the full review history, Pix prices, installments and shipping are not returned.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const listingOptions = (prefix: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 50 },
			description: 'Results page, 1 to 50, 20 products each',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Relevance', value: 'relevance' },
			],
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
	]),
});

export const petzOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['petz'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get petz brand products',
				description: `The products of one brand at ${SITE}, by brand slug, sorted by relevance, price or newest: brand (slug, name, URL, redirected_from). ${GRID} An unknown brand is a charged not-found. Captured 2026-11-27: royal-canin held 166 products. ${ONE}`,
				routing: request('/api/v1/petz/brand', SLOW_MS),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get petz category products',
				description: `One category of ${SITE} by category path (a pet, or a pet and a department), sorted by relevance, price or newest: category (path, name, URL, redirected_from; when Petz redirects a category link to another listing, path is the listing answered). ${GRID} An unknown category is a charged not-found. Captured 2026-11-27: cachorro/racao held 978 products. ${ONE}`,
				routing: request('/api/v1/petz/category', SLOW_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get petz deals',
				description: `The deals page (Promocoes) of ${SITE}, or one of its collections (themed deals lists): products with the deal price next to the regular price (list_price) and discount_percent, sorted by relevance, price or newest; deals (collection, name, URL). Petz publishes no validity dates for these deals. ${GRID} An unknown collection is a charged not-found. Captured 2026-11-27: the PF-racoes collection held 411 products. ${ONE}`,
				routing: request('/api/v1/petz/deals', SLOW_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a petz product',
				description: `One product of ${SITE} by product ID or link: product_id, sku, EAN, name, URL, brand (name, slug), sub_brand, category, categories (name, path), images, price, list_price, discount_percent, subscription_price (Assinatura Petz, rounded to cents), available, availability, stock_units (capped at 100), stock_capped, published, specs, rating (average, count, stars), latest_reviews (the 3 latest reviews: date, rating, text; no reviewer names) and variations, each size or variant with its own prices and stock. ${NOT_BUILT} An unknown product is a charged not-found. Captured 2026-11-27: a Selections For Pet dog food, 3 kg, at 46.39 BRL (list 57.99) with 100 or more units, in 3 sizes, rated 4.9 from 32 reviews. ${ONE}`,
				routing: request('/api/v1/petz/product', SLOW_MS),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a petz store',
				description: `One store of ${SITE} by slug or link: store_id, slug, name, URL, image, google_place_id, address (street, neighborhood, city, state, CEP), phone (the store's business number), hours (days, opens, closes, closed, open_24h), service_codes and pet_codes (Petz's own codes). Store stock and store prices are not returned. An unknown store is a charged not-found. ${ONE}`,
				routing: request('/api/v1/petz/store', SLOW_MS),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get petz stores',
				description: `The store directory of ${SITE}, narrowed by state and city: total (all stores), state, city, count and stores (store_id, slug for Get Store, name, URL, image, address, phone, hours, pickup when online orders can be picked up there, service_codes, pet_codes). Captured 2026-11-27: 269 stores, 128 in SP. ${ONE}`,
				routing: request('/api/v1/petz/stores', SLOW_MS, true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search petz products',
				description: `Search ${SITE} by keyword, sorted by relevance, price or newest. ${GRID} Also query and note. A keyword with no products returns total 0. Search suggestions are not offered. Captured 2026-11-27: ração golden matched 72 products, the first at 159.99 BRL, 143.99 by Assinatura Petz. ${ONE}`,
				routing: request('/api/v1/petz/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const petzFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'petzQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ração golden',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 200 characters)',
	},
	listingOptions('petzSearch', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'petzCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cachorro/racao',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			"A category path: a pet and a department (a product's categories path), e.g. cachorro, cachorro/racao or gato/areia-e-banheiros, or its petz.com.br link",
	},
	listingOptions('petzCategory', 'category'),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'petzBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'royal-canin',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand slug as Petz writes it (brand slug of Get Product), e.g. royal-canin or premierpet, or its petz.com.br link',
	},
	listingOptions('petzBrand', 'brand'),

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'petzDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			{
				displayName: 'Collection',
				name: 'petzDealsCollection',
				type: 'string',
				default: '',
				placeholder: 'pf-petz-friday',
				description:
					'A Petz collection (a themed deals list) by its slug as its link shows it, or that link; leave out for the main deals page (Promocoes)',
				routing: { request: { body: { collection: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'petzDealsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Results page, 1 to 50, 20 products each',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'petzDealsSort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
				],
				routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Product --
	{
		displayName: 'Product ID or URL',
		name: 'petzProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '191628',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'The Petz product ID (product_id of a listing item or a variation; the number at the end of a product link) or a Petz product link',
	},

	// -- Get Stores --
	{
		displayName: 'Additional Options',
		name: 'petzStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'City',
				name: 'petzStoresCity',
				type: 'string',
				default: '',
				placeholder: 'São Paulo',
				description: 'A city name; accents and case are ignored',
				routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'petzStoresState',
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
		name: 'petzStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'petz-aclimacao',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The store slug (slug of Get Stores) or a Petz store link (www.petz.com.br/loja/slug)',
	},
];
