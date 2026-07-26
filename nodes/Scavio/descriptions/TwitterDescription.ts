import type { INodeProperties } from 'n8n-workflow';

export const twitterOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['twitter'] } },
		options: [
			{
				name: 'Get Trending',
				value: 'trending',
				action: 'Get twitter trending topics',
				description: 'Get trending topics for a country',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/trending' } },
			},
			{
				name: 'Get Tweet',
				value: 'tweet',
				action: 'Get a tweet',
				description: 'Get full details for a single tweet',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/tweet' } },
			},
			{
				name: 'Get Tweet Comments',
				value: 'tweetComments',
				action: 'Get tweet comments',
				description: 'Get replies to a tweet, ranked or chronological',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/tweet/comments' } },
			},
			{
				name: 'Get Tweet Retweeters',
				value: 'tweetRetweeters',
				action: 'Get tweet retweeters',
				description: 'Get the users who retweeted a tweet',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/tweet/retweeters' } },
			},
			{
				name: 'Get User',
				value: 'user',
				action: 'Get a twitter user',
				description: 'Get profile details for a user',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/user' } },
			},
			{
				name: 'Get User Followers',
				value: 'userFollowers',
				action: 'Get twitter user followers',
				description: "Get a user's followers",
				routing: { request: { method: 'POST', url: '/api/v1/twitter/user/followers' } },
			},
			{
				name: 'Get User Followings',
				value: 'userFollowings',
				action: 'Get twitter user followings',
				description: 'Get the accounts a user follows',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/user/followings' } },
			},
			{
				name: 'Get User Media',
				value: 'userMedia',
				action: 'Get twitter user media',
				description: "Get a user's media tweets",
				routing: { request: { method: 'POST', url: '/api/v1/twitter/user/media' } },
			},
			{
				name: 'Get User Replies',
				value: 'userReplies',
				action: 'Get twitter user replies',
				description: "Get a user's tweets and replies",
				routing: { request: { method: 'POST', url: '/api/v1/twitter/user/replies' } },
			},
			{
				name: 'Get User Tweets',
				value: 'userTweets',
				action: 'Get twitter user tweets',
				description: "Get a user's tweets",
				routing: { request: { method: 'POST', url: '/api/v1/twitter/user/tweets' } },
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search twitter',
				description: 'Search tweets and people',
				routing: { request: { method: 'POST', url: '/api/v1/twitter/search' } },
			},
		],
		default: 'search',
	},
];

export const twitterFields: INodeProperties[] = [
	// ── Search keyword (search) ──
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'artificial intelligence',
		displayOptions: { show: { resource: ['twitter'], operation: ['search'] } },
		routing: { request: { body: { search: '={{ $value }}' } } },
		description: 'Twitter search query',
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
			show: { resource: ['twitter'], operation: ['tweet', 'tweetComments', 'tweetRetweeters'] },
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
				resource: ['twitter'],
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
		description: 'A Twitter handle without the leading @',
	},

	// ── Country (trending) ──
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: 'UnitedStates',
		placeholder: 'UnitedStates',
		displayOptions: { show: { resource: ['twitter'], operation: ['trending'] } },
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
		displayOptions: { show: { resource: ['twitter'], operation: ['search'] } },
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
		displayOptions: { show: { resource: ['twitter'], operation: ['tweetComments'] } },
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
				resource: ['twitter'],
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
