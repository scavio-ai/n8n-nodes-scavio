import type { INodeProperties } from 'n8n-workflow';

export const googlePlayOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['googlePlay'] } },
		options: [
			{
				name: 'Get App',
				value: 'app',
				action: 'Get a google play app',
				description:
					'Full store listing: installs including the real count Play publishes but never renders, rating and star histogram, description, developer identity and legal contact, price and in-app purchases, categories and gameplay tags, screenshots and trailer, version and Android requirement, release and update dates, changelog, the full permission tree, the Data safety table, the 20 server-rendered reviews and the similar-apps and more-by-developer rails. Use Get Reviews to page past those 20 or to sort them differently. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/googleplay/app' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get google play reviews',
				description:
					'A page of reviews: star score, full text, author, thumbs-up count, developer reply and the app version the reviewer was running. Paged through next_cursor rather than a page number. An empty payload here is a billed 404, the premium price paid to learn the package has no reviews or does not exist. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/googleplay/reviews' } },
			},
			{
				name: 'Search Apps',
				value: 'search',
				action: 'Search google play apps',
				description:
					'Ranked apps: package name, title, developer, rating, install count, price and in-app purchase range, content rating, icon and screenshots. A branded query returns the hero card as result 1 projected into the same row shape, plus the related-query rail. There is no pagination: one shelf of about 30 apps, with no page and no cursor. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/googleplay/search' } },
			},
		],
		default: 'search',
	},
];

export const googlePlayFields: INodeProperties[] = [
	// -- Search Apps --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'meditation',
		displayOptions: { show: { resource: ['googlePlay'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Google Play search query. Games are folded into this apps vertical.',
	},

	// -- Shared identifier (app, reviews) --
	{
		displayName: 'App ID',
		name: 'app_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'com.spotify.music',
		displayOptions: { show: { resource: ['googlePlay'], operation: ['app', 'reviews'] } },
		routing: { request: { body: { app_id: '={{ $value }}' } } },
		description:
			'Android package name, or any play.google.com link carrying one in its ID parameter. Search Apps returns the package name on every row.',
	},

	// -- Additional Options: Search Apps --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['googlePlay'], operation: ['search'] } },
		options: [
			{
				displayName: 'Country',
				name: 'gl',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description: 'Two-letter country code for the storefront the results are ranked for',
				routing: { request: { body: { gl: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'hl',
				type: 'string',
				default: 'en',
				placeholder: 'pt-BR',
				description:
					'Interface language, which moves the whole storefront and not only the strings: at pt-BR the title, description, install formatting and content rating all change with it. Play silently falls back to English and the US for a value it does not serve.',
				routing: { request: { body: { hl: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get App --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['googlePlay'], operation: ['app'] } },
		options: [
			{
				displayName: 'Country',
				name: 'gl',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description: 'Two-letter country code for the storefront the listing is read from',
				routing: { request: { body: { gl: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'hl',
				type: 'string',
				default: 'en',
				placeholder: 'pt-BR',
				description:
					'Interface language, which moves the whole storefront and not only the strings: at pt-BR the title, description, install formatting and content rating all change with it. Play silently falls back to English and the US for a value it does not serve.',
				routing: { request: { body: { hl: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['googlePlay'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 200 },
				description:
					'Reviews to return in one page, capped at 200. Play honours more, but a single page that large is megabytes for one call.',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Country',
				name: 'gl',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description: 'Two-letter country code for the storefront the reviews are read from',
				routing: { request: { body: { gl: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description:
					'The next_cursor from the previous response. It is opaque and single-use and encodes the sort as well as the position, so send it back with the same Sort it came from, and note that a cursor past the last review answers 404 rather than an empty page.',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'hl',
				type: 'string',
				default: 'en',
				placeholder: 'pt-BR',
				description:
					'Interface language, which moves the whole storefront and not only the strings. Play silently falls back to English and the US for a value it does not serve.',
				routing: { request: { body: { hl: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Review ordering. A cursor carries the sort it was issued under, so changing this mid-run invalidates the paging.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
