import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['fashionnova'], operation, ...extra },
});

// Fashion Nova, 7 operations, 1 credit each. 104 countries (Country), each in its own currency (37
// currencies), English everywhere and Spanish (Language) in 67. Search Products, Get Product and Get
// Collection Products take Country and Language; Get Categories, Get Search Suggestions and Get
// Reviews are the same for every storefront (one review pool per style); Get Similar Products answers
// from the US store. Review pages take 20 to 60 seconds and the backend retries, so every operation
// carries a 240s timeout, like thredUP.
// emptyBody: a base body {} so Get Categories on its default division still posts JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const MARKET_OPS = ['search', 'product', 'collection'];
const PRODUCT_OPS = ['product', 'reviews', 'similar'];

const PRICES =
	"Prices are numbers in the storefront's currency, never converted: price (the lowest size price), compare_at (the site's struck-through price), percent_off (computed by Scavio from the two), on_sale, price_with_code (the price with Fashion Nova's current code as the page computes it, 40% off compare_at), code_lowers_price (false when that code price is not below price: the code does not lower it; null without a code price) and final_sale. badge is the site's label; percent_off is computed, so the two can differ. In the 27 EEA countries (at, be, cy, cz, de, dk, ee, es, fi, fr, gr, hu, ie, is, it, lt, lu, lv, mt, nl, no, pl, pt, ro, se, si, sk) Fashion Nova shows VAT-inclusive prices and no compare-at price, so compare_at and percent_off are null there. No price history: schedule a workflow to track changes.";
const ITEM =
	'items with product_id, handle, color, color_slug, title, URL, price, compare_at, percent_off, on_sale, currency, price_with_code, code_lowers_price, final_sale, badge, in_stock, sizes_in_stock, sizes (size, quantity, available, low_stock), image and colors';
