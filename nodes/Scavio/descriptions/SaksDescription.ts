import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['saks'], operation, ...extra },
});

// Saks Fifth Avenue (saksfifthavenue.com, US only, USD), 9 operations, 2 credits each. Get
// Product takes a product ID or URL; Get Category Products takes a path or URL; Get Brand
// Products takes a designer slug or URL; Get Store Availability takes a variant SKU. Every
// route carries a 120s timeout.
const request = (url: string, timeout = 120000) => ({
	request: { method: 'POST' as const, url, timeout },
});

const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

const GRID =
	'24 grid positions per page, each item with ID (variant_id too when the tile shows one variant), title, brand, URL, image, price (price_max when the item sells at a range), regular and sale price, percent off, on-sale flag, review count, badge (Best Seller, Exclusive, Runway Look...), is_final_sale and is_clearance (null when the tile leaves them blank; Get Product is authoritative), returnable, limited_inventory, promotions, product_type and colors. Also returns total, page, total_pages, start and next_start (put next_start in Start for the next page: an editorial tile can take a grid position, so a page may carry 22-23 items), the sort applied, the facets (ID, label and values with counts; any value works in Other Filters), price_ranges and applied_filters. Review count only: review text is not available. Prices in USD.';

// Grid options shared by Search Products, Get Category Products, Get Brand Products and
// Get Deals (Get Brand Products has no Designers filter: the page is one designer).
const gridOptions = (withBrand: boolean): INodeProperties[] => {
	const options: INodeProperties[] = [
		{
			displayName: 'Colors',
			name: 'shades',
			type: 'string',
			default: '',
			placeholder: 'Black, Blue',
			description:
				'Only these colors, as the colorRefinement facet lists them, separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'color', value: splitList } },
		},
		{
			displayName: 'Max Price',
			name: 'max_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Maximum price in USD',
			routing: { request: { body: { max_price: '={{ $value }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'min_price',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: "Minimum price in USD. Any bound works, not only the site's price buckets.",
			routing: { request: { body: { min_price: '={{ $value }}' } } },
		},
		{
			displayName: 'New Arrivals Only',
			name: 'new_arrivals',
			type: 'boolean',
			default: false,
			description: 'Whether to return only new arrivals',
			routing: { request: { body: { new_arrivals: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'On Sale Only',
			name: 'on_sale',
			type: 'boolean',
			default: false,
			description: 'Whether to return only items on sale',
			routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Other Filters (JSON)',
			name: 'filters',
			type: 'json',
			default: '{}',
			description:
				'Any other facet from a previous response\'s facets: its ID to one value or a list, e.g. {"refGender": "Women\'s", "refMaterial": "Cashmere"}',
			routing: {
				request: {
					body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
				},
			},
		},
		{
			displayName: 'Page',
			name: 'page',
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 500 },
			description: 'Results page, 1-based (24 grid positions per page). Defaults to 1.',
			routing: { request: { body: { page: '={{ $value }}' } } },
		},
		{
			displayName: 'Sizes',
			name: 'size',
			type: 'string',
			default: '',
			placeholder: 'Medium',
			description:
				'Only these sizes, spelled as the sizeRefinement facet LABEL lists them ("Medium", not "M"), separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'size', value: splitList } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'featured',
			options: [
				{ name: 'Best Sellers', value: 'best_sellers' },
				{ name: 'Designer A-Z', value: 'brand_az' },
				{ name: 'Featured', value: 'featured' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
				{ name: 'Sale First', value: 'sale_first' },
			],
			description:
				"Featured (default, the site's own order), best sellers, newest, price, sale first or designer A-Z",
			routing: { request: { body: { sort: '={{ $value }}' } } },
		},
		{
			displayName: 'Start',
			name: 'start',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description:
				"Item offset, instead of Page: a previous response's next_start, to walk every item without gaps",
			routing: { request: { body: { start: '={{ $value }}' } } },
		},
	];
	if (withBrand) {
		options.push({
			displayName: 'Designers',
			name: 'brand',
			type: 'string',
			default: '',
			placeholder: 'Prada, Moncler',
			description:
				'Only these designers, spelled as the brand facet lists them, separated by commas. Several match any of them.',
			routing: { send: { type: 'body', property: 'brand', value: splitList } },
		});
	}
	return options.sort((x, y) => x.displayName.localeCompare(y.displayName));
};

// Location fields shared by Find Stores and Get Store Availability.
const locationFields = (operation: string, modeName: string): INodeProperties[] => [
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10022',
		displayOptions: show([operation], { [modeName]: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'Latitude',
		name: 'lat',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show([operation], { [modeName]: ['coordinates'] }),
		routing: { request: { body: { lat: '={{ $value }}' } } },
		description: 'Latitude to search around',
	},
	{
		displayName: 'Longitude',
		name: 'lng',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show([operation], { [modeName]: ['coordinates'] }),
		routing: { request: { body: { lng: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},
	{
		displayName: 'Locate By',
		name: modeName,
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'Coordinates', value: 'coordinates' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show([operation]),
		description: 'Search near a ZIP code or a latitude/longitude pair',
	},
	{
		displayName: 'Additional Options',
		name: `${operation}LocationOptions`,
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show([operation]),
		options: [
			{
				displayName: 'Radius (Miles)',
				name: 'radius',
				type: 'options',
				default: 50,
				options: [
					{ name: '15 Miles', value: 15 },
					{ name: '30 Miles', value: 30 },
					{ name: '50 Miles', value: 50 },
					{ name: '100 Miles', value: 100 },
					{ name: '300 Miles', value: 300 },
				],
				description: 'Search radius in miles. Defaults to 50.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
		],
	},
];

export const saksOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['saks'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find saks fifth avenue stores',
				description:
					"Saks Fifth Avenue stores near a US ZIP code or a point (latitude and longitude), within 15 / 30 / 50 / 100 / 300 miles (default 50): store_id, name, address, city, state, ZIP, latitude and longitude, distance in miles (pickup stores), today's opening and closing times, hours as listed, closed flag, and pickup (true for stores that offer in-store pickup; other Saks locations are listed with pickup false). Costs 2 credits.",
				routing: request('/api/v1/saks/stores'),
			},
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get saks fifth avenue designer products',
				description:
					"Browse one designer's Saks page by slug (from Get Designers) or URL, with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the brand's name, slug and URL. An unknown slug is an error. Costs 2 credits.",
				routing: request('/api/v1/saks/brand'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get saks fifth avenue category products',
				description:
					"Browse one Saks category by its /c/ path or URL (women's dresses, men's sweaters, beauty...), with the same filters and sorts as Search Products. " +
					GRID +
					" Also returns the category's name, path, URL and breadcrumbs. An unknown path is an error. Costs 2 credits.",
				routing: request('/api/v1/saks/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get saks fifth avenue sale and new arrivals',
				description:
					"Saks sale and new-arrival listings: all Sale (default), Women's Clothing Sale, Men's Sale, Women's New Arrivals or Men's New Arrivals, with the same filters and sorts as Search Products. " +
					GRID +
					' Saks has no clearance or final-sale listing (items carry is_clearance / is_final_sale flags). Costs 2 credits.',
				routing: request('/api/v1/saks/deals'),
			},
			{
				name: 'Get Designers',
				value: 'designers',
				action: 'Get saks fifth avenue designers',
				description:
					'The Saks A-Z designer index (about 1,200 designers): name, slug (what Get Brand Products takes), URL and letter, optionally only one letter. Costs 2 credits.',
				routing: request('/api/v1/saks/designers'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a saks fifth avenue product',
				description:
					'One saksfifthavenue.com product by ID or URL: title, brand, type (master or variant), UPC (for a variant), price, price_max, regular and sale price, percent off, on-sale flag, is_new / is_sale / is_clearance / is_final_sale, badge, returnable, promotions, description, style code, images, colors and sizes (each with availability IN_STOCK / NOT_AVAILABLE, selectable and waitlist), every SKU in variants with its online warehouse unit count, in-stock and available counts, availability (units available to sell, message such as Limited Inventory, in_stock_date), available_in_store, marketplace, drop_ship, preorder, merchandising attributes, the average star rating and review_count. Review text is not available. Add Color and Size (or pass a variant SKU) to resolve one variant. A variant SKU is what Get Store Availability takes. An unknown ID is an error. Costs 2 credits.',
				routing: request('/api/v1/saks/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get saks fifth avenue search suggestions',
				description:
					'The saksfifthavenue.com search-box suggestions for a partial query: the result count, matching designers, suggested categories (name, parent, path for Get Category Products), up to 5 featured products (ID, title, brand, URL, image) and popular searches. Costs 2 credits.',
				routing: request('/api/v1/saks/suggestions'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get saks fifth avenue store pickup availability',
				description:
					"Can one Saks variant (SKU) be picked up near a US ZIP code or a point? For each pickup store: the site's availability message (In Stock, Limited Inventory, Not Available), in_stock, limited, units_at_store when the site gives a count (it does for stores that have the item; otherwise null), and the store's address, distance and today's hours. Needs a variant SKU from Get Product (variants[].sku). Costs 2 credits.",
				routing: request('/api/v1/saks/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search saks fifth avenue products',
				description:
					'Search saksfifthavenue.com (US) by keyword, filtered by designer, color, size (the facet label, e.g. Medium), any price range, on sale, new arrivals and any other facet, sorted by featured, best sellers, newest, price, sale first or designer A-Z. ' +
					GRID +
					' A keyword the site sends to a designer or category page is answered from that page, named in redirected_to. Use a result ID with Get Product. Costs 2 credits.',
				routing: request('/api/v1/saks/search'),
			},
		],
		default: 'search',
	},
];

export const saksFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coat',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions(true),
	},

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'path',
		type: 'string',
		default: '',
		placeholder: '/c/women-s-apparel/dresses',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ $value || undefined }}' } } },
		description:
			'A Saks category path (/c/...): from a category URL, a Get Search Suggestions category path or a breadcrumb. Use this or Category URL.',
	},
	{
		displayName: 'Category URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.saksfifthavenue.com/c/women-s-apparel/dresses',
		displayOptions: show(['category']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A saksfifthavenue.com category URL. Filters, sort and page already in the URL are kept. Used when Category Path is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions(true),
	},

	// -- Get Brand Products --
	{
		displayName: 'Designer Slug',
		name: 'brandSlug',
		type: 'string',
		default: '',
		placeholder: 'gucci',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
		description:
			'A designer slug from Get Designers (gucci, chloé, alice-olivia). A plain name is slugified. Use this or Designer Page URL.',
	},
	{
		displayName: 'Designer Page URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.saksfifthavenue.com/brand/gucci',
		displayOptions: show(['brand']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A saksfifthavenue.com /brand/ URL. Filters, sort and page already in the URL are kept. Used when Designer Slug is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: gridOptions(false),
	},

	// -- Get Deals --
	{
		displayName: 'List',
		name: 'type',
		type: 'options',
		default: 'sale',
		options: [
			{ name: "Men's New Arrivals", value: 'mens_new_arrivals' },
			{ name: "Men's Sale", value: 'mens_sale' },
			{ name: 'Sale (All)', value: 'sale' },
			{ name: "Women's Clothing Sale", value: 'womens_sale' },
			{ name: "Women's New Arrivals", value: 'womens_new_arrivals' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value }}' } } },
		description: 'Which sale or new-arrival listing to read. Saks has no clearance list.',
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: gridOptions(true),
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '0400019127312',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			"Saks product ID: a search result's ID (the number at the end of a product URL), or a variant SKU. Use this or Product URL.",
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.saksfifthavenue.com/product/kay-unger-mariah-jacquard-textured-gown-0400019127312.html',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A saksfifthavenue.com product URL (its trailing ID is used; a color / size it selects is kept). Used when Product ID is not given.',
	},
	{
		displayName: 'Additional Options',
		name: 'productOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Color',
				name: 'shade',
				type: 'string',
				default: '',
				placeholder: 'BLUE OPAL',
				description: 'Pick one color (a colors[].value) to resolve the variant',
				routing: { request: { body: { color: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Size',
				name: 'size',
				type: 'string',
				default: '',
				placeholder: '4',
				description: 'Pick one size (a sizes[].value). With Color, the answer is that variant.',
				routing: { request: { body: { size: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Store Availability --
	{
		displayName: 'Variant SKU',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10781654',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description:
			"A variant SKU: a product's variants[].sku from Get Product, or a product's ID after picking Color and Size",
	},
	...locationFields('storeAvailability', 'checkBy'),

	// -- Find Stores --
	...locationFields('stores', 'locateBy'),

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'gucci',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Get Designers --
	{
		displayName: 'Additional Options',
		name: 'designersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['designers']),
		options: [
			{
				displayName: 'Letter',
				name: 'letter',
				type: 'string',
				default: '',
				placeholder: 'G',
				description: 'Only designers under this letter (A-Z, or # for names starting with a digit)',
				routing: { request: { body: { letter: '={{ $value || undefined }}' } } },
			},
		],
	},
];
