import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['tcgplayer'], operation, ...extra },
});

// TCGplayer (tcgplayer.com, US marketplace, USD), 13 operations, 1 credit each. Get
// Product, Get Listings, Get Price History and Get Recent Sales take a product ID or a
// tcgplayer.com product URL. Every route carries a 120s timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const PRODUCT_FIELDS =
	'product ID, name, URL, image, game, set name, code and ID, card number, rarity, product type, sealed and foil-only flags, release date, market price, median price, lowest price, lowest price with shipping and listing count';

const CONDITIONS =
	'Near Mint, Lightly Played, Moderately Played, Heavily Played, Damaged, Unopened (or NM, LP, MP, HP, DM, U)';

const SEARCH_SORTS = [
	{ name: 'Best Match', value: 'best_match' },
	{ name: 'Best Selling', value: 'best_selling' },
	{ name: 'Market Price: High to Low', value: 'price_desc' },
	{ name: 'Market Price: Low to High', value: 'price_asc' },
	{ name: 'Name: A to Z', value: 'name_asc' },
	{ name: 'Relevance', value: 'relevance' },
];

const SEARCH_SORT_DESCRIPTION =
	'Relevance (default), best match, best selling, name or market price. Relevance and best match rankings shift between calls and page 2+ drops products already seen (duplicates_removed), so a price or name sort pages more predictably.';

const gameOption = {
	displayName: 'Game',
	name: 'game',
	type: 'string' as const,
	default: '',
	placeholder: 'pokemon',
	description:
		'Game (product line) url_name from Get Games: pokemon, magic, yugioh, pokemon-japan, one-piece-card-game, lorcana-tcg and more',
	routing: { request: { body: { game: '={{ $value || undefined }}' } } },
};

