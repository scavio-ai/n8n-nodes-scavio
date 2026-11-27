import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['uhaul'], operation, ...extra },
});

// U-Haul (uhaul.com, the US and Canada truck rental and self-storage company), 8 operations, 1 credit each;
// credits_used is the truth. US and Canada (USD / CAD, miles / km), English, Spanish and French sites. Get Truck
// Quote takes about 25 s and can wait behind other quotes, so every operation carries a 180s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 180000 },
});

const SITE = 'U-Haul (uhaul.com, the US and Canada truck rental and self-storage company)';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const MARKET = 'The market (US: USD and miles, or Canada: CAD and km) follows the place.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const languageOption = (name: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English (www.uhaul.com)', value: 'en' },
		{ name: 'French (fr.uhaul.com)', value: 'fr' },
		{ name: 'Spanish (es.uhaul.com)', value: 'es' },
	],
	description: "The U-Haul site to read; the market follows the place. Sent only when it is not English.",
	routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
});

/** A U-Haul location or facility ID or uhaul.com link: digits go to the ID field, an https link to url. */
const entityField = (
	name: string,
	operation: string,
	idKey: string,
	placeholder: string,
	description: string,
): INodeProperties => ({
	displayName: 'ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				[idKey]: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description,
});

const placeField = (name: string, operation: string, placeholder: string): INodeProperties => ({
	displayName: 'Near',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: { request: { body: { near: '={{ String($value).trim() }}' } } },
	description: 'A city with its state or province, a ZIP code or a postal code (2 to 80 characters)',
});

export const uhaulOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['uhaul'] } },
		options: [
			{
				name: 'Find Locations',
				value: 'locations',
				action: 'Find uhaul locations',
				description: `${SITE} locations near a city, ZIP or postal code, for truck rentals, trailer rentals, moving supplies or self-storage: heading, layout (paged: 6 a page; single: every nearby location on page 1), page, has_more, count and locations (rank, location_id for Get Location and Get Reviews, name, location_type as U-Haul labels it, URL, address, phone, rating, review_count, distance, open_today, hours, special_hours, services, flags, latitude, longitude). Dealer and center contact is the business's public contact. ${MARKET} Captured 2026-11-27: truck rentals near 75201 listed 6 locations on page 1 with more pages. ${ONE}`,
				routing: request('/api/v1/uhaul/locations'),
			},
			{
				name: 'Get Location',
				value: 'location',
				action: 'Get a uhaul location',
				description: `One ${SITE} location by ID or link: country, currency, name, URL, address, coordinates, phone, hours, payment_accepted, rating, review_count, image, rate_card (Canadian locations: weekday and weekend day and per-km rates and the daily, weekly and monthly plans with kilometers included, in CAD) and listed_from_prices (US dealers: the page's own 'from' prices, which are not quotes). Captured 2026-11-27: location 848027 in Toronto, ON listed the Pickup Truck at 19.95 CAD a weekday day plus 0.99 CAD a km. ${ONE}`,
				routing: request('/api/v1/uhaul/location'),
			},
			{
				name: 'Get Moving Supplies',
				value: 'supplies',
				action: 'Get uhaul moving supplies',
				description: `${SITE} moving supplies prices, US (USD) or Canada (CAD), by category or product link. A category gives its products (product_id, name, URL, price, price_text, as_low_as, pickup_only, free_in_store_pickup, next_day_delivery); a product gives description, brand, SKU, price (single item), as_low_as_price, bundle (quantity, price, unit price), availability, rating, dimensions and sizes. Captured 2026-11-27: Boxes listed 47 products, the Medium Moving Box as low as 1.99 USD (3.21 CAD in Canada). ${ONE}`,
				routing: request('/api/v1/uhaul/supplies'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get uhaul location reviews',
				description: `U-Haul's own customer reviews of one ${SITE} location or storage facility, filtered by service and stars, sorted and paged: location_name, overall_rating, counts (all, trucks, storage, ubox), total, page, pages, has_more and reviews (rating, date, review_type, service, text). No reviewer name is returned. Captured 2026-11-27: location 741028 in Dallas, TX had 178 reviews, overall 4. ${ONE}`,
				routing: request('/api/v1/uhaul/reviews'),
			},
			{
				name: 'Get Storage Facility',
				value: 'storageFacility',
				action: 'Get a uhaul storage facility',
				description: `One ${SITE} self-storage facility in full by ID or link: affiliate, address, coordinates, phone, rating, review_count, units_count, vacant_units_total, units (unit_id, section, size class, dimensions, use, attributes, monthly_rate, rent_now, reserve_only, vacant_units, reservation window, free lock), sections, promotions as given, office_hours, access_hours, special_hours, features and amenities. Captured 2026-11-27: facility 741065 in Dallas, TX listed 43 unit types with 139 vacant units, a 5' x 5' indoor unit at 64.95 USD a month. ${ONE}`,
				routing: request('/api/v1/uhaul/storage-facility'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get uhaul place suggestions',
				description: `U-Haul's own place suggestions for the start of a city, ZIP or postal code (US and Canada) on ${SITE}: term, count and suggestions (label, value, kind: place or postal_code). value is the input for Pickup, Drop-Off and Near. Captured 2026-11-27: dall gave 15 suggestions, the first Dallas, TX. ${ONE}`,
				routing: request('/api/v1/uhaul/suggestions'),
			},
			{
				name: 'Get Truck Quote',
				value: 'truckQuote',
				action: 'Get a uhaul truck quote',
				description: `${SITE} truck rental rates for one move, read from U-Haul's public quote form: move_type (one_way or in_town), pickup, dropoff, date, includes (days and distance a one-way rate includes), allowed_miles, ubox_from, count, available_count, trucks (model_code, name, moving_type, available, availability_text, inventory_note, rate, rate_with_fees for Canada, rate_kind, per-mile or per-km rate, inside_dimensions, specs) and truck_with_labor (U-Haul's truck + moving labor estimate). This is a price quote, never a reservation: nothing is reserved and no pickup location is returned. Trailer, towing and U-Box quotes are not covered. ${MARKET} Captured 2026-11-27: Dallas, TX to Austin, TX included 2 days and 229 miles, 4 of 6 trucks available, the 10' Truck at 212 USD. Takes about 25 s. ${ONE}`,
				routing: request('/api/v1/uhaul/truck-quote'),
			},
			{
				name: 'Search Storage',
				value: 'storageSearch',
				action: 'Search uhaul storage facilities',
				description: `${SITE} self-storage facilities near a city, ZIP or postal code: up to 18 facilities, sorted by distance, starting rate or rating and filtered by features: listed, count and facilities (rank, facility_id for Get Storage Facility, name, URL, affiliate, address, distance, starting_rate, rating, review_count, price_lock, features, office and access hours today, special_hours). ${MARKET} Captured 2026-11-27: near Phoenix, AZ 85004, 18 facilities, the lowest starting rate 50 USD a month. ${ONE}`,
				routing: request('/api/v1/uhaul/storage-search'),
			},
		],
		default: 'truckQuote',
	},
];

