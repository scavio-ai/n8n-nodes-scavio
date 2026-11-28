import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['ferguson'], operation, ...extra },
});

// Ferguson (ferguson.com, the US plumbing, HVAC and waterworks distributor), 3 operations; credits_used is the truth.
// US only, USD. Search Products and Get Category Products 2 credits (4 when a keyword Ferguson sends to a category is
// asked for a later page or Best Selling) and carry a 240s timeout (results pages take 30 to 60 s); Get Product 4
// credits (2 when the page names no price) and 180s.
const request = (url: string, timeout: number) => ({
	request: { method: 'POST' as const, url, timeout },
});
const LIST_MS = 240000;
const PRODUCT_MS = 180000;

const SITE =
	'Ferguson (ferguson.com, the US plumbing, HVAC and waterworks distributor), US only, prices in USD as ferguson.com shows them to a visitor who is not signed in (never Pro or account pricing)';
const BILL =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged (2 credits). credits_used says what was charged.';
const GRID =
	'Returns total, page, total_pages, has_more, count and items (item for Get Product, name, brand, collection, URL, part_number, manufacturer_part_number, rating, unit_of_measure, price_shown, availability shipping flags). Results carry no prices: Get Product has the price. Store pickup counts are not returned.';

const listOptions = (prefix: string, operation: string): INodeProperties => ({
	displayName: 'Additional Options',
	name: `${prefix}Options`,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: [
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 100 },
			description: 'Results page, 1 to 100, 24 products each',
			routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'best_match',
			options: [
				{ name: 'Best Match', value: 'best_match' },
				{ name: 'Best Selling', value: 'best_selling' },
			],
			description: "Best Match is Ferguson's own order",
			routing: { request: { body: { sort: '={{ $value === "best_match" ? undefined : $value }}' } } },
		},
	],
});

export const fergusonOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ferguson'] } },
		options: [
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get ferguson category products',
				description: `One category of ${SITE} by category path, 24 products a page, Best Match or Best Selling, with name, breadcrumbs and subcategories (name, path, count). ${GRID} An unknown category is a charged not-found. Captured 2026-11-28: water-heaters/tankless-water-heaters held 138 products. Costs 2 credits. ${BILL}`,
				routing: request('/api/v1/ferguson/category', LIST_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a ferguson product',
				description: `One product of ${SITE} by item number or link: price, list_price, price_per_unit, call_for_pricing, note (why price is null), unit_of_measure, order_multiple, package_quantities (Each, Inner Pack, Case, Pallet), variants, specs, certifications, documents (specification, installation, warranty sheets), UPC and part numbers. Items Ferguson prices for signed-in customers only answer price null with a note. Ferguson prices by region, so the same item can read a different price on another read. Captured 2026-11-28: a 1/2 in. brass ball valve at 33.24 USD each. Costs 4 credits (2 when the page names no price). ${BILL}`,
				routing: request('/api/v1/ferguson/product', PRODUCT_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search ferguson products',
				description: `Search ${SITE} by keyword, 24 products a page, Best Match or Best Selling. ${GRID} categories lists the matching categories (path for Get Category Products); a keyword Ferguson sends to a category answers that category with redirected_to. Captured 2026-11-28: pex tubing matched 253 products. Costs 2 credits (4 when a keyword Ferguson sends to a category is asked for a later page or Best Selling). ${BILL}`,
				routing: request('/api/v1/ferguson/search', LIST_MS),
			},
		],
		default: 'search',
	},
];

export const fergusonFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'fergusonQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'pex tubing',
		displayOptions: show(['search']),
		routing: { request: { body: { q: '={{ String($value).trim() }}' } } },
		description: 'Search keywords as a buyer types them on ferguson.com (product type, brand, part or item number)',
	},
	listOptions('fergusonSearch', 'search'),

	// -- Get Category Products --
	{
		displayName: 'Category Path or URL',
		name: 'fergusonCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'water-heaters/tankless-water-heaters',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: 'A Ferguson category path (categories[].path of a search, subcategories[].path of a category) or a ferguson.com /category/ link',
	},
	listOptions('fergusonCategory', 'category'),

	// -- Get Product --
	{
		displayName: 'Item Number or URL',
		name: 'fergusonProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4606091',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					item: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A Ferguson item number (item of a search result: the digits after Item # on ferguson.com) or a ferguson.com /product/ link',
	},
];
