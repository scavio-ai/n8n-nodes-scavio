import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['liquidation'], operation, ...extra },
});

// Liquidation.com (liquidation.com, the US online liquidation auction site of Liquidity Services), 4 operations, 1
// credit each; credits_used is the truth. USD, or CAD for lots in the Brampton, ON warehouse. Every operation takes 1 to
// 60 s and carries a 180s timeout. No bidder names ever.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 180000 },
});

const SITE =
	'Liquidation.com (liquidation.com, the US online liquidation auction site of Liquidity Services), as a visitor who is not signed in sees it';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const MONEY =
	"Amounts in USD, or CAD for lots in Canadian warehouses (Brampton, ON); the buyer's premium, shipping and sales tax come on top of a bid. est_retail is the seller's stated retail value. Seller handles are as the site shows them; bidder identities are not returned.";

const CATEGORIES = [
	{ name: 'Appliances', value: '1700' },
	{ name: 'Clothing & Accessories', value: '1001' },
	{ name: 'Computers & Networking', value: '1002' },
	{ name: 'Consumer Electronics', value: '1004' },
	{ name: 'Furniture', value: '1600' },
	{ name: 'General Merchandise', value: '1005' },
	{ name: 'Health & Beauty', value: '1800' },
	{ name: 'Holiday & Seasonal', value: '1045' },
	{ name: 'Home Improvement', value: '1900' },
	{ name: 'Housewares', value: '1006' },
	{ name: 'Jewelry & Watches', value: '1011' },
	{ name: 'Mystery Box', value: '1017' },
	{ name: 'Tools & Machinery', value: '1003' },
];

const categoryOption: INodeProperties = {
	displayName: 'Category',
	name: 'category',
	type: 'options',
	default: '1002',
	options: CATEGORIES,
	description: 'A top category of the site',
	routing: { request: { body: { category: '={{ $value }}' } } },
};
const pageOptions: INodeProperties[] = [
	{
		displayName: 'Lots per Page',
		name: 'perPage',
		type: 'number',
		default: 27,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: "Lots per page, 1 to 100 (27 is the site's default)",
		routing: { request: { body: { per_page: '={{ $value === 27 ? undefined : $value }}' } } },
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 500 },
		description: 'Results page, 1 to 500',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},
];
const lotField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Auction ID or URL',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '21648824',
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description: 'A Liquidation.com auction ID (ID of a search result, digits) or a liquidation.com auction link',
});

export const liquidationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['liquidation'] } },
		options: [
			{
				name: 'Get Closed Auctions',
				value: 'closed',
				action: 'Get liquidation com closed auctions',
				description: `Closed auctions of one seller on ${SITE}, optionally narrowed by category: total, count, has_more and results (title, URL, seller, location_state, condition, packages, items, currency, final_bid, bids, views, est_retail). The site shows no close date for closed lots and does not apply keywords to them. Captured 2026-11-28: Titan Electronics had 2,373 closed lots. ${ONE}`,
				routing: request('/api/v1/liquidation/closed'),
			},
			{
				name: 'Get Lot',
				value: 'lot',
				action: 'Get a liquidation com lot',
				description: `One open auction of ${SITE} by auction ID or link: title, status, closes_at, time_left, currency, current_bid, minimum_bid, buy_now_price, sealed_bid, bids, bidders (a count), watchers, views, auction_type, buyers_premium_pct, seller (handle and statistics), location, condition, category, quantity, est_retail_per_unit, packages, shipping terms and weights, has_manifest, images and description. A closed or unknown auction is a charged not-found. ${MONEY} Captured 2026-11-28: a gaming PC lot of 4 returns at a 1,100 USD bid (next minimum 1,150 USD, 11% buyer's premium). ${ONE}`,
				routing: request('/api/v1/liquidation/lot'),
			},
			{
				name: 'Get Manifest',
				value: 'manifest',
				action: 'Get a liquidation com manifest',
				description: `The item manifest of one auction of ${SITE}: columns (header as the seller wrote it, key), row_count, truncated and rows keyed by column (description, quantity, brand, model, category, UPC, ASIN and the seller's price columns, which keep the seller's label). A lot without a manifest is a charged not-found. Captured 2026-11-28: 4 rows under 7 columns. ${ONE}`,
				routing: request('/api/v1/liquidation/manifest'),
			},
			{
				name: 'Search Lots',
				value: 'search',
				action: 'Search liquidation com lots',
				description: `Search the open auctions of ${SITE} by keyword, category, lot size, condition, US region, auction type and seller (at least one), sorted by close time, current bid, items or title, 27 per page by default (up to 100). Returns total, count, has_more, results (ID for Get Lot, title, URL, seller, closes_at, location_state, condition, packages, items, currency, current_bid, sealed_bid, bids, watchers, views, est_retail) and facets. ${MONEY} Captured 2026-11-28: laptop matched 73 open auctions. ${ONE}`,
				routing: request('/api/v1/liquidation/search'),
			},
		],
		default: 'search',
	},
];

