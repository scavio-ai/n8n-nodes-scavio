import type { INodeProperties } from 'n8n-workflow';

export const youtubeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['youtube'] } },
		options: [
			{
				name: 'Get Channel',
				value: 'channel',
				action: 'Get a you tube channel',
				description: 'Get channel info by channel ID, @handle, or URL',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/channel' } },
			},
			{
				name: 'Get Channel Community',
				value: 'channelCommunity',
				action: 'Get you tube channel community posts',
				description: 'List community posts for a YouTube channel',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/channel/community' } },
			},
			{
				name: 'Get Channel Shorts',
				value: 'channelShorts',
				action: 'Get you tube channel shorts',
				description: 'List shorts published by a YouTube channel',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/channel/shorts' } },
			},
			{
				name: 'Get Channel Videos',
				value: 'channelVideos',
				action: 'Get you tube channel videos',
				description: 'List videos published by a YouTube channel',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/channel/videos' } },
			},
			{
				name: 'Get Comment Replies',
				value: 'commentReplies',
				action: 'Get you tube comment replies',
				description: 'Get replies to a YouTube comment',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/comments/replies' } },
			},
			{
				name: 'Get Comments',
				value: 'comments',
				action: 'Get you tube video comments',
				description: 'Get comments on a YouTube video',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/comments' } },
			},
			{
				name: 'Get Metadata',
				value: 'metadata',
				action: 'Get you tube video metadata',
				description: 'Deprecated alias of Get Video. Get full metadata for a YouTube video.',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/video' } },
			},
			{
				name: 'Get Related',
				value: 'related',
				action: 'Get related you tube videos',
				description: 'Get videos related to a YouTube video',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/related' } },
			},
			{
				name: 'Get Streams',
				value: 'streams',
				action: 'Get you tube video streams',
				description: 'Get playable and downloadable stream URLs for a YouTube video',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/streams' } },
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get you tube search suggestions',
				description: 'Get search autocomplete suggestions for a query',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/suggestions' } },
			},
			{
				name: 'Get Transcript',
				value: 'transcript',
				action: 'Get a you tube video transcript',
				description: 'Get the transcript or timed subtitles for a YouTube video',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/transcript' } },
			},
			{
				name: 'Get Video',
				value: 'video',
				action: 'Get a you tube video',
				description: 'Get full metadata for a YouTube video by ID or URL',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/video' } },
			},
			{
				name: 'Resolve Channel',
				value: 'channelResolve',
				action: 'Resolve a you tube channel',
				description: 'Resolve a @handle or channel URL to a channel ID',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/channel/resolve' } },
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search you tube',
				description: 'Search YouTube and return videos, channels, or playlists',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/search' } },
			},
			{
				name: 'Search Channels',
				value: 'channelSearch',
				action: 'Search you tube channels',
				description: 'Search YouTube channels by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/channel/search' } },
			},
			{
				name: 'Search Shorts',
				value: 'shorts',
				action: 'Search you tube shorts',
				description: 'Search YouTube shorts by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/shorts' } },
			},
		],
		default: 'search',
	},
];

