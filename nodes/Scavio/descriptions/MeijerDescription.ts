import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['meijer'], operation, ...extra },
});

// Meijer (meijer.com, the Midwest grocery and general-merchandise chain; US only, USD), 10 operations, 1 credit each;
// credits_used is the truth. Prices, stock and aisles are those of the store you pick. Search, category, deals,
// coupons and reviews can be slow, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const SITE =
	'Meijer (meijer.com, the Midwest grocery and general-merchandise chain: Michigan, Ohio, Indiana, Illinois, Kentucky, Wisconsin; US only, USD)';
const STORE =
	'Prices, stock and aisles are those of the store you pick and differ by store (Meijer Whole Milk, Gallon was $2.88 at Franklin IN and $2.99 at Jeffersonville IN on 2026-11-28); store_used names the store the page used. Without a store ID Meijer picks a store by location.';
const ITEM =
	'meijer_id, upc, ean13, name, URL, image, price, regular_price, clearance_price, pricing_unit, price_per_sold_by_unit, price_text, multi_buy, on_sale, on_clearance, savings_text, stock_status, promotions, mperks, wic_eligible, pickup and delivery flags and sponsored';
const LIST = `total, page, max_page, count, has_more, items (${ITEM}) and facets with counts (brand, price, promotions, ways to save, EBT-SNAP and WIC, fulfillment, sold by)`;
const BILL = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';

const STORE_ID_DESCRIPTION = 'A Meijer store number from Find Stores (stores[].store_id), e.g. 295 (Franklin, IN)';
const STORE_PRICED_OPS = ['search', 'product', 'category', 'deals'];
const STORE_REQUIRED_OPS = ['store', 'weeklyAd', 'coupons'];

