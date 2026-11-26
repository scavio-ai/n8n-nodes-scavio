import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['affordablehousing'], operation, ...extra },
});

// AffordableHousing.com (affordablehousing.com, the US affordable and Section 8 rental site run by
// Affordable Housing Network), 6 operations. Search Listings and Get Suggestions 2 credits, the other
// operations 1; credits_used is the truth. US only, USD, English. Pages can take over a minute and
// calls can queue behind the backend's upstream limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST =
	'AffordableHousing.com (affordablehousing.com, the US affordable and Section 8 rental site run by Affordable Housing Network)';
const NAME = 'AffordableHousing.com';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const TWO = `${CHARGE} Costs 2 credits (credits_used says what was charged)`;
const NO_PII =
	'Private landlords are never named and their contact details are never returned; phone numbers and email addresses are cut out of listing text.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const flag = (displayName: string, name: string, key: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [key]: '={{ $value || undefined }}' } } },
});

export const affordablehousingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['affordablehousing'] } },
		options: [
			{
				name: 'Get Housing Authorities',
				value: 'housingAuthorities',
				action: 'Get affordablehousing com housing authorities',
				description: `The housing authorities of a state as ${NAME}'s state page lists them: the site's count for the state and the agencies shown (its first 14, in the site's order) with ID, name, address, waiting list status (Open or Closed), programs, jurisdiction and URL (what Get Housing Authority takes). Captured 2026-11-26: Texas had 346 housing authorities (14 shown), California 103, New York 164. ${ONE}.`,
				routing: request('/api/v1/affordablehousing/housing-authorities'),
			},
			{
				name: 'Get Housing Authority',
				value: 'housingAuthority',
				action: 'Get an affordablehousing com housing authority',
				description: `One housing authority (public housing agency) on ${NAME} by link, or by ID and state: address, the agency's public office phone, fax and website, HCV page, coordinates, participant code, waiting list status with its open and close dates, voucher count, Section 8 inventory, programs, jurisdiction (counties served) and the agency's waiting lists with their program and how applicants are selected. No staff contact details are returned; payment standards and fair market rents are given in text only on the site, so no numbers. Captured 2026-11-26: Somerville Housing Authority, Somerville, MA (ID 674) had its waiting list open, 1193 vouchers and 12 waiting lists. An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/affordablehousing/housing-authority'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get an affordablehousing com listing',
				description: `One ${NAME} listing in full by link or ID: status, date posted, address, coordinates, property type, rent range and rent text, beds, baths, size, Section 8 accepted, pets allowed, age restriction, description, models with their rent, deposit, availability, subsidized units and units, fees (move-in, move-out, estimated monthly and one-time totals, application fee, pet rent, pet deposit and fee), utilities (what the tenant pays and what the owner pays), amenities, accessibility, photos and listed_by (business owners such as property managers only). Captured 2026-11-26: listing 1091545 in Los Angeles, CA 90045 at 2300 to 3985 USD a month across 4 models and 12 units, Section 8 accepted, with a 60 USD application fee. An unknown ID is a charged not-found. ${NO_PII} ${ONE}.`,
				routing: request('/api/v1/affordablehousing/listing'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get affordablehousing com suggestions',
				description: `${NAME}'s place suggestions for the start of a city, county or ZIP code: label, type (city, county or ZIP), state, county, city, ZIP, population and the search inputs (state with city or county) Search Listings takes. A ZIP code suggestion carries no city or state: search a ZIP code with its city and state. Captured 2026-11-26: Houston gave 18 places, the first Houston County, TX. ${TWO}.`,
				routing: request('/api/v1/affordablehousing/suggestions'),
			},
			{
				name: 'Get Waiting Lists',
				value: 'waitingLists',
				action: 'Get affordablehousing com waiting lists',
				description: `Open Section 8 and public housing waiting lists on ${NAME}, nationwide or for one state: name, program, agency ID, agency name and agency URL (what Get Housing Authority takes), state, online application, status and the date it opened (as the site gives it, MM/DD/YYYY), plus the lists opening soon. Captured 2026-11-26: 753 open lists nationwide; 50 in Texas. ${ONE}.`,
				routing: request('/api/v1/affordablehousing/waiting-lists'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search affordablehousing com listings',
				description: `Search affordable and Section 8 rentals on ${FIRST} in a state, city, county or ZIP code (with its city), with beds, baths, property type, rent range, pet friendly, Section 8, utilities included, age restricted and accessibility filters, sorted 9 ways, 42 a page: total, pages, has_more and listings with ID (what Get Listing takes), title, address, coordinates, property type, rent range, beds, baths, size, year built, unit count, Section 8 accepted, income restricted, government listing, special offer, tier (premium, spotlight or standard), availability, URL and photo. Premium and spotlight listings are placed first by ${NAME}; the sort applies within each tier. Captured 2026-11-26: Section 8 listings in Houston, TX gave 1183 over 29 pages, the first a 1-bedroom apartment at 1000 USD a month. ${NO_PII} ${TWO}.`,
				routing: request('/api/v1/affordablehousing/search'),
			},
		],
		default: 'search',
	},
];

