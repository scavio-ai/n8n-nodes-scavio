import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['douglas'], operation, ...extra },
});

// Douglas (douglas.de, the Dusseldorf-based beauty retailer with about 1,960 stores in Europe),
// 10 operations on 15 storefronts. Credits: 1 per call, 2 on Italy (Find Stores and Get Store stay
// 1 there); Get Product with Variant EANs adds 1 per variant looked up (2 on Italy), up to 10;
// credits_used is the truth. Market (de default) on every operation. A listing page can take up to
// about 210 seconds, so every operation carries a 250s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 250000, ...(emptyBody ? { body: {} } : {}) },
});

const trimmed = '={{ String($value).trim() || undefined }}';
const isUrl = '/^https?:/i.test(String($value).trim())';
const ALL_OPS = [
	'search',
	'category',
	'brand',
	'deals',
	'product',
	'stores',
	'store',
	'review-summary',
	'suggestions',
	'brands',
];

const FIRST =
	'Douglas (douglas.de, the Dusseldorf-based beauty retailer with about 1,960 stores in Europe), on 15 storefronts in 13 countries';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const CREDIT = 'Costs 1 credit (2 on Italy).';
const SLOW = 'Slow: a listing page takes 5 to 210 seconds.';
const TILE =
	"products with code (the variant), base_code (what Get Product takes), name, brand, brand_line, product_family, URL, image, price, currency, was_price (Douglas' struck-through price), discount_percent, lowest_price_30d (the lowest price of the last 30 days Douglas shows beside a reduction), rrp (the RRP / UVP Douglas shows), unit_price, content, availability, in_stock, rating and flags, plus total, total_pages, has_more, facets, sorts and breadcrumbs. A price Douglas does not show is null; sponsored placements are left out";
