import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['estatesales'], operation, ...extra },
});

// EstateSales.net (estatesales.net, the US estate sale directory run by Vintage Software), 6 operations,
// 1 credit each; credits_used is the truth. US only, USD, the 50 states and DC. Get Company and Search can
// take 10 to 50 seconds and calls can queue behind the backend's upstream limit, so every operation carries
// a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const FIRST = 'EstateSales.net (estatesales.net, the US estate sale directory run by Vintage Software)';
const NAME = 'EstateSales.net';
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged).`;
const PRIVATE =
	"Private sellers are never identified: a private sale gives its city, state and ZIP only (no name, phone, street address or coordinates). A company's name, phones, website and address are its public business contact.";

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const SALE_TYPES = [
	{ name: 'Auction House', value: 'auction_house' },
	{ name: 'Auctions', value: 'auctions' },
	{ name: 'Business Closings', value: 'business_closings' },
	{ name: 'Buyouts or Cleanouts', value: 'buyouts_or_cleanouts' },
	{ name: 'By Appointment', value: 'by_appointment' },
	{ name: 'Charity Sales', value: 'charity_sales' },
	{ name: 'Demolition Sales', value: 'demolition_sales' },
	{ name: 'Estate Sales', value: 'estate_sales' },
	{ name: 'Moved Offsite to Store', value: 'moved_offsite_to_store' },
	{ name: 'Moved Offsite to Warehouse', value: 'moved_offsite_to_warehouse' },
	{ name: 'Moving Sales', value: 'moving_sales' },
	{ name: 'Online Estate Sales', value: 'online_estate_sales' },
	{ name: 'Online Only Auctions', value: 'online_only_auctions' },
	{ name: 'Outside Sales', value: 'outside_sales' },
	{ name: 'Single Item Type Collections', value: 'single_item_type_collections' },
];

/** An ID-or-link field: digits go to idKey, an https link to url. */
const idOrUrl = (
	displayName: string,
	name: string,
	operation: string,
	idKey: string,
	placeholder: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show([operation]),
	routing: {
		request: {
			body: {
				[idKey]: '={{ /^https?:/i.test(String($value).trim()) ? undefined : String($value).trim() }}',
				url: '={{ /^https?:/i.test(String($value).trim()) ? String($value).trim() : undefined }}',
			},
		},
	},
	description,
});

export const estatesalesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['estatesales'] } },
		options: [
			{
				name: 'Get Companies',
				value: 'companies',
				action: 'Get estatesales companies',
				description: `Every estate sale company ${NAME} lists for a US metro area, in the site's order: state, metro, heading, count and companies with org_id (what Get Company takes), name, tagline, trusted, package, address, city, state, ZIP, coordinates, phones, website, social links, page URL, logo, created_at and distance. A city resolves to its metro area. Captured 2026-11-26: the Dallas-Fort-Worth-Arlington metro (TX) listed 226 companies. Phones, websites and addresses are each company's public business contact. An unknown metro is a charged not-found. ${ONE}`,
				routing: request('/api/v1/estatesales/companies'),
			},
			{
				name: 'Get Company',
				value: 'company',
				action: 'Get an estatesales company',
				description: `One estate sale company's public ${NAME} page by org ID or link: profile (name, logo, phones, website, description, city, state, ZIP, primary metro area, metro areas, social links, memberships), testimonials (text and date, no author names), sales_count and its current and upcoming sales with sale_id, name, type, URL, address as published, dates, picture count and thumbnail. Captured 2026-11-26: company 14402 (Arlington, TX) served 10 metro areas, had 22 testimonials and listed 19 sales. Can take 10 to 50 seconds. An unknown org ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/estatesales/company'),
			},
			{
				name: 'Get Item',
				value: 'item',
				action: 'Get an estatesales marketplace item',
				description: `One ${NAME} marketplace item by item ID or link: sale_id, name, URL, description, prices in USD (current, current bid, starting bid, minimum bid, buy now, discount), bids, reserve, bidding and buy-now flags, shipping, local pickup, payment, terms, categories, tags, city, state, ZIP, dates, status, dimensions, pictures and the company selling it. Prices and bids are as of the fetch. Captured 2026-11-26: item 2038603 had a current bid of 635 USD after 4 bids (starting bid 100, minimum next bid 645), a reserve and local pickup only. No bidder identity is returned. An unknown item ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/estatesales/item'),
			},
			{
				name: 'Get Sale',
				value: 'sale',
				action: 'Get an estatesales sale',
				description: `One ${NAME} sale in full by sale ID or link: name, type, URL, status, seller (a company with org_id, name, phones, page URL, website, logo and trusted flag; a private seller as type only), location (street address as published once its show-address time has passed, city, state, ZIP, coordinates, directions), local and UTC start and end times with every sale day, length in days, terms, description, featured flags, pictures, auction and video links. Captured 2026-11-26: sale 5114622, a 3-day company-run estate sale in Garland, TX (2026-11-27 to 2026-11-29) with 287 pictures. ${PRIVATE} An unknown sale ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/estatesales/sale'),
			},
			{
				name: 'Get Sales',
				value: 'sales',
				action: 'Get estatesales sales near a place',
				description: `Estate sales, auctions and moving sales near a US ZIP code or in a city's metro area on ${FIRST}: location (kind, state, city, metro, ZIP, heading, coordinates), total_count and filtered_count (the site's own counts for the area), listed, count and sales with sale_id (what Get Sale takes), name, type, URL, seller type (company or private), company (company-run sales), city, state, ZIP, address and coordinates once released, distance in miles, schedule, local and UTC dates, first published time, featured flags, picture count, main picture and auction link. The page lists the first 20 sales of the area (nearest first) with no deeper paging; When, Sale Types and Sort apply to those 20. Captured 2026-11-26: around ZIP 75201 (Dallas, TX) the site counted 164 sales and listed 20, the nearest 2.13 miles away. ${PRIVATE} An unknown ZIP or city is a charged not-found. ${ONE}`,
				routing: request('/api/v1/estatesales/sales'),
			},
			{
				name: 'Search Sales and Items',
				value: 'search',
				action: 'Search estatesales sales and items',
				description: `${NAME}'s keyword search over estate sales and marketplace items, 24 a page in the site's order, pages 1 to 4: total, total_pages, has_more, max_page, count, items (kind item: item_id for Get Item, name, URL, USD prices and bids, buy-now, shipping and pickup flags, city, state, dates, main picture; kind sale: sale_id, name, type, URL, seller type, company name, address for company-run sales, city, state, ZIP, dates, main picture) and companies whose name matches. Captured 2026-11-26: lamp gave 1057 results over 45 pages (pages 1 to 4 can be read); rolex gave 70. Can take 10 to 50 seconds. ${PRIVATE} ${ONE}`,
				routing: request('/api/v1/estatesales/search'),
			},
		],
		default: 'sales',
	},
];

