import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['barnesandnoble'], operation, ...extra },
});

// Barnes & Noble (barnesandnoble.com, the US bookseller), 10 operations, 1 credit each; credits_used is the truth.
// US only, USD. Collection, bestseller, deal and navigation pages take 8 to 35 s, so every operation carries a 180s
// timeout (the backend ends a request, retries included, inside 170 s).
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 180000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = 'Barnes & Noble (barnesandnoble.com, the US bookseller), US only, prices in USD';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICE =
	'Price is what Barnes & Noble charges a visitor now, original_price the struck-through price when the page shows one. Member prices are not shown to visitors and are not returned.';
const GRID =
	"total (the site's count for the whole list), count, page_size (24), has_more, sort, sort_label, filters, items (position, EAN for Get Product and Get Store Availability, work_id, title, contributors with role, format, format_detail, edition, series, publication_date, sales_rank, price, original_price, on_sale, availability as given, badges such as $3 OFF or Best Seller, image, URL; rating and rating_count are empty in lists), facets (filter, title, values with counts) and notes. Barnes & Noble shows 24 results per page and the answer holds that first page: narrow with Sort and Filters.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** An EAN / ISBN-13 or ISBN-10, dashes and spaces removed (the backend verifies the check digit). */
const bookField = (name: string, operation: string): INodeProperties => ({
	displayName: 'EAN or ISBN',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '9780593135204',
	displayOptions: show([operation]),
	routing: { request: { body: { ean: '={{ String($value).replace(/[\\s-]/g, "") }}' } } },
	description:
		"The book's EAN / ISBN-13 (items[].ean or formats[].ean from another answer; 978, 979 or Barnes & Noble's 2940 digital EANs) or an ISBN-10, which is converted to its 978 EAN. Dashes are removed; check digits are verified.",
});

const sortOption = (name: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: 'relevance',
	options: [
		{ name: 'Bestselling', value: 'bestselling' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Oldest', value: 'oldest' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
		{ name: 'Relevance (Top Matches)', value: 'relevance' },
		{ name: 'Title (A to Z)', value: 'title' },
	],
	description: "The site's sort menu. Price: Low to High puts free eBooks first.",
	routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
});

const filtersOption = (name: string): INodeProperties => ({
	displayName: 'Filters (JSON)',
	name,
	type: 'json',
	default: '{}',
	description:
		'The site\'s own filters: format, availability, price, subject, age, language, each to one value or a list, at most 10 values in all, e.g. {"format": "Paperback"}, {"availability": "in_stock"}, {"price": ["10_15", "15_25"]}. Availability: in_stock, preorder, ships_in_1_2_days. Price bands: under_5, 5_10, 10_15, 15_25, 25_50, over_50. Format, subject, age and language as the site names them (facets[].values[].value in an answer).',
	routing: {
		request: {
			body: {
				filters:
					'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}',
			},
		},
	},
});

const gridOptions = (prefix: string): INodeProperties[] =>
	sorted([filtersOption(`${prefix}Filters`), sortOption(`${prefix}Sort`)]);

