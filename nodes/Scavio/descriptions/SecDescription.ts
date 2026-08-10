import type { INodeProperties } from 'n8n-workflow';

export const secOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['sec'] } },
		options: [
			{
				name: 'Get Company Profile',
				value: 'company',
				action: 'Get a SEC EDGAR company profile',
				description:
					'Get a filer profile: legal and former names, SIC industry, filer category, EIN, LEI, state of incorporation, fiscal year end, business and mailing addresses, every ticker with its exchange, and a preview of its 10 most recent filings',
				routing: { request: { method: 'POST', url: '/api/v1/sec/company' } },
			},
			{
				name: 'Get Filings',
				value: 'filings',
				action: 'Get SEC EDGAR filings',
				description:
					"Get a page of one filer's filings: accession number, form and root form, filing and period dates, 8-K item codes, and direct links to the primary document, filing index and attachment directory",
				routing: { request: { method: 'POST', url: '/api/v1/sec/filings' } },
			},
			{
				name: 'Get XBRL Concept',
				value: 'concept',
				action: 'Get a SEC EDGAR XBRL concept',
				description:
					'Get every value a filer reported for one XBRL concept, newest period first, with the form and filing each number came from. Restatements are kept, not collapsed.',
				routing: { request: { method: 'POST', url: '/api/v1/sec/concept' } },
			},
			{
				name: 'Get XBRL Facts Index',
				value: 'facts',
				action: 'Get SEC EDGAR XBRL facts',
				description:
					'Get the index of every XBRL concept a filer reports, with tag, label, description, units and most recent value. This is how you find what to ask Get XBRL Concept for.',
				routing: { request: { method: 'POST', url: '/api/v1/sec/facts' } },
			},
			{
				name: 'Look Up Company',
				value: 'lookup',
				action: 'Look up a SEC EDGAR company',
				description:
					'START HERE. Resolve a company name or a ticker such as AAPL to the CIK such as 0000320193 that every other SEC EDGAR operation is keyed by.',
				routing: { request: { method: 'POST', url: '/api/v1/sec/lookup' } },
			},
			{
				name: 'Search Filings Full Text',
				value: 'search',
				action: 'Search SEC EDGAR filings',
				description:
					'Search the full text of EDGAR filings, 2001 to today. Each hit is the matching document with its URL, form, filing date and filer identity, plus facets breaking the whole result set down by company, form, industry and state.',
				routing: { request: { method: 'POST', url: '/api/v1/sec/search' } },
			},
		],
		default: 'lookup',
	},
];

