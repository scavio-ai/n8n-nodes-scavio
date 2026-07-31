import type { INodeProperties } from 'n8n-workflow';

// Amazon moved to a new upstream provider and the API now returns a normalized
// shape instead of a raw provider passthrough. Params that disappeared with it:
//
// - sort_by: the marketplace accepts every sort value and ignores all of them.
//   Verified across price-asc-rank, price-desc-rank, review-rank and
//   date-desc-rank: identical, unordered result sets. Exposing it would be a
//   filter that silently does nothing.
// - start_page: replaced by Page (the API still accepts start_page as a
//   deprecated alias, but new workflows should not learn it).
// - min_price / max_price: these were never in the API request schema, so the
//   backend silently dropped them. They only ever looked like they worked.
// - domain: replaced by Country, which is what upstream actually wants (an ISO
//   3166-1 alpha-2 marketplace code, not an amazon.<suffix> string).

export const amazonOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['amazon'] } },
		options: [
			{
				name: 'Get Offers',
				value: 'offers',
				action: 'Get amazon offers',
				description:
					'Get every seller offer for an ASIN: price, seller name and ID, condition, shipping, discount and which offer holds the buy box. Page 1 only: the response reports has_more_pages, but there is no verified upstream param to request a later page.',
				routing: { request: { method: 'POST', url: '/api/v1/amazon/offers' } },
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an amazon product',
				description:
					'Get full detail for an ASIN: title, brand, price, list price, rating, review count, availability, images, videos, specifications, variants, best sellers rank and structured shipping',
				routing: { request: { method: 'POST', url: '/api/v1/amazon/product' } },
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search amazon products',
				description:
					"Search Amazon by keyword and return product listings with ASIN, price, rating, review count, delivery and sponsored flag. Results always come back in the marketplace's default ranking: there is no sort param because every sort value the marketplace accepts returns the same unordered set.",
				routing: { request: { method: 'POST', url: '/api/v1/amazon/search' } },
			},
		],
		default: 'search',
	},
];

export const amazonFields: INodeProperties[] = [
	// ── Keyword (search) ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'wireless noise cancelling headphones',
		displayOptions: { show: { resource: ['amazon'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Product search query',
	},

	// ── ASIN (product, offers) ──
	// Sent on the wire as `query`, not `asin`. The API accepts both, but `query`
	// is the field every published Scavio client uses and keeps saved workflows
	// working across this upgrade.
	{
		displayName: 'ASIN',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'B09V3KXJPB',
		displayOptions: { show: { resource: ['amazon'], operation: ['product', 'offers'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'The 10-character Amazon product ID, e.g. B09V3KXJPB. Found in /dp/ASIN URLs.',
	},

	// ── Country (all operations) ──
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		displayOptions: { show: { resource: ['amazon'] } },
		options: [
			{ name: 'Australia', value: 'au' },
			{ name: 'Belgium', value: 'be' },
			{ name: 'Brazil', value: 'br' },
			{ name: 'Canada', value: 'ca' },
			{ name: 'China', value: 'cn' },
			{ name: 'Egypt', value: 'eg' },
			{ name: 'France', value: 'fr' },
			{ name: 'Germany', value: 'de' },
			{ name: 'India', value: 'in' },
			{ name: 'Italy', value: 'it' },
			{ name: 'Japan', value: 'jp' },
			{ name: 'Mexico', value: 'mx' },
			{ name: 'Netherlands', value: 'nl' },
			{ name: 'Poland', value: 'pl' },
			{ name: 'Saudi Arabia', value: 'sa' },
			{ name: 'Singapore', value: 'sg' },
			{ name: 'Spain', value: 'es' },
			{ name: 'Sweden', value: 'se' },
			{ name: 'Turkey', value: 'tr' },
			{ name: 'United Arab Emirates', value: 'ae' },
			{ name: 'United Kingdom', value: 'gb' },
			{ name: 'United States', value: 'us' },
		],
		routing: { request: { body: { country: '={{ $value }}' } } },
		description:
			'Amazon marketplace to query, as an ISO 3166-1 alpha-2 code. Two do not match their domain suffix: amazon.com is United States (us) and amazon.co.uk is United Kingdom (gb).',
	},

	// ── Additional Options (search) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['amazon'], operation: ['search'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Results page, 1-based. One page per call, and each call costs 1 credit.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
