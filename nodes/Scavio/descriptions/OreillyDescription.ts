import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['oreilly'], operation, ...extra },
});

// O'Reilly Auto Parts (oreillyauto.com, the US auto parts retailer), 14 operations. 2 credits each;
// Get Product by line code + part number 4; Cross-Reference Part Number 2 with part type ID and
// manufacturer, 4 with one of them or when several manufacturers use the number, 6 with neither
// when one manufacturer matches; Get Brand Products without a brand (the brand index) 4; Get Store
// Stock and Find Stores by ZIP 4 (coordinates or the directory 2); Get Deals 4. United States on
// every operation; Mexico (O'Reilly's Mexican store directory, in Spanish) on Find Stores and Get
// Store only, which are the only operations that send a country. Lists are 24 a page, pages 1-20.
// Cross-reference chains up to 3 lookups and calls can queue behind the backend's upstream limit,
// so every operation carries a 240s timeout, like AutoZone.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = "O'Reilly Auto Parts (oreillyauto.com, the US auto parts retailer)";
const PRICES =
	"Every price is O'Reilly's price for the store O'Reilly assigns to the request, named in priced_for (store ID, address, city, state, ZIP). O'Reilly prices differ by store, so two calls can be priced for different stores; there is no store or ZIP input for prices. core_charge is the refundable deposit O'Reilly adds on parts like batteries until the old part is returned (0 when none). No price history: schedule a workflow to track changes.";
const ITEM =
	"items with line_code and part_number (for Get Product, Get Compatibility and Get Store Stock), name, brand, URL, image, category, price, regular_price, sale_price, discount_percent, core_charge, warranty, fit_notes for the vehicle, availability per fulfilment option (store pickup with O'Reilly's pickup time, ship to home), deals and attributes (no rating on list items)";
const LIST =
	"plus priced_for, vehicle (as O'Reilly applied it), total (as O'Reilly reports it), page, page_size (24), total_pages and facets (each facet param and value is what Filters takes). O'Reilly serves 20 pages of 24.";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';

