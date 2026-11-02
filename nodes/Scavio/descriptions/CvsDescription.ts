import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[]) => ({ show: { resource: ['cvs'], operation } });

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';

// CVS has no store locator: the number is on every cvs.com store page.
const STORE_HELP =
	'The store number is shown on every cvs.com store page (Store ID: #7019) and in its URL (.../storeid=7019)';

export const cvsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['cvs'] } },
		options: [
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a cvs product',
				description:
					'One CVS product by URL or ID: regular and sale price, unit price, promotion and its end date, rating, review count, UPC, size, description, highlights, ingredients, directions, warnings, attributes, breadcrumbs, images and every variant (SKU ID, UPC, size, price, rating). Can take 10-30 seconds or more. Costs 1 credit.',
				// Answers can take 10-30+ seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/cvs/product', timeout: 120000 } },
			},
			{
				name: 'Get Store Stock',
				value: 'stock',
				action: 'Get cvs store stock',
				description:
					'Units available at one CVS store for up to 20 SKUs: in store (on the shelf), pickup and ship (online stock, chain-wide); same_day_delivery is always empty (CVS does not report it per store). An unknown SKU or store number reads as 0. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/cvs/stock' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search cvs products',
				description:
					'Search CVS front-store products (no pharmacy): product ID and SKU ID, name, brand, URL, regular and sale price, unit price, promotion text, rating, review count, size, image, ExtraBucks and manufacturer coupons, and units at one store in store and for pickup, plus online ship stock and brand, price and rating facets. Prices are the same at every store. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/cvs/search' } },
			},
		],
		default: 'search',
	},
];

export const cvsFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'toothpaste',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords, or a CVS item number',
	},

	// -- Get Product --
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder:
			'https://www.cvs.com/shop/crest-3d-white-fluoride-anticavity-whitening-toothpaste-radiant-mint-2-4-oz-prodid-789787',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'Product URL on cvs.com (cvs.com/shop/NAME-prodid-ID). Use this or Product ID.',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		default: '',
		placeholder: '789787',
		displayOptions: show(['product']),
		routing: { request: { body: { product_id: '={{ $value || undefined }}' } } },
		description:
			'CVS product ID or SKU ID (the number after prodid- in a product URL, or the product_id or sku_id field of a search result). Use this or Product URL.',
	},

	// -- Get Store Stock --
	{
		displayName: 'SKU IDs',
		name: 'sku_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '789787, 949346',
		displayOptions: show(['stock']),
		routing: { send: { type: 'body', property: 'sku_ids', value: splitList } },
		description:
			"1-20 CVS SKU IDs (a search result's sku_id or a product's variants[].sku_id) separated by commas",
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7019',
		displayOptions: show(['stock']),
		routing: { request: { body: { store_id: '={{ $value }}' } } },
		description: `CVS store number. ${STORE_HELP}.`,
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
				description: 'Results page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Results Per Page',
				name: 'perPage',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 48 },
				description: 'Products per page, 1-48. The API sends 20 when unset.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Store ID',
				name: 'store_id',
				type: 'string',
				default: '',
				placeholder: '7019',
				description: `CVS store number for the stock fields. Defaults to store 7019 (New York, NY 10017). ${STORE_HELP}.`,
				routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
			},
		],
	},
];
