import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['nellis'], operation, ...extra },
});

// Nellis Auction (nellisauction.com, the liquidation auction marketplace with pickup warehouses in Las
// Vegas, Phoenix, Houston, Philadelphia, Denver and Dallas), 4 operations, 1 credit each;
// credits_used is the truth. Shopping Location (6, default Las Vegas) on Search Lots and Get
// Categories; Get Locations takes it optionally (all 13 warehouses without it). Calls can queue
// behind the backend's upstream limit, so every operation carries a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'Nellis Auction (nellisauction.com, the liquidation auction marketplace with pickup warehouses in Las Vegas, Phoenix, Houston, Philadelphia, Denver and Dallas)';
const NAME = 'Nellis Auction';
const PRICES =
	'current_bid is the current high bid in USD (0 before the first bid), as of the fetch: bids move live and a late bid extends the close (extended). retail_price is Nellis\'s own "Estimated Retail Price", as Nellis labels it (Nellis does not state its source): not an MSRP or a verified retail price.';
const FEES =
	'Fees as Nellis\'s FAQ and terms state them: a buyer\'s premium added to the winning bid ("typically 15% but may vary based on the auction event"; each item carries buyer_premium_percent), plus sales tax. Pickup only, no shipping.';
const ITEM =
	"items with ID (what Get Lot takes), title, URL, current_bid, bid_count, retail_price, buyer_premium_percent, opens, closes, extended, market_status, condition (Nellis's 1-5 star grade and inspection answers), inspection_notes, pickup_location and photos";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const NOT_AVAILABLE =
	'Not available: closed or sold lots in search (read them by ID with Get Lot), search suggestions, shipping (pickup only), UPC or model numbers, buy-now, reserve prices, live bid updates, bidding, watchlists, checkout.';
const IS_URL = '/^https?:/i.test(String($value).trim())';

const LOCATIONS: Array<[string, string]> = [
	['Dallas, TX (Run by Lots Of Auctions)', 'dallas'],
	['Denver, CO', 'denver'],
	['Houston, TX', 'houston'],
	['Las Vegas, NV', 'las-vegas'],
	['Philadelphia, PA (Pickup in Delran, NJ)', 'philadelphia'],
	['Phoenix, AZ', 'phoenix'],
];

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const nameFilter = (displayName: string, name: string, field: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [field]: '={{ String($value).trim() || undefined }}' } } },
});

