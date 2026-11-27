import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['estantevirtual'], operation, ...extra },
});

// Estante Virtual (estantevirtual.com.br, Brazil's used and new book marketplace, part of Magalu), 12 operations,
// 1 credit each except Get Copies with Include Sellers (ceil((1 + copies) / 5)); credits_used is the truth. Brazil
// only, BRL. Most calls take 2 to 30 s, up to 70 s when the site is busy, and carry a 240s timeout.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const SITE =
	"Estante Virtual (estantevirtual.com.br, Brazil's used and new book marketplace of sebos and booksellers, part of Magalu), Brazil only, Portuguese text, prices in BRL as shown to a visitor who is not signed in";
const ONE =
	'Failed upstream calls and refused inputs are not charged; a not-found is charged. Costs 1 credit (credits_used says what was charged).';
const BOOK =
	'A book (kind book, book_id ending -BK) is every copy of one ISBN; a one-copy listing without an ISBN group is kind listing with a copy_id.';
const CARD =
	'items (position, kind, book_id, copy_id, title, author, publisher, year, ISBN, book_language, URL, image, lowest_price, copies used and new, department, badges, rating, review_count)';
const GRID = `44 per page, pages 1 to 238, in the site's 6 sorts, filtered by used or new, author, publisher, seller city, category, a BRL price range and any facet in Filters (JSON). Returns page, page_size, total, total_pages, has_more, count, title, ${CARD}, facets (key, name, values with value, label and count), sort, filters_applied and notes. ${BOOK}`;
const COPY =
	"copy_id, book_id, title, author, publisher, year, ISBN, book_language, condition (used or new), has_invoice, condition_notes (the seller's own notes on a used copy), price, installment, department, image, available, URL, badges";
const PRIVACY = 'Sellers appear by shop name with city and state only; reviewer names are never returned.';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const TEXT = '={{ String($value).trim() || undefined }}';
const JSON_FILTERS =
	'={{ (() => { const f = typeof $value === "string" ? JSON.parse($value || "{}") : $value; return f && Object.keys(f).length ? f : undefined; })() }}';

const textOption = (displayName: string, name: string, key: string, description: string, placeholder: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [key]: TEXT } } },
});

const pageOption = (name: string, max: number, description: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description,
	routing: { request: { body: { page: '={{ $value > 1 ? $value : undefined }}' } } },
});

const priceSort = (name: string, defaultValue: string, defaultLabel: string): INodeProperties => ({
	displayName: 'Sort',
	name,
	type: 'options',
	default: defaultValue,
	options: [
		...(defaultValue === 'default' ? [{ name: defaultLabel, value: 'default' }] : []),
		{ name: 'Price: High to Low', value: 'price_desc' },
		{ name: 'Price: Low to High', value: 'price_asc' },
	],
	routing: { request: { body: { sort: '={{ $value === "default" ? undefined : $value }}' } } },
});

