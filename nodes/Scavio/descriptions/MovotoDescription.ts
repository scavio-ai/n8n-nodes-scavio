import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['movoto'], operation, ...extra },
});

// Movoto (movoto.com, the US home search site owned by Lower), 5 operations, 1 credit each;
// credits_used is the truth. US only, USD (no country). Calls can queue behind the backend's
// upstream limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Movoto (movoto.com, the US home search site owned by Lower)';
const NAME = 'Movoto';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_PII =
	"No listing-agent names, phones, emails or license numbers are returned; brokerage company names are (a brokerage label that is a person's name is null).";
const CARD =
	'homes with id, URL, path (what Get Property takes), status, price (USD; monthly rent on rentals), sold price (null in non-disclosure states such as Texas), sold date, list date, days on Movoto, price change, beds, baths, square feet, lot size, year built, monthly HOA fee, garage spaces, property type, MLS number and ID, brokerage (company), address, coordinates, photo, open houses and tour flags';

const thisYear = new Date().getUTCFullYear();

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const numberOption = (
	displayName: string,
	name: string,
	key: string,
	min: number,
	max: number,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: max },
	description,
	routing: { request: { body: { [key]: `={{ $value >= ${Math.max(min, 1)} ? $value : undefined }}` } } },
});

const flagOption = (displayName: string, name: string, key: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [key]: '={{ $value || undefined }}' } } },
});

const urlOrPath = (value: string) => ({
	url: `={{ /^https?:/i.test(String(${value}).trim()) ? String(${value}).trim() : undefined }}`,
	path: `={{ /^https?:/i.test(String(${value}).trim()) ? undefined : String(${value}).trim().replace(/^\\/+/, "") }}`,
});

