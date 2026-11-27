import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['reclameaqui'], operation, ...extra },
});

// Reclame Aqui (reclameaqui.com.br, Brazil's company complaint and reputation site), 8 operations, 1 credit each,
// Get Company Complaints by shortname 2 (3 when the search misses); credits_used is the truth. Brazil only, pt-BR.
// Every operation carries a 120s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 120000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	"Reclame Aqui (reclameaqui.com.br, Brazil's company complaint and reputation site), Portuguese text as published";
const ONE =
	'Refused inputs and upstream failures are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PII =
	"Consumer names, emails, IPs, user IDs, phones and cities are never returned (the consumer's state is); a consumer's name in a company's greeting is replaced with [nome].";
const ITEM =
	'complaints (position, ID for Get Complaint, title, excerpt, URL, status, solved, evaluated, score, would_deal_again, evaluation, created, first_answer_at, interaction_count, category, product, problem, special, state, company)';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const pageOption = (name: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: 101 },
	description:
		'Page, 1-based. Reclame Aqui serves up to offset 500 per filter combination: page 51 at 10 a page, page 101 at 5.',
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const pageSizeOption = (name: string): INodeProperties => ({
	displayName: 'Page Size',
	name,
	type: 'options',
	default: 10,
	options: [
		{ name: '5', value: 5 },
		{ name: '10', value: 10 },
	],
	description: 'Complaints per page, the two sizes Reclame Aqui serves',
	routing: { request: { body: { page_size: '={{ $value === 10 ? undefined : $value }}' } } },
});

const filterIdOption = (displayName: string, name: string, key: string, list: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	description: `Only complaints with this ${key}: an ID from filters.${list} of an answer`,
	routing: { request: { body: { [key]: '={{ String($value).trim() || undefined }}' } } },
});

export const reclameaquiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['reclameaqui'] } },
		options: [
			{
				name: 'Get Company',
				value: 'company',
				action: 'Get a reclameaqui company',
				description: `One company's reputation on ${SITE} by shortname or link: ID, shortname, name, CNPJ, plan, verified, website, city, state, the company's published phones, social networks, time on the platform, page views, segments, reputation for each of 5 periods (complaints, answered, ratings, answered and solved percent, would do business again percent, consumer and final score, average answer time, status RA1000 to NOT_RECOMMENDED), main problems, segment ranking, 6 months of reputation history, the company's notice and related companies. An unknown shortname is a charged not-found. Captured 2026-11-27: Nubank over 6 months had 56825 complaints, 93.2% solved, final score 8.8, RA1000. ${ONE}`,
				routing: request('/api/v1/reclameaqui/company'),
			},
			{
				name: 'Get Company Complaints',
				value: 'complaints',
				action: 'Get reclameaqui company complaints',
				description: `One company's complaints on ${SITE}, newest first, with the site's tabs (status), category, product and problem filters, Black Friday purchases and a keyword inside the company; 5 or 10 a page, up to 51 pages of 10 per filter combination, with the exact total: total, total_pages, reachable_pages, ${ITEM}, filters (categories, products, problems with IDs and counts) and note. ${PII} Captured 2026-11-27: Nubank had 164495 resolved complaints. Costs 1 credit by Company ID, 2 by Shortname (3 when the search misses it); credits_used says what was charged. Refused inputs and upstream failures are not charged; a not-found is charged.`,
				routing: request('/api/v1/reclameaqui/complaints'),
			},
			{
				name: 'Get Complaint',
				value: 'complaint',
				action: 'Get a reclameaqui complaint',
				description: `One complaint on ${SITE} with its whole thread, by link, or company with complaint ID: title, text, URL, status, solved, evaluated, score, would_deal_again, created, category, problem, product, special, state, company, segment_ranking, interactions (type company_answer, consumer_reply, company_reply or final_evaluation, author company or consumer, created, text), names_masked, similar complaints and note. ${PII} An unknown complaint is a charged not-found. Captured 2026-11-27: a resolved Nubank complaint scored 10 with 2 interactions. ${ONE}`,
				routing: request('/api/v1/reclameaqui/complaint'),
			},
			{
				name: 'Get Rankings',
				value: 'rankings',
				action: 'Get reclameaqui rankings',
				description: `The ${SITE} site-wide company rankings: 11 lists of 20 as the site shows them (best resolution rate, would do business again, best rating, most resolved, most complained over several periods, worst of the last 30 days, newly registered), each with name, period, URL and companies (position, name, shortname, URL, reputation_label, value, value_text). Captured 2026-11-27: most_complained_30_days listed 20 companies. ${ONE}`,
				routing: request('/api/v1/reclameaqui/rankings', true),
			},
			{
				name: 'Get Segment Ranking',
				value: 'segmentRanking',
				action: 'Get a reclameaqui segment ranking',
				description: `The best and worst companies of one ${SITE} segment, as the segment page ranks them (page 1: best and worst, 10 each; later pages: the next 10 best): segment_name, main_segment_name, best and worst (total, pages, companies with reputation, final_score, solved_percent, answered_percent, complaints, solved and unsolved complaints) and note. An unknown segment is a charged not-found. Captured 2026-11-27: Bancos Digitais ranked 40 companies best. ${ONE}`,
				routing: request('/api/v1/reclameaqui/segment-ranking'),
			},
			{
				name: 'Get Segments',
				value: 'segments',
				action: 'Get reclameaqui segments',
				description: `Every ranked segment of ${SITE}, for Get Segment Ranking: main_segments, count and segments (main_segment, main_segment_name, segment, name, URL). Captured 2026-11-27: 165 segments under 15 main segments. ${ONE}`,
				routing: request('/api/v1/reclameaqui/segments', true),
			},
			{
				name: 'Search Companies',
				value: 'companySearch',
				action: 'Search reclameaqui companies',
				description: `Find companies on ${SITE} with the site's own company search (about 7 matches, no paging): companies (ID for Get Company Complaints, shortname for Get Company, name, URL, reputation, final_score, solved_percent, complaints_6_months, CNPJ, city, state, website, main_segment, segment, verified, previous_names, sub_brands). Captured 2026-11-27: nubank matched 6 companies, the first Nubank, RA1000. ${ONE}`,
				routing: request('/api/v1/reclameaqui/company-search'),
			},
			{
				name: 'Search Complaints',
				value: 'complaintSearch',
				action: 'Search reclameaqui complaints',
				description: `Complaints across every company on ${SITE} that match some words, 5 or 10 a page, up to 51 pages of 10: total, total_pages, reachable_pages, ${ITEM}, companies (the companies the matches are about, with counts) and note. ${PII} Captured 2026-11-27: iphone quebrado matched 3774 complaints about 50 companies. ${ONE}`,
				routing: request('/api/v1/reclameaqui/complaint-search'),
			},
		],
		default: 'companySearch',
	},
];

