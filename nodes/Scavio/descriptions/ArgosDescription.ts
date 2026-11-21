import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['argos'], operation, ...extra },
});

// Argos, 10 operations, 2 credits each. One store: argos.co.uk (UK, GBP), so there is no Country
// (Argos Ireland closed in 2023). Calls can queue behind the backend's upstream limit, so every
// operation carries a 240s timeout, like Fashion Nova.
// emptyBody: a base body {} so Get Categories (no inputs) still posts JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const PRODUCT_OPS = ['product', 'reviews', 'questions'];

const PRICES =
	"Prices are numbers in GBP as Argos shows them: price, was_price (the site's was price), save (computed by Scavio as was_price - price), offer_text (the site's own words, e.g. Half Price) and badges as given (e.g. Black_Friday, price_guarantee). seller is argos or trusted_seller (Argos's marketplace). No price history: schedule a workflow to track changes.";
const ITEM =
	'items with product_id, URL, name, brand, price, was_price, save, offer_text, clearance, badges, rating, review_count, seller, deliverable, reservable, free_delivery, delivery_cost and image';
const LIST =
	'plus total, total_capped (Argos stops counting at 10,000: true means 10,000 or more), total_pages, has_more, count, tu_clothing_excluded (Tu Clothing items Argos lists but sells on its own site: left out) and facets (the filter inputs the list offers).';
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const pageOption = (max: number, description: string): INodeProperties => ({
	displayName: 'Page',
	name: 'page',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const offersOption: INodeProperties = {
	displayName: 'Offers',
	name: 'argosOffers',
	type: 'multiOptions',
	default: [],
	options: [
		{ name: 'Black Friday', value: 'black_friday' },
		{ name: 'Clearance', value: 'clearance' },
		{ name: 'Special Offer', value: 'special_offer' },
	],
	description: 'Only products on these offers (several = OR)',
	routing: {
		request: { body: { offers: '={{ $value && $value.length ? $value : undefined }}' } },
	},
};

const categoryOption: INodeProperties = {
	displayName: 'Category ID',
	name: 'argosCategory',
	type: 'string',
	default: '',
	placeholder: '29560',
	description: 'Category ID from Get Categories (category_id) or the category facet, e.g. 29560 Kettles',
	routing: { request: { body: { category: '={{ $value || undefined }}' } } },
};

const queryOption: INodeProperties = {
	displayName: 'Text Within',
	name: 'argosWithin',
	type: 'string',
	default: '',
	placeholder: 'lego',
	description: 'Optional search text inside the list',
	routing: { request: { body: { query: '={{ $value || undefined }}' } } },
};

const filterOptions: INodeProperties[] = [
	{
		displayName: 'Brands',
		name: 'argosBrand',
		type: 'string',
		default: '',
		placeholder: 'ninja, tower',
		description:
			'Brands (facets name brands, values in lower case, e.g. russell hobbs), up to 10, separated by commas (OR)',
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Colour Groups',
		name: 'argosShadeGroups',
		type: 'string',
		default: '',
		placeholder: 'blacks, whites',
		description: 'Colour groups (facets name colour group), up to 10, separated by commas',
		routing: { request: { body: { colour: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Filters (JSON)',
		name: 'filters',
		type: 'json',
		default: '',
		placeholder: '{ "kettle capacity (l)": "1.6l - 2.0l" }',
		description:
			"Any facet by facets[].name: { facet: value or [values] }, with values from an earlier response's facets list. Up to 10 facets.",
		routing: {
			request: {
				body: {
					filters:
						'={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
				},
			},
		},
	},
	{
		displayName: 'Max Price',
		name: 'price_max',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest price, GBP',
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'price_min',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest price, GBP',
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Rating',
		name: 'argosRatingMin',
		type: 'options',
		default: 0,
		options: [
			{ name: '1 Star or More', value: 1 },
			{ name: '2 Stars or More', value: 2 },
			{ name: '3 Stars or More', value: 3 },
			{ name: '4 Stars or More', value: 4 },
			{ name: '5 Stars Only', value: 5 },
			{ name: 'Any', value: 0 },
		],
		description: 'Customer rating filter',
		routing: { request: { body: { rating_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'New In Only',
		name: 'argosNewIn',
		type: 'boolean',
		default: false,
		description: 'Whether to return only products Argos marks New In',
		routing: { request: { body: { new_in: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Seller',
		name: 'argosSeller',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Argos', value: 'argos' },
			{ name: 'Trusted Seller (Marketplace)', value: 'trusted_seller' },
		],
		description: "Argos (sold and fulfilled by Argos) or Trusted Seller (Argos's marketplace of third-party sellers)",
		routing: { request: { body: { seller: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Customer Rating', value: 'rating' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: "Result order (Relevance is Argos's Most Popular, the default)",
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	pageOption(200, 'Page, 24 products each, 1 to 200 (total_pages says how deep the list goes)'),
];

const storeSearchOptions: INodeProperties[] = [
	{
		displayName: 'Max Distance (Miles)',
		name: 'argosMaxDistance',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 50 },
		description: 'Search radius in miles, 1 to 50',
		routing: { request: { body: { max_distance: '={{ $value === 50 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Max Stores',
		name: 'argosMaxResults',
		type: 'number',
		default: 10,
		typeOptions: { minValue: 1, maxValue: 10 },
		description: 'Stores to return, 1 to 10 (10 is the most Argos returns)',
		routing: { request: { body: { max_results: '={{ $value === 10 ? undefined : $value }}' } } },
	},
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

export const argosOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['argos'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get argos categories',
				description: `Argos's department tree (14 departments) with groups and links, each with a category_id for Get Category Products. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get argos category products',
				description: `One category's products by category ID, 24 per page: ${ITEM}, ${LIST} Filters and sorts as in Search Products. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get argos deals',
				description: `Argos deal collections: Black Friday, Clearance and Special Offers as full lists (24 per page, with filters and sorts), or Top 100, Argos's own Top 100 deals list (2 pages of 60, page only): ${ITEM}. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an argos product',
				description: `One product by ID or link: template (argos or trusted_seller), EAN, price, was_price, save, offer_text, badges with start and end dates (one entry per badge code), rating (null without reviews), features, variants, special offers, Nectar points, care plans, payment options, bundles, breadcrumb, rating distribution, question and answer counts and the first 10 reviews. Trusted Seller items carry the fields their page shows (seller_name is null: the page names no seller). A withdrawn or unknown product is a charged 404; a Tu Clothing ID is a 400. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get argos questions',
				description: `One product's customer questions with their answers (text, source: staff, brand or customer, best_answer, helpful counts), up to 50 per page. No asker or answerer names. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/questions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get argos reviews',
				description: `One product's reviews, up to 100 per page with every review reachable, five sorts and a star filter: total, summary (Argos's own AI-generated summary of the reviews, labelled as such), stats and reviews (rating, title, text, submitted_at, recommended, helpful counts, syndicated and syndication_source, argos_colleague, photos, brand_response presence and date). No reviewer names, locations, ages or genders. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get argos search suggestions',
				description: `Argos's search suggestions for a partial query, each with Argos's popularity weight, in Argos's order (not sorted by weight). ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/suggestions'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get argos store stock',
				description: `Whether 1 to 10 Argos products can be collected at the Argos stores near a UK postcode (nearest first, up to 10 within 50 miles) and delivered to a postcode. Each store has a state per product: collect_now, collect_today, collect_tomorrow, collect_later, out_of_stock or not_available, with available_from and the site's message; delivery is same_day (Fast Track), next_day, later (Argos's "Delivery within N days", with days = N), out_of_stock or not_available; quote delivery from state and message (available_from is the date Argos returns, as given). Store types: argos_store (a standalone Argos store), inside_sainsburys (an Argos counter inside a Sainsbury's store), collection_point (a collect-only point, no shop). A postcode that does not exist gets no answer from Argos: an unbilled 502 after about 50 seconds. Availability states, not unit counts (Argos shows none). Trusted Seller items are never stocked in stores (400). ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/store-stock'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get argos stores',
				description: `Argos stores near a UK postcode (nearest first, up to 10 within 50 miles; type argos_store, inside_sainsburys (an Argos counter inside a Sainsbury's store) or collection_point (collect-only, no shop), distance, address, phone (+44...), hours), or one store by its reference (stores[].store) with opening hours, special hours and services. No stock: use Get Store Stock. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/stores'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search argos products',
				description: `Search Argos for prices, was prices, offers and badges, 24 per page up to page 200: ${ITEM}, ${LIST} Not available: unit counts, price history, a brand directory (brand is a filter), Argos Ireland, card or checkout prices, Argos Pay terms. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/argos/search'),
			},
		],
		default: 'search',
	},
];

export const argosFields: INodeProperties[] = [
	// -- Keywords --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'air fryer',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search text',
	},
	{
		displayName: 'Partial Query',
		name: 'suggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lego',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'argosCategoryId',
		type: 'string',
		required: true,
		default: '29560',
		placeholder: '29560',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description:
			'Category ID from Get Categories (any level), the category facet, or the number after c: in an argos.co.uk browse link (29560 Kettles, 29575 Air fryers)',
	},

	// -- Get Deals --
	{
		displayName: 'Collection',
		name: 'argosCollection',
		type: 'options',
		required: true,
		default: 'black_friday',
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Special Offers', value: 'special_offers' },
			{ name: 'Top 100', value: 'top_100' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { collection: '={{ $value }}' } } },
		description:
			"Black Friday, Clearance and Special Offers (Half Price, Save £X, multi-buys) are full lists; Top 100 is Argos's own Top 100 deals list (page only)",
	},

	// -- Get Product, Get Reviews, Get Questions --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Product ID', value: 'id' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(PRODUCT_OPS),
		description: 'How to identify the product',
	},
	{
		displayName: 'Product ID',
		name: 'argosProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8377058',
		displayOptions: show(PRODUCT_OPS, { productBy: ['id'] }),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'A 7-digit Argos catalogue number (items[].product_id) or a Trusted Seller item ID (8 letters and digits)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.argos.co.uk/product/8377058/',
		displayOptions: show(PRODUCT_OPS, { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'An argos.co.uk product link',
	},

	// -- Get Store Stock --
	{
		displayName: 'Product IDs',
		name: 'argosProductIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8377058, 7163184',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { product_ids: '={{ $value }}' } } },
		description: '1 to 10 Argos catalogue numbers (7 digits), separated by commas',
	},
	{
		displayName: 'Postcode',
		name: 'argosPostcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'SW1A 1AA',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { postcode: '={{ $value }}' } } },
		description: 'A full UK postcode: where Argos stores are searched (and delivery is checked, unless Delivery Postcode is set)',
	},

	// -- Get Stores --
	{
		displayName: 'Stores By',
		name: 'argosStoresBy',
		type: 'options',
		default: 'postcode',
		options: [
			{ name: 'Near a Postcode', value: 'postcode' },
			{ name: 'One Store', value: 'store' },
		],
		displayOptions: show(['stores']),
		description: 'Stores near a UK postcode, or one store in detail',
	},
	{
		displayName: 'Postcode',
		name: 'argosStoresPostcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'M1 1AE',
		displayOptions: show(['stores'], { argosStoresBy: ['postcode'] }),
		routing: { request: { body: { postcode: '={{ $value }}' } } },
		description: 'A full UK postcode',
	},
	{
		displayName: 'Store',
		name: 'argosStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '661-manchester-arndale-argos',
		displayOptions: show(['stores'], { argosStoresBy: ['store'] }),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description:
			'The stores[].store of a Get Stores or Get Store Stock response, or the store\'s argos.co.uk/stores/... link. A bare store ID is not accepted.',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([...filterOptions, categoryOption, offersOption]),
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([...filterOptions, offersOption, queryOption]),
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			...filterOptions.filter((o) => o.name !== 'page'),
			categoryOption,
			queryOption,
			pageOption(200, 'Page: 24 products each, or 1 to 2 (60 each) for Top 100'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'storeStockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeStock']),
		options: sorted([
			{
				displayName: 'Delivery Postcode',
				name: 'argosDeliveryPostcode',
				type: 'string',
				default: '',
				placeholder: 'M1 1AE',
				description: 'Postcode for home delivery availability (empty: Postcode)',
				routing: { request: { body: { delivery_postcode: '={{ $value || undefined }}' } } },
			},
			...storeSearchOptions,
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores'], { argosStoresBy: ['postcode'] }),
		options: sorted([...storeSearchOptions]),
	},
	{
		displayName: 'Additional Options',
		name: 'reviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Per Page',
				name: 'argosReviewLimit',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews per page, 1 to 100',
				routing: { request: { body: { limit: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			pageOption(10000, 'Page (page times Per Page up to total)'),
			{
				displayName: 'Sort',
				name: 'reviewSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: "Review order (Most Helpful is Argos's helpfulness order: the share of helpful votes)",
				routing: {
					request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Star Ratings',
				name: 'argosStars',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with these star ratings',
				routing: {
					request: { body: { rating: '={{ $value && $value.length ? $value : undefined }}' } },
				},
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'questionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['questions']),
		options: sorted([
			{
				displayName: 'Per Page',
				name: 'argosQuestionLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Questions per page, 1 to 50',
				routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			pageOption(10000, 'Page'),
			{
				displayName: 'Sort',
				name: 'questionSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Question order',
				routing: {
					request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } },
				},
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'suggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Number of Suggestions',
				name: 'argosSuggestLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Suggestions to return, 1 to 10',
				routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
			},
		],
	},
];
