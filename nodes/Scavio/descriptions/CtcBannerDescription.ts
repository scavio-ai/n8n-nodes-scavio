import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

// SportChek (SportchekDescription.ts) and Mark's (MarksDescription.ts) are Canadian Tire
// Corporation banners on one shared storefront, so one builder makes both resources. 8
// operations each, 1 credit per call on every operation; credits_used is the truth. Canada only,
// prices in CAD. SportChek has Get Reviews (English only); Mark's has Get Questions and a
// Language option (en, or fr for L'Equipeur) on Search Products, Get List Page, Get Product, Get
// Brands and Get Categories. Answers take about 10-90 s, so every operation carries a 240s
// timeout, like OfferUp.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

export interface CtcBannerConfig {
	/** Resource value and path segment: sportchek or marks. */
	id: 'sportchek' | 'marks';
	/** Display name: SportChek or Mark's. */
	name: string;
	/** First-mention sentence, e.g. "SportChek (sportchek.ca, ...)". */
	first: string;
	/** Mark's only: the Language option (en, fr = L'Equipeur). */
	french: boolean;
	/** reviews (SportChek) or questions (Mark's). */
	feedback: 'reviews' | 'questions';
	notAvailable: string;
	exampleQuery: string;
	exampleCode: string;
	exampleList: string;
	exampleStore: string;
	exampleSuggest: string;
	exampleBrand: string;
	capturedSearch: string;
	capturedProduct: string;
}

const SLOW = 'Answers take about 10-90 seconds: allow up to 2 minutes.';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const FOOTNOTE = 'Was price reflects the last national regular price this product was sold for.';
const PAIR =
	'For the same model at Amazon.ca and Walmart.ca use the Amazon and Walmart resources (Canadian marketplace); match on brand, model, colour and size.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

// Comma-separated values sent as a list; one value is sent as it is.
const oneOrList =
	'={{ String($value).trim() ? (String($value).includes(",") ? String($value).split(",").map(s => s.trim()).filter(Boolean) : String($value).trim()) : undefined }}';
// A link goes to url, anything else to the given field.
const linkOr = (field: string) => ({
	[field]: `={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}`,
	url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
});

