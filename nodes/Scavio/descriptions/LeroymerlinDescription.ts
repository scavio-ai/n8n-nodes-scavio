import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['leroymerlin'], operation, ...extra },
});

// Leroy Merlin (the home improvement retailer of the ADEO group), 13 operations: Brazil with regional prices and Italy,
// Spain, Portugal, Poland, Romania and France. Billed on what each request spent in its market (br 1, it 1-2, ro 1,
// es / pt / pl 2, fr 5); credits_used is the truth. Brazil search and category can take up to 240 s, so every
// operation carries a 270s timeout.
const request = (url: string, body?: Record<string, string>) => ({
	request: { method: 'POST' as const, url, timeout: 270000, ...(body ? { body } : {}) },
});

const SITE = 'Leroy Merlin (the home improvement retailer of the ADEO group)';
const BILL =
	'Billed on what the request spent in its market (credits_used says what was charged): Brazil 1; Italy 1 (product and category pages 2); Romania 1; Spain, Portugal and Poland 2; France 5. Refused inputs and upstream failures are not charged; a not-found is charged.';
const BR_ONE =
	'Brazil only. Refused inputs and upstream failures are not charged. Costs 1 credit (credits_used says what was charged).';
const EU_LIST =
	"page, page_size (48), total, total_pages, products (ID for Get Product, name, brand, URL, image, price, price_excluding_vat, original_price, discount_percent, currency, unit_price and price_validity as given, promotion, rating, review_count, seller, offer_count, sponsored, delivery), other_products (Leroy Merlin's page carries full details for the first products of each page only: 18 of 48 in most markets, all 48 in Romania; the others come as IDs for Get Product), sorts, applied_filters and filters_available (send back in Filters)";
const BR_LIST =
	"region, sort, page, page_size (36), total, total_pages and products (ID, name, brand, URL, image, unit, price, original_price, discount_type, payment_discount, promotion_start, promotion_end, offer, black_friday, free_shipping, express_shipping, in_stock, sellers, EANs); every price is the region's";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MULTI_MARKET = ['search', 'category', 'product', 'stores', 'store', 'reviews'];

const regionField = (name: string, operations: string[], extra: Record<string, string[]> = {}): INodeProperties => ({
	displayName: 'Region',
	name,
	type: 'string',
	required: true,
	default: 'grande_sao_paulo',
	placeholder: 'grande_sao_paulo',
	displayOptions: show(operations, extra),
	routing: { request: { body: { region: '={{ String($value).trim() || undefined }}' } } },
	description:
		'The Brazil price region (Leroy Merlin Brasil prices per region), e.g. grande_sao_paulo or rio_de_janeiro. Get Regions lists the 28.',
});

const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '92450351',
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description: "The product reference number (ID from another answer) or a product link on the market's site. France needs the link.",
});

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

/** Page, sort and filters shared by Search, Get Category Products and Get Offers. */
const listOptions = (prefix: string): INodeProperties[] =>
	sorted([
		{
			displayName: 'Filters (JSON)',
			name: `${prefix}Filters`,
			type: 'json',
			default: '{}',
			description:
				'Europe only: {code: value or [values]} from an earlier answer\'s filters_available, e.g. {"attribute-06575": "BOSCH"}',
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
			description: 'Page, 1-based. Search reaches up to 10 pages in Europe (48 a page) and 28 in Brazil (36 a page).',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Relevance', value: 'relevance' },
			],
			description: "Brazil: category only (keyword search keeps the site's order)",
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
	]);