export const estatesalesFields: INodeProperties[] = [
	// -- Get Sales --
	{
		displayName: 'Location By',
		name: 'estatesalesSalesBy',
		type: 'options',
		default: 'zip',
		options: [
			{ name: 'City and State', value: 'city' },
			{ name: 'ZIP Code', value: 'zip' },
		],
		displayOptions: show(['sales']),
		description: "Sales around a US ZIP code, or the sales of a city's metro area",
	},
	{
		displayName: 'ZIP Code',
		name: 'estatesalesSalesZip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '75201',
		displayOptions: show(['sales'], { estatesalesSalesBy: ['zip'] }),
		routing: { request: { body: { zip: '={{ String($value).trim() }}' } } },
		description: 'A 5-digit US ZIP code: the sales around it',
	},
	{
		displayName: 'City',
		name: 'estatesalesSalesCity',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Dallas',
		displayOptions: show(['sales'], { estatesalesSalesBy: ['city'] }),
		routing: { request: { body: { city: '={{ String($value).trim() }}' } } },
		description: 'A US city: EstateSales.net lists the sales of its metro area',
	},
	{
		displayName: 'State',
		name: 'estatesalesSalesState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['sales'], { estatesalesSalesBy: ['city'] }),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The city's US state code (the 50 states and DC)",
	},

	// -- Get Sale --
	idOrUrl(
		'Sale ID or URL',
		'estatesalesSaleId',
		'sale',
		'sale_id',
		'5114622',
		"An EstateSales.net sale ID (sale_id from Get Sales or Search Sales and Items) or the sale's estatesales.net link",
	),

	// -- Get Companies --
	{
		displayName: 'State',
		name: 'estatesalesCompaniesState',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'TX',
		displayOptions: show(['companies']),
		routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() }}' } } },
		description: "The metro area's US state code (the 50 states and DC)",
	},
	{
		displayName: 'Metro Area or City',
		name: 'estatesalesCompaniesMetro',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Dallas-Fort-Worth-Arlington',
		displayOptions: show(['companies']),
		routing: { request: { body: { metro: '={{ String($value).trim() }}' } } },
		description: 'The metro area as EstateSales.net names it (Dallas-Fort-Worth-Arlington, New-York) or a city in it (Dallas)',
	},

	// -- Get Company --
	idOrUrl(
		'Company ID or URL',
		'estatesalesCompanyId',
		'company',
		'org_id',
		'14402',
		"An EstateSales.net company ID (org_id from Get Companies or a sale's company) or the company's estatesales.net link",
	),

	// -- Search Sales and Items --
	{
		displayName: 'Query',
		name: 'estatesalesSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'rolex',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A keyword (2 to 100 characters): searches sales and marketplace items',
	},

	// -- Get Item --
	idOrUrl(
		'Item ID or URL',
		'estatesalesItemId',
		'item',
		'item_id',
		'2038603',
		"An EstateSales.net marketplace item ID (item_id from Search Sales and Items) or the item's estatesales.net link",
	),

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'estatesalesSalesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sales']),
		options: sorted([
			{
				displayName: 'Sale Types',
				name: 'estatesalesSalesTypes',
				type: 'multiOptions',
				default: [],
				options: SALE_TYPES,
				description: 'Sale types to keep (empty: any)',
				routing: { request: { body: { type: '={{ $value && $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'estatesalesSalesSort',
				type: 'options',
				default: 'distance',
				options: [
					{ name: 'Distance (Nearest First)', value: 'distance' },
					{ name: 'End Date', value: 'end_date' },
					{ name: 'Most Pictures', value: 'most_pictures' },
					{ name: 'Newest (First Published)', value: 'newest' },
					{ name: 'Start Date', value: 'start_date' },
				],
				description: "The order of the 20 listed sales (distance is the site's own order)",
				routing: { request: { body: { sort: '={{ $value === "distance" ? undefined : $value }}' } } },
			},
			{
				displayName: 'When',
				name: 'estatesalesSalesWhen',
				type: 'options',
				default: 'any',
				options: [
					{ name: 'Any', value: 'any' },
					{ name: 'Starting Within 15 Days', value: '15_days' },
					{ name: 'Today', value: 'today' },
					{ name: 'Tomorrow', value: 'tomorrow' },
				],
				description: "When the sale runs, read as the site's own date filter reads each sale",
				routing: { request: { body: { when: '={{ $value === "any" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'estatesalesSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Page',
				name: 'estatesalesSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 4 },
				description: 'Page of 24, 1 to 4',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
];
