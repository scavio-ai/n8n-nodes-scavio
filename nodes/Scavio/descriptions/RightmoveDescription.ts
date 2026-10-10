import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['rightmove'], operation, ...extra },
});

function additionalOptions(operation: string[], options: INodeProperties[]): INodeProperties {
	return {
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(operation),
		options,
	};
}

function pageOption(max: number, description: string): INodeProperties {
	return {
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: max },
		description,
		routing: { request: { body: { page: '={{ $value }}' } } },
	};
}

function radiusOption(): INodeProperties {
	return {
		displayName: 'Radius',
		name: 'radius_miles',
		type: 'options',
		default: 0,
		options: [
			{ name: 'This Area Only', value: 0 },
			{ name: '+ 0.25 Miles', value: 0.25 },
			{ name: '+ 0.5 Miles', value: 0.5 },
			{ name: '+ 1 Mile', value: 1 },
			{ name: '+ 3 Miles', value: 3 },
			{ name: '+ 5 Miles', value: 5 },
			{ name: '+ 10 Miles', value: 10 },
			{ name: '+ 15 Miles', value: 15 },
			{ name: '+ 20 Miles', value: 20 },
			{ name: '+ 30 Miles', value: 30 },
			{ name: '+ 40 Miles', value: 40 },
		],
		description: 'Widen the area by this many miles. Defaults to this area only.',
		routing: { request: { body: { radius_miles: '={{ $value }}' } } },
	};
}

function tenureOption(description: string): INodeProperties {
	return {
		displayName: 'Tenure',
		name: 'tenure',
		type: 'options',
		default: 'freehold',
		options: [
			{ name: 'Freehold', value: 'freehold' },
			{ name: 'Leasehold', value: 'leasehold' },
		],
		description,
		routing: { request: { body: { tenure: '={{ $value }}' } } },
	};
}

function multiOption(
	name: string,
	displayName: string,
	options: Array<{ name: string; value: string }>,
	description: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'multiOptions',
		default: [],
		options,
		description,
		routing: { request: { body: { [name]: '={{ $value.length ? $value : undefined }}' } } },
	};
}

export const rightmoveOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rightmove'] } },
		options: [
			{
				name: 'Get Agent Branch',
				value: 'agent',
				action: 'Get a rightmove agent branch',
				description:
					'One Rightmove agent branch by branch ID or profile URL: address, phones, coordinates, company, sales, lettings, commercial and development flags, descriptions, logo, industry affiliations, and the count plus a teaser of its listings for sale and to rent. Use Search Listings with Search By set to Agent Branch for the full listings. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/agent' } },
			},
			{
				name: 'Get Property',
				value: 'property',
				action: 'Get a rightmove property',
				description:
					'One Rightmove listing in full by ID or URL: price and qualifier, description, key features, rooms, images, floorplans, brochures, EPC, tenure and lease years remaining, council tax band, service charge and ground rent, heating, parking, garden, accessibility and flood-risk details, broadband, nearest stations, letting terms and the agent branch with phone. Live listings carry no price history; use Get Sold Property for an address\'s past sales. A removed listing answers 404 and is billed like a normal call. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/property' } },
			},
			{
				name: 'Get Sold Prices',
				value: 'sold',
				action: 'Get rightmove sold prices',
				description:
					'Sold house prices for a town, outcode or postcode in England or Wales: 25 addresses per page, each with its full sale history since 1995 (price, date, tenure, new build), property type, bedrooms, bathrooms and coordinates, plus an area summary with the average price over the last year. Filter by property type, tenure, years since sale and radius; sort by date or price. Up to 40 pages per search. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/sold' } },
			},
			{
				name: 'Get Sold Property',
				value: 'soldProperty',
				action: 'Get a rightmove sold property',
				description:
					'One sold address by sold ID or URL: every recorded sale with exact price, date, tenure, new-build flag and percent change since the previous sale, the postcode, and the archived last listing (beds, baths, key features, photos, floorplans, advertised dates) when the address was listed on Rightmove. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/sold-property' } },
			},
			{
				name: 'Look Up Locations',
				value: 'locations',
				action: 'Look up rightmove locations',
				description:
					'Look up UK places by name, outcode, postcode or station and get the location_id that Search Listings and Search Agents take. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/locations' } },
			},
			{
				name: 'Search Agents',
				value: 'agents',
				action: 'Search rightmove agents',
				description:
					'Estate and letting agent branches for a UK location: name, brand, company and brand IDs, sales and lettings phone numbers, address, sales and lettings flags, description, profile URL and logo. 20 branches per page, up to 50 pages. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/agents' } },
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search rightmove listings',
				description:
					'Search UK property for sale or to rent by location, place name or agent branch, filtered by price, bedrooms, bathrooms, property type, must-haves, exclusions, tenure, days since added, under offer, radius, furnishing and let type. Returns price with its qualifier, address, coordinates, summary, key features, images, tenure, listing dates and the agent. 24 per page, up to 42 pages (about 1,000 listings) per search. There is no keyword filter; match on summary and key_features in the results instead. Costs 1 credit.',
				routing: { request: { method: 'POST', url: '/api/v1/rightmove/search' } },
			},
		],
		default: 'search',
	},
];

