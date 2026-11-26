import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['carvana'], operation, ...extra },
});

// Carvana (carvana.com, the US online used-car retailer), 6 operations, 1 credit each; credits_used
// is the truth. US only (no country). No ZIP targeting: Search Vehicles takes one of Carvana's city
// pages (City) or the location Carvana sets for the visit. A request with its retry can run close
// to 4 minutes, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST = 'Carvana (carvana.com, the US online used-car retailer)';
const NAME = 'Carvana';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const TILE =
	"items with vehicle_id (what Get Vehicle takes), stock_number, URL, year, make, model, model_variant, trim, kbb_trim, colours, body_style, mileage, mpg, fuel_type, seats, horsepower, price, kbb_value (the Kelley Blue Book value Carvana shows next to the price), msrp, market_adjustment, previous_price, price_updated_at, shipping_cost (0 = free), tags (Carvana's labels such as Great Deal and New Price), purchase_pending, purchase_type, offering, remaining warranty and image";
const LOCATION =
	"Inventory is national; the location changes shipping costs and delivery flags, not which vehicles exist. There is no ZIP targeting: set City (one of Carvana's own city pages), else the location is the one Carvana sets for the visit (location.source says which).";
const NOT_AVAILABLE =
	'Not available: ZIP targeting, keyword search, a minimum-mileage filter, new vehicles (Carvana lists used vehicles), delivery or shipping quotes for an address, monthly payments, taxes and fees, VINs, dealers (Carvana is the seller) and price trends.';
const MARKET = 'US only, prices in USD, before taxes, title, registration and fees.';
const IS_URL = '/^https?:/i.test(String($value).trim())';

type Pairs = Array<[string, string]>;
const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);
const byLabel = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

const MAKE = 'A make as Carvana writes it (Get Makes lists them; case ignored), e.g. Toyota, Ford, Mercedes-Benz';
const MODEL = 'A model as Carvana writes it (Get Lineup lists them; case ignored, hyphens count), e.g. RAV4, F-150, CR-V';

const required = (displayName: string, name: string, field: string, operation: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: { request: { body: { [field]: '={{ String($value).trim() }}' } } },
	description,
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

const numberField = (displayName: string, name: string, field: string, description: string, maxValue: number): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue },
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

const COLORS: Pairs = ['Beige', 'Black', 'Blue', 'Brown', 'Gold', 'Gray', 'Green', 'Orange', 'Pink', 'Purple', 'Red', 'Silver', 'White', 'Yellow'].map((c) => [c, c.toLowerCase()]);

