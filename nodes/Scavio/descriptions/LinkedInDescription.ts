import type { INodeProperties } from 'n8n-workflow';

export const linkedinOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['linkedin'] } },
		options: [
			{
				name: 'Get Company',
				value: 'company',
				action: 'Get a linked in company',
				description: 'Get the profile for a LinkedIn company',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/company' } },
			},
			{
				name: 'Get Company Jobs',
				value: 'companyJobs',
				action: 'Get linked in company jobs',
				description: "Get a company's open job listings",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/company/jobs' } },
			},
			{
				name: 'Get Company People',
				value: 'companyPeople',
				action: 'Get linked in company people',
				description: 'Get people who work at a company',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/company/people' } },
			},
			{
				name: 'Get Company Posts',
				value: 'companyPosts',
				action: 'Get linked in company posts',
				description: "Get a company's recent posts",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/company/posts' } },
			},
			{
				name: 'Get Job',
				value: 'job',
				action: 'Get a linked in job',
				description: 'Get full details for a single job listing',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/job' } },
			},
			{
				name: 'Get Person',
				value: 'person',
				action: 'Get a linked in person',
				description: 'Get the full profile for a LinkedIn member',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person' } },
			},
			{
				name: 'Get Person About',
				value: 'personAbout',
				action: 'Get linked in person about',
				description: 'Get about/overview metadata for a member',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person/about' } },
			},
			{
				name: 'Get Person Contact',
				value: 'personContact',
				action: 'Get linked in person contact',
				description: 'Get public contact info for a member',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person/contact' } },
			},
			{
				name: 'Get Person Posts',
				value: 'personPosts',
				action: 'Get linked in person posts',
				description: "Get a member's recent posts",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person/posts' } },
			},
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get a linked in post',
				description: 'Get full details for a single post',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'postComments',
				action: 'Get linked in post comments',
				description: 'Get comments on a post',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/post/comments' } },
			},
			{
				name: 'Search Jobs',
				value: 'searchJobs',
				action: 'Search linked in jobs',
				description: 'Search for jobs by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/search/jobs' } },
			},
			{
				name: 'Search People',
				value: 'searchPeople',
				action: 'Search linked in people',
				description: 'Search for people by name, title, company, or school',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/search/people' } },
			},
			{
				name: 'Search Posts',
				value: 'searchPosts',
				action: 'Search linked in posts',
				description: 'Search for posts by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/search/posts' } },
			},
		],
		default: 'person',
	},
];

