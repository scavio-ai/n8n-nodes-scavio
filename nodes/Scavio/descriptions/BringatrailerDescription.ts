import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bringatrailer'], operation, ...extra },
});

// Bring a Trailer (bringatrailer.com, the online collector-car auction site owned by Hearst),
// 8 operations, 1 credit each; credits_used is the truth. One site (no country); amounts in each
// lot's own currency. Get Live Auctions reads every live lot in one call (20 seconds to 3
// minutes) and calls can queue behind the backend's upstream limit, so every operation carries
// a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'Bring a Trailer (bringatrailer.com, the online collector-car auction site owned by Hearst)';
const NAME = 'Bring a Trailer';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const CUR = "Amounts are in each lot's own currency (USD, EUR, GBP and others, as the site shows it).";
const PRIV = 'No usernames, member profile links, chassis numbers / VINs or seller ZIP codes are returned.';
const LOTS =
	"lots with ID, title, URL, slug (what Get Listing takes), year, status (sold, reserve_not_met, withdrawn, ended), amount (the sale price of a sold lot, the high bid of a lot that ended under its reserve), currency, ended_at, no_reserve, premium, bat_alumni, country_code, thumbnail and excerpt";
const LIVE =
	'live lots with ID, title, URL, slug, year, current_bid (null before any bid), currency, ends_at, no_reserve, premium, bat_alumni, country, country_code, thumbnail and excerpt';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const CATEGORIES: Array<[number, string]> = [
	[543, 'Aircraft'], [431, 'All-Terrain Vehicles'], [383, 'Boats'], [415, 'Charity & Non-Profit'],
	[434, 'Convertibles'], [560, 'Diesels'], [426, 'Electric Vehicles'], [428, 'Go-Karts'],
	[429, 'Hot Rods'], [556, 'Kei Vehicles'], [447, 'Military Vehicles'], [430, 'Minibikes & Scooters'],
	[70, 'Motorcycles'], [379, 'Parts'], [10, 'Projects'], [11, 'Race Cars'], [557, 'Right-Hand Drive'],
	[436, 'RVs & Campers'], [479, 'Service Vehicles'], [553, 'Side-by-Sides'], [433, 'Station Wagons'],
	[432, 'Tractors'], [544, 'Trains'], [21, 'Truck & 4x4'], [418, 'Vans'], [380, 'Wheels'],
];
const ORIGINS: Array<[number, string]> = [
	[3, 'American'], [499, 'Brazilian'], [4, 'British'], [498, 'Canadian'], [542, 'Czech'], [497, 'Dutch'],
	[6, 'French'], [7, 'German'], [8, 'Italian'], [9, 'Japanese'], [496, 'Korean'], [441, 'Prewar'],
	[82, 'Spanish'], [18, 'Swedish'],
];
const ERAS = ['2020', '2010', '2000', '1990', '1980', '1970', '1960', '1950', '1940', '1930', '1920', '1910', '1900', 'pre-1900'];
const MAX_BIDS = [10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000];

const byOptionName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

const RECENCY_OPTION = (name: string): INodeProperties => ({
	displayName: 'Ended Within',
	name,
	type: 'options',
	default: '',
	options: [
		{ name: 'All Time', value: '' },
		{ name: 'Last 1 Year', value: '1y' },
		{ name: 'Last 2 Years', value: '2y' },
		{ name: 'Last 30 Days', value: '30d' },
		{ name: 'Last 5 Years', value: '5y' },
		{ name: 'Last 7 Days', value: '7d' },
	],
	description: 'Only results that ended in this window',
	routing: { request: { body: { recency: '={{ $value || undefined }}' } } },
});

const yearOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Year Min',
		name: `${prefix}YearMin`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 2027 },
		description: 'Earliest model year, 1885-2027 (0: no minimum)',
		routing: { request: { body: { year_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Year Max',
		name: `${prefix}YearMax`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 2027 },
		description: 'Latest model year, 1885-2027 (0: no maximum)',
		routing: { request: { body: { year_max: '={{ $value || undefined }}' } } },
	},
];

const idList =
	'={{ String($value).trim() ? String($value).split(",").map((s) => s.trim()).filter((s) => s) : undefined }}';

