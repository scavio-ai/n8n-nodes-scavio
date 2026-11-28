import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['globalindustrial'], operation, ...extra },
});

// Global Industrial (globalindustrial.com, the US industrial-equipment and MRO supplier; Global Industrial Canada at
// globalindustrial.ca), 5 operations, 1 credit each; credits_used is the truth. Usually 5 to 60 s; every operation
// carries a 180s timeout.
const request = (url: string, timeout: number, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout, ...(emptyBody ? { body: {} } : {}) },
});
const PAGE_MS = 180000;

const SITE =
	'Global Industrial (globalindustrial.com, the US industrial-equipment and MRO supplier; Global Industrial Canada at globalindustrial.ca with Market Canada), prices as shown to a visitor who is not signed in, in USD or CAD';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	"price is one selling unit (a pack or case where package_quantity is above 1) and unit_price the price per piece; quantity_breaks are the site's volume prices, counted in selling units. A MAP-priced item shows 'See price in cart' on the site, so its price fields are null and map_pricing is true. msrp is a list price the site does not show on the page and can sit below the price.";
const ITEM =
	'items (item_number, name, URL, slug, image, brand, manufacturer_part_number, unspsc, product_group, category, category_path, currency, price, price_type regular / promotional / clearance, was_price, savings_percent, msrp, clearance_price, map_pricing, package_quantity, unit_price, min_order_quantity, max_order_quantity, quantity_breaks, in_stock, availability, lead_time_days, ships_ltl_freight, free_shipping, clearance, rating, review_count, highlights, variants)';
const NOT_BUILT = 'No sort, reviews or questions.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const marketOption: INodeProperties = {
	displayName: 'Market',
	name: 'market',
	type: 'options',
	default: 'us',
	options: [
		{ name: 'Canada (globalindustrial.ca, CAD)', value: 'ca' },
		{ name: 'United States (globalindustrial.com, USD)', value: 'us' },
	],
	description: 'Global Industrial in the United States (default) or Global Industrial Canada',
	routing: { request: { body: { market: '={{ $value === "us" ? undefined : $value }}' } } },
};
const brandOption: INodeProperties = {
	displayName: 'Brand',
	name: 'brand',
	type: 'string',
	default: '',
	placeholder: 'Wesco',
	description: "Limit the results to one brand, as Global Industrial writes it (a listing item's brand)",
	routing: { request: { body: { brand: '={{ String($value).trim() || undefined }}' } } },
};

const options = (prefix: string, operation: string, extra: INodeProperties[]): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: sorted(
		[...extra, marketOption].map((o) => ({ ...o, name: `${prefix}${o.name.charAt(0).toUpperCase()}${o.name.slice(1)}` })),
	),
});