export const rightmoveFields: INodeProperties[] = [
	// ── Look Up Locations ──
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Bristol',
		displayOptions: show(['locations']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'A town, area, outcode (SW11), postcode or station',
	},

	// ── Search Listings / Search Agents: where ──
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'locationId',
		displayOptions: show(['search']),
		options: [
			{ name: 'Location ID', value: 'locationId' },
			{ name: 'Place Name', value: 'location' },
			{ name: 'Agent Branch', value: 'branch' },
		],
		description:
			"Whether to search a location_id from Look Up Locations, a place name, or one agent branch's listings",
	},
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		noDataExpression: true,
		default: 'locationId',
		displayOptions: show(['agents']),
		options: [
			{ name: 'Location ID', value: 'locationId' },
			{ name: 'Place Name', value: 'location' },
		],
		description: 'Whether to search a location_id from Look Up Locations or a place name',
	},
	{
		displayName: 'Location ID',
		name: 'location_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'REGION^219',
		displayOptions: show(['search', 'agents'], { searchBy: ['locationId'] }),
		routing: { request: { body: { location_id: '={{ String($value).trim() }}' } } },
		description:
			'A location_id from Look Up Locations, such as REGION^219, OUTCODE^2545, POSTCODE^... or STATION^...',
	},
	{
		displayName: 'Place Name',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Manchester',
		displayOptions: show(['search', 'agents'], { searchBy: ['location'] }),
		routing: { request: { body: { location: '={{ $value }}' } } },
		description:
			'A place name, resolved to its first location match (echoed back in the response as location)',
	},
	{
		displayName: 'Branch ID',
		name: 'branch_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '201404',
		displayOptions: show(['search'], { searchBy: ['branch'] }),
		routing: { request: { body: { branch_id: '={{ String($value).trim() }}' } } },
		description: "Numeric branch_id from Search Agents or a listing's agent",
	},

	// ── Get Property ──
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		noDataExpression: true,
		default: 'id',
		displayOptions: show(['property']),
		options: [
			{ name: 'Property ID', value: 'id' },
			{ name: 'Rightmove URL', value: 'url' },
		],
		description: 'Whether to identify the listing by its numeric ID or by its rightmove.co.uk URL',
	},
	{
		displayName: 'Property ID',
		name: 'property_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '93577917',
		displayOptions: show(['property'], { lookupBy: ['id'] }),
		routing: { request: { body: { property_id: '={{ String($value).trim() }}' } } },
		description: 'Numeric property_id from Search Listings',
	},
	{
		displayName: 'Rightmove URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.rightmove.co.uk/properties/93577917',
		displayOptions: show(['property'], { lookupBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A rightmove.co.uk/properties/ URL',
	},

	// ── Get Sold Prices ──
	{
		displayName: 'Location',
		name: 'location',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Bristol',
		displayOptions: show(['sold']),
		routing: { request: { body: { location: '={{ $value }}' } } },
		description: 'A town, outcode (SW11) or full postcode (SW11 1AA) in England or Wales',
	},

	// ── Get Sold Property ──
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		noDataExpression: true,
		default: 'id',
		displayOptions: show(['soldProperty']),
		options: [
			{ name: 'Sold ID', value: 'id' },
			{ name: 'Rightmove URL', value: 'url' },
		],
		description: 'Whether to identify the address by the sold_id from Get Sold Prices or by its URL',
	},
	{
		displayName: 'Sold ID',
		name: 'sold_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '921d33f4-d206-4991-be4d-75cbe71981ce',
		displayOptions: show(['soldProperty'], { lookupBy: ['id'] }),
		routing: { request: { body: { sold_id: '={{ String($value).trim() }}' } } },
		description:
			'The 36-character sold_id from Get Sold Prices. An unknown ID answers 404 and is billed like a normal call.',
	},
	{
		displayName: 'Rightmove URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.rightmove.co.uk/house-prices/details/921d33f4-d206-4991-be4d-75cbe71981ce',
		displayOptions: show(['soldProperty'], { lookupBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A rightmove.co.uk/house-prices/details/ URL',
	},

	// ── Get Agent Branch ──
	{
		displayName: 'Look Up By',
		name: 'lookupBy',
		type: 'options',
		noDataExpression: true,
		default: 'id',
		displayOptions: show(['agent']),
		options: [
			{ name: 'Branch ID', value: 'id' },
			{ name: 'Profile URL', value: 'url' },
		],
		description: 'Whether to identify the branch by its numeric ID or by its profile URL',
	},
	{
		displayName: 'Branch ID',
		name: 'branch_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '201404',
		displayOptions: show(['agent'], { lookupBy: ['id'] }),
		routing: { request: { body: { branch_id: '={{ String($value).trim() }}' } } },
		description:
			"Numeric branch_id from Search Agents or a listing's agent. An unknown ID answers 404 and is billed like a normal call.",
	},
	{
		displayName: 'Profile URL',
		name: 'url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.rightmove.co.uk/estate-agents/agent/2C-Properties/Bristol-201404.html',
		displayOptions: show(['agent'], { lookupBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A branch profile URL (profile_url from Search Agents)',
	},

	// ── Additional Options ──
	additionalOptions(
		['search'],
		[
			{
				displayName: 'Added Within',
				name: 'added_within_days',
				type: 'options',
				default: 7,
				options: [
					{ name: '24 Hours', value: 1 },
					{ name: '3 Days', value: 3 },
					{ name: '7 Days', value: 7 },
					{ name: '14 Days', value: 14 },
				],
				description: 'Only listings added in this window. Leave unset for any time.',
				routing: { request: { body: { added_within_days: '={{ $value }}' } } },
			},
			multiOption(
				'exclude',
				'Exclude',
				[
					{ name: 'Auction', value: 'auction' },
					{ name: 'New Home', value: 'new_home' },
					{ name: 'Retirement', value: 'retirement' },
					{ name: 'Shared Ownership', value: 'shared_ownership' },
				],
				'Leave these listing kinds out',
			),
			multiOption(
				'furnishing',
				'Furnishing',
				[
					{ name: 'Furnished', value: 'furnished' },
					{ name: 'Part Furnished', value: 'part_furnished' },
					{ name: 'Unfurnished', value: 'unfurnished' },
				],
				'To Rent only. Keep listings with any of these.',
			),
			{
				displayName: 'Include Under Offer',
				name: 'include_under_offer',
				type: 'boolean',
				default: false,
				description:
					'Whether to include listings under offer or sold STC (For Sale) or let agreed (To Rent)',
				routing: { request: { body: { include_under_offer: '={{ $value }}' } } },
			},
			{
				displayName: 'Let Type',
				name: 'let_type',
				type: 'options',
				default: 'long_term',
				options: [
					{ name: 'Long Term', value: 'long_term' },
					{ name: 'Short Term', value: 'short_term' },
				],
				description: 'To Rent only',
				routing: { request: { body: { let_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Listing Status',
				name: 'listing_status',
				type: 'options',
				default: 'for_sale',
				options: [
					{ name: 'For Sale', value: 'for_sale' },
					{ name: 'To Rent', value: 'for_rent' },
				],
				description: 'For Sale (default) or To Rent. On To Rent, prices are monthly rent.',
				routing: { request: { body: { listing_status: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'max_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Maximum price in GBP (monthly rent on To Rent)',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Beds',
				name: 'beds_max',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 10 },
				description: 'Maximum bedrooms, 0-10',
				routing: { request: { body: { beds_max: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Baths',
				name: 'baths_min',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 5 },
				description: 'Minimum bathrooms, 1-5',
				routing: { request: { body: { baths_min: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Beds',
				name: 'beds_min',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 10 },
				description: 'Minimum bedrooms, 0-10',
				routing: { request: { body: { beds_min: '={{ $value }}' } } },
			},
			{
				displayName: 'Min Price',
				name: 'min_price',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Minimum price in GBP (monthly rent on To Rent)',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			multiOption(
				'must_have',
				'Must Have',
				[
					{ name: 'Garden', value: 'garden' },
					{ name: 'New Home', value: 'new_home' },
					{ name: 'Parking', value: 'parking' },
				],
				'Only listings with all of these',
			),
			pageOption(
				42,
				'Results page, 1-42, 24 listings per page. Rightmove serves 42 pages (about 1,000 listings) per search; narrow by price band, property type or area to reach more.',
			),
			multiOption(
				'property_types',
				'Property Types',
				[
					{ name: 'Bungalow', value: 'bungalow' },
					{ name: 'Detached', value: 'detached' },
					{ name: 'Flat', value: 'flat' },
					{ name: 'Land', value: 'land' },
					{ name: 'Park Home', value: 'park_home' },
					{ name: 'Semi-Detached', value: 'semi_detached' },
					{ name: 'Terraced', value: 'terraced' },
				],
				'Only these property types',
			),
			radiusOption(),
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				description: 'Listing order. Defaults to Newest.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			tenureOption('For Sale only: freehold or leasehold'),
		],
	),
	additionalOptions(
		['sold'],
		[
			pageOption(
				40,
				'Results page, 1-40, 25 addresses per page. Rightmove serves 40 pages per search; narrow by type, tenure, years or postcode to reach more.',
			),
			{
				displayName: 'Property Type',
				name: 'property_type',
				type: 'options',
				default: 'detached',
				options: [
					{ name: 'Detached', value: 'detached' },
					{ name: 'Flat', value: 'flat' },
					{ name: 'Other', value: 'other' },
					{ name: 'Semi-Detached', value: 'semi_detached' },
					{ name: 'Terraced', value: 'terraced' },
				],
				description: 'Only this property type',
				routing: { request: { body: { property_type: '={{ $value }}' } } },
			},
			radiusOption(),
			{
				displayName: 'Sold Within',
				name: 'sold_within_years',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Year', value: 1 },
					{ name: '2 Years', value: 2 },
					{ name: '3 Years', value: 3 },
					{ name: '5 Years', value: 5 },
					{ name: '10 Years', value: 10 },
					{ name: '15 Years', value: 15 },
					{ name: '20 Years', value: 20 },
					{ name: '30 Years', value: 30 },
				],
				description: 'Only addresses sold in this window. Leave unset for every sale since 1995.',
				routing: { request: { body: { sold_within_years: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'newest',
				options: [
					{ name: 'Most Recent Sale', value: 'newest' },
					{ name: 'Price: High to Low', value: 'price_high' },
					{ name: 'Price: Low to High', value: 'price_low' },
				],
				description: 'Address order. Defaults to Most Recent Sale.',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			tenureOption('Freehold or leasehold'),
		],
	),
	additionalOptions(
		['agents'],
		[
			pageOption(
				50,
				'Results page, 1-50, 20 branches per page. Rightmove serves 50 pages per search; use an outcode to reach more in a big city.',
			),
		],
	),
];
