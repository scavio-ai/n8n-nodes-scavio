import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['kroger'], operation, ...extra },
});

// Kroger (kroger.com) plus the QFC (qfc.com) and Fred Meyer (fredmeyer.com) banners, 8
// operations. Search Products and Get Product 2 credits, Get Store Prices 3, the rest 1. Prices
// are integer cents. A call can take up to about a minute, so every route carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const CENTS = 'Prices are integer cents (price 399 = $3.99).';
const SITE_STORE =
	'Prices, promotions, stock and aisle are those of the store returned in store (a store the site chooses, which can change between calls); for one specific store use Get Store Prices with a store ID from Find Stores.';
const ITEM =
	'UPC, name, brand, URL, image, price, list_price, promo_price with promo_ends_at, price_display, unit_price_display, n-for deals, size, in_stock (null when the store has no stock record), stock_level, SNAP eligibility, dietary info, category and rating (average, count, star distribution; no review text)';
const GRID = `banner, store, total, count and products with ${ITEM}. Only the first page (up to 24 products) is available, with no sort.`;
const CHARGE =
	'Failed upstream calls are not charged (they are retried automatically); a not-found is charged.';

const STORE_ID_DESCRIPTION =
	"A store's 8-digit location_id from Find Stores, e.g. 70500847. QFC IDs start with 705, Fred Meyer IDs with 701.";

export const krogerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['kroger'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find kroger stores',
				description: `Kroger, QFC or Fred Meyer stores near a ZIP or a city / address (nearest first), or one store by ID: location_id (the store ID for Get Store Prices, Get Coupons and Get Search Suggestions), banner, type (store or fuel_center), name, store_number, address, coordinates, phone, timezone, hours, open_24_hours, departments, has_pharmacy, has_fuel_center, pickup, delivery and distance_miles. Fuel center locations only, no fuel prices. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/kroger/stores'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get kroger category products',
				description: `A Kroger, QFC or Fred Meyer category listing by /pl/ URL or taxonomy ID. Returns category (ID, name, URL) and ${GRID} ${SITE_STORE} ${CENTS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/kroger/category'),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get kroger digital coupons',
				description: `The digital coupons at one Kroger, QFC or Fred Meyer store (store ID, or the banner's store nearest a ZIP), 24 per page: ID, brand, title, description, details, savings (type, amount in cents, percent), type, min_quantity, categories, tags, valid_for, max_redemptions, starts_at, clip_by, expires_at and image; plus total_at_store, has_more and the categories to filter on. Listing only: coupons are not clipped and no account is used. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/kroger/coupons'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a kroger product',
				description: `One Kroger, QFC or Fred Meyer product by URL or UPC: the search fields plus description, nutrition facts, ingredients, allergens, images, country of origin, dimensions, weight, dietary flags, the aisle at the store (store_location) and breadcrumbs. ${SITE_STORE} ${CENTS} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/kroger/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get kroger search suggestions',
				description: `Kroger, QFC or Fred Meyer search box suggestions for a partial query: suggestions (text, type) and the store they were asked for. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/kroger/suggestions'),
			},
			{
				name: 'Get Store Prices',
				value: 'prices',
				action: 'Get kroger store prices',
				description: `Price, promotion, stock and aisle for up to 25 UPCs at one Kroger, QFC or Fred Meyer store you choose (store ID from Find Stores). Per UPC: price, promo_price, promo_ends_at, on_sale, price_display, unit_price_display, in_stock, stock_level, quantity (the site's available estimate, not a shelf count), aisle (description, number, side, bay, shelf), fulfillment and priced_at; unknown UPCs in not_found. ${CENTS} An unknown store ID is a charged not-found. ${CHARGE} Costs 3 credits.`,
				routing: request('/api/v1/kroger/prices'),
			},
			{
				name: 'Get Weekly Digital Deals',
				value: 'deals',
				action: 'Get kroger weekly digital deals',
				description: `This week's weekly digital deals of Kroger, QFC or Fred Meyer: deals_week (ID, ends_at) and ${GRID} Store promotions carry promo_price; digital-coupon deals show the shelf price (the coupon is in Get Coupons, tag Weekly Digital Deals). The printed weekly ad circular is not available. ${SITE_STORE} ${CENTS} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/kroger/deals'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search kroger products',
				description: `Search Kroger, QFC or Fred Meyer products by keyword. Returns ${GRID} ${SITE_STORE} ${CENTS} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/kroger/search'),
			},
		],
		default: 'search',
	},
];

