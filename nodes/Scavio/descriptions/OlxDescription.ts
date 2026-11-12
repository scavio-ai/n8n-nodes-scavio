import type { INodeProperties } from 'n8n-workflow';

const show = (
	operation: string[],
	extra: Record<string, Array<string | number | boolean>> = {},
) => ({
	show: { resource: ['olx'], operation, ...extra },
});

// OLX Europe (olx.pl, plus olx.ro, olx.pt, olx.bg, olx.ua, olx.kz and olx.uz), 9 operations, 1
// credit each. Get Category Filters and Get Similar Ads are pl, ro, pt, bg and ua only. Language is
// kz / uz only, on Search Ads, Get Seller Ads and Get Ad. A call can take up to about a minute, so
// every route carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ALL_MARKET_OPERATIONS = [
	'search',
	'offer',
	'seller',
	'sellerAds',
	'categories',
	'locations',
	'suggestions',
];
const EU_OPERATIONS = ['filters', 'similar'];
const LANGUAGE_OPERATIONS = ['search', 'sellerAds', 'offer'];

const EU_COUNTRY_OPTIONS = [
	{ name: 'Bulgaria (Olx.bg, EUR, Bulgarian)', value: 'bg' },
	{ name: 'Poland (Olx.pl, PLN, Polish)', value: 'pl' },
	{ name: 'Portugal (Olx.pt, EUR, Portuguese)', value: 'pt' },
	{ name: 'Romania (Olx.ro, RON, Romanian)', value: 'ro' },
	{ name: 'Ukraine (Olx.ua, UAH, Ukrainian)', value: 'ua' },
];

const COUNTRY_OPTIONS = [
	{ name: 'Bulgaria (Olx.bg, EUR, Bulgarian)', value: 'bg' },
	{ name: 'Kazakhstan (Olx.kz, KZT, Russian or Kazakh)', value: 'kz' },
	{ name: 'Poland (Olx.pl, PLN, Polish)', value: 'pl' },
	{ name: 'Portugal (Olx.pt, EUR, Portuguese)', value: 'pt' },
	{ name: 'Romania (Olx.ro, RON, Romanian)', value: 'ro' },
	{ name: 'Ukraine (Olx.ua, UAH, Ukrainian)', value: 'ua' },
	{ name: 'Uzbekistan (Olx.uz, UZS, Russian or Uzbek)', value: 'uz' },
];

const SCOPE =
	'OLX Europe only (olx.pl, olx.ro, olx.pt, olx.bg, olx.ua, olx.kz, olx.uz); OLX Brasil, olx.in and other OLX-branded sites are not covered.';

const PRICE =
	'price (value, currency, negotiable, type price / free / exchange / budget, label as shown, previous_value when the seller lowered it; when the site converts a price, e.g. olx.uz y.e. to UZS, value is the converted figure and original_value with original_currency keep what the seller entered)';

const ITEM =
	'id, URL, title, description_snippet, ' +
	PRICE +
	', salary (jobs: from, to, period, currency, gross), condition, params (key, name, value, normalized_value), category_id, location (city, district, region with their IDs), created_at, refreshed_at, valid_to, status, is_promoted with promoted_position (the slot on the page), is_highlighted, is_business, olx_delivery, photos and seller (ID; business_name for business sellers only)';

const GRID =
	'Items with ' +
	ITEM +
	". Also total (the site's count; null on kz and uz once a search reaches 1000 ads), total_capped (true when there are more ads than the 1000 OLX lets anyone page through), total_pages, page, page_size, has_next_page, count, promoted_count, sort, applied_filters, country, language and currency.";

const PRIVACY =
	'A seller name is returned only for business sellers (business_name); private sellers come as an ID only. No phone numbers, emails, last-seen times, profile photos or map positions are returned, and phone numbers and emails in ad text are replaced with [phone removed] / [email removed].';

const NOTE =
	"Titles, parameters and labels come back in the site's language (Polish on Poland; Russian by default on Kazakhstan and Uzbekistan). Failed upstream calls are not charged (they are retried automatically); a not-found is charged. Costs 1 credit.";