const searchPaging = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number' as const,
		default: 50,
		typeOptions: { minValue: 1 },
		hint: 'Products per page, 1 to 50. The API default is 24.',
		description: 'Max number of results to return',
		routing: { request: { body: { limit: '={{ $value }}' } } },
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number' as const,
		default: 1,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: 'Results page, 1-based, up to 200. Defaults to 1.',
		routing: { request: { body: { page: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options' as const,
		default: 'relevance',
		options: SEARCH_SORTS,
		description: SEARCH_SORT_DESCRIPTION,
		routing: { request: { body: { sort: '={{ $value }}' } } },
	},
];

const conditionOption = (description: string) => ({
	displayName: 'Condition',
	name: 'condition',
	type: 'string' as const,
	default: '',
	placeholder: 'Near Mint, Lightly Played',
	description,
	routing: { request: { body: { condition: '={{ $value || undefined }}' } } },
});

export const tcgplayerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tcgplayer'] } },
		options: [
			{
				name: 'Get Games',
				value: 'games',
				action: 'Get tcgplayer games',
				description:
					'Every game (product line) on TCGplayer, 70+ (Magic: The Gathering, Yu-Gi-Oh!, Pokemon, One Piece, Lorcana...): game ID, name, url_name (what Search Products, Get Sets and Get Seller Products accept as Game) and whether TCGplayer Direct carries it. No parameters. Costs 1 credit.',
				routing: {
					request: { method: 'POST', url: '/api/v1/tcgplayer/games', timeout: 120000, body: {} },
				},
			},
			{
				name: 'Get Listings',
				value: 'listings',
				action: 'Get tcgplayer product listings',
				description:
					'Live marketplace listings for one TCGplayer product (US, USD), cheapest first by price plus shipping (default) or by item price, up to 50 per page, filtered by condition, printing, language, verified sellers or TCGplayer Direct. Each listing has listing ID, price, shipping, total, quantity, condition, printing, language, listing type (standard or custom) and the seller: key, ID, name, URL, rating percent, sales band, gold star, verified and Direct flags, programs and location. Also total_results, has_more and condition / printing / language / listing type counts. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/listings'),
			},
			{
				name: 'Get Price Guide',
				value: 'priceGuide',
				action: 'Get a tcgplayer set price guide',
				description:
					'The TCGplayer price guide for one whole set (US, USD): one row per product per condition and printing with product ID, name, URL, card number, rarity, market price and low price, for cards (default) or sealed products, up to 500 rows per page. total_results is given for cards (null for sealed). A set with nothing in the guide is an error. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/price-guide'),
			},
			{
				name: 'Get Price History',
				value: 'priceHistory',
				action: 'Get tcgplayer price history',
				description:
					'Sales price history for one TCGplayer product (US, USD) over a month, quarter (default), half year or year, per SKU (condition, printing, language): total quantity sold, transaction count, average daily sales, and buckets newest first (daily for month, 3-day for quarter, weekly for semi-annual and annual) with market price, quantity sold, transaction count and the low and high sale price with and without shipping (null for a bucket with no sales). Totals across SKUs included. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/price-history'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a tcgplayer product',
				description:
					"One TCGplayer product (US, USD) by product ID or URL: name, URL, images (200, 400 and 1000 px), game, set, card number, rarity, product type, release date, market, median and lowest listing price, listing and seller counts, card text, flavor text, the game's card attributes (Pokemon HP, stage, attacks...; Magic color, mana value, type line...; Yu-Gi-Oh! attribute, level, ATK, DEF...) and every SKU (condition x printing x language, e.g. Near Mint / Normal / English) with its market price, lowest_sale_price and highest_sale_price over recent sales, sale_count and when it was calculated. The sale fields are sale statistics, not live listings. An unknown ID is an error and is not billed. Costs 1 credit.",
				routing: request('/api/v1/tcgplayer/product'),
			},
			{
				name: 'Get Recent Sales',
				value: 'sales',
				action: 'Get tcgplayer recent sales',
				description:
					'The 5 most recent sales of one TCGplayer product (US, USD), optionally only in some conditions: order date, condition, printing, language, quantity, sale price, shipping, total and listing type. TCGplayer shows only the newest 5, so this is not a full sold history; use Get Price History for volume. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/sales'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get tcgplayer search suggestions',
				description:
					'The TCGplayer search-box autocomplete for a partial query (no game filter): suggested products (product ID, name, URL, set, game, score), matching sets and the games the matches come from with counts. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/suggestions'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a tcgplayer seller',
				description:
					'One TCGplayer seller by seller key (the seller.key of a listing): store name, URL, location, member since, lifetime sales band, completed sales rank, rating percent, gold star, Direct, Pro, certified hobby shop and WPN flags, US and international shipping, store hours, games sold, social links, and the last 365 days of buyer feedback summarized (total, percent positive, count per star, as described / arrived when expected / good communication). Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/seller'),
			},
			{
				name: 'Get Seller Feedback',
				value: 'sellerFeedback',
				action: 'Get tcgplayer seller feedback',
				description:
					"Individual buyer feedback on one TCGplayer seller from the last 365 days, newest first, up to 50 per page, optionally only one star rating or only feedback with a comment: date, rating, comment, as described / arrived when expected / good communication, and the buyer's masked nickname as the site shows it. total_results is approximate under the rating and comment filters. Costs 1 credit.",
				routing: request('/api/v1/tcgplayer/seller-feedback'),
			},
			{
				name: 'Get Seller Products',
				value: 'sellerProducts',
				action: 'Get tcgplayer seller products',
				description:
					'The products one TCGplayer seller has listed (US, USD), optionally matching keywords or one game, up to 50 per page, sorted like Search Products. Each product has ' +
					PRODUCT_FIELDS +
					", plus the seller's own listings of it (price, shipping, condition, printing, language, quantity). Also total_results, has_more and facets. Costs 1 credit.",
				routing: request('/api/v1/tcgplayer/seller-products'),
			},
			{
				name: 'Get Sets',
				value: 'sets',
				action: 'Get tcgplayer sets for a game',
				description:
					'Every set of one TCGplayer game, newest release first: set ID (for Get Price Guide), name, url_name (for the Set option of Search Products), abbreviation, release date and the supplemental flag. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/sets'),
			},
			{
				name: 'Get Trending Searches',
				value: 'trending',
				action: 'Get tcgplayer trending searches',
				description:
					'What shoppers are searching on TCGplayer right now, overall or for Pokemon, Magic or Yu-Gi-Oh!: up to 10 terms with a popularity score. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/trending'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search tcgplayer products',
				description:
					'Search TCGplayer (US marketplace, USD) for trading cards and sealed products across every game (Pokemon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Lorcana and 60+ more), up to 50 per page, sorted by relevance, best match, best selling, name or market price, filtered by game, set, rarity and cards vs sealed. Query is optional when Game or Set is given. Each product has ' +
					PRODUCT_FIELDS +
					', plus up to 3 featured live listings. Also total_results, has_more and the filter facets with counts. Costs 1 credit.',
				routing: request('/api/v1/tcgplayer/search'),
			},
		],
		default: 'search',
	},
];

