import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['abercrombie'], operation, ...extra },
});

// Abercrombie & Fitch Co. (abercrombie.com: Abercrombie & Fitch, abercrombie kids, YPB; hollisterco.com: Hollister,
// Gilly Hicks), 10 operations, 1 credit each (Get Reviews 2 without a product URL); credits_used is the truth. Brand anf
// or hol, 16 storefronts. Reviews take 15 to 60 s, so every operation carries a 180s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	'Abercrombie & Fitch Co. (abercrombie.com: Abercrombie & Fitch, abercrombie kids, YPB; hollisterco.com: Hollister, Gilly Hicks), chosen with Brand';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICE =
	"Price (text, current, original, was, discount_text, flag) is as the storefront shows it; member_price (text, value, label) is the member price the site shows to every visitor, with the site's own label such as Black Friday Price.";
const WD =
	"On the worldwide storefronts (wd, wd_es) prices are the site's own conversion from USD into the ship-to country's currency (converted_currency true) and usd_price carries the same item in USD.";
const CARD =
	'product_id, collection_id, name, department, gender, URL, online_available, descriptors, badges, price, member_price, promo_message, image, colors (name, product_id)';
const STORE =
	'store_number (for Get Store), name, brand, address, distance, phone, coordinates, hours (this week, holiday hours included) and messages';

const MARKET_OPS = ['search', 'product', 'category', 'categories', 'promotions', 'reviews', 'suggestions'];
const STORE_OPS = ['storeStock', 'stores', 'store'];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A list typed as a JSON array or as comma-separated values; undefined when empty. */
const LIST =
	'={{ (() => { const v = String($value ?? "").trim(); if (!v) return undefined; const l = v.startsWith("[") ? JSON.parse(v) : v.split(","); const out = l.map((x) => String(x).trim()).filter(Boolean); return out.length ? out : undefined; })() }}';

const sortOption = (name: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: 'best_match',
	options: [
		{ name: 'Best Match', value: 'best_match' },
		{ name: 'Best Selling', value: 'best_selling' },
		{ name: 'Customer Ratings', value: 'rating' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
	],
	description: "The site's sort menu",
	routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
});

const facetsOption = (name: string): INodeProperties => ({
	displayName: 'Facets',
	name,
	type: 'string',
	default: '',
	placeholder: "gender:Men's, colorFamily:Black",
	description:
		"Filters as facet ID:value, comma-separated or a JSON array, at most 20 (facets[].values[].filter in an answer), e.g. gender:Men's, colorFamily:Black, sizes:M",
	routing: { request: { body: { facets: LIST } } },
});

const pageOption = (name: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 200 },
	description: 'Page, from 1 (at most 200)',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const productIdField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Product ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '59359439',
	displayOptions: show([operation]),
	routing: { request: { body: { product_id: '={{ String($value).trim() }}' } } },
	description:
		'A product ID (products[].product_id from Search Products or Get Category Products, colors[].product_id, or the number at the end of a product link), 5 to 12 digits',
});

