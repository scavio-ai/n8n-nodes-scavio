import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['kbb'], operation, ...extra },
});

// Kelley Blue Book (kbb.com, Cox Automotive's car value and research site), 8 operations, US only,
// USD (no country input). 1 credit a call; Get Car Value with a ZIP code 2 (up to 6), Get Reviews
// past page 1, with another sort or a star filter 1 or 5; credits_used is the truth. Answers can
// take up to 4 minutes, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST = "Kelley Blue Book (kbb.com, Cox Automotive's car value and research site)";
const NAME = 'Kelley Blue Book';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_VIN = 'No VIN or stock number is returned.';
const PRIVATE =
	'Private sellers carry their city, state and distance only (no name, phone or street address).';
const DEAL =
	"deal_label is Kelley Blue Book's deal rating (Great, Good ...) as KBB gives it, based on the Kelley Blue Book Fair Purchase Price range (kbb_fair_purchase_price with amount, low, high and delta).";
const TILE =
	'listing_id (what Get Listing takes), URL, title, year, make, model, trim and their codes, listing type, mileage, colours, body style, drivetrain, engine, fuel, transmission, MPG, days on site, newly listed and reduced price flags, price (USD; null when the dealer asks you to call: price_label), MSRP, deal_label, kbb_fair_purchase_price, dealer fees, price history, history flags as given, warranties, image, sponsored and the seller (a dealer with dealer_id, name, rating, city, state and distance, or a private seller)';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MIN_YEAR = 1981;
const MAX_YEAR = 2028;

const modelYearFields = (prefix: string, operation: string): INodeProperties[] => [
	{
		displayName: 'Make',
		name: `${prefix}Make`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Toyota',
		displayOptions: show([operation]),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make by name or KBB slug (Toyota, Mercedes-Benz, land-rover; Get Makes and Models lists them)',
	},
	{
		displayName: 'Model',
		name: `${prefix}Model`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rav4',
		displayOptions: show([operation]),
		routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
		description:
			"KBB's model slug as Get Makes and Models gives it (rav4, civic, f150-supercrew-cab, 3-series). A model KBB has no page for is a charged not-found.",
	},
	{
		displayName: 'Model Year',
		name: `${prefix}Year`,
		type: 'number',
		required: true,
		default: 2021,
		typeOptions: { minValue: MIN_YEAR, maxValue: MAX_YEAR },
		displayOptions: show([operation]),
		routing: { request: { body: { year: '={{ $value }}' } } },
		description: 'The model year of the car',
	},
];

const zipField = (name: string, operation: string, description: string): INodeProperties => ({
	displayName: 'ZIP Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '10001',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
	description,
});

const idOrUrlField = (
	name: string,
	operation: string,
	displayName: string,
	idKey: string,
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

const radiusOption = (name: string, values: number[], zeroLabel: string): INodeProperties => ({
	displayName: 'Radius',
	name,
	type: 'options',
	default: -1,
	options: [
		{ name: "KBB's Default", value: -1 },
		...values
			.filter((v) => v !== 0)
			.map((v) => ({ name: `${v} Miles`, value: v }))
			.sort((a, b) => a.name.localeCompare(b.name)),
		{ name: zeroLabel, value: 0 },
	],
	description: 'Miles around the ZIP code',
	routing: { request: { body: { radius: '={{ $value === -1 ? undefined : $value }}' } } },
});

const numberOption = (
	prefix: string,
	displayName: string,
	key: string,
	description: string,
	max = 10000000,
): INodeProperties => ({
	displayName,
	name: `${prefix}${displayName.replace(/\s/g, '')}`,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: max },
	description,
	routing: { request: { body: { [key]: '={{ $value || undefined }}' } } },
});

