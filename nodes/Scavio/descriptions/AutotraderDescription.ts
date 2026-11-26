import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['autotrader'], operation, ...extra },
});

// Autotrader (autotrader.com, the US car marketplace run by Cox Automotive), 5 operations, 2 credits
// each; credits_used is the truth. US only (no country). Search Listings and Find Dealers need a US
// ZIP. Answers can take up to 4 minutes, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Autotrader (autotrader.com, the US car marketplace run by Cox Automotive)';
const NAME = 'Autotrader';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const TWO = `${CHARGE} Costs 2 credits (credits_used says what was charged)`;
const DEAL =
	"deal_label is Autotrader's own label (Great, Good) as Autotrader gives it, based on the Kelley Blue Book Fair Purchase Price range: kbb_fair_purchase_price (amount, low, high, delta: that price minus the listing price, negative = above it), as given.";
const PRIVATE =
	'Private sellers: seller is type private, city, state and distance_miles only (no name, phone or street address). VINs and stock numbers are never returned; phone numbers, emails, stock numbers and VIN-like codes inside descriptions read "[removed]".';
const TILE =
	'listings with listing_id (what Get Listing takes), URL, title, year, make, make_code, model, model_code, trim, trim_code, listing_type (new, used, certified, third_party_certified), mileage, colours, body_style, drivetrain, engine, fuel, transmission, mpg_city, mpg_highway, doors, days_on_site, newly_listed, reduced_price, price (USD; null when the dealer asks you to call: price_label), display_price, msrp, deal_label, kbb_fair_purchase_price, dealer_fees, price_history, history_preview (Autotrader\'s history flags as given), warranties, image, sponsored and seller (a dealer with dealer_id, name, rating, rating_count, city, state, distance_miles, URL; or a private seller)';
const NOT_AVAILABLE =
	'Not available: VINs, stock numbers, private sellers\' names or contact details, dealer reviews (rating and rating count only), autotrader.co.uk or autotrader.ca (separate sites), more than 100 pages of a search.';
const IS_URL = '/^https?:/i.test(String($value).trim())';

type Codes = Array<[string, string]>;
const BODY_STYLES: Codes = [['CONVERT', 'Convertible'], ['COUPE', 'Coupe'], ['HATCH', 'Hatchback'], ['SEDAN', 'Sedan'], ['SUVCROSS', 'SUV / Crossover'], ['TRUCKS', 'Truck'], ['VANMV', 'Van / Minivan'], ['WAGON', 'Wagon']];
const DRIVETRAINS: Codes = [['AWD4WD', 'AWD/4WD'], ['FWD', 'Front Wheel Drive'], ['RWD', 'Rear Wheel Drive']];
const COLORS: Codes = [['BEIGE', 'Beige'], ['BLACK', 'Black'], ['BLUE', 'Blue'], ['BROWN', 'Brown'], ['BURGUNDY', 'Burgundy'], ['CHARCOAL', 'Charcoal'], ['GOLD', 'Gold'], ['GRAY', 'Gray'], ['GREEN', 'Green'], ['OFFWHITE', 'Off White'], ['ORANGE', 'Orange'], ['PINK', 'Pink'], ['PURPLE', 'Purple'], ['RED', 'Red'], ['SILVER', 'Silver'], ['TAN', 'Tan'], ['TURQUOISE', 'Turquoise'], ['WHITE', 'White'], ['YELLOW', 'Yellow']];
const FUELS: Codes = [['GSL', 'Gasoline'], ['DSL', 'Diesel'], ['HYB', 'Hybrid'], ['ELE', 'Electric'], ['HYD', 'Hydrogen'], ['PIH', 'Plug-in Hybrid']];
const TRANSMISSIONS: Codes = [['AUT', 'Automatic'], ['MAN', 'Manual']];
const HISTORY: Codes = [['NO_ACCIDENTS', 'No Accidents'], ['ONE_OWNER', 'Single Owner'], ['CLEAN_TITLE', 'Clean Title'], ['NO_FRAME_DAMAGE', 'No Frame Damage'], ['FREE_REPORT', 'Free Report']];
const FEATURES: Codes = [
	['1062', 'Keyless Entry'], ['1317', 'Premium Wheels'], ['1172', 'Roof Rack'], ['1199', 'Trailer Hitch'], ['AT0001', 'Dual Rear Wheels'], ['1318', 'Disability Equipped'],
	['1327', 'Android Auto'], ['1326', 'Apple CarPlay'], ['1211', 'Bluetooth, Hands-Free'], ['1033', 'Cruise Control'], ['1297', 'DVD Player'], ['1066', 'Navigation'],
	['1230', 'Portable Audio Connection'], ['1136', 'Premium Audio'], ['1149', 'Satellite Radio'], ['1161', 'Steering Wheel Controls'], ['1221', 'Remote Engine Start'],
	['1313', 'Adaptive Cruise Control'], ['1298', 'Heads Up Display'], ['1160', 'Rain Sensing Wipers'], ['1229', 'Keyless Start'], ['1180', 'Parking Assist'], ['1331', 'WiFi Hotspot'],
	['1306', '3rd Row Seats'], ['1319', 'Heated Seats'], ['1078', 'Leather Seats'], ['1132', 'Sunroof'], ['1224', 'Backup Camera'], ['1142', 'Night Vision'],
	['1310', 'Lane Departure Warning'], ['1309', 'Blind Spot Monitor'], ['1330', 'Cross Traffic Alert'], ['1228', 'Brake Assist'], ['1013', 'Security System'],
];
const DOORS: Codes = [['2', 'Two Door'], ['3', 'Three Door'], ['4', 'Four Door'], ['5', 'Five Door']];
const SEATING = ['2', '3', '4', '5', '6', '7', '8+'];
const RADII = [10, 25, 50, 75, 100, 200, 300, 400, 500];
const DEALER_RADII = [10, 25, 50, 75, 100, 200, 300, 500];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);
const byLabel = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

