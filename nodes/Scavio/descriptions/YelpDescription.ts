import type { INodeProperties } from 'n8n-workflow';

export const yelpOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['yelp'] } },
		options: [
			{
				name: 'Get Business',
				value: 'business',
				action: 'Get a yelp business',
				description:
					'One business in full: per-star histogram, review count, price band, categories, address and coordinates, phone, website and menu links, hours and holidays, amenities, photos and videos, popular items, health inspections, questions and answers, licences and claim status. The first page of reviews rides along at no extra cost, so do not follow this with Get Reviews on page 1. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/yelp/business' } },
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get yelp reviews',
				description:
					'A page of reviews: rating, full text, language, author profile and expertise counts, attached photos, reaction counts and owner response. Page 1 re-fetches the document Get Business already returned and costs another 2 credits, so start at page 2. Yelp fixes the page size at 10 and a page past the last review answers 404 rather than an empty list. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/yelp/reviews' } },
			},
			{
				name: 'Search Businesses',
				value: 'search',
				action: 'Search yelp businesses',
				description:
					'Businesses in Yelp ranked order: rating, review count, price band, categories, address, contact rails, hours, photos and a review snippet. Every row carries both business_id and alias, either of which feeds Get Business. Yelp fixes the page size at 10, so count reports the rows on this page while total_results carries the Yelp headline figure. Costs 2 credits.',
				routing: { request: { method: 'POST', url: '/api/v1/yelp/search' } },
			},
		],
		default: 'search',
	},
];

export const yelpFields: INodeProperties[] = [
	// -- Search Businesses --
	{
		displayName: 'Search By',
		name: 'yelpSearchBy',
		type: 'options',
		noDataExpression: true,
		default: 'terms',
		displayOptions: { show: { resource: ['yelp'], operation: ['search'] } },
		options: [
			{ name: 'Search URL', value: 'url' },
			{ name: 'Term and Location', value: 'terms' },
		],
		description: 'Whether to search by term plus location or by a full Yelp search URL',
	},
	{
		displayName: 'Term',
		name: 'term',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'coffee',
		displayOptions: {
			show: { resource: ['yelp'], operation: ['search'], yelpSearchBy: ['terms'] },
		},
		routing: { request: { body: { term: '={{ $value }}' } } },
		description: 'What to look for, such as a cuisine, a service or a business name',
	},
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Austin, TX',
		displayOptions: {
			show: { resource: ['yelp'], operation: ['search'], yelpSearchBy: ['terms'] },
		},
		routing: { request: { body: { location: '={{ $value }}' } } },
		description:
			'City, address or postcode the search is centred on. Yelp geolocates a location-less search off the proxy exit, so the same request would answer about a different metro from run to run.',
	},
	{
		displayName: 'Search URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.yelp.com/search?find_desc=coffee&find_loc=Austin%2C+TX',
		displayOptions: {
			show: { resource: ['yelp'], operation: ['search'], yelpSearchBy: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full yelp.com/search URL, used instead of term plus location',
	},

	// -- Shared identifier (business, reviews) --
	{
		displayName: 'Lookup By',
		name: 'yelpLookup',
		type: 'options',
		noDataExpression: true,
		default: 'business_id',
		displayOptions: { show: { resource: ['yelp'], operation: ['business', 'reviews'] } },
		options: [
			{ name: 'Business ID', value: 'business_id' },
			{ name: 'Business URL', value: 'url' },
		],
		description: 'Whether to identify the business by its Yelp business ID or by its Yelp URL',
	},
	{
		displayName: 'Business ID',
		name: 'business_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'desnudo-coffee-austin-2',
		displayOptions: {
			show: { resource: ['yelp'], operation: ['business', 'reviews'], yelpLookup: ['business_id'] },
		},
		routing: { request: { body: { business_id: '={{ $value }}' } } },
		description:
			'Yelp alias such as desnudo-coffee-austin-2, an opaque encid, or a yelp.com/biz URL. Search Businesses returns both business_id and alias on every row.',
	},
	{
		displayName: 'Business URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.yelp.com/biz/desnudo-coffee-austin-2',
		displayOptions: {
			show: { resource: ['yelp'], operation: ['business', 'reviews'], yelpLookup: ['url'] },
		},
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'Full yelp.com/biz URL for the business',
	},

	// -- Additional Options: Search Businesses --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['yelp'], operation: ['search'] } },
		options: [
			{
				displayName: 'Attributes',
				name: 'attributes',
				type: 'string',
				typeOptions: { multipleValues: true },
				default: [],
				placeholder: 'RestaurantsDelivery',
				description:
					'Raw Yelp filter aliases sent as attrs, such as RestaurantsDelivery, GoodForKids or WheelchairAccessible, up to 20. This is a deliberate passthrough rather than a closed list, and Yelp silently ignores an alias it does not know, returning unfiltered results.',
				routing: { request: { body: { attributes: '={{ $value }}' } } },
			},
			{
				displayName: 'Open Now',
				name: 'open_now',
				type: 'boolean',
				default: false,
				description: 'Whether to return only businesses that are open at request time',
				routing: { request: { body: { open_now: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description:
					'Results page. Yelp fixes the page size at 10, so each further page is another call at 2 credits.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Price Bands',
				name: 'price',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '$', value: 1 },
					{ name: '$$', value: 2 },
					{ name: '$$$', value: 3 },
					{ name: '$$$$', value: 4 },
				],
				description: 'Yelp price bands to include, from $ through $$$$',
				routing: { request: { body: { price: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Rating', value: 'rating' },
					{ name: 'Recommended', value: 'recommended' },
					{ name: 'Review Count', value: 'review_count' },
				],
				description:
					'Result ordering. Only these three are exposed because Yelp ignores an unrecognised value and serves default ranking under a billed 200, so a sort that never ran still costs 2 credits.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
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
		displayOptions: { show: { resource: ['yelp'], operation: ['reviews'] } },
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 1 },
				description:
					'Results page, 10 reviews per page. This defaults to 2 because page 1 only repeats the reviews Get Business already returned, at another 2 credits. A page past the last review answers 404 rather than an empty list.',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'rating',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description:
					'Return only reviews carrying this star rating. It moves filtered_review_count on the response, not review_count.',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'relevance',
				options: [
					{ name: 'Elites', value: 'elites' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Rating: High to Low', value: 'rating_high' },
					{ name: 'Rating: Low to High', value: 'rating_low' },
					{ name: 'Relevance', value: 'relevance' },
				],
				description:
					'Review ordering. Only these six are exposed because Yelp ignores an unrecognised value and serves default ranking under a billed 200.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},
];
