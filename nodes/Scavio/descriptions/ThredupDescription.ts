import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['thredup'], operation, ...extra },
});

// thredUP, 12 operations, 1 credit each. One store: thredUP's US store (thredup.com, USD; thredUP
// ships to the US and Canada from it), so there is no country input. List pages take 15 to 45
// seconds and the backend retries, so every operation carries a 240s timeout, like Poshmark.
// emptyBody: a base body {} so a call with no inputs set (Get Rescue Boxes; Get Categories, Get
// Brands and Get Trending Searches on their defaults) still posts JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const ITEM =
	"items with item_number, URL, title, brand, category, department, size, condition, price, estimated_retail (the estimated original retail: thredUP's estimate, or the seller's on Direct Listing items), percent_off (computed from the price and the estimated retail), promo, clearance, final_sale, seller_type (thredup, direct_listing, dropship), status (available, reserved, sold), colors, materials and pictures";
const LIST =
	"sort (the order applied), total (thredUP's approximate count; it caps at 10,000: total_capped true means 10,000+), has_more and count. 119 items per page, pages 1 to 21 (about 2,500 items per query and filter combination).";
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const DEPARTMENTS: Array<[string, string]> = [
	['Accessories', 'accessories'],
	['Boys', 'boys'],
	['Designer', 'designer'],
	['Girls', 'girls'],
	['Handbags', 'handbags'],
	['Juniors', 'juniors'],
	['Maternity', 'maternity'],
	['Plus', 'plus'],
	['Shoes', 'shoes'],
	['Women', 'women'],
];
const departmentOptions = DEPARTMENTS.map(([name, value]) => ({ name, value }));
const DEPARTMENT_DESC = "The department (thredUP has no men's department)";

const department = (operations: string[]): INodeProperties => ({
	displayName: 'Department',
	name: 'department',
	type: 'options',
	default: 'women',
	options: departmentOptions,
	displayOptions: show(operations),
	routing: { request: { body: { department: '={{ $value === "women" ? undefined : $value }}' } } },
	description: DEPARTMENT_DESC,
});

const brandOption: INodeProperties = {
	displayName: 'Brand',
	name: 'brand',
	type: 'string',
	default: '',
	placeholder: 'Patagonia',
	description: 'Brand as thredUP writes it (items[].brand, Get Brands, Get Search Suggestions)',
	routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
};
const categoryOption: INodeProperties = {
	displayName: 'Category',
	name: 'category',
	type: 'string',
	default: '',
	placeholder: 'dresses',
	description:
		'A category tag from Get Categories (categories[].category), e.g. dresses, jeans, outerwear',
	routing: { request: { body: { category: '={{ $value || undefined }}' } } },
};
const pageOption: INodeProperties = {
	displayName: 'Page',
	name: 'page',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 21 },
	description: 'Page, 1 to 21, 119 items each',
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
};
const sortOption = (description: string): INodeProperties => ({
	displayName: 'Sort',
	name: 'sort',
	type: 'options',
	default: 'default',
	options: [
		{ name: 'Default (the Page Order)', value: 'default' },
		{ name: 'Newest', value: 'newest' },
		{ name: 'Price Drop (Recently Discounted)', value: 'price_drop' },
		{ name: 'Price: High to Low', value: 'price_high' },
		{ name: 'Price: Low to High', value: 'price_low' },
		{ name: 'Recommended', value: 'recommended' },
		{ name: 'Relevance', value: 'relevance' },
	],
	description,
	routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
});
const multi = (
	displayName: string,
	name: string,
	values: Array<[string, string]>,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'multiOptions',
	default: [],
	options: values.map(([n, value]) => ({ name: n, value })),
	description,
	routing: {
		request: { body: { [name]: '={{ $value && $value.length ? $value : undefined }}' } },
	},
});
const titled = (values: string[]): Array<[string, string]> =>
	values.map((v) => [v.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase()), v]);

