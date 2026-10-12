import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

import {
	DEFAULT_POLL_SECONDS,
	DEFAULT_WAIT_SECONDS,
	MAX_WAIT_SECONDS,
	waitForJob,
} from './ExtractJobWait';

// Comma-separated text -> string array, blanks dropped.
const splitList = '={{ String($value).split(",").map(s => s.trim()).filter(Boolean) }}';
// One URL per line or comma-separated -> string array, blanks dropped.
const splitUrls = '={{ String($value).split(/[\\n,]/).map(s => s.trim()).filter(Boolean) }}';

const PRICING =
	'Billed per successful page at the Extract price for the mode: Normal 1 credit, Advanced 1, Ultra 2. Failed and skipped pages are free, and the job stops cleanly if your balance runs out.';
const LIMITS =
	'Plan limits (pages per crawl / active jobs / URLs per batch): Free 10/1/10, PAYG 100/1/50, Project 500/2/100, Bootstrap 2,000/3/500, Startup 5,000/5/1,000, Growth 10,000/10/1,000';

const show = (operation: string[], extra: Record<string, unknown[]> = {}) => ({
	show: { resource: ['extract'], operation, ...extra },
});

const JOB_MODES: INodePropertyOptions[] = [
	{ name: 'Advanced', value: 'advanced', description: 'Renders JavaScript, 1 credit per page' },
	{ name: 'Normal', value: 'normal', description: 'The standard read, 1 credit per page' },
	{ name: 'Ultra', value: 'ultra', description: 'For the hardest pages, 2 credits per page' },
];

const JOB_FORMATS: INodePropertyOptions[] = [
	{ name: 'HTML', value: 'html', description: 'The raw page exactly as served' },
	{ name: 'Markdown', value: 'markdown', description: 'Readability extraction of the main content' },
	{ name: 'Plain Text', value: 'text', description: 'The Markdown extraction flattened to plain text' },
];

const SITEMAP_OPTIONS: INodePropertyOptions[] = [
	{ name: 'Include', value: 'include', description: 'Use the sitemap and the links on pages' },
	{ name: 'Only', value: 'only', description: 'Use the sitemap alone' },
	{ name: 'Skip', value: 'skip', description: 'Use the links on pages alone' },
];

const GLOB_HINT =
	'Comma-separated path globs, up to 20. * matches within one path segment, ** across segments; a pattern without wildcards matches that path and everything under it. Example: /blog/**';

function jobFormat(): INodeProperties {
	return {
		displayName: 'Format',
		name: 'format',
		type: 'options',
		default: 'markdown',
		options: JOB_FORMATS,
		description: 'Shape each page comes back in, as on Extract Page. Defaults to Markdown.',
		routing: { request: { body: { format: '={{ $value }}' } } },
	};
}

function jobMode(): INodeProperties {
	return {
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		default: 'normal',
		options: JOB_MODES,
		description: 'Extraction tier and the per-page price: Normal 1 credit, Advanced 1, Ultra 2. Defaults to Normal.',
		routing: { request: { body: { mode: '={{ $value }}' } } },
	};
}

function idempotencyKey(): INodeProperties {
	return {
		displayName: 'Idempotency Key',
		name: 'idempotency_key',
		type: 'string',
		default: '',
		description:
			'Repeating a start with the same key within 24 hours returns the original job instead of starting a new one. Up to 255 characters.',
		routing: { request: { headers: { 'Idempotency-Key': '={{ $value }}' } } },
	};
}

function webhookUrl(): INodeProperties {
	return {
		displayName: 'Webhook URL',
		name: 'webhook_url',
		type: 'string',
		default: '',
		placeholder: 'https://example.com/hooks/scavio',
		description:
			'HTTPS URL that receives a signed POST when the job completes, fails or is cancelled (retried after 30 seconds and 5 minutes). The signing secret is returned once, as webhook_secret, in this response. Header Scavio-Signature: t=&lt;unix&gt;,v1=&lt;hex HMAC-SHA256 of "&lt;t&gt;.&lt;raw body&gt;"&gt;.',
		routing: { request: { body: { webhook_url: '={{ $value }}' } } },
	};
}

