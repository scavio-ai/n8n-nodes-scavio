import type { INodeProperties } from 'n8n-workflow';

const show = (
	operation: string[],
	extra: Record<string, Array<string | number | boolean>> = {},
) => ({
	show: { resource: ['carrefour'], operation, ...extra },
});

// Carrefour (carrefour.fr, plus Argentina, Romania and Belgium for Search Products and Get
// Product), 9 operations, 1 credit each; Search Products and Get Product cost 2 on Belgium. The
// other seven operations are carrefour.fr only. Store Ref (France) scopes prices and assortment to
// one store. Every route carries a 120s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 120000 },
});

const MARKET_OPERATIONS = ['search', 'product'];

const COUNTRY_OPTIONS = [
	{ name: 'Argentina (ARS, Spanish)', value: 'ar' },
	{ name: 'Belgium (EUR, French or Dutch; 2 Credits)', value: 'be' },
	{ name: 'France (Carrefour.fr, EUR)', value: 'fr' },
	{ name: 'Romania (RON, Romanian)', value: 'ro' },
];

const GRID =
	"Items with EAN (for Get Product, Get Reviews and Get Store Availability), title, brand, URL, image, type (product or marketplace), sponsored, price (regular price), unit_price with unit and unit_price_label (price per kg / L), packaging, format, nutriscore (A-E), ecoscore, rating, review_count, available, low_stock, promotion (type, label, loyalty_only: the price needs the Carrefour loyalty card, seen_in_catalogue, discounted_price, initial_price, discount_amount, quantity, starts_at, ends_at; on multi-buy deals such as 'Le 2ème à -50%' the prices cover quantity items and discounted_price is null when the site does not price the deal), seller (marketplace items) and category. Also total, total_pages, page, page_size, every facet (ID, label, values with label, count and selected), store, price_scope, country, language and currency.";

const SCOPE =
	"Prices: without Store Ref, carrefour.fr's national online price; with Store Ref, that store's shelf price and assortment (they differ by store: Nutella 400 g was 3.99 national, 3.69 at two stores and 4.61 at another). The response says which (store, price_scope). Titles and labels come in French on France, as the site writes them.";

const CHARGE =
	'Failed upstream calls are not charged (they are retried automatically); a not-found is charged.';
const C1 = CHARGE + ' Costs 1 credit.';
const CM = CHARGE + ' Costs 1 credit (2 on Belgium).';

const STORE_REF: INodeProperties = {
	displayName: 'Store Ref',
	name: 'store',
	type: 'string',
	default: '',
	placeholder: '840093',
	description:
		"France only: that store's price and assortment. A store_ref or pickup_refs[].ref from Find Stores, or stores[].store.ref from Get Store Availability. Leave empty for the national online price.",
	routing: { request: { body: { store: '={{ $value || undefined }}' } } },
};

const PROMOTION_FILTER: INodeProperties = {
	displayName: 'Promotion Filter',
	name: 'promotion',
	type: 'string',
	default: '',
	placeholder: 'Remises immédiates',
	description:
		'France only: one value of the Promotions facet (facets[ID=facet_promotions]): Toutes les promotions, Remises immédiates, Vu en catalogue, Avantage Fidélité',
	routing: { request: { body: { promotion: '={{ $value || undefined }}' } } },
};