export const bringatrailerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bringatrailer'] } },
		options: [
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a bring a trailer listing',
				description: `One auction on ${NAME} by slug or link, live or ended: lot_number, status (live, sold, reserve_not_met, withdrawn, ended), current_bid, sold_price (the site's Sold for figure), high_bid, ends_at or ended_at, bid_count, comment_count, views, watchers, location (city, region, country; no ZIP), seller_type (private party or dealer), the Listing Details bullets (without the chassis number), categories, description, photos, earlier ${NAME} results of the same vehicle, the full bid history (amount, currency, time) and paged comments (time, text, is_seller, likes). Captured 2026-11-26: a 1988 BMW M3 sold for 80000 USD after 29 bids; a Euro 1994 BMW 850CSi sold for 109000 EUR. ${PRIV} An unknown slug is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/bringatrailer/listing'),
			},
			{
				name: 'Get Live Auctions',
				value: 'live',
				action: 'Get bring a trailer live auctions',
				description: `Every live auction on ${FIRST} (about 1,000 lots, read in one call that takes 20 seconds to 3 minutes), filtered by Scavio by keyword, make, country, ending within N hours, no reserve and Premium, sorted by ending time or current bid, paged: total_live, total, has_more and ${LIVE}. Captured 2026-11-26: 1073 live lots. ${CUR} ${ONE}.`,
				routing: request('/api/v1/bringatrailer/live', true),
			},
			{
				name: 'Get Location',
				value: 'location',
				action: 'Get a bring a trailer location',
				description: `The lots of ${FIRST} located in one country: location_id (what Search Auction Results takes), live_count, ${LIVE}, completed_total and recent results. Captured 2026-11-26: Germany (location ID 89009067) had 3 live auctions and 250 completed results. An unknown country is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/bringatrailer/location'),
			},
			{
				name: 'Get Make',
				value: 'make',
				action: 'Get a bring a trailer make',
				description: `One make page of ${FIRST}: description, filter make (for Search Auction Results and Get Price History), model_count, models (ID, title, URL, path, year range, image), live_count, ${LIVE}, completed_total and recent results. A make page can take up to a minute. Captured 2026-11-26: BMW listed 143 models, 68 live auctions and 22576 completed results. An unknown make is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/bringatrailer/make'),
			},
			{
				name: 'Get Model',
				value: 'model',
				action: 'Get a bring a trailer model',
				description: `One model page of ${FIRST} (e.g. bmw/e30-m3, or a family such as porsche/911): filter_ids (the model IDs Search Auction Results and Get Price History take), sub_models, live_count, ${LIVE}, completed_total and recent results. Captured 2026-11-26: bmw/e30-m3 had 2 live auctions and 491 completed results. An unknown model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/bringatrailer/model'),
			},
			{
				name: 'Get Price History',
				value: 'price-history',
				action: 'Get bring a trailer price history',
				description: `Every completed result of one model (model ID, or a list of IDs for a model family) or make on ${FIRST} in one call: total, sold_count, reserve_not_met_count, sell_through_rate, first and last date, stats per currency (sold and reserve-not-met count, min, max, median, average; at most 10,000 results, capped says so) and the results newest to oldest (date, amount, currency, sold, status). Captured 2026-11-26: the BMW E30 M3 (model ID 1833018) over the last year had 70 results, 58 sold, median sold price 59250 USD. ${CUR} ${ONE}.`,
				routing: request('/api/v1/bringatrailer/price-history'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get bring a trailer suggestions',
				description: `The search-box suggestions of ${FIRST} for a partial make, model or place: ID (the page ID Search Auction Results takes as model ID or location ID), title, type (make, model, location, other), URL and path. ${ONE}.`,
				routing: request('/api/v1/bringatrailer/suggestions'),
			},
			{
				name: 'Search Auction Results',
				value: 'results',
				action: 'Search bring a trailer auction results',
				description: `Search the completed auctions of ${FIRST}: keywords (or none), the site's sorts (recently closed, popular, highest bid, oldest) and filters (sold or reserve not met, recency, model years, max bid, category, origin, era, no reserve, Premium, and one make, model ID or location ID), up to 60 a page through the first 10,000 results of a query: total, total_pages, reachable_pages, has_more and ${LOTS}. View, watcher and comment counts are on Get Listing. Captured 2026-11-26: "e30 m3" matched 439 completed results. ${CUR} ${ONE}.`,
				routing: request('/api/v1/bringatrailer/results', true),
			},
		],
		default: 'results',
	},
];

