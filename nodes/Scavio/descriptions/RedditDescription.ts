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
				name: 'Get Comment Replies',
				value: 'commentReplies',
				action: 'Get reddit comment replies',
				description: 'Get replies to a specific comment',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/post/comments/replies' } },
			},
			{
				name: 'Get Popular',
				value: 'popular',
				action: 'Get reddit popular feed',
				description: 'Get the site-wide popular feed',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/popular' } },
			},
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get a reddit post',
				description:
					"Fetch a Reddit post's metadata. Comments are a separate call, use Get Post Comments.",
				routing: { request: { method: 'POST', url: '/api/v1/reddit/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'postComments',
				action: 'Get reddit post comments',
				description: 'Get the top-level comments for a post',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/post/comments' } },
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get reddit search suggestions',
				description: 'Get autocomplete suggestions for a query',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/search/suggestions' } },
			},
			{
				name: 'Get Subreddit',
				value: 'subreddit',
				action: 'Get a reddit subreddit',
				description: 'Get metadata for a subreddit',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/subreddit' } },
			},
			{
				name: 'Get Subreddit Posts',
				value: 'subredditPosts',
				action: 'Get reddit subreddit posts',
				description: "Get a subreddit's post feed",
				routing: { request: { method: 'POST', url: '/api/v1/reddit/subreddit/posts' } },
			},
			{
				name: 'Get Trending',
				value: 'trending',
				action: 'Get reddit trending searches',
				description: 'Get the current trending search queries',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/trending' } },
			},
			{
				name: 'Get User',
				value: 'user',
				action: 'Get a reddit user',
				description: "Get a redditor's profile",
				routing: { request: { method: 'POST', url: '/api/v1/reddit/user' } },
			},
			{
				name: 'Get User Comments',
				value: 'userComments',
				action: 'Get reddit user comments',
				description: "Get a redditor's comments",
				routing: { request: { method: 'POST', url: '/api/v1/reddit/user/comments' } },
			},
			{
				name: 'Get User Posts',
				value: 'userPosts',
				action: 'Get reddit user posts',
				description: "Get a redditor's submitted posts",
				routing: { request: { method: 'POST', url: '/api/v1/reddit/user/posts' } },
			},
			{
				name: 'Search Posts',
				value: 'search',
				action: 'Search reddit posts',
				description: 'Search Reddit and return matching posts',
				routing: { request: { method: 'POST', url: '/api/v1/reddit/search' } },
			},
		],
		default: 'search',
	},
];

const SORTS = [
	{ name: 'Best', value: 'BEST' },
	{ name: 'Controversial', value: 'CONTROVERSIAL' },
	{ name: 'Hot', value: 'HOT' },
	{ name: 'New', value: 'NEW' },
	{ name: 'Top', value: 'TOP' },
];

const FEED_SORTS = [
	{ name: 'Best', value: 'BEST' },
	{ name: 'Controversial', value: 'CONTROVERSIAL' },
	{ name: 'Hot', value: 'HOT' },
	{ name: 'New', value: 'NEW' },
	{ name: 'Rising', value: 'RISING' },
	{ name: 'Top', value: 'TOP' },
];

export const redditFields: INodeProperties[] = [
	// ── Shared query (search, suggestions) ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'n8n automation',
		displayOptions: { show: { resource: ['reddit'], operation: ['search', 'suggestions'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Reddit search query',
	},

	// ── Post lookup (post) ──
	{
		displayName: 'Lookup By',
		name: 'postLookup',
		type: 'options',
		noDataExpression: true,
		default: 'url',
		displayOptions: { show: { resource: ['reddit'], operation: ['post'] } },
		options: [
			{ name: 'Post ID', value: 'post_id' },
			{ name: 'Post URL', value: 'url' },
		],
		description: 'Whether to identify the post by its ID or by its full URL',
	},
	{
		displayName: 'Post URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.reddit.com/r/programming/comments/abc123/example/',
		displayOptions: {
			show: { resource: ['reddit'], operation: ['post'], postLookup: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full Reddit post URL (typically returned by Search Posts)',
	},
	{
		displayName: 'Post ID',
		name: 'post_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 't3_1v6ngaf',
		displayOptions: {
			show: { resource: ['reddit'], operation: ['post'], postLookup: ['post_id'] },
		},
		routing: { request: { body: { post_id: '={{ $value }}' } } },
		description: 'Post fullname (t3_...) or bare ID, as returned in post_id by Search Posts',
	},

	// ── Shared post_id (postComments, commentReplies) ──
	{
		displayName: 'Post ID',
		name: 'post_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 't3_1v6ngaf',
		displayOptions: { show: { resource: ['reddit'], operation: ['postComments', 'commentReplies'] } },
		routing: { request: { body: { post_id: '={{ $value }}' } } },
		description: 'Post fullname (t3_...) or bare ID',
	},

	// ── Reply Cursor (commentReplies, required) ──
	{
		displayName: 'Reply Cursor',
		name: 'cursor',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['reddit'], operation: ['commentReplies'] } },
		routing: { request: { body: { cursor: '={{ $value }}' } } },
		description: 'The reply_cursor from a comment returned by the Get Post Comments operation',
	},

	// ── Shared subreddit (subreddit, subredditPosts) ──
	{
		displayName: 'Subreddit',
		name: 'subreddit',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'AskReddit',
		displayOptions: { show: { resource: ['reddit'], operation: ['subreddit', 'subredditPosts'] } },
		routing: { request: { body: { subreddit: '={{ $value }}' } } },
		description: 'The subreddit name (without r/)',
	},

	// ── Shared username (user, userPosts, userComments) ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'spez',
		displayOptions: {
			show: { resource: ['reddit'], operation: ['user', 'userPosts', 'userComments'] },
		},
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'The redditor username (without u/)',
	},

	// ── Additional Options: Search Posts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['search'] } },
		options: [
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

	// ── Additional Options: Post Comments ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['postComments'] } },
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
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'TOP',
				options: SORTS,
				description: 'Comment sort order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Comment Replies ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['commentReplies'] } },
		options: [
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'TOP',
				options: SORTS,
				description: 'Comment sort order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Subreddit Posts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['subredditPosts'] } },
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
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'HOT',
				options: FEED_SORTS,
				description: 'Post feed sort order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: User Posts / User Comments ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['userPosts', 'userComments'] } },
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
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'NEW',
				options: SORTS,
				description: 'Sort order',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Popular ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['reddit'], operation: ['popular'] } },
		options: [
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
