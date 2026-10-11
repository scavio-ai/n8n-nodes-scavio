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
				name: 'Get Ad Detail',
				value: 'getAdDetail',
				action: 'Get tiktok ad detail',
				description: 'Get full detail for a single TikTok ad by its numeric ID',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/ads/detail' } },
			},
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
				name: 'Get Music',
				value: 'getMusic',
				action: 'Get a tiktok sound',
				description:
					'A TikTok sound by ID: title, artist, album, duration, how many videos use it, original or commercial, play URL, cover and chart rank when charting. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/music' } },
			},
			{
				name: 'Get Music Chart',
				value: 'getMusicChart',
				action: 'Get the tiktok sound chart',
				description:
					'TikTok\'s Top 50 or Viral 50 sound chart with each sound\'s details and trend. One global chart, no region filter. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/music/chart' } },
			},
			{
				name: 'Get Music Videos',
				value: 'getMusicVideos',
				action: 'Get tiktok sound videos',
				description:
					'Videos that use a TikTok sound, about 14 per page (Count is ignored upstream). Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/music/videos' } },
			},
			{
				name: 'Get Playlist Videos',
				value: 'getPlaylistVideos',
				action: 'Get tiktok playlist videos',
				description:
					'The videos in a TikTok playlist, with pagination. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/playlist/videos' } },
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				action: 'Get a tiktok profile',
				description: 'Get a TikTok user profile by username or sec_user_id',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/profile' } },
			},
			{
				name: 'Get Search Suggestions',
				value: 'getSearchSuggestions',
				action: 'Get tiktok search suggestions',
				description:
					'TikTok search autocomplete suggestions for a keyword. Long-tail keywords can return none, still billed. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/search/suggestions' } },
			},
			{
				name: 'Get Similar Creators',
				value: 'getUserSimilar',
				action: 'Get similar tiktok creators',
				description:
					'Creators similar to a TikTok user, about 30 per page, with follower, following, video and like counts, bio and verification. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/similar' } },
			},
			{
				name: 'Get Top Ads',
				value: 'getTopAds',
				action: 'Get tiktok top ads',
				description: 'Get the top-performing ads on TikTok, optionally filtered by industry and country',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/ads/top' } },
			},
			{
				name: 'Get Trending Searches',
				value: 'getTrendingSearches',
				action: 'Get tiktok trending searches',
				description:
					'The search terms trending on TikTok now, about 90 per call, US-weighted, no region filter. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/trending/searches' } },
			},
			{
				name: 'Get Trending Videos',
				value: 'getTrendingVideos',
				action: 'Get tiktok trending videos',
				description:
					'A sample of videos trending on TikTok now, with author, stats, sound and hashtags. About 6 videos per call whatever Count says; run again for a fresh sample. No region filter. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/trending/videos' } },
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
				name: 'Get User Live Status',
				value: 'getUserLive',
				action: 'Get tiktok user live status',
				description:
					'Whether a TikTok user is live now: user, live room status (2 = live, 4 = not live), title, start time and viewer counts. An unknown username is a billed 404. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/live' } },
			},
			{
				name: 'Get User Playlists',
				value: 'getUserPlaylists',
				action: 'Get tiktok user playlists',
				description:
					'A TikTok user\'s playlists (series): playlist ID, name, video count and cover. Accounts without playlists return an empty list. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/playlists' } },
			},
			{
				name: 'Get User Posts',
				value: 'getUserPosts',
				action: 'Get tiktok user posts',
				description: "List a TikTok user's videos",
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/posts' } },
			},
			{
				name: 'Get User Region',
				value: 'getUserRegion',
				action: 'Get tiktok user region',
				description:
					'The region a TikTok account is registered in (ISO country code, not nationality), plus its user ID and sec_user_id. An unknown username is a 404 and is not billed. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/user/region' } },
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
				name: 'Get Video Transcript',
				value: 'getVideoTranscript',
				action: 'Get tiktok video transcript',
				description: 'Get the spoken-word transcript of a TikTok video as timestamped segments and full text',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/video/transcript' } },
			},
			{
				name: 'Search Ads',
				value: 'searchAds',
				action: 'Search tiktok ads',
				description: 'Search ads running on TikTok by keyword or industry',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/ads/search' } },
			},
			{
				name: 'Search Music',
				value: 'searchMusic',
				action: 'Search tiktok sounds',
				description:
					'Search TikTok sounds by keyword: ID, title, artist, duration, usage count and play URL. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/tiktok/search/music' } },
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
				operation: [
					'getUserPosts',
					'getUserFollowers',
					'getUserFollowings',
					'getUserSimilar',
					'getUserPlaylists',
				],
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
				operation: ['getVideo', 'getVideoComments', 'getCommentReplies', 'getVideoTranscript'],
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
			show: {
				resource: ['tiktok'],
				operation: ['searchVideos', 'searchUsers', 'getSearchSuggestions', 'searchMusic'],
			},
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
				type: 'string',
				default: '0',
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
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
					{ name: 'Latest', value: '0' },
					{ name: 'Popular', value: '1' },
				],
				routing: { request: { body: { sort_type: '={{ $value }}' } } },
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
				type: 'string',
				default: '0',
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
				type: 'string',
				default: '0',
				description: 'Pagination offset returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
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
				],
				routing: { request: { body: { sort_type: '={{ $value }}' } } },
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
				routing: { request: { body: { publish_time: '={{ $value }}' } } },
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
				type: 'string',
				default: '0',
				description: 'Pagination offset returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
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
				type: 'string',
				default: '0',
				description: 'Pagination cursor returned from a previous response',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Number of videos to return (1-30)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},

	// ── Get Video Transcript: optional URL (alternative to video_id) ──
	{
		displayName: 'Video URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.tiktok.com/@user/video/7123456789012345678',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getVideoTranscript'] } },
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'TikTok video URL or share link. Alternative to Video ID -- provide one or the other.',
	},

	// ── Get Video Transcript: additional options ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getVideoTranscript'] } },
		options: [
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: '',
				placeholder: 'en',
				description: 'Preferred transcript language (2-letter code). Defaults to the original spoken language.',
				routing: { request: { body: { language: '={{ $value }}' } } },
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

	// ── Ad ID (getAdDetail) ──
	{
		displayName: 'Ad ID',
		name: 'ad_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7585397287044694017',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getAdDetail'] } },
		routing: { request: { body: { ad_id: '={{ $value }}' } } },
		description: "The ad's numeric ID, as carried by every search result",
	},

	// ── Additional Options: searchAds ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['searchAds'] } },
		options: [
			{
				displayName: 'Ad Format',
				name: 'ad_format',
				type: 'string',
				default: '',
				description: 'Restrict to a given ad format',
				routing: { request: { body: { ad_format: '={{ $value }}' } } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'US',
				description: 'Two-letter country the ad ran in (defaults to US)',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				placeholder: 'label_22108000000',
				description: 'Restrict results to a single industry',
				routing: { request: { body: { industry: '={{ $value }}' } } },
			},
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				default: '',
				placeholder: 'nike',
				description: 'Keyword to match ad copy and creative by. Either keyword or industry is required.',
				routing: { request: { body: { keyword: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Objective',
				name: 'objective',
				type: 'string',
				default: '',
				description: 'Restrict to ads with a given campaign objective',
				routing: { request: { body: { objective: '={{ $value }}' } } },
			},
			{
				displayName: 'Order By',
				name: 'order_by',
				type: 'string',
				default: '',
				placeholder: 'for_you',
				description: 'Result ordering',
				routing: { request: { body: { order_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page number',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Period',
				name: 'period',
				type: 'options',
				default: 180,
				description: 'Lookback window in days',
				options: [
					{ name: '7 Days', value: 7 },
					{ name: '30 Days', value: 30 },
					{ name: '180 Days', value: 180 },
				],
				routing: { request: { body: { period: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: getTopAds ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getTopAds'] } },
		options: [
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				placeholder: 'label_22108000000',
				description: 'Restrict results to a single industry',
				routing: { request: { body: { industry: '={{ $value }}' } } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'US',
				description: 'Two-letter country the ad ran in',
				routing: { request: { body: { country: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Page number',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 50,
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// ── Music ID (getMusic, getMusicVideos) ──
	{
		displayName: 'Music ID',
		name: 'music_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7364498342501435408',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getMusic', 'getMusicVideos'] } },
		routing: { request: { body: { music_id: '={{ $value }}' } } },
		description: 'The sound\'s numeric ID (music id_str from a video, Search Music or Get Music Chart)',
	},
	// ── Playlist ID (getPlaylistVideos) ──
	{
		displayName: 'Playlist ID',
		name: 'playlist_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '7596415294902389534',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getPlaylistVideos'] } },
		routing: { request: { body: { playlist_id: '={{ $value }}' } } },
		description: 'The playlist\'s numeric ID (mixId from Get User Playlists)',
	},
	// ── Username (getUserLive, getUserRegion) ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mrbeast',
		displayOptions: { show: { resource: ['tiktok'], operation: ['getUserLive', 'getUserRegion'] } },
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'TikTok username, with or without the @',
	},
	// ── Chart (getMusicChart) ──
	{
		displayName: 'Chart',
		name: 'chart',
		type: 'options',
		default: 'top',
		options: [
			{ name: 'Top 50', value: 'top' },
			{ name: 'Viral 50', value: 'viral' },
		],
		displayOptions: { show: { resource: ['tiktok'], operation: ['getMusicChart'] } },
		routing: { request: { body: { chart: '={{ $value }}' } } },
		description: 'Which sound chart to return',
	},
	// ── Additional Options: Get Trending Videos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getTrendingVideos'] } },
		options: [
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 15,
				typeOptions: { minValue: 1, maxValue: 15 },
				description: 'Requested videos (1-15). About 6 come back per call whatever is set.',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},
	// ── Additional Options: Get Music Videos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getMusicVideos'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor (data.cursor) from the previous page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Videos per page (1-30). Ignored upstream; pages hold about 14.',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},
	// ── Additional Options: Search Music ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['searchMusic'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination offset (data.cursor) from the previous page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 20,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Sounds per page (1-20)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},
	// ── Additional Options: Get Music Chart ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getMusicChart'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor (data.cursor) from the previous page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Sounds per page (1-50)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},
	// ── Additional Options: Get Similar Creators ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getUserSimilar'] } },
		options: [
			{
				displayName: 'Page Token',
				name: 'page_token',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'The next_page_token from the previous response',
				routing: { request: { body: { page_token: '={{ $value }}' } } },
			},
		],
	},
	// ── Additional Options: Get User Playlists, Get Playlist Videos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tiktok'], operation: ['getUserPlaylists', 'getPlaylistVideos'] } },
		options: [
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor (data.cursor) from the previous page',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
			{
				displayName: 'Count',
				name: 'count',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 30 },
				description: 'Items per page (1-30)',
				routing: { request: { body: { count: '={{ $value }}' } } },
			},
		],
	},
];