const LIST =
	"plus total, total_pages (approximate), has_more, count and facets (the filter inputs the list offers). A facet the list does not offer matches nothing and is listed in unrecognized_filters.";
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const MARKETS: Array<{ name: string; value: string }> = [
	{ name: 'Aland Islands (EUR)', value: 'ax' },
	{ name: 'Albania (ALL)', value: 'al' },
	{ name: 'Andorra (EUR)', value: 'ad' },
	{ name: 'Angola (AOA)', value: 'ao' },
	{ name: 'Anguilla (USD)', value: 'ai' },
	{ name: 'Antigua & Barbuda (USD)', value: 'ag' },
	{ name: 'Armenia (USD)', value: 'am' },
	{ name: 'Ascension Island (USD)', value: 'ac' },
	{ name: 'Australia (AUD)', value: 'au' },
	{ name: 'Austria (EUR)', value: 'at' },
	{ name: 'Belgium (EUR)', value: 'be' },
	{ name: 'British Indian Ocean Territory (USD)', value: 'io' },
	{ name: 'Canada (CAD)', value: 'ca' },
	{ name: 'Cayman Islands (KYD)', value: 'ky' },
	{ name: 'Chile (CLP)', value: 'cl' },
	{ name: 'Christmas Island (USD)', value: 'cx' },
	{ name: 'Cocos (Keeling) Islands (USD)', value: 'cc' },
	{ name: 'Cook Islands (USD)', value: 'ck' },
	{ name: 'Cyprus (EUR)', value: 'cy' },
	{ name: 'Czechia (CZK)', value: 'cz' },
	{ name: 'Denmark (DKK)', value: 'dk' },
	{ name: 'Dominican Republic (DOP)', value: 'do' },
	{ name: 'Estonia (EUR)', value: 'ee' },
	{ name: 'Falkland Islands (USD)', value: 'fk' },
	{ name: 'Faroe Islands (USD)', value: 'fo' },
	{ name: 'Finland (EUR)', value: 'fi' },
	{ name: 'France (EUR)', value: 'fr' },
	{ name: 'French Guiana (EUR)', value: 'gf' },
	{ name: 'French Southern Territories (USD)', value: 'tf' },
	{ name: 'Germany (EUR)', value: 'de' },
	{ name: 'Greece (EUR)', value: 'gr' },
	{ name: 'Greenland (USD)', value: 'gl' },
	{ name: 'Guadeloupe (EUR)', value: 'gp' },
	{ name: 'Guernsey (USD)', value: 'gg' },
	{ name: 'Hong Kong SAR (HKD)', value: 'hk' },
	{ name: 'Hungary (HUF)', value: 'hu' },
	{ name: 'Iceland (ISK)', value: 'is' },
	{ name: 'International (USD)', value: 'zz' },
	{ name: 'Iraq (USD)', value: 'iq' },
	{ name: 'Ireland (EUR)', value: 'ie' },
	{ name: 'Israel (ILS)', value: 'il' },
	{ name: 'Italy (EUR)', value: 'it' },
	{ name: 'Japan (JPY)', value: 'jp' },
	{ name: 'Kiribati (USD)', value: 'ki' },
	{ name: 'Kosovo (USD)', value: 'xk' },
	{ name: 'Kyrgyzstan (USD)', value: 'kg' },
	{ name: 'Latvia (EUR)', value: 'lv' },
	{ name: 'Lithuania (EUR)', value: 'lt' },
	{ name: 'Luxembourg (EUR)', value: 'lu' },
	{ name: 'Malaysia (MYR)', value: 'my' },
	{ name: 'Malta (EUR)', value: 'mt' },
	{ name: 'Martinique (EUR)', value: 'mq' },
	{ name: 'Mayotte (EUR)', value: 'yt' },
	{ name: 'Mexico (MXN)', value: 'mx' },
	{ name: 'Monaco (EUR)', value: 'mc' },
	{ name: 'Montenegro (EUR)', value: 'me' },
	{ name: 'Mozambique (MZN)', value: 'mz' },
	{ name: 'Nauru (USD)', value: 'nr' },
	{ name: 'Netherlands (EUR)', value: 'nl' },
	{ name: 'New Zealand (NZD)', value: 'nz' },
	{ name: 'Nigeria (NGN)', value: 'ng' },
	{ name: 'Niue (USD)', value: 'nu' },
	{ name: 'Norway (NOK)', value: 'no' },
	{ name: 'Peru (PEN)', value: 'pe' },
	{ name: 'Philippines (PHP)', value: 'ph' },
	{ name: 'Pitcairn Islands (USD)', value: 'pn' },
	{ name: 'Poland (PLN)', value: 'pl' },
	{ name: 'Portugal (EUR)', value: 'pt' },
	{ name: 'Qatar (QAR)', value: 'qa' },
	{ name: 'Reunion (EUR)', value: 're' },
	{ name: 'Romania (RON)', value: 'ro' },
	{ name: 'Russia (RUB)', value: 'ru' },
	{ name: 'Samoa (USD)', value: 'ws' },
	{ name: 'Saudi Arabia (SAR)', value: 'sa' },
	{ name: 'Seychelles (SCR)', value: 'sc' },
	{ name: 'Singapore (SGD)', value: 'sg' },
	{ name: 'Sint Maarten (USD)', value: 'sx' },
	{ name: 'Slovakia (EUR)', value: 'sk' },
	{ name: 'Slovenia (EUR)', value: 'si' },
	{ name: 'Solomon Islands (USD)', value: 'sb' },
	{ name: 'South Africa (ZAR)', value: 'za' },
	{ name: 'South Georgia & South Sandwich Islands (USD)', value: 'gs' },
	{ name: 'South Korea (KRW)', value: 'kr' },
	{ name: 'Spain (EUR)', value: 'es' },
	{ name: 'St. Barthelemy (EUR)', value: 'bl' },
	{ name: 'St. Helena (USD)', value: 'sh' },
	{ name: 'St. Martin (EUR)', value: 'mf' },
	{ name: 'St. Pierre & Miquelon (USD)', value: 'pm' },
	{ name: 'Svalbard & Jan Mayen (USD)', value: 'sj' },
	{ name: 'Sweden (SEK)', value: 'se' },
	{ name: 'Switzerland (CHF)', value: 'ch' },
	{ name: 'Tajikistan (USD)', value: 'tj' },
	{ name: 'Tokelau (USD)', value: 'tk' },
	{ name: 'Tonga (USD)', value: 'to' },
	{ name: 'Tristan Da Cunha (USD)', value: 'ta' },
	{ name: 'Turkmenistan (USD)', value: 'tm' },
	{ name: 'Tuvalu (USD)', value: 'tv' },
	{ name: 'U.S. Outlying Islands (USD)', value: 'um' },
	{ name: 'United Arab Emirates (AED)', value: 'ae' },
	{ name: 'United Kingdom (GBP)', value: 'gb' },
	{ name: 'United States (USD)', value: 'us' },
	{ name: 'Vatican City (EUR)', value: 'va' },
	{ name: 'Wallis & Futuna (USD)', value: 'wf' },
	{ name: 'Western Sahara (USD)', value: 'eh' },
];

