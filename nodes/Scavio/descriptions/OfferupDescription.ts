import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['offerup'], operation, ...extra },
});

// OfferUp (offerup.com, the US local marketplace for buying and selling used items, cars and
// trucks), 5 operations, 1 credit each; Get Listing is 1, or 2 when the listing needs a second,
// costlier fetch; credits_used is the truth. US only (no country). Search Listings and Get
// Category Listings need a US ZIP. Calls can queue behind the backend's upstream limit, so every
// operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'OfferUp (offerup.com, the US local marketplace for buying and selling used items, cars and trucks)';
const NAME = 'OfferUp';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const PRIVATE =
	'Private sellers: no seller names (a dealer or business account\'s name only), usernames, avatars, phone numbers, emails, street addresses, coordinates or VINs are returned; phone numbers, emails and VIN-like codes inside titles and descriptions read "[removed]". Locations are city and state. Prices are asking prices in USD, not sold prices.';
const FEED =
	"listings with listing_id (what Get Listing takes), title, price (asking price, USD), call_for_price, city, state, URL, image, firm_price, sponsored (a promoted OfferUp listing), local_pickup and vehicle_miles, plus location (zip, resolved: the area OfferUp named for the ZIP, radius_miles), filters_applied, filters_not_applied (filters OfferUp did not apply to this feed), has_more and count. 44-50 listings a page, no total count; listings carry no posted date or condition (Get Listing does)";
const NOT_AVAILABLE =
	'Not available: sold listings or sold prices (OfferUp does not show them publicly), shipping (OfferUp ended nationwide shipping in 2025: listings are local pickup), search suggestions, a total result count, a seller\'s listings past the first 20, messaging or offers.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const zipField = (name: string, operation: string): INodeProperties => ({
	displayName: 'ZIP Code',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '98101',
	displayOptions: show([operation]),
	routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
	description:
		'A 5-digit US ZIP code: OfferUp lists local items, so results are around this ZIP. An unknown ZIP answers 400, not charged.',
});

const RADII = [5, 10, 20, 25, 30, 50, 80, 100, 200, 1500];
const MILEAGES = [25000, 50000, 75000, 100000, 125000, 150000, 175000, 200000];