const GRID_OPTIONS: INodeProperties[] = [
	{
		displayName: 'Category Filters (JSON)',
		name: 'filters',
		type: 'json',
		default: '{}',
		description:
			'The category\'s own filters, as listed by Get Category Filters (send_as keys): a range filter as filter_float_&lt;name&gt;:from / :to with a number, a choice filter as filter_enum_&lt;name&gt; with one value or a list, e.g. {"filter_float_year:from": 2018, "filter_float_milage:to": 100000} or {"filter_enum_rooms": ["two", "three"]}. Up to 20 keys.',
		routing: {
			request: {
				body: {
					filters:
						'={{ (v => Object.keys(v || {}).length ? v : undefined)(typeof $value === "string" ? JSON.parse($value || "{}") : $value) }}',
				},
			},
		},
	},
	{
		displayName: 'City ID',
		name: 'city_id',
		type: 'string',
		default: '',
		placeholder: '17871',
		description: "Only ads in this city: city_id of Search Locations or of an item's location",
		routing: { request: { body: { city_id: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Condition',
		name: 'condition',
		type: 'options',
		default: 'used',
		options: [
			{ name: 'Damaged', value: 'damaged' },
			{ name: 'New', value: 'new' },
			{ name: 'Refurbished', value: 'refurbished' },
			{ name: 'Used', value: 'used' },
		],
		description: 'Only ads in this condition (in categories that have a condition)',
		routing: { request: { body: { condition: '={{ $value }}' } } },
	},
	{
		displayName: 'Distance (Km)',
		name: 'distance_km',
		type: 'options',
		default: 0,
		options: [
			{ name: '0 Km', value: 0 },
			{ name: '10 Km', value: 10 },
			{ name: '100 Km', value: 100 },
			{ name: '15 Km', value: 15 },
			{ name: '2 Km', value: 2 },
			{ name: '30 Km', value: 30 },
			{ name: '5 Km', value: 5 },
			{ name: '50 Km', value: 50 },
			{ name: '75 Km', value: 75 },
		],
		description: 'With City ID: include ads within this many km of the city',
		routing: { request: { body: { distance_km: '={{ $value }}' } } },
	},
	{
		displayName: 'District ID',
		name: 'district_id',
		type: 'string',
		default: '',
		description: 'Only ads in this district of a city: district_id of Search Locations',
		routing: { request: { body: { district_id: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Include Promoted Ads',
		name: 'include_promoted',
		type: 'boolean',
		default: true,
		description:
			'Whether to keep the promoted ads the site places on each page (each is flagged is_promoted with its slot)',
		routing: {
			request: { body: { include_promoted: '={{ $value === false ? false : undefined }}' } },
		},
	},
	{
		displayName: 'Max Price',
		name: 'max_price',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Highest price, in the site's currency",
		routing: { request: { body: { max_price: '={{ $value }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'min_price',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Lowest price, in the site's currency",
		routing: { request: { body: { min_price: '={{ $value }}' } } },
	},
	{
		displayName: 'OLX Delivery Only',
		name: 'olx_delivery',
		type: 'boolean',
		default: false,
		description:
			'Whether to return only ads that can be bought with OLX delivery (not on Kazakhstan or Uzbekistan)',
		routing: { request: { body: { olx_delivery: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 1000 },
		description:
			'Results page, 1-based. OLX serves the first 1000 results of a search only, so page x page size may not exceed 1000.',
		routing: { request: { body: { page: '={{ $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'page_size',
		type: 'number',
		default: 40,
		typeOptions: { minValue: 1, maxValue: 50 },
		description:
			'Ads per page, up to 50 (default 40). Promoted ads come on top of these (40 asks return about 52 items).',
		routing: { request: { body: { page_size: '={{ $value }}' } } },
	},
	{
		displayName: 'Photos Only',
		name: 'with_photos',
		type: 'boolean',
		default: false,
		description: 'Whether to return only ads with photos',
		routing: { request: { body: { with_photos: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Region ID',
		name: 'region_id',
		type: 'string',
		default: '',
		description: "Only ads in this region: region_id of Search Locations or of an item's location",
		routing: { request: { body: { region_id: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Seller Type',
		name: 'seller_type',
		type: 'options',
		default: 'private',
		options: [
			{ name: 'Business', value: 'business' },
			{ name: 'Private (Individuals)', value: 'private' },
		],
		description: 'Only private or only business sellers',
		routing: { request: { body: { seller_type: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Newest (Last Posted or Refreshed)', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_high_to_low' },
			{ name: 'Price: Low to High', value: 'price_low_to_high' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description:
			'Relevance (default), newest (sellers can refresh an ad to the top, so this is last refresh, not first posting) or price. Promoted ads are not sorted.',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const sorted = (options: INodeProperties[]) =>
	[...options].sort((x, y) => x.displayName.localeCompare(y.displayName));

const isUrl = '/^https?:\\/\\//i.test($value)';

export const olxOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['olx'] } },
		options: [
			{
				name: 'Get Ad',
				value: 'offer',
				action: 'Get an olx ad',
				description:
					'One OLX ad by ID or link: title, the full description as plain text, ' +
					PRICE +
					", salary for jobs, condition, every parameter (a car's VIN is never returned), category with breadcrumb, all photos, location (city, district, region with IDs), created_at, refreshed_at, valid_to, status, is_active, is_promoted, olx_delivery, is_job and the seller (ID, is_business, business_name for business sellers, member_since). An ad that does not exist and an ad that has ended answer the same 404 (not found or no longer active). No view counts, phone numbers or messaging. " +
					SCOPE +
					' ' +
					PRIVACY +
					' ' +
					NOTE,
				routing: request('/api/v1/olx/offer'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get olx categories',
				description:
					"The OLX category tree of one site: ID, name, parent_id, level, path, URL, type and count (active ads), with children. Without Parent ID: the top-level categories and their direct children (children_count tells which go deeper); with Parent ID: that category's whole subtree. " +
					NOTE,
				routing: request('/api/v1/olx/categories'),
			},
			{
				name: 'Get Category Filters',
				value: 'filters',
				action: 'Get olx category filters',
				description:
					"The filters one OLX category offers, ready to send as Category Filters (JSON): each with key, label, type, kind (range or choice), unit, send_as (the keys to use), suggested range steps, and for choice filters every value with its label and the number of matching ads. Also the category's ad counts per region (or per city inside Region ID) and per category. Poland, Romania, Portugal, Bulgaria and Ukraine only. " +
					NOTE,
				routing: request('/api/v1/olx/filters'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get olx search suggestions',
				description:
					'The suggestions the OLX search box shows for what a user typed: popular searches, each with the category it is most searched in (category_id, name and its parent categories). ' +
					NOTE,
				routing: request('/api/v1/olx/suggestions'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get an olx seller',
				description:
					"One OLX seller by ID: is_business (from the seller's own ads), business_name (business sellers only; null otherwise), member_since, active_ads (the number of live ads; null on kz and uz from 1000 ads up) and ads_url (the seller's page on OLX). OLX shows no seller ratings or reviews, so none are returned. " +
					PRIVACY +
					' ' +
					NOTE,
				routing: request('/api/v1/olx/seller'),
			},
			{
				name: 'Get Seller Ads',
				value: 'sellerAds',
				action: 'Get olx seller ads',
				description:
					"One OLX seller's live ads, with the Search Ads sorts and filters and an optional query. " +
					GRID +
					' ' +
					PRIVACY +
					' ' +
					NOTE,
				routing: request('/api/v1/olx/seller-ads'),
			},
			{
				name: 'Get Similar Ads',
				value: 'similar',
				action: 'Get olx similar ads',
				description:
					'The ads OLX recommends next to one ad (about 30), in the Search Ads item shape: ' +
					ITEM +
					'. Also offer_id, count, country, language and currency. Poland, Romania, Portugal, Bulgaria and Ukraine only. ' +
					PRIVACY +
					' ' +
					NOTE,
				routing: request('/api/v1/olx/similar'),
			},
			{
				name: 'Search Ads',
				value: 'search',
				action: 'Search olx ads',
				description:
					"Search OLX classifieds (used goods, cars, real estate, jobs, services) by keyword and / or category: sort by newest or price; filter by price range, condition, private or business seller, OLX delivery, photos, region / city / district with a radius, and the category's own filters (rooms, area, year, mileage ... from Get Category Filters). Up to 1000 results per query (OLX's own cap). Promoted ads are interleaved and flagged. A query with no exact match returns the closest ads, never an empty list. " +
					SCOPE +
					' ' +
					GRID +
					' ' +
					PRIVACY +
					' ' +
					NOTE,
				routing: request('/api/v1/olx/search'),
			},
			{
				name: 'Search Locations',
				value: 'locations',
				action: 'Search olx locations',
				description:
					'Place autocomplete for OLX location filters: cities and districts matching a name, with city_id, district_id and region_id to send to Search Ads, plus the municipality, county and region names. ' +
					NOTE,
				routing: request('/api/v1/olx/locations'),
			},
		],
		default: 'search',
	},
];

export const olxFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'pl',
		options: COUNTRY_OPTIONS,
		displayOptions: show(ALL_MARKET_OPERATIONS),
		routing: { request: { body: { country: '={{ $value === "pl" ? undefined : $value }}' } } },
		description:
			"The OLX Europe site. Titles and labels come in the site's language, prices in its currency.",
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'pl',
		options: EU_COUNTRY_OPTIONS,
		displayOptions: show(EU_OPERATIONS),
		routing: { request: { body: { country: '={{ $value === "pl" ? undefined : $value }}' } } },
		description: 'The OLX site. This operation is not available on Kazakhstan or Uzbekistan.',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Site Default (Russian)', value: '' },
			{ name: 'Kazakh', value: 'kk' },
			{ name: 'Russian', value: 'ru' },
		],
		displayOptions: show(LANGUAGE_OPERATIONS, { country: ['kz'] }),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description: 'Kazakhstan only: Russian (default) or Kazakh',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Site Default (Russian)', value: '' },
			{ name: 'Russian', value: 'ru' },
			{ name: 'Uzbek', value: 'uz' },
		],
		displayOptions: show(LANGUAGE_OPERATIONS, { country: ['uz'] }),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description: 'Uzbekistan only: Russian (default) or Uzbek',
	},

	// -- Search Ads --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: 'iphone',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description:
			'Search keywords, in any language. Query, Category ID or both: leave empty to list a whole category.',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: '84',
				description:
					"Search inside one category: the ID from Get Categories or an item's category_id (e.g. 84 = cars on olx.pl)",
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
			...GRID_OPTIONS,
		]),
	},

	// -- Get Ad / Get Similar Ads --
	{
		displayName: 'Ad ID or URL',
		name: 'offer',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1107557408',
		displayOptions: show(['offer', 'similar']),
		routing: {
			request: {
				body: {
					url: `={{ ${isUrl} ? $value : undefined }}`,
					offer_id: `={{ ${isUrl} ? undefined : $value }}`,
				},
			},
		},
		description: 'An OLX ad ID (the ID of a search result) or an ad link on any of the seven sites',
	},

	// -- Get Seller / Get Seller Ads --
	{
		displayName: 'Seller ID',
		name: 'user_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2547532895',
		displayOptions: show(['seller', 'sellerAds']),
		routing: { request: { body: { user_id: '={{ $value }}' } } },
		description: 'An OLX seller ID: the seller ID of a search result or of an ad',
	},
	{
		displayName: 'Additional Options',
		name: 'sellerAdsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellerAds']),
		options: sorted([
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				description: "Only the seller's ads in this category",
				routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: "Search within the seller's ads",
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			...GRID_OPTIONS,
		]),
	},

	// -- Get Category Filters --
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '14',
		displayOptions: show(['filters']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description:
			'The category ID from Get Categories, e.g. 14 = flats for sale on olx.pl, 84 = cars',
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
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Count values for this keyword inside the category',
				routing: { request: { body: { query: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Region ID',
				name: 'region_id',
				type: 'string',
				default: '',
				description: 'Count values in this region only (locations then lists its cities)',
				routing: { request: { body: { region_id: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Categories --
	{
		displayName: 'Parent ID',
		name: 'parent_id',
		type: 'string',
		default: '',
		placeholder: '5',
		displayOptions: show(['categories']),
		routing: { request: { body: { parent_id: '={{ $value || undefined }}' } } },
		description:
			"Return this category's whole subtree. Leave empty for the top-level categories with their direct children.",
	},

	// -- Search Locations --
	{
		displayName: 'Place Name',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Warszawa',
		displayOptions: show(['locations']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'At least 2 letters of a city or district name',
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rower',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the user has typed so far',
	},
];
