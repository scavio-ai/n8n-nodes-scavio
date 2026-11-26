import type { INodeProperties } from 'n8n-workflow';

const show = (operation: string[], extra: Record<string, string[]> = {}) => ({
	show: { resource: ['yesstyle'], operation, ...extra },
});

// YesStyle (yesstyle.com, the Hong Kong-based online store for Asian beauty and fashion, shipping to
// 150+ countries), 9 operations. Credits: Search Products, Get Category Products, Get Brand Products,
// Get Deals and Get Product 2 (Get Product with Include Variants 3); Get Brands, Get Reviews, Get
// Suggestions and Get Markets 1; credits_used is the truth. Search, category, brand, deals and
// product serve 39 shipping countries (Brazil held back); reviews and suggestions any of the 153
// countries YesStyle ships to. Answers can take up to about 225 seconds, so every operation carries
// a 240s timeout.
// emptyBody: a base body {} so operations with only optional inputs still post JSON.
const request = (url: string, emptyBody = false) => ({
	request: { method: 'POST' as const, url, timeout: 240000, ...(emptyBody ? { body: {} } : {}) },
});

const FIRST =
	'YesStyle (yesstyle.com, the Hong Kong-based online store for Asian beauty and fashion, shipping to 150+ countries)';
const NAME = 'YesStyle';
const CHARGE =
	'Failed upstream calls, a page that came back for another country, and refused inputs are not charged; a not-found is charged.';
const TWO = `${CHARGE} Costs 2 credits (credits_used says what was charged)`;
const ONE = `${CHARGE} Costs 1 credit (credits_used says what was charged)`;
const MARKET =
	"Prices are YesStyle's own for the shipping country, in that country's currency (YesStyle keeps regional price lists, so the same product can cost a different amount in two countries that share a currency); which products ship differs by country. Every answer is checked for its country (market says which).";
const TILE =
	"items with product_id (what Get Product takes), name, brand, brand_id, URL, image, price, list_price, discount_percent, currency, price_text and list_price_text (as YesStyle shows them), rating, review_count, size, status (YesStyle's label, e.g. FLASH SALE), badges, brand_region, pack_label, child_product_ids and has_videos";
const LIST =
	"plus page, page_size (100), total, total_pages, has_more, heading, breadcrumbs, category, coupon (YesStyle's site code with its tiers and expiry) and, with Include Facets, facets, price_range and sorts.";
const FILTERS =
	'100 a page, seven sorts and the Featured, price and facet filters';
const NOT_AVAILABLE =
	"Not available: stores (YesStyle has none to look up), a currency other than the country's, cart or checkout, price history (schedule a workflow to track changes), EAN / UPC (YesStyle shows none).";
const IS_URL = '/^https?:|^\\/|yesstyle\\.com/i.test(String($value).trim())';
const PAGE_OPS = ['search', 'category', 'brand', 'deals', 'product'];
const ANY_OPS = ['reviews', 'suggestions'];

// Comma-separated ids -> array, blanks dropped; empty -> omitted.
const idList =
	'={{ (l => l.length ? l : undefined)(String($value).split(",").map(s => s.trim()).filter(Boolean)) }}';

const byName = (a: INodeProperties, b: INodeProperties) =>
	a.displayName.localeCompare(b.displayName);
const sorted = (options: INodeProperties[]) => options.sort(byName);

