import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rockauto'], operation, ...extra },
});

// RockAuto (rockauto.com, the online auto parts catalog based in Madison, Wisconsin), 11
// operations, 1 credit each; credits_used is the truth. One US catalog (no country); language
// en | es | fr | de and 15 display currencies. The carcode comes from the vehicle chain (Get
// Vehicles, Get Suggestions or Resolve Vehicle). Large part listings can take 80-100 s, so every
// operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const trimmed = '={{ String($value).trim() || undefined }}';

const FIRST = 'RockAuto (rockauto.com, the online auto parts catalog based in Madison, Wisconsin)';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const PRICES =
	"Prices are RockAuto's, in the requested currency as RockAuto converts them for display; shipping is not included (RockAuto prices it per warehouse in its cart).";
const NO_SORT = "RockAuto offers no sort and no paging on these lists: items are in RockAuto's own order.";
const ITEMS =
	"items with brand, part_number, description, part_type, part_type_id, notes (RockAuto's fitment notes), tier (Economy, Daily Driver, Premium ...), price, price_text, price_per, core_charge, pack_size, total, pack_options, currency, out_of_stock, closeout, closeout_text, non_stock_text, shipping_delay_days, remaining, popular, fits_markets (us, ca, mx), alternate_numbers (OE / alternate numbers), image, info_url and part (part_key, carcode, part_type_id: what Get Part takes)";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const languageOption = (name: string): INodeProperties => ({
	displayName: 'Language',
	name,
	type: 'options',
	default: 'en',
	options: [
		{ name: 'English', value: 'en' },
		{ name: 'French', value: 'fr' },
		{ name: 'German', value: 'de' },
		{ name: 'Spanish', value: 'es' },
	],
	description:
		"RockAuto's page language (names, notes, tiers and labels). Part numbers and prices do not change.",
	routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
});

const CURRENCIES: Array<[string, string]> = [
	['Australian Dollar (AUD)', 'AUD'],
	['Brazilian Real (BRL)', 'BRL'],
	['British Pound (GBP)', 'GBP'],
	['Canadian Dollar (CAD)', 'CAD'],
	['Chilean Peso (CLP)', 'CLP'],
	['Euro (EUR)', 'EUR'],
	['Hungarian Forint (HUF)', 'HUF'],
	['Japanese Yen (JPY)', 'JPY'],
	['Mexican Peso (MXN)', 'MXN'],
	['New Zealand Dollar (NZD)', 'NZD'],
	['Norwegian Krone (NOK)', 'NOK'],
	['Polish Zloty (PLN)', 'PLN'],
	['Swedish Krona (SEK)', 'SEK'],
	['Swiss Franc (CHF)', 'CHF'],
	['US Dollar (USD)', 'USD'],
];

const currencyOption = (name: string): INodeProperties => ({
	displayName: 'Currency',
	name,
	type: 'options',
	default: 'USD',
	options: CURRENCIES.map(([label, value]) => ({ name: label, value })),
	description:
		"RockAuto's display currency: one US catalog, prices converted by RockAuto. The answer echoes the currency.",
	routing: { request: { body: { currency: '={{ $value === "USD" ? undefined : $value }}' } } },
});

const partTypeIdOption = (name: string, description: string): INodeProperties => ({
	displayName: 'Part Type ID',
	name,
	type: 'string',
	default: '',
	placeholder: '1684',
	description,
	routing: { request: { body: { part_type_id: trimmed } } },
});

// The vehicle inputs of Get Vehicle Categories and Get Vehicle Parts: make, year, model, engine
// and carcode exactly as Get Vehicles answers them for an engine.
const VEHICLE_OPS = ['categories', 'parts'];
const vehicleFields: INodeProperties[] = [
	{
		displayName: 'Make',
		name: 'rockautoMake',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'HONDA',
		displayOptions: show(VEHICLE_OPS),
		routing: { request: { body: { make: '={{ String($value).trim() }}' } } },
		description: 'Make as Get Vehicles answers it for the engine',
	},
	{
		displayName: 'Year',
		name: 'rockautoYear',
		type: 'number',
		required: true,
		default: 2010,
		typeOptions: { minValue: 1900, maxValue: 2100 },
		displayOptions: show(VEHICLE_OPS),
		routing: { request: { body: { year: '={{ $value }}' } } },
		description: 'Model year',
	},
	{
		displayName: 'Model',
		name: 'rockautoModel',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'ACCORD',
		displayOptions: show(VEHICLE_OPS),
		routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
		description: 'Model as Get Vehicles answers it for the engine',
	},
	{
		displayName: 'Engine',
		name: 'rockautoEngine',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2.4L L4',
		displayOptions: show(VEHICLE_OPS),
		routing: { request: { body: { engine: '={{ String($value).trim() }}' } } },
		description: 'Engine as Get Vehicles answers it',
	},
	{
		displayName: 'Carcode',
		name: 'rockautoCarcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1444945',
		displayOptions: show(VEHICLE_OPS),
		routing: { request: { body: { carcode: '={{ String($value).trim() }}' } } },
		description:
			"RockAuto's vehicle code (digits): an engine's carcode from Get Vehicles, or a vehicle's carcode from Get Suggestions or Resolve Vehicle. RockAuto picks the vehicle by carcode: one that answers another vehicle than make, year, model and engine answers 400, not charged.",
	},
];

