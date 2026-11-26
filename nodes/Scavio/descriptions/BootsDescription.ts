import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['boots'], operation, ...extra },
});

// Boots (boots.com, the UK health and beauty retailer, and boots.ie in Ireland), 4 operations.
// No search yet: users start from a Boots product link or id. Credits: 1 per call; 2 when Boots
// answered only on a second attempt (3 for two-step lookups: product by ID, store by number or
// name); credits_used is the truth. Market (uk default, or ie) on every operation. Answers usually
// take 2 to 60 seconds; every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const isUrl = '/^https?:/i.test(String($value).trim())';
const ALL_OPS = ['product', 'store-stock', 'stores', 'store'];

const FIRST =
	'Boots (boots.com, the UK health and beauty retailer with over 1,800 stores, and boots.ie in Ireland)';
const CHARGE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. A request answered on its second attempt costs 2 credits (3 for two-step lookups).';
const NOT_AVAILABLE =
	'Boots search is not available yet: start from a Boots product link or its 8-digit product ID. Not available: category, brand and deal lists, reviews, ratings, type-ahead, stock counts, price history (poll and store the answers).';

export const bootsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['boots'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find boots stores',
				description: `Boots stores near a UK postcode or a town (UK and Ireland), from ${FIRST}: store_number, store_id, name, address, coordinates, distance_miles and services, nearest first, plus the latitude and longitude of the place searched (what Get Store Stock takes on Ireland). Staff-only sites are left out. Captured 2026-11-26: 63 stores near SW11 1QN, the nearest London Battersea (868); 9 in Cork, the nearest Cork Patrick Street. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/boots/stores'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a boots product',
				description: `One product of ${FIRST} by link or 8-digit product ID: name, brand, price, currency (GBP on UK, EUR on Ireland), was_price, saving (Boots' Save amount), size, unit price as Boots shows it, catentry_id and every shade or size with its item_code (what Get Store Stock takes), online stock, offers (with any promo code they name, e.g. SAVE20), the Advantage Card offers on the page, description, sections and ingredients. Not on the page: EAN, a price per shade or size, rating and reviews. Captured 2026-11-26: CeraVe AM Facial Moisturising Lotion SPF30 52ml (10331199) at 11.62 GBP on UK (was 15.50) and 13.50 EUR on Ireland (was 18). A product not sold on the market's site is a charged not-found. ${NOT_AVAILABLE} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/boots/product'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a boots store',
				description: `One store page of ${FIRST} by page slug or link, store number (boots.com) or exact name: address, phone, coordinates, opening hours, pharmacy hours and services. Staff names are left out. Captured 2026-11-26: store 868, London Battersea, open 09:00 to 19:00 on Monday. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/boots/store'),
			},
			{
				name: 'Get Store Stock',
				value: 'store-stock',
				action: 'Get boots store stock',
				description: `Whether the Boots stores near a UK postcode or a latitude and longitude have one product (or one shade or size), from ${FIRST}: per store the name, address, phone, coordinates, distance_miles, availability (in_stock or out_of_stock), Boots' own words, whether it carries the line, and its hours, nearest first, with count, in_stock_count and stores_searched. In stock or out of stock per store: Boots shows no unit counts. When no store near the place has it, stores is empty and the answer is charged (Boots answers an unknown item code the same way, so take the item code from Get Product). Ireland takes a latitude and longitude (Find Stores returns them for a town). Captured 2026-11-26: CeraVe AM Facial Moisturising Lotion (10331199) near SW11 1QN in stock at 79 of 85 stores. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/boots/store-stock'),
			},
		],
		default: 'product',
	},
];