export const reclameaquiFields: INodeProperties[] = [
	// -- Search Companies --
	{
		displayName: 'Query',
		name: 'reclameaquiCompanyQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nubank',
		displayOptions: show(['companySearch']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Company name or brand (2 to 100 characters)',
	},

	// -- Get Company --
	{
		displayName: 'Shortname or URL',
		name: 'reclameaquiCompany',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nubank',
		displayOptions: show(['company']),
		routing: {
			request: {
				body: {
					shortname: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description:
			'A company shortname (shortname from Search Companies; the part after /empresa/ in a reclameaqui.com.br link) or a company link',
	},

	// -- Get Company Complaints --
	{
		displayName: 'Company',
		name: 'reclameaquiComplaintsCompany',
		type: 'string',
		required: true,
		default: '',
		placeholder: '88850',
		displayOptions: show(['complaints']),
		routing: {
			request: {
				body: {
					company_id: '={{ /^\\d+$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					shortname: '={{ /^\\d+$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description:
			'A company ID (ID from Search Companies or Get Company, 1 credit) or a company shortname (looked up first, 2 credits)',
	},
	{
		displayName: 'Additional Options',
		name: 'reclameaquiComplaintsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['complaints']),
		options: sorted([
			{
				displayName: 'Black Friday Purchases Only',
				name: 'reclameaquiComplaintsBlackFriday',
				type: 'boolean',
				default: false,
				description: 'Whether to list only complaints the consumer marked as Black Friday purchases',
				routing: { request: { body: { black_friday: '={{ $value ? true : undefined }}' } } },
			},
			filterIdOption('Category ID', 'reclameaquiComplaintsCategory', 'category', 'categories'),
			pageOption('reclameaquiComplaintsPage'),
			pageSizeOption('reclameaquiComplaintsPageSize'),
			filterIdOption('Problem ID', 'reclameaquiComplaintsProblem', 'problem', 'problems'),
			filterIdOption('Product ID', 'reclameaquiComplaintsProduct', 'product', 'products'),
			{
				displayName: 'Query',
				name: 'reclameaquiComplaintsQuery',
				type: 'string',
				default: '',
				placeholder: 'cartão bloqueado',
				description: "Only this company's complaints that match these words",
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Status',
				name: 'reclameaquiComplaintsStatus',
				type: 'options',
				default: 'latest',
				options: [
					{ name: 'Answered (Not Yet Evaluated)', value: 'answered' },
					{ name: 'Evaluated', value: 'evaluated' },
					{ name: 'Latest (Every Complaint)', value: 'latest' },
					{ name: 'Not Resolved', value: 'not_resolved' },
					{ name: 'Resolved', value: 'resolved' },
					{ name: 'Unanswered', value: 'unanswered' },
				],
				description: "The site's complaint tabs",
				routing: { request: { body: { status: '={{ $value === "latest" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Complaint --
	{
		displayName: 'Complaint URL',
		name: 'reclameaquiComplaintUrl',
		type: 'string',
		default: '',
		displayOptions: show(['complaint']),
		routing: { request: { body: { url: '={{ String($value).trim() || undefined }}' } } },
		description: 'A complaint link (URL from a complaints answer). Leave empty to use Company Shortname and Complaint ID.',
	},
	{
		displayName: 'Company Shortname',
		name: 'reclameaquiComplaintCompany',
		type: 'string',
		default: '',
		placeholder: 'nubank',
		displayOptions: show(['complaint']),
		routing: { request: { body: { company: '={{ String($value).trim() || undefined }}' } } },
		description: 'The company shortname, with Complaint ID, instead of a URL',
	},
	{
		displayName: 'Complaint ID',
		name: 'reclameaquiComplaintId',
		type: 'string',
		default: '',
		placeholder: 'NhIy-6O6osFhQdJ-',
		displayOptions: show(['complaint']),
		routing: { request: { body: { complaint_id: '={{ String($value).trim() || undefined }}' } } },
		description: 'The 16-character complaint ID (ID from a complaints answer), with Company Shortname',
	},

	// -- Search Complaints --
	{
		displayName: 'Query',
		name: 'reclameaquiComplaintSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'iphone quebrado',
		displayOptions: show(['complaintSearch']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Words to find in complaints across every company',
	},
	{
		displayName: 'Additional Options',
		name: 'reclameaquiComplaintSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['complaintSearch']),
		options: sorted([
			pageOption('reclameaquiComplaintSearchPage'),
			pageSizeOption('reclameaquiComplaintSearchPageSize'),
		]),
	},

	// -- Get Rankings --
	{
		displayName: 'List',
		name: 'reclameaquiRankingList',
		type: 'options',
		default: 'all',
		options: [
			{ name: 'All 11 Lists', value: 'all' },
			{ name: 'Best Rating', value: 'best_rating' },
			{ name: 'Best Resolution Rate', value: 'best_resolution_rate' },
			{ name: 'Most Complained (30 Days)', value: 'most_complained_30_days' },
			{ name: 'Most Complained (6 Months)', value: 'most_complained_6_months' },
			{ name: 'Most Complained (7 Days)', value: 'most_complained_7_days' },
			{ name: 'Most Complained (Yesterday)', value: 'most_complained_yesterday' },
			{ name: 'Most Resolved (30 Days)', value: 'most_resolved_30_days' },
			{ name: 'Most Resolved (6 Months)', value: 'most_resolved_6_months' },
			{ name: 'Newly Registered', value: 'newly_registered' },
			{ name: 'Worst (Last 30 Days)', value: 'worst' },
			{ name: 'Would Do Business Again', value: 'would_do_business_again' },
		],
		displayOptions: show(['rankings']),
		routing: { request: { body: { list: '={{ $value === "all" ? undefined : $value }}' } } },
	},

	// -- Get Segment Ranking --
	{
		displayName: 'Main Segment',
		name: 'reclameaquiMainSegment',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bancos-e-financeiras',
		displayOptions: show(['segmentRanking']),
		routing: { request: { body: { main_segment: '={{ String($value).trim() }}' } } },
		description: 'Main segment shortname (main_segment from Get Segments)',
	},
	{
		displayName: 'Segment',
		name: 'reclameaquiSegment',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'bancos-digitais',
		displayOptions: show(['segmentRanking']),
		routing: { request: { body: { segment: '={{ String($value).trim() }}' } } },
		description: 'Segment shortname (segment from Get Segments)',
	},
	{
		displayName: 'Page',
		name: 'reclameaquiSegmentPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: show(['segmentRanking']),
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		description: 'Page of the best list, 10 a page. Page 1 also carries the 10 worst.',
	},
];
