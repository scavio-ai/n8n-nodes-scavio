import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['discounttire'], operation, ...extra },
});

// Discount Tire (discounttire.com, the US tire and wheel retailer, America's Tire in parts of CA, PA,
// NJ and NY), 15 operations, 1 credit each; credits_used is the truth. US only: no operation sends a
// country. Prices, stock and promotions are per store, so Search Tires by Size, Get Tires for Vehicle,
// Get Product, Get Model, Get Wheels and Browse Tire Models send a store code or a ZIP (Price At).
// Calls can queue behind the backend's upstream limit, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME =
	"Discount Tire (discounttire.com, the US tire and wheel retailer, America's Tire in parts of CA, PA, NJ and NY)";
const PER_STORE =
	"Prices, stock and promotions are per store: Price At sends a store code or a ZIP (the nearest store is used), and store names the store used (store_code, brand Discount Tire or America's Tire, name, address). Price can differ between stores and is not different at every store: measured 2026-11-25, Michelin Defender 2 225/65R17 (item 108547) was $206 a tire at 9 stores in 8 states and $205 at an America's Tire store in New Jersey.";
const NO_SET =
	"price is per tire or wheel: Discount Tire publishes no set-of-four price (4 x price is arithmetic, not a Discount Tire price). Promotions are Discount Tire's own title and text with its end date (ends, ISO 8601 UTC, and ends_text as given); no start date.";
const ITEM =
	'items with item_number (for Get Product, Get Store Stock and Get Reviews), model_id (for Get Model), brand, model, name, size, price (per tire or wheel), promotions, rating, review_count, stock (store_code, exact units, message), GTIN, manufacturer_part_number, mileage_warranty, tier (Good / Better / Best), original_equipment, image and URL';
const LIST =
	'plus market, store, total, page, page_size (20 by default), total_pages and facets (each values[].filter is what Filters takes).';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged)';
const NOT_AVAILABLE =
	'Not available: the deals page text, road hazard and certificate prices, financing, installation and fee amounts, the Treadwell chat, fleet accounts, Tire Rack, price history, checkout and booking';
const ITEM_HINT =
	'A Discount Tire item number (item_number from a list, the number after /p/ in a discounttire.com product link, e.g. 108547)';
const STORE_HINT = 'A Discount Tire / America\'s Tire store code (store_code from Find Stores, e.g. 1009)';
const ARRAY = '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}';
const CSV =
	'={{ $value ? String($value).split(",").map((s) => s.trim()).filter((s) => s) : undefined }}';