export const linkedinFields: INodeProperties[] = [
	// ── Shared username (person, personAbout, personContact, personPosts) ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'williamhgates',
		displayOptions: {
			show: {
				resource: ['linkedin'],
				operation: ['person', 'personAbout', 'personContact', 'personPosts'],
			},
		},
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'Public identifier (vanity handle) of the member',
	},

	// ── Shared company (company, companyPosts, companyPeople, companyJobs) ──
	{
		displayName: 'Company',
		name: 'company',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'microsoft',
		displayOptions: {
			show: {
				resource: ['linkedin'],
				operation: ['company', 'companyPosts', 'companyPeople', 'companyJobs'],
			},
		},
		routing: { request: { body: { company: '={{ $value }}' } } },
		description: 'Company universal name (slug) or LinkedIn company URL',
	},

	// ── job_id (job) ──
	{
		displayName: 'Job ID',
		name: 'job_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3900000000',
		displayOptions: { show: { resource: ['linkedin'], operation: ['job'] } },
		routing: { request: { body: { job_id: '={{ $value }}' } } },
		description: 'The numeric ID of the job listing',
	},

	// ── Shared post_id (post, postComments) ──
	{
		displayName: 'Post ID',
		name: 'post_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7486820977411145728',
		displayOptions: { show: { resource: ['linkedin'], operation: ['post', 'postComments'] } },
		routing: { request: { body: { post_id: '={{ $value }}' } } },
		description: 'Post ID or activity urn',
	},

	// ── Shared search keyword (searchJobs, searchPosts) ──
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'software engineer',
		displayOptions: { show: { resource: ['linkedin'], operation: ['searchJobs', 'searchPosts'] } },
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'Keyword to search for',
	},

	// ── Additional Options: Get Person ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['person'] } },
		options: [
			{
				displayName: 'Include Certifications',
				name: 'include_certifications',
				type: 'boolean',
				default: true,
				routing: { request: { body: { include_certifications: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Educations',
				name: 'include_educations',
				type: 'boolean',
				default: true,
				routing: { request: { body: { include_educations: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Experiences',
				name: 'include_experiences',
				type: 'boolean',
				default: true,
				routing: { request: { body: { include_experiences: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Follower and Connection',
				name: 'include_follower_and_connection',
				type: 'boolean',
				default: true,
				routing: { request: { body: { include_follower_and_connection: '={{ $value }}' } } },
			},
			{
				displayName: 'Include Skills',
				name: 'include_skills',
				type: 'boolean',
				default: true,
				routing: { request: { body: { include_skills: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Person About / Person Posts (urn override + cursor) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['personAbout'] } },
		options: [
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				description: 'Member urn. Overrides the resolved username if provided.',
				routing: { request: { body: { urn: '={{ $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['personPosts'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				description: 'Member urn. Overrides the resolved username if provided.',
				routing: { request: { body: { urn: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Company Posts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['companyPosts'] } },
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Number of posts to return',
				routing: { request: { body: { count: '={{ $value }}' } } },
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

	// ── Additional Options: Company People / Company Jobs (company_id override + cursor) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['companyPeople', 'companyJobs'] } },
		options: [
			{
				displayName: 'Company ID',
				name: 'company_id',
				type: 'string',
				default: '',
				description: 'Numeric company ID. Overrides the resolved company if provided.',
				routing: { request: { body: { company_id: '={{ $value }}' } } },
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

	// ── Additional Options: Get Job ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['job'] } },
		options: [
			{
				displayName: 'Include Skills',
				name: 'include_skills',
				type: 'boolean',
				default: false,
				routing: { request: { body: { include_skills: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Post Comments ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['postComments'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Post Type',
				name: 'post_type',
				type: 'options',
				default: 'activity',
				options: [
					{ name: 'Activity', value: 'activity' },
					{ name: 'UGC', value: 'ugc' },
				],
				routing: { request: { body: { post_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort Order',
				name: 'sort_order',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Recent', value: 'recent' },
					{ name: 'Relevance', value: 'relevance' },
				],
				routing: { request: { body: { sort_order: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Search People ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['searchPeople'] } },
		options: [
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				default: '',
				routing: { request: { body: { company: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Page cursor (page number)',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'A geo name or ID to filter by',
				routing: { request: { body: { location: '={{ $value }}' } } },
			},
			{
				displayName: 'Name',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Name to search for',
				routing: { request: { body: { search: '={{ $value }}' } } },
			},
			{
				displayName: 'School',
				name: 'school',
				type: 'string',
				default: '',
				routing: { request: { body: { school: '={{ $value }}' } } },
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				placeholder: 'engineer',
				routing: { request: { body: { title: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Search Jobs ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['searchJobs'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Page cursor (page number)',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Date Posted',
				name: 'date_posted',
				type: 'string',
				default: '',
				routing: { request: { body: { date_posted: '={{ $value }}' } } },
			},
			{
				displayName: 'Experience Level',
				name: 'experience_level',
				type: 'string',
				default: '',
				routing: { request: { body: { experience_level: '={{ $value }}' } } },
			},
			{
				displayName: 'Geocode',
				name: 'geocode',
				type: 'string',
				default: '',
				routing: { request: { body: { geocode: '={{ $value }}' } } },
			},
			{
				displayName: 'Job Type',
				name: 'job_type',
				type: 'string',
				default: '',
				routing: { request: { body: { job_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Remote',
				name: 'remote',
				type: 'string',
				default: '',
				routing: { request: { body: { remote: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Search Posts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['searchPosts'] } },
		options: [
			{
				displayName: 'Content Type',
				name: 'content_type',
				type: 'string',
				default: '',
				routing: { request: { body: { content_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Page cursor (page number)',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Date Posted',
				name: 'date_posted',
				type: 'string',
				default: '',
				routing: { request: { body: { date_posted: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'string',
				default: '',
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
		],
	},
];