export const bringatrailerFields: INodeProperties[] = [
	// -- Get Listing --
	{
		displayName: 'Listing Slug or URL',
		name: 'bringatrailerListing',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1988-bmw-m3-272-2',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A listing slug (the slug Search Auction Results returns) or a bringatrailer.com/listing/ link',
	},

	// -- Get Price History --
	{
		displayName: 'Find By',
		name: 'bringatrailerHistoryBy',
		type: 'options',
		default: 'model_id',
		options: [
			{ name: 'Make', value: 'make' },
			{ name: 'Model ID', value: 'model_id' },
		],
		displayOptions: show(['price-history']),
		description: 'One model (or model family) by page ID, or a whole make',
	},
	{
		displayName: 'Model IDs',
		name: 'bringatrailerHistoryModelIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1833018',
		displayOptions: show(['price-history'], { bringatrailerHistoryBy: ['model_id'] }),
		routing: { request: { body: { model_id: idList } } },
		description:
			'A model page ID (from Get Suggestions or Get Make models, e.g. 1833018 = BMW E30 M3), or up to 200 comma-separated IDs (Get Model filter_ids, for a model family)',
	},
	{
		displayName: 'Make',
		name: 'bringatrailerHistoryMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Porsche',
		displayOptions: show(['price-history'], { bringatrailerHistoryBy: ['make'] }),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make name as the site lists it: its results, at most the 10,000 most recent',
	},

	// -- Get Make --
	{
		displayName: 'Make',
		name: 'bringatrailerMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bmw',
		displayOptions: show(['make']),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make slug or name (bmw, porsche, land-rover, Land Rover) or its bringatrailer.com link',
	},

	// -- Get Model --
	{
		displayName: 'Model Path',
		name: 'bringatrailerModel',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bmw/e30-m3',
		displayOptions: show(['model']),
		routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
		description: 'A make and model path (Get Make models path, e.g. bmw/e30-m3 or porsche/911) or its bringatrailer.com link',
	},

	// -- Get Location --
	{
		displayName: 'Country',
		name: 'bringatrailerLocationCountry',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'germany',
		displayOptions: show(['location']),
		routing: { request: { body: { country: '={{ String($value).trim() }}' } } },
		description: 'A country name or slug (germany, united-kingdom, Italy) or its bringatrailer.com/location/ link',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'bringatrailerSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'land cruiser',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
		description: 'A partial make, model or place',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'bringatrailerResultsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['results']),
		options: sorted([
			{
				displayName: 'Keywords',
				name: 'bringatrailerResultsQuery',
				type: 'string',
				default: '',
				placeholder: 'e30 m3',
				description: 'Keywords (empty: every completed result; filters and sort still apply)',
				routing: { request: { body: { q: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Exclude Words',
				name: 'bringatrailerResultsExclude',
				type: 'string',
				default: '',
				placeholder: 'parts',
				description: 'Leave out results matching these words',
				routing: { request: { body: { exclude: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'bringatrailerResultsSort',
				type: 'options',
				default: 'recently_closed',
				options: [
					{ name: 'Highest Bid', value: 'highest_bid' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Popular', value: 'popular' },
					{ name: 'Recently Closed', value: 'recently_closed' },
				],
				description: "The site's own result order",
				routing: { request: { body: { sort: '={{ $value === "recently_closed" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Status',
				name: 'bringatrailerResultsStatus',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Reserve Not Met', value: 'reserve_not_met' },
					{ name: 'Sold', value: 'sold' },
				],
				description: 'Sold lots, lots that ended under the reserve, or both',
				routing: { request: { body: { status: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			RECENCY_OPTION('bringatrailerResultsRecency'),
			...yearOptions('bringatrailerResults'),
			{
				displayName: 'Max Bid',
				name: 'bringatrailerResultsMaxBid',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					...MAX_BIDS.map((b) => ({ name: `Less Than ${b.toLocaleString('en-US')}`, value: b })),
				],
				description: "Only results below this amount, one of the site's steps",
				routing: { request: { body: { max_bid: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Category',
				name: 'bringatrailerResultsCategory',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					...CATEGORIES.map(([id, name]) => ({ name, value: id })).sort(byOptionName),
				],
				description: "One of the site's categories",
				routing: { request: { body: { category: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Origin',
				name: 'bringatrailerResultsOrigin',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					...ORIGINS.map(([id, name]) => ({ name, value: id })).sort(byOptionName),
				],
				description: "One of the site's origins",
				routing: { request: { body: { origin: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Era',
				name: 'bringatrailerResultsEra',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					...ERAS.map((e) => ({ name: e === 'pre-1900' ? 'Pre-1900' : `${e}s`, value: e })).sort(byOptionName),
				],
				description: 'A decade',
				routing: { request: { body: { era: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'No Reserve Only',
				name: 'bringatrailerResultsNoReserve',
				type: 'boolean',
				default: false,
				description: 'Whether to return only no-reserve auctions (not together with Premium Only: the site applies the two as either-or)',
				routing: { request: { body: { no_reserve: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Premium Only',
				name: 'bringatrailerResultsPremium',
				type: 'boolean',
				default: false,
				description: 'Whether to return only Premium listings (not together with No Reserve Only)',
				routing: { request: { body: { premium: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Make',
				name: 'bringatrailerResultsMake',
				type: 'string',
				default: '',
				placeholder: 'BMW',
				description: 'A make name as the site lists it (Get Make filter make). Use one of Make, Model IDs or Location ID.',
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Model IDs',
				name: 'bringatrailerResultsModelIds',
				type: 'string',
				default: '',
				placeholder: '1833018',
				description: 'A model page ID (from Get Suggestions or Get Make), or up to 200 comma-separated IDs (Get Model filter_ids)',
				routing: { request: { body: { model_id: idList } } },
			},
			{
				displayName: 'Location ID',
				name: 'bringatrailerResultsLocationId',
				type: 'string',
				default: '',
				placeholder: '89009067',
				description: 'A location page ID (Get Location location_id or a location suggestion ID, e.g. 89009067 = Germany): only lots located there',
				routing: { request: { body: { location_id: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'bringatrailerResultsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 5000 },
				description: 'Page; page x page size at most 10,000 (the site pages through the first 10,000 results of a query)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'bringatrailerResultsPageSize',
				type: 'number',
				default: 36,
				typeOptions: { minValue: 1, maxValue: 60 },
				description: 'Results per page, 1-60',
				routing: { request: { body: { page_size: '={{ $value === 36 ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'bringatrailerHistoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['price-history']),
		options: sorted([RECENCY_OPTION('bringatrailerHistoryRecency'), ...yearOptions('bringatrailerHistory')]),
	},
	{
		displayName: 'Additional Options',
		name: 'bringatrailerListingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['listing']),
		options: sorted([
			{
				displayName: 'Comments Page',
				name: 'bringatrailerListingCommentsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page of the comments',
				routing: { request: { body: { comments_page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Comments Page Size',
				name: 'bringatrailerListingCommentsPageSize',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Comments per page, 1-500',
				routing: { request: { body: { comments_page_size: '={{ $value === 100 ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'bringatrailerLiveOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['live']),
		options: sorted([
			{
				displayName: 'Keywords',
				name: 'bringatrailerLiveQuery',
				type: 'string',
				default: '',
				placeholder: 'land cruiser',
				description: 'Words in the lot title or excerpt',
				routing: { request: { body: { q: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Make',
				name: 'bringatrailerLiveMake',
				type: 'string',
				default: '',
				placeholder: 'Porsche',
				description: 'A make, matched in the lot title',
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Country',
				name: 'bringatrailerLiveCountry',
				type: 'string',
				default: '',
				placeholder: 'DE',
				description: 'Country of the lot: a two-letter code (US, DE, GB) or a country name as listed (United Kingdom)',
				routing: { request: { body: { country: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Ending Within Hours',
				name: 'bringatrailerLiveEndingWithin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 336 },
				description: 'Only auctions scheduled to end within this many hours, 1-336 (0: any)',
				routing: { request: { body: { ending_within_hours: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'No Reserve Only',
				name: 'bringatrailerLiveNoReserve',
				type: 'boolean',
				default: false,
				description: 'Whether to return only no-reserve auctions',
				routing: { request: { body: { no_reserve: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Premium Only',
				name: 'bringatrailerLivePremium',
				type: 'boolean',
				default: false,
				description: 'Whether to return only Premium listings',
				routing: { request: { body: { premium: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'bringatrailerLiveSort',
				type: 'options',
				default: 'ending_soon',
				options: [
					{ name: 'Current Bid: High to Low', value: 'bid_high' },
					{ name: 'Current Bid: Low to High', value: 'bid_low' },
					{ name: 'Ending Latest', value: 'ending_latest' },
					{ name: 'Ending Soonest', value: 'ending_soon' },
				],
				description: 'Lot order',
				routing: { request: { body: { sort: '={{ $value === "ending_soon" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'bringatrailerLiveLimit',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 2000 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value === 100 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'bringatrailerLivePage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page of the filtered list',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		]),
	},
];