// Countries the search, category, brand, deals and product operations serve (Brazil is held back).
const PAGE_COUNTRIES = [
	{ name: 'Australia (AUD)', value: 'au' },
	{ name: 'Austria (EUR)', value: 'at' },
	{ name: 'Belgium (EUR)', value: 'be' },
	{ name: 'Canada (CAD)', value: 'ca' },
	{ name: 'Chile (USD)', value: 'cl' },
	{ name: 'Czech Republic (CZK)', value: 'cz' },
	{ name: 'Denmark (DKK)', value: 'dk' },
	{ name: 'France (EUR)', value: 'fr' },
	{ name: 'Germany (EUR)', value: 'de' },
	{ name: 'Greece (EUR)', value: 'gr' },
	{ name: 'Hong Kong (HKD)', value: 'hk' },
	{ name: 'Hungary (HUF)', value: 'hu' },
	{ name: 'India (INR)', value: 'in' },
	{ name: 'Ireland (EUR)', value: 'ie' },
	{ name: 'Israel (ILS)', value: 'il' },
	{ name: 'Italy (EUR)', value: 'it' },
	{ name: 'Japan (JPY)', value: 'jp' },
	{ name: 'Kazakhstan (USD)', value: 'kz' },
	{ name: 'Malaysia (MYR)', value: 'my' },
	{ name: 'Mexico (MXN)', value: 'mx' },
	{ name: 'Netherlands (EUR)', value: 'nl' },
	{ name: 'New Zealand (NZD)', value: 'nz' },
	{ name: 'Norway (NOK)', value: 'no' },
	{ name: 'Philippines (PHP)', value: 'ph' },
	{ name: 'Poland (PLN)', value: 'pl' },
	{ name: 'Portugal (EUR)', value: 'pt' },
	{ name: 'Romania (USD)', value: 'ro' },
	{ name: 'Saudi Arabia (SAR)', value: 'sa' },
	{ name: 'Singapore (SGD)', value: 'sg' },
	{ name: 'South Africa (USD)', value: 'za' },
	{ name: 'South Korea (KRW)', value: 'kr' },
	{ name: 'Spain (EUR)', value: 'es' },
	{ name: 'Sweden (SEK)', value: 'se' },
	{ name: 'Switzerland (CHF)', value: 'ch' },
	{ name: 'Taiwan (TWD)', value: 'tw' },
	{ name: 'Thailand (THB)', value: 'th' },
	{ name: 'United Arab Emirates (AED)', value: 'ae' },
	{ name: 'United Kingdom (GBP)', value: 'gb' },
	{ name: 'United States (USD)', value: 'us' },
];
// Every country YesStyle ships to (reviews and suggestions).
const ALL_COUNTRIES = [
	{ name: 'Algeria (DZD)', value: 'dz' },
	{ name: 'American Samoa (USD)', value: 'as' },
	{ name: 'Andorra (EUR)', value: 'ad' },
	{ name: 'Angola (USD)', value: 'ao' },
	{ name: 'Argentina (USD)', value: 'ar' },
	{ name: 'Armenia (USD)', value: 'am' },
	{ name: 'Aruba (USD)', value: 'aw' },
	{ name: 'Australia (AUD)', value: 'au' },
	{ name: 'Austria (EUR)', value: 'at' },
	{ name: 'Azerbaijan (USD)', value: 'az' },
	{ name: 'Bahamas (USD)', value: 'bs' },
	{ name: 'Bahrain (BHD)', value: 'bh' },
	{ name: 'Bangladesh (USD)', value: 'bd' },
	{ name: 'Barbados (USD)', value: 'bb' },
	{ name: 'Belgium (EUR)', value: 'be' },
	{ name: 'Benin (USD)', value: 'bj' },
	{ name: 'Bhutan (USD)', value: 'bt' },
	{ name: 'Bolivia (USD)', value: 'bo' },
	{ name: 'Bosnia and Herzegovina (USD)', value: 'ba' },
	{ name: 'Brazil (USD)', value: 'br' },
	{ name: 'Brunei Darussalam (USD)', value: 'bn' },
	{ name: 'Bulgaria (EUR)', value: 'bg' },
	{ name: 'Burkina Faso (USD)', value: 'bf' },
	{ name: 'Burundi (USD)', value: 'bi' },
	{ name: 'Cambodia (USD)', value: 'kh' },
	{ name: 'Cameroon (USD)', value: 'cm' },
	{ name: 'Canada (CAD)', value: 'ca' },
	{ name: 'Cape Verde (USD)', value: 'cv' },
	{ name: 'Central African Republic (USD)', value: 'cf' },
	{ name: 'Chad (USD)', value: 'td' },
	{ name: 'Chile (USD)', value: 'cl' },
	{ name: 'Colombia (USD)', value: 'co' },
	{ name: 'Congo (USD)', value: 'cg' },
	{ name: 'Cote D\'ivoire (USD)', value: 'ci' },
	{ name: 'Croatia (EUR)', value: 'hr' },
	{ name: 'Cyprus (EUR)', value: 'cy' },
	{ name: 'Czech Republic (CZK)', value: 'cz' },
	{ name: 'Denmark (DKK)', value: 'dk' },
	{ name: 'Dominican Republic (USD)', value: 'do' },
	{ name: 'Egypt (USD)', value: 'eg' },
	{ name: 'El Salvador (USD)', value: 'sv' },
	{ name: 'Eritrea (USD)', value: 'er' },
	{ name: 'Estonia (EUR)', value: 'ee' },
	{ name: 'Falkland Islands (Malvinas) (USD)', value: 'fk' },
	{ name: 'Federated States of Micronesia (USD)', value: 'fm' },
	{ name: 'Finland (EUR)', value: 'fi' },
	{ name: 'France (EUR)', value: 'fr' },
	{ name: 'Gabon (USD)', value: 'ga' },
	{ name: 'Gambia (USD)', value: 'gm' },
	{ name: 'Georgia (USD)', value: 'ge' },
	{ name: 'Germany (EUR)', value: 'de' },
	{ name: 'Ghana (USD)', value: 'gh' },
	{ name: 'Gibraltar (USD)', value: 'gi' },
	{ name: 'Greece (EUR)', value: 'gr' },
	{ name: 'Greenland (DKK)', value: 'gl' },
	{ name: 'Guadeloupe (EUR)', value: 'gp' },
	{ name: 'Guam (USD)', value: 'gu' },
	{ name: 'Guatemala (USD)', value: 'gt' },
	{ name: 'Guernsey (GBP)', value: 'gg' },
	{ name: 'Guinea (USD)', value: 'gn' },
	{ name: 'Guinea-Bissau (USD)', value: 'gw' },
	{ name: 'Haiti (USD)', value: 'ht' },
	{ name: 'Holy See (Vatican City State) (EUR)', value: 'va' },
	{ name: 'Hong Kong (HKD)', value: 'hk' },
	{ name: 'Hungary (HUF)', value: 'hu' },
	{ name: 'Iceland (USD)', value: 'is' },
	{ name: 'India (INR)', value: 'in' },
	{ name: 'Iraq (AED)', value: 'iq' },
	{ name: 'Ireland (EUR)', value: 'ie' },
	{ name: 'Isle of Man (GBP)', value: 'im' },
	{ name: 'Israel (ILS)', value: 'il' },
	{ name: 'Italy (EUR)', value: 'it' },
	{ name: 'Jamaica (USD)', value: 'jm' },
	{ name: 'Japan (JPY)', value: 'jp' },
	{ name: 'Jersey (GBP)', value: 'je' },
	{ name: 'Jordan (JOD)', value: 'jo' },
	{ name: 'Kazakhstan (USD)', value: 'kz' },
	{ name: 'Kenya (USD)', value: 'ke' },
	{ name: 'Kuwait (KWD)', value: 'kw' },
	{ name: 'Kyrgyzstan (USD)', value: 'kg' },
	{ name: 'Lao People\'s Democratic Republic (USD)', value: 'la' },
	{ name: 'Latvia (EUR)', value: 'lv' },
	{ name: 'Liechtenstein (USD)', value: 'li' },
	{ name: 'Lithuania (EUR)', value: 'lt' },
	{ name: 'Luxembourg (EUR)', value: 'lu' },
	{ name: 'Macau (HKD)', value: 'mo' },
	{ name: 'Madagascar (USD)', value: 'mg' },
	{ name: 'Malaysia (MYR)', value: 'my' },
	{ name: 'Maldives (USD)', value: 'mv' },
	{ name: 'Mali (USD)', value: 'ml' },
	{ name: 'Malta (EUR)', value: 'mt' },
	{ name: 'Martinique (EUR)', value: 'mq' },
	{ name: 'Mauritania (USD)', value: 'mr' },
	{ name: 'Mauritius (USD)', value: 'mu' },
	{ name: 'Mayotte (EUR)', value: 'yt' },
	{ name: 'Mexico (MXN)', value: 'mx' },
	{ name: 'Montenegro (EUR)', value: 'me' },
	{ name: 'Morocco (MAD)', value: 'ma' },
	{ name: 'Mozambique (USD)', value: 'mz' },
	{ name: 'Myanmar (USD)', value: 'mm' },
	{ name: 'Nepal (USD)', value: 'np' },
	{ name: 'Netherlands (EUR)', value: 'nl' },
	{ name: 'New Zealand (NZD)', value: 'nz' },
	{ name: 'Nicaragua (USD)', value: 'ni' },
	{ name: 'Nigeria (USD)', value: 'ng' },
	{ name: 'Northern Mariana Islands (USD)', value: 'mp' },
	{ name: 'Norway (NOK)', value: 'no' },
	{ name: 'Oman (OMR)', value: 'om' },
	{ name: 'Pakistan (USD)', value: 'pk' },
	{ name: 'Panama (USD)', value: 'pa' },
	{ name: 'Paraguay (USD)', value: 'py' },
	{ name: 'Peru (USD)', value: 'pe' },
	{ name: 'Philippines (PHP)', value: 'ph' },
	{ name: 'Poland (PLN)', value: 'pl' },
	{ name: 'Portugal (EUR)', value: 'pt' },
	{ name: 'Puerto Rico (USD)', value: 'pr' },
	{ name: 'Qatar (QAR)', value: 'qa' },
	{ name: 'Republic of Moldova (USD)', value: 'md' },
	{ name: 'Republic of North Macedonia (USD)', value: 'mk' },
	{ name: 'Reunion (EUR)', value: 're' },
	{ name: 'Romania (USD)', value: 'ro' },
	{ name: 'Rwanda (USD)', value: 'rw' },
	{ name: 'San Marino (EUR)', value: 'sm' },
	{ name: 'Sao Tome and Principe (USD)', value: 'st' },
	{ name: 'Saudi Arabia (SAR)', value: 'sa' },
	{ name: 'Senegal (USD)', value: 'sn' },
	{ name: 'Serbia (USD)', value: 'rs' },
	{ name: 'Singapore (SGD)', value: 'sg' },
	{ name: 'Slovakia (EUR)', value: 'sk' },
	{ name: 'Slovenia (EUR)', value: 'si' },
	{ name: 'South Africa (USD)', value: 'za' },
	{ name: 'South Korea (KRW)', value: 'kr' },
	{ name: 'Spain (EUR)', value: 'es' },
	{ name: 'Sri Lanka (USD)', value: 'lk' },
	{ name: 'St. Helena (USD)', value: 'sh' },
	{ name: 'Sweden (SEK)', value: 'se' },
	{ name: 'Switzerland (CHF)', value: 'ch' },
	{ name: 'Taiwan (TWD)', value: 'tw' },
	{ name: 'Thailand (THB)', value: 'th' },
	{ name: 'Trinidad and Tobago (USD)', value: 'tt' },
	{ name: 'Turkey (USD)', value: 'tr' },
	{ name: 'Tuvalu (USD)', value: 'tv' },
	{ name: 'Ukraine (USD)', value: 'ua' },
	{ name: 'United Arab Emirates (AED)', value: 'ae' },
	{ name: 'United Kingdom (GBP)', value: 'gb' },
	{ name: 'United Republic of Tanzania (USD)', value: 'tz' },
	{ name: 'United States (USD)', value: 'us' },
	{ name: 'Uruguay (USD)', value: 'uy' },
	{ name: 'Uzbekistan (USD)', value: 'uz' },
	{ name: 'Vanuatu (USD)', value: 'vu' },
	{ name: 'Vietnam (USD)', value: 'vn' },
	{ name: 'Virgin Islands (USA) (USD)', value: 'vi' },
	{ name: 'Zambia (USD)', value: 'zm' },
];