const PRICED_OPS = ['search', 'vehicleTires', 'product', 'model', 'wheels', 'browse'];

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'discounttirePage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 500 },
	description: 'Page, 1-500',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const pageSizeOption: INodeProperties = {
	displayName: 'Page Size',
	name: 'discounttirePageSize',
	type: 'number',
	default: 20,
	typeOptions: { minValue: 1, maxValue: 100 },
	description: 'Items per page, 1-100',
	routing: { request: { body: { page_size: '={{ $value === 20 ? undefined : $value }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'discounttireFilters',
	type: 'json',
	default: '',
	placeholder: '["brands:brand-MCH"]',
	description:
		'Up to 10 filter tokens exactly as an earlier response gives them in its facets (the filter of each value: brand, category, speed rating, load range, sidewall, Good / Better / Best); several are combined',
	routing: { request: { body: { filters: ARRAY } } },
};

const brandOption: INodeProperties = {
	displayName: 'Brand',
	name: 'discounttireBrandFilter',
	type: 'string',
	default: '',
	placeholder: 'Michelin',
	description: 'Only this brand, as Discount Tire writes it (its Brands facet)',
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const minPriceOption: INodeProperties = {
	displayName: 'Min Price',
	name: 'discounttireMinPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Lowest price per tire or wheel in USD at the store (0: no minimum)',
	routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
};

const maxPriceOption: INodeProperties = {
	displayName: 'Max Price',
	name: 'discounttireMaxPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: 'Highest price per tire or wheel in USD at the store (0: no maximum)',
	routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
};

const instantSavingsOption: INodeProperties = {
	displayName: 'Instant Savings Only',
	name: 'discounttireInstantSavings',
	type: 'boolean',
	default: false,
	description: 'Whether to return only items with an instant saving',
	routing: { request: { body: { instant_savings: '={{ $value || undefined }}' } } },
};

const inStockOption: INodeProperties = {
	displayName: 'In Stock Only',
	name: 'discounttireInStock',
	type: 'boolean',
	default: false,
	description: 'Whether to return only items in stock at the store',
	routing: { request: { body: { in_stock: '={{ $value || undefined }}' } } },
};

const listOptions = [
	pageOption,
	pageSizeOption,
	filtersOption,
	brandOption,
	minPriceOption,
	maxPriceOption,
	instantSavingsOption,
	inStockOption,
];

const tireSortOptions = [
	{ name: 'Best Seller', value: 'best_seller' },
	{ name: 'Highest Rated', value: 'rating' },
	{ name: 'Price: High to Low', value: 'price_high' },
	{ name: 'Price: Low to High', value: 'price_low' },
];

const sortOption = (options: Array<{ name: string; value: string }>, fallback = 'best_seller'): INodeProperties => ({
	displayName: 'Sort',
	name: 'discounttireSort',
	type: 'options',
	default: fallback,
	options,
	description: "Result order (Best Seller is Discount Tire's default)",
	routing: { request: { body: { sort: `={{ $value === "${fallback}" ? undefined : $value }}` } } },
});

const tireFilters: INodeProperties[] = [
	{
		displayName: 'Tire Category',
		name: 'discounttireTireCategory',
		type: 'string',
		default: '',
		placeholder: 'All-Season Tires',
		description: 'A tire category as Discount Tire writes it (its Tire Category facet, or a code such as winterTires)',
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Speed Rating',
		name: 'discounttireSpeedRating',
		type: 'string',
		default: '',
		placeholder: 'H',
		description: 'A speed rating letter, matched to Discount Tire\'s Speed Rating facet',
		routing: { request: { body: { speed_rating: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Mileage Warranty',
		name: 'discounttireMileageWarranty',
		type: 'string',
		default: '',
		placeholder: '60,000-70,000',
		description: 'A Mileage Warranty facet label as Discount Tire writes it',
		routing: { request: { body: { mileage_warranty: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Load Range',
		name: 'discounttireLoadRange',
		type: 'string',
		default: '',
		placeholder: 'XL',
		description: 'Load range (SL, XL, C, D, E)',
		routing: { request: { body: { load_range: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Three-Peak Snowflake Only',
		name: 'discounttireThreePeak',
		type: 'boolean',
		default: false,
		description: 'Whether to return only tires with the Three-Peak Mountain Snowflake mark',
		routing: { request: { body: { three_peak: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Run Flat Only',
		name: 'discounttireRunFlat',
		type: 'boolean',
		default: false,
		description: 'Whether to return only run-flat tires',
		routing: { request: { body: { run_flat: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Rebates Only',
		name: 'discounttireRebates',
		type: 'boolean',
		default: false,
		description: 'Whether to return only tires with a rebate',
		routing: { request: { body: { rebates: '={{ $value || undefined }}' } } },
	},
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const collection = (name: string, operation: string, options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...options]),
});

const vehicleIdFields = (operations: string[], required: boolean, extra: Record<string, string[]> = {}): INodeProperties[] => [
	{
		displayName: 'Vehicle ID',
		name: 'discounttireVehicleId',
		type: 'string',
		required,
		default: '',
		placeholder: '17361',
		displayOptions: show(operations, extra),
		routing: { request: { body: { vehicle_id: required ? '={{ $value }}' : '={{ $value || undefined }}' } } },
		description: 'The vehicle_id from Get Vehicle Fitment (models step), e.g. 17361 for a 2022 Ford F-150',
	},
	{
		displayName: 'Trim ID',
		name: 'discounttireTrimId',
		type: 'string',
		required,
		default: '',
		placeholder: '52455',
		displayOptions: show(operations, extra),
		routing: { request: { body: { trim_id: required ? '={{ $value }}' : '={{ $value || undefined }}' } } },
		description: 'The trim_id from Get Vehicle Fitment (trims step), e.g. 52455 for XLT Crew Cab 2WD',
	},
	{
		displayName: 'Assembly ID',
		name: 'discounttireAssemblyId',
		type: 'string',
		required,
		default: '',
		placeholder: '0000E28B',
		displayOptions: show(operations, extra),
		routing: { request: { body: { assembly_id: required ? '={{ $value }}' : '={{ $value || undefined }}' } } },
		description: 'The assembly_id from Get Vehicle Fitment (assemblies step): the tire size option, e.g. 0000E28B for 245/70R17',
	},
];

export const discounttireOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['discounttire'] } },
		options: [
			{
				name: 'Browse Tire Models',
				value: 'browse',
				action: 'Browse discount tire tire models',
				description: `${NAME} tire models in one category (a slug from Get Categories), of one tire brand, or matching keywords, at one store: model_id, brand, model, price_range at the store, rating and promotions, plus total and facets. ${PER_STORE} An unknown category or brand is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/discounttire/browse'),
			},
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find discount tire stores near a zip code',
				description: `${NAME} stores near a US ZIP or city (10 per page, nearest first): store_code (the Price At store), brand (Discount Tire or America's Tire), name, location_name, address, phone, coordinates, distance_miles, rating, review_count and services, plus total. ${ONE}.`,
				routing: request('/api/v1/discounttire/stores'),
			},
			{
				name: 'Get Appointment Availability',
				value: 'appointments',
				action: 'Get discount tire appointment availability',
				description: `The service-appointment calendar of one ${NAME} store for a month as Discount Tire's appointment page shows it, read only (Scavio never books): per day date, day_of_week, bookable, message, holiday, opens, closes, slot_count and slots (start and end in the store's local time, YYYY-MM-DDTHH:MM, no time zone). ${ONE}.`,
				routing: request('/api/v1/discounttire/appointments'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get discount tire categories',
				description: `${NAME}'s tire or wheel types: code, name (the Tire Category filter), slug (the Browse Tire Models category), description, groups, URL and image. ${ONE}.`,
				routing: request('/api/v1/discounttire/categories', true),
			},
			{
				name: 'Get Model',
				value: 'model',
				action: 'Get a discount tire tire or wheel model',
				description: `Every size of one ${NAME} tire or wheel model (model_id, e.g. michelin-defender-2) at one store: brand, model, rating, review_count, price_range, promotions, item_count, items (item_number, price), size_options and spec_ranges. Captured 2026-11-25: michelin-defender-2 had 60 sizes at store 1009, $180 to $327 a tire. ${PER_STORE} ${NO_SET} An unknown model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/discounttire/model'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a discount tire product',
				description: `One ${NAME} tire or wheel by item number at one store: price, promotions, exact units at the store, GTIN, manufacturer_part_number, tire specs (load index, speed rating, load range, UTQG, tread depth, max pressure, overall diameter, sidewall, run flat) or wheel specs (diameter, width, bolt pattern, offset, hub bore, finish, color), weight, FAQs, images and nearby_store_stock. Captured 2026-11-25: item 108547, Michelin Defender 2 225/65R17, $206.00 a tire at store 1009 with 25 units. ${PER_STORE} ${NO_SET} An unknown item is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/discounttire/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get discount tire tire reviews',
				description: `${NAME}'s own reviews of a tire, the whole model or this size, sorted (newest, highest, lowest, most helpful), one star rating, fully paged: rating, text, date, recommended, helpful votes, category ratings (tread life, wet and dry traction, cornering, ride noise, ride comfort, winter), pros, cons, state and vehicle, plus rating, review_count and rating_breakdown. No reviewer names or cities. ${ONE}.`,
				routing: request('/api/v1/discounttire/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a discount tire store',
				description: `One ${NAME} store by store code: brand, name, address, phone, coordinates, rating, cleanliness and knowledge ratings, recommended_percent, rating_breakdown, dated hours for the coming week, services, features, images and nearby stores. No staff names. An unknown store is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/discounttire/store'),
			},
			{
				name: 'Get Store Reviews',
				value: 'storeReviews',
				action: 'Get discount tire store reviews',
				description: `${NAME}'s own reviews of one store (5 per page), sorted, one star rating: rating, text, date, recommended, helpful votes and category ratings (overall, cleanliness, knowledge), plus rating_breakdown and total. No reviewer names. An unknown store is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/discounttire/store-reviews'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get discount tire store stock',
				description: `Exact units of 1-4 ${NAME} items at the stores near a US ZIP (radius 10-150 miles, sorted by distance or availability, 5 stores per page): per store store_code, brand, name, address, phone, coordinates, distance_miles and stock (item_number, units, message). message is Discount Tire's availability text for the quantity asked; a store with 0 units can still say "Available as soon as" with a date. ${ONE}.`,
				routing: request('/api/v1/discounttire/store-stock'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get discount tire search suggestions',
				description: `What ${NAME}'s search box suggests for a few letters: products (model_id, item_number, brand, model, description, type, URL, image) and categories (code, name, count). No prices. ${ONE}.`,
				routing: request('/api/v1/discounttire/suggestions'),
			},
			{
				name: 'Get Tires for Vehicle',
				value: 'vehicleTires',
				action: 'Get discount tire tires for a vehicle',
				description: `The tires ${NAME} lists for one vehicle fitment (vehicle, trim and assembly IDs from Get Vehicle Fitment) at one store, sorted, filtered and paged, with the vehicle maker's original-equipment tire flagged (original_equipment): ${ITEM}, ${LIST} Staggered vehicles (different front and rear sizes) come back as front / rear sets, each tire with its own per-tire price (a set is 2 front + 2 rear), or one axle with Position. Ranking Treadwell adds Discount Tire's Treadwell ranking fields (rank, mileage, miles per dollar, ride and stopping ratings): Discount Tire's own estimates, as given. ${PER_STORE} ${NO_SET} ${ONE}.`,
				routing: request('/api/v1/discounttire/vehicle-tires'),
			},
			{
				name: 'Get Vehicle Fitment',
				value: 'vehicle',
				action: 'Get discount tire vehicle fitment',
				description: `${NAME}'s vehicle selector, one step per call (step, count, options, next): nothing -> years; year -> makes; year + make -> models (vehicle_id); vehicle ID -> trims (trim_id); vehicle + trim ID -> tire size options (assembly_id, front_size, rear_size, staggered); all three IDs -> fitment (front and rear size, staggered, wheel diameters, ride height, drive, lug_torque as given, optional sizes with their fit). Captured 2026-11-25: 2022 Ford F-150 is vehicle_id 17361, XLT Crew Cab 2WD trim_id 52455, assembly 0000E28B is 245/70R17. ${ONE}.`,
				routing: request('/api/v1/discounttire/vehicle', true),
			},
			{
				name: 'Get Wheels',
				value: 'wheels',
				action: 'Get discount tire wheels',
				description: `${NAME} wheels by size (diameter, width and bolt pattern) or that fit a vehicle (vehicle, trim and assembly IDs from Get Vehicle Fitment), at one store, sorted, filtered (brand, category, color, special offers, instant savings, in stock, price, any facet) and paged: ${ITEM}, ${LIST} Items can be wheel models with a price_range at the store. ${PER_STORE} ${ONE}.`,
				routing: request('/api/v1/discounttire/wheels'),
			},
			{
				name: 'Search Tires by Size',
				value: 'search',
				action: 'Search discount tire tires by size',
				description: `Tires in one size at one ${NAME} store (225/65R17, LT265/70R17, 35x12.50R20; optional rear size for staggered front / rear pairs), sorted (best seller, price, rating), filtered (brand, category, speed rating, load range, Three-Peak snowflake, run flat, rebates, instant savings, in stock, price, mileage warranty, any facet) and paged: ${ITEM}, ${LIST} ${PER_STORE} ${NO_SET} ${ONE}. ${NOT_AVAILABLE}.`,
				routing: request('/api/v1/discounttire/search'),
			},
		],
		default: 'search',
	},
];

export const discounttireFields: INodeProperties[] = [
	// -- Search Tires by Size --
	{
		displayName: 'Tire Size',
		name: 'discounttireSize',
		type: 'string',
		required: true,
		default: '',
		placeholder: '225/65R17',
		displayOptions: show(['search']),
		routing: { request: { body: { size: '={{ $value }}' } } },
		description: 'A tire size such as 225/65R17, LT265/70R17 or 35x12.50R20',
	},

	// -- Get Vehicle Fitment --
	{
		displayName: 'Year',
		name: 'discounttireYear',
		type: 'string',
		default: '',
		placeholder: '2022',
		displayOptions: show(['vehicle']),
		routing: { request: { body: { year: '={{ $value || undefined }}' } } },
		description: 'Model year: its makes (with Make: its models). Empty with every other field empty: the years.',
	},
	{
		displayName: 'Make',
		name: 'discounttireMake',
		type: 'string',
		default: '',
		placeholder: 'Ford',
		displayOptions: show(['vehicle']),
		routing: { request: { body: { make: '={{ $value || undefined }}' } } },
		description: 'A make as Discount Tire writes it (options[].make of the makes step), with Year',
	},
	...vehicleIdFields(['vehicle'], false),

	// -- Get Tires for Vehicle --
	...vehicleIdFields(['vehicleTires'], true),

	// -- Get Wheels --
	{
		displayName: 'Find Wheels By',
		name: 'discounttireWheelsBy',
		type: 'options',
		default: 'size',
		options: [
			{ name: 'Size and Bolt Pattern', value: 'size' },
			{ name: 'Vehicle Fitment', value: 'vehicle' },
		],
		displayOptions: show(['wheels']),
		description: 'Wheels by diameter, width and bolt pattern, or the wheels that fit a vehicle',
	},
	{
		displayName: 'Diameter',
		name: 'discounttireWheelDiameter',
		type: 'string',
		required: true,
		default: '',
		placeholder: '20',
		displayOptions: show(['wheels'], { discounttireWheelsBy: ['size'] }),
		routing: { request: { body: { diameter: '={{ $value }}' } } },
		description: 'Wheel diameter in inches',
	},
	{
		displayName: 'Width',
		name: 'discounttireWheelWidth',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9',
		displayOptions: show(['wheels'], { discounttireWheelsBy: ['size'] }),
		routing: { request: { body: { width: '={{ $value }}' } } },
		description: 'Wheel width in inches',
	},
	{
		displayName: 'Bolt Pattern',
		name: 'discounttireBoltPattern',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6-135',
		displayOptions: show(['wheels'], { discounttireWheelsBy: ['size'] }),
		routing: { request: { body: { bolt_pattern: '={{ $value }}' } } },
		description: 'Lugs and bolt circle in mm (6-135, 6x139.7) or inches (5x4.5)',
	},
	...vehicleIdFields(['wheels'], true, { discounttireWheelsBy: ['vehicle'] }),

	// -- Browse Tire Models --
	{
		displayName: 'Browse By',
		name: 'discounttireBrowseBy',
		type: 'options',
		default: 'category',
		options: [
			{ name: 'Brand', value: 'brand' },
			{ name: 'Category', value: 'category' },
			{ name: 'Keywords', value: 'q' },
		],
		displayOptions: show(['browse']),
		description: 'Tire models in a category, of a brand, or matching keywords',
	},
	{
		displayName: 'Category Slug',
		name: 'discounttireBrowseCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'all-season-tires',
		displayOptions: show(['browse'], { discounttireBrowseBy: ['category'] }),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A category slug from Get Categories',
	},
	{
		displayName: 'Brand',
		name: 'discounttireBrowseBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Michelin',
		displayOptions: show(['browse'], { discounttireBrowseBy: ['brand'] }),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'A tire brand: its models',
	},
	{
		displayName: 'Keywords',
		name: 'discounttireBrowseQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'michelin defender',
		displayOptions: show(['browse'], { discounttireBrowseBy: ['q'] }),
		routing: { request: { body: { q: '={{ $value }}' } } },
		description: 'Keywords, 2 characters or more',
	},

	// -- Get Product, Get Reviews --
	{
		displayName: 'Item Number',
		name: 'discounttireItem',
		type: 'string',
		required: true,
		default: '',
		placeholder: '108547',
		displayOptions: show(['product', 'reviews']),
		routing: { request: { body: { item_number: '={{ String($value).trim() }}' } } },
		description: ITEM_HINT,
	},

	// -- Get Model --
	{
		displayName: 'Model ID or URL',
		name: 'discounttireModelId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'michelin-defender-2',
		displayOptions: show(['model']),
		routing: { request: { body: { model_id: '={{ String($value).trim() }}' } } },
		description: 'A model_id from a list (e.g. michelin-defender-2) or a discounttire.com /buy-tires/ or /buy-wheels/ link',
	},

	// -- Price At (Search Tires by Size, Get Tires for Vehicle, Get Product, Get Model, Get Wheels, Browse Tire Models) --
	{
		displayName: 'Price At',
		name: 'discounttirePriceBy',
		type: 'options',
		default: 'store',
		options: [
			{ name: 'Store Code', value: 'store' },
			{ name: 'ZIP Code (Nearest Store)', value: 'zip' },
		],
		displayOptions: show(PRICED_OPS),
		description:
			'Discount Tire prices by store: price at a store code, or at the nearest store to a ZIP code. One is required.',
	},
	{
		displayName: 'Store Code',
		name: 'discounttirePriceStore',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1009',
		displayOptions: show(PRICED_OPS, { discounttirePriceBy: ['store'] }),
		routing: { request: { body: { store: '={{ $value }}' } } },
		description: STORE_HINT,
	},
	{
		displayName: 'ZIP Code',
		name: 'discounttirePriceZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '85251',
		displayOptions: show(PRICED_OPS, { discounttirePriceBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP code: prices are for the nearest store (named in the response)',
	},

	// -- Get Store Stock --
	{
		displayName: 'Item Numbers',
		name: 'discounttireStockItems',
		type: 'string',
		required: true,
		default: '',
		placeholder: '108547',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { item_numbers: CSV } } },
		description: '1-4 comma-separated Discount Tire item numbers checked together (e.g. a staggered front and rear)',
	},
	{
		displayName: 'ZIP Code',
		name: 'discounttireStockZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '85251',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP code: the stores near it',
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'discounttireStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find the stores near a US ZIP code or a city',
	},
	{
		displayName: 'ZIP Code',
		name: 'discounttireStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '85251',
		displayOptions: show(['stores'], { discounttireStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A US ZIP code',
	},
	{
		displayName: 'City',
		name: 'discounttireStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Phoenix, AZ',
		displayOptions: show(['stores'], { discounttireStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'A US city and state, e.g. Phoenix, AZ',
	},

	// -- Get Store, Get Store Reviews, Get Appointment Availability --
	{
		displayName: 'Store Code',
		name: 'discounttireStoreCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1009',
		displayOptions: show(['store', 'storeReviews', 'appointments']),
		routing: { request: { body: { store_code: '={{ String($value).trim() }}' } } },
		description: STORE_HINT,
	},

	// -- Get Categories --
	{
		displayName: 'Type',
		name: 'discounttireCategoriesType',
		type: 'options',
		default: 'tires',
		options: [
			{ name: 'Tires', value: 'tires' },
			{ name: 'Wheels', value: 'wheels' },
		],
		displayOptions: show(['categories']),
		routing: { request: { body: { type: '={{ $value === "tires" ? undefined : $value }}' } } },
		description: 'Tire types (default) or wheel types',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'discounttireSuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'michelin',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { q: '={{ $value }}' } } },
		description: 'What a shopper types, 3 characters or more',
	},

	// -- Additional Options --
	collection('discounttireSearchOptions', 'search', [
		...listOptions,
		...tireFilters,
		sortOption(tireSortOptions),
		{
			displayName: 'Rear Size',
			name: 'discounttireRearSize',
			type: 'string',
			default: '',
			placeholder: '305/30R20',
			description: 'Rear size for a staggered pair: items become front / rear pairs',
			routing: { request: { body: { rear_size: '={{ $value || undefined }}' } } },
		},
	]),
	collection('discounttireVehicleTiresOptions', 'vehicleTires', [
		...listOptions,
		...tireFilters,
		sortOption([...tireSortOptions, { name: 'Treadwell Rank', value: 'treadwell' }]),
		{
			displayName: 'Position',
			name: 'discounttirePosition',
			type: 'options',
			default: 'set',
			options: [
				{ name: 'Front / Rear Sets', value: 'set' },
				{ name: 'Front Axle', value: 'front' },
				{ name: 'Rear Axle', value: 'rear' },
			],
			description: 'Staggered vehicles only: front / rear sets (default) or one axle',
			routing: { request: { body: { position: '={{ $value === "set" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Ranking',
			name: 'discounttireRanking',
			type: 'options',
			default: 'all',
			options: [
				{ name: 'All', value: 'all' },
				{ name: 'Treadwell', value: 'treadwell' },
			],
			description: "All tires (default) or Discount Tire's Treadwell ranking with its own mileage, ride and stopping estimates",
			routing: { request: { body: { ranking: '={{ $value === "all" ? undefined : $value }}' } } },
		},
	]),
	collection('discounttireProductOptions', 'product', [
		{
			displayName: 'Nearby Stores',
			name: 'discounttireNearbyStores',
			type: 'string',
			default: '',
			placeholder: '1022,1003',
			description: 'Up to 10 comma-separated store codes Discount Tire checks for a nearby store with stock',
			routing: { request: { body: { nearby_stores: CSV } } },
		},
	]),
	collection('discounttireModelOptions', 'model', [
		{
			displayName: 'Type',
			name: 'discounttireModelType',
			type: 'options',
			default: '',
			options: [
				{ name: 'Auto', value: '' },
				{ name: 'Tires', value: 'tires' },
				{ name: 'Wheels', value: 'wheels' },
			],
			description: 'Tires or wheels (Auto: from the link, else tires then wheels)',
			routing: { request: { body: { type: '={{ $value || undefined }}' } } },
		},
	]),
	collection('discounttireStockOptions', 'storeStock', [
		{
			displayName: 'Radius (Miles)',
			name: 'discounttireStockRadius',
			type: 'options',
			default: 25,
			options: [
				{ name: '10', value: 10 },
				{ name: '150', value: 150 },
				{ name: '25', value: 25 },
				{ name: '50', value: 50 },
				{ name: '75', value: 75 },
			],
			description: 'How far from the ZIP to look',
			routing: { request: { body: { radius: '={{ $value === 25 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'discounttireStockSort',
			type: 'options',
			default: 'distance',
			options: [
				{ name: 'Availability', value: 'availability' },
				{ name: 'Distance', value: 'distance' },
			],
			description: 'Nearest first (default) or most available first',
			routing: { request: { body: { sort: '={{ $value === "distance" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Page',
			name: 'discounttireStockPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Page, 5 stores per page',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Quantity',
			name: 'discounttireStockQuantity',
			type: 'number',
			default: 4,
			typeOptions: { minValue: 1, maxValue: 8 },
			description: "How many of each item, 1-8: Discount Tire's availability text is written for this quantity",
			routing: { request: { body: { quantity: '={{ $value === 4 ? undefined : $value }}' } } },
		},
		{
			displayName: 'My Store Code',
			name: 'discounttireStockMyStore',
			type: 'string',
			default: '',
			placeholder: '1009',
			description: 'Optional: your store; its units come back in my_store',
			routing: { request: { body: { store: '={{ $value || undefined }}' } } },
		},
	]),
	collection('discounttireStoresOptions', 'stores', [
		{
			displayName: 'Radius (Miles)',
			name: 'discounttireStoresRadius',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 150 },
			description: "Miles, 1-150 (0: Discount Tire's default)",
			routing: { request: { body: { radius: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: 'discounttireStoresPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 50 },
			description: 'Page, 10 stores per page',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
	]),
	collection('discounttireReviewsOptions', 'reviews', [
		{
			displayName: 'Scope',
			name: 'discounttireReviewScope',
			type: 'options',
			default: 'model',
			options: [
				{ name: 'Whole Model', value: 'model' },
				{ name: 'This Size', value: 'size' },
			],
			description: 'Reviews of every size of the tire model (default) or of this item only',
			routing: { request: { body: { scope: '={{ $value === "model" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'discounttireReviewSort',
			type: 'options',
			default: 'newest',
			options: [
				{ name: 'Highest Rated', value: 'highest' },
				{ name: 'Lowest Rated', value: 'lowest' },
				{ name: 'Most Helpful', value: 'most_helpful' },
				{ name: 'Newest', value: 'newest' },
			],
			description: 'Review order (Newest is the default)',
			routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Star Rating',
			name: 'discounttireReviewRating',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 5 },
			description: 'Only reviews with this star rating, 1-5 (0: all)',
			routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: 'discounttireReviewPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 5000 },
			description: 'Page, 1-5000',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Page Size',
			name: 'discounttireReviewPageSize',
			type: 'number',
			default: 10,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Reviews per page, 1-100',
			routing: { request: { body: { page_size: '={{ $value === 10 ? undefined : $value }}' } } },
		},
	]),
	collection('discounttireStoreReviewsOptions', 'storeReviews', [
		{
			displayName: 'Sort',
			name: 'discounttireStoreReviewSort',
			type: 'options',
			default: 'newest',
			options: [
				{ name: 'Highest Rated', value: 'highest' },
				{ name: 'Lowest Rated', value: 'lowest' },
				{ name: 'Most Helpful', value: 'most_helpful' },
				{ name: 'Newest', value: 'newest' },
			],
			description: 'Review order (Newest is the default)',
			routing: { request: { body: { sort: '={{ $value === "newest" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Star Rating',
			name: 'discounttireStoreReviewRating',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 5 },
			description: 'Only reviews with this star rating, 1-5 (0: all)',
			routing: { request: { body: { rating: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Page',
			name: 'discounttireStoreReviewPage',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 2000 },
			description: 'Page, 5 reviews per page',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
	]),
	collection('discounttireWheelsOptions', 'wheels', [
		...listOptions,
		sortOption([
			{ name: 'Best Seller', value: 'best_seller' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
		]),
		{
			displayName: 'Wheel Category',
			name: 'discounttireWheelCategory',
			type: 'string',
			default: '',
			placeholder: 'Chrome Wheels',
			description: 'A wheel category as Discount Tire writes it (its Wheel Category facet)',
			routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Wheel Color',
			name: 'discounttireWheelHue',
			type: 'string',
			default: '',
			placeholder: 'Black',
			description: 'A wheel color as Discount Tire writes it (its Wheel Color facet)',
			routing: { request: { body: { color: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Special Offers Only',
			name: 'discounttireSpecialOffers',
			type: 'boolean',
			default: false,
			description: 'Whether to return only wheels with a special offer',
			routing: { request: { body: { special_offers: '={{ $value || undefined }}' } } },
		},
	]),
	collection('discounttireBrowseOptions', 'browse', [
		pageOption,
		pageSizeOption,
		sortOption([
			{ name: 'Best Seller', value: 'best_seller' },
			{ name: 'Highest Rated', value: 'rating' },
			{ name: 'Price: High to Low', value: 'price_high' },
			{ name: 'Price: Low to High', value: 'price_low' },
			{ name: 'Relevance', value: 'relevance' },
		]),
	]),
	collection('discounttireAppointmentsOptions', 'appointments', [
		{
			displayName: 'Month',
			name: 'discounttireMonth',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0, maxValue: 12 },
			description: 'Month number, 1-12 (0: the current month)',
			routing: { request: { body: { month: '={{ $value || undefined }}' } } },
		},
	]),
];
