import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['ashley'], operation, ...extra },
});

// Ashley Furniture, 6 operations. Search Products and Get Product serve the United States
// (ashleyfurniture.com) and Ashley's licensed storefronts in Canada, Mexico, the Philippines,
// Saudi Arabia and Turkey: 2 credits on the United States and Mexico, 1 credit on the rest.
// Get Category Products, Get Deal Event Products, Find Stores and Get Store are United States
// only at 2 credits, so they show no Country. A call can retry once upstream, so every
// operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const MARKET_OPS = ['search', 'product'];
const GRID_OPS = ['category', 'deals'];

const PRICES =
	"Prices are in the market's currency, never converted. regular_price is Ashley's own Regular Price, which Ashley's terms define as its highest advertised price in store and online, offered to customers using special long-term financing.";
const REGION =
	'Ashley prices vary by region and there is no ZIP input: every United States answer returns priced_for (zipcode, price_zone), the ZIP and price zone Ashley priced that answer for, so two calls can come back priced for different zones.';
const GRID =
	'30 products per page: priced_for, count, total, page, total_pages, sort, facets and items with sku, name, brand, UPC, category, URL, image, price, regular_price, discount_percent, color, badges (sale, clearance, doorbuster, hot_buy ...), promotion, rating, review_count, stock_text and delivery_method.';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

export const ashleyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ashley'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find ashley furniture stores',
				description: `Ashley stores near a latitude and longitude (no address or ZIP lookup): store_id, name and URL per store, listed alphabetically (not by distance). Use Get Store for the address, phone and hours. ${CHARGE} United States only. Costs 2 credits.`,
				routing: request('/api/v1/ashley/stores'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get ashley furniture category products',
				description: `One ashleyfurniture.com category's products by path or URL, sorted and filtered. Returns category (path, name, URL, breadcrumbs) and ${GRID} ${PRICES} ${REGION} ${CHARGE} United States only. Costs 2 credits.`,
				routing: request('/api/v1/ashley/category'),
			},
			{
				name: 'Get Deal Event Products',
				value: 'deals',
				action: 'Get ashley furniture deal event products',
				description: `The products of one deal event: Black Friday, Clearance or Hot Buys, with the category sorts and filters. Returns event, event_name, event_url and ${GRID} ${PRICES} ${REGION} ${CHARGE} United States only. Costs 2 credits.`,
				routing: request('/api/v1/ashley/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an ashley furniture product',
				description: `One Ashley product. United States (by item number or URL): priced_for, price, regular_price, discount_percent, badges, options, variants, set components with their own prices and stock, dimensions, materials, assembly, images, stock and delivery, nearest_store, rating, review_count, rating_histogram, the first 10 reviews the page shows (no review paging), customer_photos and questions (Q&A). Licensed storefronts (by handle or URL, not item number): sku, handle, name, price, regular_price, available, description, options, variants and images. ${PRICES} ${REGION} ${CHARGE} Costs 2 credits in the United States and Mexico, 1 credit in Canada, the Philippines, Saudi Arabia and Turkey.`,
				routing: request('/api/v1/ashley/product'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an ashley furniture store',
				description: `One Ashley store by store ID or URL: name, URL, phone, address, latitude, longitude, hours (day, opens, closes), payment_accepted, services, rating, image and map_url. ${CHARGE} United States only. Costs 2 credits.`,
				routing: request('/api/v1/ashley/store'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search ashley furniture products',
				description: `Search Ashley Furniture by keyword. United States: 48 per page with the exact total, sorted by best sellers, price, newest, rating or name; items with sku, name, brand, URL, image, price, regular_price, discount_percent, color, size, badges, rating, review_count, variants and promotions, plus priced_for and facets (informational: use Get Category Products for filters). Licensed storefronts: up to 10 best matches (Turkey: its first results page) with handle (for Get Product), name, URL, image, price, regular_price and available; no paging or sort. ${PRICES} ${REGION} ${CHARGE} Costs 2 credits in the United States and Mexico, 1 credit in Canada, the Philippines, Saudi Arabia and Turkey.`,
				routing: request('/api/v1/ashley/search'),
			},
		],
		default: 'search',
	},
];

const sortOption = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'best_sellers',
	options: [
		{ name: 'Best Sellers', value: 'best_sellers' },
		{ name: 'Customer Rating', value: 'rating' },
		{ name: 'Name (A to Z)', value: 'name' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
	],
	description: 'Result order',
	routing: {
		request: { body: { sort: '={{ $value === "best_sellers" ? undefined : $value }}' } },
	},
};

