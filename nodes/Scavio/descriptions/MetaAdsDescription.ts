import type { INodeProperties } from 'n8n-workflow';

export const metaAdsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['metaAds'] } },
		options: [
			{
				name: 'Search Ad Library',
				value: 'search',
				action: 'Search meta ad library',
				description:
					'Search the Meta Ad Library and get 30 ads on page 1 with the full creative: page name, ad copy, headline, CTA, images and videos, the platforms each ran on and the run dates. Cursor-paginated at 10 ads a page after that, so walking has_next_page scrapes a whole query. total_results caps at 50000 with total_is_capped set, because Meta only ever reports more than 50,000. Each page costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/meta-ads/search' } },
			},
			{
				name: 'Get Advertiser Ads',
				value: 'advertiser',
				action: 'Get meta ads for an advertiser',
				description:
					'Every ad a Facebook Page is running, by numeric page ID: 30 ads on page 1 with the same creative detail as Search Ad Library, then cursor-paginated at 10 a page. Walk has_next_page to pull the advertiser whole. Each page costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/meta-ads/advertiser' } },
			},
			{
				name: 'Get Ad',
				value: 'ad',
				action: 'Get a meta ad',
				description:
					'One Meta ad in full by archive ID: creative, advertiser, run dates, platforms and any political disclosure. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/meta-ads/ad' } },
			},
		],
		default: 'search',
	},
];

const META_ADS_ACTIVE_STATUS = [
	{ name: 'Active', value: 'active' },
	{ name: 'All', value: 'all' },
	{ name: 'Inactive', value: 'inactive' },
];

const META_ADS_AD_TYPE = [
	{ name: 'All', value: 'all' },
	{ name: 'Political and Issue Ads', value: 'political_and_issue_ads' },
];

const META_ADS_MEDIA_TYPE = [
	{ name: 'All', value: 'all' },
	{ name: 'Image', value: 'image' },
	{ name: 'Image and Meme', value: 'image_and_meme' },
	{ name: 'Meme', value: 'meme' },
	{ name: 'None', value: 'none' },
	{ name: 'Video', value: 'video' },
];

const AD_TYPE_DESCRIPTION =
	'Set this to Political and Issue Ads to expose spend, reach, impressions and the paid-for-by disclosure. Commercial ads leave all four null, which is expected rather than a bug.';

const CURSOR_DESCRIPTION =
	'The next_cursor value from the previous response, 30 ads on page 1 then 10 a page. Every other filter is ignored while a cursor is present, because the cursor is a self-contained blob that already carries them.';

export const metaAdsFields: INodeProperties[] = [
	// ── Query (search) ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'skincare serum',
		displayOptions: { show: { resource: ['metaAds'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Keyword or phrase to search the Meta Ad Library for',
	},

	// ── Page ID (advertiser) ──
	{
		displayName: 'Page ID',
		name: 'page_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '20531316728',
		displayOptions: { show: { resource: ['metaAds'], operation: ['advertiser'] } },
		routing: { request: { body: { page_id: '={{ $value }}' } } },
		description:
			'The advertiser numeric Facebook Page ID, 3 to 25 digits. Search Ad Library returns it on every row.',
	},

	// ── Ad Archive ID (ad) ──
	{
		displayName: 'Ad Archive ID',
		name: 'ad_archive_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1234567890123456',
		displayOptions: { show: { resource: ['metaAds'], operation: ['ad'] } },
		routing: { request: { body: { ad_archive_id: '={{ $value }}' } } },
		description:
			'Meta ad archive ID, 3 to 25 digits, as returned by Search Ad Library or Get Advertiser Ads',
	},

	// ── Additional Options: Search Ad Library ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['metaAds'], operation: ['search'] } },
		options: [
			{
				displayName: 'Active Status',
				name: 'active_status',
				type: 'options',
				default: 'all',
				options: META_ADS_ACTIVE_STATUS,
				description: 'Whether to return ads still running, ads that have stopped, or both',
				routing: { request: { body: { active_status: '={{ $value }}' } } },
			},
			{
				displayName: 'Ad Type',
				name: 'ad_type',
				type: 'options',
				default: 'all',
				options: META_ADS_AD_TYPE,
				description: AD_TYPE_DESCRIPTION,
				routing: { request: { body: { ad_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'US',
				placeholder: 'GB',
				description: 'Two-letter country code the library is queried for',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: CURSOR_DESCRIPTION,
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Media Type',
				name: 'media_type',
				type: 'options',
				default: 'all',
				options: META_ADS_MEDIA_TYPE,
				description: 'Restrict to one creative media type',
				routing: { request: { body: { media_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Search Type',
				name: 'search_type',
				type: 'options',
				default: 'keyword_unordered',
				options: [
					{ name: 'Keyword Exact Phrase', value: 'keyword_exact_phrase' },
					{ name: 'Keyword Unordered', value: 'keyword_unordered' },
				],
				description: 'Whether to match the query as unordered keywords or as an exact phrase',
				routing: { request: { body: { search_type: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Advertiser Ads ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['metaAds'], operation: ['advertiser'] } },
		options: [
			{
				displayName: 'Active Status',
				name: 'active_status',
				type: 'options',
				default: 'all',
				options: META_ADS_ACTIVE_STATUS,
				description: 'Whether to return ads still running, ads that have stopped, or both',
				routing: { request: { body: { active_status: '={{ $value }}' } } },
			},
			{
				displayName: 'Ad Type',
				name: 'ad_type',
				type: 'options',
				default: 'all',
				options: META_ADS_AD_TYPE,
				description: AD_TYPE_DESCRIPTION,
				routing: { request: { body: { ad_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'US',
				placeholder: 'GB',
				description: 'Two-letter country code the library is queried for',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: CURSOR_DESCRIPTION,
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Media Type',
				name: 'media_type',
				type: 'options',
				default: 'all',
				options: META_ADS_MEDIA_TYPE,
				description: 'Restrict to one creative media type',
				routing: { request: { body: { media_type: '={{ $value }}' } } },
			},
		],
	},
];
