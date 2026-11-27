import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['centauro'], operation, ...extra },
});

// Centauro (centauro.com.br, the sporting-goods retailer of Grupo SBF), 7 operations, 1 credit each; credits_used is
// the truth. Brazil only, BRL. Listings usually take 10 to 45 s and carry a 210s timeout; product, freight, stores and
// suggestions take 2 to 20 s and carry 150s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const LIST_MS = 210000;
const FAST_MS = 150000;

const SITE =
	'Centauro (centauro.com.br, the sporting-goods retailer of Grupo SBF), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const GRID =
	"36 per page, pages 1 to 278, in the site's 4 sorts, filtered by any facet value (brand, size, gender, product type, price band, sport, colour, discount band, promotion, a physical store's range, sold-by): page, page_size, total (the site caps it at 10000: total_capped), total_pages, has_more, count, items (position, product_id for Get Product, model, color_code, name, brand, URL, image, available, price, list_price, discount_percent, pix_price (Pix is Brazil's instant payment), installment, has_different_prices, seller, categories, badges, rating, review_count, color_count, size_count, size_skus for Get Freight and Pickup, variants), facets (name, key, values with filter and count; send back in Filters), breadcrumbs, sort, filters_applied and notes.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as one value or an array, or undefined when empty. */
const LIST =
	'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length === 0 ? undefined : a.length === 1 ? a[0] : a; })() }}';

const listOption = (displayName: string, name: string, key: string, description: string, placeholder: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: LIST } } },
});

/** Sort, facet filters and paging shared by Search Products, Get Category Products and Get Deals. */
const gridOptions = (prefix: string): INodeProperties[] => [
	listOption('Brand', `${prefix}Brand`, 'brand', 'Brand facet value(s), comma-separated (marca), e.g. nike or asics', 'nike'),
	listOption(
		'Filters',
		`${prefix}Filters`,
		'filters',
		'Facet value(s) as key:value (filter from facets values of an answer), comma-separated, up to 10, e.g. marca:nike, genero:masculino. Keys: marca, tamanho, genero, produto, preco, esportes, modalidade, categorias, cor, desconto, idade, linha, promocao, loja, vendidopor.',
		'marca:nike, genero:masculino',
	),
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 278 },
		description: 'Page, 1 to 278 (36 per page; the site caps the total at 10000)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
	listOption(
		'Seller',
		`${prefix}Seller`,
		'seller',
		'Sold-by facet value(s), comma-separated (vendidopor): centauro or a marketplace seller such as nikecombr or adidas',
		'centauro',
	),
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Discount', value: 'discount' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	listOption(
		'Store',
		`${prefix}Store`,
		'store',
		'Store facet value(s), comma-separated (loja): the products a physical store carries (filter from Get Stores, or facets loja values)',
		'curitibaprshoppingbariguiloja0050',
	),
];

const cepField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'CEP',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '01310-100',
	displayOptions: show(operations),
	routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
	description: 'A Brazilian CEP (postal code, 8 digits)',
});