const LANGUAGE_OPTIONS = [
	{ name: 'Arabic', value: 'ar' },
	{ name: 'Chinese (Traditional)', value: 'zh_TW' },
	{ name: 'Dutch', value: 'nl' },
	{ name: 'English', value: 'en' },
	{ name: 'French', value: 'fr' },
	{ name: 'German', value: 'de' },
	{ name: 'Italian', value: 'it' },
	{ name: 'Polish', value: 'pl' },
	{ name: 'Portuguese', value: 'pt' },
	{ name: 'Russian', value: 'ru' },
	{ name: 'Spanish', value: 'es' },
];

const FEATURED_OPTIONS = [
	{ name: 'Black Friday', value: 'black_friday' },
	{ name: 'Chinese Cosmetics', value: 'chinese_cosmetics' },
	{ name: 'Clearance', value: 'clearance' },
	{ name: 'Cruelty-Free', value: 'cruelty_free' },
	{ name: 'Flash Sales', value: 'flash_sales' },
	{ name: 'In Stock', value: 'in_stock' },
	{ name: 'Japanese Brands', value: 'japanese_brands' },
	{ name: 'Just Arrived', value: 'just_arrived' },
	{ name: 'Korean Brands', value: 'korean_brands' },
	{ name: 'Korean Pharmacy', value: 'korean_pharmacy' },
	{ name: 'Mini Size Exclusives', value: 'mini_size_exclusives' },
	{ name: 'Mini Travel Sizes', value: 'mini_travel_sizes' },
	{ name: 'New Items 24-Hour Sale', value: 'new_items_24hr_sale' },
	{ name: 'New This Week', value: 'new_this_week' },
	{ name: 'Price Drop', value: 'price_drop' },
	{ name: 'Rock-Bottom Prices', value: 'rock_bottom_prices' },
	{ name: 'Southeast Asian Beauty', value: 'southeast_asian_beauty' },
	{ name: 'Trending New', value: 'trending_new' },
	{ name: 'Twin Packs and Bundles', value: 'twin_packs_bundles' },
	{ name: 'Value and Gift Sets', value: 'value_gift_sets' },
	{ name: 'Vegan', value: 'vegan' },
	{ name: 'Western Beauty', value: 'western_beauty' },
	{ name: 'YesStyle Awards 2026', value: 'yesstyle_awards_2026' },
];