const feedOptions = (prefix: string): INodeProperties[] => [
	{
		displayName: 'Radius (Miles)',
		name: `${prefix}Radius`,
		type: 'options',
		default: 0,
		options: [
			{ name: "OfferUp's Default", value: 0 },
			...RADII.map((r) => ({ name: `${r} Miles`, value: r })),
		],
		description:
			"Miles around the ZIP (OfferUp's own radii: 5-80 for goods, default 30; 5, 25, 80 (default), 100, 200, 1500 for vehicles). location.radius_miles says which radius OfferUp applied.",
		routing: { request: { body: { radius: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Page',
		name: `${prefix}Page`,
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 50 },
		description: 'Page (at most 50); 44-50 listings a page',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Min Price',
		name: `${prefix}MinPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest asking price, whole USD (0: no minimum)',
		routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Price',
		name: `${prefix}MaxPrice`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Highest asking price, whole USD (0: no maximum)',
		routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Condition',
		name: `${prefix}Condition`,
		type: 'multiOptions',
		default: [],
		options: [
			{ name: 'For Parts', value: 'for_parts' },
			{ name: 'New', value: 'new' },
			{ name: 'Open Box', value: 'open_box' },
			{ name: 'Other', value: 'other' },
			{ name: 'Refurbished', value: 'refurbished' },
			{ name: 'Used', value: 'used' },
		],
		description: "OfferUp's condition filter (empty: any)",
		routing: { request: { body: { condition: '={{ $value && $value.length ? $value : undefined }}' } } },
	},
	{
		displayName: 'Seller Type',
		name: `${prefix}SellerType`,
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Dealer', value: 'dealer' },
			{ name: 'Private', value: 'private' },
		],
		description:
			"Cars and trucks: dealer (OfferUp's verified dealers) or private (private sellers). On Search Listings it limits the results to Cars & Trucks (category ID 5.1), where OfferUp applies it.",
		routing: { request: { body: { seller_type: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Make',
		name: `${prefix}Make`,
		type: 'string',
		default: '',
		placeholder: 'Toyota',
		description: 'Vehicles: the make as OfferUp lists it (61 makes)',
		routing: { request: { body: { make: '={{ String($value).trim() || undefined }}' } } },
	},
	{
		displayName: 'Year Min',
		name: `${prefix}YearMin`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 2027 },
		description: 'Vehicles: earliest model year, 1936-2027 (0: no minimum)',
		routing: { request: { body: { year_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Year Max',
		name: `${prefix}YearMax`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 2027 },
		description: 'Vehicles: latest model year, 1936-2027 (0: no maximum)',
		routing: { request: { body: { year_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Mileage',
		name: `${prefix}MaxMileage`,
		type: 'options',
		default: -1,
		options: [
			{ name: 'Any', value: -1 },
			{ name: '0 Miles', value: 0 },
			...MILEAGES.map((m) => ({ name: `${m.toLocaleString('en-US')} Miles`, value: m })),
		],
		description: "Vehicles: most miles, one of OfferUp's steps",
		routing: { request: { body: { max_mileage: '={{ $value === -1 ? undefined : $value }}' } } },
	},
];

const VEHICLE_SORTS = [
	{ name: 'Lowest Mileage (Vehicles)', value: 'lowest_mileage' },
	{ name: 'Newest Model Year (Vehicles)', value: 'newest_year' },
];

export const offerupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['offerup'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get offerup categories',
				description: `The category tree of ${FIRST}: 14 top-level categories, 151 in all, each with ID, name, slug, URL and children. Slugs and IDs are what Get Category Listings' Category takes; IDs are what Search Listings' Category ID takes. ${ONE}.`,
				routing: request('/api/v1/offerup/categories', true),
			},
			{
				name: 'Get Category Listings',
				value: 'category',
				action: 'Get offerup category listings',
				description: `Browse one category of ${FIRST} by slug or ID around a US ZIP, with a radius, sorted (newest by default, distance, price; cars-and-trucks also newest model year and lowest mileage; no best match order) and filtered like Search Listings: the category (ID, name, slug, parent) and ${FEED}. ${PRIVATE} An unknown category is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/offerup/category'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get an offerup listing',
				description: `One ${NAME} listing by ID or link: price, original_price, firm_price, status, condition (OfferUp's grade), posted_at, updated_at, description, photos, category, attributes, vehicle details (make, model, year, mileage, trim, body, drivetrain, fuel, transmission and more; no VIN), city, state, local_pickup and the seller's public numbers (ID, seller_type, business_name for dealer and business accounts only, rating, rating_count, items_sold, joined, response_time, last_active). Captured 2026-11-25: a dealer's 2021 Toyota Tacoma SR Double Cab in Fort Worth, TX at 27224 USD with 65692 miles. ${PRIVATE} An unknown ID is a charged not-found. ${CHARGE} Costs 1 credit, or 2 when the listing needs a second, costlier fetch (credits_used says which).`,
				routing: request('/api/v1/offerup/listing'),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get an offerup seller',
				description: `A seller's public profile on ${FIRST} by seller ID (the seller ID Get Listing returns): seller_type, business_name (dealer and business accounts only), rating, rating_count, rating_attributes, items_sold, items_purchased, followers, joined, city, state, response_time, last_active, verified_badges, website and opening hours (dealer and business accounts only), and the first 20 listings the profile shows. ${PRIVATE} An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/offerup/seller'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search offerup listings',
				description: `Search the listings of ${FIRST} by keywords around a US ZIP, with a radius, sorted (best match, newest, distance, price, and for vehicles newest model year and lowest mileage), filtered (asking price, condition, category, and for cars and trucks dealer or private seller, make, model year, mileage) and paged up to page 50: ${FEED}. The same keyword in two ZIPs gives the asking prices in two US metros (captured 2026-11-25: 98101 resolved to Seattle, 60601 to Chicago). ${PRIVATE} ${NOT_AVAILABLE} ${ONE}.`,
				routing: request('/api/v1/offerup/search'),
			},
		],
		default: 'search',
	},
];

export const offerupFields: INodeProperties[] = [
	// -- Search Listings --
	{
		displayName: 'Keywords',
		name: 'offerupQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'iphone 15',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
		description: 'Keywords to search OfferUp listings for',
	},
	zipField('offerupSearchZip', 'search'),

	// -- Get Category Listings --
	{
		displayName: 'Category',
		name: 'offerupCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'furniture',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			'A category slug (e.g. furniture, cars-and-trucks) or ID (e.g. 2.1) from Get Categories. An unknown slug is a charged not-found.',
	},
	zipField('offerupCategoryZip', 'category'),

	// -- Get Listing --
	{
		displayName: 'Listing ID or URL',
		name: 'offerupListing',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7a392126-fb9d-34c2-a6d8-1b94698428df',
		displayOptions: show(['listing']),
		routing: {
			request: {
				body: {
					listing_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'An OfferUp listing ID (listing_id from Search Listings) or the listing link (an offerup.com/item/detail/ link)',
	},

	// -- Get Seller --
	{
		displayName: 'Seller ID or URL',
		name: 'offerupSeller',
		type: 'string',
		required: true,
		default: '',
		placeholder: '8668343',
		displayOptions: show(['seller']),
		routing: { request: { body: { seller_id: '={{ String($value).trim() }}' } } },
		description: 'A seller ID (the seller ID Get Listing returns, digits) or an offerup.com/p/ profile link',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'offerupSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			...feedOptions('offerupSearch'),
			{
				displayName: 'Sort',
				name: 'offerupSearchSort',
				type: 'options',
				default: 'best_match',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Distance', value: 'distance' },
					...VEHICLE_SORTS,
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				description: 'Result order (the vehicle sorts apply to cars and trucks)',
				routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Category ID',
				name: 'offerupSearchCategoryId',
				type: 'string',
				default: '',
				placeholder: '2.1',
				description: 'Only listings in this category: an ID from Get Categories (e.g. 2.1 Furniture, 5.1 Cars & Trucks)',
				routing: { request: { body: { category_id: '={{ String($value).trim() || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'offerupCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			...feedOptions('offerupCategory'),
			{
				displayName: 'Sort',
				name: 'offerupCategorySort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Distance', value: 'distance' },
					...VEHICLE_SORTS,
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				description: 'Result order (category feeds have no best match order; the vehicle sorts apply to cars-and-trucks)',
				routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
			},
		]),
	},
];
