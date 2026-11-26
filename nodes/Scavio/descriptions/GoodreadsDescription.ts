import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['goodreads'], operation, ...extra },
});

// Goodreads (goodreads.com, Amazon's book community; one global English site), 14 operations, 1 credit
// each; credits_used is the truth. Sorted, filtered or multi-page Get Reviews views take 15-60 s and up to
// about 2 minutes, and calls can queue behind the backend's upstream limit, so every operation carries a
// 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const NAME = 'Goodreads';
const FIRST = "Goodreads (goodreads.com, Amazon's book community)";
const CHARGE = 'Failed upstream calls and refused inputs are not charged; a not-found is charged.';
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged).`;
const NO_PII =
	'Reviewer names, avatars and profile links are never returned (profile links are cut out of review text).';
const BOOK_CARD =
	'book_id, work_id, title, URL, cover URL, author (author_id, name, URL, Goodreads Author flag), rating (0-5) and ratings count';
const REVIEW =
	'review_id, rating (1-5; null when the reader gave no stars), created and updated dates, plain text, spoiler flag, recommend_for, likes and comments';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

const isUrl = 'String($value).trim()';
/** One field that takes a Goodreads id or a goodreads.com link and sends it as `idKey` or `url`. */
const idOrUrl = (
	name: string,
	displayName: string,
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
				[idKey]: `={{ /^https?:/i.test(${isUrl}) ? undefined : ${isUrl} }}`,
				url: `={{ /^https?:/i.test(${isUrl}) ? ${isUrl} : undefined }}`,
			},
		},
	},
	description,
});

const pageOption = (name: string, max: number, description: string): INodeProperties => ({
	displayName: 'Page',
	name,
	type: 'number',
	default: 1,
	typeOptions: { minValue: 1, maxValue: max },
	description,
	routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
});

const pageCollection = (name: string, operation: string, page: INodeProperties): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: [page],
});

export const goodreadsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['goodreads'] } },
		options: [
			{
				name: 'Get Author',
				value: 'author',
				action: 'Get a goodreads author',
				description: `One author's page on ${NAME}: author_id, name, URL, Goodreads Author flag, photo, born (date, place), died, website, genres, influences, member since, bio, rating, ratings count, reviews count, works count, followers, top books (${BOOK_CARD}, published year, editions count) and series. Captured 2026-11-26: Brandon Sanderson (author ID 38550), 464 works, rated 4.39 from 10073402 ratings, 299148 followers. An unknown ID is a charged not-found. ${ONE}`,
				routing: request('/api/v1/goodreads/author'),
			},
			{
				name: 'Get Author Books',
				value: 'authorBooks',
				action: 'Get goodreads author books',
				description: `Every book of one author on ${NAME}, 30 a page, in Goodreads' order or by original publication year, title, average rating or number of pages: author_id, author, sort, page, page size, has_more, count and books (${BOOK_CARD}, other authors, published year, editions count). Captured 2026-11-26: Brandon Sanderson (author ID 38550) by original publication year gave 30 books a page with more to follow. ${ONE}`,
				routing: request('/api/v1/goodreads/author-books'),
			},
			{
				name: 'Get Book',
				value: 'book',
				action: 'Get a goodreads book',
				description: `One book on ${NAME} by ID, link or ISBN: book_id, work_id (what Get Editions and Get Quotes take), title, original title, description, cover, authors with roles, the author's profile, rating, ratings count, rating distribution, reviews count, review languages with counts, genres (slug: what Get Genre Books takes), series, format, pages, publisher, published and first published dates, language, ISBN, ISBN-13, ASIN, awards (winner or nominee, year), places, characters, Kindle price as Goodreads shows it (USD), quotes, questions and discussions counts, and the first 30 reviews in popular order (${REVIEW}). Captured 2026-11-26: book 44767458, Dune by Frank Herbert, rated 4.29 from 1732454 ratings, 91243 reviews in 54 languages, Kindle 9.99 USD. ${NO_PII} An unknown ID or ISBN is a charged not-found. ${ONE}`,
				routing: request('/api/v1/goodreads/book'),
			},
			{
				name: 'Get Book Lists',
				value: 'bookLists',
				action: 'Get goodreads lists containing a book',
				description: `The Listopia lists that contain one book on ${NAME}, 30 a page: book_id, title, page, page size, has_more, count and lists (list_id, title, URL, the book's rank on the list and its rank text, books count, voters). Captured 2026-11-26: Dune (book ID 44767458) is 59th out of 80,324 books on Best Books Ever. ${ONE}`,
				routing: request('/api/v1/goodreads/book-lists'),
			},
			{
				name: 'Get Editions',
				value: 'editions',
				action: 'Get goodreads editions of a work',
				description: `Every edition of one work on ${NAME}, 10 a page, with Goodreads' six sorts: work_id, title, author, first published, total, has_more and editions (book_id, title, URL, cover, published, publisher, format, edition, pages, ISBN-13, ISBN-10, ASIN, language, authors, rating, ratings count). Captured 2026-11-26: Dune (work ID 3634639) had 524 editions. ${ONE}`,
				routing: request('/api/v1/goodreads/editions'),
			},
			{
				name: 'Get Genre Books',
				value: 'genre',
				action: 'Get goodreads genre books',
				description: `Books of one genre on ${NAME}: Popular returns the first 50 of the genre's shelf, most shelved first (book_id, title, URL, cover, author, other authors, shelved count, rating, ratings count, published year; shelved_books is the shelf's size, capped at 100,000); Most Read returns the books most read this week (position, book_id, title, URL, cover). Goodreads shows visitors one page of a genre. Captured 2026-11-26: fantasy (Popular) gave 50 books, the first Harry Potter and the Philosopher's Stone by J.K. Rowling, shelved 91113 times. An unknown genre is a charged not-found. ${ONE}`,
				routing: request('/api/v1/goodreads/genre'),
			},
			{
				name: 'Get List',
				value: 'list',
				action: 'Get a goodreads list',
				description: `One Listopia list on ${NAME}, 100 books a page in vote order: list_id, URL, title, description, books count, voters, created, tags, page, has_more and books (rank, ${BOOK_CARD}, other authors, score, votes). The list's creator is not returned. Captured 2026-11-26: Best Books Ever (list ID 1), 80344 books and 299515 voters, number 1 The Hunger Games by Suzanne Collins. ${ONE}`,
				routing: request('/api/v1/goodreads/list'),
			},
			{
				name: 'Get New Releases',
				value: 'newReleases',
				action: 'Get goodreads new releases',
				description: `New releases on ${NAME}: by genre (the new releases Goodreads tags with it: position, book_id, title, URL, cover) or by month (the month's most popular releases across every genre, the first 15 Goodreads shows on its page: rank, count (the number Goodreads ranks by, as given), ${BOOK_CARD}, reviews count, description; has_more says whether its list ranks more). Captured 2026-11-26: 2026-11 gave 15 books, number 1 Peculiar Stars by Rebecca Yarros. ${ONE}`,
				routing: request('/api/v1/goodreads/new-releases'),
			},
			{
				name: 'Get Quotes',
				value: 'quotes',
				action: 'Get goodreads quotes',
				description: `Quotes on ${NAME} by search words, by tag or from one book (work ID): title, page, page size, total, has_more and quotes (quote_id, text, author, book with its title and work_id, tags, likes, URL). Captured 2026-11-26: Dune (work ID 3634639) had 1462 quotes, 30 a page. ${ONE}`,
				routing: request('/api/v1/goodreads/quotes'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get goodreads reviews',
				description: `Reader reviews of one book on ${NAME}, 30 a page, with Goodreads' own sort (popular, newest, oldest), star filter, language filter and this-edition filter: book (book_id, work_id, title, author, URL), the view's settings, pages read, total (as Goodreads counts the view), has_more and reviews (${REVIEW}). The default view also returns rating, ratings count, rating distribution and review languages. Up to 4 pages (120 reviews) of one view per call: Goodreads has no jump to a deeper page. Sorted, filtered or multi-page views open the review page and read what it shows: slower (typically 15-60 s, up to about 2 minutes). Captured 2026-11-26: Onyx Storm (book ID 209439446) had 225773 reviews in the popular view. ${NO_PII} ${ONE}`,
				routing: request('/api/v1/goodreads/reviews'),
			},
			{
				name: 'Get Series',
				value: 'series',
				action: 'Get a goodreads series',
				description: `One series on ${NAME} with every book in Goodreads' reading order: series_id, URL, title, primary works, total works, description and books (label such as Book 1 or Book 2.5, position, ${BOOK_CARD}, reviews count, pages, published, description). Captured 2026-11-26: The Stormlight Archive (series ID 49075), 5 primary works of 27. ${ONE}`,
				routing: request('/api/v1/goodreads/series'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get goodreads suggestions',
				description: `The books ${NAME} suggests as a reader types a title, author or ISBN (its search box): query, count and books (${BOOK_CARD}, bare title, pages, description). An ISBN returns that edition. Captured 2026-11-26: sanderson gave 5 books, the first Mistborn: The Final Empire. ${ONE}`,
				routing: request('/api/v1/goodreads/suggestions'),
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search goodreads',
				description: `Search ${FIRST} for books (by title, author or ISBN), Listopia lists or quotes, 20 a page: query, type, page, total (exact counts only), total_text (as Goodreads words it, e.g. over 111k), has_more and results. Books carry ${BOOK_CARD}, other authors, reviews and editions counts, published, series, Kindle price (USD, as given) and description; lists carry list_id, title, books count, voters, sponsored and top books; quotes carry quote_id, text, author, book title and likes. Goodreads search has no sort and no title or author field filter. Captured 2026-11-26: dune gave over 111k books, the first Dune by Frank Herbert. Goodreads retired its official API (no new developer keys since 2020). ${ONE}`,
				routing: request('/api/v1/goodreads/search'),
			},
			{
				name: 'Search Lists',
				value: 'listSearch',
				action: 'Search goodreads lists',
				description: `Listopia lists on ${NAME} whose title matches, 20 a page: query, page, total_text, has_more and lists (position, list_id, title, URL, books count, voters, sponsored, top books with book_id, title, author, URL, cover, rating and ratings count). Captured 2026-11-26: fantasy gave over 9,332 lists, the first Best Books of the 20th Century. ${ONE}`,
				routing: request('/api/v1/goodreads/list-search'),
			},
		],
		default: 'search',
	},
];