export const tcgplayerFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'charizard',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description: 'Search keywords. Optional when Game or Set is given (browse a game or a set).',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			gameOption,
			...searchPaging.slice(0, 2),
			{
				displayName: 'Product Type',
				name: 'product_type',
				type: 'options',
				default: 'cards',
				options: [
					{ name: 'Cards', value: 'cards' },
					{ name: 'Sealed', value: 'sealed' },
				],
				description: 'Single cards, or sealed product (booster boxes, packs, decks, tins...)',
				routing: { request: { body: { product_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Rarity',
				name: 'rarity',
				type: 'string',
				default: '',
				placeholder: 'Holo Rare',
				description:
					'Only this rarity, as spelled in the rarity facet (e.g. Common, Rare, Holo Rare, Secret Rare)',
				routing: { request: { body: { rarity: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Set',
				name: 'set',
				type: 'string',
				default: '',
				placeholder: 'base-set',
				description: 'Only this set, by url_name from Get Sets (or the url_value of a set facet)',
				routing: { request: { body: { set: '={{ $value || undefined }}' } } },
			},
			searchPaging[2],
		],
	},

	// -- Get Product / Get Listings / Get Price History / Get Recent Sales --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '219058',
		displayOptions: show(['product', 'listings', 'priceHistory', 'sales']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			'TCGplayer product ID, the number after /product/ in a tcgplayer.com URL (the product_id of a search result). Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.tcgplayer.com/product/219058/pokemon-battle-academy-charizard',
		displayOptions: show(['product', 'listings', 'priceHistory', 'sales']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A tcgplayer.com product URL (tcgplayer.com/product/ID/...). Used when Product ID is not given.',
	},

	// -- Get Listings --
	{
		displayName: 'Additional Options',
		name: 'listingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['listings']),
		options: [
			conditionOption(`Only these conditions, separated by commas: ${CONDITIONS}`),
			{
				displayName: 'Direct Sellers Only',
				name: 'direct_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only TCGplayer Direct sellers',
				routing: { request: { body: { direct_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				placeholder: 'English, Japanese',
				description:
					'Only these languages, separated by commas (English, Japanese, French, German, Italian, Spanish, Portuguese, Korean, Chinese (S), Chinese (T), Russian)',
				routing: { request: { body: { language: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Listings per page, 1 to 50. The API default is 10.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page, 1-based, up to 200. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Printing',
				name: 'printing',
				type: 'string',
				default: '',
				placeholder: 'Foil',
				description:
					'Only these printings, separated by commas, as the skus[].printing of a product spells them (Normal, Foil, Holofoil, Reverse Holofoil, 1st Edition, Unlimited...)',
				routing: { request: { body: { printing: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'price_shipping',
				options: [
					{ name: 'Item Price', value: 'price' },
					{ name: 'Price Plus Shipping', value: 'price_shipping' },
				],
				description: 'Cheapest price plus shipping first (default), or by item price only',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Verified Sellers Only',
				name: 'verified_sellers',
				type: 'boolean',
				default: false,
				description: 'Whether to return only verified sellers',
				routing: { request: { body: { verified_sellers: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Price History --
	{
		displayName: 'Range',
		name: 'range',
		type: 'options',
		default: 'quarter',
		options: [
			{ name: 'Annual (Weekly Buckets)', value: 'annual' },
			{ name: 'Month (Daily Buckets)', value: 'month' },
			{ name: 'Quarter (3-Day Buckets)', value: 'quarter' },
			{ name: 'Semi-Annual (Weekly Buckets)', value: 'semi_annual' },
		],
		displayOptions: show(['priceHistory']),
		routing: { request: { body: { range: '={{ $value }}' } } },
		description: 'How far back to go. Quarter is the default.',
	},

	// -- Get Recent Sales --
	{
		displayName: 'Additional Options',
		name: 'salesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sales']),
		options: [
			conditionOption(`Only sales in these conditions, separated by commas: ${CONDITIONS}`),
		],
	},

	// -- Get Sets --
	{
		displayName: 'Game',
		name: 'game',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'pokemon',
		displayOptions: show(['sets']),
		routing: { request: { body: { game: '={{ $value }}' } } },
		description: 'Game url_name or game ID from Get Games (pokemon, magic, yugioh, or 3, 1, 2...)',
	},

	// -- Get Price Guide --
	{
		displayName: 'Set ID',
		name: 'set_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '604',
		displayOptions: show(['priceGuide']),
		routing: { request: { body: { set_id: '={{ $value }}' } } },
		description: 'Set ID from Get Sets (604 is Pokemon Base Set)',
	},
	{
		displayName: 'Additional Options',
		name: 'priceGuideOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['priceGuide']),
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Rows per page, 1 to 500. The API default is 100.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page, 1-based, up to 100. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Product Type',
				name: 'product_type',
				type: 'options',
				default: 'cards',
				options: [
					{ name: 'Cards', value: 'cards' },
					{ name: 'Sealed', value: 'sealed' },
				],
				description: 'Cards (default) or sealed products',
				routing: { request: { body: { product_type: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'charizard',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Trending Searches --
	{
		displayName: 'Game',
		name: 'game',
		type: 'options',
		default: 'all',
		options: [
			{ name: 'All Games', value: 'all' },
			{ name: 'Magic: The Gathering', value: 'magic' },
			{ name: 'Pokemon', value: 'pokemon' },
			{ name: 'Yu-Gi-Oh!', value: 'yugioh' },
		],
		displayOptions: show(['trending']),
		routing: { request: { body: { game: '={{ $value }}' } } },
		description: 'Trending overall, or for one game',
	},

	// -- Get Seller / Get Seller Feedback / Get Seller Products --
	{
		displayName: 'Seller Key',
		name: 'seller_key',
		type: 'string',
		required: true,
		default: '',
		placeholder: '58f7acae',
		displayOptions: show(['seller', 'sellerFeedback', 'sellerProducts']),
		routing: { request: { body: { seller_key: '={{ $value }}' } } },
		description: 'TCGplayer seller key, the seller.key of a listing (8 characters)',
	},

	// -- Get Seller Feedback --
	{
		displayName: 'Additional Options',
		name: 'sellerFeedbackOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerFeedback']),
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Feedback per page, 1 to 50. The API default is 10.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based, up to 500. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Star Rating',
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
				description: 'Only feedback with this many stars',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'With Comment Only',
				name: 'with_comment',
				type: 'boolean',
				default: false,
				description: 'Whether to return only feedback that has a written comment',
				routing: { request: { body: { with_comment: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Seller Products --
	{
		displayName: 'Additional Options',
		name: 'sellerProductsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerProducts']),
		options: [
			gameOption,
			...searchPaging.slice(0, 2),
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'charizard',
				description: "Only the seller's products matching these keywords",
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			searchPaging[2],
		],
	},
];