export const affordablehousingFields: INodeProperties[] = [
	// -- Search Listings --
	{
		displayName: 'State',
		name: 'affordablehousingSearchState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['search']),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: 'A US state: 2-letter code (TX, CA, DC) or its name',
	},
	{
		displayName: 'Search In',
		name: 'affordablehousingSearchIn',
		type: 'options',
		default: 'city',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'City and ZIP Code', value: 'zip' },
			{ name: 'County', value: 'county' },
			{ name: 'Whole State', value: 'state' },
		],
		displayOptions: show(['search']),
		description: 'Where in the state to search (a ZIP code is searched within its city)',
	},
	{
		displayName: 'City',
		name: 'affordablehousingSearchCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Houston',
		displayOptions: show(['search'], { affordablehousingSearchIn: ['city', 'zip'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A city in the state (the city Get Suggestions returns)',
	},
	{
		displayName: 'ZIP Code',
		name: 'affordablehousingSearchZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '77017',
		displayOptions: show(['search'], { affordablehousingSearchIn: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit ZIP code in the city',
	},
	{
		displayName: 'County',
		name: 'affordablehousingSearchCounty',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Harris',
		displayOptions: show(['search'], { affordablehousingSearchIn: ['county'] }),
		routing: { request: { body: { county: '={{ String($value).trim() }}' } } },
		description: 'A county in the state (the county Get Suggestions returns)',
	},

	// -- Get Listing --
	{
		displayName: 'Listing ID or URL',
		name: 'affordablehousingListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '766073',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A listing ID (digits) or the listing link Search Listings returns',
	},

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'affordablehousingSuggestionsText',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Houston',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { text: '={{ String($value).trim() }}' } } },
		description: 'The start of a city, county or ZIP code (2 to 80 characters)',
	},

	// -- Get Housing Authority --
	{
		displayName: 'Housing Authority ID or URL',
		name: 'affordablehousingAuthorityId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '674',
		displayOptions: show(['housingAuthority']),
		routing: {
			request: {
				body: {
					id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A housing authority ID (digits, with State) or its link (the agency URL from Get Waiting Lists or Get Housing Authorities)',
	},
	{
		displayName: 'State',
		name: 'affordablehousingAuthorityState',
		type: 'string',
		default: '',
		placeholder: 'MA',
		displayOptions: show(['housingAuthority']),
		routing: { request: { body: { state: '={{ String($value).trim() || undefined }}' } } },
		description: "With an ID: the agency's state (code or name). Leave empty with a link.",
	},

	// -- Get Housing Authorities --
	{
		displayName: 'State',
		name: 'affordablehousingAuthoritiesState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['housingAuthorities']),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: 'A US state: 2-letter code or its name',
	},

	// -- Get Waiting Lists --
	{
		displayName: 'State',
		name: 'affordablehousingWaitingListsState',
		type: 'string',
		default: '',
		placeholder: 'TX',
		displayOptions: show(['waitingLists']),
		routing: { request: { body: { state: '={{ String($value).trim() || undefined }}' } } },
		description: 'A US state (code or name); leave empty for every open list nationwide',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'affordablehousingSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Accessibility',
				name: 'affordablehousingSearchAccessibility',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Physical (Ramps, Grab Bars, Roll-In Showers)', value: 'physical' },
					{ name: 'Visual and Hearing (Visual Alarms and Doorbells)', value: 'visual_hearing' },
				],
				description: 'Accessibility features (empty: any)',
				routing: { request: { body: { accessibility: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			flag('Age Restricted', 'affordablehousingSearchAgeRestricted', 'age_restricted', 'Whether to return only age-restricted (senior) housing'),
			{
				displayName: 'Baths Min',
				name: 'affordablehousingSearchBathsMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'At least this many bathrooms, 1 to 5 (0: any)',
				routing: { request: { body: { baths_min: '={{ $value >= 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Beds',
				name: 'affordablehousingSearchBeds',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Bedroom', value: 1 },
					{ name: '2 Bedrooms', value: 2 },
					{ name: '3 Bedrooms', value: 3 },
					{ name: '4 Bedrooms', value: 4 },
					{ name: '5+ Bedrooms', value: 5 },
					{ name: 'Studio', value: 0 },
				],
				description: 'Bedrooms (empty: any)',
				routing: { request: { body: { beds: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'affordablehousingSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page of 42, from 1; pages says how many',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			flag('Pet Friendly', 'affordablehousingSearchPetFriendly', 'pet_friendly', 'Whether to return pet-friendly listings only'),
			{
				displayName: 'Price Max',
				name: 'affordablehousingSearchPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Highest monthly rent, USD (0: no limit)',
				routing: { request: { body: { price_max: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Price Min',
				name: 'affordablehousingSearchPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 100000 },
				description: 'Lowest monthly rent, USD (0: no minimum)',
				routing: { request: { body: { price_min: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Property Type',
				name: 'affordablehousingSearchPropertyType',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Apartment', value: 'apartment' },
					{ name: 'Condo', value: 'condo' },
					{ name: 'Single Family House', value: 'house' },
					{ name: 'Townhouse', value: 'townhouse' },
				],
				description: 'Property types (empty: any)',
				routing: { request: { body: { property_type: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			flag('Section 8', 'affordablehousingSearchSection8', 'section8', 'Whether to return only listings whose owner has experience with the Section 8 / Housing Choice Voucher program'),
			{
				displayName: 'Sort',
				name: 'affordablehousingSearchSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Affordability', value: 'affordability' },
					{ name: 'Beds: Fewest First', value: 'beds_asc' },
					{ name: 'Beds: Most First', value: 'beds_desc' },
					{ name: 'Default', value: 'default' },
					{ name: 'Newest (Last Updated)', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Size: Largest First', value: 'sqft_desc' },
					{ name: 'Size: Smallest First', value: 'sqft_asc' },
				],
				description: 'Premium and spotlight listings come first in every sort',
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			flag('Utilities Included', 'affordablehousingSearchUtilities', 'utilities_included', 'Whether to return listings with utilities included only'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'affordablehousingSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Limit',
				name: 'affordablehousingSuggestionsLimit',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 25 ? undefined : $value }}' } } },
			},
		],
	},
];
