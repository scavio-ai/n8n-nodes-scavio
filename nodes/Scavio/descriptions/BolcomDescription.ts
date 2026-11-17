import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bolcom'], operation, ...extra },
});

// bol.com (the Netherlands and Belgium, EUR), 9 operations, 2 credits each; Get Product by EAN 4
// (a search plus the product page, billed on actual cost). Every operation serves the storefronts
// nl-nl (default), be-nl and be-fr: Country nl / be plus Language nl / fr (French only with
// Belgium). Pages take 2-16s and the backend retries once inside a 225s deadline, so every route
// carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const ALL_OPS = [
	'search',
	'product',
	'offers',
	'seller',
	'sellerProducts',
	'category',
	'brand',
	'deals',
	'campaign',
];

const ITEM =
	'items with product_id (a string), title, URL, brand (brand_id, name), category, rating (average, count), offer (the buy box: offer_id, price, reference_price, reference_price_type, discount_percent, condition, seller_id, seller_name, sold_by_bol, delivery_text, delivery_date, low_stock, labels with campaign_id), cheapest_second_hand and cheapest_refurbished when bol shows them, energy_label, image and sponsored (a paid placement), plus total, page, max_page, has_more, sort, facets and filters_ignored. List items carry no EAN: Get Product has it';
const PRICES =
	"Prices are numbers in euros. reference_price is the price bol shows next to the price: reference_price_type rrp (the supplier's recommended price) or most_shown_price (bol's most-shown non-promotional price over the last 90 days); discount_percent is against it. bol shows no price history and no 30-day lowest price.";
const IDS =
	'Product, EAN, category, seller and offer IDs are the same on every storefront; prices, offers and stock can differ between the Netherlands and Belgium.';
