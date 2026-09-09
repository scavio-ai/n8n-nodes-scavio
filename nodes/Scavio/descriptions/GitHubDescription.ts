import type { INodeProperties } from 'n8n-workflow';

export const githubOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['github'] } },
		options: [
			{
				name: 'Get Issue',
				value: 'getIssue',
				action: 'Get a github issue or pull request',
				description: 'Fetch a single issue or pull request',
				routing: { request: { method: 'POST', url: '/api/v1/github/issue' } },
			},
			{
				name: 'Get Issue Comments',
				value: 'getIssueComments',
				action: 'Get github issue comments',
				description: 'Get the comments on an issue or pull request',
				routing: { request: { method: 'POST', url: '/api/v1/github/issue/comments' } },
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				action: 'Get a github profile',
				description: "Get a GitHub user's public profile",
				routing: { request: { method: 'POST', url: '/api/v1/github/profile' } },
			},
			{
				name: 'Get Profile Repos',
				value: 'getProfileRepos',
				action: 'Get github profile repos',
				description: "Get a user's repositories",
				routing: { request: { method: 'POST', url: '/api/v1/github/profile/repos' } },
			},
			{
				name: 'Get Repo',
				value: 'getRepo',
				action: 'Get a github repo',
				description: "Get a repository's stars, forks, issues, license, topics and metadata",
				routing: { request: { method: 'POST', url: '/api/v1/github/repo' } },
			},
			{
				name: 'Get Repo Dossier',
				value: 'getRepoDossier',
				action: 'Get github repo dossier',
				description: 'Composite profile: metadata, README excerpt, releases, top issues, languages, contributors',
				routing: { request: { method: 'POST', url: '/api/v1/github/repo/dossier' } },
			},
			{
				name: 'Get Repo Issues',
				value: 'getRepoIssues',
				action: 'Get github repo issues',
				description: "Get a repository's issues (PRs filtered out by default)",
				routing: { request: { method: 'POST', url: '/api/v1/github/repo/issues' } },
			},
			{
				name: 'Get Repo README',
				value: 'getRepoReadme',
				action: 'Get github repo readme',
				description: "Get a repository's README as decoded markdown",
				routing: { request: { method: 'POST', url: '/api/v1/github/repo/readme' } },
			},
			{
				name: 'Get Repo Releases',
				value: 'getRepoReleases',
				action: 'Get github repo releases',
				description: "Get a repository's releases with assets and download counts",
				routing: { request: { method: 'POST', url: '/api/v1/github/repo/releases' } },
			},
			{
				name: 'Get Repo Top Issues',
				value: 'getRepoTopIssues',
				action: 'Get github repo top issues',
				description: "Get a repository's most-reacted open issues",
				routing: { request: { method: 'POST', url: '/api/v1/github/repo/top-issues' } },
			},
			{
				name: 'Get User Email',
				value: 'getUserEmail',
				action: 'Get github user email',
				description: 'Resolve a username to public commit email(s) via commit-metadata OSINT',
				routing: { request: { method: 'POST', url: '/api/v1/github/user/email' } },
			},
			{
				name: 'Get User Profile Velocity',
				value: 'getUserProfileVelocity',
				action: 'Get github profile velocity',
				description: "A user's public-activity velocity: event counts, active days, events/week",
				routing: { request: { method: 'POST', url: '/api/v1/github/user/profile-velocity' } },
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search github',
				description: 'Search repositories, users, issues, code or commits',
				routing: { request: { method: 'POST', url: '/api/v1/github/search' } },
			},
		],
		default: 'getProfile',
	},
];

