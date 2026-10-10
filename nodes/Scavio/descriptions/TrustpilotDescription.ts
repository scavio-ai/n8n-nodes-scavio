import type { INodeProperties } from 'n8n-workflow';

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';
// Comma-separated text -> number array, blanks dropped.
const splitNumbers =
	'={{ String($value).split(",").map(s => s.trim()).filter(Boolean).map(Number) }}';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['trustpilot'], operation, ...extra },
});

function additionalOptions(operation: string[], options: INodeProperties[]): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(operation),
		options,
	};
}

function countryOption(description: string): INodeProperties {
	return {
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: 'US',
		placeholder: 'GB',
		description,
		routing: { request: { body: { country: '={{ String($value).trim().toUpperCase() }}' } } },
	};
}

function pageOption(max: number, description: string): INodeProperties {
	return {
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: max },
		description,
		routing: { request: { body: { page: '={{ $value }}' } } },
	};
}

export const trustpilotOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['trustpilot'] } },
		options: [
			{
				name: 'Get Business Profile',
				value: 'business',
				action: 'Get a trustpilot business profile',
				description:
					'A Trustpilot business profile by domain or Trustpilot URL: TrustScore, rating distribution, review languages, categories, contact details, claimed and verification status, reply rate and days to reply on negative reviews, consumer alerts, the AI review summary and topics (when Trustpilot has them for the chosen language), similar businesses and the 20 newest reviews. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/trustpilot/business' } },
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get trustpilot categories',
				description:
					'The full Trustpilot category tree (22 top-level categories and their subcategories), or the categories matching a name. Every category ID works with Get Category Businesses. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/trustpilot/categories' } },
			},
			{
				name: 'Get Category Businesses',
				value: 'category',
				action: 'Get trustpilot category businesses',
				description:
					'Businesses ranked in a Trustpilot category for one country, 20 per page, with TrustScore, review count, location, website, email and phone. Sort by relevance, review count or latest review, set a minimum TrustScore, or keep claimed profiles only. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/trustpilot/category' } },
			},
			{
				name: 'Get Review',
				value: 'review',
				action: 'Get a trustpilot review',
				description:
					"One Trustpilot review by ID: rating, title, full text, dates, verification, the reviewer's public profile summary, the business reply and the business it is about. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/trustpilot/review' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get trustpilot reviews',
				description:
					'One page of 20 Trustpilot reviews for a business, filtered by stars, language, date range, topics, text search, verified only and with replies, sorted by recency or relevance. Returns the filtered total, so a date range doubles as review velocity. Up to 10 pages (200 reviews) per filter combination; slice by stars, language, date range, topics or text search to reach more. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/trustpilot/reviews' } },
			},
			{
				name: 'Search Businesses',
				value: 'search',
				action: 'Search trustpilot businesses',
				description:
					'Search Trustpilot businesses by keyword in one country, up to 100 per page: name, domain, TrustScore, stars, review count, categories, website and address, plus email and phone when the business published them. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/trustpilot/search' } },
			},
		],
		default: 'search',
	},
];