export const rockautoOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rockauto'] } },
		options: [
			{
				name: 'Get Brand Parts',
				value: 'brand',
				action: 'Get rockauto brand parts',
				description: `One brand's parts of one part type on ${FIRST}, not tied to a vehicle: brand, part_type_id, search_label, limited, limited_notice, count and ${ITEMS}. RockAuto lists at most 50 rows here, with no paging or sort. ${PRICES} ${ONE}.`,
				routing: request('/api/v1/rockauto/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get rockauto brands',
				description: `The brand list and part groups of ${FIRST}: brands (568 captured 2026-11-26; what Get Brand Parts and Search Part Number take), part_groups, part_type_count and, with Include Part Types, about 5,500 part type IDs and names. ${ONE}.`,
				routing: request('/api/v1/rockauto/brands', true),
			},
			{
				name: 'Get Part',
				value: 'part',
				action: 'Get a rockauto part',
				description: `One part's detail page on ${FIRST} by the part keys of an item (part from Get Vehicle Parts, Search Part Number, Get Brand Parts or Get Tools Catalog): brand, part_number, title, price, price_text, core_charge, pack_size, total, pack_options, currency, out_of_stock, description, specifications, oe_numbers (OEM / interchange numbers), alternate_numbers, warranty (as given), disclaimer, more_information (the manufacturer's text) and images. The part detail page is in English in every language; the price is in the requested currency. Captured 2026-11-26: BOSCH BP1084 at 29.79 USD with a 12 Months warranty. ${ONE}.`,
				routing: request('/api/v1/rockauto/part'),
			},
			{
				name: 'Get Promotions',
				value: 'promotions',
				action: 'Get rockauto promotions',
				description: `The promotions and manufacturer rebates page of ${FIRST}: read_date and promotions with name, badge, title, offer, expires_text (as printed), expires (YYYY-MM-DD), shown (false when the page hides the offer), link_text and link_url (the rebate form), plus recently_expired. Amounts are as printed (USD). Dates are as given, with the read date: the page can still carry offers whose printed date has passed. RockAuto publishes no coupon codes. Captured 2026-11-26: 8 promotions, among them an AutoMeter rebate of up to 150 USD expiring 2026-12-31. ${ONE}.`,
				routing: request('/api/v1/rockauto/promotions', true),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get rockauto suggestions',
				description: `The search box suggestions of ${FIRST} for typed text, in lower case as RockAuto returns them: vehicles (year, make, model, engine, carcode, markets, part type), part_types (need a vehicle), tools (tools and universal parts) and help. A vehicle with a carcode is the input of Get Vehicle Categories and Get Vehicle Parts. Part numbers are not suggested (use Search Part Number). Captured 2026-11-26: "2015 ford f-150" suggested four engines, each with its carcode. ${ONE}.`,
				routing: request('/api/v1/rockauto/suggestions'),
			},
			{
				name: 'Get Tools Catalog',
				value: 'tools',
				action: 'Get the rockauto tools catalog',
				description: `The tools and universal parts catalog of ${FIRST}, one level at a time: no input = categories; Category = subcategories; Category + Subcategory = part types; Part Type ID = that part type's listing with ${ITEMS}. Returns level, count and notes. ${NO_SORT} ${PRICES} ${ONE}.`,
				routing: request('/api/v1/rockauto/tools', true),
			},
			{
				name: 'Get Vehicle Categories',
				value: 'categories',
				action: 'Get rockauto vehicle categories',
				description: `One vehicle's part categories on ${FIRST}. Without Category: the categories (category is the input, name in the page language); with Category: its part types (part_type_id is what Get Vehicle Parts takes). Returns the vehicle as RockAuto answered it and count. Captured 2026-11-26: the 2010 HONDA ACCORD 2.4L L4 lists 30 part types under Brake & Wheel Hub (Brake Pad is 1684). A carcode that answers another vehicle answers 400, not charged; an unknown category is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rockauto/categories'),
			},
			{
				name: 'Get Vehicle Parts',
				value: 'parts',
				action: 'Get rockauto vehicle parts',
				description: `Every brand's listing for one part type on one vehicle on ${FIRST}: vehicle, category, part_type, count and ${ITEMS}. ${NO_SORT} ${PRICES} Captured 2026-11-26: brake pads (1684) for the 2010 HONDA ACCORD 2.4L L4 listed 114 items, from 10.23 USD; NGK spark plug 97390 for the same car was 4.79 EUR each, or 4.57 EUR each in a pack of 4. Large part types (brake pads) can take 80-100 seconds. ${ONE}.`,
				routing: request('/api/v1/rockauto/parts'),
			},
			{
				name: 'Get Vehicles',
				value: 'vehicles',
				action: 'Get rockauto vehicles',
				description: `The vehicle catalog of ${FIRST}, one level at a time: no input = makes; Make = years; Make + Year = models; Make + Year + Model = engines, each with make, year, model, engine and carcode (the vehicle inputs of Get Vehicle Categories and Get Vehicle Parts) and markets (us, ca, mx). This is where the carcode comes from. Captured 2026-11-26: HONDA 2010 ACCORD has two engines, 2.4L L4 (carcode 1444945) and 3.5L V6 (carcode 1444944). An unknown make, year or model is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/rockauto/vehicles', true),
			},
			{
				name: 'Resolve Vehicle',
				value: 'resolve',
				action: 'Resolve a rockauto vehicle',
				description: `Free text to a vehicle on ${FIRST}: how RockAuto's search box reads "2010 honda accord brake pads". Returns matches with year, make, model, engine, carcode, markets, part_type_id, part_type, category, text and leftover (the words RockAuto did not interpret). A match without carcode needs Get Vehicles (make, year, model) for its engines. ${ONE}.`,
				routing: request('/api/v1/rockauto/resolve'),
			},
			{
				name: 'Search Part Number',
				value: 'search',
				action: 'Search rockauto by part number',
				description: `Part number and interchange search on ${FIRST}: matches across brands, including the OE and interchange numbers RockAuto maps to its listings. Returns search_label, limited and limited_notice (RockAuto's "Results may be limited" notice), count and ${ITEMS}. ${NO_SORT} No match is an empty list. ${PRICES} Captured 2026-11-26: BP1084 matched one BOSCH brake pad at 29.79 USD; in Spanish with Mexican Peso the same part read "Pastilla de Freno" at 583.71 MXN. ${ONE}.`,
				routing: request('/api/v1/rockauto/search'),
			},
		],
		default: 'search',
	},
];

