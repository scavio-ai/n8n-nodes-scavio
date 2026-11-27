import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['atacadao'], operation, ...extra },
});

// Atacadao (atacadao.com.br, the Brazilian cash-and-carry wholesale chain of Grupo Carrefour Brasil), 10 operations,
// 1 credit each; credits_used is the truth. Brazil only, BRL. Calls usually take 2 to 20 s; every operation carries a
// 120s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 120000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	'Atacadao (atacadao.com.br, the Brazilian cash-and-carry wholesale chain of Grupo Carrefour Brasil), Brazil only, Portuguese text, prices in BRL';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const STORE_NOTE =
	"Prices are the online prices of the store chosen in Store ID; without one, the site's default store (atacadaobr60, Vila Maria, Sao Paulo).";
const GRID =
	"store_id, priced_store_id, page, page_size, total (the store's matching items), total_pages, has_more, count, sort, filters_applied, items (position, SKU for Get Product, product_id, name, brand, URL, image, measurement_unit, unit_multiplier, units_per_box (the case size), reference_code, price (the unit price for 1 unit), price_tiers (every quantity tier the store gives: min_quantity and unit_price), bulk_unit_price, online_exclusive_price, priced_store_id, categories, collections) and notes. Items the chosen store does not sell are left out. There is no was-price: the quantity tiers are the deal.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as one value or an array, or undefined when empty. */
const LIST_VALUE =
	'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length === 0 ? undefined : a.length === 1 ? a[0] : a; })() }}';

const storeIdOption = (name: string): INodeProperties => ({
	displayName: 'Store ID',
	name,
	type: 'string',
	default: '',
	placeholder: 'atacadaobr340',
	description:
		"The store to price at: its store ID (atacadaobr340) or store number (340), from Get Stores Near or Get Stores. Empty: the site's default store (atacadaobr60, Vila Maria, Sao Paulo).",
	routing: {
		request: {
			body: {
				store_id:
					'={{ (() => { const v = String($value ?? "").trim(); return v === "" ? undefined : /^\\d+$/.test(v) ? Number(v) : v; })() }}',
			},
		},
	},
});

const categoryOption = (name: string): INodeProperties => ({
	displayName: 'Category',
	name,
	type: 'string',
	default: '',
	placeholder: 'mercearia/graos',
	description: 'A category path of 1 to 3 levels (path from Get Categories) or its atacadao.com.br link',
	routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
});

/** Store, sort, filters and paging shared by Search Products, Get Category Products and Get Facets. */
const gridOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Brand',
		name: `${prefix}Brand`,
		type: 'string',
		default: '',
		placeholder: 'camil',
		description: 'Brand value(s) from Get Facets (key brand), comma-separated',
		routing: { request: { body: { brand: LIST_VALUE } } },
	},
	{
		displayName: 'Collection',
		name: `${prefix}Collection`,
		type: 'string',
		default: '',
		placeholder: '382',
		description: 'A collection ID (collections ID of an item), e.g. 382 (Black November)',
		routing: { request: { body: { collection: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '{}',
		description:
			'Any other facet by the site\'s own key (facets key of Get Facets): key -> value or [values], up to 5 keys, e.g. {"category-3": "arroz-branco"}',
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
		name: `${prefix}MaxPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 100000 },
		description: 'Maximum price in BRL; 0 means no limit',
		routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Min Price (BRL)',
		name: `${prefix}MinPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 100000 },
		description: 'Minimum price in BRL; 0 means no limit',
		routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 50 },
		description: 'Results page, 1 to 50',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Page Size',
		name: `${prefix}PageSize`,
		type: 'number',
		default: 20,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Items per page, 1 to 100',
		routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'Discount', value: 'discount' },
			{ name: 'Name: A to Z', value: 'name_asc' },
			{ name: 'Name: Z to A', value: 'name_desc' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	storeIdOption(`${prefix}StoreId`),
];

const storeRefField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Store',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '340',
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				store_id: '={{ (() => { const v = String($value).trim(); return /^\\d+$/.test(v) ? Number(v) : v; })() }}',
			},
		},
	},
	description: 'A store number (340), store ID (atacadaobr340) or store slug (tatuape), from Get Stores or Get Stores Near',
});

