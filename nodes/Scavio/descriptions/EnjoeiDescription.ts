import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['enjoei'], operation, ...extra },
});

// Enjoei (enjoei.com.br, Brazil's second-hand fashion marketplace), 9 operations, 1 credit each; credits_used is the
// truth. Brazil only, BRL. Search, category, shop listings and suggestions usually take 10 to 40 s, up to about two
// minutes, and carry a 240s timeout; the others take 2 to 10 s and carry 120s.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const SLOW_MS = 240000;
const FAST_MS = 120000;

const SITE =
	"Enjoei (enjoei.com.br, Brazil's second-hand fashion marketplace), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRIVACY = 'Seller names, avatars and cities are never returned: the seller is its @handle.';
const LIST =
	"page, total (Enjoei's count stops at 10000: total_capped), count, has_more, next_cursor (send it back in Cursor for the next page), items (id for Get Product, URL, title, brand, price, original_price before the seller's discount, discount_percent, condition new or used, size, sizes, shipping free and type, department, category, subcategory, image, tags, bundle_allowed, seller_handle for the shop operations), page_size, facets (brands with counts, departments, subcategories, sizes and store kinds, with the slugs the options take) and notes.";
const FILTERS =
	'4 sorts; brand, clothing, waist and shoe sizes, a price range in BRL, condition, listing age, store kind and a discount range. Listings cover sellers who ship to all of Brazil. There is no colour filter: put the colour in the query.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

/** A comma-separated list as one value or an array, or undefined when empty. */
const LIST_VALUE =
	'={{ (() => { const a = String($value ?? "").split(",").map((s) => s.trim()).filter(Boolean); return a.length === 0 ? undefined : a.length === 1 ? a[0] : a; })() }}';

const listOption = (displayName: string, name: string, key: string, description: string, placeholder: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: LIST_VALUE } } },
});

const numberOption = (displayName: string, name: string, key: string, max: number, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: max },
	description,
	routing: { request: { body: { [key]: '={{ $value > 0 ? $value : undefined }}' } } },
});

const cursorOption = (name: string): INodeProperties => ({
	displayName: 'Cursor',
	name,
	type: 'string',
	default: '',
	description: 'Next_cursor of the previous page; empty for page 1',
	routing: { request: { body: { cursor: '={{ String($value).trim() || undefined }}' } } },
});

/** Sort, filters and the cursor shared by Search Listings and Get Category Listings. */
const gridOptions = (prefix: string): INodeProperties[] => [
	listOption('Brand', `${prefix}Brand`, 'brand', 'Brand slug(s) as Enjoei writes them (facets brands slug), comma-separated, up to 10, e.g. farm, zara', 'farm'),
	{
		displayName: 'Condition',
		name: `${prefix}Condition`,
		type: 'options',
		default: 'any',
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'New', value: 'new' },
			{ name: 'Used', value: 'used' },
		],
		routing: { request: { body: { condition: '={{ $value === "any" ? undefined : $value }}' } } },
	},
	cursorOption(`${prefix}Cursor`),
	numberOption('Discount Max (%)', `${prefix}DiscountMax`, 'discount_max', 100, 'Largest discount, percent; 0 means no limit'),
	numberOption('Discount Min (%)', `${prefix}DiscountMin`, 'discount_min', 100, 'Smallest discount, percent; 0 means no limit'),
	{
		displayName: 'Listed Within',
		name: `${prefix}ListedWithin`,
		type: 'options',
		default: 'any',
		options: [
			{ name: '14 Days', value: '14d' },
			{ name: '24 Hours', value: '24h' },
			{ name: '30 Days', value: '30d' },
			{ name: '7 Days', value: '7d' },
			{ name: 'Any Time', value: 'any' },
		],
		routing: { request: { body: { listed_within: '={{ $value === "any" ? undefined : $value }}' } } },
	},
	numberOption('Max Price (BRL)', `${prefix}PriceMax`, 'price_max', 1000000, 'Highest price in BRL; 0 means no limit'),
	numberOption('Min Price (BRL)', `${prefix}PriceMin`, 'price_min', 1000000, 'Lowest price in BRL; 0 means no limit'),
	listOption('Size (Clothes)', `${prefix}SizeClothes`, 'size_clothes', 'Clothing size slug(s), comma-separated (facets sizes clothes: pp, p, m, g, gg, xgg, 36, 38 ...)', 'm'),
	listOption('Size (Shoes)', `${prefix}SizeShoes`, 'size_shoes', 'Shoe size slug(s), comma-separated (facets sizes shoes)', '37'),
	listOption('Size (Waist)', `${prefix}SizeWaist`, 'size_waist', 'Waist size slug(s), comma-separated (facets sizes waist)', '38'),
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Discount', value: 'discount' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
	{
		displayName: 'Store Kind',
		name: `${prefix}StoreKind`,
		type: 'options',
		default: 'any',
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'Celebrity Closets', value: 'celebrity' },
			{ name: 'Enjoei Pro', value: 'pro' },
		],
		routing: { request: { body: { store_kind: '={{ $value === "any" ? undefined : $value }}' } } },
	},
];