function waitFields(operation: string): INodeProperties[] {
	return [
		{
			displayName: 'Wait for Completion',
			name: 'waitForCompletion',
			type: 'boolean',
			default: false,
			displayOptions: show([operation]),
			description:
				'Whether to poll the job until it finishes and return its status and first page of results. Off returns the job ID at once; use Get Status to collect results. If the wait limit is reached, the latest status is returned with wait.timed_out set to true.',
		},
		{
			displayName: 'Max Wait (Seconds)',
			name: 'maxWaitSeconds',
			type: 'number',
			default: DEFAULT_WAIT_SECONDS,
			typeOptions: { minValue: 10, maxValue: MAX_WAIT_SECONDS },
			displayOptions: show([operation], { waitForCompletion: [true] }),
			description: `How long to wait before returning the latest status, up to ${MAX_WAIT_SECONDS} seconds. Large jobs keep running after the wait ends.`,
		},
		{
			displayName: 'Poll Interval (Seconds)',
			name: 'pollIntervalSeconds',
			type: 'number',
			default: DEFAULT_POLL_SECONDS,
			typeOptions: { minValue: 2, maxValue: 60 },
			displayOptions: show([operation], { waitForCompletion: [true] }),
			description: 'Seconds between status checks while waiting. Status checks are free.',
		},
	];
}

function jobIdField(type: 'crawl' | 'batch', operation: string): INodeProperties {
	return {
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		default: '',
		placeholder: `${type}_01928c1e-...`,
		displayOptions: show([operation]),
		description: `The ID returned by Start ${type === 'crawl' ? 'Crawl' : 'Batch'}`,
		routing: {
			request: { url: `=/api/v1/extract/${type}/{{ String($value).trim() }}` },
		},
	};
}

function statusOptions(operation: string): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show([operation]),
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'The next_cursor from the previous response, to fetch the next page of results',
				routing: { request: { qs: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Content',
				name: 'include_content',
				type: 'boolean',
				default: true,
				description: 'Whether to return each page\'s content. Turn off to page through results without their content.',
				routing: { request: { qs: { include_content: '={{ $value ? "true" : "false" }}' } } },
			},
			{
				displayName: 'Results Per Page',
				name: 'page_size',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Results per response, 1-100. The API default is 25. Responses are also cut at about 5 MB of content.',
				routing: { request: { qs: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'succeeded',
				options: [
					{ name: 'Failed', value: 'failed' },
					{ name: 'Skipped', value: 'skipped' },
					{ name: 'Succeeded', value: 'succeeded' },
				],
				description: 'Only return results with this status',
				routing: { request: { qs: { status: '={{ $value }}' } } },
			},
		],
	};
}

