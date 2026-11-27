import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['carrefourbr'], operation, ...extra },
});

// Carrefour Brasil (carrefour.com.br: the Mercado grocery site and the www marketplace), 9 operations, 1 credit each;
// credits_used is the truth. Brazil only, BRL. Separate from the Carrefour (France) resource. Calls usually take 2 to
// 25 s on mercado, up to about 50 s on www; every operation carries a 180s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	'Carrefour Brasil (carrefour.com.br: the Mercado grocery site and the www marketplace), Brazil only, Portuguese text, prices in BRL';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const REGION =
	"On Mercado, CEP or Store (a store_id from Get Stores) gives that region's prices and assortment (region, price_scope regional); without them the site's default prices (price_scope national). www prices are national.";
const GRID =
	"15 items a page: total, page, page_size, total_pages (up to 50), sort, count, items (position, product_id, item_id for Get Product, name, brand, product_reference, URL, categories, measurement_unit (kg: priced per kg), price, list_price, spot_price (the single-payment price), discount_percent, available (a flag, no unit counts), seller, seller_count, variant_count, stamps, image, sponsored, international), sponsored_count and sponsored (the site's sponsored placements, kept apart from items), facets (key, name, type, values with filter for Filters (JSON), or price ranges), region, price_scope and notes.";
const FILTERS =
	"Sorted by the site's 8 sorts and filtered by any facet value (department, category, brand, seller and the product attributes the site lists) and a price range.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const SITE_OPS = ['search', 'category', 'collection', 'product', 'delivery', 'suggestions', 'coupons', 'categories'];

const cepOption = (name: string): INodeProperties => ({
	displayName: 'CEP',
	name,
	type: 'string',
	default: '',
	placeholder: '01310-100',
	description:
		"On Mercado: a Brazilian CEP (postal code, 8 digits) for that region's prices and assortment. On www prices are national.",
	routing: { request: { body: { cep: '={{ String($value).trim() || undefined }}' } } },
});

const storeOption = (name: string): INodeProperties => ({
	displayName: 'Store',
	name,
	type: 'string',
	default: '',
	placeholder: '01405002',
	description: "On Mercado, instead of CEP: a pickup store's store_id from Get Stores, for that store's prices and assortment",
	routing: { request: { body: { store: '={{ String($value).trim() || undefined }}' } } },
});