const handleField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Handle',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: 'utstore',
	displayOptions: show(operations),
	routing: { request: { body: { handle: '={{ String($value).trim() }}' } } },
	description: 'The shop handle (enjoei.com.br/@handle, seller_handle of a listing), with or without the @, or the shop link',
});

export const enjoeiOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['enjoei'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get enjoei categories',
				description: `The ${SITE} category tree: count, node_count and departments (name, slug, URL, params with the department, category and subcategory Get Category Listings takes, children), three levels deep. Captured 2026-11-27: 5 departments and 190 nodes. ${ONE}`,
				routing: request('/api/v1/enjoei/categories', FAST_MS, true),
			},
			{
				name: 'Get Category Listings',
				value: 'category',
				action: 'Get enjoei category listings',
				description: `One ${SITE} department, category or subcategory by the slugs Get Categories lists, optionally with keywords, sorted and filtered like Search Listings: ${FILTERS} Returns department, category, subcategory, query, sort, filters and ${LIST} A category slug outside its department is refused before anything is charged. ${PRIVACY} Captured 2026-11-27: feminino / feminino-roupas / feminino-roupas-vestidos reached the 10000 cap. ${ONE}`,
				routing: request('/api/v1/enjoei/category', SLOW_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get an enjoei product',
				description: `One ${SITE} listing by product ID or link: title, description, status, available, price, list_price, discount_percent, installments_text, promo_text (a new-buyer coupon line when shown), offer (whether the seller accepts offers, with the min and max offer), bundle_allowed, size, sizes, brand (name, slug, verified), condition, weight_kg, hand_delivery, single_piece, photos, category_slug, breadcrumb, seller (ID and handle), price_detail and notes. Shipping cost and type are shown to signed-in buyers only. ${PRIVACY} Not available: shipping quotes by CEP, product comments, coupons. An unknown product is a charged not-found. Captured 2026-11-27: a used FARM one-shoulder dress at 75 BRL (list 90), offers accepted from 45 to 74 BRL. ${ONE}`,
				routing: request('/api/v1/enjoei/product', FAST_MS),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get enjoei search suggestions',
				description: `The ${SITE} search suggestions for what a shopper has typed: query, count and suggestions (text, query, department slug a suggestion narrows to). Captured 2026-11-27: vestido gave 10 suggestions. ${ONE}`,
				routing: request('/api/v1/enjoei/suggestions', SLOW_MS),
			},
			{
				name: 'Get Shop',
				value: 'shop',
				action: 'Get an enjoei shop',
				description: `A seller's shop on ${SITE} by handle: handle, seller_id, URL, joined_at, on_vacation, business, badge, counters (listings, sold, likes, followers, following), rating (0 to 5), review_count, recent_deliveries (on_time, delayed, cancelled), average_shipping_time and notes. Names, avatars, header images, cities and the shop's own description are never returned. An unknown handle is a charged not-found. Captured 2026-11-27: utstore, 706 listings, 2008 sold, rated 4.7 from 809 reviews. ${ONE}`,
				routing: request('/api/v1/enjoei/shop', FAST_MS),
			},
			{
				name: 'Get Shop Listings',
				value: 'shop_listings',
				action: 'Get enjoei shop listings',
				description: `The listings on sale in one shop on ${SITE} by handle, in the order the shop page shows them, 20 on page 1 and 30 on later pages: handle, seller_id and ${LIST} Next pages: send next_cursor in Cursor. An unknown handle is a charged not-found. ${PRIVACY} Captured 2026-11-27: utstore had 706 listings on sale. ${ONE}`,
				routing: request('/api/v1/enjoei/shop-listings', SLOW_MS),
			},
			{
				name: 'Get Shop Reviews',
				value: 'shop_reviews',
				action: 'Get enjoei shop reviews',
				description: `Buyer reviews of a shop on ${SITE} by handle or shop ID, all, positive or negative, 20 a page by cursor: handle, seller_id, filter, page_size, count, has_more, next_cursor, items (score 1 to 5, date, text, feedback_tags), summary (score, total, stars, feedbacks) and notes. Reviewer names and photos are never returned. An unknown handle is a charged not-found. Captured 2026-11-27: utstore scored 4.7 from 809 reviews. ${ONE}`,
				routing: request('/api/v1/enjoei/shop-reviews', FAST_MS),
			},
			{
				name: 'Get Shop Sold Listings',
				value: 'shop_sold',
				action: 'Get enjoei shop sold listings',
				description: `A shop's sold listings on ${SITE} by handle and page: handle, page, page_size (40), total, total_pages, has_more, count, items (ID, URL, title, the listed price, currency, image, status) and notes. Enjoei shows no sold date, and at most 50 pages (2,000 sold listings) per shop. An unknown handle is a charged not-found. Captured 2026-11-27: utstore showed 1998 sold listings over 50 pages. ${ONE}`,
				routing: request('/api/v1/enjoei/shop-sold', FAST_MS),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search enjoei listings',
				description: `${SITE} listing search: ${FILTERS} Returns query, sort, filters and ${LIST} No results is an empty, charged answer. ${PRIVACY} Captured 2026-11-27: vestido farm reached the 10000 cap, the first a used FARM linen midi dress at 199 BRL. ${ONE}`,
				routing: request('/api/v1/enjoei/search', SLOW_MS),
			},
		],
		default: 'search',
	},
];