export const ashleyFields: INodeProperties[] = [
	// -- Market: Search Products, Get Product --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (Ashleyhomestore.ca)', value: 'ca' },
			{ name: 'Mexico (Store.ashleyfurniture.com.mx)', value: 'mx' },
			{ name: 'Philippines (Store.ashleyfurniture.ph)', value: 'ph' },
			{ name: 'Saudi Arabia (Store.ashley.sa)', value: 'sa' },
			{ name: 'Turkey (Ashleyturkiye.com)', value: 'tr' },
			{ name: 'United States (Ashleyfurniture.com)', value: 'us' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"The Ashley market. Outside the United States these are Ashley's licensed storefronts (search and product only). Prices come in the market's currency (USD, CAD, MXN, PHP, SAR, TRY).",
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sofa',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords (Turkey: Turkish keywords, e.g. koltuk)',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search'], { country: ['us'] }),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 1-based (48 per page)',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			sortOption,
		],
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'sku',
		options: [
			{ name: 'Item Number (United States)', value: 'sku' },
			{ name: 'Handle (Licensed Storefronts)', value: 'handle' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description:
			'Read a United States product by its item number, a licensed-storefront product by its handle, or either by its product page link',
	},
	{
		displayName: 'Item Number',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5950418',
		displayOptions: show(['product'], { productBy: ['sku'] }),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: 'An Ashley item number (items[].sku of a United States search), e.g. 5950418 or APK-29004-R3',
	},
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'aviemore-sofa',
		displayOptions: show(['product'], { productBy: ['handle'] }),
		routing: { request: { body: { handle: '={{ $value }}' } } },
		description:
			"The product handle from a licensed-storefront search (items[].handle). Set Country to that storefront's market.",
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.ashleyfurniture.com/p/x/5950418.html',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'A product page on a served storefront; the market is read from it, so leave Country on its default or set the same market',
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'categoryBy',
		type: 'options',
		default: 'path',
		options: [
			{ name: 'Category Path', value: 'path' },
			{ name: 'Category URL', value: 'url' },
		],
		displayOptions: show(['category']),
		description: 'Read a category by its path or by its ashleyfurniture.com link',
	},
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'furniture/living-room/sofas',
		displayOptions: show(['category'], { categoryBy: ['path'] }),
		routing: { request: { body: { path: '={{ $value }}' } } },
		description:
			'The part after /c/ in an ashleyfurniture.com category URL, e.g. furniture/living-room/sofas, bedroom/beds or mattresses',
	},
	{
		displayName: 'Category URL',
		name: 'category_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.ashleyfurniture.com/c/furniture/living-room/sofas/',
		displayOptions: show(['category'], { categoryBy: ['url'] }),
		routing: { request: { body: { category_url: '={{ $value }}' } } },
		description: 'An ashleyfurniture.com category page (/c/... URL); refinements in it are kept.',
	},

	// -- Get Deal Event Products --
	{
		displayName: 'Event',
		name: 'event',
		type: 'options',
		default: 'black_friday',
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Hot Buys', value: 'hot_buys' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { event: '={{ $value }}' } } },
		description: 'The Ashley deal event',
	},

	// -- Additional Options: Get Category Products, Get Deal Event Products --
	{
		displayName: 'Additional Options',
		name: 'gridOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(GRID_OPS),
		options: [
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'json',
				default: '{}',
				description:
					'Facet refinements from a previous response: facets[].ID to options[].value values, e.g. {"facetUpholsteryDesign": "Chaise"}. At most 6 facets.',
				routing: {
					request: {
						body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
					},
				},
			},
			{
				displayName: 'Maximum Price',
				name: 'price_max',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Highest price (USD)',
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Price',
				name: 'price_min',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description:
					"Lowest price (USD), applied to Ashley's own price list, so an item priced for another region can sit just outside the range",
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Grid page, 1-based (30 per page)',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			sortOption,
		],
	},

	// -- Find Stores --
	{
		displayName: 'Latitude',
		name: 'lat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 18, maxValue: 72, numberPrecision: 6 },
		placeholder: '40.7506',
		displayOptions: show(['stores']),
		routing: { request: { body: { lat: '={{ $value }}' } } },
		description: 'Latitude to search around (there is no address or ZIP lookup)',
	},
	{
		displayName: 'Longitude',
		name: 'lng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: -60, numberPrecision: 6 },
		placeholder: '-73.9972',
		displayOptions: show(['stores']),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Radius (Miles)',
		name: 'radius',
		type: 'options',
		default: 50,
		options: [
			{ name: '10', value: 10 },
			{ name: '100', value: 100 },
			{ name: '25', value: 25 },
			{ name: '50', value: 50 },
		],
		displayOptions: show(['stores']),
		routing: { request: { body: { radius: '={{ $value === 50 ? undefined : $value }}' } } },
		description: 'Search radius in miles',
	},

	// -- Get Store --
	{
		displayName: 'Store By',
		name: 'storeBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Store ID', value: 'id' },
			{ name: 'Store URL', value: 'url' },
		],
		displayOptions: show(['store']),
		description: 'Read a store by its ID from Find Stores or by its store page link',
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'us/wisconsin/greenfield/4771-s-27th-st/luxe',
		displayOptions: show(['store'], { storeBy: ['id'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: 'A store ID from Find Stores (stores[].store_id)',
	},
	{
		displayName: 'Store URL',
		name: 'storeUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://stores.ashleyfurniture.com/store/us/wisconsin/greenfield/4771-s-27th-st/luxe/',
		displayOptions: show(['store'], { storeBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A store page on stores.ashleyfurniture.com (the store link Find Stores returns)',
	},
];
