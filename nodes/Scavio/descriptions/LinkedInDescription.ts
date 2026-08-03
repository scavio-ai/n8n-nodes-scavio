import type { INodeProperties } from 'n8n-workflow';

// The provider retired the linkedin/web/* namespace this node was built on. The
// nine operations below run on web_v2. Credit cost is not uniform: Get Person,
// Get Person About, Get Company and Get Post cost 1; Get Person Posts, Get
// Company Posts, Search Jobs and Get Post Comments cost 10 per page; Get Job
// costs 30. Five operations
// were dropped from the dropdown - Get Person Contact, Get Company People, Get
// Company Jobs, Search People and Search Posts - because their upstream is gone
// and the API answers them with 410; offering a broken choice in a visual node
// is worse than not offering it.
//
// Every reference field also accepts a full LinkedIn URL: the API passes a URL
// straight through instead of building one from a handle.

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
				description: 'Get the profile for a LinkedIn company, including locations and related companies',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/company' } },
			},
			{
				name: 'Get Company Posts',
				value: 'companyPosts',
				action: 'Get linked in company posts',
				description: "Get a company's recent posts, 50 per page",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/company/posts' } },
			},
			{
				name: 'Get Job',
				value: 'job',
				action: 'Get a linked in job',
				description: 'Get full details for a single job listing, including the hiring company',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/job' } },
			},
			{
				name: 'Get Person',
				value: 'person',
				action: 'Get a linked in person',
				description: "Get a member's full profile, work experience and education",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person' } },
			},
			{
				name: 'Get Person About',
				value: 'personAbout',
				action: 'Get linked in person about',
				description: "Get the about, experience, education and links sections of a member's profile",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person/about' } },
			},
			{
				name: 'Get Person Posts',
				value: 'personPosts',
				action: 'Get linked in person posts',
				description: "Get a member's posts, comments, or reactions, 50 per page",
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/person/posts' } },
			},
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get a linked in post',
				description: 'Get full details for a single post, including its top comments',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'postComments',
				action: 'Get linked in post comments',
				description: 'Get the comments on a post with their replies, 10 per page',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/post/comments' } },
			},
			{
				name: 'Search Jobs',
				value: 'searchJobs',
				action: 'Search linked in jobs',
				description: 'Search job listings by keyword and optional location, 25 per page',
				routing: { request: { method: 'POST', url: '/api/v1/linkedin/search/jobs' } },
			},
		],
		default: 'person',
	},
];

export const linkedinFields: INodeProperties[] = [
	// -- Shared username (person, personAbout, personPosts) --
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
				operation: ['person', 'personAbout', 'personPosts'],
			},
		},
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'Public identifier (vanity handle) of the member, or a full LinkedIn profile URL',
	},

	// -- Shared company (company, companyPosts) --
	{
		displayName: 'Company',
		name: 'company',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'microsoft',
		displayOptions: {
			show: { resource: ['linkedin'], operation: ['company', 'companyPosts'] },
		},
		routing: { request: { body: { company: '={{ $value }}' } } },
		description: 'Company universal name (slug), or a full LinkedIn company URL',
	},

	// -- job_id (job) --
	{
		displayName: 'Job ID',
		name: 'job_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4415427228',
		displayOptions: { show: { resource: ['linkedin'], operation: ['job'] } },
		routing: { request: { body: { job_id: '={{ $value }}' } } },
		description: 'The numeric ID of the job listing, or a full LinkedIn job URL',
	},

	// -- Shared post_id (post, postComments) --
	{
		displayName: 'Post ID',
		name: 'post_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7488618410256523265',
		displayOptions: { show: { resource: ['linkedin'], operation: ['post', 'postComments'] } },
		routing: { request: { body: { post_id: '={{ $value }}' } } },
		description: 'Post ID, activity urn, or a full LinkedIn post URL',
	},

	// -- Search keyword (searchJobs) --
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'software engineer',
		displayOptions: { show: { resource: ['linkedin'], operation: ['searchJobs'] } },
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'Keyword to search for. Use a company name to approximate a per-company job listing.',
	},

	// -- Additional Options: Person Posts (feed type + paging) --
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
				description: 'Next_cursor from a previous response, to fetch the following page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Feed Type',
				name: 'type',
				type: 'options',
				default: 'posts',
				description: 'Which feed to return',
				options: [
					{ name: 'Posts', value: 'posts', description: "The member's own posts" },
					{ name: 'Comments', value: 'comments', description: 'Posts the member commented on' },
					{ name: 'Reactions', value: 'reactions', description: 'Posts the member reacted to' },
				],
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Company Posts (paging) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['companyPosts'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Next_cursor from a previous response, to fetch the following page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Search Jobs --
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
				description: 'Next_cursor from a previous response, to fetch the following page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'United States',
				description: 'Geographic filter. Leave empty to search everywhere.',
				routing: { request: { body: { location: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Post Comments --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['linkedin'], operation: ['postComments'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number. Page size varies, so keep going until a page is empty.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
