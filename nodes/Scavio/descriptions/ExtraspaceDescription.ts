import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['extraspace'], operation, ...extra },
});

// Extra Space Storage (extraspace.com, the US self-storage REIT), 5 operations, 1 credit each;
// credits_used is the truth. US only, USD (no country). City pages are large (up to about 3 minutes),
// so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Extra Space Storage (extraspace.com, the US self-storage REIT)';
const NAME = 'Extra Space';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged).`;
const PRICES =
	'Prices are monthly USD and labelled as the facility pages label them: in_store_price (IN STORE) and web_rate (WEB RATE); a price Extra Space does not give is null.';
const CARD =
	'facilities with store_id (what Get Facility and Get Reviews take), store number, name, URL, address, coordinates, distance in miles, phone, promotion, Starting at prices by size class (small, medium, large, parking), rating, review count, hours, features, unit sizes available, coming-soon and grand-opening flags, and the best prices the card highlights (size, dimensions, features, promotions, in-store price, web rate)';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const facilityField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Facility ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '1934',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				store_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'An Extra Space facility ID (store_id from Search Facilities, the last number of the facility link) or the extraspace.com facility link. The store number in the facility name is a different number.',
});

const flag = (displayName: string, name: string, key: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [key]: '={{ $value || undefined }}' } } },
});

const UNIT_SIZES = ['5x5', '5x10', '5x15', '10x10', '10x15', '10x20', '10x25', '10x30'];

export const extraspaceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['extraspace'] } },
		options: [
			{
				name: 'Get City Prices',
				value: 'cityPrices',
				action: 'Get extra space city prices',
				description: `Self-storage prices in a US city as ${NAME}'s city page gives them: the page's own price sentences, price stats per category (store count, lowest, average, highest and their historical values), rating, review count and the city's ${CARD}. Captured 2026-11-26: Dallas, TX listed 120 facilities, and the page said "105 self storage facilities near Dallas, TX have small 5' x 5' units available now, starting at $7 and averaging $24 per month." City pages are large: allow up to 3 minutes. A city with no page is a charged not-found. ${ONE}`,
				routing: request('/api/v1/extraspace/city-prices'),
			},
			{
				name: 'Get Facility',
				value: 'facility',
				action: 'Get an extra space facility',
				description: `One ${NAME} facility in full by ID or link: address, coordinates, phones, time zone, hours by type, 24-hour access, rating, review count, promotion, Starting at prices, price stats per category (lowest, average, highest and their historical values, as Extra Space's page data gives them), kiosk and new-build flags, description, directions, images, unit class counts and units (size class, dimensions, square feet, parking, features, available count, first come, limited, promotions, in-store price, web rate), and the nearest locations. ${PRICES} Captured 2026-11-26: facility 1934 in Knoxville, TN, rated 4.9 from 699, with 14 of 43 unit classes available; a 10' x 15' climate-controlled indoor unit was 98 USD a month web rate against 172 in store. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/extraspace/facility'),
			},
			{
				name: 'Get Locations',
				value: 'locations',
				action: 'Get extra space locations',
				description: `The US cities ${NAME} lists for its place search (about 1,700 in 44 states and DC), optionally narrowed by state or by the start of a city name; city and state are what Get City Prices takes. Captured 2026-11-26: 1700 cities in all, 125 of them in TX. ${ONE}`,
				routing: request('/api/v1/extraspace/locations'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get extra space reviews',
				description: `The Google reviews shown on an ${NAME} facility page, sorted (recent, oldest, highest or lowest rating), filtered by stars and paged by Scavio over the facility's full set: rating, rating count, review count, histogram, total, pages, has_more and reviews with rating, text, date, source and Extra Space's reply (the reviewer's name reads [name]). Captured 2026-11-26: facility 1934 in Knoxville had 485 reviews over 25 pages of 20; 1-star only gave 6. No reviewer name is returned. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/extraspace/reviews'),
			},
			{
				name: 'Search Facilities',
				value: 'search',
				action: 'Search extra space facilities',
				description: `Self-storage facilities on ${FIRST} near a ZIP code, "City, ST", place or point: up to 120 facilities, nearest first (Extra Space has no further pages), filtered by climate control, drive-up, indoor, RV parking, enclosed vehicle storage, 24-hour access and unit sizes, sorted by distance or Starting at price. Returns search center, did_you_mean (an ambiguous place: send one of them as the term), total and ${CARD}. ${PRICES} Captured 2026-11-26: ZIP 90012 gave 120 facilities, the nearest at 0.44 miles starting at 69 USD a month, rated 4.8 from 524 reviews. A place with no match is a charged not-found. ${ONE}`,
				routing: request('/api/v1/extraspace/search'),
			},
		],
		default: 'search',
	},
];

