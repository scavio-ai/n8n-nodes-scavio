import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

// Shared description builder for the Lookfantastic (LookfantasticDescription.ts) and Cult Beauty
// (CultbeautyDescription.ts) resources: both sites run on one backend route builder
// (backend/src/routes/thg-beauty.ts), 7 operations, 1 credit each; credits_used is the truth.
// Market (each site's own list) on every operation, and a Currency select for each market whose
// currency selector offers more than one currency. Calls can queue behind the backend's upstream
// limit, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

export interface ThgBeautyMarketOption {
	/** The backend market code (gb, de, intl, ...). */
	code: string;
	/** Select label, e.g. 'Germany (lookfantastic.de, EUR)'. */
	label: string;
	/** Currencies the market offers, the first is its default (one entry: no Currency select). */
	currencies: string[];
}

export interface ThgBeautyFilterOption {
	/** Body field (brand, skin_type, ...). */
	field: string;
	displayName: string;
	placeholder: string;
	description: string;
}

export interface ThgBeautyConfig {
	/** Resource value and URL segment. */
	id: 'lookfantastic' | 'cultbeauty';
	name: string;
	first: string;
	/** Markets, the first is the default. */
	markets: ThgBeautyMarketOption[];
	/** One sentence on the markets, for the Market description (no final period). */
	marketsNote: string;
	filters: ThgBeautyFilterOption[];
	/** Named filters in prose (brand, skin type, ...). */
	filtersProse: string;
	/** Example list paths, in prose. */
	listExamples: string;
	listPlaceholder: string;
	landingSuffix: string;
	host: string;
	/** Extra Get Offers sentence (markets without a voucher-codes page), with a trailing space. */
	offersNote: string;
	captured: { search: string; product: string; offers: string; brands: string };
	examples: { query: string; sku: string; suggest: string; letter: string };
}

const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const IS_URL = '/^https?:/i.test(String($value).trim())';
const ALL_OPS = ['search', 'list', 'product', 'suggestions', 'offers', 'brands', 'categories'];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);
const byOptionName = (a: INodePropertyOptions, b: INodePropertyOptions) =>
	a.name.localeCompare(b.name);

