import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['magalu'], operation, ...extra },
});

// Magazine Luiza (magazineluiza.com.br, Magalu, the Brazilian retailer), 8 operations, 2 credits each; credits_used is
// the truth. Brazil only, BRL. Listing and product pages usually take 10 to 60 s (deal pages took up to 161 s on Black
// Friday 2026), so they carry a 270s timeout; reviews, suggestions and stores carry 120s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const PAGE_TIMEOUT = 270000;
const FAST_TIMEOUT = 120000;

const SITE =
	'Magazine Luiza (magazineluiza.com.br, Magalu, the Brazilian retailer), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in';
const TWO =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 2 credits (credits_used says what was charged).';
const PRICES =
	"price is the card price, list_price the regular price when a lower one applies, pix_price and pix_discount_percent the price paid by Pix (Brazil's instant payment).";
const GRID =
	'40 a page (sponsored cards flagged), pages 1 to 25: page, page_size, total, total_pages, has_more, count, sponsored_count, sort, items (position, product_id for Get Product and Get Reviews, title, reference, brand, URL, image, available, sponsored, price, list_price, discount_percent, pix_price, pix_discount_percent, installment, seller with ID, name and is_magalu, rating, review_count, coupon, deal_starts_at, deal_ends_at, badges, tags, variants), facets (slug, label, values with counts; send back in Brand, Seller, Promotion or Attributes), price_range, rating_range and filters_applied.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as an array, or undefined when empty. */
const list = (v = '$value') =>
	`={{ (() => { const a = String(${v} ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length ? (a.length === 1 ? a[0] : a) : undefined; })() }}`;

const listOption = (displayName: string, name: string, key: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: list() } } },
});

