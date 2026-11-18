import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['depop'], operation, ...extra },
});

// Depop, 14 operations. Buyer markets (country, default us): us, gb, au, ie, ca, nz, de, fr, it.
// Search Listings, Get Product, Get Category Listings, Get Brand Listings, Get Explore Page and
// Get Search Suggestions serve all nine; Get Similar Listings is US only (the backend defaults it
// to us, so it sends no country); the shop operations, Get Categories and Get Brands are global.
// Credits: search / category / brand / explore 1 (5 on New Zealand); product 1 on US, 2 on gb au
// ie ca de fr it, 6 on New Zealand; the rest 1. Storefront pages can take up to about a minute and
// the backend queues and retries, so every operation carries a 240s timeout.
const request = (url: string) => ({
	request: { method: 'POST' as const, url, timeout: 240000 },
});

const MARKET_OPS = ['search', 'product', 'category', 'brand', 'explore', 'suggestions'];
const SHOP_OPS = ['shop', 'shopProducts', 'shopSold', 'shopReviews'];

const ITEM =
	'items with product_id, slug, URL, title, description, brand (id, name, slug), category, group, product_type, status, pictures, sizes, condition, colors, gender, kids, like_count, boosted, discounted, discount_percentage and price';
const MARKET_ITEM = `${ITEM}, plus buyer_market_price (status on_sale)`;
const FIRST_24 =
	"Only the first 24 results per query: Depop serves no next page, so narrow with filters, sort or a price range to reach more listings.";
const PRICES =
	"Prices are numbers as Depop shows them to a buyer in the market: price, original_price (the seller's own original price; it can be far above price), buyer_fee, tax (tax_type), shipping (what the buyer pays; shipping_boundary), total (Scavio's sum: price + buyer_fee + tax + shipping) and headline_price (the price Depop itself headlines: the US leaves out shipping, the UK includes the fee and shipping). price.currency is the listing's currency, usually the market's (some sellers list in another one). On the US, Depop returns a buyer fee on some calls and not on others for the same listing.";
const MARKET_PRICE =
	"buyer_market_price is true when the listing is priced in the market's currency; false means another currency, which Depop shows unconverted with the listing's own price block (Get Product too). List items carry no seller country: Get Product has seller.country.";
const TEXT =
	"Depop's interface is English in every storefront; titles and descriptions are what sellers wrote (often German, French or Italian on de, fr, it).";
const CHARGE = 'Failed upstream calls are not charged; a not-found is charged.';

