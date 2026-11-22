import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['autozone'], operation, ...extra },
});

// AutoZone (autozone.com, the US auto parts retailer), 12 operations. 1 credit each; 2 on
// Brazil Search Products, Brazil Get Product and Get Store Stock (Brazil only).
// United States on every operation; Brazil on Search, Get Product, Get Store Stock, Get
// Vehicles, Find Stores, Get Store and Get Categories; Mexico on Get Vehicles, Find Stores, Get
// Store and Get Categories only. Get Category Products, Get Brand Products, Get Reviews, Get
// Clearance and Get Rebates are US only and send no country. Lists are the first 24 results
// only (no paging). Brazil pages are slow and calls can queue behind the backend's upstream
// limit, so every operation carries a 240s timeout, like HEMA.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const NAME = 'AutoZone (autozone.com, the US auto parts retailer)';
const PRICES =
	"Every price is AutoZone's price for the store AutoZone assigns to the request, named in priced_for (store number, address, city, state, ZIP). AutoZone prices differ by store, core charges too, so two calls can be priced for different stores; there is no store or ZIP input in the US. core_charge is the refundable deposit AutoZone adds on parts like batteries until the old part is returned (0 when none). No price history: schedule a workflow to track changes.";
const ITEM =
	'items with id (for Get Product and Get Reviews), part_number, name, brand, part_type, URL, image, location, fitment (type and vehicle_fit), oem_part_number, oem_brand, price, was_price, deal_price, discount_percent, core_charge, warranty, clearance and availability per fulfilment option (no rating on list items)';
const LIST =
	"plus priced_for, total (as AutoZone reports it), count and facets (each facet key and value is what Filters takes). AutoZone's pages list the first 24 results only: narrow with one filter, a price range or a sort.";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const COST = 'Costs 1 credit.';
const BR_COST = 'Costs 1 credit in the US, 2 in Brazil.';

const sortOption: INodeProperties = {
	displayName: 'Sort',
	name: 'autozoneSort',
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description: "Result order (Relevance is AutoZone's own order, the default)",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
};

const filtersOption: INodeProperties = {
	displayName: 'Filters (JSON)',
	name: 'autozoneFilters',
	type: 'json',
	default: '',
	placeholder: '{ "position_name_s": "Front" }',
	description:
		"One facet: { facet: value }, with the key and value from an earlier response's facets list (e.g. position_name_s: Front, sub_brand_name_display_s: Duralast Gold). AutoZone's pages apply one at a time.",
	routing: {
		request: {
			body: {
				filters: '={{ $value ? (typeof $value === "string" ? JSON.parse($value) : $value) : undefined }}',
			},
		},
	},
};

const minPriceOption: INodeProperties = {
	displayName: 'Min Price',
	name: 'autozoneMinPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: "Lowest price, in the market's currency (USD; BRL in Brazil)",
	routing: { request: { body: { min_price: '={{ $value || undefined }}' } } },
};

const maxPriceOption: INodeProperties = {
	displayName: 'Max Price',
	name: 'autozoneMaxPrice',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, numberPrecision: 2 },
	description: "Highest price, in the market's currency",
	routing: { request: { body: { max_price: '={{ $value || undefined }}' } } },
};

const listOptions = [sortOption, filtersOption, minPriceOption, maxPriceOption];

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

