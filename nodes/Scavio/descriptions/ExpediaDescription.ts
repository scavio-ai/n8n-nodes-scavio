import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['expedia'], operation, ...extra },
});

// Expedia (expedia.com, Expedia Group's travel booking site), 4 operations in 50 Expedia market-languages,
// each in its own language and currency. Billed on what each request cost: 2 credits for most pages, 1 on
// some New Zealand, Korea and Indonesia pages; credits_used is the truth. Get Property and Get Price Calendar
// are refused in en-gb, pt-br, zh-hk, en-hk, zh-hans-hk, en-my and en-ph (Expedia answers hotel pages there
// with another country's site). A call can take up to about 4 minutes, so every operation carries a 240s
// timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const NAME = 'Expedia';
const FIRST = "Expedia (expedia.com, Expedia Group's travel booking site)";
const CHARGE =
	"Failed upstream calls, another market's page and refused inputs are not charged; a not-found is charged.";
const COST = `${CHARGE} Costs 2 credits for most pages, 1 on some New Zealand, Korea and Indonesia pages (credits_used says what was charged).`;
const HEAD = 'market, language and currency';
const LANG = "Labels and texts are in the market's language, as Expedia writes them; field names are English.";
const HELD_TEXT =
	"Not available in the United Kingdom, Brazil, Hong Kong (all three languages), Malaysia and the Philippines: Expedia answers hotel pages there with another country's site, so those markets are refused (not charged).";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MARKETS = [
	{ name: 'Argentina (Spanish, ARS)', value: 'es-ar' },
	{ name: 'Australia (English, AUD)', value: 'en-au' },
	{ name: 'Austria (German, EUR)', value: 'de-at' },
	{ name: 'Belgium (Dutch, EUR)', value: 'nl-be' },
	{ name: 'Belgium (French, EUR)', value: 'fr-be' },
	{ name: 'Brazil (Portuguese, BRL)', value: 'pt-br' },
	{ name: 'Canada (English, CAD)', value: 'en-ca' },
	{ name: 'Canada (French, CAD)', value: 'fr-ca' },
	{ name: 'Chile (Spanish, CLP)', value: 'es-cl' },
	{ name: 'Colombia (Spanish, COP)', value: 'es-co' },
	{ name: 'Costa Rica (Spanish, USD)', value: 'es-cr' },
	{ name: 'Denmark (Danish, DKK)', value: 'da-dk' },
	{ name: 'Egypt (English, EGP)', value: 'en-eg' },
	{ name: 'Finland (Finnish, EUR)', value: 'fi-fi' },
	{ name: 'France (French, EUR)', value: 'fr-fr' },
	{ name: 'Germany (German, EUR)', value: 'de-de' },
	{ name: 'Hong Kong (Chinese, HKD)', value: 'zh-hk' },
	{ name: 'Hong Kong (English, HKD)', value: 'en-hk' },
	{ name: 'Hong Kong (Simplified Chinese, HKD)', value: 'zh-hans-hk' },
	{ name: 'India (English, INR)', value: 'en-in' },
	{ name: 'Indonesia (English, IDR)', value: 'en-id' },
	{ name: 'Indonesia (Indonesian, IDR)', value: 'id-id' },
	{ name: 'Ireland (English, EUR)', value: 'en-ie' },
	{ name: 'Italy (Italian, EUR)', value: 'it-it' },
	{ name: 'Japan (English, JPY)', value: 'en-jp' },
	{ name: 'Japan (Japanese, JPY)', value: 'ja-jp' },
	{ name: 'Malaysia (English, MYR)', value: 'en-my' },
	{ name: 'Mexico (Spanish, MXN)', value: 'es-mx' },
	{ name: 'Netherlands (Dutch, EUR)', value: 'nl-nl' },
	{ name: 'New Zealand (English, NZD)', value: 'en-nz' },
	{ name: 'Norway (Norwegian, NOK)', value: 'no-no' },
	{ name: 'Peru (Spanish, PEN)', value: 'es-pe' },
	{ name: 'Philippines (English, PHP)', value: 'en-ph' },
	{ name: 'Saudi Arabia (Arabic, SAR)', value: 'ar-sa' },
	{ name: 'Singapore (English, SGD)', value: 'en-sg' },
	{ name: 'South Korea (English, KRW)', value: 'en-kr' },
	{ name: 'South Korea (Korean, KRW)', value: 'ko-kr' },
	{ name: 'Spain (Spanish, EUR)', value: 'es-es' },
	{ name: 'Sweden (Swedish, SEK)', value: 'sv-se' },
	{ name: 'Switzerland (French, CHF)', value: 'fr-ch' },
	{ name: 'Switzerland (German, CHF)', value: 'de-ch' },
	{ name: 'Taiwan (Chinese, TWD)', value: 'zh-tw' },
	{ name: 'Thailand (English, THB)', value: 'en-th' },
	{ name: 'Thailand (Thai, THB)', value: 'th-th' },
	{ name: 'United Arab Emirates (Arabic, AED)', value: 'ar-ae' },
	{ name: 'United Arab Emirates (English, AED)', value: 'en-ae' },
	{ name: 'United Kingdom (English, GBP)', value: 'en-gb' },
	{ name: 'United States (Chinese, USD)', value: 'zh-us' },
	{ name: 'United States (English, USD)', value: 'us' },
	{ name: 'United States (Spanish, USD)', value: 'es-us' },
	{ name: 'Vietnam (Vietnamese, VND)', value: 'vi-vn' },
];
const HELD = ['en-gb', 'pt-br', 'zh-hk', 'en-hk', 'zh-hans-hk', 'en-my', 'en-ph'];
const HOTEL_MARKETS = MARKETS.filter((m) => !HELD.includes(m.value));

