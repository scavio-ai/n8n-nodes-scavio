import type { INodeProperties } from 'n8n-workflow';

export const extractOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['extract'] } },
		options: [
			{
				name: 'Extract Page',
				value: 'extract',
				action: 'Extract a web page',
				description:
					'Read any URL and get it back as raw HTML, readability Markdown or plain text, alongside the format, mode and content_length it came back with. Mode sets the price: Normal and Advanced cost 1 credit, Ultra costs 2. Nothing is charged unless the extraction succeeds, so a dead link, bot wall or timeout is free.',
				routing: { request: { method: 'POST', url: '/api/v1/extract' } },
			},
		],
		default: 'extract',
	},
];

export const extractFields: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/blog/post',
		displayOptions: { show: { resource: ['extract'], operation: ['extract'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'Page to read. HTTP and HTTPS only, a bare host is upgraded to HTTPS, and loopback, private, link-local and metadata hosts are rejected with a 400.',
	},
	{
		displayName: 'Output Format',
		name: 'format',
		type: 'options',
		default: 'markdown',
		displayOptions: { show: { resource: ['extract'], operation: ['extract'] } },
		options: [
			{
				name: 'HTML',
				value: 'html',
				description: 'The raw page exactly as served, with no extraction applied',
			},
			{
				name: 'Markdown',
				value: 'markdown',
				description: 'Readability extraction of the main content, boilerplate stripped',
			},
			{
				name: 'Plain Text',
				value: 'text',
				description: 'The Markdown extraction flattened to plain text',
			},
		],
		routing: { request: { body: { format: '={{ $value }}' } } },
		description: 'Shape the page content comes back in. Format does not affect the price.',
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		default: 'normal',
		displayOptions: { show: { resource: ['extract'], operation: ['extract'] } },
		options: [
			{
				name: 'Advanced',
				value: 'advanced',
				description: 'Headless browser render for pages built by JavaScript, 1 credit',
			},
			{
				name: 'Normal',
				value: 'normal',
				description: 'Plain datacenter fetch, the cheapest and fastest option, 1 credit',
			},
			{
				name: 'Ultra',
				value: 'ultra',
				description: 'Premium residential proxy for hard targets, 2 credits',
			},
		],
		routing: { request: { body: { mode: '={{ $value }}' } } },
		description:
			'Fetch strategy, and the only thing that moves the price. Normal and Advanced cost 1 credit each, Ultra costs 2. Billing happens only on a successful extraction, so a dead link, bot wall or timeout costs nothing.',
	},
];