export const autozoneOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['autozone'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find autozone stores',
				description: `${NAME}'s store directory in the United States, Brazil or Mexico, one level at a time: no state = states with store counts; a state = its cities; a state and a city = that city's stores (up to 50) with store_number, slug (for Get Store), address and hours. There is no stores-near-a-ZIP search. An unknown state or city is a charged not-found. ${CHARGE} ${COST}`,
				routing: request('/api/v1/autozone/stores', true),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get autozone brand products',
				description: `One brand's products on ${NAME} (a brand page, or the brand within one part type; US): ${ITEM}, ${LIST} An unknown brand is a charged not-found. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/autozone/brand'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get autozone categories',
				description: `${NAME}'s category menu (United States, Brazil, Mexico; about 23 departments): name, path, child_count and children with the part type path for Get Category Products (has_products marks part types with a product list). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/autozone/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get autozone category products',
				description: `One ${NAME} part type's products by path or link, optionally only the parts that fit a vehicle (year, make, model), sorted and filtered (US): list_type, vehicle (as AutoZone applied it), ${ITEM}, ${LIST} Vehicle fit is at year / make / model level: items AutoZone ties to an engine read vehicle_fit NEEDS_BASE_VEHICLE. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/autozone/category'),
			},
			{
				name: 'Get Clearance',
				value: 'clearance',
				action: 'Get autozone clearance',
				description: `${NAME}'s clearance list (US): ${ITEM}, ${LIST} ${PRICES} ${CHARGE} ${COST}`,
				routing: request('/api/v1/autozone/clearance', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an autozone product',
				description: `One ${NAME} product in full by item ID or link: priced_for, specifications, features, safety data sheets, fitment type, price, was_price, deal_price, deal (label, e.g. Bundle and Save), core_charge, warranty, availability per fulfilment option and rating with its distribution. No per-vehicle fit list: use Get Category Products with a vehicle. An item ID AutoZone does not have is a charged not-found. ${PRICES} ${CHARGE} ${BR_COST}`,
				routing: request('/api/v1/autozone/product'),
			},
			{
				name: 'Get Rebates',
				value: 'rebates',
				action: 'Get autozone rebates',
				description: `${NAME}'s current mail-in rebates (US): title, end_date (last purchase day), postmark_date (last day to mail the form) and form_url (the rebate form, PDF), as AutoZone lists them. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/autozone/rebates', true),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get autozone reviews',
				description: `Customer reviews of one ${NAME} product (US only), 10 a page, full depth: total_reviews, total_pages, average_rating, rating_distribution, AutoZone's review summary on page 1 (without a star filter) and reviews (rating, title, text, verified_purchase, submitted_at, the reviewer's vehicle as written, images). No reviewer identity. ${CHARGE} ${COST}`,
				routing: request('/api/v1/autozone/reviews'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get an autozone store',
				description: `One ${NAME} store by slug or link (United States, Brazil, Mexico): store_number, address, phone, coordinates, hours and holiday hours. Take the slug from Find Stores. An unknown store is a charged not-found. ${CHARGE} ${COST}`,
				routing: request('/api/v1/autozone/store'),
			},
			{
				name: 'Get Store Stock (Brazil)',
				value: 'storeStock',
				action: 'Get autozone brazil store stock',
				description: `Brazil only: one AutoZone Brazil product (autozone.com.br) at a Brazilian store you choose: priced_for (the store asked), price, was_price, deal_price, core_charge, in_store (available, quantity) and availability. BRL, Portuguese text. Stock at a chosen US or Mexican store is not offered. If AutoZone does not apply the store the call fails unbilled. ${CHARGE} Costs 2 credits.`,
				routing: request('/api/v1/autozone/store-stock'),
			},
			{
				name: 'Get Vehicles',
				value: 'vehicles',
				action: 'Get autozone vehicles',
				description: `${NAME}'s vehicle selector, one level at a time: years, makes for a year (make_id, name), models for a make (model_id, name), submodels and engines for a model (US; Brazil and Mexico: years, makes, models). Use the make and model names as the vehicle in Get Category Products. ${CHARGE} ${COST}`,
				routing: request('/api/v1/autozone/vehicles', true),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search autozone products',
				description: `Search ${NAME} by keywords, an AutoZone part number or another brand's part number (cross-reference: an OEM or competitor number such as PH3614 finds the parts AutoZone matches to it): ranking_variant (AutoZone runs ranking tests, so totals and order can differ between identical calls), part_number_search, oem_part_number, oem_brand, redirected_to, ${ITEM}, ${LIST} Not available: results past the first 24, search suggestions, VIN lookup, engine-level fitment, AutoZonePro pricing, Mexico prices, checkout. ${PRICES} ${CHARGE} Costs 1 credit in the US, 2 in Brazil.`,
				routing: request('/api/v1/autozone/search'),
			},
		],
		default: 'category',
	},
];

