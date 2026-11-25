import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['vevor'], operation, ...extra },
});

// VEVOR (vevor.com, the tools and equipment seller with storefronts in 13 countries), 11 operations,
// 1 credit each except Get Prices Across Storefronts (3); credits_used is the truth. Country (13
// storefronts) + Language (default the storefront's first) on every operation except Get Prices
// Across Storefronts, which sends the SKU only. Get Shipping needs State on the US storefront and
// Province on the Canadian one. Calls can queue behind the backend's upstream limit, so every
// operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST = 'VEVOR (vevor.com, the tools and equipment seller with storefronts in 13 countries)';
const NAME = 'Vevor';
const PRICES =
	"Prices are VEVOR's prices on that storefront for a visitor without an account, in its own currency (no conversion). The same SKU has its own price on each storefront; price and stock do not change by ZIP or state (shipping fee and delivery date do: Get Shipping). was_price is given only while a VEVOR deal is active (or VEVOR's page shows its own strikethrough price); otherwise null, never computed from VEVOR's reference price.";
const ITEM =
	"items with sku (for Get Product, Get Shipping, Get Reviews, Get Questions and Get Prices Across Storefronts), name, URL, image, price, was_price, currency, stock_units, in_stock, deal_ends (ISO 8601 UTC, as VEVOR gives it), deal_progress (VEVOR's text), labels, rating and review_count";
const LIST =
	'plus market, page, page_size (60), total (exact up to 100, then "100+" as VEVOR gives it, with total_is_lower_bound) and has_more.';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NOT_AVAILABLE =
	"Not available: coupon codes (VEVOR shows them only after a claim), the pickup store, Pro or bulk prices, financing, the ships-from warehouse, VEVOR's listings on other marketplaces, price history, checkout.";
const IS_URL = '/^https?:/i.test(String($value).trim())';
const MARKET_OPS = [
	'search',
	'product',
	'shipping',
	'reviews',
	'questions',
	'suggestions',
	'categories',
	'category',
	'collections',
	'deals',
];

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'vevorPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 50 },
	description: 'Page, 1-50 (60 items a page)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'vevorSort',
	type: 'options',
	default: 'popular',
	options: [
		{ name: 'Hot', value: 'hot' },
		{ name: 'Newest', value: 'new' },
		{ name: 'Popular', value: 'popular' },
		{ name: 'Price: High to Low', value: 'price_high' },
		{ name: 'Price: Low to High', value: 'price_low' },
	],
	description: "Result order (Popular is VEVOR's own order)",
	routing: { request: { body: { sort: '={{ $value === "popular" ? undefined : $value }}' } } },
};

const categoryOption = (description: string): INodeProperties => ({
	displayName: 'Category',
	name: 'vevorCategoryFilter',
	type: 'string',
	default: '',
	placeholder: '40035',
	description,
	routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
});

const flag = (displayName: string, name: string, field: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

const filterOptions: INodeProperties[] = [
	flag('In Stock Only', 'vevorInStock', 'in_stock', 'Whether to return only items in stock'),
	flag('On Sale Only', 'vevorOnSale', 'on_sale', 'Whether to return only items VEVOR lists as on sale'),
	flag(
		'Black Friday Only',
		'vevorBlackFriday',
		'black_friday',
		"Whether to return only items in VEVOR's Black Friday filter (offered while VEVOR runs it)",
	),
	flag('Bulk Savings Only', 'vevorBulkSavings', 'bulk_savings', 'Whether to return only items VEVOR lists with bulk savings'),
	flag('Pickup Only', 'vevorPickup', 'pickup', 'Whether to return only items VEVOR offers for pickup (United States only)'),
	{
		displayName: 'Min Price',
		name: 'vevorMinPrice',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Lowest price in the storefront's currency (0: no minimum)",
		routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Price',
		name: 'vevorMaxPrice',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Highest price in the storefront's currency (0: no maximum)",
		routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Rating',
		name: 'vevorRating',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Best Rated (5 Stars)', value: 'best_rated' },
			{ name: 'Highly Rated (4 Stars and Up)', value: 'highly_rated' },
		],
		description: "VEVOR's rating filter",
		routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
	},
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const optionsCollection = (name: string, operation: string, options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...options]),
});

