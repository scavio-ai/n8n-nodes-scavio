import type { INodeProperties } from 'n8n-workflow';

export const legistarOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['legistar'] } },
		options: [
			{
				name: 'Get Bodies',
				value: 'bodies',
				action: 'Get legistar committees and bodies',
				description:
					'List committees, councils and boards for any municipality. Filter by active status. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/bodies' } },
			},
			{
				name: 'Get Event Items',
				value: 'eventItems',
				action: 'Get legistar event agenda items',
				description:
					'Get the agenda items for a specific meeting/event, including any linked legislation. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/event/items' } },
			},
			{
				name: 'Get Events',
				value: 'events',
				action: 'Get legistar events and meetings',
				description:
					'Search council meetings, committee hearings and other events. Filter by committee and date range. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/events' } },
			},
			{
				name: 'Get Matter Attachments',
				value: 'matterAttachments',
				action: 'Get legistar matter attachments',
				description:
					'Get all documents attached to a specific piece of legislation: fiscal notes, signed ordinances, supporting documents. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/matter/attachments' } },
			},
			{
				name: 'Get Matter History',
				value: 'matterHistory',
				action: 'Get legistar matter history',
				description:
					'Get the full legislative action trail for a piece of legislation: committee referrals, votes, council passage, mayoral signature. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/matter/history' } },
			},
			{
				name: 'Get Matter Sponsors',
				value: 'matterSponsors',
				action: 'Get legistar matter sponsors',
				description:
					'Get the sponsors (authors/co-sponsors) of a specific piece of legislation. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/matter/sponsors' } },
			},
			{
				name: 'Get Matters',
				value: 'matters',
				action: 'Search legistar legislation',
				description:
					'Search legislation, ordinances, resolutions and other matters across any Legistar-powered municipality. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/matters' } },
			},
			{
				name: 'Get Persons',
				value: 'persons',
				action: 'Get legistar officials',
				description:
					'Look up elected officials and staff for any municipality. Filter by name or active status. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/persons' } },
			},
			{
				name: 'Get Staff Details',
				value: 'staffDetails',
				action: 'Get legistar staff details',
				description:
					'Full details for a single official or staff member: contact info, title, all committee memberships with roles and term dates. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/staff-details' } },
			},
			{
				name: 'Validate Agency',
				value: 'validate',
				action: 'Validate legistar agency ID',
				description:
					'Check whether an agency ID is valid on Legistar. Returns the agency URL if valid. Requires Bootstrap plan or above.',
				routing: { request: { method: 'POST', url: '/api/v1/legistar/validate' } },
			},
		],
		default: 'matters',
	},
];

export const legistarFields: INodeProperties[] = [
	// ── Shared client field (all operations) ──
	{
		displayName: 'Agency ID',
		name: 'client',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'seattle',
		displayOptions: { show: { resource: ['legistar'] } },
		routing: { request: { body: { client: '={{ $value }}' } } },
		description:
			'Agency ID from the municipality Legistar URL subdomain (e.g. seattle.legistar.com -> "seattle"). Use the Validate Agency operation to check if an ID is valid.',
	},

	// ── Matter ID (matterAttachments, matterSponsors, matterHistory) ──
	{
		displayName: 'Matter ID',
		name: 'matter_id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: {
			show: {
				resource: ['legistar'],
				operation: ['matterAttachments', 'matterSponsors', 'matterHistory'],
			},
		},
		routing: { request: { body: { matter_id: '={{ $value }}' } } },
		description: 'Matter ID from the Get Matters operation',
	},

	// ── Event ID (eventItems) ──
	{
		displayName: 'Event ID',
		name: 'event_id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['legistar'], operation: ['eventItems'] } },
		routing: { request: { body: { event_id: '={{ $value }}' } } },
		description: 'Event ID from the Get Events operation',
	},

	// ── Person ID (staffDetails) ──
	{
		displayName: 'Person ID',
		name: 'person_id',
		type: 'number',
		required: true,
		default: 0,
		displayOptions: { show: { resource: ['legistar'], operation: ['staffDetails'] } },
		routing: { request: { body: { person_id: '={{ $value }}' } } },
		description: 'Person ID from the Get Persons operation',
	},

	// ── Additional Options: matters ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['legistar'], operation: ['matters'] } },
		options: [
			{
				displayName: 'Body Name',
				name: 'body_name',
				type: 'string',
				default: '',
				description: 'Filter by originating body name',
				routing: { request: { body: { body_name: '={{ $value }}' } } },
			},
			{
				displayName: 'Keyword',
				name: 'keyword',
				type: 'string',
				default: '',
				placeholder: 'affordable housing',
				description: 'Search legislation titles by keyword',
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
				displayName: 'Order By',
				name: 'order_by',
				type: 'string',
				default: '',
				description: 'OData $orderby clause. Default: MatterIntroDate desc.',
				routing: { request: { body: { order_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, starting at 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'string',
				default: '',
				placeholder: '2024-01-01',
				description: 'ISO date: return matters introduced on or after this date',
				routing: { request: { body: { since: '={{ $value }}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'string',
				default: '',
				placeholder: 'Passed',
				description: 'Filter by status name (e.g. Passed, Adopted, In Committee)',
				routing: { request: { body: { status: '={{ $value }}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'string',
				default: '',
				placeholder: 'Ordinance (Ord)',
				description: 'Filter by matter type name',
				routing: { request: { body: { type: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: events ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['legistar'], operation: ['events'] } },
		options: [
			{
				displayName: 'Body Name',
				name: 'body_name',
				type: 'string',
				default: '',
				description: 'Filter events by committee/body name',
				routing: { request: { body: { body_name: '={{ $value }}' } } },
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
				displayName: 'Order By',
				name: 'order_by',
				type: 'string',
				default: '',
				description: 'OData $orderby clause. Default: EventDate desc.',
				routing: { request: { body: { order_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, starting at 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'string',
				default: '',
				placeholder: '2024-01-01',
				description: 'ISO date: events on or after this date',
				routing: { request: { body: { since: '={{ $value }}' } } },
			},
			{
				displayName: 'Until',
				name: 'until',
				type: 'string',
				default: '',
				description: 'ISO date: events on or before this date',
				routing: { request: { body: { until: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: persons ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['legistar'], operation: ['persons'] } },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'Johnson',
				description: 'Search officials by name (substring match)',
				routing: { request: { body: { name: '={{ $value }}' } } },
			},
			{
				displayName: 'Active Only',
				name: 'active_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only currently active officials',
				routing: { request: { body: { active_only: '={{ $value }}' } } },
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, starting at 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: bodies ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['legistar'], operation: ['bodies'] } },
		options: [
			{
				displayName: 'Active Only',
				name: 'active_only',
				type: 'boolean',
				default: false,
				description: 'Whether to return only currently active committees/bodies',
				routing: { request: { body: { active_only: '={{ $value }}' } } },
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, starting at 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: matterHistory ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['legistar'], operation: ['matterHistory'] } },
		options: [
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, starting at 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// ── Additional Options: eventItems ──
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['legistar'], operation: ['eventItems'] } },
		options: [
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
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page number, starting at 1',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