const searchOptions: INodeProperties[] = [
	{
		displayName: 'Page',
		name: 'nellisPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 625 },
		description: "Page (Nellis pages through 30,000 positions at most: page size x page)",
		routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'nellisPageSize',
		type: 'options',
		default: 120,
		options: [
			{ name: '48', value: 48 },
			{ name: '120', value: 120 },
			{ name: '240', value: 240 },
		],
		description: "Lots per page (Nellis's page sizes)",
		routing: { request: { body: { page_size: '={{ $value === 120 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'nellisSort',
		type: 'options',
		default: 'featured',
		options: [
			{ name: 'Bids: High to Low', value: 'bids_high' },
			{ name: 'Bids: Low to High', value: 'bids_low' },
			{ name: 'Current Bid: High to Low', value: 'price_high' },
			{ name: 'Current Bid: Low to High', value: 'price_low' },
			{ name: 'Ending Last', value: 'ending_last' },
			{ name: 'Ending Soon', value: 'ending_soon' },
			{ name: 'Estimated Retail: High to Low', value: 'retail_high' },
			{ name: 'Estimated Retail: Low to High', value: 'retail_low' },
			{ name: 'Featured', value: 'featured' },
		],
		description: "Result order (Featured is Nellis's own order; Nellis has no newest sort)",
		routing: { request: { body: { sort: '={{ $value === "featured" ? undefined : $value }}' } } },
	},
	nameFilter('Category', 'nellisCategory', 'category', 'Electronics', 'Top-level category (a categories[].name from Get Categories)'),
	nameFilter('Subcategory', 'nellisSubcategory', 'subcategory', 'TVs', 'Second-level category (a subcategories[].name from Get Categories)'),
	nameFilter('Brand', 'nellisBrand', 'brand', 'Samsung', 'Brand as Nellis lists it (facets.brands[].name)'),
	nameFilter(
		'Pickup Warehouse',
		'nellisPickupLocation',
		'pickup_location',
		'North Las Vegas',
		'A pickup warehouse of the shopping location chosen (facets.pickup_locations[].name or a name from Get Locations). A warehouse of another shopping location answers 400.',
	),
	nameFilter(
		'Auction Event Type',
		'nellisAuctionEventType',
		'auction_event_type',
		'Retail Returns',
		'Auction event type (facets.auction_event_types[].name), e.g. Retail Returns or Consigner / Third Party',
	),
	nameFilter(
		'Auction Event',
		'nellisAuctionEventName',
		'auction_event_name',
		'Daily Auction - North Las Vegas - Nov 24th',
		'Auction event (facets.auction_event_names[].name or an auction_events[].name from Get Categories)',
	),
	nameFilter('Color', 'nellisColor', 'color', 'Black', 'Color as Nellis lists it (facets.colors[].name)'),
	nameFilter('Size', 'nellisSize', 'size', 'Large', 'Size as Nellis lists it (facets.sizes[].name)'),
	{
		displayName: 'Condition Stars',
		name: 'nellisConditionRating',
		type: 'multiOptions',
		default: [],
		options: [
			{ name: '1 Star', value: 1 },
			{ name: '2 Stars', value: 2 },
			{ name: '3 Stars', value: 3 },
			{ name: '4 Stars', value: 4 },
			{ name: '5 Stars', value: 5 },
		],
		description: "Nellis's condition grade in stars (empty: any)",
		routing: {
			request: { body: { condition_rating: '={{ $value && $value.length ? $value : undefined }}' } },
		},
	},
	{
		displayName: 'Min Estimated Retail',
		name: 'nellisRetailMin',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Lowest Nellis Estimated Retail Price, USD (0: no minimum)",
		routing: { request: { body: { retail_min: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Estimated Retail',
		name: 'nellisRetailMax',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: "Highest Nellis Estimated Retail Price, USD (0: no maximum)",
		routing: { request: { body: { retail_max: '={{ $value || undefined }}' } } },
	},
];

export const nellisOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nellis'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get nellis auction categories',
				description: `The live category, brand and auction-event counts of one ${NAME} shopping location (open auctions only), or the subcategories of one category: total_open_items, categories, subcategories, brands (Nellis's top 100), auction_events, auction_event_types and pickup_locations, each with name and count. The names are what Search Lots' Category, Subcategory, Brand, Auction Event and Pickup Warehouse options take. A category with no open lots is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/nellis/categories', true),
			},
			{
				name: 'Get Locations',
				value: 'locations',
				action: 'Get nellis auction pickup locations',
				description: `The pickup warehouses of ${FIRST} (13 in all), or those of one shopping location: name, address, city, state, coordinates, operator (Nellis Auction or a partner), shopping_location and opening hours per day (local time, null when closed), as Nellis's location page gives them. Pickup only: won lots are picked up at the warehouse by appointment. ${ONE}.`,
				routing: request('/api/v1/nellis/locations', true),
			},
			{
				name: 'Get Lot',
				value: 'item',
				action: 'Get a nellis auction lot',
				description: `One ${NAME} lot by ID or link, open, closed or sold: current_bid, bid_count, retail_price, buyer_premium_percent, opens, closes, initial_closes, extended, market_status (Nellis's own: open, sold, relisted, closed ...), condition and inspection_notes, pickup_location, operator, category, brand, features, descriptions, dimensions, photos, final_price (the winning bid of a sold lot, before Nellis's buyer's premium and tax; null otherwise) and bid_history (time, amount, Winning or Outbid; no bidder names or IDs). A sold lot's final price is public by ID. Captured 2026-11-25: a sold lot (ID 141100004, Estimated Retail Price 9.99) had a final price of 6 after 5 bids. ${PRICES} ${FEES} An unknown ID is a charged not-found. ${ONE}.`,
				routing: request('/api/v1/nellis/item'),
			},
			{
				name: 'Search Lots',
				value: 'search',
				action: 'Search nellis auction lots',
				description: `Search the open auctions of ${FIRST} in one shopping location, by keywords (or none: every open auction), sorted (featured, current bid, ending soon or last, estimated retail, bids), filtered (category, subcategory, brand, pickup warehouse, condition stars, estimated retail range, auction event, color, size) and paged (48, 120 or 240 a page): ${ITEM}, plus total, total_pages, has_more and facets (Nellis's counts of open lots). Open auctions only, as Nellis's own search shows. ${PRICES} ${FEES} ${NOT_AVAILABLE} ${ONE}.`,
				routing: request('/api/v1/nellis/search', true),
			},
		],
		default: 'search',
	},
];

export const nellisFields: INodeProperties[] = [
	// -- Search Lots --
	{
		displayName: 'Keywords',
		name: 'nellisQuery',
		type: 'string',
		default: '',
		placeholder: 'robot vacuum',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ String($value).trim() || undefined }}' } } },
		description: 'Keywords. Empty: every open auction in the shopping location (filters and sort still apply).',
	},

	// -- Get Lot --
	{
		displayName: 'Lot ID or URL',
		name: 'nellisItem',
		type: 'string',
		required: true,
		default: '',
		placeholder: '141281552',
		displayOptions: show(['item']),
		routing: {
			request: {
				body: {
					id: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
					url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
				},
			},
		},
		description:
			'A Nellis Auction lot ID (ID from Search Lots, the number at the end of a nellisauction.com/p/ link, e.g. 141281552) or the lot link. Open, closed and sold lots.',
	},

	// -- Shopping Location --
	{
		displayName: 'Shopping Location',
		name: 'nellisLocation',
		type: 'options',
		default: 'las-vegas',
		options: LOCATIONS.map(([name, value]) => ({ name, value })),
		displayOptions: show(['search', 'categories']),
		routing: { request: { body: { location: '={{ $value === "las-vegas" ? undefined : $value }}' } } },
		description: 'The Nellis shopping location whose auctions to read',
	},
	{
		displayName: 'Shopping Location',
		name: 'nellisLocationsFilter',
		type: 'options',
		default: '',
		options: [{ name: 'All (13 Warehouses)', value: '' }, ...LOCATIONS.map(([name, value]) => ({ name, value }))],
		displayOptions: show(['locations']),
		routing: { request: { body: { location: '={{ $value || undefined }}' } } },
		description: 'Only the pickup warehouses of this shopping location',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'nellisSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([...searchOptions]),
	},
	{
		displayName: 'Additional Options',
		name: 'nellisCategoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			nameFilter(
				'Category',
				'nellisCategoriesCategory',
				'category',
				'Electronics',
				'One top-level category (a categories[].name): its subcategories, brands and auction events. Empty: every category.',
			),
		],
	},
];
