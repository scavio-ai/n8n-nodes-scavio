import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bathandbodyworks'], operation, ...extra },
});

// Bath & Body Works (bathandbodyworks.com, US, USD; Market Canada reads bathandbodyworks.ca in
// English, CAD), 10 operations, 1 credit each. Get Product, Get Promotions, Get Store
// Availability and Get Reviews Summary take a product ID or link. Market is sent only when it
// is Canada, so a bathandbodyworks.ca link works with the default (a link's site sets the
// market). Get Promotions, Get Store Availability and Get Store usually take 10-40 s, so every
// route carries a 120s timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

// Comma-separated values sent as a list (one value or several, any of them matches).
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const CARD =
	'ID (for Get Product; every size is its own ID), name, brand, product_type, form, size, currency, price, list_price, promotional_price (where the site states one), promotions (ID, callout, promotional_price), rating, review_count, badge, fragrance_name, fragrance_family, online_orderable, in_store_pickup, member_exclusive, launch_date, image, url_path and us_product_id (Canada: the matching US product ID)';
const LISTING = `Returns total (the site's own count), count (at most 48: the site shows 48 results and has no page 2, so narrow with Sort and the filters), has_more, selected_filters, products (${CARD}) and facets (filter, label, values with value and count).`;
const CREDITS = 'Failed calls are not charged; a not-found is charged. Costs 1 credit.';

const ALL_OPS = [
	'categories',
	'category',
	'offers',
	'product',
	'promotions',
	'reviewsSummary',
	'search',
	'store',
	'storeAvailability',
	'stores',
];
const PRODUCT_OPS = ['product', 'promotions', 'reviewsSummary', 'storeAvailability'];