export const vevorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['vevor'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get vevor categories',
				description: `${NAME}'s category tree on the storefront asked (its own category menu: departments, categories, sub-categories) or one branch: categories with ID (what Get Category Products and the Category option of Search Products take), name, URL and children, plus parents and total_categories. A category not in the menu is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/vevor/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get vevor category products',
				description: `One ${NAME} category listing by category ID or link, sorted, filtered (in stock, on sale, Black Friday while VEVOR runs it, bulk savings, pickup in the US, price range, rating) and paged like Search Products: category_id, title, ${ITEM}, ${LIST} ${PRICES} An unknown category is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/vevor/category'),
			},
			{
				name: 'Get Collection',
				value: 'collections',
				action: 'Get a vevor collection',
				description: `${NAME}'s Best Sellers (optionally one category), New Arrivals (items carry first_listed, when VEVOR first listed them) or one promotion page, as VEVOR lists them: ${ITEM}, ${LIST} ${PRICES} ${ONE}`,
				routing: request('/api/v1/vevor/collections', true),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get vevor deals',
				description: `${NAME}'s Daily Deals, Clearance or Deals page (optionally one category), sorted and paged: ${ITEM}, ${LIST} Deal end times are as VEVOR gives them; coupon codes are not included (VEVOR shows them only after a claim). ${PRICES} ${ONE}.`,
				routing: request('/api/v1/vevor/deals', true),
			},
			{
				name: 'Get Prices Across Storefronts',
				value: 'prices',
				action: 'Get vevor prices across storefronts',
				description: `The same ${NAME} SKU on all 13 storefronts in one call: per storefront country, host, currency, status (sold, not_sold or unavailable), price, was_price, deal_ends and stock_units, plus sold_in. Each storefront in its own currency (no conversion; vevor.co.no and eur.vevor.com sell in EUR); most European storefronts share one stock pool. Captured 2026-11-25: one SKU was 195.01 USD on the US storefront, 233.90 CAD in Canada, 175.90 GBP in the UK, 170.90 EUR in Germany, 261.99 EUR in Norway and 721.90 PLN in Poland. A SKU no storefront sells is a charged not-found. ${CHARGE} Costs 3 credits, billed on what the request spent (credits_used says what was charged).`,
				routing: request('/api/v1/vevor/prices'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a vevor product',
				description: `One ${NAME} product by SKU or link, on the storefront asked: price, was_price, currency, deal (starts, ends, quantity, claimed, percent_left; null without an active deal), stock_units, availability, labels, attributes, variants (each with its own sku, price, was_price, deal_ends and stock_units), specs, images, description, protection_plans, return_policy, rating, review_count, rating_breakdown, ai_review_summary and ai_questions (VEVOR's own AI-written summary and answers, labelled as VEVOR's) and categories. ${PRICES} An unknown SKU, or one this storefront does not sell, is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/vevor/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get vevor questions',
				description: `Customer questions on one ${NAME} product with their answers, 5 a page (VEVOR's page size): question, date, votes and answers (text, date, by_vevor for VEVOR's own answers, votes), plus total and total_pages. No asker or answerer names. ${ONE}.`,
				routing: request('/api/v1/vevor/questions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get vevor reviews',
				description: `Reviews of one ${NAME} product, up to 100 a page, sorted (recommended, newest, helpful) and filtered (stars, with photos, this exact SKU): rating, review_count, rating_breakdown and reviews with rating, title, text, date, language, country, sku, variant_attributes, photos_count, videos_count, helpful_votes and VEVOR's replies. VEVOR shares one review pool across its storefronts and a product's variants, so reviews come in many languages. No reviewer names. ${ONE}.`,
				routing: request('/api/v1/vevor/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get vevor search suggestions',
				description: `${NAME}'s search suggestions for typed text on the storefront asked: suggestions with term and URL (the matching VEVOR search page). Text is in the storefront language. ${ONE}.`,
				routing: request('/api/v1/vevor/suggestions'),
			},
			{
				name: 'Get Shipping',
				value: 'shipping',
				action: 'Get vevor shipping',
				description: `${NAME}'s shipping answer for one SKU to a destination: fee, currency, free_shipping, delivery (earliest, latest; ISO 8601 UTC, as VEVOR gives them), can_order, price and stock_units. On the US storefront the state drives the fee and delivery date (captured 2026-11-25: a welder to Alaska, AK 99501, had a $130 fee; contiguous states were measured free with dates varying by state); on the Canadian storefront the province; other storefronts take a postcode only. VEVOR does not name a shipping method or the shipping warehouse. ${ONE}.`,
				routing: request('/api/v1/vevor/shipping'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search vevor products',
				description: `Search ${FIRST} by keywords in the storefront language or a SKU, on any of its storefronts, sorted (popular, price low or high, hot, new), filtered (in stock, on sale, Black Friday while VEVOR runs it, bulk savings, pickup in the US, price range, rating), by category and paged (60 a page): ${ITEM}, ${LIST} ${PRICES} Each storefront language has its own search index: send the search term in that language. ${NOT_AVAILABLE} ${ONE}.`,
				routing: request('/api/v1/vevor/search'),
			},
		],
		default: 'product',
	},
];