const numberOption = (displayName: string, name: string, field: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'number',
	default: 0,
	typeOptions: { minValue: 0, maxValue: 100000000 },
	description,
	routing: { request: { body: { [field]: '={{ $value || undefined }}' } } },
});

const idsOption = (displayName: string, name: string, field: string, placeholder: string, description: string): INodeProperties => ({
	displayName,
	name,
	type: 'string',
	default: '',
	placeholder,
	description,
	routing: { request: { body: { [field]: idList } } },
});

const departmentOption = (name: string): INodeProperties => ({
	displayName: 'Department ID',
	name,
	type: 'string',
	default: '',
	placeholder: '15478',
	description: 'One department ID (category IDs from breadcrumbs or category, e.g. 15478 Beauty, 15544 Skin Care)',
	routing: { request: { body: { department: '={{ String($value).trim() || undefined }}' } } },
});

const listOptions = (prefix: string, opts: { categoryFilters: boolean; department: boolean }): INodeProperties[] =>
	sorted([
		{
			displayName: 'Page',
			name: `${prefix}Page`,
			type: 'number',
			default: 1,
			typeOptions: { minValue: 1, maxValue: 200 },
			description: 'Page, 1-based (100 products a page; up to page 200)',
			routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
		},
		{
			displayName: 'Sort',
			name: `${prefix}Sort`,
			type: 'options',
			default: 'bestsellers',
			options: [
				{ name: 'Availability', value: 'availability' },
				{ name: 'Best Value', value: 'best_value' },
				{ name: 'Bestsellers', value: 'bestsellers' },
				{ name: 'Discount', value: 'discount' },
				{ name: 'Newest', value: 'newest' },
				{ name: 'Price: High to Low', value: 'price_high_to_low' },
				{ name: 'Price: Low to High', value: 'price_low_to_high' },
			],
			description: "Result order (YesStyle's sort menu)",
			routing: { request: { body: { sort: '={{ $value === "bestsellers" ? undefined : $value }}' } } },
		},
		{
			displayName: 'Featured',
			name: `${prefix}Featured`,
			type: 'multiOptions',
			default: [],
			options: FEATURED_OPTIONS,
			description: "YesStyle's Featured filters, one or more",
			routing: { request: { body: { featured: '={{ $value && $value.length ? $value : undefined }}' } } },
		},
		numberOption('Min Price', `${prefix}MinPrice`, 'min_price', "Lowest price, whole units of the country's currency (0: no minimum)"),
		numberOption('Max Price', `${prefix}MaxPrice`, 'max_price', "Highest price, whole units of the country's currency (0: no maximum)"),
		{
			displayName: 'Filters',
			name: `${prefix}Filters`,
			type: 'json',
			default: '[]',
			description:
				'Any other facet of an earlier response (run once with Include Facets to read them) as a list of {key, value}: facets[].key and facets[].values[].value, e.g. [{"key": "stp", "value": "Dry"}] (stp skin type, scrn skin concern, si size, cf color family). At most 12 filter values in all.',
			routing: {
				request: {
					body: {
						filters:
							'={{ (v => Array.isArray(v) && v.length ? v : undefined)(typeof $value === "string" ? JSON.parse($value.trim() || "[]") : $value) }}',
					},
				},
			},
		},
		{
			displayName: 'Include Facets',
			name: `${prefix}IncludeFacets`,
			type: 'boolean',
			default: false,
			description: "Whether to also return YesStyle's facets, price range and sorts (same credits)",
			routing: { request: { body: { include_facets: '={{ $value || undefined }}' } } },
		},
		...(opts.department ? [departmentOption(`${prefix}Department`)] : []),
		...(opts.categoryFilters
			? [
					idsOption('Type IDs', `${prefix}Type`, 'type', '1234', 'Type ids from facets (key t), comma-separated'),
					idsOption('Region IDs', `${prefix}Region`, 'region', '1', 'Brand Region ids from facets (key bcs, e.g. 1 South Korea), comma-separated'),
					idsOption('Ingredient IDs', `${prefix}Ingredients`, 'ingredients', '', 'Ingredient ids from facets (key inp), comma-separated'),
				]
			: []),
	]);