export const githubFields: INodeProperties[] = [
	// ── Shared handle (getProfile, getProfileRepos, getUserProfileVelocity, getUserEmail) ──
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'torvalds',
		displayOptions: {
			show: {
				resource: ['github'],
				operation: ['getProfile', 'getProfileRepos', 'getUserProfileVelocity', 'getUserEmail'],
			},
		},
		routing: { request: { body: { handle: '={{ $value }}' } } },
		description: 'GitHub username, @handle, or a github.com/<user> URL',
	},

	// ── Shared repo URL (getRepo, getRepoReadme, getRepoReleases, getRepoIssues, getRepoTopIssues, getRepoDossier) ──
	{
		displayName: 'Repository URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'facebook/react',
		displayOptions: {
			show: {
				resource: ['github'],
				operation: ['getRepo', 'getRepoReadme', 'getRepoReleases', 'getRepoIssues', 'getRepoTopIssues', 'getRepoDossier'],
			},
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A github.com/<owner>/<repo> URL or bare <owner>/<repo>',
	},

	// ── Issue URL (getIssue, getIssueComments) ──
	{
		displayName: 'Issue URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'facebook/react#37330',
		displayOptions: {
			show: {
				resource: ['github'],
				operation: ['getIssue', 'getIssueComments'],
			},
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'An issue/PR URL (.../issues/<n> or .../pull/<n>) or <owner>/<repo>#<n>',
	},

	// ── Search query ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'machine learning',
		displayOptions: { show: { resource: ['github'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Free-text GitHub search query',
	},

	// ── Additional Options: getProfileRepos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['getProfileRepos'] } },
		options: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Owner', value: 'owner' },
					{ name: 'Member', value: 'member' },
				],
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'updated',
				options: [
					{ name: 'Created', value: 'created' },
					{ name: 'Full Name', value: 'full_name' },
					{ name: 'Pushed', value: 'pushed' },
					{ name: 'Updated', value: 'updated' },
				],
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				default: 'desc',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				routing: { request: { body: { direction: '={{ $value }}' } } },
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Items per page, 1-100',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getRepoReleases ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['getRepoReleases'] } },
		options: [
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Items per page, 1-100',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getRepoIssues ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['getRepoIssues'] } },
		options: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'issue',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Issues Only', value: 'issue' },
					{ name: 'Pull Requests Only', value: 'pr' },
				],
				description: 'Filter by issue or PR',
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'options',
				default: 'open',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Closed', value: 'closed' },
					{ name: 'Open', value: 'open' },
				],
				routing: { request: { body: { state: '={{ $value }}' } } },
			},
			{
				displayName: 'Labels',
				name: 'labels',
				type: 'string',
				default: '',
				description: 'Comma-separated label names',
				routing: { request: { body: { labels: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'created',
				options: [
					{ name: 'Comments', value: 'comments' },
					{ name: 'Created', value: 'created' },
					{ name: 'Updated', value: 'updated' },
				],
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				default: 'desc',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				routing: { request: { body: { direction: '={{ $value }}' } } },
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'string',
				default: '',
				description: 'ISO8601 timestamp; only issues updated at or after this time',
				routing: { request: { body: { since: '={{ $value }}' } } },
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Items per page, 1-100',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getIssueComments ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['getIssueComments'] } },
		options: [
			{
				displayName: 'Since',
				name: 'since',
				type: 'string',
				default: '',
				description: 'ISO8601 timestamp; only comments updated at or after this time',
				routing: { request: { body: { since: '={{ $value }}' } } },
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Items per page, 1-100',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: search ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['search'] } },
		options: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'repositories',
				options: [
					{ name: 'Code', value: 'code' },
					{ name: 'Commits', value: 'commits' },
					{ name: 'Issues', value: 'issues' },
					{ name: 'Repositories', value: 'repositories' },
					{ name: 'Users', value: 'users' },
				],
				description: 'Search vertical',
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'string',
				default: '',
				description: 'GitHub sort field (e.g. stars, forks, updated, reactions)',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'options',
				default: 'desc',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				routing: { request: { body: { order: '={{ $value }}' } } },
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Items per page, 1-100',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getRepoTopIssues ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['getRepoTopIssues'] } },
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'reactions',
				options: [
					{ name: 'Comments', value: 'comments' },
					{ name: 'Reactions', value: 'reactions' },
				],
				description: 'Rank by reactions (default) or comments',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Per Page',
				name: 'per_page',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Number of issues to return, default 10',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getUserProfileVelocity ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['github'], operation: ['getUserProfileVelocity'] } },
		options: [
			{
				displayName: 'Depth',
				name: 'depth',
				type: 'options',
				default: 'default',
				options: [
					{ name: 'Quick (1 page)', value: 'quick' },
					{ name: 'Default (up to 3 pages)', value: 'default' },
					{ name: 'Deep (up to 3 pages)', value: 'deep' },
				],
				description: 'How many pages of events to scan',
				routing: { request: { body: { depth: '={{ $value }}' } } },
			},
		],
	},
];
