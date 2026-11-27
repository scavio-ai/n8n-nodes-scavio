import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['casasbahia'], operation, ...extra },
});

// Casas Bahia (casasbahia.com.br, with its Extra and Ponto stores), 4 operations, 2 credits each; credits_used is the
// truth. Brazil only, BRL. Calls usually take 10 to 60 s; every operation carries a 180s timeout (the backend answers
// inside 120 s, retries included).
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	'Casas Bahia (casasbahia.com.br, the Brazilian retailer of Grupo Casas Bahia, with its Extra and Ponto stores), Brazil only, Portuguese text, prices in BRL';
const TWO =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 2 credits (credits_used says what was charged).';
const NO_PRICES =
	"List items carry no prices: run Get Product with an item's SKU for its price, Pix price, installments and sellers.";
const GRID =
	'20 items a page: total, total_is_capped (the storefront counts up to 10,000), total_pages, page, page_size, sort, count, items (position, product_id, SKU for Get Product, title, brand, brand_id, rating, review_count, image, URL, path, status, seller_type, category), sponsored_count and sponsored (the sponsored placements, kept apart from items), facets (ID, name, type, values with label, count and filter; send filter back in Filters) and notes.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const siteField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Storefront',
	name,
	type: 'options',
	default: 'casasbahia',
	displayOptions: show(operations),
	options: [
		{ name: 'Casas Bahia', value: 'casasbahia' },
		{ name: 'Extra', value: 'extra' },
		{ name: 'Ponto (Pontofrio)', value: 'pontofrio' },
	],
	description:
		"One catalog on three storefronts; each storefront's own-store price and review counts can differ",
	routing: { request: { body: { site: '={{ $value === "casasbahia" ? undefined : $value }}' } } },
});

/** Sort, filters, own-store, price range and paging shared by Search Products and Get Category Products. */
const gridOptions = (prefix: string): INodeProperties[] =>
	sorted([
		{
			displayName: 'Filters',
			name: `${prefix}Filters`,
			type: 'string',
			default: '',
			placeholder: 'marca-m19, avaliacao-r5',
			description:
				'Up to 10 filter values from a previous answer (facets values filter), comma-separated: brand (marca-m19), rating (avaliacao-r5), discount band (desconto-10to19), seller (lojistas-l15) or features. Values combine.',
			routing: {
				request: {
					body: {
						filters:
							'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length ? a : undefined; })() }}',
					},
				},
			},
		},
		{
			displayName: 'Max Price (BRL)',
			name: `${prefix}MaxPrice`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, numberPrecision: 0 },
			description: 'Maximum price in whole reais; 0 means no limit',
			routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Price (BRL)',
			name: `${prefix}MinPrice`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, numberPrecision: 0 },
			description: 'Minimum price in whole reais; 0 means no limit',
			routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Own Store Only',
			name: `${prefix}OwnStore`,
			type: 'boolean',
			default: false,
			description:
				'Whether to return only items sold and delivered by the storefront itself (Casas Bahia, Extra or Pontofrio), not by marketplace sellers',
			routing: { request: { body: { own_store: '={{ $value ? true : undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Page, 1 to 500 (20 items a page)',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Best Selling', value: 'best_selling' },
				{ name: 'Popularity', value: 'popularity' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Relevance', value: 'relevance' },
			],
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
	]);

export const casasbahiaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['casasbahia'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get casas bahia categories',
				description: `The ${SITE} category menu of one storefront, as its header lists it: group_count, count, groups (name, categories with name, path for Get Category Products, URL, category_id, collection_id, seller_id), featured and menu (the top bar links, a deal collection included). Captured 2026-11-27: Casas Bahia listed 8 groups and 39 categories. ${TWO}`,
				routing: request('/api/v1/casasbahia/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get casas bahia category products',
				description: `One ${SITE} category, a deal collection (a /c?Filtro=D link, such as the coupon and campaign lists) or a seller's list (a /c?filtro=L link), by path or link, with the storefront's 5 sorts and any facet filter: category (path, category_ids, collection_id, collection_name, seller_id) and ${GRID} Collections carry no start or end dates. ${NO_PRICES} An unknown category is a charged not-found. Captured 2026-11-27: Eletroportáteis counted 10,000+ products. ${TWO}`,
				routing: request('/api/v1/casasbahia/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a casas bahia product',
				description: `One product on Casas Bahia, Extra or Ponto by SKU or link, with every seller: SKU, product_id, name, brand, URL, EAN, categories, price (card in one payment), list_price, pix_price and pix_discount_percent (Pix is Brazil's instant payment), discount_percent, payment, installment_plans with every plan, best_installments, store_card, offer_count, offer_price_range, sellers (seller_id, business name, buy_box, price, list_price, is_store, pickup_available), availability flags (no unit counts), highlights, specs, dimensions, images, variants (each its own SKU), reviews (rating, count, recommend_percent, stars, the storefront's own summary as given, the 3 reviews on the page, no reviewer names) and questions (total and the 3 on the page with their answers, no names). An out-of-stock product answers no price or sellers. An unknown SKU can take about 80 s and answers an uncharged error. Captured 2026-11-27: the Smart TV 55" TCL 55P755 rated 4.9 from 759 reviews with 135 questions. ${TWO}`,
				routing: request('/api/v1/casasbahia/product'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search casas bahia products',
				description: `Keyword search of ${SITE}, on Casas Bahia, Extra or Ponto, with the storefront's 5 sorts and any facet filter (brand, price band, discount band, rating, seller, features), own store only and a price range: site, store, query, filters, page_type and ${GRID} ${NO_PRICES} Sponsored placements never mix with items. Captured 2026-11-27: geladeira frost free gave 1170 results plus 8 sponsored placements. ${TWO}`,
				routing: request('/api/v1/casasbahia/search'),
			},
		],
		default: 'search',
	},
];

export const casasbahiaFields: INodeProperties[] = [
	siteField('casasbahiaSite', ['search', 'category', 'product', 'categories']),

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'casasbahiaQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'geladeira frost free',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 120 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'casasbahiaSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('casasbahiaSearch'),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'casasbahiaPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/c/eletroportateis?filtro=categoria-c73',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description:
			'A category path (path from Get Categories), a deal collection (/c?Filtro=D69331) or such a link on one of the three storefronts',
	},
	{
		displayName: 'Additional Options',
		name: 'casasbahiaCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('casasbahiaCategory'),
	},

	// -- Get Product --
	{
		displayName: 'SKU or URL',
		name: 'casasbahiaProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '55066339',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			"A SKU ID (SKU from another answer; the number after /p/ in a product link, e.g. 55066339) or a product link on any of the three storefronts (the link's storefront wins)",
	},
];
