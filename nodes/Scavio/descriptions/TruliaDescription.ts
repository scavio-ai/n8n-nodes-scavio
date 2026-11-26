import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['trulia'], operation, ...extra },
});

// Trulia (trulia.com, Zillow Group's home and neighborhood site), 5 operations, 1 credit each;
// credits_used is the truth. US only, USD (no country). Spanish (language es) exists only where Trulia
// publishes Spanish pages: rental searches, buildings and neighborhoods. Get Neighborhood with the market
// snapshot reads a second page and can take longer, and calls can queue behind the backend's upstream
// limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = "Trulia (trulia.com, Zillow Group's home and neighborhood site)";
const NAME = 'Trulia';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_PII =
	'No listing-agent names, phones, emails or license numbers and no reviewer names are returned; brokerage company names are.';
const LIST =
	"homes with zpid (what Get Property takes), building_id for rental buildings, URL, status, listing type, price (USD; monthly rent on rentals; sold rows read from the sale price Trulia prints), price range and price note for rental buildings, address, community name, coordinates, beds, baths, living area, lot size, home type, tags, date listed, sold date, open houses, brokerage (company), 3D tour and video flags and images, plus total, total_pages, has_more, applied_filters (the filters Trulia says it applied) and the neighborhoods in the results with their counts";

const thisYear = new Date().getUTCFullYear();

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const languageOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'Spanish', value: 'es' },
	],
	description,
	routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
});

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

export const truliaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['trulia'] } },
		options: [
			{
				name: 'Get Neighborhood',
				value: 'neighborhood',
				action: 'Get a trulia neighborhood',
				description: `One ${FIRST} neighborhood page by location ID or link: Trulia's "What Locals Say" survey results and safety statements with their percentages and response counts, resident reviews (up to 40 shown; the total and category counts cover all) with reviewer type and date, facts (homes for sale and for rent, their price ranges, the commute), amenities, schools with GreatSchools ratings, the neighborhood outline, nearby neighborhoods, homes for sale and (by default) Trulia's market snapshot (average sale price, sale-to-list ratio, price per square foot, active listings, market temperature) and median sale price history, with the scope Trulia gives them. Crime data is no longer on Trulia. Captured 2026-11-26: Upper East Side, New York (location ID 85381): 1480 survey responses, 94% say it is walkable to grocery stores, 277 resident reviews, 1885 homes for sale, and an October 2026 average sale price of $1.47M with a 98.2% sale-to-list ratio. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/trulia/neighborhood'),
			},
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get a trulia property',
				description: `One ${NAME} home (for sale, sold or for rent) by zpid or link, or one rental building by building ID or link: status, address, price, beds, baths, living area, lot size, home type, tags, description, Zestimate and Rent Zestimate as Trulia shows them, home value history, price history, last sale, taxes, features, open houses, brokerage (company), MLS, payment estimate and price versus the area median (from Trulia's FAQ answers), Trulia's market snapshot, the neighborhood (with its location ID for Get Neighborhood), schools summary and, for buildings, floor plans with units, fees, pet policy, special offers and units available, plus up to 50 images. Captured 2026-11-26: a 1-bed co-op at 345 E 93rd Street #8F, New York (zpid 119917817) for sale at 610000 USD; The Janis rental building in Austin at $1,524 - $2,310/mo total price, base rent plus 75 USD of required monthly fees. An ID Trulia does not have is a charged not-found. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/trulia/property'),
			},
			{
				name: 'Get School',
				value: 'school',
				action: 'Get a trulia school',
				description: `One school on ${NAME} by link, or by school ID and state: type, levels, grades, students, district, address, coordinates, website, GreatSchools ratings (overall, test scores, equity, academic progress, college readiness, student growth), student-teacher and student-counselor ratios, certified teachers, parent rating, parent reviews (no names), nearby schools and the homes for sale and for rent assigned to it. Captured 2026-11-26: Dever Elementary School, Chicago (school ID 279445, IL), public, PK-8, 728 students, GreatSchools overall rating 4 of 10. An unknown school is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/trulia/school'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get trulia suggestions',
				description: `${NAME}'s place suggestions for the start of a city, neighborhood, ZIP code, address or school name: places (title, type, city, state, ZIP, location ID (a neighborhood's is what Get Neighborhood takes), zpid for addresses, search_location (what Search Homes takes), coordinates) and schools (school ID, city, state). Captured 2026-11-26: Austin gave 7 suggestions, the first Austin, TX. ${ONE}.`,
				routing: request('/api/v1/trulia/suggestions'),
			},
			{
				name: 'Search Homes',
				value: 'search',
				action: 'Search trulia homes',
				description: `Search ${FIRST} for homes for sale, for rent or recently sold in a ZIP code, city or neighborhood, with bed, bath, price, square-foot, year-built and HOA filters, property types, a keyword and pets (rentals), 7 sorts, 40 homes a page up to page 50. Returns ${LIST}. Captured 2026-11-26: homes for sale in Austin, TX gave 2146 over 54 pages; rentals in Brooklyn, NY 2264; recently sold in Seattle, WA 7547. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/trulia/search'),
			},
		],
		default: 'neighborhood',
	},
];