export function ctcBannerDescription(b: CtcBannerConfig): {
	operations: INodeProperties[];
	fields: INodeProperties[];
} {
	const show = (operation: string[]) => ({ show: { resource: [b.id], operation } });
	const p = b.id;
	const PRICES = `Prices are ${b.name}'s online prices in CAD for a visitor without an account. was_price is the site's was price as given, only where the site shows one; footnote is the site's own sentence on it: "${FOOTNOTE}" (English pages). A percent off is not returned: compute it from price and was_price and label it computed. sale_ends is the site's sale end date as given; price_message is the site's promotion text. In our checks prices were the same at every store sampled.`;
	const STORE = `units_at_store are the units at the store the site assigns to the request's region (assigned_store); a caller cannot choose a store.`;
	const LANG = b.french
		? " Language fr reads L'Equipeur (lequipeur.com, Mark's in French): the same product codes and CAD prices, French titles."
		: ` ${b.name} is English only.`;
	const ITEMS =
		'products with code (what Get Product takes), name, brand, URL, image, price, price_max, was_price, currency, on_sale, sale_ends, price_message (label, details), badges (SALE, CLEARANCE, TOPRATED, BESTSELLER, NEWARRIVAL), rating, review_count, colours (name, price, was_price, on_sale, sale_ends, units_online_max) and sponsored, plus total, total_pages, page, page_size, has_more, count, sort, filters_applied, facets (with Include Facets) and footnote';
	const FILTERS =
		"sorted (relevance, price high or low, rating) and filtered (brand, sale or clearance, and any of the site's filters from facets)";

	const language = (name: string): INodeProperties[] =>
		b.french
			? [
					{
						displayName: 'Language',
						name,
						type: 'options',
						default: 'en',
						options: [
							{ name: "English (Mark's)", value: 'en' },
							{ name: "French (L'Equipeur)", value: 'fr' },
						],
						description:
							"English reads marks.com; French reads L'Equipeur (lequipeur.com): the same product codes and CAD prices, French titles",
						routing: {
							request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } },
						},
					},
				]
			: [];

	const listOptions = (prefix: string): INodeProperties[] => [
		{
			displayName: 'Brand',
			name: `${prefix}Brand`,
			type: 'string',
			default: '',
			placeholder: b.exampleBrand,
			description:
				"Brand as the site's Brand Name filter names it (facets brand values); several comma-separated",
			routing: { request: { body: { brand: oneOrList } } },
		},
		{
			displayName: 'Deals',
			name: `${prefix}Deals`,
			type: 'options',
			default: '',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Clearance', value: 'clearance' },
				{ name: 'Sale', value: 'sale' },
				{ name: 'Sale and Clearance', value: 'both' },
			],
			description:
				"The site's Deals filter. Not on a deals page (a 400, not charged): use it with search or a category page.",
			routing: { request: { body: { deals: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Filters (JSON)',
			name: `${prefix}Filters`,
			type: 'json',
			default: '',
			placeholder: '[{ "facet": "sku_gender_attr", "value": "Female" }]',
			description:
				"Any of the site's filters as an earlier response's facets give them: a list of { facet, value } (value: one or a list), up to 6",
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
			displayName: 'Include Facets',
			name: `${prefix}IncludeFacets`,
			type: 'boolean',
			default: false,
			description:
				"Whether to also return the site's filters with counts for these results (still 1 credit)",
			routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: `Page (at most 500); 24 products a page${b.id === 'marks' ? " (12 on Mark's category pages)" : ''}, page_size says`,
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Price: High to Low', value: 'price_high' },
				{ name: 'Price: Low to High', value: 'price_low' },
				{ name: 'Rating', value: 'rating' },
				{ name: 'Relevance', value: 'relevance' },
			],
			description: "Result order (the site's sort menu)",
			routing: {
				request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } },
			},
		},
		...language(`${prefix}Language`),
	];

	const productField = (name: string, operation: string): INodeProperties => ({
		displayName: 'Product Code or URL',
		name,
		type: 'string',
		required: true,
		default: '',
		placeholder: b.exampleCode,
		displayOptions: show([operation]),
		routing: { request: { body: linkOr('code') } },
		description: `A ${b.name} product code (code from Search Products, e.g. ${b.exampleCode}) or the product link`,
	});

	const feedbackOperation: INodePropertyOptions =
		b.feedback === 'reviews'
			? {
					name: 'Get Reviews',
					value: 'reviews',
					action: `Get ${p} reviews`,
					description: `Customer reviews of one ${b.name} product by code or link, sorted (newest, relevance, helpful, rating high or low) and filtered by stars: summary (average, count, distribution, recommended), page, total, has_more and reviews with ID, rating, title, text, date, recommended, verified_purchaser, syndicated_from (the brand site a review was first posted on, as given), incentivized, helpful votes, locale and secondary ratings. Page 1 is the first 8 reviews, pages 2-4 the next 30 each (up to 98 per sort and star filter). No reviewer names. An unknown product is a charged not-found. ${SLOW} ${ONE}.`,
					routing: request(`/api/v1/${p}/reviews`),
				}
			: {
					name: 'Get Questions',
					value: 'questions',
					action: `Get ${p} questions`,
					description: `Customer questions and answers on one ${b.name} product by code or link (English): total, count and the newest 10 questions with ID, question, details, date, answer_count, locale and answers (text, date, brand_answer: an answer the site flags as the brand's, best_answer, helpful votes). No asker or answerer names. An unknown product is a charged not-found. ${SLOW} ${ONE}.`,
					routing: request(`/api/v1/${p}/questions`),
				};

	// Sorted by name; Get Reviews (SportChek) or Get Questions (Mark's) sits after Get Product.
	const operationOptions: INodePropertyOptions[] = [
		{
			name: 'Get Brands',
			value: 'brands',
			action: `Get ${p} brands`,
			description: `${b.name}'s brand pages as the site lists them: total_brands, count and brands (name, slug, URL). name is spelled from the brand page link; to filter by a brand use its Brand Name value from facets.${LANG} ${ONE}.`,
			routing: request(`/api/v1/${p}/brands`, true),
		},
		{
			name: 'Get Categories',
			value: 'categories',
			action: `Get ${p} categories`,
			description: `${b.name}'s category tree: total_categories, count and categories (ID, name, path, URL, level, children). path is what Get List Page takes.${LANG} ${ONE}.`,
			routing: request(`/api/v1/${p}/categories`, true),
		},
		{
			name: 'Get List Page',
			value: 'list',
			action: `Get ${p} list page`,
			description: `The products of a ${b.name} category or deals page (sale, clearance, Black Friday) by path or link, ${FILTERS}: path, URL and ${ITEMS}. Category paths come from Get Categories.${LANG} ${PRICES} An unknown page is a charged not-found. ${SLOW} ${ONE}.`,
			routing: request(`/api/v1/${p}/list`),
		},
		{
			name: 'Get Product',
			value: 'product',
			action: `Get a ${p} product`,
			description: `One ${b.name} product by code or link: price, price_max, was_price, on_sale, sale_ends, price_message, badges, rating, review_count, description, features, specifications, images, breadcrumbs, options and variants (SKU, colour, size, width, own price, was_price, sale_ends, units_at_store, units_online, ship_to_home, store_pickup), assigned_store (ID, name, city, province) and footnote. ${STORE} ${PRICES} ${b.capturedProduct} The site shows no UPC or barcode. An unknown product is a charged not-found.${LANG} ${SLOW} ${ONE}.`,
			routing: request(`/api/v1/${p}/product`),
		},
		feedbackOperation,
		{
			name: 'Get Search Suggestions',
			value: 'suggestions',
			action: `Get ${p} search suggestions`,
			description: `${b.name}'s search-box suggestions for typed text: terms, top_hit, categories and brands. ${SLOW} ${ONE}.`,
			routing: request(`/api/v1/${p}/suggestions`),
		},
		{
			name: 'Get Store',
			value: 'store',
			action: `Get a ${p} store`,
			description: `One ${b.name} store by store number: name, address, phone, coordinates, timezone, weekly hours, special hours, curbside pickup and up to 49 nearby stores (ID, name, city, province, distance_km). Store numbers come from Get Product's assigned_store or a store's nearby stores; finding stores near a postal code is not supported. An unknown store number is a charged not-found. ${SLOW} ${ONE}.`,
			routing: request(`/api/v1/${p}/store`),
		},
		{
			name: 'Search Products',
			value: 'search',
			action: `Search ${p} products`,
			description: `Search ${b.first} by keywords or a product code, ${FILTERS}, 24 a page: query, corrected_query, redirected_to and ${ITEMS}.${LANG} ${PRICES} ${b.capturedSearch} ${PAIR} ${b.notAvailable} ${SLOW} ${ONE}`,
			routing: request(`/api/v1/${p}/search`),
		},
	];

	const operations: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [b.id] } },
			options: operationOptions,
			default: 'search',
		},
	];

	const fields: INodeProperties[] = [
		// -- Search Products --
		{
			displayName: 'Keywords',
			name: `${p}Query`,
			type: 'string',
			required: true,
			default: '',
			placeholder: b.exampleQuery,
			displayOptions: show(['search']),
			routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
			description: `Keywords or a product code to search ${b.name} for`,
		},

		// -- Get List Page --
		{
			displayName: 'Page Path or URL',
			name: `${p}ListPath`,
			type: 'string',
			required: true,
			default: '',
			placeholder: b.exampleList,
			displayOptions: show(['list']),
			routing: { request: { body: linkOr('path') } },
			description:
				'A category or deals page path (path from Get Categories, or a sale, clearance or Black Friday page) or the page link',
		},

		// -- Get Product / Get Reviews / Get Questions --
		productField(`${p}ProductCode`, 'product'),
		productField(`${p}FeedbackCode`, b.feedback),

		// -- Get Search Suggestions --
		{
			displayName: 'Text',
			name: `${p}SuggestQuery`,
			type: 'string',
			required: true,
			default: '',
			placeholder: b.exampleSuggest,
			displayOptions: show(['suggestions']),
			routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
			description: 'The text typed so far',
		},

		// -- Get Store --
		{
			displayName: 'Store Number',
			name: `${p}StoreId`,
			type: 'string',
			required: true,
			default: '',
			placeholder: b.exampleStore,
			displayOptions: show(['store']),
			routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
			description:
				"A store number (assigned_store ID from Get Product, or a store's nearby stores)",
		},

		// -- Additional Options --
		{
			displayName: 'Additional Options',
			name: `${p}SearchOptions`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show(['search']),
			options: sorted(listOptions(`${p}Search`)),
		},
		{
			displayName: 'Additional Options',
			name: `${p}ListOptions`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show(['list']),
			options: sorted(listOptions(`${p}List`)),
		},
		{
			displayName: 'Additional Options',
			name: `${p}BrandsOptions`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show(['brands']),
			options: sorted([
				{
					displayName: 'Letter',
					name: `${p}BrandsLetter`,
					type: 'string',
					default: '',
					placeholder: 'B',
					description: 'Only brands starting with this letter or digit',
					routing: { request: { body: { letter: '={{ String($value).trim() || undefined }}' } } },
				},
				...language(`${p}BrandsLanguage`),
			]),
		},
	];

	if (b.feedback === 'reviews') {
		fields.push({
			displayName: 'Additional Options',
			name: `${p}ReviewsOptions`,
			type: 'collection',
			placeholder: 'Add Option',
			default: {},
			displayOptions: show(['reviews']),
			options: sorted([
				{
					displayName: 'Page',
					name: `${p}ReviewsPage`,
					type: 'number',
					default: 1,
					typeOptions: { minValue: 1, maxValue: 4 },
					description: 'Page 1 (the first 8 reviews) to 4; each later page is the next 30',
					routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
				},
				{
					displayName: 'Sort',
					name: `${p}ReviewsSort`,
					type: 'options',
					default: 'newest',
					options: [
						{ name: 'Helpful', value: 'helpful' },
						{ name: 'Newest', value: 'newest' },
						{ name: 'Rating: High to Low', value: 'rating_high' },
						{ name: 'Rating: Low to High', value: 'rating_low' },
						{ name: 'Relevance', value: 'relevance' },
					],
					description: "Review order (the site's review sort menu)",
					routing: {
						request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } },
					},
				},
				{
					displayName: 'Stars',
					name: `${p}ReviewsRating`,
					type: 'options',
					default: 0,
					options: [
						{ name: 'Any', value: 0 },
						{ name: '1 Star', value: 1 },
						{ name: '2 Stars', value: 2 },
						{ name: '3 Stars', value: 3 },
						{ name: '4 Stars', value: 4 },
						{ name: '5 Stars', value: 5 },
					],
					description: 'Only reviews with this many stars',
					routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
				},
			]),
		});
	}

	if (b.french) {
		fields.push(
			{
				displayName: 'Additional Options',
				name: `${p}ProductOptions`,
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: show(['product']),
				options: language(`${p}ProductLanguage`),
			},
			{
				displayName: 'Additional Options',
				name: `${p}CategoriesOptions`,
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: show(['categories']),
				options: language(`${p}CategoriesLanguage`),
			},
		);
	}

	return { operations, fields };
}
