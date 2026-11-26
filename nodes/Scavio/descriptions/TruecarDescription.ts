import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['truecar'], operation, ...extra },
});

// TrueCar (truecar.com, the US car-buying marketplace), 9 operations, 1 credit each;
// credits_used is the truth. US only, USD (no country). Search Vehicles needs a US ZIP. The VIN
// is an input of Get Listing only: it is never returned, so Search Vehicles cannot feed Get
// Listing. Calls can queue behind the backend's upstream limit, so every operation carries a
// 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST = 'TrueCar (truecar.com, the US car-buying marketplace)';
const NAME = 'TrueCar';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NO_VIN =
	"No VIN, stock number, listing link or dealer photo is returned (TrueCar's listing links and photos carry the VIN), so results cannot be passed to Get Listing.";
const LIST =
	"items with year, make, model, trim, style, condition, certified_pre_owned, price, MSRP, price_label and price_rating (TrueCar's own labels as given), mileage, colours, drivetrain, engine, fuel type, transmission, body style, MPG, electric range, key features, history (accident and owner counts, clean title), listed_at, days_on_market, distance_miles, nationwide_delivery and the dealer (ID, name, group, address, city, state, ZIP)";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const thisYear = new Date().getUTCFullYear();

const multi = (
	displayName: string,
	name: string,
	field: string,
	values: Array<[string, string]>,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'multiOptions',
	default: [],
	options: values
		.map(([label, value]) => ({ name: label, value }))
		.sort((a, b) => a.name.localeCompare(b.name)),
	description,
	routing: {
		request: { body: { [field]: '={{ $value && $value.length ? $value : undefined }}' } },
	},
});

const makeField = (name: string, operation: string, placeholder: string): INodeProperties => ({
	displayName: 'Make',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
	description: 'A make name or slug as TrueCar writes it (Get Makes lists them)',
});

const modelField = (name: string, operation: string, placeholder: string): INodeProperties => ({
	displayName: 'Model',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
	description: "A model name or slug as TrueCar writes it (Get Models lists a make's models)",
});

const dealerField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Dealer ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '414984',
	displayOptions: show([operation]),
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
		'A TrueCar dealer ID (the dealer ID Search Vehicles returns, digits) or a truecar.com dealership link',
});

const conditionOption = (name: string): INodeProperties => ({
	displayName: 'Condition',
	name,
	type: 'options',
	default: 'used',
	options: [
		{ name: 'New', value: 'new' },
		{ name: 'Used', value: 'used' },
	],
	description: 'New or used vehicles',
	routing: { request: { body: { condition: '={{ $value === "used" ? undefined : $value }}' } } },
});

const pageOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 334 },
	description,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const yearOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Model Year',
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: thisYear + 2 },
	description,
	routing: { request: { body: { year: '={{ $value || undefined }}' } } },
});

const SORTS = [
	{ name: 'Best Deal', value: 'best_deal' },
	{ name: 'Best Match', value: 'best_match' },
	{ name: 'Highest Mileage', value: 'highest_mileage' },
	{ name: 'Highest Price', value: 'highest_price' },
	{ name: 'Lowest Mileage', value: 'lowest_mileage' },
	{ name: 'Lowest Price', value: 'lowest_price' },
	{ name: 'Nearest', value: 'nearest' },
	{ name: 'Newest Listed', value: 'newest_listed' },
	{ name: 'Newest Year', value: 'newest_year' },
	{ name: 'Oldest Year', value: 'oldest_year' },
];