export const krogerFields: INodeProperties[] = [
	// -- Banner: every operation --
	{
		displayName: 'Banner',
		name: 'banner',
		type: 'options',
		default: 'auto',
		options: [
			{ name: 'Auto (Kroger, or From the URL / Store ID)', value: 'auto' },
			{ name: 'Fred Meyer (Fredmeyer.com: Pacific Northwest and Alaska)', value: 'fred_meyer' },
			{ name: 'Kroger (Kroger.com)', value: 'kroger' },
			{ name: 'QFC (Qfc.com: Washington and Oregon)', value: 'qfc' },
		],
		displayOptions: show([
			'search',
			'product',
			'prices',
			'stores',
			'category',
			'deals',
			'coupons',
			'suggestions',
		]),
		routing: { request: { body: { banner: '={{ $value === "auto" ? undefined : $value }}' } } },
		description:
			'The store banner. Auto sends none: kroger, unless a product or category URL or a store ID sets it. Prices differ by banner and by store. Other Kroger banners are not supported yet.',
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'organic milk',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'product_url',
		type: 'string',
		default: '',
		placeholder:
			'/p/simple-truth-organic-lactose-free-2-reduced-fat-milk-half-gallon/0001111050438',
		displayOptions: show(['product']),
		routing: { request: { body: { product_url: '={{ $value || undefined }}' } } },
		description:
			'Full or relative product URL on kroger.com, qfc.com or fredmeyer.com (the product URL from Search Products). Pass this or UPC. An absolute URL sets the banner.',
	},
	{
		displayName: 'UPC',
		name: 'upc',
		type: 'string',
		default: '',
		placeholder: '0001111050438',
		displayOptions: show(['product']),
		routing: { request: { body: { upc: '={{ $value || undefined }}' } } },
		description: "The product's UPC (from Search Products or product URLs: /p/{slug}/{upc})",
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		placeholder: 'simple-truth-organic-lactose-free-2-reduced-fat-milk-half-gallon',
		displayOptions: show(['product']),
		routing: { request: { body: { slug: '={{ $value || undefined }}' } } },
		description: 'Product slug (the readable part of the product URL). Optional with UPC.',
	},

	// -- Get Store Prices --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '70500847',
		displayOptions: show(['prices']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: STORE_ID_DESCRIPTION,
	},
	{
		displayName: 'UPCs',
		name: 'upcs',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0001111050438, 0081006334306',
		displayOptions: show(['prices']),
		routing: { request: { body: { upcs: splitList } } },
		description:
			'1 to 25 13-digit UPCs, comma-separated, as the site writes them (products[].upc of Search Products or Get Category Products)',
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'findBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City or Address', value: 'query' },
			{ name: 'Store ID', value: 'storeId' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP or a place, or read one store by ID',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '98101',
		displayOptions: show(['stores'], { findBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP code',
	},
	{
		displayName: 'City or Address',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Portland, OR',
		displayOptions: show(['stores'], { findBy: ['query'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "A city or address, as typed in the site's store finder",
	},
	{
		displayName: 'Store ID',
		name: 'storeLookupId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '70100011',
		displayOptions: show(['stores'], { findBy: ['storeId'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: STORE_ID_DESCRIPTION,
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'categoryBy',
		type: 'options',
		default: 'url',
		options: [
			{ name: 'Category URL', value: 'url' },
			{ name: 'Taxonomy ID', value: 'taxonomyId' },
		],
		displayOptions: show(['category']),
		description: 'Read a category by its /pl/ URL or by the ID at the end of it',
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.fredmeyer.com/pl/headphones-earbuds-headsets/2900300001',
		displayOptions: show(['category'], { categoryBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			"A category listing URL (/pl/&lt;name&gt;/&lt;ID&gt;) on kroger.com, qfc.com or fredmeyer.com. The URL's host sets the banner.",
	},
	{
		displayName: 'Taxonomy ID',
		name: 'taxonomy_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '08190',
		displayOptions: show(['category'], { categoryBy: ['taxonomyId'] }),
		routing: { request: { body: { taxonomy_id: '={{ $value }}' } } },
		description: 'The digits at the end of a /pl/ URL. Category IDs are shared across banners.',
	},
	{
		displayName: 'Category Slug',
		name: 'categorySlug',
		type: 'string',
		default: '',
		placeholder: 'Import-Beer',
		displayOptions: show(['category'], { categoryBy: ['taxonomyId'] }),
		routing: { request: { body: { slug: '={{ $value || undefined }}' } } },
		description: 'The name part of a /pl/ URL. Optional; without it category.name is null.',
	},

	// -- Get Coupons --
	{
		displayName: 'Store By',
		name: 'couponStoreBy',
		type: 'options',
		default: 'storeId',
		options: [
			{ name: 'Store ID', value: 'storeId' },
			{ name: 'ZIP Code (Nearest Store)', value: 'zip' },
		],
		displayOptions: show(['coupons']),
		description: "Read one store's coupons, or those of the banner's store nearest a ZIP",
	},
	{
		displayName: 'Store ID',
		name: 'couponStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '70500847',
		displayOptions: show(['coupons'], { couponStoreBy: ['storeId'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: STORE_ID_DESCRIPTION,
	},
	{
		displayName: 'ZIP Code',
		name: 'couponZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '98101',
		displayOptions: show(['coupons'], { couponStoreBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: "A 5-digit ZIP: the banner's nearest store is used",
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'suggestionQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'almond mi',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What a shopper has typed so far (2+ characters)',
	},

	// -- Additional Options: Search Products, Get Category Products, Get Weekly Digital Deals --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search', 'category', 'deals']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1 },
				description:
					'Only page 1 (up to 24 products) is available; a page above 1 is refused before any charge',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Find Stores --
	{
		displayName: 'Additional Options',
		name: 'storeOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Include Other Banners',
				name: 'include_other_banners',
				type: 'boolean',
				default: false,
				description:
					'Whether to also return nearby stores of other Kroger banners (for example Fred Meyer stores near a QFC search)',
				routing: { request: { body: { include_other_banners: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Stores to return, 1 to 50. The API default is 10.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Coupons --
	{
		displayName: 'Additional Options',
		name: 'couponOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['coupons']),
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				placeholder: 'Dairy',
				description: "Only coupons in one department: a name from the response's categories list",
				routing: { request: { body: { category: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Page of coupons, 24 per page. Follow has_more.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Text Match',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'coffee',
				description: 'Only coupons whose brand or text matches',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Search Suggestions --
	{
		displayName: 'Additional Options',
		name: 'suggestionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '70500847',
				description:
					"A store's 8-digit location_id. Without it the banner's store nearest a representative ZIP is used (Kroger 45202, QFC 98101, Fred Meyer 97201).",
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
		],
	},
];
