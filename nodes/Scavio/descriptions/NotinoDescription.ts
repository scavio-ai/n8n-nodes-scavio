import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['notino'], operation, ...extra },
});

// Notino (notino.com, the Brno-based online perfume and cosmetics store with 27 country shops),
// 10 operations. Credits: 1 per call (2 on notino.co.uk, Market United Kingdom); a paged, sorted or
// filtered category, brand or promo list 3 (4 on gb); a search Notino answers with a brand or
// category page that drops the page, sort or filters 3 (4 on gb); reviews by order code 1 (4 on gb);
// credits_used is the truth. Stores exist on 8 storefronts. Deeper review views (later pages, sorts,
// star filters) can take up to about 4 minutes and the backend asks for a client timeout of at least
// 250 s, so every operation carries a 250s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 250000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'Notino (notino.com, the Brno-based online perfume and cosmetics store with 27 country shops)';
const NAME = 'Notino';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit, 2 on the United Kingdom storefront (credits_used says what was charged)`;
const PAGED = `${CHARGE} Page 1, unsorted and unfiltered: 1 credit (2 on the United Kingdom storefront); any other page, sort or filter: 3 credits (4 on the United Kingdom storefront), because Notino's page 1 is read for the list's own IDs first (credits_used says what was charged)`;
const LANG = "Names, labels and review texts are in the storefront's language, as Notino writes them.";
const ITEM =
	"items with product_id, master_id, URL, name, sub_name, brand, annotation, image, price, currency, rrp (as shown; listings rarely carry one), unit_price, stock_level (Notino's stock word, e.g. more_than_20, last_4, out_of_stock), in_stock, product_code, rating, review_count, is_new, sponsored (a paid placement Notino mixes into the list, kept in place), free_delivery, deal (voucher code, discount, discounted price with the code, basket condition, tags) and variants";
const LIST =
	'plus title, breadcrumbs, sort, page, page_size (24), total, total_pages, has_more, facets (send their value IDs in Filter IDs), price_range and selected_filters.';
const NOT_AVAILABLE =
	"Not available: per-store stock (pickup_store_count says how many Notino stores hold a variant), a postcode store search, cart or checkout prices, price history (schedule a workflow to track changes; lowest_price_30d is Notino's own 30-day low), reviewer names or identity.";
const IS_URL = '/^https?:|^\\/|notino\\./i.test(String($value).trim())';
const STORE_OPS = ['stores', 'store'];
const MARKET_OPS = ['search', 'product', 'reviews', 'category', 'brand', 'promo', 'brands', 'suggestions'];
const LIST_OPS = ['search', 'category', 'brand', 'promo'];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MARKETS = [
	{ name: 'Austria (EUR, German)', value: 'at' },
	{ name: 'Belgium (EUR, French)', value: 'be' },
	{ name: 'Bulgaria (EUR, Bulgarian)', value: 'bg' },
	{ name: 'Croatia (EUR, Croatian)', value: 'hr' },
	{ name: 'Czech Republic (CZK, Czech)', value: 'cz' },
	{ name: 'Denmark (DKK, Danish)', value: 'dk' },
	{ name: 'Estonia (EUR, Estonian)', value: 'ee' },
	{ name: 'Finland (EUR, Finnish)', value: 'fi' },
	{ name: 'France (EUR, French)', value: 'fr' },
	{ name: 'Germany (EUR, German)', value: 'de' },
	{ name: 'Greece (EUR, Greek)', value: 'gr' },
	{ name: 'Hungary (HUF, Hungarian)', value: 'hu' },
	{ name: 'Ireland (EUR, English)', value: 'ie' },
	{ name: 'Italy (EUR, Italian)', value: 'it' },
	{ name: 'Latvia (EUR, Latvian)', value: 'lv' },
	{ name: 'Lithuania (EUR, Lithuanian)', value: 'lt' },
	{ name: 'Netherlands (EUR, Dutch)', value: 'nl' },
	{ name: 'Poland (PLN, Polish)', value: 'pl' },
	{ name: 'Portugal (EUR, Portuguese)', value: 'pt' },
	{ name: 'Romania (RON, Romanian)', value: 'ro' },
	{ name: 'Slovakia (EUR, Slovak)', value: 'sk' },
	{ name: 'Slovenia (EUR, Slovenian)', value: 'si' },
	{ name: 'Spain (EUR, Spanish)', value: 'es' },
	{ name: 'Sweden (SEK, Swedish)', value: 'se' },
	{ name: 'Switzerland (CHF, German)', value: 'ch' },
	{ name: 'Ukraine (UAH, Ukrainian)', value: 'ua' },
	{ name: 'United Kingdom (GBP, English; 2 Credits a Call)', value: 'gb' },
];
// Storefronts with Notino stores and pickup points.
const STORE_MARKETS = [
	{ name: 'Austria', value: 'at' },
	{ name: 'Bulgaria', value: 'bg' },
	{ name: 'Croatia', value: 'hr' },
	{ name: 'Czech Republic', value: 'cz' },
	{ name: 'Hungary', value: 'hu' },
	{ name: 'Poland', value: 'pl' },
	{ name: 'Romania', value: 'ro' },
	{ name: 'Slovakia', value: 'sk' },
];

const listOptions = (prefix: string): INodeProperties[] =>
	sorted([
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Page of 24, 1-500 (total_pages says how deep a list goes)',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Bestseller', value: 'bestseller' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Relevance', value: 'relevance' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			description: "Result order (Notino's own sort options)",
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Filter IDs',
			name: `${prefix}Filters`,
			type: 'string',
			default: '',
			placeholder: '100004',
			description:
				'Up to 10 filter IDs, comma-separated: facets[].values[].ID of an earlier response (brand, category, type of goods, skin type, gender, offers, free delivery, new, rating). IDs of one group widen, of different groups narrow, as on the site.',
			routing: {
				request: {
					body: {
						filters:
							'={{ (l => l.length ? l : undefined)(String($value).split(",").map(s => s.trim()).filter(Boolean).map(Number)) }}',
					},
				},
			},
		},
	]);

export const notinoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['notino'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find notino stores',
				description: `${NAME}'s stores and pickup points in one storefront (Czech Republic, Slovakia, Poland, Austria, Hungary, Romania, Bulgaria, Croatia), optionally one city: stores with store (what Get Store takes), URL, name, place, address, latitude, longitude, opening_hours, open_now and status_changes_at, plus cities and total_stores. Listed by city; there is no postcode search. Captured 2026-11-26: 7 stores in the Czech Republic (Brno, Ostrava, Praha). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/notino/stores', true),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get notino brand products',
				description: `One brand's products on a ${NAME} storefront, with page, sort and filters: ${ITEM}, ${LIST} Captured 2026-11-26: CeraVe on notino.de listed 44 products; Skin Renewing Peptide Cream 48 g at 27.90 EUR, 16.74 EUR with the Black Friday code black (40% off). ${LANG} ${PAGED}.`,
				routing: request('/api/v1/notino/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get notino brands',
				description: `A ${NAME} storefront's brand directory (1,765 brands on notino.de on 2026-11-26), filtered by text, first letter or featured: brands with name, slug (what Get Brand Products takes), URL, featured and letter, plus total_brands and matches. ${ONE}.`,
				routing: request('/api/v1/notino/brands', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get notino category products',
				description: `One ${NAME} category's products by path or link, with page, sort and filters: ${ITEM}, ${LIST} Captured 2026-11-26: /hautseren/ (face serums) on notino.de listed 2,549 products over 107 pages. ${LANG} ${PAGED}.`,
				routing: request('/api/v1/notino/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a notino product',
				description: `One ${NAME} product with every variant (size, shade) by link or order code: name, brand (with manufacturer), annotation, collection, gender, description, fragrance_notes, breadcrumbs, category, rating, and variants with order_code, EAN, price, currency, VAT, rrp (where the storefront shows one, e.g. Spain), lowest_price_30d (the lowest price of the last 30 days Notino shows under EU price rules), unit_price, amount, availability (stock_level, max_order_quantity, pickup_store_count), shades, images, characteristics, ingredients, instructions and warnings; plus gift_campaigns, deliveries (carrier, price, free shipping, date, order-by time), alternate_sites (the same product on other storefronts) and related_product_ids. Voucher codes show on listings (items[].deal). Captured 2026-11-26: DIOR Sauvage Eau de Parfum 200 ml (order code CHD13588, EAN 3348901428545) at 180 EUR on notino.de with lowest_price_30d 170, and 805 PLN on notino.pl. A product the storefront does not sell is a charged not-found. ${LANG} ${NOT_AVAILABLE} ${ONE}.`,
				routing: request('/api/v1/notino/product'),
			},
			{
				name: 'Get Promo Products',
				value: 'promo',
				action: 'Get notino promo products',
				description: `A ${NAME} promo list (default Black Friday) with its products and the terms its banner gives (as Notino writes them, e.g. the code and dates): ${ITEM}, ${LIST} Every item carries its own deal. Captured 2026-11-26: /black-friday/ on notino.de listed 12,000 products; its terms gave the code black, valid 23.11. to 29.11.2026. ${LANG} ${PAGED}.`,
				routing: request('/api/v1/notino/promo', true),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get notino reviews',
				description: `Customer reviews of one ${NAME} product, 8 a page (up to page 8 per view), five sorts and a star filter: reviews with review_id, rating, title, text, created_at, likes, dislikes, verified_purchase, author_type, variant_id, from_shop, translated, source_language and the original text, plus average_rating, rating_count, total, rating_buckets, shops, variants and aspects (per-aspect ratings, on review-tab views). No reviewer name or identity. Captured 2026-11-26: DIOR Sauvage on notino.de averaged 4.8 from 77 ratings, with 54 written reviews from notino.de, notino.at and notino.ch. ${CHARGE} The newest 8 (page 1, no star filter): 1 credit (2 on the United Kingdom storefront; by order code 1, or 4 on the United Kingdom storefront). Any other page, sort or star filter: 1 credit on every storefront, slower (typically 10-45 seconds, up to about 4 minutes).`,
				routing: request('/api/v1/notino/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a notino store',
				description: `One ${NAME} store's page: name, description, open_now, status_changes_at, services (card payment, complaints, direct sale, order pickup, dermo shop), opening_hours (7 days from today, with public holidays), address, latitude, longitude, map_url, phone, email and images. Per-store stock is not offered. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/notino/store'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get notino search suggestions',
				description: `${NAME}'s search suggestions for typed text: sections (collections, brands ...) with text, kind and URL, and products with name, description, product_code, URL and image. ${ONE}.`,
				routing: request('/api/v1/notino/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search notino products',
				description: `Search ${FIRST} by text, with page, sort and filters: ${ITEM}, ${LIST} Notino sends brand names and some category words to that page (redirected_to). Sorted by relevance Notino stops the list near 500 products (total_capped true); any other sort lists the full set. Captured 2026-11-26: "vitamin c serum" on notino.de listed 499 products (capped). ${LANG} ${NOT_AVAILABLE} ${CHARGE} Costs 1 credit (2 on the United Kingdom storefront) with any page, sort or filter; a search Notino answers with a brand or category page that does not keep them: 3 credits (4 on the United Kingdom storefront).`,
				routing: request('/api/v1/notino/search'),
			},
		],
		default: 'search',
	},
];

export const notinoFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Search Text',
		name: 'notinoQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vitamin c serum',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "Search text (any language; the storefront's own language matches best)",
	},

	// -- Get Product / Get Reviews --
	{
		displayName: 'Product URL or Order Code',
		name: 'notinoProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.notino.de/dior/sauvage-eau-de-parfum-fuer-herren/',
		displayOptions: show(['product', 'reviews']),
		routing: {
			request: {
				body: {
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
					order_code: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
				},
			},
		},
		description:
			"A Notino product link or path (/brand/product/, or /brand/product/p-variant ID/ for one size or shade; a link picks its own storefront) or an order code (variants[].order_code, e.g. CHD7138)",
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path or URL',
		name: 'notinoCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/hautseren/',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A Notino category path (breadcrumbs[].URL, facets of type Category) or its link',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand Slug or URL',
		name: 'notinoBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cerave',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand: brands[].slug of Get Brands (e.g. dior, cerave) or its link',
	},

	// -- Get Promo Products --
	{
		displayName: 'Promo Path or URL',
		name: 'notinoPromo',
		type: 'string',
		default: '',
		placeholder: 'black-friday',
		displayOptions: show(['promo']),
		routing: { request: { body: { promo: '={{ String($value).trim() || undefined }}' } } },
		description: 'A promo page path or link. Empty: black-friday (live on every storefront in November 2026).',
	},

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'notinoSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dior sa',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Store --
	{
		displayName: 'Store',
		name: 'notinoStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'florentinum-praha',
		displayOptions: show(['store']),
		routing: { request: { body: { store: '={{ String($value).trim() }}' } } },
		description: "The store: stores[].store of a Find Stores response, or the store's link",
	},

	// -- Find Stores --
	{
		displayName: 'City',
		name: 'notinoStoresCity',
		type: 'string',
		default: '',
		placeholder: 'Praha',
		displayOptions: show(['stores']),
		routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
		description: 'Only the stores in this city (accents and case do not matter). Empty: every store.',
	},

	// -- Market --
	{
		displayName: 'Market',
		name: 'notinoMarket',
		type: 'options',
		default: 'de',
		options: MARKETS,
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { market: '={{ $value === "de" ? undefined : $value }}' } } },
		description:
			'The storefront, each in its own language and currency with its own prices (a product or listing link picks its own). The United Kingdom storefront costs more per call.',
	},
	{
		displayName: 'Market',
		name: 'notinoStoreMarket',
		type: 'options',
		default: 'cz',
		options: STORE_MARKETS,
		displayOptions: show(STORE_OPS),
		routing: { request: { body: { market: '={{ $value === "cz" ? undefined : $value }}' } } },
		description: 'A storefront with Notino stores and pickup points',
	},

	// -- Additional Options --
	...LIST_OPS.map(
		(op): INodeProperties => ({
			displayName: 'Additional Options',
			name: `notino${op[0].toUpperCase()}${op.slice(1)}Options`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show([op]),
			options: listOptions(`notino${op[0].toUpperCase()}${op.slice(1)}`),
		}),
	),
	{
		displayName: 'Additional Options',
		name: 'notinoReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'notinoReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 8 },
				description: 'Page of 8, 1-8',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'notinoReviewsRating',
				type: 'options',
				default: 0,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
					{ name: 'All', value: 0 },
				],
				description: 'Only reviews with this many stars',
				routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'notinoReviewsSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: "Review order (the review tab's own five orders)",
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'notinoBrandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands']),
		options: [
			{
				displayName: 'Featured Only',
				name: 'notinoBrandsFeatured',
				type: 'boolean',
				default: false,
				description: "Whether to return only the brands Notino's directory highlights (in bold)",
				routing: { request: { body: { featured_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Letter',
				name: 'notinoBrandsLetter',
				type: 'string',
				default: '',
				placeholder: 'D',
				description: 'Brands starting with this letter or digit',
				routing: { request: { body: { letter: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'notinoBrandsLimit',
				type: 'number',
				default: 500,
				typeOptions: { minValue: 1, maxValue: 2000 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 500 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Name Contains',
				name: 'notinoBrandsQuery',
				type: 'string',
				default: '',
				placeholder: 'dior',
				description: 'Brands whose name contains this text',
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'notinoBrandsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
];
