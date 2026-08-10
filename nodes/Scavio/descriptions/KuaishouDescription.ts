import type { INodeProperties } from 'n8n-workflow';

// Kuaishou (China), kuaishou.com only. The upstream does NOT serve Kwai
// international: a real kwai.com photo id comes back as an empty envelope, so
// nothing on this resource may be labelled "Kwai".
//
// Credit cost is PER OPERATION, never flat. Get Profile and the four search
// operations cost 10, Get Video costs 2, Get Videos Batch costs 40, and every
// other operation costs 1. Each operation description below carries its own
// figure - one platform-wide number would be wrong by up to 40x.
//
// Pagination is cursor-only. Get User Posts, Get Video Comments, Get Comment
// Replies, Get Tag Feed and the four search operations take a cursor; Get
// Profile, Get User Live Status, Resolve Share Link, Get Video, Get Videos
// Batch and Get Trending have no pagination at all.
//
// Kuaishou hides its own failures inside HTTP 200 bodies (result != 1) and the
// API turns those into a 502. The only error codes on this platform are 422
// (missing identifier) and 502 - there is no 400, 404 or 503.

export const kuaishouOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['kuaishou'] } },
		options: [
			{
				name: 'Get Comment Replies',
				value: 'commentReplies',
				action: 'Get kuaishou comment replies',
				description:
					'Get the replies under one root comment on a Kuaishou video, cursor-paginated. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/video/sub-comments' } },
			},
			{
				name: 'Get Profile',
				value: 'profile',
				action: 'Get a kuaishou profile',
				description:
					"Get a Kuaishou user's profile by user ID. Costs 10 credits, the dearest single-object call on this platform.",
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/profile' } },
			},
			{
				name: 'Get Tag Feed',
				value: 'tagFeed',
				action: 'Get a kuaishou tag feed',
				description: 'Get the posts under a Kuaishou hashtag, cursor-paginated. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/tag/feed' } },
			},
			{
				name: 'Get Trending',
				value: 'trending',
				action: 'Get kuaishou trending boards',
				description:
					'Get one Kuaishou leaderboard: hot, live, shopping, brand or music. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/trending' } },
			},
			{
				name: 'Get User Live Status',
				value: 'userLive',
				action: 'Get a kuaishou user live status',
				description: "Get a Kuaishou user's current live-stream status. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/user/live' } },
			},
			{
				name: 'Get User Posts',
				value: 'userPosts',
				action: 'Get kuaishou user posts',
				description: "Get a Kuaishou user's top posts, cursor-paginated. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/user/posts' } },
			},
			{
				name: 'Get Video',
				value: 'video',
				action: 'Get a kuaishou video',
				description:
					'Get one Kuaishou video by photo ID or by URL. Costs 2 credits. Kuaishou reports its own failures inside HTTP 200 bodies and the API surfaces those as a 502, so a 502 here usually means a bad identifier rather than an outage.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/video' } },
			},
			{
				name: 'Get Video Comments',
				value: 'videoComments',
				action: 'Get kuaishou video comments',
				description: 'Get the comments on a Kuaishou video, cursor-paginated. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/video/comments' } },
			},
			{
				name: 'Get Videos Batch',
				value: 'videosBatch',
				action: 'Get kuaishou videos in batch',
				description:
					'Costs 40 credits, the dearest call on this platform: get up to 20 Kuaishou videos in one request, priced per call rather than per video. Use Get Video at 2 credits for a single video.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/videos/batch' } },
			},
			{
				name: 'Resolve Share Link',
				value: 'userResolve',
				action: 'Resolve a kuaishou share link',
				description:
					'Turn a Kuaishou share link into the user ID every other operation takes. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/user/resolve' } },
			},
			{
				name: 'Search All',
				value: 'search',
				action: 'Search kuaishou',
				description:
					'Search Kuaishou and return mixed results: videos, users and live streams together, cursor-paginated. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/search' } },
			},
			{
				name: 'Search Live Streams',
				value: 'searchLive',
				action: 'Search kuaishou live streams',
				description: 'Search Kuaishou live streams by keyword, cursor-paginated. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/search/live' } },
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				action: 'Search kuaishou users',
				description: 'Search Kuaishou users by keyword, cursor-paginated. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/search/users' } },
			},
			{
				name: 'Search Videos',
				value: 'searchVideos',
				action: 'Search kuaishou videos',
				description: 'Search Kuaishou videos by keyword, cursor-paginated. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/kuaishou/search/videos' } },
			},
		],
		default: 'search',
	},
];

