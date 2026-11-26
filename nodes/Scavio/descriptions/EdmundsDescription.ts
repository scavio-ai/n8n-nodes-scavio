import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['edmunds'], operation, ...extra },
});

// Edmunds (edmunds.com, the US car research and shopping site owned by CarMax), 8 operations,
// 2 credits each; credits_used is the truth. US only, USD (no country). Search Listings takes a
// US city and state (Edmunds places a search by its own city pages; a ZIP is refused). VINs are
// input only (Get Listing): never returned. Calls can queue behind the backend's upstream limit,
// so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'Edmunds (edmunds.com, the US car research and shopping site owned by CarMax)';
const NAME = 'Edmunds';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const TWO = `${CHARGE} Costs 2 credits (credits_used says what was charged)`;
const PRIVATE =
	'VINs are input only and never returned (listing photos are not returned: every Edmunds photo link carries the VIN); no stock numbers; private sellers city and state only; no reviewer names.';
const DEAL =
	"deal_rating (local and national) is Edmunds' own deal rating as Edmunds gives it (Great, Good, Fair, Above_market ...) with Edmunds' list price estimate, its price limits per rating and the savings";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const MAX_YEAR = 2028;

const makeField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Make',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'Toyota',
	displayOptions: show([operation]),
	routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
	description: 'A make Edmunds lists, or its slug (land-rover); Get Makes and Models lists all 69',
});

const modelField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Model',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'RAV4',
	displayOptions: show([operation]),
	routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
	description: "A model of the make: its name (RAV4, F-150, CR-V) or Edmunds' slug (rav4, f-150)",
});

const yearField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Model Year',
	name,
	type: 'number',
	required: true,
	default: 2022,
	typeOptions: { minValue: 1990, maxValue: MAX_YEAR },
	displayOptions: show([operation]),
	routing: { request: { body: { year: '={{ $value }}' } } },
	description: 'The model year of the car (1990 to 2028)',
});

const modelYearFields = (prefix: string, operation: string): INodeProperties[] => [
	makeField(`${prefix}Make`, operation),
	modelField(`${prefix}Model`, operation),
	yearField(`${prefix}Year`, operation),
];

const trimOptions = (name: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: [
		{
			displayName: 'Trim',
			name: `${name}Trim`,
			type: 'string',
			default: '',
			placeholder: 'XLE',
			description:
				"Only this trim, as Edmunds names it. A trim the page does not list is a charged not-found that lists the page's trims.",
			routing: { request: { body: { trim: '={{ String($value).trim() || undefined }}' } } },
		},
	],
});

const numberOption = (
	displayName: string,
	name: string,
	field: string,
	max: number,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: max },
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