const marketOption = (name: string, hotelPages = false): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: hotelPages ? HOTEL_MARKETS : MARKETS,
	description: hotelPages
		? `The Expedia market-language: each answers in its own language and currency. ${HELD_TEXT}`
		: 'The Expedia market-language: each answers in its own language and currency',
	routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
});

const AMENITIES = [
	{ name: 'Air Conditioning', value: 'AIR_CONDITIONING' },
	{ name: 'Any', value: '' },
	{ name: 'Balcony or Terrace', value: 'BALCONY_OR_TERRACE' },
	{ name: 'Crib', value: 'CRIB' },
	{ name: 'Electric Car Charging', value: 'ELECTRIC_CAR' },
	{ name: 'Free Airport Transportation', value: 'FREE_AIRPORT_TRANSPORTATION' },
	{ name: 'Free Parking', value: 'FREE_PARKING' },
	{ name: 'Gym', value: 'GYM' },
	{ name: 'Hot Tub', value: 'HOT_TUB' },
	{ name: 'Kitchen or Kitchenette', value: 'KITCHEN_KITCHENETTE' },
	{ name: 'Pets Allowed', value: 'PETS' },
	{ name: 'Pool', value: 'POOL' },
	{ name: 'Restaurant in Hotel', value: 'RESTAURANT_IN_HOTEL' },
	{ name: 'Spa on Site', value: 'SPA_ON_SITE' },
	{ name: 'Washer and Dryer', value: 'WASHER_DRYER' },
	{ name: 'Wi-Fi', value: 'WIFI' },
];

/** A property ID-or-path field: digits go to id, anything else (a path or a link) to path. */
const propertyRef = (name: string, operation: string, description: string): INodeProperties => ({
	displayName: 'Property ID or Path',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '/New-York-Hotels-PUBLIC.h17117062.Hotel-Information',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				id: '={{ /^\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
				path: '={{ /^\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
			},
		},
	},
	description,
});

const dateField = (
	displayName: string,
	name: string,
	operation: string,
	key: string,
	placeholder: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: { request: { body: { [key]: '={{ String($value).trim().slice(0, 10) }}' } } },
	description,
});

const adultsOption = (name: string): INodeProperties => ({
	displayName: 'Adults',
	name,
	type: 'number',
	default: 2,
	typeOptions: { minValue: 1, maxValue: 14 },
	description: 'Adults in the room, 1 to 14 (one room)',
	routing: { request: { body: { adults: '={{ $value === 2 ? undefined : $value }}' } } },
});