/** Sort, filters and page shared by Search Books and Get Category Books. */
const gridOptions = (prefix: string): INodeProperties[] => [
	textOption('Author', `${prefix}Author`, 'author', 'Author facet value (autor, facets values value), e.g. machado-de-assis', 'machado-de-assis'),
	textOption('Category', `${prefix}CategoryFacet`, 'category', 'Category facet value (categoria), e.g. literatura-brasileira', 'literatura-brasileira'),
	textOption('City', `${prefix}City`, 'city', 'Seller city facet value (cidade), e.g. sao-paulo', 'sao-paulo'),
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
	{
		displayName: 'Filters (JSON)',
		name: `${prefix}Filters`,
		type: 'json',
		default: '{}',
		description:
			'Any facet by its key (facets key of an answer: tipo-de-livro, autor, editora, ano-de-publicacao, cidade, sebos-e-livreiros, promocoes, categoria, idioma, _avaliacao, compra-corporativa): key -> value or [values], up to 12 values, e.g. {"ano-de-publicacao": "2009"}',
		routing: { request: { body: { filters: JSON_FILTERS } } },
	},
	{
		displayName: 'Max Price (BRL)',
		name: `${prefix}PriceMax`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 100000 },
		description: 'Highest price in BRL; 0 means no limit',
		routing: { request: { body: { price_max: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	{
		displayName: 'Min Price (BRL)',
		name: `${prefix}PriceMin`,
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, maxValue: 100000 },
		description: 'Lowest price in BRL; 0 means no limit',
		routing: { request: { body: { price_min: '={{ $value > 0 ? $value : undefined }}' } } },
	},
	pageOption(`${prefix}Page`, 238, 'Results page, 1 to 238 (44 per page)'),
	textOption('Publisher', `${prefix}Publisher`, 'publisher', 'Publisher facet value (editora), e.g. companhia-das-letras', 'companhia-das-letras'),
	{
		displayName: 'Sort',
		name: `${prefix}Sort`,
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Best Sellers', value: 'best_sellers' },
			{ name: 'Newest', value: 'newest' },
			{ name: 'Price Plus Shipping', value: 'price_plus_shipping' },
			{ name: 'Price: High to Low', value: 'price_desc' },
			{ name: 'Price: Low to High', value: 'price_asc' },
			{ name: 'Relevance', value: 'relevance' },
		],
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const refField = (
	displayName: string,
	name: string,
	idKey: string,
	operations: string[],
	placeholder: string,
	description: string,
): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder,
	displayOptions: show(operations),
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

const bookField = (name: string, operations: string[]) =>
	refField('Book ID or URL', name, 'book_id', operations, '017-4778-000-BK', 'The book ID (book_id of a search or of Get Book by ISBN) or an estantevirtual.com.br book link');
const copyField = (name: string, operations: string[]) =>
	refField('Copy ID or URL', name, 'copy_id', operations, 'GME-2437-000', 'The copy ID (copy_id of Get Copies, of a book\'s lowest-priced copy, or of a one-copy listing) or an estantevirtual.com.br copy link');

const sellerField = (name: string, operations: string[]): INodeProperties => ({
	displayName: 'Seller ID',
	name,
	type: 'string',
	required: true,
	default: '',
	placeholder: '1002276',
	displayOptions: show(operations),
	routing: { request: { body: { seller_id: '={{ String($value).trim() }}' } } },
	description: 'A seller ID (sellers seller_id of Get Sellers, seller ID of a copy)',
});

export const estantevirtualOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['estantevirtual'] } },
		options: [
			{
				name: 'Get Book',
				value: 'book',
				action: 'Get an estante virtual book',
				description: `One ${SITE} book by book ID or link: title, author, publisher, year, ISBN, URL, image, available, lowest_price (used, new), lowest_priced_used and lowest_priced_new (copy_id, price, seller, year, publisher, has_invoice, condition_notes, installment, URL), rating, review_count, percent_recommended, histogram and every review the page shows (no reviewer names). No synopsis. ${BOOK} An unknown book is a charged not-found. Captured 2026-11-27: 1984 (Companhia das Letras) from 18 BRL used and 21.90 BRL new. ${ONE}`,
				routing: request('/api/v1/estantevirtual/book'),
			},
			{
				name: 'Get Book by ISBN',
				value: 'isbn',
				action: 'Get an estante virtual book by isbn',
				description: `The book for an ISBN on ${SITE}: isbn13, isbn10, book (the copies grouped under the ISBN), listing_count and listings (single copies with the ISBN that the site did not group). The check digit is verified first, so a typo is refused and not charged. An ISBN with no copy on sale is a charged not-found. Captured 2026-11-27: 9788535914849 had 198 used and 62 new copies from 18 BRL. ${ONE}`,
				routing: request('/api/v1/estantevirtual/isbn'),
			},
			{
				name: 'Get Category Books',
				value: 'category',
				action: 'Get estante virtual category books',
				description: `One ${SITE} category by slug, sorted and filtered like Search Books. ${GRID} Also category_slug and URL. An unknown category is a charged not-found. Captured 2026-11-27: literatura-brasileira held 840564 books. ${ONE}`,
				routing: request('/api/v1/estantevirtual/category'),
			},
			{
				name: 'Get Copies',
				value: 'copies',
				action: 'Get estante virtual copies of a book',
				description: `Every copy of a ${SITE} book on sale, by book ID and condition (used or new), up to 50 per page, sorted by price, filtered by printing year, publisher, seller city, seller or price: book_id, condition, sort, page, page_size, total, total_pages, has_more, count, items (${COPY}, seller with Include Sellers, weight_grams), facets and notes. The list carries no seller per copy: Include Sellers adds each copy's seller with one extra call per copy, billed ceil((1 + copies) / 5) credits (10 copies = 3, 50 = 11); otherwise 1 credit. credits_used says what was charged. Captured 2026-11-27: 1984 had 198 used copies, the cheapest at 18 BRL.`,
				routing: request('/api/v1/estantevirtual/copies'),
			},
			{
				name: 'Get Copy',
				value: 'copy',
				action: 'Get an estante virtual copy',
				description: `One seller's copy on ${SITE} by copy ID or link: ${COPY}, seller (ID, name, name_slug), free_shipping, weight_grams, dimensions_cm and quantity (always 1: used copies are unique). An unknown copy is a charged not-found. Captured 2026-11-27: a new copy of 1984 at 21.90 BRL. ${ONE}`,
				routing: request('/api/v1/estantevirtual/copy'),
			},
			{
				name: 'Get List Books',
				value: 'list',
				action: 'Get estante virtual list books',
				description: `A ${SITE} list page by slug or /lst/ link: black-friday (default), livros-baratos, saldao-de-livros, livros-frete-gratis, lancamentos or another list of the site, 42 per page in the site's order: slug, URL, page, page_size, total, total_pages, has_more, count, title, ${CARD} and notes. An unknown list is a charged not-found. Captured 2026-11-27: black-friday held 399 books. ${ONE}`,
				routing: request('/api/v1/estantevirtual/list', true),
			},
			{
				name: 'Get Seller',
				value: 'seller',
				action: 'Get an estante virtual seller',
				description: `A ${SITE} sebo (second-hand bookshop) or bookseller by seller ID: name (the shop name), name_slug, seller_type (private or business), official_store, active, member_since, city, state, description (phone numbers and emails removed), shipping_methods, URL, rating, review_count, reviews_with_comment, percent_recommended, histogram, the newest reviews (no reviewer names), catalogue_total and a page of 40 books from its catalogue. No street address, ZIP, document number or contact is returned. An unknown seller is a charged not-found. Captured 2026-11-27: seller 1002276 rated 4.92 from 38 reviews, with 2992 books. ${ONE}`,
				routing: request('/api/v1/estantevirtual/seller'),
			},
			{
				name: 'Get Seller Books',
				value: 'seller_books',
				action: 'Get estante virtual seller books',
				description: `A sebo's catalogue on ${SITE} by seller ID, optionally searched by keyword and sorted by price, 40 per page: seller_id, query, sort, page, page_size, total, total_pages, has_more, count and items (${COPY}). Captured 2026-11-27: seller 1002276 had 3 copies matching orwell. ${ONE}`,
				routing: request('/api/v1/estantevirtual/seller-books'),
			},
			{
				name: 'Get Seller Reviews',
				value: 'seller_reviews',
				action: 'Get estante virtual seller reviews',
				description: `Buyers' reviews of a sebo on ${SITE} by seller ID, 10 per page, newest to oldest, optionally positive or negative: seller_id, page, total_pages, has_more, total_filtered, count and reviews (rating, text, date, recommends). No reviewer names. ${ONE}`,
				routing: request('/api/v1/estantevirtual/seller-reviews'),
			},
			{
				name: 'Get Sellers',
				value: 'sellers',
				action: 'Get estante virtual sellers',
				description: `The ${SITE} sebo and bookseller directory: the whole country, a state (UF) or a city of that state, 30 per page: state, city, page, total, total_pages, has_more, count, sellers (seller_id, name, active, member_since, city, state, free_shipping, rating, percent_recommended, URL), cities and states (the site's counts). ${PRIVACY} No address or contact. Captured 2026-11-27: Sao Paulo city had 1258 sellers. ${ONE}`,
				routing: request('/api/v1/estantevirtual/sellers', true),
			},
			{
				name: 'Get Shipping',
				value: 'shipping',
				action: 'Get estante virtual shipping by cep',
				description: `The delivery quote for one ${SITE} copy to a CEP (Brazilian postal code): copy_id, cep, seller, price, count, options (the lowest-cost option the seller offers there: type, service, seller_id, cost, free, min_days, max_days, min_date, max_date) and free_shipping_threshold. Captured 2026-11-27: a copy of 1984 to CEP 01310-100 cost 19.34 BRL in 9 days. ${ONE}`,
				routing: request('/api/v1/estantevirtual/shipping'),
			},
			{
				name: 'Search Books',
				value: 'search',
				action: 'Search estante virtual books',
				description: `${SITE} search by title, author or ISBN keywords. ${GRID} Also query. No results is an empty, charged answer. ${PRIVACY} Not available: search suggestions, questions, stores, a was-price and Pix prices. Captured 2026-11-27: dom casmurro matched 3915 books. ${ONE}`,
				routing: request('/api/v1/estantevirtual/search'),
			},
		],
		default: 'search',
	},
];