export const liquidationFields: INodeProperties[] = [
	// -- Search Lots --
	{
		displayName: 'Keywords',
		name: 'liquidationQuery',
		type: 'string',
		default: '',
		placeholder: 'laptop',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ String($value).trim() || undefined }}' } } },
		description: 'Keywords (title and description). Search needs keywords, a category, a seller or a filter.',
	},
	{
		displayName: 'Additional Options',
		name: 'liquidationSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Auction Type',
				name: 'auctionType',
				type: 'options',
				default: 'standard',
				options: [
					{ name: 'Fixed Price', value: 'fixed_price' },
					{ name: 'Mixed Format', value: 'mixed_format' },
					{ name: 'Sealed Bid', value: 'sealed_bid' },
					{ name: 'Standard', value: 'standard' },
				],
				description: 'How the lot is sold',
				routing: { request: { body: { auction_type: '={{ $value }}' } } },
			},
			categoryOption,
			{
				displayName: 'Condition',
				name: 'condition',
				type: 'options',
				default: 'returns',
				options: [
					{ name: 'Damaged', value: 'damaged' },
					{ name: 'New', value: 'new' },
					{ name: 'Refurbished', value: 'refurbished' },
					{ name: 'Returns', value: 'returns' },
					{ name: 'Salvage', value: 'salvage' },
					{ name: 'Scratch and Dent', value: 'scratch_and_dent' },
					{ name: 'Shelf Pulls', value: 'shelf_pulls' },
					{ name: 'Used', value: 'used' },
				],
				description: 'Condition of the lot',
				routing: { request: { body: { condition: '={{ $value }}' } } },
			},
			{
				displayName: 'Lot Size',
				name: 'lotSize',
				type: 'options',
				default: 'pallet',
				options: [
					{ name: 'Large Item', value: 'large_item' },
					{ name: 'Package', value: 'package' },
					{ name: 'Pallet', value: 'pallet' },
					{ name: 'Truckload', value: 'truckload' },
				],
				description: 'Size of the lot',
				routing: { request: { body: { lot_size: '={{ $value }}' } } },
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'options',
				default: 'asc',
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				description: 'With a sort other than relevance',
				routing: { request: { body: { order: '={{ $value }}' } } },
			},
			...pageOptions,
			{
				displayName: 'Region',
				name: 'region',
				type: 'options',
				default: 'south',
				options: [
					{ name: 'Midwest', value: 'midwest' },
					{ name: 'Northeast', value: 'northeast' },
					{ name: 'South', value: 'south' },
					{ name: 'West', value: 'west' },
				],
				description: 'US region of the warehouse',
				routing: { request: { body: { region: '={{ $value }}' } } },
			},
			{
				displayName: 'Seller',
				name: 'seller',
				type: 'string',
				default: '',
				placeholder: 'Newegg_Business',
				description: 'A seller handle as Liquidation.com shows it (seller of a result)',
				routing: { request: { body: { seller: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'close_time',
				options: [
					{ name: 'Close Time', value: 'close_time' },
					{ name: 'Current Bid', value: 'current_bid' },
					{ name: 'Items per Lot', value: 'items' },
					{ name: 'Relevance (Needs Keywords)', value: 'relevance' },
					{ name: 'Title', value: 'title' },
				],
				description: "Order of the results (omitted: the site's order)",
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Lot / Get Manifest --
	lotField('liquidationLot', 'lot'),
	lotField('liquidationManifestLot', 'manifest'),

	// -- Get Closed Auctions --
	{
		displayName: 'Seller',
		name: 'liquidationClosedSeller',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Titan Electronics',
		displayOptions: show(['closed']),
		routing: { request: { body: { seller: '={{ String($value).trim() }}' } } },
		description: 'A seller handle as Liquidation.com shows it (seller of a result or of a lot)',
	},
	{
		displayName: 'Additional Options',
		name: 'liquidationClosedOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['closed']),
		options: [categoryOption, ...pageOptions],
	},
];
