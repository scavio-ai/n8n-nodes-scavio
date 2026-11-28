import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['bstock'], operation, ...extra },
});

// B-Stock (bstock.com, the liquidation marketplace where retailers sell returns and overstock), 4 operations, 1 credit
// each; credits_used is the truth. Open listings only. Every operation takes 1 to 45 s and carries a 180s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 180000 },
});

const SITE =
	'B-Stock (bstock.com, the liquidation marketplace where retailers and brands sell customer returns and overstock by the pallet or truckload), as a visitor who is not signed in sees it';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const MONEY =
	"Amounts are in each listing's currency (USD for most lots; EUR or GBP for Amazon Europe lots). Bids move live: current_bid, bids and end_time are as of the fetch. retail_value is the seller's stated total retail of the lot. No bidder identities are returned.";

const text = (displayName: string, name: string, wire: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [wire]: '={{ String($value).trim() || undefined }}' } } },
});

export const bstockOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bstock'] } },
		options: [
			{
				name: 'Get Filters',
				value: 'filters',
				action: 'Get b stock filters',
				description: `The search filters of ${SITE} with B-Stock's counts of open listings: total_open_listings, categories, subcategories, conditions, inventory_types, buying_formats, shipment_types, regions, manufacturers (the top 500), listing_types and deals (value and count each) and storefront_count. Each value is the input of the Search Lots field of the same name. Captured 2026-11-28: 18 categories and 111 subcategories over 735 open listings. ${ONE}`,
				routing: request('/api/v1/bstock/filters'),
			},
			{
				name: 'Get Lot',
				value: 'lot',
				action: 'Get a b stock lot',
				description: `One lot of ${SITE} by listing ID or link: title, status, storefront, currency, auction (state, start_price, current_bid, next_minimum_bid, bids, unique_bidders, end_time, extended, buy_now), views, deal, retail_value, units, pallets, condition, categories, manufacturers, models, description, location, shipping, images and manifest (items_total and the public preview: up to 10 rows with description, quantity, unit_retail and ext_retail; the full manifest needs a signed-in buyer account). A make-an-offer listing or an unknown ID is a charged not-found. ${MONEY} Captured 2026-11-28: 2 pallets of insulated work boots (218 units, stated retail 61,522 USD) at a 1,508 USD bid after 21 bids. ${ONE}`,
				routing: request('/api/v1/bstock/lot'),
			},
			{
				name: 'Get Storefronts',
				value: 'storefronts',
				action: 'Get b stock storefronts',
				description: `The retailer and brand marketplaces of ${SITE} with open listings right now: count, total_open_listings and storefronts (ID, name, value, open_listings, lot_source). ID, value or name is the Storefront input of Search Lots. Captured 2026-11-28: 37 storefronts, 735 open listings. ${ONE}`,
				routing: request('/api/v1/bstock/storefronts'),
			},
			{
				name: 'Search Lots',
				value: 'search',
				action: 'Search b stock lots',
				description: `Search the open liquidation lots of ${SITE} by keyword (or none: every open lot), filtered by storefront, category, subcategory, condition, inventory type, buying format, region, shipment type and manufacturer, sorted recommended, end_time or relevance, 20 per call by default (up to 200), paged with offset. Returns total, count, has_more and listings (listing_id for Get Lot, title, URL, storefront, currency, current_bid, bids, retail_value, buy_now, end_time, condition, inventory_type, categories, units, pallets, shipment_type, has_manifest, deal, location, image). Closed and sold lots are not available. ${MONEY} Captured 2026-11-28: laptop matched 20 open lots. ${ONE}`,
				routing: request('/api/v1/bstock/search'),
			},
		],
		default: 'search',
	},
];

export const bstockFields: INodeProperties[] = [
	// -- Search Lots --
	{
		displayName: 'Keywords',
		name: 'bstockQuery',
		type: 'string',
		default: '',
		placeholder: 'laptop',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ String($value).trim() || undefined }}' } } },
		description: 'Keywords (up to 200 characters). Leave empty to list every open lot (filters and sort still apply).',
	},
	{
		displayName: 'Additional Options',
		name: 'bstockSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Buying Format',
				name: 'buyingFormat',
				type: 'options',
				default: 'AUCTION',
				options: [
					{ name: 'Auction', value: 'AUCTION' },
					{ name: 'Buy Now', value: 'BUY_NOW' },
					{ name: 'Make an Offer', value: 'MAKE_AN_OFFER' },
				],
				description: 'How the lot is sold',
				routing: { request: { body: { buying_format: '={{ $value }}' } } },
			},
			text('Category', 'category', 'category', 'Electronics', 'A top-level category from Get Filters (categories[].value)'),
			text('Condition', 'condition', 'condition', 'Like New', 'New, Like New, Used Good, Used Fair, Mixed, Salvage ... (Get Filters lists them)'),
			text('Inventory Type', 'inventoryType', 'inventory_type', 'Customer Returns', 'Customer Returns, Overstock, Shelf Pulls, Mixed/Other ... (Get Filters lists them)'),
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1 },
				description: 'Max number of results to return',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			text('Manufacturer', 'manufacturer', 'manufacturer', 'Apple', 'A manufacturer as B-Stock lists it (Get Filters lists the top 500)'),
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 10000 },
				description: 'Listings to skip: offset + limit pages through total',
				routing: { request: { body: { offset: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			text('Region', 'region', 'region', 'GA/US', 'Where the lot ships from: "GA/US" a US state, "ON/CA" a Canadian province, "/ES" a European country (Get Filters lists them)'),
			{
				displayName: 'Shipment Type',
				name: 'shipmentType',
				type: 'options',
				default: 'LTL',
				options: [
					{ name: 'LTL (Pallets)', value: 'LTL' },
					{ name: 'Parcel', value: 'PARCEL' },
					{ name: 'Truckload', value: 'Truckload' },
				],
				description: 'Shipment size',
				routing: { request: { body: { shipment_type: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Ending Soonest', value: 'end_time' },
					{ name: 'Recommended', value: 'recommended' },
					{ name: 'Relevance (Needs Keywords)', value: 'relevance' },
				],
				description: "Order of the listings (B-Stock's default: relevance with keywords, recommended without)",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			text('Storefront', 'storefront', 'storefront', 'Target', 'A retailer or brand marketplace on B-Stock: ID, value or name from Get Storefronts'),
			text('Subcategory', 'subcategory', 'subcategory', 'Laptops', 'A second-level category from Get Filters (subcategories[].value)'),
		],
	},

	// -- Get Lot --
	{
		displayName: 'Listing ID or URL',
		name: 'bstockLot',
		type: 'string',
		required: true,
		default: '',
		placeholder: '6b05cd6821e9e20881d2a998',
		displayOptions: show(['lot']),
		routing: {
			request: {
				body: {
					id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A listing ID (listing_id of Search Lots, 24 hex characters, or the number of an Amazon Europe lot) or a bstock.com listing link',
	},
];