const searchOptions: INodeProperties[] = sorted([
	text('Make', 'carvanaSearchMake', 'make', 'Toyota', MAKE),
	text('Model', 'carvanaSearchModel', 'model', 'RAV4', `${MODEL}. Needs Make.`),
	text(
		'City',
		'carvanaSearchCity',
		'city',
		'new-york-ny',
		'One of Carvana\'s city pages (new-york-ny, los-angeles-ca, or "New York, NY"): the location shipping and delivery are shown for. Only with Make, Model and Page: a filter or a sort with City answers 400 (Carvana uses the visit\'s own location on filtered pages).',
	),
	{
		displayName: 'Page',
		name: 'carvanaSearchPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 5000 },
		description: 'Page; 24 vehicles a page',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'carvanaSearchSort',
		type: 'options',
		default: 'most_popular',
		options: [
			{ name: 'Highest Price', value: 'highest_price' },
			{ name: 'Lowest Mileage', value: 'lowest_mileage' },
			{ name: 'Lowest Price', value: 'lowest_price' },
			{ name: 'Most Popular', value: 'most_popular' },
			{ name: 'Newest Listed', value: 'newest_listed' },
			{ name: 'Newest Model Year', value: 'newest_year' },
		],
		description:
			"Result order. Most Popular is Carvana's default and is recomputed per visit, so it is not stable between pages: page with a fixed sort.",
		routing: { request: { body: { sort: '={{ $value === "most_popular" ? undefined : $value }}' } } },
	},
	numberField('Year Min', 'carvanaSearchYearMin', 'year_min', 'Model year from, 1980-2028 (0: no minimum)', 2028),
	numberField('Year Max', 'carvanaSearchYearMax', 'year_max', 'Model year to, 1980-2028 (0: no maximum)', 2028),
	numberField('Min Price', 'carvanaSearchMinPrice', 'price_min', 'Price from, USD (0: no minimum)', 2000000),
	numberField('Max Price', 'carvanaSearchMaxPrice', 'price_max', 'Price to, USD (0: no maximum)', 2000000),
	numberField('Max Mileage', 'carvanaSearchMaxMileage', 'mileage_max', "Mileage up to (Carvana's mileage filter takes a maximum only; 0: no maximum)", 1000000),
	text('Trims', 'carvanaSearchTrims', 'trims', 'XLE', 'Trim names as Carvana writes them, comma-separated, up to 10 (Include Facets lists them). Needs Make and Model.'),
	multi('Drive Types', 'carvanaSearchDriveTypes', 'drive_types', [['4WD', '4wd'], ['AWD', 'awd'], ['FWD', 'fwd'], ['RWD', 'rwd']], 'Drive types (empty: any)'),
	multi('Colors', 'carvanaSearchColors', 'colors', COLORS, 'Exterior colours (empty: any)'),
	multi(
		'Body Styles',
		'carvanaSearchBodyStyles',
		'body_styles',
		[['Convertible', 'convertible'], ['Coupe', 'coupe'], ['Hatchback', 'hatchback'], ['Minivan', 'minivan'], ['Sedan', 'sedan'], ['SUV', 'suv'], ['Truck', 'truck'], ['Wagon', 'wagon']],
		'Body styles (empty: any)',
	),
	multi(
		'Fuel Types',
		'carvanaSearchFuelTypes',
		'fuel_types',
		[['Diesel', 'diesel'], ['Electric', 'electric'], ['Gas', 'gas'], ['Hybrid', 'hybrid'], ['Plug-In Hybrid', 'plug_in_hybrid']],
		'Fuel types (empty: any)',
	),
	multi(
		'Tags',
		'carvanaSearchTags',
		'tags',
		[['Great Deal', 'great_deal'], ['Low Miles Per Year', 'low_miles_per_year'], ['New Price', 'new_price'], ['No Reported Accidents', 'no_reported_accidents'], ['Recently Added', 'recently_added'], ['Single Owner', 'single_owner']],
		"Carvana's own labels (empty: any)",
	),
	{
		displayName: 'Free Shipping Only',
		name: 'carvanaSearchFreeShipping',
		type: 'boolean',
		default: false,
		description: 'Whether to list only vehicles Carvana ships free to the location the page uses',
		routing: { request: { body: { free_shipping: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Include Facets',
		name: 'carvanaSearchIncludeFacets',
		type: 'boolean',
		default: false,
		description: "Whether to also return counts per filter value, the makes, and the make's models with their trims (still 1 credit)",
		routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
	},
]);

export const carvanaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['carvana'] } },
		options: [
			{
				name: 'Get Lineup',
				value: 'make',
				action: 'Get a carvana make lineup',
				description: `One make's model lineup on ${FIRST}: make, name, URL, summary, count and models with model (the name Search Vehicles takes), slug, URL, tagline, in_stock, body_types and image. Captured 2026-11-26: Toyota with 27 models, the 4Runner with 334 in stock. An unknown make is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carvana/make'),
			},
			{
				name: 'Get Makes',
				value: 'makes',
				action: 'Get carvana makes',
				description: `Every make in the inventory of ${FIRST} with its in-stock count: count, total_in_stock, makes with make (the name Search Vehicles takes) and in_stock, and location. Captured 2026-11-26: 40 makes, 90664 vehicles in stock. ${ONE}.`,
				routing: request('/api/v1/carvana/makes', true),
			},
			{
				name: 'Get Model Year Guide',
				value: 'model-guide',
				action: 'Get a carvana model year guide',
				description: `Carvana's research page for one model year, from ${FIRST}: summary, generation, in_stock, owner rating, rating_count, star_counts, what changed that year, engine / transmission / drivetrain by trim, other specs, trims in stock, the owner reviews the page shows (no names), next year, FAQ and sources. ${NAME} says its owner ratings come from Strategic Vision owner surveys. Captured 2026-11-26: the 2021 Toyota RAV4 rated 4.3 from 1404 ratings, 149 in stock. An unknown year, make or model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carvana/model-guide'),
			},
			{
				name: 'Get Trims',
				value: 'trims',
				action: 'Get carvana trims',
				description: `Carvana's trim guide for one model, from ${FIRST}: summary, count and trim groups with trims, description, best_for, highlights, attributes, in_stock and image, plus FAQ and sources. Captured 2026-11-26: Toyota RAV4 in 7 trim groups. An unknown make or model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carvana/trims'),
			},
			{
				name: 'Get Vehicle',
				value: 'vehicle',
				action: 'Get a carvana vehicle',
				description: `One vehicle of ${FIRST} by vehicle ID or link: price, previous_price, price_updated_at, kbb_value, fair_market_value, msrp, market_adjustment, mileage, colours, powertrain, dimensions, warranty (factory terms and what remains), in-service date and miles, keys, prior use, recalls, AutoCheck accident flag, highlights (Carvana's labels with their CARFAX / AutoCheck basis text as given), the inspection checklist, imperfections with photos, features, packages, options, ai_summary (Carvana's AI-written text, labelled), hub, sale status and images. Captured 2026-11-26: a 2019 Ford F-150 XLT SuperCab at 21990 USD (previously 22590), KBB value 23600, 93232 miles, prior use Lease. Monthly payments, shipping, taxes, fees and delivery dates are not included. No VIN. An unknown or sold vehicle is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/carvana/vehicle'),
			},
			{
				name: 'Search Vehicles',
				value: 'search',
				action: 'Search carvana vehicles',
				description: `Search the used-car inventory of ${FIRST} by make and model (names as Carvana writes them), 24 vehicles a page, with six sorts and Carvana's filters (model year, price, maximum mileage, trims, drive types, colours, body styles, fuel types, Carvana's tags, free shipping): total, total_pages, has_more, filters_applied, ${TILE}, location (source, city, state, ZIP, delivery and pickup flags, miles to pickup, earliest delivery date) and, with Include Facets, facets. ${LOCATION} Captured 2026-11-26: Ford F-150 from 2019 tagged Great Deal, lowest price first: 578 vehicles, a 2019 F-150 XLT at 21990 USD with 93232 miles next to a KBB value of 23600. An unknown make or model is a charged not-found that lists Carvana's names. ${NOT_AVAILABLE} ${MARKET} ${ONE}.`,
				routing: request('/api/v1/carvana/search', true),
			},
		],
		default: 'search',
	},
];

