import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['apartmentlist'], operation, ...extra },
});

// Apartment List (apartmentlist.com, the US rental search site), 6 operations, 1 credit each;
// credits_used is the truth. US only, USD (no country). A filtered or sorted search can take up to
// about 2 minutes, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Apartment List (apartmentlist.com, the US rental search site)';
const NAME = 'Apartment List';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_PII = 'No reviewer names are returned.';
const SUMMARY =
	"average rent by bed count (studio to 3 bedrooms, with the pricing date and trend) and a listings summary (average and median price and size, property and unit counts, the share of listings with each amenity and a price histogram)";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const AMENITIES = [
	'is_pet_friendly', 'is_dog_friendly', 'is_cat_friendly', 'has_pool', 'has_gym', 'has_in_unit_laundry', 'has_on_site_laundry', 'has_laundry_connections', 'has_garage', 'has_parking',
	'has_hardwood_floors', 'has_dishwasher', 'has_air_conditioning', 'has_balcony', 'is_accessible', 'has_bbq', 'has_bathtub', 'has_business_center', 'has_elevator', 'has_doorman',
	'has_walk_in_closet', 'has_stainless_steel', 'has_granite_counter', 'has_garbage_disposal', 'has_furnished_option', 'has_fireplace', 'has_hot_tub', 'has_ceiling_fan',
];
const amenityName = (v: string) => {
	const words = v.replace(/^(is|has)_/, '').split('_');
	const s = words.join(' ').replace(/\bbbq\b/, 'BBQ');
	return s.charAt(0).toUpperCase() + s.slice(1);
};
const AMENITY_OPTIONS = AMENITIES.map((v) => ({ name: amenityName(v), value: v })).sort((a, b) =>
	a.name.localeCompare(b.name),
);

const BEDS = [
	{ name: '1 Bedroom', value: 1 },
	{ name: '2 Bedrooms', value: 2 },
	{ name: '3+ Bedrooms', value: 3 },
	{ name: 'Studio', value: 0 },
];

const bedsOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Beds',
	name,
	type: 'multiOptions',
	default: [],
	options: BEDS,
	description,
	routing: { request: { body: { beds: '={{ $value && $value.length ? $value : undefined }}' } } },
});
const amenitiesOption = (name: string): INodeProperties => ({
	displayName: 'Amenities',
	name,
	type: 'multiOptions',
	default: [],
	options: AMENITY_OPTIONS,
	description: 'Amenity filters, all must match (up to 10; empty: any)',
	routing: { request: { body: { amenities: '={{ $value && $value.length ? $value : undefined }}' } } },
});