export const atacadaoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['atacadao'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get atacadao categories',
				description: `The ${SITE} department tree: count, node_count and categories (category_id, name, path, URL, children); use path or category_id in Get Category Products. Captured 2026-11-27: 20 departments and 644 nodes. ${ONE}`,
				routing: request('/api/v1/atacadao/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get atacadao category products',
				description: `One ${SITE} category listing by path or category ID, at one store, sorted and filtered like Search Products. ${STORE_NOTE} Returns category, category_id, URL and ${GRID} An unknown category ID is a charged not-found; an unknown path is an empty answer. Captured 2026-11-27: mercearia/graos at atacadaobr340 held 76 items. ${ONE}`,
				routing: request('/api/v1/atacadao/category'),
			},
			{
				name: 'Get Facets',
				value: 'facets',
				action: 'Get atacadao facets',
				description: `The filter values of ${SITE} for a query and / or category, brand or collection at one store: total and facets (key, label, param naming the option each one goes back into, values with label, count and selected, or min / max) with the store's own counts. Captured 2026-11-27: arroz at atacadaobr340 gave 52 items and 5 facets. ${ONE}`,
				routing: request('/api/v1/atacadao/facets', true),
			},
			{
				name: 'Get Flyers',
				value: 'flyers',
				action: 'Get atacadao flyers',
				description: `The current flyers (folhetos) of one Atacadao store: store_number, store_id, name, slug, URL, count and flyers (flyer_id, name, valid_from, valid_to, pdf_url (the flyer document, PDF, as the store page links it), thumbnail_url, priority). The flyer is returned as a link and is not opened. An unknown store is a charged not-found. Captured 2026-11-27: store 340 listed 6 Black Friday flyers. ${ONE}`,
				routing: request('/api/v1/atacadao/flyers'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an atacadao product',
				description: `One ${SITE} product by SKU, EAN, product ID, slug or link, priced at one store: SKU, product_id, name, complement_name, brand, EAN (EAN-13), reference_code, URL, images, categories, measurement_unit, unit_multiplier, units_per_box, specifications, available_at_store, price, price_tiers, bulk_unit_price, online_exclusive_price, priced_store_id and collections. ${STORE_NOTE} No marketing description, stock units, reviews or price history. An unknown product is a charged not-found; a product the store does not sell comes back with available_at_store false and no price. Captured 2026-11-27: the Arroz Branco Namorado Tipo 1 5kg at atacadaobr340 was 21.89 BRL for 1 unit and 21.39 BRL each from 6. ${ONE}`,
				routing: request('/api/v1/atacadao/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get atacadao search suggestions',
				description: `The ${SITE} search box for the start of a search: suggestions (term, count, attributes) and top_searches (term, count); without Query, the top searches alone. Captured 2026-11-27: arroz gave 5 completions next to 10 top searches. ${ONE}`,
				routing: request('/api/v1/atacadao/suggestions', true),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an atacadao store',
				description: `One Atacadao store in full: store_number, store_id, sells_online, name, slug, URL, format, address, phone, latitude, longitude, hours, holiday_hours, online_services, flyer_count, services (bakery, butcher, cafe, fuel station ...), recycling_points, payment_methods, credit_cards, meal_vouchers and flyers. An unknown store is a charged not-found. Captured 2026-11-27: store 340, Tatuape 24hrs in Sao Paulo, with 8 services and 6 flyers. ${ONE}`,
				routing: request('/api/v1/atacadao/store'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get atacadao stores',
				description: `The Atacadao store directory for a Brazilian state and, optionally, a city: total, page, page_size, total_pages, has_more, count and stores (store_number, store_id for Store ID (null when the store does not sell online), sells_online, name, slug, URL, format, address, phone, latitude, longitude, hours, holiday_hours, online_services, flyer_count). A city with no store is a charged not-found that lists the state's cities. Captured 2026-11-27: Sao Paulo city listed 21 stores. ${ONE}`,
				routing: request('/api/v1/atacadao/stores'),
			},
			{
				name: 'Get Stores Near',
				value: 'stores_near',
				action: 'Get atacadao stores near',
				description: `The Atacadao pickup stores near a Brazilian CEP (postal code) or a point, nearest first: total, count and stores (store_id, store_number, pickup_point_id, name, distance_km, address, latitude, longitude, hours); for a CEP also serving_stores (the stores the site offers for that CEP). Captured 2026-11-27: CEP 01310-100 listed 33 pickup stores, the nearest 4.9 km away. ${ONE}`,
				routing: request('/api/v1/atacadao/stores-near'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search atacadao products',
				description: `${SITE} keyword search at one store, sorted by the site's 8 sorts and filtered by category (1 to 3 levels), brand, price range, collection and any other facet. ${STORE_NOTE} Returns query and ${GRID} No results is an empty, charged answer. Captured 2026-11-27: arroz at atacadaobr340 matched 52 items, the first the Arroz Branco Camil Tipo 1 5kg at 20.29 BRL. ${ONE}`,
				routing: request('/api/v1/atacadao/search'),
			},
		],
		default: 'search',
	},
];

export const atacadaoFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'atacadaoQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'arroz',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese (1 to 100 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'atacadaoSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([categoryOption('atacadaoSearchCategory'), ...gridOptions('atacadaoSearch')]),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path or ID',
		name: 'atacadaoCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mercearia/graos',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					category_id: '={{ /^\\d+$/.test(String($value).trim()) ? Number(String($value).trim()) : undefined }}',
					category: '={{ /^\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A category path of 1 to 3 levels (path from Get Categories) or its link, or a numeric category ID (category_id)',
	},
	{
		displayName: 'Additional Options',
		name: 'atacadaoCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(gridOptions('atacadaoCategory')),
	},

	// -- Get Product --
	{
		displayName: 'Look Up By',
		name: 'atacadaoProductBy',
		type: 'options',
		default: 'sku',
		options: [
			{ name: 'EAN', value: 'ean' },
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'SKU', value: 'sku' },
			{ name: 'Slug', value: 'slug' },
			{ name: 'URL', value: 'url' },
		],
		displayOptions: show(['product']),
	},
	{
		displayName: 'Product',
		name: 'atacadaoProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '14443',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: '={{ $parameter["atacadaoProductBy"] === "sku" ? String($value).trim() : undefined }}',
					ean: '={{ $parameter["atacadaoProductBy"] === "ean" ? String($value).trim() : undefined }}',
					product_id: '={{ $parameter["atacadaoProductBy"] === "product_id" ? String($value).trim() : undefined }}',
					slug: '={{ $parameter["atacadaoProductBy"] === "slug" ? String($value).trim() : undefined }}',
					url: '={{ $parameter["atacadaoProductBy"] === "url" ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The SKU (SKU of an item), EAN-13 barcode, product ID, product slug or atacadao.com.br product link, as chosen in Look Up By',
	},
	{
		displayName: 'Additional Options',
		name: 'atacadaoProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [storeIdOption('atacadaoProductStoreId')],
	},

	// -- Get Stores Near --
	{
		displayName: 'CEP',
		name: 'atacadaoNearCep',
		type: 'string',
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['stores_near']),
		routing: { request: { body: { cep: '={{ String($value).trim() || undefined }}' } } },
		description: 'A Brazilian CEP (postal code, 8 digits); or leave empty and give Latitude and Longitude',
	},
	{
		displayName: 'Additional Options',
		name: 'atacadaoNearOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores_near']),
		options: [
			{
				displayName: 'Latitude',
				name: 'atacadaoNearLatitude',
				type: 'number',
				default: -23.55,
				typeOptions: { minValue: -34, maxValue: 6, numberPrecision: 6 },
				description: 'Latitude of a point in Brazil, with Longitude, instead of CEP',
				routing: { request: { body: { latitude: '={{ $value }}' } } },
			},
			{
				displayName: 'Longitude',
				name: 'atacadaoNearLongitude',
				type: 'number',
				default: -46.63,
				typeOptions: { minValue: -74, maxValue: -28, numberPrecision: 6 },
				description: 'Longitude of a point in Brazil, with Latitude',
				routing: { request: { body: { longitude: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Stores --
	{
		displayName: 'State',
		name: 'atacadaoStoresState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'SP',
		displayOptions: show(['stores']),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'Brazilian state code (UF), e.g. SP, RJ, PR',
	},
	{
		displayName: 'Additional Options',
		name: 'atacadaoStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'City',
				name: 'atacadaoStoresCity',
				type: 'string',
				default: '',
				placeholder: 'Curitiba',
				description: 'A city of that state (accents and case ignored)',
				routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'atacadaoStoresPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'atacadaoStoresPageSize',
				type: 'number',
				default: 24,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Stores per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Store, Get Flyers --
	storeRefField('atacadaoStoreRef', ['store']),
	storeRefField('atacadaoFlyersStore', ['flyers']),

	// -- Get Facets --
	{
		displayName: 'Additional Options',
		name: 'atacadaoFacetsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['facets']),
		options: sorted([
			categoryOption('atacadaoFacetsCategory'),
			{
				displayName: 'Query',
				name: 'atacadaoFacetsQuery',
				type: 'string',
				default: '',
				placeholder: 'arroz',
				description: 'Search keywords (or give a Category, Brand or Collection)',
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('atacadaoFacets'),
		]),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'atacadaoSuggestionsQuery',
		type: 'string',
		default: '',
		placeholder: 'arro',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		description: 'The start of a search; empty for the top searches alone',
	},
];
