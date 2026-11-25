import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['dermstore'], operation, ...extra },
});

// Dermstore (dermstore.com, the US skincare and beauty retailer, shipping to the US and Canada),
// 7 operations, 1 credit each; credits_used is the truth. Country (us default, or ca in Dermstore's
// own CAD prices) on every operation. Calls can queue behind the backend's upstream limit, so every
// operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'Dermstore (dermstore.com, the US skincare and beauty retailer, shipping to the US and Canada)';
const NAME = 'Dermstore';
const PRICES =
	"Prices are Dermstore's for a visitor without an account, in the market's currency (ca: Dermstore's own Canadian dollar prices, not converted). rrp is Dermstore's RRP as given; discount_percent is computed by Scavio from price and rrp, only when the RRP is above the price. offer is Dermstore's own promotion text (code, gift, end date inside the text), as given; code rates differ by brand.";
const ITEM =
	'items with sku (what Get Product takes), name, brand, URL, image, price, rrp, discount_percent, price_from (the lowest variant price when below price), currency, in_stock, rating, review_count, offer (title, description, free_gift, URL), variants_count and options';
const LIST =
	'plus market, total, total_pages, page, page_size, has_more, filters_applied and, with Include Facets, facets (Dermstore\'s filter counts).';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NOT_AVAILABLE =
	'Not available: a full review feed or review paging (Get Product returns the 10 latest reviews only), Q&A, member (VIP) prices, cart or checkout prices, price history, offer start dates. For the same product at Sephora, Ulta or Amazon use those resources (match on UPC, or brand + name + size).';
const FILTERS =
	'sorted (relevance, popularity, price, name, newest, discount) and filtered (brand, skin type, concern, SPF band, key ingredient, preference, gender, price range, minimum rating, discount range), up to 200 a page';
const IS_URL = '/^https?:/i.test(String($value).trim())';
const ALL_OPS = ['search', 'list', 'product', 'suggestions', 'offers', 'brands', 'categories'];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const nameFilter = (displayName: string, name: string, field: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [field]: '={{ String($value).trim() || undefined }}' } } },
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

const listOptions = (prefix: string): INodeProperties[] =>
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
			default: 60,
			typeOptions: { minValue: 1, maxValue: 200 },
			description: 'Products per page, 1-200',
			routing: { request: { body: { page_size: '={{ $value === 60 ? undefined : $value }}' } } },
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
			description: "Result order (Dermstore's sort menu)",
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
		nameFilter('Brand', `${prefix}Brand`, 'brand', 'EltaMD', 'Brand as Dermstore names it, exact (facets option value)'),
		nameFilter('Skin Type', `${prefix}SkinType`, 'skin_type', 'Dry Skin', 'Skin type as Dermstore lists it'),
		nameFilter('Concern', `${prefix}Concern`, 'concern', 'Aging', 'Skin concern as Dermstore lists it'),
		nameFilter('SPF', `${prefix}Spf`, 'spf', 'SPF 30+', 'SPF band as Dermstore lists it'),
		nameFilter('Key Ingredient', `${prefix}KeyIngredient`, 'key_ingredient', 'Retinol', 'Key ingredient as Dermstore lists it'),
		nameFilter('Preference', `${prefix}Preference`, 'preference', 'Clean', 'Preference as Dermstore lists it (e.g. Clean, Vegan, Fragrance-Free)'),
		nameFilter('Gender', `${prefix}Gender`, 'gender', 'Female', 'Gender as Dermstore lists it'),
		numberFilter('Min Price', `${prefix}MinPrice`, 'min_price', 100000, "Lowest price in the market's currency (0: no minimum)"),
		numberFilter('Max Price', `${prefix}MaxPrice`, 'max_price', 100000, "Highest price in the market's currency (0: no maximum)"),
		numberFilter('Min Rating', `${prefix}MinRating`, 'min_rating', 5, 'Lowest average star rating, 1-5 (0: any)'),
		numberFilter('Min Discount', `${prefix}MinDiscount`, 'min_discount', 100, "Lowest percent off Dermstore's RRP (0: no minimum)"),
		numberFilter('Max Discount', `${prefix}MaxDiscount`, 'max_discount', 100, "Highest percent off Dermstore's RRP (0: no maximum)"),
		{
			displayName: 'Include Facets',
			name: `${prefix}IncludeFacets`,
			type: 'boolean',
			default: false,
			description: "Whether to also return Dermstore's filter counts for the results (still 1 credit)",
			routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
		},
	]);

