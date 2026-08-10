# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev) — a real-time structured-data API for search, retail, social, travel, real estate, jobs, app stores, software reviews, ad libraries, public company filings, and any URL — in your n8n workflows.

Scavio returns clean, structured JSON from 33 resources and 190 operations. Use it to power product research, price and review monitoring, AI agent retrieval, lead enrichment, competitive and ad intelligence, and content workflows.

[Installation](#installation) - [Operations](#operations) - [What changed in 0.13.0](#what-changed-in-0130) - [Per-resource notes](#per-resource-notes) - [Templates](#templates) - [Credentials](#credentials) - [Compatibility](#compatibility) - [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n: **Settings -> Community Nodes -> Install** -> enter `n8n-nodes-scavio`.

## Operations

### Search, retail, and marketplaces

| Resource | Credits | Operations |
| --- | --- | --- |
| [Google](https://scavio.dev/docs/search-api) | 1 | Search, AI Mode, Maps Search, Maps Place Details, Maps Reviews, Shopping Search, Shopping Product, Shopping Product Stores, Flights Search, Hotels Search, Hotels Detail, News Search, Trends, Trending Now |
| [Amazon](https://scavio.dev/docs/amazon-product) | 1 | Search Products, Get Product, Get Offers |
| [Walmart](https://scavio.dev/docs/walmart-api) | 1, or 2 on walmart.com.mx | Search Products, Get Product, Get Reviews, Get Category Products, Get Buy Box Offer, Get Seller, Get Seller Products |
| [eBay](https://scavio.dev/docs/ebay-search) | 1 | Search Listings, Get Listing, Get Seller Profile |
| [Target](https://scavio.dev/docs/target-search) | 1 | Search Products, Get Category Products, Get Product, Get Reviews |
| [Home Depot](https://scavio.dev/docs/home-depot-search) | 2 | Search Products, Get Product, Get Reviews |

### Social and video

| Resource | Credits | Operations |
| --- | --- | --- |
| [YouTube](https://scavio.dev/docs/youtube-api) | 1 | Search, Search Shorts, Search Channels, Get Suggestions, Get Video, Get Metadata, Get Comments, Get Comment Replies, Get Transcript, Get Related, Get Channel, Get Channel Videos, Get Channel Shorts, Get Channel Community, Resolve Channel, Get Streams |
| [Reddit](https://scavio.dev/docs/reddit-api) | 1 | Search Posts, Get Search Suggestions, Get Post, Get Post Comments, Get Comment Replies, Get Subreddit, Get Subreddit Posts, Get User, Get User Posts, Get User Comments, Get Popular, Get Trending |
| [TikTok](https://scavio.dev/docs/tiktok-api) | 1 | Get Profile, Get User Posts, Get Video, Get Video Comments, Get Comment Replies, Search Videos, Search Users, Get Hashtag, Get Hashtag Videos, Get User Followers, Get User Followings |
| [TikTok Shop](https://scavio.dev/docs/tiktok-shop-search) | 1 | Search Products, Get Search Suggestions, Get Product, Get Product Reviews, Get Categories, Get Category Products, Get Shop Products, Resolve URL |
| [Instagram](https://scavio.dev/docs/instagram-api) | 1 | Get Profile, Get User Posts, Get User Reels, Get User Tagged, Get User Stories, Get Post, Get Post Comments, Get Comment Replies, Search Users, Search Hashtags, Get User Followers, Get User Followings |
| [X](https://scavio.dev/docs/x-search) | 1 | Search, Get Tweet, Get Tweet Comments, Get Tweet Retweeters, Get User, Get User Tweets, Get User Replies, Get User Media, Get User Followers, Get User Followings, Get Trending |
| [LinkedIn](https://scavio.dev/docs/linkedin-person) | 1, 10, or 30 by operation | Get Person, Get Person About, Get Person Posts, Get Company, Get Company Posts, Search Jobs, Get Job, Get Post, Get Post Comments |
| [Threads](https://scavio.dev/docs/threads-profile) | 2 by user ID, 4 by username | Get Profile, Get User Posts, Get User Replies, Get Post, Get Post Comments, Search Users |
| [Kuaishou (China)](https://scavio.dev/docs/kuaishou-profile) | 1, 2, 10, or 40 by operation | Get Profile, Get User Posts, Get User Live Status, Resolve Share Link, Get Video, Get Video Comments, Get Comment Replies, Get Videos Batch, Search All, Search Videos, Search Users, Search Live Streams, Get Tag Feed, Get Trending |

### Real estate and travel

| Resource | Credits | Operations |
| --- | --- | --- |
| [Zillow](https://scavio.dev/docs/zillow-search) | 1 | Search Listings, Get Property, Get Agent Reviews |
| [Redfin](https://scavio.dev/docs/redfin-search) | 1 | Search Listings, Get Property, Get Market Stats |
| [Booking.com](https://scavio.dev/docs/booking-search) | 1 | Search Properties, Get Hotel, Get Hotel Reviews |
| [Airbnb](https://scavio.dev/docs/airbnb-search) | 1 | Search Stays, Get Listing, Get Reviews |
| [Tripadvisor](https://scavio.dev/docs/tripadvisor-locations) | 2 | Resolve Location IDs, Search Locations, Get Location, Get Reviews |

### Local, jobs, and employers

| Resource | Credits | Operations |
| --- | --- | --- |
| [Yelp](https://scavio.dev/docs/yelp-search) | 2 | Search Businesses, Get Business, Get Reviews |
| [Indeed](https://scavio.dev/docs/indeed-search) | 2 | Search Jobs, Get Job, Get Company, Get Company Reviews |
| [Glassdoor](https://scavio.dev/docs/glassdoor-companies) | 1 | Search Companies, Get Company Profile, Get Reviews, Get Salaries |

### App stores and software reviews

| Resource | Credits | Operations |
| --- | --- | --- |
| [Apple App Store](https://scavio.dev/docs/app-store-search) | 1 | Search Apps, Get App, Get Reviews |
| [Google Play](https://scavio.dev/docs/google-play-search) | 2 | Search Apps, Get App, Get Reviews |
| [G2 (Software Reviews)](https://scavio.dev/docs/g2-search) | 5 | Search Products, Get Product, Get Reviews |
| [Capterra (Software Reviews)](https://scavio.dev/docs/capterra-search) | 2 | Search Products, Get Product, Get Reviews |

### Ad libraries, filings, and any URL

| Resource | Credits | Operations |
| --- | --- | --- |
| [Google Ads Transparency](https://scavio.dev/docs/google-ads-advertisers) | 1 | Find Advertisers, Search Ads, Get Creative |
| [Meta Ad Library](https://scavio.dev/docs/meta-ads-search) | 1 | Search Ad Library, Get Advertiser Ads, Get Ad |
| [SEC EDGAR](https://scavio.dev/docs/sec-edgar-lookup) | 1 | Look Up Company, Get Company Profile, Get Filings, Get XBRL Concept, Get XBRL Facts Index, Search Filings Full Text |
| [Companies House (UK)](https://scavio.dev/docs/companies-house-search) | 1 | Search Companies, Get Company, Get Officers, Get Filing History |
| [Extract (Any URL)](https://scavio.dev/docs/extract) | 1 normal, 1 advanced, 2 ultra | Extract Page |
| Account | Free | Get Usage |

## What changed in 0.13.0

**Twenty-two new resources, 91 new operations.** eBay, Target, Home Depot, Threads, Kuaishou, Zillow, Redfin, Booking.com, Airbnb, Tripadvisor, Yelp, Indeed, Glassdoor, Apple App Store, Google Play, G2, Capterra, Google Ads Transparency, Meta Ad Library, SEC EDGAR, Companies House and Extract are all new in this release. Nothing outside Walmart changed on the existing resources.

**Walmart went from 2 operations to 7 and its parameters changed.** Read the breaking-change block below before upgrading a workflow that uses Walmart.

**Extract is not a platform.** It takes any URL and returns raw HTML, readability Markdown, or plain text. `Mode` sets the price: Normal and Advanced are 1 credit, Ultra is 2. Nothing is billed unless the extraction succeeds, so a dead link, a bot wall, or a timeout is free.

### Walmart changed in 0.13.0 (breaking)

Walmart was rebuilt on a new upstream and gained five operations. Existing Walmart nodes keep running, but re-check them — three of these changes are silent and two return a 400.

- **`Delivery ZIP`, `Device` and `Store ID` are gone, silently.** They are retired upstream and are no longer node parameters, so a saved value has nothing to send it and is dropped. A workflow that priced results against a ZIP or a store now gets Walmart's default location back, with no error to tell you. There is no replacement: the response reports the `location` it actually used.
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

Five resources are keyed by identifiers that only exist inside the target site's own URLs. Each has a lookup operation — start there, then chain the ID it returns.

| Resource | Start here | It resolves |
| --- | --- | --- |
| Tripadvisor | Resolve Location IDs | A place name into the `geo_id` Search Locations takes, or the `geo_id` + `location_id` pair Get Location and Get Reviews take |
| Glassdoor | Search Companies | A company name into an `employer_id` |
| SEC EDGAR | Look Up Company | A ticker into a CIK (both fields accept either spelling, but the lookup is the reliable path) |
| Companies House | Search Companies | A company name into a company number |
| Google Ads Transparency | Find Advertisers | A brand name into an `advertiser_id` |

Kuaishou has the same shape for share links: **Resolve Share Link** turns a Kuaishou share URL into the user ID every other Kuaishou operation takes.

### Pagination

Do not assume an operation pages. Several deliberately do not, and the node only exposes a paging field where one really exists.

- **Page number**: Walmart Search / Reviews / Category, eBay Search, Target Search / Category, Home Depot Search / Reviews, Zillow Search, Redfin Search, Booking Search, Airbnb Search / Reviews, Tripadvisor Search / Reviews, Yelp Search / Reviews, Indeed Search / Company Reviews, Glassdoor Salaries, App Store Reviews, SEC Filings / Search, Companies House Search / Officers / Filing History, G2 Search / Reviews, Capterra Reviews.
- **Cursor**: Threads User Posts / User Replies / Post Comments, all cursor-paginated Kuaishou operations, Airbnb Search, Google Play Reviews, Google Ads Search, Meta Ads Search / Advertiser Ads.
- **No pagination at all**: every detail operation, plus **App Store Search** (raise `Limit`, up to 200 — every offset spelling is ignored), **Google Play Search** (one shelf of about 30 apps), **Capterra Search** (fixed at 20 results; `?page=2` returns identical rows), **Walmart Get Seller Products** (about 40 items), and **Glassdoor Get Reviews** (see below).
- **Airbnb Search takes either `Page` or `Pagination Cursor`, never both** — a request carrying both is rejected. The cursor wins.
- **Google Play's reviews cursor is opaque, single-use, and encodes the sort.** Send it back with the same `Sort` it came from.
- **Meta Ads pages are 30 ads on page 1, then 10 per page.** Each page is a credit, so depth costs roughly 10 ads per credit after the first page.

### Slow, gated, or expensive surfaces

- **Glassdoor is render-gated, slow, and flaky.** Per-attempt success was measured at 48% and per-call at 87%. A call typically takes 40 to 90 seconds; a failing one can run about 3 minutes before it answers 502. Raise the node timeout and retry on 502. **Get Reviews is capped at three reviews per response** by Glassdoor's login wall — there is deliberately no page field. Move the window with `Category` and `Employment Status`, and read `filtered_review_count` to see how many match. Addressing Get Reviews or Get Salaries by `Employer ID` costs two upstream fetches; passing the `reviews_url` / `salaries_url` that Get Company Profile returns is the single-fetch path.
- **G2 is 5 credits, the highest on the node, and a bot wall bills you.** g2.com charges upstream even for a hollow page, so a blocked fetch arrives as a billed 502. Retries are deliberately conservative. Get Product carries no review text — call Get Reviews for that.
- **Target is slow, not expensive.** Product about 4s, search about 9s, category about 37s, reviews about 40s, and a 502-then-retry was seen at 105s. Budget timeouts accordingly. **Get Reviews returns 8 review bodies maximum** regardless of `review_count`; `Max Review Bodies` only trims. `seller_*` is null for first-party stock, which is most of Target — null means "sold by Target", not "unknown".
- **Yelp Get Reviews page 1 is redundant.** It re-fetches the document Get Business already returned and costs another 2 credits. Start at page 2.
- **Capterra and Tripadvisor page 1 of reviews are already inside the detail call.** Use Get Reviews to page past it.
- **Home Depot search page size is fixed at 12** and reviews are 30 per page; asking past `total_pages` is a 404.

### Silent-wrong-answer traps

These sites answer 200 with the wrong data rather than erroring, so the node closes the enum where it can. Where a value is a passthrough, treat an unexpected result as unfiltered rather than empty.

- **Zillow**: a bare ZIP works alone but cannot be combined with a filter or a sort — Zillow geolocates that request shape and answers about another city. Use the city name there. On `Listing Status = For Rent`, `Min Price` / `Max Price` mean **monthly rent**.
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
- **Threads Get Post Comments takes a post ID only, never a handle.** Address profiles and user feeds by user ID where you can: username lookups cost 4 credits instead of 2 because a handle buys a second upstream call.

### What changed in 0.12.0

- **TikTok pagination works again.** `Cursor` was sent as a number on every paginated TikTok operation and the API rejected it with a 400. It is a string now. If you built an expression that fed a number into it, wrap it in `String()`.
- **TikTok `Sort By` lost its invented values.** User Posts is `Latest` / `Popular` and Search Videos is `Relevance` / `Most Liked`; the extra values never existed upstream and the old labels were wrong. A node saved with one of the removed values now falls back to `0`.
- **Eleven Google operations added**: Maps Place Details, Maps Reviews, Shopping Search, Shopping Product, Shopping Product Stores, Flights Search, Hotels Search, Hotels Detail, News Search, Trends and Trending Now. Existing Search, AI Mode and Maps Search nodes are untouched.
- **Walmart gained its real filters**: `Start Page` (the only Walmart pagination field), `Domain`, `Device`, `Fulfillment Type`, `Delivery ZIP` and `Store ID`, on Search and, where the API supports them, on Get Product. Most of these were retired again in 0.13.0 — see the breaking-change block above.
- **Reddit Get Post takes a post ID.** Pick `Post ID` or `Post URL` under `Lookup By`. It returns the post only; comments come from Get Post Comments.
- **Instagram follower and following lists accept up to 100 per page**, matching the API. Post, reel and tagged feeds stay capped at 50.

### Amazon changed in 0.10.0 (breaking)

Amazon moved to a new upstream provider, the API now returns a clean normalized shape instead of a raw provider passthrough, and the node changed with it. Existing Amazon nodes keep running, but re-check them:

- **`Domain` is gone, replaced by `Country`.** Upstream wants an ISO 3166-1 alpha-2 marketplace code, not an `amazon.<suffix>` string. Two do not match their suffix: `amazon.com` is `us` and `amazon.co.uk` is `gb`. A saved `Domain` value is no longer sent, so a node that was set to `de` now returns the US marketplace until you set `Country` to Germany.
- **`Sort By` is gone.** The marketplace accepts every sort value and ignores all of them — `price-asc-rank`, `price-desc-rank`, `review-rank` and `date-desc-rank` all return the identical unordered set. It was a filter that did nothing, so it is no longer offered.
- **`Start Page` is now `Page`**, under Additional Options. One page per call, 1 credit per call.
- **`Min Price` and `Max Price` are gone.** They were never in the API request schema and the backend dropped them silently. Filter on `price` in a downstream node instead.
- **Response fields are renamed.** Products now expose `asin`, `title`, `url`, `image`, `price`, `currency`, `rating`, `reviews_count`, `is_sponsored`, `position`, `badge`, `sales_volume` and `delivery`. Expressions reading the old provider keys (`url_image`, `product_name`, `total_reviews`, `is_best_seller`, `buybox`) need updating.
- **`Get Offers` is new.** All seller offers for an ASIN — price, seller, condition, shipping, discount and which offer holds the buy box. 1 credit. Page 1 only: the response reports `has_more_pages`, but there is no verified upstream param for a later page.

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
| **Google Keyword Rank Tracker** | Daily organic rank tracking for your keywords into Google Sheets | [Google Search](https://scavio.dev/docs/search-api) |
| **YouTube Top Video Tracker** | Daily Slack digest of the top videos per keyword | [YouTube](https://scavio.dev/docs/youtube-api) |
| **Amazon Price-Drop Alerts** | Email alerts when a watched Amazon product hits your target price | [Amazon](https://scavio.dev/docs/amazon-product) |
| **Walmart Price-Drop Alerts** | Email alerts when a watched Walmart product hits your target price | [Walmart](https://scavio.dev/docs/walmart-product) |
| **Reddit Brand Monitor** | Daily email digest of new Reddit mentions | [Reddit](https://scavio.dev/docs/reddit-api) |
| **Instagram Competitor Monitor** | Track competitor Instagram posts and follower growth into Sheets | [Instagram](https://scavio.dev/docs/instagram-user-posts) |
| **TikTok Competitor Monitor** | Alert and log when tracked TikTok accounts post | [TikTok](https://scavio.dev/docs/tiktok-user-posts) |
| **TikTok Creator Analytics** | Track creator video performance over time | [TikTok](https://scavio.dev/docs/tiktok-api) |
| **TikTok Hashtag Trends** | Log trending videos per hashtag | [TikTok](https://scavio.dev/docs/tiktok-hashtag-videos) |
| **Instagram Engagement Rate Checker** | Weekly engagement rate per handle into Google Sheets | [Instagram](https://scavio.dev/docs/instagram-api) |
| **Instagram Top Posts Ranker** | Rank a handle's recent posts by engagement | [Instagram](https://scavio.dev/docs/instagram-user-posts) |
| **Instagram Reels Performance Tracker** | Rank reels by views with average reach | [Instagram](https://scavio.dev/docs/instagram-user-reels) |
| **Instagram New-Post Alerts** | Email the moment a watched handle posts | [Instagram](https://scavio.dev/docs/instagram-user-posts) |
| **Instagram Bio and Link Change Alerts** | Slack alert when a creator edits their bio or links | [Instagram](https://scavio.dev/docs/instagram-api) |
| **TikTok Engagement Rate Checker** | Weekly engagement rate per handle into Google Sheets | [TikTok](https://scavio.dev/docs/tiktok-api) |
| **TikTok Top Videos Ranker** | Rank a handle's recent videos by views | [TikTok](https://scavio.dev/docs/tiktok-user-posts) |
| **TikTok Bio and Link Change Alerts** | Slack alert when a creator edits their bio or link | [TikTok](https://scavio.dev/docs/tiktok-profile) |
| **TikTok Brand Deal and Collab Tracker** | Email when a creator starts a new brand collab | [TikTok](https://scavio.dev/docs/tiktok-user-posts) |
| **TikTok New-Video Alerts** | Email the moment a watched handle posts a video | [TikTok](https://scavio.dev/docs/tiktok-user-posts) |
| **Local Lead Finder** | Score local businesses with no website or weak reviews | [Google Maps](https://scavio.dev/docs/search-api) |
| **Google AI Overview Citation Tracker** | Slack alert when your brand gains or loses an AI Overview citation | [Google Search](https://scavio.dev/docs/search-api) |

Get a free API key at [dashboard.scavio.dev/sign-up](https://dashboard.scavio.dev/sign-up) — 50 credits to start.

## Credentials

You need a Scavio API key. Sign up at [scavio.dev](https://scavio.dev), grab your key from the dashboard, and paste it into the `Scavio API` credential in n8n.

The credential test calls `GET /api/v1/usage` (free) so you get instant feedback that your key works.

## Compatibility

- Requires n8n version 1.0 or later.
- Tested against the Scavio API at `https://api.scavio.dev`. Google runs on v2 (`/api/v2/google/*`), every other product on v1 (`/api/v1/*`). The old `/api/v1/google` endpoint is retired and this node never calls it.
- Several of the new resources are deliberately slow (Glassdoor up to about 3 minutes on a failing call, Target reviews and category around 40 seconds). If you run them behind a queue or a short HTTP timeout, raise it.

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction)
- [Scavio dashboard](https://dashboard.scavio.dev/sign-up)
- [Compare Scavio vs alternatives](https://scavio.dev/compare)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)


## About Scavio

[Scavio](https://scavio.dev) is a unified [search API for AI agents](https://scavio.dev/search-api-for-ai-agents) — one API key, structured JSON, no scraping or proxies. A real-time [Tavily alternative](https://scavio.dev/alternatives/tavily) and [SerpAPI alternative](https://scavio.dev/alternatives/serpapi) with data from:

- [Google Search API](https://scavio.dev/google-search-api) — SERP results, news, images, maps, and knowledge graph
- [Amazon Product API](https://scavio.dev/amazon-product-api) and [Walmart Product API](https://scavio.dev/walmart-product-api) — product search, details, reviews, categories, and sellers
- eBay, Target and Home Depot — marketplace listings, product detail, and customer reviews
- [YouTube API](https://scavio.dev/youtube-transcript-api), [TikTok API](https://scavio.dev/tiktok-api), and [Instagram API](https://scavio.dev/instagram-api) — video and social media data
- [Reddit API](https://scavio.dev/reddit-api) — posts and threaded comments
- [X API](https://scavio.dev/x-api) and [LinkedIn API](https://scavio.dev/linkedin-api) — tweets, profiles, companies, jobs, and posts
- Threads and Kuaishou — profiles, feeds, comments, and search
- Zillow, Redfin, Booking.com, Airbnb and Tripadvisor — listings, properties, stays, and reviews
- Yelp, Indeed and Glassdoor — local businesses, job postings, employer reviews, and salaries
- Apple App Store, Google Play, G2 and Capterra — app and software listings with reviews
- Google Ads Transparency and Meta Ad Library — live competitor ad creatives
- SEC EDGAR and Companies House — filings, XBRL financials, officers, and company registers
- [Extract](https://scavio.dev/docs/extract) — any URL as HTML, Markdown, or plain text

Get a free [API key](https://dashboard.scavio.dev/sign-up) and explore the [documentation](https://scavio.dev/docs/introduction).