const productRefRouting = {
	request: {
		body: {
			product_id: `={{ ${IS_URL} ? undefined : String($value).trim() }}`,
			url: `={{ ${IS_URL} ? String($value).trim() : undefined }}`,
		},
	},
};

export const yesstyleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['yesstyle'] } },
		options: [
			{
				name: 'Get Brand Products',
				value: 'brand',
				action: 'Get yesstyle brand products',
				description: `One brand's products on ${FIRST} by brand ID or link, ${FILTERS}, plus department, Type, Region and Ingredients: ${TILE}, ${LIST} Also the brand's name, region and customer satisfaction (satisfaction_percent, total_reviews, star_counts). Captured 2026-11-26: COSRX (brand ID 317041) listed 271 products in the US, brand satisfaction 96.6% over 264,080 reviews. ${MARKET} ${TWO}.`,
				routing: request('/api/v1/yesstyle/brand'),
			},
			{
				name: 'Get Brands',
				value: 'brands',
				action: 'Get yesstyle brands',
				description: `Every brand of ${FIRST} (about 4,300), filtered by text and paged: brands with brand_id (what Get Brand Products takes), slug (the brand's link name), URL and last_modified, plus total and matched. ${ONE}.`,
				routing: request('/api/v1/yesstyle/brands', true),
			},
			{
				name: 'Get Category Products',
				value: 'category',
				action: 'Get yesstyle category products',
				description: `Browse one category of ${FIRST} by category ID or link, ${FILTERS}, plus the Type, Region (brand country) and Ingredients filters: ${TILE}, ${LIST} The category is the department. ${MARKET} ${TWO}.`,
				routing: request('/api/v1/yesstyle/category'),
			},
			{
				name: 'Get Deals',
				value: 'deals',
				action: 'Get yesstyle deals',
				description: `The deal lists of ${FIRST}: Black Friday, flash sales, clearance, rock-bottom prices, price drops, new items 24-hour sale, value and gift sets, twin packs, on a department (default Beauty), ${FILTERS}: ${TILE}, ${LIST} Get Product adds a deal's sale_end_date and claimed share. Captured 2026-11-26: Black Friday on Beauty listed 151 products in the US, the first Dr. Althea 345 Relief Cream at US$ 18.90 (list price 27, 30% off). ${MARKET} ${TWO}.`,
				routing: request('/api/v1/yesstyle/deals', true),
			},
			{
				name: 'Get Markets',
				value: 'markets',
				action: 'Get yesstyle markets',
				description: `The shipping countries, currencies and languages of ${FIRST}: 153 countries with ISO-2 code, name, country_id, default currency, language, page_endpoints (served by search, category, brand, deals and product: 39) and held_back, plus currencies and languages. Currency follows the country. ${ONE}.`,
				routing: request('/api/v1/yesstyle/markets', true),
			},
			{
				name: 'Get Product',
				value: 'product',
				action: 'Get a yesstyle product',
				description: `One ${NAME} product by product ID or link: name, option, brand (name, brand_id, URL, region), description, about_brand, breadcrumbs, images, videos, price, list_price, discount_percent, currency, price_text, list_price_text, sale_end_date, deal_claimed_percent, deal_claimed_text, badges, availability, sellable, child_product_ids, rating, review_count, star_counts, brand_satisfaction, ingredients, ingredient_notes, bestseller_ranks, packs (minis, twin packs and bundles with price), product_information, shipping (to, free_shipping_offer, delivery_days), returns_days, no_refund_or_exchange, warning and coupon. Include Variants adds every shade and size with its own product_id, availability and price (variants_status unavailable: that part is not charged). Captured 2026-11-26: COSRX Advanced Snail 96 Mucin Power Essence 100ml (product ID 1052684694) at GBP 10.96 in the United Kingdom and JPY 2,497 in Japan. An unknown product is a charged not-found. ${MARKET} ${NOT_AVAILABLE} ${CHARGE} Costs 2 credits, 3 with Include Variants (credits_used says what was charged).`,
				routing: request('/api/v1/yesstyle/product'),
			},
			{
				name: 'Get Reviews',
				value: 'reviews',
				action: 'Get yesstyle reviews',
				description: `Customer reviews of one product family on ${FIRST}, 15 reviewers a page (up to 67 pages per sort and filter), four sorts and star, positive, negative, photo and video filters: reviews with review_id, product_id, rating, title, text, date (as YesStyle shows it), helpful_count, helpful_text, images, skin_type, skin_tone, reviewer_country, translatable and reviewer_group, plus the summary (total_reviews, star_counts, satisfaction_percent) on page 1. Reviewer names, gender and age are left out. Any of the 153 countries YesStyle ships to. Captured 2026-11-26: the COSRX Advanced Snail 96 Mucin Power Essence family had 30,843 reviews, 96.8% satisfaction. ${ONE}.`,
				routing: request('/api/v1/yesstyle/reviews'),
			},
			{
				name: 'Get Suggestions',
				value: 'suggestions',
				action: 'Get yesstyle search suggestions',
				description: `The search terms and products ${FIRST} suggests for typed text, priced for the shipping country (any of the 153 countries YesStyle ships to): suggestions and products (product_id, name, brand, price, list_price, discount_percent, currency, rating, review_count ...). ${ONE}.`,
				routing: request('/api/v1/yesstyle/suggestions'),
			},
			{
				name: 'Search Products',
				value: 'search',
				action: 'Search yesstyle products',
				description: `Search the catalog of ${FIRST} by keywords or a brand name, ${FILTERS}, on one department if given: ${TILE}, ${LIST} Captured 2026-11-26: "snail mucin" listed 422 products in the US; the first, COSRX Advanced Snail 96 Mucin Power Essence, at US$ 16.09 (list price 25, 36% off). Type, Region and Ingredients are not offered on search (YesStyle's search does not apply them). ${MARKET} ${NOT_AVAILABLE} ${TWO}.`,
				routing: request('/api/v1/yesstyle/search'),
			},
		],
		default: 'search',
	},
];