export const estantevirtualFields: INodeProperties[] = [
	// -- Search Books --
	{
		displayName: 'Query',
		name: 'estantevirtualQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dom casmurro',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Title, author or ISBN keywords in Portuguese, as a reader types them (1 to 160 characters)',
	},
	{
		displayName: 'Additional Options',
		name: 'estantevirtualSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted(gridOptions('estantevirtualSearch')),
	},

	// -- Get Book by ISBN --
	{
		displayName: 'ISBN',
		name: 'estantevirtualIsbn',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9788535914849',
		displayOptions: show(['isbn']),
		routing: { request: { body: { isbn: '={{ String($value).trim() }}' } } },
		description: 'An ISBN-10 or ISBN-13 (dashes and spaces allowed)',
	},

	// -- Get Book, Get Copies --
	bookField('estantevirtualBook', ['book']),
	bookField('estantevirtualCopiesBook', ['copies']),
	{
		displayName: 'Additional Options',
		name: 'estantevirtualCopiesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['copies']),
		options: sorted([
			textOption('City', 'estantevirtualCopiesCity', 'city', 'Seller city facet value (cidade)', 'sao-paulo'),
			{
				displayName: 'Condition',
				name: 'estantevirtualCopiesCondition',
				type: 'options',
				default: 'used',
				options: [
					{ name: 'New', value: 'new' },
					{ name: 'Used', value: 'used' },
				],
				routing: { request: { body: { condition: '={{ $value === "used" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Filters (JSON)',
				name: 'estantevirtualCopiesFilters',
				type: 'json',
				default: '{}',
				description:
					'Facet filters: key -> value or [values], with ano-de-publicacao, editora, cidade, sebos-e-livreiros or _preco (min-max in cents)',
				routing: { request: { body: { filters: JSON_FILTERS } } },
			},
			{
				displayName: 'Include Sellers',
				name: 'estantevirtualCopiesSellers',
				type: 'boolean',
				default: false,
				description:
					"Whether to add each copy's seller (one extra call per copy: ceil((1 + copies) / 5) credits, e.g. 10 copies = 3)",
				routing: { request: { body: { sellers: '={{ $value || undefined }}' } } },
			},
			pageOption('estantevirtualCopiesPage', 500, 'Page, 1-based'),
			{
				displayName: 'Page Size',
				name: 'estantevirtualCopiesPageSize',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Copies per page, 1 to 50',
				routing: { request: { body: { page_size: '={{ $value !== 10 ? $value : undefined }}' } } },
			},
			textOption('Publisher', 'estantevirtualCopiesPublisher', 'publisher', 'Publisher facet value (editora)', 'companhia-das-letras'),
			{
				displayName: 'Sort',
				name: 'estantevirtualCopiesSort',
				type: 'options',
				default: 'price_asc',
				options: [
					{ name: 'Price: High to Low', value: 'price_desc' },
					{ name: 'Price: Low to High', value: 'price_asc' },
				],
				routing: { request: { body: { sort: '={{ $value === "price_asc" ? undefined : $value }}' } } },
			},
			textOption('Year', 'estantevirtualCopiesYear', 'year', 'Printing year facet (ano-de-publicacao), e.g. 2009', '2009'),
		]),
	},

	// -- Get Copy, Get Shipping --
	copyField('estantevirtualCopy', ['copy']),
	copyField('estantevirtualShippingCopy', ['shipping']),
	{
		displayName: 'CEP',
		name: 'estantevirtualCep',
		type: 'string',
		required: true,
		default: '',
		placeholder: '01310-100',
		displayOptions: show(['shipping']),
		routing: { request: { body: { cep: '={{ String($value).trim() }}' } } },
		description: 'A Brazilian CEP (8 digits)',
	},

	// -- Get Seller, Get Seller Books, Get Seller Reviews --
	sellerField('estantevirtualSellerId', ['seller']),
	sellerField('estantevirtualSellerBooksId', ['seller_books']),
	{
		displayName: 'Additional Options',
		name: 'estantevirtualSellerBooksOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['seller_books']),
		options: sorted([
			pageOption('estantevirtualSellerBooksPage', 250, 'Page, 1-based (40 per page)'),
			textOption('Query', 'estantevirtualSellerBooksQuery', 'query', "Search inside the seller's catalogue", 'orwell'),
			priceSort('estantevirtualSellerBooksSort', 'default', "Site's Order"),
		]),
	},
	sellerField('estantevirtualSellerReviewsId', ['seller_reviews']),
	{
		displayName: 'Additional Options',
		name: 'estantevirtualSellerReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['seller_reviews']),
		options: [
			pageOption('estantevirtualSellerReviewsPage', 1000, 'Page, 1-based (10 per page)'),
			{
				displayName: 'Rating',
				name: 'estantevirtualSellerReviewsRating',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Negative (0 to 2 Stars)', value: 'negative' },
					{ name: 'Positive (3 to 5 Stars)', value: 'positive' },
				],
				routing: { request: { body: { rating: '={{ $value === "all" ? undefined : $value }}' } } },
			},
		],
	},

	// -- Get Sellers --
	{
		displayName: 'Additional Options',
		name: 'estantevirtualSellersOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['sellers']),
		options: sorted([
			textOption(
				'City',
				'estantevirtualSellersCity',
				'city',
				"A city of that state, written as the site writes it, with accents (cities of the state's directory)",
				'São Paulo',
			),
			pageOption('estantevirtualSellersPage', 250, 'Page, 1-based (30 per page)'),
			{
				displayName: 'State',
				name: 'estantevirtualSellersState',
				type: 'string',
				default: '',
				placeholder: 'SP',
				description: 'A Brazilian state code (UF); empty for the whole country',
				routing: { request: { body: { state: '={{ String($value).trim().toUpperCase() || undefined }}' } } },
			},
		]),
	},

	// -- Get Category Books --
	{
		displayName: 'Category Slug',
		name: 'estantevirtualCategorySlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'literatura-brasileira',
		displayOptions: show(['category']),
		routing: { request: { body: { category_slug: '={{ String($value).trim() }}' } } },
		description:
			"A category slug or link from the site's menu (literatura-brasileira, filosofia, livros-raros, historia-do-brasil, infanto-juvenis ...) or a categoria facet value",
	},
	{
		displayName: 'Additional Options',
		name: 'estantevirtualCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted(gridOptions('estantevirtualCategory')),
	},

	// -- Get List Books --
	{
		displayName: 'Additional Options',
		name: 'estantevirtualListOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['list']),
		options: sorted([
			{
				displayName: 'List Slug or URL',
				name: 'estantevirtualListSlug',
				type: 'string',
				default: '',
				placeholder: 'black-friday',
				description: 'A list slug or /lst/ link: black-friday (the default when empty), livros-baratos, saldao-de-livros, livros-frete-gratis, lancamentos',
				routing: { request: { body: { slug: TEXT } } },
			},
			pageOption('estantevirtualListPage', 250, 'Page, 1-based (42 per page)'),
		]),
	},
];
