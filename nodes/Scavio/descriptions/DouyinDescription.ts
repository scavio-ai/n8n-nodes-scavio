import type { INodeProperties } from 'n8n-workflow';

// Douyin (Chinese TikTok), douyin.com only. 27 endpoints.
//
// Credit cost: search operations cost 10 credits, everything else costs 1.
//
// Pagination: cursor-based for most list endpoints (user posts/likes, comments,
// hashtag videos, music videos, search). Trending, home feed and resolve
// endpoints have no pagination. Follow endpoints use max_time instead of cursor.

export const douyinOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['douyin'] } },
		options: [
			{
				name: 'Get Comment Replies',
				value: 'getCommentReplies',
				action: 'Get douyin comment replies',
				description: 'Get replies under a comment on a Douyin video. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/video/comment-replies' } },
			},
			{
				name: 'Get Hashtag',
				value: 'getHashtag',
				action: 'Get a douyin hashtag',
				description: 'Get details for a Douyin hashtag by ID. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/hashtag' } },
			},
			{
				name: 'Get Hashtag Videos',
				value: 'getHashtagVideos',
				action: 'Get douyin hashtag videos',
				description: 'Get videos under a Douyin hashtag. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/hashtag/videos' } },
			},
			{
				name: 'Get Home Feed',
				value: 'getHomeFeed',
				action: 'Get douyin home feed',
				description: 'Get the recommended home feed. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/home-feed' } },
			},
			{
				name: 'Get Live Room',
				value: 'getLiveRoom',
				action: 'Get a douyin live room',
				description: 'Get live room detail by web_rid or URL. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/live/room' } },
			},
			{
				name: 'Get Music',
				value: 'getMusic',
				action: 'Get douyin music detail',
				description: 'Get details for a Douyin sound. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/music' } },
			},
			{
				name: 'Get Music Videos',
				value: 'getMusicVideos',
				action: 'Get douyin music videos',
				description: 'Get videos using a Douyin sound. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/music/videos' } },
			},
			{
				name: 'Get Related Videos',
				value: 'getRelated',
				action: 'Get douyin related videos',
				description: 'Get videos recommended alongside a given video. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/related' } },
			},
			{
				name: 'Get Trending',
				value: 'getTrending',
				action: 'Get douyin trending',
				description: 'Get the current hot search board. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/trending' } },
			},
			{
				name: 'Get User Followers',
				value: 'getUserFollowers',
				action: 'Get douyin user followers',
				description: "Get a Douyin user's followers. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/douyin/user/followers' } },
			},
			{
				name: 'Get User Following',
				value: 'getUserFollowing',
				action: 'Get douyin user following',
				description: 'Get accounts a Douyin user follows. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/user/following' } },
			},
			{
				name: 'Get User Likes',
				value: 'getUserLikes',
				action: 'Get douyin user likes',
				description: "Get a Douyin user's publicly liked videos. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/douyin/user/likes' } },
			},
			{
				name: 'Get User Live',
				value: 'getUserLive',
				action: 'Get douyin user live status',
				description: "Get a Douyin user's current live stream. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/douyin/user/live' } },
			},
			{
				name: 'Get User Posts',
				value: 'getUserPosts',
				action: 'Get douyin user posts',
				description: "Get a Douyin user's published videos. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/douyin/user/posts' } },
			},
			{
				name: 'Get User Profile',
				value: 'getUserProfile',
				action: 'Get a douyin user profile',
				description: 'Get profile details for a Douyin user. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/user/profile' } },
			},
			{
				name: 'Get Video',
				value: 'getVideo',
				action: 'Get a douyin video',
				description: 'Get full detail for a single Douyin video by ID. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/video' } },
			},
			{
				name: 'Get Video by Share URL',
				value: 'getVideoByShareUrl',
				action: 'Get a douyin video by share url',
				description: 'Resolve a Douyin share link to its video detail. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/video/by-share-url' } },
			},
			{
				name: 'Get Video Comments',
				value: 'getVideoComments',
				action: 'Get douyin video comments',
				description: 'Get top-level comments on a Douyin video. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/video/comments' } },
			},
			{
				name: 'Get Video Statistics',
				value: 'getVideoStatistics',
				action: 'Get douyin video statistics',
				description: 'Get play, like, share and download counts for one or more videos. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/video/statistics' } },
			},
			{
				name: 'Resolve User ID',
				value: 'resolveUserId',
				action: 'Resolve a douyin user id',
				description: 'Extract a user sec_user_id from a Douyin URL. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/resolve/user-id' } },
			},
			{
				name: 'Resolve Video ID',
				value: 'resolveVideoId',
				action: 'Resolve a douyin video id',
				description: 'Extract a video ID from a Douyin URL. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/resolve/video-id' } },
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search douyin',
				description: 'General keyword search across Douyin. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/search' } },
			},
			{
				name: 'Search Hashtags',
				value: 'searchHashtags',
				action: 'Search douyin hashtags',
				description: 'Search Douyin hashtags by keyword. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/search/hashtags' } },
			},
			{
				name: 'Search Live',
				value: 'searchLive',
				action: 'Search douyin live streams',
				description: 'Search Douyin live streams by keyword. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/search/live' } },
			},
			{
				name: 'Search Music',
				value: 'searchMusic',
				action: 'Search douyin music',
				description: 'Search Douyin sounds by keyword. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/search/music' } },
			},
			{
				name: 'Search Users',
				value: 'searchUsers',
				action: 'Search douyin users',
				description: 'Search Douyin users by keyword. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/search/users' } },
			},
			{
				name: 'Search Videos',
				value: 'searchVideos',
				action: 'Search douyin videos',
				description: 'Search Douyin videos by keyword. Costs 10 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/douyin/search/videos' } },
			},
		],
		default: 'search',
	},
];

