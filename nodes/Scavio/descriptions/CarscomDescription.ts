import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['carscom'], operation, ...extra },
});

// Cars.com (cars.com, the US car marketplace run by Cars Commerce), 8 operations, 1 credit each;
// credits_used is the truth. US only (no country), prices in USD. Search Listings and Find
// Dealers need a US ZIP. Search pages can take up to about 80 s and a retry can follow, so every
// operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

// Comma-separated text -> string array, blanks dropped; empty -> not sent.
const splitList =
	'={{ String($value).split(",").map(s => s.trim()).filter(Boolean).length ? String($value).split(",").map(s => s.trim()).filter(Boolean) : undefined }}';
const trimmed = '={{ String($value).trim() || undefined }}';
const isUrl = '/^https?:/i.test(String($value).trim())';

const FIRST = 'Cars.com (cars.com, the US car marketplace run by Cars Commerce)';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const PRIVATE =
	"No VINs, stock numbers, private-seller names or contact details, reviewer names or towns, or dealer employee names are returned; the dealer's business name, address, phone, website and hours are kept. US only, asking prices in USD as the seller lists them.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const zipField = (name: string, operation: string): INodeProperties => ({
	displayName: 'ZIP Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '10001',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
	description: 'A 5-digit US ZIP code: Cars.com searches around it. An unknown ZIP answers 400, not charged.',
});

const dealerField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Dealer ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '97701',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				dealer_id: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
				url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
			},
		},
	},
	description:
		"A Cars.com dealer ID (digits: a listing's dealer ID or a Find Dealers result) or a cars.com/dealers/ link",
});

const pageOption = (name: string, max: number, size: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description: `Page (at most ${max}); ${size}`,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const reviewOptions = (prefix: string, sizes: number[]): INodeProperties[] => [
	pageOption(`${prefix}Page`, 1000, 'Page Size reviews a page'),
	{
		displayName: 'Page Size',
		name: `${prefix}PageSize`,
		type: 'options',
		default: 20,
		options: sizes.map((s) => ({ name: String(s), value: s })),
		description: 'Reviews a page',
		routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'most_recent',
		options: [
			{ name: 'Highest Rated', value: 'highest_rated' },
			{ name: 'Lowest Rated', value: 'lowest_rated' },
			{ name: 'Most Helpful', value: 'most_helpful' },
			{ name: 'Most Recent', value: 'most_recent' },
		],
		description: 'Review order',
		routing: { request: { body: { sort: '={{ $value === "most_recent" ? undefined : $value }}' } } },
	},
];

const RADII = [10, 20, 30, 40, 50, 75, 100, 150, 200, 250, 500, 750, 1000];
const DEALER_RADII = [10, 20, 30, 40, 50, 75, 100, 150, 200, 250, 500];
const MILEAGES = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 150000, 200000, 250000];

