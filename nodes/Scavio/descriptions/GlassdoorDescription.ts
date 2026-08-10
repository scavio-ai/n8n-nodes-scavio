import type { INodeProperties } from 'n8n-workflow';

export const glassdoorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['glassdoor'] } },
		options: [
			{
				name: 'Get Company Profile',
				value: 'company',
				action: 'Get a glassdoor company profile',
				description:
					'Employer profile: ratings, star distribution, CEO approval, size and revenue bands, awards, the five server-rendered reviews, plus reviews_url and salaries_url. Chain those two back into Get Reviews and Get Salaries as the Glassdoor URL to halve the upstream fetches. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/glassdoor/company' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get glassdoor reviews',
				description:
					'Up to THREE reviews per call: Glassdoor caps it there behind its login wall. Each carries per-axis scores, pros, cons, advice, job title, location, employment status and any employer response, alongside full rating statistics and per-job-title review counts. There is no page parameter, so move the window with Category and Employment Status and read filtered_review_count to see how many match. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/glassdoor/reviews' } },
			},
			{
				name: 'Get Salaries',
				value: 'salaries',
				action: 'Get glassdoor salaries',
				description:
					'Salaries by job title, 10 titles per page: base-pay and total-pay percentiles P10-P90 with medians called out, sample counts, currency, pay period and last-reported date. These are Glassdoor estimates for the title, not individual reported salaries. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/glassdoor/salaries' } },
			},
			{
				name: 'Search Companies',
				value: 'companies',
				action: 'Search glassdoor companies',
				description:
					'Start here. Resolves a company name to the employer ID that Get Company Profile, Get Reviews and Get Salaries all need, ranked by Glassdoor and de-duplicated. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/glassdoor/companies' } },
			},
		],
		default: 'companies',
	},
];

export const glassdoorFields: INodeProperties[] = [
	{
		displayName:
			'Glassdoor is render-gated and slow. A call typically takes 40 to 90 seconds and a failing one can run about 3 minutes before it answers 502, so raise this node timeout and retry on 502.',
		name: 'glassdoorLatencyNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['glassdoor'] } },
	},

	// -- Search Companies --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Anthropic',
		displayOptions: { show: { resource: ['glassdoor'], operation: ['companies'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Company name to resolve to an employer ID',
	},

	// -- Shared identifier (company, reviews, salaries) --
	{
		displayName: 'Lookup By',
		name: 'glassdoorLookup',
		type: 'options',
		noDataExpression: true,
		default: 'employer_id',
		displayOptions: {
			show: { resource: ['glassdoor'], operation: ['company', 'reviews', 'salaries'] },
		},
		options: [
			{ name: 'Employer ID', value: 'employer_id' },
			{ name: 'Glassdoor URL', value: 'url' },
		],
		description: 'Whether to identify the employer by its employer ID or by a Glassdoor URL',
	},
	{
		displayName: 'Employer ID',
		name: 'employer_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1699',
		displayOptions: {
			show: {
				resource: ['glassdoor'],
				operation: ['company', 'reviews', 'salaries'],
				glassdoorLookup: ['employer_id'],
			},
		},
		routing: { request: { body: { employer_id: '={{ $value }}' } } },
		description:
			'Employer ID as returned by Search Companies, or read off an /Overview/ page. Accepts 1699, E1699 or IE1699, and must be sent as a string rather than a number.',
	},
	{
		displayName: 'Glassdoor URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.glassdoor.com/Overview/Working-at-Anthropic-EI_IE1699.11,18.htm',
		displayOptions: {
			show: {
				resource: ['glassdoor'],
				operation: ['company', 'reviews', 'salaries'],
				glassdoorLookup: ['url'],
			},
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'Any glassdoor.com employer URL, /Overview/, /Reviews/ or /Salary/. On Get Reviews and Get Salaries, pass back the reviews_url or salaries_url that Get Company Profile returned: addressing those two by employer ID costs two upstream fetches instead of one. Other hosts are rejected.',
	},

	// -- Additional Options: Get Company Profile --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['glassdoor'], operation: ['company'] } },
		options: [
			{
				displayName: 'Company Name',
				name: 'company',
				type: 'string',
				default: '',
				placeholder: 'Anthropic',
				description:
					'Cosmetic label only. The profile resolves on the employer ID alone, this is ignored entirely when a Glassdoor URL is set, and it never satisfies the identifier requirement on its own.',
				routing: { request: { body: { company: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['glassdoor'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				default: 'career_development',
				options: [
					{ name: 'Career Development', value: 'career_development' },
					{ name: 'Compensation', value: 'compensation' },
					{ name: 'Culture', value: 'culture' },
					{ name: 'Diversity and Inclusion', value: 'diversity_and_inclusion' },
					{ name: 'Management', value: 'management' },
					{ name: 'Work Life Balance', value: 'work_life_balance' },
				],
				description:
					'Rating axis the returned reviews are filtered on. Only these six are exposed because Glassdoor ignores an unknown value and serves the unfiltered set under a billed 200.',
				routing: { request: { body: { category: '={{ $value }}' } } },
			},
			{
				displayName: 'Company Name',
				name: 'company',
				type: 'string',
				default: '',
				placeholder: 'Anthropic',
				description:
					'Cosmetic label only. It is ignored entirely when a Glassdoor URL is set and never satisfies the identifier requirement on its own.',
				routing: { request: { body: { company: '={{ $value }}' } } },
			},
			{
				displayName: 'Employment Status',
				name: 'employment_status',
				type: 'options',
				default: 'full_time',
				options: [
					{ name: 'Contract', value: 'contract' },
					{ name: 'Full Time', value: 'full_time' },
					{ name: 'Intern', value: 'intern' },
					{ name: 'Part Time', value: 'part_time' },
				],
				description:
					'Employment status the returned reviews are filtered on. Only these four are exposed because Glassdoor ignores an unknown value and serves the unfiltered set under a billed 200.',
				routing: { request: { body: { employment_status: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Salaries --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['glassdoor'], operation: ['salaries'] } },
		options: [
			{
				displayName: 'Company Name',
				name: 'company',
				type: 'string',
				default: '',
				placeholder: 'Anthropic',
				description:
					'Cosmetic label only. It is ignored entirely when a Glassdoor URL is set and never satisfies the identifier requirement on its own.',
				routing: { request: { body: { company: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Results page, 10 job titles per page. page_count on the response says how many pages exist.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
