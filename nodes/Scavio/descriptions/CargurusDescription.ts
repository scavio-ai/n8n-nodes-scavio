import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['cargurus'], operation, ...extra },
});

// CarGurus (cargurus.com, the car marketplace run by CarGurus, Inc., in the US, Canada and the UK),
// 8 operations, 1 credit each; credits_used is the truth. Markets us (default), us-es, ca, ca-fr, uk;
// Find Dealers takes us / us-es, Get Price Trends and Get Expert Reviews us / ca / uk, Get Research
// Page the US site only. Pages can take up to two minutes and calls can queue behind the backend's
// upstream limit, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'CarGurus (cargurus.com, the car marketplace run by CarGurus, Inc., in the US, Canada and the UK)';
const NAME = 'CarGurus';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit, also when a make or model name is resolved with a first page (credits_used says what was charged)`;
const DEAL =
	"deal_rating (GREAT_PRICE, GOOD_PRICE, FAIR_PRICE, POOR_PRICE, OVERPRICED, OUTLIER, NA) with deal_rating_label and deal_score, and expected_price with expected_price_difference (expected minus asking), are CarGurus' own price analysis as CarGurus labels it.";
const PRIVATE =
	"No VINs, stock numbers or private-seller details are returned; dealer names, addresses, phones and ratings are CarGurus' public dealer details. Reviews carry no reviewer names.";
const TILE =
	'listings with listing_id, title, name, year, make, make_id, model, model_id, trim, trim_id, body_type, condition, price (null when the listing shows no price), price_text, currency, original_price, msrp, price_with_fees, expected_price, expected_price_difference, deal_rating, deal_rating_label, deal_score, price_drop, days_on_market, mileage, mileage_unit, colours, transmission, drivetrain, engine, fuel_type, mpg, doors, options, highlights, safety_rating, ulez_compliant (uk), photo, placement, sponsored, distance, seller_type, dealer (dealer_id, name, city, region, postal code, phone, franchise, rating, URL) and URL';
const NO_DETAIL =
	'There is no listing detail operation: each listing already carries the price, expected price, deal rating, mileage, options and specs.';
const MARKETS =
	"Data comes in the market's language and currency: us (cargurus.com, USD, miles), us-es (its Spanish pages), ca (cargurus.ca, CAD, km), ca-fr (its French pages), uk (cargurus.co.uk, GBP, miles).";
const IS_URL = '/^https?:/i.test(String($value).trim())';
const ALL_MARKET_OPS = ['search', 'dealer', 'makes', 'models'];

type Pairs = Array<[string, string]>;
const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);
const byLabel = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

const marketField = (name: string, operations: string[], markets: Pairs, description: string): INodeProperties => ({
	displayName: 'Market',
	name,
	type: 'options',
	default: 'us',
	options: markets.map(([label, value]) => ({ name: label, value })).sort(byLabel),
	displayOptions: show(operations),
	routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
	description,
});

const US: [string, string] = ['United States, English (cargurus.com, USD, Miles)', 'us'];
const US_ES: [string, string] = ['United States, Spanish (USD, Miles)', 'us-es'];
const CA: [string, string] = ['Canada, English (cargurus.ca, CAD, Km)', 'ca'];
const CA_FR: [string, string] = ['Canada, French (CAD, Km)', 'ca-fr'];
const UK: [string, string] = ['United Kingdom (cargurus.co.uk, GBP, Miles)', 'uk'];

const DISTANCES = ['10', '25', '50', '75', '100', '150', '200', '250', '500'];
const distanceField = (name: string, description: string): INodeProperties => ({
	displayName: 'Distance',
	name,
	type: 'options',
	default: '',
	options: [
		{ name: 'Default (50)', value: '' },
		...DISTANCES.map((d) => ({ name: d, value: d })),
		{ name: 'Nationwide', value: 'nationwide' },
	],
	description,
	routing: {
		request: {
			body: {
				distance: '={{ $value === "" ? undefined : ($value === "nationwide" ? $value : Number($value)) }}',
			},
		},
	},
});
const DISTANCE =
	'Radius around the ZIP / postal code, as the site offers it: us / uk 10, 25, 50, 75, 100, 150, 200, 500 miles; ca 25, 50, 75, 100, 250, 500 km; or nationwide. Another value is a 400, not charged.';

const zipField = (name: string, operation: string): INodeProperties => ({
	displayName: 'ZIP or Postal Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '10001',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
	description:
		'Where to search around: a 5-digit US ZIP code (us, us-es), a Canadian postal code (ca, ca-fr, e.g. M5V 2T6) or a UK postcode (uk, e.g. M1 1AE). A malformed code answers 400, not charged.',
});

const text = (displayName: string, name: string, field: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [field]: '={{ String($value).trim() || undefined }}' } } },
});

const MAKE =
	'A make as CarGurus names it (Toyota, Ford, Mercedes-Benz) or its make_id (m7, from Get Makes). IDs differ per site (Ford is m2 on the US and Canadian sites, m273 on the UK site): names resolve to the market\'s ID.';
const MODEL =
	"A model as CarGurus names it (RAV4, F-150) or its model_id (d306, from Get Models). Needs Make. A model name is resolved from the make's models on a first CarGurus page (same 1 credit).";

const numberField = (displayName: string, name: string, field: string, description: string, maxValue?: number): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, ...(maxValue ? { maxValue } : {}) },
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

const multi = (displayName: string, name: string, field: string, values: Pairs, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'multiOptions',
	default: [],
	options: values.map(([label, value]) => ({ name: label, value })).sort(byLabel),
	description,
	routing: { request: { body: { [field]: '={{ $value && $value.length ? $value : undefined }}' } } },
});

const flag = (displayName: string, name: string, field: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'boolean',
	default: false,
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

const listingOptions = (prefix: string): INodeProperties[] => [
	text('Make', `${prefix}Make`, 'make', 'Toyota', MAKE),
	text('Model', `${prefix}Model`, 'model', 'RAV4', MODEL),
	text('Trim', `${prefix}Trim`, 'trim', 'XLE', "A trim as CarGurus names it (Search Listings' trims list). Needs Model."),
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 500 },
		description: 'Page (at most 500); 24 tiles a page',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'best_match',
		options: [
			{ name: 'Best Deals First (Used Cars)', value: 'best_deal' },
			{ name: 'Best Match', value: 'best_match' },
			{ name: 'Closest First', value: 'closest' },
			{ name: 'Listed: Newest First', value: 'listed_newest' },
			{ name: 'Listed: Oldest First', value: 'listed_oldest' },
			{ name: 'Mileage: High to Low', value: 'mileage_high' },
			{ name: 'Mileage: Low to High', value: 'mileage_low' },
			{ name: 'Model Year: Newest First', value: 'year_newest' },
			{ name: 'Model Year: Oldest First', value: 'year_oldest' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
		],
		description: "Result order (CarGurus' 11 sorts)",
		routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
	},
	numberField('Year Min', `${prefix}YearMin`, 'year_min', 'Earliest model year (0: no minimum)', 2028),
	numberField('Year Max', `${prefix}YearMax`, 'year_max', 'Latest model year (0: no maximum)', 2028),
	numberField('Min Price', `${prefix}MinPrice`, 'price_min', "Lowest price, whole units of the market's currency (0: no minimum)"),
	numberField('Max Price', `${prefix}MaxPrice`, 'price_max', "Highest price, whole units of the market's currency (0: no maximum)"),
	numberField('Min Mileage', `${prefix}MinMileage`, 'mileage_min', 'Lowest mileage, miles (km in Canada) (0: no minimum)'),
	numberField('Max Mileage', `${prefix}MaxMileage`, 'mileage_max', 'Highest mileage, miles (km in Canada) (0: no maximum)'),
	multi('Drivetrain', `${prefix}Drivetrain`, 'drivetrain', [['AWD', 'awd'], ['4WD', '4wd'], ['FWD', 'fwd'], ['RWD', 'rwd'], ['4x2', '4x2']], 'Drivetrains (empty: any)'),
	multi(
		'Color',
		`${prefix}Color`,
		'color',
		[['Black', 'black'], ['Blue', 'blue'], ['Brown', 'brown'], ['Gold', 'gold'], ['Gray', 'gray'], ['Green', 'green'], ['Orange', 'orange'], ['Pink', 'pink'], ['Purple', 'purple'], ['Red', 'red'], ['Silver', 'silver'], ['Teal', 'teal'], ['White', 'white'], ['Yellow', 'yellow']],
		'Exterior colour groups (empty: any)',
	),
	multi(
		'Body Type',
		`${prefix}BodyType`,
		'body_type',
		[['Convertible', 'convertible'], ['Coupe', 'coupe'], ['Hatchback', 'hatchback'], ['Minivan (MPV)', 'minivan'], ['Pickup', 'pickup'], ['Sedan (Saloon)', 'sedan'], ['SUV', 'suv'], ['Van', 'van'], ['Wagon (Estate)', 'wagon']],
		'Body types (empty: any)',
	),
	multi(
		'Condition',
		`${prefix}Condition`,
		'condition',
		[['Approved Used (UK)', 'approved_used'], ['Certified (Manufacturer, US / Canada)', 'certified'], ['Third-Party Certified (US / Canada)', 'third_party_certified'], ['Used (US / Canada)', 'used']],
		'Conditions (empty: any)',
	),
	multi('Seller Type', `${prefix}SellerType`, 'seller_type', [['CarGurus Partner', 'cargurus_partner'], ['Franchise Dealer', 'franchise_dealer']], 'Seller types (empty: any)'),
	multi(
		'Deal Rating',
		`${prefix}DealRating`,
		'deal_rating',
		[['Fair Price', 'fair'], ['Good Price', 'good'], ['Great Price', 'great'], ['High Price', 'high'], ['No Price Analysis', 'no_analysis'], ['Overpriced', 'overpriced'], ['Uncertain', 'uncertain']],
		"CarGurus' deal ratings (empty: any)",
	),
	multi(
		'Fuel Type',
		`${prefix}FuelType`,
		'fuel_type',
		[['Biodiesel', 'biodiesel'], ['CNG', 'cng'], ['Diesel', 'diesel'], ['Dual Fuel', 'dual_fuel'], ['Electric', 'electric'], ['Flex Fuel', 'flex_fuel'], ['Gasoline (Petrol)', 'gasoline'], ['Hybrid', 'hybrid'], ['Hydrogen', 'hydrogen']],
		'Fuel types (empty: any)',
	),
	multi('Transmission', `${prefix}Transmission`, 'transmission', [['Automatic', 'automatic'], ['Manual', 'manual']], 'Transmissions (empty: any)'),
	flag('Single Owner Only', `${prefix}SingleOwner`, 'single_owner', 'Whether to list only cars CarGurus reports as single-owner'),
	flag('No Accidents Only', `${prefix}NoAccidents`, 'no_accidents', 'Whether to list only cars with no accidents reported'),
	flag('Price Drops Only', `${prefix}PriceDrops`, 'price_drops_only', 'Whether to list only listings with a recent price drop'),
	{
		displayName: 'Other Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '',
		placeholder: '{ "hideFrameDamaged": true, "doors": [4] }',
		description:
			"Other CarGurus filters by the site's own key (facets key from Include Facets) to a value or list, up to 12 keys: daysOnMarketMin, daysOnMarketMax, minMpg, maxMpg, hideWithoutPhotos, hideFrameDamaged, hideTheft, interiorColors, hideFleet, hideLemon, hideSalvage, doors, installedOptionIds, safetyRatings, averageDealerRatings, minEVBatteryChargingTime, maxEVBatteryChargingTime, minEVBatteryRange, maxEVBatteryRange",
		routing: {
			request: {
				body: {
					filters:
						'={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
				},
			},
		},
	},
];

export const cargurusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['cargurus'] } },
		options: [
			{
				name: 'Find Dealers',
				value: 'dealers',
				action: 'Find cargurus dealers',
				description: `The dealers with listings around a US ZIP code on ${FIRST}, optionally for one make / model: count, total_listings and dealers with dealer_id (what Get Dealer takes), name, rating, distance, city, region, listing_count and URL (up to 150, as CarGurus' own dealer filter lists them). US site only (us, us-es): the Canadian and UK search pages carry no dealer list. Captured 2026-11-26: around 10001 (New York, NY, 25 miles) 150 dealers listed with 50252 listings in all. ${ONE}.`,
				routing: request('/api/v1/cargurus/dealers'),
			},
			{
				name: 'Get Dealer',
				value: 'dealer',
				action: 'Get a cargurus dealer',
				description: `One dealer on ${FIRST} by dealer ID or link: the dealer (address, sales and service phones, website, 7 days of hours, rating, review_count, social), the reviews CarGurus embeds in the page (rating, date, content, purchase status, dealer response; CarGurus has no review paging, sort or star filter; no reviewer names), the dealer's inventory paged, sorted and filtered like Search Listings, and nearby_dealers. Captured 2026-11-26: dealer 316651 in Rockville Centre, NY with 410 listings. An unknown dealer is a charged not-found. ${DEAL} ${ONE}.`,
				routing: request('/api/v1/cargurus/dealer'),
			},
			{
				name: 'Get Expert Reviews',
				value: 'expert-reviews',
				action: 'Get cargurus expert reviews',
				description: `CarGurus' expert (editorial) car reviews on ${FIRST}, 24 a page: total, page_count, has_more and reviews with title, vehicle, rating, updated_at, summary, image, author (CarGurus editors), research_id (what Get Research Page takes) and URL. Markets us, ca, uk. Captured 2026-11-26: 1683 reviews on the US site, 995 on the Canadian, 781 on the UK. ${ONE}.`,
				routing: request('/api/v1/cargurus/expert-reviews', true),
			},
			{
				name: 'Get Makes',
				value: 'makes',
				action: 'Get cargurus makes',
				description: `Every make the market's site of ${FIRST} lists in its search: count and makes with make_id, name and popular. IDs are per site (the UK site's differ). Captured 2026-11-26: 119 makes on the US site, 67 on the Canadian, 101 on the UK. ${ONE}.`,
				routing: request('/api/v1/cargurus/makes', true),
			},
			{
				name: 'Get Models',
				value: 'models',
				action: 'Get cargurus models',
				description: `The models of one make on ${FIRST} with ${NAME}' listing counts nationwide (or around a ZIP / postal code): make (ID, name), location, count and models with model_id, name, count and popular. Captured 2026-11-26: Toyota (m7) with 73 models on the US site. An unknown make ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/cargurus/models'),
			},
			{
				name: 'Get Price Trends',
				value: 'price-trends',
				action: 'Get cargurus price trends',
				description: `CarGurus' used-car price trends on ${FIRST}, for the market (the CarGurus Index, makes, body styles, market movers), a make or a model: groups (index, makes, models, model_years, body_styles) with average_price, average_price_with_fees and the change against 30, 90 and 365 days ago, series of CarGurus' daily averages, market_movers, faqs (CarGurus' text) and date_range. Markets us, ca, uk. Captured 2026-11-26: the US CarGurus Index stood at 28289 USD (28732 with fees), -1.21% against 30 days earlier. ${ONE}.`,
				routing: request('/api/v1/cargurus/price-trends', true),
			},
			{
				name: 'Get Research Page',
				value: 'research',
				action: 'Get a cargurus research page',
				description: `A model-year research page on ${FIRST} (US site), by research ID / link, or by year with make and model: trims (MSRP, engine, horsepower, drivetrain, fuel economy, seating, cargo space), pricing (original MSRP range, average listing price today, a month and a year ago, the CarGurus Index), price_series, the CarGurus test-drive review (scores, pros, cons) and owner_reviews (average rating, counts by rating, CarGurus' own summary as given, reviews without reviewer names). Captured 2026-11-26: the 2022 Toyota 4Runner (c31935), average listing 38579 USD today against 40019 a year earlier. An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/cargurus/research', true),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search cargurus listings',
				description: `Search the car listings of ${FIRST} around a ZIP / postal code / postcode with a radius, by make, model and trim (names or IDs), sorted by any of CarGurus' 11 sorts and filtered by year, price, mileage, drivetrain, colour, body type, condition, seller type, CarGurus deal rating, fuel, transmission, single owner, no accidents and recent price drops, 24 tiles a page up to page 500: location (resolved place, distance), applied_filters, total, page_count, has_more, ${TILE}, trims (with a model) and, with Include Facets, facets. Sponsored placements are inserted by CarGurus out of the requested order and flagged. ${DEAL} Captured 2026-11-26: Toyota RAV4 around 10001 resolved to New York, NY with 1107 listings; a 2024 RAV4 LE AWD at 27000 USD against an expected 27763 was rated Good Deal. ${PRIVATE} ${NO_DETAIL} ${MARKETS} ${ONE}.`,
				routing: request('/api/v1/cargurus/search'),
			},
		],
		default: 'search',
	},
];

