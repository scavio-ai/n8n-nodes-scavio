import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['vrbo'], operation, ...extra },
});

// Vrbo (vrbo.com, Expedia Group's vacation rental site), 3 operations in 20 vrbo.com
// market-languages, each in its own language and currency. Billed on what each request cost:
// 2 credits a call, a search 2 per attempt (2 to 8); credits_used is the truth. A search can take
// up to about 3 minutes, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const NAME = 'Vrbo';
const FIRST = "Vrbo (vrbo.com, Expedia Group's vacation rental site)";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const HEAD = 'market, language and currency';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MARKETS = [
	{ name: 'Australia (English, AUD)', value: 'en-au' },
	{ name: 'Austria (German, EUR)', value: 'de-at' },
	{ name: 'Brazil (Portuguese, BRL)', value: 'pt-br' },
	{ name: 'Canada (English, CAD)', value: 'en-ca' },
	{ name: 'Canada (French, CAD)', value: 'fr-ca' },
	{ name: 'Denmark (Danish, DKK)', value: 'da-dk' },
	{ name: 'Finland (Finnish, EUR)', value: 'fi-fi' },
	{ name: 'Greece (Greek, EUR)', value: 'el-gr' },
	{ name: 'Italy (Italian, EUR)', value: 'it-it' },
	{ name: 'Japan (Japanese, JPY)', value: 'ja-jp' },
	{ name: 'Mexico (Spanish, MXN)', value: 'es-mx' },
	{ name: 'Netherlands (Dutch, EUR)', value: 'nl-nl' },
	{ name: 'New Zealand (English, NZD)', value: 'en-nz' },
	{ name: 'Norway (Norwegian, NOK)', value: 'no-no' },
	{ name: 'Portugal (Portuguese, EUR)', value: 'pt-pt' },
	{ name: 'Singapore (English, SGD)', value: 'en-sg' },
	{ name: 'Spain (Spanish, EUR)', value: 'es-es' },
	{ name: 'Sweden (Swedish, SEK)', value: 'sv-se' },
	{ name: 'United Kingdom (English, GBP)', value: 'en-gb' },
	{ name: 'United States (English, USD)', value: 'us' },
];

const marketOption = (name: string): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: MARKETS,
	description:
		'The vrbo.com market-language: each answers in its own language and currency. abritel.fr, fewo-direkt.de, stayz.com.au and bookabach.co.nz are separate sites and are not covered.',
	routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
});