export const vevorFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword or SKU',
		name: 'vevorQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'welder',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ $value }}' } } },
		description: 'Keywords in the storefront language (each storefront language has its own search index), or a VEVOR SKU',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Typed Text',
		name: 'vevorSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ice',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { q: '={{ $value }}' } } },
		description: 'The text typed so far, in the storefront language',
	},

	// -- Get Product --
	{
		displayName: 'SKU or Product URL',
		name: 'vevorProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'DHJMIGMMAMIGLL6WNV5',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A VEVOR SKU (sku from a list, e.g. DHJMIGMMAMIGLL6WNV5) or a VEVOR product link of the storefront chosen under Country',
	},

	// -- Get Shipping, Get Reviews, Get Questions, Get Prices Across Storefronts --
	{
		displayName: 'SKU',
		name: 'vevorSku',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'DHJMIGMMAMIGLL6WNV5',
		displayOptions: show(['shipping', 'reviews', 'questions', 'prices']),
		routing: { request: { body: { sku: '={{ String($value).trim() }}' } } },
		description: 'A VEVOR SKU (sku from a list, e.g. DHJMIGMMAMIGLL6WNV5)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID or URL',
		name: 'vevorCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '40035',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A VEVOR category ID (from Get Categories, e.g. 40035, Ice Makers) or a VEVOR category link',
	},

	// -- Get Collection --
	{
		displayName: 'Collection',
		name: 'vevorCollectionType',
		type: 'options',
		default: 'best_sellers',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'New Arrivals', value: 'new' },
			{ name: 'Promotion Page', value: 'promotion' },
		],
		displayOptions: show(['collections']),
		routing: { request: { body: { type: '={{ $value === "best_sellers" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Promotion Page URL',
		name: 'vevorPromotionUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.vevor.com/promotion/commercial-kitchen-equipment-special-10018.html',
		displayOptions: show(['collections'], { vevorCollectionType: ['promotion'] }),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description: 'A VEVOR promotion page link (a /promotion/ page, e.g. the one above). A promotion page is one page in VEVOR\'s own order: no category, page or sort.',
	},

	// -- Get Deals --
	{
		displayName: 'Deals Page',
		name: 'vevorDealType',
		type: 'options',
		default: 'daily_deals',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Daily Deals', value: 'daily_deals' },
			{ name: 'Deals', value: 'deals' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "daily_deals" ? undefined : $value }}' } } },
	},

	// -- Get Shipping --
	{
		displayName: 'State',
		name: 'vevorState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'NY',
		displayOptions: show(['shipping'], { vevorCountry: ['us'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The two-letter US state. VEVOR's shipping fee and delivery date depend on it.",
	},
	{
		displayName: 'Province',
		name: 'vevorProvince',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ON',
		displayOptions: show(['shipping'], { vevorCountry: ['ca'] }),
		routing: { request: { body: { province: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'The two-letter Canadian province',
	},
	optionsCollection('vevorShippingOptions', 'shipping', [
		{
			displayName: 'ZIP or Postcode',
			name: 'vevorZip',
			type: 'string',
			default: '',
			placeholder: '99501',
			description: 'The ZIP or postcode (US: 5 digits; Canada: e.g. M5V 2T6)',
			routing: { request: { body: { zip: '={{ String($value).trim() || undefined }}' } } },
		},
		{
			displayName: 'City',
			name: 'vevorCity',
			type: 'string',
			default: '',
			routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
		},
	]),

	// -- Country and Language --
	{
		displayName: 'Country',
		name: 'vevorCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Australia', value: 'au' },
			{ name: 'Canada', value: 'ca' },
			{ name: 'France', value: 'fr' },
			{ name: 'Germany', value: 'de' },
			{ name: 'Italy', value: 'it' },
			{ name: 'Mexico', value: 'mx' },
			{ name: 'Netherlands', value: 'nl' },
			{ name: 'Norway', value: 'no' },
			{ name: 'Other Europe (eur.vevor.com)', value: 'eu' },
			{ name: 'Poland', value: 'pl' },
			{ name: 'Spain', value: 'es' },
			{ name: 'United Kingdom', value: 'gb' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'The VEVOR storefront. Prices come in its currency and differ between storefronts.',
	},
	{
		displayName: 'Language',
		name: 'vevorLanguage',
		type: 'options',
		default: '',
		options: [
			{ name: 'Czech', value: 'cs' },
			{ name: 'Danish', value: 'da' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'Finnish', value: 'fi' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Greek', value: 'el' },
			{ name: 'Hungarian', value: 'hu' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Norwegian', value: 'no' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Romanian', value: 'ro' },
			{ name: 'Slovak', value: 'sk' },
			{ name: 'Spanish', value: 'es' },
			{ name: "Storefront's Default", value: '' },
			{ name: 'Swedish', value: 'sv' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			"The storefront language (default the storefront's first). United States: English or Spanish; Canada: English or French; Other Europe (eur.vevor.com): English, Swedish, Danish, Finnish, Norwegian, Portuguese, Czech, Greek, Slovak, Hungarian or Romanian; every other storefront its own language only. Another language answers 400.",
	},

	// -- Additional Options --
	optionsCollection('vevorSearchOptions', 'search', [
		pageOption,
		sortOption,
		categoryOption('Only items in this category: a category ID (categories[].id from Get Categories) or a VEVOR category link'),
		...filterOptions,
	]),
	optionsCollection('vevorCategoryOptions', 'category', [pageOption, sortOption, ...filterOptions]),
	optionsCollection('vevorCollectionOptions', 'collections', [
		pageOption,
		sortOption,
		categoryOption('With Best Sellers only: only this category (a category ID from Get Categories)'),
	]),
	optionsCollection('vevorDealsOptions', 'deals', [
		pageOption,
		sortOption,
		categoryOption('Only this category (a category ID from Get Categories)'),
	]),
	optionsCollection('vevorCategoriesOptions', 'categories', [
		categoryOption('One category (a category ID or a VEVOR category link): its sub-categories. Empty: every department with its categories.'),
	]),
	optionsCollection('vevorReviewsOptions', 'reviews', [
		{
			displayName: 'Page',
			name: 'vevorReviewPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Page, 1-500',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'vevorReviewPageSize',
			type: 'number',
			default: 20,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Reviews per page, 1-100',
			routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'vevorReviewSort',
			type: 'options',
			default: 'recommended',
			options: [
				{ name: 'Helpful', value: 'helpful' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Recommended', value: 'recommended' },
			],
			description: "Review order (Recommended is VEVOR's own order)",
			routing: { request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Stars',
			name: 'vevorReviewStars',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 5 },
			description: 'Only reviews with this many stars, 1-5 (0: any)',
			routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
		},
		flag('With Photos Only', 'vevorPhotosOnly', 'photos_only', 'Whether to return only reviews with photos or videos'),
		flag(
			'This Variant Only',
			'vevorThisVariantOnly',
			'this_variant_only',
			"Whether to return only reviews of this exact SKU (VEVOR shares reviews across a product's variants)",
		),
	]),
	optionsCollection('vevorQuestionsOptions', 'questions', [
		{
			displayName: 'Page',
			name: 'vevorQuestionPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 200 },
			description: 'Page, 1-200 (5 questions a page)',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
	]),
];
