import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['mcmaster'], operation, ...extra },
});

// McMaster-Carr (mcmaster.com, the US industrial-supply catalog), 3 operations, 1 credit each; credits_used is the
// truth. United States, USD. Get Product and Get Categories carry a 180s timeout; search pages are large and slow
// (10 to 80 s, up to about 240 s) and carry 300s.
const request = (url: string, timeout: number) => ({
	request: { method: 'POST' as const, url, timeout },
});
const PAGE_MS = 180000;
const SEARCH_MS = 300000;

const SITE =
	'McMaster-Carr (mcmaster.com, the US industrial-supply catalog), United States, prices in USD as the site shows them to a visitor who is not signed in';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const CATALOG =
	'McMaster-Carr sells under its own part numbers: no manufacturer part numbers, UPCs, reviews, stores or deals.';

export const mcmasterOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['mcmaster'] } },
		options: [
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get mc master carr categories',
				description: `The top level of the catalogue of ${SITE}, as the home page lists it: count and categories (name, slug, URL). slug is the Category Slug input of Search Products, which returns the deeper levels. Captured 2026-11-28: 27 categories. ${ONE}`,
				routing: request('/api/v1/mcmaster/categories', PAGE_MS),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a mc master carr product',
				description: `One part of ${SITE} by part number or part link: title, product_family, unit_of_measure (Each or Pack of N), package_quantity, price and price_text (one order unit), package_price, unit_price (the price of one piece), price_levels (quantity breaks when listed), delivery_message (the delivery promise shown; no stock counts are published), discontinued, replacement_part_number, specifications, compliance (country of origin, DFARS, ECCN, Schedule B, RoHS, REACH, USMCA), images, breadcrumbs and compatible_products. ${CATALOG} A part number the site does not know is not answered (an unbilled error after about 2 minutes). Captured 2026-11-28: a socket head screw at 12.42 USD per pack of 50 (0.25 USD per piece). ${ONE}`,
				routing: request('/api/v1/mcmaster/product', PAGE_MS),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search mc master carr products',
				description: `A keyword page or a category page of ${SITE}: heading, total (the products the site counts), rows_on_page, offset, per_page, count, has_more, items (part_number for Get Product, presentation, groups, price, price_basis Pkg. or Each, package_quantity, package_price, unit_price, specs), breadcrumbs, product_families (name, product_count, slug for the next call), related_categories and facets. Search-box suggestions are not returned. Large families can take up to about 4 minutes: narrow them with a family or facet slug. ${CATALOG} Captured 2026-11-28: hose clamps counted 6,125 products in 39 families. ${ONE}`,
				routing: request('/api/v1/mcmaster/search', SEARCH_MS),
			},
		],
		default: 'search',
	},
];

export const mcmasterFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Search By',
		name: 'mcmasterSearchBy',
		type: 'options',
		default: 'query',
		options: [
			{ name: 'Keywords', value: 'query' },
			{ name: 'Category Slug', value: 'category' },
		],
		displayOptions: show(['search']),
		description: 'Keywords as typed into the McMaster-Carr search box, or a category slug',
	},
	{
		displayName: 'Keywords',
		name: 'mcmasterQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hose clamps',
		displayOptions: show(['search'], { mcmasterSearchBy: ['query'] }),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords (up to 120 characters); a part number answers with that part',
	},
	{
		displayName: 'Category Slug',
		name: 'mcmasterCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hose-clamps/worm-drive-clamps~~',
		displayOptions: show(['search'], { mcmasterSearchBy: ['category'] }),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description: "A slug from Get Categories, or a result's product_families[].slug, facets[].values[].slug or breadcrumbs[].slug, or a mcmaster.com/products/ link",
	},
	{
		displayName: 'Additional Options',
		name: 'mcmasterSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 20000 },
				description: 'Rows to skip on the page: the next answer starts at offset + count while has_more is true',
				routing: { request: { body: { offset: '={{ $value > 0 ? $value : undefined }}' } } },
			},
			{
				displayName: 'Rows per Answer',
				name: 'perPage',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 100 },
				description: 'Part-number rows per answer, 1 to 100',
				routing: { request: { body: { per_page: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Product --
	{
		displayName: 'Part Number or URL',
		name: 'mcmasterProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '91251A540',
		displayOptions: show(['product']),
		routing: {
			request: {
				body: {
					part_number: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
					url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
				},
			},
		},
		description: 'A McMaster-Carr part number (part_number of a search item) or a mcmaster.com part link',
	},
];
