import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['natura'], operation, ...extra },
});

// Natura (the Brazilian beauty brand of Natura &Co), 7 operations, 1 credit each; credits_used is the truth. Six
// storefronts through Country (br, ar, cl, co, mx, pe), local currency. Calls usually take 2 to 30 s, up to a minute
// for pages of 100; every operation carries a 180s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	"Natura (the Brazilian beauty brand of Natura &Co) on its own storefronts in Brazil, Argentina, Chile, Colombia, Mexico and Peru, text in the market's language, prices in its currency";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	'Prices are as Natura shows them to a visitor who is not signed in: no consultant prices, no regional prices by CEP / postal code.';
const GRID =
	"country, host, currency, language, page, page_size, total, total_pages, has_more, count, sort, filters_applied, items (position, product_id for Get Product, name, URL, image, price and price_display, price_max, price_range, list_price, discount_percent, rating, currency), facets (attribute, label, values; send back in Filters), sort_options and notes. A card carries no review count, stock flag or promotion text (read the product).";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MARKET_OPS = ['search', 'category', 'categories', 'product', 'suggestions', 'deals'];

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

/** Sort, refinements, price range and paging shared by Search Products, Get Category Products and Get Deals. */
const gridOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '{}',
		description:
			'Refinements as the site names them, up to 5 attributes: attribute -> value or [values], from facets attribute and values of an answer, e.g. {"brand": "Kaiak", "natg_gender": "masculino"}',
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
		displayName: 'Max Price',
		name: `${prefix}MaxPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: "Highest price, whole units of the market's currency; 0 means no limit",
		routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: `${prefix}MinPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: "Lowest price, whole units of the market's currency; 0 means no limit",
		routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	pageOption(`${prefix}Page`, 200),
	pageSizeOption(`${prefix}PageSize`, 100, 24, 'Products'),
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'default',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'Brand (Ar, Mx)', value: 'brand' },
			{ name: "Default (Site's Order)", value: 'default' },
			{ name: 'Discount (Not Mx)', value: 'discount' },
			{ name: 'Most Popular (Ar, Mx)', value: 'most_popular' },
			{ name: 'Name: A to Z', value: 'name_asc' },
			{ name: 'Name: Z to A', value: 'name_desc' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description:
			"The market's own sorts; not every market offers every sort (cl offers best sellers, discount and price only)",
		routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
	},
];

