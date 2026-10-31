# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — a real-time structured-data API for search, AI assistant answers, retail, social, travel, real estate, jobs, app stores, software reviews, ad libraries, public company filings, and any URL — in your n8n workflows.

Scavio returns clean, structured JSON from 58 resources and 420 operations. Use it to power product research, price and review monitoring, AI agent retrieval, lead enrichment, competitive and ad intelligence, and content workflows.

[Installation](#installation) - [Operations](#operations) - [What changed in 0.13.0](#what-changed-in-0130) - [Per-resource notes](#per-resource-notes) - [Templates](#templates) - [Credentials](#credentials) - [Compatibility](#compatibility) - [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n: **Settings -> Community Nodes -> Install** -> enter `n8n-nodes-scavio`.

## Operations

### Search, retail, and marketplaces

| Resource | Credits | Operations |
| --- | --- | --- |
| [Google](https://scavio.dev/docs/search-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search, Custom Search (CSE Format), AI Mode, Maps Search, Maps Place Details, Maps Reviews, Shopping Search, Shopping Product, Shopping Product Stores, Flights Search, Hotels Search, Hotels Detail, News Search, Trends, Trending Now |
| [ChatGPT](https://scavio.dev/docs/chatgpt-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5 | Prompt |
| [Gemini](https://scavio.dev/docs/gemini-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5 | Prompt |
| [Amazon](https://scavio.dev/docs/amazon-product?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Offers |
| [Walmart](https://scavio.dev/docs/walmart-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1, or 2 on walmart.com.mx or when targeting one store | Search Products, Get Product, Get Reviews, Get Category Products, Get Buy Box Offer, Get Seller, Get Seller Products, [Get Stores](https://scavio.dev/docs/walmart-stores?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| [eBay](https://scavio.dev/docs/ebay-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Listing, Get Seller Profile |
| [Target](https://scavio.dev/docs/target-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Product, Get Reviews, [Get Store Availability](https://scavio.dev/docs/target-availability?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| [Home Depot](https://scavio.dev/docs/home-depot-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Reviews |
| [Costco](https://scavio.dev/docs/costco-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Products, Get Category Products, Get Deals and Find Clearance Items 2 in the United States; Get Warehouse Prices, Get Availability and Get Gas Prices scale with the number of warehouses | Search Products, Get Category Products, Get Categories, Get Products, Get Warehouse Prices, Get Availability, Get Reviews, Get Warehouses, Get Gas Prices, Get Coupon Book, Get Deals, Find Clearance Items, Get Search Suggestions |
| [HEB](https://scavio.dev/docs/heb-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Stores |
| [Kroger](https://scavio.dev/docs/kroger-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product |
| [Spec's](https://scavio.dev/docs/specs-product?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5 | Search Products, Get Product, Find Stores |
| [Lowe's](https://scavio.dev/docs/lowes-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Reviews 1 | Search Products, Get Product, Find Stores, Get Reviews |
| [Sam's Club](https://scavio.dev/docs/samsclub-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Clubs, Get Instant Savings, Get Category Products, Get Reviews |
| [Canadian Tire](https://scavio.dev/docs/canadiantire-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Availability, Find Clearance Items, Get Deals |
| [Dollar General](https://scavio.dev/docs/dollargeneral-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Deals, Get Coupons |
| [Mercado Libre (MX, BR, AR, CO)](https://scavio.dev/docs/mercadolibre-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Reviews 1 | Search Listings, Get Product, Get Reviews, Get Questions, Get Best Sellers |

### Social and video

| Resource | Credits | Operations |
| --- | --- | --- |
| [YouTube](https://scavio.dev/docs/youtube-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search and Search Shorts 2, Get Streams 3, Get Transcript 5 | Search, Search Shorts, Search Channels, Get Suggestions, Get Video, Get Metadata, Get Comments, Get Comment Replies, Get Transcript, Get Related, Get Channel, Get Channel Videos, Get Channel Shorts, Get Channel Community, Resolve Channel, Get Streams, Get Community Post, Get Community Post Comments |
| [Reddit](https://scavio.dev/docs/reddit-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Posts, Get Search Suggestions, Get Post, Get Post Comments, Get Comment Replies, Get Subreddit, Get Subreddit Posts, Get User, Get User Posts, Get User Comments, Get Popular, Get Trending, Search Comments, Search Subreddits |
| [TikTok](https://scavio.dev/docs/tiktok-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Get Profile, Get User Posts, Get Video, Get Video Comments, Get Comment Replies, Search Videos, Search Users, Get Hashtag, Get Hashtag Videos, Get User Followers, Get User Followings, Get Trending Searches, Get Trending Videos, Get Search Suggestions, Get Music, Get Music Videos, Search Music, Get Music Chart, Get Similar Creators, Get User Playlists, Get Playlist Videos, Get User Live Status, Get User Region |
| [TikTok Shop](https://scavio.dev/docs/tiktok-shop-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Search Suggestions, Get Product, Get Product Reviews, Get Categories, Get Category Products, Get Shop Products, Resolve URL |
| [Instagram](https://scavio.dev/docs/instagram-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1-2: Get Profile, Get User Reels, Get User Tagged and Get Music Posts 1, the rest 2 | Get Profile, Get User Posts, Get User Reels, Get User Tagged, Get User Stories, Get User Highlights, Get Highlight Stories, Get Similar Accounts, Get Post, Get Post Comments, Get Comment Replies, Get Post Likers, Search Users, Search Hashtags, Search Reels, Search Music, Get Music Posts, Search Locations, Get User Followers, Get User Followings |
| [X](https://scavio.dev/docs/x-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search, Get Tweet, Get Tweet Comments, Get Tweet Retweeters, Get User, Get User Tweets, Get User Replies, Get User Media, Get User Followers, Get User Followings, Get Trending, Search Communities, Get Community, Get Community Tweets |
| [LinkedIn](https://scavio.dev/docs/linkedin-person?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1, 10, or 30 by operation | Get Person, Get Person About, Get Person Posts, Get Company, Get Company Posts, Search Jobs, Get Job, Get Post, Get Post Comments |
| [Threads](https://scavio.dev/docs/threads-profile?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 by user ID, 4 by username | Get Profile, Get User Posts, Get User Replies, Get Post, Get Post Comments, Search Users |
| [Kuaishou (China)](https://scavio.dev/docs/kuaishou-profile?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1, 2, 10, or 40 by operation | Get Profile, Get User Posts, Get User Live Status, Resolve Share Link, Get Video, Get Video Comments, Get Comment Replies, Get Videos Batch, Search All, Search Videos, Search Users, Search Live Streams, Get Tag Feed, Get Trending |

### Real estate and travel

| Resource | Credits | Operations |
| --- | --- | --- |
| [Zillow](https://scavio.dev/docs/zillow-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Property, Get Agent Reviews |
| [Redfin](https://scavio.dev/docs/redfin-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Property, Get Market Stats |
| [Realtor.com](https://scavio.dev/docs/realtor-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Property, Get Location Suggestions, Get Market Stats, Search Agents, Get Agent Profile |
| [Rightmove (UK)](https://scavio.dev/docs/rightmove-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Look Up Locations, Search Listings, Get Property, Get Sold Prices, Get Sold Property, Search Agents, Get Agent Branch |
| [Booking.com](https://scavio.dev/docs/booking-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Properties, Get Hotel, Get Hotel Reviews |
| [Airbnb](https://scavio.dev/docs/airbnb-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Stays, Get Listing, Get Reviews |
| [Tripadvisor](https://scavio.dev/docs/tripadvisor-locations?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Resolve Location IDs, Search Locations, Get Location, Get Reviews |

### Local, jobs, and employers

| Resource | Credits | Operations |
| --- | --- | --- |
| [Yelp](https://scavio.dev/docs/yelp-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Businesses, Get Business, Get Reviews |
| [Indeed](https://scavio.dev/docs/indeed-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Jobs, Get Job, Get Company, Get Company Reviews |
| [Glassdoor](https://scavio.dev/docs/glassdoor-companies?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) || 2 | Search Companies, Get Company Profile, Get Reviews, Get Salaries |

### App stores, software, and business reviews

| Resource | Credits | Operations |
| --- | --- | --- |
| [Apple App Store](https://scavio.dev/docs/app-store-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Apps, Get App, Get Reviews |
| [Google Play](https://scavio.dev/docs/google-play-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Apps, Get App, Get Reviews |
| [G2 (Software Reviews)](https://scavio.dev/docs/g2-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5 | Search Products, Get Product, Get Reviews |
| [Capterra (Software Reviews)](https://scavio.dev/docs/capterra-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Reviews |
| [Trustpilot](https://scavio.dev/docs/trustpilot-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Businesses, Get Business Profile, Get Reviews, Get Categories, Get Category Businesses, Get Review |

### Ad libraries, filings, and any URL

| Resource | Credits | Operations |
| --- | --- | --- |
| [Google Ads Transparency](https://scavio.dev/docs/google-ads-advertisers?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Find Advertisers, Search Ads, Get Creative |
| [Meta Ad Library](https://scavio.dev/docs/meta-ads-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Ad Library, Get Advertiser Ads, Get Ad |
| [SEC EDGAR](https://scavio.dev/docs/sec-edgar-lookup?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Look Up Company, Get Company Profile, Get Filings, Get XBRL Concept, Get XBRL Facts Index, Search Filings Full Text |
| [Companies House (UK)](https://scavio.dev/docs/companies-house-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Companies, Get Company, Get Officers, Get Filing History |
| [Extract (Any URL)](https://scavio.dev/docs/extract?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 normal, 1 advanced, 2 ultra; crawl and batch bill that per successful page; Map Website 1; status and cancel free | Extract Page, Map Website, Start Crawl, Get Crawl Status, Cancel Crawl, Start Batch, Get Batch Status, Cancel Batch, Screenshot |
| Account | Free | Get Usage |

## What changed in 0.29.0

**New resources: Lowe's, Sam's Club, Canadian Tire and Dollar General, 21 operations.** Each returns prices and stock for the one store or club you choose. Nothing else changed.

- **Lowe's** (2 credits; Get Reviews 1): Search Products, Get Product, Find Stores and Get Reviews. Search and Get Product take a required **Store ID** and that store's **ZIP code**, both from Find Stores. Turn on **On Sale Only** in Search Products for the store's deals. Get Product adds on-hand stock per fulfillment method, stock at nearby stores, and aisle and bay.
- **Sam's Club** (1 credit): Search Products, Get Product, Find Clubs, Get Instant Savings, Get Category Products and Get Reviews. Search, Instant Savings and Category Products price a nearby club chosen by location (echoed in `club`); for a specific club, use Get Product with a **Club ID** from Find Clubs. Clearance is category `1150109`. `available_quantity` is capped at 8 (8 means 8 or more).
- **Canadian Tire** (1 credit): Search Products, Get Product, Find Stores, Get Availability, Find Clearance Items and Get Deals. Every operation except Find Stores takes a required **Store ID**. Get Availability prices and stocks up to 50 SKUs at one store in one call. Find Stores locates by postal code or coordinates, and with a SKU adds each store's stock and aisle for it. Prices differ by store and province, including Quebec.
- **Dollar General** (1 credit): Search Products, Get Product, Find Stores, Get Deals and Get Coupons. Find Stores with a **UPC** returns that product's unit count at up to 25 nearby stores in one call. Get Deals reads On Sale or Clearance (clearance items carry the current price only, no was-price). Get Coupons lists the current digital coupons.
- Canadian Tire and Dollar General return a rating and review count, not review text.

## What changed in 0.28.1

- Glassdoor operations now cost 2 credits per call, and usually answer in a few seconds.

## What changed in 0.28.0

- **Removed the Total Wine resource.** The Total Wine API was retired on 2026-10-30 and its endpoints now return 410. Spec's is unchanged.

## What changed in 0.27.1

- Credit costs: Total Wine is 10 credits per call and Spec's is 5 credits per call.

## What changed in 0.27.0

**New resources: Total Wine (10 credits) and Spec's (5 credits), 3 operations each.**

- **Total Wine & More:** Search Products, Get Product and Find Stores. Prices and stock are per store, so Search and Get Product take a required **Store ID** (from Find Stores, e.g. `503`). Results carry that store's price, units in stock, purchase limit and aisle; Get Product adds bay, shelf and last restock date.
- **Spec's** (Texas liquor chain): Search Products returns the online price, case price and promo flags. Get Product returns every Spec's store's price and stock in `store_prices` (about 200 stores) in one call; an optional **Store ID** (from Find Stores, by region) puts that store's price at the top.

## What changed in 0.26.3

- **HEB store targeting:** Search Products and Get Product take an optional **Store ID** (Additional Options), the `store_number` from Get Stores (e.g. `441`). Prices, stock, aisle location and search assortment then come from that store, echoed in `data.store`. With a Store ID, Get Product needs only `product_id` (no slug). US only, still 2 credits.
- HEB Search Products **Page Size** now applies (default 60).
- Includes the Decathlon Search + Get Product operations from 0.26.2, whose npm publish did not complete.

## What changed in 0.26.1

**New resources: HEB (3 operations) and Kroger (2 operations), 2 credits each.**

- **HEB** (Texas grocery chain): Search Products, Get Product (nutrition, ingredients, coupons, similar products) and Get Stores (by ZIP or city: address, hours, pharmacy, fulfillment channels). Pass `product_url` from search or `slug` + `product_id`.
- **Kroger** (operates Kroger, Ralphs, Fred Meyer, Harris Teeter, King Soopers, Fry's): Search Products and Get Product (nutrition facts, allergens, dietary flags, aisle location, stock, rating distribution). Pass `product_url` from search or `upc`.

## What changed in 0.26.0

**Target gained a Get Store Availability operation.** Give it a TCIN and a ZIP code and it returns in-store stock at every Target store nearby: units, in-store, pickup, curbside and ship-to-store status, distance, address and hours, up to 20 stores. Radius and a single Store ID are optional. 1 credit. The Store ID option on the other Target operations is now described as setting the store for prices only; it behaves exactly as before.

## What changed in 0.25.4

- Costco Search Products, Get Category Products, Get Deals and Find Clearance Items now cost 2 credits per call in the United States (Costco.ca and the other countries stay at 1). Descriptions updated to match.

## What changed in 0.25.3

- ChatGPT Prompt operation description now says 2 credits, matching the notice above the form.

## What changed in 0.25.2

- ChatGPT Prompt now costs 2 credits per answered prompt. Gemini stays at 5.

## What changed in 0.25.1

- ChatGPT Prompt now costs 1 credit per answered prompt (was 5). Gemini stays at 5.

## What changed in 0.25.0

- **New resources: ChatGPT and Gemini, one Prompt operation each, 5 credits.** Send a prompt and get the answer the assistant gives, for tracking which brands and pages AI assistants recommend. Both return one shape: `answer.markdown`, `sources[]` (ChatGPT adds title, publisher and date to each), `search_queries[]` (the web searches ChatGPT ran) and `shopping[]` (the products the answer recommends).
- ChatGPT takes a prompt up to 1024 characters plus optional `Model` (default `auto`), `Country` (default `us`) and `Include HTML`. Gemini takes a prompt up to 4000 characters.
- Answers typically take 10-40 seconds; both operations carry a 120-second request timeout. A failed prompt is not charged. A 503 means capacity is busy: wait for `Retry-After` and retry.

## What changed in 0.24.0

- **Google: Custom Search (CSE Format).** Returns the Google Custom Search JSON API response (`items[]` with `title`, `link`, `snippet`, `displayLink`; `searchInformation.totalResults`; `queries.nextPage`), so workflows built on Custom Search keep their downstream nodes. Takes the Custom Search parameter names: `q`, `num` (1-10), `start` (1-based), `gl`, `hl`, `lr`, `cr`, `safe`, `dateRestrict`, `siteSearch` + `siteSearchFilter` (enforced on the results), `exactTerms`, `excludeTerms`, `orTerms`, `fileType`. 1 credit. For the full SERP (knowledge graph, AI Overview, People Also Ask) keep using Search.

## What changed in 0.23.1

- Field descriptions say what each operation returns. No price, parameter or behavior changed.

## What changed in 0.23.0

**Instagram now costs 1-2 credits per call instead of 8-10, and gained 8 operations.** No field or operation was renamed; existing Instagram nodes keep running and simply cost less.

- **Prices.** Get Profile 1 credit. Get User Reels and Get User Tagged 1 (2 the first time a username is looked up). Get User Posts, Get User Stories, Get Post, Get Post Comments, Get Comment Replies, Get User Followers and Get User Followings 2 per call or page. Search Users and Search Hashtags 2, or 8 when you send a `Cursor`. Any Instagram call can occasionally cost more, up to 10, when a request needs extra work; the response's `credits_used` is the exact charge.
- **Stories and highlights.** Get User Highlights lists a user's story highlights (ID, title, cover, item count); Get Highlight Stories returns every story in one highlight with image and video URLs. 2 credits each.
- **Discovery.** Search Reels (keyword, cursor-paginated), Search Music (song or artist, returns the `Music ID` Get Music Posts takes), Get Music Posts (the Reels that use a track plus its total reel count, 1 credit per page), Search Locations (place ID, name, address, coordinates) and Get Similar Accounts (most creator accounts; some brand accounts return none). 2 credits each unless stated.
- **Engagement.** Get Post Likers returns up to about 1,000 accounts that liked a post, plus its total like count, by `Shortcode` or `URL`. 2 credits.

## What changed in 0.22.0

**Extract gained 7 operations: map a website, crawl it, and extract a list of URLs in one job.** Extract Page behaves as before; only its Mode option wording changed. Nothing else changed.

- **Map Website** returns a site's page URLs from its sitemaps and its start page, deduplicated, with optional `Search` text, include / exclude path globs, subdomains and a link cap (`Max Links`, sent as `limit`; API default 1,000; Free 500, PAYG 1,000, paid plans 5,000). Each link says whether it came from the sitemap or the page, with `lastmod` when the sitemap has one; `total_found` and `truncated` say whether there were more. 1 credit.
- **Start Crawl** extracts same-site pages breadth-first from one URL within `Max Pages` (API default 100), `Max Depth` (0-10, default 3) and path globs, and returns a job ID. URLs under the start path are crawled first. **Start Batch** extracts a list of URLs (one per line or comma-separated) as one job; invalid URLs are listed in the response and never billed.
- **Billing is per successful page** at the Extract price for the mode: Normal 1 credit, Advanced (renders JavaScript) 1, Ultra (the hardest pages) 2. Failed and skipped pages are free. Credits are taken page by page and a job stops cleanly with `stopped_reason: insufficient_credits` if the balance runs out.
- **Plan limits** (max pages per crawl / active jobs / URLs per batch): Free 10/1/10, PAYG 100/1/50, Project 500/2/100, Bootstrap 2,000/3/500, Startup 5,000/5/1,000, Growth 10,000/10/1,000. Starting a job past your active-job limit returns 429 with `Retry-After`.
- **Get Crawl Status / Get Batch Status** return progress (discovered, queued, succeeded, failed, skipped), credits used and the page results paged with `next_cursor` (`Results Per Page` 1-100, API default 25), optionally filtered by status or without content. **Cancel Crawl / Cancel Batch** stop a job; results so far stay available, and a finished job answers 409. Status and cancel are free. Results are kept for 3 days after a job finishes (2 MB per page, 250 MB per job); a job runs for at most 6 hours.
- **Wait for Completion** (off by default) on Start Crawl and Start Batch polls the job inside the node, every `Poll Interval` seconds (default 5) for up to `Max Wait` seconds (default 300, max 600), then returns the status and first page of results. If the wait runs out, the latest status comes back with `wait.timed_out: true` instead of an error; carry on with Get Status. The start response's fields, including `webhook_secret`, are kept under `created`. Large jobs are better run with the toggle off plus a Wait node, or a webhook.
- **robots.txt is always obeyed** for crawl and map. Batch reads each URL like Extract Page.
- **Webhook URL** (optional) receives a signed POST when a job completes, fails or is cancelled, retried after 30 seconds and 5 minutes. Verify the `Scavio-Signature: t=<unix>,v1=<hex>` header: HMAC-SHA256 of `<t>.<raw body>` with the `webhook_secret` returned once by the start operation. `Idempotency Key` makes a repeated start within 24 hours return the original job.

## What changed in 0.21.0

**19 new operations on TikTok, YouTube, Reddit and X, 1 credit each. YouTube Get Transcript now costs 5 credits (was 8).** Nothing else changed.

- **TikTok, 12 operations.** Get Trending Searches (about 90 terms, US-weighted) and Get Trending Videos (about 6 videos per call whatever `Count` says; run again for a fresh sample), neither with a region filter. Get Search Suggestions (long-tail keywords can come back empty and still bill). Sounds: Get Music, Get Music Videos (about 14 per page; `Count` is ignored upstream), Search Music and Get Music Chart (Top 50 or Viral 50, one global chart). Creators: Get Similar Creators (about 30 per page, page with `Page Token`), Get User Playlists and Get Playlist Videos (feed it the `mixId`). Get User Live Status (live room status 2 = live, 4 = not live; an unknown username is a billed 404) and Get User Region (the registered region, not nationality, plus `sec_user_id`; an unknown username is an unbilled 404).
- These TikTok operations return TikTok's own payload. Large numeric IDs can lose precision when read as JSON numbers, so map the string fields (`id_str`, `sec_uid`, `sec_user_id`) in later nodes.
- **YouTube, 2 operations.** Get Community Post (text, author, likes, images and a `comments_cursor`) and Get Community Post Comments.
- **Reddit, 2 operations.** Search Comments (each result carries the post and subreddit it was left on; sort by relevance, hot, top or new) and Search Subreddits (subscriber counts, NSFW flags).
- **X, 3 operations.** Search Communities, Get Community (description, member count, topic, rules) and Get Community Tweets (relevance or recency).

## What changed in 0.20.0

**New resource: Mercado Libre, 5 operations, 2 credits each (Get Reviews 1).** Plus one description fix on Realtor.com.

- **Search Listings** covers Mercado Libre in Mexico, Argentina and Colombia, and Mercado Livre in Brazil (`Country`; Chile is not supported). Pick `Search By`: keywords, a numeric seller ID (combines with keywords, filters, sort and paging), or a seller's public nickname (their first page of listings, unfiltered, plus the seller ID to go further). Filters for condition, min / max price in the local currency, minimum discount, free shipping, Full fulfillment, official stores and interest-free installments; sort by relevance or price only (Mercado Libre has no newest or best-selling sort). **About 48 listings per page and up to 42 pages, about 2,000 results per query**; slice by price range, condition or seller to reach more. Rows carry price, list price and discount, installments, shipping flags, a sponsored flag, rating, units sold as a range ("+500") and catalog IDs; seller name appears only where Mercado Libre shows it on the card.
- **Get Product** takes a catalog product ID, an item (listing) ID or a URL (`Look Up By`) and returns price, promotions, the buy-box seller with reputation, stock, shipping, variations, specs, the star distribution and categories. Only the buy-box seller is returned; the full list of sellers on a product is not available.
- **Get Reviews** returns 15 reviews per page, with an optional `Stars` filter (1 credit). Reviews translated by Mercado Libre keep the original text. **Get Questions** returns buyer questions with the seller's answers (answers are dated, questions are not); page with `Offset` from `next_offset`. **Get Best Sellers** returns the top 20 in a category for Mexico, Argentina or Colombia; **not available for Brazil**, and the category ID prefix must match the country.
- Brazil and Argentina may apply a "new" condition on their own for some queries; the response lists it in `auto_applied_filters`. A query with no results is an empty, billed 200. An unknown product, item or seller nickname answers 404 naming what was not found, billed like a normal call; so does a listing with no public questions.
- **Realtor.com `Keywords`**: the description now says what the filter does: a listing must match **all** the keywords, so each one narrows the results (one Portland search: `workshop` 421, `garage` 2,764, both together 338). Behaviour is unchanged.

## What changed in 0.19.0

**Two new resources: Realtor.com, 6 operations, and Rightmove (UK), 7 operations, 1 credit each.** Nothing else changed.

- **Realtor.com Search Listings** covers for-sale (default; includes pending and contingent, as on the site), pending, for-rent and sold listings. Pick `Search By`: a location (city, county, ZIP, state or neighborhood), coordinates plus a 0.1-50 mile radius, or one agent's listings. Filters for price, beds, baths, square feet, lot size, year built, garage, HOA, property types, listed / sold / price-cut within N days, `Keywords` matched in the listing text (comma-separated, up to 10), new construction, foreclosures and open houses, with 10 sorts. **Up to 200 listings per call** (`Page Size`, default 50). A search reaches its first 10,000 results, so `Page` x `Page Size` may not exceed 10,000; slice big areas by price band, property type or radius.
- **Sold prices are null in US non-disclosure states** (Texas, Utah, Wyoming, Alaska, Idaho, Kansas, Louisiana, Mississippi, Montana, New Mexico, North Dakota and parts of Missouri). Sold dates still come back.
- **Realtor.com Get Property** takes a property ID or a realtor.com URL (`Look Up By`) and returns price and tax history, three home value estimates with history and forecast, schools, flood / wildfire / noise risk, the listing agent and a mortgage estimate. Estimates, schools and risk can be null for land or new construction. **Get Location Suggestions** returns the `slug_id` that **Get Market Stats** takes (median list, sold and rent price, days on market, year-over-year change, by property type). **Search Agents** finds agents by city, ZIP code or name (one of the three, up to 50 per page); **Get Agent Profile** returns one agent with every review and four sub-ratings.
- **Rightmove Search Listings** covers UK property for sale or to rent. Pick `Search By`: a `location_id` from **Look Up Locations**, a place name (resolved to its first match and echoed back), or an agent branch. Filters for price (GBP; monthly rent on To Rent), beds, baths, property types, must-haves, exclusions, tenure, added within 1-14 days, under offer, radius, furnishing and let type, with 4 sorts. 24-25 per page, **up to 42 pages (about 1,000 listings) per search**. **There is no keyword filter on Rightmove**; match on `summary` and `key_features` in the results instead.
- **Rightmove Get Sold Prices** returns 25 addresses per page in England and Wales, each with its full sale history since 1995, plus an area summary; filter by property type, tenure, sold within 1-30 years and radius, up to 40 pages. **Get Sold Property** returns one address's every sale and its archived last listing. **Get Property** returns a live listing in full (tenure and lease, council tax band, service charge, EPC, floorplans, nearest stations); live listings carry no price history. **Search Agents** (20 branches per page, up to 50 pages) and **Get Agent Branch** (by branch ID or profile URL) round it out.
- `Property Types`, `Must Have`, `Exclude` and `Furnishing` are multi-selects; Realtor.com `Keywords` takes comma-separated values.
- An unknown property, agent, sold address or branch ID answers 404 naming what was not found, and is billed like a normal call. A removed Rightmove listing is a billed 404 too.

## What changed in 0.18.0

**New resource: Trustpilot, 6 operations, 2 credits each.** Nothing else changed.

- **Search Businesses** finds businesses by keyword in one country, up to 100 per page: name, domain, TrustScore, stars, review count, categories, website and address. Email and phone appear only when the business published them.
- **Get Business Profile** takes a domain or a Trustpilot URL (pick with `Look Up By`) and returns the whole profile: rating distribution, review languages, claimed and verification status, contact details, reply rate and days to reply on negative reviews, consumer alerts, similar businesses and the 20 newest reviews. The AI summary and topics come back in `Language` (default `en`) when Trustpilot has them for that language, null or empty otherwise.
- **Get Reviews** returns 20 reviews per page, filtered by stars, language (default all), date range, topics, text search, verified only and with replies, sorted by recency or relevance. `total_filtered` counts every match, so a date range doubles as review velocity. **Trustpilot serves up to 10 pages (200 reviews) per filter combination**; slice by stars, language, date range, topics or text search to reach more. `max_page` in the response says how far the current combination goes.
- **Get Categories** returns the full category tree (22 top-level categories and their subcategories), or the categories matching a name. **Get Category Businesses** ranks businesses in one category and country, 20 per page, with sort, `Min TrustScore` (3.0+, 4.0+ or 4.5+) and claimed-only filters. Trustpilot applies `Min TrustScore` to the star rating, which rounds the TrustScore, so a 3.8 passes 4.0+.
- **Get Review** returns one review by its 24-character `review_id`, with the business reply and the business it is about.
- `Stars` and `Topics` take comma-separated values. Topic IDs come from Get Business Profile's `topics`.
- An unknown domain, review ID or category ID answers 404 naming what was not found, and is billed like a normal call. There is no TrustScore history and no reviewer-profile operation.

## What changed in 0.17.1

Every request now identifies the node with `User-Agent: n8n-nodes-scavio/<version>` and `X-Client-Source: n8n-nodes-scavio`. No operation, parameter or output changed.

## What changed in 0.17.0

**New resource: Costco, 13 operations.** Nothing else changed.

- **Search Products**, **Get Category Products** and **Get Deals** share one set of filters: sort, brands, price range, minimum rating, on-sale, in-stock, page and page size. Set `Warehouse ID` to add that warehouse's in-store price, stock status and price code to every result.
- **Get Warehouse Prices** compares the online price with the in-warehouse price for up to 20 items at up to 10 warehouses: discount, final price, promotion start and end dates, per-order and per-member limits and price code. 1 credit for up to 9 warehouses, 2 at 10.
- **Get Availability** returns in-warehouse stock status for one item at up to 10 warehouses, plus pickup and same-day delivery. Status only, never quantities. 1 credit per 5 warehouses.
- **Get Gas Prices** returns regular, premium and diesel prices near a ZIP code or coordinates, or at specific warehouses. By location 1 credit (2 on Costco.ca); by warehouse IDs 1 credit per 5 warehouses (2 per warehouse on Costco.ca).
- **Get Coupon Book** returns the current member coupon book as data: item number, amount off, final price, scope, limits and valid dates. United States only, no parameters.
- **Find Clearance Items** scans a query or category at one warehouse for markdown price codes: `.97` clearance and `.00`/`.88` manager markdown by default, `.49`/`.79`/`.89` special buy on request. The codes are the member-community decode; Costco does not publish them, and only items Costco lists online are covered.
- **Get Products**, **Get Reviews**, **Get Categories**, **Get Warehouses** and **Get Search Suggestions** round out the catalog. Get Warehouses costs 2 credits on Costco.ca.
- `Item IDs`, `Warehouse IDs` and `Brands` take comma-separated values.
- `Country` is United States (default) or Canada everywhere except Get Coupon Book. Search Products, Get Products and Get Warehouses also accept the United Kingdom, Australia, Mexico, Japan, South Korea and Taiwan, with keyword, sort and paging only.

## What changed in 0.16.0

**Walmart store targeting is back, and Walmart gained a Get Stores operation.** This reverses the 0.13.0 note below that `Delivery ZIP` and `Store ID` were gone.

- **Get Stores** takes a `ZIP / Postal Code` (a 5-digit US ZIP, or a Canadian postal code such as `M5V 2T6` with `Domain` set to Walmart.ca) and returns the nearby stores, nearest first, with `store_id`, distance, address, coordinates and hours. 1 credit.
- **Search Products** and **Get Product** accept `Delivery ZIP` and `Store ID` under Additional Options. Set both together, with a `store_id` from Get Stores on the same domain, to get that one store's assortment, price and availability. The store used is echoed in `data.location`. Store-targeted calls cost 2 credits and take 10-60 seconds; the node allows them up to 120 seconds. walmart.com and walmart.ca only.
- **Get Product** accepts `Domain` (Walmart.com or Walmart.ca). Walmart.ca is only available together with `Store ID` and `Delivery ZIP`.
- `Device` remains retired.

## What changed in 0.13.0

**Twenty-two new resources, 91 new operations.** eBay, Target, Home Depot, Threads, Kuaishou, Zillow, Redfin, Booking.com, Airbnb, Tripadvisor, Yelp, Indeed, Glassdoor, Apple App Store, Google Play, G2, Capterra, Google Ads Transparency, Meta Ad Library, SEC EDGAR, Companies House and Extract are all new in this release. Nothing outside Walmart changed on the existing resources.

**Walmart went from 2 operations to 7 and its parameters changed.** Read the breaking-change block below before upgrading a workflow that uses Walmart.

**Extract is not a platform.** It takes any URL and returns raw HTML, readability Markdown, or plain text. `Mode` sets the price: Normal and Advanced are 1 credit, Ultra is 2. Nothing is billed unless the extraction succeeds, so a dead link, a bot wall, or a timeout is free.

### Walmart changed in 0.13.0 (breaking)

Walmart was rebuilt and gained five operations. Existing Walmart nodes keep running, but re-check them — three of these changes are silent and two return a 400.

- **`Delivery ZIP`, `Device` and `Store ID` are gone, silently.** Walmart retired them and they are no longer node parameters, so a saved value has nothing to send it and is dropped. A workflow that priced results against a ZIP or a store now gets Walmart's default location back, with no error to tell you. There is no replacement: the response reports the `location` it actually used.
- **`Start Page` is now `Page`, and this is the silent one that costs you data.** The old `start_page` field no longer exists on the node, so a saved value is never sent and every paginated Walmart node quietly resets to page 1. Re-open each Walmart Search node, add `Page` under Additional Options, and set it again.
- **`Domain` is now an enum and a saved value will 400.** It used to be free text defaulting to `walmart.com`. It is now `Walmart.com (United States)` / `Walmart.ca (Canada)` / `Walmart.com.mx (Mexico)`, sent as `com`, `ca` and `com.mx`. A node still holding `walmart.com` fails validation. It is also the price-bearing option: **walmart.com.mx costs 2 credits, walmart.com and walmart.ca cost 1.** It is offered on Search Products and Get Category Products only — those are the only two operations that accept it, and the only two that can cost 2.
- **`Fulfillment Speed` lost `Anytime` and `2 Days`, and a saved value will 400.** Only `Today` and `Tomorrow` remain. `2_days` leaked 3-to-4 day items and `anytime` was a no-op — and `anytime` was the *old default*, so any node where you added this option without changing it now sends a value the API rejects. Remove the option instead of setting it to "anytime".
- **`Domain`, `Delivery ZIP`, `Device` and `Store ID` are gone from Get Product entirely.** Get Product takes `Product ID` and nothing else. Walmart.ca product pages could not be fetched at all, which is why `Domain` is search-and-category-only.
- **`Sort By` gained values and lost none.** `Rating: High to Low` and `New` are new; the four you already had still work. This one is safe.
- **`Min Price` / `Max Price` are unchanged** but are now in the currency of the selected domain, not always USD.
- **Five new operations**: Get Reviews, Get Category Products, Get Buy Box Offer, Get Seller and Get Seller Products.
- **Get Buy Box Offer returns the winning offer only**, never the full offer list.
- **`Seller ID` must be the numeric catalog seller ID** (`seller_catalog_id` on products and offers). The GUID form of the seller identifier returns 404.
- **Get Seller Products does not paginate.** Roughly the first 40 server-rendered items come back; `total_count` reports the seller's real catalog size.

## Per-resource notes

Read these before you build. They are measured behaviours, not guesses.

### Start with a lookup

Several resources are keyed by identifiers that only exist inside the target site's own URLs. Each has a lookup operation — start there, then chain the ID it returns.

| Resource | Start here | It resolves |
| --- | --- | --- |
| Tripadvisor | Resolve Location IDs | A place name into the `geo_id` Search Locations takes, or the `geo_id` + `location_id` pair Get Location and Get Reviews take |
| Glassdoor | Search Companies | A company name into an `employer_id` |
| SEC EDGAR | Look Up Company | A ticker into a CIK (both fields accept either spelling, but the lookup is the reliable path) |
| Companies House | Search Companies | A company name into a company number |
| Google Ads Transparency | Find Advertisers | A brand name into an `advertiser_id` |
| Rightmove | Look Up Locations | A place, outcode, postcode or station into the `location_id` Search Listings and Search Agents take (a place name also works, resolved to its first match) |
| Realtor.com | Get Location Suggestions | A partial place name into the `slug_id` Get Market Stats takes |
| Mercado Libre | Search Listings | Keywords or a seller nickname into the `product_id`, `item_id`, `seller_id` and `category_id` the other operations take |

Kuaishou has the same shape for share links: **Resolve Share Link** turns a Kuaishou share URL into the user ID every other Kuaishou operation takes.

### Pagination

Do not assume an operation pages. Several deliberately do not, and the node only exposes a paging field where one really exists.

- **Page number**: Walmart Search / Reviews / Category, eBay Search, Target Search / Category, Home Depot Search / Reviews, Zillow Search, Redfin Search, Booking Search, Airbnb Search / Reviews, Tripadvisor Search / Reviews, Yelp Search / Reviews, Indeed Search / Company Reviews, Glassdoor Salaries, App Store Reviews, SEC Filings / Search, Companies House Search / Officers / Filing History, G2 Search / Reviews, Capterra Reviews, Trustpilot Search / Reviews / Category Businesses, Realtor.com Search / Agents, Rightmove Search / Sold / Agents, Mercado Libre Search / Reviews.
- **Cursor**: Threads User Posts / User Replies / Post Comments, all cursor-paginated Kuaishou operations, Airbnb Search, Google Play Reviews, Google Ads Search, Meta Ads Search / Advertiser Ads. Mercado Libre Get Questions pages by `Offset` (`next_offset` from the previous page).
- **No pagination at all**: every detail operation, plus **App Store Search** (raise `Limit`, up to 200 — every offset spelling is ignored), **Google Play Search** (one shelf of about 30 apps), **Capterra Search** (fixed at 20 results; `?page=2` returns identical rows), **Walmart Get Seller Products** (about 40 items), and **Glassdoor Get Reviews** (see below).
- **Airbnb Search takes either `Page` or `Pagination Cursor`, never both** — a request carrying both is rejected. The cursor wins.
- **Google Play's reviews cursor is opaque, single-use, and encodes the sort.** Send it back with the same `Sort` it came from.
- **Meta Ads pages are 30 ads on page 1, then 10 per page.** Each page is a credit, so depth costs roughly 10 ads per credit after the first page.

### Slow, gated, or expensive surfaces

- **Glassdoor is slow and flaky.** Per-attempt success was measured at 48% and per-call at 87%. A call typically takes 40 to 90 seconds; a failing one can run about 3 minutes before it answers 502. Raise the node timeout and retry on 502. **Get Reviews is capped at three reviews per response** by Glassdoor's login wall — there is deliberately no page field. Move the window with `Category` and `Employment Status`, and read `filtered_review_count` to see how many match. Addressing Get Reviews or Get Salaries by `Employer ID` needs an extra lookup; passing the `reviews_url` / `salaries_url` that Get Company Profile returns is the single-fetch path.
- **G2 is 5 credits, the highest on the node, and a blocked page bills you.** A blocked G2 page arrives as a billed 502. Retries are deliberately conservative. Get Product carries no review text — call Get Reviews for that.
- **Target is slow, not expensive.** Product about 4s, search about 9s, category about 37s, reviews about 40s, and a 502-then-retry was seen at 105s. Budget timeouts accordingly. **Get Reviews returns 8 review bodies maximum** regardless of `review_count`; `Max Review Bodies` only trims. `seller_*` is null for first-party stock, which is most of Target — null means "sold by Target", not "unknown".
- **Yelp Get Reviews page 1 is redundant.** It re-fetches the document Get Business already returned and costs another 2 credits. Start at page 2.
- **Capterra and Tripadvisor page 1 of reviews are already inside the detail call.** Use Get Reviews to page past it.
- **Trustpilot Get Reviews stops at page 10, 200 reviews per filter combination.** Different stars x language x date range combinations are separate sets, so slice to go deeper. Get Business Profile already carries the 20 newest reviews in its `Language`, so skip Get Reviews page 1 when that is all you need.
- **Realtor.com Search stops at 10,000 results per query** and **Rightmove stops at 42 search pages, 40 sold pages and 50 agent pages.** Slice by price band, property type or a smaller area to reach more.
- **Mercado Libre Search stops at 42 pages of about 48, about 2,000 results per query.** Slice by price range, condition or seller. Get Product is the slowest call, up to about 10 seconds.
- **Home Depot search page size is fixed at 12** and reviews are 30 per page; asking past `total_pages` is a 404.

### Silent-wrong-answer traps

These sites answer 200 with the wrong data rather than erroring, so the node closes the enum where it can. Where a value is a passthrough, treat an unexpected result as unfiltered rather than empty.

- **Zillow**: a bare ZIP works alone but cannot be combined with a filter or a sort — Zillow geolocates that request shape and answers about another city. Use the city name there. On `Listing Status = For Rent`, `Min Price` / `Max Price` mean **monthly rent**.
- **Realtor.com**: on Sold, `sold_price` is null in US non-disclosure states (Texas and the others listed under 0.19.0) while `sold_date` is set. A null price there means undisclosed, not an error.
- **Mercado Libre**: a query can be narrowed to a category, brand or line by Mercado Libre itself, and Brazil and Argentina may apply a "new" condition on their own. Check `auto_applied_filters` before treating a result set as complete. Units sold are ranges ("+500"), never exact counts.
- **Rightmove**: there is no keyword filter, so the node offers none. Get Property on a live listing carries no price history; use Get Sold Property for an address's past sales.
- **Redfin**: city names are not accepted on `Location`. Pass a redfin.com region URL (`/city/`, `/neighborhood/`, `/county/`, `/zipcode/`) or `Region ID` + `Region Type` together. `days_on_market` is always null on responses — do not build on it.
- **Booking.com**: `Check-In Date` and `Check-Out Date` must be sent together, or Booking prices its own default range and returns real prices for dates you never asked for. A search with neither destination nor destination ID returns Booking's homepage, costs a credit, and returns nothing.
- **Airbnb**: a dateless search defaults to +30 days / 5 nights and A/B tests both the window and the prices — the response flags this as `dates_are_defaulted`. **Get Listing has no price field**; nightly rates are search-only.
- **Indeed**: `Radius in Miles` and `Max Age in Days` are closed sets because Indeed ignores anything else and returns the unfiltered set. `Min Salary` filters on Indeed's own estimate for the role, so postings that publish no salary still match.
- **eBay**: `Results Per Page` accepts only 60, 120 or 240 — eBay silently falls back to 60 for anything else. `Get Seller Profile` is a profile, not a catalog; to list a seller's inventory use Search Listings with `Search By = Seller`, which works with no keyword. Turning on `Sold Listings` searches completed sales, and eBay publishes no headline count there, so `total_results` is null.
- **App Store**: `Country` decides price, currency, localised title, and whether the app is sold there at all. Get Reviews is numeric App ID only (Get App also accepts a bundle ID), cannot 404 — an unknown ID and a real app with zero reviews return the same empty feed — and hard-stops at page 10, which is 500 reviews per storefront.
- **Meta Ad Library**: `total_results` caps at 50000 with `total_is_capped: true`; Meta only reports ">50,000". Spend, reach, impressions and the paid-for-by disclosure are null on commercial ads — set `Ad Type` to political and issue ads to see them.
- **Google Ads Transparency**: impressions and reach are **EEA-only**, because that is where disclosure is legally compelled. US creatives return null there. The three ad-format sets are disjoint — an advertiser's text, image and video ads share no creatives. Totals come back as `total_ads_min` / `total_ads_max`; Google publishes a range, never an exact figure.
- **SEC EDGAR**: XBRL concept tags are case-sensitive (`netincomeloss` is a 404, `NetIncomeLoss` is a match) — use Get XBRL Facts Index to list what a filer actually reports. Full-text search coverage starts in 2001.
- **Companies House**: search is capped at page 50 — the register serves a 1000-result window per term whatever hit count it prints. Officers and filing history have no upper bound and answer an empty list past the last page, which is indistinguishable from a company with none.
- **Kuaishou reports its own failures inside HTTP 200 bodies**, which the API surfaces as a 502. A 502 on Get Video usually means a bad identifier, not an outage.
- **Threads Get Post Comments takes a post ID only, never a handle.** Address profiles and user feeds by user ID where you can: username lookups cost 4 credits instead of 2 because a handle needs a second lookup.

### What changed in 0.12.0

- **TikTok pagination works again.** `Cursor` was sent as a number on every paginated TikTok operation and the API rejected it with a 400. It is a string now. If you built an expression that fed a number into it, wrap it in `String()`.
- **TikTok `Sort By` lost its invented values.** User Posts is `Latest` / `Popular` and Search Videos is `Relevance` / `Most Liked`; the extra values never existed on TikTok and the old labels were wrong. A node saved with one of the removed values now falls back to `0`.
- **Eleven Google operations added**: Maps Place Details, Maps Reviews, Shopping Search, Shopping Product, Shopping Product Stores, Flights Search, Hotels Search, Hotels Detail, News Search, Trends and Trending Now. Existing Search, AI Mode and Maps Search nodes are untouched.
- **Walmart gained its real filters**: `Start Page` (the only Walmart pagination field), `Domain`, `Device`, `Fulfillment Type`, `Delivery ZIP` and `Store ID`, on Search and, where the API supports them, on Get Product. Most of these were retired again in 0.13.0 — see the breaking-change block above.
- **Reddit Get Post takes a post ID.** Pick `Post ID` or `Post URL` under `Lookup By`. It returns the post only; comments come from Get Post Comments.
- **Instagram follower and following lists accept up to 100 per page**, matching the API. Post, reel and tagged feeds stay capped at 50.

### Amazon changed in 0.10.0 (breaking)

The Amazon API now returns a clean normalized shape instead of a raw passthrough, and the node changed with it. Existing Amazon nodes keep running, but re-check them:

- **`Domain` is gone, replaced by `Country`.** The API wants an ISO 3166-1 alpha-2 marketplace code, not an `amazon.<suffix>` string. Two do not match their suffix: `amazon.com` is `us` and `amazon.co.uk` is `gb`. A saved `Domain` value is no longer sent, so a node that was set to `de` now returns the US marketplace until you set `Country` to Germany.
- **`Sort By` is gone.** The marketplace accepts every sort value and ignores all of them — `price-asc-rank`, `price-desc-rank`, `review-rank` and `date-desc-rank` all return the identical unordered set. It was a filter that did nothing, so it is no longer offered.
- **`Start Page` is now `Page`**, under Additional Options. One page per call, 1 credit per call.
- **`Min Price` and `Max Price` are gone.** They were never in the API request schema and the backend dropped them silently. Filter on `price` in a downstream node instead.
- **Response fields are renamed.** Products now expose `asin`, `title`, `url`, `image`, `price`, `currency`, `rating`, `reviews_count`, `is_sponsored`, `position`, `badge`, `sales_volume` and `delivery`. Expressions reading the old provider keys (`url_image`, `product_name`, `total_reviews`, `is_best_seller`, `buybox`) need updating.
- **`Get Offers` is new.** All seller offers for an ASIN — price, seller, condition, shipping, discount and which offer holds the buy box. 1 credit. Page 1 only: the response reports `has_more_pages`, but there is no verified way to request a later page.

### TikTok Shop

Two things to know about TikTok Shop before you build on it:

- **Get Product returns no price.** TikTok masks the price on the product page. Exact prices come from Search Products, Get Shop Products and Get Category Products.
- **Search Products -> Get Product is not a reliable pipeline.** Only about 44% of the product IDs returned by Search Products resolve on Get Product, because TikTok has no detail data for the rest. Those IDs answer with HTTP status `404` and this body:

  ```json
  { "error": "Product not found in this region.", "credits_used": 1, "credits_remaining": 997 }
  ```

  There is no `data` key on that response, so branch on the status code — never on a data field. A `404` here is a normal outcome, not an error: skip the item rather than retrying it.
- **Get Product Reviews still works for many IDs Get Product cannot resolve.** Measured on 8 IDs that 404 on detail, 8 of 8 returned HTTP 200 from Get Product Reviews and 7 of 8 carried at least one review. A measured sample rather than a guarantee, but reviews are worth one call before dropping the product.

## Templates

Ready-to-use workflow templates built on this node. Find them in the [n8n template library](https://n8n.io/workflows/) (search "Scavio"), or import the JSON directly in n8n via **Workflows -> Import from File**, then attach your Scavio API credential.

| Template | What it does | Product |
| --- | --- | --- |
| **Google Keyword Rank Tracker** | Daily organic rank tracking for your keywords into Google Sheets | [Google Search](https://scavio.dev/docs/search-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **YouTube Top Video Tracker** | Daily Slack digest of the top videos per keyword | [YouTube](https://scavio.dev/docs/youtube-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Amazon Price-Drop Alerts** | Email alerts when a watched Amazon product hits your target price | [Amazon](https://scavio.dev/docs/amazon-product?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Walmart Price-Drop Alerts** | Email alerts when a watched Walmart product hits your target price | [Walmart](https://scavio.dev/docs/walmart-product?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Reddit Brand Monitor** | Daily email digest of new Reddit mentions | [Reddit](https://scavio.dev/docs/reddit-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Instagram Competitor Monitor** | Track competitor Instagram posts and follower growth into Sheets | [Instagram](https://scavio.dev/docs/instagram-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Competitor Monitor** | Alert and log when tracked TikTok accounts post | [TikTok](https://scavio.dev/docs/tiktok-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Creator Analytics** | Track creator video performance over time | [TikTok](https://scavio.dev/docs/tiktok-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Hashtag Trends** | Log trending videos per hashtag | [TikTok](https://scavio.dev/docs/tiktok-hashtag-videos?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Instagram Engagement Rate Checker** | Weekly engagement rate per handle into Google Sheets | [Instagram](https://scavio.dev/docs/instagram-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Instagram Top Posts Ranker** | Rank a handle's recent posts by engagement | [Instagram](https://scavio.dev/docs/instagram-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Instagram Reels Performance Tracker** | Rank reels by views with average reach | [Instagram](https://scavio.dev/docs/instagram-user-reels?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Instagram New-Post Alerts** | Email the moment a watched handle posts | [Instagram](https://scavio.dev/docs/instagram-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Instagram Bio and Link Change Alerts** | Slack alert when a creator edits their bio or links | [Instagram](https://scavio.dev/docs/instagram-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Engagement Rate Checker** | Weekly engagement rate per handle into Google Sheets | [TikTok](https://scavio.dev/docs/tiktok-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Top Videos Ranker** | Rank a handle's recent videos by views | [TikTok](https://scavio.dev/docs/tiktok-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Bio and Link Change Alerts** | Slack alert when a creator edits their bio or link | [TikTok](https://scavio.dev/docs/tiktok-profile?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok Brand Deal and Collab Tracker** | Email when a creator starts a new brand collab | [TikTok](https://scavio.dev/docs/tiktok-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **TikTok New-Video Alerts** | Email the moment a watched handle posts a video | [TikTok](https://scavio.dev/docs/tiktok-user-posts?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Local Lead Finder** | Score local businesses with no website or weak reviews | [Google Maps](https://scavio.dev/docs/search-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |
| **Google AI Overview Citation Tracker** | Slack alert when your brand gains or loses an AI Overview citation | [Google Search](https://scavio.dev/docs/search-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) |

Get a free API key at [dashboard.scavio.dev/sign-up](https://dashboard.scavio.dev/sign-up?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — 50 credits to start.

## Credentials

You need a Scavio API key. Sign up at [scavio.dev](https://scavio.dev?utm_source=n8n-node&utm_medium=package&utm_campaign=readme), grab your key from the dashboard, and paste it into the `Scavio API` credential in n8n.

The credential test calls `GET /api/v1/usage` (free) so you get instant feedback that your key works.

## Compatibility

- Requires n8n version 1.0 or later.
- Tested against the Scavio API at `https://api.scavio.dev`. Google runs on v2 (`/api/v2/google/*`), every other product on v1 (`/api/v1/*`). The old `/api/v1/google` endpoint is retired and this node never calls it.
- Several of the new resources are deliberately slow (Glassdoor up to about 3 minutes on a failing call, Target reviews and category around 40 seconds). If you run them behind a queue or a short HTTP timeout, raise it.

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction?utm_source=n8n-node&utm_medium=package&utm_campaign=readme)
- [Scavio dashboard](https://dashboard.scavio.dev/sign-up?utm_source=n8n-node&utm_medium=package&utm_campaign=readme)
- [Compare Scavio vs alternatives](https://scavio.dev/compare?utm_source=n8n-node&utm_medium=package&utm_campaign=readme)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)


## About Scavio

[Scavio](https://scavio.dev?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) is a unified [search API for AI agents](https://scavio.dev/search-api-for-ai-agents?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — one API key, structured JSON. A real-time [Tavily alternative](https://scavio.dev/alternatives/tavily?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) and [SerpAPI alternative](https://scavio.dev/alternatives/serpapi?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) with data from:

- [Google Search API](https://scavio.dev/google-search-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — SERP results, news, images, maps, and knowledge graph
- [Amazon Product API](https://scavio.dev/amazon-product-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) and [Walmart Product API](https://scavio.dev/walmart-product-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — product search, details, reviews, categories, and sellers
- [Mercado Libre](https://scavio.dev/mercadolibre-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) (Mexico, Brazil, Argentina, Colombia) — listings, product detail, reviews, buyer questions, and best sellers
- eBay, Target, Home Depot and [Costco](https://scavio.dev/costco-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — marketplace listings, product detail, and customer reviews
- [YouTube API](https://scavio.dev/youtube-transcript-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme), [TikTok API](https://scavio.dev/tiktok-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme), and [Instagram API](https://scavio.dev/instagram-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — video and social media data
- [Reddit API](https://scavio.dev/reddit-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — posts and threaded comments
- [X API](https://scavio.dev/x-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) and [LinkedIn API](https://scavio.dev/linkedin-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — tweets, profiles, companies, jobs, and posts
- Threads and Kuaishou — profiles, feeds, comments, and search
- Zillow, Redfin, Booking.com, Airbnb and Tripadvisor — listings, properties, stays, and reviews
- [Realtor.com](https://scavio.dev/realtor-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) and [Rightmove](https://scavio.dev/rightmove-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — US and UK listings, sold prices (England and Wales for Rightmove), property detail, market stats, and agents
- Yelp, Indeed and Glassdoor — local businesses, job postings, employer reviews, and salaries
- Apple App Store, Google Play, G2 and Capterra — app and software listings with reviews
- ChatGPT and Gemini — the answer an AI assistant gives to a prompt, with cited sources and recommended products
- [Trustpilot](https://scavio.dev/trustpilot-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — business profiles, TrustScores, filtered reviews, and category rankings
- Google Ads Transparency and Meta Ad Library — live competitor ad creatives
- SEC EDGAR and Companies House — filings, XBRL financials, officers, and company registers
- [Extract](https://scavio.dev/docs/extract?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — any URL as HTML, Markdown, or plain text

Get a free [API key](https://dashboard.scavio.dev/sign-up?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) and explore the [documentation](https://scavio.dev/docs/introduction?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).
