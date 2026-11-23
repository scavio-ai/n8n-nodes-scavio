import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['instacart'], operation, ...extra },
});

// Instacart (instacart.com, the US and Canada grocery delivery and pickup marketplace), 11
// operations. 1 credit each; Search Products 3 (2 when the page fits in Instacart's first
// answer); Search Across Stores 3 for up to 5 stores, 4 for 6 to 10. United States on every
// operation; Canada (instacart.ca, CAD, a postal code as ZIP) on every operation except Search
// Across Stores and Get Reviews, which are US only and send no country. Language French is
// Canada only and not offered on Get Suggestions. Calls can queue behind the backend's upstream
// limit, so every operation carries a 240s timeout, like AutoZone.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const NAME = 'Instacart (instacart.com, the US and Canada grocery delivery and pickup marketplace)';
const PRICES =
	"Every price is Instacart's price for that store, ZIP and service type, named in priced_for with the retailer's pricing_label as Instacart shows it. Retailers set their Instacart prices, which can be above their in-store prices, so an Instacart delivery price is not the store's shelf price; Service Type In-Store returns Instacart's in-store prices where it shows them. No price history: schedule a workflow to track changes.";
const ITEM =
	'items with product_id (the same at every store; for Get Product, Compare Prices Across Stores and Get Reviews), name, brand, size, price, price_text, was_price, discount_percent, deal (e.g. Buy 2, get 3 free), unit_price, loyalty_price, in_stock, stock_level, dietary, image and URL';
const LIST = 'plus priced_for, total, total_pages, has_more and count.';
const NOT_AVAILABLE =
	'Not available: delivery and service fees or order minimums as numbers (Instacart shows them at checkout), coupons, Instacart+ member prices, account, order or cart data.';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const COST = 'Costs 1 credit.';

const ZIP_OPS = [
	'retailers',
	'search',
	'crossSearch',
	'product',
	'priceCompare',
	'categories',
	'category',
	'deals',
	'stores',
	'suggestions',
];
const CA_OPS = [
	'retailers',
	'search',
	'product',
	'priceCompare',
	'categories',
	'category',
	'deals',
	'stores',
	'suggestions',
];
const LANGUAGE_OPS = ['retailers', 'search', 'product', 'priceCompare', 'categories', 'category', 'deals', 'stores'];
const SERVICE_OPS = ['search', 'product', 'category', 'deals'];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'instacartPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Page, from 1 (total_pages says how deep the list goes)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const limitOption: INodeProperties = {
	displayName: 'Limit',
	name: 'limit',
	type: 'number',
	default: 50,
	typeOptions: { minValue: 1 },
	description: 'Max number of results to return',
	hint: 'Products per page, 1 to 60. The API default is 30.',
	routing: { request: { body: { limit: '={{ $value }}' } } },
};

const collection = (name: string, operations: string[], options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show(operations),
	options: sorted([...options]),
});