export const carvanaFields: INodeProperties[] = [
	// -- Get Vehicle --
	{
		displayName: 'Vehicle ID or URL',
		name: 'carvanaVehicle',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4850967',
		displayOptions: show(['vehicle']),
		routing: {
			request: {
				body: {
					vehicle_id: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description: 'A Carvana vehicle ID (vehicle_id from Search Vehicles, digits) or a carvana.com vehicle link',
	},

	// -- Get Model Year Guide --
	{
		displayName: 'Year',
		name: 'carvanaGuideYear',
		type: 'number',
		required: true,
		default: 2021,
		typeOptions: { minValue: 1980, maxValue: 2028 },
		displayOptions: show(['model-guide']),
		routing: { request: { body: { year: '={{ $value }}' } } },
		description: 'Model year',
	},
	required('Make', 'carvanaGuideMake', 'make', 'model-guide', 'Toyota', MAKE),
	required('Model', 'carvanaGuideModel', 'model', 'model-guide', 'RAV4', MODEL),

	// -- Get Trims --
	required('Make', 'carvanaTrimsMake', 'make', 'trims', 'Toyota', MAKE),
	required('Model', 'carvanaTrimsModel', 'model', 'trims', 'RAV4', MODEL),

	// -- Get Lineup --
	required('Make', 'carvanaMakeMake', 'make', 'make', 'Toyota', MAKE),

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'carvanaSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: searchOptions,
	},
];
