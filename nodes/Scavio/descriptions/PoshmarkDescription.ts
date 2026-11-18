import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['poshmark'], operation, ...extra },
});

// Poshmark, 15 operations, 1 credit each. Markets (country, default us): us (poshmark.com, USD) and
// ca (poshmark.ca, CAD). Search Listings, Get Sold Listings, Get Category Listings, Get Brand
// Listings, Get Top Brands, Get Search Suggestions, Get Parties, Get Party Listings and Get Similar
// Listings answer for that market; Get Listing, the closet operations, Search Closets and Get
// Categories are global (the backend asks us by default, so they send no country). Listing pages
// can take up to about a minute and the backend retries, so every operation carries a 240s timeout.
// emptyBody: a base body {} so a call with no inputs set (Get Categories; Get Top Brands and Get
// Parties on their defaults) still posts JSON, as Best Buy deals and TCGplayer games do.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const MARKET_OPS = [
	'search',
	'sold',
	'category',
	'brand',
	'brands',
	'suggestions',
	'parties',
	'partyListings',
	'similar',
];
const CLOSET_OPS = ['closet', 'closetListings', 'loveNotes'];

const ITEM =
	'items with listing_id, URL, title, price (amount, currency), original_price (the original price the seller entered), first_price (the price it was first listed at; it can be below price when the seller raised it), price_drop_percent, size, brand, condition, department, category, colors, status, sold_at, like, comment and share counts, seller_username, created_at, updated_at and market';
const GRID =
	"48 listings per page; total is Poshmark's approximate count; about 5,000 listings are reachable per query (page up to 105).";
const SOLD_PRICE =
	'On a sold listing, price is the price shown on the sold listing (Poshmark says a sold listing reflects the final order price; offers are private and not returned) and sold_at is the date Poshmark marked it sold.';
const SOLD_CAP =
	"Sold listings stop at 10 pages = 480 per query and filter combination (Poshmark's own limit): narrow with filters or split by price range to reach more.";
const GLOBAL =
	"Listing IDs and closets are global: they open from either market, in the listing's own currency (no conversion).";
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const DEPARTMENTS = ['Women', 'Men', 'Kids', 'Home', 'Pets', 'Electronics'];
const departmentOptions = DEPARTMENTS.map((d) => ({ name: d, value: d }));

const option = {
	availability: (soldOnly = false): INodeProperties => ({
		displayName: 'Availability',
		name: 'availability',
		type: 'options',
		default: 'available',
		options: soldOnly
			? [
					{ name: 'Available', value: 'available' },
					{ name: 'Sold', value: 'sold' },
				]
			: [
					{ name: 'All', value: 'all' },
					{ name: 'Available', value: 'available' },
					{ name: 'Sold', value: 'sold' },
				],
		description: soldOnly
			? 'Available or sold listings'
			: 'Available (default), sold or all listings. Sold pages stop at 10 (480 listings).',
		routing: {
			request: { body: { availability: '={{ $value === "available" ? undefined : $value }}' } },
		},
	}),
	brands: {
		displayName: 'Brands',
		name: 'brand',
		type: 'string',
		default: '',
		placeholder: 'Coach',
		description:
			'Brand names as Poshmark writes them (items[].brand, Get Top Brands, Get Search Suggestions), comma-separated, up to 10',
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
	} as INodeProperties,
	category: {
		displayName: 'Category',
		name: 'category',
		type: 'string',
		default: '',
		placeholder: 'Bags',
		description:
			'A category slug or name from Get Categories (e.g. Bags, Pants_&_Jumpsuits). Needs Department.',
		routing: { request: { body: { category: '={{ $value || undefined }}' } } },
	} as INodeProperties,
	department: {
		displayName: 'Department',
		name: 'department',
		type: 'options',
		default: '',
		options: [{ name: 'Any', value: '' }, ...departmentOptions],
		routing: { request: { body: { department: '={{ $value || undefined }}' } } },
	} as INodeProperties,
	page: (max: number): INodeProperties => ({
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: max },
		description:
			max === 10
				? 'Page, 1 to 10, 48 sold listings each (480 per query and filter combination)'
				: 'Page, 1 to 105, 48 listings each. Sold listings stop at page 10.',
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	}),
	subcategory: {
		displayName: 'Subcategory',
		name: 'subcategory',
		type: 'string',
		default: '',
		placeholder: 'Totes',
		description:
			'A subcategory slug or name from Get Categories (e.g. Totes, Leggings). Needs Category.',
		routing: { request: { body: { subcategory: '={{ $value || undefined }}' } } },
	} as INodeProperties,
};

