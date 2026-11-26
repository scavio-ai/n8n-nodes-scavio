import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['hotpads'], operation, ...extra },
});

// HotPads (hotpads.com, Zillow Group's rental search site), 5 operations, 1 credit each;
// credits_used is the truth. US only (incl. DC and Puerto Rico), USD; HotPads Canada is refused.
// Calls can queue behind the backend's upstream limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = "HotPads (hotpads.com, Zillow Group's rental search site)";
const NAME = 'HotPads';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_PII =
	'Landlord and agent names, phones and emails are not returned; the company name is given for property-managed listings.';

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

const bedOptions = (any: string) => [
	{ name: any, value: '' },
	{ name: 'Studio', value: '0' },
	{ name: '1', value: '1' },
	{ name: '2', value: '2' },
	{ name: '3', value: '3' },
	{ name: '4', value: '4' },
	{ name: '5', value: '5' },
	{ name: '6', value: '6' },
	{ name: '7', value: '7' },
	{ name: '8', value: '8' },
];

const alias = (name: string, operation: string, description: string): INodeProperties => ({
	displayName: 'Listing Alias',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '5759ydyqtn49h',
	displayOptions: show([operation]),
	routing: { request: { body: { listing_alias: '={{ String($value).trim() }}' } } },
	description,
});

