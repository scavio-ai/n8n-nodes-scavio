import type { INodeProperties } from 'n8n-workflow';

export const tiktokOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tiktok'] } },
		options: [
			{
				name: 'Get Comment Replies',
				value: 'getCommentReplies',
				action: 'Get tiktok comment replies',
				description: 'Get replies to a TikTok comment',
				routing: {
					request: { method: 'POST', url: '/api/v1/tiktok/video/comments/replies' },
				},
			},
			{
				name: 'Get Hashtag',
				value: 'getHashtag',
				action: 'Get a tiktok hashtag',
				description: 'Get TikTok hashtag info by name or ID',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/hashtag' } },
			},
			{
				name: 'Get Hashtag Videos',
				value: 'getHashtagVideos',
				action: 'Get tiktok hashtag videos',
				description: 'List videos under a TikTok hashtag',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/hashtag/videos' } },
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				action: 'Get a tiktok profile',
				description: 'Get a TikTok user profile by username or sec_user_id',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/profile' } },
			},
			{
				name: 'Get User Followers',
				value: 'getUserFollowers',
				action: 'Get tiktok user followers',
				description: "Get a TikTok user's followers",
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/followers' } },
			},
			{
				name: 'Get User Followings',
				value: 'getUserFollowings',
				action: 'Get tiktok user followings',
				description: "List a TikTok user's followings",
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/followings' } },
			},
			{
				name: 'Get User Posts',
				value: 'getUserPosts',
				action: 'Get tiktok user posts',
				description: "List a TikTok user's videos",
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/posts' } },
			},
			{
				name: 'Get Video',
				value: 'getVideo',
				action: 'Get a tiktok video',
				description: 'Fetch details for a single TikTok video',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/video' } },
			},
			{
				name: 'Get Video Comments',
				value: 'getVideoComments',
				action: 'Get tiktok video comments',
				description: 'Get comments on a TikTok video',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/video/comments' } },
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				action: 'Search tiktok users',
				description: 'Search TikTok users by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/search/users' } },
			},
			{
				name: 'Search Videos',
				value: 'searchVideos',
				action: 'Search tiktok videos',
				description: 'Search TikTok videos by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/search/videos' } },
			},
		],
		default: 'getProfile',
	},
];

export const tiktokFields: INodeProperties[] = [
	// ── Get Profile fields ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		default: '',
		placeholder: 'charlidamelio',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getProfile'] } },
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'TikTok username (without @). Either username or Sec User ID is required.',
	},
	{
		displayName: 'Sec User ID',
		name: 'sec_user_id',
		type: 'string',
		default: '',
		placeholder: 'MS4wLjABAAAA...',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getProfile'] } },
		routing: { request: { body: { sec_user_id: '={{ $value }}' } } },
		description: 'The sec_user_id from TikTok. Either username or Sec User ID is required.',
	},

	// ── Shared sec_user_id for user-based operations ──
	{
		displayName: 'Sec User ID',
		name: 'sec_user_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MS4wLjABAAAA...',
		displayOptions: {
			show: {
				resource: ['tiktok'],
				operation: ['getUserPosts', 'getUserFollowers', 'getUserFollowings'],
			},
		},
		routing: { request: { body: { sec_user_id: '={{ $value }}' } } },
		description: 'The sec_user_id of the TikTok user. Obtain from the Get Profile operation.',
	},

	// ── Shared video_id ──
	{
		displayName: 'Video ID',
		name: 'video_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7123456789012345678',
		displayOptions: {
			show: {
				resource: ['tiktok'],
				operation: ['getVideo', 'getVideoComments', 'getCommentReplies'],
			},
		},
		routing: { request: { body: { video_id: '={{ $value }}' } } },
		description: 'TikTok video ID',
	},

	// ── Comment ID for replies ──
	{
		displayName: 'Comment ID',
		name: 'comment_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7123456789012345678',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getCommentReplies'] } },
		routing: { request: { body: { comment_id: '={{ $value }}' } } },
		description: 'TikTok comment ID. Obtain from Get Video Comments.',
	},

	// ── Shared keyword for search operations ──
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cooking recipes',
		displayOptions: {
			show: { resource: ['tiktok'], operation: ['searchVideos', 'searchUsers'] },
		},
		routing: { request: { body: { keyword: '={{ $value }}' } } },
		description: 'Search keyword',
	},

	// ── Get Hashtag fields ──
	{
		displayName: 'Hashtag Name',
		name: 'hashtag_name',
		type: 'string',
		default: '',
		placeholder: 'fyp',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getHashtag'] } },
		routing: { request: { body: { hashtag_name: '={{ $value }}' } } },
		description: 'Hashtag name (without #). Either hashtag name or ID is required.',
	},
	{
		displayName: 'Hashtag ID',
		name: 'hashtag_id',
		type: 'string',
		default: '',
		placeholder: '12345',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getHashtag'] } },
		routing: { request: { body: { hashtag_id: '={{ $value }}' } } },
		description: 'TikTok hashtag ID. Either hashtag name or ID is required.',
	},

	// ── Hashtag ID for Get Hashtag Videos ──
	{
		displayName: 'Hashtag ID',
		name: 'hashtag_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12345',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getHashtagVideos'] } },
		routing: { request: { body: { hashtag_id: '={{ $value }}' } } },
		description: 'TikTok hashtag ID. Obtain from the Get Hashtag operation.',
	},

	// ── Additional Options: getUserPosts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getUserPosts'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Number of posts to return (1-30)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_type',
				type: 'options',
				default: '0',
				options: [
					{ name: 'Newest', value: '0' },
					{ name: 'Oldest', value: '1' },
					{ name: 'Most Liked', value: '2' },
				],
				routing: { request: { body: { sort_type: '={{ Number($value) }}' } } },
			},
		],
	},

	// ── Additional Options: getVideoComments + getCommentReplies ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['tiktok'],
				operation: ['getVideoComments', 'getCommentReplies'],
			},
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of items to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: searchVideos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['searchVideos'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Number of results to return (1-30)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_type',
				type: 'options',
				default: '0',
				options: [
					{ name: 'Relevance', value: '0' },
					{ name: 'Most Liked', value: '1' },
					{ name: 'Newest', value: '2' },
					{ name: 'Most Viewed', value: '3' },
				],
				routing: { request: { body: { sort_type: '={{ Number($value) }}' } } },
			},
			{
				displayName: 'Publish Time',
				name: 'publish_time',
				type: 'options',
				default: '0',
				options: [
					{ name: 'All Time', value: '0' },
					{ name: 'Last Day', value: '1' },
					{ name: 'Last Week', value: '7' },
					{ name: 'Last Month', value: '30' },
					{ name: 'Last 3 Months', value: '90' },
					{ name: 'Last 6 Months', value: '180' },
				],
				routing: { request: { body: { publish_time: '={{ Number($value) }}' } } },
			},
		],
	},

	// ── Additional Options: searchUsers ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['searchUsers'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Number of results to return (1-30)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getHashtagVideos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getHashtagVideos'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Number of videos to return (1-30)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getUserFollowers + getUserFollowings ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['tiktok'],
				operation: ['getUserFollowers', 'getUserFollowings'],
			},
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Number of results to return (1-20)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Page Token',
				name: 'page_token',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Pagination token returned from a previous response',
				routing: { request: { body: { page_token: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Time',
				name: 'min_time',
				type: 'number',
				default: 0,
				description: 'Minimum timestamp filter (Unix epoch seconds)',
				routing: { request: { body: { min_time: '={{ $value }}' } } },
			},
		],
	},
];
