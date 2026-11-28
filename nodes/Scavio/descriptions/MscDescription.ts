import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['msc'], operation, ...extra },
});

// MSC Industrial Supply (mscdirect.com, the US metalworking and MRO distributor), 5 operations, 1 credit each;
// credits_used is the truth. United States, USD. Search, category and product pages are slow (30 to 120 s, up to about
// 240 s) and carry a 300s timeout; clearance and locations take 5 to 40 s and carry 180s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 300000;
const PAGE_MS = 180000;

const SITE =
	'MSC Industrial Supply (mscdirect.com, the US metalworking and MRO distributor), United States, prices in USD: the Web Price MSC shows to a visitor who is not signed in (account pricing may differ)';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const ORDER =
	'price (the Web Price as MSC shows it), price_text, price_unit (ea. or per 100), price_per_quantity (1 or 100), unit_price (price / price_per_quantity, computed by Scavio), order_unit, minimum_order_quantity, order_multiple';
const LIST = `24 products per page, up to page 400. Returns page, page_size, sort, total, total_pages, has_more, count, items (msc_number for Get Product, name, subtitle, brand, mfr_number, URL, image, ${ORDER}, minimum_order_price, availability, in_stock, rating, review_count, alternative_msc_numbers), categories (name, navid for Get Category Products, count), brands, brand_count, filters (in stock, made in USA, clearance, new additions, eco-friendly item counts), ratings, attributes and note.`;
const NOT_BUILT =
	'Review text, account pricing, delivery estimates and per-branch stock (MSC does not publish it) are not returned.';

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
			typeOptions: { minValue: 1, maxValue: 400 },
			description: 'Results page, 1 to 400, 24 products each',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'bestmatch',
			options: [
				{ name: 'Best Match', value: 'bestmatch' },
				{ name: 'MSC# (High to Low)', value: 'itemnumber_desc' },
				{ name: 'MSC# (Low to High)', value: 'itemnumber' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price' },
				{ name: 'Rating', value: 'rating' },
			],
			routing: { request: { body: { sort: '={{ $value === "bestmatch" ? undefined : $value }}' } } },
		},
	]),
});

export const mscOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['msc'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get MSC category products',
				description: `One category of ${SITE} by navid (a search's categories navid, a product's breadcrumbs navid) or a category link, sorted by best match, price, MSC# or rating. ${LIST} Also navid, category and breadcrumbs (from the top level down). An unknown navid is a charged not-found. Captured 2026-11-28: navid 2106186 held 51,048 products. ${ONE}`,
				routing: request('/api/v1/msc/category', SLOW_MS),
			},
			{
				name: 'Get Clearance',
				value: 'clearance',
				action: 'Get MSC clearance',
				description: `The Clearance Specials list (default) or the Web Specials list of ${SITE}. Curated lists as MSC publishes them (about 60 items each), not a feed of every discounted item: list, name, URL, heading, count, items (msc_number, order_number, name, label, sale_price, currency, image, URL) and note. MSC publishes no end dates on these lists. Captured 2026-11-28: Clearance Specials held 60 items, prices valid for current inventory only. ${ONE}`,
				routing: request('/api/v1/msc/clearance', PAGE_MS, true),
			},
			{
				name: 'Get Locations',
				value: 'locations',
				action: 'Get MSC locations',
				description: `The locations of MSC Industrial Supply (mscdirect.com): customer fulfillment centers, regional inventory centers, warehouses, customer care and support centers, offices, manufacturing facilities and affiliated companies with their published business phone numbers, narrowed by type, state and country. These are MSC's distribution and inventory locations, not pickup stores: MSC has no customer pickup branches by ZIP and publishes no per-branch stock in this data. Returns total, count, location_types (type, count) and locations (name, types, affiliate, address, phones, website). Captured 2026-11-28: 63 locations, 13 of them warehouses. ${ONE}`,
				routing: request('/api/v1/msc/locations', PAGE_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an MSC product',
				description: `One product of ${SITE} by MSC# or link: msc_number, mfr_number, big_book_page (the item's page in MSC's Big Book catalog), name, subtitle, brand, URL, images, ${ORDER}, minimum_order_total, availability, in_stock, purchasable, rating, review_count, breadcrumbs, category, specifications, country_of_origin, documents (manuals, data sheets), compliance (Prop 65 and notices), alternative_msc_numbers and note. ${NOT_BUILT} An unknown MSC# is a charged not-found. Captured 2026-11-28: MSC# 71205678, a Hertel jobber length drill bit, at 1.53 USD each, minimum and multiple of 12 (total 18.36). ${ONE}`,
				routing: request('/api/v1/msc/product', SLOW_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search MSC products',
				description: `Search ${SITE} by keyword, manufacturer part number or MSC#, sorted by best match, price, MSC# or rating. ${LIST} Also query and redirected_to (when MSC answers an MSC# search with the product page; items then holds that product). A keyword with no products returns total 0. Captured 2026-11-28: drill bit matched 132,055 products. ${ONE}`,
				routing: request('/api/v1/msc/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const mscFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'mscQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'drill bit',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords, a manufacturer part number or an MSC# (1 to 200 characters); an MSC# returns that product',
	},
	listingOptions('mscSearch', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category Navid or URL',
		name: 'mscCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2106186',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					navid: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: "An MSC category ID (navid of a search's categories or a product's breadcrumbs) or an mscdirect.com category link carrying navid=",
	},
	listingOptions('mscCategory', 'category'),

	// -- Get Product --
	{
		displayName: 'MSC# or URL',
		name: 'mscProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00647354',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					msc_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The MSC# (8 digits with its leading zeros, msc_number of a listing item) or an mscdirect.com product link',
	},

	// -- Get Clearance --
	{
		displayName: 'List',
		name: 'mscList',
		type: 'options',
		default: 'clearance',
		options: [
			{ name: 'Clearance Specials', value: 'clearance' },
			{ name: 'Web Specials', value: 'web_specials' },
		],
		displayOptions: show(['clearance']),
		routing: { request: { body: { list: '={{ $value === "clearance" ? undefined : $value }}' } } },
		description: "Which of MSC's curated lists to return",
	},

	// -- Get Locations --
	{
		displayName: 'Additional Options',
		name: 'mscLocationsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['locations']),
		options: [
			{
				displayName: 'Country',
				name: 'mscLocationsCountry',
				type: 'string',
				default: '',
				placeholder: 'United States',
				description: 'One country, as MSC lists it: United States, Canada, Mexico, United Kingdom, Ireland or Asia',
				routing: { request: { body: { location_country: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'mscLocationsState',
				type: 'string',
				default: '',
				placeholder: 'PA',
				description: 'One US state (2-letter code)',
				routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() || undefined }}' } } },
			},
			{
				displayName: 'Type',
				name: 'mscLocationsType',
				type: 'string',
				default: '',
				placeholder: 'Customer Fulfillment Center',
				description:
					'One location type, as MSC names it: Customer Fulfillment Center, Regional Inventory Center, Warehouse, Customer Care Center, Customer Support Center, Shared Services Center, Procurement Office, Manufacturing Facility or Affiliated Company',
				routing: { request: { body: { type: '={{ String($value).trim() || undefined }}' } } },
			},
		],
	},
];
