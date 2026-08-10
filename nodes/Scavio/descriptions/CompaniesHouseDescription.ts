import type { INodeProperties } from 'n8n-workflow';

export const companiesHouseOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['companiesHouse'] } },
		options: [
			{
				name: 'Get Company',
				value: 'company',
				action: 'Get a UK company register entry',
				description:
					'Get the full register entry: status, type, incorporation and dissolution dates, registered office, SIC codes, previous names, accounts and confirmation-statement due dates with overdue flags, and whether it has charges, insolvency history, officers or UK establishments',
				routing: { request: { method: 'POST', url: '/api/v1/companieshouse/company' } },
			},
			{
				name: 'Get Filing History',
				value: 'filingHistory',
				action: 'Get UK company filing history',
				description:
					'Get filings most recent first: date, filing type code such as AA, CS01 or SH03, description, register annotations and child documents, and a link to the filed PDF with its page count. A filing the register has not finished processing carries a processing_note instead of a document.',
				routing: { request: { method: 'POST', url: '/api/v1/companieshouse/filing-history' } },
			},
			{
				name: 'Get Officers',
				value: 'officers',
				action: 'Get UK company officers',
				description:
					'Get officers current and resigned, 35 per page: name, role, appointment and resignation dates, correspondence address, nationality, country of residence, month-and-year date of birth and identity-verification status. The register has no server-side active or resigned filter, so filter on the status field in the response.',
				routing: { request: { method: 'POST', url: '/api/v1/companieshouse/officers' } },
			},
			{
				name: 'Search Companies',
				value: 'search',
				action: 'Search the UK companies register',
				description:
					'START HERE. Search the register by name and get the company number every other operation is keyed by, plus status, incorporation or dissolution date, registered office and matched former names.',
				routing: { request: { method: 'POST', url: '/api/v1/companieshouse/search' } },
			},
		],
		default: 'search',
	},
];

export const companiesHouseFields: INodeProperties[] = [
	// -- Search Companies --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Monzo Bank',
		displayOptions: { show: { resource: ['companiesHouse'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Company name or a fragment of one. The register matches CURRENT AND FORMER names.',
	},

	// -- Shared company number (Get Company / Get Officers / Get Filing History) --
	{
		displayName: 'Company Number',
		name: 'company_number',
		type: 'string',
		required: true,
		default: '',
		placeholder: '00445790',
		displayOptions: {
			show: {
				resource: ['companiesHouse'],
				operation: ['company', 'filingHistory', 'officers'],
			},
		},
		routing: { request: { body: { company_number: '={{ $value }}' } } },
		description:
			'UK company number, as returned by Search Companies. It is zero-padded and upper-cased for you, so 445790 and sc090312 work as well as 00445790 and SC090312. Registry prefixes supported: SC, NI, OC, SO, NC, FC, BR and CE.',
	},

	// -- Additional Options: Search Companies --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['companiesHouse'], operation: ['search'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description:
					'Result page, 20 companies per page. Capped at page 50: the register serves a 1000-result window per term whatever hit count it prints, and answers page 51 with HTTP 416.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Officers --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['companiesHouse'], operation: ['officers'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Result page, 35 officers per page. There is no upper page bound: past the last page the register answers an ordinary 200 with an empty list, identical to a company that has no officers.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Filing History --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['companiesHouse'], operation: ['filingHistory'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Result page. There is no upper page bound: past the last page the register answers an ordinary 200 with an empty list.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