export const expediaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['expedia'] } },
		options: [
			{
				name: 'Get Price Calendar',
				value: 'price-calendar',
				action: 'Get an expedia price calendar',
				description: `${NAME}'s price calendar for one property: the price Expedia shows for each day from today to about 10 months ahead (up to 302 days), labelled by Expedia "Lowest prices in the past 24 hours": ${HEAD}, property_id, name, label (in the market's language) and label_en, begin, end, count, days_with_price and days with date, price and price display (null on days Expedia shows none). Check-In and Check-Out open the page; the calendar spans Expedia's own window. Send the path from Search Properties where you can: some market sites answer a page opened from the ID alone without its calendar (retried, then an error that is not charged). Captured 2026-11-26: property 17117062 in New York on the United States market gave 241 days from 2026-11-26 to 2027-07-24, 232 with a price in USD. ${HELD_TEXT} An unknown property is a charged not-found. ${COST}`,
				routing: request('/api/v1/expedia/price-calendar'),
			},
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get an expedia property',
				description: `One ${NAME} property page by ID or path, read without dates: ${HEAD}, name, stars, address, coordinates, region_id, rating (score, label, review count), description, about, every amenity group (incl. parking and breakfast fees as Expedia writes them), guest_liked (Expedia's own summary lines), every fee and deposit line, policies (check-in, check-out, minimum age, pets, children, payment types), important information, neighborhood, what is nearby, FAQs and photos with captions. Rooms and rates for dates and review texts are not offered: use Search Properties for dated prices. ${LANG} Captured 2026-11-26: property 1443, a Las Vegas resort, with 124 photos, 16 amenity groups and 6 FAQs. ${HELD_TEXT} An unknown property is a charged not-found. ${COST}`,
				routing: request('/api/v1/expedia/property'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get expedia suggestions',
				description: `${NAME}'s destination suggestions for a partial place name: ${HEAD}, query, count and places with type (CITY, NEIGHBORHOOD, POI, AIRPORT, METROCODE ...), region_id (what Search Properties takes), name, display name, full name, coordinates, country, country code and airport code. Hotel names often return no place. Captured 2026-11-26: las veg gave 8 places, the first the Las Vegas Strip neighborhood (region ID 800045). ${COST}`,
				routing: request('/api/v1/expedia/suggestions'),
			},
			{
				name: 'Search Properties',
				value: 'search',
				action: 'Search expedia properties',
				description: `Search hotels and stays on ${FIRST} by place name or region ID, dates and adults (one room), with Expedia's sorts and filters (star rating, amenity, guest rating): ${HEAD}, destination name, nights, filters, applied (the selections Expedia's page echoed), matched_total as Expedia reports it, results heading, count, partial and properties with property_id and path (what Get Property and Get Price Calendar take), name, neighborhood, messages, rating, price (the large price and whether it is nightly or the total, nightly, total, was price, fees line, stay line, currency), deal, scarcity, badges (VIP Access, Member Price, Ad), sponsored, coordinates and images. These are the top results on the first page of Expedia's results: 3 on most requests (partial: true), up to 10 on some; no further page can be fetched. Prices are exactly as Expedia shows them for the requested dates. ${LANG} Captured 2026-11-26: Las Vegas, NV for 2027-01-20 to 2027-01-23 with 2 adults gave 10 of 24 matched properties, the first at 1297 USD for 3 nights (326 USD nightly) rated 8.8 from 12182 reviews; London on the United Kingdom market gave 3 of 505 (partial: true), the first at 520 GBP for 3 nights. ${COST}`,
				routing: request('/api/v1/expedia/search'),
			},
		],
		default: 'search',
	},
];

