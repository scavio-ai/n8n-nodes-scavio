import type { INodeProperties } from 'n8n-workflow';

export const instagramOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['instagram'] } },
		options: [
			{
				name: 'Get Comment Replies',
				value: 'commentReplies',
				action: 'Get instagram comment replies',
				description: 'Get replies to an Instagram comment',
				routing: {
					request: { method: 'POST', url: '/api/v1/instagram/post/comments/replies' },
				},
			},
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get an instagram post',
				description: 'Fetch details for a single Instagram post by URL, media ID, or shortcode',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'postComments',
				action: 'Get instagram post comments',
				description: 'Get comments on an Instagram post',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/post/comments' } },
			},
			{
				name: 'Get Profile',
				value: 'profile',
				action: 'Get an instagram profile',
				description: 'Get an Instagram user profile by username or user ID',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/profile' } },
			},
			{
				name: 'Get User Followers',
				value: 'userFollowers',
				action: 'Get instagram user followers',
				description: "Get an Instagram user's followers",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/followers' } },
			},
			{
				name: 'Get User Followings',
				value: 'userFollowings',
				action: 'Get instagram user followings',
				description: "List an Instagram user's followings",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/followings' } },
			},
			{
				name: 'Get User Posts',
				value: 'userPosts',
				action: 'Get instagram user posts',
				description: "List an Instagram user's posts",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/posts' } },
			},
			{
				name: 'Get User Reels',
				value: 'userReels',
				action: 'Get instagram user reels',
				description: "List an Instagram user's reels",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/reels' } },
			},
			{
				name: 'Get User Stories',
				value: 'userStories',
				action: 'Get instagram user stories',
				description: "Get an Instagram user's stories",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/stories' } },
			},
			{
				name: 'Get User Tagged',
				value: 'userTagged',
				action: 'Get instagram user tagged posts',
				description: 'List posts an Instagram user is tagged in',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/tagged' } },
			},
			{
				name: 'Search Hashtags',
				value: 'searchHashtags',
				action: 'Search instagram hashtags',
				description: 'Search Instagram hashtags by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/search/hashtags' } },
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				action: 'Search instagram users',
				description: 'Search Instagram users by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/search/users' } },
			},
		],
		default: 'profile',
	},
];

export const instagramFields: INodeProperties[] = [
	// ── Get Profile fields ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		default: '',
		placeholder: 'instagram',
		displayOptions: { show: { resource: ['instagram'], operation: ['profile'] } },
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'Instagram username (without @). Either username or User ID is required.',
	},
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		placeholder: '25025320',
		displayOptions: { show: { resource: ['instagram'], operation: ['profile'] } },
		routing: { request: { body: { user_id: '={{ $value }}' } } },
		description: 'The Instagram user ID. Either username or User ID is required.',
	},

	// ── Shared username for user-based operations ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		default: '',
		placeholder: 'instagram',
		displayOptions: {
			show: {
				resource: ['instagram'],
				operation: [
					'userPosts',
					'userReels',
					'userTagged',
					'userStories',
					'userFollowers',
					'userFollowings',
				],
			},
		},
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'Instagram username (without @). Either username or User ID is required.',
	},
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		default: '',
		placeholder: '25025320',
		displayOptions: {
			show: {
				resource: ['instagram'],
				operation: [
					'userPosts',
					'userReels',
					'userTagged',
					'userStories',
					'userFollowers',
					'userFollowings',
				],
			},
		},
		routing: { request: { body: { user_id: '={{ $value }}' } } },
		description: 'The Instagram user ID. Either username or User ID is required.',
	},

	// ── Get Post fields ──
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.instagram.com/p/ABC123/',
		displayOptions: { show: { resource: ['instagram'], operation: ['post'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Instagram post URL. One of URL, Media ID, or Shortcode is required.',
	},
	{
		displayName: 'Media ID',
		name: 'media_id',
		type: 'string',
		default: '',
		placeholder: '3123456789012345678',
		displayOptions: { show: { resource: ['instagram'], operation: ['post'] } },
		routing: { request: { body: { media_id: '={{ $value }}' } } },
		description: 'Instagram media ID. One of URL, Media ID, or Shortcode is required.',
	},
	{
		displayName: 'Shortcode',
		name: 'shortcode',
		type: 'string',
		default: '',
		placeholder: 'ABC123',
		displayOptions: { show: { resource: ['instagram'], operation: ['post'] } },
		routing: { request: { body: { shortcode: '={{ $value }}' } } },
		description: 'Instagram post shortcode. One of URL, Media ID, or Shortcode is required.',
	},

	// ── Get Post Comments fields ──
	{
		displayName: 'Shortcode',
		name: 'shortcode',
		type: 'string',
		default: '',
		placeholder: 'ABC123',
		displayOptions: { show: { resource: ['instagram'], operation: ['postComments'] } },
		routing: { request: { body: { shortcode: '={{ $value }}' } } },
		description: 'Instagram post shortcode. Either Shortcode or URL is required.',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.instagram.com/p/ABC123/',
		displayOptions: { show: { resource: ['instagram'], operation: ['postComments'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Instagram post URL. Either Shortcode or URL is required.',
	},

	// ── Media ID for Get Comment Replies ──
	{
		displayName: 'Media ID',
		name: 'media_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3123456789012345678',
		displayOptions: { show: { resource: ['instagram'], operation: ['commentReplies'] } },
		routing: { request: { body: { media_id: '={{ $value }}' } } },
		description: 'Instagram media ID. Obtain from Get Post Comments.',
	},

	// ── Comment ID for Get Comment Replies ──
	{
		displayName: 'Comment ID',
		name: 'comment_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '17900000000000000',
		displayOptions: { show: { resource: ['instagram'], operation: ['commentReplies'] } },
		routing: { request: { body: { comment_id: '={{ $value }}' } } },
		description: 'Instagram comment ID. Obtain from Get Post Comments.',
	},

	// ── Shared keyword for search operations ──
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'travel',
		displayOptions: {
			show: { resource: ['instagram'], operation: ['searchUsers', 'searchHashtags'] },
		},
		routing: { request: { body: { keyword: '={{ $value }}' } } },
		description: 'Search keyword',
	},

	// ── Additional Options: userPosts + userReels + userTagged ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['instagram'],
				operation: ['userPosts', 'userReels', 'userTagged'],
			},
		},
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
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 12,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of items to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: userFollowers + userFollowings ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['instagram'],
				operation: ['userFollowers', 'userFollowings'],
			},
		},
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
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 12,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Number of users to return (1-100)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: postComments ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['instagram'], operation: ['postComments'] } },
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
				displayName: 'Sort Order',
				name: 'sort_order',
				type: 'options',
				default: 'popular',
				options: [
					{ name: 'Popular', value: 'popular' },
					{ name: 'Newest', value: 'newest' },
				],
				routing: { request: { body: { sort_order: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: commentReplies ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['instagram'], operation: ['commentReplies'] } },
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

	// ── Additional Options: searchUsers + searchHashtags ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['instagram'], operation: ['searchUsers', 'searchHashtags'] },
		},
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
