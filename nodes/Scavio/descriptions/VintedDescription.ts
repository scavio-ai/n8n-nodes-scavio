import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['vinted'], operation, ...extra },
});

// Vinted, 27 country sites via the Country option (fr default), 9 operations, 1 credit
// each. Get Product takes an item ID or a Vinted item URL. Every route carries a 120s
// timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const ALL_OPERATIONS = [
	'search',
	'product',
	'seller',
	'sellerProducts',
	'sellerFeedback',
	'brands',
	'suggestions',
	'filters',
	'categories',
];

const FEE =
	'service_fee is the Vinted fee the buyer pays on top of the price (formerly the Buyer Protection fee) and total_price is price plus that fee';

const COUNTRY_OPTIONS = [
	{ name: 'Australia (vinted.com.au, AUD)', value: 'au' },
	{ name: 'Austria (EUR)', value: 'at' },
	{ name: 'Belgium (EUR)', value: 'be' },
	{ name: 'Croatia (EUR)', value: 'hr' },
	{ name: 'Czech Republic (CZK)', value: 'cz' },
	{ name: 'Denmark (DKK)', value: 'dk' },
	{ name: 'Estonia (EUR)', value: 'ee' },
	{ name: 'Finland (EUR)', value: 'fi' },
	{ name: 'France (EUR)', value: 'fr' },
	{ name: 'Germany (EUR)', value: 'de' },
	{ name: 'Greece (EUR)', value: 'gr' },
	{ name: 'Hungary (HUF)', value: 'hu' },
	{ name: 'Ireland (EUR)', value: 'ie' },
	{ name: 'Italy (EUR)', value: 'it' },
	{ name: 'Latvia (EUR)', value: 'lv' },
	{ name: 'Lithuania (EUR)', value: 'lt' },
	{ name: 'Luxembourg (EUR)', value: 'lu' },
	{ name: 'Netherlands (EUR)', value: 'nl' },
	{ name: 'Poland (PLN)', value: 'pl' },
	{ name: 'Portugal (EUR)', value: 'pt' },
	{ name: 'Romania (RON)', value: 'ro' },
	{ name: 'Slovakia (EUR)', value: 'sk' },
	{ name: 'Slovenia (EUR)', value: 'si' },
	{ name: 'Spain (EUR)', value: 'es' },
	{ name: 'Sweden (SEK)', value: 'se' },
	{ name: 'United Kingdom (vinted.co.uk, GBP)', value: 'uk' },
	{ name: 'United States (vinted.com, USD)', value: 'us' },
];

const idList = (displayName: string, name: string, placeholder: string, description: string) => ({
	displayName,
	name,
	type: 'string' as const,
	default: '',
	placeholder,
	description: `${description} Separate several with commas, up to 20`,
	routing: { request: { body: { [name]: '={{ $value || undefined }}' } } },
});

