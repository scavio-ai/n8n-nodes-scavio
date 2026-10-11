import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['mercadoLibre'], operation, ...extra },
});

const COUNTRY_HELP =
	'Prices come back in the country\'s currency (MXN, BRL, ARS, COP). Chile is not supported.';

const NOT_FOUND = 'An unknown ID answers 404 naming what was not found and is billed like a normal call.';

function additionalOptions(
	operation: string[],
	options: INodeProperties[],
	extra: Record<string, string[]> = {},
): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(operation, extra),
		options,
	};
}

function booleanOption(name: string, displayName: string, description: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'boolean',
		default: false,
		description,
		routing: { request: { body: { [name]: '={{ $value || undefined }}' } } },
	};
}

/** Product ID / Item ID / URL selector plus the matching input fields. */
function listingAddress(operation: string, withProductId: boolean): INodeProperties[] {
	const lookupOptions = [
		...(withProductId ? [{ name: 'Product ID', value: 'productId' }] : []),
		{ name: 'Item ID', value: 'itemId' },
		{ name: 'Mercado Libre URL', value: 'url' },
	];
	const defaultLookup = withProductId ? 'productId' : 'itemId';
	const fields: INodeProperties[] = [
		{
			displayName: 'Look Up By',
			name: 'lookupBy',
			type: 'options',
			noDataExpression: true,
			default: defaultLookup,
			displayOptions: show([operation]),
			options: lookupOptions,
			description: withProductId
				? 'Whether to identify the listing by catalog product ID, item (listing) ID or page URL'
				: 'Whether to identify the listing by item (listing) ID or page URL',
		},
	];
	if (withProductId) {
		fields.push({
			displayName: 'Product ID',
			name: 'product_id',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'MLM1027172667',
			displayOptions: show([operation], { lookupBy: ['productId'] }),
			routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
			description: `Catalog product_id from Search Listings. The prefix (MLM, MLB, MLA, MCO) sets the country. ${NOT_FOUND}`,
		});
	}
	fields.push(
		{
			displayName: 'Item ID',
			name: 'item_id',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'MLM3571336480',
			displayOptions: show([operation], { lookupBy: ['itemId'] }),
			routing: { request: { body: { item_id: '={{ String($value).trim() }}' } } },
			description: `A listing's item_id from Search Listings. MLM-3571336480 and MLM3571336480 both work; the prefix sets the country. ${NOT_FOUND}`,
		},
		{
			displayName: 'Mercado Libre URL',
			name: 'url',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://www.mercadolibre.com.mx/.../p/MLM1027172667',
			displayOptions: show([operation], { lookupBy: ['url'] }),
			routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
			description:
				operation === 'questions'
					? 'A listing page URL, or a product (/p/, /up/) URL: a product\'s questions are those of the listing in its buy box'
					: 'A product (/p/), user product (/up/) or listing page URL from Mexico, Brazil, Argentina or Colombia',
		},
	);
	return fields;
}

export const mercadoLibreOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['mercadoLibre'] } },
		options: [
			{
				name: 'Get Best Sellers',
				value: 'bestSellers',
				action: 'Get mercado libre best sellers',
				description:
					'The ranked top 20 best sellers in a Mercado Libre category in Mexico, Argentina or Colombia, with price, discount, installments, rating, units sold as a lower bound and seller where shown. Not available for Brazil. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/mercadolibre/best-sellers' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a mercado libre product',
				description:
					'One Mercado Libre catalog product or listing by product ID, item ID or URL: title, price, list price, installments, promotions, the buy-box seller with reputation level and seller tier, stock, shipping, rating with its star distribution, variations with sibling product IDs, specs, description, pictures and categories. Only the buy-box seller is returned; units sold is a range ("+500"). Some fields are null where the page omits them. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/mercadolibre/product' } },
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get mercado libre listing questions',
				description:
					'Buyer questions on a Mercado Libre listing with the seller\'s answers and answer dates (Mercado Libre shows no question dates). The first page holds 20-40 questions; page through with next_offset. A listing with no public questions answers 404 saying so, billed like a normal call. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/mercadolibre/questions' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get mercado libre product reviews',
				description:
					'One page of up to 15 Mercado Libre product reviews, optionally filtered by star rating: rating, text, the original text when Mercado Libre translated it, exact date, likes, the review\'s country and photos. Catalog products pool reviews from several countries. Page until a page comes back empty. Totals and the star distribution come from Get Product. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/mercadolibre/reviews' } },
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search mercado libre listings',
				description:
					'Search Mercado Libre (Mercado Livre in Brazil) listings in Mexico, Brazil, Argentina or Colombia by keyword or seller, filtered by condition, price range, discount, free shipping, Full fulfillment, official stores and interest-free installments, sorted by relevance or price. Each row has price, list price and discount, installments, shipping flags, a sponsored flag, rating, units sold as a range, catalog IDs and seller where shown. About 48 per page, up to 42 pages (about 2,000 results) per query; slice by price range, condition or seller to reach more. A query with no results returns an empty list, billed. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/mercadolibre/search' } },
			},
		],
		default: 'search',
	},
];

