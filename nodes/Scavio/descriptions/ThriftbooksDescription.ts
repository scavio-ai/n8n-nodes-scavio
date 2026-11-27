import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['thriftbooks'], operation, ...extra },
});

// ThriftBooks (thriftbooks.com, the US online used-book seller), 8 operations, 1 credit each; credits_used is the truth.
// US storefront, USD. Every operation carries a 120s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 120000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE = 'ThriftBooks (thriftbooks.com, the US online used-book seller), prices in USD';
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const PRICES =
	"Prices are ThriftBooks' own in USD as shown to a visitor who is not signed in (no member or cart prices).";
const QTY = 'A New copy quantity of 500 is the most ThriftBooks shows: 500 means 500 or more.';
const TABLE =
	'format_count, in_stock, low_price, high_price and formats (format, format_id, in_stock, low and high price, default edition, and per condition New, Like New, Very Good, Good and Acceptable: in_stock, price, list_price, quantity, edition_id, copy_id, ISBN, EAN, ex-library, no dust jacket, no CD, thrift deal, promotion, ReadingRewards bonus points shown on the copy, shipping surcharge, estimated days to ship), plus notes. A row with in_stock false has no copy for sale now (price null).';
const COPY =
	'copy_id, edition_id, condition, condition_id, price, quantity, ex_library, no_dust_jacket, no_cd and backorder';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);
const byLabel = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

const FORMATS = [
	{ name: '4K Ultra HD', value: '4k_ultra_hd' },
	{ name: 'Audio Cassette', value: 'audio_cassette' },
	{ name: 'Audio CD', value: 'audio_cd' },
	{ name: 'Blu-Ray', value: 'blu_ray' },
	{ name: 'Board Book', value: 'board_book' },
	{ name: 'Comic', value: 'comic' },
	{ name: 'DVD', value: 'dvd' },
	{ name: 'Hardcover', value: 'hardcover' },
	{ name: 'Library Binding', value: 'library_binding' },
	{ name: 'Mass Market Paperback', value: 'mass_market_paperback' },
	{ name: 'MP3 CD', value: 'mp3_cd' },
	{ name: 'Paperback', value: 'paperback' },
	{ name: 'Perfect Paperback', value: 'perfect_paperback' },
].sort(byLabel);

const CONDITIONS = [
	{ name: 'Acceptable', value: 'acceptable' },
	{ name: 'Good', value: 'good' },
	{ name: 'Like New', value: 'like_new' },
	{ name: 'New', value: 'new' },
	{ name: 'Very Good', value: 'very_good' },
];

const LANGUAGES = [
	'english', 'spanish', 'french', 'german', 'italian', 'chinese', 'russian', 'portuguese', 'polish', 'japanese',
	'dutch', 'turkish', 'korean', 'greek',
]
	.map((v) => ({ name: v.charAt(0).toUpperCase() + v.slice(1), value: v }))
	.sort(byLabel);

const listBody = (key: string) => ({
	request: { body: { [key]: '={{ $value && $value.length ? $value : undefined }}' } },
});

/** A work ID field (search items[].work_id, the ISBN lookup's work_id). */
const workField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Work ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '26830049',
	displayOptions: show([operation]),
	routing: { request: { body: { work_id: '={{ String($value).trim() }}' } } },
	description:
		'A ThriftBooks work ID (work_id from Search Books or Look Up ISBN). A work is the book across all its editions.',
});

/** An edition ID field (the ISBN lookup's edition_id, a work's conditions edition_id, Get Editions). */
const editionField = (name: string, operation: string): INodeProperties => ({
	displayName: 'Edition ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '49364660',
	displayOptions: show([operation]),
	routing: { request: { body: { edition_id: '={{ String($value).trim() }}' } } },
	description:
		'A ThriftBooks edition ID (edition_id from Look Up ISBN, Get Work Prices or Get Editions)',
});