export const dermstoreOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['dermstore'] } },
		options: [
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get dermstore brands',
				description: `The A-Z brand directory of ${FIRST} (about 235 brands), or one letter: total_brands and brands with name, path (what Get List Page takes), URL and letter. ${ONE}.`,
				routing: request('/api/v1/dermstore/brands', true),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get dermstore categories',
				description: `The category tree of ${FIRST}, as its site navigation shows it: categories with name, path (what Get List Page takes), URL and children. ${ONE}.`,
				routing: request('/api/v1/dermstore/categories', true),
			},
			{
				name: 'Get List Page',
				value: 'list',
				action: 'Get a dermstore list page',
				description: `The products of any ${NAME} list page by path or link: a category (/skin-care), brand (/brands/eltamd), sale (/sale), offer (/shop/black-friday/30-off), gift sets (/gift-sets) or ingredient page (/ingredient/retinol), ${FILTERS}: ${ITEM}, ${LIST} An editorial page without a product list is listed through its view-all page (listed_path). ${PRICES} An unknown path is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dermstore/list'),
			},
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get dermstore offers',
				description: `The current offers of ${FIRST}, as its coupon-codes page lists them: title, description, code (when the offer text names one), gift, threshold (the spend the text states), ends (Dermstore's end time, ISO 8601 UTC), URL and list_path (what Get List Page takes, for the products). Dermstore gives no start date. Captured 2026-11-25: "Enjoy 25% off jane iredale with code JOY" plus a gift over $75 on the brand, ending 2026-12-01T08:00:00.000Z. ${ONE}.`,
				routing: request('/api/v1/dermstore/offers', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a dermstore product',
				description: `One ${NAME} product by SKU or link: price, rrp, discount_percent, currency, in_stock, upc (as Dermstore gives it; null for sets), option_type and option, variants (shades, sizes or strengths, each with its own price, rrp, stock, UPC and loyalty points), description, key_benefits, directions, ingredients, at_a_glance, volume, faq, images, offer (Dermstore's promotion banner, as given), auto_replenish (Dermstore's subscribe-and-save discounts), loyalty_points, hsa_fsa, rating, review_count and recent_reviews (the 10 latest: rating, date, text; no reviewer names). Captured 2026-11-25: Medik8 Crystal Retinal 20 30ml (SKU 13806521) at 123 USD with 6 strength variants priced on their own and the offer "30% Off With Code JOY + Gift". ${PRICES} An unknown SKU is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/dermstore/product'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get dermstore search suggestions',
				description: `${FIRST} search-box suggestions for typed text: terms (suggested searches), corrections and up to 5 products with sku, name, URL, price, rrp, discount_percent, rating and review_count. ${ONE}.`,
				routing: request('/api/v1/dermstore/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search dermstore products',
				description: `Search the catalogue of ${FIRST} by keywords or a Dermstore SKU, ${FILTERS}: ${ITEM}, ${LIST} A keyword Dermstore maps to one of its pages (a brand such as eltamd, an ingredient such as retinol, a category such as sunscreen) returns that page's products, as Dermstore's own search does, with resolved_from (type, path, listed_path, URL, title). Captured 2026-11-25: EltaMD UV Clear Broad-Spectrum SPF 46 (1.7 fl. oz., SKU 11370303) at 46 USD (us) and 65.78 CAD (ca). ${PRICES} ${NOT_AVAILABLE} ${ONE}.`,
				routing: request('/api/v1/dermstore/search'),
			},
		],
		default: 'search',
	},
];

export const dermstoreFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords or SKU',
		name: 'dermstoreQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'uv clear spf 46',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
		description:
			'Keywords or a Dermstore SKU. A keyword Dermstore maps to a page (e.g. sunscreen, retinol, eltamd) returns that page\'s products, reported in resolved_from.',
	},

	// -- Get List Page --
	{
		displayName: 'List Page Path or URL',
		name: 'dermstoreList',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/brands/eltamd',
		displayOptions: show(['list']),
		routing: {
			request: {
				body: {
					path: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A Dermstore list page path (e.g. /brands/eltamd, /skin-care, /sale, /shop/black-friday/30-off, /ingredient/retinol; paths come from Get Categories, Get Brands and Get Offers) or a dermstore.com/c/ link',
	},

	// -- Get Product --
	{
		displayName: 'Product SKU or URL',
		name: 'dermstoreProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '11289609',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					sku: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description: 'A Dermstore SKU (sku from a search or list, or a variant sku) or a dermstore.com/p/ product link',
	},

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'dermstoreSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'eltamd',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
		description: 'The text typed so far',
	},

	// -- Get Brands --
	{
		displayName: 'Letter',
		name: 'dermstoreBrandsLetter',
		type: 'string',
		default: '',
		placeholder: 'E',
		displayOptions: show(['brands']),
		routing: { request: { body: { letter: '={{ String($value).trim() || undefined }}' } } },
		description: 'Only brands under this letter (A-Z, or 0-9). Empty: every brand.',
	},

	// -- Country --
	{
		displayName: 'Country',
		name: 'dermstoreCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (CAD)', value: 'ca' },
			{ name: 'United States (USD)', value: 'us' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: "The market. Canada returns Dermstore's own Canadian dollar prices (not converted).",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'dermstoreSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listOptions('dermstoreSearch'),
	},
	{
		displayName: 'Additional Options',
		name: 'dermstoreListOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['list']),
		options: listOptions('dermstoreList'),
	},
];
