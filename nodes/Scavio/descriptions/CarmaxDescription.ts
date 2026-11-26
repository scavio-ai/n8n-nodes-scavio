import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['carmax'], operation, ...extra },
});

// CarMax (carmax.com, the largest US used-car retailer, with 263 stores in 42 states and
// no-haggle prices), 12 operations, 1 credit each; credits_used is the truth. US only, USD (no
// country). Search Cars and Get Store Inventory need a US ZIP (CarMax prices shipping to it).
// 100 cars a page can take CarMax 80 seconds and calls can queue behind the backend's upstream
// limit, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'CarMax (carmax.com, the largest US used-car retailer, with 263 stores in 42 states and no-haggle prices)';
const NAME = 'CarMax';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_VIN = 'No VIN is returned.';
const LIST =
	"cars with stock_number (what Get Listing and Get Photos take), URL, year, make, model, trim, body, price (CarMax's no-haggle price, USD), original_price and price_drop as CarMax gives them, mileage, colours, transmission, drivetrain, engine, horsepower, MPG, features, packages, prior uses, the store (ID, name, city, state), distance_miles from the ZIP, shipping (fee in USD to the ZIP, text, arrival, min and max days), model_rating (owner reviews of that model-year) and badges, plus total as CarMax reports it, has_more, applied (the filters CarMax applied), nearest_store and, with Include Facets, every filter value with its URL segment and count";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const thisYear = new Date().getUTCFullYear();

const zipField = (name: string, operation: string): INodeProperties => ({
	displayName: 'ZIP Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '75201',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
	description:
		"A 5-digit US ZIP code: CarMax prices each car's shipping fee and dates to it, and the radius is measured from it",
});

const storeIdField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Store ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '7115',
	displayOptions: show([operation]),
	routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
	description: 'A CarMax store ID (the store ID Get Stores returns, digits)',
});

const carField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Stock Number or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '29242747',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				stock_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description:
		'A CarMax stock number (stock_number from Search Cars, 6 to 10 digits) or the car link (a carmax.com/car/ link)',
});

const modelYearFields = (prefix: string, operation: string, yearMax: number, example: number): INodeProperties[] => [
	{
		displayName: 'Make',
		name: `${prefix}Make`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Toyota',
		displayOptions: show([operation]),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'The make as CarMax names it, by name or slug (Get Makes lists them)',
	},
	{
		displayName: 'Model',
		name: `${prefix}Model`,
		type: 'string',
		required: true,
		default: '',
		placeholder: 'RAV4',
		displayOptions: show([operation]),
		routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
		description: 'The model as CarMax names it, by name or slug (Get Models lists them; F-150 is read as F150)',
	},
	{
		displayName: 'Model Year',
		name: `${prefix}Year`,
		type: 'number',
		required: true,
		default: example,
		typeOptions: { minValue: 1980, maxValue: yearMax },
		displayOptions: show([operation]),
		routing: { request: { body: { year: '={{ $value }}' } } },
		description: 'The model year of the car',
	},
];

const SORTS = [
	{ name: 'Best Match', value: 'best_match' },
	{ name: 'Distance (Nearest First)', value: 'distance' },
	{ name: 'Mileage: High to Low', value: 'mileage_desc' },
	{ name: 'Mileage: Low to High', value: 'mileage_asc' },
	{ name: 'Price: High to Low', value: 'price_desc' },
	{ name: 'Price: Low to High', value: 'price_asc' },
	{ name: 'Year: Newest First', value: 'year_desc' },
	{ name: 'Year: Oldest First', value: 'year_asc' },
];

const SHIPPING_FEES = [0, 99, 199, 299, 399, 499, 999];

const listOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Make',
		name: `${prefix}Make`,
		type: 'string',
		default: '',
		placeholder: 'Ford',
		description: 'A make by name or slug (Get Makes lists them)',
		routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Model',
		name: `${prefix}Model`,
		type: 'string',
		default: '',
		placeholder: 'F-150',
		description: "With Make: a model by name or slug (F-150 and F150 both work; Get Models lists a make's models)",
		routing: { request: { body: { model: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Body Type',
		name: `${prefix}BodyType`,
		type: 'string',
		default: '',
		placeholder: 'suvs',
		description:
			'A body type as CarMax writes it: suvs, sedans, trucks, coupes, hatchbacks, minivans-and-vans, convertibles, wagons',
		routing: { request: { body: { body_type: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Filters',
		name: `${prefix}Filters`,
		type: 'string',
		default: '',
		placeholder: 'all-wheel-drive, black',
		description:
			'Up to 8 facet values by URL segment, comma-separated (the url_segment values Include Facets returns): drivetrain, colour, engine type, features, packages, cylinders, size, doors',
		routing: {
			request: {
				body: {
					filters:
						'={{ String($value).trim() ? String($value).split(",").map((s) => s.trim()).filter((s) => s) : undefined }}',
				},
			},
		},
	},
	{
		displayName: 'Year Min',
		name: `${prefix}YearMin`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: thisYear + 2 },
		description: 'Earliest model year, from 1980 (0: no minimum)',
		routing: { request: { body: { year_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Year Max',
		name: `${prefix}YearMax`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: thisYear + 2 },
		description: 'Latest model year, from 1980 (0: no maximum)',
		routing: { request: { body: { year_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Price Min',
		name: `${prefix}PriceMin`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000 },
		description: 'Lowest price, USD (0: no minimum)',
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Price Max',
		name: `${prefix}PriceMax`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000 },
		description: 'Highest price, USD (0: no maximum)',
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Mileage Min',
		name: `${prefix}MileageMin`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000 },
		description: 'Lowest mileage (0: no minimum)',
		routing: { request: { body: { mileage_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Mileage Max',
		name: `${prefix}MileageMax`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000 },
		description: 'Highest mileage (0: no maximum)',
		routing: { request: { body: { mileage_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Shipping Fee',
		name: `${prefix}MaxShippingFee`,
		type: 'options',
		default: -1,
		options: [
			{ name: 'No Limit', value: -1 },
			...SHIPPING_FEES.map((f) => ({ name: f === 0 ? 'Free ($0)' : `$${f}`, value: f })),
		],
		description: "CarMax's Max shipping fee filter, USD (Free = free to home or store)",
		routing: { request: { body: { max_shipping_fee: '={{ $value === -1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'best_match',
		options: SORTS,
		description: 'Result order',
		routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 1000 },
		description: 'Page, from 1; has_more says whether another page exists (page x page size stays within the first 10,000 cars)',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: `${prefix}PageSize`,
		type: 'number',
		default: 24,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: 'Cars per page, 1 to 100. 100 cars can take CarMax 80 seconds.',
		routing: { request: { body: { page_size: '={{ $value === 24 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Include Facets',
		name: `${prefix}IncludeFacets`,
		type: 'boolean',
		default: false,
		description:
			'Whether to also return every filter value with its URL segment and count (makes carry their models) and the year, price and mileage ranges with counts (still 1 credit)',
		routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
	},
];

export const carmaxOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['carmax'] } },
		options: [
			{
				name: 'Get Car Value',
				value: 'car-value',
				action: 'Get carmax car value',
				description: `Recent ${NAME} instant offers for one model-year (e.g. 2019 Ford F-150), as CarMax shows them: offer_range (CarMax's range across recent offers), headline_range (the range CarMax's page headline states, which can differ), aggregate (low, high, offer_count), recent_offers (mileage, offer, offered_at, trim), trim_ranges, median_offer_history, median_offer_change and other_years. This is what CarMax offered for cars of that model-year, not an appraisal of any one car. Captured 2026-11-26: the 2019 Ford F150 showed 10 recent offers from 11000 to 20000 USD while the page headline stated $16,400-$25,400. An unknown make, model or year is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carmax/car-value'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a carmax listing',
				description: `One ${NAME} car in full by stock number or link: status, year, make, model, trim, body, engine, transmission, drivetrain, fuel, MPG, mileage, colours, price, price_reduced, previous_price, price drop date and text (as CarMax words it), badge, history (accident_count, owner_count, prior_uses), CarMax's callouts as given, highlights, warranties, features, specifications, reconditioning, the store, saleable, reserved, sold, save_count and the model review summary. Shipping depends on the buyer's ZIP: use Search Cars with a ZIP. Captured 2026-11-26: a 2026 Ford F150 STX at 44998 USD, lowered from 45998 USD on November 20, 2026. A stock number CarMax does not have (or a sold car) is a charged not-found. ${NO_VIN} ${ONE}.`,
				routing: request('/api/v1/carmax/listing'),
			},
			{
				name: 'Get Makes',
				value: 'makes',
				action: 'Get carmax makes',
				description: `Every make ${FIRST} lists, with name and slug (60 makes, captured 2026-11-26). ${ONE}.`,
				routing: request('/api/v1/carmax/makes', true),
			},
			{
				name: 'Get Models',
				value: 'models',
				action: 'Get carmax models',
				description: `One make's models on ${NAME}, with name and slug (the model Search Cars and Get Car Value take). Captured 2026-11-26: Toyota had 46 models. An unknown make is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carmax/models'),
			},
			{
				name: 'Get Photos',
				value: 'photos',
				action: 'Get carmax photos',
				description: `Every photo of one ${NAME} car by stock number or link: type (image or 360-exterior), name, category (Exterior, Interior), shot, thumbnail URL, URL (1600x1200) and a 16x9 URL. ${ONE}.`,
				routing: request('/api/v1/carmax/photos'),
			},
			{
				name: 'Get Review Summary',
				value: 'review-summary',
				action: 'Get a carmax review summary',
				description: `The owner-review summary of one model-year on ${NAME}: count, average, rounded_average, top_likes, top_dislikes and the star distribution. Captured 2026-11-26: the 2020 Ford F150 had 37 reviews, rounded average 4.5. A model-year with no reviews is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carmax/review-summary'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get carmax reviews',
				description: `Owner reviews of one model-year on ${NAME} (e.g. 2022 Toyota RAV4), 10 a page, full depth, 5 sorts and an exact star filter: total_reviews, total_pages, average_rating, distribution, top_likes, top_dislikes and reviews (rating, title, recommends, pros and cons with aspect and comment, submitted_at, helpful votes, syndicated, the owner's vehicle year, mileage and time owned). No reviewer name or any reviewer identity is returned. A model-year with no reviews is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carmax/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a carmax store',
				description: `One ${NAME} store by ID: name, URL, address, phone, toll-free phone, coordinates, status, microstore and car-buying-center flags, hours, service hours, holiday hours, is_open_now, alert and fee_disclaimer (CarMax's price and fee terms for that store's state). An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carmax/store'),
			},
			{
				name: 'Get Store Inventory',
				value: 'store-inventory',
				action: 'Get carmax store inventory',
				description: `The cars on one ${NAME} store's lot, with the same filters, sorts and paging as Search Cars (no keyword, no radius): store_name and ${LIST}. Total is that store's lot count for the filters. Captured 2026-11-26: Toyota at store 7115, Texas Stadium (Irving), gave 71 cars. ${NO_VIN} ${ONE}.`,
				routing: request('/api/v1/carmax/store-inventory'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get carmax stores',
				description: `${NAME} stores near a US ZIP (nearest first, with distance_miles) or in a state or city: ID (what Get Store and Get Store Inventory take), name, address, phone, coordinates, status, microstore and car-buying-center flags, hours, service hours and holiday hours. Captured 2026-11-26: 75201 gave 5 stores, the nearest Texas Stadium (Irving) at 7 miles. ${ONE}.`,
				routing: request('/api/v1/carmax/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get carmax suggestions',
				description: `${NAME}'s make and model suggestions for the start of a name: name, type (make or model) and slug (the make or model Search Cars takes). Makes and models only, not trims. ${ONE}.`,
				routing: request('/api/v1/carmax/suggestions'),
			},
			{
				name: 'Search Cars',
				value: 'search',
				action: 'Search carmax cars',
				description: `Search the used-car inventory of ${FIRST} by make and model (F-150 and F150 both work), body type, keyword, facet filters, year, price and mileage ranges and max shipping fee, within a radius of a US ZIP (or nationwide), sorted 8 ways, up to 100 cars a page: ${LIST}. Captured 2026-11-26: Ford F-150 within 100 miles of 75201 gave 49 cars, among them a 2026 F150 STX at 44998 USD with 1971 miles, shipping fee 49 USD. ${NO_VIN} US only, USD. ${ONE}.`,
				routing: request('/api/v1/carmax/search'),
			},
		],
		default: 'search',
	},
];

export const carmaxFields: INodeProperties[] = [
	// -- Search Cars --
	zipField('carmaxSearchZip', 'search'),

	// -- Get Store Inventory --
	storeIdField('carmaxInventoryStoreId', 'store-inventory'),
	zipField('carmaxInventoryZip', 'store-inventory'),

	// -- Get Listing / Get Photos --
	carField('carmaxListingCar', 'listing'),
	carField('carmaxPhotosCar', 'photos'),

	// -- Get Stores --
	{
		displayName: 'Find Stores By',
		name: 'carmaxStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'State', value: 'state' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores nearest a ZIP code, or every store in a state or city',
	},
	{
		displayName: 'ZIP Code',
		name: 'carmaxStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75201',
		displayOptions: show(['stores'], { carmaxStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code: stores nearest it, with distance_miles',
	},
	{
		displayName: 'State',
		name: 'carmaxStoresState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['stores'], { carmaxStoresBy: ['state'] }),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: "A US state (TX or Texas): CarMax's stores in it",
	},
	{
		displayName: 'City',
		name: 'carmaxStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Atlanta',
		displayOptions: show(['stores'], { carmaxStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city name',
	},

	// -- Get Store --
	storeIdField('carmaxStoreId', 'store'),

	// -- Get Reviews / Get Review Summary / Get Car Value --
	...modelYearFields('carmaxReviews', 'reviews', thisYear + 2, 2022),
	...modelYearFields('carmaxSummary', 'review-summary', thisYear + 2, 2022),
	...modelYearFields('carmaxValue', 'car-value', thisYear + 1, 2019),

	// -- Get Models --
	{
		displayName: 'Make',
		name: 'carmaxModelsMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'toyota',
		displayOptions: show(['models']),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make by name or slug (Get Makes lists them). An unknown make is a charged not-found.',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'carmaxSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rav',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'The start of a make or model name (2 to 60 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'carmaxSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			...listOptions('carmaxSearch'),
			{
				displayName: 'Keyword',
				name: 'carmaxSearchKeyword',
				type: 'string',
				default: '',
				placeholder: 'rav4 hybrid',
				description: 'Free text CarMax searches across every make. Not combined with Make or Model.',
				routing: { request: { body: { keyword: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Radius',
				name: 'carmaxSearchRadius',
				type: 'options',
				default: 'nationwide',
				options: [
					{ name: '100 Miles', value: '100' },
					{ name: '25 Miles', value: '25' },
					{ name: '250 Miles', value: '250' },
					{ name: '5 Miles', value: '5' },
					{ name: '50 Miles', value: '50' },
					{ name: '500 Miles', value: '500' },
					{ name: '75 Miles', value: '75' },
					{ name: 'Nationwide', value: 'nationwide' },
				],
				description: 'Miles from the ZIP code (Nationwide: every CarMax car, with the shipping fee to the ZIP)',
				routing: { request: { body: { radius: '={{ $value === "nationwide" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'carmaxInventoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['store-inventory']),
		options: sorted(listOptions('carmaxInventory')),
	},
	{
		displayName: 'Additional Options',
		name: 'carmaxReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'carmaxReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, 10 reviews a page; total_pages says how deep they go',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'carmaxReviewsSort',
				type: 'options',
				default: 'most_helpful',
				options: [
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Lowest Rating', value: 'lowest_rating' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Review order',
				routing: { request: { body: { sort: '={{ $value === "most_helpful" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'carmaxReviewsRating',
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
				description: 'Only reviews with exactly this many stars',
				routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
			},
		]),
	},
];
