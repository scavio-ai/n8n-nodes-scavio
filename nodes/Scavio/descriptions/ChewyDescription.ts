import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['chewy'], operation } });

export const chewyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chewy'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a chewy product',
				description:
					'One Chewy product by ID or URL: one-time price, offer price, list and strike-through price with savings, MAP price and whether it is enforced, Autoship price and discount, first-Autoship price, discount and savings cap, per-unit price, in-stock flag, rating, rating count, review count and star distribution, brand, GTIN, description, key benefits, specifications, ingredients, breadcrumbs, images, promotions and every size and flavor with its own ID, price, Autoship price and stock. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/chewy/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search chewy products',
				description:
					'Search Chewy by keyword or browse a category, 36 per page: one-time, offer and strike-through price, Autoship price and discount, per-unit price, rating, rating count, in-stock flag, deal, new, exclusive and prescription flags, brand, image and URL. The first-Autoship price, discount and savings cap are filled only on Autoship-deal rows; Get Product always has them and MAP. Sponsored listings are removed. When Chewy sends a keyword to a category page, redirect names that category and the results are its products. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/chewy/search' } },
			},
		],
		default: 'search',
	},
];

export const chewyFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		placeholder: 'kong classic dog toy',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value || undefined }}' } } },
		description:
			'Search keywords. Use this or Category ID. Some broad keywords (dog food) go straight to a category; redirect then names it.',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		default: '',
		placeholder: '332',
		displayOptions: show(['search']),
		routing: { request: { body: { category_id: '={{ $value || undefined }}' } } },
		description:
			'Category to browse instead of a search: the number at the end of a chewy.com /b/ URL (332 = Dog Food), or that URL. Use this or Keyword.',
	},

	// -- Get Product --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '128666',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			'Chewy product ID: the number after /dp/ in a product URL, or the product_id field of a search result. Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.chewy.com/purina-pro-plan-adult-sensitive-skin/dp/128666',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A chewy.com product URL. Use this or Product ID.',
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 36 products per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Best Selling', value: 'bestselling' },
					{ name: 'Most Reviewed', value: 'most_reviewed' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Result order. The sort field of the answer echoes the order actually applied.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