export const globalindustrialOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['globalindustrial'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get global industrial brand products',
				description: `The products of one brand on ${SITE}: brand (as matched), total (the brand's full product count), count, up to 42 ${ITEM} as the brand page lists them, and facets (the brand's product count per top-level category). ${PRICES} A brand with no products is a charged not-found. Captured 2026-11-28: Wesco listed 438 products. ${ONE}`,
				routing: request('/api/v1/globalindustrial/brand', PAGE_MS),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get global industrial category products',
				description: `One category of ${SITE} by category path (/c/...) or department path (/t/...), optionally one brand or one product group. A leaf category returns its products by product group: groups (group_id, name, count, shown, attributes) and ${ITEM}, at most 10 per group (Product Group lists every product of one group). A broader category or a department returns subcategories (name, path, URL, total, leaf). Also category, total, facets and notes, in the site's default order. ${PRICES} An unknown category is a charged not-found. Captured 2026-11-28: the drum trucks and cradles category held 162 products. ${ONE}`,
				routing: request('/api/v1/globalindustrial/category', PAGE_MS),
			},
			{
				name: 'Get Clearance',
				value: 'clearance',
				action: 'Get global industrial clearance',
				description: `The clearance section of ${SITE}. Without options: total (all clearance products), categories (ID, name, count), sections and the page's New to Clearance and Bestsellers products. With Clearance Category and / or Brand: up to 42 matching clearance products, total, the sub-category counts and facets. Clearance items carry price_type clearance, clearance_price, was_price and, where the site limits it, max_order_quantity. Captured 2026-11-28: PRIME30 (Carts & Trucks) held 65 clearance products. ${ONE}`,
				routing: request('/api/v1/globalindustrial/clearance', PAGE_MS, true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a global industrial product',
				description: `One product of ${SITE} by product link or slug, or by item number or manufacturer part number: the item fields plus summary, breadcrumbs, images, specs (group, name, value, unit), documents (manuals and spec sheets) and launch_date. ${PRICES} ${NOT_BUILT} An unknown product is a charged not-found. Captured 2026-11-28: item 652508, a Wesco drum dispenser truck, at 399.95 USD, ships in 15 business days. ${ONE}`,
				routing: request('/api/v1/globalindustrial/product', PAGE_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search global industrial products',
				description: `Search ${SITE} by keyword, item number or manufacturer part number, optionally one brand. Global Industrial answers a keyword with a search listing, or sends it to a category or straight to the product page: landed_on (search, category, product) and redirected_to say which. Returns total, count, up to 42 ${ITEM}, groups, subcategories (when the keyword maps to a broad category), category, facets and notes; total is the full count. ${PRICES} ${NOT_BUILT} A keyword with no products returns total 0. Captured 2026-11-28: nitrile gloves 6 mil matched 13 products. ${ONE}`,
				routing: request('/api/v1/globalindustrial/search', PAGE_MS),
			},
		],
		default: 'search',
	},
];

export const globalindustrialFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Query',
		name: 'globalindustrialQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nitrile gloves',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords, a Global Industrial item number (e.g. 652508) or a manufacturer part number (1 to 120 characters)',
	},
	options('globalindustrialSearch', 'search', [brandOption]),

	// -- Get Category Products --
	{
		displayName: 'Category Path',
		name: 'globalindustrialPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/c/carts-trucks/hand_trucks/drum_trucks_cradles',
		displayOptions: show(['category']),
		routing: { request: { body: { path: '={{ String($value).trim() }}' } } },
		description:
			"A category path (/c/..., as a listing's subcategories path or an item's category_path give it), a department path (/t/carts-trucks), or a link to one",
	},
	options('globalindustrialCategory', 'category', [
		brandOption,
		{
			displayName: 'Product Group',
			name: 'group',
			type: 'string',
			default: '',
			placeholder: '42311',
			description: 'A product group of a leaf category (group_id of groups): every product of that group',
			routing: { request: { body: { group: '={{ String($value).trim() || undefined }}' } } },
		},
	]),

	// -- Get Brand Products --
	{
		displayName: 'Brand',
		name: 'globalindustrialBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Wesco',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: "A brand as Global Industrial writes it (a listing item's brand), e.g. Wesco, Global Industrial or Valley Craft",
	},
	options('globalindustrialBrand', 'brand', []),

	// -- Get Product --
	{
		displayName: 'Product URL or Item Number',
		name: 'globalindustrialProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '652508',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					url: '={{ /^(https?:|\\/p\\/)/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
					item: '={{ /^(https?:|\\/p\\/)/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				},
			},
		},
		description:
			'A product link or path (/p/name), or a Global Industrial item number or manufacturer part number. A slug alone is sent as an item; send a slug as /p/slug.',
	},
	options('globalindustrialProduct', 'product', []),

	// -- Get Clearance --
	options('globalindustrialClearance', 'clearance', [
		brandOption,
		{
			displayName: 'Clearance Category',
			name: 'category',
			type: 'string',
			default: '',
			placeholder: 'PRIME30',
			description: 'A clearance category ID (ID of a clearance answer\'s categories), e.g. PRIME30 for Carts & Trucks',
			routing: { request: { body: { category: '={{ String($value).trim() || undefined }}' } } },
		},
	]),
];
