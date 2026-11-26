import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['sephora'], operation, ...extra },
});

// Sephora (sephora.com, US) is the default on Search Products, Get Category Products and Get
// Product. Country "Canada" reads Sephora Canada (sephora.com/ca) on those three; Get Brand
// Products, Get Brands, Get Search Suggestions, Get Offers, Find Stores and Get Store are Sephora
// Canada only and send no country (the API defaults it to "ca"). The Country field only sends a
// value for Canada, so a US workflow posts exactly the body it did before Sephora Canada existed.
// Credits are the same in both countries: 1 per call, Get Product and Get Offers 2. Every route
// carries a 240s timeout (Sephora Canada pages can take up to about 50 s, with one retry).
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const CA_SITE =
	"Sephora Canada (sephora.com/ca, Sephora's Canadian store: 152 stores per its store list on Nov 25, 2026)";
const CA_ONLY = `${CA_SITE} only.`;
const CAD =
	"Prices in CAD as Sephora Canada gives them (French prices such as 33,00 $ are read as 33.00).";

const CA = (ops: string[]) => show(ops, { country: ['ca'] });
const US = (ops: string[]) => show(ops, { country: ['us'] });

const pageOption = (description: string): INodeProperties => ({
	displayName: 'Page',
	name: 'page',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description,
	routing: { request: { body: { page: '={{ $value }}' } } },
});

const SORTS = [
	{ name: 'Best Selling', value: 'best_selling' },
	{ name: 'Newest', value: 'newest' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
	{ name: 'Rating', value: 'rating' },
	{ name: 'Relevance', value: 'relevance' },
];

const sortOption: INodeProperties = {
	displayName: 'Sort By',
	name: 'sort',
	type: 'options',
	default: 'relevance',
	options: SORTS,
	description: 'Result order',
	routing: { request: { body: { sort: '={{ $value }}' } } },
};

const languageOption: INodeProperties = {
	displayName: 'Language',
	name: 'language',
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French', value: 'fr' },
	],
	description:
		'Sephora Canada language. Product and SKU IDs and CAD prices are the same; names, descriptions and facet values are in that language.',
	routing: { request: { body: { language: '={{ $value }}' } } },
};

/** Sephora Canada listing options shared by Search Products, Get Category Products and Get Brand Products. */
function caListingOptions(): INodeProperties[] {
	return [
		{
			displayName: 'Brand',
			name: 'brand',
			type: 'string' as const,
			default: '',
			placeholder: 'The Ordinary',
			description: 'Only this brand, as the Brand facet shows it',
			routing: { request: { body: { filters: { brand: '={{ $value || undefined }}' } } } },
		},
		{
			displayName: 'Clean at Sephora Only',
			name: 'clean',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only Clean at Sephora products',
			routing: { request: { body: { filters: { clean: '={{ $value || undefined }}' } } } },
		},
		{
			displayName: 'Facet Filters (JSON)',
			name: 'facets',
			type: 'json' as const,
			default: '',
			placeholder: '[{ "facet": "Brand", "value": "..." }]',
			description:
				"Up to 10 of the site's filters as an earlier response's facets give them (Include Facets): a list of { facet, value }",
			routing: {
				request: {
					body: {
						filters: {
							facets: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
						},
					},
				},
			},
		},
		{
			displayName: 'Include Facets',
			name: 'include_facets',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to also return the facets (filters with their values and counts)',
			routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
		},
		languageOption,
		{
			displayName: 'Maximum Price (CAD)',
			name: 'max_price',
			type: 'number' as const,
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Highest price in CAD',
			routing: { request: { body: { filters: { max_price: '={{ $value || undefined }}' } } } },
		},
		{
			displayName: 'Minimum Price (CAD)',
			name: 'min_price',
			type: 'number' as const,
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Lowest price in CAD',
			routing: { request: { body: { filters: { min_price: '={{ $value || undefined }}' } } } },
		},
		{
			displayName: 'Minimum Rating',
			name: 'rating',
			type: 'options' as const,
			default: 4,
			options: [
				{ name: '1 Star & Up', value: 1 },
				{ name: '2 Stars & Up', value: 2 },
				{ name: '3 Stars & Up', value: 3 },
				{ name: '4 Stars & Up', value: 4 },
			],
			description: 'Only products rated this many stars and up',
			routing: { request: { body: { filters: { rating: '={{ $value }}' } } } },
		},
		{
			displayName: 'New Only',
			name: 'new',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only new products',
			routing: { request: { body: { filters: { new: '={{ $value || undefined }}' } } } },
		},
		{
			displayName: 'On Sale Only',
			name: 'on_sale',
			type: 'boolean' as const,
			default: false,
			description: 'Whether to return only products on sale',
			routing: { request: { body: { filters: { on_sale: '={{ $value || undefined }}' } } } },
		},
		pageOption('Results page, 60 results per page'),
		sortOption,
	];
}