export const barnesandnobleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['barnesandnoble'] } },
		options: [
			{
				name: 'Get Bestsellers',
				value: 'bestsellers',
				action: 'Get barnes and noble bestsellers',
				description: `A ${SITE} bestseller list: the Bestsellers page (default), Bestselling Books, The New York Times Best Sellers or B&N Stores Bestsellers: list, title, URL, total, count, items (rank plus the search item fields; the first page of 20 to 24 titles) and lists (heading, link, count, items) for a list page that shows its titles as separate lists, such as Hardcover Fiction and Paperback Nonfiction (items is then empty). Rank is the position on the list; sales_rank is the site's own sales rank. ${PRICE} Captured 2026-11-27: the Bestsellers page counted 180416 titles, 24 listed. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/bestsellers', true),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get barnes and noble categories',
				description: `The ${SITE} header navigation as the site shows it: count, group_count, link_count and departments (name, URL, path, groups with their links). Path is what Get Category Products takes (null for a page that is not a collection). Captured 2026-11-27: 9 departments, 52 groups and 238 links. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/categories', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get barnes and noble category products',
				description: `One ${SITE} collection by path or link (Mystery & Thriller, New Releases, Kids ages 3-5 ...), sorted and filtered like Search: path, URL, title, breadcrumbs, ${GRID} A collection page that shows shelves instead of a product list answers items [] and shelves (heading, link, count, items) as the page shows them. ${PRICE} Captured 2026-11-27: books/mystery-thrillers counted 188000 titles. An unknown collection is a charged not-found. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get barnes and noble deals',
				description: `A ${SITE} deals page: the Black Friday and Cyber Monday deals (default, while the site runs it), Coupons & Deals, Book Deals for Kids, eBook or audiobook deals: type, title, URL, count, item_count and sections (the page's deal shelves: heading, link, count, items with EAN, title, format, contributors, price, original_price, on_sale, available_for_sale, image). The page gives no end date per deal. Captured 2026-11-27: the Black Friday and Cyber Monday page held 21 shelves with 165 titles. A deals page the site does not run is a charged not-found. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/deals', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a barnes and noble product',
				description: `One ${SITE} title by EAN / ISBN-13 or ISBN-10: requested_ean, EAN, work_id, title, contributors, format, parent_format, edition, publisher, imprint, publication_date, pages, dimensions, language, series, audience_age, run_time, sales_rank, price, original_price, on_sale, available_for_sale, inventory (the page's online stock flags: in_stock, preorder, backorder), rating, rating_count, member_offers (the member offer text the page shows, as given; never a member price), badges, collections, categories, images, URL, overview (a short excerpt of the publisher's overview, at most 300 characters; overview_truncated says when it was cut) and formats (one EAN per format the page links, with price). Review text is not available. ${PRICE} Captured 2026-11-27: Project Hail Mary in hardcover at 32 USD, rated 4.6 from 287 ratings, with 6 formats. An unknown EAN is a charged not-found. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/product'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a barnes and noble store',
				description: `One Barnes & Noble store by ID: name, address, phone, coordinates, time_zone, hours, hours_by_day, holiday_hours, services (cafe, toys and games, vinyl, used books, electronics), open_date, events_count, URL, corp_name and holiday_hours_text. Hours are as the store page writes them. Captured 2026-11-27: store 2234, Fifth Avenue, New York, NY, open 9-9 every day, closed on Thanksgiving. An unknown store is a charged not-found. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/store'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get barnes and noble store availability',
				description: `Store pickup availability of one ${SITE} title at the Barnes & Noble stores near a ZIP code, a city or a store number (usually 16 to 32 stores, nearest first): EAN, near, near_type, count, available_count and stores (store_id, name, address, phone, hours, distance_miles, eligible, available). Eligible and available are Barnes & Noble's own pickup flags, not unit counts: the site publishes none. Prices are national. Captured 2026-11-27: EAN 9780439023528 near ZIP 60611 was available for pickup at 28 of 28 stores. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/store-availability'),
			},
			{
				name: 'Get Stores',
				value: 'stores',
				action: 'Get barnes and noble stores',
				description: `The Barnes & Noble stores near a US ZIP code, a city and state or a point, nearest first, each store's public listing: count and stores (store_id for Get Store, name, address, phone, coordinates, distance_miles, time_zone, hours, hours_by_day, holiday_hours, services, open_date, events_count, URL). Captured 2026-11-27: ZIP 10001 listed 44 stores. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/stores'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get barnes and noble search suggestions',
				description: `The search-box suggestions of ${SITE} for a partial query: total, count, products (up to 10, with the search item fields) and topics (label, path for Get Category Products, URL). The answer carries no keyword completions. Captured 2026-11-27: hunger gave 10 title suggestions out of 5710 matches. ${ONE}`,
				routing: request('/api/v1/barnesandnoble/suggestions'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search barnes and noble',
				description: `${SITE} keyword search (title, author, series, ISBN or subject), sorted with the site's sort menu and filtered by format, availability, price band, subject, age and language: query, ${GRID} ${PRICE} ${ONE} Captured 2026-11-27: project hail mary gave 3101 results. The first 24 were listed.`,
				routing: request('/api/v1/barnesandnoble/search'),
			},
		],
		default: 'search',
	},
];

