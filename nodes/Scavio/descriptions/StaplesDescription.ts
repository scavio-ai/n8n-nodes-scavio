import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['staples'], operation, ...extra },
});

// Staples (staples.com, the US office supply retailer; Staples Canada at staples.ca), 12
// operations, 1 credit each; credits_used is the truth. Country us (www.staples.com, USD) or ca
// (www.staples.ca, Staples Canada, CAD) and language en or fr (Canada only) on Search Products and
// Get Product only; every other operation is US only and sends no country. Calls can queue behind
// the backend's upstream limit, so every operation carries a 240s timeout, like Michaels.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = 'Staples (staples.com, the US office supply retailer; Staples Canada at staples.ca)';
const PRICES =
	"Price and was_price as Staples shows them (was_price is Staples' Regular price, given only when above the price); discount_percent is computed by Scavio from the two. Prices are national (USD): ZIP and store change availability, not price.";
const ITEM =
	"items with item_id (for Get Product, Get Store Stock, Get Reviews and Get Questions), name, URL, image, brand, model, price, was_price, discount_percent, Staples' own price per unit (price_per_unit_text, e.g. $5.00/Ream or $0.10 Cost Per Page), pack_size, rating, review_count, category, delivery and pickup flags, badges and highlights";
const LIST =
	'plus market, total, page, page_size (40), total_pages and facets (each values[].filter is what Filters takes).';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged)';
const ITEM_HINT = 'A Staples item number (item_id from a list, the number after product_ in a staples.com link, e.g. 122374)';
const ARRAY = '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}';
const SPLIT = '={{ $value ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}';
const MARKET_OPS = ['search', 'product'];

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'staplesPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 250 },
	description: 'Page, 1-250 (40 products a page)',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'staplesSort',
	type: 'options',
	default: 'best_match',
	options: [
		{ name: 'Best Match', value: 'best_match' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_high' },
		{ name: 'Price: Low to High', value: 'price_low' },
		{ name: 'Top Rated', value: 'rating' },
	],
	description: "Result order (Best Match is Staples' default)",
	routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
};

const brandOption: INodeProperties = {
	displayName: 'Brands',
	name: 'staplesBrand',
	type: 'string',
	default: '',
	placeholder: 'Hammermill',
	description: "Up to 5 comma-separated brands as Staples names them (the Brand facet's values)",
	routing: { request: { body: { brand: SPLIT } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'staplesFilters',
	type: 'json',
	default: '',
	placeholder: '["Number of Reams_3A_2210-Ream_22"]',
	description:
		'Up to 10 facet values exactly as an earlier response gives them in facets[].values[].filter (reams, sheet size, colour, yield, rating, price band); several are combined',
	routing: { request: { body: { filters: ARRAY } } },
};

const minPriceOption: INodeProperties = {
	displayName: 'Min Price',
	name: 'staplesMinPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Lowest price in USD (0: no minimum)',
	routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
};

const maxPriceOption: INodeProperties = {
	displayName: 'Max Price',
	name: 'staplesMaxPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Highest price in USD (0: no maximum)',
	routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
};

const dealOption: INodeProperties = {
	displayName: 'Deal Filter',
	name: 'staplesDeal',
	type: 'options',
	default: '',
	options: [
		{ name: 'Any', value: '' },
		{ name: 'Clearance', value: 'clearance' },
		{ name: 'On Promotion', value: 'on_promotion' },
	],
	description: "Only products in Staples' On Promotion or Clearance deals filter (United States)",
	routing: { request: { body: { deal: '={{ $value || undefined }}' } } },
};

const baseListOptions = [pageOption, sortOption, brandOption, filtersOption, minPriceOption, maxPriceOption];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const collection = (name: string, operation: string, options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...options]),
});