export const movotoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['movoto'] } },
		options: [
			{
				name: 'Get Market Trends',
				value: 'marketTrends',
				action: 'Get movoto market trends',
				description: `The housing market trends ${NAME} publishes for a city (City and State) or a ZIP code: location, last updated, summary, snapshots for today, one month ago and one year ago (median list price, median price per square foot, median days on market, median home size, inventory, 1-month and 1-year change, for all homes, single family and condos), stat cards, by type, the nearby cities or ZIP codes compared, overview, and for ZIP codes Movoto's daily statistics. Movoto publishes no monthly series. Captured 2026-11-26: Los Angeles, CA had a median list price of 1049000 USD (down 4.6% year over year), 72 days on market and 5037 active listings. ${ONE}.`,
				routing: request('/api/v1/movoto/market-trends'),
			},
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get a movoto property',
				description: `One home on ${NAME} (for sale, sold or for rent) by link or path from Search Homes: the search card fields plus description (phone numbers and emails removed), features, price history, tax history, Movoto's area-based estimate (the area's price per square foot times the home's size; not an appraisal; null on rentals), key insights, schools with GreatSchools ratings and their links (what Get School takes), school districts, area trends, local scores, nearby sold, for-sale, new-construction and rental homes, and photos. Captured 2026-11-26: 12901 Sherbourne St, Austin, TX 78729, a 4-bed single-family home for sale at 649029 USD with a Movoto area-based estimate of 542780 USD. ${NO_PII} An unknown listing is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/movoto/property'),
			},
			{
				name: 'Get School',
				value: 'school',
				action: 'Get a movoto school',
				description: `One school on ${NAME} by link or path (Get Property schools URL): NCES ID, name, level, type, address, coordinates, district, GreatSchools rating (1-10), state rating, teacher-student ratio, test scores by grade and subject, the homes zoned for the school with the Search Homes input for all of them (zone search), and nearby schools. Parent reviews are not returned. Captured 2026-11-26: Davis Elementary School, Austin, TX, rated 6 of 10, teacher-student ratio 1:12. An unknown school is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/movoto/school'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get movoto suggestions',
				description: `The places ${NAME} suggests for the start of a city, ZIP code, neighborhood, county or school name: type, name, full name, city, county, state, ZIP, neighborhood, school ID, listing count, coordinates and search (the Search Homes input for that place). Places only: Movoto does not suggest street addresses. Captured 2026-11-26: Austin gave 16 places, the first Austin, TX with 6610 listings. ${ONE}.`,
				routing: request('/api/v1/movoto/suggestions'),
			},
			{
				name: 'Search Homes',
				value: 'search',
				action: 'Search movoto homes',
				description: `Search homes for sale, sold homes or rentals on ${FIRST} in a city, ZIP code, county, neighborhood or school zone, with property types, bedroom, bathroom, price, size, lot, year-built, HOA and days-on-market ranges, garage spaces, pool, sold window and for-sale flags (hide pending, open houses, price reduced, new listings, new construction, foreclosures), 8 sorts, 50 homes a page up to 99 pages. Returns total, pages, has_more, ${CARD}, plus Movoto's market summary and market snapshot for the area, facet counts, top ZIP codes and neighborhoods, nearby cities and notes (incl. any filter Movoto did not apply). Captured 2026-11-26: homes for sale in Austin, TX gave 5885 over 99 pages; homes sold in the last month in Los Angeles, CA 935. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/movoto/search'),
			},
		],
		default: 'search',
	},
];

export const movotoFields: INodeProperties[] = [
	// -- Search Homes --
	{
		displayName: 'Search By',
		name: 'movotoSearchBy',
		type: 'options',
		default: 'city',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'County', value: 'county' },
			{ name: 'Neighborhood', value: 'neighborhood' },
			{ name: 'School Zone', value: 'school' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['search']),
		description: 'Where to search: a city, a county, a neighborhood of a city, the homes zoned for one school, or a ZIP code',
	},
	{
		displayName: 'City',
		name: 'movotoSearchCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['search'], { movotoSearchBy: ['city', 'neighborhood', 'school'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city',
	},
	{
		displayName: 'County',
		name: 'movotoSearchCounty',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Travis',
		displayOptions: show(['search'], { movotoSearchBy: ['county'] }),
		routing: { request: { body: { county: '={{ String($value).trim() }}' } } },
		description: 'A county (Travis or Travis County)',
	},
	{
		displayName: 'Neighborhood',
		name: 'movotoSearchNeighborhood',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Hyde Park',
		displayOptions: show(['search'], { movotoSearchBy: ['neighborhood'] }),
		routing: { request: { body: { neighborhood: '={{ String($value).trim() }}' } } },
		description: 'A neighborhood of the city (Get Suggestions returns neighborhood names)',
	},
	{
		displayName: 'School ID',
		name: 'movotoSearchSchoolId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4800595',
		displayOptions: show(['search'], { movotoSearchBy: ['school'] }),
		routing: { request: { body: { school_id: '={{ String($value).trim() }}' } } },
		description: 'A Movoto school ID (Get School ID, or Get Suggestions school_id): the homes zoned for that school',
	},
	{
		displayName: 'State',
		name: 'movotoSearchState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['search'], { movotoSearchBy: ['city', 'county', 'neighborhood', 'school'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'Two-letter US state code',
	},
	{
		displayName: 'ZIP Code',
		name: 'movotoSearchZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '78704',
		displayOptions: show(['search'], { movotoSearchBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A five-digit US ZIP code',
	},
	{
		displayName: 'Status',
		name: 'movotoSearchStatus',
		type: 'options',
		default: 'for_sale',
		options: [
			{ name: 'For Sale', value: 'for_sale' },
			{ name: 'Rentals', value: 'rentals' },
			{ name: 'Sold', value: 'sold' },
		],
		displayOptions: show(['search']),
		description: 'Homes for sale, sold homes or rentals (price is the monthly rent on rentals)',
		routing: { request: { body: { status: '={{ $value === "for_sale" ? undefined : $value }}' } } },
	},

	// -- Get Property --
	{
		displayName: 'Property URL or Path',
		name: 'movotoPropertyUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.movoto.com/<city-st>/<address>/pid_<ID>/',
		displayOptions: show(['property']),
		routing: { request: { body: urlOrPath('$value') } },
		description: 'A Movoto property link or path (URL or path from Search Homes)',
	},

	// -- Get Market Trends --
	{
		displayName: 'Place By',
		name: 'movotoTrendsBy',
		type: 'options',
		default: 'city',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['marketTrends']),
		description: 'Market trends for a city (with state) or a ZIP code',
	},
	{
		displayName: 'City',
		name: 'movotoTrendsCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Los Angeles',
		displayOptions: show(['marketTrends'], { movotoTrendsBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city',
	},
	{
		displayName: 'State',
		name: 'movotoTrendsState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CA',
		displayOptions: show(['marketTrends'], { movotoTrendsBy: ['city'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'Two-letter US state code',
	},
	{
		displayName: 'ZIP Code',
		name: 'movotoTrendsZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '78704',
		displayOptions: show(['marketTrends'], { movotoTrendsBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A five-digit US ZIP code',
	},
	{
		displayName: 'Include Daily Statistics',
		name: 'movotoTrendsDaily',
		type: 'boolean',
		default: true,
		displayOptions: show(['marketTrends'], { movotoTrendsBy: ['zip'] }),
		description: "Whether to add Movoto's daily statistics for the ZIP code (same 1 credit)",
		routing: { request: { body: { include_daily: '={{ $value ? undefined : false }}' } } },
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'movotoSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a city, ZIP code, neighborhood, county or school name (2 to 80 characters)',
	},

	// -- Get School --
	{
		displayName: 'School URL or Path',
		name: 'movotoSchoolUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.movoto.com/schools/<city-st>/<school>-<ID>/',
		displayOptions: show(['school']),
		routing: { request: { body: urlOrPath('$value') } },
		description: 'A Movoto school link or path, from the schools of Get Property',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'movotoSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			numberOption('Baths Max', 'movotoSearchBathsMax', 'baths_max', 1, 20, 'Most bathrooms (0: no maximum)'),
			numberOption('Baths Min', 'movotoSearchBathsMin', 'baths_min', 1, 20, 'Fewest bathrooms (0: no minimum)'),
			numberOption('Beds Max', 'movotoSearchBedsMax', 'beds_max', 1, 20, 'Most bedrooms (0: no maximum)'),
			numberOption('Beds Min', 'movotoSearchBedsMin', 'beds_min', 1, 20, 'Fewest bedrooms (0: no minimum)'),
			numberOption('Days on Market Max', 'movotoSearchDomMax', 'days_on_market_max', 1, 3650, 'Most days on Movoto (For Sale and Rentals; 0: no maximum)'),
			numberOption('Days on Market Min', 'movotoSearchDomMin', 'days_on_market_min', 1, 3650, 'Fewest days on Movoto (For Sale and Rentals; 0: no minimum)'),
			flagOption('Foreclosures Only', 'movotoSearchForeclosed', 'foreclosed', 'Whether to return foreclosures only (For Sale)'),
			numberOption('Garage Spaces Min', 'movotoSearchGarageMin', 'garage_min', 1, 10, 'Fewest garage spaces (0: no minimum)'),
			flagOption('Hide Pending', 'movotoSearchHidePending', 'hide_pending', 'Whether to leave out pending and contingent homes (For Sale)'),
			numberOption('HOA Max', 'movotoSearchHoaMax', 'hoa_max', 1, 100000, 'Highest monthly HOA fee, USD (For Sale and Sold; 0: no maximum)'),
			numberOption('HOA Min', 'movotoSearchHoaMin', 'hoa_min', 1, 100000, 'Lowest monthly HOA fee, USD (For Sale and Sold; 0: no minimum)'),
			numberOption('Lot Square Feet Max', 'movotoSearchLotMax', 'lot_sqft_max', 1, 100000000, 'Largest lot, square feet (0: no maximum)'),
			numberOption('Lot Square Feet Min', 'movotoSearchLotMin', 'lot_sqft_min', 1, 100000000, 'Smallest lot, square feet (0: no minimum)'),
			flagOption('New Construction Only', 'movotoSearchNewConstruction', 'new_construction', 'Whether to return new construction only (For Sale)'),
			flagOption('New Listings Only', 'movotoSearchNewListings', 'new_listings', 'Whether to return homes listed in the last 7 days only (For Sale)'),
			flagOption('Open Houses Only', 'movotoSearchOpenHouses', 'open_houses', 'Whether to return homes with an open house scheduled only (For Sale)'),
			{
				displayName: 'Page',
				name: 'movotoSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, from 1 (50 homes a page). Movoto serves up to 99 pages per search; a page past the last is empty (with a note).',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			flagOption('Pool', 'movotoSearchPool', 'pool', 'Whether to return homes whose listing mentions a pool only'),
			numberOption('Price Max', 'movotoSearchPriceMax', 'price_max', 1, 1000000000, 'Highest price, USD (monthly rent on Rentals; 0: no maximum)'),
			numberOption('Price Min', 'movotoSearchPriceMin', 'price_min', 1, 1000000000, 'Lowest price, USD (monthly rent on Rentals; 0: no minimum)'),
			flagOption('Price Reduced Only', 'movotoSearchPriceReduced', 'price_reduced', 'Whether to return homes with a price reduced in the last 30 days only (For Sale)'),
			{
				displayName: 'Property Types',
				name: 'movotoSearchPropertyTypes',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Condo', value: 'condo' },
					{ name: 'Land', value: 'land' },
					{ name: 'Mobile', value: 'mobile' },
					{ name: 'Multi-Family', value: 'multi_family' },
					{ name: 'Other', value: 'other' },
					{ name: 'Single Family', value: 'single_family' },
				],
				description: 'Property types (empty: any)',
				routing: { request: { body: { property_types: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sold Within',
				name: 'movotoSearchSoldWithin',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any Time', value: '' },
					{ name: 'Last 1 Month', value: '1m' },
					{ name: 'Last 1 Week', value: '1w' },
					{ name: 'Last 1 Year', value: '1y' },
					{ name: 'Last 2 Years', value: '2y' },
					{ name: 'Last 3 Months', value: '3m' },
					{ name: 'Last 6 Months', value: '6m' },
				],
				description: 'Sold: sold in this window (Any Time: every sale Movoto lists)',
				routing: { request: { body: { sold_within: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'movotoSearchSort',
				type: 'options',
				default: 'relevant',
				options: [
					{ name: 'Largest', value: 'sqft_large' },
					{ name: 'Lowest Price per Square Foot', value: 'price_per_sqft' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Recently Updated', value: 'updated' },
					{ name: 'Relevant', value: 'relevant' },
					{ name: 'Smallest', value: 'sqft_small' },
				],
				description: "Movoto's sort options (Relevant is Movoto's default)",
				routing: { request: { body: { sort: '={{ $value === "relevant" ? undefined : $value }}' } } },
			},
			numberOption('Square Feet Max', 'movotoSearchSqftMax', 'sqft_max', 1, 1000000, 'Largest living area, square feet (0: no maximum)'),
			numberOption('Square Feet Min', 'movotoSearchSqftMin', 'sqft_min', 1, 1000000, 'Smallest living area, square feet (0: no minimum)'),
			numberOption('Year Built Max', 'movotoSearchYearMax', 'year_built_max', 1700, thisYear + 2, 'Latest year built (0: any)'),
			numberOption('Year Built Min', 'movotoSearchYearMin', 'year_built_min', 1700, thisYear + 2, 'Earliest year built (0: any)'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'movotoSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Types',
				name: 'movotoSuggestionsTypes',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'City', value: 'city' },
					{ name: 'County', value: 'county' },
					{ name: 'Neighborhood', value: 'neighborhood' },
					{ name: 'School', value: 'school' },
					{ name: 'ZIP Code', value: 'zipcode' },
				],
				description: 'Only these place types (empty: all)',
				routing: { request: { body: { types: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
		],
	},
];