export const expediaFields: INodeProperties[] = [
	// -- Search Properties --
	{
		displayName: 'Search By',
		name: 'expediaSearchBy',
		type: 'options',
		default: 'destination',
		options: [
			{ name: 'Destination', value: 'destination' },
			{ name: 'Region ID', value: 'regionId' },
		],
		displayOptions: show(['search']),
		description: 'Search a place by name, or by the Expedia region ID Get Suggestions returns',
	},
	{
		displayName: 'Destination',
		name: 'expediaSearchDestination',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Las Vegas, NV',
		displayOptions: show(['search'], { expediaSearchBy: ['destination'] }),
		routing: { request: { body: { destination: '={{ String($value).trim() }}' } } },
		description: 'A place as you would type it on Expedia: city, area, landmark or airport',
	},
	{
		displayName: 'Region ID',
		name: 'expediaSearchRegionId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2621',
		displayOptions: show(['search'], { expediaSearchBy: ['regionId'] }),
		routing: { request: { body: { region_id: '={{ String($value).trim() }}' } } },
		description: 'An Expedia region ID (region_id from Get Suggestions, digits)',
	},
	dateField('Check-In', 'expediaSearchCheckIn', 'search', 'check_in', '2027-03-12', 'Check-in date, YYYY-MM-DD (not in the past, at most 500 days ahead)'),
	dateField('Check-Out', 'expediaSearchCheckOut', 'search', 'check_out', '2027-03-15', 'Check-out date, YYYY-MM-DD (after check-in, at most 28 nights later)'),

	// -- Get Property --
	propertyRef(
		'expediaPropertyRef',
		'property',
		'An Expedia property ID (property_id from Search Properties, e.g. 17117062), its path from Search Properties, or an Expedia hotel link',
	),

	// -- Get Price Calendar --
	propertyRef(
		'expediaCalendarRef',
		'price-calendar',
		'The property path from Search Properties (recommended), an Expedia hotel link, or the property ID',
	),
	dateField('Check-In', 'expediaCalendarCheckIn', 'price-calendar', 'check_in', '2027-03-12', "Check-in date, YYYY-MM-DD (opens the page; the calendar spans Expedia's own window)"),
	dateField('Check-Out', 'expediaCalendarCheckOut', 'price-calendar', 'check_out', '2027-03-15', 'Check-out date, YYYY-MM-DD (after check-in)'),

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'expediaSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'new yo',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a traveller has typed so far, a place name (2 to 100 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'expediaSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			adultsOption('expediaSearchAdults'),
			{
				displayName: 'Amenity',
				name: 'expediaSearchAmenity',
				type: 'options',
				default: '',
				options: AMENITIES,
				description: "One of Expedia's popular amenity filters",
				routing: { request: { body: { amenity: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Guest Rating Min',
				name: 'expediaSearchGuestRating',
				type: 'options',
				default: '',
				options: [
					{ name: '7+', value: '7' },
					{ name: '8+', value: '8' },
					{ name: '9+', value: '9' },
					{ name: 'Any', value: '' },
				],
				description: "Expedia's guest rating filter",
				routing: { request: { body: { guest_rating_min: '={{ $value ? Number($value) : undefined }}' } } },
			},
			marketOption('expediaSearchMarket'),
			{
				displayName: 'Sort',
				name: 'expediaSearchSort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Guest Rating', value: 'review' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Recommended', value: 'recommended' },
				],
				description: "Expedia's own sort options",
				routing: { request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'expediaSearchStar',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description: "Expedia's star rating filter, 1 to 5 (0: any)",
				routing: { request: { body: { star: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'expediaPropertyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['property']),
		options: [marketOption('expediaPropertyMarket', true)],
	},
	{
		displayName: 'Additional Options',
		name: 'expediaCalendarOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['price-calendar']),
		options: sorted([adultsOption('expediaCalendarAdults'), marketOption('expediaCalendarMarket', true)]),
	},
	{
		displayName: 'Additional Options',
		name: 'expediaSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: sorted([
			{
				displayName: 'Limit',
				name: 'expediaSuggestionsLimit',
				type: 'number',
				default: 8,
				typeOptions: { minValue: 1, maxValue: 8 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 8 ? undefined : $value }}' } } },
			},
			marketOption('expediaSuggestionsMarket'),
		]),
	},
];
