import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['ulta'], operation } });

function pageOptions(name: string, operation: string): INodeProperties {
	return {
		displayName: 'Additional Options',
		name,
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show([operation]),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results page, 64 results per page plus sponsored placements',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	};
}

export const ultaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ulta'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get ulta beauty category products',
				description:
					'Products in an Ulta Beauty category (such as /shop/makeup/lips/lipstick), 64 per page plus sponsored placements, with the category title, total results and the same fields as Search Products. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/ulta/category' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an ulta beauty product',
				description:
					'One Ulta Beauty product by page URL, for the selected shade or size: list and sale price, discount, availability, GTIN, rating, review count, badges, description, usage, ingredients, breadcrumbs, images, every shade or size variant, ship, pickup and same-day eligibility, and the five most recent reviews. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/ulta/product' } },
			},
			{
				name: 'Get Store Availability',
				value: 'stores',
				action: 'Get ulta beauty store availability',
				description:
					'Whether one shade or size is in stock or out of stock at the 10 Ulta Beauty stores nearest a US ZIP code: store ID, name, address, distance, open now and hours, curbside, in_stock and the availability label. In stock / out of stock per store, not unit counts. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/ulta/stores' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search ulta beauty products',
				description:
					'Search Ulta Beauty, 64 per page plus sponsored placements: product ID, SKU ID, brand, name, URL, image, list and sale price (with the range when shades differ), discount, promo text, rating, review count, badge, variant label, limited-stock and sponsored flags. Sponsored placements can repeat across pages; dedupe by product_id. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/ulta/search' } },
			},
		],
		default: 'search',
	},
];

export const ultaFields: INodeProperties[] = [
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
		placeholder: 'https://www.ulta.com/shop/makeup/lips/lipstick',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'An ulta.com category that lists products: the full URL, or its path (makeup/lips/lipstick). Landing pages with no product grid, such as /shop/makeup, return 404.',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.ulta.com/p/serum-lipstick-pimprod2057119',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'Ulta product page URL (/p/NAME-PRODUCTID): the URL field of a search or category result. The name part is required.',
	},
	{
		displayName: 'SKU ID',
		name: 'sku',
		type: 'string',
		default: '',
		placeholder: '2648432',
		displayOptions: show(['product']),
		routing: { request: { body: { sku: '={{ $value || undefined }}' } } },
		description:
			"Optional shade or size to select, by SKU ID (a variants[].sku_id). Defaults to the URL's ?sku=, else the product's default.",
	},

	// -- Get Store Availability --
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'pimprod2057119',
		displayOptions: show(['stores']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'Ulta product ID: the product_id field of a search or product result',
	},
	{
		displayName: 'SKU ID',
		name: 'sku_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2648428',
		displayOptions: show(['stores']),
		routing: { request: { body: { sku_id: '={{ $value }}' } } },
		description: 'SKU ID of the shade or size: a sku_id or variants[].sku_id',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10001',
		displayOptions: show(['stores']),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around. The 10 nearest stores are returned.',
	},

	// -- Additional Options --
	pageOptions('additionalOptions', 'search'),
	pageOptions('categoryOptions', 'category'),
];
