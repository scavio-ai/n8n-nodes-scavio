import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['sephora'], operation } });

const pageOption = (description: string): INodeProperties => ({
	displayName: 'Page',
	name: 'page',
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 100 },
	description,
	routing: { request: { body: { page: '={{ $value }}' } } },
});

export const sephoraOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['sephora'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get sephora category products',
				description:
					"Products in a sephora.com (US) category, 60 per page, with the same fields as Search Products plus the category's ID, name and URL, total product count, parent category, subcategories with product counts and breadcrumbs. An unknown category is a 404. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/sephora/category' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a sephora product',
				description:
					'One sephora.com (US) product: name, brand, rating, review count, loves count, price range, description, suggested usage, breadcrumbs, a summary of what reviews say with pro and con sentiment counts (no review text), and every shade or size as a SKU with price, list and sale price, stock, ingredients, images and pickup and same-day eligibility. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/sephora/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search sephora products',
				description:
					'Search sephora.com (US), 60 per page: product ID, SKU ID, brand, name, URL, image, price, list price and sale price, value price for sets, rating, review count, extra colors, and bestseller, new, Sephora-exclusive, online-only, limited-edition and sponsored flags, plus category facets and related searches. Use a result\'s URL with Get Product. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/sephora/search' } },
			},
		],
		default: 'search',
	},
];

export const sephoraFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lipstick',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search keyword',
	},

	// -- Get Category Products --
	{
		displayName: 'Category',
		name: 'category',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'lipstick',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'Category name as it appears in a sephora.com/shop/ URL (lipstick, face-serum, makeup-cosmetics), or the full sephora.com/shop/ URL',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.sephora.com/product/mac-cosmetics-m-a-cximal-silky-matte-lipstick-P510799',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'Product URL on sephora.com: the URL field of a search or category result. Faster than Product ID. Use this or Product ID.',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: 'P510799',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			'Sephora product ID (P followed by digits): the product_id field of a search or category result. Use this or Product URL.',
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
			pageOption('Results page, 60 results per page'),
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling', value: 'best_selling' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Result order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'ZIP Code',
				name: 'zip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description:
					'US ZIP code. When set, each product carries same_day_eligible for same-day delivery to that ZIP.',
				routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
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
		options: [pageOption('Results page, 60 results per page')],
	},
];