export const mercadoLibreFields: INodeProperties[] = [
	// ── Search Listings ──
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		required: true,
		default: 'mx',
		displayOptions: show(['search']),
		options: [
			{ name: 'Argentina', value: 'ar' },
			{ name: 'Brazil (Mercado Livre)', value: 'br' },
			{ name: 'Colombia', value: 'co' },
			{ name: 'Mexico', value: 'mx' },
		],
		description: COUNTRY_HELP,
		routing: { request: { body: { country: '={{ $value }}' } } },
	},
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'query',
		displayOptions: show(['search']),
		options: [
			{ name: 'Keywords', value: 'query' },
			{ name: 'Seller ID', value: 'sellerId' },
			{ name: 'Seller Nickname', value: 'sellerNickname' },
		],
		description:
			'Whether to search by keywords, list one seller\'s catalogue by numeric seller ID (combines with keywords, filters, sort and paging), or by public nickname (first page only, no filters)',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'iphone 15',
		displayOptions: show(['search'], { searchBy: ['query'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Keywords, up to 200 characters. Mercado Libre may narrow a query to a category, brand or line on its own; the response lists those in auto_applied_filters.',
	},
	{
		displayName: 'Seller ID',
		name: 'seller_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '527927603',
		displayOptions: show(['search'], { searchBy: ['sellerId'] }),
		routing: { request: { body: { seller_id: '={{ String($value).trim() }}' } } },
		description:
			'Numeric seller ID, as returned in seller.seller_id by Get Product or by a Seller Nickname search',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'funda',
		displayOptions: show(['search'], { searchBy: ['sellerId'] }),
		routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
		description: 'Optional keywords to search within this seller\'s listings',
	},
	{
		displayName: 'Seller Nickname',
		name: 'seller_nickname',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MERCADOLIBRE ELECTRONICA_MX',
		displayOptions: show(['search'], { searchBy: ['sellerNickname'] }),
		routing: { request: { body: { seller_nickname: '={{ String($value).trim() }}' } } },
		description:
			'A seller\'s public nickname. Returns the seller\'s first page of listings, unfiltered, plus their seller_id; use Seller ID for filters, sort and further pages. An unknown nickname answers 404 and is billed like a normal call.',
	},

	// ── Get Product / Get Reviews / Get Questions ──
	...listingAddress('product', true),
	...listingAddress('reviews', true),
	...listingAddress('questions', false),

	// ── Get Best Sellers ──
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		required: true,
		default: 'mx',
		displayOptions: show(['bestSellers']),
		options: [
			{ name: 'Argentina', value: 'ar' },
			{ name: 'Colombia', value: 'co' },
			{ name: 'Mexico', value: 'mx' },
		],
		description: 'Mexico, Argentina or Colombia. Best sellers are not available for Brazil.',
		routing: { request: { body: { country: '={{ $value }}' } } },
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MLM1055',
		displayOptions: show(['bestSellers']),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description:
			'A category_id or category_path ID from Search Listings, or category_id from Get Product. Its prefix must match the country (MLM Mexico, MLA Argentina, MCO Colombia).',
	},

	// ── Additional Options ──
	additionalOptions(
		['search'],
		[
			{
				displayName: 'Condition',
				name: 'condition',
				type: 'options',
				default: 'new',
				options: [
					{ name: 'New', value: 'new' },
					{ name: 'Open Box', value: 'open_box' },
					{ name: 'Refurbished', value: 'refurbished' },
					{ name: 'Used', value: 'used' },
				],
				description:
					'Item condition. Without it, Mercado Libre may show new items only for some queries (mostly in Brazil and Argentina), listed in auto_applied_filters.',
				routing: { request: { body: { condition: '={{ $value }}' } } },
			},
			booleanOption('free_shipping', 'Free Shipping Only', 'Whether to keep only listings with free shipping'),
			booleanOption(
				'interest_free_installments',
				'Interest-Free Installments Only',
				'Whether to keep only listings payable in interest-free installments',
			),
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Maximum price in the country\'s currency (MXN, BRL, ARS or COP)',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Discount',
				name: 'min_discount',
				type: 'options',
				default: 5,
				options: [
					{ name: '5% Off or More', value: 5 },
					{ name: '10% Off or More', value: 10 },
					{ name: '15% Off or More', value: 15 },
					{ name: '20% Off or More', value: 20 },
					{ name: '25% Off or More', value: 25 },
					{ name: '30% Off or More', value: 30 },
					{ name: '40% Off or More', value: 40 },
				],
				description: 'Only listings at least this many percent off',
				routing: { request: { body: { min_discount: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Minimum price in the country\'s currency (MXN, BRL, ARS or COP)',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			booleanOption(
				'official_stores_only',
				'Official Stores Only',
				'Whether to keep only listings from official brand stores',
			),
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 42 },
				description:
					'Results page, 1-42, about 48 listings per page (about 2,000 results per query). Every page costs 2 credits.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			booleanOption(
				'full_fulfillment',
				'Shipped by Full Only',
				'Whether to keep only listings shipped by Mercado Libre Full fulfillment',
			),
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Listing order. Defaults to Relevance. Mercado Libre offers no newest or best-selling sort.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
		{ searchBy: ['query', 'sellerId'] },
	),
	additionalOptions(
		['reviews'],
		[
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10000 },
				description:
					'Reviews page, 1-based, up to 15 reviews per page. A page past the last one comes back empty.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'rating',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this star rating',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['questions'],
		[
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Where to start, from next_offset of the previous page. Defaults to 0.',
				routing: { request: { body: { offset: '={{ $value }}' } } },
			},
		],
	),
];
