import type { INodeProperties } from 'n8n-workflow';

export const facebookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['facebook'] } },
		options: [
			{
				name: 'Get Event',
				value: 'getEvent',
				action: 'Get a facebook event',
				description: 'Get a public event: name, description, times, location, host, going and interested counts',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/event' } },
			},
			{
				name: 'Get Group',
				value: 'getGroup',
				action: 'Get a facebook group',
				description: 'Get a public group profile: name, visibility, member count, description and privacy',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/group' } },
			},
			{
				name: 'Get Group Posts',
				value: 'getGroupPosts',
				action: 'Get facebook group posts',
				description: 'Get the top posts in a public group',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/group/posts' } },
			},
			{
				name: 'Get Hashtag Posts',
				value: 'getHashtag',
				action: 'Get facebook hashtag posts',
				description: 'Get the top public posts for a hashtag',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/hashtag' } },
			},
			{
				name: 'Get Post',
				value: 'getPost',
				action: 'Get a facebook post',
				description: 'Get full details for one post: text, reactions, comments, media and permalink',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/post' } },
			},
			{
				name: 'Get Post Comments',
				value: 'getPostComments',
				action: 'Get facebook post comments',
				description: 'Get the top visible comments on a post',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/post/comments' } },
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				action: 'Get a facebook profile',
				description: 'Get a Facebook page or public profile: name, likes, followers, bio, website, contact info',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/profile' } },
			},
			{
				name: 'Get Profile Photos',
				value: 'getProfilePhotos',
				action: 'Get facebook profile photos',
				description: "Get a page's photo grid",
				routing: { request: { method: 'POST', url: '/api/v1/facebook/profile/photos' } },
			},
			{
				name: 'Get Profile Posts',
				value: 'getProfilePosts',
				action: 'Get facebook profile posts',
				description: "Get the most recent top posts on a page",
				routing: { request: { method: 'POST', url: '/api/v1/facebook/profile/posts' } },
			},
			{
				name: 'Get Profile Reels',
				value: 'getProfileReels',
				action: 'Get facebook profile reels',
				description: "Get a page's reels with downloadable video URLs",
				routing: { request: { method: 'POST', url: '/api/v1/facebook/profile/reels' } },
			},
			{
				name: 'Get Reel',
				value: 'getReel',
				action: 'Get a facebook reel',
				description: 'Get one reel or video: downloadable HD/SD video URLs, views, reactions, comments',
				routing: { request: { method: 'POST', url: '/api/v1/facebook/reel' } },
			},
		],
		default: 'getProfile',
	},
];

export const facebookFields: INodeProperties[] = [
	// ── Shared URL field for all URL-based operations ──
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.facebook.com/nike',
		displayOptions: {
			show: {
				resource: ['facebook'],
				operation: [
					'getProfile',
					'getProfilePosts',
					'getProfileReels',
					'getProfilePhotos',
					'getPost',
					'getPostComments',
					'getReel',
					'getGroup',
					'getGroupPosts',
					'getEvent',
				],
			},
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A Facebook URL for the requested surface (page, profile, post, reel, group, or event)',
	},

	// ── Hashtag tag field ──
	{
		displayName: 'Hashtag',
		name: 'tag',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'photography',
		displayOptions: { show: { resource: ['facebook'], operation: ['getHashtag'] } },
		routing: { request: { body: { tag: '={{ $value }}' } } },
		description: 'A hashtag name, with or without the leading #',
	},
];