export const naturaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['natura'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get natura categories',
				description: `The ${SITE} category menu: count, node_count and categories (category_id for Get Category Products, name, menu_count, URL, subcategories). menu_count is the menu's own count and can differ from a listing's total. Captured 2026-11-27: Brazil listed 14 top categories and 206 nodes. ${ONE}`,
				routing: request('/api/v1/natura/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get natura category products',
				description: `One ${SITE} category listing by category ID or /c/ link, sorted and filtered like Search Products: category_id, category_name, URL and ${GRID} ${PRICES} An unknown category is a charged not-found; in Argentina the top-level departments have no listing page and answer that not-found too: use a subcategory. Captured 2026-11-27: maquiagem in Brazil held 964 products over 41 pages of 24. ${ONE}`,
				routing: request('/api/v1/natura/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get natura deals',
				description: `The ${SITE} Black Friday campaign listing: the market's campaign category (natura-friday in br, ar, cl, co; promociones in mx and pe), sorted by discount where the market offers that sort, filtered like Search Products: category_id, category_name, URL, campaign_dates (the sentences of the campaign page that state its dates, as written) and ${GRID} ${PRICES} Captured 2026-11-27: natura-friday in Brazil held 4248 products, the first a body lotion refill at 29.90 BRL (list 99.90, 70% off). The page stated the campaign runs 16 to 27 November 2026, with discounts extended to 30 November. ${ONE}`,
				routing: request('/api/v1/natura/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a natura product',
				description: `One ${SITE} product by ID or link: product_id, name, brand, URL, category, in_stock, max_quantity, low_stock and low_stock_badge, price, list_price, discount_percent, discount_amount (each with a display string), price_min and price_max (shade masters), currency, installments, tags, stamps, promotional_tag, is_kit, kit_contents, shade_count, shades (product_id, shade, shade_code, swatch, price, list_price, discount_percent, in_stock, orderable, max_quantity, low_stock), ingredients (as written), images, rating, review_count and latest_reviews (the 3 latest the page carries, no names). ${PRICES} Stock is a flag, not a unit count. An unknown product is a charged not-found. Captured 2026-11-27: NATBRA-194225, the Deo Parfum Ilia Secreto 25 ml, at 66.48 BRL (list 110.80, 40% off), rated 4.7 from 109 reviews. ${ONE}`,
				routing: request('/api/v1/natura/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get natura search suggestions',
				description: `The ${SITE} search suggestions for the start of a search: query, count, did_you_mean, products (product_id, name, image, URL; up to 3), brands, popular_searches and categories. Nothing to suggest is an empty answer. Captured 2026-11-27: kaiak in Brazil suggested 3 products and the brand Kaiak. ${ONE}`,
				routing: request('/api/v1/natura/suggestions'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get natura stores',
				description: `The physical Natura stores in Brazil (the natura.com.br store list), filtered by state, city, CEP prefix and store type: total_listed, total, total_pages, has_more, count, filters_applied and stores (store_code, name, type: own, franchise, athena or kiosk, address, neighborhood, city, state, CEP, phone, the store's @natura.net email or null, delivery). No coordinates, no opening hours, no store stock. Captured 2026-11-27: the list held 1,093 stores, 102 of them in the city of Sao Paulo. ${ONE}`,
				routing: request('/api/v1/natura/stores', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search natura products',
				description: `${SITE} keyword search, sorted by the market's own sorts and filtered by the site's refinements (brand, product type, gender, fragrance family, skin type) and a price range: query, ${GRID} ${PRICES} No results is an empty answer. Captured 2026-11-27: perfume in Brazil gave 522 results, the first the Deo Parfum Ilia Flor de Laranjeira 50 ml at 99.95 BRL (list 199.90, 50% off). ${ONE}`,
				routing: request('/api/v1/natura/search'),
			},
		],
		default: 'search',
	},
];

export const naturaFields: INodeProperties[] = [
	{
		displayName: 'Country',
		name: 'naturaCountry',
		type: 'options',
		default: 'br',
		options: [
			{ name: 'Argentina (ARS)', value: 'ar' },
			{ name: 'Brazil (BRL)', value: 'br' },
			{ name: 'Chile (CLP)', value: 'cl' },
			{ name: 'Colombia (COP)', value: 'co' },
			{ name: 'Mexico (MXN)', value: 'mx' },
			{ name: 'Peru (PEN)', value: 'pe' },
		],
		displayOptions: show(MARKET_OPS),
		description: "The storefront. Data comes in the market's language and currency; a product link sets the market itself.",
		routing: { request: { body: { country: '={{ $value === "br" ? undefined : $value }}' } } },
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'naturaQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'perfume',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "Search keywords in the market's language (1 to 100 characters)",
	},
	{
		displayName: 'Additional Options',
		name: 'naturaSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('naturaSearch')),
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'naturaCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'maquiagem',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description: "A category ID (category_id from Get Categories, e.g. maquiagem, perfumaria, refis) or the market's /c/ link",
	},
	{
		displayName: 'Additional Options',
		name: 'naturaCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(gridOptions('naturaCategory')),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'naturaDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Campaign Category ID',
				name: 'naturaDealsCategory',
				type: 'string',
				default: '',
				placeholder: 'natura-friday',
				description:
					"Another campaign category instead of the market's Black Friday category (natura-friday in br, ar, cl, co; promociones in mx and pe)",
				routing: { request: { body: { category_id: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('naturaDeals'),
		]),
	},

	// -- Get Product --
	{
		displayName: 'Product ID or URL',
		name: 'naturaProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'NATBRA-194225',
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
			"A product ID (product_id from another answer, e.g. NATBRA-194225; the bare number takes the market's prefix) or a Natura product link",
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'naturaSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'kaiak',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a search (1 to 100 characters)',
	},

	// -- Get Stores --
	{
		displayName: 'Additional Options',
		name: 'naturaStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			{
				displayName: 'CEP',
				name: 'naturaStoresCep',
				type: 'string',
				default: '',
				placeholder: '01310',
				description: 'A CEP (Brazilian postal code) or its leading digits',
				routing: { request: { body: { cep: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'City',
				name: 'naturaStoresCity',
				type: 'string',
				default: '',
				placeholder: 'Sao Paulo',
				description: 'A city, accents and case ignored',
				routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
			},
			pageOption('naturaStoresPage', 1000),
			pageSizeOption('naturaStoresPageSize', 200, 50, 'Stores'),
			{
				displayName: 'State',
				name: 'naturaStoresState',
				type: 'string',
				default: '',
				placeholder: 'sp',
				description: 'A Brazilian state code (UF, 2 letters), e.g. sp, rj or mg',
				routing: { request: { body: { state: '={{ String($value).trim().toLowerCase() || undefined }}' } } },
			},
			{
				displayName: 'Store Type',
				name: 'naturaStoresType',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Athena', value: 'athena' },
					{ name: 'Franchise (Franquia)', value: 'franchise' },
					{ name: 'Kiosk (Quiosque)', value: 'kiosk' },
					{ name: 'Own (Aurora)', value: 'own' },
				],
				description: 'The store type as the site labels it',
				routing: { request: { body: { type: '={{ $value === "all" ? undefined : $value }}' } } },
			},
		]),
	},
];
