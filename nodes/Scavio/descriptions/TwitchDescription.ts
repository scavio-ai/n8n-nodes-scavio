import type { INodeProperties } from 'n8n-workflow';

export const twitchOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['twitch'] } },
		options: [
			{
				name: 'Get Clip',
				value: 'getClip',
				action: 'Get a twitch clip',
				description: "Get a clip's metadata and downloadable MP4 qualities",
				routing: { request: { method: 'POST', url: '/api/v1/twitch/clip' } },
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				action: 'Get a twitch profile',
				description: "Get a channel's profile, follower count, live status and current stream",
				routing: { request: { method: 'POST', url: '/api/v1/twitch/profile' } },
			},
			{
				name: 'Get User Schedule',
				value: 'getUserSchedule',
				action: 'Get twitch user schedule',
				description: "Get a channel's stream schedule segments",
				routing: { request: { method: 'POST', url: '/api/v1/twitch/user/schedule' } },
			},
			{
				name: 'Get User Videos',
				value: 'getUserVideos',
				action: 'Get twitch user videos',
				description: "Get a channel's VODs, highlights, or uploads",
				routing: { request: { method: 'POST', url: '/api/v1/twitch/user/videos' } },
			},
		],
		default: 'getProfile',
	},
];

export const twitchFields: INodeProperties[] = [
	// ── Shared handle (getProfile, getUserVideos, getUserSchedule) ──
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'shroud',
		displayOptions: {
			show: {
				resource: ['twitch'],
				operation: ['getProfile', 'getUserVideos', 'getUserSchedule'],
			},
		},
		routing: { request: { body: { handle: '={{ $value }}' } } },
		description: 'Twitch username, @handle, or a twitch.tv/&lt;user&gt; URL',
	},

	// ── Clip slug (getClip) ──
	{
		displayName: 'Clip',
		name: 'clip',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'DeliciousDelightfulPicklesWOOP',
		displayOptions: { show: { resource: ['twitch'], operation: ['getClip'] } },
		routing: { request: { body: { clip: '={{ $value }}' } } },
		description: 'Clip slug or clip URL (clips.twitch.tv/&lt;slug&gt; or twitch.tv/&lt;channel&gt;/clip/&lt;slug&gt;)',
	},

	// ── Additional Options: getUserVideos ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['twitch'], operation: ['getUserVideos'] } },
		options: [
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'ARCHIVE',
				options: [
					{ name: 'Archive (Past Broadcasts)', value: 'ARCHIVE' },
					{ name: 'Highlight', value: 'HIGHLIGHT' },
					{ name: 'Past Premiere', value: 'PAST_PREMIERE' },
					{ name: 'Upload', value: 'UPLOAD' },
				],
				description: 'Video type filter',
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'TIME',
				options: [
					{ name: 'Newest First', value: 'TIME' },
					{ name: 'Most Viewed', value: 'VIEWS' },
				],
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
			{
				displayName: 'First',
				name: 'first',
				type: 'number',
				default: 30,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Videos per page, 1-100',
				routing: { request: { body: { first: '={{ $value }}' } } },
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor from a previous response. Note: Twitch integrity-gates pagination past the first page for anonymous clients.',
				routing: { request: { body: { cursor: '={{ $value }}' } } },
			},
		],
	},
];