const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'oreillyPage',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 20 },
	description: "Page 1-20 (24 items a page; O'Reilly serves 20 pages)",
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'oreillySort',
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Best Selling', value: 'best_selling' },
		{ name: 'Brand (A-Z)', value: 'brand' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description: "Result order (Relevance is O'Reilly's own order, the default)",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const availabilityOption: INodeProperties = {
	displayName: 'Availability',
	name: 'oreillyAvailability',
	type: 'options',
	default: '',
	options: [
		{ name: 'Any', value: '' },
		{ name: 'Pick Up in Store', value: 'store_pickup' },
		{ name: 'Ship to Home', value: 'home_delivery' },
	],
	description: "Only parts O'Reilly offers this way",
	routing: { request: { body: { availability: '={{ $value || undefined }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'oreillyFilters',
	type: 'json',
	default: '',
	placeholder: '{ "/attributes/prodAttr_32769": "104088" }',
	description:
		"Up to 4 attribute facets: { param: value }, with the param and value from an earlier response's facets list (e.g. Position or Brake Pad Material)",
	routing: {
		request: {
			body: {
				filters: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
			},
		},
	},
};

const brandFacetOption: INodeProperties = {
	displayName: 'Brand',
	name: 'oreillyBrandFacet',
	type: 'string',
	default: '',
	placeholder: 'Wagner_OEX',
	description: 'A brand as the Brands facet gives it (facets values where param is Brands)',
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};

const listOptions = [pageOption, sortOption, availabilityOption, filtersOption];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const listCollection = (name: string, operation: string, options: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted([...options]),
});

export const oreillyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['oreilly'] } },
		options: [
			{
				name: 'Cross-Reference Part Number',
				value: 'crossReference',
				action: 'Cross reference a part number on oreilly',
				description: `${NAME}'s parts that replace another brand's or an OE part number (O'Reilly's own interchange, e.g. FRAM PH3614): part_types, manufacturers, replacing_brands and ${ITEM}, plus priced_for and total. When several manufacturers use the number and none is sent, it answers the lists with no items: send the manufacturer next. No replacement is an empty list (charged). ${PRICES} ${CHARGE} Costs 2 credits with part type ID and manufacturer, 4 with one of them or when several manufacturers use the number, 6 with neither when one manufacturer matches.`,
				routing: request('/api/v1/oreilly/cross-reference'),
			},
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find oreilly stores',
				description: `${NAME} stores: in the US, the 25 nearest within 50 miles of a ZIP or coordinates with store_id (for Get Store), phone, address, distance, hours with holiday adjustments and services (hydraulic hoses, paint mixing, machine shop); or the store directory by state (cities with store counts) and by state and city (that city's stores with the URL for Get Store), in the US or Mexico (Spanish). An unknown state or city is a charged not-found. ${CHARGE} Costs 4 credits by ZIP, 2 by coordinates or the directory.`,
				routing: request('/api/v1/oreilly/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get oreilly brand products',
				description: `One brand's products on ${NAME} by brand link, sorted, filtered and optionally only parts for a vehicle: ${ITEM}, ${LIST} Without a brand: O'Reilly's brand index (brands, top_brands, featured_brands). An unknown brand is a charged not-found. ${PRICES} ${CHARGE} Costs 2 credits for one brand, 4 for the brand index.`,
				routing: request('/api/v1/oreilly/brand', true),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get oreilly categories',
				description: `${NAME}'s category tree (about 34 departments, 1,300 nodes): hash, name, URL (for Get Category Products), requires_vehicle and children, plus featured categories. With a root hash: that branch only. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get oreilly category products',
				description: `One ${NAME} category's products by link or path, sorted, filtered and optionally only parts for a vehicle: ${ITEM}, ${LIST} A wrong category hash is a charged not-found. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/category'),
			},
			{
				name: 'Get Compatibility',
				value: 'compatibility',
				action: 'Get the vehicles an oreilly part fits',
				description: `The vehicles one ${NAME} part fits: without a make, the makes it fits; with a make, models with engine and years as O'Reilly lists them. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/compatibility'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get oreilly deals',
				description: `${NAME}'s coupons, offers and promotions page plus its deals menu: offers (section, title, the promo code the offer names, validity text, details, URL), highlights and deals by category. Titles, details and validity are O'Reilly's free text. Failed upstream calls are not charged. Costs 4 credits.`,
				routing: request('/api/v1/oreilly/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an oreilly product',
				description: `One ${NAME} product in full by link or by line code and part number: priced_for, UPC, specifications, description, images, documents, breadcrumbs, price, core_charge, deals, rebates, availability, stock_status, rating (average, count) and the 10 most recent reviews (date, title, text, rating; no paging, no reviewer identity). With a vehicle: vehicle_fit, whose fits is true or null, never false (check fit with a vehicle search, category or Get Compatibility). A product O'Reilly does not list is a charged not-found. ${PRICES} ${CHARGE} Costs 2 credits by link, 4 by line code and part number.`,
				routing: request('/api/v1/oreilly/product'),
			},
			{
				name: 'Get Rebates',
				value: 'rebates',
				action: 'Get oreilly rebates',
				description: `${NAME}'s current rebates: title, details, valid dates, postmark-by date, terms_url, form_url (PDF) and redeem_online_url, as O'Reilly lists them. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/rebates', true),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an oreilly store',
				description: `One ${NAME} store: in the US by store ID (phone, address, coordinates, open_now, hours with holiday adjustments, services); by its directory page link (US or Mexico); or in Mexico by store number, state and city (Spanish). An unknown store is a charged not-found. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'storeStock',
				action: 'Get oreilly store stock',
				description: `Which ${NAME} stores within 50 miles of a ZIP or coordinates can hand over one part: store_id, address, distance_miles, hours message and availability (store_pickup, in_store_now, pickup_time in O'Reilly's words). O'Reilly shows availability states, not unit counts. Stock is as O'Reilly reports it. ${CHARGE} Costs 4 credits by ZIP, 2 by coordinates.`,
				routing: request('/api/v1/oreilly/store-stock'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get oreilly search suggestions',
				description: `${NAME}'s part-type search suggestions for typed text, with the category each opens (for Get Category Products). ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/suggestions'),
			},
			{
				name: 'Get Vehicles',
				value: 'vehicles',
				action: 'Get oreilly vehicles',
				description: `${NAME}'s vehicle selector, one level at a time: types, years, makes, models, submodels and engines (ID and name). Resolve returns the base_vehicle_id that Base Vehicle ID takes in Search Products, Get Category Products, Get Brand Products and Get Product; VIN decodes a 17-character VIN to year, make and model with submodel and engine IDs (an undecodable VIN is a charged not-found). ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/vehicles', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search oreilly products',
				description: `Search ${NAME} by keywords or an O'Reilly part number, sorted, filtered and optionally only parts for a vehicle: redirected_to, ${ITEM}, ${LIST} For another brand's or an OE part number use Cross-Reference Part Number. Not available: unit counts in store stock, a chosen store for prices, Q&A, Mexico prices, Canada, license-plate lookup, the weekly ad, O'Reilly Pro / First Call Online pricing, checkout. ${PRICES} ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/oreilly/search'),
			},
		],
		default: 'crossReference',
	},
];

const vehicleField: INodeProperties = {
	displayName: 'Base Vehicle ID',
	name: 'oreillyBaseVehicleId',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0 },
	displayOptions: show(['search', 'category', 'brand', 'product']),
	routing: { request: { body: { vehicle: '={{ $value ? { base_vehicle_id: $value } : undefined }}' } } },
	description:
		'Optional: only parts for this vehicle (0 = none). The base_vehicle_id from Get Vehicles with Level Resolve (129927 = 2015 Ford F-150); submodel and engine show in fit_notes.',
};

export const oreillyFields: INodeProperties[] = [
	// -- Search Products, Get Suggestions --
	{
		displayName: 'Keyword or Part Number',
		name: 'oreillyQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'brake pads',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: "Keywords or an O'Reilly part number (SC1001)",
	},
	{
		displayName: 'Text',
		name: 'oreillySuggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'brake',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Text a shopper types (2 characters or more)',
	},

	// -- Cross-Reference Part Number --
	{
		displayName: 'Part Number',
		name: 'oreillyXrefPartNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'PH3614',
		displayOptions: show(['crossReference']),
		routing: { request: { body: { part_number: '={{ $value }}' } } },
		description: "Another brand's or an OE part number (FRAM PH3614, Motorcraft FL820S)",
	},
	{
		displayName: 'Additional Options',
		name: 'oreillyXrefOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['crossReference']),
		options: sorted([
			{
				displayName: 'Manufacturer',
				name: 'oreillyXrefManufacturer',
				type: 'string',
				default: '',
				placeholder: 'FRAM',
				description:
					'The brand whose part number this is (manufacturers ID from an earlier answer). With Part Type ID too: 2 credits.',
				routing: { request: { body: { manufacturer: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Part Type ID',
				name: 'oreillyXrefPartTypeId',
				type: 'string',
				default: '',
				placeholder: '02269',
				description: 'The part type ID from an earlier answer (part_types ID; saves a call)',
				routing: { request: { body: { part_type_id: '={{ $value || undefined }}' } } },
			},
			{ ...pageOption },
		]),
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'oreillyProductBy',
		type: 'options',
		default: 'url',
		options: [
			{ name: 'Line Code and Part Number (4 Credits)', value: 'part' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the product',
	},
	{
		displayName: 'Product URL',
		name: 'oreillyProductUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder:
			'https://www.oreillyauto.com/detail/c/brakebest-select-brake-pads/brakebest-select-ceramic-brake-pads/bsg0/sc1001',
		displayOptions: show(['product'], { oreillyProductBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: "An O'Reilly product link (the URL in items)",
	},
	{
		displayName: 'Line Code',
		name: 'oreillyProductLineCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BB',
		displayOptions: show(['product'], { oreillyProductBy: ['part'] }),
		routing: { request: { body: { line_code: '={{ $value }}' } } },
		description: "O'Reilly line code (line_code in items)",
	},
	{
		displayName: 'Part Number',
		name: 'oreillyProductPartNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'SC1001',
		displayOptions: show(['product'], { oreillyProductBy: ['part'] }),
		routing: { request: { body: { part_number: '={{ $value }}' } } },
		description: "Part number as O'Reilly lists it (part_number in items)",
	},

	// -- Get Compatibility, Get Store Stock --
	{
		displayName: 'Line Code',
		name: 'oreillyLineCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BB',
		displayOptions: show(['compatibility', 'storeStock']),
		routing: { request: { body: { line_code: '={{ $value }}' } } },
		description: "O'Reilly line code (line_code in items)",
	},
	{
		displayName: 'Part Number',
		name: 'oreillyPartNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'SC1001',
		displayOptions: show(['compatibility', 'storeStock']),
		routing: { request: { body: { part_number: '={{ $value }}' } } },
		description: "Part number as O'Reilly lists it (part_number in items)",
	},
	{
		displayName: 'Make',
		name: 'oreillyCompatMake',
		type: 'string',
		default: '',
		placeholder: 'Ford',
		displayOptions: show(['compatibility']),
		routing: { request: { body: { make: '={{ $value || undefined }}' } } },
		description: 'Optional: a make from the makes list returns the models, engines and years the part fits',
	},

	// -- Get Store Stock --
	{
		displayName: 'Location By',
		name: 'oreillyStockBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates (2 Credits)', value: 'point' },
			{ name: 'ZIP (4 Credits)', value: 'zip' },
		],
		displayOptions: show(['storeStock']),
		description: 'Where to look for stores within 50 miles',
	},
	{
		displayName: 'ZIP',
		name: 'oreillyStockZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60540',
		displayOptions: show(['storeStock'], { oreillyStockBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP',
	},
	{
		displayName: 'Latitude',
		name: 'oreillyStockLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['storeStock'], { oreillyStockBy: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: 'oreillyStockLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['storeStock'], { oreillyStockBy: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Quantity',
		name: 'oreillyStockQuantity',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 99 },
		displayOptions: show(['storeStock']),
		routing: { request: { body: { quantity: '={{ $value === 1 ? undefined : $value }}' } } },
		description: 'Quantity to check',
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'oreillyCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/shop/b/brakes/brake-pads---shoes/brake-pads/a99314144bb6',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A category link or path from Get Categories or Get Suggestions: /shop/b/(name)/(12-character hash)',
	},

	// -- Get Categories --
	{
		displayName: 'Root Category Hash',
		name: 'oreillyRoot',
		type: 'string',
		default: '',
		placeholder: '95397663b44a',
		displayOptions: show(['categories']),
		routing: { request: { body: { root: '={{ $value || undefined }}' } } },
		description: 'Optional: a category hash (12 characters) returns that branch only; empty returns the whole tree',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand URL',
		name: 'oreillyBrand',
		type: 'string',
		default: '',
		placeholder: 'https://www.oreillyauto.com/shop/brands/a/3m/mmm',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		description: "A brand link or path (/shop/brands/a/(brand)/(code)); empty returns O'Reilly's brand index (4 credits)",
	},

	// -- Vehicle (Search, Category, Brand, Product) --
	vehicleField,

	// -- Get Vehicles --
	{
		displayName: 'Level',
		name: 'oreillyLevel',
		type: 'options',
		default: 'years',
		options: [
			{ name: 'Engines', value: 'engines' },
			{ name: 'Makes', value: 'makes' },
			{ name: 'Models', value: 'models' },
			{ name: 'Resolve (Base Vehicle ID)', value: 'resolve' },
			{ name: 'Submodels', value: 'submodels' },
			{ name: 'Types', value: 'types' },
			{ name: 'VIN', value: 'vin' },
			{ name: 'Years', value: 'years' },
		],
		displayOptions: show(['vehicles']),
		routing: { request: { body: { level: '={{ $value === "years" ? undefined : $value }}' } } },
		description:
			'Makes need a year; models a year and make ID; submodels also a model ID; engines also a submodel ID; resolve a year, make ID and model ID; VIN a 17-character VIN',
	},
	{
		displayName: 'Year',
		name: 'oreillyYear',
		type: 'number',
		required: true,
		default: 2015,
		typeOptions: { minValue: 1896, maxValue: 2100 },
		displayOptions: show(['vehicles'], { oreillyLevel: ['makes', 'models', 'submodels', 'engines', 'resolve'] }),
		routing: { request: { body: { year: '={{ $value }}' } } },
	},
	{
		displayName: 'Make ID',
		name: 'oreillyMakeId',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0 },
		displayOptions: show(['vehicles'], { oreillyLevel: ['models', 'submodels', 'engines', 'resolve'] }),
		routing: { request: { body: { make_id: '={{ $value }}' } } },
		description: 'The make ID from the makes level (23076 = Ford)',
	},
	{
		displayName: 'Model ID',
		name: 'oreillyModelId',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0 },
		displayOptions: show(['vehicles'], { oreillyLevel: ['submodels', 'engines', 'resolve'] }),
		routing: { request: { body: { model_id: '={{ $value }}' } } },
		description: 'The model ID from the models level (31549 = F-150)',
	},
	{
		displayName: 'Submodel ID',
		name: 'oreillySubmodelId',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0 },
		displayOptions: show(['vehicles'], { oreillyLevel: ['engines'] }),
		routing: { request: { body: { submodel_id: '={{ $value }}' } } },
		description: 'The submodel ID from the submodels level',
	},
	{
		displayName: 'VIN',
		name: 'oreillyVin',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1HGCM82633A004352',
		displayOptions: show(['vehicles'], { oreillyLevel: ['vin'] }),
		routing: { request: { body: { vin: '={{ $value }}' } } },
		description: 'A 17-character VIN',
	},
	{
		displayName: 'Additional Options',
		name: 'oreillyVehiclesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['vehicles']),
		options: sorted([
			{
				displayName: 'Engine ID (Resolve)',
				name: 'oreillyResolveEngineId',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Resolve only, with a submodel ID: the engine ID from the engines level',
				routing: { request: { body: { engine_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Submodel ID (Resolve)',
				name: 'oreillyResolveSubmodelId',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Resolve only: the submodel ID from the submodels level',
				routing: { request: { body: { submodel_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Vehicle Type',
				name: 'oreillyTypeId',
				type: 'options',
				default: 1,
				options: [
					{ name: 'ATV & UTV', value: 3 },
					{ name: 'Automotive', value: 1 },
					{ name: 'Motorcycle & Scooter', value: 2 },
					{ name: 'Personal Watercraft', value: 4 },
					{ name: 'Snowmobile', value: 5 },
				],
				description: 'The vehicle type (Automotive by default)',
				routing: { request: { body: { type_id: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Find Stores, Get Store: market --
	{
		displayName: 'Country',
		name: 'oreillyCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Mexico (Store Directory, Spanish)', value: 'mx' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['stores', 'store']),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: "O'Reilly's US stores, or its Mexican store directory (in Spanish; Mexico shows no prices)",
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'oreillyStoresBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates (US, 2 Credits)', value: 'point' },
			{ name: 'State Directory (2 Credits)', value: 'directory' },
			{ name: 'ZIP (US, 4 Credits)', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Stores near a ZIP or coordinates (US), or the directory by state and city (US or Mexico)',
	},
	{
		displayName: 'ZIP',
		name: 'oreillyStoresZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '77002',
		displayOptions: show(['stores'], { oreillyStoresBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'A 5-digit US ZIP',
	},
	{
		displayName: 'Latitude',
		name: 'oreillyStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { oreillyStoresBy: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
	},
	{
		displayName: 'Longitude',
		name: 'oreillyStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { oreillyStoresBy: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
	},
	{
		displayName: 'State',
		name: 'oreillyStoresState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mo',
		displayOptions: show(['stores'], { oreillyStoresBy: ['directory'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: 'A US state code (mo, tx, pr), or in Mexico one of agu, bcs, col, gua, jal, mic, nay, sin, son',
	},
	{
		displayName: 'City',
		name: 'oreillyStoresCity',
		type: 'string',
		default: '',
		placeholder: 'springfield',
		displayOptions: show(['stores'], { oreillyStoresBy: ['directory'] }),
		routing: { request: { body: { city: '={{ $value || undefined }}' } } },
		description: "Optional: a city (city_slug from the state's cities, or its name) lists that city's stores",
	},

	// -- Get Store --
	{
		displayName: 'Store By',
		name: 'oreillyStoreBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Store ID (US)', value: 'id' },
			{ name: 'Store Number, State and City (Mexico)', value: 'number' },
			{ name: 'Store Page URL', value: 'url' },
		],
		displayOptions: show(['store']),
		description: 'How to identify the store',
	},
	{
		displayName: 'Store ID',
		name: 'oreillyStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4973',
		displayOptions: show(['store'], { oreillyStoreBy: ['id'] }),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: "An O'Reilly US store number (store_id from Find Stores)",
	},
	{
		displayName: 'Store Page URL',
		name: 'oreillyStoreUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://locations.oreillyauto.com/...',
		displayOptions: show(['store'], { oreillyStoreBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A store page link from the directory (the URL in Find Stores by state and city)',
	},
	{
		displayName: 'Store Number',
		name: 'oreillyStoreNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7601',
		displayOptions: show(['store'], { oreillyStoreBy: ['number'] }),
		routing: { request: { body: { store_number: '={{ $value }}' } } },
		description: 'The Mexican store number (store_number from Find Stores)',
	},
	{
		displayName: 'State',
		name: 'oreillyStoreState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'jal',
		displayOptions: show(['store'], { oreillyStoreBy: ['number'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: 'The Mexican state code',
	},
	{
		displayName: 'City',
		name: 'oreillyStoreCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'guadalajara',
		displayOptions: show(['store'], { oreillyStoreBy: ['number'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: "The city (city_slug from the state's cities)",
	},

	// -- Additional Options --
	listCollection('oreillySearchOptions', 'search', [...listOptions, brandFacetOption]),
	listCollection('oreillyCategoryOptions', 'category', [...listOptions, brandFacetOption]),
	listCollection('oreillyBrandOptions', 'brand', listOptions),
];
