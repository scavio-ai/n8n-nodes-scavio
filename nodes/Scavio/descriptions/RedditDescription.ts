import type { INodeProperties } from 'n8n-workflow';

export const redditOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['reddit'] } },
		options: [
			{
				name: 'Search Posts',
				value: 'search',
				action: 'Search reddit posts',
				description: 'Search Reddit and return matching posts or comments',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/search' } },
			},
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get a reddit post',
				description: "Fetch a Reddit post's metadata and full comment thread",
				routing: { request: { method: 'POST', url: '/api/v1/reddit/post' } },
			},
		],
		default: 'search',
	},
];

export const redditFields: INodeProperties[] = [
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'n8n automation',
		displayOptions: { show: { resource: ['reddit'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Reddit search query',
	},
	{
		displayName: 'Post URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.reddit.com/r/programming/comments/abc123/example/',
		displayOptions: { show: { resource: ['reddit'], operation: ['post'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full Reddit post URL (typically returned by Search Posts)',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['search'] } },
		options: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'posts',
				options: [
					{ name: 'Posts', value: 'posts' },
					{ name: 'Comments', value: 'comments' },
				],
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'new',
				options: [
					{ name: 'Comments', value: 'comments' },
					{ name: 'Hot', value: 'hot' },
					{ name: 'New', value: 'new' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Top', value: 'top' },
				],
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},
];