/** A Magazine Luiza product ID or a magazineluiza.com.br product link, sent as product_id or url. */
const productField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Product ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '238058800',
	displayOptions: show(operations),
	routing: {
		request: {
			body: {
				product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'A Magazine Luiza product ID (product_id or a variant\'s variation_id from another answer, e.g. 238058800 or ffh7ah372g) or a magazineluiza.com.br product link',
});

/** Sort, filters and paging shared by Search Products, Get Category Products and Get Deals. */
const gridOptions = (prefix: string): INodeProperties[] =>
	sorted([
		{
			displayName: 'Attributes (JSON)',
			name: `${prefix}Attributes`,
			type: 'json',
			default: '{}',
			description:
				'Attribute facets: facet slug to value slug or list, as facets slug and values of an answer list them, e.g. {"voltagem": "220v", "cor": ["branco", "inox"]}',
			routing: {
				request: {
					body: {
						attributes:
							'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
					},
				},
			},
		},
		{
			displayName: 'Black Friday Only',
			name: `${prefix}BlackFriday`,
			type: 'boolean',
			default: false,
			description: "Whether to keep only items in the site's Black Friday promotion (Ofertas Black)",
			routing: { request: { body: { black_friday: '={{ $value ? true : undefined }}' } } },
		},
		listOption('Brand', `${prefix}Brand`, 'brand', 'brastemp, lg', 'Brand slugs as the site writes them (facets brand values), comma-separated; several match any of them'),
		{
			displayName: 'Max Price (BRL)',
			name: `${prefix}MaxPrice`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Maximum price in BRL; 0 means no limit',
			routing: { request: { body: { max_price: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Price (BRL)',
			name: `${prefix}MinPrice`,
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Minimum price in BRL; 0 means no limit',
			routing: { request: { body: { min_price: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Min Rating',
			name: `${prefix}MinRating`,
			type: 'options',
			default: 0,
			options: [
				{ name: 'Any', value: 0 },
				{ name: '1 Star and Up', value: 1 },
				{ name: '2 Stars and Up', value: 2 },
				{ name: '3 Stars and Up', value: 3 },
				{ name: '4 Stars and Up', value: 4 },
				{ name: '5 Stars', value: 5 },
			],
			routing: { request: { body: { min_rating: '={{ $value > 0 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 25 },
			description: 'Page, 1 to 25 (40 a page)',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		listOption('Promotion', `${prefix}Promotion`, 'promotion', 'promocao_sazonal_3', 'Promotion IDs (facets promotion values, e.g. promocao_sazonal_3 for Ofertas do Dia), comma-separated'),
		listOption('Seller', `${prefix}Seller`, 'seller', 'magalu', "magalu (Magalu's own offers) or marketplace seller IDs (facets seller values), comma-separated"),
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'Fastest Delivery', value: 'fastest_delivery' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price With Shipping', value: 'price_with_shipping' },
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Relevance', value: 'relevance' },
				{ name: 'Top Rated', value: 'top_rated' },
			],
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
	]);

export const magaluOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['magalu'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get magalu category products',
				description: `One ${SITE} category listing (a department or a subcategory) by path or link, sorted and filtered like Search Products: path, URL, category (name, canonical_url, breadcrumbs) and ${GRID} ${PRICES} An unknown category is a charged not-found. Captured 2026-11-27: the Geladeira Refrigerador subcategory sorted Best Sellers held 616 products. ${TWO}`,
				routing: request('/api/v1/magalu/category', PAGE_TIMEOUT),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get magalu deals',
				description: `One ${SITE} deal selection: the daily deals (ofertasdodia, default) or a campaign selection (blackfriday2026 ...), sorted and filtered like Search Products; each card carries its deal timer (deal_starts_at, deal_ends_at) and coupon where the site shows them: selection, URL, selection_info and ${GRID} ${PRICES} An unknown selection is a charged not-found. Captured 2026-11-27: ofertasdodia held 353 deals, one running to 2026-11-30T09:59:59-03:00 with a 30 BRL coupon. ${TWO}`,
				routing: request('/api/v1/magalu/deals', PAGE_TIMEOUT, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a magalu product',
				description: `One ${SITE} product by ID or link: title, reference, brand, URL, category, breadcrumbs, available (no stock units), price, list_price, discount_percent, pix_price, pix_discount_percent, best_installment, payment_methods (Luiza Ouro, card brands and Pix with every plan), coupons, deal_starts_at, deal_ends_at, max_checkout_quantity, minimum_order_quantity, badges, seller (ID, name, legal_name, CNPJ, is_magalu, seller_since, score, total_sales, answer_rate, city, state), rating, review_count, variants, images, specs and questions with answers (no names). ${PRICES} No GTIN; shipping by CEP and store pickup are not available. An unknown product is a charged not-found. Captured 2026-11-27: the LG Frost Free Smart Inverse 462L at 3893.68 BRL by card or 3699 BRL by Pix, sold by Magalu. ${TWO}`,
				routing: request('/api/v1/magalu/product', PAGE_TIMEOUT),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get magalu reviews',
				description: `Reviews of one ${SITE} product, in 4 sorts, up to 50 a page: rating, review_count, comment_count, star_distribution, aspect_ratings, summary (Magalu's own summary of the reviews, as given), page, total, total_pages and reviews (review_id, rating, title, text, submitted_at, variant, aspects, SKU, images, videos). No reviewer names; no star filter. An unknown product is a charged not-found. Captured 2026-11-27: product 238058800 rated 4.8 from 1240 ratings, 620 written reviews. ${TWO}`,
				routing: request('/api/v1/magalu/reviews', FAST_TIMEOUT),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get magalu search suggestions',
				description: `The ${SITE} search suggestions for the start of a search: query, count and suggestions (position, term), up to 10 as the site gives them (it can answer none). Failed upstream calls and refused inputs are not charged. Costs 2 credits (credits_used says what was charged).`,
				routing: request('/api/v1/magalu/suggestions', FAST_TIMEOUT),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a magalu store',
				description: `One Magazine Luiza store by store number or link: store_id, name, street_address, city, state, CEP (Brazilian postal code), phone, URL and opening_hours (as the store page gives them; null when it gives none). No coordinates. An unknown store is a charged not-found. Captured 2026-11-27: store 1000, Loja Itaberaba in Sao Paulo, CEP 02739000. ${TWO}`,
				routing: request('/api/v1/magalu/store', FAST_TIMEOUT),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get magalu stores',
				description: `The physical Magazine Luiza stores in one Brazilian state (UF), optionally one city, in the site's order: state, city, state_total, city_count, count and stores (store_id for Get Store, name, city, neighborhood, state, URL). Address, CEP and phone come from Get Store; store hours, coordinates, search by CEP, store pickup and store stock are not published. Captured 2026-11-27: state SP listed 513 stores, 235 in Sao Paulo city. ${TWO}`,
				routing: request('/api/v1/magalu/stores', FAST_TIMEOUT),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search magalu products',
				description: `${SITE} keyword search in the site's 8 sorts, filtered by brand, seller (Magalu or a marketplace seller), price range, minimum rating, Black Friday promotion, promotion and attribute facets: query, term, URL and ${GRID} ${PRICES} No results is an empty answer. Captured 2026-11-27: geladeira frost free counted 1000 results over 25 pages, the first at 3893.68 BRL by card or 3699 BRL by Pix, rated 4.8 from 1240 reviews. ${TWO}`,
				routing: request('/api/v1/magalu/search', PAGE_TIMEOUT),
			},
		],
		default: 'search',
	},
];

export const magaluFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'magaluQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'geladeira frost free',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as a shopper types them (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'magaluSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('magaluSearch'),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'magaluCategoryPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/geladeira-refrigerador/eletrodomesticos/s/ed/refr/',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description:
			'A category path or magazineluiza.com.br link: a department (/eletrodomesticos/l/ed/) or a subcategory (/geladeira-refrigerador/eletrodomesticos/s/ed/refr/)',
	},
	{
		displayName: 'Additional Options',
		name: 'magaluCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('magaluCategory'),
	},

	// -- Get Deals --
	{
		displayName: 'Additional Options',
		name: 'magaluDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: sorted([
			{
				displayName: 'Selection',
				name: 'magaluDealsSelection',
				type: 'string',
				default: 'ofertasdodia',
				placeholder: 'blackfriday2026',
				description: 'A deal selection ID or /selecao/ link: ofertasdodia (the daily deals), blackfriday2026, blackfriday2026_celulares, blackfriday2026_eletro, blackfriday2026_games, blackfriday2026_info',
				routing: { request: { body: { selection: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('magaluDeals'),
		]),
	},

	// -- Get Product, Get Reviews --
	productField('magaluProduct', ['product', 'reviews']),
	{
		displayName: 'Additional Options',
		name: 'magaluReviewOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'magaluReviewPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'magaluReviewPageSize',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'magaluReviewSort',
				type: 'options',
				default: 'most_relevant',
				options: [
					{ name: 'Most Negative', value: 'most_negative' },
					{ name: 'Most Positive', value: 'most_positive' },
					{ name: 'Most Recent', value: 'most_recent' },
					{ name: 'Most Relevant', value: 'most_relevant' },
				],
				routing: { request: { body: { sort: '={{ $value === "most_relevant" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'magaluSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'geladeira',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a search, as a shopper types it (1 to 100 characters)',
	},

	// -- Get Stores --
	{
		displayName: 'State (UF)',
		name: 'magaluStoresState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sp',
		displayOptions: show(['stores']),
		routing: { request: { body: { state: '={{ String($value).trim().toLowerCase() }}' } } },
		description:
			'Brazilian state code: ac, al, am, ap, ba, ce, df, es, go, ma, mg, ms, mt, pa, pb, pe, pi, pr, rj, rn, ro, rr, rs, sc, se, sp, to',
	},
	{
		displayName: 'City',
		name: 'magaluStoresCity',
		type: 'string',
		default: '',
		placeholder: 'Sao Paulo',
		displayOptions: show(['stores']),
		routing: { request: { body: { city: '={{ String($value).trim() || undefined }}' } } },
		description: 'Only the stores in this city (accents and case ignored). Leave empty for the whole state.',
	},

	// -- Get Store --
	{
		displayName: 'Store Number or URL',
		name: 'magaluStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1000',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					store_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A store number (store_id from Get Stores, e.g. 1000) or a lojas.magazineluiza.com.br store link',
	},
];