export const yesstyleFields: INodeProperties[] = [
	// -- Search Products --
	{
		displayName: 'Keywords',
		name: 'yesstyleQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'snail mucin',
		displayOptions: show(['search']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'Keywords or a brand name',
	},

	// -- Get Category Products --
	{
		displayName: 'Category ID or URL',
		name: 'yesstyleCategory',
		type: 'string',
		required: true,
		default: '',
		placeholder: '15556',
		displayOptions: show(['category']),
		routing: { request: { body: { category: '={{ String($value).trim() }}' } } },
		description:
			"A category ID (e.g. 15556 Face Serums, from breadcrumbs, category or a link's bcc.ID_bpt.46 part) or a yesstyle.com category link",
	},

	// -- Get Brand Products --
	{
		displayName: 'Brand ID or URL',
		name: 'yesstyleBrand',
		type: 'string',
		required: true,
		default: '',
		placeholder: '317041',
		displayOptions: show(['brand']),
		routing: { request: { body: { brand: '={{ String($value).trim() }}' } } },
		description: 'A brand ID (e.g. 317041 COSRX, from Get Brands or items[].brand_id) or a yesstyle.com brand link',
	},

	// -- Get Deals --
	{
		displayName: 'Deal',
		name: 'yesstyleDeal',
		type: 'options',
		default: 'black_friday',
		options: [
			{ name: 'Black Friday', value: 'black_friday' },
			{ name: 'Clearance', value: 'clearance' },
			{ name: 'Flash Sales', value: 'flash_sales' },
			{ name: 'New Items 24-Hour Sale', value: 'new_items_24hr_sale' },
			{ name: 'Price Drop', value: 'price_drop' },
			{ name: 'Rock-Bottom Prices', value: 'rock_bottom_prices' },
			{ name: 'Twin Packs and Bundles', value: 'twin_packs_bundles' },
			{ name: 'Value and Gift Sets', value: 'value_gift_sets' },
		],
		displayOptions: show(['deals']),
		routing: { request: { body: { deal: '={{ $value === "black_friday" ? undefined : $value }}' } } },
		description: 'The deal list (default Black Friday, while YesStyle runs it)',
	},

	// -- Get Product / Get Reviews --
	{
		displayName: 'Product ID or URL',
		name: 'yesstyleProduct',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1052684695',
		displayOptions: show(['product', 'reviews']),
		routing: productRefRouting,
		description:
			'A YesStyle product ID (items[].product_id; every shade and size has its own; for reviews any shade or size of the family) or a yesstyle.com product link (ending in /info.html/pid. and the ID).',
	},

	// -- Get Suggestions --
	{
		displayName: 'Text',
		name: 'yesstyleSuggestionsQuery',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'cosrx',
		displayOptions: show(['suggestions']),
		routing: { request: { body: { query: '={{ String($value).trim() }}' } } },
		description: 'What a shopper has typed (at least 2 characters)',
	},

	// -- Country --
	{
		displayName: 'Country',
		name: 'yesstyleCountry',
		type: 'options',
		default: 'us',
		options: PAGE_COUNTRIES,
		displayOptions: show(PAGE_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description:
			"The shipping country. YesStyle prices and stocks by shipping country, in that country's currency; 39 countries are served here (Brazil is held back).",
	},
	{
		displayName: 'Country',
		name: 'yesstyleAnyCountry',
		type: 'options',
		default: 'us',
		options: ALL_COUNTRIES,
		displayOptions: show(ANY_OPS),
		routing: { request: { body: { country: '={{ $value === "us" ? undefined : $value }}' } } },
		description: 'The shipping country: any of the 153 countries YesStyle ships to',
	},

	// -- Language --
	{
		displayName: 'Language',
		name: 'yesstyleLanguage',
		type: 'options',
		default: '',
		options: [{ name: "Country's Default", value: '' }, ...LANGUAGE_OPTIONS],
		displayOptions: show([...PAGE_OPS, ...ANY_OPS]),
		routing: { request: { body: { language: '={{ $value || undefined }}' } } },
		description:
			"Page language (default: the country's own on YesStyle, e.g. German for Germany, Arabic for Saudi Arabia, Chinese (Traditional) for Taiwan and Hong Kong, English for most)",
	},
	{
		displayName: 'Language',
		name: 'yesstyleMarketsLanguage',
		type: 'options',
		default: 'en',
		options: LANGUAGE_OPTIONS,
		displayOptions: show(['markets']),
		routing: { request: { body: { language: '={{ $value === "en" ? undefined : $value }}' } } },
		description: 'The language of the country, currency and language names',
	},

	// -- Additional Options --
	{
		displayName: 'Additional Options',
		name: 'yesstyleSearchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['search']),
		options: listOptions('yesstyleSearch', { categoryFilters: false, department: true }),
	},
	{
		displayName: 'Additional Options',
		name: 'yesstyleCategoryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['category']),
		options: listOptions('yesstyleCategory', { categoryFilters: true, department: false }),
	},
	{
		displayName: 'Additional Options',
		name: 'yesstyleBrandOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brand']),
		options: listOptions('yesstyleBrand', { categoryFilters: true, department: true }),
	},
	{
		displayName: 'Additional Options',
		name: 'yesstyleDealsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['deals']),
		options: listOptions('yesstyleDeals', { categoryFilters: true, department: true }),
	},
	{
		displayName: 'Additional Options',
		name: 'yesstyleBrandsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['brands']),
		options: [
			{
				displayName: 'Brand Name Contains',
				name: 'yesstyleBrandsQuery',
				type: 'string',
				default: '',
				placeholder: 'cosrx',
				description: "Brands whose link name contains this (accents, case and punctuation ignored)",
				routing: { request: { body: { query: '={{ String($value).trim() || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'yesstyleBrandsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Page, 1-based',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Page Size',
				name: 'yesstyleBrandsPageSize',
				type: 'number',
				default: 500,
				typeOptions: { minValue: 1, maxValue: 5000 },
				description: 'Brands a page, 1-5000',
				routing: { request: { body: { page_size: '={{ $value === 500 ? undefined : $value }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'yesstyleProductOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['product']),
		options: [
			{
				displayName: 'Include Variants',
				name: 'yesstyleIncludeVariants',
				type: 'boolean',
				default: false,
				description: 'Whether to also return every shade and size with its own product ID, availability and price (+1 credit: 3 in all)',
				routing: { request: { body: { include_variants: '={{ $value || undefined }}' } } },
			},
		],
	},
	{
		displayName: 'Additional Options',
		name: 'yesstyleReviewsOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['reviews']),
		options: [
			{
				displayName: 'Filter',
				name: 'yesstyleReviewsFilter',
				type: 'options',
				default: 'all',
				options: [
					{ name: '1 Star', value: '1' },
					{ name: '2 Stars', value: '2' },
					{ name: '3 Stars', value: '3' },
					{ name: '4 Stars', value: '4' },
					{ name: '5 Stars', value: '5' },
					{ name: 'All', value: 'all' },
					{ name: 'Negative', value: 'negative' },
					{ name: 'Photo', value: 'photo' },
					{ name: 'Positive', value: 'positive' },
					{ name: 'Video', value: 'video' },
				],
				description: 'Which reviews',
				routing: { request: { body: { filter: '={{ $value === "all" ? undefined : $value }}' } } },
			},
			{
				displayName: 'Include Summary',
				name: 'yesstyleReviewsSummary',
				type: 'boolean',
				default: false,
				description: 'Whether to also return the summary (total, star counts, satisfaction) on pages after the first',
				routing: { request: { body: { include_summary: '={{ $value || undefined }}' } } },
			},
			{
				displayName: 'Page',
				name: 'yesstyleReviewsPage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 67 },
				description: 'Page, 1-based (15 reviewers a page; up to 67 pages per sort and filter)',
				routing: { request: { body: { page: '={{ $value === 1 ? undefined : $value }}' } } },
			},
			{
				displayName: 'Sort',
				name: 'yesstyleReviewsSort',
				type: 'options',
				default: 'relevant',
				options: [
					{ name: 'Helpful', value: 'helpful' },
					{ name: 'Highest Rating', value: 'highest_rating' },
					{ name: 'Newest', value: 'newest' },
					{ name: 'Relevant', value: 'relevant' },
				],
				description: 'Review order',
				routing: { request: { body: { sort: '={{ $value === "relevant" ? undefined : $value }}' } } },
			},
		],
	},
];