const lookup = (prefix: string, operation: string): INodeProperties[] => [
	{
		displayName: 'Look Up By',
		name: `${prefix}LookupBy`,
		type: 'options',
		default: 'meijer_id',
		options: [
			{ name: 'Meijer ID', value: 'meijer_id' },
			{ name: 'UPC or EAN', value: 'upc' },
		],
		displayOptions: show([operation]),
		description: 'Whether the value is a Meijer item ID or a 12-digit UPC-A / 13-digit EAN (converted; both are returned)',
	},
	{
		displayName: 'Meijer ID or UPC',
		name: `${prefix}Id`,
		type: 'string',
		required: true,
		default: '',
		placeholder: '4125010200',
		displayOptions: show([operation]),
		routing: {
			request: {
				body: {
					meijer_id: `={{ $parameter["${prefix}LookupBy"] === "upc" ? undefined : String($value).trim() }}`,
					upc: `={{ $parameter["${prefix}LookupBy"] === "upc" ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A Meijer item ID (items[].meijer_id: the UPC without its check digit, leading zeros dropped), or a UPC / EAN as printed under the barcode, e.g. 041250102007',
	},
];

export const meijerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['meijer'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find meijer stores',
				description: `The stores of ${SITE} within 50 miles of a US ZIP code (up to 50), in the store finder's order: store_id (for every other operation), name, address, latitude, longitude, time_zone, store_type, format, pickup, delivery and URL. Meijer Express gas stations are not listed. ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get meijer categories',
				description: `The departments and collections of ${SITE} as the site navigation lists them, each with name, type (department, collection), path (for Get Category Products, or for Get Deals), group_id, collection_id, parent and URL; or one department's subcategories with item counts. ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get meijer category products',
				description: `One department of ${SITE} by path: the first 52 items priced at the store you pick (total counts them all; narrow with a subcategory path), with group, subcategories, subcategory_links and ${LIST}. ${STORE} ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/category'),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get meijer mperks coupons',
				description: `The mPerks coupons of one store of ${SITE} as the coupons page lists them to a visitor without an account (listed, never clipped): the first 48 with the total and each department's count, or every coupon of the store (slower, up to about 2 minutes). Each coupon: offer_id, title, description, discount, discount_type, minimum_quantity, starts, ends, manufacturer_coupon, departments, terms, new_this_week, expiring_soon. ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/coupons'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get meijer deals',
				description: `One deals collection of ${SITE} (default grocery/grocery-sale, the grocery sale; Get Categories lists the collections): the first 52 items priced at the store you pick (total counts them all), with collection_name, departments and ${LIST}. Meijer has no clearance collection: clearance shows per item as clearance_price. ${STORE} ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a meijer product',
				description: `One item of ${SITE} by Meijer ID or UPC / EAN, priced at the store you pick: price, regular and clearance price, multi-buy, stock_status, aisle and aisle_locations at that store, promotions, mPerks, SNAP and WIC flags, ingredients, breadcrumbs and variations (each size with its own store price and stock). Nutrition and allergens are not on the page (null). ${STORE} ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get meijer reviews',
				description: `The first page of written reviews (8) of one item of ${SITE} as its product page shows it, with the rating summary (average, ratings_count, review_count, distribution, recommended), questions and answers counts, and each review's rating, title, text, date, helpful votes, photos and store responses. Reviewer nicknames, locations and IDs are not returned. ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a meijer store',
				description: `One store of ${SITE} by store number: name, store_type, address, phone, coordinates, features, the store, pharmacy, delivery, pickup, deli, bakery and gas station hours as the store's page shows them, services and nearby_stores. Store pages show no fuel prices. ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/store'),
			},
			{
				name: 'Get Weekly Ad',
				value: 'weeklyAd',
				action: 'Get meijer weekly ad',
				description: `The current weekly ad of one store of ${SITE}, as its page shows it: region (the regional edition, e.g. GRR, CIN), ad dates, every ad running (weekly and seasonal) and each page with its blocks (item, label, price_text as written such as 2/$6 or $3.99, multi_buy, has_coupons). ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/weekly-ad'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search meijer products',
				description: `Search ${SITE} by keywords or a Meijer item ID, priced at the store you pick: query, departments with counts and ${LIST}. Page 1 lists 52 items, page 2 the next 48 (slower). ${STORE} ${BILL} Costs 1 credit.`,
				routing: request('/api/v1/meijer/search'),
			},
		],
		default: 'search',
	},
];

export const meijerFields: INodeProperties[] = [
	// -- Store ID: required for the store, weekly ad and coupons --
	{
		displayName: 'Store ID',
		name: 'meijerStoreIdRequired',
		type: 'string',
		required: true,
		default: '',
		placeholder: '295',
		displayOptions: show(STORE_REQUIRED_OPS),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: STORE_ID_DESCRIPTION,
	},

	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'meijerQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'large eggs',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords or a Meijer item ID',
	},

	// -- Get Product / Get Reviews --
	...lookup('meijerProduct', 'product'),
	...lookup('meijerReviews', 'reviews'),

	// -- Get Category Products --
	{
		displayName: 'Department Path',
		name: 'meijerCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'fresh/produce/fruit',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A department path as Meijer writes it (categories[].path of Get Categories, e.g. grocery/pantry) or a meijer.com department link',
	},

	// -- Get Categories --
	{
		displayName: 'Department Path',
		name: 'meijerCategoriesParent',
		type: 'string',
		default: '',
		placeholder: 'grocery/pantry',
		displayOptions: show(['categories']),
		routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
		description: "A department path for its subcategories; leave empty for Meijer's departments and collections",
	},

	// -- Get Deals --
	{
		displayName: 'Collection Path',
		name: 'meijerCollection',
		type: 'string',
		default: '',
		placeholder: 'grocery/grocery-sale',
		displayOptions: show(['deals']),
		routing: { request: { body: { collection: '={{ String($value).trim() || undefined }}' } } },
		description: 'A collection path as Meijer writes it (Get Categories lists them, e.g. black-friday) or a meijer.com collection link; leave empty for grocery/grocery-sale',
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'meijerZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '47274',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A US ZIP code: the Meijer stores within 50 miles',
	},

	// -- Store ID: optional for the priced listings and product --
	{
		displayName: 'Store ID',
		name: 'meijerStoreId',
		type: 'string',
		default: '',
		placeholder: '295',
		displayOptions: show(STORE_PRICED_OPS),
		routing: { request: { body: { store_id: '={{ String($value).trim() || undefined }}' } } },
		description: `${STORE_ID_DESCRIPTION}. Leave empty and Meijer picks a store by location (store_used names it).`,
	},

	// -- Search Products: page --
	{
		displayName: 'Page',
		name: 'meijerPage',
		type: 'options',
		default: 1,
		options: [
			{ name: 'Page 1 (52 Items)', value: 1 },
			{ name: 'Page 2 (the Next 48, Slower)', value: 2 },
		],
		displayOptions: show(['search']),
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		description: 'Meijer lists 52 items on page 1 and the next 48 on page 2; there is no page 3',
	},

	// -- Get Coupons --
	{
		displayName: 'Additional Options',
		name: 'meijerCouponOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['coupons']),
		options: [
			{
				displayName: 'Department',
				name: 'meijerCouponDepartment',
				type: 'string',
				default: '',
				placeholder: 'Baby',
				description: 'Only coupons in this department: departments[].department_id or a department or subcategory name',
				routing: { request: { body: { department: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Full List',
				name: 'meijerCouponFullList',
				type: 'boolean',
				default: false,
				description: 'Whether to return every coupon of the store (slower, up to about 2 minutes) instead of the first 48 with the total and department counts',
				routing: { request: { body: { full_list: '={{ $value ? true : undefined }}' } } },
			},
		],
	},
];
