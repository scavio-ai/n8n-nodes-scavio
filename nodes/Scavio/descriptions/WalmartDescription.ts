import type { INodeProperties } from 'n8n-workflow';

export const walmartOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['walmart'] } },
		options: [
			{
				name: 'Get Buy Box Offer',
				value: 'offers',
				action: 'Get a walmart buy box offer',
				description:
					'Get the buy box seller for a product, with price, seller, condition and buy box flag. This returns the winning offer only, never the full offer list. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/offers' } },
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get walmart category products',
				description:
					'List the products inside a Walmart category, in the same shape as search. Costs 1 credit on walmart.com and walmart.ca, 2 on walmart.com.mx.',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/category' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a walmart product',
				description:
					'Get full product detail: price, rating, images, specifications, availability and seller. Costs 1 credit, or 2 when targeted at one store with Store ID and Delivery ZIP.',
				// Store-targeted calls take 10-60s; give them room.
				routing: { request: { method: 'POST', url: '/api/v1/walmart/product', timeout: 120000 } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get walmart product reviews',
				description:
					'Get customer reviews with ratings, text, author, date and the rating breakdown. Returns 10 reviews per page and costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/reviews' } },
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a walmart seller',
				description:
					'Get a marketplace seller storefront: name, rating, review count, Pro Seller badge and business details. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/seller' } },
			},
			{
				name: 'Get Seller Products',
				value: 'sellerProducts',
				action: 'Get walmart seller products',
				description:
					"Get a seller's catalog. Only the roughly 40 server-rendered items come back and there is no pagination, but total_count reports the seller's real catalog size. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/walmart/seller-products' } },
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get walmart stores near a zip code',
				description:
					'List the Walmart stores near a US ZIP code or Canadian postal code, nearest first, with store_id, distance, address, coordinates and hours. Use a store_id with Search Products or Get Product to target that store. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/walmart/stores' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search walmart products',
				description:
					'Search Walmart and return structured product rows plus products_count and location. Costs 1 credit on walmart.com and walmart.ca, 2 on walmart.com.mx, and 2 when targeted at one store with Store ID and Delivery ZIP.',
				// Store-targeted calls take 10-60s; give them room.
				routing: { request: { method: 'POST', url: '/api/v1/walmart/search', timeout: 120000 } },
			},
		],
		default: 'search',
	},
];

const WALMART_DOMAINS = [
	{
		name: 'Walmart.ca (Canada)',
		value: 'ca',
		description: 'Canadian storefront, 1 credit per call',
	},
	{
		name: 'Walmart.com (United States)',
		value: 'com',
		description: 'United States storefront, 1 credit per call',
	},
	{
		name: 'Walmart.com.mx (Mexico)',
		value: 'com.mx',
		description: 'Mexican storefront, 2 credits per call',
	},
];

// Store targeting runs on walmart.com and walmart.ca only.
const WALMART_STORE_DOMAINS = [
	{
		name: 'Walmart.ca (Canada)',
		value: 'ca',
		description: 'Canadian storefront; ZIP fields take a postal code such as M5V 2T6',
	},
	{
		name: 'Walmart.com (United States)',
		value: 'com',
		description: 'United States storefront; ZIP fields take a 5-digit ZIP',
	},
];

// Store ID + Delivery ZIP, offered on Search Products and Get Product. Kept as
// two constants so each lands in its alphabetical slot in the option lists.
const WALMART_DELIVERY_ZIP_OPTION: INodeProperties = {
	displayName: 'Delivery ZIP',
	name: 'delivery_zip',
	type: 'string',
	default: '',
	placeholder: '50036',
	description:
		'Shopper postal code: a 5-digit US ZIP, or a Canadian postal code such as M5V 2T6 on walmart.ca. Must be set together with Store ID. Store-targeted requests cost 2 credits and take 10-60 seconds, so keep a generous timeout.',
	routing: { request: { body: { delivery_zip: '={{ $value }}' } } },
};

const WALMART_STORE_ID_OPTION: INodeProperties = {
	displayName: 'Store ID',
	name: 'store_id',
	type: 'string',
	default: '',
	placeholder: '1389',
	description:
		'Walmart store to target, from the Get Stores operation on the same domain. Must be set together with Delivery ZIP. Works on walmart.com and walmart.ca only. The store used is echoed in data.location.',
	routing: { request: { body: { store_id: '={{ $value }}' } } },
};