export const kuaishouFields: INodeProperties[] = [
	// -- Shared user_id (profile, userLive, userPosts) --
	{
		displayName: 'User ID',
		name: 'user_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3xnhqrvsfvpwqfm',
		displayOptions: {
			show: { resource: ['kuaishou'], operation: ['profile', 'userLive', 'userPosts'] },
		},
		routing: { request: { body: { user_id: '={{ $value }}' } } },
		description: 'Kuaishou user ID, as returned by Resolve Share Link or Search Users',
	},

	// -- Share link (userResolve) --
	{
		displayName: 'Share Link',
		name: 'share_link',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://v.kuaishou.com/AbCdEf',
		displayOptions: { show: { resource: ['kuaishou'], operation: ['userResolve'] } },
		routing: { request: { body: { share_link: '={{ $value }}' } } },
		description:
			'A kuaishou.com or v.kuaishou.com share link. Kwai international links are not served by the upstream and answer with an empty envelope.',
	},

	// -- Video lookup (video): photo_id or url, one of the two is required --
	{
		displayName: 'Lookup By',
		name: 'videoLookup',
		type: 'options',
		noDataExpression: true,
		default: 'photo_id',
		displayOptions: { show: { resource: ['kuaishou'], operation: ['video'] } },
		options: [
			{ name: 'Photo ID', value: 'photo_id' },
			{ name: 'Video URL', value: 'url' },
		],
		description: 'Whether to identify the video by its photo ID or by its full URL',
	},
	{
		displayName: 'Photo ID',
		name: 'photo_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3xf29nztu8ykrvm',
		displayOptions: {
			show: { resource: ['kuaishou'], operation: ['video'], videoLookup: ['photo_id'] },
		},
		routing: { request: { body: { photo_id: '={{ $value }}' } } },
		description: 'Kuaishou photo ID, the identifier of a single video',
	},
	{
		displayName: 'Video URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.kuaishou.com/short-video/3xf29nztu8ykrvm',
		displayOptions: {
			show: { resource: ['kuaishou'], operation: ['video'], videoLookup: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full kuaishou.com video URL',
	},

	// -- Shared photo_id (videoComments, commentReplies) --
	{
		displayName: 'Photo ID',
		name: 'photo_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3xf29nztu8ykrvm',
		displayOptions: {
			show: { resource: ['kuaishou'], operation: ['commentReplies', 'videoComments'] },
		},
		routing: { request: { body: { photo_id: '={{ $value }}' } } },
		description: 'Kuaishou photo ID of the video the comments belong to',
	},

	// -- Root comment (commentReplies) --
	{
		displayName: 'Root Comment ID',
		name: 'root_comment_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['kuaishou'], operation: ['commentReplies'] } },
		routing: { request: { body: { root_comment_id: '={{ $value }}' } } },
		description:
			'ID of the top-level comment whose replies you want, taken from Get Video Comments',
	},

	// -- Batch (videosBatch) --
	{
		displayName: 'Photo IDs',
		name: 'photo_ids',
		type: 'string',
		required: true,
		default: [],
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Photo ID' },
		placeholder: '3xf29nztu8ykrvm',
		displayOptions: { show: { resource: ['kuaishou'], operation: ['videosBatch'] } },
		routing: { request: { body: { photo_ids: '={{ $value }}' } } },
		description:
			'Kuaishou photo IDs to fetch, 20 at most. The call costs 40 credits whether you send one ID or twenty, and more than twenty is rejected.',
	},

	// -- Shared keyword (search, searchVideos, searchUsers, searchLive) --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'travel vlog',
		displayOptions: {
			show: {
				resource: ['kuaishou'],
				operation: ['search', 'searchLive', 'searchUsers', 'searchVideos'],
			},
		},
		routing: { request: { body: { keyword: '={{ $value }}' } } },
		description: 'Search keyword, 200 characters at most',
	},

	// -- Tag (tagFeed) --
	{
		displayName: 'Tag',
		name: 'tag',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'travel',
		displayOptions: { show: { resource: ['kuaishou'], operation: ['tagFeed'] } },
		routing: { request: { body: { tag: '={{ $value }}' } } },
		description: 'Kuaishou hashtag to read, without the leading hash',
	},

	// -- Board (trending) --
	{
		displayName: 'Board',
		name: 'board',
		type: 'options',
		default: 'hot',
		displayOptions: { show: { resource: ['kuaishou'], operation: ['trending'] } },
		options: [
			{ name: 'Brand', value: 'brand' },
			{ name: 'Hot', value: 'hot' },
			{ name: 'Live', value: 'live' },
			{ name: 'Music', value: 'music' },
			{ name: 'Shopping', value: 'shopping' },
		],
		routing: { request: { body: { board: '={{ $value }}' } } },
		description: 'Which leaderboard to return',
	},

	// -- Additional Options: every cursor-paginated operation except Get Comment Replies --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['kuaishou'],
				operation: [
					'search',
					'searchLive',
					'searchUsers',
					'searchVideos',
					'tagFeed',
					'userPosts',
					'videoComments',
				],
			},
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor, the next_cursor value from the previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Comment Replies --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['kuaishou'], operation: ['commentReplies'] } },
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description:
					'How many replies to return per call, 1 to 50. Leave this off to take whatever the upstream returns.',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor, the next_cursor value from the previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},
];
