import type { INodeProperties } from 'n8n-workflow';

export const indeedOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['indeed'] } },
		options: [
			{
				name: 'Get Company',
				value: 'company',
				action: 'Get an indeed company',
				description:
					'Get an Indeed employer profile: description, industry, headquarters, size, revenue, CEO approval, overall and per-category ratings, reported salaries, open roles and locations. An unknown company slug is a real 404 that is still billed. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/indeed/company' } },
			},
			{
				name: 'Get Company Reviews',
				value: 'companyReviews',
				action: 'Get indeed company reviews',
				description:
					'Get Indeed employee reviews, 20 per page, with per-category ratings, pros and cons, reviewer job title and location, plus aggregated sentiment and topic, location and job-title breakdowns. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/indeed/company/reviews' } },
			},
			{
				name: 'Get Job',
				value: 'job',
				action: 'Get an indeed job',
				description:
					'Get one Indeed posting in full: description text and HTML, structured salary, employment types, benefits, geocoded address, employer rating, applicant count and the original ATS link. An unknown job key is a real 404 that is still billed. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/indeed/job' } },
			},
			{
				name: 'Search Jobs',
				value: 'search',
				action: 'Search indeed jobs',
				description:
					'Search Indeed postings: title, employer, rating, location, salary range, job type, benefits, posting age and apply route, 10 postings per page. A location-only search is valid and returns every posting in a metro. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/indeed/search' } },
			},
		],
		default: 'search',
	},
];

export const indeedFields: INodeProperties[] = [
	// -- Search Jobs: query, location, or both --
	{
		displayName: 'Search By',
		name: 'indeedSearchBy',
		type: 'options',
		noDataExpression: true,
		default: 'query',
		displayOptions: { show: { resource: ['indeed'], operation: ['search'] } },
		options: [
			{ name: 'Keyword', value: 'query' },
			{ name: 'Keyword and Location', value: 'both' },
			{ name: 'Location', value: 'location' },
		],
		description:
			'Whether to search by keyword, by location, or by both. Indeed accepts a location-only search, which returns every posting in that metro.',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'data engineer',
		displayOptions: {
			show: { resource: ['indeed'], operation: ['search'], indeedSearchBy: ['both', 'query'] },
		},
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Job title, skill or company keyword to search for',
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin, TX',
		displayOptions: {
			show: { resource: ['indeed'], operation: ['search'], indeedSearchBy: ['both', 'location'] },
		},
		routing: { request: { body: { location: '={{ $value }}' } } },
		description: 'City and state, postal code, state, country, or the word Remote',
	},

	// -- Get Job --
	{
		displayName: 'Job ID or URL',
		name: 'job_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1a2b3c4d5e6f7890',
		displayOptions: { show: { resource: ['indeed'], operation: ['job'] } },
		routing: { request: { body: { job_id: '={{ $value }}' } } },
		description:
			'The 16-character hex job key, or any indeed.com URL carrying jk=, which covers /viewjob, /rc/clk and /pagead/clk links',
	},

	// -- Get Company + Get Company Reviews --
	{
		displayName: 'Company Slug or URL',
		name: 'company',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Tata-Consultancy-Services-(tcs)',
		displayOptions: { show: { resource: ['indeed'], operation: ['company', 'companyReviews'] } },
		routing: { request: { body: { company: '={{ $value }}' } } },
		description:
			'The indeed.com/cmp/ slug or a full company profile URL. Slugs are untidy and carry their own punctuation, so copy them from the profile URL rather than guessing.',
	},

	// -- Additional Options: Search Jobs --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['indeed'], operation: ['search'] } },
		options: [
			{
				displayName: 'Job Type',
				name: 'job_type',
				type: 'options',
				default: 'full_time',
				options: [
					{ name: 'Contract', value: 'contract' },
					{ name: 'Full Time', value: 'full_time' },
					{ name: 'Internship', value: 'internship' },
					{ name: 'Part Time', value: 'part_time' },
					{ name: 'Temporary', value: 'temporary' },
				],
				description: 'Employment type to keep',
				routing: { request: { body: { job_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Age in Days',
				name: 'max_age_days',
				type: 'options',
				default: 7,
				options: [
					{ name: '1 Day', value: 1 },
					{ name: '3 Days', value: 3 },
					{ name: '7 Days', value: 7 },
					{ name: '14 Days', value: 14 },
				],
				description:
					'Keep only postings published within this window. Indeed accepts these four values only and silently ignores anything else, returning, and billing, the unfiltered set.',
				routing: { request: { body: { max_age_days: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Salary',
				name: 'min_salary',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description:
					"Minimum annual salary. This filters on INDEED'S OWN ESTIMATE for the role, not on a posted figure, so postings that publish no salary at all still match.",
				routing: { request: { body: { min_salary: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to fetch, 10 postings per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Radius in Miles',
				name: 'radius',
				type: 'options',
				default: 50,
				options: [
					{ name: '0 Miles', value: 0 },
					{ name: '5 Miles', value: 5 },
					{ name: '10 Miles', value: 10 },
					{ name: '15 Miles', value: 15 },
					{ name: '25 Miles', value: 25 },
					{ name: '35 Miles', value: 35 },
					{ name: '50 Miles', value: 50 },
					{ name: '100 Miles', value: 100 },
				],
				description:
					'Distance around Location to include, Indeed defaults to 50. These eight values are the only ones Indeed honours, anything else is ignored and you are billed for the unfiltered search.',
				routing: { request: { body: { radius: '={{ $value }}' } } },
			},
			{
				displayName: 'Remote Only',
				name: 'remote',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only postings Indeed flags as remote',
				routing: { request: { body: { remote: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Company Reviews --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['indeed'], operation: ['companyReviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Review page to fetch, 20 reviews per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
