import type { INodeProperties } from 'n8n-workflow';

// Company Enrich: one operation. Calls usually take 10-45 s, but slow sites were measured at
// 101-125 s (2026-11-12), so the route carries a 180 s request timeout. Website and
// Place ID are each optional, but the API answers 400 unless at least one is sent, so both
// fields send nothing when left empty.

const ENRICH_TIMEOUT_MS = 180000;

export const companyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['company'] } },
		options: [
			{
				name: 'Enrich',
				value: 'enrich',
				action: 'Enrich a company',
				description:
					"Find a company's contact details and its owner from its website or a Google Maps place_id: published emails, phone numbers, social profiles and contact page, plus the owner's name and title with the page that names them. Use after Google Maps Search: pass each result's place_id. 10 credits from a website, 20 from a place_id; unreachable sites are free. Takes 10-45s.",
				routing: {
					request: { method: 'POST', url: '/api/v1/company/enrich', timeout: ENRICH_TIMEOUT_MS },
				},
			},
		],
		default: 'enrich',
	},
];

export const companyFields: INodeProperties[] = [
	{
		displayName:
			'Fill in Website or Place ID: at least one is required. Calls usually take 10-45 seconds, up to about 2 minutes on a slow site. 10 credits from a website, 20 from a place ID (1 when the Maps listing has no readable website); a website that cannot be reached is not charged.',
		name: 'companyEnrichNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource: ['company'], operation: ['enrich'] } },
	},
	{
		displayName: 'Website',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://reliantplumbing.com',
		displayOptions: { show: { resource: ['company'], operation: ['enrich'] } },
		routing: { request: { body: { url: '={{ String($value).trim() || undefined }}' } } },
		description:
			"The company's own website; a bare domain works. Social profile URLs (Facebook, Instagram, LinkedIn and so on) are rejected. Fill in this or Place ID. If both are set, this is the site that gets read.",
	},
	{
		displayName: 'Place ID',
		name: 'place_id',
		type: 'string',
		default: '',
		placeholder: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
		displayOptions: { show: { resource: ['company'], operation: ['enrich'] } },
		routing: { request: { body: { place_id: '={{ String($value).trim() || undefined }}' } } },
		description:
			"A Google Maps place ID, as returned in local_results[].place_id by the Google resource's Maps Search operation. The listing (name, address, phone, website) is looked up first, then its website is read. Fill in this or Website.",
	},
];