export const truecarOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['truecar'] } },
		options: [
			{
				name: 'Get Dealer',
				value: 'dealer',
				action: 'Get a truecar dealer',
				description: `One dealer's profile on ${NAME} by dealer ID or dealership link: ID, name, group, address, city, state, ZIP, phone, hours per day, description, links (website, social, inventory, service), services, online, hybrid and dealer-group flags and images. Captured 2026-11-26: dealer 414984, Castle Volkswagen Downers Grove, 2020 Ogden Avenue, Downers Grove, IL. No employees. TrueCar shows no dealer reviews. An unknown dealer is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/dealer'),
			},
			{
				name: 'Get Dealer Inventory',
				value: 'dealer-inventory',
				action: 'Get truecar dealer inventory',
				description: `One dealer's new or used vehicles on ${NAME}, 30 a page: the dealer (ID, name, group, address, city, state, ZIP, phone), total, total_pages, has_more and ${LIST}. Captured 2026-11-26: dealer 414984 had 73 used vehicles, among them a certified 2024 Volkswagen ID.4 Standard at 18133 USD with 35315 miles. ${NO_VIN} An unknown dealer is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/dealer-inventory'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a truecar listing',
				description: `One ${NAME} listing by VIN or truecar.com listing link (input only: the VIN is never returned; Search Vehicles returns no VIN or link, so this takes one you already have): year, make, model, trim, style, condition, price, MSRP, price_label and price_rating as TrueCar gives them, price_summary (advertised price, discount, dealer fees, dealer asking price, taxes and fees), mileage, colours, drivetrain, engine, fuel type, transmission, MPG, key features, highlights, specs and features, warranties, CPO program, history flags as TrueCar shows them, seller notes, listed_at, days_on_market, photo count and the dealer with phone and hours. Captured 2026-11-26: a used 2007 Honda Civic LX at 9990 USD with 45236 miles, rated GREAT by TrueCar, at a dealer in Santa Ana, CA. A VIN TrueCar does not list is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/listing'),
			},
			{
				name: 'Get Makes',
				value: 'makes',
				action: 'Get truecar makes',
				description: `Every make with used inventory on ${FIRST}, with name and slug, plus the national new and used counts (captured 2026-11-26: 63 makes, 1099640 new and 743848 used vehicles). ${ONE}.`,
				routing: request('/api/v1/truecar/makes', true),
			},
			{
				name: 'Get Model Overview',
				value: 'model',
				action: 'Get a truecar model overview',
				description: `${NAME}'s overview of one model (optionally one model year): generation, overview, pros, cons, what's new, owner rating with star counts, sub-ratings, trims with starting MSRP and TrueCar's Starting Market Average as labelled, body styles, engines, horsepower, MPG, seating, cargo, towing, warranty, segment ranking, model years and national new and used price data. Captured 2026-11-26: the 2026 Toyota RAV4 rated 4.38 from 5069 owner ratings, LE from 33495 USD MSRP with a starting market average of 32766.12 USD. An unknown make, model or year is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/model'),
			},
			{
				name: 'Get Models',
				value: 'models',
				action: 'Get truecar models',
				description: `One make's models on ${NAME}, with name, slug (the model Search Vehicles takes), year, body styles, engine types, new and used inventory flags and an image. Captured 2026-11-26: Toyota had 47 models. An unknown make is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/models'),
			},
			{
				name: 'Get Owner Reviews',
				value: 'reviews',
				action: 'Get truecar owner reviews',
				description: `Owner reviews of one model on ${NAME}, grouped by generation as TrueCar groups them (set Model Year for an earlier one), filtered by stars and words in the text, up to 100 a page in TrueCar's own order: the rating with star counts, total, total_pages, has_more and reviews (rating, sub-ratings, pros, cons, other text, date, purchase date, vehicle). Captured 2026-11-26: the Honda Civic rated 4.32 from 6185 owner ratings, 95 written reviews. No reviewer names, initials or states. An unknown make or model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/reviews'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get truecar suggestions',
				description: `${NAME}'s own search suggestions for a text: did_you_mean, hint and suggestions with type (make, model, trim, body style), names and slugs (the make, model and trim Search Vehicles takes) and year. ${ONE}.`,
				routing: request('/api/v1/truecar/suggestions'),
			},
			{
				name: 'Search Vehicles',
				value: 'search',
				action: 'Search truecar vehicles',
				description: `Search the new or used dealer inventory of ${FIRST} around a US ZIP, by make and model, 30 vehicles a page, with TrueCar's ten sorts and filters for radius, model year, price, maximum mileage, trim, body style, drivetrains, colours, fuel types, accident-free and certified pre-owned: total (capped at 10,000 by TrueCar), total_pages, has_more, filters_applied, ${LIST}, plus national (TrueCar's national price range, per-trim average listed price and counts by year). TrueCar also lists vehicles from far-away dealers offered with delivery: read distance_miles. Captured 2026-11-26: a used Toyota RAV4 around 10001 gave 2440 vehicles, the first a 2017 RAV4 Hybrid XLE at 16485 USD with 125334 miles, 5.8 miles away. ${NO_VIN} No keyword search, no mileage minimum, no private sellers. An unknown make or model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/truecar/search'),
			},
		],
		default: 'search',
	},
];

export const truecarFields: INodeProperties[] = [
	// -- Search Vehicles --
	{
		displayName: 'ZIP Code',
		name: 'truecarSearchZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['search']),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code: TrueCar searches dealers around it',
	},

	// -- Get Listing --
	{
		displayName: 'VIN or URL',
		name: 'truecarListingVin',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					vin: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A 17-character VIN of a vehicle listed on TrueCar, or a truecar.com listing link. Input only: the VIN is never returned.',
	},

	// -- Get Model Overview --
	makeField('truecarModelMake', 'model', 'Toyota'),
	modelField('truecarModelModel', 'model', 'RAV4'),

	// -- Get Owner Reviews --
	makeField('truecarReviewsMake', 'reviews', 'Honda'),
	modelField('truecarReviewsModel', 'reviews', 'Civic'),

	// -- Get Dealer / Get Dealer Inventory --
	dealerField('truecarDealer', 'dealer'),
	dealerField('truecarInventoryDealer', 'dealer-inventory'),

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'truecarSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rav4',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Text to complete (at least 2 characters): a make, model, trim or body style',
	},

	// -- Get Models --
	makeField('truecarModelsMake', 'models', 'toyota'),

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'truecarSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			conditionOption('truecarSearchCondition'),
			{
				displayName: 'Make',
				name: 'truecarSearchMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: 'A make name or slug as TrueCar writes it (Get Makes lists them)',
				routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Model',
				name: 'truecarSearchModel',
				type: 'string',
				default: '',
				placeholder: 'RAV4',
				description: 'With Make: a model name or slug as TrueCar writes it (RAV4, F-150, CR-V)',
				routing: { request: { body: { model: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Trim',
				name: 'truecarSearchTrim',
				type: 'string',
				default: '',
				placeholder: 'XLE',
				description: 'With Make and Model: one trim name or slug (national.trims lists them)',
				routing: { request: { body: { trim: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Body Style',
				name: 'truecarSearchBodyStyle',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Convertible', value: 'convertible' },
					{ name: 'Coupe', value: 'coupe' },
					{ name: 'Hatchback', value: 'hatchback' },
					{ name: 'Sedan', value: 'sedan' },
					{ name: 'SUV', value: 'suv' },
					{ name: 'Truck', value: 'truck' },
					{ name: 'Van', value: 'van' },
					{ name: 'Wagon', value: 'wagon' },
				],
				description: 'One body style',
				routing: { request: { body: { body_style: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'truecarSearchRadius',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 500 },
				description: "Miles around the ZIP, 1 to 500 (0: TrueCar's default, 75 used and 150 new)",
				routing: { request: { body: { radius: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Year Min',
				name: 'truecarSearchYearMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: thisYear + 2 },
				description: 'Model year from, 1981 or later (0: no minimum)',
				routing: { request: { body: { year_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Year Max',
				name: 'truecarSearchYearMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: thisYear + 2 },
				description: 'Model year to (0: no maximum)',
				routing: { request: { body: { year_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Min',
				name: 'truecarSearchPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5000000 },
				description: 'Price from, USD (0: no minimum)',
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Price Max',
				name: 'truecarSearchPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5000000 },
				description: 'Price to, USD (0: no maximum)',
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Mileage Max',
				name: 'truecarSearchMileageMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 1000000 },
				description: 'Mileage up to (0: no maximum). TrueCar takes a maximum only.',
				routing: { request: { body: { mileage_max: '={{ $value || undefined }}' } } },
			},
			multi(
				'Drivetrains',
				'truecarSearchDrivetrains',
				'drivetrains',
				[
					['4WD', '4wd'],
					['AWD', 'awd'],
					['FWD', 'fwd'],
					['RWD', 'rwd'],
				],
				'Any of these drivetrains',
			),
			multi(
				'Colors',
				'truecarSearchColors',
				'colors',
				[
					['Beige', 'beige'],
					['Black', 'black'],
					['Blue', 'blue'],
					['Brown', 'brown'],
					['Gold', 'gold'],
					['Gray', 'gray'],
					['Green', 'green'],
					['Orange', 'orange'],
					['Purple', 'purple'],
					['Red', 'red'],
					['Silver', 'silver'],
					['White', 'white'],
					['Yellow', 'yellow'],
				],
				'Any of these exterior colours',
			),
			multi(
				'Fuel Types',
				'truecarSearchFuelTypes',
				'fuel_types',
				[
					['Diesel', 'diesel'],
					['Electric', 'electric'],
					['Gas', 'gas'],
					['Hybrid', 'hybrid'],
					['Plug-In Hybrid', 'plug_in_hybrid'],
				],
				'Any of these fuel types',
			),
			{
				displayName: 'Accident Free',
				name: 'truecarSearchAccidentFree',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only vehicles with no reported accident',
				routing: { request: { body: { accident_free: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Certified Pre-Owned',
				name: 'truecarSearchCpo',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only certified pre-owned vehicles',
				routing: { request: { body: { certified_pre_owned: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'truecarSearchSort',
				type: 'options',
				default: 'best_match',
				options: SORTS,
				description: 'Result order',
				routing: {
					request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } },
				},
			},
			pageOption('truecarSearchPage', 'Page, from 1; 30 vehicles a page, up to page 334'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'truecarInventoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealer-inventory']),
		options: sorted([
			conditionOption('truecarInventoryCondition'),
			pageOption('truecarInventoryPage', 'Page, from 1; 30 vehicles a page'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'truecarModelOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['model']),
		options: [yearOption('truecarModelYear', "A model year (0: TrueCar's current model year)")],
	},
	{
		displayName: 'Additional Options',
		name: 'truecarReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			yearOption(
				'truecarReviewsYear',
				"A model year: the reviews of that year's generation (0: the current generation)",
			),
			{
				...multi(
					'Stars',
					'truecarReviewsStars',
					'stars',
					[
						['1 Star', '1'],
						['2 Stars', '2'],
						['3 Stars', '3'],
						['4 Stars', '4'],
						['5 Stars', '5'],
					],
					'Overall owner ratings to keep',
				),
				routing: {
					request: {
						body: { stars: '={{ $value && $value.length ? $value.join(",") : undefined }}' },
					},
				},
			},
			{
				displayName: 'Search Text',
				name: 'truecarReviewsSearch',
				type: 'string',
				default: '',
				placeholder: 'mileage',
				description: 'Words to match in the review text',
				routing: { request: { body: { search: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'truecarReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Page, from 1; total_pages says how deep they go',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'truecarReviewsPageSize',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Reviews a page, 1 to 100',
				routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
			},
		]),
	},
];