export const uhaulFields: INodeProperties[] = [
	// -- Get Truck Quote --
	{
		displayName: 'Pickup',
		name: 'uhaulPickup',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Dallas, TX',
		displayOptions: show(['truckQuote']),
		routing: { request: { body: { pickup: '={{ String($value).trim() }}' } } },
		description: 'A city with its state or province, a US ZIP code or a Canadian postal code (Get Suggestions returns valid values)',
	},
	{
		displayName: 'Drop-Off',
		name: 'uhaulDropoff',
		type: 'string',
		default: '',
		placeholder: 'Austin, TX',
		displayOptions: show(['truckQuote']),
		routing: {
			request: {
				body: { dropoff: '={{ String($value).trim() === "" ? undefined : String($value).trim() }}' },
			},
		},
		description: 'Drop-off for a one-way move; leave empty for an in-town quote. Must differ from Pickup.',
	},
	{
		displayName: 'Pickup Date',
		name: 'uhaulDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2026-12-10',
		displayOptions: show(['truckQuote']),
		routing: { request: { body: { date: '={{ String($value).trim().slice(0, 10) }}' } } },
		description: 'Pickup day as YYYY-MM-DD: today or later, up to 330 days ahead',
	},

	// -- Find Locations, Search Storage --
	placeField('uhaulLocationsNear', 'locations', '75201'),
	placeField('uhaulStorageNear', 'storageSearch', 'Phoenix, AZ'),

	// -- Get Location, Get Storage Facility, Get Reviews --
	entityField(
		'uhaulLocationId',
		'location',
		'location_id',
		'741028',
		'A U-Haul location ID (5 to 7 digits; location_id from Find Locations) or the location link',
	),
	entityField(
		'uhaulFacilityId',
		'storageFacility',
		'facility_id',
		'741065',
		'A U-Haul storage facility ID (5 to 7 digits; facility_id from Search Storage) or the facility link',
	),
	entityField(
		'uhaulReviewsLocationId',
		'reviews',
		'location_id',
		'741028',
		'A U-Haul location or storage facility ID (5 to 7 digits) or its link',
	),

	// -- Get Suggestions --
	{
		displayName: 'Term',
		name: 'uhaulTerm',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dall',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { term: '={{ String($value).trim() }}' } } },
		description: 'The start of a city, a ZIP code or a postal code (2 to 60 characters)',
	},

	// -- Get Moving Supplies --
	{
		displayName: 'Category or URL',
		name: 'uhaulSupplies',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Boxes',
		displayOptions: show(['supplies']),
		routing: {
			request: {
				body: {
					category: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			"A moving supplies category as U-Haul's link writes it (Boxes, Packing-Supplies, Tape, Boxes/Standard-Sized-Moving-Boxes) or a www.uhaul.com moving supplies category or product link",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'uhaulTruckQuoteOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['truckQuote']),
		options: [languageOption('uhaulTruckQuoteLanguage')],
	},
	{
		displayName: 'Additional Options',
		name: 'uhaulLocationsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['locations']),
		options: sorted([
			languageOption('uhaulLocationsLanguage'),
			{
				displayName: 'Page',
				name: 'uhaulLocationsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Page from 1 to 50 (6 locations a page where U-Haul pages)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Service',
				name: 'uhaulLocationsService',
				type: 'options',
				default: 'truck_rentals',
				options: [
					{ name: 'Moving Supplies', value: 'moving_supplies' },
					{ name: 'Self Storage', value: 'self_storage' },
					{ name: 'Trailer Rentals', value: 'trailer_rentals' },
					{ name: 'Truck Rentals', value: 'truck_rentals' },
				],
				description: 'Which U-Haul service the locations offer',
				routing: {
					request: { body: { service: '={{ $value === "truck_rentals" ? undefined : $value }}' } },
				},
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'uhaulLocationOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['location']),
		options: [languageOption('uhaulLocationLanguage')],
	},
	{
		displayName: 'Additional Options',
		name: 'uhaulStorageOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storageSearch']),
		options: sorted([
			{
				displayName: 'Features',
				name: 'uhaulStorageFeatures',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Climate Control', value: 'climate_control' },
					{ name: 'Indoor Storage', value: 'indoor' },
					{ name: 'Online Move-In / Rent Now', value: 'rent_now_online' },
					{ name: 'Outdoor / Drive Up', value: 'drive_up' },
					{ name: 'Portable Storage', value: 'portable' },
					{ name: 'RV / Boat / Vehicle Storage', value: 'vehicle' },
				],
				description: 'Facilities with every one of these features (empty: any)',
				routing: { request: { body: { features: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			languageOption('uhaulStorageLanguage'),
			{
				displayName: 'Sort',
				name: 'uhaulStorageSort',
				type: 'options',
				default: 'distance',
				options: [
					{ name: 'Distance', value: 'distance' },
					{ name: 'Price (Starting Rate, Low to High)', value: 'price' },
					{ name: 'Rating (High to Low)', value: 'rating' },
				],
				description: 'Order of the facilities',
				routing: { request: { body: { sort: '={{ $value === "distance" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'uhaulFacilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['storageFacility']),
		options: [languageOption('uhaulFacilityLanguage')],
	},
	{
		displayName: 'Additional Options',
		name: 'uhaulReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'uhaulReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page from 1 to 200',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'uhaulReviewsPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews per page, 1 to 100',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Service',
				name: 'uhaulReviewsService',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Storage', value: 'storage' },
					{ name: 'Trucks', value: 'trucks' },
					{ name: 'U-Box', value: 'ubox' },
				],
				description: 'Reviews of this U-Haul service',
				routing: { request: { body: { service: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'uhaulReviewsSort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Highest Rating', value: 'highest' },
					{ name: 'Lowest Rating', value: 'lowest' },
					{ name: 'Newest', value: 'newest' },
				],
				description: 'Order of the reviews',
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'uhaulReviewsStars',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'Only reviews with this many stars, 1 to 5 (0: any)',
				routing: { request: { body: { stars: '={{ $value ? $value : undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'uhaulSuppliesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['supplies']),
		options: [
			{
				displayName: 'Country',
				name: 'uhaulSuppliesCountry',
				type: 'options',
				default: 'us',
				options: [
					{ name: 'Canada (CAD)', value: 'ca' },
					{ name: 'United States (USD)', value: 'us' },
				],
				description: "Which market's prices to read",
				routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
			},
		],
	},
];
