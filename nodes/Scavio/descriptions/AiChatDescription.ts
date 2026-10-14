import type { INodeProperties } from 'n8n-workflow';

// ChatGPT and Gemini: one Prompt operation each, same response shape. Answers
// take 10-40 seconds, so both routes carry a 120s request timeout.

const PROMPT_TIMEOUT_MS = 120000;

const latencyNotice = (resource: string, credits: string): INodeProperties => ({
	displayName:
		`Answers typically take 10-40 seconds. ${credits} per answered prompt; a failed prompt is not charged. On a 503, wait for the Retry-After header and retry.`,
	name: `${resource}LatencyNotice`,
	type: 'notice',
	default: '',
	displayOptions: { show: { resource: [resource] } },
});

const promptField = (resource: string, max: number, assistant: string): INodeProperties => ({
	displayName: 'Prompt',
	name: 'prompt',
	type: 'string',
	required: true,
	default: '',
	typeOptions: { rows: 4 },
	placeholder: 'What are the best running shoes for beginners?',
	description: `The prompt to send, up to ${max} characters. Ask it the way your buyers would to see which brands and pages ${assistant} recommends.`,
	displayOptions: { show: { resource: [resource], operation: ['prompt'] } },
	routing: { request: { body: { prompt: '={{ $value }}' } } },
});

export const chatgptOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['chatgpt'] } },
		options: [
			{
				name: 'Prompt',
				value: 'prompt',
				action: 'Get a chatgpt answer',
				description:
					'Send a prompt to ChatGPT and get the answer it gives: the full Markdown answer, every page it cites with title, publisher and date, the web searches it ran, and the products it recommended. For AI visibility and brand monitoring. Costs 5 credits.',
				routing: {
					request: { method: 'POST', url: '/api/v1/chatgpt/prompt', timeout: PROMPT_TIMEOUT_MS },
				},
			},
		],
		default: 'prompt',
	},
];

export const chatgptFields: INodeProperties[] = [
	latencyNotice('chatgpt', '1 credit'),
	promptField('chatgpt', 1024, 'ChatGPT'),
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['chatgpt'], operation: ['prompt'] } },
		options: [
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'us',
				placeholder: 'gb',
				description: '2-letter country code the answer is localized for',
				routing: {
					request: { body: { country: '={{ String($value).trim().toLowerCase() }}' } },
				},
			},
			{
				displayName: 'Include HTML',
				name: 'include_html',
				type: 'boolean',
				default: false,
				description: 'Whether to also return the answer rendered as HTML in answer.html',
				routing: { request: { body: { include_html: '={{ $value }}' } } },
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'auto',
				description: 'Model to answer with. Auto is the model ChatGPT picks by default.',
				routing: { request: { body: { model: '={{ String($value).trim() }}' } } },
			},
		],
	},
];

export const geminiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['gemini'] } },
		options: [
			{
				name: 'Prompt',
				value: 'prompt',
				action: 'Get a gemini answer',
				description:
					'Send a prompt to Google Gemini and get the answer it gives: the full Markdown answer, the URLs it cites, and the products it recommended. Same output shape as ChatGPT Prompt. Costs 5 credits.',
				routing: {
					request: { method: 'POST', url: '/api/v1/gemini/prompt', timeout: PROMPT_TIMEOUT_MS },
				},
			},
		],
		default: 'prompt',
	},
];

export const geminiFields: INodeProperties[] = [
	latencyNotice('gemini', '5 credits'),
	promptField('gemini', 4000, 'Gemini'),
];
