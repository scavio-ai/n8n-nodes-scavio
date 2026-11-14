import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['wayfair'], operation, ...extra },
});

// Wayfair, 4 operations, 1 credit each. Markets: United States (wayfair.com), Canada
// (wayfair.ca, English or French), United Kingdom (wayfair.co.uk) and Ireland (wayfair.ie).
// The US banner sites (AllModern, Birch Lane, Joss & Main, Perigold) are picked with Site on
// Search Products, Get Product and Get Category Products. A category grid can take about 40s,
// so every operation carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const ALL_OPS = ['search', 'product', 'category', 'deals'];
const SITE_OPS = ['search', 'product', 'category'];
const GRID_OPS = ['search', 'category'];

const PRICES =
	"Prices are in the market's currency, never converted. was_price is Wayfair's strikethrough price, which Wayfair's terms define as the manufacturer's suggested price or the highest price Wayfair offered or sold the item at in the past; the Sale label means a discount against a price in the previous 90 days. Wayfair shows no price history, so poll price, sale_price, was_price and badge to build one.";
const ITEM =
	'sku, name, brand (ID, name), URL, image, price, sale_price, was_price, price_label, discount_percent, per_item_price, prices, badge, rating, review_count, stock_status, stock_text, open_box_price, option_counts and sponsored';
const GRID = `count, total (approximate), page, page_size, total_pages, sort, applied_filters, facets and items with ${ITEM}.`;
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

export const wayfairOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['wayfair'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get wayfair category products',
				description: `One Wayfair category's products (48 per page) by category ID or URL, with the search sorts and filters. Returns category (ID, name, URL, breadcrumbs) and ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/wayfair/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a wayfair product',
				description: `One Wayfair product by SKU or product URL: price, sale_price, was_price, price_label, percent_off, badge, limited_time_deal, stock_status, max_quantity, options (choices with option_id; choices carry no price, so read each option with Option ID), dimensions, specifications, features, description, images, documents, returns, rating, review_count, rating_histogram, review_summary, review_aspects and the 5 reviews the page shows (no review paging). With a ZIP / postal code (United States and Canada only): delivery estimates. ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/wayfair/product'),
			},
			{
				name: 'Get Sale Events',
				value: 'deals',
				action: 'Get wayfair sale events',
				description: `The market's current Wayfair sale events (the Daily Sales list): event_id, slug, title, URL and image per event. Events are listed, not expanded: for sale, closeout or open-box products use Search Products or Get Category Products with On Sale Only, Closeout Only or Open Box Only. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/wayfair/deals'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search wayfair products',
				description: `Search Wayfair products by keyword (30 per page). A keyword that matches a category returns that category's grid (48 per page) and says so in redirected_to. Returns query and ${GRID} ${PRICES} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/wayfair/search'),
			},
		],
		default: 'search',
	},
];