const filterOptions: INodeProperties[] = [
	{
		displayName: 'Clearance Only',
		name: 'clearance',
		type: 'boolean',
		default: false,
		description: 'Whether to return only clearance items',
		routing: { request: { body: { clearance: '={{ $value || undefined }}' } } },
	},
	multi(
		'Colors',
		'color',
		titled([
			'black',
			'blue',
			'brown',
			'green',
			'grey',
			'ivory',
			'orange',
			'pink',
			'purple',
			'red',
			'tan',
			'teal',
			'white',
			'yellow',
		]),
		'Up to 5 colours',
	),
	multi(
		'Conditions',
		'condition',
		[
			['Excellent', 'excellent'],
			['Flawed (Flawed Gems)', 'flawed'],
			['Good', 'good'],
			['New With Tags', 'new_with_tags'],
			['Very Good', 'very_good'],
		],
		'Up to 5 conditions',
	),
	multi(
		'Materials',
		'material',
		titled([
			'acrylic',
			'blend',
			'cashmere',
			'cashmere blend',
			'cotton',
			'cotton blend',
			'faux fur',
			'leather',
			'linen',
			'linen blend',
			'natural',
			'nylon',
			'polyester',
			'rayon',
			'silk',
			'silk blend',
			'spandex',
			'suede',
			'synthetic',
			'vegan leather',
			'wool',
			'wool blend',
		]),
		'Up to 5 material groups',
	),
	{
		displayName: 'Max Price',
		name: 'price_max',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description:
			'Highest price, whole USD. Approximate: thredUP matches a base price, so an item can show slightly outside the range.',
		routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'price_min',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0 },
		description: 'Lowest price, whole USD (approximate, see Max Price)',
		routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
	},
	pageOption,
	{
		displayName: 'Pattern',
		name: 'pattern',
		type: 'options',
		default: '',
		options: [
			{ name: 'Any', value: '' },
			...titled([
				'animal print',
				'argyle',
				'camo',
				'checkered-gingham',
				'chevron-herringbone',
				'color block',
				'floral',
				'graphic',
				'hearts',
				'houndstooth',
				'metallic',
				'paisley',
				'plaid',
				'polka dots',
				'print',
				'solid',
				'stars',
				'stripes',
				'tie-dye',
				'tropical',
				'tweed',
			]).map(([name, value]) => ({ name, value })),
		],
		routing: { request: { body: { pattern: '={{ $value || undefined }}' } } },
	},
	multi(
		'Seller Types',
		'seller_type',
		[
			['Direct Listing (Private Sellers)', 'direct_listing'],
			['Dropship (Partner Listings)', 'dropship'],
			['thredUP (Priced and Shipped by thredUP)', 'thredup'],
		],
		'Who sells (default all three)',
	),
	{
		displayName: 'Size IDs',
		name: 'size',
		type: 'string',
		default: '',
		placeholder: '20778',
		description:
			'Sizing IDs from Get Categories (sizes[].size), comma-separated, up to 10. IDs, not labels.',
		routing: { request: { body: { size: '={{ $value || undefined }}' } } },
	},
];
const listSort = sortOption(
	'Result order. Default is the page order (relevance for a search, recommended for a list, recently discounted for sold); every answer reports the sort applied.',
);

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);

export const thredupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['thredup'] } },
		options: [
			{
				name: 'Get Brand Listings',
				value: 'brand',
				action: 'Get thredup brand listings',
				description: `One brand's items in a department (default women): ${ITEM}, plus ${LIST} An unknown brand answers 0 items. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get thredup brands',
				description: `The thredUP brand directory per department: brands matching a term, every brand under one letter (paged), or the letter groups (50 brands each). Each brand's name is the Brand input of the other operations. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/brands', true),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get thredup categories',
				description: `One department's categories and filter values: category tags, sizing IDs, conditions, colours, materials, patterns and price ranges, the inputs of the list operations. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/categories', true),
			},
			{
				name: 'Get Category Listings',
				value: 'category',
				action: 'Get thredup category listings',
				description: `One department's category. Pass a category tag from Get Categories. Answers ${ITEM}, plus ${LIST} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get thredup deals',
				description: `The thredUP deal collections. Clearance, Under $10 (matched on the base price), New Arrivals (newest first) and Price Drops (recently discounted first) answer ${ITEM}, plus ${LIST} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/deals'),
			},
			{
				name: 'Get Item',
				value: 'product',
				action: 'Get a thredup item',
				description: `One item in full by item number or link: price, estimated_retail, percent_off, condition, condition_notes (the flaws thredUP noted), size_detail, measurements, characteristics, materials, pictures, authentication, direct_listing (shipping cost, buyer protection; Direct Listings only) and similar_brands. Sold items still answer. No seller or consignor names or IDs. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/product'),
			},
			{
				name: 'Get Rescue Boxes',
				value: 'rescueBoxes',
				action: 'Get thredup rescue boxes',
				description: `The thredUP Rescue boxes (mystery bundles of items): each box with its bundles (item count, price, currency, state: listed = on sale now, sizes). ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/rescue-boxes', true),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get thredup search suggestions',
				description: `The thredUP search suggestions for a partial query (women, girls or boys): text, query, department, brand, category and free_text. Each suggestion is a ready filter set for Search Items. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/suggestions'),
			},
			{
				name: 'Get Similar Items',
				value: 'similar',
				action: 'Get thredup similar items',
				description: `The first 120 items thredUP shows as similar to one item (no paging): ${ITEM}. An unknown item is a charged 404. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/similar'),
			},
			{
				name: 'Get Sold Listings',
				value: 'sold',
				action: 'Get thredup sold listings',
				description: `Sold listings by filters only (Brand and / or Category; thredUP answers no sold items for free text): ${ITEM}, every one status sold, price being the price the item last listed at; plus ${LIST} thredUP shows no sold date. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/sold'),
			},
			{
				name: 'Get Trending Searches',
				value: 'trending',
				action: 'Get thredup trending searches',
				description: `Trending searches on thredUP for women, girls or boys: text, query, department, brand, category and free_text. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/trending', true),
			},
			{
				name: 'Search Items',
				value: 'search',
				action: 'Search thredup items',
				description: `Search thredUP's US store: ${ITEM}, plus ${LIST} Free text is matched loosely (semantic): use the Brand option for one brand. Not available: product reviews (thredUP shows none), seller shops, sold dates, men's clothing, price history. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/thredup/search'),
			},
		],
		default: 'search',
	},
];