export const rockautoFields: INodeProperties[] = [
	// -- Search Part Number --
	{
		displayName: 'Part Number',
		name: 'rockautoPartNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BP1084',
		displayOptions: show(['search']),
		routing: { request: { body: { part_number: '={{ String($value).trim() }}' } } },
		description:
			"A part number: RockAuto's brands' numbers and the OE / interchange numbers RockAuto maps to them (e.g. BP1084, 41-110, PH7317)",
	},

	// -- Get Vehicle Categories, Get Vehicle Parts --
	...vehicleFields,
	{
		displayName: 'Category',
		name: 'rockautoPartsCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Brake & Wheel Hub',
		displayOptions: show(['parts']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'The category (category from Get Vehicle Categories)',
	},
	{
		displayName: 'Part Type ID',
		name: 'rockautoPartsPartTypeId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1684',
		displayOptions: show(['parts']),
		routing: { request: { body: { part_type_id: '={{ String($value).trim() }}' } } },
		description: 'A part type ID from Get Vehicle Categories with a Category (1684 = Brake Pad)',
	},

	// -- Get Brand Parts --
	{
		displayName: 'Brand',
		name: 'rockautoBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BOSCH',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: "A brand from Get Brands (RockAuto's brand name)",
	},
	{
		displayName: 'Part Type ID',
		name: 'rockautoBrandPartTypeId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1684',
		displayOptions: show(['brand']),
		routing: { request: { body: { part_type_id: '={{ String($value).trim() }}' } } },
		description: 'A part type ID (Get Brands with Include Part Types, or Get Vehicle Categories)',
	},

	// -- Get Part --
	{
		displayName: 'Part Key',
		name: 'rockautoPartKey',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6129207',
		displayOptions: show(['part']),
		routing: { request: { body: { part_key: '={{ String($value).trim() }}' } } },
		description: "The part_key of an item's part",
	},
	{
		displayName: 'Part Type ID',
		name: 'rockautoPartPartTypeId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1684',
		displayOptions: show(['part']),
		routing: { request: { body: { part_type_id: '={{ String($value).trim() }}' } } },
		description: "The part_type_id of an item's part",
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'rockautoSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2015 ford f-150',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Typed text, 2-100 characters: a vehicle, a part type (brake pad) or a tool',
	},

	// -- Resolve Vehicle --
	{
		displayName: 'Query',
		name: 'rockautoResolveQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2010 honda accord brake pads',
		displayOptions: show(['resolve']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Free text naming a vehicle and, optionally, a part (3-150 characters)',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'rockautoVehiclesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['vehicles']),
		options: sorted([
			{
				displayName: 'Make',
				name: 'rockautoVehiclesMake',
				type: 'string',
				default: '',
				placeholder: 'HONDA',
				description: 'Empty: every make. A make: its years.',
				routing: { request: { body: { make: trimmed } } },
			},
			{
				displayName: 'Year',
				name: 'rockautoVehiclesYear',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 2100 },
				description: "With Make: that year's models (0: none)",
				routing: { request: { body: { year: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Model',
				name: 'rockautoVehiclesModel',
				type: 'string',
				default: '',
				placeholder: 'ACCORD',
				description: "With Make and Year: the model's engines, each with its carcode",
				routing: { request: { body: { model: trimmed } } },
			},
			languageOption('rockautoVehiclesLanguage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: sorted([
			{
				displayName: 'Category',
				name: 'rockautoCategoriesCategory',
				type: 'string',
				default: '',
				placeholder: 'Brake & Wheel Hub',
				description: "A category from this operation's categories: its part types. Empty: the vehicle's categories.",
				routing: { request: { body: { category: trimmed } } },
			},
			languageOption('rockautoCategoriesLanguage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoPartsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['parts']),
		options: sorted([
			{
				displayName: 'Part Type Name',
				name: 'rockautoPartsPartType',
				type: 'string',
				default: '',
				placeholder: 'Brake Pad',
				description: 'Optional part type name; RockAuto reads the part type by its ID',
				routing: { request: { body: { part_type: trimmed } } },
			},
			currencyOption('rockautoPartsCurrency'),
			languageOption('rockautoPartsLanguage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'Brand',
				name: 'rockautoSearchBrand',
				type: 'string',
				default: '',
				placeholder: 'BOSCH',
				description: 'Only this brand (a Get Brands value)',
				routing: { request: { body: { brand: trimmed } } },
			},
			partTypeIdOption('rockautoSearchPartTypeId', 'Only this part type (a part type ID)'),
			currencyOption('rockautoSearchCurrency'),
			languageOption('rockautoSearchLanguage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoBrandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: sorted([currencyOption('rockautoBrandCurrency'), languageOption('rockautoBrandLanguage')]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoBrandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands']),
		options: sorted([
			{
				displayName: 'Include Part Types',
				name: 'rockautoBrandsIncludePartTypes',
				type: 'boolean',
				default: false,
				description: "Whether to add RockAuto's part type list (about 5,500 IDs and names)",
				routing: { request: { body: { include_part_types: '={{ $value ? true : undefined }}' } } },
			},
			languageOption('rockautoBrandsLanguage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoPartOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['part']),
		options: sorted([
			{
				displayName: 'Carcode',
				name: 'rockautoPartCarcode',
				type: 'string',
				default: '',
				placeholder: '0',
				description: "The carcode of an item's part (0 from Search Part Number, Get Brand Parts and Get Tools Catalog)",
				routing: { request: { body: { carcode: trimmed } } },
			},
			currencyOption('rockautoPartCurrency'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoToolsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['tools']),
		options: sorted([
			{
				displayName: 'Category',
				name: 'rockautoToolsCategory',
				type: 'string',
				default: '',
				placeholder: 'Brake & Wheel Hub',
				description: 'A tools category: its subcategories',
				routing: { request: { body: { category: trimmed } } },
			},
			{
				displayName: 'Subcategory',
				name: 'rockautoToolsSubcategory',
				type: 'string',
				default: '',
				placeholder: 'Tool',
				description: 'With Category: a subcategory, its part types',
				routing: { request: { body: { subcategory: trimmed } } },
			},
			partTypeIdOption(
				'rockautoToolsPartTypeId',
				"A tools / universal part type ID (from this operation's part types, or Get Suggestions tools): its listing",
			),
			currencyOption('rockautoToolsCurrency'),
			languageOption('rockautoToolsLanguage'),
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'rockautoPromotionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['promotions']),
		options: [languageOption('rockautoPromotionsLanguage')],
	},
];