export function thgBeautyDescriptions(cfg: ThgBeautyConfig): {
	operations: INodeProperties[];
	fields: INodeProperties[];
} {
	const { id, name: N, first: FIRST } = cfg;
	const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
		show: { resource: [id], operation, ...extra },
	});
	const PRICES = `Prices are ${N}'s for a visitor without an account, in the currency asked (each site and currency has its own price list; nothing converted by Scavio). rrp is ${N}'s RRP as given; discount_percent is computed by Scavio from price and rrp, only when the RRP is above the price. offer is ${N}'s own promotion text, as given. Cart-only code discounts are not included.`;
	const ITEM =
		'items with sku (what Get Product takes), name, brand, URL, image, price, rrp, discount_percent, price_from (the lowest variant price when below price), currency, in_stock, rating, review_count, offer (title, description, free_gift, URL), variants_count and options';
	const LIST = `plus market (market, site, language, currency, shipping_destination), total, total_pages, page, page_size, has_more, filters_applied and, with Include Facets, facets (${N}'s filter counts, whose facet names Other Filters takes).`;
	const NOT_AVAILABLE =
		'Not available: full review paging (Get Product returns the 10 latest reviews only), cart or checkout prices, price history, offer start dates.';
	const FILTERS = `sorted (relevance, popularity, price, name, newest, discount) and filtered (${cfg.filtersProse}, price range, minimum rating, discount range, and any other of the site's filters)`;
	const base = `/api/v1/${id}`;
	const defaultMarket = cfg.markets[0].code;

	const nameFilter = (prefix: string, f: ThgBeautyFilterOption): INodeProperties => ({
		displayName: f.displayName,
		name: `${prefix}${f.displayName.replace(/[^A-Za-z0-9]/g, '')}`,
		type: 'string',
		default: '',
		placeholder: f.placeholder,
		description: f.description,
		routing: { request: { body: { [f.field]: '={{ String($value).trim() || undefined }}' } } },
	});

	const numberFilter = (displayName: string, name: string, field: string, maxValue: number, description: string): INodeProperties => ({
		displayName,
		name,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue, numberPrecision: 2 },
		description,
		routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
	});

	const listOptions = (prefix: string, maxSize: number, defSize: number): INodeProperties[] =>
		sorted([
			{
				displayName: 'Page',
				name: `${prefix}Page`,
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10000 },
				description: 'Page (at most 10,000 positions: page x page size)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: `${prefix}PageSize`,
				type: 'number',
				default: defSize,
				typeOptions: { minValue: 1, maxValue: maxSize },
				description: `Products per page, 1-${maxSize}`,
				routing: { request: { body: { page_size: `={{ $value === ${defSize} ? undefined : $value }}` } } },
			},
			{
				displayName: 'Sort',
				name: `${prefix}Sort`,
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Discount (Highest Percent Off First)', value: 'discount' },
					{ name: 'Name', value: 'name' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Popularity', value: 'popularity' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: `Result order (${N}'s sort menu)`,
				routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
			},
			...cfg.filters.map((f) => nameFilter(prefix, f)),
			numberFilter('Min Price', `${prefix}MinPrice`, 'min_price', 10000000, 'Lowest price in the currency asked (0: no minimum)'),
			numberFilter('Max Price', `${prefix}MaxPrice`, 'max_price', 10000000, 'Highest price in the currency asked (0: no maximum)'),
			numberFilter('Min Rating', `${prefix}MinRating`, 'min_rating', 5, 'Lowest average star rating, 1-5 (0: any)'),
			numberFilter('Min Discount', `${prefix}MinDiscount`, 'min_discount', 100, `Lowest percent off ${N}'s RRP (0: no minimum)`),
			numberFilter('Max Discount', `${prefix}MaxDiscount`, 'max_discount', 100, `Highest percent off ${N}'s RRP (0: no maximum)`),
			{
				displayName: 'Other Filters (JSON)',
				name: `${prefix}Filters`,
				type: 'json',
				default: '',
				placeholder: '[{ "facet": "en_beauty_skinSubcategory_content", "value": "Serums" }]',
				description:
					"Up to 10 of the site's other filters as an earlier response's facets give them (Include Facets): a list of { facet, value }, value one or a list. Price, rating and discount are ranges: use the Min / Max options.",
				routing: {
					request: {
						body: {
							filters: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
						},
					},
				},
			},
			{
				displayName: 'Include Facets',
				name: `${prefix}IncludeFacets`,
				type: 'boolean',
				default: false,
				description: `Whether to also return ${N}'s filter counts for the results (still 1 credit)`,
				routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
			},
		]);

	const operations: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [id] } },
			options: [
				{
					name: 'Get Brands',
					value: 'brands',
					action: `Get ${N.toLowerCase()} brands`,
					description: `The A-Z brand directory of ${FIRST} for the site asked, or one letter: total_brands and brands with name, path (what Get List Page takes), URL and letter. ${cfg.captured.brands} ${ONE}.`,
					routing: request(`${base}/brands`, true),
				},
				{
					name: 'Get Categories',
					value: 'categories',
					action: `Get ${N.toLowerCase()} categories`,
					description: `The category tree of ${FIRST}, as the site navigation shows it, in the site's language: categories with name, path (what Get List Page takes), URL and children. ${ONE}.`,
					routing: request(`${base}/categories`, true),
				},
				{
					name: 'Get List Page',
					value: 'list',
					action: `Get a ${N.toLowerCase()} list page`,
					description: `The products of any ${N} list page by path or link: ${cfg.listExamples}, ${FILTERS}, up to 200 a page: ${ITEM}, ${LIST} An editorial page without a product list is listed through its ${cfg.landingSuffix} page (listed_path). ${PRICES} An unknown path is a charged not-found. ${ONE}.`,
					routing: request(`${base}/list`),
				},
				{
					name: 'Get Offers',
					value: 'offers',
					action: `Get ${N.toLowerCase()} offers`,
					description: `The current offers of ${FIRST}, as its voucher-codes page lists them: title, description, code (when the offer text names one), gift, threshold (the spend the text states), ends (${N}'s end time, ISO 8601 UTC), URL and list_path (what Get List Page takes, for the products). ${N} gives no start date. ${cfg.offersNote}${cfg.captured.offers} ${ONE}.`,
					routing: request(`${base}/offers`, true),
				},
				{
					name: 'Get Product',
					value: 'product',
					action: `Get a ${N.toLowerCase()} product`,
					description: `One ${N} product by SKU or link, for the site and currency asked: price, rrp, discount_percent, currency, in_stock, availability_message, barcode (EAN-13 or UPC, as given; null for sets), option_type and option (shade or size), variants (each with its own price, rrp, stock, barcode and loyalty points), subtitle, description, key_benefits, directions, ingredients, at_a_glance, volume, faq, images, offer (the site's promotion banner, as given), loyalty_points, rating, review_count, recent_reviews (the 10 latest: rating, date, text; no reviewer names) and breadcrumbs. Text is in the site's language. ${cfg.captured.product} ${PRICES} An unknown SKU is a charged not-found. ${ONE}.`,
					routing: request(`${base}/product`),
				},
				{
					name: 'Get Suggestions',
					value: 'suggestions',
					action: `Get ${N.toLowerCase()} search suggestions`,
					description: `${FIRST} search-box suggestions for typed text, in the site's language: terms (suggested searches), corrections and up to 5 products with sku, name, URL, price, rrp, discount_percent, rating and review_count. ${ONE}.`,
					routing: request(`${base}/suggestions`),
				},
				{
					name: 'Search Products',
					value: 'search',
					action: `Search ${N.toLowerCase()} products`,
					description: `Search the catalogue of ${FIRST} by keywords (in the site's language) or a ${N} SKU, ${FILTERS}, up to 40 a page: ${ITEM}, ${LIST} A keyword ${N} maps to one of its pages (a brand, a category, many generic terms) returns that page's products, as ${N}'s own search does, with resolved_from (type, path, listed_path, URL, title). ${cfg.captured.search} ${PRICES} ${NOT_AVAILABLE} ${ONE}.`,
					routing: request(`${base}/search`),
				},
			],
			default: 'search',
		},
	];

	const marketField: INodeProperties = {
		displayName: 'Market',
		name: `${id}Market`,
		type: 'options',
		default: defaultMarket,
		options: cfg.markets.map((m) => ({ name: m.label, value: m.code })).sort(byOptionName),
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { market: `={{ $value === "${defaultMarket}" ? undefined : $value }}` } } },
		description: `${N}'s site to read. ${cfg.marketsNote}.`,
	};

	const currencyFields: INodeProperties[] = cfg.markets
		.filter((m) => m.currencies.length > 1)
		.map((m) => ({
			displayName: 'Currency',
			name: `${id}Currency${m.code.charAt(0).toUpperCase()}${m.code.slice(1)}`,
			type: 'options' as const,
			default: m.currencies[0],
			options: m.currencies.map((c) => ({ name: c, value: c })).sort(byOptionName),
			displayOptions: show(ALL_OPS, { [`${id}Market`]: [m.code] }),
			routing: { request: { body: { currency: `={{ $value === "${m.currencies[0]}" ? undefined : $value }}` } } },
			description: `The currency, as the site's own currency selector offers it (default ${m.currencies[0]}). Each currency has its own ${N} price list; nothing is converted.`,
		}));

	const fields: INodeProperties[] = [
		// -- Search Products --
		{
			displayName: 'Keywords or SKU',
			name: `${id}Query`,
			type: 'string',
			required: true,
			default: '',
			placeholder: cfg.examples.query,
			displayOptions: show(['search']),
			routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
			description: `Keywords (in the site's language) or a ${N} SKU. A keyword ${N} maps to a page returns that page's products, reported in resolved_from.`,
		},

		// -- Get List Page --
		{
			displayName: 'List Page Path or URL',
			name: `${id}List`,
			type: 'string',
			required: true,
			default: '',
			placeholder: cfg.listPlaceholder,
			displayOptions: show(['list']),
			routing: {
				request: {
					body: {
						path: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
						url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
					},
				},
			},
			description: `A ${N} list page path (${cfg.listExamples}; paths come from Get Categories, Get Brands and Get Offers) or a ${cfg.host}/c/ link`,
		},

		// -- Get Product --
		{
			displayName: 'Product SKU or URL',
			name: `${id}Product`,
			type: 'string',
			required: true,
			default: '',
			placeholder: cfg.examples.sku,
			displayOptions: show(['product']),
			routing: {
				request: {
					body: {
						sku: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
						url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
					},
				},
			},
			description: `A ${N} SKU (sku from a search or list, or a variant sku; the same on every ${N} site) or a ${cfg.host}/p/ product link`,
		},

		// -- Get Suggestions --
		{
			displayName: 'Text',
			name: `${id}SuggestionsQuery`,
			type: 'string',
			required: true,
			default: '',
			placeholder: cfg.examples.suggest,
			displayOptions: show(['suggestions']),
			routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
			description: 'The text typed so far',
		},

		// -- Get Brands --
		{
			displayName: 'Letter',
			name: `${id}BrandsLetter`,
			type: 'string',
			default: '',
			placeholder: cfg.examples.letter,
			displayOptions: show(['brands']),
			routing: { request: { body: { letter: '={{ String($value).trim() || undefined }}' } } },
			description: 'Only brands under this letter (A-Z, or 0-9). Empty: every brand.',
		},

		// -- Market and Currency --
		marketField,
		...currencyFields,

		// -- Additional Options --
		{
			displayName: 'Additional Options',
			name: `${id}SearchOptions`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show(['search']),
			options: listOptions(`${id}Search`, 40, 40),
		},
		{
			displayName: 'Additional Options',
			name: `${id}ListOptions`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show(['list']),
			options: listOptions(`${id}List`, 200, 60),
		},
	];

	return { operations, fields };
}