export const douyinFields: INodeProperties[] = [
	// -- Shared aweme_id (getVideo, getVideoComments, getCommentReplies, getVideoStatistics, getRelated) --
	{
		displayName: 'Video ID (aweme_id)',
		name: 'aweme_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7436613508646702348',
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: ['getVideo', 'getVideoComments', 'getCommentReplies', 'getRelated'],
			},
		},
		routing: { request: { body: { aweme_id: '={{ $value }}' } } },
		description: 'Douyin video ID',
	},

	// -- aweme_ids for statistics (comma-separated) --
	{
		displayName: 'Video IDs (aweme_ids)',
		name: 'aweme_ids',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7436613508646702348,7436613508646702349',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getVideoStatistics'] },
		},
		routing: { request: { body: { aweme_ids: '={{ $value }}' } } },
		description: 'One or more Douyin video IDs, comma separated',
	},

	// -- Share URL (getVideoByShareUrl) --
	{
		displayName: 'Share URL',
		name: 'share_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://v.douyin.com/v1zNJi__Teg/',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getVideoByShareUrl'] },
		},
		routing: { request: { body: { share_url: '={{ $value }}' } } },
		description: 'A douyin.com or v.douyin.com share link',
	},

	// -- Shared sec_user_id (getUserProfile, getUserPosts, getUserLikes, getUserFollowers, getUserFollowing) --
	{
		displayName: 'Sec User ID',
		name: 'sec_user_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MS4wLjABAAAAPCnTQLqza4Xqu-uO7KZHcKuILkO7RRz2oapyOC04AQ0',
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: [
					'getUserProfile',
					'getUserPosts',
					'getUserLikes',
					'getUserFollowers',
					'getUserFollowing',
				],
			},
		},
		routing: { request: { body: { sec_user_id: '={{ $value }}' } } },
		description: 'Douyin user sec_user_id. Obtain from Get User Profile or Resolve User ID.',
	},

	// -- sec_uid for getUserLive (different param name from sec_user_id) --
	{
		displayName: 'Sec User ID',
		name: 'sec_uid',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MS4wLjABAAAAPCnTQLqza4Xqu-uO7KZHcKuILkO7RRz2oapyOC04AQ0',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getUserLive'] },
		},
		routing: { request: { body: { sec_uid: '={{ $value }}' } } },
		description: 'Douyin user sec_uid. Obtain from Get User Profile.',
	},

	// -- Comment ID for getCommentReplies --
	{
		displayName: 'Comment ID',
		name: 'comment_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7436619707668759306',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getCommentReplies'] },
		},
		routing: { request: { body: { comment_id: '={{ $value }}' } } },
		description: 'ID of the comment to get replies for. Obtain from Get Video Comments.',
	},

	// -- Shared ch_id (getHashtag, getHashtagVideos) --
	{
		displayName: 'Hashtag ID',
		name: 'ch_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1568943621383170',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getHashtag', 'getHashtagVideos'] },
		},
		routing: { request: { body: { ch_id: '={{ $value }}' } } },
		description: 'Douyin hashtag ID',
	},

	// -- Shared music_id (getMusic, getMusicVideos) --
	{
		displayName: 'Music ID',
		name: 'music_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7436614219480435506',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getMusic', 'getMusicVideos'] },
		},
		routing: { request: { body: { music_id: '={{ $value }}' } } },
		description: 'Douyin music/sound ID',
	},

	// -- Live Room fields --
	{
		displayName: 'Web Room ID',
		name: 'web_rid',
		type: 'string',
		default: '',
		placeholder: '123456789',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getLiveRoom'] },
		},
		routing: { request: { body: { web_rid: '={{ $value }}' } } },
		description: 'Live room web_rid. Provide this or Live Room URL.',
	},
	{
		displayName: 'Live Room URL',
		name: 'live_room_url',
		type: 'string',
		default: '',
		placeholder: 'https://live.douyin.com/123456789',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getLiveRoom'] },
		},
		routing: { request: { body: { live_room_url: '={{ $value }}' } } },
		description: 'Full Douyin live room URL. Alternative to Web Room ID.',
	},

	// -- URL for resolve operations --
	{
		displayName: 'Douyin URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.douyin.com/video/7436613508646702348',
		displayOptions: {
			show: { resource: ['douyin'], operation: ['resolveVideoId', 'resolveUserId'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A Douyin URL to resolve into a video ID or user sec_user_id',
	},

	// -- Shared keyword (all search operations) --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'travel vlog',
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: [
					'search',
					'searchVideos',
					'searchUsers',
					'searchMusic',
					'searchLive',
					'searchHashtags',
				],
			},
		},
		routing: { request: { body: { keyword: '={{ $value }}' } } },
		description: 'Search keyword, 200 characters max',
	},

	// -- Additional Options: cursor-paginated list endpoints --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: ['getVideoComments', 'getCommentReplies', 'getMusicVideos'],
			},
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of items to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: user posts and likes (max_cursor + count) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: ['getUserPosts', 'getUserLikes'],
			},
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of items to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'max_cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor (max_cursor) from a previous response',
				routing: { request: { body: { max_cursor: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: followers and following (max_time + count) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: ['getUserFollowers', 'getUserFollowing'],
			},
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of items to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Time',
				name: 'max_time',
				type: 'string',
				default: '',
				description: 'Pagination timestamp from a previous response',
				routing: { request: { body: { max_time: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: hashtag videos (cursor + count + sort_type) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getHashtagVideos'] },
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of videos to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_type',
				type: 'options',
				default: '0',
				options: [
					{ name: 'Comprehensive', value: '0' },
					{ name: 'Most Liked', value: '1' },
					{ name: 'Latest', value: '2' },
				],
				routing: { request: { body: { sort_type: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: related videos (count + refresh_index) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getRelated'] },
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Number of related videos to return (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Refresh Index',
				name: 'refresh_index',
				type: 'number',
				default: 0,
				description: 'Pagination index for loading more related videos',
				routing: { request: { body: { refresh_index: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: home feed (count + refresh_index) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getHomeFeed'] },
		},
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Number of items to return (1-20)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
			{
				displayName: 'Refresh Index',
				name: 'refresh_index',
				type: 'number',
				default: 0,
				description: 'Pagination index for loading more feed items',
				routing: { request: { body: { refresh_index: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: all search operations (offset, page, cursor, search_id) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['douyin'],
				operation: [
					'search',
					'searchVideos',
					'searchUsers',
					'searchMusic',
					'searchLive',
					'searchHashtags',
				],
			},
		},
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'number',
				default: 0,
				description: 'Pagination cursor from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Pagination offset from a previous response',
				routing: { request: { body: { offset: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page number, starting from 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Search ID',
				name: 'search_id',
				type: 'string',
				default: '',
				description: 'Search ID from a previous response, for stable pagination',
				routing: { request: { body: { search_id: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: live room (danmaku_type) --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: { resource: ['douyin'], operation: ['getLiveRoom'] },
		},
		options: [
			{
				displayName: 'Danmaku Type',
				name: 'danmaku_type',
				type: 'string',
				default: '',
				description: 'Danmaku (bullet comment) type filter',
				routing: { request: { body: { danmaku_type: '={{ $value }}' } } },
			},
		],
	},
];