const listingOptions: INodeProperties[] = [
	{
		displayName: 'Fragrance Families',
		name: 'fragrance_family',
		type: 'string',
		default: '',
		placeholder: 'Fruity & Bright, Fresh & Clean',
		description:
			'Only these fragrance families (Warm & Woodsy, Treats & Sweets, Fruity & Bright, Fresh & Clean, Botanicals & Blooms), separated by commas',
		routing: { send: { type: 'body', property: 'fragrance_family', value: splitList } },
	},
	{
		displayName: 'Fragrance Names',
		name: 'fragrance_name',
		type: 'string',
		default: '',
		placeholder: 'Champagne Toast',
		description:
			'Only these fragrances, as the site names them (facets fragrance_name), separated by commas',
		routing: { send: { type: 'body', property: 'fragrance_name', value: splitList } },
	},
	{
		displayName: 'Product Types',
		name: 'product_type',
		type: 'string',
		default: '',
		placeholder: '3-Wick Candle, Body Lotion',
		description:
			'Only these product types, as the site names them (facets product_type), separated by commas',
		routing: { send: { type: 'body', property: 'product_type', value: splitList } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'New Arrivals', value: 'new_arrivals' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
			{ name: 'Relevance', value: 'relevance' },
			{ name: 'Top Rated', value: 'top_rated' },
		],
		description: "The site's own sorts. Defaults to Relevance.",
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
];

export const bathandbodyworksOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bathandbodyworks'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get bath and body works categories',
				description: 'The Bath & Body Works category tree as the site\'s navigation menu lists it: country, count, categories (ID, name, path: what Get Category Products takes, empty for a menu group; children). Failed calls are not charged; a not-found is charged. Costs 1 credit.',
				routing: request('/api/v1/bathandbodyworks/categories'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get bath and body works category products',
				description: `The products of one category page by path (from Get Categories: /c/..., /g/..., /t/..., including deal pages such as /g/top-offers and /t/black-friday) or its link, with the same sorts and filters as Search Products. ${LISTING} Also category (ID, name, page_title, description, breadcrumbs). An unknown path is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/category'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get bath and body works offers',
				description: `The current offers: the home page's offer cards and the Top Offers tiles. Returns promotions (ID, placement, title, headline, details, urgency, percent_off, price_point, promo_code, promo_code_instructions, validity as given, terms, link_path, published_at) and top_offers (ID, label, offer, applies_to, detail, urgency, link_path). ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/offers'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a bath and body works product',
				description: `One product in full by ID or link: name, brand, product_type, form, size, currency, price, list_price, promotional_price, promotions, rating, review_count, badge, fragrance name, family, classification, description and notes (top, heart, base), description, highlights, ingredients, UPC, member_exclusive, launch_date, collection, online (orderable, purchase_limit, low_stock), in_store_pickup, images, breadcrumbs and us_product_id (Canada). Every size is its own product ID; the site publishes no stock counts. An unknown ID is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/product'),
			},
			{
				name: 'Get Promotions',
				value: 'promotions',
				action: 'Get bath and body works product promotions',
				description: `The promotions attached to one product with their start and end times (ISO, UTC) and terms as given: product_id, name, currency, price, count, promotions (ID, name, callout, promotional_price, start_date, end_date, terms). Usually 10-40 s. An unknown ID is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/promotions'),
			},
			{
				name: 'Get Reviews Summary',
				value: 'reviewsSummary',
				action: 'Get a bath and body works reviews summary',
				description: `One product's rating, review count and up to 4 newest reviews (ID, rating, title, text, date_created, date_published, verified_purchaser). No reviewer name is returned; full review paging is not offered. A product without a review summary answers rating null and no reviews. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/reviews-summary'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a bath and body works store',
				description: `One store's public page by store ID: name, address, phone, latitude, longitude, hours by day, services, store_types (BBW, BBWO outlet, WBC White Barn), url_path and nearby_stores (where the page lists them). An unknown store ID is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/store'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get bath and body works store pickup availability',
				description: `Whether one store takes a pickup order for one product: store (name, city, state), name, size, currency, price (national: the same at every store), store_orderable, pickup_purchase_limit (the most the store lets you reserve for pickup, 0-24; a purchase limit, not a count of what the store holds: the site publishes none), online_orderable, online_purchase_limit and low_stock (the site's own flag). Usually 10-40 s. An unknown product or store ID is a charged not-found. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/store-availability'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get bath and body works stores',
				description: `Every store ID in the market's store directory (about 1,800 US, 114 Canada): count and stores (store_id, url_path). The directory lists store IDs only (Get Store reads a store's address and hours); there is no search by ZIP or city. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/stores'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search bath and body works products',
				description: `Keyword search on Bath & Body Works (a product, a fragrance or a collection), sorted by relevance, price, top rated or new arrivals and filtered by fragrance name, fragrance family and product type. ${LISTING} Also redirect_path (where the site sends a search instead of listing results). A search with no results answers count 0. ${CREDITS}`,
				routing: request('/api/v1/bathandbodyworks/search'),
			},
		],
		default: 'search',
	},
];

export const bathandbodyworksFields: INodeProperties[] = [
	{
		displayName: 'Market',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (bathandbodyworks.ca, English, CAD)', value: 'ca' },
			{ name: 'United States (bathandbodyworks.com, USD)', value: 'us' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"Which Bath & Body Works site to read. A product link's site sets the market on its own. Spanish and French pages are not offered (the site serves the same English data there).",
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'candle',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'A keyword: a product, a fragrance or a collection',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listingOptions,
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/c/all-candles/3-wick-candles',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value }}' } } },
		description:
			'A category path from Get Categories (categories[].path), e.g. /c/all-candles/3-wick-candles, /g/top-offers or /t/black-friday, or its link',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listingOptions,
	},

	// -- Product operations --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '028029548',
		displayOptions: show(PRODUCT_OPS),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description: 'A Bath & Body Works product ID (9 digits, as search results list it). Every size is its own ID. Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.bathandbodyworks.com/p/champagne-toast-3-wick-candle-028029548',
		displayOptions: show(PRODUCT_OPS),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			"A bathandbodyworks.com or bathandbodyworks.ca product link (the link's site sets the market). Used when Product ID is not given.",
	},

	// -- Get Store Availability / Get Store --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BBW00010',
		displayOptions: show(['storeAvailability', 'store']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A Bath & Body Works store ID (BBW + 5 digits), as Get Stores lists it',
	},
];