const WALMART_SORTS = [
	{ name: 'Best Match', value: 'best_match' },
	{ name: 'Best Seller', value: 'best_seller' },
	{ name: 'New', value: 'new' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
	{ name: 'Rating: High to Low', value: 'rating_high' },
];

const WALMART_FULFILLMENT_SPEEDS = [
	{ name: 'Today', value: 'today' },
	{ name: 'Tomorrow', value: 'tomorrow' },
];

export const walmartFields: INodeProperties[] = [
	// ── Query (search) ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'air fryer 6 quart',
		displayOptions: { show: { resource: ['walmart'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search query',
	},

	// ── Shared product ID (product, reviews, offers) ──
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '13544111159',
		displayOptions: {
			show: { resource: ['walmart'], operation: ['product', 'reviews', 'offers'] },
		},
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'Walmart item ID (usItemId), the trailing numeric string on a walmart.com/ip/ product URL',
	},

	// ── ZIP / postal code (stores) ──
	{
		displayName: 'ZIP / Postal Code',
		name: 'zipcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '50036',
		displayOptions: { show: { resource: ['walmart'], operation: ['stores'] } },
		routing: { request: { body: { zipcode: '={{ $value }}' } } },
		description:
			'A 5-digit US ZIP, or a Canadian postal code such as M5V 2T6 when Domain is Walmart.ca',
	},

	// ── Category ID (category) ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3944_133251_1095191',
		displayOptions: { show: { resource: ['walmart'], operation: ['category'] } },
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description:
			'Walmart category, either a leaf ID such as 1095191 or a full underscore path such as 3944_133251_1095191',
	},

	// ── Shared seller ID (seller, sellerProducts) ──
	{
		displayName: 'Seller ID',
		name: 'seller_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '101039012',
		displayOptions: {
			show: { resource: ['walmart'], operation: ['seller', 'sellerProducts'] },
		},
		routing: { request: { body: { seller_id: '={{ $value }}' } } },
		description:
			'Numeric Walmart catalog seller ID, returned as seller_catalog_id on products and offers. The GUID form of the seller identifier returns 404.',
	},

	// ── Additional Options: Search Products ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['walmart'], operation: ['search'] } },
		options: [
			WALMART_DELIVERY_ZIP_OPTION,
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'options',
				default: 'com',
				options: WALMART_DOMAINS,
				description:
					'Walmart storefront to search. This option sets the price of the call: walmart.com.mx costs 2 credits, walmart.com and walmart.ca cost 1.',
				routing: { request: { body: { domain: '={{ $value }}' } } },
			},
			{
				displayName: 'Fulfillment Speed',
				name: 'fulfillment_speed',
				type: 'options',
				default: 'today',
				options: WALMART_FULFILLMENT_SPEEDS,
				description:
					'Restrict results to items arriving today or tomorrow. Walmart also exposes 2_days and anytime, which are deliberately not offered here: 2_days leaks 3-4 day items and anytime is a no-op, so leave this option off instead.',
				routing: { request: { body: { fulfillment_speed: '={{ $value }}' } } },
			},
			{
				displayName: 'Fulfillment Type',
				name: 'fulfillment_type',
				type: 'options',
				default: 'in_store',
				options: [{ name: 'In Store', value: 'in_store' }],
				description: 'Restrict results to items available for in-store pickup',
				routing: { request: { body: { fulfillment_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum price, in the currency of the selected domain',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				description: 'Minimum price, in the currency of the selected domain',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to fetch, starting at 1. Each page is a separate billed call.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'best_match',
				options: WALMART_SORTS,
				description: 'Result sort order',
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
			WALMART_STORE_ID_OPTION,
		],
	},

	// ── Additional Options: Get Product ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['walmart'], operation: ['product'] } },
		options: [
			WALMART_DELIVERY_ZIP_OPTION,
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'options',
				default: 'com',
				options: WALMART_STORE_DOMAINS,
				description:
					'Walmart storefront. Walmart.ca is only available together with Store ID and Delivery ZIP.',
				routing: { request: { body: { domain: '={{ $value }}' } } },
			},
			WALMART_STORE_ID_OPTION,
		],
	},

	// ── Additional Options: Get Stores ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['walmart'], operation: ['stores'] } },
		options: [
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'options',
				default: 'com',
				options: WALMART_STORE_DOMAINS,
				description:
					'Which Walmart to list stores for. Use the returned store_id with the same domain on Search Products or Get Product.',
				routing: { request: { body: { domain: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Reviews ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['walmart'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Review page to fetch, starting at 1. Walmart returns 10 reviews per page and each page is a separate billed call.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevancy',
				options: [
					{ name: 'Most Helpful', value: 'helpful-desc' },
					{ name: 'Most Recent', value: 'submission-desc' },
					{ name: 'Oldest First', value: 'submission-asc' },
					{ name: 'Rating: High to Low', value: 'rating-desc' },
					{ name: 'Rating: Low to High', value: 'rating-asc' },
					{ name: 'Relevancy', value: 'relevancy' },
				],
				description: 'Review sort order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Category Products ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['walmart'], operation: ['category'] } },
		options: [
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'options',
				default: 'com',
				options: WALMART_DOMAINS,
				description:
					'Walmart storefront to read the category from. This option sets the price of the call: walmart.com.mx costs 2 credits, walmart.com and walmart.ca cost 1.',
				routing: { request: { body: { domain: '={{ $value }}' } } },
			},
			{
				displayName: 'Fulfillment Speed',
				name: 'fulfillment_speed',
				type: 'options',
				default: 'today',
				options: WALMART_FULFILLMENT_SPEEDS,
				description:
					'Restrict results to items arriving today or tomorrow. Walmart also exposes 2_days and anytime, which are deliberately not offered here: 2_days leaks 3-4 day items and anytime is a no-op, so leave this option off instead.',
				routing: { request: { body: { fulfillment_speed: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum price, in the currency of the selected domain',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				default: 40,
				typeOptions: { minValue: 1 },
				description:
					'Trim the returned products to this many rows. The trim happens after the page is fetched, so it does not reduce the credit cost.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				description: 'Minimum price, in the currency of the selected domain',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to fetch, starting at 1. Each page is a separate billed call.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'best_match',
				options: WALMART_SORTS,
				description: 'Result sort order',
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
		],
	},
];