export const secFields: INodeProperties[] = [
	// -- Look Up Company --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Apple',
		displayOptions: { show: { resource: ['sec'], operation: ['lookup'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Ticker, company name, or a fragment of one',
	},

	// -- Filer identity, shared by Company Profile / Filings / XBRL Concept / XBRL Facts Index --
	{
		displayName: 'Lookup By',
		name: 'filerLookup',
		type: 'options',
		noDataExpression: true,
		default: 'ticker',
		displayOptions: {
			show: { resource: ['sec'], operation: ['company', 'concept', 'facts', 'filings'] },
		},
		options: [
			{ name: 'CIK', value: 'cik' },
			{ name: 'Ticker', value: 'ticker' },
		],
		description: 'Whether to identify the filer by its CIK or by its ticker',
	},
	{
		displayName: 'CIK',
		name: 'cik',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0000320193',
		displayOptions: {
			show: {
				resource: ['sec'],
				operation: ['company', 'concept', 'facts', 'filings'],
				filerLookup: ['cik'],
			},
		},
		routing: { request: { body: { cik: '={{ $value }}' } } },
		description:
			'Central Index Key, in any of the forms 320193, 0000320193 or CIK0000320193. Use Look Up Company to resolve one from a name or ticker.',
	},
	{
		displayName: 'Ticker',
		name: 'ticker',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'AAPL',
		displayOptions: {
			show: {
				resource: ['sec'],
				operation: ['company', 'concept', 'facts', 'filings'],
				filerLookup: ['ticker'],
			},
		},
		routing: { request: { body: { ticker: '={{ $value }}' } } },
		description: 'Ticker symbol, dotted or dashed (BRK.B or BRK-B)',
	},

	// -- Get XBRL Concept --
	{
		displayName: 'Concept',
		name: 'concept',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'NetIncomeLoss',
		displayOptions: { show: { resource: ['sec'], operation: ['concept'] } },
		routing: { request: { body: { concept: '={{ $value }}' } } },
		description:
			'XBRL concept tag, CASE-SENSITIVE: netincomeloss is a 404 upstream, not a match. Run Get XBRL Facts Index first to list what this filer actually reports.',
	},

	// -- Search Filings Full Text --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		placeholder: '"climate risk"',
		displayOptions: { show: { resource: ['sec'], operation: ['search'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'A quoted phrase matches exactly, bare words match as a bag of terms. The query is optional: a CIK, ticker, form or date filter on its own is a valid search. Coverage starts in 2001.',
	},

	// -- Additional Options: Look Up Company --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['sec'], operation: ['lookup'] } },
		options: [
			{
				displayName: 'Exchange',
				name: 'exchange',
				type: 'options',
				default: 'NASDAQ',
				options: [
					{ name: 'CBOE', value: 'CBOE' },
					{ name: 'NASDAQ', value: 'NASDAQ' },
					{ name: 'NYSE', value: 'NYSE' },
					{ name: 'OTC', value: 'OTC' },
				],
				description:
					'Listing exchange to restrict matches to. Filers that are listed with no exchange at all are excluded by any value here.',
				routing: { request: { body: { exchange: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'resultLimit',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 100 },
				description:
					'How many matching filers to return, 1-100. This sizes the response, it is not a page param.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Filings --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['sec'], operation: ['filings'] } },
		options: [
			{
				displayName: 'Date From',
				name: 'date_from',
				type: 'string',
				default: '',
				placeholder: '2024-01-01',
				description: 'Earliest filing date to include, as YYYY-MM-DD',
				routing: { request: { body: { date_from: '={{ $value }}' } } },
			},
			{
				displayName: 'Date To',
				name: 'date_to',
				type: 'string',
				default: '',
				placeholder: '2024-12-31',
				description: 'Latest filing date to include, as YYYY-MM-DD',
				routing: { request: { body: { date_to: '={{ $value }}' } } },
			},
			{
				displayName: 'Form Types',
				name: 'form',
				type: 'string',
				default: '',
				placeholder: '10-K,8-K',
				description:
					'Form types to include, comma-separated. Each is matched against the form AND its root form, so 10-K also returns 10-K/A amendments; ask for 10-K/A to get only the amendments.',
				routing: { request: { body: { form: '={{ $value }}' } } },
			},
			{
				displayName: 'Include History',
				name: 'include_history',
				type: 'boolean',
				default: false,
				description:
					"Whether to also read up to 10 archived filing shards, still for 1 credit. EDGAR's recent block is not a fixed window: a decade for a quiet filer, about a year for a prolific one. history_truncated in the response flags a filer that had more.",
				routing: { request: { body: { include_history: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'resultLimit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 500 },
				description: 'How many filings to return per page, 1-500',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to fetch',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get XBRL Concept --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['sec'], operation: ['concept'] } },
		options: [
			{
				displayName: 'Form',
				name: 'form',
				type: 'string',
				default: '',
				placeholder: '10-K',
				description:
					'Single form to restrict the values to. Matching is EXACT here, so 10-K excludes 10-K/A amendments, the opposite of Get Filings.',
				routing: { request: { body: { form: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'resultLimit',
				type: 'number',
				default: 250,
				typeOptions: { minValue: 1, maxValue: 2000 },
				description:
					'How many reported values to return, 1-2000. This sizes the response, it is not a page param.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Taxonomy',
				name: 'taxonomy',
				type: 'string',
				default: 'us-gaap',
				placeholder: 'us-gaap',
				description: 'XBRL taxonomy the concept belongs to: us-gaap, dei, ifrs-full or srt',
				routing: { request: { body: { taxonomy: '={{ $value }}' } } },
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'string',
				default: '',
				placeholder: 'USD',
				description: 'Unit to restrict the values to, such as USD or USD/shares',
				routing: { request: { body: { unit: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get XBRL Facts Index --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['sec'], operation: ['facts'] } },
		options: [
			{
				displayName: 'Filter',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'revenue',
				description:
					'Case-insensitive substring matched against both the concept tag name and its label',
				routing: { request: { body: { query: '={{ $value }}' } } },
			},
			{
				displayName: 'Limit',
				name: 'resultLimit',
				type: 'number',
				default: 250,
				typeOptions: { minValue: 1, maxValue: 2000 },
				description:
					'How many concepts to return, 1-2000. This sizes the response, it is not a page param.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Taxonomy',
				name: 'taxonomy',
				type: 'string',
				default: '',
				placeholder: 'us-gaap',
				description: 'Restrict the index to one taxonomy, such as us-gaap or dei',
				routing: { request: { body: { taxonomy: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Search Filings Full Text --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['sec'], operation: ['search'] } },
		options: [
			{
				displayName: 'CIK',
				name: 'cik',
				type: 'string',
				default: '',
				placeholder: '0000320193',
				description: 'Restrict the search to one filer by CIK. A ticker is accepted here too.',
				routing: { request: { body: { cik: '={{ $value }}' } } },
			},
			{
				displayName: 'Date From',
				name: 'date_from',
				type: 'string',
				default: '',
				placeholder: '2024-01-01',
				description: 'Earliest filing date to include, as YYYY-MM-DD. Coverage starts in 2001.',
				routing: { request: { body: { date_from: '={{ $value }}' } } },
			},
			{
				displayName: 'Date To',
				name: 'date_to',
				type: 'string',
				default: '',
				placeholder: '2024-12-31',
				description: 'Latest filing date to include, as YYYY-MM-DD',
				routing: { request: { body: { date_to: '={{ $value }}' } } },
			},
			{
				displayName: 'Form Types',
				name: 'form',
				type: 'string',
				default: '',
				placeholder: '10-K',
				description: 'Form type to restrict the search to',
				routing: { request: { body: { form: '={{ $value }}' } } },
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'CA',
				description:
					"EDGAR's own two-character location code, such as CA or NY, plus alphanumeric codes for foreign jurisdictions",
				routing: { request: { body: { location: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100 },
				description:
					'Result page, 100 documents per page. Capped at page 100 because the index refuses a result window past 10,000.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description: 'Order the matching documents are returned in',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Ticker',
				name: 'ticker',
				type: 'string',
				default: '',
				placeholder: 'AAPL',
				description: 'Restrict the search to one filer by ticker',
				routing: { request: { body: { ticker: '={{ $value }}' } } },
			},
		],
	},
];