export const carscomOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['carscom'] } },
		options: [
			{
				name: 'Find Dealers',
				value: 'dealers',
				action: 'Find carscom dealers',
				description: `Find car dealers on ${FIRST} around a US ZIP with a radius, by make, minimum rating and dealer name, sorted by rating (default), name or distance, about 20 a page: dealer_id (what the dealer operations take), name, URL, rating, review_count, address, distance_miles, inventory_count and phones, plus total and has_more. Captured 2026-11-26: 734 dealers within 30 miles of 90012 (Los Angeles). ${ONE}.`,
				routing: request('/api/v1/carscom/dealers'),
			},
			{
				name: 'Get Dealer',
				value: 'dealer',
				action: 'Get a carscom dealer',
				description: `A car dealer's public profile on ${FIRST} by dealer ID: name, URL, rating, review_count, phone, website, address, latitude, longitude, description, opening hours, sales and service hours, service department, inventory_count, awards, on_cars_com_since and image. Captured 2026-11-26: dealer 97701 (Queens Auto Mall of Jamaica, Richmond Hill, NY) rated 3.6 from 2145 reviews. An unknown ID is a charged not-found. ${PRIVATE} ${ONE}.`,
				routing: request('/api/v1/carscom/dealer'),
			},
			{
				name: 'Get Dealer Inventory',
				value: 'dealer-inventory',
				action: 'Get carscom dealer inventory',
				description: `A dealer's vehicles for sale on ${FIRST}, 24 a page in the order the dealer page lists them: listing_id, URL, year, make, model, trim, stock_type, certified, price, msrp (new only), mileage, body_style, drivetrain, colors, fuel_type, photo_count, deal_badge (Great, Good or Fair Deal as the card shows it), cpo_package and sponsored, plus total and total_pages. Captured 2026-11-26: dealer 97701 listed 150 vehicles on 7 pages. An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carscom/dealer-inventory'),
			},
			{
				name: 'Get Dealer Reviews',
				value: 'dealer-reviews',
				action: 'Get carscom dealer reviews',
				description: `A dealer's customer reviews on ${FIRST}, 10-40 a page, sorted most recent, lowest rated, most helpful or highest rated: rating, title, date, text, category_ratings, recommends, shopped_for, made_purchase and helpful votes, plus the dealer's rating and total. No star filter exists on the site. Reviewer names and towns and "worked with" employees are not returned. Captured 2026-11-26: dealer 97701 had 2145 reviews. An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carscom/dealer-reviews'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a carscom listing',
				description: `One car listing on ${FIRST} by listing ID or link: title, year, make, model, trim, stock_type, certified, price, msrp (new only), mileage, body style, colors, engine, transmission, mpg, badges, price_breakdown (vehicle price, listed fees, all-in price), deal (Cars.com's deal rating, good deal range and market position as stated), price_history (listed, drops, increases), features, history (accidents, owners, prior use; used cars), cpo, seller_notes, seller_type and the dealer (ID, name, rating, address, website, hours; dealers only). Captured 2026-11-26: a used 2018 Toyota RAV4 XLE at 21799 USD with 48538 miles, rated a good deal (range 20394-22683 USD), listed at 22399 and dropped twice. A listing that is no longer available is a charged not-found. ${PRIVATE} ${ONE}.`,
				routing: request('/api/v1/carscom/listing'),
			},
			{
				name: 'Get Model Reviews',
				value: 'model-reviews',
				action: 'Get carscom model reviews',
				description: `Owner (consumer) reviews of one model year on ${FIRST} by make, model and year, 10-200 a page, sorted most recent, lowest rated, most helpful or highest rated: rating, title, date, text, category_ratings, recommends, owns_this_car, purchased, used_for and helpful votes, plus the model year's rating, total, recommend_percent, category_ratings and msrp_range. No star filter exists on the site. Reviewer names and towns are not returned. Captured 2026-11-26: the 2019 Toyota RAV4 rated 4.4 from 458 reviews, 82 percent recommend. An unknown model year is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carscom/model-reviews'),
			},
			{
				name: 'Get Research',
				value: 'research',
				action: 'Get carscom research',
				description: `Car research pages on ${FIRST}, as Cars.com publishes them: Make (description, lineup, models), Model (generations, competitors, model years with price range and rating), Model Year (average listing price on used years or starting price on new ones, MPG, ratings, NHTSA score, notable features, the good and the bad, warranty, trims with price) or Trims (starting MSRP, combined MPG, engine, drivetrain, transmission, seating). Captured 2026-11-26: the 2022 Toyota RAV4 had an average listing price of 26697 USD and an NHTSA score of 5. An unknown make, model or year is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carscom/research'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search carscom listings',
				description: `Search the car listings of ${FIRST}: new, used and certified cars around a US ZIP with a radius, by make and model, with Cars.com's 11 sorts and filters for year, price, mileage, trims, drivetrain, color, deal rating, body style, seller type and keyword; 24 a page, up to page 417. Returns listings with listing_id (what Get Listing takes), title, year, make, model, trim, stock_type, certified, price, msrp (new only), mileage, body_style, drivetrain, exterior_color, fuel_type, price_drop, badges (Cars.com's deal and demand labels), seller (seller_type, dealer name, city, state, rating, distance_miles) and sponsored, plus total (capped at 10,000), total_pages, filters_applied and filters_not_applied. Captured 2026-11-26: used Toyota RAV4 around 10001 gave 700 listings; Ford F-150 around 75201 (Dallas) sorted by lowest price gave 4401, the first a 2005 F-150 XL at 3900 USD. ${PRIVATE} ${ONE}.`,
				routing: request('/api/v1/carscom/search'),
			},
		],
		default: 'search',
	},
];