export const trustpilotFields: INodeProperties[] = [
	// ── Search Businesses ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vpn',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Business name, keyword or category, matched loosely. For a known domain, use Get Business Profile directly.',
	},

	// ── Get Business Profile / Get Reviews: business address ──
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		noDataExpression: true,
		default: 'domain',
		displayOptions: show(['business', 'reviews']),
		options: [
			{ name: 'Domain', value: 'domain' },
			{ name: 'Trustpilot URL', value: 'url' },
		],
		description:
			'Whether to identify the business by its website domain or by its trustpilot.com/review/ page URL',
	},
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nordvpn.com',
		displayOptions: show(['business', 'reviews'], { lookupBy: ['domain'] }),
		routing: { request: { body: { domain: '={{ $value }}' } } },
		description:
			'The website domain the business is listed under on Trustpilot, such as www.amazon.com or nordvpn.com. Search Businesses returns it as domain.',
	},
	{
		displayName: 'Trustpilot URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.trustpilot.com/review/nordvpn.com',
		displayOptions: show(['business', 'reviews'], { lookupBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A trustpilot.com/review/ page URL, from any Trustpilot country site',
	},

	// ── Get Category Businesses ──
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vpn_service',
		displayOptions: show(['category']),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description: 'A category_id from Get Categories, such as vpn_service',
	},

	// ── Get Review ──
	{
		displayName: 'Review ID',
		name: 'review_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6aca2504b52cc4b518bf4b75',
		displayOptions: show(['review']),
		routing: { request: { body: { review_id: '={{ $value }}' } } },
		description: 'The 24-character review_id from a Get Business Profile or Get Reviews response',
	},

	// ── Additional Options ──
	additionalOptions(
		['search'],
		[
			countryOption('2-letter country code to search in. Defaults to US.'),
			pageOption(1000, 'Results page, 1-based'),
			{
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Businesses per page, up to 100. Defaults to 20.',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['business'],
		[
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'en',
				placeholder: 'de',
				description:
					"2-letter language code, default en. The 20 included reviews are this language's newest, and the AI summary and topics come back in it when Trustpilot has them for that language (null or empty otherwise). The rating distribution and review-language breakdown always cover every language.",
				routing: {
					request: { body: { language: '={{ String($value).trim().toLowerCase() }}' } },
				},
			},
		],
	),
	additionalOptions(
		['reviews'],
		[
			{
				displayName: 'Date Range',
				name: 'date_range',
				type: 'options',
				default: 'last30days',
				options: [
					{ name: 'Last 12 Months', value: 'last12months' },
					{ name: 'Last 30 Days', value: 'last30days' },
					{ name: 'Last 3 Months', value: 'last3months' },
					{ name: 'Last 6 Months', value: 'last6months' },
				],
				description: 'Only reviews published in this window. Leave unset for any time.',
				routing: { request: { body: { date_range: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'all',
				placeholder: 'en',
				description: 'Review language as a 2-letter code, or all. Defaults to all.',
				routing: {
					request: { body: { language: '={{ String($value).trim().toLowerCase() }}' } },
				},
			},
			pageOption(
				10,
				'Reviews page, 1-10, 20 reviews per page. Trustpilot serves up to 200 reviews per filter combination; max_page in the response says how far this one goes.',
			),
			{
				displayName: 'Search Text',
				name: 'search',
				type: 'string',
				default: '',
				placeholder: 'refund',
				description: 'Only reviews containing this text',
				routing: { request: { body: { search: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'recency',
				options: [
					{ name: 'Most Recent', value: 'recency' },
					{ name: 'Most Relevant', value: 'relevance' },
				],
				description: 'Review order. Defaults to Most Recent.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'stars',
				type: 'string',
				default: '',
				placeholder: '1, 2',
				description: 'Only reviews with these star ratings, 1-5, separated by commas',
				routing: { send: { type: 'body', property: 'stars', value: splitNumbers } },
			},
			{
				displayName: 'Topics',
				name: 'topics',
				type: 'string',
				default: '',
				placeholder: 'customer_service, delivery_service',
				description:
					"Topic IDs from Get Business Profile's topics, separated by commas, up to 10",
				routing: { send: { type: 'body', property: 'topics', value: splitList } },
			},
			{
				displayName: 'Verified Only',
				name: 'verified_only',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only verified reviews',
				routing: { request: { body: { verified_only: '={{ $value }}' } } },
			},
			{
				displayName: 'With Replies Only',
				name: 'with_replies',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only reviews the business replied to',
				routing: { request: { body: { with_replies: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['categories'],
		[
			countryOption('2-letter country code for the name lookup. Defaults to US.'),
			{
				displayName: 'Find by Name',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'insurance',
				description: 'Categories matching this name. Leave unset for the full category tree.',
				routing: { request: { body: { query: '={{ $value }}' } } },
			},
		],
	),
	additionalOptions(
		['category'],
		[
			{
				displayName: 'Claimed Profiles Only',
				name: 'claimed_only',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only businesses that have claimed their Trustpilot profile',
				routing: { request: { body: { claimed_only: '={{ $value }}' } } },
			},
			countryOption('2-letter country code. Defaults to US.'),
			{
				displayName: 'Min TrustScore',
				name: 'min_trust_score',
				type: 'options',
				default: 4,
				options: [
					{ name: '3.0+', value: 3 },
					{ name: '4.0+', value: 4 },
					{ name: '4.5+', value: 4.5 },
				],
				description:
					'Only businesses rated at least this. Trustpilot applies it to the star rating, which rounds the TrustScore (a 3.8 TrustScore shows 4 stars and passes 4.0+), so filter on trust_score for an exact cut. A floor only: to find low-rated businesses, page the listing and filter yourself.',
				routing: { request: { body: { min_trust_score: '={{ $value }}' } } },
			},
			pageOption(1000, 'Results page, 1-based, 20 businesses per page'),
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_relevant',
				options: [
					{ name: 'Latest Review', value: 'latest_review' },
					{ name: 'Most Relevant', value: 'most_relevant' },
					{ name: 'Most Reviews', value: 'reviews_count' },
				],
				description: 'Business order. Defaults to Most Relevant.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	),
];