const FILTER_OPTIONS: INodeProperties[] = [
	{
		displayName: 'Brand',
		name: 'brand',
		type: 'string',
		default: '',
		placeholder: 'NUTELLA',
		description:
			"France only: one brand as the Marque facet lists it (facets[ID=facet_marque].values[].label, e.g. NUTELLA, CARREFOUR BIO). Another casing is matched to the facet's own.",
		routing: { request: { body: { brand: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Carrefour Brands Only',
		name: 'carrefour_brands',
		type: 'boolean',
		default: false,
		description: "Whether to return only Carrefour's own brands (France only)",
		routing: { request: { body: { carrefour_brands: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Max Price',
		name: 'max_price',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: 'France only: highest price in EUR',
		routing: { request: { body: { max_price: '={{ $value }}' } } },
	},
	{
		displayName: 'Min Price',
		name: 'min_price',
		type: 'number',
		default: 0,
		typeOptions: { minValue: 0, numberPrecision: 2 },
		description: 'France only: lowest price in EUR',
		routing: { request: { body: { min_price: '={{ $value }}' } } },
	},
	{
		displayName: 'Nutri-Score',
		name: 'nutriscore',
		type: 'options',
		default: 'A',
		options: [
			{ name: 'A', value: 'A' },
			{ name: 'B', value: 'B' },
			{ name: 'C', value: 'C' },
			{ name: 'D', value: 'D' },
			{ name: 'E', value: 'E' },
		],
		description: 'France only: only products with this Nutri-Score',
		routing: { request: { body: { nutriscore: '={{ $value }}' } } },
	},
	{
		displayName: 'Organic Only',
		name: 'organic',
		type: 'boolean',
		default: false,
		description: 'Whether to return only organic products (France only)',
		routing: { request: { body: { organic: '={{ $value || undefined }}' } } },
	},
];

const GRID_OPTIONS: INodeProperties[] = [
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, maxValue: 500 },
		description:
			'Results page, 1-based. 30 items per page on France (Argentina and Romania 24, Belgium 36).',
		routing: { request: { body: { page: '={{ $value }}' } } },
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'options',
		default: 'relevance',
		options: [
			{ name: 'Price: High to Low', value: 'price_high_to_low' },
			{ name: 'Price: Low to High', value: 'price_low_to_high' },
			{ name: 'Relevance', value: 'relevance' },
			{ name: 'Top Rated', value: 'top_rated' },
			{ name: 'Unit Price: High to Low', value: 'unit_price_high_to_low' },
			{ name: 'Unit Price: Low to High', value: 'unit_price_low_to_high' },
		],
		description:
			'Relevance (default), price, unit price or top rated. Argentina and Romania: relevance and the two price sorts; Belgium: relevance.',
		routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
	},
];

const sorted = (options: INodeProperties[]) =>
	[...options].sort((x, y) => x.displayName.localeCompare(y.displayName));

export const carrefourOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['carrefour'] } },
		options: [
			{
				name: 'Find Stores',
				value: 'stores',
				action: 'Find carrefour stores',
				description:
					"Carrefour stores in France near a postal code or a point, nearest first (up to 20 per page), optionally only those with one service (drive, home delivery, fuel station...). Each store has ID, store_ref and pickup_refs (use either as Store Ref on Search Products, Get Product, Get Category Products or Get Promotions for that store's prices), name, banner, format, distance_km, address, lat, lng, open_today and today's opening hours, slug (for Get Store) and store_url. France only. " +
					C1,
				routing: request('/api/v1/carrefour/stores'),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get carrefour category products',
				description:
					"A carrefour.fr category (aisle) grid by URL or path (/r/cremerie, /r/epicerie-sucree/petit-dejeuner), with the same filters and sorts as Search Products and the category's label, path, URL and breadcrumb. A product's breadcrumb[].url is a valid path. " +
					GRID +
					' ' +
					SCOPE +
					' France only. ' +
					C1,
				routing: request('/api/v1/carrefour/category'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a carrefour product',
				description:
					'One Carrefour product by EAN or URL. On France: title, brand, description, key features, breadcrumb, categories, images, packaging, format, origin, Nutri-Score, Eco-Score, regulated name, ingredients, allergens (as written in capitals in the ingredients), nutrition per 100 g / ml and per portion (with daily value %), storage and advice, characteristics (non-food), weights, the price block (price, unit price, tax note, promotion with loyalty_only), availability, the marketplace seller and every offer, and the rating (average, count, distribution). ' +
					SCOPE +
					' Argentina (by EAN or URL), Romania and Belgium (by URL only) return title, brand, price, list price, promotion, unit price, availability, description, images and categories as their site gives them. ' +
					CM,
				routing: request('/api/v1/carrefour/product'),
			},
			{
				name: 'Get Promotions',
				value: 'promotions',
				action: 'Get carrefour promotions',
				description:
					"carrefour.fr items on promotion: all (default), catalogue (seen in the printed catalogue, Vu en catalogue), immediate (Remises immédiates), loyalty (Avantage Fidélité: loyalty-card offers, i.e. member prices) or festive (the site's seasonal Sélection festive), optionally for one aisle, with the search filters and sorts. Each promotion carries type, label, loyalty_only, discounted_price and initial_price (discounted_price is null when the site does not price the deal, as on some multi-buy offers), and its start and end dates. " +
					GRID +
					' ' +
					SCOPE +
					' Not the printed leaflet itself and no price history: to track promotions over time, poll and store your own. France only. ' +
					C1,
				routing: request('/api/v1/carrefour/promotions'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get carrefour product reviews',
				description:
					'Verified-purchase customer reviews of one carrefour.fr product by EAN, 1-50 per call (default 10), sorted most recent (default), oldest, highest or lowest rated, optionally only one star rating, with offset paging: total, has_more and per review author (public first name and last initial, as published), rating, title, text, reviewed_at, purchased_at and source (the verified-review provider). Review text is in French. France only. ' +
					C1,
				routing: request('/api/v1/carrefour/reviews'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get carrefour search suggestions',
				description:
					'carrefour.fr search box suggestions for a partial query: suggestions (text, URL) and category suggestions (category, text, URL), in French. France only. ' +
					C1,
				routing: request('/api/v1/carrefour/suggestions'),
			},
			{
				name: 'Get Store',
				value: 'store',
				action: 'Get a carrefour store',
				description:
					'One Carrefour store in France by slug or URL: name, banner, format, type, status, address, lat, lng, phone, services, weekly opening hours and drive hours, the next pickup slots as shown, delivery and express delivery flags, nearby stores and, at stores with a fuel station, fuel prices per litre (Gazole, SP95, SP95-E10, SP98, E85, GPLc) with their update times (fuel is null elsewhere). No delivery-slot booking. France only. ' +
					C1,
				routing: request('/api/v1/carrefour/store'),
			},
			{
				name: 'Get Store Availability',
				value: 'storeAvailability',
				action: 'Get carrefour store availability',
				description:
					"Whether the Carrefour stores around a French postal code carry one product (EAN): count, available_count and per store available yes / no, distance_km and the store (ID, ref, pickup_refs, name, banner, format, address, lat, lng, phone, weekly opening hours and drive hours, slug, store_url). Availability only, no price and no unit count: for a store's price run Search Products or Get Product with Store Ref set to stores[].store.ref. France only. " +
					C1,
				routing: request('/api/v1/carrefour/store-availability'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search carrefour products',
				description:
					"Search Carrefour grocery and household products by keyword: carrefour.fr with every filter (brand, promotion, Nutri-Score, organic, Carrefour brands, price range), sorts by price, unit price or rating, and store-scoped prices; also the Argentina (ARS), Romania (RON) and Belgium (EUR, French or Dutch) sites, which return the fields their site carries (no facets or store scope). Misspellings come back corrected (corrected_query); when nothing matches the site returns loosely related items and results_type is 'fallback'. " +
					GRID +
					' ' +
					SCOPE +
					' ' +
					CM,
				routing: request('/api/v1/carrefour/search'),
			},
		],
		default: 'search',
	},
];

export const carrefourFields: INodeProperties[] = [
	// -- Market (Search Products, Get Product) --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'fr',
		options: COUNTRY_OPTIONS,
		displayOptions: show(MARKET_OPERATIONS),
		routing: { request: { body: { country: '={{ $value === "fr" ? undefined : $value }}' } } },
		description:
			"The national Carrefour site. Titles come in the market's language, prices in its currency. Every other operation is France only.",
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'options',
		default: '',
		options: [
			{ name: 'Site Default (French)', value: '' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'French', value: 'fr' },
		],
		displayOptions: show(MARKET_OPERATIONS, { country: ['be'] }),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description: 'Belgium only: French (default) or Dutch',
	},

	// -- Search Products / Get Search Suggestions --
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'nutella',
		displayOptions: show(['search', 'suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description:
			'Search keywords (Get Search Suggestions: what a shopper has typed so far). Misspellings are corrected by the site on France (corrected_query).',
	},
	{
		displayName: 'Additional Options',
		name: 'searchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: sorted([STORE_REF, PROMOTION_FILTER, ...FILTER_OPTIONS, ...GRID_OPTIONS]),
	},

	// -- Get Product --
	{
		displayName: 'EAN',
		name: 'ean',
		type: 'string',
		default: '',
		placeholder: '3017620422003',
		displayOptions: show(['product']),
		routing: { request: { body: { ean: '={{ $value || undefined }}' } } },
		description:
			'The product barcode (EAN / GTIN): items[].ean of a search. France and Argentina. Use this or Product URL.',
	},
	{
		displayName: 'Product URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'https://www.carrefour.fr/p/pate-a-tartiner-noisettes-cacao-nutella-3017620422003',
		displayOptions: show(['product']),
		routing: { request: { body: { url: '={{ $value || undefined }}' } } },
		description:
			'A product URL from a search result. Alternative to EAN on France and Argentina; required on Romania and Belgium.',
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
				displayName: 'Seller ID',
				name: 'seller',
				type: 'string',
				default: '',
				description:
					"France only: a marketplace seller ID (the seller of a search result) to read that seller's offer",
				routing: { request: { body: { seller: '={{ $value || undefined }}' } } },
			},
			STORE_REF,
		],
	},

	// -- Get Reviews / Get Store Availability --
	{
		displayName: 'EAN',
		name: 'ean',
		type: 'string',
		required: true,
		default: '',
		placeholder: '3017620422003',
		displayOptions: show(['reviews', 'storeAvailability']),
		routing: { request: { body: { ean: '={{ $value }}' } } },
		description: 'The product barcode (EAN / GTIN): items[].ean of a search',
	},
	{
		displayName: 'Additional Options',
		name: 'reviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Max Reviews',
				name: 'maxReviews',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Reviews to return, 1-50. Defaults to 10.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 10000 },
				description: 'Reviews to skip (paging)',
				routing: { request: { body: { offset: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Rating',
				name: 'rating',
				type: 'options',
				default: 5,
				options: [
					{ name: '1 Star', value: 1 },
					{ name: '2 Stars', value: 2 },
					{ name: '3 Stars', value: 3 },
					{ name: '4 Stars', value: 4 },
					{ name: '5 Stars', value: 5 },
				],
				description: 'Only reviews with this many stars',
				routing: { request: { body: { rating: '={{ $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'most_recent',
				options: [
					{ name: 'Highest Rated', value: 'highest_rated' },
					{ name: 'Lowest Rated', value: 'lowest_rated' },
					{ name: 'Most Recent', value: 'most_recent' },
					{ name: 'Oldest', value: 'oldest' },
				],
				description: 'Most recent (default), oldest, highest rated or lowest rated',
				routing: { request: { body: { sort: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Category Products --
	{
		displayName: 'Category URL or Path',
		name: 'path',
		type: 'string',
		required: true,
		default: '',
		placeholder: '/r/cremerie',
		displayOptions: show(['category']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:\\/\\//i.test($value) ? $value : undefined }}',
					path: '={{ /^https?:\\/\\//i.test($value) ? undefined : $value }}',
				},
			},
		},
		description:
			'A carrefour.fr category page URL (https://www.carrefour.fr/r/cremerie), a path (/r/epicerie-sucree/petit-dejeuner) or a slug (cremerie): the breadcrumb links of a product work',
	},
	{
		displayName: 'Additional Options',
		name: 'categoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: sorted([STORE_REF, PROMOTION_FILTER, ...FILTER_OPTIONS, ...GRID_OPTIONS]),
	},

	// -- Get Promotions --
	{
		displayName: 'Promotion Type',
		name: 'type',
		type: 'options',
		default: 'all',
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Catalogue (Vu En Catalogue)', value: 'catalogue' },
			{ name: 'Festive (Sélection Festive)', value: 'festive' },
			{ name: 'Immediate (Remises Immédiates)', value: 'immediate' },
			{ name: 'Loyalty (Avantage Fidélité)', value: 'loyalty' },
		],
		displayOptions: show(['promotions']),
		routing: { request: { body: { type: '={{ $value === "all" ? undefined : $value }}' } } },
		description:
			"Which promotions to list: all (default), seen in the printed catalogue, immediate discounts, loyalty-card offers (member prices) or the site's seasonal festive selection",
	},
	{
		displayName: 'Additional Options',
		name: 'promotionsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['promotions']),
		options: sorted([
			{
				displayName: 'Aisle',
				name: 'category',
				type: 'string',
				default: '',
				placeholder: 'Boissons',
				description:
					'Only one aisle: a value of the Rayons facet (facets[ID=product.categories.name].values[].label)',
				routing: { request: { body: { category: '={{ $value || undefined }}' } } },
			},
			STORE_REF,
			...FILTER_OPTIONS,
			...GRID_OPTIONS,
		]),
	},

	// -- Find Stores / Get Store Availability --
	{
		displayName: 'Postal Code',
		name: 'postal_code',
		type: 'string',
		required: true,
		default: '',
		placeholder: '69003',
		displayOptions: show(['storeAvailability']),
		routing: { request: { body: { postal_code: '={{ $value }}' } } },
		description: 'A French postal code: stores around it are checked',
	},
	{
		displayName: 'Postal Code',
		name: 'postal_code',
		type: 'string',
		default: '',
		placeholder: '69003',
		displayOptions: show(['stores']),
		routing: { request: { body: { postal_code: '={{ $value || undefined }}' } } },
		description:
			'A French postal code. Leave empty to search by Latitude and Longitude (Additional Options).',
	},
	{
		displayName: 'Additional Options',
		name: 'storesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['stores']),
		options: [
			{
				displayName: 'Latitude',
				name: 'lat',
				type: 'number',
				default: 48.8566,
				typeOptions: { minValue: 41, maxValue: 51.5, numberPrecision: 6 },
				description: 'Latitude (metropolitan France), with Longitude',
				routing: { request: { body: { lat: '={{ $value }}' } } },
			},
			{
				displayName: 'Longitude',
				name: 'lng',
				type: 'number',
				default: 2.3522,
				typeOptions: { minValue: -5.5, maxValue: 10, numberPrecision: 6 },
				description: 'Longitude, with Latitude',
				routing: { request: { body: { lng: '={{ $value }}' } } },
			},
			{
				displayName: 'Max Stores',
				name: 'maxStores',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 20 },
				description: 'Stores per page, nearest first, 1-20. Defaults to 10.',
				routing: { request: { body: { limit: '={{ $value }}' } } },
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 50 },
				description: 'Page of stores, 1-based',
				routing: { request: { body: { page: '={{ $value }}' } } },
			},
			{
				displayName: 'Service',
				name: 'service',
				type: 'options',
				default: 'drive',
				options: [
					{ name: 'Bank and Insurance', value: 'banque_assurance' },
					{ name: 'Caterer', value: 'traiteur' },
					{ name: 'Drive', value: 'drive' },
					{ name: 'Drive 2-Hour Pickup', value: 'Retrait2h-drive' },
					{ name: 'Fuel Station', value: 'station_service' },
					{ name: 'Home Delivery', value: 'lad' },
					{ name: 'Parapharmacy', value: 'Parapharmacie' },
					{ name: 'Pro', value: 'pro' },
					{ name: 'Tickets and Shows', value: 'spectacles' },
					{ name: 'Travel', value: 'voyages' },
					{ name: 'Vehicle Rental', value: 'location_vehicule' },
				],
				description: 'Only stores with this service',
				routing: { request: { body: { service: '={{ $value }}' } } },
			},
		],
	},

	// -- Get Store --
	{
		displayName: 'Store Slug or URL',
		name: 'slug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'venissieux',
		displayOptions: show(['store']),
		routing: {
			request: {
				body: {
					url: '={{ /^https?:\\/\\//i.test($value) ? $value : undefined }}',
					slug: '={{ /^https?:\\/\\//i.test($value) ? undefined : $value }}',
				},
			},
		},
		description:
			'A store page slug (stores[].slug from Find Stores, e.g. venissieux) or a carrefour.fr/magasin/... store page URL.',
	},
];