export const cargurusFields: INodeProperties[] = [
	// -- Market --
	marketField('cargurusMarket', ALL_MARKET_OPS, [US, US_ES, CA, CA_FR, UK], `The market. ${MARKETS}`),
	marketField('cargurusDealersMarket', ['dealers'], [US, US_ES], 'The market: the Canadian and UK search pages carry no dealer list'),
	marketField('cargurusSiteMarket', ['price-trends', 'expert-reviews'], [US, CA, UK], 'The market (these pages have no Spanish or French versions)'),

	// -- Search Listings --
	zipField('cargurusSearchZip', 'search'),

	// -- Get Dealer --
	{
		displayName: 'Dealer ID or URL',
		name: 'cargurusDealer',
		type: 'string',
		required: true,
		default: '',
		placeholder: '440818',
		displayOptions: show(['dealer']),
		routing: {
			request: {
				body: {
					dealer_id: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			"A CarGurus dealer ID (dealer_id from Search Listings or Find Dealers, digits) or the dealer link (a cargurus.com, .ca or .co.uk /Cars/ dealer link; its site must match Market)",
	},

	// -- Find Dealers --
	zipField('cargurusDealersZip', 'dealers'),

	// -- Get Models --
	{
		displayName: 'Make',
		name: 'cargurusModelsMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Toyota',
		displayOptions: show(['models']),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make as CarGurus shows it (e.g. Toyota) or its make_id from Get Makes',
	},

	// -- Get Research Page --
	{
		displayName: 'Research ID or URL',
		name: 'cargurusResearch',
		type: 'string',
		default: '',
		placeholder: 'c31935',
		displayOptions: show(['research']),
		routing: {
			request: {
				body: {
					research_id: `={{ !String($value).trim() || ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A CarGurus model-year ID (c followed by digits, research_id from Get Expert Reviews or Get Price Trends) or a cargurus.com/research/ link. Leave empty to send Year, Make and Model (Additional Options) instead.',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'cargurusSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			...listingOptions('cargurusSearch'),
			distanceField('cargurusSearchDistance', DISTANCE),
			flag('Include Facets', 'cargurusSearchIncludeFacets', 'include_facets', "Whether to also return CarGurus' filters with counts for this search (still 1 credit)"),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'cargurusDealerOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealer']),
		options: sorted(listingOptions('cargurusDealer')),
	},
	{
		displayName: 'Additional Options',
		name: 'cargurusDealersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealers']),
		options: sorted([
			distanceField('cargurusDealersDistance', DISTANCE),
			text('Make', 'cargurusDealersMake', 'make', 'Toyota', MAKE),
			text('Model', 'cargurusDealersModel', 'model', 'RAV4', MODEL),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'cargurusTrendsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['price-trends']),
		options: sorted([
			text('Make', 'cargurusTrendsMake', 'make', 'Toyota', `Its price trends and its models. Empty: the market's CarGurus Index, makes and body styles. ${MAKE}`),
			text('Model', 'cargurusTrendsModel', 'model', 'RAV4', `With Make: its price trends and each model year (with research_id). ${MODEL}`),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'cargurusResearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['research']),
		options: sorted([
			numberField('Year', 'cargurusResearchYear', 'year', 'With Make and Model instead of a research ID: the model year, found through CarGurus\' price trends (same 1 credit; 0: none)', 2028),
			text('Make', 'cargurusResearchMake', 'make', 'Ford', `With Year and Model. ${MAKE}`),
			text('Model', 'cargurusResearchModel', 'model', 'F-150', `With Year and Make. ${MODEL}`),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'cargurusExpertOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['expert-reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'cargurusExpertPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page (at most 200); 24 reviews a page',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'cargurusModelsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['models']),
		options: sorted([
			{
				displayName: 'ZIP or Postal Code',
				name: 'cargurusModelsZip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description: "Count listings around this place instead of nationwide (a code matching the market)",
				routing: { request: { body: { zip: '={{ String($value).trim() || undefined }}' } } },
			},
			distanceField('cargurusModelsDistance', `${DISTANCE} Needs a ZIP or postal code.`),
		]),
	},
];