export const staplesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['staples'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find staples stores near a zip code',
				description: `The ${NAME} stores near a US ZIP or city: store_number, name, address, phone, fax, coordinates, distance_miles, utc_offset, hours (this week's, holiday closures included) and services (Print and Marketing Services, Shredding, Recycling, UPS, Amazon Lockers, ... as Staples lists them). ${ONE}.`,
				routing: request('/api/v1/staples/stores'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get staples categories',
				description: `${NAME}'s top-level departments, or one department's sub-departments and classes (United States): ID, type (SC, CG, DP, CL), name and URL, plus the parents. A class ID (CL) is the input of Get Category Products and Get Deals. An unknown department is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/staples/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get staples category products',
				description: `One ${NAME} class listing by CL ID or staples.com category link (United States), sorted, filtered and paged: ${ITEM}, ${LIST} ${PRICES} An unknown class is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/staples/category'),
			},
			{
				name: 'Get Coupons',
				value: 'coupons',
				action: 'Get staples coupons',
				description: `The coupons on ${NAME}'s public coupons page (United States): code, headline, details, ends (ISO date) and ends_text (as given), channel (Online or omni), category, URL and image. Coupon text and end dates are Staples' own. ${ONE}.`,
				routing: request('/api/v1/staples/coupons', true),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get staples deals',
				description: `${NAME}'s On Promotion or Clearance products for keywords or a class (United States), sorted, filtered and paged. Each response has ${ITEM}, ${LIST} ${PRICES} ${ONE}.`,
				routing: request('/api/v1/staples/deals'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a staples product',
				description: `One ${NAME} product in full by item number or link: price, was_price, discount_percent, Staples' own price per unit (Ream, Cost Per Page, ... as given), pack_size, page_yield, sheets_per_ream, promotions and offer_expires (Staples' own promotion texts and expiry), coupon_codes, specifications, rating_breakdown, review_summary (Staples' own AI-generated summary), ream / carton variants, model (manufacturer part number; staples.com publishes no UPC), and with a ZIP or store, delivery dates and that store's pickup units. ${PRICES} Canada: CAD price, barcode and variants by item number, handle or staples.ca link. An unknown item is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/staples/product'),
			},
			{
				name: 'Get Questions',
				value: 'questions',
				action: 'Get staples product questions',
				description: `Customer questions on one ${NAME} item (United States), 10 a page, newest or most answered first, each with its answers (text, date, helpful_votes, staff, badge). No asker or answerer names. ${ONE}.`,
				routing: request('/api/v1/staples/questions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get staples product reviews',
				description: `Reviews of one ${NAME} item (United States), up to 100 a page, sorted and filtered by stars or photos: rating, title, text, date, verified_purchase, incentivized, helpful votes, photos, the variant reviewed and responses, plus rating, review_count, rating_breakdown and review_summary (Staples' own AI-generated summary). No reviewer names. An unknown item is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/staples/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a staples store',
				description: `One ${NAME} store by store number: name, address, phone, fax, coordinates, utc_offset, hours and services. An unknown store number is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/staples/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get staples store stock near a zip code',
				description: `Units of one item at the ${NAME} stores near a US ZIP that have it for pickup today, as Staples reports them: per store store_number, address, phone, distance_miles, units, threshold (the value Staples returns beside the units, as given), in_stock, pickup_text (e.g. Ready in 30 mins) and hours, plus count and total_units. Staples lists only stores that have the item; an empty list means no nearby store has it or it is not offered for store pickup. Price does not change by store. ${ONE}.`,
				routing: request('/api/v1/staples/store-stock'),
			},
			{
				name: 'Get Trending Searches',
				value: 'trending',
				action: 'Get staples trending searches',
				description: `The trending searches ${NAME} shows in its search box (United States). ${ONE}.`,
				routing: request('/api/v1/staples/trending', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search staples products',
				description: `Search ${NAME} by keywords, a model number or a Staples item number (an item number answers with that product), sorted, filtered (brand, any facet, price, On Promotion, Clearance) and paged (40 a page, to page 250): ${ITEM}, ${LIST} ${PRICES} Canada: Staples Canada's top matches (about 5, no paging, sort or filters) in English or French. Not available: the weekly ad, search suggestions, print and tech service prices, Rewards member prices, Staples Business Advantage contract prices, price history, checkout. ${ONE}.`,
				routing: request('/api/v1/staples/search'),
			},
		],
		default: 'search',
	},
];

