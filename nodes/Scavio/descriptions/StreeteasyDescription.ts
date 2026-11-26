import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['streeteasy'], operation, ...extra },
});

// StreetEasy (streeteasy.com, Zillow Group's New York City real estate site): NYC's five boroughs and North New
// Jersey, USD (no country). 5 operations, 1 credit each; credits_used is the truth. Get Listing by ID needs a listing
// type (sale or rent); Get Market Data covers New York City only. Search pages can take StreetEasy up to about 40
// seconds and calls can queue behind the backend's upstream limit, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST =
	"StreetEasy (streeteasy.com, Zillow Group's New York City real estate site, covering NYC's five boroughs and North New Jersey)";
const NAME = 'StreetEasy';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const PEOPLE =
	'No agent or private landlord names, emails, phones or photos are returned; the brokerage is.';
const CARD =
	"listings with ID (what Get Listing takes, with the listing type), URL, placement (organic, featured or sponsored: StreetEasy's paid placements come first), address, unit, area, ZIP, coordinates, price (USD; rent per month), sold price, net effective rent, months free, lease term, price change, beds, baths, size, building type, sale type, status, available and off-market dates, new development, furnished, by owner, the brokerage, the next open house and photos";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const thisYear = new Date().getUTCFullYear();

const AREA_HINT =
	'A StreetEasy area by name, slug or ID: a borough (Manhattan, Brooklyn, Queens, Bronx, Staten Island), a neighborhood (Williamsburg, Upper West Side), a New Jersey city (Jersey City, Hoboken), or nyc for all of NYC and NJ. IDs: 100 Manhattan, 300 Brooklyn, 400 Queens, 302 Williamsburg, 1001000 Jersey City.';

const areaField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Area',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'Brooklyn',
	displayOptions: show([operation]),
	routing: { request: { body: { area: '={{ String($value).trim() }}' } } },
	description: AREA_HINT,
});

const CSV =
	'={{ String($value).trim() ? String($value).split(",").map((s) => s.trim()).filter((s) => s) : undefined }}';

const HOME_TYPES = [
	{ name: 'Co-Op', value: 'coop' },
	{ name: 'Condo', value: 'condo' },
	{ name: 'House', value: 'house' },
	{ name: 'Multifamily', value: 'multifamily' },
];
const SALE_TYPES = [
	{ name: 'Foreclosure', value: 'foreclosure' },
	{ name: 'Resale', value: 'resale' },
	{ name: 'Restricted (Income-Restricted)', value: 'restricted' },
	{ name: 'Sponsor (Sold by the Developer)', value: 'sponsor' },
];
const AMENITIES = [
	'washer_dryer',
	'dishwasher',
	'elevator',
	'doorman',
	'laundry',
	'gym',
	'parking',
	'pool',
	'storage',
	'private_outdoor_space',
	'public_outdoor_space',
	'central_ac',
	'furnished',
	'fireplace',
	'loft',
	'city_view',
	'garden_view',
	'park_view',
	'skyline_view',
	'waterview',
	'guarantor_ok',
	'pied_a_terre',
	'childrens_playroom',
	'smoke_free',
];
const SALES_METRICS = [
	'price_index',
	'inventory',
	'sale_to_list_ratio',
	'recorded_sales',
	'median_sale_price',
	'median_asking_price',
	'median_days_on_market',
	'share_of_price_cuts',
];
const RENTALS_METRICS = ['rental_index', 'inventory', 'median_asking_rent', 'share_of_rent_cuts'];