export const youtubeFields: INodeProperties[] = [
	// ── Shared search keyword (search, shorts, suggestions, channelSearch) ──
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'n8n tutorial',
		displayOptions: {
			show: {
				resource: ['youtube'],
				operation: ['search', 'shorts', 'suggestions', 'channelSearch'],
			},
		},
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'YouTube search query',
	},

	// ── Shared video_id (video, metadata, comments, commentReplies, transcript, related, streams) ──
	{
		displayName: 'Video ID',
		name: 'video_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dQw4w9WgXcQ',
		displayOptions: {
			show: {
				resource: ['youtube'],
				operation: [
					'video',
					'metadata',
					'comments',
					'commentReplies',
					'transcript',
					'related',
					'streams',
				],
			},
		},
		routing: { request: { body: { video_id: '={{ $value }}' } } },
		description: 'YouTube video ID or full watch URL',
	},

	// ── Reply Cursor for Get Comment Replies ──
	{
		displayName: 'Reply Cursor',
		name: 'reply_cursor',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['youtube'], operation: ['commentReplies'] } },
		routing: { request: { body: { reply_cursor: '={{ $value }}' } } },
		description: 'Reply cursor from a comment returned by the Get Comments operation',
	},

	// ── Shared channel_id (channel, channelVideos, channelShorts, channelCommunity) ──
	{
		displayName: 'Channel ID',
		name: 'channel_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
		displayOptions: {
			show: {
				resource: ['youtube'],
				operation: ['channel', 'channelVideos', 'channelShorts', 'channelCommunity'],
			},
		},
		routing: { request: { body: { channel_id: '={{ $value }}' } } },
		description:
			'YouTube channel ID. For Get Channel you may also pass an @handle or channel URL.',
	},

	// ── Channel handle/URL for Resolve Channel ──
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'string',
		required: true,
		default: '',
		placeholder: '@GoogleDevelopers',
		displayOptions: { show: { resource: ['youtube'], operation: ['channelResolve'] } },
		routing: { request: { body: { channel: '={{ $value }}' } } },
		description: 'A YouTube @handle or channel URL to resolve to a channel ID',
	},

	// ── Additional Options: Search ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['youtube'], operation: ['search'] } },
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
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Long (> 20 Min)', value: 'long' },
					{ name: 'Medium (4-20 Min)', value: 'medium' },
					{ name: 'Short (< 4 Min)', value: 'short' },
				],
				routing: { request: { body: { duration: '={{ $value }}' } } },
			},
			{
				displayName: 'Features',
				name: 'features',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '360', value: '360' },
					{ name: '3D', value: '3d' },
					{ name: '4K', value: '4k' },
					{ name: 'Creative Commons', value: 'creative_commons' },
					{ name: 'HD', value: 'hd' },
					{ name: 'HDR', value: 'hdr' },
					{ name: 'Live', value: 'live' },
					{ name: 'Subtitles', value: 'subtitles' },
					{ name: 'VR180', value: 'vr180' },
				],
				description: 'Filter results by video features',
				routing: { request: { body: { features: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Date', value: 'date' },
					{ name: 'Rating', value: 'rating' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'View Count', value: 'view_count' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'video',
				options: [
					{ name: 'Channel', value: 'channel' },
					{ name: 'Movie', value: 'movie' },
					{ name: 'Playlist', value: 'playlist' },
					{ name: 'Video', value: 'video' },
				],
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Upload Date',
				name: 'upload_date',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any Time', value: '' },
					{ name: 'Last Hour', value: 'last_hour' },
					{ name: 'This Month', value: 'this_month' },
					{ name: 'This Week', value: 'this_week' },
					{ name: 'This Year', value: 'this_year' },
					{ name: 'Today', value: 'today' },
				],
				routing: { request: { body: { upload_date: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Search Shorts ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['youtube'], operation: ['shorts'] } },
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
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Date', value: 'date' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'View Count', value: 'view_count' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Suggestions ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['youtube'], operation: ['suggestions'] } },
		options: [
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'en',
				description: 'Language code for suggestions (default en)',
				routing: { request: { body: { language: '={{ $value }}' } } },
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'string',
				default: 'US',
				description: 'Region code for suggestions (default US)',
				routing: { request: { body: { region: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Transcript ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['youtube'], operation: ['transcript'] } },
		options: [
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				default: 'text',
				options: [
					{ name: 'Text', value: 'text' },
					{ name: 'SRT (Timed Subtitles)', value: 'srt' },
				],
				routing: { request: { body: { format: '={{ $value }}' } } },
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'string',
				default: 'en',
				description: 'Transcript language code (default en)',
				routing: { request: { body: { language: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Cursor-only (comments, commentReplies, related, channelSearch, channelVideos, channelShorts, channelCommunity) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['youtube'],
				operation: [
					'comments',
					'commentReplies',
					'related',
					'channelSearch',
					'channelVideos',
					'channelShorts',
					'channelCommunity',
				],
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
		],
	},
];