export const enjoeiFields: INodeProperties[] = [
	// -- Search Listings --
	{
		displayName: 'Query',
		name: 'enjoeiQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vestido farm',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Search keywords in Portuguese, as shoppers type them (1 to 200 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'enjoeiSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('enjoeiSearch')),
	},

	// -- Get Category Listings --
	{
		displayName: 'Department',
		name: 'enjoeiDepartment',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'feminino',
		displayOptions: show(['category']),
		routing: { request: { body: { department: '={{ String($value).trim() }}' } } },
		description: 'Department slug (params department from Get Categories), e.g. feminino, masculino, infantil, casa-e-decor',
	},
	{
		displayName: 'Additional Options',
		name: 'enjoeiCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([
			{
				displayName: 'Category',
				name: 'enjoeiCategory',
				type: 'string',
				default: '',
				placeholder: 'feminino-roupas',
				description: 'Category slug in that department (params category from Get Categories)',
				routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Query',
				name: 'enjoeiCategoryQuery',
				type: 'string',
				default: '',
				description: 'Optional keywords inside the category',
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Subcategory',
				name: 'enjoeiSubcategory',
				type: 'string',
				default: '',
				placeholder: 'feminino-roupas-vestidos',
				description: 'Subcategory slug in that category (params subcategory from Get Categories); needs Category',
				routing: { request: { body: { subcategory: '={{ String($value).trim() || undefined }}' } } },
			},
			...gridOptions('enjoeiCategory'),
		]),
	},

	// -- Get Product --
	{
		displayName: 'Product ID or URL',
		name: 'enjoeiProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '153252795',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					product_id: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'The Enjoei product ID (ID of a listing) or a product link (https://www.enjoei.com.br/p/name-ID)',
	},

	// -- Get Shop, Get Shop Listings, Get Shop Sold Listings --
	handleField('enjoeiShopHandle', ['shop']),
	handleField('enjoeiListingsHandle', ['shop_listings']),
	{
		displayName: 'Additional Options',
		name: 'enjoeiListingsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['shop_listings']),
		options: [cursorOption('enjoeiListingsCursor')],
	},
	handleField('enjoeiSoldHandle', ['shop_sold']),
	{
		displayName: 'Page',
		name: 'enjoeiSoldPage',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 50 },
		displayOptions: show(['shop_sold']),
		description: 'Page, 1 to 50 (40 sold listings each)',
		routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
	},

	// -- Get Shop Reviews --
	{
		displayName: 'Handle or Shop ID',
		name: 'enjoeiReviewsShop',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'utstore',
		displayOptions: show(['shop_reviews']),
		routing: {
			request: {
				body: {
					shop_id: '={{ /^\\d{1,12}$/.test(String($value).trim()) ? String($value).trim() : undefined }}',
					handle: '={{ /^\\d{1,12}$/.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description: 'The shop handle (with or without the @, or the shop link), or the numeric seller ID (seller_id of Get Shop); a number is read as the seller ID',
	},
	{
		displayName: 'Additional Options',
		name: 'enjoeiReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['shop_reviews']),
		options: sorted([
			cursorOption('enjoeiReviewsCursor'),
			{
				displayName: 'Filter',
				name: 'enjoeiReviewsFilter',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Negative', value: 'negative' },
					{ name: 'Positive', value: 'positive' },
				],
				routing: { request: { body: { filter: '={{ $value === "all" ? undefined : $value }}' } } },
			},
		]),
	},

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'enjoeiSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'vestido',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What the shopper has typed so far (1 to 100 characters)',
	},
];