export const centauroOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['centauro'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get centauro category products',
				description: `One ${SITE} category listing by its /nav/ path or link, or one facet value (categorias:calcados), sorted and filtered like Search Products: path, URL, category_filters and ${GRID} An unknown category, or one with no products for the filters, is a charged not-found. Captured 2026-11-27: categorias:calcados sorted by discount reached the 10000 cap, the first a Diadora casual sneaker at 220 BRL (list 1099.99, 82% off). ${ONE}`,
				routing: request('/api/v1/centauro/category', LIST_MS),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get centauro deals',
				description: `A ${SITE} deal list: the Black Friday hotsite (default), the outlet, the Mega Oferta promotion or another hotsite slug, sorted and filtered like Search Products: deal, URL and ${GRID} The site publishes no start or end dates for its deals. An unknown deal list is a charged not-found. Captured 2026-11-27: black-friday held 9257 products over 258 pages. ${ONE}`,
				routing: request('/api/v1/centauro/deals', LIST_MS, true),
			},
			{
				name: 'Get Freight and Pickup',
				value: 'freight',
				action: 'Get centauro freight and pickup',
				description: `Delivery and store pickup for one size of a ${SITE} product, by size SKU and Brazilian CEP: destination, currency, delivery_options (type, label, cost, free, origin, deadline, estimated_date, estimated_text, same_day), store_count, stores_with_stock and stores (store_code, name, distance_km, hours, address with coordinates, pickup_available, in_store_stock, pickup_days, transfer_days, pickup_text, pickup_cost, estimated_date, same_day, filter). Stock flags, not unit counts. An unknown or out-of-stock SKU is a charged not-found. Captured 2026-11-27: size SKU 9976EA510375 to CEP 01310-100 had free same-day store pickup and free normal delivery in 9 to 10 business days, with 18 stores holding the size. ${ONE}`,
				routing: request('/api/v1/centauro/freight', FAST_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a centauro product',
				description: `One ${SITE} product by product ID (model + colour) or link: model, color, name, brand, URL, available, in_stock, low_stock, purchase_limit, group, sub_group, category, gender, age_group, collection, category_path, breadcrumbs, price_min, price_max, has_different_prices, sellers, split_sellers, installments, size_count, sizes_in_stock, sizes (size, SKU for Get Freight and Pickup, EAN, in_stock, price, list_price, discount_percent, pix_price, installment, seller), colors, images, badges, specs, rating, review_count and up to 3 reviews (no reviewer names). Stock is a flag per size, not a unit count. An unknown product is a charged not-found. Captured 2026-11-27: 9976EA51, the Tenis Masculino adidas Super U, from 389.99 to 599.99 BRL by size, 11 of 12 sizes in stock. ${ONE}`,
				routing: request('/api/v1/centauro/product', FAST_MS),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get centauro search suggestions',
				description: `The ${SITE} search suggestions for the start of a search: query, count, suggestions (position, term) and top_searches (the site's most searched terms). Captured 2026-11-27: tenis suggested 5 terms next to 10 top searches. ${ONE}`,
				routing: request('/api/v1/centauro/suggestions', FAST_MS),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get centauro stores',
				description: `The physical ${SITE} stores near a Brazilian CEP, by distance: cep, count and stores (store_code, name, city, state, label, distance_km, latitude, longitude, filter for the Store option of Search Products). Hours, street address and per-store stock flags for one product come from Get Freight and Pickup. Captured 2026-11-27: CEP 20040-002 (Rio de Janeiro) listed 27 stores, the nearest 4.62 km away. ${ONE}`,
				routing: request('/api/v1/centauro/stores', FAST_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search centauro products',
				description: `${SITE} keyword search: query and ${GRID} No results is an empty, charged answer. Captured 2026-11-27: tenis corrida reached the 10000 cap, the first the Tenis Masculino adidas Super U at 389.99 BRL (list 599.99, 35% off), sold by Centauro. ${ONE}`,
				routing: request('/api/v1/centauro/search', LIST_MS),
			},
		],
		default: 'search',
	},
];

export const centauroFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'centauroQuery',
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
		name: 'centauroSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('centauroSearch')),
	},

	// -- Get Category Products --
	{
		displayName: 'Path',
		name: 'centauroPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/nav/categorias/calcados/produto/tenis',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description:
			"A category as its centauro.com.br /nav/ path or link (as the site's breadcrumb links write them), or one facet value such as categorias:calcados",
	},
	{
		displayName: 'Additional Options',
		name: 'centauroCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(gridOptions('centauroCategory')),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'centauroDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Deal',
				name: 'centauroDeal',
				type: 'string',
				default: 'black-friday',
				placeholder: 'black-friday',
				description: 'Black-friday, outlet or mega-oferta, or another /hotsite/ slug or link of the site',
				routing: { request: { body: { deal: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('centauroDeals'),
		]),
	},

	// -- Get Product --
	{
		displayName: 'Product ID or URL',
		name: 'centauroProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9976EA51',
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
			'The Centauro product ID, model + colour (product_id from another answer, e.g. 9976EA51), or a centauro.com.br product link with its ?cor= colour',
	},

	// -- Get Freight and Pickup --
	{
		displayName: 'Size SKU',
		name: 'centauroFreightSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9976EA510375',
		displayOptions: show(['freight']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'A size SKU (sizes SKU from Get Product, or size_skus from a listing)',
	},
	cepField('centauroFreightCep', ['freight']),

	// -- Get Stores --
	cepField('centauroStoresCep', ['stores']),

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'centauroSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tenis',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a search, as a shopper types it (1 to 80 characters)',
	},
];