export const thredupFields: INodeProperties[] = [
	// -- Keywords --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'denim jacket',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search text. Semantic: for one brand, use the Brand option.',
	},
	{
		displayName: 'Partial Query',
		name: 'suggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'made',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},

	// -- Department --
	department(['search', 'sold', 'brand', 'deals', 'categories', 'brands']),
	{
		displayName: 'Department',
		name: 'categoryDepartment',
		type: 'options',
		required: true,
		default: 'women',
		options: departmentOptions,
		displayOptions: show(['category']),
		routing: { request: { body: { department: '={{ $value }}' } } },
		description: DEPARTMENT_DESC,
	},
	{
		displayName: 'Department',
		name: 'assortment',
		type: 'options',
		default: 'women',
		options: [
			{ name: 'Boys', value: 'boys' },
			{ name: 'Girls', value: 'girls' },
			{ name: 'Women', value: 'women' },
		],
		displayOptions: show(['suggestions', 'trending']),
		routing: {
			request: { body: { department: '={{ $value === "women" ? undefined : $value }}' } },
		},
	},

	// -- Get Category Listings --
	{
		displayName: 'Category',
		name: 'categoryTag',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dresses',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description: 'A category tag from Get Categories (categories[].category)',
	},

	// -- Get Brand Listings --
	{
		displayName: 'Brand',
		name: 'brandName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Madewell',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'Brand as thredUP writes it (Get Brands, items[].brand)',
	},

	// -- Get Sold Listings: brand and / or category --
	{
		...brandOption,
		name: 'soldBrand',
		placeholder: 'Coach',
		displayOptions: show(['sold']),
		description: 'Brand as thredUP writes it. Set Brand, Category or both.',
	},
	{
		...categoryOption,
		name: 'soldCategory',
		displayOptions: show(['sold']),
		description: 'A category tag from Get Categories. Set Brand, Category or both.',
	},

	// -- Get Deals --
	{
		displayName: 'Collection',
		name: 'collection',
		type: 'options',
		required: true,
		default: 'clearance',
		options: [
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'New Arrivals (Newest First)', value: 'new_arrivals' },
			{ name: 'Price Drops (Recently Discounted First)', value: 'price_drops' },
			{ name: 'Under $10', value: 'under_10' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { collection: '={{ $value }}' } } },
	},

	// -- Get Item, Get Similar Items --
	{
		displayName: 'Item By',
		name: 'itemBy',
		type: 'options',
		default: 'itemNumber',
		options: [
			{ name: 'Item Number', value: 'itemNumber' },
			{ name: 'Item URL', value: 'url' },
		],
		displayOptions: show(['product', 'similar']),
		description: 'How to identify the item',
	},
	{
		displayName: 'Item Number',
		name: 'itemNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '241601590',
		displayOptions: show(['product', 'similar'], { itemBy: ['itemNumber'] }),
		routing: { request: { body: { item_number: '={{ $value }}' } } },
		description:
			'The thredUP item number (items[].item_number; the number at the end of an item link)',
	},
	{
		displayName: 'Item URL',
		name: 'itemUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.thredup.com/product/...',
		displayOptions: show(['product', 'similar'], { itemBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A thredup.com item link',
	},

	// -- Get Brands --
	{
		displayName: 'Brands By',
		name: 'brandsBy',
		type: 'options',
		default: 'groups',
		options: [
			{ name: 'Letter Groups (50 Brands Each)', value: 'groups' },
			{ name: 'Letter (Every Brand Under One Letter)', value: 'letter' },
			{ name: 'Search Term', value: 'query' },
		],
		displayOptions: show(['brands']),
	},
	{
		displayName: 'Search Term',
		name: 'brandsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coach',
		displayOptions: show(['brands'], { brandsBy: ['query'] }),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Brands matching a term',
	},
	{
		displayName: 'Letter',
		name: 'brandsLetter',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'M',
		displayOptions: show(['brands'], { brandsBy: ['letter'] }),
		routing: { request: { body: { letter: '={{ $value }}' } } },
		description: 'One letter, A-Z',
	},
	{
		displayName: 'Additional Options',
		name: 'brandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands'], { brandsBy: ['query', 'letter'] }),
		options: [
			{
				displayName: 'Brands Per Page',
				name: 'brandsPerPage',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'Brands per page, 1 to 500',
				routing: { request: { body: { limit: '={{ $value === 100 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Page of the letter or search answer',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [brandOption, categoryOption, listSort, ...filterOptions].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'soldOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sold']),
		options: [listSort, ...filterOptions].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: [brandOption, listSort, ...filterOptions].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'brandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: [categoryOption, listSort, ...filterOptions].sort(byName),
	},
	{
		displayName: 'Additional Options',
		name: 'dealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			brandOption,
			categoryOption,
			sortOption(
				'Only for Clearance and Under $10 (New Arrivals and Price Drops are sorts themselves)',
			),
			...filterOptions,
		].sort(byName),
	},
];
