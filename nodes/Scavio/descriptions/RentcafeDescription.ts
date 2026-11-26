import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rentcafe'], operation, ...extra },
});

// RentCafe (rentcafe.com, Yardi's US and Canada rental listing site): US (USD) and Canada (CAD), English or French.
// 6 operations, 1 credit each; credits_used is the truth. RentCafe filters ONE of beds, rent specials, short-term,
// furnished, utilities included or an amenity per search (price, pet-friendly and sort combine with any); a second
// one is refused with a 400 (not charged). Rent Trends is US only. Calls can queue behind the backend's upstream
// limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = "RentCafe (rentcafe.com, Yardi's US and Canada rental listing site)";
const NAME = 'RentCafe';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const LISTING =
	'listings with ID (the Property ID of Get Reviews and Get Floor Plan Units), name, URL (what Get Property takes), address, city, state, ZIP, coordinates, beds, baths, rent_min and rent_max, currency, rent by bedroom count, rating, review count, pets allowed, rent specials, units available, tags, badges, the management company and image';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const AMENITIES = [
	'washer-dryer',
	'pool',
	'garage',
	'fitness-center',
	'balcony',
	'air-conditioning',
	'dishwasher',
	'fireplace',
	'hardwood-floors',
	'walk-in-closets',
	'wheelchair-accessible',
	'controlled-access',
	'playground',
	'public-transportation',
	'recent-build',
	'tennis-court',
	'yard',
	'cheap',
	'luxury',
];

const titleCase = (s: string) =>
	s
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');

const MARKETS = [
	{ name: 'Canada (CAD)', value: 'ca' },
	{ name: 'United States (USD)', value: 'us' },
];

const languageOption = (name: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French', value: 'fr' },
	],
	description:
		"RentCafe's French pages (French labels over the same listings); prices stay in the market's currency",
	routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
});

const propertyIdField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Property ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '1651075',
	displayOptions: show([operation]),
	routing: { request: { body: { property_id: '={{ String($value).trim() }}' } } },
	description: 'A RentCafe property ID (the ID Search Rentals or Get Suggestions returns, digits)',
});

const listingUrlOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Listing URL',
	name,
	type: 'string',
	default: '',
	placeholder: 'https://www.rentcafe.com/apartments/tx/austin/bridge-at-indigo/default.aspx',
	description,
	routing: { request: { body: { url: '={{ String($value).trim() || undefined }}' } } },
});