const titled = (values: string[]) =>
	values
		.map((v) => ({
			name: v === 'RV' ? 'RV' : v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' '),
			value: v,
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

const PROPERTY_TYPES = ['house', 'apartment_or_condo', 'cottage', 'cabin', 'estate', 'resort', 'villa', 'hotel', 'houseboat', 'guest_house', 'boat', 'chalet', 'RV'];
const AMENITIES = [
	'pool', 'private_pool', 'heated_pool', 'hot_tub', 'balcony', 'king_sized_bed', 'parking', 'internet_available',
	'fireplace', 'washer', 'clothes_dryer', 'electric_vehicle_charging_station', 'air_conditioning', 'television',
	'outdoor_grill', 'patio_or_deck', 'garden_or_backyard', 'bed_linens_provided', 'crib', 'stove', 'microwave', 'oven',
	'dishwasher', 'kids_high_chair', 'iron_and_board',
];
const HOUSE_RULES = ['pets_allowed', 'pet_free', 'children_allowed', 'events_allowed', 'smoking_allowed'];
const LOCATIONS = ['oceanfront', 'waterfront', 'downtown_location', 'lake_location', 'mountains_location', 'rural_location', 'golf_course', 'village_location', 'skiin_skiout'];

const anyOption = (values: string[]) => [{ name: 'Any', value: '' }, ...titled(values)];

export const vrboOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['vrbo'] } },
		options: [
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get a vrbo property',
				description: `One ${NAME} property in full by ID or link, read without dates: ${HEAD}, title, property type, location (locality, region, country, address lines, coordinates, region ID), rating (score, label, review count), highlights, space (bedrooms, bathrooms, sleeps), every amenity group, house rules (check-in and check-out, minimum age, children, pets, events, smoking), important information, description, damage and incidentals, host (Premier Host flag and languages only: no host name, biography or photo), photos with captions, what is nearby, default_price (the site's own default stay, not a quote) and breadcrumbs. Reviews, the availability calendar and prices for chosen dates are not offered: use Search Properties for dated prices. Captured 2026-11-26: property 1046285, a 1-bedroom beachfront condo in Destin, FL, rated 9.8 from 221 reviews with 85 photos. An unknown property is a charged not-found. ${CHARGE} Costs 2 credits (credits_used says what was charged).`,
				routing: request('/api/v1/vrbo/property'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get vrbo suggestions',
				description: `${NAME}'s destination suggestions for a partial place name: ${HEAD}, query, count and places with type (CITY, NEIGHBORHOOD, POI, AIRPORT ...), region_id (what Search Properties takes), name, display name, full name, coordinates, country and country code. Captured 2026-11-26: destin gave 8 places, the first the city of Destin, Florida (region ID 6906). ${CHARGE} Costs 2 credits (credits_used says what was charged).`,
				routing: request('/api/v1/vrbo/suggestions'),
			},
			{
				name: 'Search Properties',
				value: 'search',
				action: 'Search vrbo properties',
				description: `Search vacation rentals on ${FIRST} by place name or region ID, dates and guests, with Vrbo's sorts and filters (property type, amenity, house rule incl. pets, location type, Premier Host, minimum bedrooms): ${HEAD}, destination name, nights, filters, applied (the selections Vrbo's page echoed), matched_total as Vrbo reports it, page label, count, partial, attempts and properties with property_id (what Get Property takes), URL, title, details, messages (incl. the refund deadline), rating, price (nightly, total for the stay, was price, fees line, currency), deal, badges, sponsored, coordinates and images. The first 50 results only: Vrbo's results pages carry no further page, so narrow with sort and filters. Prices are exactly as Vrbo shows them for the requested dates. Vrbo sometimes answers with a 3-result page; Scavio asks again (up to 4 attempts in all) and, if 3 is all Vrbo gives, returns those 3 with partial: true. Captured 2026-11-26: Destin, Florida for 2027-01-15 to 2027-01-18 with 2 adults gave 50 of 394 matched properties, the first at 264 USD a night (792 USD for 3 nights, all fees included). ${CHARGE} Costs 2 credits per attempt, 2 to 8 (credits_used says what was charged).`,
				routing: request('/api/v1/vrbo/search'),
			},
		],
		default: 'search',
	},
];