export const truliaFields: INodeProperties[] = [
	// -- Get Neighborhood --
	{
		displayName: 'Location ID or URL',
		name: 'truliaNeighborhoodId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '85381',
		displayOptions: show(['neighborhood']),
		routing: {
			request: {
				body: {
					location_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			"A Trulia neighborhood location ID (digits: the neighborhood location ID Get Property returns, or a neighborhood's location ID in Get Suggestions) or the neighborhood's trulia.com/n/ link",
	},

	// -- Search Homes --
	{
		displayName: 'Location',
		name: 'truliaSearchLocation',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin, TX',
		displayOptions: show(['search']),
		routing: { request: { body: { location: '={{ String($value).trim() }}' } } },
		description:
			'A ZIP code (78701), "City, ST" (Austin, TX) or "Neighborhood, City, ST" (Upper East Side, New York, NY); Get Suggestions returns search_location values',
	},

	// -- Get Property --
	{
		displayName: 'Look Up By',
		name: 'truliaPropertyBy',
		type: 'options',
		default: 'zpid',
		options: [
			{ name: 'Building ID', value: 'building_id' },
			{ name: 'Home (Zpid)', value: 'zpid' },
			{ name: 'URL', value: 'url' },
		],
		displayOptions: show(['property']),
		description: 'A home by zpid, a rental building by building ID, or either by its trulia.com link',
	},
	{
		displayName: 'Zpid',
		name: 'truliaPropertyZpid',
		type: 'string',
		required: true,
		default: '',
		placeholder: '339349810',
		displayOptions: show(['property'], { truliaPropertyBy: ['zpid'] }),
		routing: { request: { body: { zpid: '={{ String($value).trim() }}' } } },
		description: 'A home zpid (the ID Trulia shares with Zillow; the zpid Search Homes returns, digits)',
	},
	{
		displayName: 'Building ID',
		name: 'truliaPropertyBuildingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2775825120',
		displayOptions: show(['property'], { truliaPropertyBy: ['building_id'] }),
		routing: { request: { body: { building_id: '={{ String($value).trim() }}' } } },
		description: 'A rental building ID (the building_id Search Homes returns, digits)',
	},
	{
		displayName: 'URL',
		name: 'truliaPropertyUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.trulia.com/home/...',
		displayOptions: show(['property'], { truliaPropertyBy: ['url'] }),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description: 'A trulia.com/home/ or trulia.com/building/ link',
	},

	// -- Get School --
	{
		displayName: 'Look Up By',
		name: 'truliaSchoolBy',
		type: 'options',
		default: 'url',
		options: [
			{ name: 'School ID and State', value: 'id' },
			{ name: 'URL', value: 'url' },
		],
		displayOptions: show(['school']),
		description: 'A Trulia school link, or the school ID with its state',
	},
	{
		displayName: 'URL',
		name: 'truliaSchoolUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.trulia.com/schools/...',
		displayOptions: show(['school'], { truliaSchoolBy: ['url'] }),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description: 'A Trulia school link (the school URLs Get Neighborhood returns)',
	},
	{
		displayName: 'School ID',
		name: 'truliaSchoolId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '279445',
		displayOptions: show(['school'], { truliaSchoolBy: ['id'] }),
		routing: { request: { body: { school_id: '={{ String($value).trim() }}' } } },
		description: 'The number at the end of the school link (the school ID Get Suggestions returns)',
	},
	{
		displayName: 'State',
		name: 'truliaSchoolState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'IL',
		displayOptions: show(['school'], { truliaSchoolBy: ['id'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The school's two-letter state code",
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'truliaSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a city, neighborhood, ZIP code, address or school name (2 to 80 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'truliaNeighborhoodOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['neighborhood']),
		options: sorted([
			{
				displayName: 'Include Market Snapshot',
				name: 'truliaNeighborhoodMarket',
				type: 'boolean',
				default: true,
				description:
					"Whether to add Trulia's market snapshot and monthly median sale price history, read from a home for sale in the neighborhood (same 1 credit; off answers faster)",
				routing: { request: { body: { include_market_snapshot: '={{ $value === false ? false : undefined }}' } } },
			},
			languageOption('truliaNeighborhoodLanguage', "English or Trulia's US Spanish neighborhood page"),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'truliaSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Listing Status',
				name: 'truliaSearchStatus',
				type: 'options',
				default: 'for_sale',
				options: [
					{ name: 'For Rent', value: 'for_rent' },
					{ name: 'For Sale', value: 'for_sale' },
					{ name: 'Recently Sold', value: 'sold' },
				],
				description: 'Homes for sale (default), for rent or recently sold',
				routing: { request: { body: { listing_status: '={{ $value === "for_sale" ? undefined : $value }}' } } },
			},
			numberOption('Beds Min', 'truliaSearchBedsMin', 'beds_min', 1, 10, 'Fewest bedrooms (0: any)'),
			numberOption('Baths Min', 'truliaSearchBathsMin', 'baths_min', 1, 10, 'Fewest bathrooms (0: any)'),
			numberOption('Price Min', 'truliaSearchPriceMin', 'price_min', 1, 100000000, 'Lowest price, USD; monthly rent on For Rent (0: no minimum)'),
			numberOption('Price Max', 'truliaSearchPriceMax', 'price_max', 1, 100000000, 'Highest price, USD; monthly rent on For Rent (0: no maximum)'),
			numberOption('Square Feet Min', 'truliaSearchSqftMin', 'sqft_min', 1, 1000000, 'Smallest living area, square feet (0: no minimum)'),
			numberOption('Square Feet Max', 'truliaSearchSqftMax', 'sqft_max', 1, 1000000, 'Largest living area, square feet (0: no maximum)'),
			numberOption('Year Built Min', 'truliaSearchYearMin', 'year_built_min', 1700, thisYear + 2, 'Earliest year built, from 1700 (0: no minimum)'),
			numberOption('Year Built Max', 'truliaSearchYearMax', 'year_built_max', 1700, thisYear + 2, 'Latest year built, from 1700 (0: no maximum)'),
			{
				displayName: 'HOA Max',
				name: 'truliaSearchHoaMax',
				type: 'number',
				default: -1,
				typeOptions: { minValue: -1, maxValue: 100000 },
				description: 'Highest monthly HOA fee, USD (-1: no limit; 0: no HOA fee). For Sale and Recently Sold only.',
				routing: { request: { body: { hoa_max: '={{ $value >= 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Property Types',
				name: 'truliaSearchPropertyTypes',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Apartment', value: 'apartment' },
					{ name: 'Co-Op', value: 'coop' },
					{ name: 'Condo', value: 'condo' },
					{ name: 'Multi-Family', value: 'multi_family' },
					{ name: 'Single Family', value: 'single_family' },
					{ name: 'Townhouse', value: 'townhouse' },
				],
				description: 'Property types (empty: any)',
				routing: { request: { body: { property_types: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Keyword',
				name: 'truliaSearchKeyword',
				type: 'string',
				default: '',
				placeholder: 'pool',
				description: 'A listing keyword Trulia filters on (letters, digits and spaces, up to 40 characters)',
				routing: { request: { body: { keyword: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Pets',
				name: 'truliaSearchPets',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Cats', value: 'cats' },
					{ name: 'Large Dogs', value: 'large_dogs' },
					{ name: 'Small Dogs', value: 'small_dogs' },
				],
				description: 'Pets allowed (For Rent only; empty: any)',
				routing: { request: { body: { pets: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'truliaSearchSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Baths (Most First)', value: 'baths' },
					{ name: 'Beds (Most First)', value: 'beds' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Square Feet (Largest First)', value: 'sqft' },
					{ name: "Trulia's Order", value: 'default' },
				],
				description:
					"Result order. Trulia's order is newest on For Sale, its own ranking on For Rent and latest sale on Recently Sold.",
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'truliaSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Page, from 1 (40 homes a page, up to page 50); has_more says whether another exists',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			languageOption('truliaSearchLanguage', "English or Spanish: Trulia's US Spanish pages exist for For Rent searches only"),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'truliaPropertyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['property']),
		options: [languageOption('truliaPropertyLanguage', 'English or Spanish: Spanish is available on building pages only')],
	},
	{
		displayName: 'Additional Options',
		name: 'truliaSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: sorted([
			{
				displayName: 'Listing Status',
				name: 'truliaSuggestionsStatus',
				type: 'options',
				default: 'for_sale',
				options: [
					{ name: 'For Rent', value: 'for_rent' },
					{ name: 'For Sale', value: 'for_sale' },
				],
				description: "Trulia's suggestions for that kind of search",
				routing: { request: { body: { listing_status: '={{ $value === "for_sale" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Include Schools',
				name: 'truliaSuggestionsSchools',
				type: 'boolean',
				default: true,
				description: 'Whether to add matching schools and districts',
				routing: { request: { body: { include_schools: '={{ $value === false ? false : undefined }}' } } },
			},
		]),
	},
];
