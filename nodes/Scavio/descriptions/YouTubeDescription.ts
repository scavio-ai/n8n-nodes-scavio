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
				name: 'Search',
				value: 'search',
				action: 'Search you tube',
				description: 'Search YouTube and return videos, channels, or playlists',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/search' } },
			},
			{
				name: 'Get Metadata',
				value: 'metadata',
				action: 'Get you tube video metadata',
				description: 'Get full metadata for a YouTube video by ID',
				routing: { request: { method: 'POST', url: '/api/v1/youtube/metadata' } },
			},
		],
		default: 'search',
	},
];

export const youtubeFields: INodeProperties[] = [
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'n8n tutorial',
		displayOptions: { show: { resource: ['youtube'], operation: ['search'] } },
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'YouTube search query',
	},
	{
		displayName: 'Video ID',
		name: 'video_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dQw4w9WgXcQ',
		displayOptions: { show: { resource: ['youtube'], operation: ['metadata'] } },
		routing: { request: { body: { video_id: '={{ $value }}' } } },
		description: 'YouTube video ID. Extract from a youtube.com URL if needed.',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['youtube'], operation: ['search'] } },
		options: [
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Date', value: 'date' },
					{ name: 'View Count', value: 'view_count' },
					{ name: 'Rating', value: 'rating' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'video',
				options: [
					{ name: 'Video', value: 'video' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Playlist', value: 'playlist' },
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
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				default: '',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Short (< 4 Min)', value: 'short' },
					{ name: 'Medium (4-20 Min)', value: 'medium' },
					{ name: 'Long (> 20 Min)', value: 'long' },
				],
				routing: { request: { body: { duration: '={{ $value }}' } } },
			},
		],
	},
];
