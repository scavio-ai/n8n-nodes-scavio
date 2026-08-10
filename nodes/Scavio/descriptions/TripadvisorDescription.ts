import type { INodeProperties } from 'n8n-workflow';

const TRIPADVISOR_CATEGORIES = [
	{ name: 'Attractions', value: 'attractions' },
	{ name: 'Hotels', value: 'hotels' },
	{ name: 'Restaurants', value: 'restaurants' },
];

export const tripadvisorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['tripadvisor'] } },
		options: [
			{
				name: 'Get Location',
				value: 'location',
				action: 'Get a tripadvisor location',
				description:
					'Get one Tripadvisor location in full: rating, review histogram, per-aspect sub-ratings, city ranking, price band, cuisines, amenities, address, coordinates, contact, photos, and the FIRST PAGE OF REVIEWS. Page one of the reviews already rides along here, so use Get Reviews only to page past it. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/tripadvisor/location' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get tripadvisor reviews',
				description:
					'Get a page of Tripadvisor reviews: rating, trip date and type, reviewer home town and contribution count, and management response. Restaurants page 15 reviews at a time, hotels and attractions 10, and consecutive pages can repeat one review at the boundary, so de-duplicate on review_id when you concatenate. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/tripadvisor/reviews' } },
			},
			{
				name: 'Resolve Location IDs',
				value: 'locations',
				action: 'Resolve a tripadvisor location',
				description:
					'START HERE. Resolve a place or business NAME to the Tripadvisor geo ID and location ID pair every other Tripadvisor operation is keyed by, because those IDs exist only inside Tripadvisor URLs. A geo row answers Geo ID for Search Locations, a business row answers the pair Get Location and Get Reviews take. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/tripadvisor/locations' } },
			},
			{
				name: 'Search Locations',
				value: 'search',
				action: 'Search tripadvisor locations',
				description:
					'Search a Tripadvisor geo for restaurants, hotels or attractions in Tripadvisor rank order: rating, review count, price band, address, coordinates, phone, hours and Travelers Choice badge, with the location ID and geo ID pair on every row. 30 locations per page, and a page beyond the last is a 404 rather than an empty result. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/tripadvisor/search' } },
			},
		],
		default: 'locations',
	},
];

export const tripadvisorFields: INodeProperties[] = [
	// -- Resolve Location IDs --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Le Bernardin New York',
		displayOptions: { show: { resource: ['tripadvisor'], operation: ['locations'] } },
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Place or business name to resolve into Tripadvisor IDs',
	},

	// -- Search Locations: geo_id or url --
	{
		displayName: 'Search By',
		name: 'tripadvisorSearchBy',
		type: 'options',
		noDataExpression: true,
		default: 'geo_id',
		displayOptions: { show: { resource: ['tripadvisor'], operation: ['search'] } },
		options: [
			{ name: 'Geo ID', value: 'geo_id' },
			{ name: 'Listing URL', value: 'url' },
		],
		description: 'Whether to search by Tripadvisor geo ID or by a pasted listing URL',
	},
	{
		displayName: 'Geo ID',
		name: 'geo_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'g60763',
		displayOptions: {
			show: { resource: ['tripadvisor'], operation: ['search'], tripadvisorSearchBy: ['geo_id'] },
		},
		routing: { request: { body: { geo_id: '={{ $value }}' } } },
		description:
			'Tripadvisor geo ID, from a Resolve Location IDs row. Accepts 60763, g60763, or a URL carrying one.',
	},
	{
		displayName: 'Listing URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.tripadvisor.com/Restaurants-g60763-New_York_City_New_York.html',
		displayOptions: {
			show: { resource: ['tripadvisor'], operation: ['search'], tripadvisorSearchBy: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full tripadvisor.com listing URL, country sites and subdomains included',
	},

	// -- Get Location + Get Reviews: location_id (+ geo_id) or url --
	{
		displayName: 'Look Up By',
		name: 'tripadvisorLookup',
		type: 'options',
		noDataExpression: true,
		default: 'location_id',
		displayOptions: { show: { resource: ['tripadvisor'], operation: ['location', 'reviews'] } },
		options: [
			{ name: 'Location ID', value: 'location_id' },
			{ name: 'Location URL', value: 'url' },
		],
		description:
			'Whether to identify the location by its Tripadvisor IDs or by a pasted review page URL',
	},
	{
		displayName: 'Location ID',
		name: 'location_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'd1899234',
		displayOptions: {
			show: {
				resource: ['tripadvisor'],
				operation: ['location', 'reviews'],
				tripadvisorLookup: ['location_id'],
			},
		},
		routing: { request: { body: { location_id: '={{ $value }}' } } },
		description:
			'Tripadvisor location ID, from a Resolve Location IDs or Search Locations row. Accepts 1899234 or d1899234.',
	},
	{
		displayName: 'Geo ID',
		name: 'geo_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'g60763',
		displayOptions: {
			show: {
				resource: ['tripadvisor'],
				operation: ['location', 'reviews'],
				tripadvisorLookup: ['location_id'],
			},
		},
		routing: { request: { body: { geo_id: '={{ $value }}' } } },
		description:
			'Geo the location sits in, from the same Resolve Location IDs or Search Locations row. A bare location ID is not resolvable without it, and an unknown pair is answered with a billed city listing that the API restates as a 404.',
	},
	{
		displayName: 'Location URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder:
			'https://www.tripadvisor.com/Restaurant_Review-g60763-d1899234-Reviews-Le_Bernardin.html',
		displayOptions: {
			show: {
				resource: ['tripadvisor'],
				operation: ['location', 'reviews'],
				tripadvisorLookup: ['url'],
			},
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full tripadvisor.com review page URL, which already carries both IDs',
	},

	// -- Category: search, location, reviews --
	{
		displayName: 'Category',
		name: 'category',
		type: 'options',
		default: 'restaurants',
		displayOptions: {
			show: { resource: ['tripadvisor'], operation: ['location', 'reviews', 'search'] },
		},
		options: TRIPADVISOR_CATEGORIES,
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			"Which Tripadvisor family to read. Review page size differs by family, 15 for restaurants and 10 for hotels and attractions, so this must match the location's own type on any review page past the first.",
	},

	// -- Additional Options: Resolve Location IDs --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tripadvisor'], operation: ['locations'] } },
		options: [
			{
				displayName: 'Matches to Return',
				name: 'matchesToReturn',
				type: 'number',
				default: 12,
				typeOptions: { minValue: 1, maxValue: 20 },
				description:
					'How many matches to return, 1-20. This sizes one response, it is not a page param.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Search Locations --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tripadvisor'], operation: ['search'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Result page to fetch, 30 locations per page. A page beyond the last is a 404, not an empty result.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Get Reviews --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['tripadvisor'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 1 },
				description:
					'Review page to fetch, 15 per page for restaurants and 10 for hotels and attractions. Page 1 is already inside Get Location, so start at 2 to page past it.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
		],
	},
];