export const staplesFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword, Model or Item Number',
		name: 'staplesQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'copy paper',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ $value }}' } } },
	},

	// -- Get Product --
	{
		displayName: 'Item Number, Product URL or Handle',
		name: 'staplesProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '122374',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					item_id:
						'={{ /^\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					handle:
						'={{ /^https?:/i.test(String($value).trim()) || /^\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: `${ITEM_HINT}, a staples.com (or with Country Canada a staples.ca) product link, or with Country Canada a Staples Canada product handle`,
	},
	collection('staplesProductOptions', 'product', [
		{
			displayName: 'ZIP Code',
			name: 'staplesProductZip',
			type: 'string',
			default: '',
			placeholder: '10001',
			description: 'A US ZIP code: delivery availability and dates for it (price does not change with it)',
			routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Store Number',
			name: 'staplesProductStore',
			type: 'string',
			default: '',
			placeholder: '1633',
			description: "A Staples store number (store_number from Find Stores): that store's pickup units",
			routing: { request: { body: { store: '={{ $value || undefined }}' } } },
		},
	]),

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'staplesCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CL140691',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A Staples class ID (CL..., from a category of a list or a CL entry of Get Categories) or a staples.com category link (ending in /cat_CL140691)',
	},

	// -- Get Categories --
	{
		displayName: 'Department',
		name: 'staplesDepartment',
		type: 'string',
		default: '',
		placeholder: 'SC1676',
		displayOptions: show(['categories']),
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		description: "Optional: a department ID (SC, CG or DP, from an earlier response or a staples.com link) lists its sub-departments and classes. Empty: Staples' top-level departments.",
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'staplesDealType',
		type: 'options',
		default: 'on_promotion',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'On Promotion', value: 'on_promotion' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "on_promotion" ? undefined : $value }}' } } },
		description: "Staples' deals filter (On Promotion is the default)",
	},
	{
		displayName: 'Deals Within',
		name: 'staplesDealsBy',
		type: 'options',
		default: 'keywords',
		options: [
			{ name: 'Keywords', value: 'keywords' },
			{ name: 'Category', value: 'category' },
		],
		displayOptions: show(['deals']),
		description: 'Staples lists deals within a search or a class: one is required',
	},
	{
		displayName: 'Keywords',
		name: 'staplesDealsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'laptop',
		displayOptions: show(['deals'], { staplesDealsBy: ['keywords'] }),
		routing: { request: { body: { q: '={{ $value }}' } } },
	},
	{
		displayName: 'Category',
		name: 'staplesDealsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CL140691',
		displayOptions: show(['deals'], { staplesDealsBy: ['category'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A Staples class ID (CL...) or a staples.com category link',
	},

	// -- Get Coupons --
	{
		displayName: 'Coupon Category',
		name: 'staplesCouponCategory',
		type: 'string',
		default: '',
		placeholder: 'Printers',
		displayOptions: show(['coupons']),
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		description: 'Optional: only coupons of this category, as Staples names it (categories of an earlier response)',
	},

	// -- Get Store Stock, Get Reviews, Get Questions --
	{
		displayName: 'Item Number',
		name: 'staplesItem',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2724258',
		displayOptions: show(['storeStock', 'reviews', 'questions']),
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description: ITEM_HINT,
	},
	{
		displayName: 'ZIP Code',
		name: 'staplesStockZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60540',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP code (Find Stores gives the ZIP codes of the stores near a city)',
	},
	collection('staplesStockOptions', 'storeStock', [
		{
			displayName: 'Radius (Miles)',
			name: 'staplesStockRadius',
			type: 'number',
			default: 100,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Miles around the ZIP, 1-100. Defaults to 100.',
			routing: { request: { body: { radius: '={{ $value === 100 ? undefined : $value }}' } } },
		},
	]),

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'staplesStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find the stores near a US ZIP code or a city',
	},
	{
		displayName: 'ZIP Code',
		name: 'staplesStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores'], { staplesStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP code',
	},
	{
		displayName: 'City',
		name: 'staplesStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Chicago, IL',
		displayOptions: show(['stores'], { staplesStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'A US city and state, e.g. Chicago, IL',
	},
	collection('staplesStoresOptions', 'stores', [
		{
			displayName: 'Radius (Miles)',
			name: 'staplesStoresRadius',
			type: 'number',
			default: 25,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Miles around the location, 1-100. Defaults to 25.',
			routing: { request: { body: { radius: '={{ $value === 25 ? undefined : $value }}' } } },
		},
	]),

	// -- Get Store --
	{
		displayName: 'Store Number',
		name: 'staplesStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1574',
		displayOptions: show(['store']),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: 'A Staples store number (store_number from Find Stores)',
	},

	// -- Get Reviews --
	collection('staplesReviewsOptions', 'reviews', [
		{
			displayName: 'Page',
			name: 'staplesReviewsPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1 },
			description: 'Page, from 1',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Limit',
			name: 'staplesReviewsLimit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Max number of results to return',
			routing: { request: { body: { limit: '={{ $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'staplesReviewsSort',
			type: 'options',
			default: 'most_relevant',
			options: [
				{ name: 'Highest Rating', value: 'highest_rating' },
				{ name: 'Lowest Rating', value: 'lowest_rating' },
				{ name: 'Most Helpful', value: 'most_helpful' },
				{ name: 'Most Relevant', value: 'most_relevant' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Oldest', value: 'oldest' },
			],
			description: "Review order (Most Relevant is Staples' default)",
			routing: { request: { body: { sort: '={{ $value === "most_relevant" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Stars',
			name: 'staplesReviewsRating',
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
			description: 'Only reviews with this many stars',
			routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Photos Only',
			name: 'staplesReviewsPhotos',
			type: 'boolean',
			default: false,
			description: 'Whether to return only reviews with photos',
			routing: { request: { body: { photos_only: '={{ $value || undefined }}' } } },
		},
	]),

	// -- Get Questions --
	collection('staplesQuestionsOptions', 'questions', [
		{
			displayName: 'Page',
			name: 'staplesQuestionsPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1 },
			description: 'Page, from 1 (10 questions a page)',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'staplesQuestionsSort',
			type: 'options',
			default: 'newest',
			options: [
				{ name: 'Most Answered', value: 'most_answered' },
				{ name: 'Newest', value: 'newest' },
			],
			description: 'Question order (Newest is the default)',
			routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
		},
	]),

	// -- Country and Language --
	{
		displayName: 'Country',
		name: 'staplesCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'United States (www.staples.com, USD) or Canada (www.staples.ca, Staples Canada, CAD)',
	},
	{
		displayName: 'Language',
		name: 'staplesLanguage',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(MARKET_OPS, { staplesCountry: ['ca'] }),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'French returns products as www.staples.ca/fr shows them',
	},

	// -- Additional Options --
	collection('staplesSearchOptions', 'search', [...baseListOptions, dealOption]),
	collection('staplesCategoryOptions', 'category', [...baseListOptions, dealOption]),
	collection('staplesDealsOptions', 'deals', baseListOptions),
];