const placeFields = (prefix: string, operation: string): INodeProperties[] => [
	{
		displayName: 'Find By',
		name: `${prefix}By`,
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'US ZIP Code', value: 'zip' },
			{ name: 'Coordinates', value: 'point' },
		],
		displayOptions: show([operation]),
		description: 'Look stores up near a US ZIP code, or near a point (outside the US, use coordinates)',
	},
	{
		displayName: 'ZIP Code',
		name: `${prefix}Zip`,
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show([operation], { [`${prefix}By`]: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code (US stores)',
	},
	{
		displayName: 'Latitude',
		name: `${prefix}Latitude`,
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show([operation], { [`${prefix}By`]: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point, e.g. 40.7128',
	},
	{
		displayName: 'Longitude',
		name: `${prefix}Longitude`,
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show([operation], { [`${prefix}By`]: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point, e.g. -74.006',
	},
];

const placeOptions = (prefix: string): INodeProperties[] =>
	sorted([
		{
			displayName: 'Limit',
			name: `${prefix}Limit`,
			type: 'number',
			default: 10,
			typeOptions: { minValue: 1, maxValue: 25 },
			description: 'Max number of results to return',
			routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Radius',
			name: `${prefix}Radius`,
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 250 },
			description: 'Search radius, 1 to 250 (default 50)',
			routing: { request: { body: { radius: '={{ $value === 50 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Unit',
			name: `${prefix}Unit`,
			type: 'options',
			default: 'default',
			options: [
				{ name: 'Default (Miles in the US, Kilometers Elsewhere)', value: 'default' },
				{ name: 'Kilometers', value: 'km' },
				{ name: 'Miles', value: 'mi' },
			],
			description: 'The radius and distance unit',
			routing: { request: { body: { unit: '={{ $value === "default" ? undefined : $value }}' } } },
		},
	]);

export const abercrombieOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['abercrombie'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get abercrombie and fitch categories',
				description: `The category tree of one ${SITE} storefront: root_category_id, count and categories (category_id for Get Category Products on this storefront, name, URL, type regular, clearance or featured, children). Category IDs are per region. Captured 2026-11-27: the Abercrombie & Fitch UK storefront listed 71 categories under New, Women's, Men's, Jeans, Gifts, Sale and About Us. ${ONE}`,
				routing: request('/api/v1/abercrombie/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get abercrombie and fitch category products',
				description: `One ${SITE} category's products on one storefront, 1 to 90 a page with the site's 6 sorts and facet filters: category_id, name, title, breadcrumbs, currency, converted_currency, page, page_size, total, total_pages, count, has_more, sort_options, facets and products (${CARD}, social_proof as the site gives it, e.g. 567 people purchased). ${PRICE} ${WD} Sale and Black Friday landing categories list no products: use a department's clearance category. An unknown category on the storefront is a charged not-found. Captured 2026-11-27: Men's Jeans (12236) on the US storefront held 86 products, the first the Relaxed Jean at 80 USD. ${ONE}`,
				routing: request('/api/v1/abercrombie/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an abercrombie and fitch product',
				description: `One ${SITE} product by product ID, with every color and every size (and length) SKU: currency, converted_currency, is_sold_out, size_headings, sizes, breadcrumbs, reviews_summary (average, count, distribution, fit), color_count, sku_count and colors (product_id, name, color_family, item_numbers, short_description, fabric, care, measurements, final_sale, max_purchase_qty, badges, price, member_price, URL, images, skus with sku for Get Store Stock, size, online_units as the exact units the site shows online, status, preorder, price, member_price). No UPC or EAN is published. ${PRICE} ${WD} An unknown product ID is a charged not-found. Captured 2026-11-27: the Baggy Jean came in 15 colors and 480 SKUs at 90 USD, member price 67.50 USD (Black Friday Price), rated 4.8 from 3822 reviews. ${ONE}`,
				routing: request('/api/v1/abercrombie/product'),
			},
			{
				name: 'Get Promotions',
				value: 'promotions',
				action: 'Get abercrombie and fitch promotions',
				description: `The banner offers one ${SITE} storefront shows now, in its own language: count, offers (text, markers, valid_from, valid_to, terms) and terms (marker, text as given, dates, valid_from, valid_to; dates read from the text where it states full dates). Captured 2026-11-27: the US Abercrombie & Fitch storefront showed a Black Friday 25-50% off everything A&F valid 2026-11-23 to 2026-11-30 and free standard shipping on orders over 99 USD. ${ONE}`,
				routing: request('/api/v1/abercrombie/promotions', true),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get abercrombie and fitch reviews',
				description: `The 8 newest reviews of one ${SITE} product as its product page shows them (storefronts us, ca, uk, eu and eu_de): total, count, summary (average, count, distribution, recommended_count, not_recommended_count, fit_average) and reviews (ID, rating, title, text, submitted_at, recommended, incentivized, syndicated, language, fit_rating, ratings, helpful votes, brand_responses). No reviewer names; no deeper pages, sorts or star filters. Takes 15 to 60 seconds. Captured 2026-11-27: the Baggy Jean had 3676 reviews averaging 4.81, fit average 3.09. Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit with the product URL, 2 without it (credits_used says what was charged).`,
				routing: request('/api/v1/abercrombie/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get abercrombie and fitch search suggestions',
				description: `The search suggestions one ${SITE} storefront gives for a few letters: query, count and suggestions (terms). Captured 2026-11-27: hoo on the US Abercrombie & Fitch storefront gave 10 suggestions, from hoodie to sunday popover hoodie. ${ONE}`,
				routing: request('/api/v1/abercrombie/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an abercrombie and fitch store',
				description: `One ${SITE} store by store number: name, address, phone, coordinates and hours dated for the next 7 days (date, label, open, close, closed; holiday hours included). An unknown store is a charged not-found. Captured 2026-11-27: store 11958, Northpark Center in Dallas, TX, open 10am to 9pm on 2026-11-27. ${ONE}`,
				routing: request('/api/v1/abercrombie/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get abercrombie and fitch store stock',
				description: `Store stock for 1 to 10 SKUs at the ${SITE} stores near a US ZIP code or a point, nearest first: total, count and stores (${STORE}, stock with sku, units as the exact units the store shows, status available, backorderable or unavailable, available_date, available_label). Prices are national (online), not per store. Captured 2026-11-27: two Baggy Jean SKUs near ZIP 10001 were in stock at 10 stores, the nearest Flatiron at 0.83 miles with 4 and 3 units. ${ONE}`,
				routing: request('/api/v1/abercrombie/store-stock'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get abercrombie and fitch stores',
				description: `The ${SITE} stores near a US ZIP code or a point, nearest first (anf: Abercrombie & Fitch and abercrombie kids; hol: Hollister and Gilly Hicks): total, count and stores (${STORE}). Captured 2026-11-27: ZIP 43215 had 3 Hollister stores within 50 miles, the nearest Easton Town Center at 7.71 miles. ${ONE}`,
				routing: request('/api/v1/abercrombie/stores'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search abercrombie and fitch products',
				description: `${SITE} keyword search on one of 16 storefronts, 48 products a page with the site's 6 sorts and facet filters: query, currency, converted_currency, page, total, total_pages, count, has_more, sort_options, facets (ID, name, values with count and filter) and products (${CARD}, usd_price on wd). ${PRICE} ${WD} Captured 2026-11-27: baggy jeans on the US Abercrombie & Fitch storefront gave 1219 results, the first the Baggy Jean at 90 USD with a 67.50 USD Black Friday Price; hoodie on Hollister worldwide shipped to Australia gave 559 results in AUD. ${ONE}`,
				routing: request('/api/v1/abercrombie/search'),
			},
		],
		default: 'search',
	},
];

export const abercrombieFields: INodeProperties[] = [
	// -- Brand (every operation) --
	{
		displayName: 'Brand',
		name: 'abercrombieBrand',
		type: 'options',
		default: 'anf',
		options: [
			{ name: 'Abercrombie & Fitch (Abercrombie & Fitch, Abercrombie Kids, YPB)', value: 'anf' },
			{ name: 'Hollister (Hollister, Gilly Hicks)', value: 'hol' },
		],
		displayOptions: show([...MARKET_OPS, ...STORE_OPS]),
		routing: { request: { body: { brand: '={{ $value === "anf" ? undefined : $value }}' } } },
		description: 'Abercrombie.com (anf) or hollisterco.com (hol)',
	},

	// -- Storefront and ship-to country (catalog operations) --
	{
		displayName: 'Storefront',
		name: 'abercrombieStorefront',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (CAD)', value: 'ca' },
			{ name: 'Canada in French (CAD)', value: 'ca_fr' },
			{ name: 'Europe (English, EUR)', value: 'eu' },
			{ name: 'Europe in Dutch (EUR)', value: 'eu_nl' },
			{ name: 'Europe in French (EUR)', value: 'eu_fr' },
			{ name: 'Europe in German (EUR)', value: 'eu_de' },
			{ name: 'Europe in Italian (EUR)', value: 'eu_it' },
			{ name: 'Europe in Spanish (EUR)', value: 'eu_es' },
			{ name: 'Hong Kong (HKD)', value: 'am' },
			{ name: 'Hong Kong in Traditional Chinese (HKD)', value: 'am_zh' },
			{ name: 'Japan (JPY)', value: 'am_ja' },
			{ name: 'United Kingdom (GBP)', value: 'uk' },
			{ name: 'United States (USD)', value: 'us' },
			{ name: 'United States in Spanish (USD)', value: 'us_es' },
			{ name: 'Worldwide (Converted From USD)', value: 'wd' },
			{ name: 'Worldwide in Spanish (Converted From USD)', value: 'wd_es' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { storefront: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'The storefront: its language and currency. Reviews work on the US, Canada, United Kingdom, Europe and Europe in German storefronts.',
	},
	{
		displayName: 'Ship-To Country',
		name: 'abercrombieCountry',
		type: 'string',
		default: '',
		placeholder: 'DE',
		displayOptions: show(MARKET_OPS),
		routing: {
			request: { body: { country: '={{ String($value).trim() ? String($value).trim().toUpperCase() : undefined }}' } },
		},
		description:
			"Two letters, on the Europe and Worldwide storefronts only (e.g. DE, SE, AU, IL); on Worldwide it picks the currency. Leave empty for the storefront's default. Mexico, Saudi Arabia, Qatar, Indonesia and Taiwan are served by franchise partners' own sites and are refused.",
	},

	// -- Store country (store operations) --
	{
		displayName: 'Store Country',
		name: 'abercrombieStoreCountry',
		type: 'string',
		default: 'US',
		placeholder: 'US',
		displayOptions: show(STORE_OPS),
		routing: {
			request: {
				body: {
					country:
						'={{ String($value).trim() && String($value).trim().toUpperCase() !== "US" ? String($value).trim().toUpperCase() : undefined }}',
				},
			},
		},
		description:
			'Two letters (default US): US, CA, GB, a European country (IE, FR, DE, IT, ES, NL, SE ...), JP, HK, MO, CN or AE',
	},

	// -- Search Products --
	{
		displayName: 'Query',
		name: 'abercrombieQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'baggy jeans',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords (1 to 100 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'abercrombieSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			facetsOption('abercrombieSearchFacets'),
			pageOption('abercrombieSearchPage'),
			sortOption('abercrombieSearchSort'),
		]),
	},

	// -- Get Product --
	productIdField('abercrombieProductId', 'product'),
	{
		displayName: 'Additional Options',
		name: 'abercrombieProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Collection ID',
				name: 'abercrombieProductCollectionId',
				type: 'string',
				default: '',
				placeholder: '607722',
				description: "The product's collection ID (products[].collection_id from Search Products); saves a lookup",
				routing: {
					request: { body: { collection_id: '={{ String($value).trim() || undefined }}' } },
				},
			},
		],
	},

	// -- Get Store Stock --
	{
		displayName: 'SKUs',
		name: 'abercrombieStockSkus',
		type: 'string',
		required: true,
		default: '',
		placeholder: '662258406, 662258414',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { skus: LIST } } },
		description:
			'1 to 10 SKUs (colors[].skus[].sku from Get Product), comma-separated or a JSON array',
	},
	...placeFields('abercrombieStock', 'storeStock'),
	{
		displayName: 'Additional Options',
		name: 'abercrombieStockOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storeStock']),
		options: placeOptions('abercrombieStock'),
	},

	// -- Get Stores --
	...placeFields('abercrombieStores', 'stores'),
	{
		displayName: 'Additional Options',
		name: 'abercrombieStoresOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: placeOptions('abercrombieStores'),
	},

	// -- Get Store --
	{
		displayName: 'Store Number',
		name: 'abercrombieStoreNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '11958',
		displayOptions: show(['store']),
		routing: { request: { body: { store_number: '={{ String($value).trim() }}' } } },
		description: 'A store number (store_number from Get Stores or Get Store Stock)',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID',
		name: 'abercrombieCategoryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12236',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ String($value).trim() }}' } } },
		description: 'A category ID from Get Categories on the same storefront (IDs are per region)',
	},
	{
		displayName: 'Additional Options',
		name: 'abercrombieCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			facetsOption('abercrombieCategoryFacets'),
			pageOption('abercrombieCategoryPage'),
			{
				displayName: 'Page Size',
				name: 'abercrombieCategoryPageSize',
				type: 'number',
				default: 90,
				typeOptions: { minValue: 1, maxValue: 90 },
				description: 'Products per page, 1 to 90 (default 90)',
				routing: { request: { body: { page_size: '={{ $value === 90 ? undefined : $value }}' } } },
			},
			sortOption('abercrombieCategorySort'),
		]),
	},

	// -- Get Reviews --
	productIdField('abercrombieReviewsProductId', 'reviews'),
	{
		displayName: 'Additional Options',
		name: 'abercrombieReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Product URL',
				name: 'abercrombieReviewsUrl',
				type: 'string',
				default: '',
				description:
					"The product link (URL from Search Products or Get Product) on the chosen brand's site; saves a lookup and a credit",
				routing: { request: { body: { url: '={{ String($value).trim() || undefined }}' } } },
			},
		],
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'abercrombieSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hoo',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far (1 to 100 characters)',
	},
];
