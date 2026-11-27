import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['riachuelo'], operation, ...extra },
});

// Riachuelo (riachuelo.com.br, the Brazilian fashion retailer), 4 operations, 1 credit each; credits_used is the
// truth. Brazil only, BRL. Keyword searches take 5 to 90 s and carry a 300s timeout; category, campaign and product
// pages take 3 to 35 s and carry 180s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;
const PAGE_MS = 180000;

const SITE =
	'Riachuelo (riachuelo.com.br, the Brazilian fashion retailer), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID =
	"24 per page, pages 1 to 500, in the site's sorts, filtered by the listing's own filters in Filters (JSON). Returns page, page_size, total (sold-out products included), total_pages, has_more, count, items (sku for Get Product, name, brand, URL, image, price, list_price, discount_percent, on_sale, price_varies, promo_tag with the coupon or campaign banner the listing shows and its campaign path for Get Deals, seller, colors, categories, sold_out, sizes_in_stock, variations with color, size, sku, the site's sold-out flag and the units it lists per size), filters (ID, label, multi_select, options with label, value and count), price_range, sort, filters_applied and notes.";

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
			'Filter ID -> value or list of values, from a listing\'s filters ID (filter_size, filter_color, gender, catalog_class, brand, gg) and options value, up to 10 values, e.g. {"filter_size": ["P", "M"]}. Several values of one filter match any of them; several filters must all match. A price range is not taken.',
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
		typeOptions: { minValue: 1, maxValue: 500 },
		description: 'Results page, 1 to 500, 24 products each',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		description: "The site's sorts",
		options: [
			{ name: 'Best Selling', value: 'best_selling' },
			{ name: 'Discount', value: 'discount' },
			{ name: 'Newest', value: 'newest' },
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

export const riachueloOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['riachuelo'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get riachuelo category products',
				description: `One category listing of ${SITE}, by category path or link, sorted and filtered like search. ${GRID} Also category, title and breadcrumbs. An unknown category is a charged not-found. Captured 2026-11-27: feminino held 9006 products. ${ONE}`,
				routing: request('/api/v1/riachuelo/category', PAGE_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get riachuelo campaign deals',
				description: `A campaign page of ${SITE}: by default the Black Friday page of a department, or another campaign page by path (promo_tag campaign of a listing item), sorted and filtered like search. Campaign pages are seasonal and carry no start or end dates; an unknown or ended campaign is a charged not-found. ${GRID} Also campaign, department, title and breadcrumbs. Captured 2026-11-27 (Black Friday week): the masculino Black Friday page held 627 products. ${ONE}`,
				routing: request('/api/v1/riachuelo/deals', PAGE_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a riachuelo product',
				description: `One product of ${SITE} by link or SKU: sku, sku_group, name, brand, color, URL, price, list_price, on_sale, discount_percent, sold_out (the site's flag for the whole product), availability, gender, department, subcategory, collection, composition, breadcrumbs, attributes, images, rating (average, count, histogram) and reviews (rating, title, text, size, color, date, sku: the reviews the product page itself shows, without reviewer names), reviews_has_more and notes. The product page lists no stock per size: listing items carry the per-size sold-out flag and units. Not available: more review pages, shipping quotes by CEP, store stock, search suggestions, price history. An unknown product is a charged not-found. Captured 2026-11-27: a pair of wide-leg trousers at 79.99 BRL (list 159.99), rated 5 from 11 ratings. ${ONE}`,
				routing: request('/api/v1/riachuelo/product', PAGE_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search riachuelo products',
				description: `Search ${SITE} by keyword, across the whole site. ${GRID} Also query. No results is an empty answer (charged). Search suggestions are not offered. Keyword searches are slow at the source (5 to 90 seconds). Captured 2026-11-27: vestido matched 1204 products, the first a midi dress at 179.99 BRL (list 199.99) with 5 sizes in stock. ${ONE}`,
				routing: request('/api/v1/riachuelo/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const riachueloFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'riachueloQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vestido',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as a shopper types them (1 to 120 characters)',
	},
	listingOptions('riachueloSearchOptions', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'riachueloCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feminino/colecao-feminino/vestido',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A category path as the site writes it (breadcrumbs path or categories of a listing item), e.g. feminino, masculino, infantil or feminino/colecao-feminino/vestido, or a riachuelo.com.br link to one',
	},
	listingOptions('riachueloCategoryOptions', 'category'),

	// -- Get Deals --
	{
		displayName: 'Campaign Page',
		name: 'riachueloDealsPage',
		type: 'options',
		default: 'feminino',
		options: [
			{ name: 'Another Campaign', value: 'campaign' },
			{ name: 'Black Friday: Feminino', value: 'feminino' },
			{ name: 'Black Friday: Infantil', value: 'infantil' },
			{ name: 'Black Friday: Masculino', value: 'masculino' },
		],
		displayOptions: show(['deals']),
		routing: {
			request: {
				body: {
					department: '={{ $value === "campaign" || $value === "feminino" ? undefined : $value }}',
				},
			},
		},
		description: "A department's Black Friday page (seasonal), or another campaign page by path",
	},
	{
		displayName: 'Campaign',
		name: 'riachueloCampaign',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'campanha/r/promo/oferta-especial',
		displayOptions: show(['deals'], { riachueloDealsPage: ['campaign'] }),
		routing: { request: { body: { campaign: '={{ String($value).trim() }}' } } },
		description:
			'A campaign page by its path (campanha/..., as the promo_tag campaign of a listing item returns it) or a riachuelo.com.br link to one',
	},
	listingOptions('riachueloDealsOptions', 'deals'),

	// -- Get Product --
	{
		displayName: 'Look Up By',
		name: 'riachueloProductBy',
		type: 'options',
		default: 'sku',
		options: [
			{ name: 'SKU', value: 'sku' },
			{ name: 'URL', value: 'url' },
		],
		displayOptions: show(['product']),
	},
	{
		displayName: 'Product',
		name: 'riachueloProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '16519710',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: '={{ $parameter["riachueloProductBy"] === "sku" ? String($value).trim() : undefined }}',
					url: '={{ $parameter["riachueloProductBy"] === "url" ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'The product SKU (sku of a listing item: digits, or KIT followed by digits for a kit) or a riachuelo.com.br product link (URL of a listing item), as chosen in Look Up By',
	},
];