export const hotpadsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['hotpads'] } },
		options: [
			{
				name: 'Get Costs and Fees',
				value: 'fees',
				action: 'Get hotpads costs and fees',
				description: `The costs and fees the property manager lists for one ${NAME} listing: move-in total, monthly total, base rent, required and optional move-in and monthly fees with amounts and notes, usage fees (late fees and others charged when they apply), unit count and disclaimer. Captured 2026-11-26: listing alias 24ga0pwypzg8y had a base rent of 2680 to 5160 USD and a monthly total of 2686.25 to 5166.25 USD. An unknown alias is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/hotpads/fees'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a hotpads listing',
				description: `One ${NAME} listing in full by link or ID (a single home, a unit, or a building with its floor plans): alias (what Get Costs and Fees takes), title, property type, address, coordinates, rent range, beds, baths and size ranges, unit counts, price drops, description, lease terms, office hours, special offers, amenities, pet policies with deposits and fees, floor plans with their units, rents and availability dates, total monthly price, history, popularity (views, inquiries, favorites), HotPads' comparison with neighborhood, ZIP, city and county averages, schools, similar listings, photos and price_history (listing_alias and model_id, what Get Price History takes; null when HotPads publishes none). Captured 2026-11-26: Lincoln at Bankside, Bronx, NY, 350 units across 54 floor plans at 2687 to 5667 USD a month. ${NO_PII} A listing HotPads does not have is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/hotpads/listing'),
			},
			{
				name: 'Get Price History',
				value: 'priceHistory',
				action: 'Get hotpads price history',
				description: `The rent history ${NAME} publishes for one listing: events with date, type (listed for rent, price changed, listing removed), price, price per square foot, change percent and source. Send the listing alias and model ID from Get Listing price_history. Captured 2026-11-26: listing alias 5759ydyqtn49h had 22 events, the latest a price change on 2026-11-25 to 2450 USD (down 18.3%). A wrong alias or model ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/hotpads/price-history'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get hotpads suggestions',
				description: `${NAME}'s location suggestions for a text: areas with type (city, neighborhood, borough, county, ZIP, school), label and resource_id (the Area that Search Rentals takes), and listings with their ID (what Get Listing takes). US only. Captured 2026-11-26: brooklyn gave 5 suggestions, the first Brooklyn, New York, NY (brooklyn-new-york-ny). ${ONE}.`,
				routing: request('/api/v1/hotpads/suggestions'),
			},
			{
				name: 'Search Rentals',
				value: 'search',
				action: 'Search hotpads rentals',
				description: `Search rentals on ${FIRST}: apartments, houses, condos, townhomes, rooms, sublets or for-rent-by-owner listings in a US city, neighborhood, borough or ZIP code, filtered by beds, baths, rent, square feet, dogs or cats, in-unit laundry, parking or furnished and keywords, sorted 4 ways, 40 buildings a page. Returns applied filters, total units, total buildings, lowest rent, pages, has_more and buildings with their ID (what Get Listing takes) and listings (alias, URL, title, address, beds, baths and size ranges, rent range, unit counts, price drops, special offer, tags, photos). Rents are USD a month. Captured 2026-11-26: for-rent-by-owner listings in dallas-tx gave 775 units in 600 buildings over 15 pages, from 750 USD a month. ${NO_PII} An area HotPads does not have is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/hotpads/search'),
			},
		],
		default: 'search',
	},
];

export const hotpadsFields: INodeProperties[] = [
	// -- Search Rentals --
	{
		displayName: 'Area',
		name: 'hotpadsSearchArea',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'brooklyn-new-york-ny',
		displayOptions: show(['search']),
		routing: { request: { body: { area: '={{ String($value).trim() }}' } } },
		description: 'A HotPads area: a resource_id from Get Suggestions (brooklyn-new-york-ny, austin-tx, 90012), or a place such as Austin, TX. US only.',
	},
	{
		displayName: 'Type',
		name: 'hotpadsSearchType',
		type: 'options',
		default: 'apartments',
		options: [
			{ name: 'Apartments', value: 'apartments' },
			{ name: 'Condos', value: 'condos' },
			{ name: 'For Rent by Owner', value: 'by_owner' },
			{ name: 'Houses', value: 'houses' },
			{ name: 'Rooms for Rent', value: 'rooms' },
			{ name: 'Sublets', value: 'sublets' },
			{ name: 'Townhomes', value: 'townhomes' },
		],
		displayOptions: show(['search']),
		description: 'The kind of rental to search',
		routing: { request: { body: { type: '={{ $value === "apartments" ? undefined : $value }}' } } },
	},

	// -- Get Listing --
	{
		displayName: 'Listing URL or ID',
		name: 'hotpadsListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://hotpads.com/<address>-<ID>/pad',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'A HotPads listing link (Search Rentals listing or building URL) or a building ID (Search Rentals buildings ID, Get Suggestions listings ID), e.g. skrzz0',
	},

	// -- Get Price History --
	alias('hotpadsPriceHistoryAlias', 'priceHistory', 'The listing alias from Get Listing price_history'),
	{
		displayName: 'Model ID',
		name: 'hotpadsPriceHistoryModelId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '738529',
		displayOptions: show(['priceHistory']),
		routing: { request: { body: { model_id: '={{ String($value).trim() }}' } } },
		description: 'The model ID from Get Listing price_history (HotPads gives a price history only to listings that carry one)',
	},

	// -- Get Costs and Fees --
	alias('hotpadsFeesAlias', 'fees', 'A HotPads listing alias: alias from Get Listing or from Search Rentals listings'),

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'hotpadsSuggestionsText',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'brooklyn',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { text: '={{ String($value).trim() }}' } } },
		description: 'A city, neighborhood, borough, county, ZIP code, school or address (3 to 80 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'hotpadsSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Amenity',
				name: 'hotpadsSearchAmenity',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Furnished', value: 'furnished' },
					{ name: 'Parking', value: 'parking' },
				],
				description: 'One of the amenity filters HotPads applies (one per search)',
				routing: { request: { body: { amenity: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Baths Min',
				name: 'hotpadsSearchBathsMin',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'At Least 1', value: '1' },
					{ name: 'At Least 1.5', value: '1.5' },
					{ name: 'At Least 2', value: '2' },
					{ name: 'At Least 3', value: '3' },
					{ name: 'At Least 4', value: '4' },
				],
				description: 'At least this many bathrooms',
				routing: { request: { body: { baths_min: '={{ $value ? Number($value) : undefined }}' } } },
			},
			{
				displayName: 'Beds (Exact)',
				name: 'hotpadsSearchBeds',
				type: 'options',
				default: '',
				options: bedOptions('Any'),
				description: 'An exact bedroom count (Studio is 0). Send Beds (Exact) or Beds Min, not both.',
				routing: { request: { body: { beds: '={{ $value === "" ? undefined : Number($value) }}' } } },
			},
			{
				displayName: 'Beds Min',
				name: 'hotpadsSearchBedsMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 8 },
				description: 'At least this many bedrooms, 1 to 8 (0: no minimum)',
				routing: { request: { body: { beds_min: '={{ $value >= 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'In-Unit Laundry',
				name: 'hotpadsSearchLaundry',
				type: 'boolean',
				default: false,
				description: 'Whether to return listings with an in-unit washer and dryer only',
				routing: { request: { body: { in_unit_laundry: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Keywords',
				name: 'hotpadsSearchKeywords',
				type: 'string',
				default: '',
				placeholder: 'balcony',
				description: 'Keywords HotPads matches in listings',
				routing: { request: { body: { keywords: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'hotpadsSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page of 40 buildings, from 1; pages says how many',
				routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Pets',
				name: 'hotpadsSearchPets',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Cats', value: 'cats' },
					{ name: 'Dogs', value: 'dogs' },
				],
				description: 'Listings that allow dogs or cats (HotPads takes one per search)',
				routing: { request: { body: { pets: '={{ $value || undefined }}' } } },
			},
			numberOption('Price Max', 'hotpadsSearchPriceMax', 'price_max', 100000, 'Highest monthly rent, USD (0: no maximum)'),
			numberOption('Price Min', 'hotpadsSearchPriceMin', 'price_min', 100000, 'Lowest monthly rent, USD (0: no minimum)'),
			{
				displayName: 'Sort',
				name: 'hotpadsSearchSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Default', value: 'default' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				description: "HotPads' sort options (Default is HotPads' own order)",
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			numberOption('Square Feet Max', 'hotpadsSearchSqftMax', 'sqft_max', 50000, 'Largest size, square feet (0: no maximum)'),
			numberOption('Square Feet Min', 'hotpadsSearchSqftMin', 'sqft_min', 50000, 'Smallest size, square feet (0: no minimum)'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'hotpadsSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: [
			{
				displayName: 'Limit',
				name: 'hotpadsSuggestionsLimit',
				type: 'number',
				default: 6,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 6 ? undefined : $value }}' } } },
			},
		],
	},
];