export const instacartOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['instacart'] } },
		options: [
			{
				name: 'Compare Prices Across Stores',
				value: 'priceCompare',
				action: 'Compare instacart prices across stores',
				description: `The same product priced at every store delivering to a ZIP on ${NAME}, as Instacart shows it for delivery, sorted low to high: stores_checked, count and prices (retailer_slug, retailer_name, price, price_text, was_price, discount_percent, on_sale, no_markups, URL). No unit price or stock (Get Product gives them per store). A product priced nowhere at the ZIP returns an empty list and a note. These are Instacart delivery prices, not shelf prices. ${CHARGE} ${COST}`,
				routing: request('/api/v1/instacart/price-compare'),
			},
			{
				name: 'Find Pickup Stores',
				value: 'stores',
				action: 'Find instacart pickup stores',
				description: `The pickup locations of one retailer near a ZIP on ${NAME}, nearest first: retailer_location_id, name, address, coordinates, distance, phone and hours for the next 7 days (the 5 nearest). A retailer with no pickup near the ZIP returns an empty list and a note. ${CHARGE} ${COST}`,
				routing: request('/api/v1/instacart/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get instacart categories',
				description: `The department and aisle tree of one store on ${NAME}: categories with name, slug (for Get Category Products), type (department or collection) and aisles (name, slug). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/instacart/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get instacart category products',
				description: `The products of one department, aisle or collection of a store on ${NAME}, paged: ${ITEM}, ${LIST} A slug the store does not have is a charged not-found. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/instacart/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get instacart deals',
				description: `The sale items of one store on ${NAME} (its Sales collection: sale prices with the regular price, multi-buy offers such as Buy 2, get 3 free), paged: ${ITEM}, ${LIST} Coupons are not included. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/instacart/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an instacart product',
				description: `One product at one store on ${NAME}: priced_for, available_at_store, name, size, brand, description, ingredients, directions, warnings (allergens as given), key_nutrients (as Instacart lists them, not a full nutrition panel), images, item (the store's price block, null when the store shows no price) and rating with its distribution. An ID Instacart does not know is a charged not-found. ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/instacart/product'),
			},
			{
				name: 'Get Retailers',
				value: 'retailers',
				action: 'Get instacart retailers',
				description: `Every store on ${NAME} serving a ZIP or Canadian postal code: count, no_markups_count and retailers with retailer_id, slug (the Retailer of the other operations), name, retailer_type, delivery_eta and pickup_eta (Instacart's text), no_markups (Instacart's 'No markups' label: in-store prices online), accepts_ebt, delivery_available, pickup_available and URL. Delivery fees and order minimums are not part of the answer. A ZIP with no Instacart service area returns an empty list and a note. ${CHARGE} ${COST}`,
				routing: request('/api/v1/instacart/retailers'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get instacart reviews',
				description: `Customer reviews of one product on ${NAME} (US only), 15 a page: rating summary (page 1) and reviews (rating, title, text, date, source as Instacart names it, incentivized). No reviewer name or identity. ${CHARGE} ${COST}`,
				routing: request('/api/v1/instacart/reviews'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get instacart suggestions',
				description: `Instacart's search suggestions for a partial query on ${NAME}, for one store or across every store serving the ZIP: type (search_term, collection or retailer), text, search_term, category and retailer. English only. ${CHARGE} ${COST}`,
				routing: request('/api/v1/instacart/suggestions'),
			},
			{
				name: 'Search Across Stores',
				value: 'crossSearch',
				action: 'Search instacart across stores',
				description: `One query across up to 10 stores delivering to a US ZIP on ${NAME} (US only), each store's first matching products priced for delivery: retailers_matched and groups (retailer_slug, retailer_name, no_markups, matches and ${ITEM}). Stores come in Instacart's order. ${PRICES} ${CHARGE} Costs 3 credits for up to 5 stores, 4 for 6 to 10.`,
				routing: request('/api/v1/instacart/cross-search'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search instacart products',
				description: `Search one store on ${NAME} at a ZIP, for delivery, pickup or in-store prices; sort by price, filter to sale items or a brand, page through every match: ${ITEM}, ${LIST} Also brand_filters (brand_id, name). A retailer that does not serve the ZIP is a charged not-found. ${PRICES} ${NOT_AVAILABLE} ${CHARGE} Costs 3 credits (2 when the page fits in Instacart's first answer).`,
				routing: request('/api/v1/instacart/search'),
			},
		],
		default: 'priceCompare',
	},
];

export const instacartFields: INodeProperties[] = [
	// -- Query --
	{
		displayName: 'Query',
		name: 'instacartQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'milk',
		displayOptions: show(['search', 'crossSearch', 'suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords (for Get Suggestions, what the shopper has typed so far)',
	},

	// -- Product --
	{
		displayName: 'Product ID',
		name: 'instacartProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '16408559',
		displayOptions: show(['product', 'priceCompare', 'reviews']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'An Instacart product ID (items product_id, the same at every store), an item ID or an Instacart product link',
	},

	// -- Category --
	{
		displayName: 'Category Slug',
		name: 'instacartCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'produce',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A department or aisle slug from Get Categories (categories slug or aisles slug)',
	},

	// -- Retailer --
	{
		displayName: 'Retailer',
		name: 'instacartRetailer',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'wegmans',
		displayOptions: show(['search', 'categories', 'category', 'deals', 'stores']),
		routing: { request: { body: { retailer: '={{ $value }}' } } },
		description: 'A retailer slug or ID from Get Retailers (e.g. costco, jewel-osco, wegmans). It must serve the ZIP.',
	},
	{
		displayName: 'Retailer',
		name: 'instacartOptionalRetailer',
		type: 'string',
		default: '',
		placeholder: 'wegmans',
		displayOptions: show(['product', 'suggestions']),
		routing: { request: { body: { retailer: '={{ $value || undefined }}' } } },
		description:
			"A retailer slug or ID from Get Retailers. Get Product needs it unless the product link names the store; Get Suggestions without it covers every store serving the ZIP.",
	},

	// -- Market --
	{
		displayName: 'ZIP or Postal Code',
		name: 'instacartZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(ZIP_OPS),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP (10001) or, with Country Canada, a Canadian postal code (M5V 2T6). Prices, stores and availability are for this location.',
	},
	{
		displayName: 'Country',
		name: 'instacartCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(CA_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'United States (instacart.com, USD) or Canada (instacart.ca, CAD)',
	},
	{
		displayName: 'Language',
		name: 'instacartLanguage',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(LANGUAGE_OPS, { instacartCountry: ['ca'] }),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'French returns names, aisles and price text as Instacart shows them in Quebec',
	},
	{
		displayName: 'Service Type',
		name: 'instacartServiceType',
		type: 'options',
		default: 'delivery',
		options: [
			{ name: 'Delivery', value: 'delivery' },
			{ name: 'In-Store', value: 'instore' },
			{ name: 'Pickup', value: 'pickup' },
		],
		displayOptions: show(SERVICE_OPS),
		routing: { request: { body: { service_type: '={{ $value === "delivery" ? undefined : $value }}' } } },
		description: "Which Instacart price: delivery (default), pickup, or in-store (Instacart's in-store prices for that store, where it shows them)",
	},

	// -- Additional Options --
	collection('instacartSearchOptions', ['search'], [
		pageOption,
		limitOption,
		{
			displayName: 'Sort',
			name: 'instacartSort',
			type: 'options',
			default: 'best_match',
			options: [
				{ name: 'Best Match', value: 'best_match' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
			],
			description: "Result order (Best Match is Instacart's order, the default)",
			routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
		},
		{
			displayName: 'On Sale Only',
			name: 'instacartOnSale',
			type: 'boolean',
			default: false,
			description: 'Whether to return only the products Instacart marks on sale at this store',
			routing: { request: { body: { on_sale: '={{ $value ? true : undefined }}' } } },
		},
		{
			displayName: 'Brand ID',
			name: 'instacartBrandId',
			type: 'string',
			default: '',
			placeholder: '18514',
			description: 'A brand ID from brand_filters of an earlier search',
			routing: { request: { body: { brand_id: '={{ $value || undefined }}' } } },
		},
	]),
	collection('instacartListOptions', ['category', 'deals'], [pageOption, limitOption]),
	collection('instacartStoresOptions', ['stores'], [
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			hint: 'Stores to return, 1 to 50. The API default is 10.',
			routing: { request: { body: { limit: '={{ $value }}' } } },
		},
	]),
	collection('instacartCrossSearchOptions', ['crossSearch'], [
		{
			displayName: 'Max Stores',
			name: 'instacartMaxRetailers',
			type: 'number',
			default: 5,
			typeOptions: { minValue: 1, maxValue: 10 },
			description: 'Stores to price, 1 to 10 (default 5). 3 credits up to 5 stores, 4 above.',
			routing: { request: { body: { max_retailers: '={{ $value }}' } } },
		},
		{
			displayName: 'Items per Store',
			name: 'instacartItemsPerRetailer',
			type: 'number',
			default: 5,
			typeOptions: { minValue: 1, maxValue: 20 },
			description: 'Products per store, 1 to 20 (default 5)',
			routing: { request: { body: { items_per_retailer: '={{ $value }}' } } },
		},
	]),
	collection('instacartReviewsOptions', ['reviews'], [
		{
			displayName: 'Page',
			name: 'instacartReviewPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Page (15 reviews a page)',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
	]),
];
