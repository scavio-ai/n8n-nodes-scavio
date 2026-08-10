import type { INodeProperties } from 'n8n-workflow';

export const appStoreOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['appStore'] } },
		options: [
			{
				name: 'Get App',
				value: 'app',
				action: 'Get an app store app',
				description:
					'Full listing: title, description, developer and seller identity, price and currency, all-time and current-version ratings, version and release notes, genres, content rating and advisories, icons at three sizes, screenshots, download size, minimum OS, languages, supported devices and the Game Center and VPP flags. Takes either a numeric App Store ID or a bundle ID, and an ID Apple cannot resolve is a billed 404. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/appstore/app' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get app store reviews',
				description:
					'A page of reviews: star rating, title, full text, author and the app version it was written against. Numeric app IDs only, 50 reviews a page, and Apple hard-stops at page 10 for 500 reviews per storefront, so reach further by asking a different country. This feed cannot 404: an unknown ID and a real app with no reviews both answer with the same empty result. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/appstore/reviews' } },
			},
			{
				name: 'Search Apps',
				value: 'search',
				action: 'Search app store apps',
				description:
					'Up to 200 fully shaped apps, each the same row Get App returns, so a search doubles as a bulk metadata fetch and as a publisher lookup. There is no pagination whatsoever: Limit is the only lever on volume and every offset spelling is silently ignored. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/appstore/search' } },
			},
		],
		default: 'search',
	},
];

export const appStoreFields: INodeProperties[] = [
	// -- Search Apps --
	{
		displayName: 'Search Term',
		name: 'term',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'meditation',
		displayOptions: { show: { resource: ['appStore'], operation: ['search'] } },
		routing: { request: { body: { term: '={{ $value }}' } } },
		description:
			'Matches app name, keyword or publisher name. Searching a publisher returns their catalogue, which is why no separate developer parameter exists.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['appStore'], operation: ['search'] } },
		routing: { request: { body: { limit: '={{ $value }}' } } },
		hint: 'Accepts 1 to 200. App Store search has no pagination, so this is the only lever on how many apps come back.',
		description: 'Max number of results to return',
	},

	// -- Get App --
	{
		displayName: 'App ID',
		name: 'app_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1232780281',
		displayOptions: { show: { resource: ['appStore'], operation: ['app'] } },
		routing: { request: { body: { app_id: '={{ $value }}' } } },
		description:
			'Numeric App Store ID or a bundle ID such as com.burbn.instagram, auto-detected and giving an identical payload either way. A pasted apps.apple.com link is rejected with a free 400.',
	},

	// -- Get Reviews --
	{
		displayName: 'App ID',
		name: 'app_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1232780281',
		displayOptions: { show: { resource: ['appStore'], operation: ['reviews'] } },
		routing: { request: { body: { app_id: '={{ $value }}' } } },
		description:
			'Numeric App Store ID only. The reviews feed has no bundle ID form, unlike Get App.',
	},

	// -- Additional Options: Search Apps --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['appStore'], operation: ['search'] } },
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description:
					'Two-letter storefront code, which decides price, currency, localised title and whether the app is sold there at all. Anything that is not exactly two letters silently falls back to the US storefront, so usa would quietly buy a US result set.',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Entity',
				name: 'entity',
				type: 'options',
				default: 'software',
				options: [
					{ name: 'iPad Software', value: 'ipad_software' },
					{ name: 'Mac Software', value: 'mac_software' },
					{ name: 'Software (iPhone)', value: 'software' },
				],
				description:
					'Store vertical to search. Mac rows come back with no iPad or Apple TV screenshots, no advisories, features, supported devices or Game Center flag, and those fields are empty rather than absent.',
				routing: { request: { body: { entity: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				default: '',
				placeholder: 'en_us',
				description:
					'Five-letter locale such as en_us or fr_fr. It is independent of Country: the storefront sets the price, the language sets the words.',
				routing: { request: { body: { lang: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['appStore'], operation: ['app'] } },
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description:
					'Two-letter storefront code, which decides price, currency, localised title and whether the app is sold there at all. Anything that is not exactly two letters silently falls back to the US storefront.',
				routing: { request: { body: { country: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['appStore'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description:
					'Two-letter storefront code. Each storefront holds its own 500-review ceiling, so a different country is how you reach past page 10.',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 10 },
				description: 'Results page, 50 reviews each. Apple hard-stops at page 10.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_recent',
				options: [
					{ name: 'Most Helpful', value: 'most_helpful' },
					{ name: 'Most Recent', value: 'most_recent' },
				],
				description:
					'Review ordering. Under Most Recent almost every review is too new to have been voted on and the vote fields come back as zeroes, while Most Helpful returns them densely populated.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