const DRIVETRAINS = [
	{ name: 'Any', value: '' },
	{ name: 'AWD/4WD', value: 'AWD4WD' },
	{ name: 'Front Wheel Drive', value: 'FWD' },
	{ name: 'Rear Wheel Drive', value: 'RWD' },
];
const COLORS = [
	['BEIGE', 'Beige'], ['BLACK', 'Black'], ['BLUE', 'Blue'], ['BROWN', 'Brown'], ['BURGUNDY', 'Burgundy'],
	['CHARCOAL', 'Charcoal'], ['GOLD', 'Gold'], ['GRAY', 'Gray'], ['GREEN', 'Green'], ['OFFWHITE', 'Off White'],
	['ORANGE', 'Orange'], ['PINK', 'Pink'], ['PURPLE', 'Purple'], ['RED', 'Red'], ['SILVER', 'Silver'], ['TAN', 'Tan'],
	['TURQUOISE', 'Turquoise'], ['WHITE', 'White'], ['YELLOW', 'Yellow'],
];

export const kbbOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['kbb'] } },
		options: [
			{
				name: 'Find Dealers',
				value: 'dealers',
				action: 'Find kbb dealers',
				description: `Car dealers near a US ZIP code on ${FIRST}, optionally of one make and within a radius: location (ZIP, place, radius), count and dealers with dealer_id (what Get Dealer takes), name, franchise name, make, rating, rating count, distance, address, phone, website and URL. At most 50, nearest first as KBB orders them; the dealer finder does not page, so narrow with Radius or Make. Dealer details are the dealer's public business details. Captured 2026-11-26: ZIP 10001 (New York, NY, 25 miles) gave 50 dealers. ${ONE}.`,
				routing: request('/api/v1/kbb/dealers'),
			},
			{
				name: 'Get Car Value',
				value: 'car-value',
				action: 'Get a kbb car value',
				description: `A car's ${NAME} values by make, model, year and trim, intent (buy used, buy new, trade in or sell), condition and mileage, optionally for a US ZIP code (the values KBB's own ZIP form gives for it): vehicle (make, model, year, trim and their slugs, vehicle_id, body style), typical mileage, location (ZIP, whether it was the chosen ZIP, KBB's validity line), valuation date, headline (the values for the intent and condition) and prices: every KBB price type the page gives, 17 for a used car (lending value, typical listing price, trade-in, private party and auction values from Fair to Excellent, CPO listing price, Fair Purchase Price and CPO Fair Purchase Price), MSRP, Invoice and Fair Purchase Price for a new car, each with its base value, region, mileage and option adjustments and KBB's range. Values are exactly as KBB gives them; without a ZIP code they are for KBB's default location. Captured 2026-11-26: a 2021 Toyota RAV4 LE Sport Utility 4D at 40000 miles in good condition had a Fair Purchase Price of 25950 USD (range 23750 to 28150) at KBB's default ZIP 92620 and 25410 USD at ZIP 10001. ${CHARGE} Costs 1 credit; with a ZIP code 2 (up to 6 when KBB's ZIP form needs a second, costlier attempt; credits_used says what was charged).`,
				routing: request('/api/v1/kbb/car-value'),
			},
			{
				name: 'Get Dealer',
				value: 'dealer',
				action: 'Get a kbb dealer',
				description: `One dealer on ${NAME} by dealer ID or link: name, rating, rating count, address, phone, website, hours, home services (buy online, test drive, vehicle delivery, virtual tour), is_open, inventory_count (the dealer's listings on KBB), price stats (min, avg, max), makes with counts and the first page of inventory as the dealer page shows it (${TILE}). Dealer reviews are not included (rating and rating count only). Captured 2026-11-26: dealer 87788 in Irving, TX had 496 listings on KBB, priced from 13054 to 216535 USD. An unknown ID is a charged not-found. ${NO_VIN} ${ONE}.`,
				routing: request('/api/v1/kbb/dealer'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a kbb listing',
				description: `One car for sale on ${NAME} by listing ID or link: ${TILE}, plus description, images, features, ranked features, specifications, warranties with remaining years and miles, open safety recalls as KBB shows them (recall_count, recall_note), KBB's consumer rating and review count for the model, price history, price_valid_until, deal_label with its basis, and the dealer (ID, name, rating, address, phone, website, hours, home services, is_open; null for a private seller). ${DEAL} ${PRIVATE} Phone numbers, emails, stock numbers and VIN-like codes inside descriptions read [removed]. A sold or removed listing is a charged not-found. ${NO_VIN} ${ONE}.`,
				routing: request('/api/v1/kbb/listing'),
			},
			{
				name: 'Get Makes and Models',
				value: 'makes-models',
				action: 'Get kbb makes and models',
				description: `${NAME}'s make and model directory, used (every model year KBB values) or new: make_count, count, makes (make, make_slug, model_count) and models (make, make_slug, model, model_slug, years), the slugs Get Car Value, Get Model Year and Get Reviews take. Optionally one make. Captured 2026-11-26: used gave 68 makes and 1519 models. ${ONE}.`,
				routing: request('/api/v1/kbb/makes-models', true),
			},
			{
				name: 'Get Model Year',
				value: 'model',
				action: 'Get a kbb model year',
				description: `One model year on ${FIRST} by make, model and year: categories, trims (vehicle_id, name, trim_slug that Get Car Value takes, body style, Fair Purchase Price, trade-in and private party values, MPG, horsepower, torque, engine, drivetrain, seating, weights, towing and cargo capacity, EV range), new-car pricing per trim (MSRP, Fair Purchase Price, fair market range) for a new model year, depreciation (three-year depreciation, current resale and trade-in values, history and forecast), specs, rankings, Best Cars list rank, years, other models and image. Prices are for KBB's default location (zip says which). Captured 2026-11-26: the 2021 Toyota RAV4 had 13 trims; the LE Sport Utility 4D showed a Fair Purchase Price of 22900 USD and a trade-in value of 16850 USD at ZIP 92620. ${ONE}.`,
				routing: request('/api/v1/kbb/model'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get kbb reviews',
				description: `Owner reviews of a model year on ${NAME}, 8 a page (pages 1 to 10), sorted most recent, highest or lowest rated, optionally only one star rating: total, total_pages, has_more and reviews (review_id, title, text, rating, the value, reliability, performance, styling, comfort and quality ratings, recommend, date, ownership, pros, cons, helpful votes, photos, staff and incentivized flags), KBB's averages with the star distribution, and the most helpful positive and negative review (page 1). No reviewer name, nickname or location is returned. Captured 2026-11-26: the 2021 Toyota RAV4 had 398 reviews, average 3.6. ${CHARGE} Costs 1 credit; a page beyond 1, another sort or a star filter costs 1 or 5 (credits_used says what was charged).`,
				routing: request('/api/v1/kbb/reviews'),
			},
			{
				name: 'Search Cars for Sale',
				value: 'search',
				action: 'Search kbb cars for sale',
				description: `Search the cars for sale on ${FIRST} around a US ZIP code with a radius: used, new or all, by make and model (validated: never widened to the whole make), sorted by relevance, price, mileage or model year, filtered by model year, price, mileage, drivetrain, exterior colour and dealer or private seller, 25 or 100 a page: location (ZIP, place, radius), filters applied and not applied, total, total_pages, has_more, listings (${TILE}), spotlights (paid placements, sponsored) and price, mileage and year stats. ${DEAL} ${PRIVATE} Captured 2026-11-26: used Toyota RAV4 around ZIP 10001 (New York, NY, 25 miles) gave 574 listings; the first, a 2020 RAV4 LE with 4709 miles at 27665 USD, was rated a Great deal against a Fair Purchase Price of 31443 USD. ${NO_VIN} ${ONE}.`,
				routing: request('/api/v1/kbb/search'),
			},
		],
		default: 'car-value',
	},
];

