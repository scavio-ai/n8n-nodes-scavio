import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['wholeFoods'], operation } });

const STORE_HELP = '5-digit Whole Foods store ID from Find Stores';

// Diet filter, shared by Search Products, Get Category Products and Get Deals.
const dietOption: INodeProperties = {
	displayName: 'Diet',
	name: 'diet',
	type: 'options',
	default: 'organic',
	options: [
		{ name: 'Dairy-Free', value: 'dairy-free' },
		{ name: 'Gluten-Free', value: 'gluten-free' },
		{ name: 'Organic', value: 'organic' },
		{ name: 'Vegan', value: 'vegan' },
		{ name: 'Vegetarian', value: 'vegetarian' },
	],
	description: 'Only products with this dietary attribute',
	routing: { request: { body: { diet: '={{ $value }}' } } },
};

const offsetOption: INodeProperties = {
	displayName: 'Offset',
	name: 'offset',
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: 10000 },
	description: 'Products to skip, for paging (60 = page 2 at 60 per page)',
	routing: { request: { body: { offset: '={{ $value }}' } } },
};

const perPageOption: INodeProperties = {
	displayName: 'Results Per Page',
	name: 'perPage',
	type: 'number',
	default: 60,
	typeOptions: { minValue: 1, maxValue: 60 },
	description: 'Products per page, 1-60. The API sends 60 when unset.',
	routing: { request: { body: { limit: '={{ $value }}' } } },
};

const onSaleOption: INodeProperties = {
	displayName: 'On Sale Only',
	name: 'on_sale',
	type: 'boolean',
	default: false,
	description: 'Whether to list only products on sale at the store',
	routing: { request: { body: { on_sale: '={{ $value }}' } } },
};

const browseSortOption: INodeProperties = {
	displayName: 'Sort By',
	name: 'sort',
	type: 'options',
	default: 'featured',
	options: [
		{ name: 'Brand: A to Z', value: 'brand_az' },
		{ name: 'Brand: Z to A', value: 'brand_za' },
		{ name: 'Featured', value: 'featured' },
		{ name: 'Popular', value: 'popular' },
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
	],
	description: 'Result order',
	routing: { request: { body: { sort: '={{ $value }}' } } },
};

export const wholeFoodsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['wholeFoods'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find whole foods stores',
				description:
					'Whole Foods Market stores near a US ZIP code, nearest first, within 15 miles widening to 50: store ID, name, address, phone, coordinates, distance in miles, time zone and seven days of in-store and pickup hours (UTC times). No store in range is an empty list. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/stores' } },
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get whole foods category products',
				description:
					"Browse one Whole Foods Market category at one store, with sort and filters: the store's regular, sale and Prime member price, sale dates, ASIN, brand, image, on-sale and local flags, plus the category breadcrumb, total results and facets. An unknown category is a 404. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/category' } },
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get whole foods deals',
				description:
					"Every product on sale at one Whole Foods Market store, store-wide or in one category: the store's regular, sale and Prime member price with the sale start and end dates, in the same shape as Search Products. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/deals' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a whole foods product',
				description:
					"One Whole Foods Market product by ASIN, URL or slug: name, brand, description, highlights, ingredients, nutrition facts, diets, SNAP EBT eligibility and images. With a Store ID, two separate price blocks: in store (the store's shelf regular, sale and Prime price) and online (that store's delivery and pickup price, list price, savings, Prime price, unit price and availability). No ratings, reviews, UPC or unit stock. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/product' } },
			},
			{
				name: 'Get Sales Flyer',
				value: 'salesFlyer',
				action: 'Get a whole foods sales flyer',
				description:
					"The current weekly sales flyer of one Whole Foods Market store: each promotion's product name, brand, headline, description, terms, regular, sale and Prime price as printed (text such as $3.99/lb or 44% off), start and end dates, image, rank and the ASINs it covers. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/sales-flyer' } },
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a whole foods store',
				description:
					'One Whole Foods Market store by ID: name, status, phone, Prime eligibility, opening date, address, coordinates, time zone and its store page and sales flyer URLs. An unknown store ID is a 404. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/store' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search whole foods products',
				description:
					"Search Whole Foods Market products at one store: the store's in-store regular price, sale price and Prime member price with sale start and end dates (a multi-buy such as 2 for $10 is a total), price unit (lb means per pound), ASIN, brand, image, on-sale and local flags, plus total results and category, featured and diet facets. Prices are per store. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/wholefoods/search' } },
			},
		],
		default: 'search',
	},
];

export const wholeFoodsFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'milk',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cheese',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'Category slug, such as dairy-eggs, cheese, produce or fresh-fruit. Slugs are in the category facet of any search; all-products lists the whole store.',
	},

	// -- Get Product --
	{
		displayName: 'ASIN',
		name: 'asin',
		type: 'string',
		default: '',
		placeholder: 'B0BCBNG8LS',
		displayOptions: show(['product']),
		routing: { request: { body: { asin: '={{ $value || undefined }}' } } },
		description: 'Product ASIN (the asin field of a search result). Use this, Product URL or Slug.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.wholefoodsmarket.com/grocery/product/a2-milk-grassfed-whole-milk-59-fz-b0bcbng8ls',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A wholefoodsmarket.com product URL. Use this, ASIN or Slug.',
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		placeholder: 'a2-milk-grassfed-whole-milk-59-fz-b0bcbng8ls',
		displayOptions: show(['product']),
		routing: { request: { body: { slug: '={{ $value || undefined }}' } } },
		description: 'Product slug (the slug field of a search result). Use this, ASIN or Product URL.',
	},

	// -- Store ID: Search Products, Get Category Products, Get Deals, Get Product --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '10145',
		displayOptions: show(['search', 'category', 'deals', 'product']),
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
		description: `${STORE_HELP}. Prices are that store's. Listings default to 10145 (Lamar, Austin TX); Get Product returns prices only when this is set.`,
	},

	// -- Store ID: Get Store + Get Sales Flyer --
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10160',
		displayOptions: show(['store', 'salesFlyer']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: STORE_HELP,
	},

	// -- Find Stores --
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '78703',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},

	// -- Additional Options: Search Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				placeholder: 'milk-cream',
				description: 'Restrict to one category slug, from the category facet of any search',
				routing: { request: { body: { category: '={{ $value || undefined }}' } } },
			},
			dietOption,
			offsetOption,
			onSaleOption,
			perPageOption,
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Result order. Search sorts by relevance or price only.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Category Products --
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: [dietOption, offsetOption, onSaleOption, perPageOption, browseSortOption],
	},

	// -- Additional Options: Get Deals --
	{
		displayName: 'Additional Options',
		name: 'dealOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				default: '',
				placeholder: 'cheese',
				description:
					'Restrict to one category slug. The API reads every sale item in the store (all-products) when unset.',
				routing: { request: { body: { category: '={{ $value || undefined }}' } } },
			},
			dietOption,
			offsetOption,
			perPageOption,
			browseSortOption,
		],
	},
];
