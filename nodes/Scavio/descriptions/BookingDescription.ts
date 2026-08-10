import type { INodeProperties } from 'n8n-workflow';

export const bookingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['booking'] } },
		options: [
			{
				name: 'Get Hotel',
				value: 'hotel',
				action: 'Get a booking hotel',
				description:
					'Get one Booking.com property in full: rooms and rate plans, facilities, house rules, check-in windows, policies, images, location and review scores, priced for the stay you ask for. Booking prices a STAY, so with no dates it returns prices for a two-night range of its own choosing and the response echoes whichever dates were used. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/booking/hotel' } },
			},
			{
				name: 'Get Hotel Reviews',
				value: 'reviews',
				action: 'Get booking hotel reviews',
				description:
					"Get Booking.com guest reviews with the score breakdown by category and Booking's own praise and complaint summary. There is no page param on this endpoint: total_count is the whole review history, count is what this response holds. Costs 1 credit.",
				routing: { request: { method: 'POST', url: '/api/v1/booking/reviews' } },
			},
			{
				name: 'Search Properties',
				value: 'search',
				action: 'Search booking properties',
				description:
					'Search Booking.com for a destination and stay: live nightly price, review score, star rating, location, room type and deal badges, 25 properties per page. Send Check-In Date and Check-Out Date together, because a lone check-in makes Booking price a default range of its own and bill you for dates nobody asked for. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/booking/search' } },
			},
		],
		default: 'search',
	},
];

