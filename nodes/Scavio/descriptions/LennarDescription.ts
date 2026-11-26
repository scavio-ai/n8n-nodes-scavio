import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['lennar'], operation, ...extra },
});

// Lennar (lennar.com, the US homebuilder), 11 operations, 1 credit each; credits_used is the truth.
// US only, USD (no country). Answers usually arrive within about 15 seconds, and calls can queue behind
// the backend's upstream limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Lennar (lennar.com, the US homebuilder)';
const NAME = 'Lennar';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged).`;
const NO_PII = "No sales consultant names are returned; the sales office phone is Lennar's public business number.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const numberOption = (
	displayName: string,
	name: string,
	key: string,
	max: number,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: max },
	description,
	routing: { request: { body: { [key]: '={{ $value > 0 ? $value : undefined }}' } } },
});

const multi = (
	displayName: string,
	name: string,
	key: string,
	options: Array<{ name: string; value: string }>,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'multiOptions',
	default: [],
	options,
	description,
	routing: { request: { body: { [key]: '={{ $value && $value.length ? $value : undefined }}' } } },
});

const trimmed = (key: string) => ({ request: { body: { [key]: '={{ String($value).trim() }}' } } });

const comnumField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Community Number',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '22704',
	displayOptions: show([operation]),
	routing: trimmed('comnum'),
	description: 'A Lennar community number (comnum in Search answers), 2 to 8 digits',
});

const lotIdField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Lot ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '22704535134',
	displayOptions: show([operation]),
	routing: trimmed('lot_id'),
	description: 'A Lennar homesite lot ID (homes[].lot_id in Search answers)',
});

const marketField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Market Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'DAL',
	displayOptions: show([operation]),
	routing: trimmed('market'),
	description: 'A Lennar market code (from Get Markets, e.g. DAL, PHO, ORL, HOU)',
});

export const lennarOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['lennar'] } },
		options: [
			{
				name: 'Get Community',
				value: 'community',
				action: 'Get a lennar community',
				description: `One ${NAME} community by community number: name, status, brand, types, address, coordinates, market, master-planned community, base price, price range, square-foot, bed, bath and story ranges, homesite count, HOA fee, development fee, tax rate, deposit, overview, sales center hours, sales office phone and phone hours, schools, amenities, and its plans with starting prices and their homesites (lot ID, status, address, price, was price, estimated move-in date). Captured 2026-11-26: Kresston in Montgomery, TX (22704, Houston market) from 339990 USD, with 48 homesites across 7 plans. An unknown community is a charged not-found. ${NO_PII} ${ONE}`,
				routing: request('/api/v1/lennar/community'),
			},
			{
				name: 'Get Home',
				value: 'home',
				action: 'Get a lennar home',
				description: `One ${NAME} homesite (a quick move-in or to-be-built home) by lot ID: status, address, coordinates, price, was price, beds, baths, garages, stories, square feet, closing cost incentive and its disclaimer, estimated move-in date, reserved, hot of the week, badge, offer and its end date, tour links, overview, estimated monthly payment, the plan and the community (HOA fee, tax rate). Captured 2026-11-26: homesite 22704535134, a move-in ready Melrose II in Kresston at 384990 USD, was 424990 USD. An unknown or sold homesite is a charged not-found. ${ONE}`,
				routing: request('/api/v1/lennar/home'),
			},
			{
				name: 'Get Market',
				value: 'market',
				action: 'Get a lennar market',
				description: `One ${NAME} metro market by market code: name, state, plan count, coordinates, phone, promotion link, its cities, and the feature codes and school districts the Search filters take. Captured 2026-11-26: Phoenix (PHO), AZ: 263 plans, 14 cities, 24 feature codes and 20 school districts. An unknown code is a charged not-found. ${ONE}`,
				routing: request('/api/v1/lennar/market'),
			},
			{
				name: 'Get Markets',
				value: 'markets',
				action: 'Get lennar markets',
				description: `Every state and metro market ${FIRST} builds in, with each market's code (what Search, Get Market and Get Promotions take), name, plan count and coordinates. Captured 2026-11-26: 104 markets in 32 states. ${ONE}`,
				routing: request('/api/v1/lennar/markets'),
			},
			{
				name: 'Get Master-Planned Community',
				value: 'masterPlanned',
				action: 'Get a lennar master planned community',
				description: `One ${NAME} master-planned community by ID: name, status, brand, overview, price text, bed, bath and square-foot ranges, coordinates, city, market, and its communities (community number, status, types, base price, price range, homesite count, HOA fee, tax rate). Captured 2026-11-26: Samara in League City (1916, Houston market), $256,990 - $699,990 across 11 communities. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/lennar/master-planned'),
			},
			{
				name: 'Get Payment Estimate',
				value: 'payment',
				action: 'Get a lennar payment estimate',
				description: `The monthly payment estimate Lennar's calculator gives for a homesite with a down payment and an interest rate: principal and interest, property tax and rate, home insurance and rate, mortgage insurance and rate, HOA fee, community development fee, down payment and its percent, and the calculator's own legal disclaimer. Amounts are Lennar's calculator's (Lennar Mortgage, LLC), not a quote. Captured 2026-11-26: homesite 22704535134 with 20000 USD down at 0.07 gave 2428.29 USD principal and interest a month. A homesite with no estimate is a charged not-found. ${ONE}`,
				routing: request('/api/v1/lennar/payment'),
			},
			{
				name: 'Get Plan',
				value: 'plan',
				action: 'Get a lennar plan',
				description: `One ${NAME} floor plan by community number and plan number: status, beds, baths, square feet, garages, starting price, was starting price, next gen, available homesites, tour links, overview, floor plan images, included features by category, its homesites with prices and the community's other homes. Captured 2026-11-26: the Melrose II plan (4504) in Kresston: 4 beds, 3 baths, 2731 sqft, from 424990 USD, 2 homesites available. An unknown plan is a charged not-found. ${ONE}`,
				routing: request('/api/v1/lennar/plan'),
			},
			{
				name: 'Get Promotions',
				value: 'promotions',
				action: 'Get lennar promotions',
				description: `The market-wide promotion ${NAME} shows for a market: title, legal copy, offers (header, type, title, incentives, legal details) and the homesites the promotion page lists, exactly as Lennar shows them, or promotion null when none runs. Captured 2026-11-26: Dallas / Ft. Worth (DAL) ran "Black Friday Deals!" with an offer of up to a $20,000 price reduction; Orlando (ORL) ran "Black Friday Sale!" listing 18 homesites. ${ONE}`,
				routing: request('/api/v1/lennar/promotions'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get lennar suggestions',
				description: `The places, communities and plans ${NAME} suggests for a few letters, each with its category, type, text, the Search input it stands for (market, state, city, map box, beds) and its page path for Resolve Link. Captured 2026-11-26: Katy gave 10 suggestions, the first the Katy Area, TX region. ${ONE}`,
				routing: request('/api/v1/lennar/suggestions'),
			},
			{
				name: 'Resolve Link',
				value: 'resolve',
				action: 'Resolve a lennar link',
				description: `What a lennar.com link is: its type (community, plan, home or master-planned community), page type and IDs (community number, plan number, lot ID, master-planned community ID) for the Get operations. Captured 2026-11-26: the link of the Melrose II plan in Kresston resolved to a plan, community 22704, plan 4504. A link that is no such page is a charged not-found. ${ONE}`,
				routing: request('/api/v1/lennar/resolve'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search lennar',
				description: `Search new homes (homesites and floor plans) or communities (communities and master-planned communities) on ${FIRST} by market code, state, city, text, a point with a radius or a map box, with bed, bath, price and square-foot filters, home types, community types (active adult, lifestyle), homesite availability (quick move-in, under construction, coming soon, future release), community status, feature codes and school filters, 7 sorts, 1 to 200 a page. Returns total, totals (communities, plans, homesites), is_fallback (Lennar had no exact match and shows its fallback results), has_more, and homes (lot ID, status, address, beds, baths, square feet, price, was price, offer, plan, community) or communities (community number or master-planned ID, status, base price, ranges, city, market). Captured 2026-11-26: homes in Dallas / Ft. Worth (DAL) by lowest price gave 890 homesites (60 communities, 372 plans), the first a 1-bed, 661 sqft homesite in Princeton at 117499 USD. ${NO_PII} ${ONE}`,
				routing: request('/api/v1/lennar/search'),
			},
		],
		default: 'search',
	},
];