export const thriftbooksOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['thriftbooks'] } },
		options: [
			{
				name: 'Get Copies',
				value: 'copies',
				action: 'Get thriftbooks edition copies',
				description: `Every copy for sale of one ${SITE} edition, one row per condition and copy type (ex-library, no dust jacket, no CD): edition_id, count and copies (${COPY}), plus notes. An empty list means no copy is in stock (or no edition has the ID). ${QTY} ${PRICES} Captured 2026-11-27: edition 4587405 had 1 copy, Good with no dust jacket at 9.29 USD. ${ONE}`,
				routing: request('/api/v1/thriftbooks/copies'),
			},
			{
				name: 'Get Edition',
				value: 'edition',
				action: 'Get a thriftbooks edition',
				description: `One edition of a book on ${SITE}: edition_id, title, authors (as given), format, ISBN, ISBN-13, UPC, publisher, release_date, pages, book_language, large_print, age and grade range, list_price, in_stock, buy_now (price, condition, copy_id), low and high price, lowest new and used price, has new or used copies, available_copies, backorder, sales rank, description (the start of the overview the page shows, about 300 characters), image and copies (${COPY}), plus notes. ${QTY} ${PRICES} Captured 2026-11-27: edition 49364660, the Project Hail Mary hardcover, New at 23.92 USD against a list price of 32. An unknown edition is a charged not-found. ${ONE}`,
				routing: request('/api/v1/thriftbooks/edition'),
			},
			{
				name: 'Get Editions',
				value: 'editions',
				action: 'Get thriftbooks editions',
				description: `All editions of one ${SITE} work, 25 a page, filtered by format and condition, in stock only (default) or every edition, sorted bestselling, newest, oldest or by price: work_id, sort, in_stock_only, applied_filters, page, per_page, total, total_pages, count, editions (edition_id, title, edition description, authors, format, ISBN, EAN, UPC, publisher, release_date, pages, language, large print, age and grade range, list_price, in_stock, low_price, others_watching, image, copies with thrift deal) and top_formats, plus notes. ${QTY} ${PRICES} Captured 2026-11-27: work 246187 had 33 editions in stock over 2 pages. ${ONE}`,
				routing: request('/api/v1/thriftbooks/editions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get thriftbooks reviews',
				description: `ThriftBooks customer reviews of one ${SITE} work, 10 a page in the site's order: work_id, page, per_page, has_next, count and reviews (review_id, rating, headline, text, date, verified_purchase, likes, dislikes), plus notes. No reviewer names. Captured 2026-11-27: work 26830049 (Project Hail Mary) gave 10 reviews on page 1 with another page after it. ${ONE}`,
				routing: request('/api/v1/thriftbooks/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get thriftbooks search suggestions',
				description: `${SITE}: the search-box suggestions, title and author completions for a partial query, as given: query, count and suggestions. Captured 2026-11-27: hunger gave 6 suggestions, the first The Hunger Games. ${ONE}`,
				routing: request('/api/v1/thriftbooks/suggestions'),
			},
			{
				name: 'Get Work Prices',
				value: 'work',
				action: 'Get thriftbooks work prices',
				description: `The format x condition table of one ${SITE} work: for each format (Hardcover, Paperback, Audio CD, ...) the price, quantity and copy details of each condition, as the work's page shows them. Returns work_id, ${TABLE} ${QTY} ${PRICES} Captured 2026-11-27: work 246187 (The Hunger Games) had 4 formats from 7.19 to 34.59 USD. An unknown work is a charged not-found. ${ONE}`,
				routing: request('/api/v1/thriftbooks/work'),
			},
			{
				name: 'Look Up ISBN',
				value: 'isbn',
				action: 'Look up a thriftbooks isbn',
				description: `Look a book up on ${SITE} by ISBN-10 or ISBN-13 (check digit verified): the work and edition ThriftBooks matches, then the work's format x condition table. Returns isbn, isbn13, isbn10, work_id, edition_id, ${TABLE} requested_edition marks the rows of the matched edition. ${QTY} ${PRICES} Captured 2026-11-27: ISBN 9780593135204 matched work 26830049, 4 formats from 17.25 to 23.92 USD, the hardcover New at 23.92 USD with quantity 500. An ISBN ThriftBooks does not carry is a charged not-found; a bad check digit is refused, not charged. ${ONE}`,
				routing: request('/api/v1/thriftbooks/isbn'),
			},
			{
				name: 'Search Books',
				value: 'search',
				action: 'Search thriftbooks',
				description: `${SITE} search: keywords or the whole catalog, with the presets Bestsellers, Deals and New Releases, filters for format, condition, language, genre, price, collectible, signed, first edition and large print, and the site's 7 sorts; up to 50 works a page. Returns query, list, sort, page, page_size, total, total_pages, did_you_mean, applied_filters, count, items (work_id for Get Work Prices, Get Editions and Get Reviews, title, authors, series, in_stock, buy_now with the copy the result puts up for sale, low and high price across editions and conditions, list_price, available_copies, edition_count, collectible count and low price, thrift_deal, backorder, language, rating, review_count, images) and facets (genre, age range, product type, format, condition and language IDs to send back as filters), plus notes. Page x Page Size must stay within 10000. An ISBN query is refused: use Look Up ISBN. ${QTY} ${PRICES} Captured 2026-11-27: project hail mary gave 3 works, the first with 27 editions from 17.25 to 29.99 USD. ${ONE}`,
				routing: request('/api/v1/thriftbooks/search', true),
			},
		],
		default: 'search',
	},
];

