import type { INodeProperties } from 'n8n-workflow';

export const g2Operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['g2'] } },
		options: [
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search g2 products',
				description:
					'Search G2, the B2B software review site, and return ranked products with star rating, review count, vendor, categories and logo. Every row carries the product ID and slug that Get Product and Get Reviews take. Costs 5 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/g2/search' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a g2 product',
				description:
					'Full G2 profile for one product: rating with per-star histogram, vendor, pricing editions with parsed amounts, feature groups, integrations, alternatives, head-to-head comparisons and the AI-derived pros and cons. Carries NO review text at all, G2 loads review bodies in a separate frame, so use Get Reviews for those. Costs 5 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/g2/product' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get g2 reviews',
				description:
					'A page of G2 reviews with rating, title, likes and dislikes, problems solved, reviewer job title, industry and company size, plus what the profile page has no form of: exact per-star counts, pros and cons with per-theme counts, and company size, role, industry, region and category facets with counts. Fixed at 10 reviews per page. Costs 5 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/g2/reviews' } },
			},
		],
		default: 'search',
	},
];

const G2_STAR_BUCKETS = [
	{ name: '1 Star', value: 1 },
	{ name: '2 Stars', value: 2 },
	{ name: '3 Stars', value: 3 },
	{ name: '4 Stars', value: 4 },
	{ name: '5 Stars', value: 5 },
];

export const g2Fields: INodeProperties[] = [
	// ── Search lookup (search) ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'query',
		displayOptions: { show: { resource: ['g2'], operation: ['search'] } },
		options: [
			{ name: 'Query', value: 'query' },
			{ name: 'Search URL', value: 'url' },
		],
		description: 'Whether to search by keyword or by a full g2.com search URL',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'project management software',
		displayOptions: {
			show: { resource: ['g2'], operation: ['search'], searchBy: ['query'] },
		},
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Software category or product name to search G2 for',
	},
	{
		displayName: 'Search URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.g2.com/search?query=crm',
		displayOptions: {
			show: { resource: ['g2'], operation: ['search'], searchBy: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full g2.com search URL. The host is checked before the request is made.',
	},

	// ── Shared product lookup (product, reviews) ──
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		noDataExpression: true,
		default: 'product_id',
		displayOptions: { show: { resource: ['g2'], operation: ['product', 'reviews'] } },
		options: [
			{ name: 'Product ID', value: 'product_id' },
			{ name: 'Product URL', value: 'url' },
		],
		description: 'Whether to identify the product by its G2 ID or slug, or by its full g2.com URL',
	},
	{
		displayName: 'Product ID',
		name: 'product_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'notion',
		displayOptions: {
			show: { resource: ['g2'], operation: ['product', 'reviews'], lookupBy: ['product_id'] },
		},
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description:
			'G2 product slug such as notion, or the numeric G2 ID such as 82623 passed as a string. Both resolve on the same upstream path, and Search Products returns both on every row.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.g2.com/products/notion/reviews',
		displayOptions: {
			show: { resource: ['g2'], operation: ['product', 'reviews'], lookupBy: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full g2.com product URL',
	},

	// ── Additional Options: Search Products ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['g2'], operation: ['search'] } },
		options: [
			{
				displayName: 'Minimum Rating',
				name: 'rating',
				type: 'options',
				default: 4,
				options: [
					{ name: '1 Star and Up', value: 1 },
					{ name: '2 Stars and Up', value: 2 },
					{ name: '3 Stars and Up', value: 3 },
					{ name: '4 Stars and Up', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Keep only products at or above this star rating',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Result page to fetch, 20 products per page unless Results per Page says otherwise',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Results per Page',
				name: 'resultsPerPage',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description:
					'Products per page, 1 to 100. Scavio caps it at 100 so one call cannot ask for a multi-megabyte page on a 60 second deadline, G2 itself keeps paginating at any size.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Alphabetical', value: 'alphabetical' },
					{ name: 'Popular', value: 'popular' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Result ordering. Only these four values are accepted on purpose: G2 silently accepts an unknown sort and answers 200 with a full result set in some unstated ordering, so a typo would leave the sort silently unapplied.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['g2'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Company Size',
				name: 'company_size',
				type: 'options',
				default: 'enterprise',
				options: [
					{ name: 'Enterprise', value: 'enterprise' },
					{ name: 'Mid-Market', value: 'mid_market' },
					{ name: 'Small Business', value: 'small_business' },
				],
				description:
					'Keep only reviews written at this company size. Small Business is 50 employees or fewer, Mid-Market is 51 to 1000, Enterprise is over 1000.',
				routing: { request: { body: { company_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Review page to fetch, fixed at 10 reviews per page. It pages well past the 10 pages the G2 review widget itself links to.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'options',
				default: 'north_america',
				options: [
					{ name: 'Africa', value: 'africa' },
					{ name: 'Asia', value: 'asia' },
					{ name: 'Australia and New Zealand', value: 'anz' },
					{ name: 'Europe', value: 'europe' },
					{ name: 'Latin America', value: 'latin_america' },
					{ name: 'Middle East', value: 'middle_east' },
					{ name: 'North America', value: 'north_america' },
				],
				description: 'Keep only reviews from this region',
				routing: { request: { body: { region: '={{ $value }}' } } },
			},
			{
				displayName: 'Reviewer Role',
				name: 'role',
				type: 'options',
				default: 'user',
				options: [
					{ name: 'Administrator', value: 'administrator' },
					{ name: 'Agency', value: 'agency' },
					{ name: 'Consultant', value: 'consultant' },
					{ name: 'Executive Sponsor', value: 'executive_sponsor' },
					{ name: 'Industry Analyst', value: 'industry_analyst' },
					{ name: 'Internal Consultant', value: 'internal_consultant' },
					{ name: 'User', value: 'user' },
				],
				description: 'Keep only reviews written in this role',
				routing: { request: { body: { role: '={{ $value }}' } } },
			},
			{
				displayName: 'Search Within Reviews',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'onboarding',
				description:
					'Full-text search inside the review bodies. It narrows the review list AND every facet count, so the per-star and pros and cons counts come back scoped to the term.',
				routing: { request: { body: { query: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Rating: High to Low', value: 'rating_high' },
					{ name: 'Rating: Low to High', value: 'rating_low' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Review ordering. Only these five values are accepted on purpose, G2 answers an unknown sort with 200 and an unstated ordering rather than an error.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Star Rating',
				name: 'rating',
				type: 'options',
				default: 5,
				options: G2_STAR_BUCKETS,
				description:
					'Keep only reviews in this star bucket. Buckets are half-star-inclusive, so 1 returns 0, 0.5 and 1-star reviews.',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
		],
	},
];
