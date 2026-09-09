import type { INodeProperties } from 'n8n-workflow';

export const pinterestOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pinterest'] } },
		options: [
			{
				name: 'Get Board Pins',
				value: 'getBoard',
				action: 'Get pinterest board pins',
				description: "Get a board's metadata and a page of its pins",
				routing: { request: { method: 'POST', url: '/api/v1/pinterest/board' } },
			},
			{
				name: 'Get Pin',
				value: 'getPin',
				action: 'Get a pinterest pin',
				description: 'Get full details for one pin: save/share/comment counts, reactions, video URL',
				routing: { request: { method: 'POST', url: '/api/v1/pinterest/pin' } },
			},
			{
				name: 'Get Profile',
				value: 'getProfile',
				action: 'Get a pinterest profile',
				description: "Get a user's public profile: bio, follower/following counts, pin and board counts",
				routing: { request: { method: 'POST', url: '/api/v1/pinterest/profile' } },
			},
			{
				name: 'Get URL Save Counts',
				value: 'getUrlStats',
				action: 'Get pinterest url save counts',
				description: 'How many times external URLs have been saved to Pinterest (up to 10 URLs per call)',
				routing: { request: { method: 'POST', url: '/api/v1/pinterest/url-stats' } },
			},
			{
				name: 'Get User Boards',
				value: 'getUserBoards',
				action: 'Get pinterest user boards',
				description: "Get all public boards of a user",
				routing: { request: { method: 'POST', url: '/api/v1/pinterest/user/boards' } },
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search pinterest',
				description: 'Search Pinterest pins by keyword',
				routing: { request: { method: 'POST', url: '/api/v1/pinterest/search' } },
			},
		],
		default: 'search',
	},
];

export const pinterestFields: INodeProperties[] = [
	// ── Search fields ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'home decor ideas',
		displayOptions: { show: { resource: ['pinterest'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keyword',
	},

	// ── Pin field ──
	{
		displayName: 'Pin',
		name: 'pin',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.pinterest.com/pin/104779128829676115/',
		displayOptions: { show: { resource: ['pinterest'], operation: ['getPin'] } },
		routing: { request: { body: { pin: '={{ $value }}' } } },
		description: 'Pin URL, a bare numeric pin ID, or a pin.it share link',
	},

	// ── Username for profile and user boards ──
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'pinterest',
		displayOptions: {
			show: { resource: ['pinterest'], operation: ['getProfile', 'getUserBoards'] },
		},
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'Pinterest username (without @) or a profile URL',
	},

	// ── Board field ──
	{
		displayName: 'Board',
		name: 'board',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.pinterest.com/pinterest/spice-up-your-dinner-plans/',
		displayOptions: { show: { resource: ['pinterest'], operation: ['getBoard'] } },
		routing: { request: { body: { board: '={{ $value }}' } } },
		description: 'Board URL, a username/slug pair, or a numeric board ID',
	},

	// ── URLs field for url-stats ──
	{
		displayName: 'URLs',
		name: 'urls',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.nytimes.com,https://www.allrecipes.com',
		displayOptions: { show: { resource: ['pinterest'], operation: ['getUrlStats'] } },
		routing: {
			send: {
				type: 'body',
				property: 'urls',
				value: '={{ $value.split(",").map(u => u.trim()).filter(Boolean) }}',
			},
		},
		description: '1-10 absolute URLs separated by commas',
	},

	// ── Additional Options: search ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['pinterest'], operation: ['search'] } },
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

	// ── Additional Options: getUserBoards ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['pinterest'], operation: ['getUserBoards'] } },
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

	// ── Additional Options: getBoard ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['pinterest'], operation: ['getBoard'] } },
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
				displayName: 'Page Size',
				name: 'page_size',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Pins per page (1-50)',
				routing: { request: { body: { page_size: '={{ $value }}' } } },
			},
		],
	},
];
