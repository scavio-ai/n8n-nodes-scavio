import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['compass'], operation, ...extra },
});

// Compass (compass.com, the US real estate brokerage), 3 operations, 2 credits each; credits_used
// is the truth. US only, USD, English. Compass does not apply a minimum price, a maximum bedroom
// count, year built or lot size (the backend refuses them), so they are not offered. Calls can queue
// behind the backend's upstream limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Compass (compass.com, the US real estate brokerage)';
const NAME = 'Compass';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const TWO = `${CHARGE} Costs 2 credits (credits_used says what was charged)`;
const NO_PII =
	"No agent names, emails, phones, license numbers or photos are returned; the listing brand (Compass, Corcoran, Coldwell Banker, Sotheby's International Realty) is.";

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
	routing: { request: { body: { [key]: '={{ $value >= 1 ? $value : undefined }}' } } },
});

export const compassOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['compass'] } },
		options: [
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a compass listing',
				description: `One ${NAME} listing in full (for sale, coming soon, sold or for rent) by link or ID: MLS number, listing type, status, address, coordinates, beds, baths, rooms, size, lot, stories, property types, description (phone numbers and emails taken out), pricing (price, listed and last asking price, sold price, price per square foot, monthly charges, financing), dates, days on market, history (listed, price changes, contract signed, sold, public-record sales), key and regional details, detail sections, amenities, schools, school districts, building, rental terms (lease term, broker fee), tax and assessment, parcel number, photos, brand, source MLS and the disclaimers Compass shows with the listing. Captured 2026-11-26: 77 Bleecker Street, Unit 121, Manhattan, NY 10012, a 2-bed, 2-bath home for sale at 1875000 USD, 24 days on market. ${NO_PII} An unknown listing is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/compass/listing'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get compass suggestions',
				description: `The ${NAME} search box suggestions for a place, ZIP code, school or address: areas with name, region, slug (the Area that Search Listings takes), kind (city, ZIP, neighborhood, school, school district or area) and location ID, and listings with their ID (what Get Listing takes). Agent suggestions are left out. Captured 2026-11-26: "Austin, TX" gave 10 suggestions, the first the city of Austin, TX (slug austin-tx). ${TWO}.`,
				routing: request('/api/v1/compass/suggestions'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search compass listings',
				description: `Search homes for sale, rentals or homes sold in the last 90 days in a US area on ${FIRST}, with highest price, fewest bedrooms, bathrooms and square feet, property type, open house this weekend and coming soon, 3 sorts, 41 a page up to 9 pages. Returns total (Compass's count), reachable (at most 369: Compass pages through the first 369 results), pages, has_more, criteria (the filters as Compass applied them), nearby areas and listings with ID (what Get Listing takes), URL, address, neighborhood, coordinates, price (USD; rent per month on For Rent), beds, baths, size, lot size, property types, status, sold date, brand, badges, open houses and photo. Captured 2026-11-26: homes for sale in manhattan-ny up to 2000000 USD with 2 or more bedrooms gave 1219 (369 reachable); single-family homes sold in austin-tx in the last 90 days 1857. ${NO_PII} An unknown area is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/compass/search'),
			},
		],
		default: 'search',
	},
];

export const compassFields: INodeProperties[] = [
	// -- Search Listings --
	{
		displayName: 'Area',
		name: 'compassSearchArea',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'austin-tx',
		displayOptions: show(['search']),
		routing: { request: { body: { area: '={{ String($value).trim() }}' } } },
		description: 'A Compass area slug from Get Suggestions: a city (austin-tx, manhattan-ny), a city and ZIP (los-angeles-ca-90012), a neighborhood, a county or a school. A place written as "Austin, TX" reads as its slug.',
	},
	{
		displayName: 'Mode',
		name: 'compassSearchMode',
		type: 'options',
		default: 'for_sale',
		options: [
			{ name: 'For Rent', value: 'for_rent' },
			{ name: 'For Sale', value: 'for_sale' },
			{ name: 'Sold (Last 90 Days)', value: 'sold' },
		],
		displayOptions: show(['search']),
		description: 'Homes for sale, rentals, or homes sold in the last 90 days',
		routing: { request: { body: { mode: '={{ $value === "for_sale" ? undefined : $value }}' } } },
	},

	// -- Get Listing --
	{
		displayName: 'Listing URL or ID',
		name: 'compassListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.compass.com/homedetails/<address>/<ID>_pid/',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					url: '={{ /^\\d{6,25}$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
					id: '={{ /^\\d{6,25}$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A Compass listing link (Search Listings URL, or a listing link from Get Suggestions) or a Compass listing ID (digits, from Search Listings)',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'compassSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin, TX',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
		description: 'A city, neighborhood, ZIP code, school or address (2 to 80 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'compassSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			numberOption('Baths Min', 'compassSearchBathsMin', 'baths_min', 10, 'Fewest bathrooms, 1 to 10 (0: no minimum)'),
			numberOption('Beds Min', 'compassSearchBedsMin', 'beds_min', 10, 'Fewest bedrooms, 1 to 10 (0: no minimum)'),
			{
				displayName: 'Coming Soon Only',
				name: 'compassSearchComingSoon',
				type: 'boolean',
				default: false,
				description: 'Whether to return Coming Soon listings only (For Sale; not with Open House Only)',
				routing: { request: { body: { coming_soon: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Open House Only',
				name: 'compassSearchOpenHouse',
				type: 'boolean',
				default: false,
				description: 'Whether to return homes with an open house this weekend only (For Sale; not with Coming Soon Only)',
				routing: { request: { body: { open_house: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'compassSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 9 },
				description: 'Page, from 1 (41 listings a page; Compass pages through the first 369 results, 9 pages)',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			numberOption('Price Max', 'compassSearchPriceMax', 'price_max', 1000000000, 'Highest price, USD (monthly rent on For Rent; 0: no maximum)'),
			{
				displayName: 'Property Type',
				name: 'compassSearchPropertyType',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Co-Ops', value: 'co_ops' },
					{ name: 'Condos', value: 'condos' },
					{ name: 'Homes (Single Family)', value: 'homes' },
					{ name: 'Land', value: 'land' },
					{ name: 'Multi-Family', value: 'multi_family' },
					{ name: 'Townhomes', value: 'townhomes' },
				],
				description: 'One property type',
				routing: { request: { body: { property_type: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'compassSearchSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Default', value: 'default' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: "Compass's sort options (Default is Compass's own order)",
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			numberOption('Square Feet Min', 'compassSearchSqftMin', 'sqft_min', 100000, 'Smallest size in square feet (0: no minimum)'),
		]),
	},
];
