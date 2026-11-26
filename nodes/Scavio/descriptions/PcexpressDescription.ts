import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['pcexpress'], operation, ...extra },
});

// PC Express (Loblaw's online grocery for ten banners), 7 operations. Credits: Search Products,
// Get Category Products, Get Collection, Find Stores and Get Search Suggestions 1; Get Product 5
// (1 when it answers from the search listing); Get Store 5; credits_used is the truth. Canada
// only, CAD. Banner on every operation (default Real Canadian Superstore); language English, or
// French on Provigo and Maxi. Prices are each banner's default store's (no store choice). Product,
// store, stores and suggestions can take up to 2 minutes, so every operation carries a 240s
// timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

// Comma-separated text -> string array, blanks dropped; empty -> not sent.
const splitList =
	'={{ String($value).trim() ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}';
const trimmed = '={{ String($value).trim() || undefined }}';
const isUrl = '/^https?:/i.test(String($value).trim())';

const FIRST =
	"PC Express (Loblaw's online grocery for Real Canadian Superstore, No Frills, Loblaws, Zehrs, Fortinos, Valu-mart, Your Independent Grocer, Wholesale Club, Provigo and Maxi; Loblaw operates 2,504 stores per its 2025 annual report)";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const STORE =
	"Prices are for the banner's default online store; choosing a store is not offered. The store field (store_id, banner, requested false) says which store priced the answer. The same product code is priced per banner: captured 2026-11-26, No Name Large Size Eggs 12 Pack (20812144001_EA) was 3.93 CAD at Real Canadian Superstore's default store 1033 and 4.17 at Maxi's default store 8976.";
const DEAL =
	'Deals carry the end date as shown (expiry_date), no start date; pc_optimum_points is the PC Optimum offer as shown; member_only_price is the price the site shows publicly on the item, not a price behind a login.';
const TILE =
	'products with code, name, brand, size, unit_price, price, was_price, member_only_price, deal, pc_optimum_points, badges, stock_status, rating and review_count, plus total, total_pages, has_more, the store and facets (Include Facets)';
const NOT_AVAILABLE =
	'Not available: choosing a store, review text (rating and count only), the printed flyer, Shoppers Drug Mart, Atlantic Superstore, City Market and T&T, cart or checkout, PC Optimum prices behind a login, price history (poll and store the answers). For national brands at Walmart.ca use the Walmart resource with the Walmart.ca (Canada) domain.';
const SLOWER = 'Answers can take up to 2 minutes.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const languageOption = (name: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: '',
	options: [
		{ name: "Banner's Default", value: '' },
		{ name: 'English', value: 'en' },
		{ name: 'French (Provigo and Maxi)', value: 'fr' },
	],
	description:
		'English, or French on Provigo (French only) and Maxi (French by default, English too). Other banners serve English only: French there is refused.',
	routing: { request: { body: { language: '={{ $value || undefined }}' } } },
});

const listOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		description: 'Page, 1-based (48 products a page)',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Name: A to Z', value: 'name_a_to_z' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_high_to_low' },
			{ name: 'Price: Low to High', value: 'price_low_to_high' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: 'Result order',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Brand Codes',
		name: `${prefix}Brand`,
		type: 'string',
		default: '',
		placeholder: 'N, P',
		description:
			"Brand codes from facets (productBrand), comma-separated: e.g. N No Name, P President's Choice, PO PC Organics, PCB PC Blue Menu",
		routing: { request: { body: { brand: splitList } } },
	},
	{
		displayName: 'Deals',
		name: `${prefix}Deals`,
		type: 'multiOptions',
		default: [],
		options: [
			{ name: '$1-$5', value: 'dollar_deals' },
			{ name: 'Member-Only Price', value: 'member_only_price' },
			{ name: 'Multi-Buy', value: 'multi_buy' },
			{ name: 'PC Optimum Points', value: 'pc_points' },
			{ name: 'Price Reduction', value: 'price_reduction' },
		],
		description: 'Only products with these deal types',
		routing: { request: { body: { deals: '={{ $value.length ? $value : undefined }}' } } },
	},
	{
		displayName: 'Price Ranges',
		name: `${prefix}PriceRange`,
		type: 'string',
		default: '',
		placeholder: '$5-$10',
		description: 'Price bands from facets, comma-separated',
		routing: { request: { body: { price_range: splitList } } },
	},
	{
		displayName: 'Prepared in Canada Only',
		name: `${prefix}PreparedInCanada`,
		type: 'boolean',
		default: false,
		description: 'Whether to return only products marked Prepared in Canada',
		routing: { request: { body: { prepared_in_canada: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Dietary Codes',
		name: `${prefix}Dietary`,
		type: 'string',
		default: '',
		placeholder: 'gluten_free, organic',
		description: 'Dietary codes from facets, comma-separated (e.g. gluten_free, organic, vegan, lactose_free)',
		routing: { request: { body: { dietary: splitList } } },
	},
	{
		displayName: 'Aisle IDs',
		name: `${prefix}Aisle`,
		type: 'string',
		default: '',
		description: 'Aisle (category) IDs from facets, comma-separated',
		routing: { request: { body: { aisle: splitList } } },
	},
	{
		displayName: 'Include Facets',
		name: `${prefix}IncludeFacets`,
		type: 'boolean',
		default: false,
		description: 'Whether to also return the facets (filter values with counts) and sorts for these results',
		routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
	},
	languageOption(`${prefix}Language`),
];

export const pcexpressOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pcexpress'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find pc express stores',
				description: `The pickup stores one banner of ${FIRST} lists, filtered by city, postal code start or province, or nearest a latitude and longitude: store_id, name, banner, address, city, province, postal_code, phone, coordinates, today's hours, shoppable, departments and distance_km. Store IDs do not change prices (priced operations use the banner's default store). Captured 2026-11-26: Real Canadian Superstore in Winnipeg, 8 of 120 stores. ${SLOWER} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/pcexpress/stores', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get pc express category products',
				description: `Browse one category of ${FIRST} by category ID or link, with paging, sorts and filters: the category (category_id, name, type, breadcrumbs, children) and ${TILE}. A department page lists its products in carousels (sections) and its sub-categories. ${STORE} ${DEAL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/pcexpress/category'),
			},
			{
				name: 'Get Collection',
				value: 'collection',
				action: 'Get a pc express collection',
				description: `One collection page of ${FIRST} (deals-centre, black-friday, no-name, pc-value, new-arrivals ...): ${TILE}, in sections. Captured 2026-11-26: deals-centre on No Frills listed 329 products. ${STORE} ${DEAL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/pcexpress/collection'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a pc express product',
				description: `One product of ${FIRST} by code or link: GTIN, name, brand, description, size, price, was_price, member_only_price, comparison_prices, unit_price, deal, promotions, deposit, stock_status as given, ingredients, nutrition, images and the store. When the product page does not answer, the item comes from the search listing (source search: price, deal, unit price, badges; no GTIN, ingredients or nutrition) at 1 credit. ${STORE} ${DEAL} An unknown code is a charged not-found. ${SLOWER} ${CHARGE} Costs 5 credits; 1 from the search listing.`,
				routing: request('/api/v1/pcexpress/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get pc express search suggestions',
				description: `The search terms ${FIRST} suggests for what a shopper has typed, in its order. ${SLOWER} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/pcexpress/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a pc express store',
				description: `One store of ${FIRST} by store ID: address, phones, 7 dated days of store, pharmacy, clinic, optical and holiday hours, and services. Owner and manager names are left out. An unknown store is a charged not-found. ${SLOWER} ${CHARGE} Costs 5 credits.`,
				routing: request('/api/v1/pcexpress/store'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search pc express products',
				description: `Search the products of ${FIRST} on one banner by keywords or an article number, with paging (48 a page), five sorts and the site's filters: query, redirected_to (when PC Express sends the term to a collection or category) and ${TILE}. ${STORE} ${DEAL} ${NOT_AVAILABLE} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/pcexpress/search'),
			},
		],
		default: 'search',
	},
];

export const pcexpressFields: INodeProperties[] = [
	// -- Every operation --
	{
		displayName: 'Banner',
		name: 'pcexpressBanner',
		type: 'options',
		default: 'superstore',
		options: [
			{ name: 'Fortinos', value: 'fortinos' },
			{ name: 'Loblaws', value: 'loblaw' },
			{ name: 'Maxi', value: 'maxi' },
			{ name: 'No Frills', value: 'nofrills' },
			{ name: 'Provigo', value: 'provigo' },
			{ name: 'Real Canadian Superstore', value: 'superstore' },
			{ name: 'Real Canadian Wholesale Club', value: 'wholesaleclub' },
			{ name: 'Valu-Mart', value: 'valumart' },
			{ name: 'Your Independent Grocer', value: 'independent' },
			{ name: 'Zehrs', value: 'zehrs' },
		],
		displayOptions: { show: { resource: ['pcexpress'] } },
		routing: { request: { body: { banner: '={{ $value === "superstore" ? undefined : $value }}' } } },
		description: 'The Loblaw banner to read. The same product codes on every banner; prices differ by banner.',
	},

	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'pcexpressQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'eggs',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords or an article number to search for',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID or URL',
		name: 'pcexpressCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '28224',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			"A category ID (e.g. 28224 Milk & Cream, from category.children, breadcrumbs or a link's /c/ID) or a category link",
	},

	// -- Get Collection --
	{
		displayName: 'Collection',
		name: 'pcexpressCollection',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'deals-centre',
		displayOptions: show(['collection']),
		routing: { request: { body: { collection: '={{ String($value).trim() }}' } } },
		description:
			"A collection name from the site's links (deals-centre, black-friday, no-name, pc-value, new-arrivals ...) or a collection link",
	},

	// -- Get Product --
	{
		displayName: 'Product Code or URL',
		name: 'pcexpressProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '20812144001_EA',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					code: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
					url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A product code (code from Search Products: article number and unit) or a product link on any of the ten banner sites (its site sets the banner)',
	},

	// -- Get Store --
	{
		displayName: 'Store ID',
		name: 'pcexpressStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1517',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'A store ID from Find Stores (leading zeros count, e.g. 0559)',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Typed Text',
		name: 'pcexpressSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'egg',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper has typed',
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'pcexpressStoresBy',
		type: 'options',
		default: 'filters',
		options: [
			{ name: 'City, Postal Code or Province', value: 'filters' },
			{ name: 'Coordinates (Nearest First)', value: 'coordinates' },
		],
		displayOptions: show(['stores']),
		description:
			"Stores nearest a latitude and longitude, or filtered by city, postal code start and province (no filter: every store of the banner)",
	},
	{
		displayName: 'Latitude',
		name: 'pcexpressStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { pcexpressStoresBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'pcexpressStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { pcexpressStoresBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'pcexpressSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(listOptions('pcexpressSearch')),
	},
	{
		displayName: 'Additional Options',
		name: 'pcexpressCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(listOptions('pcexpressCategory')),
	},
	{
		displayName: 'Additional Options',
		name: 'pcexpressCollectionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['collection']),
		options: sorted(listOptions('pcexpressCollection')),
	},
	{
		displayName: 'Additional Options',
		name: 'pcexpressStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'City',
				name: 'pcexpressStoresCity',
				type: 'string',
				default: '',
				placeholder: 'Winnipeg',
				description: 'Stores whose city contains this (accents and case ignored)',
				routing: { request: { body: { city: trimmed } } },
			},
			languageOption('pcexpressStoresLanguage'),
			{
				displayName: 'Limit',
				name: 'pcexpressStoresLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 400 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Postal Code Start',
				name: 'pcexpressStoresPostalCode',
				type: 'string',
				default: '',
				placeholder: 'T5',
				description: 'Stores whose postal code starts with this (T5, M5V, M5V 3L9)',
				routing: { request: { body: { postal_code: trimmed } } },
			},
			{
				displayName: 'Province',
				name: 'pcexpressStoresProvince',
				type: 'string',
				default: '',
				placeholder: 'BC',
				description: 'A province code or name',
				routing: { request: { body: { province: trimmed } } },
			},
			{
				displayName: 'Shoppable Only',
				name: 'pcexpressStoresShoppable',
				type: 'boolean',
				default: false,
				description: 'Whether to return only stores that take PC Express orders',
				routing: { request: { body: { shoppable_only: '={{ $value || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'pcexpressOtherOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product', 'store', 'suggestions']),
		options: [languageOption('pcexpressOtherLanguage')],
	},
];