const BEFR =
	"On Belgium in French, bol's own texts are French, some partner titles stay Dutch and review texts are bol's translation (is_translated).";
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const searchSort = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'relevance',
	options: [
		{ name: 'Most Wished For', value: 'wishlist' },
		{ name: 'Popularity', value: 'popularity' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Rating', value: 'rating' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description:
		"Result order (no newest sort). Sorting by anything but Relevance can narrow bol's result set; price sorts follow bol's own ordering, so small inversions occur.",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const listSort = {
	displayName: 'Sort',
	name: 'sort',
	type: 'options' as const,
	default: 'popularity',
	options: [
		{ name: 'Most Wished For', value: 'wishlist' },
		{ name: 'Popularity', value: 'popularity' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Rating', value: 'rating' },
	],
	description:
		"Result order (Relevance is not offered on listing pages). Price sorts follow bol's own ordering, so small inversions occur.",
	routing: { request: { body: { sort: '={{ $value === "popularity" ? undefined : $value }}' } } },
};

const pageOption = (maxValue: number, description: string) => ({
	displayName: 'Page',
	name: 'page',
	type: 'number' as const,
	default: 1,
	typeOptions: { minValue: 1, maxValue },
	description,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const filterOptions = [
	{
		displayName: 'Brand Facet ID',
		name: 'brand_facet_id',
		type: 'string' as const,
		default: '',
		placeholder: '4294862300',
		description:
			'A brand value ID from the brand facet of an earlier response (facets[].values[].ID, e.g. 4294862300 = Apple). A different ID space from the Brand ID of Get Brand Products.',
		routing: { request: { body: { brand_facet_id: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Condition',
		name: 'condition',
		type: 'multiOptions' as const,
		default: [],
		options: [
			{ name: 'New', value: 'new' },
			{ name: 'Refurbished', value: 'refurbished' },
			{ name: 'Second-Hand', value: 'second_hand' },
		],
		description: 'One or more conditions',
		routing: {
			request: { body: { condition: '={{ $value && $value.length ? $value : undefined }}' } },
		},
	},
	{
		displayName: 'Deals Only',
		name: 'deals_only',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to return only products on a deal',
		routing: { request: { body: { deals_only: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Delivery',
		name: 'delivery',
		type: 'multiOptions' as const,
		default: [],
		options: [
			{ name: 'Evening', value: 'evening' },
			{ name: 'Free Shipping', value: 'free_shipping' },
			{ name: 'Sunday', value: 'sunday' },
			{ name: 'Today', value: 'today' },
			{ name: 'Tomorrow', value: 'tomorrow' },
		],
		description: 'Delivery filters as bol offers them',
		routing: {
			request: { body: { delivery: '={{ $value && $value.length ? $value : undefined }}' } },
		},
	},
	{
		displayName: 'Facet Value IDs',
		name: 'facets',
		type: 'string' as const,
		default: '',
		placeholder: '58334, 30639',
		description:
			'Comma-separated facet value IDs from facets[].values[].ID of an earlier response (any facet: colour, size, rating band), up to 10. IDs bol did not apply come back in filters_ignored.',
		routing: {
			request: {
				body: {
					facets:
						'={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}',
				},
			},
		},
	},
	{
		displayName: 'Max Price',
		name: 'price_max',
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest price in euros',
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'price_min',
		type: 'number' as const,
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest price in euros',
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Select Deals Only',
		name: 'select_deals',
		type: 'boolean' as const,
		default: false,
		description: 'Whether to return only bol Select member deals',
		routing: { request: { body: { select_deals: '={{ $value || undefined }}' } } },
	},
];

const byDisplayName = <T extends { displayName: string }>(items: T[]) =>
	[...items].sort((a, b) => a.displayName.localeCompare(b.displayName));

const listPage = pageOption(
	250,
	'Results page, 1-based, about 24 items per page (max_page in the response). A page past the end returns an empty page with a note.',
);

const byField = (
	op: string,
	byName: string,
	idName: string,
	idLabel: string,
	idWire: string,
	idPlaceholder: string,
	idDescription: string,
	urlLabel: string,
	urlDescription: string,
): INodeProperties[] => [
	{
		displayName: `${idLabel.replace(/ ID$/, '')} By`,
		name: byName,
		type: 'options',
		default: idName,
		options: [
			{ name: idLabel, value: idName },
			{ name: urlLabel, value: 'url' },
		],
		displayOptions: show([op]),
		description: 'How to identify it',
	},
	{
		displayName: idLabel,
		name: idName,
		type: 'string',
		required: true,
		default: '',
		placeholder: idPlaceholder,
		displayOptions: show([op], { [byName]: [idName] }),
		routing: { request: { body: { [idWire]: '={{ String($value) }}' } } },
		description: idDescription,
	},
	{
		displayName: urlLabel,
		name: `${idName}Url`,
		type: 'string',
		required: true,
		default: '',
		displayOptions: show([op], { [byName]: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: urlDescription,
	},
];

export const bolcomOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bolcom'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get bol com brand products',
				description: `Products of one brand by brand ID (items[].brand.brand_id, e.g. 5070005 = Apple) or link, paged and sorted (default Popularity): brand (brand_id, name, premium_brand) and ${ITEM}. ${PRICES} ${IDS} An unknown brand is a charged not-found. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/brand'),
			},
			{
				name: 'Get Campaign Products',
				value: 'campaign',
				action: 'Get bol com campaign products',
				description: `The products of one bol.com promotion (a Black Friday deal list, the day deal) by campaign ID or link, paged and sorted (default Popularity): campaign (campaign_id, name, description, type, ends_at) and ${ITEM}. ${PRICES} An ended or unknown campaign is a charged not-found. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/campaign'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get bol com category products',
				description: `Products in one category, paged, sorted (default Popularity) and filtered like Search Products: category (category_id, name, URL, breadcrumbs) and ${ITEM}. ${PRICES} ${IDS} ${BEFR} An unknown category is a charged not-found. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get bol com deals',
				description: `Today's bol.com deals: day_deal (title, campaign_id, URL, ends_at, highlighted_product) and category_deals (products with product_id, title, URL, image and offer with price, reference price and discount; seller_id only). Open the day deal with Get Campaign Products. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/deals'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get bol com offers',
				description: `Every seller's offer for one product, for price comparison and price monitoring: counts (new, refurbished, second_hand) and offers (offer_id, price, reference price, condition with refurbished_grade or second_hand_state, shipping_cost, delivery_text, delivery_date, seller with seller_id, name, rating out of 10, rating_percent and top_seller, labels). The list does not mark the buy box: Get Product's buy_box.offer_id names it. ${PRICES} ${IDS} An unknown product is a charged not-found. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/offers'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a bol com product',
				description: `One product by product ID, link or EAN (competitor prices): EAN, specifications, category_path, buy_box (price, reference price and type, discount, seller with rating out of 10, shipping_cost, delivery promise), offer_count, cheapest_new, fastest_new, cheapest_second_hand, refurbished grades, rating with 1-5 distribution, review_topics and review_summary (bol's own AI summaries) and the first 10 reviews (pooled across the product family, no reviewer names). No review paging, price history, pickup points or Select member prices. ${PRICES} ${IDS} ${BEFR} An unknown product is a charged not-found. ${CHARGE} Costs 2 credits; 4 by EAN.`,
				routing: request('/api/v1/bolcom/product'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a bol com seller',
				description: `A seller's public profile by seller ID or link: rating out of 10 with product_info, delivery_time, shipping and service sub-ratings, positive_percent, review totals, product_count and business (company_name, city, country, registration_number, vat_number as bol publishes them; no street address). No review texts. An unknown seller is a charged not-found. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/seller'),
			},
			{
				name: 'Get Seller Products',
				value: 'sellerProducts',
				action: 'Get bol com seller products',
				description: `The products a seller sells, by seller ID or link, paged and sorted (default Popularity): seller (seller_id, name) and ${ITEM}. Each item's offer is the product's buy box, which may be another seller's. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/seller-products'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search bol com products',
				description: `Search bol.com by keyword: ${ITEM}, dominant_category. Up to page 10 (about 280 results). Filters for price, condition, deals, Select deals, delivery, category, brand facet and any facet value. Sponsored items are flagged. ${PRICES} ${IDS} ${BEFR} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/bolcom/search'),
			},
		],
		default: 'search',
	},
];

export const bolcomFields: INodeProperties[] = [
	// -- Storefront --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Belgium', value: 'be' },
			{ name: 'Netherlands', value: 'nl' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { country: '={{ $value === "nl" ? undefined : $value }}' } } },
		description:
			'The bol.com storefront country (EUR). IDs are the same on every storefront; prices, offers and stock can differ.',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: 'nl',
		options: [
			{ name: 'Dutch', value: 'nl' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(ALL_OPS, { country: ['be'] }),
		routing: { request: { body: { language: '={{ $value === "fr" ? "fr" : undefined }}' } } },
		description: 'The Belgian storefront in Dutch or French',
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'airpods',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords (Dutch or French work best; an EAN finds that product)',
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'productId',
		options: [
			{ name: 'EAN (4 Credits)', value: 'ean' },
			{ name: 'Product ID', value: 'productId' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the product',
	},
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9300000239314960',
		displayOptions: show(['product'], { productBy: ['productId'] }),
		routing: { request: { body: { product_id: '={{ String($value) }}' } } },
		description: 'A bol.com product ID (items[].product_id of a search response; 16 digits)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			"A bol.com product link; the link's storefront is used unless Country is set to Belgium",
	},
	{
		displayName: 'EAN',
		name: 'ean',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4242005483976',
		displayOptions: show(['product'], { productBy: ['ean'] }),
		routing: { request: { body: { ean: '={{ String($value) }}' } } },
		description:
			'An EAN / GTIN (8, 12, 13 or 14 digits). Costs 4 credits: a search plus the product page.',
	},

	// -- Get Offers --
	...byField(
		'offers',
		'offersBy',
		'offersProductId',
		'Product ID',
		'product_id',
		'9300000240171936',
		'A bol.com product ID (16 digits)',
		'Product URL',
		'A bol.com product link or its price overview link',
	),

	// -- Get Seller, Get Seller Products --
	...byField(
		'seller',
		'sellerBy',
		'sellerId',
		'Seller ID',
		'seller_id',
		'1770745',
		'A bol.com seller ID (offer.seller_id of a response; 0 is bol itself)',
		'Seller URL',
		'A bol.com seller page link',
	),
	...byField(
		'sellerProducts',
		'sellerProductsBy',
		'sellerProductsId',
		'Seller ID',
		'seller_id',
		'1767374',
		'A bol.com seller ID (offer.seller_id of a response)',
		'Seller URL',
		'A bol.com seller page link',
	),

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'categoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8440',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ String($value) }}' } } },
		description:
			'A bol.com category ID (category_path[].category_id of a product, or the category facet of a search)',
	},

	// -- Get Brand Products --
	...byField(
		'brand',
		'brandBy',
		'brandId',
		'Brand ID',
		'brand_id',
		'5070005',
		'A bol.com brand ID (items[].brand.brand_id, e.g. 5070005 = Apple). Not the Brand Facet ID search filter.',
		'Brand URL',
		'A bol.com brand page link',
	),

	// -- Get Campaign Products --
	...byField(
		'campaign',
		'campaignBy',
		'campaignId',
		'Campaign ID',
		'campaign_id',
		'555136',
		'A bol.com campaign ID (labels[].campaign_id of an offer, or day_deal.campaign_id of Get Deals)',
		'Campaign URL',
		'A bol.com campaign (promotion) link',
	),

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: byDisplayName([
			...filterOptions,
			pageOption(
				10,
				'Results page, 1-based, about 24-30 items per page. bol.com search stops at page 10.',
			),
			searchSort,
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string' as const,
				default: '',
				placeholder: '8440',
				description: 'Search within one category',
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
		]),
	},

	// -- Additional Options: Get Category Products --
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: byDisplayName([...filterOptions, listPage, listSort]),
	},

	// -- Additional Options: Get Seller Products, Get Brand Products, Get Campaign Products --
	{
		displayName: 'Additional Options',
		name: 'listOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerProducts', 'brand', 'campaign']),
		options: byDisplayName([listPage, listSort]),
	},
];