const codeSelect = (displayName: string, name: string, field: string, codes: Codes, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'options',
	default: '',
	options: [{ name: 'Any', value: '' }, ...codes.map(([value, label]) => ({ name: label, value })).sort(byLabel)],
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

const numberField = (displayName: string, name: string, field: string, description: string, maxValue?: number): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, ...(maxValue ? { maxValue } : {}) },
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

const zipField = (name: string, operation: string): INodeProperties => ({
	displayName: 'ZIP Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '90012',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
	description:
		'A 5-digit US ZIP code: Autotrader lists cars around it. An unknown ZIP answers 400, not charged.',
});

const makeField = (name: string, description: string): INodeProperties => ({
	displayName: 'Make',
	name,
	type: 'string',
	default: '',
	placeholder: 'Honda',
	description: `${description} By name or Autotrader code (Toyota, Ford, Mercedes-Benz, Land Rover, or MB, ROV; 72 makes)`,
	routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
});

const searchOptions: INodeProperties[] = sorted([
	makeField('autotraderSearchMake', 'A make.'),
	{
		displayName: 'Model',
		name: 'autotraderSearchModel',
		type: 'string',
		default: '',
		placeholder: 'Civic',
		description:
			"A model as Autotrader names it (Civic, F150, RAV4, C-Class) or its model code (model_code, or a model code from Get Make Models). Needs Make. A different spelling (F-150) is matched to Autotrader's name; a model Autotrader does not list for the make is a charged not-found that lists the make's models.",
		routing: { request: { body: { model: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Trim Code',
		name: 'autotraderSearchTrimCode',
		type: 'string',
		default: '',
		placeholder: 'CIVIC|LX',
		description: 'A trim as trim_code gives it (MODEL|Trim). Needs Make and Model.',
		routing: { request: { body: { trim_code: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Radius (Miles)',
		name: 'autotraderSearchRadius',
		type: 'options',
		default: -1,
		options: [
			{ name: "Autotrader's Default", value: -1 },
			{ name: 'Nationwide', value: 0 },
			...RADII.map((r) => ({ name: `${r} Miles`, value: r })),
		],
		description: "Miles around the ZIP. location.radius_miles says which radius Autotrader applied.",
		routing: { request: { body: { radius: '={{ $value === -1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page',
		name: 'autotraderSearchPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Page (at most 100)',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'autotraderSearchPageSize',
		type: 'options',
		default: 25,
		options: [
			{ name: '100 Listings', value: 100 },
			{ name: '25 Listings', value: 25 },
		],
		description: 'Listings a page',
		routing: { request: { body: { page_size: '={{ $value === 25 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'autotraderSearchSort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Distance: Nearest First', value: 'distance_asc' },
			{ name: 'Mileage: Lowest First', value: 'mileage_asc' },
			{ name: 'Model Year: Newest First', value: 'year_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: 'Result order',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	numberField('Year Min', 'autotraderSearchYearMin', 'year_min', 'Earliest model year, 1900-2028 (0: no minimum)', 2028),
	numberField('Year Max', 'autotraderSearchYearMax', 'year_max', 'Latest model year, 1900-2028 (0: no maximum)', 2028),
	numberField('Min Price', 'autotraderSearchMinPrice', 'price_min', 'Lowest price, whole USD (0: no minimum)'),
	numberField('Max Price', 'autotraderSearchMaxPrice', 'price_max', 'Highest price, whole USD (0: no maximum)'),
	numberField('Min Mileage', 'autotraderSearchMinMileage', 'mileage_min', 'Fewest miles (0: no minimum)'),
	numberField('Max Mileage', 'autotraderSearchMaxMileage', 'mileage_max', 'Most miles (0: no maximum)'),
	codeSelect('Body Style', 'autotraderSearchBodyStyle', 'body_style', BODY_STYLES, 'Body style'),
	codeSelect('Drivetrain', 'autotraderSearchDrivetrain', 'drivetrain', DRIVETRAINS, 'Drivetrain'),
	codeSelect('Exterior Color', 'autotraderSearchExteriorColor', 'exterior_color', COLORS, 'Exterior colour'),
	codeSelect('Interior Color', 'autotraderSearchInteriorColor', 'interior_color', COLORS, 'Interior colour'),
	codeSelect('Fuel', 'autotraderSearchFuel', 'fuel', FUELS, 'Fuel type'),
	codeSelect('Transmission', 'autotraderSearchTransmission', 'transmission', TRANSMISSIONS, 'Transmission'),
	codeSelect('Vehicle History', 'autotraderSearchHistory', 'history', HISTORY, 'Vehicle history as Autotrader filters it'),
	codeSelect('Feature', 'autotraderSearchFeature', 'feature', FEATURES, 'One feature'),
	codeSelect('Doors', 'autotraderSearchDoors', 'doors', DOORS, 'Doors'),
	codeSelect('Seats', 'autotraderSearchSeating', 'seating', SEATING.map((s) => [s, s] as [string, string]), 'Seats'),
	{
		displayName: 'Seller Type',
		name: 'autotraderSearchSellerType',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Dealer', value: 'dealer' },
			{ name: 'Private Seller', value: 'private' },
		],
		description: 'Dealer or private seller',
		routing: { request: { body: { seller_type: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Listing Type',
		name: 'autotraderSearchListingType',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Certified (Manufacturer Certified Pre-Owned)', value: 'certified' },
			{ name: 'New', value: 'new' },
			{ name: 'Third-Party Certified', value: 'third_party_certified' },
			{ name: 'Used', value: 'used' },
		],
		description: 'New, used or certified',
		routing: { request: { body: { listing_type: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Deal',
		name: 'autotraderSearchDeal',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Good Price', value: 'good' },
			{ name: 'Great Price', value: 'great' },
		],
		description:
			'Only listings Autotrader labels a Good Price or Great Price deal (based on the Kelley Blue Book Fair Purchase Price range)',
		routing: { request: { body: { deal: '={{ $value || undefined }}' } } },
	},
]);

export const autotraderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['autotrader'] } },
		options: [
			{
				name: 'Find Dealers',
				value: 'dealers',
				action: 'Find autotrader dealers',
				description: `Car dealers near a US ZIP code on ${FIRST}, optionally of one make, within a radius, and with cars in a price or model-year range: location (ZIP, place, radius_miles), count and dealers with dealer_id (what Get Dealer takes), name, franchise_name, make, rating, rating_count, distance_miles, address, phone, website and URL (the first 50, nearest first as Autotrader orders them; the dealer finder does not page, so narrow with radius or make). Dealer details are the dealer's public business details. Captured 2026-11-26: Ford dealers around 75201 resolved to Dallas, TX (50 miles), 50 dealers. ${TWO}.`,
				routing: request('/api/v1/autotrader/dealers'),
			},
			{
				name: 'Get Dealer',
				value: 'dealer',
				action: 'Get an autotrader dealer',
				description: `One dealer on ${FIRST} by dealer ID or link: name, rating, rating_count, address, phone, website, hours, home_services (buy online, test drive, vehicle delivery, virtual tour), is_open, URL, inventory_count (the dealer's listings on ${NAME}), makes with counts, and the first page of the dealer's inventory, lowest price first, with the search listing fields. Dealer reviews are not included (rating and rating count only). Captured 2026-11-26: dealer 87788, an Irving, TX Ford dealer rated 4.6 from 5621 ratings, with 496 listings. An unknown ID is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/autotrader/dealer'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get an autotrader listing',
				description: `One car listing on ${FIRST} by listing ID or link: the search listing fields plus description, images, features, ranked_features, specifications, warranties (with remaining years and miles), kbb_consumer_rating and kbb_consumer_review_count (Kelley Blue Book owner ratings for the model), price_history, deal_label with deal_basis, and the dealer (address, phone, website, hours, home services; null for a private seller). ${DEAL} Captured 2026-11-26: a used 2016 Ford F150 XLT at 22175 USD with 76887 miles from a Mesquite, TX dealer, labelled Great against a KBB Fair Purchase Price of 23600 (range 22600-24650). ${PRIVATE} A sold or removed listing is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/autotrader/listing'),
			},
			{
				name: 'Get Make Models',
				value: 'makes',
				action: 'Get autotrader make models',
				description: `One make's models on ${FIRST}: make (code, name), years, popular_models, count and models with code, name, years, price_by_year (the price range label the page gives per model year), mpg_by_year, body_style, image and search_model (the model name Search Listings takes). Captured 2026-11-26: Toyota with 46 models and model years 1989-2027. ${NOT_AVAILABLE} ${TWO}.`,
				routing: request('/api/v1/autotrader/makes'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search autotrader listings',
				description: `Search the cars for sale on ${FIRST} around a US ZIP code with a radius, by make, model and trim, sorted (relevance, price, mileage, model year, distance) and filtered (model year, price, mileage, body style, drivetrain, colours, dealer or private seller, new / used / certified, fuel, transmission, vehicle history, Good or Great deal, a feature, doors, seats), 25 or 100 a page up to page 100: location (ZIP, place, radius_miles), filters_applied, filters_not_applied, total, total_pages, has_more, ${TILE}, spotlights (Autotrader's paid Spotlight placements, sponsored) and stats (price, mileage and year min / avg / max for the whole result set). ${DEAL} Captured 2026-11-26: Honda Civic around 90012 resolved to Los Angeles, CA (25 miles) with 1882 listings; a used 2018 Civic LX at 18881 USD was labelled Great against a KBB Fair Purchase Price of 19440 (range 18690-20140). ${PRIVATE} ${TWO}.`,
				routing: request('/api/v1/autotrader/search'),
			},
		],
		default: 'search',
	},
];

export const autotraderFields: INodeProperties[] = [
	// -- Search Listings --
	zipField('autotraderSearchZip', 'search'),

	// -- Get Listing --
	{
		displayName: 'Listing ID or URL',
		name: 'autotraderListing',
		type: 'string',
		required: true,
		default: '',
		placeholder: '795241382',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					listing_id: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'An Autotrader listing ID (listing_id from Search Listings, digits) or the listing link (an autotrader.com/cars-for-sale/vehicle/ link)',
	},

	// -- Find Dealers --
	zipField('autotraderDealersZip', 'dealers'),

	// -- Get Dealer --
	{
		displayName: 'Dealer ID or URL',
		name: 'autotraderDealer',
		type: 'string',
		required: true,
		default: '',
		placeholder: '87788',
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
			'An Autotrader dealer ID (dealer_id from Find Dealers or a listing\'s seller, digits) or the dealer link (an autotrader.com/car-dealers/ link)',
	},

	// -- Get Make Models --
	{
		displayName: 'Make',
		name: 'autotraderMakesMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Toyota',
		displayOptions: show(['makes']),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make by name or Autotrader code (Toyota, Ford, Mercedes-Benz, or MB; 72 makes)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'autotraderSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: searchOptions,
	},
	{
		displayName: 'Additional Options',
		name: 'autotraderListingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['listing']),
		options: [
			{
				displayName: 'ZIP Code',
				name: 'autotraderListingZip',
				type: 'string',
				default: '',
				placeholder: '75201',
				description:
					'The distance (seller.distance_miles) is measured from this US ZIP code; without it distance_miles is null',
				routing: { request: { body: { zip: '={{ String($value).trim() || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'autotraderDealersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealers']),
		options: sorted([
			makeField('autotraderDealersMake', "Only dealers of this make (Autotrader's franchise filter)."),
			{
				displayName: 'Radius (Miles)',
				name: 'autotraderDealersRadius',
				type: 'options',
				default: -1,
				options: [
					{ name: "Autotrader's Default", value: -1 },
					{ name: 'Any Distance', value: 0 },
					...DEALER_RADII.map((r) => ({ name: `${r} Miles`, value: r })),
				],
				description: 'Miles around the ZIP',
				routing: { request: { body: { radius: '={{ $value === -1 ? undefined : $value }}' } } },
			},
			numberField('Min Price', 'autotraderDealersMinPrice', 'price_min', 'Dealers with cars from this price, whole USD (0: no minimum)'),
			numberField('Max Price', 'autotraderDealersMaxPrice', 'price_max', 'Dealers with cars up to this price, whole USD (0: no maximum)'),
			numberField('Year Min', 'autotraderDealersYearMin', 'year_min', 'Dealers with cars from this model year, 1900-2028 (0: no minimum)', 2028),
			numberField('Year Max', 'autotraderDealersYearMax', 'year_max', 'Dealers with cars up to this model year, 1900-2028 (0: no maximum)', 2028),
		]),
	},
];