export const barnesandnobleFields: INodeProperties[] = [
	// -- Search --
	{
		displayName: 'Query',
		name: 'barnesandnobleQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'project hail mary',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords: title, author, series, ISBN or subject (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'barnesandnobleSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: gridOptions('barnesandnobleSearch'),
	},

	// -- Get Product, Get Store Availability --
	bookField('barnesandnobleProductEan', 'product'),
	bookField('barnesandnobleAvailabilityEan', 'storeAvailability'),
	{
		displayName: 'Near',
		name: 'barnesandnobleAvailabilityNear',
		type: 'string',
		required: true,
		default: '',
		placeholder: '60611',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { near: '={{ String($value).trim() }}' } } },
		description: 'Where to check: a US ZIP code, a city and state (Austin, TX) or a Barnes & Noble store number (2234)',
	},

	// -- Get Stores --
	{
		displayName: 'Find By',
		name: 'barnesandnobleStoresBy',
		type: 'options',
		default: 'near',
		options: [
			{ name: 'ZIP Code or City', value: 'near' },
			{ name: 'Coordinates', value: 'point' },
		],
		displayOptions: show(['stores']),
		description: 'Look stores up near a ZIP code or a city and state, or near a point',
	},
	{
		displayName: 'Near',
		name: 'barnesandnobleStoresNear',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores'], { barnesandnobleStoresBy: ['near'] }),
		routing: { request: { body: { near: '={{ String($value).trim() }}' } } },
		description: 'A US ZIP code or a city and state (Austin, TX)',
	},
	{
		displayName: 'Latitude',
		name: 'barnesandnobleStoresLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['stores'], { barnesandnobleStoresBy: ['point'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude of the point, e.g. 34.0522',
	},
	{
		displayName: 'Longitude',
		name: 'barnesandnobleStoresLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['stores'], { barnesandnobleStoresBy: ['point'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude of the point, e.g. -118.2437',
	},

	// -- Get Store --
	{
		displayName: 'Store ID',
		name: 'barnesandnobleStoreId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2234',
		displayOptions: show(['store']),
		routing: { request: { body: { store_id: '={{ String($value).trim() }}' } } },
		description: 'A Barnes & Noble store ID (store_id from Get Stores or Get Store Availability)',
	},

	// -- Get Suggestions --
	{
		displayName: 'Query',
		name: 'barnesandnobleSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hunger',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far (1 to 100 characters)',
	},

	// -- Get Bestsellers --
	{
		displayName: 'List',
		name: 'barnesandnobleBestsellersList',
		type: 'options',
		default: 'top',
		options: [
			{ name: 'B&N Stores Bestsellers', value: 'stores' },
			{ name: 'Bestsellers Page', value: 'top' },
			{ name: 'Bestselling Books', value: 'books' },
			{ name: 'The New York Times Best Sellers', value: 'nyt' },
		],
		displayOptions: show(['bestsellers']),
		routing: { request: { body: { list: '={{ $value === "top" ? undefined : $value }}' } } },
		description: 'Which bestseller list to read',
	},

	// -- Get Category Products --
	{
		displayName: 'Collection Path or URL',
		name: 'barnesandnobleCategoryPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'books/mystery-thrillers',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					path: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A collection path (path from Get Categories or topics[].path from Get Suggestions; /collections/ optional) or a barnesandnoble.com/collections/ link (its query string is not read: set Sort and Filters instead)',
	},
	{
		displayName: 'Additional Options',
		name: 'barnesandnobleCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: gridOptions('barnesandnobleCategory'),
	},

	// -- Get Deals --
	{
		displayName: 'Deal Type',
		name: 'barnesandnobleDealsType',
		type: 'options',
		default: 'black_friday',
		options: [
			{ name: 'Audiobook Deals', value: 'audiobooks' },
			{ name: 'Black Friday and Cyber Monday', value: 'black_friday' },
			{ name: 'Book Deals for Kids', value: 'kids' },
			{ name: 'Coupons & Deals', value: 'coupons' },
			{ name: 'eBook Deals', value: 'ebooks' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { type: '={{ $value === "black_friday" ? undefined : $value }}' } } },
		description: 'Which deals page to read',
	},
];