export const leroymerlinOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['leroymerlin'] } },
		options: [
			{
				name: 'Get Address for CEP',
				value: 'cep',
				action: 'Get a leroymerlin address for a CEP',
				description: `The address Leroy Merlin Brasil holds for a CEP (postal code): street, district, city, state and IBGE code. Captured 2026-11-27: 01310-100 is Avenida Paulista, São Paulo. ${BR_ONE}`,
				routing: request('/api/v1/leroymerlin/cep'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get leroymerlin categories',
				description: `Leroy Merlin Brasil's department tree, or one category's subtree: root, depth, count and categories (name, URL, category for Get Category Products, child_count, children). Captured 2026-11-27: 26 departments. ${BR_ONE}`,
				routing: request('/api/v1/leroymerlin/categories', {}),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get leroymerlin category products',
				description: `One ${SITE} category's products by slug, path or link, sorted and paged, in any of the seven markets: category, URL and, in Brazil, ${BR_LIST}; in Europe, ${EU_LIST} and subcategories (a landing page without a product list answers its subcategories). A wrong path is a charged not-found. Captured 2026-11-27: an Italian impact drivers category held 358 products, full details for 10 of the first 48. ${BILL}`,
				routing: request('/api/v1/leroymerlin/category'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get leroymerlin offers',
				description: `Leroy Merlin Italia's offers page (offerte) as a product list, sorted, filtered and paged: ${EU_LIST}. Captured 2026-11-27: 923 products over 20 pages. Refused inputs and upstream failures are not charged. Costs 1 credit (credits_used says what was charged).`,
				routing: request('/api/v1/leroymerlin/offers', { country: 'it' }),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a leroymerlin product',
				description: `One ${SITE} product by reference number or link. Brazil (Region required): price, original price, unit, package, discount, installments, tag, availability, seller, pickup, specifications, store stock per store of the region (units, aisle, pickup) and marketplace offers. Europe: GTIN, price, price excluding VAT, original price, unit price and promotion dates as given, availability, rating, seller, deliveries, marketplace offers, breadcrumbs, images and specifications. An unknown product is a charged not-found. Captured 2026-11-27: a Wap cordless drill at 129.90 BRL in grande_sao_paulo, in stock at 12 of 16 stores. ${BILL}`,
				routing: request('/api/v1/leroymerlin/product'),
			},
			{
				name: 'Get Regions',
				value: 'regions',
				action: 'Get leroymerlin regions',
				description: `Leroy Merlin Brasil's 28 price regions: region, name and state. Each is the Region input of every priced Brazil operation. ${BR_ONE}`,
				routing: request('/api/v1/leroymerlin/regions', {}),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get leroymerlin reviews',
				description: `One page of a ${SITE} product's reviews and its rating summary. Brazil: 6 a page, most helpful first. Italy, Portugal, Poland and Romania: 8 a page, 4 sorts and a star filter, with translated text, verified purchase, badge and source site (not available for Spain and France). Reviewer names are never returned. Captured 2026-11-27: an Italian product averaged 4.6 from 295 reviews. ${BILL}`,
				routing: request('/api/v1/leroymerlin/reviews'),
			},
			{
				name: 'Get Shipping Quote',
				value: 'shipping',
				action: 'Get a leroymerlin shipping quote',
				description: `A delivery quote for one Leroy Merlin Brasil product to a CEP (postal code) in a price region: the address, standard, scheduled and express (cost, deadline_days) and pickup_in_store (cost, ready_in_hours, store_id). Captured 2026-11-27: standard 9.90 BRL in 1 day, express 39.90 BRL the same day, free pickup in 2 hours. ${BR_ONE}`,
				routing: request('/api/v1/leroymerlin/shipping'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a leroymerlin store',
				description: `One ${SITE} store. Brazil by store ID: name, hours, address, state, CEP and coordinates. Europe by store page link: name, address, phone, coordinates, hours and special hours. An unknown store is a charged not-found. Captured 2026-11-27: the Italian store Rozzano (MI). ${BILL}`,
				routing: request('/api/v1/leroymerlin/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get leroymerlin store stock',
				description: `Units in store as Leroy Merlin Brasil reports them, for every store of a price region (or one store): unit, count, in_stock_count, total_units and stores (store_id, name, units, in_stock, message, aisle, pickup_in_store, address, pickup_hours). Prices are set per region, not per store. Captured 2026-11-27: a product in rio_de_janeiro held 469 units across 4 stores. ${BR_ONE}`,
				routing: request('/api/v1/leroymerlin/store-stock', { country: 'br' }),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get leroymerlin stores',
				description: `${SITE} stores. Brazil: the store list, optionally the stores of a region's state or a state, or sorted by distance from a point. Italy, Portugal, Poland, Romania and France (not Spain): the stores nearest a place (city or postcode) or a point, up to 10, with distance, opening text and the store page URL for Get Store. Captured 2026-11-27: Milano listed 10 Italian stores, the nearest at 9.4 km. ${BILL}`,
				routing: request('/api/v1/leroymerlin/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get leroymerlin suggestions',
				description: `Search suggestions as ${SITE}'s search box gives them, in Italy, Spain, Portugal and Poland: query, count and suggestions (type, type_label, label, URL). Captured 2026-11-27: trapano in Italy gave 14 suggestions. ${BILL}`,
				routing: request('/api/v1/leroymerlin/suggestions'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search leroymerlin',
				description: `${SITE} keyword search in Brazil (Region required, priced for the region, with promotion dates and Black Friday flags) and Italy, Spain, Portugal, Poland and Romania (sorted, filtered, paged); not available for France: query, redirected_to (Europe sends some queries to a category or product page) and, in Brazil, ${BR_LIST}; in Europe, ${EU_LIST}. Captured 2026-11-27: furadeira in grande_sao_paulo gave 401 results. ${BILL}`,
				routing: request('/api/v1/leroymerlin/search'),
			},
		],
		default: 'search',
	},
];

export const leroymerlinFields: INodeProperties[] = [
	{
		displayName: 'Country',
		name: 'leroymerlinCountry',
		type: 'options',
		default: 'br',
		options: [
			{ name: 'Brazil (BRL)', value: 'br' },
			{ name: 'France (EUR)', value: 'fr' },
			{ name: 'Italy (EUR)', value: 'it' },
			{ name: 'Poland (PLN)', value: 'pl' },
			{ name: 'Portugal (EUR)', value: 'pt' },
			{ name: 'Romania (RON)', value: 'ro' },
			{ name: 'Spain (EUR)', value: 'es' },
		],
		displayOptions: show(MULTI_MARKET),
		description: "The market. Data comes in the market's language and currency.",
		routing: { request: { body: { country: '={{ $value }}' } } },
	},
	{
		displayName: 'Country',
		name: 'leroymerlinSuggestionsCountry',
		type: 'options',
		default: 'it',
		options: [
			{ name: 'Italy', value: 'it' },
			{ name: 'Poland', value: 'pl' },
			{ name: 'Portugal', value: 'pt' },
			{ name: 'Spain', value: 'es' },
		],
		displayOptions: show(['suggestions']),
		routing: { request: { body: { country: '={{ $value }}' } } },
	},

	// -- Search --
	{
		displayName: 'Query',
		name: 'leroymerlinQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'furadeira',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "Keywords or a reference number, in the market's language (2 to 120 characters)",
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'leroymerlinCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'furadeiras',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'Brazil: a category slug or link (Get Categories lists them). Europe: a category path or link, e.g. /prodotti/utensileria/elettroutensili/trapani-e-avvitatori/.',
	},

	// -- Region: required for Brazil prices --
	regionField('leroymerlinRegion', ['search', 'category', 'product'], { leroymerlinCountry: ['br'] }),
	regionField('leroymerlinBrRegion', ['storeStock', 'shipping']),

	{
		displayName: 'Additional Options',
		name: 'leroymerlinSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listOptions('leroymerlinSearch'),
	},
	{
		displayName: 'Additional Options',
		name: 'leroymerlinCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listOptions('leroymerlinCategory'),
	},
	{
		displayName: 'Additional Options',
		name: 'leroymerlinOffersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['offers']),
		options: listOptions('leroymerlinOffers'),
	},

	// -- Get Product, Get Store Stock, Get Reviews, Get Shipping Quote --
	productField('leroymerlinProduct', ['product', 'storeStock', 'reviews', 'shipping']),
	{
		displayName: 'Store ID',
		name: 'leroymerlinStockStore',
		type: 'string',
		default: '',
		placeholder: 'raposo_tav',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { store: '={{ String($value).trim() || undefined }}' } } },
		description: 'Optional: one store of the region (store_id from Get Stores). Leave empty for every store of the region.',
	},
	cepField('leroymerlinCep', ['shipping', 'cep']),

	// -- Get Stores --
	{
		displayName: 'Additional Options',
		name: 'leroymerlinStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: sorted([
			{
				displayName: 'Latitude',
				name: 'leroymerlinStoresLatitude',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
				description: 'Latitude of a point (with Longitude); 0 means not set',
				routing: { request: { body: { latitude: '={{ $value !== 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Longitude',
				name: 'leroymerlinStoresLongitude',
				type: 'number',
				default: 0,
				typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
				description: 'Longitude of a point (with Latitude); 0 means not set',
				routing: { request: { body: { longitude: '={{ $value !== 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Place',
				name: 'leroymerlinStoresPlace',
				type: 'string',
				default: '',
				placeholder: 'Milano',
				description: 'Europe: a city or postcode (the nearest stores to the first place the site matches)',
				routing: { request: { body: { place: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Region',
				name: 'leroymerlinStoresRegion',
				type: 'string',
				default: '',
				placeholder: 'grande_sao_paulo',
				description: 'Brazil only: the stores in the state of this price region',
				routing: { request: { body: { region: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'leroymerlinStoresState',
				type: 'string',
				default: '',
				placeholder: 'SP',
				description: 'Brazil only: a state code (SP, RJ, RS)',
				routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() || undefined }}' } } },
			},
		]),
	},

	// -- Get Store --
	{
		displayName: 'Store ID or URL',
		name: 'leroymerlinStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'raposo_tav',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					store: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'Brazil: the store ID (store_id from Get Stores). Europe: the store page link (URL from Get Stores).',
	},

	// -- Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'leroymerlinReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'leroymerlinReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'leroymerlinReviewsRating',
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
				description: 'Europe only: only reviews with this many stars',
				routing: { request: { body: { rating: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'leroymerlinReviewsSort',
				type: 'options',
				default: 'site',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful (Brazil)', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: "Site's Order", value: 'site' },
				],
				description: 'Europe: newest, oldest, highest or lowest rating. Brazil: most helpful only (its default).',
				routing: { request: { body: { sort: '={{ $value === "site" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Categories --
	{
		displayName: 'Additional Options',
		name: 'leroymerlinCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: sorted([
			{
				displayName: 'Category',
				name: 'leroymerlinCategoriesRoot',
				type: 'string',
				default: '',
				description: 'A category slug or link for its subtree. Leave empty for every department.',
				routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Depth',
				name: 'leroymerlinCategoriesDepth',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 1, maxValue: 4 },
				description: 'Levels returned, 1 to 4',
				routing: { request: { body: { depth: '={{ $value === 2 ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'leroymerlinSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'trapano',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What has been typed so far',
	},
];