export const edmundsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['edmunds'] } },
		options: [
			{
				name: 'Get Appraisal Values',
				value: 'appraisal',
				action: 'Get edmunds appraisal values',
				description: `Used-car values of one model year on ${NAME}, per style and condition (outstanding, clean, average, rough) as Edmunds gives them: dealer retail, private party, trade-in and auction values, estimated_mileage (the mileage Edmunds assumes) and values_near (the place Edmunds computes its values for). Captured 2026-11-26: a 2020 Toyota RAV4 LE AWD in clean condition at an assumed 72000 miles, near Paramus, NJ: dealer retail 23946, private party 21638, trade-in 19036 USD. Edmunds' estimates, not an offer. An unknown model year is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/edmunds/appraisal'),
			},
			{
				name: 'Get Consumer Reviews',
				value: 'reviews',
				action: 'Get edmunds consumer reviews',
				description: `Owner reviews of one model year on ${NAME}, 5 a page, 4 sorts and a star filter: rating, total_reviews, star counts, total_matching, total_pages, has_more, the pros and cons topics Edmunds groups reviews by, styles with review counts and reviews (rating, title, text, style, dates, helpful votes and Edmunds' seven category ratings). Captured 2026-11-26: the 2022 Honda Civic rated 3.9 from 101 reviews. Reviewer names are never returned. An unknown model year is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/edmunds/reviews'),
			},
			{
				name: 'Get Dealer',
				value: 'dealer',
				action: 'Get an edmunds dealer',
				description: `A car dealer's page on ${NAME} by dealer ID or link (Search Listings and Get Listing give both): name, parent group, franchise make, websites, address, coordinates, phones, hours, verified, sales and service ratings, inventory counts per model and dealer reviews (21 a page, newest first, each once; rating, sales or service, title, text, dates, recommends, bought here and dealer replies). Captured 2026-11-26: Jake Sweeney Mitsubishi in Cincinnati, OH, sales rating 5 from 23 ratings, 157 cars, 63 reviews. Reviewer names are never returned and are taken out of the dealer's replies. An unknown dealer is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/edmunds/dealer'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get an edmunds listing',
				description: `One car listing on ${NAME} by VIN with make, model and year, or by its edmunds.com link (input only: the VIN is never returned): the vehicle with options and highlighted features, price, advertised price, price change, MSRP, destination fee, dealer fees, estimated monthly payment, price history, ${DEAL}, days on Edmunds, estimated days to sell, history flags as given, seller comments and the dealer with hours and websites. Captured 2026-11-26: a listing at a Dallas dealer at 24128 USD against an MSRP of 26975 USD, rated Great locally (Edmunds' estimate 29801 USD). A sold or unknown listing is a charged not-found. ${PRIVATE} ${TWO}.`,
				routing: request('/api/v1/edmunds/listing'),
			},
			{
				name: 'Get Makes and Models',
				value: 'makes',
				action: 'Get edmunds makes and models',
				description: `Every make on ${NAME} (69) with name, slug and new and used flags, and one make's models with name, slug (the model the other operations take), latest year, vehicle type and submodels. Captured 2026-11-26: Toyota had 31 models. ${TWO}.`,
				routing: request('/api/v1/edmunds/makes'),
			},
			{
				name: 'Get Model',
				value: 'model',
				action: 'Get an edmunds model',
				description: `A model year's research page on ${NAME} (default: the current model year): MSRP range, styles with base MSRP, base invoice, seats, body type, colours and specs, Edmunds' expert review (rating, scale, category ratings, verdict, pros, cons, recommended trim), the owners' rating and Edmunds' listing counts near the place Edmunds uses. Captured 2026-11-26: the 2025 Toyota RAV4, MSRP 29800 to 39505 USD, expert rating 6.9 out of 10, owners' average 4.1. An unknown model or year is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/edmunds/model'),
			},
			{
				name: 'Get MSRP and Price',
				value: 'price',
				action: 'Get edmunds msrp and price',
				description: `MSRP, invoice price and Edmunds Suggested Price per trim of one model year on ${NAME}, with the most popular trim, the table note, suggested_price_near (the place Edmunds computes its suggested price for, as Edmunds states it; read it with the price) and sales_through. Captured 2026-11-26: the 2025 Toyota RAV4 XLE at 32760 USD MSRP, 30725 invoice and an Edmunds Suggested Price of 30140, near Paramus, NJ 07652. Figures as Edmunds gives them. An unknown model year is a charged not-found. ${TWO}.`,
				routing: request('/api/v1/edmunds/price'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search edmunds listings',
				description: `Search the car listings of ${FIRST}: used (with certified pre-owned) or new cars around a US city and state, by make and model or every make (used), with a radius, 5 sorts and filters for year, price, mileage, trim, drivetrain, exterior colour, body type, deal rating and no accidents, 21 a page: location (the city Edmunds searched around), radius (the radius Edmunds used), total, total_pages, has_more and items with year, make, model, trim, style, mileage, colours, drivetrain, engine, MPG, features, price, price change, MSRP, estimated monthly payment, ${DEAL}, days on Edmunds, estimated days to sell, history and the seller (dealer ID, name, address, distance, rating, phone, link). Captured 2026-11-26: a used Toyota RAV4 around New York, NY gave 3124 listings, among them a 2015 RAV4 Limited at 7995 USD with 157526 miles, rated Great against Edmunds' local estimate of 13201 USD. ${PRIVATE} ${TWO}.`,
				routing: request('/api/v1/edmunds/search'),
			},
		],
		default: 'search',
	},
];

