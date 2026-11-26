import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rentcom'], operation, ...extra },
});

// Rent.com (rent.com) and Apartment Guide (apartmentguide.com, the same rentals), the US rental
// listing sites run by Redfin, 6 operations, 1 credit each; credits_used is the truth. US only, USD
// (no country). Apartment Guide takes city and state (with one beds value) or a ZIP, and page; every
// other search filter is Rent.com only. Calls can queue behind the backend's upstream limit, so every
// operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST =
	'Rent.com (rent.com) and Apartment Guide (apartmentguide.com, the same rentals), the US rental listing sites run by Redfin';
const NAME = 'Rent.com';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_CONTACT =
	'No phone number, email or agent or landlord name is returned; the management company is given only for listings a property manager pays to list.';
const CARD =
	'listings with ID (what Get Listing takes; IDs of kind building are what Get Building takes), kind (listing or building), name, address, city, state, ZIP, coordinates, property type, price (lowest listed rent, USD a month), rent, bed, bath and square-foot ranges, rent by bed count, units available, availability, rent specials, price drops, pet friendly, highlighted amenities, image, URL, management company, verified and updated date';

const SQFT = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600];
const AMENITIES =
	'air-conditioning, assisted-living, att-fiber, available-now, cable-ready, college, controlled-limited-access, corporate-billing-available, disability-access, dishwasher, elevator, ev-charging, extra-storage, fitness-center, furnished, garage, gated-access, hardwood-floor, best, high-speed-internet-access, income-restricted, independent-living, laundry-facility, loft, military, new-construction, remodeled, no-credit-check, onsite-personnel, oversized-closets, patio, pool, new, senior-living, short-term-available, virtual-tours, utilities-included, view, washer-dryer-connections, washer-dryer-in-unit, waterfront';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const siteOption = (name: string): INodeProperties => ({
	displayName: 'Site',
	name,
	type: 'options',
	default: 'rent',
	options: [
		{ name: 'Apartment Guide', value: 'apartmentguide' },
		{ name: 'Rent.com', value: 'rent' },
	],
	description: 'Rent.com (default, 30 listings a page) or Apartment Guide (the same rentals, 50 a page)',
	routing: { request: { body: { site: '={{ $value === "rent" ? undefined : $value }}' } } },
});

const stateField = (name: string, operation: string, extra: Record<string, string[]> = {}): INodeProperties => ({
	displayName: 'State',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'TX',
	displayOptions: show([operation], extra),
	routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
	description: 'A US state: 2-letter code (TX) or name (Texas)',
});

const cityField = (name: string, operation: string, extra: Record<string, string[]> = {}): INodeProperties => ({
	displayName: 'City',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'Austin',
	displayOptions: show([operation], extra),
	routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
	description: 'A city name (Austin, New York) or its slug (new-york; Get Cities lists them)',
});