export const wayfairFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Canada (Wayfair.ca)', value: 'ca' },
			{ name: 'Ireland (Wayfair.ie)', value: 'ie' },
			{ name: 'United Kingdom (Wayfair.co.uk)', value: 'gb' },
			{ name: 'United States (Wayfair.com)', value: 'us' },
		],
		displayOptions: show(ALL_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			'The Wayfair market. Prices come in its currency (USD, CAD, GBP, EUR). Wayfair no longer sells in Germany or Austria.',
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: 'en',
		options: [
			{ name: 'English', value: 'en' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(ALL_OPS, { country: ['ca'] }),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'Wayfair.ca in English or French (French names, labels and dates)',
	},
	{
		displayName: 'Site',
		name: 'site',
		type: 'options',
		default: 'wayfair',
		options: [
			{ name: 'AllModern', value: 'allmodern' },
			{ name: 'Birch Lane', value: 'birchlane' },
			{ name: 'Joss & Main', value: 'jossandmain' },
			{ name: 'Perigold', value: 'perigold' },
			{ name: 'Wayfair', value: 'wayfair' },
		],
		displayOptions: show(SITE_OPS, { country: ['us'] }),
		routing: { request: { body: { site: '={{ $value === "wayfair" ? undefined : $value }}' } } },
		description: "Wayfair's US banner sites (USD) or Wayfair itself",
	},

	// -- Search Products --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'office chair',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords (a SKU opens that product: redirected_to)',
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'sku',
		options: [
			{ name: 'SKU', value: 'sku' },
			{ name: 'Product URL', value: 'url' },
		],
		displayOptions: show(['product']),
		description: 'Read a product by its Wayfair SKU or by its product page link',
	},
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'W005006988',
		displayOptions: show(['product'], { productBy: ['sku'] }),
		routing: { request: { body: { sku: '={{ $value }}' } } },
		description: 'A Wayfair SKU (items[].sku of a search, or "SKU:" on the product page)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder:
			'https://www.wayfair.com/rugs/pdp/andover-mills-shiflett-oriental-burgundymustardblack-area-rug-w005006988.html',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description:
			'A Wayfair product page; the market, language and site are read from it, so leave Country on its default or set the same market',
	},
	{
		displayName: 'Additional Options',
		name: 'productOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Option ID',
				name: 'option_id',
				type: 'string',
				default: '',
				placeholder: '1820607042',
				description:
					"A size / color / configuration: options[].choices[].option_id of a previous answer (comma-separated for multi-choice products). Returns that option's price and stock; one call per option.",
				routing: { request: { body: { option_id: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'ZIP / Postal Code',
				name: 'zip',
				type: 'string',
				default: '',
				placeholder: '10001',
				description:
					'Delivery estimates to this ZIP or postal code (United States and Canada only)',
				routing: { request: { body: { zip: '={{ $value || undefined }}' } } },
			},
		],
	},

	// -- Get Category Products --
	{
		displayName: 'Category By',
		name: 'categoryBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Category ID', value: 'id' },
			{ name: 'Category URL', value: 'url' },
		],
		displayOptions: show(['category']),
		description: 'Read a category by its ID or by its Wayfair link',
	},
	{
		displayName: 'Category ID',
		name: 'category_id',
		type: 'string',
		required: true,
		default: '',
		placeholder: '413892',
		displayOptions: show(['category'], { categoryBy: ['id'] }),
		routing: { request: { body: { category_id: '={{ $value }}' } } },
		description:
			"A Wayfair category ID from a category URL (...-c413892.html) or a search's redirected_to.category_id, e.g. 413892 = Sofas",
	},
	{
		displayName: 'Category URL',
		name: 'category_url',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.wayfair.com/furniture/sb0/sofas-c413892.html',
		displayOptions: show(['category'], { categoryBy: ['url'] }),
		routing: { request: { body: { category_url: '={{ $value }}' } } },
		description: 'A Wayfair category page (/sb0/, /sb1/ or /sb2/ URL; filters in it are kept)',
	},

	// -- Additional Options: Search Products, Get Category Products --
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(GRID_OPS),
		options: [
			{
				displayName: 'Brand IDs',
				name: 'brand',
				type: 'string',
				default: '',
				placeholder: '44308',
				description:
					'1 to 5 brand IDs, comma-separated (items[].brand.ID or a Brand facet option ID), not names',
				routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Closeout Only',
				name: 'closeout',
				type: 'boolean',
				default: false,
				description: 'Whether to return only closeout products',
				routing: { request: { body: { closeout: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'json',
				default: '{}',
				description:
					'Any facet from a previous response: facets[].ID to facets[].options[].ID values, e.g. {"2471": ["274623"]}; ranges as "min~max"',
				routing: {
					request: {
						body: { filters: '={{ typeof $value === "string" ? JSON.parse($value) : $value }}' },
					},
				},
			},
			{
				displayName: 'In Stock Only',
				name: 'in_stock',
				type: 'boolean',
				default: false,
				description: 'Whether to return only products in stock',
				routing: { request: { body: { in_stock: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Maximum Price',
				name: 'price_max',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: "Highest price, in the market's currency",
				routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Price',
				name: 'price_min',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: "Lowest price, in the market's currency",
				routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Minimum Rating',
				name: 'min_rating',
				type: 'options',
				default: 4,
				options: [
					{ name: '1 Star and Up (Any Reviewed Product)', value: 1 },
					{ name: '3 Stars and Up', value: 3 },
					{ name: '4 Stars and Up', value: 4 },
					{ name: '5 Stars Only', value: 5 },
				],
				description: 'Customer rating filter',
				routing: { request: { body: { min_rating: '={{ $value }}' } } },
			},
			{
				displayName: 'New Arrivals Only',
				name: 'new_arrivals',
				type: 'boolean',
				default: false,
				description: 'Whether to return only new arrivals',
				routing: { request: { body: { new_arrivals: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'On Sale Only',
				name: 'on_sale',
				type: 'boolean',
				default: false,
				description: 'Whether to return only products on sale',
				routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Open Box Only',
				name: 'open_box',
				type: 'boolean',
				default: false,
				description: 'Whether to return only products with an open-box offer (open_box_price)',
				routing: { request: { body: { open_box: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Results page, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'recommended',
				options: [
					{ name: 'Customer Rating', value: 'rating' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
					{ name: 'Recommended', value: 'recommended' },
				],
				description:
					"Result order. Price sorts follow Wayfair's price per item (a set by its per-item price).",
				routing: {
					request: { body: { sort: '={{ $value === "recommended" ? undefined : $value }}' } },
				},
			},
		],
	},
];