export const carscomFields: INodeProperties[] = [
	// -- Search Listings --
	zipField('carscomSearchZip', 'search'),

	// -- Get Listing --
	{
		displayName: 'Listing ID or URL',
		name: 'carscomListing',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90e3df05-5f5e-4f4d-a474-79eb2077c99a',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					listing_id: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
					url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description: 'A Cars.com listing ID (listing_id from Search Listings) or a cars.com/vehicledetail/ link',
	},

	// -- Dealer operations --
	dealerField('carscomDealerId', 'dealer'),
	dealerField('carscomInventoryDealerId', 'dealer-inventory'),
	dealerField('carscomReviewsDealerId', 'dealer-reviews'),

	// -- Get Model Reviews, Get Research --
	{
		displayName: 'Make',
		name: 'carscomMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Toyota',
		displayOptions: show(['model-reviews', 'research']),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'A make as Cars.com lists it (Toyota, Ford, Land Rover ...) or its slug',
	},
	{
		displayName: 'Model',
		name: 'carscomReviewsModel',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'RAV4',
		displayOptions: show(['model-reviews']),
		routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
		description: "A model of the make: the name (RAV4, F-150) or Cars.com's slug (rav4, f_150)",
	},
	{
		displayName: 'Year',
		name: 'carscomReviewsYear',
		type: 'number',
		required: true,
		default: 2019,
		typeOptions: { minValue: 1900, maxValue: 2028 },
		displayOptions: show(['model-reviews']),
		routing: { request: { body: { year: '={{ $value }}' } } },
		description: 'The model year',
	},

	// -- Find Dealers --
	zipField('carscomDealersZip', 'dealers'),

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'carscomSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Stock Type',
				name: 'carscomSearchStockType',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All (New, Used and Certified)', value: 'all' },
					{ name: 'Certified Pre-Owned', value: 'cpo' },
					{ name: 'New', value: 'new' },
					{ name: 'New and Certified', value: 'new_cpo' },
					{ name: 'Used', value: 'used' },
				],
				description: 'Which cars to search',
				routing: { request: { body: { stock_type: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Make',
				name: 'carscomSearchMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: 'A make as Cars.com lists it or its slug (land_rover)',
				routing: { request: { body: { make: trimmed } } },
			},
			{
				displayName: 'Model',
				name: 'carscomSearchModel',
				type: 'string',
				default: '',
				placeholder: 'RAV4',
				description: "A model of Make: the name or Cars.com's slug (f_150). Needs Make.",
				routing: { request: { body: { model: trimmed } } },
			},
			{
				displayName: 'Radius (Miles)',
				name: 'carscomSearchRadius',
				type: 'options',
				default: 50,
				options: RADII.map((r) => ({ name: `${r} Miles`, value: r })),
				description: 'Miles around the ZIP',
				routing: { request: { body: { radius: '={{ $value === 50 ? undefined : $value }}' } } },
			},
			pageOption('carscomSearchPage', 417, '24 listings a page'),
			{
				displayName: 'Sort',
				name: 'carscomSearchSort',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Deal', value: 'best_deal' },
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Distance', value: 'distance' },
					{ name: 'Listed: Newest', value: 'listed_newest' },
					{ name: 'Listed: Oldest', value: 'listed_oldest' },
					{ name: 'Mileage: High to Low', value: 'mileage_high' },
					{ name: 'Mileage: Low to High', value: 'mileage_low' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Year: Newest', value: 'year_newest' },
					{ name: 'Year: Oldest', value: 'year_oldest' },
				],
				description: "Result order (Cars.com's 11 sorts)",
				routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Year Min',
				name: 'carscomSearchYearMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 2028 },
				description: 'Earliest model year, 1900-2028 (0: no minimum)',
				routing: { request: { body: { year_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Year Max',
				name: 'carscomSearchYearMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 2028 },
				description: 'Latest model year, 1900-2028 (0: no maximum)',
				routing: { request: { body: { year_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'carscomSearchPriceMin',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Lowest list price, whole USD (0: no minimum)',
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'carscomSearchPriceMax',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Highest list price, whole USD (0: no maximum)',
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Max Mileage',
				name: 'carscomSearchMileageMax',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					...MILEAGES.map((m) => ({ name: `${m.toLocaleString('en-US')} Miles`, value: m })),
				],
				description: "Most miles, one of Cars.com's steps",
				routing: { request: { body: { mileage_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Trims',
				name: 'carscomSearchTrims',
				type: 'string',
				default: '',
				placeholder: 'XLE, XLE Premium',
				description: 'Trims of Make + Model, comma-separated names or slugs (at most 10). Needs Make and Model.',
				routing: { request: { body: { trims: splitList } } },
			},
			{
				displayName: 'Drivetrain',
				name: 'carscomSearchDrivetrain',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'All-Wheel Drive', value: 'all_wheel_drive' },
					{ name: 'Four-Wheel Drive', value: 'four_wheel_drive' },
					{ name: 'Front-Wheel Drive', value: 'front_wheel_drive' },
					{ name: 'Rear-Wheel Drive', value: 'rear_wheel_drive' },
				],
				description: 'Drivetrains (empty: any)',
				routing: { request: { body: { drivetrain: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Exterior Color',
				name: 'carscomSearchExteriorPaint',
				type: 'string',
				default: '',
				placeholder: 'white, gray',
				description: 'Exterior colors, comma-separated (black, white, gray, silver, blue, red ...; at most 12)',
				routing: { request: { body: { exterior_color: splitList } } },
			},
			{
				displayName: 'Deal Rating',
				name: 'carscomSearchDealRating',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Fair Deal', value: 'fair' },
					{ name: 'Good Deal', value: 'good' },
					{ name: 'Great Deal', value: 'great' },
				],
				description: 'Cars.com deal ratings (empty: any)',
				routing: { request: { body: { deal_rating: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Body Style',
				name: 'carscomSearchBodyStyle',
				type: 'string',
				default: '',
				placeholder: 'suv, sedan',
				description: 'Body styles, comma-separated (suv, sedan, truck, coupe, hatchback, minivan, wagon, convertible ...; at most 10)',
				routing: { request: { body: { body_style: splitList } } },
			},
			{
				displayName: 'Seller Type',
				name: 'carscomSearchSellerType',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Dealership', value: 'dealership' },
					{ name: 'Private Seller', value: 'private' },
				],
				description: 'Dealership or private sellers',
				routing: { request: { body: { seller_type: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Keyword',
				name: 'carscomSearchKeyword',
				type: 'string',
				default: '',
				placeholder: 'tow package',
				description: "Cars.com's keyword filter: words in the listing",
				routing: { request: { body: { keyword: trimmed } } },
			},
			{
				displayName: 'Include Facets',
				name: 'carscomSearchIncludeFacets',
				type: 'boolean',
				default: false,
				description: "Whether to also return the site's filter options with result counts for this search",
				routing: { request: { body: { include_facets: '={{ $value ? true : undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'carscomInventoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealer-inventory']),
		options: [pageOption('carscomInventoryPage', 500, '24 vehicles a page')],
	},
	{
		displayName: 'Additional Options',
		name: 'carscomDealerReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealer-reviews']),
		options: sorted(reviewOptions('carscomDealerReviews', [10, 20, 30, 40])),
	},
	{
		displayName: 'Additional Options',
		name: 'carscomModelReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['model-reviews']),
		options: sorted(reviewOptions('carscomModelReviews', [10, 20, 30, 50, 100, 200])),
	},
	{
		displayName: 'Additional Options',
		name: 'carscomDealersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['dealers']),
		options: sorted([
			{
				displayName: 'Radius (Miles)',
				name: 'carscomDealersRadius',
				type: 'options',
				default: 30,
				options: DEALER_RADII.map((r) => ({ name: `${r} Miles`, value: r })),
				description: 'Miles around the ZIP',
				routing: { request: { body: { radius: '={{ $value === 30 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Make',
				name: 'carscomDealersMake',
				type: 'string',
				default: '',
				placeholder: 'Toyota',
				description: 'Only dealers that sell this make',
				routing: { request: { body: { make: trimmed } } },
			},
			{
				displayName: 'Min Rating',
				name: 'carscomDealersMinRating',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					{ name: '1 & Up', value: 1 },
					{ name: '2 & Up', value: 2 },
					{ name: '3 & Up', value: 3 },
					{ name: '4 & Up', value: 4 },
				],
				description: 'Lowest dealer rating',
				routing: { request: { body: { min_rating: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'carscomDealersSort',
				type: 'options',
				default: 'rating',
				options: [
					{ name: 'Distance', value: 'distance' },
					{ name: 'Name', value: 'name' },
					{ name: 'Rating', value: 'rating' },
				],
				description: 'Dealer order',
				routing: { request: { body: { sort: '={{ $value === "rating" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Dealer Name',
				name: 'carscomDealersName',
				type: 'string',
				default: '',
				placeholder: 'toyota',
				description: "Words in the dealer's name",
				routing: { request: { body: { dealer_name: trimmed } } },
			},
			pageOption('carscomDealersPage', 500, 'about 20 dealers a page'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'carscomResearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['research']),
		options: sorted([
			{
				displayName: 'Model',
				name: 'carscomResearchModel',
				type: 'string',
				default: '',
				placeholder: 'RAV4',
				description: "A model of the make: the name or Cars.com's slug",
				routing: { request: { body: { model: trimmed } } },
			},
			{
				displayName: 'Year',
				name: 'carscomResearchYear',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 2028 },
				description: 'A model year, with Model (0: none)',
				routing: { request: { body: { year: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Level',
				name: 'carscomResearchLevel',
				type: 'options',
				default: '',
				options: [
					{ name: 'Automatic', value: '' },
					{ name: 'Make', value: 'make' },
					{ name: 'Model', value: 'model' },
					{ name: 'Model Year', value: 'model_year' },
					{ name: 'Trims', value: 'trims' },
				],
				description:
					'Automatic: make without Model, model without Year, model year with Year. Model, Model Year and Trims need Model; Model Year and Trims need Year.',
				routing: { request: { body: { level: '={{ $value || undefined }}' } } },
			},
		]),
	},
];
