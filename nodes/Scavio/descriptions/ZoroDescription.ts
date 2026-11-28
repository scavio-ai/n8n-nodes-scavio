import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['zoro'], operation, ...extra },
});

// Zoro (zoro.com, the US online industrial and business supply store, part of Grainger), 6 operations, 1 credit each;
// credits_used is the truth. United States, USD. Search, category, brand and product take 5 to 60 s and carry a 180s
// timeout; availability and reviews take 60 to 120 s (up to about 230 s) and carry 240s.
const request = (url: string, timeout: number) => ({
	request: { method: 'POST' as const, url, timeout },
});
const PAGE_MS = 180000;
const SLOW_MS = 240000;

const SITE =
	'Zoro (zoro.com, the US online industrial and business supply store, part of Grainger), United States only, prices in USD as zoro.com lists them to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const RETRY = 'A failed call is not charged and can be retried.';
const PRICES =
	'unit_price is the price of one selling unit (price_unit EA each, PK pack, PR pair ...; package_qty pieces in it); order_multiple is the number of selling units Zoro sells the item in multiples of, and order_multiple_price the price of one such multiple (order_multiple_price_source says whether the page gives it or it is unit_price x order_multiple).';
const LIST =
	"36 per page, pages 1 to 100, in Zoro's order. Returns total, page, page_size, total_pages, has_more, count and items (zoro_no for Get Product, name, brand, mfr_no, URL, image, categories, unit_price, price_unit, package_qty, order_multiple, order_multiple_price, was_price, currency, key_specs, lead_time, drop_ship_direct, ltl_freight, freight_cost, restricted_states, discontinued, marked_out_of_stock). Zoro's filters are not returned.";

const pageOptions = (prefix: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: [
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Results page, 1 to 100, 36 products each',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
	],
});

const productField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Zoro Number or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'G2426514',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				zoro_no: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description: 'The Zoro number (zoro_no of a listing item; G followed by digits) or a zoro.com product link',
});

export const zoroOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['zoro'] } },
		options: [
			{
				name: 'Get Availability',
				value: 'availability',
				action: 'Get zoro availability',
				description: `The availability of one product of ${SITE} as its product page shows it: zoro_no, name, brand, mfr_no, URL, status (e.g. In Stock), status_type, delivery_estimate (Zoro's delivery-time text), can_back_order, orderable, min_order_qty, inventory_units (Zoro shows no unit counts: always null) and price (unit_price, price_unit, package_qty, order_multiple, order_multiple_price, currency). An unknown Zoro number is a charged not-found. Captured 2026-11-28: a 3M N95 respirator pack of 10, In Stock at 16.99 USD per pack, standard delivery 3-5 business days. ${RETRY} ${ONE}`,
				routing: request('/api/v1/zoro/availability', SLOW_MS),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get zoro brand products',
				description: `One brand's products on ${SITE} by brand name or brand link: brand, URL and the listing. ${LIST} ${PRICES} A brand without products is a charged not-found. Captured 2026-11-28: Mcr Safety listed 2,901 products. ${ONE}`,
				routing: request('/api/v1/zoro/brand', PAGE_MS),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get zoro category products',
				description: `One category of ${SITE} by category link or path: category (code, slug, name, URL) and the listing. ${LIST} ${PRICES} An unknown category is a charged not-found. Captured 2026-11-28: safety-glasses/c/6214 held 3,325 products. ${ONE}`,
				routing: request('/api/v1/zoro/category', PAGE_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a zoro product',
				description: `One product of ${SITE} by Zoro number or link: zoro_no, name, brand, mfr_no (manufacturer part number), UPC, URL, categories, unit_price, price_unit, package_qty, order_multiple, order_multiple_price, was_price, currency, availability, images, documents (technical guides and other PDFs), specifications (with Country of Origin), variants with their own prices, lead_time, drop_ship_direct, ltl_freight, freight_cost, restricted_states (states Zoro does not ship the item to), discontinued, hazmat and expeditable. ${PRICES} An unknown Zoro number is a charged not-found. Captured 2026-11-28: MCR Safety BearKat safety glasses at 1.39 USD each, sold in multiples of 12 (16.68 USD). ${ONE}`,
				routing: request('/api/v1/zoro/product', PAGE_MS),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get zoro reviews',
				description: `Customer reviews of one product of ${SITE}: the rating summary (average_rating, rating_count, review_count, recommended_ratio, rating_histogram, Pros / Cons / Best Uses counts, answered_questions) and the first 5 reviews the product page shows, newest first (review_id, rating, headline, comments, bottom_line, dates, verified buyer, helpful votes, media_count). Deeper pages are not offered. No reviewer names or locations. Captured 2026-11-28: the BearKat safety glasses averaged 4.86 from 50 ratings, 98% recommended. ${RETRY} ${ONE}`,
				routing: request('/api/v1/zoro/reviews', SLOW_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search zoro products',
				description: `Search ${SITE} by keyword, part number or Zoro number. Zoro sends some keywords to a category or brand page and some part numbers to a product page: redirected_to (type category, brand, product or page, zoro_no, URL, category, brand) says where, and the list is that page's; a product redirect returns no items, use Get Product. Returns query, redirected_to, did_you_mean and the listing. ${LIST} ${PRICES} A keyword without products returns total 0. Search suggestions are not offered. Captured 2026-11-28: 3m n95 respirator matched 145 products. ${ONE}`,
				routing: request('/api/v1/zoro/search', PAGE_MS),
			},
		],
		default: 'search',
	},
];

export const zoroFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'zoroQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3m n95 respirator',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords, a part number or a Zoro number (1 to 200 characters)',
	},
	pageOptions('zoroSearch', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'zoroCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'safety-glasses/c/6214',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: "A zoro.com category link or path (slug/c/code, e.g. a search's redirected_to URL)",
	},
	pageOptions('zoroCategory', 'category'),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'zoroBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Mcr Safety',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: "A brand as Zoro names it (a listing item's brand), e.g. 3M, Mcr Safety or Zoro Select, or a zoro.com brand link",
	},
	pageOptions('zoroBrand', 'brand'),

	// -- Get Product / Get Availability / Get Reviews --
	productField('zoroProduct', 'product'),
	productField('zoroAvailabilityProduct', 'availability'),
	productField('zoroReviewsProduct', 'reviews'),
];
