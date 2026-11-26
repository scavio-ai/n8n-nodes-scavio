import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['publicstorage'], operation, ...extra },
});

// Public Storage (publicstorage.com, the largest US self-storage operator, now also in Canada),
// 3 operations, 1 credit each; credits_used is the truth. US (USD, miles) and Canada (CAD, km,
// English or French). Calls can queue behind the backend's upstream limit, so every operation
// carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Public Storage (publicstorage.com, the largest US self-storage operator, now also in Canada)';
const NAME = 'Public Storage';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const UNITS =
	"units with name, size class, size, dimension, vehicle flag, features, In-Store Rent, Online price, first month rent, first and second month after the promotion, move-in cost, admin fee, lock charge, the promotion (name, label, reward type, amount, length in months) and units left (only where the page says so)";
const PRICES =
	"Prices are the page's own per unit, in the market's currency; promotions are Public Storage's as given and can vary between visits. Public Storage does not publish occupancy.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const marketOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: [
		{ name: 'Canada (CAD, Km)', value: 'ca' },
		{ name: 'United States (USD, Miles)', value: 'us' },
	],
	description,
	routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
});
const languageOption = (name: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French (Canada Only)', value: 'fr' },
	],
	description: "English, or Public Storage Canada's French pages (Market Canada). The US site is English only.",
	routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
});
const flag = (displayName: string, name: string, key: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [key]: '={{ $value || undefined }}' } } },
});

export const publicstorageOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['publicstorage'] } },
		options: [
			{
				name: 'Get Facility',
				value: 'facility',
				action: 'Get a public storage facility',
				description: `One ${NAME} facility in full by store ID or link: site number, name, market, language, currency, phone, address, coordinates, market area, rating and review count (US; Canadian pages show no reviews), office, access and rental support hours, amenities, images, payments accepted, the admin fee note and ${UNITS}. ${PRICES} Captured 2026-11-26: store 2044, Public Storage - Dallas, TX 75204, rated 4.7 from 422 reviews with 20 unit types, its 5'x5' climate-controlled unit at an In-Store Rent of 66 USD and an Online price of 39.60 USD (40% off for 4 months). An unknown store ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/publicstorage/facility'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get public storage reviews',
				description: `Every customer review ${NAME} shows for one US facility, newest first (its only order), in one answer, optionally only one star rating: rating, date, source (as given: Google) and text. No reviewer name is returned. US only (Canadian facility pages show none). Captured 2026-11-26: store 2223 had 819 five-star reviews; store 2044 had 12 four-star reviews. ${ONE}.`,
				routing: request('/api/v1/publicstorage/reviews'),
			},
			{
				name: 'Search Facilities',
				value: 'search',
				action: 'Search public storage facilities',
				description: `Self-storage facilities on ${FIRST} near a ZIP or postal code, a city or an address, in the US or Canada (English or French), sorted recommended, by distance or by price, with filters (climate controlled, drive-up, 24/7 access, business, vehicle, RV or boat storage, a unit size) applied to the facilities on the page: location (with the search slug for later pages), pages, has_more and facilities with rank, store ID (what Get Facility and Get Reviews take), site number, name, URL, address, phone, coordinates, distance, today's hours, starting price, features, unit sizes and ${UNITS}. 9-19 facilities a page; a ZIP search pages through its slug, while a city or a Canadian place lists every facility on page 1. ${PRICES} Captured 2026-11-26: ZIP 75201 by lowest price gave 10 facilities on page 1 of 2, the first 0.5 miles away from 32 USD (In-Store Rent 32 USD, Online price 16 USD for a 5'x5'); Toronto, ON on Market Canada gave 18 facilities. A place Public Storage cannot find is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/publicstorage/search'),
			},
		],
		default: 'search',
	},
];