export const rentcafeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rentcafe'] } },
		options: [
			{
				name: 'Get Floor Plan Units',
				value: 'floorplan-units',
				action: 'Get rentcafe floor plan units',
				description: `Every unit of one floor plan of a ${NAME} listing (the property page shows up to 2): name, beds, baths, size, rent and rent text, currency, price drop, the selected unit's base rent and availability (with a Unit ID), and units with ID, name, availability (RentCafe's move-in text: Now or a date), beds, baths, size, rent and specials, plus amenities, photos and specials. Rents are base rents as RentCafe shows them. Captured 2026-11-26: a 2 bedroom plus den floor plan at 390 Queens Quay West, Toronto, had 6 units from 2937 CAD, available now. An unknown floor plan is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rentcafe/floorplan-units'),
			},
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get a rentcafe property',
				description: `One ${NAME} listing in full by link or slug: address, coordinates, rent range, beds, baths, rating, review count, badges (including RentCafe's Great deal badge; its basis is not stated), price drop, rent special, units available, images, floor plans with their units and rents, policies (deposit, application fees, pet fees and pet policy as RentCafe lists them), apartment and community amenities, services, building details, category ratings, RentCafe's own What renters are saying summary, reviews (rating, date, text; no reviewer names), office hours, the leasing office phone, the management company and description. Captured 2026-11-26: Bridge At Indigo in Austin, TX, rents 1130 to 2880 USD across 9 floor plans, rated 4 from 39 reviews. A link RentCafe does not have is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rentcafe/property'),
			},
			{
				name: 'Get Rent Trends',
				value: 'rent-trends',
				action: 'Get rentcafe rent trends',
				description: `${NAME}'s rent trends for a US city, as it publishes them: last updated date, the source line as RentCafe states it, average rent now and a year earlier, year-over-year change, highlights, average rent and size by bedroom type, budget shares, renter and owner households, the most affordable and most expensive neighborhoods (with the location Search Rentals takes), rent by neighborhood and compared cities. Captured 2026-11-26 (last updated October 30, 2026): Austin, TX averaged 1643 USD, down 1.26% from 1664 a year earlier. US only (RentCafe has no Canada rent trends pages). A city with no rent trends page is a not-found, not charged. Costs 1 credit (credits_used says what was charged).`,
				routing: request('/api/v1/rentcafe/rent-trends'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get rentcafe reviews',
				description: `Resident reviews of one ${NAME} listing, 10 a page in RentCafe's order: total, pages, has_more, rating, rating label, category ratings, RentCafe's own renters summary (page 1) and reviews with rating, resident type (e.g. Verified Resident), date and text. RentCafe offers no review sort or star filter. No reviewer name is returned. Captured 2026-11-26: Bridge At Indigo in Austin had 39 reviews over 4 pages. An unknown property ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rentcafe/reviews'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get rentcafe suggestions',
				description: `${NAME}'s location and property suggestions for a city, neighborhood, ZIP code or property name: places (name, label, SEO URL and the location Search Rentals takes) and properties (ID, name, address, city, state, ZIP, location). Captured 2026-11-26: Toronto on Canada gave 5 places (toronto-on first) and 3 properties. ${ONE}.`,
				routing: request('/api/v1/rentcafe/suggestions'),
			},
			{
				name: 'Search Rentals',
				value: 'search',
				action: 'Search rentcafe rentals',
				description: `Search rentals on ${FIRST}: apartments, houses, condos or townhomes in a city, ZIP code, neighborhood or state (US and Canada), with ONE of beds, rent specials, short-term, furnished, utilities included or an amenity per search, plus a price range and pet-friendly, sorted 5 ways, 25 a page; English or French. Returns title, total (RentCafe's count), pages, has_more and ${LISTING}. Rents are in the market's currency (USD or CAD); a rent RentCafe does not state is null. RentCafe pages through about 15 to 20 pages at most. Captured 2026-11-26: 2-bedroom apartments in austin-tx gave 4228 listings; toronto-on 8559 in CAD. A location RentCafe does not have is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rentcafe/search'),
			},
		],
		default: 'search',
	},
];

export const rentcafeFields: INodeProperties[] = [
	// -- Search Rentals --
	{
		displayName: 'Search By',
		name: 'rentcafeSearchBy',
		type: 'options',
		default: 'location',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'Location', value: 'location' },
			{ name: 'ZIP Code and State', value: 'zip' },
		],
		displayOptions: show(['search']),
		description:
			'A RentCafe location, a city with its state or province, or a US ZIP code with its state',
	},
	{
		displayName: 'Location',
		name: 'rentcafeSearchLocation',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'austin-tx',
		displayOptions: show(['search'], { rentcafeSearchBy: ['location'] }),
		routing: { request: { body: { location: '={{ String($value).trim() }}' } } },
		description:
			'A RentCafe location as its search links write it (austin-tx, 78704-tx, downtown-toronto-toronto-on, a state such as tx), or the SEO URL Get Suggestions returns (us/tx/austin)',
	},
	{
		displayName: 'City',
		name: 'rentcafeSearchCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Chicago',
		displayOptions: show(['search'], { rentcafeSearchBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A city name',
	},
	{
		displayName: 'ZIP Code',
		name: 'rentcafeSearchZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '78704',
		displayOptions: show(['search'], { rentcafeSearchBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code (US only; for Canada search by city and province)',
	},
	{
		displayName: 'State or Province',
		name: 'rentcafeSearchState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['search'], { rentcafeSearchBy: ['city', 'zip'] }),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: 'The 2-letter US state or Canadian province code (TX, ON, QC)',
	},

	// -- Get Property --
	{
		displayName: 'Listing URL or Slug',
		name: 'rentcafePropertyRef',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'tx/austin/bridge-at-indigo',
		displayOptions: show(['property']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description:
			'The listing link (the URL Search Rentals returns, ending in default.aspx) or state/city/name as in that link (e.g. tx/austin/bridge-at-indigo) (housing/... or single-family/... for those links)',
	},

	// -- Get Floor Plan Units --
	propertyIdField('rentcafeUnitsPropertyId', 'floorplan-units'),
	{
		displayName: 'Floor Plan ID',
		name: 'rentcafeUnitsFloorplanId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4746456',
		displayOptions: show(['floorplan-units']),
		routing: { request: { body: { floorplan_id: '={{ String($value).trim() }}' } } },
		description: 'A floor plan ID (a floor plan ID Get Property returns, digits)',
	},

	// -- Get Reviews --
	propertyIdField('rentcafeReviewsPropertyId', 'reviews'),

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'rentcafeSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A city, neighborhood, ZIP code or property name (2 to 80 characters)',
	},

	// -- Get Rent Trends --
	{
		displayName: 'City',
		name: 'rentcafeTrendsCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin',
		displayOptions: show(['rent-trends']),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city',
	},
	{
		displayName: 'State',
		name: 'rentcafeTrendsState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['rent-trends']),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: 'Its 2-letter US state code',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'rentcafeSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Filter',
				name: 'rentcafeSearchFilter',
				type: 'options',
				default: 'none',
				options: [
					{ name: 'None', value: 'none' },
					{ name: 'Beds: 1', value: 'beds:1' },
					{ name: 'Beds: 2', value: 'beds:2' },
					{ name: 'Beds: 3', value: 'beds:3' },
					{ name: 'Beds: 4', value: 'beds:4' },
					{ name: 'Beds: Studio', value: 'beds:studio' },
					{ name: 'Furnished', value: 'flag:furnished' },
					{ name: 'Rent Specials', value: 'flag:rent_specials' },
					{ name: 'Short-Term Lease', value: 'flag:short_term' },
					{ name: 'Utilities Included', value: 'flag:utilities_included' },
					...AMENITIES.map((a) => ({ name: `Amenity: ${titleCase(a)}`, value: `amenity:${a}` })),
				],
				description:
					'RentCafe takes ONE of beds, rent specials, short-term, furnished, utilities included or an amenity per search (price, pet-friendly and sort combine with any)',
				routing: {
					request: {
						body: {
							beds: '={{ String($value).startsWith("beds:") ? String($value).slice(5) : undefined }}',
							amenity:
								'={{ String($value).startsWith("amenity:") ? String($value).slice(8) : undefined }}',
							rent_specials: '={{ $value === "flag:rent_specials" ? true : undefined }}',
							short_term: '={{ $value === "flag:short_term" ? true : undefined }}',
							furnished: '={{ $value === "flag:furnished" ? true : undefined }}',
							utilities_included: '={{ $value === "flag:utilities_included" ? true : undefined }}',
						},
					},
				},
			},
			languageOption('rentcafeSearchLanguage'),
			{
				displayName: 'Market',
				name: 'rentcafeSearchMarket',
				type: 'options',
				default: '',
				options: [{ name: 'From the Location', value: '' }, ...MARKETS],
				description:
					"Read from the location's state or province when left as is (a mismatch is refused)",
				routing: { request: { body: { market: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'rentcafeSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description:
					'Page of 25, from 1; pages says how many (RentCafe pages through about 15 to 20 at most)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Pet Friendly',
				name: 'rentcafeSearchPets',
				type: 'boolean',
				default: false,
				description: 'Whether to return only pet-friendly listings (combines with any filter)',
				routing: { request: { body: { pet_friendly: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Max',
				name: 'rentcafeSearchPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: "Highest monthly rent, in the market's currency (0: no maximum)",
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Min',
				name: 'rentcafeSearchPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: "Lowest monthly rent, in the market's currency (0: no minimum)",
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Property Type',
				name: 'rentcafeSearchPropertyType',
				type: 'options',
				default: 'apartments',
				options: [
					{ name: 'Apartments', value: 'apartments' },
					{ name: 'Condos', value: 'condos' },
					{ name: 'Houses', value: 'houses' },
					{ name: 'Townhomes', value: 'townhomes' },
				],
				description: 'The kind of rental',
				routing: {
					request: {
						body: { property_type: '={{ $value === "apartments" ? undefined : $value }}' },
					},
				},
			},
			{
				displayName: 'Sort',
				name: 'rentcafeSearchSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Best Match', value: 'default' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Rating: High to Low', value: 'rating_desc' },
					{ name: 'Rent: High to Low', value: 'rent_desc' },
					{ name: 'Rent: Low to High', value: 'rent' },
				],
				description:
					'Result order (Rent: Low to High puts listings without a stated rent first; Newest puts listings with new units at the top)',
				routing: {
					request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } },
				},
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rentcafePropertyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['property']),
		options: [languageOption('rentcafePropertyLanguage')],
	},
	{
		displayName: 'Additional Options',
		name: 'rentcafeUnitsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['floorplan-units']),
		options: sorted([
			listingUrlOption(
				'rentcafeUnitsUrl',
				'The listing link (the URL Search Rentals returns): sets the market (currency) from the listing',
			),
			{
				displayName: 'Market',
				name: 'rentcafeUnitsMarket',
				type: 'options',
				default: 'us',
				options: MARKETS,
				description: 'The currency of the rents (read from Listing URL when sent)',
				routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Unit ID',
				name: 'rentcafeUnitsUnitId',
				type: 'string',
				default: '',
				placeholder: '34997017',
				description:
					"A unit ID (a floor plan's unit ID Get Property returns): selected_unit gives its base rent and availability",
				routing: { request: { body: { unit_id: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rentcafeReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			listingUrlOption(
				'rentcafeReviewsUrl',
				'The listing link (the URL Search Rentals returns), optional',
			),
			{
				displayName: 'Page',
				name: 'rentcafeReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page of 10 reviews, from 1; pages says how many',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rentcafeSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Market',
				name: 'rentcafeSuggestionsMarket',
				type: 'options',
				default: 'us',
				options: MARKETS,
				description: 'United States (default) or Canada',
				routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
			},
		],
	},
];
