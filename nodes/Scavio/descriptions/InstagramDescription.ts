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
				description: 'Get replies to an Instagram comment, with pagination. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/post/comments/replies' } },
			},
			{
				name: 'Get Highlight Stories',
				value: 'highlightStories',
				action: 'Get instagram highlight stories',
				description:
					'Get every story saved in one highlight, with image and video URLs and posting time. Takes a highlight ID from Get User Highlights. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/highlight/stories' } },
			},
			{
				name: 'Get Music Posts',
				value: 'musicPosts',
				action: 'Get instagram music posts',
				description:
					"List the Reels that use an audio track, plus the track's total reel count. Takes a music ID from Search Music. Costs 1 credit per page.",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/music/posts' } },
			},
			{
				name: 'Get Post',
				value: 'post',
				action: 'Get an instagram post',
				description:
					'Fetch details for a single Instagram post by URL, media ID, or shortcode: caption, media, owner, tags and like/comment counts. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'postComments',
				action: 'Get instagram post comments',
				description:
					'Get comments on an Instagram post, with pagination. Costs 2 credits per page.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/post/comments' } },
			},
			{
				name: 'Get Post Likers',
				value: 'postLikers',
				action: 'Get instagram post likers',
				description:
					'List accounts that liked an Instagram post (up to about 1,000 per post) and its total like count. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/post/likers' } },
			},
			{
				name: 'Get Profile',
				value: 'profile',
				action: 'Get an instagram profile',
				description: 'Get an Instagram user profile by username or user ID. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/profile' } },
			},
			{
				name: 'Get Similar Accounts',
				value: 'userSimilar',
				action: 'Get instagram similar accounts',
				description:
					'List accounts similar to an Instagram user. Available for most creator accounts; some brand accounts return none. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/similar' } },
			},
			{
				name: 'Get User Followers',
				value: 'userFollowers',
				action: 'Get instagram user followers',
				description:
					"Get an Instagram user's followers, with pagination. Costs 2 credits per page.",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/followers' } },
			},
			{
				name: 'Get User Followings',
				value: 'userFollowings',
				action: 'Get instagram user followings',
				description:
					'List the accounts an Instagram user follows, with pagination. Costs 2 credits per page.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/followings' } },
			},
			{
				name: 'Get User Highlights',
				value: 'userHighlights',
				action: 'Get instagram user highlights',
				description:
					"List an Instagram user's story highlights: ID, title, cover and item count. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/highlights' } },
			},
			{
				name: 'Get User Posts',
				value: 'userPosts',
				action: 'Get instagram user posts',
				description: "List an Instagram user's posts, about 12 per page. Costs 2 credits per page.",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/posts' } },
			},
			{
				name: 'Get User Reels',
				value: 'userReels',
				action: 'Get instagram user reels',
				description:
					"List an Instagram user's reels. Costs 1 credit (2 the first time a username is looked up).",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/reels' } },
			},
			{
				name: 'Get User Stories',
				value: 'userStories',
				action: 'Get instagram user stories',
				description: "Get an Instagram user's active stories. Costs 2 credits.",
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/stories' } },
			},
			{
				name: 'Get User Tagged',
				value: 'userTagged',
				action: 'Get instagram user tagged posts',
				description:
					'List posts an Instagram user is tagged in. Costs 1 credit (2 the first time a username is looked up).',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/user/tagged' } },
			},
			{
				name: 'Search Hashtags',
				value: 'searchHashtags',
				action: 'Search instagram hashtags',
				description:
					'Search Instagram hashtags by keyword. Costs 2 credits; a request with a cursor costs 8.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/search/hashtags' } },
			},
			{
				name: 'Search Locations',
				value: 'searchLocations',
				action: 'Search instagram locations',
				description:
					'Search Instagram places by name: location ID, name, address and coordinates. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/search/locations' } },
			},
			{
				name: 'Search Music',
				value: 'searchMusic',
				action: 'Search instagram music',
				description:
					'Search Instagram audio tracks by song or artist; returns the music ID Get Music Posts takes. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/search/music' } },
			},
			{
				name: 'Search Reels',
				value: 'searchReels',
				action: 'Search instagram reels',
				description:
					'Search Instagram Reels by keyword, with pagination. Costs 2 credits per page.',
				routing: { request: { method: 'POST', url: '/api/v1/instagram/search/reels' } },
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				action: 'Search instagram users',
				description:
					'Search Instagram users by keyword. Costs 2 credits; a request with a cursor costs 8.',
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
					'userHighlights',
					'userSimilar',
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
					'userHighlights',
					'userSimilar',
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
		displayOptions: {
			show: { resource: ['instagram'], operation: ['postComments', 'postLikers'] },
		},
		routing: { request: { body: { shortcode: '={{ $value }}' } } },
		description: 'Instagram post shortcode. Either Shortcode or URL is required.',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.instagram.com/p/ABC123/',
		displayOptions: {
			show: { resource: ['instagram'], operation: ['postComments', 'postLikers'] },
		},
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

	// ── Highlight ID for Get Highlight Stories ──
	{
		displayName: 'Highlight ID',
		name: 'highlight_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'highlight:18149897764550869',
		displayOptions: { show: { resource: ['instagram'], operation: ['highlightStories'] } },
		routing: { request: { body: { highlight_id: '={{ $value }}' } } },
		description: 'Highlight ID from Get User Highlights, with or without the highlight: prefix',
	},

	// ── Music ID for Get Music Posts ──
	{
		displayName: 'Music ID',
		name: 'music_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1747512212697470',
		displayOptions: { show: { resource: ['instagram'], operation: ['musicPosts'] } },
		routing: { request: { body: { music_id: '={{ $value }}' } } },
		description: 'Numeric audio ID: the ID field from Search Music',
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
			show: {
				resource: ['instagram'],
				operation: [
					'searchUsers',
					'searchHashtags',
					'searchReels',
					'searchMusic',
					'searchLocations',
				],
			},
		},
		routing: { request: { body: { keyword: '={{ $value }}' } } },
		description:
			'Search keyword. For Search Music, a song or artist; for Search Locations, a place name.',
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
				description:
					'Rank token from a previous response. A request with a cursor costs 8 credits instead of 2.',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: searchReels + musicPosts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['instagram'], operation: ['searchReels', 'musicPosts'] },
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description:
					'Pagination cursor from a previous response: pagination_token for Search Reels, paging_info.max_id for Get Music Posts',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},
];
