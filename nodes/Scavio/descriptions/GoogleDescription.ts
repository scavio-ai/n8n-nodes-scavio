import type { INodeProperties } from 'n8n-workflow';

export const googleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['google'] } },
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search google',
				description: 'Search Google and return organic results, knowledge graph, news, and more',
				routing: {
					request: { method: 'POST', url: '/api/v1/google' },
				},
			},
		],
		default: 'search',
	},
];

export const googleFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'best running shoes 2026',
		displayOptions: { show: { resource: ['google'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'The search query',
	},
	{
		displayName: 'Search Type',
		name: 'search_type',
		type: 'options',
		default: 'classic',
		options: [
			{ name: 'Classic', value: 'classic' },
			{ name: 'Images', value: 'images' },
			{ name: 'Lens', value: 'lens' },
			{ name: 'Maps', value: 'maps' },
			{ name: 'News', value: 'news' },
		],
		displayOptions: { show: { resource: ['google'], operation: ['search'] } },
		routing: { request: { body: { search_type: '={{ $value }}' } } },
		description: 'Type of search results to return',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['google'], operation: ['search'] } },
		options: [
			{
				displayName: 'Country Code',
				name: 'country_code',
				type: 'string',
				default: 'us',
				description: 'ISO 3166-1 alpha-2 country code (e.g. us, gb, fr)',
				routing: { request: { body: { country_code: '={{ $value }}' } } },
			},
			{
				displayName: 'Device',
				name: 'device',
				type: 'options',
				default: 'desktop',
				options: [
					{ name: 'Desktop', value: 'desktop' },
					{ name: 'Mobile', value: 'mobile' },
				],
				routing: { request: { body: { device: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'en',
				description: 'Language code (e.g. en, fr, de)',
				routing: { request: { body: { language: '={{ $value }}' } } },
			},
			{
				displayName: 'Light Request',
				name: 'light_request',
				type: 'boolean',
				default: true,
				description:
					'Whether to use the cheaper, lighter response (1 credit). Disable for full results (2 credits).',
				routing: { request: { body: { light_request: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page number, 1-indexed',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