export const vrboFields: INodeProperties[] = [
	// -- Search Properties --
	{
		displayName: 'Search By',
		name: 'vrboSearchBy',
		type: 'options',
		default: 'destination',
		options: [
			{ name: 'Destination', value: 'destination' },
			{ name: 'Region ID', value: 'regionId' },
		],
		displayOptions: show(['search']),
		description: 'Search a place by name, or by the exact Vrbo region ID Get Suggestions returns',
	},
	{
		displayName: 'Destination',
		name: 'vrboSearchDestination',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Destin, Florida',
		displayOptions: show(['search'], { vrboSearchBy: ['destination'] }),
		routing: { request: { body: { destination: '={{ String($value).trim() }}' } } },
		description: 'A place as you would type it on Vrbo: city, region, area or landmark',
	},
	{
		displayName: 'Region ID',
		name: 'vrboSearchRegionId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6906',
		displayOptions: show(['search'], { vrboSearchBy: ['regionId'] }),
		routing: { request: { body: { region_id: '={{ String($value).trim() }}' } } },
		description: 'A Vrbo region ID (region_id from Get Suggestions, digits)',
	},
	{
		displayName: 'Check-In',
		name: 'vrboSearchCheckIn',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2027-01-15',
		displayOptions: show(['search']),
		routing: { request: { body: { check_in: '={{ String($value).trim().slice(0, 10) }}' } } },
		description: 'Check-in date, YYYY-MM-DD (not in the past, at most 500 days ahead)',
	},
	{
		displayName: 'Check-Out',
		name: 'vrboSearchCheckOut',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2027-01-18',
		displayOptions: show(['search']),
		routing: { request: { body: { check_out: '={{ String($value).trim().slice(0, 10) }}' } } },
		description: 'Check-out date, YYYY-MM-DD (after check-in, at most 90 nights later)',
	},

	// -- Get Property --
	{
		displayName: 'Property ID or URL',
		name: 'vrboPropertyId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1046285',
		displayOptions: show(['property']),
		routing: {
			request: {
				body: {
					id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A Vrbo property ID (property_id from Search Properties, e.g. 1046285, 12245744ha or pdp/lo/30792130) or a vrbo.com property link (the link market is used unless Market is set)',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'vrboSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'destin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a traveller has typed so far (2 to 100 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'vrboSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Adults',
				name: 'vrboSearchAdults',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Adults, 1 to 30',
				routing: { request: { body: { adults: '={{ $value === 2 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Amenity',
				name: 'vrboSearchAmenity',
				type: 'options',
				default: '',
				options: anyOption(AMENITIES),
				description: "One of Vrbo's amenity filters",
				routing: { request: { body: { amenity: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Bedrooms Min',
				name: 'vrboSearchBedroomsMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 10 },
				description: "Vrbo's bedrooms filter: this many bedrooms or more, 1 to 10 (0: no minimum). Vrbo may still mix in sponsored places.",
				routing: { request: { body: { bedrooms_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Children Ages',
				name: 'vrboSearchChildren',
				type: 'string',
				default: '',
				placeholder: '5, 9',
				description: "Children's ages, comma-separated, one per child (0 to 17, at most 10 children)",
				routing: {
					request: {
						body: {
							children:
								'={{ String($value).trim() ? String($value).split(",").map((s) => s.trim()).filter((s) => s).map((s) => Number(s)) : undefined }}',
						},
					},
				},
			},
			{
				displayName: 'House Rule',
				name: 'vrboSearchHouseRule',
				type: 'options',
				default: '',
				options: anyOption(HOUSE_RULES),
				description: "One of Vrbo's house-rule filters",
				routing: { request: { body: { house_rule: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Location Type',
				name: 'vrboSearchLocationType',
				type: 'options',
				default: '',
				options: anyOption(LOCATIONS),
				description: "One of Vrbo's location filters",
				routing: { request: { body: { location_type: '={{ $value || undefined }}' } } },
			},
			marketOption('vrboSearchMarket'),
			{
				displayName: 'Pets Allowed',
				name: 'vrboSearchPetsAllowed',
				type: 'boolean',
				default: false,
				description: 'Whether to return pet-friendly places only (the same as House Rule Pets Allowed)',
				routing: { request: { body: { pets_allowed: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Premier Host',
				name: 'vrboSearchPremierHost',
				type: 'boolean',
				default: false,
				description: 'Whether to return places run by Premier Hosts only',
				routing: { request: { body: { premier_host: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Property Type',
				name: 'vrboSearchPropertyType',
				type: 'options',
				default: '',
				options: anyOption(PROPERTY_TYPES),
				description: "Vrbo's property type filter",
				routing: { request: { body: { property_type: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'vrboSearchSort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Guest Rating', value: 'review' },
					{ name: 'Most Reviewed', value: 'review_count' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Recommended', value: 'recommended' },
				],
				description: "Vrbo's own sort options",
				routing: { request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'vrboPropertyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['property']),
		options: [marketOption('vrboPropertyMarket')],
	},
	{
		displayName: 'Additional Options',
		name: 'vrboSuggestionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['suggestions']),
		options: sorted([
			{
				displayName: 'Limit',
				name: 'vrboSuggestionsLimit',
				type: 'number',
				default: 8,
				typeOptions: { minValue: 1, maxValue: 8 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 8 ? undefined : $value }}' } } },
			},
			marketOption('vrboSuggestionsMarket'),
		]),
	},
];
