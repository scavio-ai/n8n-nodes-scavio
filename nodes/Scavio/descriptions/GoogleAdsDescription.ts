import type { INodeProperties } from 'n8n-workflow';

export const googleAdsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['googleAds'] } },
		options: [
			{
				name: 'Find Advertisers',
				value: 'advertisers',
				action: 'Find google ads advertisers',
				description:
					'Start here. Resolves a brand name or domain to the advertiser ID that Search Ads and Get Creative are keyed by, returning advertiser rows with the verified name, verification country and total ad count as a range, plus domain rows. It is an autocomplete and does not paginate, roughly 20 rows per arm. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/googleads/advertisers' } },
			},
			{
				name: 'Search Ads',
				value: 'search',
				action: 'Search google ads',
				description:
					'Every ad Google is running for one advertiser: the archived creative, the rich-media bundle, Google renderer link and dimensions, advertiser ID and name, format, first and last seen dates, days actually run, plus total_ads_min and total_ads_max. Cursor-paginated at up to 100 rows a page through next_cursor. Costs 1 credit per page.',
				routing: { request: { method: 'POST', url: '/api/v1/googleads/search' } },
			},
			{
				name: 'Get Creative',
				value: 'creative',
				action: 'Get a google ads creative',
				description:
					'One creative in full and the only operation carrying its history: every size variation of the asset, the impression bucket, the per-region breakdown with first and last shown dates and a per-surface impression split inside each region, the format, Google category label and the funder disclosure on political ads. Impressions and reach are DSA-compelled and published only inside the EEA, so a US creative returns null for them. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/googleads/creative' } },
			},
		],
		default: 'advertisers',
	},
];

export const googleAdsFields: INodeProperties[] = [
	// ── Query (advertisers) ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nike',
		displayOptions: { show: { resource: ['googleAds'], operation: ['advertisers'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Brand name or domain to resolve. A name query returns both advertiser rows and domain rows, a domain-shaped query returns domain rows only.',
	},

	// ── Search lookup (search) ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'advertiser_id',
		displayOptions: { show: { resource: ['googleAds'], operation: ['search'] } },
		options: [
			{ name: 'Advertiser ID', value: 'advertiser_id' },
			{ name: 'Domain', value: 'domain' },
		],
		description:
			'Whether to pull the ads by advertiser ID or by domain. Querying by domain is the only way to get the domain field back on each row, an advertiser ID query drops it entirely.',
	},
	{
		displayName: 'Advertiser ID',
		name: 'advertiser_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'AR16735076323512287233',
		displayOptions: {
			show: { resource: ['googleAds'], operation: ['search'], searchBy: ['advertiser_id'] },
		},
		routing: { request: { body: { advertiser_id: '={{ $value }}' } } },
		description:
			'Advertiser ID as returned by Find Advertisers. Its shape is checked before any upstream request, so a typo costs no credits.',
	},
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nike.com',
		displayOptions: {
			show: { resource: ['googleAds'], operation: ['search'], searchBy: ['domain'] },
		},
		routing: { request: { body: { domain: '={{ $value }}' } } },
		description:
			'Bare host, www host or full URL, reduced to the registrable host before the request. This is the only way to get the domain field back on each row.',
	},

	// ── Creative pair (creative) ──
	{
		displayName: 'Advertiser ID',
		name: 'advertiser_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'AR16735076323512287233',
		displayOptions: { show: { resource: ['googleAds'], operation: ['creative'] } },
		routing: { request: { body: { advertiser_id: '={{ $value }}' } } },
		description: 'Advertiser ID the creative belongs to, as returned by Find Advertisers',
	},
	{
		displayName: 'Creative ID',
		name: 'creative_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'CR10449491775734710273',
		displayOptions: { show: { resource: ['googleAds'], operation: ['creative'] } },
		routing: { request: { body: { creative_id: '={{ $value }}' } } },
		description:
			'Creative ID as returned by Search Ads. The lookup is keyed by the advertiser ID and creative ID pair, so a mismatched pair is a 404.',
	},

	// ── Additional Options: Find Advertisers ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['googleAds'], operation: ['advertisers'] } },
		options: [
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				default: '',
				placeholder: 'DE',
				description:
					'ISO alpha-2 country code such as US, GB or DE, or a Google geo criteria ID as a string',
				routing: { request: { body: { region: '={{ $value }}' } } },
			},
			{
				displayName: 'Results per Arm',
				name: 'resultsPerArm',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description:
					'Rows per arm, 1 to 20. Advertisers and domains are capped separately, so a name query can return up to twice this many rows.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Search Ads ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['googleAds'], operation: ['search'] } },
		options: [
			{
				displayName: 'Ad Format',
				name: 'format',
				type: 'options',
				default: 'image',
				options: [
					{ name: 'Image', value: 'image' },
					{ name: 'Text', value: 'text' },
					{ name: 'Video', value: 'video' },
				],
				description:
					'Restrict to one creative format, defaulting to all formats when left off. The three sets are disjoint: the same advertiser text, image and video ads share no creatives.',
				routing: { request: { body: { format: '={{ $value }}' } } },
			},
			{
				displayName: 'Ad Platform',
				name: 'platform',
				type: 'options',
				default: 'search',
				options: [
					{ name: 'Google Play', value: 'play' },
					{ name: 'Maps', value: 'maps' },
					{ name: 'Search', value: 'search' },
					{ name: 'Shopping', value: 'shopping' },
					{ name: 'YouTube', value: 'youtube' },
				],
				description: 'Restrict to ads served on one Google surface, defaulting to all surfaces',
				routing: { request: { body: { platform: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description:
					'The next_cursor value from the previous response, 100 rows a page. Re-send the same filters alongside it, and stop when next_cursor comes back null.',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				default: '',
				placeholder: 'DE',
				description:
					'ISO alpha-2 country code such as US, GB or DE, or a Google geo criteria ID as a string, defaulting to worldwide. It scopes the deep links on every row and the same advertiser can share zero creatives between two countries. Impressions, reach and first shown are DSA-compelled and published only inside the EEA, so pick an EEA region if you need them.',
				routing: { request: { body: { region: '={{ $value }}' } } },
			},
			{
				displayName: 'Results per Page',
				name: 'resultsPerPage',
				type: 'number',
				default: 40,
				typeOptions: { minValue: 1, maxValue: 100 },
				description:
					'Rows per page, 1 to 100. 100 is a hard upstream ceiling rather than a Scavio policy: Google answers a larger request with zero rows instead of an error.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Topic',
				name: 'topic',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Political', value: 'political' },
				],
				description: 'Narrow the result set to political ads only',
				routing: { request: { body: { topic: '={{ $value }}' } } },
			},
		],
	},
];
