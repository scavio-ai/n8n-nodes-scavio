import type { INodeProperties } from 'n8n-workflow';

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const NON_DISCLOSURE =
	'Sold prices are null in US sold-price non-disclosure states (Texas, Utah, Wyoming, Alaska, Idaho, Kansas, Louisiana, Mississippi, Montana, New Mexico, North Dakota and parts of Missouri); sold dates still come back.';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['realtor'], operation, ...extra },
});

function additionalOptions(operation: string[], options: INodeProperties[]): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(operation),
		options,
	};
}

/** An optional numeric filter, sent only when added. */
function numberOption(
	name: string,
	displayName: string,
	description: string,
	typeOptions: { minValue?: number; maxValue?: number; numberPrecision?: number } = { minValue: 0 },
): INodeProperties {
	return {
		displayName,
		name,
		type: 'number',
		default: 0,
		typeOptions,
		description,
		routing: { request: { body: { [name]: '={{ $value }}' } } },
	};
}

function booleanOption(name: string, displayName: string, description: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'boolean',
		default: false,
		description,
		routing: { request: { body: { [name]: '={{ $value }}' } } },
	};
}

export const realtorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['realtor'] } },
		options: [
			{
				name: 'Get Agent Profile',
				value: 'agent',
				action: 'Get a realtor com agent profile',
				description:
					"One Realtor.com agent's profile with all reviews: bio, phones, website, license number and state, MLS memberships, languages, specializations, served areas, designations, office address, social links, listing and sales stats, and every review with responsiveness, market expertise, negotiation and professionalism sub-ratings and the agent's reply. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/realtor/agent' } },
			},
			{
				name: 'Get Location Suggestions',
				value: 'locations',
				action: 'Get realtor com location suggestions',
				description:
					'Location suggestions for a partial name: cities, counties, ZIP codes, neighborhoods, schools and addresses. Each carries a slug_id for Get Market Stats; an address also carries the property_id for Get Property. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/realtor/locations' } },
			},
			{
				name: 'Get Market Stats',
				value: 'market',
				action: 'Get realtor com market stats',
				description:
					'Housing market statistics for a city, county or ZIP: median listing, sold and rent price, price per square foot, days on market, lot size, listing and rental counts, year-over-year and month-over-month change, and a breakdown by property type. Some medians are null at some geography levels. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/realtor/market' } },
			},
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get a realtor com property',
				description: `One Realtor.com property by ID or URL: description and detail groups, price history, tax history with assessed and market values, three home value estimates with ranges plus their history and forecast, nearby schools with ratings, flood, wildfire and noise risk, popularity, the listing agent and office, a mortgage estimate and photos. Estimates, schools and risk can be null for land or new construction. ${NON_DISCLOSURE} Costs 1 credit.`,
				routing: { request: { method: 'POST', url: '/api/v1/realtor/property' } },
			},
			{
				name: 'Search Agents',
				value: 'agents',
				action: 'Search realtor com agents',
				description:
					'Find real estate agents by city, ZIP code or name: rating, review and recommendation counts, active listing count and price range, homes sold in the last year, broker and office, first year in business and services. 20 per page by default, up to 50. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/realtor/agents' } },
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search realtor com listings',
				description: `Search Realtor.com for-sale, pending, for-rent and sold listings by location, radius or agent, filtered by price, beds, baths, square feet, lot size, year built, garage, HOA, property type, listing, sold and price-cut recency, keywords in the listing text, new construction, foreclosure and open houses. Up to 200 listings per call with price, sold price and date, lot size, address with coordinates, MLS ID and listing agent. A search reaches its first 10,000 results; slice big areas by price band, property type or radius to go further. ${NON_DISCLOSURE} Costs 1 credit.`,
				routing: { request: { method: 'POST', url: '/api/v1/realtor/search' } },
			},
		],
		default: 'search',
	},
];

