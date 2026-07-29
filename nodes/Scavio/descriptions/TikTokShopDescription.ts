import type { INodeProperties } from 'n8n-workflow';

export const tiktokShopOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tiktokShop'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get tiktok shop categories',
				description:
					'Get the global TikTok Shop category tree: 28 top-level categories, 240 nodes, two levels deep. Category IDs are identical in every region and names are always English.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/categories' } },
			},
			{
				name: 'Get Category Products',
				value: 'categoryProducts',
				action: 'Get tiktok shop category products',
				description:
					'Get products listed under a category ID, with exact prices. Page size is inconsistent upstream (15 to 20), so always paginate with the returned next_cursor. Listings are shallow: has_more turning false after a few pages is the end of the listing, not an error.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/category/products' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a tiktok shop product',
				description:
					'Get full product detail: description, images, variants with stock, shipping, shop profile, category path and top reviews. This endpoint returns NO price, because TikTok masks it on the product page: exact prices come from Search Products, Get Shop Products or Get Category Products. It also resolves only about 44% of the product IDs returned by Search Products, since TikTok has no detail data for the rest. Those IDs answer with HTTP status 404 and a body of {"error": "Product not found in this region.", "credits_used": 1, "credits_remaining": N} - there is no data key at all, so branch on the status code, never on a data field. A 404 here is a normal outcome rather than an error, so skip the item instead of retrying. Get Product Reviews often still answers for an ID that Get Product cannot resolve: measured on 8 such IDs, 8 of 8 returned HTTP 200 and 7 of 8 carried at least one review (a measured sample, not a guarantee).',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/product' } },
			},
			{
				name: 'Get Product Reviews',
				value: 'productReviews',
				action: 'Get tiktok shop product reviews',
				description:
					'Get paginated product reviews with text, images, star histogram and verified-purchase flags, up to 200 per call. The returned total_reviews drifts between calls and must not be used to compute a page count: page with has_more instead. This is also the fallback when Get Product 404s on an ID: measured on 8 such IDs, 8 of 8 returned HTTP 200 here and 7 of 8 carried at least one review (a measured sample, not a guarantee).',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/product/reviews' } },
			},
			{
				name: 'Get Search Suggestions',
				value: 'searchSuggestions',
				action: 'Get tiktok shop search suggestions',
				description:
					'Get keyword autocomplete and expansion for a partial query, across 8 marketplace regions. Suggestions are not guaranteed prefix matches: a misspelling returns typo corrections, and results can include brand and shop names.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/search/suggestions' } },
			},
			{
				name: 'Get Shop Products',
				value: 'shopProducts',
				action: 'Get tiktok shop shop products',
				description:
					"Get a shop's product catalog, 30 per page, with exact prices. Shop follower count, location and shop-level rating are not available here: use Get Product for the full shop profile.",
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/shop/products' } },
			},
			{
				name: 'Resolve URL',
				value: 'resolve',
				action: 'Resolve a tiktok shop URL',
				description:
					'Resolve any TikTok Shop URL or share link to a product ID or shop ID, ready to pass to the other operations. Accepts canonical product and store pages, tiktok.com/view links, affiliate share links and vt.tiktok.com short links.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/resolve' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search tiktok shop products',
				description:
					'Search TikTok Shop products by keyword (US catalog), up to 30 products per page with exact prices, ratings and shop details. Paginate with the returned next_cursor and dedupe by product_id across pages.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok-shop/search' } },
			},
		],
		default: 'search',
	},
];

export const tiktokShopFields: INodeProperties[] = [
	// ── Shared search keyword (search, searchSuggestions) ──
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'phone case',
		displayOptions: {
			show: { resource: ['tiktokShop'], operation: ['search', 'searchSuggestions'] },
		},
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'Keyword to search TikTok Shop for',
	},

	// ── Shared product_id (product, productReviews) ──
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1732293553906094315',
		displayOptions: {
			show: { resource: ['tiktokShop'], operation: ['product', 'productReviews'] },
		},
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'Numeric TikTok Shop product ID. IDs from Search Products are not guaranteed to resolve on Get Product: only about 44% do, and a 404 for the rest is normal.',
	},

	// ── category_id (categoryProducts) ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '601450',
		displayOptions: { show: { resource: ['tiktokShop'], operation: ['categoryProducts'] } },
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'Category ID from Get Categories; level 1 or level 2 both work',
	},

	// ── shop_id (shopProducts) ──
	{
		displayName: 'Shop ID',
		name: 'shop_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7495514739648989419',
		displayOptions: { show: { resource: ['tiktokShop'], operation: ['shopProducts'] } },
		routing: { request: { body: { shop_id: '={{ $value }}' } } },
		description: 'A TikTok Shop seller ID (also called seller_id elsewhere on TikTok)',
	},

	// ── url (resolve) ──
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://vt.tiktok.com/ZT2AHoGsE/',
		displayOptions: { show: { resource: ['tiktokShop'], operation: ['resolve'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'TikTok Shop product page, store page or share link to resolve',
	},

	// ── Region: 8-region operations (searchSuggestions, product, productReviews, shopProducts) ──
	{
		displayName: 'Region',
		name: 'region',
		type: 'options',
		default: 'US',
		displayOptions: {
			show: {
				resource: ['tiktokShop'],
				operation: ['searchSuggestions', 'product', 'productReviews', 'shopProducts'],
			},
		},
		options: [
			{ name: 'Indonesia', value: 'ID' },
			{ name: 'Malaysia', value: 'MY' },
			{ name: 'Philippines', value: 'PH' },
			{ name: 'Singapore', value: 'SG' },
			{ name: 'Thailand', value: 'TH' },
			{ name: 'United Kingdom', value: 'GB' },
			{ name: 'United States', value: 'US' },
			{ name: 'Vietnam', value: 'VN' },
		],
		routing: { request: { body: { region: '={{ $value }}' } } },
		description: 'Marketplace region to query',
	},

	// ── Region: category listings are US and GB only (categoryProducts) ──
	{
		displayName: 'Region',
		name: 'region',
		type: 'options',
		default: 'US',
		displayOptions: { show: { resource: ['tiktokShop'], operation: ['categoryProducts'] } },
		options: [
			{ name: 'United Kingdom', value: 'GB' },
			{ name: 'United States', value: 'US' },
		],
		routing: { request: { body: { region: '={{ $value }}' } } },
		description:
			'Marketplace region. Category listings are served for US and GB only, and GB coverage is intermittent upstream.',
	},

	// ── Additional Options: cursor-only (search, categoryProducts, shopProducts) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['tiktokShop'],
				operation: ['search', 'categoryProducts', 'shopProducts'],
			},
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: "Opaque cursor from a previous response's next_cursor",
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Product Reviews ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktokShop'], operation: ['productReviews'] } },
		options: [
			{
				displayName: 'Has Media',
				name: 'has_media',
				type: 'boolean',
				default: false,
				description:
					'Whether to return only reviews carrying a photo or video. Has Media and Verified Only share one upstream filter slot: if both are set, Has Media wins and the response reports which filters were really applied.',
				routing: { request: { body: { has_media: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: '1-based page number',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Number of reviews to return per page',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'rating',
				type: 'number',
				default: 5,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: 'Only return reviews with this star rating',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevant',
				options: [
					{ name: 'Recent', value: 'recent' },
					{ name: 'Relevant', value: 'relevant' },
				],
				description:
					'Relevant returns text-complete, image-heavy reviews; recent is fresher but far more text-sparse',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Verified Only',
				name: 'verified_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews from verified purchases',
				routing: { request: { body: { verified_only: '={{ $value }}' } } },
			},
		],
	},
];
