import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['menards'], operation, ...extra },
});

export const menardsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['menards'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find menards stores',
				description:
					"Menards stores near a US ZIP code or a city and state, nearest first: store number, name, address, coordinates, distance in miles and services (garden center, grocery, rental center, propane and more). Use a store number with Get Product for that store's stock and aisle. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/menards/stores' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a menards product',
				description:
					"One Menards product by item ID or URL (Menards has no search): name, brand, model number, SKU, description, bullets, specifications, images, videos and documents, with the full price ladder: everyday price, sale price and end date, mail-in rebates such as the 11% rebate (text, amount, dates), final price after rebates and the you-save amount, plus pickup, delivery and ship-to-store flags. Set a Store ID for that store's stock quantity, stock message and aisle. Costs 1 credit, 2 with a Store ID.",
				// A store-specific answer can take 10-40 seconds, so the route carries a 120s timeout.
				routing: { request: { method: 'POST', url: '/api/v1/menards/product', timeout: 120000 } },
			},
		],
		default: 'product',
	},
];

export const menardsFields: INodeProperties[] = [
	// -- Get Product --
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		default: '',
		placeholder: '60893666613',
		displayOptions: show(['product']),
		routing: { request: { body: { item_id: '={{ $value || undefined }}' } } },
		description:
			'Menards item ID: the number after p- in a menards.com product URL. Not the SKU or model number. Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.menards.com/main/p-60893666613.htm',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description: 'A menards.com product URL. Use this or Item ID.',
	},
	{
		displayName: 'Store ID',
		name: 'store_id',
		type: 'string',
		default: '',
		placeholder: '3181',
		displayOptions: show(['product']),
		routing: { request: { body: { store_id: '={{ $value || undefined }}' } } },
		description:
			"Menards store number from Find Stores. Adds that store's stock quantity, stock message, aisle and whether it is sold there, priced for that store. Costs 2 credits instead of 1 and typically takes 10-40 seconds. Leave empty for default-store prices and no stock.",
	},

	// -- Find Stores --
	{
		displayName: 'Locate By',
		name: 'locateBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['stores']),
		description: 'Find stores near a ZIP code or a city and state',
	},
	{
		displayName: 'ZIP Code',
		name: 'zip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '55401',
		displayOptions: show(['stores'], { locateBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ $value }}' } } },
		description: 'US ZIP code to search around',
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Madison',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { city: '={{ $value }}' } } },
		description: 'City to search around',
	},
	{
		displayName: 'State',
		name: 'state',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'WI',
		displayOptions: show(['stores'], { locateBy: ['city'] }),
		routing: { request: { body: { state: '={{ $value }}' } } },
		description: '2-letter US state code',
	},
];
