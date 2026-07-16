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
					request: { method: 'POST', url: '/api/v2/google' },
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
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['google'], operation: ['search'] } },
		options: [
			{
				displayName: 'Country Code',
				name: 'gl',
				type: 'string',
				default: 'us',
				description: 'ISO 3166-1 alpha-2 country code (e.g. us, gb, fr)',
				routing: { request: { body: { gl: '={{ $value }}' } } },
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
				displayName: 'Google Domain',
				name: 'google_domain',
				type: 'string',
				default: 'google.com',
				description: 'Regional Google domain (e.g. google.com, google.de)',
				routing: { request: { body: { google_domain: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'hl',
				type: 'string',
				default: 'en',
				description: 'UI language code (e.g. en, fr, de)',
				routing: { request: { body: { hl: '={{ $value }}' } } },
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'New York,New York,United States',
				description: 'Canonical location name the search originates from',
				routing: { request: { body: { location: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page number, 1-indexed',
				routing: { request: { body: { start: '={{ ($value - 1) * 10 }}' } } },
			},
		],
	},
];