export const bootsFields: INodeProperties[] = [
	// -- Get Product --
	{
		displayName: 'Product URL or ID',
		name: 'bootsProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.boots.com/no7-protect-and-perfect-intense-advanced-serum-30ml-10288490',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					url: `={{ ${isUrl} ? String($value).trim() : undefined }}`,
					product_id: `={{ ${isUrl} ? undefined : String($value).trim() }}`,
				},
			},
		},
		description:
			"A Boots product link (www.boots.com or www.boots.ie; the market follows the link) or the 8 digits a product link ends with (looked up in Boots' product list first: one more call)",
	},

	// -- Get Store Stock --
	{
		displayName: 'Item Code',
		name: 'bootsStockItemCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '10213975001',
		displayOptions: show(['store-stock']),
		routing: { request: { body: { item_code: '={{ String($value).trim() }}' } } },
		description:
			"A shade or size's item_code from Get Product (11 digits), or the product's own 8-digit ID when it has no shades or sizes",
	},
	{
		displayName: 'Catentry ID',
		name: 'bootsStockCatentryId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1838584',
		displayOptions: show(['store-stock']),
		routing: { request: { body: { catentry_id: '={{ String($value).trim() }}' } } },
		description: "The product's catentry_id from Get Product",
	},
	{
		displayName: 'Near',
		name: 'bootsStockNear',
		type: 'options',
		default: 'postcode',
		options: [
			{ name: 'Coordinates (Required on Ireland)', value: 'coordinates' },
			{ name: 'UK Postcode', value: 'postcode' },
		],
		displayOptions: show(['store-stock']),
		description: 'The stores near a full UK postcode or near a latitude and longitude',
	},
	{
		displayName: 'Postcode',
		name: 'bootsStockPostcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'NG2 3AA',
		displayOptions: show(['store-stock'], { bootsStockNear: ['postcode'] }),
		routing: { request: { body: { postcode: '={{ String($value).trim() }}' } } },
		description: 'A full UK postcode (UK only)',
	},
	{
		displayName: 'Latitude',
		name: 'bootsStockLatitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -90, maxValue: 90, numberPrecision: 6 },
		displayOptions: show(['store-stock'], { bootsStockNear: ['coordinates'] }),
		routing: { request: { body: { latitude: '={{ $value }}' } } },
		description: 'Latitude to search around (Find Stores returns it for a town)',
	},
	{
		displayName: 'Longitude',
		name: 'bootsStockLongitude',
		type: 'number',
		required: true,
		default: 0,
		typeOptions: { minValue: -180, maxValue: 180, numberPrecision: 6 },
		displayOptions: show(['store-stock'], { bootsStockNear: ['coordinates'] }),
		routing: { request: { body: { longitude: '={{ $value }}' } } },
		description: 'Longitude to search around',
	},

	// -- Find Stores --
	{
		displayName: 'Find By',
		name: 'bootsStoresBy',
		type: 'options',
		default: 'postcode',
		options: [
			{ name: 'Town or City', value: 'city' },
			{ name: 'UK Postcode', value: 'postcode' },
		],
		displayOptions: show(['stores']),
		description: 'A full UK postcode (UK) or a town or city (UK and Ireland; Ireland takes a town only)',
	},
	{
		displayName: 'Postcode',
		name: 'bootsStoresPostcode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'M1 1AE',
		displayOptions: show(['stores'], { bootsStoresBy: ['postcode'] }),
		routing: { request: { body: { postcode: '={{ String($value).trim() }}' } } },
		description: 'A full UK postcode',
	},
	{
		displayName: 'Town or City',
		name: 'bootsStoresCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Cork',
		displayOptions: show(['stores'], { bootsStoresBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A town or city in the UK or Ireland',
	},

	// -- Get Store --
	{
		displayName: 'Find By',
		name: 'bootsStoreBy',
		type: 'options',
		default: 'store',
		options: [
			{ name: 'Exact Name', value: 'name' },
			{ name: 'Page Slug or Link', value: 'store' },
			{ name: 'Store Number (UK)', value: 'store_number' },
		],
		displayOptions: show(['store']),
		description:
			"A store page slug or link, a store number from Find Stores (boots.com) or a store's exact name from Find Stores (boots.ie store pages are not numbered)",
	},
	{
		displayName: 'Store Page',
		name: 'bootsStorePage',
		type: 'string',
		required: true,
		default: '',
		placeholder: '868-london-battersea-sw11-1qn',
		displayOptions: show(['store'], { bootsStoreBy: ['store'] }),
		routing: { request: { body: { store: '={{ String($value).trim() }}' } } },
		description:
			'A Boots store page slug or link (boots.com /stores/868-london-battersea-sw11-1qn, boots.ie /stores/cork-boots-patrick-street)',
	},
	{
		displayName: 'Store Number',
		name: 'bootsStoreNumber',
		type: 'string',
		required: true,
		default: '',
		placeholder: '868',
		displayOptions: show(['store'], { bootsStoreBy: ['store_number'] }),
		routing: { request: { body: { store_number: '={{ String($value).trim() }}' } } },
		description: "A store_number from Find Stores (boots.com), found on Boots' store A-Z list (one more call)",
	},
	{
		displayName: 'Store Name',
		name: 'bootsStoreName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Cork Patrick Street',
		displayOptions: show(['store'], { bootsStoreBy: ['name'] }),
		routing: { request: { body: { name: '={{ String($value).trim() }}' } } },
		description: "A store's name exactly as Find Stores gives it, found on Boots' store A-Z list (one more call)",
	},

	// -- Market --
	{
		displayName: 'Market',
		name: 'bootsMarket',
		type: 'options',
		default: 'uk',
		options: [
			{ name: 'Ireland (boots.ie, EUR)', value: 'ie' },
			{ name: 'United Kingdom (boots.com, GBP)', value: 'uk' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { market: '={{ $value === "uk" ? undefined : $value }}' } } },
		description:
			'Ireland has its own EUR prices, and some UK products are not sold there. A product link sets the market itself.',
	},
];
