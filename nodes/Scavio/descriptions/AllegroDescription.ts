import type { INodeProperties } from 'n8n-workflow';

const show = (
	operation: string[],
	extra: Record<string, Array<string | number | boolean>> = {},
) => ({
	show: { resource: ['allegro'], operation, ...extra },
});

// Allegro (allegro.pl, plus allegro.cz, allegro.sk and allegro.hu on every operation), 7
// operations, 2 credits each. Buying Format and Deals Only are pl only (a 400 elsewhere). sk and
// hu calls can take up to about a minute, so every route carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ALL_OPERATIONS = [
	'search',
	'offer',
	'product',
	'productOffers',
	'seller',
	'sellerFeedback',
	'category',
];

const COUNTRY_OPTIONS = [
	{ name: 'Czechia (Allegro.cz, CZK, Czech)', value: 'cz' },
	{ name: 'Hungary (Allegro.hu, HUF, Hungarian)', value: 'hu' },
	{ name: 'Poland (Allegro.pl, PLN, Polish)', value: 'pl' },
	{ name: 'Slovakia (Allegro.sk, EUR, Slovak)', value: 'sk' },
];

const ITEM =
	"Items with offer_id (for Get Offer), product_id (for Get Product and Get Product Offers), title, URL, image, price and currency, buy_now_price (auctions), price_with_delivery (when the page shows it), free_delivery, delivery_text, condition, is_auction with auction_ends_in, discount_percent and lowest_price_30d, seller (ID, login, super_seller, positive_feedback_percent, is_business), rating and rating_count, sold_count ('x people bought recently' as a number; null on auctions) with sold_label, smart (Allegro Smart!), offers_count, stock, placement (regular, promoted, sponsored or featured) with is_sponsored, and source (allegro, or allegro_lokalnie for Allegro Lokalnie offers inside Poland results).";

const GRID =
	ITEM +
	' Also total (exact), total_pages (at most 100), page, page_size (60 organic per page; sponsored slots come on top), sort, applied_filters, facets (every filter with its values and offer counts), country, language and currency.';

const OMNIBUS =
	'lowest_price_30d is the EU price disclosure Allegro shows next to a discount: the lowest price in the 30 days before the discount. It is null without a discount and is not a price history: to track prices, poll and store your own.';

const NOTE =
	"Titles, parameters and labels come back in the site's language (Polish on Poland). sk and hu calls can take up to about a minute. Failed upstream calls are not charged (they are retried automatically); a not-found is charged. Costs 2 credits.";

const SORT_OPTIONS = [
	{ name: 'Ending Soonest (Auctions)', value: 'ending_soonest' },
	{ name: 'Newest', value: 'newest' },
	{ name: 'Popularity', value: 'popularity' },
	{ name: 'Price With Delivery: High to Low', value: 'price_with_delivery_high_to_low' },
	{ name: 'Price With Delivery: Low to High', value: 'price_with_delivery_low_to_high' },
	{ name: 'Price: High to Low', value: 'price_high_to_low' },
	{ name: 'Price: Low to High', value: 'price_low_to_high' },
	{ name: 'Relevance', value: 'relevance' },
];

const PAGE: INodeProperties = {
	displayName: 'Page',
	name: 'page',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Results page, 1-based (up to 100). 60 organic offers per page.',
	routing: { request: { body: { page: '={{ $value }}' } } },
};