/** Region, sort, filters, price range and paging shared by Search Products, Get Category Products and Get Collection Products. */
const gridOptions = (prefix: string): INodeProperties[] => [
	cepOption(`${prefix}Cep`),
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '{}',
		description:
			'Facet filters from facets values filter of a previous answer, e.g. {"brand": "camil"} or {"category-2": ["arroz"]}; up to 10 values, values of one key combine as any of them',
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
		typeOptions: { minValue: 0, maxValue: 1000000 },
		description: 'Maximum price in whole reais; 0 means no limit',
		routing: { request: { body: { max_price: '={{ $value > 0 ? Math.floor($value) : undefined }}' } } },
	},
	{
		displayName: 'Min Price (BRL)',
		name: `${prefix}MinPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000 },
		description: 'Minimum price in whole reais; 0 means no limit',
		routing: { request: { body: { min_price: '={{ $value > 0 ? Math.floor($value) : undefined }}' } } },
	},
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 50 },
		description: 'Page, 1 to 50 (15 items a page)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Best Selling', value: 'orders_desc' },
			{ name: 'Discount', value: 'discount_desc' },
			{ name: 'Name: A to Z', value: 'name_asc' },
			{ name: 'Name: Z to A', value: 'name_desc' },
			{ name: 'Newest', value: 'release_desc' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	storeOption(`${prefix}Store`),
];

export const carrefourbrOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['carrefourbr'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get carrefour brasil categories',
				description: `The ${SITE} department menu as the site's header lists it, 3 levels: count, node_count and departments (name, URL, site, path for Get Category Products, filters, collection_id for Get Collection Products, children). Captured 2026-11-27: Mercado listed 15 departments and 673 nodes. ${ONE}`,
				routing: request('/api/v1/carrefourbr/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get carrefour brasil category products',
				description: `One ${SITE} category by path or link. ${FILTERS} ${REGION} Returns category (path, category_id, name, title, page_type, breadcrumbs) and ${GRID} An unknown category is a charged not-found. Captured 2026-11-27: the Mercado rice category held 100 items, the first the Arroz Branco Camil Tipo 1 5kg at 23.99 BRL. ${ONE}`,
				routing: request('/api/v1/carrefourbr/category'),
			},
			{
				name: 'Get Collection Products',
				value: 'collection',
				action: 'Get carrefour brasil collection products',
				description: `One ${SITE} collection (a themed or deal list: the lists the site's banners, coupons and menu link to) by ID or link. ${FILTERS} ${REGION} Returns collection (collection_id, name as the site gives it) and ${GRID} An unknown or empty collection is a charged not-found. Captured 2026-11-27: collection 29861 on Mercado held 94 items. ${ONE}`,
				routing: request('/api/v1/carrefourbr/collection'),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get carrefour brasil coupons',
				description: `The ${SITE} coupon page as published: title, count, coupons (code, value, name, category, active, expires, expiration_date, link, collection_id for Get Collection Products, rules), categories and terms. Captured 2026-11-27: Mercado listed 4 coupons. ${ONE}`,
				routing: request('/api/v1/carrefourbr/coupons', true),
			},
			{
				name: 'Get Delivery Options',
				value: 'delivery',
				action: 'Get carrefour brasil delivery options',
				description: `Delivery and pickup options for one ${SITE} item from one seller to a CEP, on either site: cep, address, can_deliver, message (the site's own text), out_of_stock_for_region, minimum_order_value, option_count, options (group, name, channel delivery or pickup-in-point, price, list_price, estimate, estimate_date, earliest_date, scheduled, pickup_store) and pickup_stores near the CEP with their opening hours. The answer is the site's quote for one unit; it does not reserve stock. Captured 2026-11-27: item 1972 to CEP 01310-100 had normal delivery at 10.90 BRL in 2h and free store pickup 1.15 km away. ${ONE}`,
				routing: request('/api/v1/carrefourbr/delivery'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a carrefour brasil product',
				description: `One ${SITE} product by item ID or link. ${REGION} Returns item_id, product_id, name, brand, EAN, product_reference, URL, categories, breadcrumbs, measurement_unit, unit_multiplier, price, list_price, spot_price, discount_percent, price_valid_until, seller, sellers (seller_id, the seller's business name, price, availability, payment_offers, promotions), payment_offers (the site's prices for one payment method, such as the Carrefour card or Pix, Brazil's instant payment), promotions as given, stamps, dual_price, weight (items sold by weight), availability (a flag: no unit counts), description, specs, variants (each variant is its own item ID) and images. No reviews or questions (the site has none). An unknown item, or one the chosen region does not sell, is a charged not-found. Captured 2026-11-27: item 1972, the Arroz Branco Longo-fino Tipo 1 Tio Joao 1 Kg, at 6.59 BRL with a Carrefour card offer of 30% off. ${ONE}`,
				routing: request('/api/v1/carrefourbr/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get carrefour brasil search suggestions',
				description: `The ${SITE} search suggestions for what a shopper has typed: terms (term, attributes), products (the suggested products, with the list item fields) and top_searches (the site's most searched terms with their counts; alone when Query is empty). Captured 2026-11-27: arroz gave 5 terms and 24 products. ${ONE}`,
				routing: request('/api/v1/carrefourbr/suggestions', true),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get carrefour brasil stores',
				description: `The Carrefour Brasil pickup stores (Retire na Loja), filtered by state and city: total (every pickup store), count (the ones that match) and stores (store_id for the Store option, name, street, neighborhood, city, state, CEP). No opening hours here: Get Delivery Options lists the pickup stores near a CEP with their hours. Captured 2026-11-27: SP listed 68 of the 135 stores. ${ONE}`,
				routing: request('/api/v1/carrefourbr/stores', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search carrefour brasil products',
				description: `${SITE} search by keywords or an EAN barcode. ${FILTERS} ${REGION} Returns query, suggestions (the site's related terms) and ${GRID} No results is an empty, charged answer. Captured 2026-11-27: arroz on Mercado at CEP 01310-100 matched 43 items. ${ONE}`,
				routing: request('/api/v1/carrefourbr/search'),
			},
		],
		default: 'search',
	},
];

export const carrefourbrFields: INodeProperties[] = [
	// -- Site (every operation except Get Stores) --
	{
		displayName: 'Site',
		name: 'carrefourbrSite',
		type: 'options',
		default: 'mercado',
		options: [
			{ name: 'Mercado (Grocery)', value: 'mercado' },
			{ name: 'Www (Non-Food and Marketplace)', value: 'www' },
		],
		displayOptions: show(SITE_OPS),
		description: 'Mercado (mercado.carrefour.com.br, the grocery site) or www (www.carrefour.com.br: non-food and the marketplace)',
		routing: { request: { body: { site: '={{ $value === "mercado" ? undefined : $value }}' } } },
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'carrefourbrQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'arroz',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, or an EAN barcode (1 to 120 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'carrefourbrSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('carrefourbrSearch')),
	},

	// -- Get Category Products --
	{
		displayName: 'Path',
		name: 'carrefourbrPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/categoria/mercearia/alimentos-basicos/arroz',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description: 'A category path from Get Categories or a list\'s breadcrumbs, or such a link',
	},
	{
		displayName: 'Additional Options',
		name: 'carrefourbrCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(gridOptions('carrefourbrCategory')),
	},

	// -- Get Collection Products --
	{
		displayName: 'Collection ID',
		name: 'carrefourbrCollectionId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '29861',
		displayOptions: show(['collection']),
		routing: { request: { body: { collection_id: '={{ String($value).trim() }}' } } },
		description: 'A collection ID (the number in a /colecao/ link, collection_id of a coupon or menu entry) or such a link',
	},
	{
		displayName: 'Additional Options',
		name: 'carrefourbrCollectionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['collection']),
		options: sorted(gridOptions('carrefourbrCollection')),
	},

	// -- Get Product --
	{
		displayName: 'Item ID or URL',
		name: 'carrefourbrProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1972',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					item_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The item ID (item_id of a listing, or the number at the end of a /produto/ link), or a product link on either site',
	},
	{
		displayName: 'Additional Options',
		name: 'carrefourbrProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [cepOption('carrefourbrProductCep'), storeOption('carrefourbrProductStore')],
	},

	// -- Get Delivery Options --
	{
		displayName: 'Item ID',
		name: 'carrefourbrDeliveryItem',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1972',
		displayOptions: show(['delivery']),
		routing: { request: { body: { item_id: '={{ String($value).trim() }}' } } },
		description: 'The item ID (item_id of a listing or of Get Product)',
	},
	{
		displayName: 'CEP',
		name: 'carrefourbrDeliveryCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['delivery']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'The delivery CEP (Brazilian postal code, 8 digits)',
	},
	{
		displayName: 'Additional Options',
		name: 'carrefourbrDeliveryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['delivery']),
		options: [
			{
				displayName: 'Seller ID',
				name: 'carrefourbrDeliverySeller',
				type: 'string',
				default: '',
				placeholder: '1',
				description: 'The seller (sellers seller_id of Get Product); empty means 1, Carrefour itself. Marketplace items on www need their seller\'s ID.',
				routing: { request: { body: { seller_id: '={{ String($value).trim() || undefined }}' } } },
			},
		],
	},

	// -- Get Stores --
	{
		displayName: 'Additional Options',
		name: 'carrefourbrStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'City',
				name: 'carrefourbrStoresCity',
				type: 'string',
				default: '',
				placeholder: 'Porto Alegre',
				description: 'Stores in this city',
				routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'carrefourbrStoresState',
				type: 'string',
				default: '',
				placeholder: 'SP',
				description: 'Stores in this state (UF, two letters)',
				routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() || undefined }}' } } },
			},
		],
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'carrefourbrSuggestionsQuery',
		type: 'string',
		default: '',
		placeholder: 'arroz',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		description: 'What a shopper has typed; empty for the top searches alone',
	},
];
