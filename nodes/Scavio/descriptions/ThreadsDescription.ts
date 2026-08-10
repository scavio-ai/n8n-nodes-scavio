import type { INodeProperties } from 'n8n-workflow';

export const threadsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['threads'] } },
		options: [
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get a threads post',
				description: 'Get a single Threads post by post ID or threads.net URL. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/threads/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'postComments',
				action: 'Get threads post comments',
				description:
					'Get the replies to a Threads post, cursor-paginated through next_cursor. This operation takes a post ID only, never a handle, and always costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/threads/post/comments' } },
			},
			{
				name: 'Get Profile',
				value: 'profile',
				action: 'Get a threads profile',
				description:
					'Get profile details for a Threads user. Costs 2 credits when addressed by user ID and 4 when addressed by username.',
				routing: { request: { method: 'POST', url: '/api/v1/threads/profile' } },
			},
			{
				name: 'Get User Posts',
				value: 'userPosts',
				action: 'Get threads user posts',
				description:
					"Get a user's Threads posts, cursor-paginated through next_cursor. Costs 2 credits when addressed by user ID and 4 when addressed by username.",
				routing: { request: { method: 'POST', url: '/api/v1/threads/user/posts' } },
			},
			{
				name: 'Get User Replies',
				value: 'userReplies',
				action: 'Get threads user replies',
				description:
					"Get a user's Threads replies, cursor-paginated through next_cursor. Costs 2 credits when addressed by user ID and 4 when addressed by username.",
				routing: { request: { method: 'POST', url: '/api/v1/threads/user/replies' } },
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				action: 'Search threads users',
				description:
					'Find Threads profiles matching a name or handle. This is people search and it is the only search Threads exposes, there is no content or post search. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/threads/search/users' } },
			},
		],
		default: 'profile',
	},
];

export const threadsFields: INodeProperties[] = [
	// ── User identifier (profile, userPosts, userReplies) ──
	{
		displayName: 'Lookup By',
		name: 'userLookup',
		type: 'options',
		noDataExpression: true,
		default: 'user_id',
		displayOptions: {
			show: { resource: ['threads'], operation: ['profile', 'userPosts', 'userReplies'] },
		},
		options: [
			{
				name: 'User ID (2 Credits)',
				value: 'user_id',
				description: 'Address the user by numeric ID, the cheap path',
			},
			{
				name: 'Username (4 Credits)',
				value: 'username',
				description: 'Address the user by handle, which costs 2 extra credits',
			},
		],
		description:
			'Whether to address the user by numeric user ID or by handle. A handle costs 4 credits instead of 2 because it needs a second upstream lookup first, so pass the user ID whenever you already have it.',
	},
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '63625256886',
		displayOptions: {
			show: {
				resource: ['threads'],
				operation: ['profile', 'userPosts', 'userReplies'],
				userLookup: ['user_id'],
			},
		},
		routing: { request: { body: { user_id: '={{ $value }}' } } },
		description:
			'Numeric Threads user ID, as returned in the profile and in Search Users results. This is the 2 credit path.',
	},
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'zuck',
		displayOptions: {
			show: {
				resource: ['threads'],
				operation: ['profile', 'userPosts', 'userReplies'],
				userLookup: ['username'],
			},
		},
		routing: { request: { body: { username: '={{ $value }}' } } },
		description:
			'Threads handle without the @. Resolving a handle costs 4 credits, so run Get Profile once and reuse the user ID for later calls.',
	},

	// ── Post identifier (post) ──
	{
		displayName: 'Lookup By',
		name: 'postLookup',
		type: 'options',
		noDataExpression: true,
		default: 'url',
		displayOptions: { show: { resource: ['threads'], operation: ['post'] } },
		options: [
			{ name: 'Post ID', value: 'post_id' },
			{ name: 'Post URL', value: 'url' },
		],
		description: 'Whether to identify the post by its ID or by its full threads.net URL',
	},
	{
		displayName: 'Post URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.threads.net/@zuck/post/C1a2b3c4d5e',
		displayOptions: {
			show: { resource: ['threads'], operation: ['post'], postLookup: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full threads.net post URL',
	},
	{
		displayName: 'Post ID',
		name: 'post_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3141592653589793238',
		displayOptions: {
			show: { resource: ['threads'], operation: ['post'], postLookup: ['post_id'] },
		},
		routing: { request: { body: { post_id: '={{ $value }}' } } },
		description: 'Threads post ID, as returned in the post and user feed responses',
	},

	// ── Post ID (postComments) ──
	{
		displayName: 'Post ID',
		name: 'post_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3141592653589793238',
		displayOptions: { show: { resource: ['threads'], operation: ['postComments'] } },
		routing: { request: { body: { post_id: '={{ $value }}' } } },
		description:
			'Threads post ID to read replies for. This operation accepts a post ID only, so resolve a threads.net URL with Get Post first.',
	},

	// ── Query (searchUsers) ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'travel photographer',
		displayOptions: { show: { resource: ['threads'], operation: ['searchUsers'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Name or handle to match against Threads profiles. This searches people only, Threads has no content search.',
	},

	// ── Additional Options: cursor-paginated operations ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['threads'], operation: ['userPosts', 'userReplies', 'postComments'] },
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description:
					'Pagination cursor, taken from next_cursor in the previous response. Each page is a separate billed call.',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},
];