export const edmundsFields: INodeProperties[] = [
	// -- Search Listings --
	{
		displayName: 'City',
		name: 'edmundsSearchCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'New York',
		displayOptions: show(['search']),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description:
			'A US city: Edmunds searches around its own page for that city (ZIP codes are not accepted). An unknown city is a charged not-found.',
	},
	{
		displayName: 'State',
		name: 'edmundsSearchState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'NY',
		displayOptions: show(['search']),
		routing: { request: { body: { state: '={{ String($value).trim() }}' } } },
		description: "The city's state, 2-letter code or name",
	},

	// -- Get Listing --
	{
		displayName: 'Look Up By',
		name: 'edmundsListingBy',
		type: 'options',
		default: 'vin',
		options: [
			{ name: 'Listing URL', value: 'url' },
			{ name: 'VIN with Make, Model and Year', value: 'vin' },
		],
		displayOptions: show(['listing']),
		description: 'Find the listing by VIN (with make, model and year) or by its edmunds.com link',
	},
	{
		displayName: 'VIN',
		name: 'edmundsListingVin',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['listing'], { edmundsListingBy: ['vin'] }),
		routing: { request: { body: { vin: '={{ String($value).trim() }}' } } },
		description: 'A 17-character VIN. Input only: it is never returned.',
	},
	{
		...makeField('edmundsListingMake', 'listing'),
		displayOptions: show(['listing'], { edmundsListingBy: ['vin'] }),
	},
	{
		...modelField('edmundsListingModel', 'listing'),
		displayOptions: show(['listing'], { edmundsListingBy: ['vin'] }),
	},
	{
		...yearField('edmundsListingYear', 'listing'),
		displayOptions: show(['listing'], { edmundsListingBy: ['vin'] }),
	},
	{
		displayName: 'Listing URL',
		name: 'edmundsListingUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.edmunds.com/toyota/rav4/2022/vin/...',
		displayOptions: show(['listing'], { edmundsListingBy: ['url'] }),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description: 'An edmunds.com listing link',
	},

	// -- Get Consumer Reviews / Get MSRP and Price / Get Appraisal Values --
	...modelYearFields('edmundsReviews', 'reviews'),
	...modelYearFields('edmundsPrice', 'price'),
	...modelYearFields('edmundsAppraisal', 'appraisal'),

	// -- Get Model --
	makeField('edmundsModelMake', 'model'),
	modelField('edmundsModelModel', 'model'),

	// -- Get Dealer --
	{
		displayName: 'Dealer ID or URL',
		name: 'edmundsDealer',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'JakeSweeneyMitsubishi_891713',
		displayOptions: show(['dealer']),
		routing: {
			request: {
				body: {
					dealer_id:
						'={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'An Edmunds dealer ID as Search Listings and Get Listing give it (seller dealer_id), or an edmunds.com dealer link',
	},

	// -- Get Makes and Models --
	makeField('edmundsMakesMake', 'makes'),

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'edmundsSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Condition',
				name: 'edmundsSearchCondition',
				type: 'options',
				default: 'used',
				options: [
					{ name: 'New (Needs Make and Model)', value: 'new' },
					{ name: 'Used (With Certified Pre-Owned)', value: 'used' },
				],
				description: 'New or used cars',
				routing: {
					request: { body: { condition: '={{ $value === "used" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Make',
				name: 'edmundsSearchMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: 'A make, with Model. Leave both out to search every make (used only).',
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Model',
				name: 'edmundsSearchModel',
				type: 'string',
				default: '',
				placeholder: 'RAV4',
				description: 'A model of the make, with Make (RAV4, Civic, F-150)',
				routing: { request: { body: { model: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Trim',
				name: 'edmundsSearchTrim',
				type: 'string',
				default: '',
				placeholder: 'XLE',
				description: 'With Make and Model: a trim as Edmunds names it (XLE, LX, Lariat)',
				routing: { request: { body: { trim: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Radius',
				name: 'edmundsSearchRadius',
				type: 'options',
				default: 25,
				options: [
					{ name: '10 Miles', value: 10 },
					{ name: '100 Miles', value: 100 },
					{ name: '200 Miles', value: 200 },
					{ name: '25 Miles', value: 25 },
					{ name: '50 Miles', value: 50 },
					{ name: '500 Miles', value: 500 },
					{ name: '75 Miles', value: 75 },
				],
				description: 'Miles around the city',
				routing: { request: { body: { radius: '={{ $value === 25 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'edmundsSearchSort',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Mileage: Low to High', value: 'mileage_asc' },
					{ name: 'Newest Listed', value: 'newest_listed' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: 'Result order',
				routing: {
					request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Page',
				name: 'edmundsSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, from 1; 21 listings a page',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			numberOption(
				'Year Min',
				'edmundsSearchYearMin',
				'year_min',
				MAX_YEAR,
				'Earliest model year, 1990 or later (0: no minimum)',
			),
			numberOption(
				'Year Max',
				'edmundsSearchYearMax',
				'year_max',
				MAX_YEAR,
				'Latest model year (0: no maximum)',
			),
			numberOption(
				'Price Min',
				'edmundsSearchPriceMin',
				'price_min',
				5000000,
				'Lowest price, whole USD (0: no minimum)',
			),
			numberOption(
				'Price Max',
				'edmundsSearchPriceMax',
				'price_max',
				5000000,
				'Highest price, whole USD (0: no maximum)',
			),
			numberOption(
				'Mileage Min',
				'edmundsSearchMileageMin',
				'mileage_min',
				1000000,
				'Fewest miles (0: no minimum)',
			),
			numberOption(
				'Mileage Max',
				'edmundsSearchMileageMax',
				'mileage_max',
				1000000,
				'Most miles (0: no maximum)',
			),
			{
				displayName: 'Drivetrain',
				name: 'edmundsSearchDrivetrain',
				type: 'options',
				default: '',
				options: [
					{ name: 'All Wheel Drive', value: 'all_wheel_drive' },
					{ name: 'Any', value: '' },
					{ name: 'Four Wheel Drive', value: 'four_wheel_drive' },
					{ name: 'Front Wheel Drive', value: 'front_wheel_drive' },
					{ name: 'Rear Wheel Drive', value: 'rear_wheel_drive' },
				],
				description: 'One drivetrain',
				routing: { request: { body: { drivetrain: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Exterior Color',
				name: 'edmundsSearchColor',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Beige', value: 'beige' },
					{ name: 'Black', value: 'black' },
					{ name: 'Blue', value: 'blue' },
					{ name: 'Brown', value: 'brown' },
					{ name: 'Gold', value: 'gold' },
					{ name: 'Gray', value: 'gray' },
					{ name: 'Green', value: 'green' },
					{ name: 'Orange', value: 'orange' },
					{ name: 'Purple', value: 'purple' },
					{ name: 'Red', value: 'red' },
					{ name: 'Silver', value: 'silver' },
					{ name: 'White', value: 'white' },
					{ name: 'Yellow', value: 'yellow' },
				],
				description: 'One exterior colour',
				routing: { request: { body: { exterior_color: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Body Type',
				name: 'edmundsSearchBodyType',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Convertible', value: 'convertible' },
					{ name: 'Coupe', value: 'coupe' },
					{ name: 'Hatchback', value: 'hatchback' },
					{ name: 'Minivan', value: 'minivan' },
					{ name: 'Pickup', value: 'pickup' },
					{ name: 'Sedan', value: 'sedan' },
					{ name: 'Station Wagon', value: 'wagon' },
					{ name: 'SUV', value: 'suv' },
				],
				description: 'Body type as Edmunds labels it',
				routing: { request: { body: { body_type: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Deal Rating',
				name: 'edmundsSearchDealRating',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Fair', value: 'fair' },
					{ name: 'Good', value: 'good' },
					{ name: 'Great', value: 'great' },
				],
				description: "Edmunds' own deal rating",
				routing: { request: { body: { deal_rating: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'No Accidents',
				name: 'edmundsSearchNoAccidents',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only listings with no reported accidents',
				routing: { request: { body: { no_accidents: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'edmundsReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'edmundsReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, from 1; 5 reviews a page',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'edmundsReviewsSort',
				type: 'options',
				default: 'most_helpful',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				description: 'Review order',
				routing: {
					request: { body: { sort: '={{ $value === "most_helpful" ? undefined : $value }}' } },
				},
			},
			{
				displayName: 'Star Rating',
				name: 'edmundsReviewsStars',
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
				description: 'Only reviews with this many stars',
				routing: { request: { body: { stars: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'edmundsDealerOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealer']),
		options: [
			{
				displayName: 'Review Page',
				name: 'edmundsDealerPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Review page, from 1; 21 reviews a page, newest first',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'edmundsModelOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['model']),
		options: [
			{
				displayName: 'Model Year',
				name: 'edmundsModelYear',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: MAX_YEAR },
				description: "A model year, 1990 or later (0: Edmunds' current model year)",
				routing: { request: { body: { year: '={{ $value || undefined }}' } } },
			},
		],
	},
	trimOptions('edmundsPriceOptions', 'price'),
	trimOptions('edmundsAppraisalOptions', 'appraisal'),
];