export const bookingFields: INodeProperties[] = [
	// -- Search: destination name or dest_id --
	{
		displayName: 'Search By',
		name: 'bookingSearchBy',
		type: 'options',
		noDataExpression: true,
		default: 'destination',
		displayOptions: { show: { resource: ['booking'], operation: ['search'] } },
		options: [
			{ name: 'Destination ID', value: 'dest_id' },
			{ name: 'Destination Name', value: 'destination' },
		],
		description:
			'Whether to search by destination name or by a Booking.com destination ID. One of the two is required: a search carrying neither returns the Booking homepage, which costs a credit and returns nothing.',
	},
	{
		displayName: 'Destination',
		name: 'destination',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Lisbon',
		displayOptions: {
			show: { resource: ['booking'], operation: ['search'], bookingSearchBy: ['destination'] },
		},
		routing: { request: { body: { destination: '={{ $value }}' } } },
		description: 'City, region, district, landmark, airport or property name to search',
	},
	{
		displayName: 'Destination ID',
		name: 'dest_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '-2167973',
		displayOptions: {
			show: { resource: ['booking'], operation: ['search'], bookingSearchBy: ['dest_id'] },
		},
		routing: { request: { body: { dest_id: '={{ $value }}' } } },
		description: 'Numeric Booking.com dest_id, as carried by a booking.com search URL',
	},
	{
		displayName: 'Destination Type',
		name: 'dest_type',
		type: 'options',
		default: 'city',
		displayOptions: {
			show: { resource: ['booking'], operation: ['search'], bookingSearchBy: ['dest_id'] },
		},
		options: [
			{ name: 'Airport', value: 'airport' },
			{ name: 'City', value: 'city' },
			{ name: 'Country', value: 'country' },
			{ name: 'District', value: 'district' },
			{ name: 'Hotel', value: 'hotel' },
			{ name: 'Landmark', value: 'landmark' },
			{ name: 'Region', value: 'region' },
		],
		routing: { request: { body: { dest_type: '={{ $value }}' } } },
		description:
			'What the Destination ID points at, taken from the same booking.com URL. Booking silently ignores this without a Destination ID, so the API rejects it when you search by name.',
	},

	// -- Hotel + Reviews: shared property identifier --
	{
		displayName: 'Hotel URL or Slug',
		name: 'hotel',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.booking.com/hotel/pt/memmo-alfama.html',
		displayOptions: { show: { resource: ['booking'], operation: ['hotel', 'reviews'] } },
		routing: { request: { body: { hotel: '={{ $value }}' } } },
		description:
			'Booking.com property URL, or the bare page slug. Chain the URL a Search Properties row returns, because a wrong Country Code on a bare slug is a real 404 that is still billed. Query params are discarded.',
	},

	// -- Additional Options: Search --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['booking'], operation: ['search'] } },
		options: [
			{
				displayName: 'Adults',
				name: 'adults',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 1 },
				description: 'Number of adults in the party, Booking prices 2 when unset',
				routing: { request: { body: { adults: '={{ $value }}' } } },
			},
			{
				displayName: 'Breakfast Included',
				name: 'breakfast_included',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only properties whose rate includes breakfast',
				routing: { request: { body: { breakfast_included: '={{ $value }}' } } },
			},
			{
				displayName: 'Check-In Date',
				name: 'checkin',
				type: 'string',
				default: '',
				placeholder: '2026-09-14',
				description:
					'Start of the stay as YYYY-MM-DD. Must be sent with Check-Out Date: Booking ignores a lone check-in and prices a default range of its own, returning real prices for dates you never asked for.',
				routing: { request: { body: { checkin: '={{ $value }}' } } },
			},
			{
				displayName: 'Check-Out Date',
				name: 'checkout',
				type: 'string',
				default: '',
				placeholder: '2026-09-17',
				description: 'End of the stay as YYYY-MM-DD. Must be sent with Check-In Date.',
				routing: { request: { body: { checkout: '={{ $value }}' } } },
			},
			{
				displayName: 'Children Ages',
				name: 'children_ages',
				type: 'string',
				default: '',
				placeholder: '4,9',
				description:
					'Comma-separated AGES of the children travelling, not a count. Up to 10 children, each aged 0-17.',
				routing: {
					request: {
						body: { children_ages: '={{ $value.split(",").map((age) => Number(age.trim())) }}' },
					},
				},
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'USD',
				placeholder: 'EUR',
				description:
					'ISO 4217 currency the prices come back in. Without one Booking prices off the proxy exit and two identical requests disagree, so the transport sends USD.',
				routing: { request: { body: { currency: '={{ $value }}' } } },
			},
			{
				displayName: 'Free Cancellation',
				name: 'free_cancellation',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only properties offering free cancellation',
				routing: { request: { body: { free_cancellation: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Maximum price per night, in Currency',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Minimum price per night, in Currency',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Review Score',
				name: 'min_review_score',
				type: 'options',
				default: '8',
				options: [
					{ name: '6 and Up', value: '6' },
					{ name: '7 and Up', value: '7' },
					{ name: '8 and Up', value: '8' },
					{ name: '9 and Up', value: '9' },
				],
				description:
					'Keep only properties at or above this guest review score. Booking accepts these four thresholds only, any other number is silently dropped upstream.',
				routing: { request: { body: { min_review_score: '={{ $value }}' } } },
			},
			{
				displayName: 'No Prepayment',
				name: 'no_prepayment',
				type: 'boolean',
				default: false,
				description: 'Whether to keep only properties that take no prepayment',
				routing: { request: { body: { no_prepayment: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Result page to fetch, 25 properties per page',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Property Type',
				name: 'property_type',
				type: 'options',
				default: 'hotels',
				options: [
					{ name: 'Apartments', value: 'apartments' },
					{ name: 'Bed and Breakfasts', value: 'bed_and_breakfasts' },
					{ name: 'Campgrounds', value: 'campgrounds' },
					{ name: 'Homestays', value: 'homestays' },
					{ name: 'Hostels', value: 'hostels' },
					{ name: 'Hotels', value: 'hotels' },
					{ name: 'Lodges', value: 'lodges' },
					{ name: 'Motels', value: 'motels' },
					{ name: 'Resorts', value: 'resorts' },
					{ name: 'Vacation Homes', value: 'vacation_homes' },
					{ name: 'Villas', value: 'villas' },
				],
				description:
					'Accommodation type to keep. A raw numeric Booking accommodation-type ID also works, set it with an expression.',
				routing: { request: { body: { property_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Rooms',
				name: 'rooms',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Number of rooms to price, Booking prices 1 when unset',
				routing: { request: { body: { rooms: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort By',
				name: 'sort_by',
				type: 'options',
				default: 'popularity',
				options: [
					{ name: 'Distance', value: 'distance' },
					{ name: 'Popularity', value: 'popularity' },
					{ name: 'Price High to Low', value: 'price_high' },
					{ name: 'Price Low to High', value: 'price_low' },
					{ name: 'Review Score', value: 'review_score' },
					{ name: 'Stars and Price', value: 'stars_and_price' },
					{ name: 'Stars High to Low', value: 'stars_high' },
					{ name: 'Stars Low to High', value: 'stars_low' },
				],
				description: 'How Booking orders the result page, popularity when unset',
				routing: { request: { body: { sort_by: '={{ $value }}' } } },
			},
			{
				displayName: 'Star Ratings',
				name: 'stars',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Star ratings to keep, combined with OR',
				routing: { request: { body: { stars: '={{ $value }}' } } },
			},
		],
	},

	// -- Additional Options: Hotel + Reviews --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['booking'], operation: ['hotel', 'reviews'] } },
		options: [
			{
				displayName: 'Adults',
				name: 'adults',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 1 },
				description: 'Number of adults the stay is priced for, Booking prices 2 when unset',
				routing: { request: { body: { adults: '={{ $value }}' } } },
			},
			{
				displayName: 'Check-In Date',
				name: 'checkin',
				type: 'string',
				default: '',
				placeholder: '2026-09-14',
				description:
					'Start of the stay as YYYY-MM-DD. Must be sent with Check-Out Date, and with neither Booking prices a two-night range of its own choosing.',
				routing: { request: { body: { checkin: '={{ $value }}' } } },
			},
			{
				displayName: 'Check-Out Date',
				name: 'checkout',
				type: 'string',
				default: '',
				placeholder: '2026-09-17',
				description: 'End of the stay as YYYY-MM-DD. Must be sent with Check-In Date.',
				routing: { request: { body: { checkout: '={{ $value }}' } } },
			},
			{
				displayName: 'Children Ages',
				name: 'children_ages',
				type: 'string',
				default: '',
				placeholder: '4,9',
				description:
					'Comma-separated AGES of the children travelling, not a count. Up to 10 children, each aged 0-17.',
				routing: {
					request: {
						body: { children_ages: '={{ $value.split(",").map((age) => Number(age.trim())) }}' },
					},
				},
			},
			{
				displayName: 'Country Code',
				name: 'country_code',
				type: 'string',
				default: 'us',
				placeholder: 'pt',
				description:
					'Two-letter country the property page lives under, consulted only when Hotel is a bare slug. A wrong one is a real 404 that is still billed.',
				routing: { request: { body: { country_code: '={{ $value }}' } } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'USD',
				placeholder: 'EUR',
				description:
					'ISO 4217 currency the prices come back in. Without one Booking prices off the proxy exit and two identical requests disagree, so the transport sends USD.',
				routing: { request: { body: { currency: '={{ $value }}' } } },
			},
			{
				displayName: 'Rooms',
				name: 'rooms',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Number of rooms the stay is priced for, Booking prices 1 when unset',
				routing: { request: { body: { rooms: '={{ $value }}' } } },
			},
		],
	},
];
