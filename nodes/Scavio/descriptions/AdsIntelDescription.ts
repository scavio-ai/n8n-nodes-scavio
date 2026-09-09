import type { INodeProperties } from 'n8n-workflow';

export const adsIntelOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['adsIntel'] } },
		options: [
			{
				name: 'Brand Dossier',
				value: 'dossier',
				action: 'Get a brand ad dossier',
				description:
					'Get all ads run BY a specific brand across Meta, TikTok, LinkedIn and Google in one call',
				routing: { request: { method: 'POST', url: '/api/v1/ads/dossier' } },
			},
			{
				name: 'Resolve Advertisers',
				value: 'resolveAdvertisers',
				action: 'Resolve a brand to advertiser ids',
				description:
					'Resolve a brand name to its advertiser IDs on each platform. Returns IDs only, no ads.',
				routing: { request: { method: 'POST', url: '/api/v1/ads/advertisers' } },
			},
			{
				name: 'Search Ads',
				value: 'searchAds',
				action: 'Search ads across platforms',
				description:
					'Keyword search across Meta, TikTok, LinkedIn and Google ad libraries in one call',
				routing: { request: { method: 'POST', url: '/api/v1/ads/search' } },
			},
		],
		default: 'searchAds',
	},
];

export const adsIntelFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nike',
		displayOptions: { show: { resource: ['adsIntel'], operation: ['searchAds'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Keyword or brand to search across the ad libraries',
	},
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Nike',
		displayOptions: {
			show: { resource: ['adsIntel'], operation: ['dossier', 'resolveAdvertisers'] },
		},
		routing: { request: { body: { brand: '={{ $value }}' } } },
		description: 'Brand name to profile or resolve across ad libraries',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['adsIntel'],
				operation: ['searchAds', 'dossier', 'resolveAdvertisers'],
			},
		},
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'US',
				placeholder: 'US',
				description:
					'ISO-2 country code. Used as Meta locale, LinkedIn country filter, and Google region.',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Platforms',
				name: 'platforms',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Google', value: 'google' },
					{ name: 'LinkedIn', value: 'linkedin' },
					{ name: 'Meta', value: 'meta' },
					{ name: 'TikTok', value: 'tiktok' },
				],
				description: 'Which ad libraries to query. Defaults to all four if none selected.',
				routing: { request: { body: { platforms: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Pinned Advertiser IDs',
		name: 'pinnedIds',
		type: 'collection',
		placeholder: 'Add Pinned ID',
		default: {},
		displayOptions: { show: { resource: ['adsIntel'], operation: ['dossier'] } },
		options: [
			{
				displayName: 'Google Advertiser ID',
				name: 'google_advertiser_id',
				type: 'string',
				default: '',
				description:
					'Pin Google to this advertiser ID, skipping name resolution. Get it from Resolve Advertisers.',
				routing: { request: { body: { google_advertiser_id: '={{ $value }}' } } },
			},
			{
				displayName: 'LinkedIn Company ID',
				name: 'linkedin_company_id',
				type: 'string',
				default: '',
				description: 'Pin LinkedIn to this company ID, skipping name resolution',
				routing: { request: { body: { linkedin_company_id: '={{ $value }}' } } },
			},
			{
				displayName: 'Meta Page ID',
				name: 'meta_page_id',
				type: 'string',
				default: '',
				placeholder: '15087023444',
				description:
					'Pin Meta to this Facebook Page ID, skipping name resolution. Get it from Resolve Advertisers.',
				routing: { request: { body: { meta_page_id: '={{ $value }}' } } },
			},
		],
	},
];