const searchOptions: INodeProperties[] = [
	{
		displayName: 'Amenities',
		name: 'streeteasySearchAmenities',
		type: 'string',
		default: '',
		placeholder: 'dishwasher, washer_dryer',
		description: `StreetEasy's amenity filters, comma-separated, all required: ${AMENITIES.join(', ')}`,
		routing: { request: { body: { amenities: CSV } } },
	},
	{
		displayName: 'Baths Min',
		name: 'streeteasySearchBathsMin',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 10 },
		description: 'Fewest bathrooms (0: no minimum)',
		routing: { request: { body: { baths_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Beds Max',
		name: 'streeteasySearchBedsMax',
		type: 'number',
		default: -1,
		typeOptions: { minValue: -1, maxValue: 10 },
		description:
			'Most bedrooms, 0 (studio) to 10 (-1: no maximum). Beds Min = Beds Max asks for exactly that many.',
		routing: { request: { body: { beds_max: '={{ $value === -1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Beds Min',
		name: 'streeteasySearchBedsMin',
		type: 'number',
		default: -1,
		typeOptions: { minValue: -1, maxValue: 10 },
		description: 'Fewest bedrooms, 0 (studio) to 10 (-1: no minimum)',
		routing: { request: { body: { beds_min: '={{ $value === -1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'By Owner',
		name: 'streeteasySearchByOwner',
		type: 'boolean',
		default: false,
		description: 'Whether to return only listings posted by the owner, no broker (Mode Rent only)',
		routing: { request: { body: { by_owner: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Home Types',
		name: 'streeteasySearchHomeTypes',
		type: 'multiOptions',
		default: [],
		options: HOME_TYPES,
		description: 'Mode Sale and Sold only',
		routing: { request: { body: { home_types: '={{ $value.length ? $value : undefined }}' } } },
	},
	{
		displayName: 'Page',
		name: 'streeteasySearchPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 100 },
		description:
			'Page, from 1; pages and has_more say how deep the results go (sale pages hold about 38 cards, rent pages 14)',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Pets Allowed',
		name: 'streeteasySearchPets',
		type: 'boolean',
		default: false,
		description: 'Whether to return only listings that allow pets',
		routing: { request: { body: { pets_allowed: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Price Max',
		name: 'streeteasySearchPriceMax',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000000 },
		description: 'Highest price, USD (rent per month on Mode Rent; 0: no maximum)',
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Price Min',
		name: 'streeteasySearchPriceMin',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 1000000000 },
		description: 'Lowest price, USD (rent per month on Mode Rent; 0: no minimum)',
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Sale Types',
		name: 'streeteasySearchSaleTypes',
		type: 'multiOptions',
		default: [],
		options: SALE_TYPES,
		description: 'Mode Sale and Sold only',
		routing: { request: { body: { sale_types: '={{ $value.length ? $value : undefined }}' } } },
	},
	{
		displayName: 'Size Min (Sq Ft)',
		name: 'streeteasySearchSqftMin',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 100000 },
		description:
			'Smallest size in square feet; listings without a size are left out (0: no minimum)',
		routing: { request: { body: { sqft_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'streeteasySearchSort',
		type: 'options',
		default: '',
		options: [
			{ name: 'Default (Recommended; Newest on Mode Sold)', value: '' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Recently Updated', value: 'recently_updated' },
			{ name: 'Recommended', value: 'recommended' },
			{ name: 'Size: Large to Small', value: 'sqft_desc' },
			{ name: 'Size: Small to Large', value: 'sqft_asc' },
		],
		description: 'Order of the organic results (featured and sponsored cards come first)',
		routing: { request: { body: { sort: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Status',
		name: 'streeteasySearchStatus',
		type: 'options',
		default: 'active',
		options: [
			{ name: 'Active (On the Market)', value: 'active' },
			{ name: 'In Contract', value: 'in_contract' },
		],
		description: "Mode Sale only: on the market, or StreetEasy's pending (in contract)",
		routing: { request: { body: { status: '={{ $value === "active" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Year Built Max',
		name: 'streeteasySearchYearBuiltMax',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: thisYear + 5 },
		description: 'Latest year built, from 1700 (0: no maximum)',
		routing: { request: { body: { year_built_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Year Built Min',
		name: 'streeteasySearchYearBuiltMin',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: thisYear + 5 },
		description: 'Earliest year built, from 1700 (0: no minimum)',
		routing: { request: { body: { year_built_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'ZIP Code',
		name: 'streeteasySearchZip',
		type: 'string',
		default: '',
		placeholder: '11211',
		description: 'Only listings in this ZIP code (with Area nyc to search every borough)',
		routing: { request: { body: { zip: '={{ String($value).trim() || undefined }}' } } },
	},
];

export const streeteasyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['streeteasy'] } },
		options: [
			{
				name: 'Get Building',
				value: 'building',
				action: 'Get a streeteasy building',
				description: `One NYC or North NJ building on ${NAME} by slug or link: name, address, area, neighborhood, type, status, year built, floors, units, coordinates, description, amenities, policies (pets, sublets, pied-a-terre), details (developer, architect, manager, the deed owner when a business, sales and leasing office, website), NYC building class and districts, inventory (per bedroom count the available and past listing counts with min and max price), the listed sales and rentals with price, status and brokerage, schools, transit, nearby places, similar buildings and photos. Captured 2026-11-26: Everton at 99 Provost Street, Jersey City, a rental building built in 2026 with 60 floors and 802 units. An unknown building is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/streeteasy/building'),
			},
			{
				name: 'Get Buildings',
				value: 'buildings',
				action: 'Get streeteasy buildings',
				description: `The building directory of ${NAME} for an area, about 11 buildings a page: ID, name, slug (what Get Building takes), URL, address, active sales, active rentals, units, floors, year built, status, type, neighborhood, coordinates and photo, plus total and pages. Captured 2026-11-26: Williamsburg listed 5775 buildings, among them One Domino Square - Condos (160 units, 45 floors, built 2024). ${ONE}.`,
				routing: request('/api/v1/streeteasy/buildings'),
			},
			{
				name: 'Get Listing',
				value: 'listing',
				action: 'Get a streeteasy listing',
				description: `One ${NAME} listing in full (for sale, sold or for rent) by link, or by ID with the listing type: status, address, the building, sale type, description, days on market, listed, available, off-market and sold dates, status changes, rooms, beds, baths, size, amenities, features, views, pricing (price, sold and rented price, price changes, monthly maintenance, taxes and common charges, estimated monthly payment, net effective rent, months free, lease term, security deposit, move-in and monthly fees), the unit's past listings with their events, open houses, photos and floor plans, StreetEasy's recent-listing prices for that bedroom count in the area, MLS number and the brokerage. Captured 2026-11-26: a one-bedroom rental at 99 Provost Street, Jersey City, at 4730 USD a month, net effective rent 4336 USD with 2 months free on a 24-month lease. ${PEOPLE} An unknown listing is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/streeteasy/listing'),
			},
			{
				name: 'Get Market Data',
				value: 'market',
				action: 'Get streeteasy market data',
				description: `The monthly market data ${NAME} publishes for New York City from 2010-01 (its neighborhoods, the five boroughs and NYC), as StreetEasy publishes it; New Jersey areas have no published series. Sales: price index, inventory, sale-to-list ratio, recorded sales, median sale price, median asking price, median days on market, share of price cuts, by home type. Rentals: rental index, inventory, median asking rent, share of rent cuts, by bedrooms. Returns months and, per area, the latest month and value and the monthly values. Captured 2026-11-26: the median sale price in Williamsburg was 1450000 USD in 2026-10. An area StreetEasy publishes no series for is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/streeteasy/market'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search streeteasy listings',
				description: `Search homes for sale, rentals or past sales in an NYC or North NJ area on ${FIRST}: price, bedrooms, bathrooms, size, home type, sale type, year built, amenities, pets, ZIP, by owner (rent) and in contract (sale), 7 sorts, up to 100 pages. Returns the area (with its ID), StreetEasy's criteria as it read them, total, pages, has_more and ${CARD}. Captured 2026-11-26: rentals in Jersey City gave 2927 listings. ${PEOPLE} ${ONE}.`,
				routing: request('/api/v1/streeteasy/search'),
			},
		],
		default: 'search',
	},
];

export const streeteasyFields: INodeProperties[] = [
	// -- Search Listings --
	areaField('streeteasySearchArea', 'search'),
	{
		displayName: 'Mode',
		name: 'streeteasySearchMode',
		type: 'options',
		default: 'sale',
		options: [
			{ name: 'For Rent', value: 'rent' },
			{ name: 'For Sale', value: 'sale' },
			{ name: 'Sold (Past Sales)', value: 'sold' },
		],
		displayOptions: show(['search']),
		routing: { request: { body: { mode: '={{ $value === "sale" ? undefined : $value }}' } } },
		description: 'Homes for sale, rentals or past sales',
	},

	// -- Get Listing --
	{
		displayName: 'Find Listing By',
		name: 'streeteasyListingBy',
		type: 'options',
		default: 'url',
		options: [
			{ name: 'ID and Listing Type', value: 'id' },
			{ name: 'URL or Path', value: 'url' },
		],
		displayOptions: show(['listing']),
		description: 'A listing link or path, or a listing ID with its listing type',
	},
	{
		displayName: 'URL or Path',
		name: 'streeteasyListingUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://streeteasy.com/building/the-pilot/3e',
		displayOptions: show(['listing'], { streeteasyListingBy: ['url'] }),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description:
			'A StreetEasy listing link or path (the URL Search Listings returns), e.g. /building/(building)/(unit)',
	},
	{
		displayName: 'Listing ID',
		name: 'streeteasyListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1850428',
		displayOptions: show(['listing'], { streeteasyListingBy: ['id'] }),
		routing: { request: { body: { id: '={{ String($value).trim() }}' } } },
		description: 'A StreetEasy listing ID (the ID Search Listings returns, digits)',
	},
	{
		displayName: 'Listing Type',
		name: 'streeteasyListingType',
		type: 'options',
		required: true,
		default: 'sale',
		options: [
			{ name: 'Rent', value: 'rent' },
			{ name: 'Sale (For Sale and Sold)', value: 'sale' },
		],
		displayOptions: show(['listing'], { streeteasyListingBy: ['id'] }),
		routing: { request: { body: { listing_type: '={{ $value }}' } } },
		description: 'Required with an ID: sale (for sale and sold listings) or rent',
	},

	// -- Get Building --
	{
		displayName: 'Building Slug or URL',
		name: 'streeteasyBuilding',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'eastlight-condominium',
		displayOptions: show(['building']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:|\\//i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:|\\//i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A StreetEasy building slug (the slug Get Buildings returns) or the building link (a listing link in the building works too)',
	},

	// -- Get Buildings --
	areaField('streeteasyBuildingsArea', 'buildings'),

	// -- Get Market Data --
	{
		displayName: 'Type',
		name: 'streeteasyMarketType',
		type: 'options',
		default: 'sales',
		options: [
			{ name: 'Rentals', value: 'rentals' },
			{ name: 'Sales', value: 'sales' },
		],
		displayOptions: show(['market']),
		routing: { request: { body: { type: '={{ $value === "sales" ? undefined : $value }}' } } },
		description: 'Sales or rentals market data',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'streeteasySearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(searchOptions),
	},
	{
		displayName: 'Additional Options',
		name: 'streeteasyBuildingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['buildings']),
		options: sorted([
			{
				displayName: 'Building Type',
				name: 'streeteasyBuildingsType',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Co-Op', value: 'coop' },
					{ name: 'Condo', value: 'condo' },
					{ name: 'Rental', value: 'rental' },
				],
				description: 'Only buildings of this type',
				routing: { request: { body: { building_type: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'streeteasyBuildingsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page, from 1 (about 11 buildings a page)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'streeteasyMarketOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['market']),
		options: sorted([
			{
				displayName: 'Area',
				name: 'streeteasyMarketArea',
				type: 'string',
				default: '',
				placeholder: 'Williamsburg',
				description:
					'One area by name, slug or ID (a neighborhood, a borough, or NYC); every published area when empty. New York City only.',
				routing: { request: { body: { area: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'End Month',
				name: 'streeteasyMarketEnd',
				type: 'string',
				default: '',
				placeholder: '2026-10',
				description: 'Last month, YYYY-MM',
				routing: { request: { body: { end_month: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Filter',
				name: 'streeteasyMarketFilter',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Co-Op (Sales)', value: 'coop' },
					{ name: 'Condo (Sales)', value: 'condo' },
					{ name: 'One Bedroom (Rentals)', value: 'one_bedroom' },
					{ name: 'Single Family / Townhouse (Sales)', value: 'single_family' },
					{ name: 'Studio (Rentals)', value: 'studio' },
					{ name: 'Three+ Bedrooms (Rentals)', value: 'three_plus_bedrooms' },
					{ name: 'Two Bedrooms (Rentals)', value: 'two_bedrooms' },
				],
				description:
					'Sales by home type, rentals by bedrooms. Price Index and Rental Index are published for All only.',
				routing: { request: { body: { filter: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Metric',
				name: 'streeteasyMarketMetric',
				type: 'string',
				default: '',
				placeholder: 'median_asking_rent',
				description: `Sales: ${SALES_METRICS.join(', ')} (default median_sale_price). Rentals: ${RENTALS_METRICS.join(', ')} (default median_asking_rent).`,
				routing: { request: { body: { metric: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Start Month',
				name: 'streeteasyMarketStart',
				type: 'string',
				default: '',
				placeholder: '2024-01',
				description:
					'First month, YYYY-MM; the series start in 2010-01 (Price Index in 2005-01, Rental Index in 2007-01)',
				routing: {
					request: { body: { start_month: '={{ String($value).trim() || undefined }}' } },
				},
			},
		]),
	},
];