const NOT_AVAILABLE =
	'Not available: review texts, review paging or star filters, per-store stock, store reservation, price history (poll and store the answers), cart or checkout. Douglas Portugal, Croatia, Slovenia, Latvia, Estonia and Bulgaria and France (Nocibe) are not offered.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const listOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: 'Page, 1-based (48 products a page)',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Discount', value: 'discount' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
			{ name: 'Top Rated', value: 'top_rated' },
		],
		description:
			'Result order, where the storefront offers it (sorts lists what the page offers; sort_applied says what it answered)',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Brand Codes',
		name: `${prefix}BrandFilter`,
		type: 'string',
		default: '',
		placeholder: 'b0690',
		description: 'Only these brands: brand codes, comma-separated (e.g. b0690 DIOR, from Get Brands or a brand link)',
		routing: {
			request: {
				body: {
					brand_filter:
						'={{ String($value).trim() ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}',
				},
			},
		},
	},
	{
		displayName: 'Sale Badge Only',
		name: `${prefix}SaleOnly`,
		type: 'boolean',
		default: false,
		description:
			"Whether to return only products with Douglas' own sale badge (SALE on Germany, the discount badge elsewhere). Not every reduced price carries it: was_price shows every reduction. Not offered on Switzerland.",
		routing: { request: { body: { sale_only: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '',
		placeholder: '[{ "facet": "classificationClassName", "value": "Eau de Parfum" }]',
		description:
			'Any facet of an earlier response: a list of { facet, value } from facets[].facet and facets[].values[].value (e.g. classificationClassName, genderName, flagName). At most 10 values in all.',
		routing: {
			request: {
				body: {
					filters:
						'={{ typeof $value === "string" ? ($value.trim() ? JSON.parse($value) : undefined) : $value }}',
				},
			},
		},
	},
];

export const douglasOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['douglas'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find douglas stores',
				description: `The Douglas stores near a city or postcode on one storefront of ${FIRST}: store_id (what Get Store takes), name, address, phone, coordinates, distance_km, opening hours, dated holiday hours, features and temporarily_closed, paged, with the place searched. Captured 2026-11-26: Berlin on Germany found 28 stores; the nearest, Berlin Mitte Alexa (00020475), at 0.76 km. No per-store stock. A place the store finder cannot place is a charged not-found. ${CHARGE} Costs 1 credit (also on Italy).`,
				routing: request('/api/v1/douglas/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get douglas brand products',
				description: `One brand's products on ${FIRST} by brand code, path or link (from Get Brands), with paging, sorts and filters: the brand and ${TILE}. An unknown brand is a charged not-found. ${SLOW} ${CHARGE} ${CREDIT}`,
				routing: request('/api/v1/douglas/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get douglas brands',
				description: `Every brand on one Douglas storefront of ${FIRST}: code (what Get Brand Products takes), name, URL, letter and logo, optionally by name or letter. Captured 2026-11-26: 1,890 brands on Germany, 1,580 on Poland. Very slow: the brand index page takes up to about 200 seconds. ${CHARGE} ${CREDIT}`,
				routing: request('/api/v1/douglas/brands', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get douglas category products',
				description: `One category of ${FIRST} by path, code or link, with paging, sorts and filters: the category and ${TILE}. An unknown category is a charged not-found. ${SLOW} ${CHARGE} ${CREDIT}`,
				routing: request('/api/v1/douglas/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get douglas deals',
				description: `The deal lists of ${FIRST}: the sale department, the Beauty / Black Friday list (while Douglas runs it) or any category's sale-badged products, with paging, sorts and filters: ${TILE}. With Include Promotions (default) also the storefront's offers page: promotions with headline, text, link, image and legal_text (validity dates and codes as Douglas words them) on Germany, Austria, Switzerland and Poland. Captured 2026-11-26: Beauty Friday on Germany listed 2,670 products; HUDA BEAUTY EASY BAKE LOOSE at 27.95 EUR, was 39.90, 30-day low 28.95. ${SLOW} ${CHARGE} ${CREDIT}`,
				routing: request('/api/v1/douglas/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a douglas product',
				description: `One product of ${FIRST} by base or variant code or link: name, brand, brand_line, product_family, EAN, description, ingredients, price, was_price, discount_percent, lowest_price_30d, rrp, unit_price, content, stock_level, availability, max_order_quantity, rating, review_count, images, attributes, scent_notes and every variant (size, colour or style) with its own price and stock (and EAN with Variant EANs). Captured 2026-11-26: Yves Saint Laurent Libre Eau de Parfum 30 ml (5000005003) on Germany at 52.99 EUR, was 59.99, 30-day low 52.99, RRP 87. An unknown code is a charged not-found. ${NOT_AVAILABLE} ${CHARGE} ${CREDIT} Variant EANs: +1 credit per variant looked up (2 on Italy), up to 10.`,
				routing: request('/api/v1/douglas/product'),
			},
			{
				name: 'Get Review Summary',
				value: 'review-summary',
				action: 'Get a douglas review summary',
				description: `Douglas' own AI-generated summary of a product's customer reviews, from ${FIRST}: summary (Douglas' text in the storefront's language, null when it shows none) and summary_type. Use the product's base code. Review texts and review paging are not offered. ${CHARGE} ${CREDIT}`,
				routing: request('/api/v1/douglas/review-summary'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a douglas store',
				description: `One Douglas store by ID, from ${FIRST}: every Find Stores field plus parking, public transport, top brands, events and service booking. No per-store stock. An unknown store is a charged not-found. ${CHARGE} Costs 1 credit (also on Italy).`,
				routing: request('/api/v1/douglas/store'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get douglas suggestions',
				description: `Douglas' search suggestions for what a shopper has typed, from ${FIRST}: products (base_code, code, name, brand, URL, image) and trending_terms (the storefront's trending searches, the same for every query, not matches). ${CHARGE} Costs 1 credit (2 on Italy).`,
				routing: request('/api/v1/douglas/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search douglas products',
				description: `Search the products of ${FIRST} by keywords, with paging (48 a page), sorts and the page's filters (brand, sale badge, product type, gender ... from facets): query, redirected_to (when Douglas sends the keyword to a category or brand page) and ${TILE}. Captured 2026-11-26: "dior" on Germany led to the DIOR brand page, 260 products. ${NOT_AVAILABLE} ${SLOW} ${CHARGE} ${CREDIT}`,
				routing: request('/api/v1/douglas/search'),
			},
		],
		default: 'search',
	},
];

export const douglasFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'douglasQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mascara',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "Keywords, in the storefront's language",
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'douglasCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'parfum/01',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A category path ending in its code (parfum/01, make-up/lippen/lippenstift/030503), the code alone (01) or a category link',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'douglasBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dior/b0690',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand code (b0690, from Get Brands), its path (dior/b0690) or a brand link',
	},

	// -- Get Product --
	{
		displayName: 'Product Code or URL',
		name: 'douglasProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5000005003',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					code: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
					url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			"A Douglas product code (base_code, e.g. 5000005003, or a variant code, e.g. 289690) or a Douglas product link (its storefront sets the market).",
	},

	// -- Find Stores --
	{
		displayName: 'City or Postcode',
		name: 'douglasStoresQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Berlin',
		displayOptions: show(['stores']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "A city or postcode: Douglas' own store finder places it",
	},

	// -- Get Store --
	{
		displayName: 'Store ID',
		name: 'douglasStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00020475',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'A Douglas store ID (store_id from Find Stores; leading zeros count)',
	},

	// -- Get Review Summary --
	{
		displayName: 'Base Product Code',
		name: 'douglasReviewCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5000005003',
		displayOptions: show(['review-summary']),
		routing: { request: { body: { code: '={{ String($value).trim() }}' } } },
		description: 'A base product code (base_code from Get Product or a product list)',
	},

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'douglasSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dior',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper has typed',
	},

	// -- Market --
	{
		displayName: 'Market',
		name: 'douglasMarket',
		type: 'options',
		default: 'de',
		options: [
			{ name: 'Austria', value: 'at' },
			{ name: 'Belgium (Dutch)', value: 'be-nl' },
			{ name: 'Belgium (French)', value: 'be-fr' },
			{ name: 'Czechia (CZK)', value: 'cz' },
			{ name: 'Germany', value: 'de' },
			{ name: 'Hungary (HUF)', value: 'hu' },
			{ name: 'Italy (2 Credits)', value: 'it' },
			{ name: 'Lithuania', value: 'lt' },
			{ name: 'Netherlands', value: 'nl' },
			{ name: 'Poland (PLN)', value: 'pl' },
			{ name: 'Romania (RON)', value: 'ro' },
			{ name: 'Slovakia', value: 'sk' },
			{ name: 'Spain', value: 'es' },
			{ name: 'Switzerland (French, CHF)', value: 'ch-fr' },
			{ name: 'Switzerland (German, CHF)', value: 'ch-de' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { market: '={{ $value === "de" ? undefined : $value }}' } } },
		description:
			"The Douglas storefront (EUR unless named). Names and texts come in its language; prices and assortment differ per storefront. Italy costs 2 credits (Find Stores and Get Store 1).",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'douglasSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(listOptions('douglasSearch')),
	},
	{
		displayName: 'Additional Options',
		name: 'douglasCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(listOptions('douglasCategory')),
	},
	{
		displayName: 'Additional Options',
		name: 'douglasBrandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: sorted(listOptions('douglasBrand')),
	},
	{
		displayName: 'Additional Options',
		name: 'douglasDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			...listOptions('douglasDeals'),
			{
				displayName: 'Collection',
				name: 'douglasDealsCollection',
				type: 'options',
				default: 'sale',
				options: [
					{ name: 'Beauty Friday', value: 'beauty_friday' },
					{ name: 'Sale', value: 'sale' },
				],
				description:
					'The sale department, or the Beauty / Black Friday list while Douglas runs it. Not with a Category.',
				routing: { request: { body: { collection: '={{ $value === "sale" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Category',
				name: 'douglasDealsCategory',
				type: 'string',
				default: '',
				placeholder: 'parfum/01',
				description:
					"Or any category (path, code or link): its products with Douglas' sale badge (not on Switzerland). Leave Collection on Sale.",
				routing: { request: { body: { category: trimmed } } },
			},
			{
				displayName: 'Include Promotions',
				name: 'douglasDealsPromotions',
				type: 'boolean',
				default: true,
				description:
					"Whether to also read the storefront's offers page (Germany, Austria, Switzerland and Poland link one)",
				routing: { request: { body: { include_promotions: '={{ $value === false ? false : undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'douglasProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Variant EANs',
				name: 'douglasProductVariantsEan',
				type: 'boolean',
				default: false,
				description:
					"Whether to also look up each variant's EAN (one more call per variant, 1 credit each, 2 on Italy; up to 10)",
				routing: { request: { body: { variants_ean: '={{ $value || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'douglasStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Page',
				name: 'douglasStoresPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'douglasStoresPageSize',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Stores a page, 1-50',
				routing: { request: { body: { page_size: '={{ $value === 10 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'douglasSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Max Products',
				name: 'douglasSuggestionsMax',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Product suggestions to return, 1-10',
				routing: { request: { body: { max: '={{ $value === 10 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'douglasBrandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands']),
		options: [
			{
				displayName: 'Letter',
				name: 'douglasBrandsLetter',
				type: 'string',
				default: '',
				placeholder: 'D',
				description: 'Only brands under this letter (A-Z or #)',
				routing: { request: { body: { letter: trimmed } } },
			},
			{
				displayName: 'Name Contains',
				name: 'douglasBrandsQuery',
				type: 'string',
				default: '',
				placeholder: 'dior',
				description: 'Only brands whose name contains this (accents and case ignored)',
				routing: { request: { body: { query: trimmed } } },
			},
		],
	},
];