export const kbbFields: INodeProperties[] = [
	// -- Get Car Value --
	...modelYearFields('kbbValue', 'car-value'),
	{
		displayName: 'Trim',
		name: 'kbbValueTrim',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'le-sport-utility-4d',
		displayOptions: show(['car-value']),
		routing: { request: { body: { trim: '={{ String($value).trim() }}' } } },
		description:
			'The trim: its trim_slug from Get Model Year (e.g. le-sport-utility-4d), its vehicle_id, or a name that starts exactly one trim (LE). A name several trims share is refused with the list.',
	},

	// -- Get Model Year / Get Reviews --
	...modelYearFields('kbbModel', 'model'),
	...modelYearFields('kbbReviews', 'reviews'),

	// -- Search Cars for Sale / Find Dealers --
	zipField('kbbSearchZip', 'search', 'A 5-digit US ZIP code: cars for sale around it (an unknown ZIP code is refused, not charged)'),
	zipField('kbbDealersZip', 'dealers', 'A 5-digit US ZIP code: dealers near it'),

	// -- Get Listing / Get Dealer --
	idOrUrlField(
		'kbbListingId',
		'listing',
		'Listing ID or URL',
		'listing_id',
		'796688649',
		'A KBB listing ID (listing_id from Search Cars for Sale or Get Dealer) or a KBB listing link (kbb.com/cars-for-sale/vehicle/)',
	),
	idOrUrlField(
		'kbbDealerId',
		'dealer',
		'Dealer ID or URL',
		'dealer_id',
		'68613',
		'A KBB dealer ID (dealer_id from Find Dealers or a listing seller) or a KBB dealer link (kbb.com/dealers/)',
	),

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'kbbValueOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['car-value']),
		options: sorted([
			{
				displayName: 'Condition',
				name: 'kbbValueCondition',
				type: 'options',
				default: 'good',
				options: [
					{ name: 'Excellent', value: 'excellent' },
					{ name: 'Fair', value: 'fair' },
					{ name: 'Good', value: 'good' },
					{ name: 'Very Good', value: 'very_good' },
				],
				description: 'Condition for the headline trade-in, private party and auction values',
				routing: { request: { body: { condition: '={{ $value === "good" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Intent',
				name: 'kbbValueIntent',
				type: 'options',
				default: 'buy_used',
				options: [
					{ name: 'Buy New (a New Model Year)', value: 'buy_new' },
					{ name: 'Buy Used', value: 'buy_used' },
					{ name: 'Trade In or Sell', value: 'trade_in_sell' },
				],
				description: 'Every KBB price type the value page gives comes back; the intent picks the headline values',
				routing: { request: { body: { intent: '={{ $value === "buy_used" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Mileage',
				name: 'kbbValueMileage',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 999999 },
				description: 'Odometer miles (0: not sent, KBB values the mileage it assumes). Required with ZIP Code.',
				routing: { request: { body: { mileage: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'ZIP Code',
				name: 'kbbValueZip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description:
					"A US ZIP code the values are for (Buy Used and Trade In or Sell only; needs Mileage). Without it the values are for KBB's default location. With it: 2 credits (up to 6).",
				routing: { request: { body: { zip: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'kbbSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Drivetrain',
				name: 'kbbSearchDrivetrain',
				type: 'options',
				default: '',
				options: DRIVETRAINS,
				description: 'Only cars with this drivetrain',
				routing: { request: { body: { drivetrain: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Exterior Color',
				name: 'kbbSearchExteriorColor',
				type: 'options',
				default: '',
				options: [{ name: 'Any', value: '' }, ...COLORS.map(([value, name]) => ({ name, value }))],
				description: 'Only cars of this exterior colour',
				routing: { request: { body: { exterior_color: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Listing Type',
				name: 'kbbSearchListingType',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'New', value: 'new' },
					{ name: 'Used', value: 'used' },
				],
				description: 'Used, new or all cars for sale',
				routing: { request: { body: { listing_type: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Make',
				name: 'kbbSearchMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: 'A make by name or code (Toyota, Ford, Mercedes-Benz, or TOYOTA, MB ...)',
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			numberOption('kbbSearch', 'Mileage Max', 'mileage_max', 'Most miles (0: no maximum)'),
			numberOption('kbbSearch', 'Mileage Min', 'mileage_min', 'Fewest miles (0: no minimum)'),
			{
				displayName: 'Model',
				name: 'kbbSearchModel',
				type: 'string',
				default: '',
				placeholder: 'RAV4',
				description:
					'With Make: a model as the listings name it (RAV4, Civic, F150; F-150 is matched to F150). A model KBB does not list for the make is a charged not-found that lists the make models.',
				routing: { request: { body: { model: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Model Code',
				name: 'kbbSearchModelCode',
				type: 'string',
				default: '',
				placeholder: 'F150PICKUP',
				description: 'With Make, instead of Model: a model code as model_code in the listings gives it',
				routing: { request: { body: { model_code: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'kbbSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page, from 1 (at most 100); has_more says whether another page exists',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'kbbSearchPageSize',
				type: 'options',
				default: 25,
				options: [
					{ name: '100', value: 100 },
					{ name: '25', value: 25 },
				],
				description: 'Listings a page',
				routing: { request: { body: { page_size: '={{ $value === 25 ? undefined : $value }}' } } },
			},
			numberOption('kbbSearch', 'Price Max', 'price_max', 'Highest price, whole USD (0: no maximum)'),
			numberOption('kbbSearch', 'Price Min', 'price_min', 'Lowest price, whole USD (0: no minimum)'),
			radiusOption('kbbSearchRadius', [10, 25, 50, 75, 100, 200, 300, 400, 500, 0], 'Nationwide'),
			{
				displayName: 'Seller Type',
				name: 'kbbSearchSellerType',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Dealer', value: 'dealer' },
					{ name: 'Private Seller', value: 'private' },
				],
				description: 'Dealer or private sellers',
				routing: { request: { body: { seller_type: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'kbbSearchSort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Mileage: Low to High', value: 'mileage_asc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Year: Newest First', value: 'year_desc' },
				],
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
			},
			numberOption('kbbSearch', 'Year Max', 'year_max', `Latest model year, ${MIN_YEAR} to ${MAX_YEAR} (0: no maximum)`, MAX_YEAR),
			numberOption('kbbSearch', 'Year Min', 'year_min', `Earliest model year, ${MIN_YEAR} to ${MAX_YEAR} (0: no minimum)`, MAX_YEAR),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'kbbListingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['listing']),
		options: [
			{
				displayName: 'ZIP Code',
				name: 'kbbListingZip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description: 'A US ZIP code the seller distance is measured from (without it the distance is null)',
				routing: { request: { body: { zip: '={{ String($value).trim() || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'kbbReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'kbbReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Page of 8 reviews, 1 to 10 (past page 1: 1 or 5 credits)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'kbbReviewsSort',
				type: 'options',
				default: 'recent',
				options: [
					{ name: 'Highest Rated First', value: 'rating_desc' },
					{ name: 'Lowest Rated First', value: 'rating_asc' },
					{ name: 'Most Recent', value: 'recent' },
				],
				description: 'Review order (another sort than Most Recent: 1 or 5 credits)',
				routing: { request: { body: { sort: '={{ $value === "recent" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'kbbReviewsStars',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this overall star rating (1 or 5 credits)',
				routing: { request: { body: { stars: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'kbbDealersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealers']),
		options: sorted([
			{
				displayName: 'Make',
				name: 'kbbDealersMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: 'Only dealers of this make (by name or code)',
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			radiusOption('kbbDealersRadius', [10, 25, 50, 75, 100, 200, 300, 500, 0], 'Any Distance'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'kbbMakesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['makes-models']),
		options: sorted([
			{
				displayName: 'Make',
				name: 'kbbMakesMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: "Only this make's models",
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Vehicle Class',
				name: 'kbbMakesVehicleClass',
				type: 'options',
				default: 'used',
				options: [
					{ name: 'New (Models Sold New)', value: 'new' },
					{ name: 'Used (Every Model Year KBB Values)', value: 'used' },
				],
				description: 'Used or new models',
				routing: { request: { body: { vehicle_class: '={{ $value === "used" ? undefined : $value }}' } } },
			},
		]),
	},
];