export const realtorFields: INodeProperties[] = [
	// ── Search Listings: where to search ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'location',
		displayOptions: show(['search']),
		options: [
			{ name: 'Location', value: 'location' },
			{ name: 'Coordinates and Radius', value: 'coordinates' },
			{ name: 'Agent', value: 'agent' },
		],
		description:
			'Whether to search a named place, a radius around a point, or one agent\'s listings',
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Maricopa County, AZ',
		displayOptions: show(['search'], { searchBy: ['location'] }),
		routing: { request: { body: { location: '={{ $value }}' } } },
		description:
			'A city ("Austin, TX"), county ("Travis County, TX"), ZIP code, state or neighborhood',
	},
	{
		displayName: 'Latitude',
		name: 'latitude',
		type: 'number',
		required: true,
		default: 0,
		placeholder: '33.4484',
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['search'], { searchBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Center latitude for the radius search',
	},
	{
		displayName: 'Longitude',
		name: 'longitude',
		type: 'number',
		required: true,
		default: 0,
		placeholder: '-112.074',
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['search'], { searchBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Center longitude for the radius search',
	},
	{
		displayName: 'Radius (Miles)',
		name: 'radius_miles',
		type: 'number',
		required: true,
		default: 5,
		typeOptions: { minValue: 0.1, maxValue: 50, numberPrecision: 1 },
		displayOptions: show(['search'], { searchBy: ['coordinates'] }),
		routing: { request: { body: { radius_miles: '={{ $value }}' } } },
		description: 'Radius around the point, 0.1 to 50 miles',
	},
	{
		displayName: 'Agent ID',
		name: 'agent_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '642581',
		displayOptions: show(['search'], { searchBy: ['agent'] }),
		routing: { request: { body: { agent_id: '={{ $value }}' } } },
		description:
			"Only this agent's listings. Numeric agent_id from a search row (agent.agent_id) or Search Agents.",
	},

	// ── Get Property ──
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		noDataExpression: true,
		default: 'id',
		displayOptions: show(['property']),
		options: [
			{ name: 'Property ID', value: 'id' },
			{ name: 'Realtor.com URL', value: 'url' },
		],
		description: 'Whether to identify the property by its numeric ID or by its realtor.com page URL',
	},
	{
		displayName: 'Property ID',
		name: 'property_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9564057635',
		displayOptions: show(['property'], { lookupBy: ['id'] }),
		routing: { request: { body: { property_id: '={{ $value }}' } } },
		description:
			'Numeric property_id from Search Listings, or from an address in Get Location Suggestions. An unknown ID answers 404 and is billed like a normal call.',
	},
	{
		displayName: 'Realtor.com URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.realtor.com/realestateandhomes-detail/7202-Eagle-Rose-Rd_Austin_TX_78744_M95640-57635',
		displayOptions: show(['property'], { lookupBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A realtor.com property or rental page URL',
	},

	// ── Get Location Suggestions ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['locations']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'A partial city, county, ZIP code, neighborhood, school or street address',
	},

	// ── Get Market Stats ──
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin_TX',
		displayOptions: show(['market']),
		routing: { request: { body: { location: '={{ $value }}' } } },
		description:
			'A slug_id from Get Location Suggestions (Austin_TX, Travis-County_TX) or "City, ST"',
	},

	// ── Search Agents ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'location',
		displayOptions: show(['agents']),
		options: [
			{ name: 'City', value: 'location' },
			{ name: 'ZIP Code', value: 'postalCode' },
			{ name: 'Agent Name', value: 'name' },
		],
		description: 'Whether to find agents by city, ZIP code or name (exactly one)',
	},
	{
		displayName: 'City',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin, TX',
		displayOptions: show(['agents'], { searchBy: ['location'] }),
		routing: { request: { body: { location: '={{ $value }}' } } },
		description: 'A city as "City, ST"',
	},
	{
		displayName: 'ZIP Code',
		name: 'postal_code',
		type: 'string',
		required: true,
		default: '',
		placeholder: '85016',
		displayOptions: show(['agents'], { searchBy: ['postalCode'] }),
		routing: { request: { body: { postal_code: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code',
	},
	{
		displayName: 'Agent Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Kim Panozzo',
		displayOptions: show(['agents'], { searchBy: ['name'] }),
		routing: { request: { body: { name: '={{ $value }}' } } },
		description: 'Full or partial agent name, at least 2 characters',
	},

	// ── Get Agent Profile ──
	{
		displayName: 'Agent ID',
		name: 'agent_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1918615',
		displayOptions: show(['agent']),
		routing: { request: { body: { agent_id: '={{ $value }}' } } },
		description:
			'Numeric agent_id from Search Agents, or agent.agent_id on a Search Listings row. An unknown ID answers 404 and is billed like a normal call.',
	},

	// ── Additional Options ──
	additionalOptions(
		['search'],
		[
			numberOption('baths_max', 'Max Baths', 'Maximum bathrooms'),
			numberOption('beds_max', 'Max Beds', 'Maximum bedrooms'),
			numberOption('max_hoa', 'Max HOA Fee', 'Maximum monthly HOA fee in USD. Listings without an HOA fee are kept.'),
			numberOption('lot_sqft_max', 'Max Lot Size (Sq Ft)', 'Maximum lot size in square feet'),
			numberOption(
				'max_price',
				'Max Price',
				'Maximum price in USD: list price, sold price on Sold, monthly rent on For Rent',
			),
			numberOption('sqft_max', 'Max Square Feet', 'Maximum interior square feet'),
			numberOption('year_built_max', 'Built In or Before', 'Built in or before this year', {
				minValue: 1700,
				maxValue: 2100,
			}),
			numberOption('baths_min', 'Min Baths', 'Minimum bathrooms'),
			numberOption('beds_min', 'Min Beds', 'Minimum bedrooms'),
			numberOption('garage_min', 'Min Garage Spaces', 'Minimum garage spaces'),
			numberOption(
				'lot_sqft_min',
				'Min Lot Size (Sq Ft)',
				'Minimum lot size in square feet (1 acre = 43,560)',
			),
			numberOption(
				'min_price',
				'Min Price',
				'Minimum price in USD: list price, sold price on Sold, monthly rent on For Rent',
			),
			numberOption('sqft_min', 'Min Square Feet', 'Minimum interior square feet'),
			numberOption('year_built_min', 'Built In or After', 'Built in or after this year', {
				minValue: 1700,
				maxValue: 2100,
			}),
			booleanOption(
				'exclude_pending',
				'Exclude Pending',
				'Whether to leave out pending and contingent listings. For Sale only.',
			),
			booleanOption('foreclosure', 'Foreclosures Only', 'Whether to keep only foreclosures'),
			booleanOption(
				'has_open_house',
				'Open House Only',
				'Whether to keep only listings with an open house in the next 7 days',
			),
			{
				displayName: 'Keywords',
				name: 'keywords',
				type: 'string',
				default: '',
				placeholder: 'workshop, detached garage',
				description:
					'Only listings whose listing text matches these keywords. Separate with commas, up to 10, 60 characters each.',
				routing: { send: { type: 'body', property: 'keywords', value: splitList } },
			},
			numberOption(
				'listed_within_days',
				'Listed Within (Days)',
				'Only listings listed in the last N days, 1-3650',
				{ minValue: 1, maxValue: 3650 },
			),
			{
				displayName: 'Listing Status',
				name: 'listing_status',
				type: 'options',
				default: 'for_sale',
				options: [
					{ name: 'For Rent', value: 'for_rent' },
					{ name: 'For Sale', value: 'for_sale' },
					{ name: 'Pending / Contingent', value: 'pending' },
					{ name: 'Sold', value: 'sold' },
				],
				description:
					'For Sale (default) includes pending and contingent listings, as on the site; Pending keeps only those. On Sold, prices are sold prices and can be null in non-disclosure states.',
				routing: { request: { body: { listing_status: '={{ $value }}' } } },
			},
			booleanOption('new_construction', 'New Construction Only', 'Whether to keep only new construction'),
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10000 },
				description:
					'Results page, 1-based. Page x Page Size may not exceed 10,000: a search reaches its first 10,000 results.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Listings per call, 1-200. Defaults to 50. Every page costs 1 credit.',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			numberOption(
				'price_reduced_within_days',
				'Price Cut Within (Days)',
				'Only listings with a price cut in the last N days, 1-3650',
				{ minValue: 1, maxValue: 3650 },
			),
			{
				displayName: 'Property Types',
				name: 'property_types',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Condo', value: 'condos' },
					{ name: 'Farm', value: 'farm' },
					{ name: 'Land', value: 'land' },
					{ name: 'Mobile', value: 'mobile' },
					{ name: 'Multi-Family', value: 'multi_family' },
					{ name: 'Single Family', value: 'single_family' },
					{ name: 'Townhome', value: 'townhomes' },
				],
				description: 'Only these property types',
				routing: {
					request: { body: { property_types: '={{ $value.length ? $value : undefined }}' } },
				},
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Largest', value: 'sqft_high' },
					{ name: 'Largest Lot', value: 'lot_size_high' },
					{ name: 'Newest Built', value: 'year_built_new' },
					{ name: 'Newest Listed', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Recently Reduced', value: 'recently_reduced' },
					{ name: 'Recently Sold (Sold Only)', value: 'sold_newest' },
					{ name: 'Recently Updated', value: 'recently_updated' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Listing order. Defaults to Relevance. Price sorts use the sold price on Sold.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			numberOption(
				'sold_within_days',
				'Sold Within (Days)',
				'Sold only: only sales in the last N days, 1-3650 (730 = the last two years)',
				{ minValue: 1, maxValue: 3650 },
			),
		],
	),
	additionalOptions(
		['agents'],
		[
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Agents per page, 1-50. Defaults to 20.',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
		],
	),
];
