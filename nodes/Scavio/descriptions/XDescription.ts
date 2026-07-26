import type { INodeProperties } from 'n8n-workflow';

export const xOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['x'] } },
		options: [
			{
				name: 'Get Trending',
				value: 'trending',
				action: 'Get X trending topics',
				description: 'Get trending topics for a country',
				routing: { request: { method: 'POST', url: '/api/v1/x/trending' } },
			},
			{
				name: 'Get Tweet',
				value: 'tweet',
				action: 'Get a tweet',
				description: 'Get full details for a single tweet',
				routing: { request: { method: 'POST', url: '/api/v1/x/tweet' } },
			},
			{
				name: 'Get Tweet Comments',
				value: 'tweetComments',
				action: 'Get tweet comments',
				description: 'Get replies to a tweet, ranked or chronological',
				routing: { request: { method: 'POST', url: '/api/v1/x/tweet/comments' } },
			},
			{
				name: 'Get Tweet Retweeters',
				value: 'tweetRetweeters',
				action: 'Get tweet retweeters',
				description: 'Get the users who retweeted a tweet',
				routing: { request: { method: 'POST', url: '/api/v1/x/tweet/retweeters' } },
			},
			{
				name: 'Get User',
				value: 'user',
				action: 'Get an X user',
				description: 'Get profile details for a user',
				routing: { request: { method: 'POST', url: '/api/v1/x/user' } },
			},
			{
				name: 'Get User Followers',
				value: 'userFollowers',
				action: 'Get X user followers',
				description: "Get a user's followers",
				routing: { request: { method: 'POST', url: '/api/v1/x/user/followers' } },
			},
			{
				name: 'Get User Followings',
				value: 'userFollowings',
				action: 'Get X user followings',
				description: 'Get the accounts a user follows',
				routing: { request: { method: 'POST', url: '/api/v1/x/user/followings' } },
			},
			{
				name: 'Get User Media',
				value: 'userMedia',
				action: 'Get X user media',
				description: "Get a user's media tweets",
				routing: { request: { method: 'POST', url: '/api/v1/x/user/media' } },
			},
			{
				name: 'Get User Replies',
				value: 'userReplies',
				action: 'Get X user replies',
				description: "Get a user's tweets and replies",
				routing: { request: { method: 'POST', url: '/api/v1/x/user/replies' } },
			},
			{
				name: 'Get User Tweets',
				value: 'userTweets',
				action: 'Get X user tweets',
				description: "Get a user's tweets",
				routing: { request: { method: 'POST', url: '/api/v1/x/user/tweets' } },
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search X',
				description: 'Search tweets and people',
				routing: { request: { method: 'POST', url: '/api/v1/x/search' } },
			},
		],
		default: 'search',
	},
];

export const xFields: INodeProperties[] = [
	// ── Search keyword (search) ──
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'artificial intelligence',
		displayOptions: { show: { resource: ['x'], operation: ['search'] } },
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'X search query',
	},

	// ── Shared tweet_id (tweet, tweetComments, tweetRetweeters) ──
	{
		displayName: 'Tweet ID',
		name: 'tweet_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1808168603721650364',
		displayOptions: {
			show: { resource: ['x'], operation: ['tweet', 'tweetComments', 'tweetRetweeters'] },
		},
		routing: { request: { body: { tweet_id: '={{ $value }}' } } },
		description: 'The numeric ID of the tweet',
	},

	// ── Shared screen_name (user, userTweets, userReplies, userMedia, userFollowers, userFollowings) ──
	{
		displayName: 'Screen Name',
		name: 'screen_name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'elonmusk',
		displayOptions: {
			show: {
				resource: ['x'],
				operation: [
					'user',
					'userTweets',
					'userReplies',
					'userMedia',
					'userFollowers',
					'userFollowings',
				],
			},
		},
		routing: { request: { body: { screen_name: '={{ $value }}' } } },
		description: 'An X handle without the leading @',
	},

	// ── Country (trending) ──
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: 'UnitedStates',
		placeholder: 'UnitedStates',
		displayOptions: { show: { resource: ['x'], operation: ['trending'] } },
		routing: { request: { body: { country: '={{ $value }}' } } },
		description: 'Country name to get trending topics for (default UnitedStates)',
	},

	// ── Additional Options: Search ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['x'], operation: ['search'] } },
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
				displayName: 'Search Type',
				name: 'search_type',
				type: 'options',
				default: 'Top',
				options: [
					{ name: 'Latest', value: 'Latest' },
					{ name: 'People', value: 'People' },
					{ name: 'Photos', value: 'Photos' },
					{ name: 'Top', value: 'Top' },
					{ name: 'Videos', value: 'Videos' },
				],
				description: 'Result category',
				routing: { request: { body: { search_type: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Get Tweet Comments ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['x'], operation: ['tweetComments'] } },
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
				displayName: 'Rank',
				name: 'rank',
				type: 'options',
				default: 'top',
				options: [
					{ name: 'Latest (Chronological)', value: 'latest' },
					{ name: 'Top (Ranked)', value: 'top' },
				],
				routing: { request: { body: { rank: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: Cursor-only (tweetRetweeters, userTweets, userReplies, userMedia, userFollowers, userFollowings) ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['x'],
				operation: [
					'tweetRetweeters',
					'userTweets',
					'userReplies',
					'userMedia',
					'userFollowers',
					'userFollowings',
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
