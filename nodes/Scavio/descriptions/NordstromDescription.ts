import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({
	show: { resource: ['nordstrom'], operation },
});

export const nordstromOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nordstrom'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a nordstrom product',
				description:
					'One nordstrom.com (US) product by URL or style ID: name, brand, description, feature bullets, fit notes, final-sale flag, current, original and clearance price ranges, percent off, rating, review count, the star histogram, the size-fit distribution (too small to too big), the AI review summary when the site shows one, the most mentioned praised and criticized features with a quote each, breadcrumbs and images. Every color lists its images and every size as a SKU with SKU ID, size, size type, UPC, price, original price, percent off, price type (regular, clearance, promotion), in stock and the quantity available to ship. Includes the 12-13 reviews shown on the product page. Costs 5 credits.',
				// The upstream page can take ~15 s and is retried once, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/nordstrom/product', timeout: 120000 } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search nordstrom products',
				description:
					"Search nordstrom.com (US) products, 24 per page, sorted by relevance, rating, price, newest or percent off. Each result has style ID, URL, name, brand, image, current price and price range in dollars, original price range, percent off and on-sale flag, rating, review count, badges such as new or new_markdown, a low-inventory flag, whether it is sold by a marketplace seller (and the seller's name), and every color with its color family and image. Also returns the total result count and page count. Use a result's URL or style ID with Get Product. Costs 5 credits.",
				// The upstream page can take ~15 s and is retried once, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/nordstrom/search', timeout: 120000 } },
			},
		],
		default: 'search',
	},
];

export const nordstromFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dress',
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
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 1-based. Defaults to 1. 24 products per page.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Percent Off', value: 'percent_off' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Relevance (default), rating, price_high, price_low, newest or percent_off',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.nordstrom.com/s/betsy-and-adam-strapless-mixed-media-gown/8098974',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'Product URL on nordstrom.com (the URL of a search result). Use this or Style ID.',
	},
	{
		displayName: 'Style ID',
		name: 'style_id',
		type: 'string',
		default: '',
		placeholder: '8098974',
		displayOptions: show(['product']),
		routing: { request: { body: { style_id: '={{ $value || undefined }}' } } },
		description:
			'Nordstrom style ID, the number at the end of a product URL (the style_id of a search result). Used when Product URL is not given.',
	},
];