const CA_LISTING =
	' total_results, total_pages, has_more, filters applied, sale scope and an app-exclusive flag per product, facets on request, market.';

export const sephoraOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['sephora'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find sephora canada stores',
				description: `${CA_ONLY} The Canadian stores on Sephora's store list, optionally one province: total stores, counts per province, and each store's name, city, mall, province and slug for Get Store. No store finder by postal code. Costs 1 credit.`,
				routing: request('/api/v1/sephora/stores', true),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get sephora canada brand products',
				description: `${CA_ONLY} One brand's products, 60 per page: the brand's ID, name, URL and description, its categories with product counts, and the Search Products fields, with sort, filters and facets. ${CAD} An unknown brand is a charged error. Costs 1 credit.`,
				routing: request('/api/v1/sephora/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get sephora canada brands',
				description: `${CA_ONLY} Every brand in the A-Z brand directory: brand ID, name, seo_name (for Get Brand Products), URL and letter. Costs 1 credit.`,
				routing: request('/api/v1/sephora/brands', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get sephora category products',
				description:
					"Products in a sephora.com (US) category, 60 per page, with the same fields as Search Products plus the category's ID, name and URL, total product count, parent category, subcategories with product counts and breadcrumbs. An unknown category is a 404. Sephora Canada: CAD prices with sort, filters and facets;" +
					CA_LISTING +
					' Costs 1 credit.',
				routing: request('/api/v1/sephora/category'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get sephora canada beauty offers',
				description: `${CA_ONLY} The current offers on the beauty offers page: title, description, eligibility as given (Online, In Store, Apps, Rouge, VIB, Insider), app-only flag, threshold, promo code, end date as given (none when the offer states none), legal copy and link. Offers carry no start date. No prices or member pricing. Costs 2 credits.`,
				routing: request('/api/v1/sephora/offers', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a sephora product',
				description:
					"One sephora.com (US) product: name, brand, rating, review count, loves count, price range, description, suggested usage, breadcrumbs, a summary of what reviews say with pro and con sentiment counts (no review text), and every shade or size as a SKU with price, list and sale price, stock, ingredients, images and pickup and same-day eligibility. Sephora Canada (the same product and SKU IDs): CAD prices per SKU with sale price, in stock and only few left, Sephora's own AI-generated summary of customer reviews (labelled as Sephora's), the 10 latest reviews without reviewer names; no UPC, no stock per store. Costs 2 credits.",
				routing: request('/api/v1/sephora/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get sephora canada search suggestions',
				description: `${CA_ONLY} The search-box suggestions for a partial query: suggested search terms and products (ID, SKU ID, name, brand, rating, review count, image, URL), as the site gives them. Costs 1 credit.`,
				routing: request('/api/v1/sephora/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a sephora canada store',
				description: `${CA_ONLY} One store by slug or link: store ID, address, phone, coordinates, time zone, weekly hours, holiday hours, curbside hours and services. No stock per store. An unknown store is a charged error. Costs 1 credit.`,
				routing: request('/api/v1/sephora/store'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search sephora products',
				description:
					"Search sephora.com (US), 60 per page: product ID, SKU ID, brand, name, URL, image, price, list price and sale price, value price for sets, rating, review count, extra colors, and bestseller, new, Sephora-exclusive, online-only, limited-edition and sponsored flags, plus category facets and related searches. Sephora Canada: CAD prices with filters and facets; a brand keyword answers that brand's products;" +
					CA_LISTING +
					" Use a result's URL with Get Product. Costs 1 credit.",
				routing: request('/api/v1/sephora/search'),
			},
		],
		default: 'search',
	},
];

export const sephoraFields: INodeProperties[] = [
	// -- Country (Search Products, Get Category Products, Get Product) --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada', value: 'ca' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['search', 'category', 'product']),
		description: `Sephora (sephora.com) or ${CA_SITE}; prices in CAD`,
		routing: { request: { body: { country: '={{ $value === "ca" ? "ca" : undefined }}' } } },
	},

	// -- Search Products / Get Search Suggestions --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lipstick',
		displayOptions: show(['search', 'suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword (for Get Search Suggestions, what the shopper has typed so far)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lipstick',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'Category name as it appears in a sephora.com/shop/ URL (lipstick, face-serum, makeup-cosmetics), or the full sephora.com/shop/ URL (for Canada a sephora.com/ca link)',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.sephora.com/product/mac-cosmetics-m-a-cximal-silky-matte-lipstick-P510799',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'Product URL on sephora.com: the URL field of a search or category result. Faster than Product ID. Use this or Product ID.',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: 'P510799',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			'Sephora product ID (P followed by digits, the same in Canada): the product_id field of a search or category result. Use this or Product URL.',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'the-ordinary',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description:
			'Brand name as in a sephora.com/ca/en/brand/ link (e.g. the-ordinary, dior; the seo_name from Get Brands), or the link itself',
	},

	// -- Get Store --
	{
		displayName: 'Store',
		name: 'store',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'toronto-eaton-centre',
		displayOptions: show(['store']),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: "A store slug from Find Stores, or the store's link",
	},

	// -- Additional Options: Search Products (US) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: US(['search']),
		options: [
			pageOption('Results page, 60 results per page'),
			sortOption,
			{
				displayName: 'ZIP Code',
				name: 'zip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description:
					'US ZIP code. When set, each product carries same_day_eligible for same-day delivery to that ZIP.',
				routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Additional Options: Get Category Products (US) --
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: US(['category']),
		options: [pageOption('Results page, 60 results per page')],
	},

	// -- Canada Options: Search Products, Get Category Products, Get Product --
	{
		displayName: 'Canada Options',
		name: 'canadaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: CA(['search', 'category']),
		options: caListingOptions(),
	},
	{
		displayName: 'Canada Options',
		name: 'canadaOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: CA(['product']),
		options: [languageOption],
	},

	// -- Options: Get Brand Products --
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: caListingOptions(),
	},

	// -- Options: Find Stores --
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			languageOption,
			{
				displayName: 'Province',
				name: 'province',
				type: 'options',
				default: 'ON',
				options: [
					{ name: 'Alberta', value: 'AB' },
					{ name: 'British Columbia', value: 'BC' },
					{ name: 'Manitoba', value: 'MB' },
					{ name: 'New Brunswick', value: 'NB' },
					{ name: 'Newfoundland and Labrador', value: 'NL' },
					{ name: 'Northwest Territories', value: 'NT' },
					{ name: 'Nova Scotia', value: 'NS' },
					{ name: 'Nunavut', value: 'NU' },
					{ name: 'Ontario', value: 'ON' },
					{ name: 'Prince Edward Island', value: 'PE' },
					{ name: 'Quebec', value: 'QC' },
					{ name: 'Saskatchewan', value: 'SK' },
					{ name: 'Yukon', value: 'YT' },
				],
				description: 'Only stores in this province or territory',
				routing: { request: { body: { province: '={{ $value }}' } } },
			},
		],
	},

	// -- Options: Get Brands, Get Search Suggestions, Get Offers, Get Store --
	{
		displayName: 'Additional Options',
		name: 'languageOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands', 'suggestions', 'offers', 'store']),
		options: [languageOption],
	},
];