export const vintedOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['vinted'] } },
		options: [
			{
				name: 'Find Brands',
				value: 'brands',
				action: 'Find vinted brands',
				description:
					'Find Vinted brands by name: brand ID (what the Brand IDs option of Search Listings takes), title, slug, URL, number of listings, luxury flag and whether Vinted authenticity-checks it. Costs 1 credit.',
				routing: request('/api/v1/vinted/brands'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get vinted categories',
				description:
					"The Vinted category tree in the country site's language (9 top-level categories, about 3,000 in all): ID (what the Category ID option of Search Listings takes), title, URL and children; or one category's subtree with its path. Costs 1 credit.",
				routing: request('/api/v1/vinted/categories'),
			},
			{
				name: 'Get Filter Options',
				value: 'filters',
				action: 'Get vinted filter options',
				description:
					'The options of one Vinted search filter (size, condition, color or material) with live item counts, optionally for a query and a category: ID (what the Size, Condition, Color and Material IDs options of Search Listings take), localized title, item count, the size group and, for conditions, the description. Costs 1 credit.',
				routing: request('/api/v1/vinted/filters'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a vinted listing',
				description:
					"One Vinted listing by item ID or URL: title, description, price and currency (the seller's currency, which can differ from the country site's), brand, size, condition, color, material, when it was uploaded as Vinted words it (uploaded_relative), category ID and path, all photos, favourite count, reserved and sold state, whether it can be bought now, and the seller (ID, login, profile URL, business flag, feedback count, rating 0-1, badges). Sold listings still return their last price. An unknown ID is an error. Costs 1 credit.",
				routing: request('/api/v1/vinted/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get vinted search suggestions',
				description:
					"The Vinted search-box autocomplete for a partial query, in the country site's language: up to 10 suggestions, each with its type (popular_search, or the catalog match it comes from such as brand, brand+parent_cat or attr). Costs 1 credit.",
				routing: request('/api/v1/vinted/suggestions'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get a vinted seller',
				description:
					"One Vinted member's public seller profile: login, profile URL, business flag, feedback count, rating (0-1), positive / neutral / negative feedback counts, listed item count, country, city (only when the member shows it), email / Facebook / Google verification, average response time, holiday mode and the date last seen. An unknown ID is an error. Costs 1 credit.",
				routing: request('/api/v1/vinted/seller'),
			},
			{
				name: 'Get Seller Feedback',
				value: 'sellerFeedback',
				action: 'Get vinted seller feedback',
				description:
					"Reviews left for one Vinted member, newest first, up to 50 per page: rating 1-5, review text, date, whether it is Vinted's automatic feedback, and the member's reply. Reviewer identities and the items reviewed are not included. Also total_results, total_pages and has_more. Costs 1 credit.",
				routing: request('/api/v1/vinted/seller-feedback'),
			},
			{
				name: 'Get Seller Listings',
				value: 'sellerProducts',
				action: 'Get vinted seller listings',
				description:
					'The items one Vinted member has listed, newest first, cheapest first or by relevance, up to 96 per page: ID, title, URL, price, currency, service_fee, total_price, brand, size, condition, favourite count, reserved, sold and promoted flags and photos; ' +
					FEE +
					'. Also total_results, total_pages and has_more. A member with no listings returns an empty list. Costs 1 credit.',
				routing: request('/api/v1/vinted/seller-products'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search vinted listings',
				description:
					"Search second-hand listings on a Vinted country site by keywords, category, brand, condition, size, color, material and price range, sorted by relevance, newest or price. 96 items per page, pages 1-10 (Vinted serves no deeper). Each item has ID, title, URL, price and currency (the country site's currency), price_with_discount, service_fee, total_price, brand, size, condition, favourite count, promoted flag, photos and the seller's ID and business flag; " +
					FEE +
					'. Also listed_results and total_pages (capped at 960 and 10; total_is_capped is true when there are more matches) and the filters Vinted actually applied. Live listings only: sold items are not searchable. Costs 1 credit.',
				routing: request('/api/v1/vinted/search'),
			},
		],
		default: 'search',
	},
];

export const vintedFields: INodeProperties[] = [
	// -- Every operation --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'fr',
		options: COUNTRY_OPTIONS,
		displayOptions: show(ALL_OPERATIONS),
		routing: { request: { body: { country: '={{ $value }}' } } },
		description:
			"Vinted country site. Category, condition and filter names come back in the site's language. The EU sites share one cross-border listing pool, priced in the site's currency; United Kingdom, United States and Australia are separate catalogs. Get Product with a URL uses the URL's own site.",
	},

	// -- Search Listings --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'barbour jacket',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description:
			'Search keywords. Optional when Category ID or Brand IDs is given (browse a category or brand).',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			idList(
				'Brand IDs',
				'brand_ids',
				'46805',
				"Only these brands, by ID from Find Brands (Nike 53, Levi's 10, Barbour 46805).",
			),
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: '1907',
				description:
					'Only this category and its subcategories, by ID from Get Categories (1907 is Women > Clothing > Outerwear > Coats)',
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
			idList(
				'Color IDs',
				'color_ids',
				'1',
				'Only these colors, by option ID from Get Filter Options with filter Color (1 is black).',
			),
			{
				displayName: 'Condition',
				name: 'status_ids',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Good', value: 3 },
					{ name: 'New with Tags', value: 6 },
					{ name: 'New Without Tags', value: 1 },
					{ name: 'Satisfactory', value: 4 },
					{ name: 'Very Good', value: 2 },
				],
				description: 'Only these conditions',
				routing: { request: { body: { status_ids: '={{ $value.length ? $value : undefined }}' } } },
			},
			idList(
				'Material IDs',
				'material_ids',
				'123',
				'Only these materials, by option ID from Get Filter Options with filter Material (123 is cashmere).',
			),
			{
				displayName: 'Max Price',
				name: 'price_to',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				description: "Maximum item price, in the country site's currency",
				routing: { request: { body: { price_to: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'price_from',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, numberPrecision: 2 },
				description: "Minimum item price, in the country site's currency",
				routing: { request: { body: { price_from: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Results page, 1 to 10 (Vinted serves at most 10 pages of 96). Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			idList(
				'Size IDs',
				'size_ids',
				'4',
				"Only these sizes, by option ID from Get Filter Options with filter Size (4 is women's M / UK 12-14 / US 8-10).",
			),
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Newest First', value: 'newest_first' },
					{ name: 'Price: High to Low', value: 'price_high_to_low' },
					{ name: 'Price: Low to High', value: 'price_low_to_high' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Relevance (default), newest or price. Price sorts rank loosely matching items too (very cheap or placeholder-priced listings), so pair them with a category or price range.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Product --
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		default: '',
		placeholder: '10671938315',
		displayOptions: show(['product']),
		routing: { request: { body: { item_id: '={{ $value || undefined }}' } } },
		description:
			'Vinted item ID (the ID of a search result, the number after /items/ in a Vinted URL). Use this or Item URL.',
	},
	{
		displayName: 'Item URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.vinted.co.uk/items/10671938315-nike-air-max-size-uk-75',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A Vinted item URL on any country site. Its own site is used, whatever Country says. Used when Item ID is not given.',
	},

	// -- Get Seller / Get Seller Listings / Get Seller Feedback --
	{
		displayName: 'Member ID',
		name: 'user_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '65958245',
		displayOptions: show(['seller', 'sellerProducts', 'sellerFeedback']),
		routing: { request: { body: { user_id: '={{ $value }}' } } },
		description:
			'Vinted member ID: the seller.ID of a search result or product, or the number after /member/ in a profile URL',
	},

	// -- Get Seller Listings --
	{
		displayName: 'Additional Options',
		name: 'sellerProductsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerProducts']),
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Items per page, 1 to 96. The API default is 20.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based, up to 500. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest_first',
				options: [
					{ name: 'Newest First', value: 'newest_first' },
					{ name: 'Price: Low to High', value: 'price_low_to_high' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Newest first (default), cheapest first or by relevance',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Seller Feedback --
	{
		displayName: 'Additional Options',
		name: 'sellerFeedbackOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerFeedback']),
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				hint: 'Feedback per page, 1 to 50. The API default is 20.',
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 1-based, newest first, up to 500. Defaults to 1.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Find Brands --
	{
		displayName: 'Brand Name',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'barbour',
		displayOptions: show(['brands']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Brand name or part of it',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'barb',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Filter Options --
	{
		displayName: 'Filter',
		name: 'filter',
		type: 'options',
		required: true,
		default: 'size',
		options: [
			{ name: 'Color', value: 'color' },
			{ name: 'Condition', value: 'status' },
			{ name: 'Material', value: 'material' },
			{ name: 'Size', value: 'size' },
		],
		displayOptions: show(['filters']),
		routing: { request: { body: { filter: '={{ $value }}' } } },
		description: 'Which search filter to list the options of',
	},
	{
		displayName: 'Additional Options',
		name: 'filtersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['filters']),
		options: [
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: '1904',
				description:
					'Count options within this category (1904 is Women). Sizes are grouped per category, so pass one for Size.',
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'dress',
				description: 'Count options for this search',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Categories --
	{
		displayName: 'Additional Options',
		name: 'categoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Parent Category ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				placeholder: '1904',
				description:
					"Return only this category's subtree (1904 is Women). Leave empty for the whole tree.",
				routing: { request: { body: { parent_id: '={{ $value || undefined }}' } } },
			},
		],
	},
];