export const extraspaceFields: INodeProperties[] = [
	// -- Search Facilities --
	{
		displayName: 'Search By',
		name: 'extraspaceSearchBy',
		type: 'options',
		default: 'term',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code, City or Place', value: 'term' },
		],
		displayOptions: show(['search']),
		description: 'Search near a ZIP code, "City, ST" or place, or near a point',
	},
	{
		displayName: 'Term',
		name: 'extraspaceSearchTerm',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90012',
		displayOptions: show(['search'], { extraspaceSearchBy: ['term'] }),
		routing: { request: { body: { term: '={{ String($value).trim() }}' } } },
		description: 'A ZIP code, "City, ST" (e.g. Denver, CO) or a place',
	},
	{
		displayName: 'Latitude',
		name: 'extraspaceSearchLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['search'], { extraspaceSearchBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point (e.g. 32.7767 for Dallas)',
	},
	{
		displayName: 'Longitude',
		name: 'extraspaceSearchLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['search'], { extraspaceSearchBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point (e.g. -96.797 for Dallas)',
	},

	// -- Get Facility / Get Reviews --
	facilityField('extraspaceFacilityId', 'facility'),
	facilityField('extraspaceReviewsId', 'reviews'),

	// -- Get City Prices --
	{
		displayName: 'City',
		name: 'extraspaceCityPricesCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Dallas',
		displayOptions: show(['cityPrices']),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city Extra Space has a city page for (from Get Locations)',
	},
	{
		displayName: 'State',
		name: 'extraspaceCityPricesState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['cityPrices']),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: "Its state: a 2-letter code or the state's name",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'extraspaceSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			flag('24-Hour Access', 'extraspaceSearchAllHour', 'all_hour_access', 'Whether to return only facilities with 24-hour access'),
			flag('Climate Controlled', 'extraspaceSearchClimate', 'climate_controlled', 'Whether to return only facilities with climate-controlled units'),
			flag('Drive-Up Access', 'extraspaceSearchDriveUp', 'drive_up_access', 'Whether to return only facilities with drive-up units'),
			flag('Enclosed Vehicle Storage', 'extraspaceSearchEnclosed', 'enclosed_vehicle_storage', 'Whether to return only facilities with enclosed vehicle storage'),
			flag('Indoor', 'extraspaceSearchIndoor', 'indoor', 'Whether to return only facilities with indoor units'),
			flag('RV Parking', 'extraspaceSearchRv', 'rv_parking', 'Whether to return only facilities with RV, boat or vehicle parking (covered or uncovered)'),
			{
				displayName: 'Sort',
				name: 'extraspaceSearchSort',
				type: 'options',
				default: 'distance',
				options: [
					{ name: 'Distance', value: 'distance' },
					{ name: 'Starting At Price', value: 'price' },
				],
				description: 'Distance (nearest first, as Extra Space orders them) or the lowest Starting at price first (facilities without one last)',
				routing: { request: { body: { sort: '={{ $value === "distance" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Unit Sizes',
				name: 'extraspaceSearchUnitSizes',
				type: 'multiOptions',
				default: [],
				options: UNIT_SIZES.map((s) => ({ name: s, value: s })).sort((a, b) => a.name.localeCompare(b.name)),
				description: 'Only facilities with at least one of these sizes available (empty: any)',
				routing: { request: { body: { unit_sizes: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'extraspaceFacilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['facility']),
		options: [
			flag(
				'Include Unavailable',
				'extraspaceFacilityIncludeUnavailable',
				'include_unavailable',
				'Whether to also list unit classes with nothing to rent now (default: only the classes available now, as the facility page lists them)',
			),
		],
	},
	{
		displayName: 'Additional Options',
		name: 'extraspaceReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'extraspaceReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, from 1; has_more says whether another exists',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'extraspaceReviewsPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews per page, 1 to 100',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'extraspaceReviewsSort',
				type: 'options',
				default: 'recent',
				options: [
					{ name: 'Highest Rating', value: 'rating_desc' },
					{ name: 'Lowest Rating', value: 'rating_asc' },
					{ name: 'Most Recent', value: 'recent' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Review order (newest first within a rating)',
				routing: { request: { body: { sort: '={{ $value === "recent" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'extraspaceReviewsStars',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with these star ratings (empty: any)',
				routing: { request: { body: { stars: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'extraspaceLocationsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['locations']),
		options: sorted([
			{
				displayName: 'Query',
				name: 'extraspaceLocationsQuery',
				type: 'string',
				default: '',
				placeholder: 'San',
				description: 'Only cities whose name starts with this ("San", or "San Antonio, TX")',
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'State',
				name: 'extraspaceLocationsState',
				type: 'string',
				default: '',
				placeholder: 'TX',
				description: 'Only cities in this state (code or name)',
				routing: { request: { body: { state: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},
];