export const lennarFields: INodeProperties[] = [
	// -- Search --
	{
		displayName: 'Mode',
		name: 'lennarSearchMode',
		type: 'options',
		default: 'homes',
		options: [
			{ name: 'Communities', value: 'communities' },
			{ name: 'Homes', value: 'homes' },
		],
		displayOptions: show(['search']),
		routing: { request: { body: { mode: '={{ $value === "homes" ? undefined : $value }}' } } },
		description: 'Homes (homesites and floor plans) or communities (communities and master-planned communities)',
	},
	{
		displayName: 'Search By',
		name: 'lennarSearchBy',
		type: 'options',
		default: 'market',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'Map Box', value: 'bounds' },
			{ name: 'Market Code', value: 'market' },
			{ name: 'State', value: 'state' },
			{ name: 'Text', value: 'text' },
		],
		displayOptions: show(['search']),
		description: 'The place to search: a market code, a state, a city, Lennar text search, a point or a map box',
	},
	{
		displayName: 'Market Code',
		name: 'lennarSearchMarket',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'DAL',
		displayOptions: show(['search'], { lennarSearchBy: ['market'] }),
		routing: trimmed('market'),
		description: 'A Lennar market code (from Get Markets, e.g. DAL, PHO, ORL, HOU)',
	},
	{
		displayName: 'State',
		name: 'lennarSearchState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['search'], { lennarSearchBy: ['state'] }),
		routing: trimmed('state'),
		description: 'A two-letter state code',
	},
	{
		displayName: 'City',
		name: 'lennarSearchCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Katy',
		displayOptions: show(['search'], { lennarSearchBy: ['city'] }),
		routing: trimmed('city'),
		description: 'A city name (cities from Get Market)',
	},
	{
		displayName: 'Text',
		name: 'lennarSearchText',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['search'], { lennarSearchBy: ['text'] }),
		routing: trimmed('text'),
		description: 'Lennar text search: it matches community and plan names (use Get Suggestions for places)',
	},
	{
		displayName: 'Latitude',
		name: 'lennarSearchLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 17, maxValue: 72, numberPrecision: 6 },
		displayOptions: show(['search'], { lennarSearchBy: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point (e.g. 32.7767)',
	},
	{
		displayName: 'Longitude',
		name: 'lennarSearchLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: -60, numberPrecision: 6 },
		displayOptions: show(['search'], { lennarSearchBy: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point (e.g. -96.797)',
	},
	{
		displayName: 'Radius (Miles)',
		name: 'lennarSearchRadius',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 100 },
		displayOptions: show(['search'], { lennarSearchBy: ['coordinates'] }),
		routing: { request: { body: { radius: '={{ $value > 0 ? $value : undefined }}' } } },
		description: 'Miles around the point, 1 to 100 (0: Lennar default)',
	},
	{
		displayName: 'North',
		name: 'lennarSearchNorth',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 6 },
		displayOptions: show(['search'], { lennarSearchBy: ['bounds'] }),
		routing: {
			request: {
				body: {
					bounds:
						'={{ { north: $value, east: $parameter.lennarSearchEast, south: $parameter.lennarSearchSouth, west: $parameter.lennarSearchWest } }}',
				},
			},
		},
		description: "The map box's north latitude (a suggestion's search.bounds)",
	},
	{
		displayName: 'East',
		name: 'lennarSearchEast',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 6 },
		displayOptions: show(['search'], { lennarSearchBy: ['bounds'] }),
		description: "The map box's east longitude",
	},
	{
		displayName: 'South',
		name: 'lennarSearchSouth',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 6 },
		displayOptions: show(['search'], { lennarSearchBy: ['bounds'] }),
		description: "The map box's south latitude",
	},
	{
		displayName: 'West',
		name: 'lennarSearchWest',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { numberPrecision: 6 },
		displayOptions: show(['search'], { lennarSearchBy: ['bounds'] }),
		description: "The map box's west longitude",
	},

	// -- Get Community / Get Plan / Get Home / Get Payment Estimate --
	comnumField('lennarCommunityComnum', 'community'),
	comnumField('lennarPlanComnum', 'plan'),
	{
		displayName: 'Plan Number',
		name: 'lennarPlanNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4504',
		displayOptions: show(['plan']),
		routing: trimmed('plan_number'),
		description: "A plan number (plans[].plan_number from Get Community)",
	},
	lotIdField('lennarHomeLotId', 'home'),
	lotIdField('lennarPaymentLotId', 'payment'),
	comnumField('lennarPaymentComnum', 'payment'),
	{
		displayName: 'Down Payment',
		name: 'lennarPaymentDownPayment',
		type: 'number',
		required: true,
		default: 40000,
		typeOptions: { minValue: 0, maxValue: 50000000 },
		displayOptions: show(['payment']),
		routing: { request: { body: { down_payment: '={{ $value }}' } } },
		description: 'Down payment, USD',
	},
	{
		displayName: 'Interest Rate',
		name: 'lennarPaymentInterestRate',
		type: 'number',
		required: true,
		default: 0.065,
		typeOptions: { minValue: 0.0001, maxValue: 1, numberPrecision: 4 },
		displayOptions: show(['payment']),
		routing: { request: { body: { interest_rate: '={{ $value }}' } } },
		description: 'Interest rate as a decimal: 0.065 for 6.5% (values above 1 are refused)',
	},

	// -- Get Master-Planned Community --
	{
		displayName: 'Master-Planned Community ID',
		name: 'lennarMasterPlannedId',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 1 },
		placeholder: '1916',
		displayOptions: show(['masterPlanned']),
		routing: { request: { body: { mpc_id: '={{ $value }}' } } },
		description: 'A master-planned community ID (mpc_id in Search answers with Mode Communities)',
	},

	// -- Get Market / Get Promotions --
	marketField('lennarMarketCode', 'market'),
	marketField('lennarPromotionsMarket', 'promotions'),

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'lennarSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Katy',
		displayOptions: show(['suggestions']),
		routing: trimmed('query'),
		description: 'The start of a city, ZIP code, region, community or plan name (2 to 80 characters)',
	},

	// -- Resolve Link --
	{
		displayName: 'Link or Path',
		name: 'lennarResolveUrl',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['resolve']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					path: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A lennar.com community, plan, home or master-planned community link, or its path (/new-homes/...)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'lennarSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			multi(
				'Availability',
				'lennarSearchAvailability',
				'availability',
				[
					{ name: 'Coming Soon', value: 'coming_soon' },
					{ name: 'Future Release', value: 'future_release' },
					{ name: 'Quick Move-In', value: 'quick_move_in' },
					{ name: 'Under Construction', value: 'under_construction' },
				],
				'Homesite availability (empty: any)',
			),
			numberOption('Baths Min', 'lennarSearchBathsMin', 'baths_min', 6, 'Fewest bathrooms, 1 to 6 (0: any)'),
			numberOption('Beds Min', 'lennarSearchBedsMin', 'beds_min', 6, 'Fewest bedrooms, 1 to 6 (0: any)'),
			multi(
				'Community Status',
				'lennarSearchCommunityStatus',
				'community_status',
				[
					{ name: 'Active', value: 'active' },
					{ name: 'Coming Soon', value: 'coming_soon' },
					{ name: 'Sold Out', value: 'sold_out' },
				],
				'Community status (empty: any)',
			),
			multi(
				'Community Types',
				'lennarSearchCommunityTypes',
				'community_types',
				[
					{ name: 'Active Adult (55+)', value: 'active_adult' },
					{ name: 'Lifestyle', value: 'lifestyle' },
				],
				'Community types (empty: any)',
			),
			{
				displayName: 'Feature Codes',
				name: 'lennarSearchFeatures',
				type: 'string',
				default: '',
				placeholder: 'SSTORY, 3GAR',
				description: 'Up to 10 feature codes, comma-separated, as Get Market gives them (features[].code)',
				routing: {
					request: {
						body: {
							features:
								'={{ String($value).trim() ? String($value).split(",").map((s) => s.trim()).filter((s) => s) : undefined }}',
						},
					},
				},
			},
			multi(
				'Home Types',
				'lennarSearchHomeTypes',
				'home_types',
				[
					{ name: 'Multi-Family', value: 'multi_family' },
					{ name: 'Next Gen', value: 'next_gen' },
					{ name: 'Single Family', value: 'single_family' },
					{ name: 'Single Story', value: 'single_story' },
				],
				'Home types (empty: any)',
			),
			{
				displayName: 'Page',
				name: 'lennarSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, from 1; has_more says whether another exists',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'lennarSearchPageSize',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Results per page, 1 to 200',
				routing: { request: { body: { page_size: '={{ $value === 25 ? undefined : $value }}' } } },
			},
			numberOption('Price Max', 'lennarSearchPriceMax', 'price_max', 50000000, 'Highest price, USD (0: any)'),
			numberOption('Price Min', 'lennarSearchPriceMin', 'price_min', 50000000, 'Lowest price, USD (0: any)'),
			{
				displayName: 'School District',
				name: 'lennarSearchSchoolDistrict',
				type: 'string',
				default: '',
				description: 'A school district code as Get Market gives it (school_districts[].code)',
				routing: { request: { body: { school_district: '={{ String($value).trim() || undefined }}' } } },
			},
			multi(
				'School Levels',
				'lennarSearchSchoolLevels',
				'school_levels',
				[
					{ name: 'Elementary', value: 'elementary' },
					{ name: 'High', value: 'high' },
					{ name: 'Middle', value: 'middle' },
				],
				'School levels (empty: any)',
			),
			{
				displayName: 'School Rating',
				name: 'lennarSearchSchoolRating',
				type: 'options',
				default: '',
				options: [
					{ name: 'A', value: 'A' },
					{ name: 'Any', value: '' },
					{ name: 'B', value: 'B' },
					{ name: 'C', value: 'C' },
					{ name: 'D', value: 'D' },
				],
				description: "Lennar's school rating filter",
				routing: { request: { body: { school_rating: '={{ $value || undefined }}' } } },
			},
			multi(
				'School Types',
				'lennarSearchSchoolTypes',
				'school_types',
				[
					{ name: 'Charter', value: 'charter' },
					{ name: 'Private', value: 'private' },
					{ name: 'Public', value: 'public' },
				],
				'School types (empty: any)',
			),
			{
				displayName: 'Sort',
				name: 'lennarSearchSort',
				type: 'options',
				default: 'featured',
				options: [
					{ name: 'Distance (Needs Coordinates)', value: 'distance' },
					{ name: 'Featured', value: 'featured' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Square Feet: High to Low', value: 'sqft_desc' },
					{ name: 'Square Feet: Low to High', value: 'sqft_asc' },
				],
				description: "Lennar's sort options",
				routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
			},
			numberOption('Sqft Max', 'lennarSearchSqftMax', 'sqft_max', 50000, 'Largest living area, square feet (0: any)'),
			numberOption('Sqft Min', 'lennarSearchSqftMin', 'sqft_min', 50000, 'Smallest living area, square feet (0: any)'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'lennarSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: sorted([
			{
				displayName: 'Limit',
				name: 'lennarSuggestionsLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 10 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Market Code',
				name: 'lennarSuggestionsMarket',
				type: 'string',
				default: '',
				placeholder: 'HOU',
				description: 'Favor one market (a market code)',
				routing: { request: { body: { market: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},
];
