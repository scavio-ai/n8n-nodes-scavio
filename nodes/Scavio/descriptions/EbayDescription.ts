import type { INodeProperties } from 'n8n-workflow';

export const ebayOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ebay'] } },
		options: [
			{
				name: 'Get Listing',
				value: 'product',
				action: 'Get an ebay listing',
				description:
					'Get one eBay listing in full: price, condition, images, item specifics, shipping, returns, auction state, seller. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/ebay/product' } },
			},
			{
				name: 'Get Seller Profile',
				value: 'seller',
				action: 'Get an ebay seller profile',
				description:
					"Get a seller profile card: store name, feedback score and percentage, items sold, followers, location, categories. This is a profile lookup only and cannot enumerate a catalogue, so page a seller's inventory with Search Listings instead. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/ebay/seller' } },
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search ebay listings',
				description:
					'Search live or completed eBay listings: price, condition, bids, shipping, seller, feedback. Turn on Sold Listings for completed listings that actually sold; eBay publishes no headline count on that view, so total_results comes back null. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/ebay/search' } },
			},
		],
		default: 'search',
	},
];

export const ebayFields: INodeProperties[] = [
	// ── Search Listings: query and/or seller (eBay requires at least one) ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'keyword',
		displayOptions: { show: { resource: ['ebay'], operation: ['search'] } },
		options: [
			{ name: 'Keyword', value: 'keyword' },
			{ name: 'Keyword and Seller', value: 'keywordAndSeller' },
			{ name: 'Seller', value: 'seller' },
		],
		description:
			"Whether to search by keyword, by seller, or by both. eBay requires at least one of the two, and Seller on its own pages that seller's whole catalogue.",
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nintendo switch oled',
		displayOptions: {
			show: {
				resource: ['ebay'],
				operation: ['search'],
				searchBy: ['keyword', 'keywordAndSeller'],
			},
		},
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Keyword to search eBay listings for',
	},
	{
		displayName: 'Seller',
		name: 'seller',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'musicmagpie',
		displayOptions: {
			show: {
				resource: ['ebay'],
				operation: ['search'],
				searchBy: ['keywordAndSeller', 'seller'],
			},
		},
		routing: { request: { body: { seller: '={{ $value }}' } } },
		description:
			"Username to scope the search to a single eBay seller. With no keyword this pages that seller's entire catalogue, which the Get Seller Profile operation cannot do.",
	},

	// ── Get Listing ──
	{
		displayName: 'Item ID',
		name: 'item_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '166123456789',
		displayOptions: { show: { resource: ['ebay'], operation: ['product'] } },
		routing: { request: { body: { item_id: '={{ $value }}' } } },
		description:
			'Item number from the listing, or a full eBay listing URL; tracking parameters are discarded',
	},

	// ── Get Seller Profile ──
	{
		displayName: 'Seller Username',
		name: 'seller',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'musicmagpie',
		displayOptions: { show: { resource: ['ebay'], operation: ['seller'] } },
		routing: { request: { body: { seller: '={{ $value }}' } } },
		description: 'Username exactly as it appears in an eBay /usr/ profile URL',
	},

	// ── Additional Options: Search Listings ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['ebay'], operation: ['search'] } },
		options: [
			{
				displayName: 'Buying Format',
				name: 'buying_format',
				type: 'options',
				default: 'buy_it_now',
				description: 'Restrict to one selling format',
				options: [
					{ name: 'Auction', value: 'auction' },
					{ name: 'Best Offer', value: 'best_offer' },
					{ name: 'Buy It Now', value: 'buy_it_now' },
				],
				routing: { request: { body: { buying_format: '={{ $value }}' } } },
			},
			{
				displayName: 'Category ID',
				name: 'category_id',
				type: 'string',
				default: '',
				placeholder: '139971',
				description:
					'Numeric eBay category ID, the value eBay carries as _sacat. An unrecognised category returns the unfiltered set under a 200 rather than an error.',
				routing: { request: { body: { category_id: '={{ $value }}' } } },
			},
			{
				displayName: 'Condition',
				name: 'condition',
				type: 'options',
				default: 'new',
				description: 'Restrict to one item condition',
				options: [
					{ name: 'For Parts', value: 'for_parts' },
					{ name: 'New', value: 'new' },
					{ name: 'Open Box', value: 'open_box' },
					{
						name: 'Refurbished',
						value: 'refurbished',
						description: 'The eBay parent condition, not one of its three graded tiers',
					},
					{ name: 'Used', value: 'used' },
				],
				routing: { request: { body: { condition: '={{ $value }}' } } },
			},
			{
				displayName: 'Free Shipping',
				name: 'free_shipping',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only listings that ship for free',
				routing: { request: { body: { free_shipping: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				description: 'Maximum listing price in USD',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				description: 'Minimum listing price in USD',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to read',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Results Per Page',
				name: 'per_page',
				type: 'options',
				default: 60,
				description:
					'Listings per page. eBay accepts only 60, 120 or 240 and silently falls back to 60 for anything else.',
				options: [
					{ name: '60', value: 60 },
					{ name: '120', value: 120 },
					{ name: '240', value: 240 },
				],
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sold Listings',
				name: 'sold',
				type: 'boolean',
				default: false,
				description:
					'Whether to search completed listings that actually sold instead of live ones. This is the price-research view; eBay publishes no headline count on it, so total_results comes back null.',
				routing: { request: { body: { sold: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'best_match',
				description:
					'Result sort order. Distance sorts are deliberately absent because they rank against our proxy exit rather than your location.',
				options: [
					{ name: 'Best Match', value: 'best_match' },
					{ name: 'Ending Soonest', value: 'ending_soonest' },
					{ name: 'Newly Listed', value: 'newly_listed' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
		],
	},
];
