import type { INodeProperties } from 'n8n-workflow';

export const capterraOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['capterra'] } },
		options: [
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search capterra software',
				description:
					'Search Capterra for B2B software and return 20 ranked products with name, vendor description, rating, review count, logo and paid-placement flag, each row carrying the product ID and slug. Capterra fixes the result set at 20 and serves identical rows for page 2, so this operation deliberately has no page option. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/capterra/search' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a capterra product',
				description:
					'Full Capterra profile: rating with per-star histogram and the four scored criteria, likelihood to recommend, the complete pricing table, every rated feature and integration, AI pros and cons with the quoted review, FAQs, badges, competitor comparisons, buyer profile, plus the 25 most recent reviews at no extra cost. Vendor is always null here because Capterra does not publish it as structured data on the product page, the reviews name the vendor instead. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/capterra/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get capterra reviews',
				description:
					'A page of Capterra reviews with the overall score and five per-criterion scores, pros, cons, advice, usage duration, alternatives considered, what they switched from and any vendor response, plus a richer competitor list than the profile carries. Page 1 already rides along inside Get Product, so use this to page past it, 25 reviews per page. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/capterra/reviews' } },
			},
		],
		default: 'search',
	},
];

export const capterraFields: INodeProperties[] = [
	// ── Search lookup (search) ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'query',
		displayOptions: { show: { resource: ['capterra'], operation: ['search'] } },
		options: [
			{ name: 'Query', value: 'query' },
			{ name: 'Search URL', value: 'url' },
		],
		description: 'Whether to search by keyword or by a full capterra.com search URL',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'helpdesk software',
		displayOptions: {
			show: { resource: ['capterra'], operation: ['search'], searchBy: ['query'] },
		},
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Software category or product name to search Capterra for. A term is required because a term-less search serves a fixed popular-products list that has nothing to do with the caller.',
	},
	{
		displayName: 'Search URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.capterra.com/search/?query=helpdesk',
		displayOptions: {
			show: { resource: ['capterra'], operation: ['search'], searchBy: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'Full Capterra search URL carrying the query. The host is checked before the request is made and the international storefronts capterra.co.uk and capterra.com.br are accepted.',
	},

	// ── Product lookup (product) ──
	{
		displayName: 'Look Up By',
		name: 'productLookup',
		type: 'options',
		noDataExpression: true,
		default: 'product_id',
		displayOptions: { show: { resource: ['capterra'], operation: ['product'] } },
		options: [
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'Product URL', value: 'url' },
		],
		description: 'Whether to identify the product by its Capterra ID or by its full profile URL',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '186596',
		displayOptions: {
			show: { resource: ['capterra'], operation: ['product'], productLookup: ['product_id'] },
		},
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'Capterra product ID, the number in a /p/186596/Notion/ profile URL. It must be sent as a string, a JSON number is rejected.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.capterra.com/p/186596/Notion/',
		displayOptions: {
			show: { resource: ['capterra'], operation: ['product'], productLookup: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full Capterra product profile URL',
	},

	// ── Reviews lookup (reviews) ──
	{
		displayName: 'Look Up By',
		name: 'reviewsLookup',
		type: 'options',
		noDataExpression: true,
		default: 'url',
		displayOptions: { show: { resource: ['capterra'], operation: ['reviews'] } },
		options: [
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'Reviews URL', value: 'url' },
		],
		description:
			'Whether to identify the product by its Capterra ID or by its reviews URL. Passing back the reviews_url returned by Get Product is the reliable way to page, because the slug that goes with a product ID is case-sensitive upstream.',
	},
	{
		displayName: 'Reviews URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.capterra.com/p/186596/Notion/reviews/',
		displayOptions: {
			show: { resource: ['capterra'], operation: ['reviews'], reviewsLookup: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'The reviews_url returned by Search Products or Get Product',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '186596',
		displayOptions: {
			show: { resource: ['capterra'], operation: ['reviews'], reviewsLookup: ['product_id'] },
		},
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'Capterra product ID as a string, a JSON number is rejected. Set Vendor Slug alongside it, the slug is load-bearing on this operation.',
	},

	// ── Additional Options: Get Product ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['capterra'], operation: ['product'] } },
		options: [
			{
				displayName: 'Vendor Slug',
				name: 'slug',
				type: 'string',
				default: '',
				placeholder: 'Notion',
				description:
					'Product slug as returned by Search Products. It is cosmetic on this operation, Capterra returns the same profile byte-for-byte whatever slug accompanies the product ID.',
				routing: { request: { body: { slug: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Reviews ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['capterra'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description:
					'Review page to fetch, 25 reviews per page. Page 100 is the hard ceiling whatever the review count says: past it Capterra answers 200 with page one and quietly drops the page from the canonical.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Vendor Slug',
				name: 'slug',
				type: 'string',
				default: '',
				placeholder: 'Notion',
				description:
					'Product slug as returned by Search Products or Get Product. It is load-bearing on this operation, unlike on Get Product: it is case-sensitive upstream and a wrong one silently serves page one under a billed 200.',
				routing: { request: { body: { slug: '={{ $value }}' } } },
			},
		],
	},
];