const filterOptions: INodeProperties[] = [
	{
		displayName: 'Colors',
		name: 'color',
		type: 'multiOptions',
		default: [],
		options: [
			'Black',
			'Blue',
			'Brown',
			'Cream',
			'Gold',
			'Gray',
			'Green',
			'Orange',
			'Pink',
			'Purple',
			'Red',
			'Silver',
			'Tan',
			'White',
			'Yellow',
		].map((c) => ({ name: c, value: c })),
		description: 'Up to 5 colours',
		routing: {
			request: { body: { color: '={{ $value && $value.length ? $value : undefined }}' } },
		},
	},
	{
		displayName: 'Condition',
		name: 'condition',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			{ name: 'Boutique', value: 'boutique' },
			{ name: 'Fair', value: 'fair' },
			{ name: 'Good', value: 'good' },
			{ name: 'Like New', value: 'like_new' },
			{ name: 'New With Tags', value: 'new_with_tags' },
			{ name: 'New With Tags or Boutique', value: 'new_with_tags_or_boutique' },
		],
		description: 'One condition (Boutique = Boutique retail listings)',
		routing: { request: { body: { condition: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Price',
		name: 'price_max',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: "Highest price, whole units of the market's currency",
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'price_min',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: "Lowest price, whole units of the market's currency",
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Size',
		name: 'size',
		type: 'string',
		default: '',
		placeholder: '10',
		description:
			'Sizes as Poshmark writes them (items[].size, e.g. 10, M, OS), comma-separated, up to 10',
		routing: { request: { body: { size: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Just In (Newest Listed)', value: 'just_in' },
			{ name: 'Just Shared', value: 'just_shared' },
			{ name: 'Most Liked', value: 'most_liked' },
			{ name: 'Price Drop', value: 'price_drop' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		description: 'Result order',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);

export const poshmarkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['poshmark'] } },
		options: [
			{
				name: 'Get Brand Listings',
				value: 'brand',
				action: 'Get poshmark brand listings',
				description: `One brand's listings in a market, optionally in one department and category: brand, brand_slug and ${ITEM}, plus total, has_more and facets. Available, sold or all. An unknown brand is a charged 404. ${GRID} ${SOLD_CAP} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/brand'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get poshmark categories',
				description: `Poshmark's category tree (the same on the US and Canada): 6 departments with their categories and subcategories (ID, name, slug). Slugs feed Search Listings, Get Sold Listings, Get Category Listings and Get Brand Listings. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/categories', true),
			},
			{
				name: 'Get Category Listings',
				value: 'category',
				action: 'Get poshmark category listings',
				description: `One category's listings in a market (department required; category and subcategory from Get Categories): ${ITEM}, plus total, has_more and facets. Available, sold or all. A category Poshmark does not know is a charged 404. ${GRID} ${SOLD_CAP} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/category'),
			},
			{
				name: 'Get Closet',
				value: 'closet',
				action: 'Get a poshmark closet',
				description: `A closet (seller) by username: home_market, posh_ambassador, super_seller, followers, following, listings, shares, items_sold (Poshmark's rounded figure, e.g. 700+), orders_shipped, love_notes, on_vacation, last_active_at, joined_at and description. Global. No real names, avatars or cities. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/closet'),
			},
			{
				name: 'Get Closet Listings',
				value: 'closetListings',
				action: 'Get poshmark closet listings',
				description: `A closet's available or sold listings, 48 per page, read in the seller's home market (market, currency): ${ITEM}, plus on_vacation, total and has_more. ${SOLD_PRICE} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/closet-listings'),
			},
			{
				name: 'Get Listing',
				value: 'product',
				action: 'Get a poshmark listing',
				description: `One listing in full by listing ID or link: description, status, sold_at, price, original_price (seller-entered), first_price, price drop, shipping, bundle_discount, promotions, sizes with quantities, colors, pictures, comments (no authors), dates and the seller (username, home_market, posh_ambassador, super_seller, followers, listings, items_sold, orders_shipped, love_notes, last_active_at, joined_at). ${GLOBAL} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/product'),
			},
			{
				name: 'Get Love Notes',
				value: 'loveNotes',
				action: 'Get poshmark love notes',
				description: `The latest Love Notes a closet received (at most 100: Poshmark shows only the latest 100, no paging): count, total (all received), complete and notes (comment, created_at, listing_id, picture_url). No author is returned. Global. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/love-notes'),
			},
			{
				name: 'Get Parties',
				value: 'parties',
				action: 'Get poshmark parties',
				description: `Posh Parties of one market, upcoming and recent (20): party_id, URL, name, type, status, start_time, end_time, listing_count, theme brands, departments and categories, and hosts (usernames). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/parties', true),
			},
			{
				name: 'Get Party Listings',
				value: 'partyListings',
				action: 'Get poshmark party listings',
				description: `Listings shared to one Posh Party, 20 per page by cursor: ${ITEM}, plus has_more and next_cursor. Party IDs are per market: ask with the party's own market. An unknown party ID answers 0 items. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/party-listings'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get poshmark search suggestions',
				description: `Brand and brand + category suggestions for a partial query in a market: type, text, brand, brand_id and category. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/suggestions'),
			},
			{
				name: 'Get Similar Listings',
				value: 'similar',
				action: 'Get poshmark similar listings',
				description: `16 listings Poshmark shows as similar to one listing, from the market asked (ask with the listing's own market): ${ITEM}. An unknown listing is a charged 404. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/similar'),
			},
			{
				name: 'Get Sold Listings',
				value: 'sold',
				action: 'Get poshmark sold listings',
				description: `Sold listings by keyword in one market, with sold prices and sold dates: ${ITEM}, plus total (approximate) and facets. ${SOLD_PRICE} ${SOLD_CAP} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/sold'),
			},
			{
				name: 'Get Top Brands',
				value: 'brands',
				action: 'Get poshmark top brands',
				description: `Poshmark's top 50 brands in a market (ID, name). The full brand directory is not available; brand inputs take any brand name. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/brands', true),
			},
			{
				name: 'Search Closets',
				value: 'closetsSearch',
				action: 'Search poshmark closets',
				description: `Closets whose username matches a query, 24 per page: username, URL, home_market and joined_at. Use Get Closet for a closet's stats. Global. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/closets-search'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search poshmark listings',
				description: `Search listings in one market: ${ITEM}, plus total, has_more and facets. Available (default), sold or all. ${GRID} ${SOLD_CAP} Not available: Posh Shows, trending searches, offers, bundles, price history. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/poshmark/search'),
			},
		],
		default: 'search',
	},
];

export const poshmarkFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (Poshmark.ca, CAD)', value: 'ca' },
			{ name: 'United States (Poshmark.com, USD)', value: 'us' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: "The market: results are that market's own listings in its currency",
	},

	// -- Keywords --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coach bag',
		displayOptions: show(['search', 'sold']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Partial Query',
		name: 'suggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lulu',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Username Query',
		name: 'closetQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vintage',
		displayOptions: show(['closetsSearch']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Part of a closet username',
	},

	// -- Get Listing, Get Similar Listings --
	{
		displayName: 'Listing By',
		name: 'listingBy',
		type: 'options',
		default: 'listingId',
		options: [
			{ name: 'Listing ID', value: 'listingId' },
			{ name: 'Listing URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the listing',
	},
	{
		displayName: 'Listing ID',
		name: 'listingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6ad80f0dce5b0ace7ee9abd7',
		displayOptions: show(['product'], { listingBy: ['listingId'] }),
		routing: { request: { body: { listing_id: '={{ $value }}' } } },
		description: 'The listing ID (items[].listing_id, 24 hex characters)',
	},
	{
		displayName: 'Listing URL',
		name: 'listingUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://poshmark.com/listing/...',
		displayOptions: show(['product'], { listingBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A poshmark.com or poshmark.ca listing link',
	},
	{
		displayName: 'Listing ID',
		name: 'similarListingId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6ad80f0dce5b0ace7ee9abd7',
		displayOptions: show(['similar']),
		routing: { request: { body: { listing_id: '={{ $value }}' } } },
		description: 'The listing ID (items[].listing_id) to find similar listings for',
	},

	// -- Get Category Listings --
	{
		displayName: 'Department',
		name: 'categoryDepartment',
		type: 'options',
		required: true,
		default: 'Women',
		options: departmentOptions,
		displayOptions: show(['category']),
		routing: { request: { body: { department: '={{ $value }}' } } },
	},
	{ ...option.category, name: 'categorySlug', displayOptions: show(['category']) },
	{ ...option.subcategory, name: 'subcategorySlug', displayOptions: show(['category']) },

	// -- Get Brand Listings --
	{
		displayName: 'Brand',
		name: 'brandName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Coach',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'One brand: its name (Coach, lululemon athletica) or slug (items[].brand_slug)',
	},

	// -- Closet operations --
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'thriftedbyher',
		displayOptions: show(CLOSET_OPS),
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'The closet username (poshmark.com/closet/USERNAME, items[].seller_username)',
	},

	// -- Get Party Listings --
	{
		displayName: 'Party ID',
		name: 'partyId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6af437b4ccaeb9c6a30f84a3',
		displayOptions: show(['partyListings']),
		routing: { request: { body: { party_id: '={{ $value }}' } } },
		description:
			"A party ID from Get Parties. Party IDs are per market: pick the party's market as Country.",
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			option.availability(),
			option.brands,
			option.category,
			option.department,
			option.page(105),
			option.subcategory,
			...filterOptions,
		].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'soldOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sold']),
		options: [
			option.brands,
			option.category,
			option.department,
			option.page(10),
			option.subcategory,
			...filterOptions,
		].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: [option.availability(), option.brands, option.page(105), ...filterOptions].sort(
			byName,
		),
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: [
			option.availability(),
			option.category,
			option.department,
			option.page(105),
			...filterOptions,
		].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'closetListingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['closetListings']),
		options: [option.availability(true), option.page(105)],
	},
	{
		displayName: 'Additional Options',
		name: 'closetsSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['closetsSearch']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page, 1 to 200, 24 closets each',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'partiesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['parties']),
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Archived (Ended)', value: 'archived' },
					{ name: 'Scheduled (Upcoming)', value: 'scheduled' },
				],
				routing: { request: { body: { status: '={{ $value === "all" ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'partyListingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['partyListings']),
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'The next_cursor of the previous page',
				routing: { request: { body: { cursor: '={{ $value || undefined }}' } } },
			},
		],
	},
];