export const extractOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['extract'] } },
		options: [
			{
				name: 'Cancel Batch',
				value: 'cancelBatch',
				action: 'Cancel a batch extract job',
				description:
					'Stop a queued or running batch. No further pages are fetched or billed; results so far stay available. Returns 409 if the batch already finished. Free.',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Cancel Crawl',
				value: 'cancelCrawl',
				action: 'Cancel a crawl job',
				description:
					'Stop a queued or running crawl. No further pages are fetched or billed; results so far stay available. Returns 409 if the crawl already finished. Free.',
				routing: { request: { method: 'DELETE' } },
			},
			{
				name: 'Extract Page',
				value: 'extract',
				action: 'Extract a web page',
				description:
					'Read any URL and get it back as raw HTML, readability Markdown or plain text, alongside the format, mode and content_length it came back with. Mode sets the price: Normal and Advanced cost 1 credit, Ultra costs 2. Nothing is charged unless the extraction succeeds, so a dead link, bot wall or timeout is free.',
				routing: { request: { method: 'POST', url: '/api/v1/extract' } },
			},
			{
				name: 'Get Batch Status',
				value: 'batchStatus',
				action: 'Get batch status and results',
				description:
					'Progress (page counts, credits used, stopped_reason) and the page results in input order, paged with next_cursor. Results are kept for 3 days after the batch finishes. Free.',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Get Crawl Status',
				value: 'crawlStatus',
				action: 'Get crawl status and results',
				description:
					'Progress (page counts, credits used, stopped_reason) and the page results, each with URL, depth, status and content, paged with next_cursor. Results are kept for 3 days after the crawl finishes. Free.',
				routing: { request: { method: 'GET' } },
			},
			{
				name: 'Map Website',
				value: 'map',
				action: 'Map a website',
				description:
					'Give a site and get back its list of page URLs from its sitemaps and its start page, deduplicated, filtered by path and limited, with total_found and truncated. Pages disallowed by robots.txt are left out. 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/extract/map' } },
			},
			{
				name: 'Screenshot',
				value: 'screenshot',
				action: 'Capture a web page screenshot',
				description:
					'Give any public URL and get back a screenshot of the page as a PNG, returned inline as a base64 data URI',
				routing: { request: { method: 'POST', url: '/api/v1/extract/screenshot' } },
			},
			{
				name: 'Start Batch',
				value: 'batch',
				action: 'Start a batch extract job',
				description: `Extract a list of URLs in one job, each returned like Extract Page. Invalid URLs are listed in the response and never billed. Returns a job ID; turn on Wait for Completion or use Get Batch Status for results. ${PRICING}`,
				routing: {
					request: { method: 'POST', url: '/api/v1/extract/batch' },
					output: { postReceive: [waitForJob('batch')] },
				},
			},
			{
				name: 'Start Crawl',
				value: 'crawl',
				action: 'Start a crawl job',
				description: `Crawl a site from one URL: same-site pages are found and extracted breadth-first within your page, depth and path limits, each returned like Extract Page. Pages disallowed by robots.txt are skipped. Returns a job ID; turn on Wait for Completion or use Get Crawl Status for results. ${PRICING}`,
				routing: {
					request: { method: 'POST', url: '/api/v1/extract/crawl' },
					output: { postReceive: [waitForJob('crawl')] },
				},
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
				description: 'Renders JavaScript, for pages built in the browser, 1 credit',
			},
			{
				name: 'Normal',
				value: 'normal',
				description: 'The standard read, the cheapest and fastest option, 1 credit',
			},
			{
				name: 'Ultra',
				value: 'ultra',
				description: 'For the hardest pages, 2 credits',
			},
		],
		routing: { request: { body: { mode: '={{ $value }}' } } },
		description:
			'Extraction tier, and the only thing that moves the price. Normal and Advanced cost 1 credit each, Ultra costs 2. Billing happens only on a successful extraction, so a dead link, bot wall or timeout costs nothing.',
	},

	// ── Screenshot fields ──
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com',
		displayOptions: { show: { resource: ['extract'], operation: ['screenshot'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'The page to capture. HTTP(S) only, a bare host is upgraded to HTTPS.',
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		default: 'normal',
		displayOptions: { show: { resource: ['extract'], operation: ['screenshot'] } },
		options: [
			{
				name: 'Advanced',
				value: 'advanced',
				description: 'Waits longer for JavaScript-built pages to finish painting',
			},
			{
				name: 'Normal',
				value: 'normal',
				description: 'Works for most sites',
			},
			{
				name: 'Ultra',
				value: 'ultra',
				description: 'Reaches the hardest pages, costs more credits',
			},
		],
		routing: { request: { body: { mode: '={{ $value }}' } } },
		description: 'Capture tier. Normal works for most sites; advanced waits longer for JS pages; ultra reaches the hardest pages.',
	},

	// ── Map Website ──
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com',
		displayOptions: show(['map']),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description: 'The site to map. A bare host is upgraded to HTTPS.',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['map']),
		options: [
			{
				displayName: 'Exclude Paths',
				name: 'exclude_paths',
				type: 'string',
				default: '',
				placeholder: '/tag/**, /author/**',
				description: `Paths to drop. ${GLOB_HINT}.`,
				routing: { send: { type: 'body', property: 'exclude_paths', value: splitList } },
			},
			{
				displayName: 'Ignore Query Parameters',
				name: 'ignore_query_parameters',
				type: 'boolean',
				default: true,
				description: 'Whether URLs that differ only by query string count as one URL. The API default is true.',
				routing: { request: { body: { ignore_query_parameters: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Paths',
				name: 'include_paths',
				type: 'string',
				default: '',
				placeholder: '/blog/**',
				description: `Paths to keep. ${GLOB_HINT}.`,
				routing: { send: { type: 'body', property: 'include_paths', value: splitList } },
			},
			{
				displayName: 'Include Subdomains',
				name: 'include_subdomains',
				type: 'boolean',
				default: false,
				description: 'Whether to also return URLs on subdomains of the site. www and the bare domain always count as one site.',
				routing: { request: { body: { include_subdomains: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Links',
				name: 'max_links',
				type: 'number',
				default: 1000,
				typeOptions: { minValue: 1, maxValue: 5000 },
				description: 'Maximum links to return, sent as limit. The API default is 1,000 (or your plan limit if lower). Plan limits: Free 500, PAYG 1,000, paid plans 5,000.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				default: 'normal',
				options: [
					{ name: 'Advanced', value: 'advanced', description: 'Renders JavaScript' },
					{ name: 'Normal', value: 'normal', description: 'The standard read, 1 credit' },
					{ name: 'Ultra', value: 'ultra', description: 'For the hardest pages' },
				],
				description: 'Extraction tier used to read the start page and sitemaps. Normal costs 1 credit.',
				routing: { request: { body: { mode: '={{ $value }}' } } },
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				placeholder: 'pricing',
				description: 'Only return URLs containing every word of this text (case-insensitive), up to 200 characters',
				routing: { request: { body: { search: '={{ $value }}' } } },
			},
			{
				displayName: 'Sitemap',
				name: 'sitemap',
				type: 'options',
				default: 'include',
				options: SITEMAP_OPTIONS,
				description: 'Include (the default) combines the sitemaps with the links on the start page',
				routing: { request: { body: { sitemap: '={{ $value }}' } } },
			},
		],
	},

	// ── Start Crawl ──
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/docs',
		displayOptions: show(['crawl']),
		routing: { request: { body: { url: '={{ String($value).trim() }}' } } },
		description:
			'Where the crawl starts. Only pages on the same site are crawled, and URLs under the start path are crawled first.',
	},
	...waitFields('crawl'),
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['crawl']),
		options: [
			{
				displayName: 'Allow Subdomains',
				name: 'allow_subdomains',
				type: 'boolean',
				default: false,
				description: 'Whether to also crawl subdomains of the site',
				routing: { request: { body: { allow_subdomains: '={{ $value }}' } } },
			},
			{
				displayName: 'Exclude Paths',
				name: 'exclude_paths',
				type: 'string',
				default: '',
				placeholder: '/blog/tag/**',
				description: `Paths to skip. Excludes win over includes. ${GLOB_HINT}.`,
				routing: { send: { type: 'body', property: 'exclude_paths', value: splitList } },
			},
			jobFormat(),
			idempotencyKey(),
			{
				displayName: 'Ignore Query Parameters',
				name: 'ignore_query_parameters',
				type: 'boolean',
				default: true,
				description: 'Whether URLs that differ only by query string count as one page. The API default is true.',
				routing: { request: { body: { ignore_query_parameters: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Paths',
				name: 'include_paths',
				type: 'string',
				default: '',
				placeholder: '/docs/**',
				description: `Paths to crawl. ${GLOB_HINT}.`,
				routing: { send: { type: 'body', property: 'include_paths', value: splitList } },
			},
			{
				displayName: 'Max Depth',
				name: 'max_depth',
				type: 'number',
				default: 3,
				typeOptions: { minValue: 0, maxValue: 10 },
				description: 'How many links away from the start page to follow, 0-10. 0 fetches only the start page. The API default is 3.',
				routing: { request: { body: { max_depth: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Pages',
				name: 'max_pages',
				type: 'number',
				default: 100,
				typeOptions: { minValue: 1, maxValue: 10000 },
				description: `Maximum pages to fetch. The API default is 100. ${LIMITS}.`,
				routing: { request: { body: { max_pages: '={{ $value }}' } } },
			},
			jobMode(),
			{
				displayName: 'Sitemap',
				name: 'sitemap',
				type: 'options',
				default: 'include',
				options: [
					{ name: 'Include', value: 'include', description: 'Also start from the sitemap' },
					{ name: 'Only', value: 'only', description: 'Fetch sitemap pages without following links' },
					{ name: 'Skip', value: 'skip', description: 'Follow links only' },
				],
				description: 'Whether the crawl uses the site\'s sitemap. Defaults to Include.',
				routing: { request: { body: { sitemap: '={{ $value }}' } } },
			},
			webhookUrl(),
		],
	},

	// ── Get Crawl Status / Cancel Crawl ──
	jobIdField('crawl', 'crawlStatus'),
	statusOptions('crawlStatus'),
	jobIdField('crawl', 'cancelCrawl'),

	// ── Start Batch ──
	{
		displayName: 'URLs',
		name: 'urls',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 4 },
		placeholder: 'https://example.com/a\nhttps://example.com/b',
		displayOptions: show(['batch']),
		description: `Pages to extract, one per line or comma-separated (duplicates removed). ${LIMITS}.`,
		routing: { send: { type: 'body', property: 'urls', value: splitUrls } },
	},
	...waitFields('batch'),
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['batch']),
		options: [jobFormat(), idempotencyKey(), jobMode(), webhookUrl()],
	},

	// ── Get Batch Status / Cancel Batch ──
	jobIdField('batch', 'batchStatus'),
	statusOptions('batchStatus'),
	jobIdField('batch', 'cancelBatch'),
];