const divisionField = (operations: string[]): INodeProperties => ({
	displayName: 'Division',
	name: 'division',
	type: 'options',
	default: 'women',
	options: [
		{ name: 'Curve (Plus)', value: 'curve' },
		{ name: 'Men', value: 'men' },
		{ name: 'Women', value: 'women' },
	],
	displayOptions: show(operations),
	routing: { request: { body: { division: '={{ $value === "women" ? undefined : $value }}' } } },
});

const pageOption = (max: number, description: string): INodeProperties => ({
	displayName: 'Page',
	name: 'page',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const filterOptions: INodeProperties[] = [
	{
		displayName: 'Categories',
		name: 'category',
		type: 'string',
		default: '',
		placeholder: 'Jeans, Dresses',
		description: 'Categories as the site writes them (facets name category), separated by commas',
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Colors',
		name: 'shadeFamilies',
		type: 'string',
		default: '',
		placeholder: 'black, blue',
		description:
			'Colour families (facets name color: black, blue, white, pink, brown, red ...), up to 10, separated by commas',
		routing: { request: { body: { color: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Divisions',
		name: 'listDivision',
		type: 'multiOptions',
		default: [],
		options: [
			{ name: 'Curve (Plus)', value: 'curve' },
			{ name: 'Women', value: 'women' },
		],
		description: "Women or Curve (Fashion Nova's plus range), or both",
		routing: {
			request: { body: { division: '={{ $value && $value.length ? $value : undefined }}' } },
		},
	},
	{
		displayName: 'Filters (JSON)',
		name: 'filters',
		type: 'json',
		default: '',
		placeholder: '{ "fit_type": "Baggy", "rise": "High Rise" }',
		description:
			"Other facets by facets[].name: { facet: value or [values] }, with values from an earlier response's facets list. Up to 10 facets.",
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
		description: "Highest price, whole units of the storefront's currency",
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'price_min',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: "Lowest price, whole units of the storefront's currency",
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Sizes',
		name: 'size',
		type: 'string',
		default: '',
		placeholder: 'M, L',
		description: 'Sizes (facets name size, e.g. M, 7, 1X), up to 15, separated by commas',
		routing: { request: { body: { size: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'featured',
		options: [
			{ name: 'Best Selling', value: 'best_selling' },
			{ name: 'Featured', value: 'featured' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
		],
		description: 'Result order (Featured is the site default)',
		routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
	},
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);

export const fashionnovaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['fashionnova'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get fashion nova categories',
				description: `The Fashion Nova navigation for Women, Men or Curve as collection handles (name, handle, URL, sections) for Get Collection Products, plus the site's trending searches. The same handles work in every storefront. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/categories', true),
			},
			{
				name: 'Get Collection Products',
				value: 'collection',
				action: 'Get fashion nova collection products',
				description: `One collection by handle or link (sale, best-sellers, new, new-this-week, back-in-stock, jeans ...), pages 1 to 166 of 60 (a collection lists up to about 10,000 products; consecutive pages can repeat a few products, so dedupe by product_id + color): ${ITEM}, ${LIST} There is no clearance collection; sale is the markdown collection. An unknown handle is a charged 404. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/collection'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a fashion nova product',
				description: `One style in one colour by handle (plus colour) or link: price, compare_at, percent_off, price_with_code, code_lowers_price, promo, final_sale, sizes (size, SKU, price, compare_at, quantity, available, low_stock), every colour with its own sizes, rating (average, count, histogram, fit), the first 3 reviews, site_ai_review_summary (Fashion Nova's own AI summary of its reviews), size_guide, delivery, attributes and materials. Quantities are the stock the page shows per size. An unknown handle or colour is a charged 404. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get fashion nova reviews',
				description: `One style's reviews, 10 per page, pages 1 to 8, sorted and filtered by star: total (as returned), rating and reviews (rating, title, body, date, verified_buyer, votes, fit, size_purchased and usual_size (the reviewer's own text), color_purchased, language, topics). Reviews are per style, not per colour, in one pool shared by every storefront and mostly English, so there is no country. No reviewer names. Takes 20 to 60 seconds. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get fashion nova search suggestions',
				description: `Search suggestions for a partial query (Women, Men or Curve): suggested searches, products (no prices: use Get Product) and collections. The same for every storefront. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/suggestions'),
			},
			{
				name: 'Get Similar Products',
				value: 'similar',
				action: 'Get fashion nova similar products',
				description: `Up to 24 styles Fashion Nova recommends as similar to one style, from the US store in USD: ${ITEM}. An unknown product is a charged 404. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/similar'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search fashion nova products',
				description: `Search one Fashion Nova storefront for sale prices and sizes in stock: ${ITEM}, ${LIST} The search is semantic: its total moves between calls, a later page can repeat a few items, and it shows its first 18 pages of 60 (6 under a sort other than Featured). Narrow with filters, or use Get Collection Products for more depth. Not available: stores, a brand directory or brand filter (brand is the store's vendor field; collab and licensed brand names appear in titles), price history, gift cards, new-arrival dates. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/fashionnova/search'),
			},
		],
		default: 'search',
	},
];

export const fashionnovaFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: MARKETS,
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"The storefront and its currency: any of the 104 countries in Fashion Nova's own country selector (International is the site's International storefront, USD)",
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'Spanish', value: 'es' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description:
			'Spanish titles, descriptions and attributes are served in 67 countries (not the United States); elsewhere Spanish answers 400 before anything is charged',
	},

	// -- Keywords --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bodycon dress',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search text. Semantic: narrow with the filter options.',
	},
	{
		displayName: 'Partial Query',
		name: 'suggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dress',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Division --
	divisionField(['categories', 'suggestions']),

	// -- Get Collection Products --
	{
		displayName: 'Collection By',
		name: 'collectionBy',
		type: 'options',
		default: 'handle',
		options: [
			{ name: 'Handle', value: 'handle' },
			{ name: 'Collection URL', value: 'url' },
		],
		displayOptions: show(['collection']),
		description: 'How to identify the collection',
	},
	{
		displayName: 'Collection Handle',
		name: 'collectionHandle',
		type: 'string',
		required: true,
		default: 'sale',
		placeholder: 'sale',
		displayOptions: show(['collection'], { collectionBy: ['handle'] }),
		routing: { request: { body: { handle: '={{ $value }}' } } },
		description:
			'A collection handle from Get Categories, e.g. sale, best-sellers, new, new-this-week, back-in-stock, jeans',
	},
	{
		displayName: 'Collection URL',
		name: 'collectionUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.fashionnova.com/collections/sale',
		displayOptions: show(['collection'], { collectionBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A fashionnova.com collection link',
	},

	// -- Get Product, Get Reviews, Get Similar Products --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'handle',
		options: [
			{ name: 'Handle', value: 'handle' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(PRODUCT_OPS),
		description: 'How to identify the style',
	},
	{
		displayName: 'Handle',
		name: 'productHandle',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'san-diego-sculpting-stretch-flare-jeans',
		displayOptions: show(PRODUCT_OPS, { productBy: ['handle'] }),
		routing: { request: { body: { handle: '={{ $value }}' } } },
		description: 'The style handle (items[].handle of a search or collection response)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.fashionnova.com/products/...',
		displayOptions: show(PRODUCT_OPS, { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A fashionnova.com product link, any storefront',
	},
	{
		displayName: 'Colour Slug',
		name: 'styleShade',
		type: 'string',
		default: '',
		placeholder: 'black-wash',
		displayOptions: show(PRODUCT_OPS),
		routing: { request: { body: { color: '={{ $value || undefined }}' } } },
		description: "Colour slug (items[].color_slug). Empty: the style's default colour.",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			...filterOptions,
			pageOption(18, 'Page, 60 per page: 1 to 18, or 1 to 6 with a sort other than Featured'),
		].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'collectionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['collection']),
		options: [...filterOptions, pageOption(166, 'Page, 60 per page, 1 to 166 (a collection lists up to about 10,000 products)')].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'reviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			pageOption(8, 'Page, 10 reviews each, 1 to 8'),
			{
				displayName: 'Sort',
				name: 'reviewSort',
				type: 'options',
				default: 'highest_rated',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				description: "Review order (Highest Rated is the page's own)",
				routing: {
					request: { body: { sort: '={{ $value === "highest_rated" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Star Rating',
				name: 'star',
				type: 'options',
				default: 0,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
					{ name: 'Any', value: 0 },
				],
				description: 'Only reviews with this star rating',
				routing: { request: { body: { star: '={{ $value || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'similarOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['similar']),
		options: [
			{
				displayName: 'Number of Products',
				name: 'similarCount',
				type: 'number',
				default: 12,
				typeOptions: { minValue: 1, maxValue: 24 },
				description: 'Products to return, 1 to 24',
				routing: { request: { body: { limit: '={{ $value === 12 ? undefined : $value }}' } } },
			},
		],
	},
];