const listOptions = (withBrandIds: boolean) => {
	const options: INodeProperties[] = [
		{
			displayName: 'Colors',
			name: 'colors',
			type: 'multiOptions',
			default: [],
			options: [
				'black', 'blue', 'brown', 'burgundy', 'cream', 'gold', 'green', 'grey', 'khaki', 'multi',
				'navy', 'orange', 'pink', 'purple', 'red', 'silver', 'tan', 'white', 'yellow',
			].map((c) => ({ name: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
			description: 'One or more colours',
			routing: { request: { body: { colors: '={{ $value && $value.length ? $value : undefined }}' } } },
		},
		{
			displayName: 'Conditions',
			name: 'conditions',
			type: 'multiOptions',
			default: [],
			options: [
				{ name: 'Brand New', value: 'brand_new' },
				{ name: 'Used - Excellent', value: 'used_excellent' },
				{ name: 'Used - Fair', value: 'used_fair' },
				{ name: 'Used - Good', value: 'used_good' },
				{ name: 'Used - Like New', value: 'used_like_new' },
			],
			description: 'One or more conditions',
			routing: {
				request: { body: { conditions: '={{ $value && $value.length ? $value : undefined }}' } },
			},
		},
		{
			displayName: 'Gender',
			name: 'gender',
			type: 'options',
			default: '',
			options: [
				{ name: 'Any', value: '' },
				{ name: 'Female', value: 'female' },
				{ name: 'Male', value: 'male' },
				{ name: 'Unisex', value: 'unisex' },
			],
			routing: { request: { body: { gender: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Group',
			name: 'group',
			type: 'string',
			default: '',
			placeholder: 'bottoms',
			description: 'A group ID from Get Categories (tops, bottoms, footwear ...)',
			routing: { request: { body: { group: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Kids Only',
			name: 'kids',
			type: 'boolean',
			default: false,
			description: "Whether to return only kids' listings",
			routing: { request: { body: { kids: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Marked Down Only',
			name: 'on_sale',
			type: 'boolean',
			default: false,
			description: 'Whether to return only listings the seller marked down (items[].discounted)',
			routing: { request: { body: { on_sale: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Max Price',
			name: 'price_max',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: "Highest listing price, in the market's currency",
			routing: { request: { body: { price_max: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Min Price',
			name: 'price_min',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: "Lowest listing price, in the market's currency",
			routing: { request: { body: { price_min: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Product Types',
			name: 'product_type',
			type: 'string',
			default: '',
			placeholder: 'jeans',
			description: 'Product type IDs from Get Categories, comma-separated (jeans, hoodies ...)',
			routing: { request: { body: { product_type: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Size',
			name: 'size',
			type: 'string',
			default: '',
			placeholder: '4.15',
			description:
				'Size filter values (size_set_id.size_id, from Get Categories with Include Sizes), comma-separated. Depop honours it only partly.',
			routing: { request: { body: { size: '={{ $value || undefined }}' } } },
		},
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'options',
			default: 'relevance',
			options: [
				{ name: 'Price: High to Low', value: 'price_desc' },
				{ name: 'Price: Low to High', value: 'price_asc' },
				{ name: 'Relevance', value: 'relevance' },
			],
			description:
				"Result order. Price sorts return Depop's first 24 for that order, in strict listing-price order. Newest and most popular are not available.",
			routing: { request: { body: { sort: '={{ $value === "relevance" ? undefined : $value }}' } } },
		},
	];
	if (withBrandIds) {
		options.unshift({
			displayName: 'Brand IDs',
			name: 'brand_ids',
			type: 'string',
			default: '',
			placeholder: '1673',
			description: 'Brand IDs (from Get Brands, items[].brand.ID), comma-separated, up to 20',
			routing: { request: { body: { brand_ids: '={{ $value || undefined }}' } } },
		});
	}
	return options;
};

const listCollection = (name: string, operation: string, withBrandIds: boolean): INodeProperties => ({
	displayName: 'Additional Options',
	name,
	type: 'collection',
	placeholder: 'Add Option',
	default: {},
	displayOptions: show([operation]),
	options: listOptions(withBrandIds),
});

const shopPaging: INodeProperties[] = [
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		default: '',
		description: 'The next_cursor of the previous page',
		routing: { request: { body: { cursor: '={{ $value || undefined }}' } } },
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 24,
		typeOptions: { minValue: 1, maxValue: 24 },
		description: 'Listings per page, 1 to 24',
		routing: { request: { body: { limit: '={{ $value === 24 ? undefined : $value }}' } } },
	},
];

export const depopOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['depop'] } },
		options: [
			{
				name: 'Get Brand Listings',
				value: 'brand',
				action: 'Get depop brand listings',
				description: `The first 24 listings of one brand (a slug from Get Brands) in a buyer market: brand and ${MARKET_ITEM}, count and total_count. An unknown brand is a charged 404. ${FIRST_24} ${PRICES} ${MARKET_PRICE} ${TEXT} ${CHARGE} Costs 1 credit (5 on New Zealand).`,
				routing: request('/api/v1/depop/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get depop brands',
				description: `Depop brands by first letter (ID, name, slug), or one brand by slug with its description. The slug feeds Get Brand Listings, the ID the Brand IDs filter. Global. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/depop/brands'),
			},
			{
				name: 'Get Categories',
				value: 'categories',
				action: 'Get depop categories',
				description: `Depop's category tree: departments, groups and product types (ID, name, path). The path feeds Get Category Listings; group and product type IDs are search filters. Names in en, en-US, de, fr or it; Include Sizes adds the size sets. Global. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/depop/categories'),
			},
			{
				name: 'Get Category Listings',
				value: 'category',
				action: 'Get depop category listings',
				description: `The first 24 listings of one category path (from Get Categories, e.g. mens/bottoms/jeans) in a buyer market: category and ${MARKET_ITEM}, count and total_count. ${FIRST_24} ${PRICES} ${MARKET_PRICE} ${TEXT} ${CHARGE} Costs 1 credit (5 on New Zealand).`,
				routing: request('/api/v1/depop/category'),
			},
			{
				name: 'Get Explore Page',
				value: 'explore',
				action: 'Get a depop explore page',
				description: `One of Depop's curated explore pages (e.g. 90s-menswear) in a buyer market: title, search_query, the first 24 listings (with buyer_market_price), total_count and more_slugs (the market's other explore pages). An unknown page is a charged 404. ${PRICES} ${MARKET_PRICE} ${TEXT} ${CHARGE} Costs 1 credit (5 on New Zealand).`,
				routing: request('/api/v1/depop/explore'),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a depop product',
				description: `One listing by slug, link or product ID, priced for a buyer in the market: description, hashtags, brand, category with breadcrumbs, condition, colors, sizes, shipping (national_cost: the seller's domestic rate, which can differ from price.shipping), discount, price (buyer market), listing_price (the seller's own currency and price) and the seller (username, verified, country: the seller account's, reviews_rating, reviews_total, items_sold, last_seen, average_shipping_days). Listing IDs are global: the same listing from another market shows that buyer's fee, tax and shipping, in the listing's own currency. ${PRICES} ${TEXT} ${CHARGE} Costs 1 credit on the US, 2 on gb, au, ie, ca, de, fr, it and 6 on New Zealand.`,
				routing: request('/api/v1/depop/product'),
			},
			{
				name: 'Get Search Suggestions',
				value: 'suggestions',
				action: 'Get depop search suggestions',
				description: `Search suggestions for a partial query, ranked for a buyer market: text, group, gender and filter_label. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/depop/suggestions'),
			},
			{
				name: 'Get Shop',
				value: 'shop',
				action: 'Get a depop shop',
				description: `A Depop shop (seller) by username or shop ID: bio, verified, followers, following, reviews_rating, reviews_total, seller_ratings, buyer_ratings, items_sold, last_seen and listings per category. No real names, join date or Top Seller badge. Global. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/depop/shop'),
			},
			{
				name: 'Get Shop Listings',
				value: 'shopProducts',
				action: 'Get depop shop listings',
				description: `A shop's listings for sale, paged by cursor (up to 24 per page): ${ITEM} (status on_sale), created_at and updated_at, plus has_more and next_cursor. Prices in the seller's listing currency; no buyer_market_price. Global. ${CHARGE} Costs 1 credit per page.`,
				routing: request('/api/v1/depop/shop-products'),
			},
			{
				name: 'Get Shop Reviews',
				value: 'shopReviews',
				action: 'Get depop shop reviews',
				description: `Reviews a shop received as a seller (default) or as a buyer, 24 per page: date, rating, text and the product (product_id, image). No reviewer names. Global. ${CHARGE} Costs 1 credit per page.`,
				routing: request('/api/v1/depop/shop-reviews'),
			},
			{
				name: 'Get Shop Sold Listings',
				value: 'shopSold',
				action: 'Get depop shop sold listings',
				description: `A shop's sold listings with the price they sold at (price, original_price, discounted, discount_percentage), paged by cursor (up to 24 per page). status is sold (sold on Depop) or marked_as_sold (the seller marked it sold, which may be outside Depop). Depop shows no sale date: updated_at is the listing's last update. This is Depop's only sold data: there is no keyword search of sold listings. Global. ${CHARGE} Costs 1 credit per page.`,
				routing: request('/api/v1/depop/shop-sold'),
			},
			{
				name: 'Get Similar Listings (US)',
				value: 'similar',
				action: 'Get depop similar listings',
				description: `Listings Depop shows as similar to one listing, for a US buyer: ${MARKET_ITEM}, created_at and updated_at. US only. ${PRICES} ${MARKET_PRICE} ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/depop/similar'),
			},
			{
				name: 'Search Listings',
				value: 'search',
				action: 'Search depop listings',
				description: `Search listings for sale in one buyer market: ${MARKET_ITEM}, count, total_count (approximate) and facets. ${FIRST_24} ${PRICES} ${MARKET_PRICE} ${TEXT} Not available: keyword sold search (use Get Shop Sold Listings), trending searches, views, price history. ${CHARGE} Costs 1 credit (5 on New Zealand).`,
				routing: request('/api/v1/depop/search'),
			},
			{
				name: 'Search Shops',
				value: 'shopsSearch',
				action: 'Search depop shops',
				description: `Shops whose username matches a query: shop_id, username and URL. Use Get Shop for ratings and items sold. Global. ${CHARGE} Costs 1 credit.`,
				routing: request('/api/v1/depop/shops-search'),
			},
		],
		default: 'search',
	},
];

export const depopFields: INodeProperties[] = [
	// -- Market --
	{
		displayName: 'Country',
		name: 'country',
		type: 'options',
		default: 'us',
		options: [
			{ name: 'Australia (AUD)', value: 'au' },
			{ name: 'Canada (CAD)', value: 'ca' },
			{ name: 'France (EUR)', value: 'fr' },
			{ name: 'Germany (EUR)', value: 'de' },
			{ name: 'Ireland (EUR)', value: 'ie' },
			{ name: 'Italy (EUR)', value: 'it' },
			{ name: 'New Zealand (NZD)', value: 'nz' },
			{ name: 'United Kingdom (GBP)', value: 'gb' },
			{ name: 'United States (USD)', value: 'us' },
		],
		displayOptions: show(MARKET_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"The buyer's country: results and prices are what a buyer there sees. New Zealand costs more (5 credits per list, 6 per product); Get Product costs 2 outside the US.",
	},

	// -- Search Listings, Get Search Suggestions, Search Shops --
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'levis 501',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Search keywords',
	},
	{
		displayName: 'Partial Query',
		name: 'suggestQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'carh',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'What the shopper has typed so far',
	},
	{
		displayName: 'Username Query',
		name: 'shopQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'y2k',
		displayOptions: show(['shopsSearch']),
		routing: { request: { body: { query: '={{ $value }}' } } },
		description: 'Part of a shop username',
	},

	// -- Get Product --
	{
		displayName: 'Product By',
		name: 'productBy',
		type: 'options',
		default: 'slug',
		options: [
			{ name: 'Product ID', value: 'productId' },
			{ name: 'Product URL', value: 'url' },
			{ name: 'Slug', value: 'slug' },
		],
		displayOptions: show(['product']),
		description: 'How to identify the listing',
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'f0omem-levis-550-38x36-blue-jeans-662f',
		displayOptions: show(['product'], { productBy: ['slug'] }),
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description: 'The listing slug (items[].slug of a search response)',
	},
	{
		displayName: 'Product URL',
		name: 'productUrl',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://www.depop.com/products/f0omem-levis-550-38x36-blue-jeans-662f/',
		displayOptions: show(['product'], { productBy: ['url'] }),
		routing: { request: { body: { url: '={{ $value }}' } } },
		description: 'A depop.com product link; the market is Country, not the link',
	},
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1002884801',
		displayOptions: show(['product'], { productBy: ['productId'] }),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'The product ID (items[].product_id)',
	},
	{
		displayName: 'Product ID',
		name: 'similarProductId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1002884801',
		displayOptions: show(['similar']),
		routing: { request: { body: { product_id: '={{ $value }}' } } },
		description: 'The product ID (items[].product_id) of the listing to find similar ones for',
	},

	// -- Get Category Listings --
	{
		displayName: 'Category Path',
		name: 'categoryPath',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'mens/bottoms/jeans',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ $value }}' } } },
		description:
			'Department[/group[/product type]] from Get Categories (mens, womens, kids, everything-else), e.g. mens/bottoms/jeans',
	},

	// -- Get Brand Listings, Get Explore Page --
	{
		displayName: 'Brand Slug',
		name: 'brandSlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'carhartt',
		displayOptions: show(['brand']),
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description: 'A brand slug from Get Brands (items[].brand.slug), e.g. carhartt, levi-s',
	},
	{
		displayName: 'Explore Page Slug',
		name: 'exploreSlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: '90s-menswear',
		displayOptions: show(['explore']),
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description:
			"A Depop explore page slug (depop.com/explore/SLUG/). Every response lists the market's other pages in more_slugs.",
	},

	// -- Shop operations --
	{
		displayName: 'Shop By',
		name: 'shopBy',
		type: 'options',
		default: 'username',
		options: [
			{ name: 'Shop ID', value: 'shopId' },
			{ name: 'Username', value: 'username' },
		],
		displayOptions: show(SHOP_OPS),
		description: 'How to identify the shop',
	},
	{
		displayName: 'Username',
		name: 'username',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'flomem',
		displayOptions: show(SHOP_OPS, { shopBy: ['username'] }),
		routing: { request: { body: { username: '={{ $value }}' } } },
		description: 'The shop username (depop.com/USERNAME/)',
	},
	{
		displayName: 'Shop ID',
		name: 'shopId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '46847613',
		displayOptions: show(SHOP_OPS, { shopBy: ['shopId'] }),
		routing: { request: { body: { shop_id: '={{ $value }}' } } },
		description: 'The shop ID (shop_id of Get Shop, seller.ID of Get Product)',
	},

	// -- Get Brands --
	{
		displayName: 'Brands By',
		name: 'brandsBy',
		type: 'options',
		default: 'letter',
		options: [
			{ name: 'First Letter', value: 'letter' },
			{ name: 'Slug', value: 'slug' },
		],
		displayOptions: show(['brands']),
		description: 'List brands by first letter, or read one brand by slug',
	},
	{
		displayName: 'Letter',
		name: 'letter',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'c',
		displayOptions: show(['brands'], { brandsBy: ['letter'] }),
		routing: { request: { body: { letter: '={{ $value }}' } } },
		description: 'First letter a-z, or 0-9 for brands starting with a digit or symbol',
	},
	{
		displayName: 'Brand Slug',
		name: 'brandsSlug',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'carhartt',
		displayOptions: show(['brands'], { brandsBy: ['slug'] }),
		routing: { request: { body: { slug: '={{ $value }}' } } },
		description: 'One brand by slug (with its description)',
	},

	// -- Additional Options --
	listCollection('searchOptions', 'search', true),
	listCollection('categoryOptions', 'category', true),
	listCollection('brandOptions', 'brand', false),
	{
		displayName: 'Additional Options',
		name: 'shopListOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['shopProducts', 'shopSold']),
		options: shopPaging,
	},
	{
		displayName: 'Additional Options',
		name: 'shopReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['shopReviews']),
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 200 },
				description: 'Page, 1-based, 24 reviews each',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				default: 'seller',
				options: [
					{ name: 'As Buyer (Reviews From Sellers)', value: 'buyer' },
					{ name: 'As Seller (Reviews From Buyers)', value: 'seller' },
				],
				routing: { request: { body: { role: '={{ $value === "seller" ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'categoriesOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['categories']),
		options: [
			{
				displayName: 'Include Sizes',
				name: 'include_sizes',
				type: 'boolean',
				default: false,
				description: 'Whether to add the size sets (size systems and their size filter values)',
				routing: { request: { body: { include_sizes: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Language',
				name: 'language',
				type: 'options',
				default: 'en',
				options: [
					{ name: 'English', value: 'en' },
					{ name: 'English (US)', value: 'en-US' },
					{ name: 'French', value: 'fr' },
					{ name: 'German', value: 'de' },
					{ name: 'Italian', value: 'it' },
				],
				description: 'Names of groups and product types (department names stay English)',
				routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
			},
		],
	},
];