export const autozoneFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'autozonePriceCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Brazil (2 Credits)', value: 'br' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['search'], {}),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			'United States (autozone.com, USD) or Brazil (autozone.com.br, BRL, Portuguese text, priced for store 7602 Sao Paulo). Mexico search is not offered.',
	},
	{
		displayName: 'Country',
		name: 'autozoneCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Brazil', value: 'br' },
			{ name: 'Mexico', value: 'mx' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['vehicles', 'stores', 'categories']),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'AutoZone United States (autozone.com), Brazil (autozone.com.br) or Mexico (autozone.com.mx)',
	},

	// -- Search Products --
	{
		displayName: 'Keyword or Part Number',
		name: 'autozoneQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'brake pads',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			"Keywords, an AutoZone part number (DG1210) or another brand's part number (PH3614, FL-820S). Brazil: Portuguese keywords (pastilha de freio).",
	},

	// -- Get Product, Get Reviews --
	{
		displayName: 'Product By',
		name: 'autozoneProductBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Item ID', value: 'id' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product', 'reviews', 'storeStock']),
		description: 'How to identify the product',
	},
	{
		displayName: 'Item ID',
		name: 'autozoneId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1399158',
		displayOptions: show(['product', 'reviews', 'storeStock'], { autozoneProductBy: ['id'] }),
		routing: { request: { body: { id: '={{ $value }}' } } },
		description: 'AutoZone item ID (the ID in items, the number at the end of the product link)',
	},
	{
		displayName: 'Product URL',
		name: 'autozoneProductUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.autozone.com/p/duralast-floor-jack-d3thj/1399158',
		displayOptions: show(['product', 'reviews', 'storeStock'], { autozoneProductBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'An AutoZone product link (its market is used)',
	},
	{
		displayName: 'Country',
		name: 'autozoneProductCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Brazil (2 Credits)', value: 'br' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['product'], { autozoneProductBy: ['id'] }),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'The market of the item ID. Mexico product is not offered.',
	},

	// -- Get Store Stock (Brazil) --
	{
		displayName: 'Store Number',
		name: 'autozoneStoreNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7602',
		displayOptions: show(['storeStock']),
		routing: { request: { body: { store_number: '={{ $value }}' } } },
		description: 'A Brazilian store number (Find Stores with Country Brazil, store_number)',
	},

	// -- Get Category Products --
	{
		displayName: 'Part Type Path',
		name: 'autozoneCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/brakes-and-traction-control/brake-pads',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A part type path from Get Categories (children path with has_products true) or its AutoZone link',
	},
	{
		displayName: 'Vehicle Year',
		name: 'autozoneVehicleYear',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 2100 },
		displayOptions: show(['category']),
		description: 'Optional: with Make and Model, only the parts that fit this vehicle (0 = every part)',
	},
	{
		displayName: 'Vehicle Make',
		name: 'autozoneVehicleMake',
		type: 'string',
		default: '',
		placeholder: 'Ford',
		displayOptions: show(['category']),
		description: 'The make as Get Vehicles lists it',
	},
	{
		displayName: 'Vehicle Model',
		name: 'autozoneVehicleModel',
		type: 'string',
		default: '',
		placeholder: 'F-150',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					vehicle:
						'={{ $parameter.autozoneVehicleYear && $parameter.autozoneVehicleMake && $value ? { year: $parameter.autozoneVehicleYear, make: $parameter.autozoneVehicleMake, model: $value } : undefined }}',
				},
			},
		},
		description:
			'The model as Get Vehicles lists it. An unknown make or model for that year is a charged not-found.',
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'autozoneBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'duralast',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'A brand slug (duralast, duralast-gold, mobil-1) or its AutoZone link',
	},
	{
		displayName: 'Part Type Path',
		name: 'autozoneBrandCategory',
		type: 'string',
		default: '',
		placeholder: '/brakes-and-traction-control/brake-rotor',
		displayOptions: show(['brand']),
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
		description: "Optional: that brand's products in one part type",
	},

	// -- Get Vehicles --
	{
		displayName: 'Level',
		name: 'autozoneLevel',
		type: 'options',
		default: 'years',
		options: [
			{ name: 'Engines (US)', value: 'engines' },
			{ name: 'Makes', value: 'makes' },
			{ name: 'Models', value: 'models' },
			{ name: 'Submodels (US)', value: 'submodels' },
			{ name: 'Years', value: 'years' },
		],
		displayOptions: show(['vehicles']),
		routing: { request: { body: { level: '={{ $value === "years" ? undefined : $value }}' } } },
		description: 'Makes need a year; models a year and make ID; submodels and engines a year, make ID and model ID',
	},
	{
		displayName: 'Year',
		name: 'autozoneYear',
		type: 'number',
		required: true,
		default: 2018,
		typeOptions: { minValue: 1900, maxValue: 2100 },
		displayOptions: show(['vehicles'], { autozoneLevel: ['makes', 'models', 'submodels', 'engines'] }),
		routing: { request: { body: { year: '={{ $value }}' } } },
	},
	{
		displayName: 'Make ID',
		name: 'autozoneMakeId',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0 },
		displayOptions: show(['vehicles'], { autozoneLevel: ['models', 'submodels', 'engines'] }),
		routing: { request: { body: { make_id: '={{ $value }}' } } },
		description: 'The make ID from the makes level (makes[].make_id; 54 = Ford in the US)',
	},
	{
		displayName: 'Model ID',
		name: 'autozoneModelId',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: 0 },
		displayOptions: show(['vehicles'], { autozoneLevel: ['submodels', 'engines'] }),
		routing: { request: { body: { model_id: '={{ $value }}' } } },
		description: 'The model ID from the models level (models[].model_id; 666 = F-150 in the US)',
	},

	// -- Find Stores --
	{
		displayName: 'State',
		name: 'autozoneState',
		type: 'string',
		default: '',
		placeholder: 'tx',
		displayOptions: show(['stores']),
		routing: { request: { body: { state: '={{ $value || undefined }}' } } },
		description: 'Optional: a state from the states list (tx, vt, nuevo-leon, sao-paulo) lists its cities; empty lists the states',
	},
	{
		displayName: 'City',
		name: 'autozoneCity',
		type: 'string',
		default: '',
		placeholder: 'houston',
		displayOptions: show(['stores']),
		routing: { request: { body: { city: '={{ $value || undefined }}' } } },
		description: "Optional, with State: a city slug (cities[].city_slug) lists that city's stores",
	},

	// -- Get Store --
	{
		displayName: 'Store Slug or URL',
		name: 'autozoneStoreSlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vt/barre/18-overlook-dr.html',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					slug: '={{ /^https?:\\/\\//.test($value) ? undefined : $value }}',
					url: '={{ /^https?:\\/\\//.test($value) ? $value : undefined }}',
				},
			},
		},
		description: 'A store slug from Find Stores (stores[].slug) or the store page link (its market is used)',
	},
	{
		displayName: 'Country',
		name: 'autozoneStoreCountry',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Brazil', value: 'br' },
			{ name: 'Mexico', value: 'mx' },
			{ name: 'United States', value: 'us' },
		],
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					country: '={{ $value === "us" || /^https?:\\/\\//.test($parameter.autozoneStoreSlug) ? undefined : $value }}',
				},
			},
		},
		description: 'The market of the slug (ignored for a link)',
	},

	// -- Additional Options --
	listCollection('autozoneSearchOptions', 'search', [
		...listOptions,
		{
			displayName: 'Brand',
			name: 'autozoneSearchBrand',
			type: 'string',
			default: '',
			placeholder: 'Duralast Gold',
			description: 'A brand as facets lists it: the same as the brand facet filter',
			routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		},
	]),
	listCollection('autozoneCategoryOptions', 'category', listOptions),
	{
		displayName: 'Additional Options',
		name: 'autozoneReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Page',
				name: 'autozoneReviewPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page (10 reviews a page; total_pages says how deep they go)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'autozoneReviewSort',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Default', value: 'default' },
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				description: "Review order (AutoZone's default order unless set)",
				routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Star Ratings',
				name: 'autozoneReviewStars',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with these star ratings',
				routing: { request: { body: { stars: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
		]),
	},
];