export const thriftbooksFields: INodeProperties[] = [
	// -- Look Up ISBN --
	{
		displayName: 'ISBN',
		name: 'thriftbooksIsbn',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9780593135204',
		displayOptions: show(['isbn']),
		routing: { request: { body: { isbn: '={{ String($value).trim() }}' } } },
		description: 'An ISBN-10 or ISBN-13; dashes and spaces are allowed',
	},

	// -- Get Work Prices, Get Editions, Get Reviews --
	workField('thriftbooksWorkId', 'work'),
	workField('thriftbooksEditionsWorkId', 'editions'),
	workField('thriftbooksReviewsWorkId', 'reviews'),

	// -- Get Edition, Get Copies --
	editionField('thriftbooksEditionId', 'edition'),
	editionField('thriftbooksCopiesEditionId', 'copies'),

	// -- Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'thriftbooksSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hunger',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A partial search query (1 to 100 characters)',
	},

	// -- Search Books --
	{
		displayName: 'Query',
		name: 'thriftbooksQuery',
		type: 'string',
		default: '',
		placeholder: 'project hail mary',
		displayOptions: show(['search']),
		routing: {
			request: {
				body: { query: '={{ String($value).trim() === "" ? undefined : String($value).trim() }}' },
			},
		},
		description:
			'Search keywords (title, author, subject). Leave empty to browse the whole catalog with a list or filters. Not an ISBN.',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'thriftbooksSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			{
				displayName: 'List',
				name: 'thriftbooksSearchList',
				type: 'options',
				default: 'bestsellers',
				options: [
					{ name: 'Bestsellers', value: 'bestsellers' },
					{ name: 'Deals', value: 'deals' },
					{ name: 'New Releases', value: 'new_releases' },
				],
				description: 'A preset: the bestseller order, ThriftBooks Deals or New Releases. Combines with the query and filters.',
				routing: { request: { body: { list: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'thriftbooksSearchSort',
				type: 'options',
				default: 'most_popular',
				options: [
					{ name: 'Bestsellers', value: 'bestsellers' },
					{ name: 'Most Popular', value: 'most_popular' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Relevance', value: 'relevance' },
					{ name: 'Title A-Z', value: 'title_asc' },
					{ name: 'Title Z-A', value: 'title_desc' },
				],
				description: 'The site sort menu (default Most Popular; Bestsellers with the Bestsellers list)',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'thriftbooksSearchPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Results page, 1-based. Page x Page Size must stay within 10000.',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'thriftbooksSearchPageSize',
				type: 'number',
				default: 25,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Works per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value === 25 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Formats',
				name: 'thriftbooksSearchFormat',
				type: 'multiOptions',
				default: [],
				options: FORMATS,
				description: 'Only these formats (empty: any)',
				routing: listBody('format'),
			},
			{
				displayName: 'Conditions',
				name: 'thriftbooksSearchCondition',
				type: 'multiOptions',
				default: [],
				options: CONDITIONS,
				description: 'Only these conditions (empty: any)',
				routing: listBody('condition'),
			},
			{
				displayName: 'Languages',
				name: 'thriftbooksSearchLanguage',
				type: 'multiOptions',
				default: [],
				options: LANGUAGES,
				description: 'Only these languages (empty: any)',
				routing: listBody('language'),
			},
			{
				displayName: 'Genre IDs',
				name: 'thriftbooksSearchGenre',
				type: 'string',
				default: '',
				placeholder: '13207',
				description:
					'Genre or age range IDs from facets in a previous answer (13207 Fiction, 13564 Horror, 15013 Science Fiction & Fantasy), separated by commas, up to 10',
				routing: {
					request: {
						body: {
							genre:
								'={{ String($value).trim() === "" ? undefined : String($value).split(",").map(s => s.trim()).filter(s => s !== "") }}',
						},
					},
				},
			},
			{
				displayName: 'Min Price',
				name: 'thriftbooksSearchMinPrice',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 10000 },
				description: 'Lowest price in whole US dollars',
				routing: { request: { body: { min_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Price',
				name: 'thriftbooksSearchMaxPrice',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 0, maxValue: 10000 },
				description: 'Highest price in whole US dollars (at least Min Price)',
				routing: { request: { body: { max_price: '={{ $value }}' } } },
			},
			{
				displayName: 'Deals Only',
				name: 'thriftbooksSearchDeals',
				type: 'boolean',
				default: false,
				description: 'Whether to return ThriftBooks Deals only',
				routing: { request: { body: { deals: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'New Releases Only',
				name: 'thriftbooksSearchNewReleases',
				type: 'boolean',
				default: false,
				description: 'Whether to return New Releases only',
				routing: { request: { body: { new_releases: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Collectible Only',
				name: 'thriftbooksSearchCollectible',
				type: 'boolean',
				default: false,
				description: 'Whether to return collectibles only',
				routing: { request: { body: { collectible: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Signed Only',
				name: 'thriftbooksSearchSigned',
				type: 'boolean',
				default: false,
				description: 'Whether to return signed books only',
				routing: { request: { body: { signed: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'First Edition Only',
				name: 'thriftbooksSearchFirstEdition',
				type: 'boolean',
				default: false,
				description: 'Whether to return first editions only',
				routing: { request: { body: { first_edition: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Large Print Only',
				name: 'thriftbooksSearchLargePrint',
				type: 'boolean',
				default: false,
				description: 'Whether to return large print only',
				routing: { request: { body: { large_print: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Include Out of Stock',
				name: 'thriftbooksSearchIncludeOutOfStock',
				type: 'boolean',
				default: false,
				description: 'Whether to also list works with no copy for sale now',
				routing: { request: { body: { include_out_of_stock: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'thriftbooksEditionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['editions']),
		options: sorted([
			{
				displayName: 'Formats',
				name: 'thriftbooksEditionsFormat',
				type: 'multiOptions',
				default: [],
				options: FORMATS,
				description: 'Only these formats (empty: any)',
				routing: listBody('format'),
			},
			{
				displayName: 'Conditions',
				name: 'thriftbooksEditionsCondition',
				type: 'multiOptions',
				default: [],
				options: CONDITIONS,
				description: 'Only editions with copies in these conditions (empty: any)',
				routing: listBody('condition'),
			},
			{
				displayName: 'Sort',
				name: 'thriftbooksEditionsSort',
				type: 'options',
				default: 'bestselling',
				options: [
					{ name: 'Bestselling', value: 'bestselling' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				description: 'The site sort menu (default Bestselling)',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'thriftbooksEditionsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Editions page, 1-based, 25 a page',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'In Stock Only',
				name: 'thriftbooksEditionsInStockOnly',
				type: 'boolean',
				default: true,
				description: 'Whether to list only editions with a copy for sale now (off lists every edition)',
				routing: { request: { body: { in_stock_only: '={{ $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'thriftbooksReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Page',
				name: 'thriftbooksReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Reviews page, 1-based, 10 a page',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
		],
	},
];