// The place inputs of Search Rentals and Get Market Summary: one of a place slug, city with state, or ZIP code.
const placeFields = (op: string, prefix: string): INodeProperties[] => [
	{
		displayName: 'Search By',
		name: `${prefix}By`,
		type: 'options',
		default: 'city',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'Location Slug', value: 'location' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show([op]),
		description: 'A city with its state, a place slug from Get Suggestions (city, neighborhood or ZIP code), or a ZIP code',
	},
	{
		displayName: 'City',
		name: `${prefix}City`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Chicago',
		displayOptions: show([op], { [`${prefix}By`]: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city name',
	},
	{
		displayName: 'State',
		name: `${prefix}State`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'IL',
		displayOptions: show([op], { [`${prefix}By`]: ['city'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'The 2-letter US state code',
	},
	{
		displayName: 'Location Slug',
		name: `${prefix}Location`,
		type: 'string',
		required: true,
		default: '',
		placeholder: '/tx/austin',
		displayOptions: show([op], { [`${prefix}By`]: ['location'] }),
		routing: { request: { body: { location: '={{ String($value).trim() }}' } } },
		description:
			'A place slug from Get Suggestions: a city (/tx/austin), a neighborhood (/tx/austin/neighborhoods/riverside) or a ZIP code (/tx/austin/zip-78704)',
	},
	{
		displayName: 'ZIP Code',
		name: `${prefix}Zip`,
		type: 'string',
		required: true,
		default: '',
		placeholder: '78704',
		displayOptions: show([op], { [`${prefix}By`]: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code; Apartment List reads it under its city (see notes)',
	},
];

// The city inputs of Get Rent Report and Get Review Summaries: a city slug, or city with state.
const cityFields = (op: string, prefix: string): INodeProperties[] => [
	{
		displayName: 'Search By',
		name: `${prefix}By`,
		type: 'options',
		default: 'city',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'City Slug', value: 'slug' },
		],
		displayOptions: show([op]),
		description: 'A city with its state, or the city slug from Get Suggestions',
	},
	{
		displayName: 'City',
		name: `${prefix}City`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show([op], { [`${prefix}By`]: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city name',
	},
	{
		displayName: 'State',
		name: `${prefix}State`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show([op], { [`${prefix}By`]: ['city'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: 'The 2-letter US state code',
	},
	{
		displayName: 'City Slug',
		name: `${prefix}Slug`,
		type: 'string',
		required: true,
		default: '',
		placeholder: '/tx/austin',
		displayOptions: show([op], { [`${prefix}By`]: ['slug'] }),
		routing: { request: { body: { city_slug: '={{ String($value).trim() }}' } } },
		description: 'The slug of a city in Get Suggestions (e.g. /tx/austin)',
	},
];

export const apartmentlistOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['apartmentlist'] } },
		options: [
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get an apartment list listing',
				description: `One ${NAME} listing in full by link or slug: rental type, address, neighborhood, coordinates, description, year built, total units, rent by bed count, floor plans with every unit's price, base price, total price and required fees, rent specials, fees (application fee, deposit, move-in and additional fees, utilities included), pet policies, parking, requirements (income, credit and criminal checks), lease terms, occupancy types, amenities, office hours, website, phone (apartment communities only), photos, the resident review summary and the reviews the listing page shows. Captured 2026-11-26: The Asher in Austin, TX 78717, built 2023, 377 units, 32 floor plans and 40 available units, from 1381 USD for 1 bedroom. A listing no longer on ${NAME} is a charged not-found. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/apartmentlist/listing'),
			},
			{
				name: 'Get Market Summary',
				value: 'marketSummary',
				action: 'Get an apartment list market summary',
				description: `Average rents and a listings summary on ${NAME} for a city, neighborhood or ZIP code (a ZIP code reads its city), optionally for some bed counts and amenities: ${SUMMARY}. Captured 2026-11-26: New York City filtered to 2 bedrooms had an average 2-bedroom rent of 7141 USD (pricing date 2026-11-20), 268 properties and 335 units, at a median of 6510 USD. ${ONE}.`,
				routing: request('/api/v1/apartmentlist/market-summary'),
			},
			{
				name: 'Get Rent Report',
				value: 'rentReport',
				action: 'Get an apartment list rent report',
				description: `${NAME}'s monthly rent report for a US city, as ${NAME} publishes it (its own rent estimates): median rent for 1 and 2 bedrooms, rent growth on the month and the year (as a fraction: -0.0133 is -1.33%), the 12-month trend for the city, its state and the nation, year-to-date growth, the metro table and the report's sections. Captured 2026-11-26: Chicago, IL had a median rent of 1723 USD for 1 bedroom and 1875 USD for 2, -1.12% on the month and +3.37% on the year. A city with no rent report is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/apartmentlist/rent-report'),
			},
			{
				name: 'Get Review Summaries',
				value: 'reviewSummaries',
				action: 'Get apartment list review summaries',
				description: `Resident-review summaries on ${NAME} for every listing with reviews in a city, most reviewed first: listing ID (the ID Search Rentals returns), rating, amenities and value ratings, rating count, best and worst rating and a review snippet with its rating and date. Captured 2026-11-26: Austin, TX gave 217 listings with review summaries. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/apartmentlist/review-summaries'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get apartment list suggestions',
				description: `${NAME}'s location suggestions for a city, neighborhood, ZIP code, county or state: slug (what Search Rentals and Get Market Summary take as Location Slug; a city's slug is also the City Slug of Get Rent Report and Get Review Summaries), type, name, display name, population, coordinates, bounds and parent places. Captured 2026-11-26: Austin gave 10 places, the first Austin, TX (slug /tx/austin). ${ONE}.`,
				routing: request('/api/v1/apartmentlist/suggestions'),
			},
			{
				name: 'Search Rentals',
				value: 'search',
				action: 'Search apartment list rentals',
				description: `Search rentals on ${FIRST} in a city, neighborhood or ZIP code, 20 a page: total listings and units, pages, has_more and listings with ID, name, slug, URL (what Get Listing takes), address, neighborhood, coordinates, rent range and rent by bed count, floor plans with their units and prices, units available, soonest available date, rent special flag, occupancy types, amenities, photos, highlights, rating, value rating and a review snippet, plus a location summary (${SUMMARY}). Without filters or sort the answer is fast and lists every listing in ${NAME}'s map order; filters and sort (city or ZIP code only) can take up to about 2 minutes. A ZIP code search returns its city's listings inside the ZIP code's bounding box. Captured 2026-11-26: Austin, TX gave 2197 listings and 20223 units over 110 pages; 1-bedroom rentals in Chicago up to 2000 USD by lowest price gave 442 listings, the first from 660 USD a month. A place ${NAME} does not have is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/apartmentlist/search'),
			},
		],
		default: 'search',
	},
];

export const apartmentlistFields: INodeProperties[] = [
	// -- Search Rentals --
	...placeFields('search', 'apartmentlistSearch'),

	// -- Get Listing --
	{
		displayName: 'Listing URL or Slug',
		name: 'apartmentlistListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/tx/austin/the-asher',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The listing link or slug Search Rentals returns',
	},

	// -- Get Rent Report --
	...cityFields('rentReport', 'apartmentlistRentReport'),

	// -- Get Market Summary --
	...placeFields('marketSummary', 'apartmentlistMarketSummary'),

	// -- Get Review Summaries --
	...cityFields('reviewSummaries', 'apartmentlistReviewSummaries'),

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'apartmentlistSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A city, neighborhood, ZIP code, county or state (2 to 80 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'apartmentlistSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			amenitiesOption('apartmentlistSearchAmenities'),
			{
				displayName: 'Baths',
				name: 'apartmentlistSearchBaths',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 3 },
				description: 'Bathrooms: 1, 2 or 3 (or more); 0: any',
				routing: { request: { body: { baths: '={{ $value >= 1 ? $value : undefined }}' } } },
			},
			bedsOption('apartmentlistSearchBeds', 'Bedrooms (empty: any)'),
			{
				displayName: 'Move-In Date',
				name: 'apartmentlistSearchMoveIn',
				type: 'string',
				default: '',
				placeholder: '2027-01-15',
				description: 'Move-in date, YYYY-MM-DD',
				routing: { request: { body: { move_in_date: '={{ String($value).trim().slice(0, 10) || undefined }}' } } },
			},
			{
				displayName: 'Occupancy Types',
				name: 'apartmentlistSearchOccupancy',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Affordable', value: 'affordable' },
					{ name: 'Co-Living', value: 'co-living' },
					{ name: 'Military', value: 'military' },
					{ name: 'Senior', value: 'senior' },
					{ name: 'Student', value: 'student' },
				],
				description: 'Occupancy types (empty: any)',
				routing: { request: { body: { occupancy_types: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'apartmentlistSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 250 },
				description: 'Page of 20, from 1; pages says how many',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Price Max',
				name: 'apartmentlistSearchPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Highest monthly rent, USD (0: no limit)',
				routing: { request: { body: { price_max: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Price Min',
				name: 'apartmentlistSearchPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Lowest monthly rent, USD (0: no minimum)',
				routing: { request: { body: { price_min: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'apartmentlistSearchSort',
				type: 'options',
				default: '',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Map Order (No Sort)', value: '' },
					{ name: 'Newest', value: 'freshness' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: "Apartment List's sorts; without sort or filters, listings come in Apartment List's map order",
				routing: { request: { body: { sort: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'apartmentlistMarketSummaryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['marketSummary']),
		options: sorted([
			amenitiesOption('apartmentlistMarketSummaryAmenities'),
			bedsOption('apartmentlistMarketSummaryBeds', 'Bedrooms to summarize (empty: all)'),
		]),
	},
];