export const goodreadsFields: INodeProperties[] = [
	// -- Search --
	{
		displayName: 'Query',
		name: 'goodreadsSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'dune',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'A title, an author, a phrase or an ISBN (an ISBN finds that edition)',
	},

	// -- Get Book --
	{
		displayName: 'Look Up By',
		name: 'goodreadsBookBy',
		type: 'options',
		default: 'id',
		options: [
			{ name: 'Book ID or URL', value: 'id' },
			{ name: 'ISBN', value: 'isbn' },
		],
		displayOptions: show(['book']),
		description: 'A Goodreads book ID or goodreads.com book link, or an ISBN',
	},
	{
		...idOrUrl(
			'goodreadsBookId',
			'Book ID or URL',
			'book',
			'book_id',
			'44767458',
			'A Goodreads book ID (book_id of any answer, e.g. 44767458 or 44767458-dune) or a goodreads.com book link',
		),
		displayOptions: show(['book'], { goodreadsBookBy: ['id'] }),
	},
	{
		displayName: 'ISBN',
		name: 'goodreadsBookIsbn',
		type: 'string',
		required: true,
		default: '',
		placeholder: '9780735211292',
		displayOptions: show(['book'], { goodreadsBookBy: ['isbn'] }),
		routing: { request: { body: { isbn: '={{ String($value).trim() }}' } } },
		description: 'An ISBN-13 or ISBN-10 (checksum verified): the edition with it',
	},

	// -- Get Reviews, Get Book Lists --
	idOrUrl('goodreadsReviewsBookId', 'Book ID or URL', 'reviews', 'book_id', '44767458', 'A Goodreads book ID or a goodreads.com book link'),
	idOrUrl('goodreadsBookListsBookId', 'Book ID or URL', 'bookLists', 'book_id', '44767458', 'A Goodreads book ID or a goodreads.com book link'),

	// -- Get Suggestions, Search Lists --
	{
		displayName: 'Query',
		name: 'goodreadsSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'sanderson',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a reader has typed so far: a title, an author or an ISBN (1 to 100 characters)',
	},
	{
		displayName: 'Query',
		name: 'goodreadsListSearchQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'fantasy',
		displayOptions: show(['listSearch']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: "Words in a list's title",
	},

	// -- Get Author, Get Author Books --
	idOrUrl('goodreadsAuthorId', 'Author ID or URL', 'author', 'author_id', '38550', 'A Goodreads author ID (author_id of any answer, e.g. 38550) or a goodreads.com author link'),
	idOrUrl('goodreadsAuthorBooksId', 'Author ID or URL', 'authorBooks', 'author_id', '38550', 'A Goodreads author ID or a goodreads.com author link'),

	// -- Get Series, Get Editions, Get List --
	idOrUrl('goodreadsSeriesId', 'Series ID or URL', 'series', 'series_id', '49075', 'A Goodreads series ID (series_id of a Get Book answer, e.g. 49075) or a goodreads.com series link'),
	idOrUrl('goodreadsEditionsWorkId', 'Work ID or URL', 'editions', 'work_id', '3634639', 'A Goodreads work ID (work_id of a Get Book answer; all editions of a book share it) or a goodreads.com work editions link'),
	idOrUrl('goodreadsListId', 'List ID or URL', 'list', 'list_id', '1', 'A Goodreads Listopia list ID (list_id of a list answer) or a goodreads.com list link'),

	// -- Get Quotes --
	{
		displayName: 'Quotes By',
		name: 'goodreadsQuotesBy',
		type: 'options',
		default: 'query',
		options: [
			{ name: 'Book (Work ID)', value: 'workId' },
			{ name: 'Search Words', value: 'query' },
			{ name: 'Tag', value: 'tag' },
		],
		displayOptions: show(['quotes']),
		description: 'Quotes by search words, by tag or from one book',
	},
	{
		displayName: 'Query',
		name: 'goodreadsQuotesQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'hope',
		displayOptions: show(['quotes'], { goodreadsQuotesBy: ['query'] }),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Quotes containing these words, or by this author or from this book',
	},
	{
		displayName: 'Tag',
		name: 'goodreadsQuotesTag',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'love',
		displayOptions: show(['quotes'], { goodreadsQuotesBy: ['tag'] }),
		routing: { request: { body: { tag: '={{ String($value).trim() }}' } } },
		description: 'Quotes with this tag (tags of a quote answer)',
	},
	{
		displayName: 'Work ID',
		name: 'goodreadsQuotesWorkId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3634639',
		displayOptions: show(['quotes'], { goodreadsQuotesBy: ['workId'] }),
		routing: { request: { body: { work_id: '={{ String($value).trim() }}' } } },
		description: 'The book\'s work_id (from Get Book)',
	},

	// -- Get Genre Books --
	{
		displayName: 'Genre',
		name: 'goodreadsGenre',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'fantasy',
		displayOptions: show(['genre']),
		routing: { request: { body: { genre: '={{ String($value).trim() }}' } } },
		description: 'A Goodreads genre as its link writes it (fantasy, science-fiction, young-adult, historical-fiction; genre slugs of a Get Book answer)',
	},

	// -- Get New Releases --
	{
		displayName: 'Releases By',
		name: 'goodreadsNewReleasesBy',
		type: 'options',
		default: 'month',
		options: [
			{ name: 'Genre', value: 'genre' },
			{ name: 'Month', value: 'month' },
		],
		displayOptions: show(['newReleases']),
		description: "A month's most popular releases across every genre, or the new releases of one genre",
	},
	{
		displayName: 'Month',
		name: 'goodreadsNewReleasesMonth',
		type: 'string',
		required: true,
		default: '',
		placeholder: '2026-11',
		displayOptions: show(['newReleases'], { goodreadsNewReleasesBy: ['month'] }),
		routing: { request: { body: { month: '={{ String($value).trim().slice(0, 7) }}' } } },
		description: 'YYYY-MM, from 2007-01 to 12 months ahead',
	},
	{
		displayName: 'Genre',
		name: 'goodreadsNewReleasesGenre',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'fantasy',
		displayOptions: show(['newReleases'], { goodreadsNewReleasesBy: ['genre'] }),
		routing: { request: { body: { genre: '={{ String($value).trim() }}' } } },
		description: 'New releases Goodreads tags with this genre',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'goodreadsSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([
			pageOption('goodreadsSearchPage', 100, 'Page of 20, 1 to 100 (has_more says whether there is another)'),
			{
				displayName: 'Type',
				name: 'goodreadsSearchType',
				type: 'options',
				default: 'books',
				options: [
					{ name: 'Books', value: 'books' },
					{ name: 'Lists', value: 'lists' },
					{ name: 'Quotes', value: 'quotes' },
				],
				description: "Goodreads' own search tabs",
				routing: { request: { body: { type: '={{ $value === "books" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'goodreadsReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: sorted([
			{
				displayName: 'Edition Only',
				name: 'goodreadsReviewsEditionOnly',
				type: 'boolean',
				default: false,
				description: 'Whether to return only reviews of this edition (default: every edition of the work, as Goodreads shows them)',
				routing: { request: { body: { edition_only: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Language',
				name: 'goodreadsReviewsLanguage',
				type: 'string',
				default: '',
				placeholder: 'es',
				description: "Only reviews in this language, as the page's filter lists it (en, es, fr, de, zh-TW; review languages of Get Book list them with counts)",
				routing: { request: { body: { language: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Pages',
				name: 'goodreadsReviewsPages',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 4 },
				description: 'Pages of 30 to read in this call, 1 to 4 (up to 120 reviews of the view)',
				routing: { request: { body: { pages: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'goodreadsReviewsSort',
				type: 'options',
				default: 'popular',
				options: [
					{ name: 'Newest', value: 'newest' },
					{ name: 'Oldest', value: 'oldest' },
					{ name: 'Popular', value: 'popular' },
				],
				description: "The review page's own orders",
				routing: { request: { body: { sort: '={{ $value === "popular" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Stars',
				name: 'goodreadsReviewsStars',
				type: 'options',
				default: 0,
				options: [
					{ name: 'Any', value: 0 },
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this many stars',
				routing: { request: { body: { stars: '={{ $value || undefined }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'goodreadsAuthorBooksOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['authorBooks']),
		options: sorted([
			pageOption('goodreadsAuthorBooksPage', 100, 'Page of 30, 1 to 100 (has_more says whether there is another)'),
			{
				displayName: 'Sort',
				name: 'goodreadsAuthorBooksSort',
				type: 'options',
				default: 'popularity',
				options: [
					{ name: 'Average Rating', value: 'average_rating' },
					{ name: 'Number of Pages', value: 'number_of_pages' },
					{ name: 'Original Publication Year', value: 'original_publication_year' },
					{ name: 'Popularity', value: 'popularity' },
					{ name: 'Title', value: 'title' },
				],
				description: "The author page's own sorts",
				routing: { request: { body: { sort: '={{ $value === "popularity" ? undefined : $value }}' } } },
			},
		]),
	},
	{
		displayName: 'Additional Options',
		name: 'goodreadsEditionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['editions']),
		options: sorted([
			pageOption('goodreadsEditionsPage', 1000, 'Page of 10, 1 to 1000 (has_more says whether there is another)'),
			{
				displayName: 'Sort',
				name: 'goodreadsEditionsSort',
				type: 'options',
				default: '',
				options: [
					{ name: 'Average Rating', value: 'avg_rating' },
					{ name: 'Date Published', value: 'date_published' },
					{ name: 'Format', value: 'format' },
					{ name: "Goodreads' Order", value: '' },
					{ name: 'Number of Ratings', value: 'num_ratings' },
					{ name: 'Original Date Published', value: 'original_date_published' },
					{ name: 'Title', value: 'title' },
				],
				description: "The editions page's own six sorts",
				routing: { request: { body: { sort: '={{ $value || undefined }}' } } },
			},
		]),
	},
	pageCollection(
		'goodreadsListOptions',
		'list',
		pageOption('goodreadsListPage', 1000, 'Page of 100, 1 to 1000 (has_more says whether there is another)'),
	),
	pageCollection(
		'goodreadsBookListsOptions',
		'bookLists',
		pageOption('goodreadsBookListsPage', 1000, 'Page of 30, 1 to 1000 (has_more says whether there is another)'),
	),
	pageCollection(
		'goodreadsListSearchOptions',
		'listSearch',
		pageOption('goodreadsListSearchPage', 100, 'Page of 20, 1 to 100 (has_more says whether there is another)'),
	),
	pageCollection(
		'goodreadsQuotesOptions',
		'quotes',
		pageOption('goodreadsQuotesPage', 100, 'Page of 20 (search words) or 30 (tag, work ID), 1 to 100 (has_more says whether there is another)'),
	),
	{
		displayName: 'Additional Options',
		name: 'goodreadsGenreOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['genre']),
		options: [
			{
				displayName: 'List',
				name: 'goodreadsGenreList',
				type: 'options',
				default: 'popular',
				options: [
					{ name: 'Most Read This Week', value: 'most_read' },
					{ name: 'Popular', value: 'popular' },
				],
				description: "Popular: the first 50 books of the genre's shelf, most shelved first; Most Read This Week: the books most read this week in the genre",
				routing: { request: { body: { list: '={{ $value === "popular" ? undefined : $value }}' } } },
			},
		],
	},
];