export const publicstorageFields: INodeProperties[] = [
	// -- Search Facilities --
	{
		displayName: 'Search By',
		name: 'publicstorageSearchBy',
		type: 'options',
		default: 'location',
		options: [
			{ name: 'Location', value: 'location' },
			{ name: 'Search Slug (Page 2 and Later)', value: 'slug' },
		],
		displayOptions: show(['search']),
		description: 'A place, or the search slug an earlier answer gave (needed for page 2 and later)',
	},
	{
		displayName: 'Location',
		name: 'publicstorageSearchLocation',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75201',
		displayOptions: show(['search'], { publicstorageSearchBy: ['location'] }),
		routing: { request: { body: { location: '={{ String($value).trim() }}' } } },
		description:
			'A ZIP or postal code, a city with its state or province (Austin, TX; Toronto, ON) or a street address. Not latitude / longitude.',
	},
	{
		displayName: 'Search Slug',
		name: 'publicstorageSearchSlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dallas-tx-75201',
		displayOptions: show(['search'], { publicstorageSearchBy: ['slug'] }),
		routing: { request: { body: { slug: '={{ String($value).trim() }}' } } },
		description: 'The location slug an earlier search answer gave',
	},

	// -- Get Facility --
	{
		displayName: 'Store ID or URL',
		name: 'publicstorageFacilityId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2044',
		displayOptions: show(['facility']),
		routing: {
			request: {
				body: {
					store_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A Public Storage store ID (digits, from Search Facilities) or the facility link',
	},

	// -- Get Reviews --
	{
		displayName: 'Store ID',
		name: 'publicstorageReviewsStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2044',
		displayOptions: show(['reviews']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'A Public Storage store ID (digits, from Search Facilities); US facilities only',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'publicstorageSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			flag('24/7 Access', 'publicstorageSearchAccess247', 'access_24_7', 'Whether to return only facilities with 24/7 access'),
			flag('Boat Storage', 'publicstorageSearchBoat', 'boat_storage', 'Whether to return only facilities with boat storage'),
			flag('Business Storage', 'publicstorageSearchBusiness', 'business_storage', 'Whether to return only facilities offering business storage'),
			flag('Climate Controlled', 'publicstorageSearchClimate', 'climate_controlled', 'Whether to return only facilities with climate-controlled units'),
			flag('Drive-Up', 'publicstorageSearchDriveUp', 'drive_up', 'Whether to return only facilities with drive-up access'),
			languageOption('publicstorageSearchLanguage'),
			marketOption('publicstorageSearchMarket', 'United States (default) or Public Storage Canada'),
			{
				displayName: 'Page',
				name: 'publicstorageSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Page from 1; past page 1 send the Search Slug. Public Storage pages shallowly: pages says how many.',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			flag('RV Storage', 'publicstorageSearchRv', 'rv_storage', 'Whether to return only facilities with RV storage'),
			{
				displayName: 'Sort',
				name: 'publicstorageSearchSort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Distance', value: 'distance' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Recommended', value: 'recommended' },
				],
				description: "Public Storage's sorts (Recommended is its default order)",
				routing: { request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Unit Size',
				name: 'publicstorageSearchUnitSize',
				type: 'options',
				default: '',
				options: [
					{ name: '10x10', value: '10x10' },
					{ name: '10x15', value: '10x15' },
					{ name: '10x20', value: '10x20' },
					{ name: '10x25', value: '10x25' },
					{ name: '10x30', value: '10x30' },
					{ name: '5x10', value: '5x10' },
					{ name: '5x15', value: '5x15' },
					{ name: '5x5', value: '5x5' },
					{ name: 'Any', value: '' },
				],
				description: 'Only facilities with this unit size',
				routing: { request: { body: { unit_size: '={{ $value || undefined }}' } } },
			},
			flag('Vehicle Storage', 'publicstorageSearchVehicle', 'vehicle_storage', 'Whether to return only facilities with vehicle storage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'publicstorageFacilityOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['facility']),
		options: sorted([
			languageOption('publicstorageFacilityLanguage'),
			marketOption('publicstorageFacilityMarket', 'United States (default) or Public Storage Canada; read from the link when a URL is sent'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'publicstorageReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Site Number',
				name: 'publicstorageReviewsSiteNumber',
				type: 'string',
				default: '',
				placeholder: '08489',
				description: "The facility's site number (from Search Facilities), optional",
				routing: { request: { body: { site_number: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'publicstorageReviewsStars',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: 'Only reviews with this many stars, 1 to 5 (0: all)',
				routing: { request: { body: { stars: '={{ $value >= 1 ? $value : undefined }}' } } },
			},
		]),
	},
];