const PRICE_CONDITION_OPTIONS: INodeProperties[] = [
	{
		displayName: 'Allegro Smart! Only',
		name: 'smart',
		type: 'boolean',
		default: false,
		description:
			'Whether to return only offers with Allegro Smart! (free delivery and returns for members)',
		routing: { request: { body: { smart: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Condition',
		name: 'condition',
		type: 'options',
		default: 'new',
		options: [
			{ name: 'New', value: 'new' },
			{ name: 'Used', value: 'used' },
		],
		description: 'Only new or only used offers',
		routing: { request: { body: { condition: '={{ $value }}' } } },
	},
	{
		displayName: 'Max Price',
		name: 'max_price',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Highest price, in the site's currency",
		routing: { request: { body: { max_price: '={{ $value }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'min_price',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Lowest price, in the site's currency",
		routing: { request: { body: { min_price: '={{ $value }}' } } },
	},
];

const GRID_OPTIONS: INodeProperties[] = [
	...PRICE_CONDITION_OPTIONS,
	{
		displayName: 'Buying Format',
		name: 'buying_format',
		type: 'options',
		default: 'buy_now',
		options: [
			{ name: 'Auction', value: 'auction' },
			{ name: 'Buy Now (Fixed Price)', value: 'buy_now' },
		],
		description: 'Poland only: buy now (fixed price) or auction offers',
		routing: { request: { body: { buying_format: '={{ $value }}' } } },
	},
	{
		displayName: 'Deals Only',
		name: 'deals',
		type: 'boolean',
		default: false,
		description:
			"Whether to return only offers in Allegro's deals and promotions zone, seasonal campaign deals such as Black Weeks included while they run (Poland only)",
		routing: { request: { body: { deals: '={{ $value || undefined }}' } } },
	},
	PAGE,
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: SORT_OPTIONS,
		description:
			'Relevance (default), price, price with delivery, popularity, ending soonest or newest. Sponsored slots are not sorted; where the site shows promoted offers as their own block, each block is in sort order.',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const sorted = (options: INodeProperties[]) =>
	[...options].sort((x, y) => x.displayName.localeCompare(y.displayName));

const isUrl = '/^https?:\\/\\//i.test($value)';

export const allegroOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['allegro'] } },
		options: [
			{
				name: 'Get Category Offers',
				value: 'category',
				action: 'Get allegro category offers',
				description:
					"One Allegro category's offers by ID or link, with the same sorts and filters as Search Offers and an optional query, plus the category (ID, name, URL, breadcrumb, subcategories or sibling categories with offer counts). " +
					GRID +
					' ' +
					NOTE,
				routing: request('/api/v1/allegro/category'),
			},
			{
				name: 'Get Offer',
				value: 'offer',
				action: 'Get an allegro offer',
				description:
					"One Allegro offer (one seller's listing) by number or link: title, condition, status, price, original_price and lowest_price_30d with discount_percent on a discount, price_with_delivery, stock, sold_count (null on auctions and on cz, sk and hu offers), auction state (current price, minimum next bid, bid step, end time, whether anyone has bid; no bid history) or buy now price, every parameter (EAN / GTIN, brand, model...), gtin, brand, the description as plain text, images, breadcrumb, delivery methods with price and estimated delivery, handling time, returns, warranty, the product's rating and offer count, and the seller (login, super seller, positive feedback percent and counts, is_business, company_name for business sellers). " +
					OMNIBUS +
					' ' +
					NOTE,
				routing: request('/api/v1/allegro/offer'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an allegro product',
				description:
					"One Allegro catalogue product (one item that groups many sellers' offers) by ID or link: title, brand, GTIN, parameters, images, breadcrumb, description, lowest_price and offer_count (every seller's offer is on Get Product Offers), the cheapest and fastest offers as the page highlights them, the featured (buy box) offer, how many people bought it recently, the rating (average, count, 1-5 star distribution), review aspects and the first 20 reviews as shown on the product page (rating, text, pros, cons, author as published, date, helpful votes, images, is_best). Not the full review history. " +
					NOTE,
				routing: request('/api/v1/allegro/product'),
			},
			{
				name: 'Get Product Offers',
				value: 'productOffers',
				action: 'Get every seller offer for an allegro product',
				description:
					"Every seller's offer for one Allegro catalogue product: the price comparison page, for price monitoring across sellers. 60 offers per page, sortable by price or price with delivery and filterable by condition, price and Allegro Smart!. Each offer has price, price_with_delivery, delivery_text, condition, seller (login, super seller, positive feedback percent and count, is_business), smart, stock where shown, is_featured (the buy box offer) and the listing fields of Search Offers. Also total, total_pages, page and facets. " +
					NOTE,
				routing: request('/api/v1/allegro/product-offers'),
			},
			{
				name: 'Get Seller Feedback',
				value: 'sellerFeedback',
				action: 'Get allegro seller feedback',
				description:
					"One Allegro seller's buyer ratings: summary (recommended and not recommended counts, unique counts, positive_percent, received, excluded and removed ratings, member_since, super_seller) and 20 ratings per page, newest first, each with recommended yes / no, comment, the reasons given, date, the offers rated, and whether it was excluded from the score and why. No buyer identity is returned. " +
					NOTE,
				routing: request('/api/v1/allegro/seller-feedback'),
			},
			{
				name: 'Get Seller Offers',
				value: 'seller',
				action: 'Get allegro seller offers',
				description:
					"One Allegro seller's offers by login, with the seller (ID, login, is_business, URL; the super seller status, feedback score and member since are on Get Seller Feedback), whether the seller is active, and the categories the seller sells in (with offer counts and a slug for Seller Category); search within the seller's offers with the search sorts and filters. No seller address or tax ID. " +
					GRID +
					' ' +
					NOTE,
				routing: request('/api/v1/allegro/seller'),
			},
			{
				name: 'Search Offers',
				value: 'search',
				action: 'Search allegro offers',
				description:
					'Search Allegro, the largest marketplace in Poland and Central Europe, by keyword: sort by price, price with delivery, popularity, ending soonest or newest; filter by price range, new or used, buy now or auction (Poland), Allegro Smart! and deals (Poland); optionally inside one category. Sponsored and promoted offers are flagged. Misspellings are not corrected. ' +
					GRID +
					' ' +
					OMNIBUS +
					' ' +
					NOTE,
				routing: request('/api/v1/allegro/search'),
			},
		],
		default: 'search',
	},
];

export const allegroFields: INodeProperties[] = [
	// -- Market (every operation) --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'pl',
		options: COUNTRY_OPTIONS,
		displayOptions: show(ALL_OPERATIONS),
		routing: { request: { body: { country: '={{ $value === "pl" ? undefined : $value }}' } } },
		description:
			"The Allegro site. Titles and labels come in the site's language, prices in its currency (PLN, CZK, EUR or HUF).",
	},

	// -- Search Offers --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'laptop',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords, in any language. Misspellings are not corrected.',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: '491',
				description:
					'Search inside one category: a category ID (the category or a breadcrumb entry of an offer, e.g. 491 = laptops) or its slug (laptopy-491)',
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
			...GRID_OPTIONS,
		]),
	},

	// -- Get Offer --
	{
		displayName: 'Offer ID or URL',
		name: 'offer',
		type: 'string',
		required: true,
		default: '',
		placeholder: '17858046919',
		displayOptions: show(['offer']),
		routing: {
			request: {
				body: {
					url: `={{ ${isUrl} ? $value : undefined }}`,
					offer_id: `={{ ${isUrl} ? undefined : $value }}`,
				},
			},
		},
		description:
			'An offer number (items[].offer_id of a search, category or seller result) or an offer link (allegro.pl/oferta/..., or a product link with ?offerId=; any of the four sites)',
	},

	// -- Get Product / Get Product Offers --
	{
		displayName: 'Product ID or URL',
		name: 'product',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90d08230-e02a-4210-913d-d417453321b8',
		displayOptions: show(['product', 'productOffers']),
		routing: {
			request: {
				body: {
					url: `={{ ${isUrl} ? $value : undefined }}`,
					product_id: `={{ ${isUrl} ? undefined : $value }}`,
				},
			},
		},
		description:
			'A catalogue product ID (a uuid: items[].product_id of a search or product_id of an offer) or a product link (allegro.pl/produkt/..., any of the four sites)',
	},
	{
		displayName: 'Additional Options',
		name: 'productOffersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['productOffers']),
		options: sorted([
			...PRICE_CONDITION_OPTIONS,
			PAGE,
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: SORT_OPTIONS.filter((o) => o.value !== 'ending_soonest' && o.value !== 'newest'),
				description: 'Relevance (default), price, price with delivery or popularity',
				routing: {
					request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
				},
			},
		]),
	},

	// -- Get Seller Offers / Get Seller Feedback --
	{
		displayName: 'Seller Login',
		name: 'login',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Yupilo_pl',
		displayOptions: show(['seller', 'sellerFeedback']),
		routing: { request: { body: { login: '={{ $value }}' } } },
		description: 'A seller login: items[].seller.login of a search or seller.login of an offer',
	},
	{
		displayName: 'Additional Options',
		name: 'sellerOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['seller']),
		options: sorted([
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: "Search within the seller's offers",
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Seller Category',
				name: 'category',
				type: 'string',
				default: '',
				placeholder: 'komputery',
				description:
					"Only one of the seller's categories: categories[].slug of a previous Get Seller Offers result",
				routing: { request: { body: { category: '={{ $value || undefined }}' } } },
			},
			...GRID_OPTIONS,
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'sellerFeedbackOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerFeedback']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Ratings page, 1-based (up to 500). 20 ratings per page, newest first.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Category Offers --
	{
		displayName: 'Category ID or URL',
		name: 'categoryRef',
		type: 'string',
		required: true,
		default: '',
		placeholder: '491',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					url: `={{ ${isUrl} ? $value : undefined }}`,
					category_id: `={{ ${isUrl} ? undefined : $value }}`,
				},
			},
		},
		description:
			'A category ID (e.g. 491 = laptops), its slug (laptopy-491) or a category link (allegro.pl/kategoria/..., any of the four sites): take it from the breadcrumb of an offer or the subcategories of a category result',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Search within the category',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			...GRID_OPTIONS,
		]),
	},
];