export const rentcomOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rentcom'] } },
		options: [
			{
				name: 'Get Building',
				value: 'building',
				action: 'Get a rentcom building',
				description: `One building on ${NAME} (the separate unit listings at one address) by building ID or link: address, neighborhoods, coordinates, rent, bed, bath and square-foot text, photos, count, ${CARD}, and schools. Captured 2026-11-26: building b147857, 8616 60th Ave, Elmhurst, NY, one 1-bed unit at 1188 USD a month. An unknown building is a charged not-found. ${NO_CONTACT} ${ONE}.`,
				routing: request('/api/v1/rentcom/building'),
			},
			{
				name: 'Get Cities',
				value: 'cities',
				action: 'Get rentcom cities',
				description: `The cities ${NAME} links from a state page, A to Z, with name, city (what Search Rentals and Get Rent Trends take) and URL. A smaller town can be missing and still have a search page. Captured 2026-11-26: Texas listed 600 cities. ${ONE}.`,
				routing: request('/api/v1/rentcom/cities'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a rentcom listing',
				description: `One rental on ${NAME} or Apartment Guide in full by ID or link: description, address, neighborhoods, property type, total and available units, rent, bed, bath and square-foot ranges, floor plans with their units (rent, square feet, available date, deposit, floor), fees, pet policies, parking, amenities, office hours, rent specials, price drops, lease terms, income restrictions, schools, nearby places, walk score, photos, management company, verified, updated date and similar listings. Fields the site leaves empty are null or empty. Captured 2026-11-26: Karnes House (lc5916981), 2222 Rio Grande St, Austin, 2-bed floor plans from 624 USD a month, walk score 95. An ID the site does not have (or a listing taken down) is a charged not-found. ${NO_CONTACT} ${ONE}.`,
				routing: request('/api/v1/rentcom/listing'),
			},
			{
				name: 'Get Rent Trends',
				value: 'rent-trends',
				action: 'Get rentcom rent trends',
				description: `${NAME}'s rent trends for one city: the current average rent per bed count (studio to 3 bedrooms, USD a month) with its year-on-year change, listing count, the monthly series as Rent.com publishes it on the page (series_range says which months it covers; it can end well before today), the rent distribution and nearby cities and neighborhoods with their averages. Captured 2026-11-26: Los Angeles, CA had 3275 listings, a studio average of 1375 USD a month, and a series from 2024-04 to 2025-05 (13 months). An unknown city is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rentcom/rent-trends'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get rentcom suggestions',
				description: `The search-box suggestions of ${NAME} or Apartment Guide for the start of a place or property name: places (name, type such as city, ZIP, neighborhood or school, ID, path, URL) and listings (ID, name, address, property type, URL). Captured 2026-11-26: Austin gave 20 suggestions, the first Austin, TX. ${ONE}.`,
				routing: request('/api/v1/rentcom/suggestions'),
			},
			{
				name: 'Search Rentals',
				value: 'search',
				action: 'Search rentcom rentals',
				description: `Search rentals on ${FIRST}: by city and state, ZIP or neighborhood; property type, beds, baths, monthly rent range, minimum square feet, pets, cheap or luxury, rent specials and up to 8 amenities; sorted 6 ways; 30 a page on Rent.com, 50 on Apartment Guide. Returns the query as read, location, total, available_units, page, pages, has_more, average_rent per bed count with its year-on-year change, and ${CARD}. Captured 2026-11-26: 2-bed apartments in Austin, TX by lowest price gave 1819 listings (20380 available units) over 61 pages, the first Karnes House from 624 USD a month. A page past the last one is an empty page with a note (charged); an unknown city, ZIP or neighborhood is a charged not-found. ${NO_CONTACT} ${ONE}.`,
				routing: request('/api/v1/rentcom/search'),
			},
		],
		default: 'search',
	},
];

export const rentcomFields: INodeProperties[] = [
	// -- Search Rentals --
	{
		displayName: 'Search By',
		name: 'rentcomSearchBy',
		type: 'options',
		default: 'city',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['search']),
		description: 'Search a city (optionally one neighborhood in it) or a ZIP code',
	},
	cityField('rentcomSearchCity', 'search', { rentcomSearchBy: ['city'] }),
	stateField('rentcomSearchState', 'search', { rentcomSearchBy: ['city'] }),
	{
		displayName: 'ZIP Code',
		name: 'rentcomSearchZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '78704',
		displayOptions: show(['search'], { rentcomSearchBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code',
	},

	// -- Get Listing --
	{
		displayName: 'Listing ID or URL',
		name: 'rentcomListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lc5898701',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			"A listing ID (the ID Search Rentals returns: lc5898701, 206824305, lv3119690811) or the listing's link on rent.com or apartmentguide.com. Apartment Guide's 5898701 and Rent.com's lc5898701 are the same listing.",
	},

	// -- Get Building --
	{
		displayName: 'Building ID or URL',
		name: 'rentcomBuildingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'b147857',
		displayOptions: show(['building']),
		routing: {
			request: {
				body: {
					building_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			"A building ID (a Search Rentals listing ID of kind building, e.g. b147857) or the building's rent.com link",
	},

	// -- Get Rent Trends --
	cityField('rentcomTrendsCity', 'rent-trends'),
	stateField('rentcomTrendsState', 'rent-trends'),

	// -- Get Cities --
	stateField('rentcomCitiesState', 'cities'),

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'rentcomSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a city, ZIP, neighborhood, school or property name (2 to 80 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'rentcomSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			siteOption('rentcomSearchSite'),
			{
				displayName: 'Neighborhood',
				name: 'rentcomSearchNeighborhood',
				type: 'string',
				default: '',
				placeholder: 'Downtown Manhattan',
				description: 'With City and State (Rent.com): a neighborhood by name or slug',
				routing: { request: { body: { neighborhood: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Property Type',
				name: 'rentcomSearchPropertyType',
				type: 'options',
				default: 'apartments',
				options: [
					{ name: 'Apartments', value: 'apartments' },
					{ name: 'Condos', value: 'condos' },
					{ name: 'Houses', value: 'houses' },
					{ name: 'Rooms for Rent', value: 'rooms' },
					{ name: 'Townhouses', value: 'townhouses' },
				],
				description: 'The kind of rental (Rent.com)',
				routing: { request: { body: { property_type: '={{ $value === "apartments" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Beds',
				name: 'rentcomSearchBeds',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Bed', value: 1 },
					{ name: '2 Beds', value: 2 },
					{ name: '3 Beds', value: 3 },
					{ name: '4+ Beds', value: 4 },
					{ name: 'Studio', value: 'studio' },
				],
				description:
					'Listings with at least one matching floor plan (empty: any). Apartment Guide takes one value, with City and State only.',
				routing: { request: { body: { beds: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Baths',
				name: 'rentcomSearchBaths',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					{ name: '1+', value: 1 },
					{ name: '2+', value: 2 },
					{ name: '3+', value: 3 },
					{ name: '4+', value: 4 },
				],
				description: 'Bathrooms (Rent.com)',
				routing: { request: { body: { baths: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Min',
				name: 'rentcomSearchPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Lowest monthly rent, USD (0: no minimum; Rent.com)',
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Max',
				name: 'rentcomSearchPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Highest monthly rent, USD (0: no maximum; Rent.com)',
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Square Feet Min',
				name: 'rentcomSearchSqftMin',
				type: 'options',
				default: 0,
				options: [{ name: 'Any', value: 0 }, ...SQFT.map((s) => ({ name: `${s}+ Sqft`, value: s }))],
				description: 'Smallest square feet (Rent.com)',
				routing: { request: { body: { sqft_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Pets',
				name: 'rentcomSearchPets',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Cat Friendly', value: 'cats' },
					{ name: 'Dog Friendly', value: 'dogs' },
					{ name: 'No Pets', value: 'no_pets' },
					{ name: 'Pet Friendly', value: 'pet_friendly' },
				],
				description: 'Pet policy filter (Rent.com)',
				routing: { request: { body: { pets: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Cheap',
				name: 'rentcomSearchCheap',
				type: 'boolean',
				default: false,
				description: "Whether to apply the site's cheap apartments filter (not with Luxury; Rent.com)",
				routing: { request: { body: { cheap: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Luxury',
				name: 'rentcomSearchLuxury',
				type: 'boolean',
				default: false,
				description: "Whether to apply the site's luxury filter (not with Cheap; Rent.com)",
				routing: { request: { body: { luxury: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Rent Specials Only',
				name: 'rentcomSearchDeals',
				type: 'boolean',
				default: false,
				description: 'Whether to return only listings with rent specials (Rent.com)',
				routing: { request: { body: { deals: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Amenities',
				name: 'rentcomSearchAmenities',
				type: 'string',
				default: '',
				placeholder: 'pool, washer-dryer-in-unit',
				description: `Up to 8 amenities, comma-separated (Rent.com): ${AMENITIES}`,
				routing: {
					request: {
						body: {
							amenities:
								'={{ String($value).trim() ? String($value).split(",").map((s) => s.trim()).filter((s) => s) : undefined }}',
						},
					},
				},
			},
			{
				displayName: 'Sort',
				name: 'rentcomSearchSort',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Beds (Fewest First)', value: 'beds' },
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Latest Update', value: 'latest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Square Feet (Smallest First)', value: 'sqft' },
				],
				description: 'Result order (Rent.com)',
				routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'rentcomSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, from 1; pages and has_more say how deep the results go',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rentcomListingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['listing']),
		options: [siteOption('rentcomListingSite')],
	},
	{
		displayName: 'Additional Options',
		name: 'rentcomSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [siteOption('rentcomSuggestionsSite')],
	},
];
