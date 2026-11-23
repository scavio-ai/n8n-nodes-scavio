# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — a real-time structured-data API for search, AI assistant answers, retail, social, travel, real estate, jobs, app stores, software reviews, ad libraries, public company filings, and any URL — in your n8n workflows.

Scavio returns clean, structured JSON from 111 resources and 876 operations. Use it to power product research, price and review monitoring, AI agent retrieval, lead enrichment, competitive and ad intelligence, and content workflows.

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
| [Kroger, QFC and Fred Meyer](https://scavio.dev/docs/kroger-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Products and Get Product 2, Get Store Prices 3 | Search Products, Get Product, Get Store Prices, Find Stores, Get Category Products, Get Weekly Digital Deals, Get Coupons, Get Search Suggestions |
| [Publix](https://scavio.dev/docs/publix-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Categories, Get Weekly Ad, Get Extra Savings, Get Coupons, Search Savings, Get Order Ahead Menu, Find Stores, Get Search Suggestions |
| [IKEA](https://scavio.dev/docs/ikea-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (Compare Prices by Country: 1 per market) | Search Products, Get Product, Get Reviews, Get Category Products, Get Categories, Get Deals, Get Search Suggestions, Find Stores, Get Store Stock, Get Items, Compare Prices by Country, Get As-Is Offers |
| [Wayfair](https://scavio.dev/docs/wayfair-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Sale Events |
| [Ashley Furniture](https://scavio.dev/docs/ashley-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Search Products and Get Product 1 in Canada, the Philippines, Saudi Arabia and Turkey | Search Products, Get Product, Get Category Products, Get Deal Event Products, Find Stores, Get Store |
| [Maisons du Monde](https://scavio.dev/docs/maisonsdumonde-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Deals, Get Reviews, Find Stores, Get Store, Get Store Stock, Get Seller |
| [Spec's](https://scavio.dev/docs/specs-product?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5 | Search Products, Get Product, Find Stores |
| [Lowe's](https://scavio.dev/docs/lowes-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Reviews 1 | Search Products, Get Product, Find Stores, Get Reviews |
| [Sam's Club](https://scavio.dev/docs/samsclub-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Find Clubs 1 | Search Products, Get Product, Find Clubs, Get Instant Savings, Get Category Products, Get Reviews |
| [Canadian Tire](https://scavio.dev/docs/canadiantire-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Availability, Find Clearance Items, Get Deals |
| [Dollar General](https://scavio.dev/docs/dollargeneral-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Deals, Get Coupons |
| [Sephora](https://scavio.dev/docs/sephora-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Product |
| [Ulta Beauty](https://scavio.dev/docs/ulta-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Product, Get Store Availability |
| [ALDI](https://scavio.dev/docs/aldi-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores |
| [Instacart (US; Canada in English or French, except Search Across Stores and Get Reviews)](https://scavio.dev/docs/instacart-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Products 3 (2 when the page fits in the first answer); Search Across Stores 3 up to 5 stores, 4 for 6 to 10 | Get Retailers, Search Products, Search Across Stores, Get Product, Compare Prices Across Stores, Get Categories, Get Category Products, Get Deals, Find Pickup Stores, Get Suggestions, Get Reviews |
| [Micro Center](https://scavio.dev/docs/microcenter-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Stores 1 | Search Products, Get Product, Get Stores |
| [Walgreens](https://scavio.dev/docs/walgreens-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Store Stock 4 | Search Products, Get Product, Find Stores, Get Store Stock |
| [CVS](https://scavio.dev/docs/cvs-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Store Stock |
| [Whole Foods Market](https://scavio.dev/docs/wholefoods-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Deals, Get Product, Find Stores, Get Store, Get Sales Flyer |
| [Harbor Freight](https://scavio.dev/docs/harborfreight-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Find Clearance Items, Get Product, Get Prices, Find Stores, Get Availability, Get Reviews |
| [AutoZone (US; Brazil search, product and store stock; Mexico vehicles and stores)](https://scavio.dev/docs/autozone-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Brazil Search Products and Get Product 2; Get Store Stock (Brazil) 2 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Vehicles, Get Reviews, Find Stores, Get Store, Get Categories, Get Clearance, Get Rebates, Get Store Stock (Brazil) |
| [O'Reilly Auto Parts (US; Mexico store directory on Find Stores and Get Store)](https://scavio.dev/docs/oreilly-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Product by line code and part number 4; Cross-Reference Part Number 2 / 4 / 6 by inputs; Get Brand Products brand index 4; Get Store Stock and Find Stores by ZIP 4; Get Deals 4 | Search Products, Cross-Reference Part Number, Get Product, Get Vehicles, Get Compatibility, Get Category Products, Get Categories, Get Brand Products, Get Store Stock, Find Stores, Get Store, Get Suggestions, Get Rebates, Get Deals |
| [PetSmart](https://scavio.dev/docs/petsmart-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Store Stock, Get Availability, Get Deals |
| [Petco](https://scavio.dev/docs/petco-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Product, Find Stores, Get Store Inventory |
| [iHerb](https://scavio.dev/docs/iherb-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Prices, Get Reviews |
| [Chewy](https://scavio.dev/docs/chewy-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 10 | Search Products, Get Product |
| [Menards](https://scavio.dev/docs/menards-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | Search Products 2; Get Product 1, 2 with a Store ID; Find Stores 1 | Search Products, Get Product, Find Stores |
| [Nordstrom](https://scavio.dev/docs/nordstrom-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5; Get Availability and Get Reviews 10 | Search Products, Get Product, Get Reviews, Get Category Products, Get Brand Products, Find Stores, Get Availability, Get Search Suggestions |
| [Nordstrom Rack](https://scavio.dev/docs/nordstromrack-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5; Get Availability and Get Reviews 10 | Search Products, Get Product, Get Reviews, Get Category Products, Get Brand Products, Find Stores, Get Availability, Get Search Suggestions |
| [Best Buy](https://scavio.dev/docs/bestbuy-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Category Products 3 on a pcmcat page; Get Deal of the Day 3; Find Stores and Get Search Suggestions 1 | Search Products, Get Product, Get Reviews, Get Category Products, Get Deal of the Day, Find Stores, Get Availability, Get Search Suggestions, Get Prices |
| [TCGplayer](https://scavio.dev/docs/tcgplayer-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Listings, Get Price History, Get Recent Sales, Get Games, Get Sets, Get Price Guide, Get Search Suggestions, Get Trending Searches, Get Seller, Get Seller Feedback, Get Seller Products |
| [Nintendo eShop (46 countries)](https://scavio.dev/docs/nintendo-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Games, Get Product, Get Prices, Get Deals, Get Releases, Get DLC |
| [H&M (47 countries)](https://scavio.dev/docs/hm-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Product 2 | Search Products, Get Product, Get Stock, Find Stores, Get Category Products, Get Deals, Get New Arrivals, Get Search Suggestions, Get Production Info |
| [Zara (102 storefronts)](https://scavio.dev/docs/zara-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Product 2 to 6; Get Store Stock 4 by a point; Get Deals and Get New Arrivals 4; Get Prices by Country 2 per country; Get Search Suggestions 4 with the English fallback; China 1 | Search Products, Get Product, Get Materials, Get Stock, Find Stores, Get Store Stock, Get Categories, Get Category Products, Get Deals, Get New Arrivals, Get Prices by Country, Get Search Suggestions |
| [Uniqlo (41 countries)](https://scavio.dev/docs/uniqlo-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Store Stock 2 by product ID + colour + size; Get Prices by Country 1 per country | Search Products, Get Product, Get Stock, Get Store Stock, Find Stores, Get Reviews, Get Search Suggestions, Get Category Products, Get Deals, Get New Arrivals, Get Categories, Get Prices by Country |
| [ASOS (235 countries)](https://scavio.dev/docs/asos-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Stock, Get Reviews, Get Search Suggestions, Get Category Products, Get Categories, Get Brands, Get Deals, Get New Arrivals, Get Markets |
| [Fashion Nova (104 countries)](https://scavio.dev/docs/fashionnova-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Collection Products, Get Categories, Get Search Suggestions, Get Reviews, Get Similar Products (US) |
| [Macy's](https://scavio.dev/docs/macys-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Reviews, Get Category Products, Get Brand Products, Get Deals, Find Stores, Get Store Availability, Get Search Suggestions |
| [Saks Fifth Avenue](https://scavio.dev/docs/saks-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Deals, Find Stores, Get Store Availability, Get Search Suggestions, Get Designers |
| [Kohl's](https://scavio.dev/docs/kohls-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Find Stores 1 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Deals, Find Stores, Get Store Availability, Get Search Suggestions, Get Coupon Codes |
| [JCPenney](https://scavio.dev/docs/jcpenney-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Reviews, Get Questions, Get Category Products, Get Brand Products, Get Deals, Find Stores, Get Store Availability, Get Search Suggestions, Get Coupon Codes |
| [Dick's Sporting Goods](https://scavio.dev/docs/dicks-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Product and Get Reviews 2 | Search Products, Get Product, Get Products Summary, Get Reviews, Get Category Products, Get Brand Products, Get Deals, Get Store Availability, Get Search Suggestions |
| [Foot Locker (13 storefronts)](https://scavio.dev/docs/footlocker-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Deals, Get Release Calendar, Find Stores, Get Store Availability, Get Reviews, Get Questions |
| [Fanatics merchandise (8 storefronts + 4 US league stores)](https://scavio.dev/docs/fanatics-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Browse Listing, Get Deals, Get Reviews |
| [Argos (UK)](https://scavio.dev/docs/argos-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Store Stock, Get Stores, Get Reviews, Get Questions, Get Categories, Get Category Products, Get Deals, Get Search Suggestions |
| [Media Expert (Poland)](https://scavio.dev/docs/mediaexpert-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 to 3, actual cost: Get Store Stock and Get Categories 2; Search Products 3 (1 when Media Expert answers with a full category page); Get Category Products, Get Brand Products, Get Outlet, Get Marketplace Seller and a promotion list's products 1 unsorted, 3 sorted or lazily loaded; the rest 1 | Search Products, Get Product, Get Store Stock, Get Stores, Get Reviews, Get Category Products, Get Categories, Get Brands, Get Brand Products, Get Promotions, Get Outlet, Get Marketplace Seller, Get Search Suggestions |
| [Action (19 storefronts in 16 countries)](https://scavio.dev/docs/action-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Products by Article Number, Get Weekly Deals, Get Category Products, Get Categories, Get Brand Products, Get Own Brands, Get New Arrivals, Get Collection Products, Get Search Suggestions, Find Stores, Get Store, Get Reviews, Search Webshop, Get Webshop Product |
| [HEMA (Netherlands, Belgium, France, Germany; stores also Luxembourg and Austria)](https://scavio.dev/docs/hema-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Categories, Get New Arrivals, Get Sale Products, Get Weekly Offers, Get Campaign Products, Get Search Suggestions, Get Store Stock, Find Stores, Get Store, Get Reviews |
| [Carrefour (France; search and product also Argentina, Romania, Belgium)](https://scavio.dev/docs/carrefour-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Products and Get Product 2 on Belgium | Search Products, Get Product, Get Reviews, Get Category Products, Get Promotions, Get Search Suggestions, Find Stores, Get Store Availability, Get Store |
| [Allegro (Poland, Czechia, Slovakia, Hungary)](https://scavio.dev/docs/allegro-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Offers, Get Offer, Get Product, Get Product Offers, Get Seller Offers, Get Seller Feedback, Get Category Offers |
| [bol.com (Netherlands and Belgium)](https://scavio.dev/docs/bolcom-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Product by EAN 4 | Search Products, Get Product, Get Offers, Get Seller, Get Seller Products, Get Category Products, Get Brand Products, Get Deals, Get Campaign Products |
| [OLX Europe (Poland, Romania, Portugal, Bulgaria, Ukraine, Kazakhstan, Uzbekistan)](https://scavio.dev/docs/olx-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Ads, Get Ad, Get Seller, Get Seller Ads, Get Category Filters, Get Categories, Search Locations, Get Search Suggestions, Get Similar Ads |
| [Trendyol (Turkey plus 34 international storefronts)](https://scavio.dev/docs/trendyol-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Reviews, Get Questions, Get Seller, Get Deals, Get Coupons, Get Rankings, Get Search Suggestions, Get Delivery Estimate |
| [Vinted (27 country sites)](https://scavio.dev/docs/vinted-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Product, Get Seller, Get Seller Listings, Get Seller Feedback, Find Brands, Get Search Suggestions, Get Filter Options, Get Categories |
| [Mercari (US and Japan)](https://scavio.dev/docs/mercari-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Item, Get Category Listings, Get Categories, Get Brands, Get Brand Listings, Get Deals (US), Get Trending (US), Get Seller (Japan), Get Seller Reviews (Japan), Get Shop (Japan) |
| [Depop (9 markets)](https://scavio.dev/docs/depop-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Listings, Get Category Listings, Get Brand Listings and Get Explore Page 5 on New Zealand; Get Product 2 outside the US, 6 on New Zealand | Search Listings, Get Product, Get Category Listings, Get Brand Listings, Get Explore Page, Get Search Suggestions, Get Shop, Get Shop Listings, Get Shop Sold Listings, Get Shop Reviews, Search Shops, Get Categories, Get Brands, Get Similar Listings (US) |
| [Poshmark (US and Canada)](https://scavio.dev/docs/poshmark-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Sold Listings, Get Listing, Get Category Listings, Get Brand Listings, Get Closet, Get Closet Listings, Get Love Notes, Search Closets, Get Categories, Get Top Brands, Get Search Suggestions, Get Parties, Get Party Listings, Get Similar Listings |
| [thredUP (US store)](https://scavio.dev/docs/thredup-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Items, Get Sold Listings, Get Item, Get Category Listings, Get Brand Listings, Get Deals, Get Rescue Boxes, Get Categories, Get Brands, Get Search Suggestions, Get Trending Searches, Get Similar Items |
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
| [Company (Enrich)](https://scavio.dev/docs/company-enrich?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 10 from a website, 20 from a place ID; 1 when the listing has no readable website; unreachable sites free | Enrich |

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

## What changed in 0.76.0

**New resource: O'Reilly Auto Parts, 14 operations.** O'Reilly Auto Parts (oreillyauto.com), the US auto parts retailer: O'Reilly part-number cross-reference with prices. Another brand's, AutoZone's or an OE part number in, O'Reilly's matching parts out with price, core charge, rebates and pickup near a ZIP; plus the parts that fit a vehicle, VIN decode, store stock near a ZIP, full product detail with the rating and the 10 most recent reviews, the store directory (US and Mexico), rebates and deals. Pair it with the AutoZone resource for a two-store parts price check on the same part.

- **Country**: United States on every operation; Mexico (O'Reilly's Mexican store directory, in Spanish) on Find Stores and Get Store only. Mexico shows no prices.
- **Prices**: every price is O'Reilly's price for the store O'Reilly assigns to the request, named in priced_for. O'Reilly prices differ by store; there is no store or ZIP input for prices. core_charge is the refundable deposit O'Reilly adds on parts like batteries until the old part is returned.
- **Cross-Reference Part Number** maps another brand's or an OE part number to O'Reilly's parts (it can return 0 matches); when several manufacturers use the number, it answers the lists to choose from first. **Base Vehicle ID** (from Get Vehicles with Level Resolve) limits Search Products, Get Category Products and Get Brand Products to one vehicle at year / make / model level; Level VIN decodes a VIN. On Get Product, vehicle_fit.fits is true or null, never false.
- Lists return 24 a page and O'Reilly serves 20 pages. **Get Store Stock** reports availability states (in store now, store pickup, pickup time), not unit counts. **Get Product** returns the 10 most recent reviews, no paging.
- Not available: unit counts in store stock, a chosen store for prices, reviews past the 10 most recent, Q&A, Mexico prices or catalog, Canada, license-plate lookup, the weekly ad, repair guides, O'Reilly Pro / First Call Online pricing, price history, checkout.

Every O'Reilly operation costs 2 credits (Get Product by line code and part number 4; Cross-Reference Part Number 4 with only one of part type ID and manufacturer or when several manufacturers use the number, 6 with neither; the brand index 4; Get Store Stock and Find Stores by ZIP 4; Get Deals 4) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.75.0

**New resource: Instacart, 11 operations.** Instacart (instacart.com), the US and Canada grocery delivery and pickup marketplace: Instacart prices by store at a ZIP. Every store delivering to a ZIP with its pricing label, one product priced at every one of those stores, one query across up to 10 stores, and delivery, pickup or in-store prices side by side; plus a store's search, aisles, deals, pickup locations, suggestions and product reviews.

- **Country**: United States by default on every operation; Canada (instacart.ca, CAD, a postal code as ZIP) on every operation except Search Across Stores and Get Reviews. **Language** French (Canada) returns names, aisles and price text as Instacart shows them in Quebec; Get Suggestions is English only.
- **Prices**: every price is Instacart's price for that store, ZIP and service type, named in priced_for with the retailer's pricing label as Instacart shows it. Retailers set their Instacart prices, which can be above their in-store prices, so an Instacart delivery price is not the store's shelf price; Service Type In-Store returns Instacart's in-store prices where it shows them. Get Retailers marks no_markups (Instacart's "No markups" label) and EBT per store.
- **Compare Prices Across Stores** prices one product at every store delivering to the ZIP (Instacart delivery prices, low to high; no unit price or stock). Product IDs are the same at every store. **Search Across Stores** (US) prices one query at up to 10 stores, up to 20 items each.
- **Get Product**: ingredients, warnings / allergens as given, key nutrients as Instacart lists them, images, the store's price block and rating summary. **Get Deals**: the store's Sales collection (no coupons). **Find Pickup Stores**: pickup locations with 7 days of hours for the 5 nearest. **Get Reviews** (US): 15 a page, no reviewer identity.
- Not available: delivery and service fees or order minimums as numbers (Instacart shows them at checkout), coupons, Instacart+ member prices, account, order or cart data, price history.

Every Instacart operation costs 1 credit (Search Products 3, or 2 when the page fits in Instacart's first answer; Search Across Stores 3 for up to 5 stores, 4 for 6 to 10) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.74.0

**New resource: AutoZone, 12 operations.** AutoZone (autozone.com), the US auto parts retailer: AutoZone parts prices by vehicle, the parts that fit a year / make / model in a part type, with price, was price, deal price, core charge, warranty and pickup availability for the store AutoZone prices the request for; part-number cross-reference; full product detail with ratings; every review; the store directory; clearance and mail-in rebates; plus search, product and store stock at a chosen store on AutoZone Brazil.

- **Country**: United States by default on every operation; Brazil (BRL, Portuguese text) on Search Products, Get Product, Get Store Stock, Get Vehicles, Find Stores, Get Store and Get Categories; Mexico on Get Vehicles, Find Stores, Get Store and Get Categories only. Get Category Products, Get Brand Products, Get Reviews, Get Clearance and Get Rebates are US only.
- **Prices**: every price is AutoZone's price for the store AutoZone assigns to the request, named in priced_for. AutoZone prices differ by store, core charges too; there is no store or ZIP input in the US. core_charge is the refundable deposit AutoZone adds on parts like batteries until the old part is returned.
- **Get Category Products** with a vehicle year, make and model (names as Get Vehicles lists them) returns the parts that fit at year / make / model level; items AutoZone ties to an engine read NEEDS_BASE_VEHICLE. **Search Products** takes keywords, AutoZone part numbers and other brands' part numbers (cross-reference). Lists return the first 24 results with AutoZone's total, no paging: narrow with one filter, a price range or a sort.
- **Get Reviews** (US): 10 a page, full depth, sorts, a star filter, AutoZone's review summary, no reviewer identity. **Find Stores** walks states, cities and a city's stores; there is no stores-near-a-ZIP search. **Get Store Stock** is Brazil only.
- Not available: results past the first 24, stores near a ZIP, stock at a chosen US or Mexican store, search suggestions, VIN lookup, engine-level fitment, repair guides, AutoZonePro pricing, Mexico prices, price history, checkout.

Every AutoZone operation costs 1 credit (2 on Brazil Search Products and Get Product, and on Get Store Stock) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.73.0

**New resource: HEMA, 13 operations.** HEMA (hema.com), the Dutch variety store: HEMA store stock, the sellable units HEMA's store service reports per store for up to 12 articles near a city or postcode, with the stock level (full, regular or limited), in the Netherlands, Belgium, France, Germany, Luxembourg and Austria; each article's dated price schedule with upcoming promotions as HEMA writes them (e.g. 2+1 gratis); plus search, categories, new arrivals, sale, weekly offers, Christmas and Sinterklaas campaigns, suggestions, stores and HEMA's own product reviews.

- **Country** picks the webshop (Netherlands by default, Belgium, France, Germany), with a **Language** for Belgium (Dutch or French). Luxembourg and Austria have HEMA stores but no webshop: Get Store Stock, Find Stores and Get Store serve them. Prices come in EUR; names, labels and promotion texts in the market's language, as HEMA writes them. Article numbers are the same in every market and prices are set per market; HEMA notes that online prices can differ from store prices.
- **Get Store Stock** answers, per store, the sellable units and stock level as HEMA's store service reports them (not a promise that the shelf has it), with shelf locations, hours and distance. **Get Product** returns the EAN, variants and the dated price schedule, upcoming promotions included. **Get Weekly Offers** (Netherlands, Belgium) returns HEMA's validity label, the ISO date, the week and the promotion cards. **Get Reviews** reads HEMA's own reviews (the Netherlands, France and Germany share the Dutch pool; Belgium has its own), with no reviewer identity.
- No brands operation (HEMA sells its own brand). Not available: price history, checkout or ordering, the photo service and cake ordering, other countries.

Every HEMA operation costs 1 credit and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.72.0

**New resource: Action, 16 operations.** Action (action.com), the European non-food discount store, on 19 storefronts in 16 countries: this week's Action deals with their validity dates and week id, the same article's price on each storefront (one article number everywhere, priced per market), and the stores near a city or postcode with opening hours; plus search, products, categories, own brands, new arrivals, seasonal collections (Black Friday included), suggestions, reviews and the shop.action.com webshop.

- **Country** picks the storefront (Netherlands by default, Belgium, France, Luxembourg, Germany, Austria, Switzerland, Italy, Spain, Portugal, Poland, Czechia, Slovakia, Romania, Croatia, Slovenia), with a **Language** for Belgium (Dutch or French) and Switzerland (German, French or Italian). Prices come in the market's currency (EUR, CHF, PLN, CZK, RON), never converted; titles and labels in the storefront's language, as Action writes them.
- **Get Weekly Deals** returns week_id (e.g. Promo2026Week47), Action's validity label and ISO valid_from / valid_to dates; a deal week runs Wednesday to Tuesday and the assortment changes weekly. Belgium adds Action Plus loyalty-card deals. **Get Products by Article Number** prices up to 60 article numbers on one market per call: run it once per country to compare.
- **Find Stores** answers the 20 nearest stores (they may cross a border) with 7 dated days of opening hours. Action does not publish store stock. **Get Reviews** serves the Netherlands, Germany, France and Poland only, with Local, International or All scope and no reviewer identity. **Search Webshop** and **Get Webshop Product** read shop.action.com (Netherlands and Belgium): EAN, online stock level (not store stock), order limit and shipping cost.
- Not available: store stock, price history, leaflets, checkout, other countries.

Every Action operation costs 1 credit and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.71.0

**New resource: Media Expert, 13 operations.** Media Expert Black Week prices, the Omnibus 30-day low and store stock (mediaexpert.pl, Poland, PLN): for any product the price, the old price, the lowest price of the last 30 days that Media Expert shows next to a promotion (EU Omnibus Directive) and the code price with its code and dates, plus Media Expert's stock indicator at the stores nearest a Polish city or postcode; and search, categories, brands, promotions (Black Weeks included), outlet, marketplace sellers, reviews, stores and suggestions.

- **Get Store Stock** takes a product ID (items[].product_id, not the offer ID) and a Polish city, town or postcode, and answers up to 40 stores, nearest first, with stock_level (Media Expert's stock indicator, a bucket such as 0, 2, 9 or 20, not a unit count), in_stock, collect_in_1h (pickup within an hour) and order_to_store_day when the item is not on the shelf. Marketplace items are never stocked in stores (a charged 400).
- Billed on actual cost, 1 to 3 credits per call (credits_used reports each one). There is no Country: one Polish store. Names, specifications, labels and reviews are in Polish, as Media Expert writes them.
- **Search Products** and the list operations return 30 per page by default (up to 50), up to page 100; Media Expert stops counting at 5,000 (total_capped). Price sorts are Media Expert's own order, which follows promotional and code prices. There is no price filter.
- **Get Reviews**: Media Expert's own reviews by SKU, product ID or link, up to 100 per page, six sorts, a star range and a verified-purchase filter, with verified_purchase and incentivized (a review from a Media Expert promotional campaign) flags; no reviewer identity. Not available: Q&A (Media Expert has none), leaflets, price history, unit counts, checkout prices.

Every Media Expert operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged. Also in 0.71.0: the Argos Trusted Seller delivery copy (delivery fields are null; the seller sets delivery).

## What changed in 0.70.1

Argos descriptions follow the API: delivery `later` is Argos's "Delivery within N days", with the new days field; Search Products, Get Category Products and Get Deals return total_capped (Argos stops counting at 10,000); store types are defined (a collection point is collect-only, inside_sainsburys is an Argos counter inside a Sainsbury's store); product rating is null without reviews and badges come one per code; phones read +44...; a postcode that does not exist ends in an unbilled 502 after about 50 seconds; Trusted Seller items carry null delivery fields (the seller sets delivery and Argos shows no charge). Nothing else changed.

## What changed in 0.70.0

**New resource: Argos, 10 operations.** Argos store stock, prices and reviews (argos.co.uk, UK, GBP): which Argos stores near a UK postcode can hand over one or more products and whether they can be delivered to a postcode, next to price, was price, offers and badges; plus search, categories, deal collections, product detail, reviews, Q&A and stores. Every operation costs 2 credits. Nothing else changed.

- **Get Store Stock** takes 1 to 10 product ids and a UK postcode (up to 10 stores within 50 miles). Each store answers a state per product: collect_now, collect_today, collect_tomorrow, collect_later, out_of_stock or not_available, with available_from; delivery answers same_day (Fast Track), next_day, later, out_of_stock or not_available. Availability states, not unit counts. **Delivery Postcode** (default: Postcode) is where delivery is checked. Trusted Seller items are never stocked in stores.
- Prices are numbers in GBP as Argos shows them: price, was_price, save (computed by Scavio as was_price - price), offer_text (the site's own words) and badges as given. seller is argos or trusted_seller (Argos's marketplace). There is no Country: one UK store (Argos Ireland closed in 2023).
- **Search Products**, **Get Category Products** and **Get Deals** return 24 per page, pages 1 to 200; Top 100 is 2 pages of 60. Tu Clothing items are left out and counted in tu_clothing_excluded.
- **Get Reviews**: up to 100 per page, five sorts and a star filter, syndicated reviews flagged with their source, and Argos's own AI-generated review summary labelled as such; no reviewer names, locations, ages or genders. Not available: unit counts, price history, a brand directory (brand is a filter), Argos Ireland, card or checkout prices, Argos Pay terms.

Every Argos operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.69.1

Fashion Nova descriptions follow the API: Get Collection Products pages 1 to 166 (a collection lists up to about 10,000 products; dedupe by product_id + color across pages), items and products carry code_lowers_price (price_with_code is 40% off the compare-at price and can be at or above the listed price), reviews are per style and mostly English, total_pages is approximate, and brand is the store's vendor field. Nothing else changed.

## What changed in 0.69.0

**New resource: Fashion Nova, 7 operations.** Fashion Nova sale prices in 104 countries: each style's price, compare-at (struck-through) price, percent off, final-sale flag and per-size stock in the storefront's own currency; search, collections (sale, best sellers, new, back in stock) to full depth, product detail with every colour and size, the navigation tree, search suggestions, reviews and similar styles. Every operation costs 1 credit. Nothing else changed.

- **Country** picks the storefront (default United States; 104 in all, 37 currencies; International is the site's International storefront in USD) on Search Products, Get Product and Get Collection Products. **Language** is English (default) or Spanish (67 countries; not the United States). A country or language Fashion Nova does not run answers 400 before anything is charged. Get Categories and Get Search Suggestions are the same in every storefront, Get Reviews is one English review pool for every market, and Get Similar Products answers from the US store in USD.
- percent_off is computed by Scavio from the price and the compare-at price. In the 27 EEA countries Fashion Nova shows VAT-inclusive prices and no compare-at price, so compare_at and percent_off are null there. Size quantities are the stock the page shows, not a guaranteed inventory count.
- **Search Products** is semantic: its total moves between calls, a later page can repeat a few items, and it shows its first 18 pages of 60 (6 under a sort other than Featured). **Get Collection Products** pages through fully (pages 1 to 200). A facet the list does not offer matches nothing and is listed in unrecognized_filters.
- **Get Reviews**: 10 per page, pages 1 to 8, four sorts and a star filter; no reviewer names. **Get Product** carries site_ai_review_summary, Fashion Nova's own AI summary of its reviews. Not available: stores, a brand directory, price history, gift cards, new-arrival dates.

Every Fashion Nova operation carries a 240-second request timeout (review calls take 20 to 60 seconds). Failed calls are not charged; a not-found is charged.

## What changed in 0.68.0

**New resource: thredUP, 12 operations.** thredUP prices on thredUP's US store (thredup.com, USD; thredUP ships to the US and Canada from it, so there is no country input): each item's price, the estimated original retail and % off, condition and the flaws thredUP noted, measurements, materials and who priced it; search, sold listings, category, brand and deal grids (Clearance, Under $10, New Arrivals, Price Drops), Rescue boxes, categories and filter values, the brand directory, search suggestions, trending searches and similar items. Every operation costs 1 credit. Nothing else changed.

- estimated_retail is the estimated original retail: thredUP's own estimate on items thredUP prices, entered by the seller on Direct Listing items. percent_off is computed from the price and the estimated retail, null when the estimated retail is missing or not above the price. seller_type is thredup, direct_listing (peer sellers) or dropship (partner listings).
- List operations answer 119 items per page, pages 1 to 21 (about 2,500 items per query and filter combination); total caps at 10,000 (total_capped true means 10,000+). Free text is matched loosely (semantic): use the Brand option for one brand. Size IDs come from Get Categories, not labels. The price filter is approximate (thredUP matches a base price). Every answer reports the sort applied.
- **Get Sold Listings** takes filters only (Brand and / or Category, no keyword), with the price the item last listed at; thredUP shows no sold date.
- thredUP has no men's department. Not available: product reviews (thredUP shows none), seller shops, sold dates, men's clothing, price history. No seller or consignor names or IDs are returned.

Every thredUP operation carries a 240-second request timeout (list calls take 15 to 45 seconds). Failed calls are not charged; a not-found is charged.

## What changed in 0.67.0

**New resource: Poshmark, 15 operations.** Poshmark sold prices on poshmark.com (US, USD) and poshmark.ca (Canada, CAD): sold listings by keyword with the price shown on the sold listing and the date Poshmark marked it sold, filtered by brand, department, category, size, condition, colour and price; active listings with the original price the seller entered and price drops; closets with items sold, closet listings and Love Notes; plus categories, top brands, search suggestions, Posh Parties and similar listings. Every operation costs 1 credit. Nothing else changed.

- **Country**: United States (default, USD) or Canada (CAD); both storefronts are English. Search Listings, Get Sold Listings, Get Category Listings, Get Brand Listings, Get Top Brands, Get Search Suggestions, Get Parties, Get Party Listings and Get Similar Listings return that market's own listings in its currency. Listing IDs and closets are global: a listing opens from either market in its own currency (no conversion), and closet listings are read in the seller's home market.
- **Get Sold Listings** reaches up to 480 sold listings per query and filter combination (10 pages of 48, Poshmark's own limit): narrow with filters or split by price range to reach more. On a sold listing, price is the price shown on the sold listing (Poshmark says a sold listing reflects the final order price; offers are private and not returned) and sold_at is the date Poshmark marked it sold.
- original_price is the original price the seller entered; first_price is the price it was first listed at, which can be below price when the seller raised the price. Search Listings reaches about 5,000 listings per query (105 pages of 48); total is Poshmark's approximate count.
- **Get Love Notes** returns the latest 100 Love Notes with the closet's total count, with no authors. Seller usernames only: no real names, cities, likers or comment authors.
- Not available: sold results beyond 480 per query and filter combination, Love Notes beyond the latest 100, Posh Shows, trending searches, the full brand directory (top 50; brand inputs take any name), offers, bundles, price history.

Every Poshmark operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.66.1

Depop descriptions follow the API: list items carry buyer_market_price and no seller country (Get Product has seller.country), Get Shop Sold Listings status is sold or marked_as_sold, and price wording (total is Scavio's sum of the parts, headline_price Depop's own headline). Nothing else changed.

## What changed in 0.66.0

**New resource: Depop, 14 operations.** Depop resale prices across its 9 storefronts: what listings ask in each buyer market (the price with buyer fee, tax and shipping as Depop shows them), what a shop's items sold for, shop profiles with ratings, reviews and items sold, brand, category and curated explore pages, search suggestions, shop search and US similar listings. Search Listings, Get Category Listings, Get Brand Listings and Get Explore Page cost 1 credit (5 on New Zealand); Get Product costs 1 on the US, 2 on the other markets and 6 on New Zealand; every other operation costs 1. Nothing else changed.

- **Country** is the buyer's country: United States (default, USD), United Kingdom (GBP), Australia (AUD), Ireland (EUR), Canada (CAD), New Zealand (NZD), Germany (EUR), France (EUR), Italy (EUR). Search Listings, Get Product, Get Category Listings, Get Brand Listings, Get Explore Page and Get Search Suggestions serve all nine; Get Similar Listings is US only; the shop operations, Get Categories and Get Brands are global.
- Search Listings, Get Category Listings, Get Brand Listings and Get Explore Page return the **first 24 results per query**: Depop serves no next page, so narrow with filters, sort or a price range. Sorts are Relevance and price (newest and most popular are not available).
- Prices are numbers as Depop shows them to a buyer in the market (price, original_price, buyer_fee, tax, shipping, total as Scavio's sum of those parts, headline_price as Depop itself headlines it). price.currency is the listing's currency, usually the market's (some sellers list in another one; list items mark those with buyer_market_price false, and Depop shows them unconverted). List items carry no seller country; Get Product has seller.country. Listing IDs are global: the same listing from another market shows that buyer's fee, tax and shipping. On the US, Depop returns a buyer fee on some calls and not on others.
- **Get Shop Sold Listings** is Depop's only sold data: sold prices come per shop (there is no keyword sold search), status is sold (on Depop) or marked_as_sold (the seller marked it sold, which may be outside Depop), and Depop shows no sale date (updated_at is the listing's last update). **Get Shop Reviews** carries no reviewer names.
- Depop's interface is English in every storefront; titles and descriptions are what sellers wrote. Not available: results past the first 24, keyword sold search, trending searches, views, join date, Top Seller badge, offers / bundles, price history.

Every Depop operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.65.0

**New resource: Uniqlo, 12 operations.** Uniqlo in 41 countries: Uniqlo prices by country (one product ID priced in up to 10 countries per call, each in its own currency, never converted), online stock by colour and size, store stock near a point, reviews with fit feedback, sale and limited-time offers, new arrivals, search, product detail, categories, stores and search suggestions. Every operation costs 1 credit; Get Store Stock costs 2 by product ID + colour + size (1 by variant ID) and Get Prices by Country 1 per country that answered. Nothing else changed.

- **Country** picks the market. The United States, Japan and South Korea serve every operation; Taiwan, Hong Kong and China (Uniqlo's Greater China sites, in Chinese, with their own product codes) serve Search Products and Get Product; Australia, Belgium, Canada, Germany, Denmark, Spain, France, the United Kingdom, Indonesia, India, Italy, Malaysia, the Netherlands, the Philippines, Sweden, Singapore, Thailand, Vietnam and Uniqlo's EU store (euros, English; Austria, Bulgaria, Czechia, Estonia, Finland, Greece, Croatia, Hungary, Ireland, Lithuania, Luxembourg, Latvia, Poland, Portugal, Romania, Slovenia, Slovakia) serve Get Product and Get Prices by Country. Countries with no Uniqlo online store and a country an operation does not serve answer 400 before anything is charged.
- Product IDs (E479000-000) are global on uniqlo.com, so **Get Prices by Country** compares one ID across countries in one call. In the United States, Japan, South Korea and Canada (and on some items Singapore, Malaysia and India) Uniqlo marks a drop with flags only (on_sale, limited_offer, price_flags), so promo_price equals price; in Europe, Australia and most of Southeast Asia promo_price is below price. Only a limited-time offer has a window: quote Uniqlo's own label in price_flags.name (e.g. "until 11/18"); a sale flag carries a start but no end, and Select Colors/Sizes Only carries no dates. Get Product and Get Prices by Country default to price group 00, Uniqlo's regular price list; search can list the same product_id again in price group 01, mostly the Select Colors/Sizes Only sale price, which Get Product reads with Price Group 01.
- **Get Stock** is online stock per variant (Uniqlo shows at most 11); **Get Store Stock** is the status per store near a point, with no unit counts; set Price Group to the group the variant came from (default 00), because a variant of price group 01 asked as 00 reads out of stock in every store. **Get Reviews** carries fit (1 tight to 5 loose), purchased size and height, weight and age ranges, with no reviewer names or locations; review totals are pooled per region.
- Not available: price history, store-level prices. GU is a separate brand and not a separate platform here; Uniqlo's own listings can include GU collaboration items (Korea's limited offers did).

Every Uniqlo operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.64.0

**New resource: bol.com, 9 operations.** bol.com, the Netherlands and Belgium (EUR): bol.com competitor prices from the buy box and the lowest-priced competing offers on a product, product lookup by ID, link or EAN, seller profiles with ratings and public trader data, seller, category, brand and promotion listings, and today's deals. Every operation costs 2 credits; Get Product by EAN costs 4 (a search plus the product page). Nothing else changed.

- **Country** picks the storefront on every operation: Netherlands (default) or Belgium; with Belgium, **Language** picks Dutch (default) or French. Product, EAN, category, seller and offer IDs are the same on every storefront; prices, offers and stock can differ between the Netherlands and Belgium. On Belgium in French, bol's own texts are French, some partner titles and the review topics stay Dutch, and review texts are bol's translation.
- **Get Product** returns the buy box (price, reference price with its type: rrp or most_shown_price, bol's most-shown non-promotional price over the last 90 days; seller rating out of 10, shipping cost, delivery promise), offer_count, cheapest new, fastest new, cheapest second-hand and refurbished grades, the rating distribution, bol's AI review topics and the first 10 reviews (pooled across the product family, no reviewer names). **Get Offers** lists the 10 lowest-priced offers, lowest price first, with counts by condition for all the product's offers and has_more when bol has more (no paging); the buy box is not marked there (buy_box.offer_id on Get Product names it). **Get Seller** returns the rating out of 10 with up to four sub-ratings and bol's positive percentage.
- **Search Products** stops at page 10; sorts other than Relevance can narrow the result set and price sorts follow bol's own ordering. The listing operations (seller, category, brand and campaign products) default to Popularity and page 1 to 500; a campaign item's offer is its buy box, which does not always carry the campaign's label. **Get Deals** links the day deal on the selected storefront. Brand Facet ID (a search and category filter) and Brand ID (Get Brand Products) are different ID spaces.
- Not available: search suggestions, review paging, seller review texts, price history or 30-day lowest price, pickup points, bol Select member prices.

Every bol.com operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.63.0

**New resource: Mercari, 11 operations.** Mercari US (mercari.com, USD, English) and Mercari Japan (jp.mercari.com, JPY, Japanese): Mercari sold prices and on-sale listings for the same query, item detail with price drops and sold time, category and brand listings, the category tree and brand list, US deals and trending, and Mercari Japan seller profiles, seller reviews and Mercari Shops shops. Every operation costs 1 credit. Nothing else changed.

- **Country** picks the market: United States (default) or Japan. **Search Listings**, **Get Item**, **Get Category Listings**, **Get Categories**, **Get Brands** and **Get Brand Listings** serve both; **Get Deals** and **Get Trending** are US only; **Get Seller**, **Get Seller Reviews** and **Get Shop** are Japan only. Mercari UK has closed. Item, category, brand and seller IDs are per market: an ID from the US is not valid on Japan.
- **Status** Sold returns sold listings (sold and in transit) with their prices, so asking and sold prices for the same query come from Search Listings. On US, Mercari orders sold results most recently sold first whatever Relevance asks (price sorts apply) and matches the keyword more loosely than on-sale results, so check titles before comparing prices. Lists carry no likes and no sold time; **Get Item** has both (sold_at, when Mercari shows it), and a sold item keeps its full data. On US, list free_shipping is set only when you filter by Shipping. Prices are numbers, US dollars on us and whole yen on jp; original_price is the seller's earlier price when above price, with discount_percent against it (never set on Japan results).
- Search depth: US 50 per page up to page 20 (later pages can repeat earlier items: dedupe by item_id), Japan 120 per page up to page 91; total stops at 10,000 on US and 15,000 on Japan (that many or more). On Japan, Newest follows Mercari Japan's own order (relisted items move up). Japan data is in Japanese as sellers wrote it (not translated), and Japan calls are slower (typically 10-20 seconds, up to about a minute).
- **Get Seller** returns a Mercari Japan seller's good / normal / bad ratings and first 30 listings; **Get Seller Reviews** the most recent 100 reviews (no reviewer names); **Get Shop** the Mercari Shops shop profile (for its products use Search Listings with Mercari Shops Only, or Get Item). Not available: US seller profiles and reviews, US search suggestions, Japanese trending, price-drop history.

Every Mercari operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.62.0

**New resource: ASOS, 11 operations.** ASOS in 235 countries: ASOS prices by country and currency (one product's price, previous price, RRP, sale flag and online stock by size in each ASOS store and currency), catalogue search, product detail, online stock for up to 100 products per call, reviews by store with ASOS's AI summary, search suggestions, the navigation tree, category and brand pages, the A-Z brand list, the SALE and NEW IN lists, and the markets table. Every operation costs 1 credit. Nothing else changed.

- **Country** picks the country (default United Kingdom; 235 in all) and **Currency** the currency (default ASOS's own default for the country; any currency ASOS offers the country, 245 country-currency combinations, e.g. United Arab Emirates AED or GBP, Israel ILS, GBP or USD, Japan USD or GBP). 13 ASOS stores serve them: gb, us, fr, de, es, it, au, dk, nl, pl and se have a site of their own in their own language; ASOS's European store (33 countries) and international store (170 countries) serve the rest in English. **Get Search Suggestions** is not served on Poland (ASOS's Polish store answers no suggestions). Russia and Belarus are not served (ASOS is not selling there).
- Product and category IDs are the same on every store, so one product ID compares a price across countries and currencies. Countries served by the same ASOS store in the same currency share one price list, except Ireland, which has its own euro prices on ASOS's European store (measured 2026-11-16 on all 245 country-currency combinations); which products are offered still differs by country. price is the lowest size price when ASOS prices sizes differently (variants carry each size's price). Prices come back as numbers in the requested currency, never converted: price, previous_price (ASOS's "was"), rrp, lowest_price_30d where ASOS shows it, is_marked_down, is_outlet, discount_percent and discount_basis.
- **Get Stock** is online stock per variant (ASOS has no physical stores) and carries variant IDs, not size names: **Get Product** maps them to sizes. Which reviews **Get Reviews** returns depends on the store: gb, us, au and ASOS's European and international stores share one English review pool; es, it, nl, se, dk and pl add reviews written in their own language to that pool; fr and de show only reviews written in French or German (each review carries its language), with fit and quality averages and ASOS's labelled AI summary; no reviewer names.
- **Search Products** serves at most 2,088 results whatever total says (max_reachable); **Get Category Products**, **Get Deals** and **Get New Arrivals** page through everything. The search **Brand Facet IDs** filter takes brand facet IDs from a search response; **Get Brands** returns category IDs to pass to **Get Category Products**. No outlet (ASOS's outlet categories are empty), no promo codes (shown only to signed-in shoppers), no price history (schedule a workflow to track changes).

Every ASOS operation carries a 120-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.61.0

**New resource: Zara, 12 operations.** Zara in 102 storefronts: Zara prices by country (one reference's price, sale price and availability in up to 10 countries per call, each in that country's own currency), stock by size online and in physical stores, catalogue search, product detail, materials and origin, the category tree and category lists, the SPECIAL PRICES and new-arrivals lists, stores and search suggestions. Nothing else changed.

- Every request is billed what it spent (credits_used in the response): 2 credits per call for Search Products, Get Materials, Get Stock, Find Stores, Get Categories and Get Category Products; Get Product 2 (4 by reference or when the slug is another country's or language's, 6 for both); Get Store Stock 2 by store IDs, 4 by a point; Get Deals 4 (2 when the country has no special-prices category); Get New Arrivals 4; Get Prices by Country 2 per country that answered; Get Search Suggestions 2 (4 when the English fallback runs). China, Zara's separate site, costs 1 credit per call.
- **Country** picks the Zara storefront (default United States; 102 in all, each in its own currency) and **Language** the language (default Zara's own default for the country; each storefront serves Zara's own languages for it, usually the local language and English). **Find Stores** and **Get Store Stock** are not served on Angola or Iraq (Zara lists no stores there), **Get New Arrivals** not on Algeria, **Get Search Suggestions** not on Andorra, Albania, Armenia, Azerbaijan, Bosnia and Herzegovina, Algeria, North Macedonia, Macau, Uzbekistan or Kosovo. Belarus and the countries Zara serves only from its worldwide store are not served.
- References are global on Zara's international site, so **Get Prices by Country** compares one reference across countries in one call. A colour's product ID is usually the same across countries but can differ, and China runs its own IDs, so match across countries with the reference. Prices are numbers in the country's own currency, never converted; old_price is set only on a markdown.
- **Get Stock** is online stock per size; **Get Store Stock** is units per size in physical stores (sales floor and stockroom). Zara runs seasonal sales and lists special prices between them: **Get Deals** answers an empty list (not an error) where a country has no special-prices category for the section. Category IDs are shared across the northern-hemisphere catalogue; Australia, South Africa and Brazil run their own. No reviews (Zara shows none), no price history (schedule a workflow to track changes); Inditex's other brands are not covered.

Every Zara operation carries a 120-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.60.0

**New resource: H&M, 9 operations.** H&M in 47 countries: one article's price, sale price, member price and online stock by size in each H&M country, in that country's currency, plus catalog search, category, sale and new-arrivals grids, search suggestions, stores and where an article is made. Get Product costs 2 credits, every other operation 1. Nothing else changed.

- **Country** picks the H&M country (default United States) and **Language** the language (default the country's first): United States, Canada (English or French), Mexico, United Kingdom, Ireland, Germany, Austria, Switzerland (German, French or Italian), France, Belgium (Dutch or French), Netherlands, Italy, Spain, Portugal, Sweden, Finland (Finnish or Swedish), Denmark, Norway, Poland, Czechia, Slovakia, Hungary, Romania, Bulgaria, Greece, Serbia, Turkey, Ukraine, Israel, Hong Kong, Macau and Taiwan (Chinese or English), Japan, South Korea, India, Malaysia, the Philippines, Singapore, Vietnam and Australia, plus Croatia, Cyprus, Estonia, Latvia, Lithuania, Luxembourg and Slovenia on H&M's shared English EUR store. **Get Product** is not served on Macau, Taiwan or the shared EU store countries (use Search Products or Get Stock there); **Find Stores** is not served on Macau (H&M lists no stores there). Countries where H&M runs a separate site or has no online store are not served.
- Article codes are global: the same 10-digit code in every country, so one code compares a price across countries with one call per country. price is what a non-member pays now; member_price is H&M's member price as shown to signed-in members; prior_price is the earlier price H&M shows next to an EU markdown.
- **Get Stock** is online stock per size, not store stock (H&M publishes no per-size store stock; Search Products with a Store Code lists a store's assortment). **Get Product** carries the rating and the latest reviews H&M shows (up to 10, with fit feedback): there is no full review list.
- Category IDs are the same in every country (ladies_dresses, men_jeans, ...). H&M runs sales in seasons, so **Get Deals** may return an empty grid between sales. No price history (schedule a workflow to track changes), no checkout or member-only cart prices; H&M's sibling brands are not covered.

Every H&M operation carries a 120-second request timeout (Get Product can take up to about a minute). Failed calls are not charged; a not-found is charged.

## What changed in 0.59.0

**New resource: Nintendo, 6 operations, 1 credit each.** The Nintendo eShop and My Nintendo Store in 46 countries: one game's regular price, sale price and sale end date in each eShop country, in that country's currency, plus catalog search, product detail, deals, new and upcoming releases and a game's DLC. Nothing else changed.

- **Country** picks the eShop (default United States) and **Language** the language (default the country's first). Search Games, Get Product, Get Deals, Get Releases and Get DLC serve 42 countries: the Americas (United States, Canada in English or French, Mexico, Brazil, Argentina, Chile, Colombia, Peru), Europe in the country's language (United Kingdom, Ireland, Germany, Austria, Switzerland in German, French or Italian, France, Belgium in French or Dutch, Netherlands, Luxembourg, Italy, Spain, Portugal), Australia, New Zealand, South Africa, Poland, Czechia, Sweden, Norway, Denmark, Finland, Slovakia, Hungary, Romania, Bulgaria, Greece, Croatia, Slovenia, Estonia, Latvia, Lithuania, Malta and Cyprus (the English European catalog with that country's own prices) and Japan. **Get Prices** also serves South Korea, Hong Kong, Taiwan and Israel. The Philippines, Russia and countries with no eShop data are not served.
- Item IDs (nsuid) are per eShop region: Americas, Europe (EU / EFTA, UK, Australia, New Zealand, South Africa, Israel), Japan, Korea, and Hong Kong + Taiwan. An ID from one region is not_found in another and there is no cross-region title mapping: look the game up with Search Games or Get Product in that region, then run **Get Prices** for any country of the region (up to 50 IDs). Americas search tiles carry a slug and no nsuid: read Get Product by Store Slug.
- Prices are always the country's eShop price in its currency; sale_start and sale_end are the eShop's own sale window. Nintendo shows no price history or historical low, so schedule a workflow on Get Prices to build one.
- Americas **Get Deals** returns Nintendo's featured sale pages, not every discounted game; Europe and Japan return every game on sale. Americas search sorts by relevance or newest only and takes no filters; the Americas release lists are one page. An unsupported sort or filter answers 400.
- No user reviews (Nintendo's stores have none; age ratings only), no best-seller charts and no autocomplete.

Every Nintendo operation carries a 120-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.58.0

**New resource: Trendyol, 12 operations, 1 credit each.** Trendyol (Turkey's largest online marketplace) and its international storefronts, 35 markets: for one product, the buy-box seller and every other seller's price, seller score, the crossed-out price and Trendyol's lowest-price badge, plus search, category and brand grids, reviews, seller Q&A, seller stores, flash deals, coupons, top-100 rankings, search suggestions and delivery estimates. Nothing else changed.

- **Country** picks the market (default Turkey) and **Language** the language (default the market's first): Turkey (TRY; Turkish, English or Arabic), Germany and Austria (EUR; German), France, Belgium, Croatia, Denmark, Estonia, Finland, Italy, Latvia, Lithuania, Netherlands, Portugal, Slovenia, Spain, Sweden and Luxembourg (EUR; English), Bulgaria, Greece and Slovakia (EUR), Czechia (CZK), Hungary (HUF), Poland (PLN), Romania (RON), Serbia (RSD) and Ukraine (UAH) in the local language or English, Moldova (MDL; Romanian or English), United Arab Emirates (AED; English or Arabic), Saudi Arabia, Qatar, Kuwait, Oman and Bahrain (SAR, QAR, KWD, OMR, BHD; Arabic or English) and Azerbaijan (AZN; Turkish).
- **Get Deals** and **Get Coupons** are Turkey only; **Get Rankings** is not on the 15 English-language EU storefronts, which have no ranking lists; City ID / District ID on **Get Delivery Estimate** are Turkey only (Istanbul 133, Sisli 54; there is no city list).
- **Get Product** returns buy_box and other_sellers (each seller's price, score out of 10, badges and lowest-price badge). Trendyol's developer FAQ says the buy box is chosen by algorithm metrics, not price alone, so compare the two. The international storefronts have their own price lists, not a currency conversion of the Turkish price (measured on 2 products on 2026-11-15), and their items are sold by Trendyol itself or by other sellers (check buy_box and other_sellers).
- **lowest_price_badge** is the site's "lowest price of the last N days" tag (7, 10, 14, 30 or 90 days): a day count, not a numeric 30-day lowest price. There is no price history, so schedule a workflow to track changes.
- Grids are 36 per page, at most 138 pages; total stops at 100,000 (total_capped). Sponsored cards are flagged, kept and repeat across pages; favourites and orders come as the site's rounded text.
- Coupons belong to each seller's listing: the buy box often has none while another seller has some, so set Seller ID from other_sellers. Reviews carry the site's masked author only; no seller e-mail, tax number or address is returned.

Every Trendyol operation carries a 120-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.57.0

**New resource: Maisons du Monde, 9 operations, 1 credit each.** Maisons du Monde (furniture and home decor) product data for France, Belgium (French or Dutch), Luxembourg, the Netherlands, Germany, Spain, Italy, Portugal and Switzerland (French, German or Italian): promo price next to the crossed-out price and discount per storefront, whether an item is sold by Maisons du Monde or a marketplace seller, product detail, pooled customer reviews, category grids, Black Friday and Seconde Chance deals, stores, store stock and marketplace sellers. Nothing else changed.

- **Country** picks the market (default France) and, on Belgium and Switzerland, **Language** picks the site language. Prices come in the market's currency (EUR, or CHF in Switzerland), never converted. Prices can differ by market: measured on 2026-11-14 on about 170 discounted sofas, Luxembourg, the Netherlands, Germany, Spain, Italy and Portugal matched France on every item, Belgium differed on 19, and Switzerland is priced separately in CHF (round mirror 204172: 74.99, now 37.45 EUR on every euro market; 91.90, now 45.95 CHF). Read each market you report.
- **was_price** is the crossed-out price shown next to a discount. Maisons du Monde shows no 30-day lowest price and no price history, so schedule a workflow to track changes.
- Search Products, Get Product, Get Category Products, Get Deals and Get Reviews serve all nine markets; Find Stores, Get Store and Get Store Stock serve every market but the Netherlands and Luxembourg; **Get Seller** and the seller filters (Seller Code, Sold by Maisons du Monde Only) serve the marketplace markets France, Germany, Spain and Italy.
- Grids are 40 per page with the exact total. Search tiles carry sold_by but not the seller name (Get Product has it). The German site does not sort keyword results, so a sorted Search Products on Germany comes back in relevance order with a note.
- **Get Reviews** returns reviews pooled across every market and shown translated into the request language, with cursor paging and no star filter; a product with no reviews is a charged not-found.
- Store stock: **Find Stores** (by postcode) for the store ID, then **Get Store Stock** (Maisons du Monde items only). Home delivery is a from-price per product and market (no postcode-exact cost). No search suggestions.

Every Maisons du Monde operation carries a 120-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.56.0

**New resource: Ashley Furniture, 6 operations.** Ashley Furniture product data for ashleyfurniture.com, plus Search Products and Get Product on Ashley's licensed storefronts in Canada, Mexico, the Philippines, Saudi Arabia and Turkey: price next to Ashley's Regular Price, badges, stock and delivery, specifications, ratings, the first 10 reviews, customer Q&A, category grids, deal events and stores. Nothing else changed.

- **Country** (Search Products, Get Product) picks the market; prices come in its currency, never converted. Search Products and Get Product cost 2 credits in the United States and Mexico and 1 credit in Canada, the Philippines, Saudi Arabia and Turkey. Get Category Products, Get Deal Event Products, Find Stores and Get Store are United States only at 2 credits.
- **regular_price** is Ashley's own Regular Price, which Ashley's terms define as its highest advertised price in store and online, offered to customers using special long-term financing.
- Ashley prices vary by region and there is no ZIP input: every United States answer returns **priced_for** (zipcode, price_zone), the ZIP and price zone Ashley priced that answer for, so two runs can come back priced for different zones.
- **Get Product** returns the first 10 reviews the page shows plus the rating histogram, customer photos and Q&A (no review paging). On the licensed storefronts it takes the **Handle** from a search (or the product URL), not an item number; their search returns up to 10 matches (Turkey its first results page) with no paging or sort.
- Search facets are informational: filter with **Get Category Products**. **Get Deal Event Products** covers Black Friday, Clearance and Hot Buys. **Find Stores** takes a latitude and longitude only (no ZIP or city lookup) and lists stores alphabetically; use **Get Store** for the address, phone and hours.

Every Ashley Furniture operation carries a 120-second request timeout. Failed calls are not charged; an unknown item number, category or store is a charged not-found.

## What changed in 0.55.0

**New resource: Wayfair, 4 operations, 1 credit each.** Wayfair product data for wayfair.com, wayfair.ca (English or French), wayfair.co.uk and wayfair.ie, plus Wayfair's US sites AllModern, Birch Lane, Joss & Main and Perigold: price, sale price, was price, badge, stock, options, specifications, ratings, reviews, delivery estimates and the current sale events. Nothing else changed.

- **Country** picks the market (United States, Canada, United Kingdom, Ireland); prices come in its currency, never converted. **Language** (Canada only) is English or French. **Site** (United States only) picks AllModern, Birch Lane, Joss & Main or Perigold on Search Products, Get Product and Get Category Products. Wayfair no longer sells in Germany or Austria.
- **was_price** is Wayfair's strikethrough price: Wayfair's terms state it is the manufacturer's suggested price or the highest price Wayfair offered or sold the item at in the past, and its Sale label means a discount against a price in the previous 90 days. Wayfair shows no price history, so run the workflow on a schedule and store price, sale_price, was_price and badge to build one.
- **Get Product** returns the 5 reviews the page shows plus the rating histogram and review summary (no review paging). Option choices carry no price: read each with **Option ID**, one call per option. **ZIP / Postal Code** adds delivery estimates (United States and Canada only).
- **Search Products** returns 30 results per keyword page (category grids 48) and an approximate total. **Brand IDs** takes brand IDs (items[].brand.id), not names. **Get Sale Events** lists the events without expanding them: use On Sale Only, Closeout Only or Open Box Only on a search or category for products.

Every Wayfair operation carries a 120-second request timeout. Failed calls are not charged; an unknown SKU or category is a charged not-found.

## What changed in 0.54.0

**New resource: IKEA, 12 operations, 1 credit each (Compare Prices by Country: 1 credit per market that answered).** IKEA product data across 55 markets: IKEA prices by country for one article number, search, product detail, reviews, categories, deal lists, stores, stock by store, bulk item lookup and As-is (second-hand) offers. Nothing else changed.

- **Country** picks the market. Search Products and Get Product cover 55 markets: the 50 ikea.com markets plus China, Puerto Rico, the Dominican Republic, the Canary and Balearic Islands (with **Island**) and Iceland. Get Category Products, Get Deals, Get Search Suggestions and Get Items serve the 50 ikea.com markets plus China; Get Reviews, Get Categories, Find Stores, Get Store Stock and Compare Prices by Country the 50 ikea.com markets; Get As-Is Offers 13 markets. Ukraine, Greece, Cyprus, Bulgaria, Hong Kong, Taiwan, Indonesia and Turkey are not available.
- **Language** is optional: one of the market's languages (Canada en or fr, Belgium nl, fr or en, Switzerland de, fr, it or en, United States en or es ...). Data comes in that language and prices in the market's own currency, never converted: on 2026-11-13 KALLAX 80275887 was EUR 49.99 in Germany and the Netherlands, EUR 59.99 in France and SEK 599 in Sweden.
- **Compare Prices by Country** prices one article number on 2 to 10 markets. Some markets (US, Canada, Japan, Australia, South Korea, India, Malaysia, Singapore, Philippines ...) sell the same product under a different article number, so found is false there.
- **Get Reviews** returns the 20 most recent reviews the product page shows (no paging, sort or star filter). Ratings are what each market's site shows: many markets share one pool (KALLAX: 8,241 in Germany, Spain, Sweden), others have their own (France 2,760, Italy 1,887) and some show none (Estonia, Latvia, Lithuania, Israel, Iceland). **Get Store Stock** returns a level per store (in stock high / low, out of stock), not a quantity.
- Puerto Rico, the Dominican Republic and the islands return the first 40 search results only; franchise products return basic detail.

Get Product and Get Reviews carry a 180-second request timeout (a product page can take up to about 100 seconds), every other IKEA operation 120 seconds. Failed calls are not charged; an unknown article number, category or store ID is a charged not-found.

## What changed in 0.53.0

**New resource: Publix, 11 operations, 1 credit each.** Publix grocery data by store: the weekly ad with BOGO deals, Extra Savings, digital coupons, the deli and bakery order-ahead menu (Pub Subs) with store prices, product search, category listings, nutrition facts and store locations. Nothing else changed.

- Every price operation takes a **Store ID**: a Publix store number from **Find Stores** (by ZIP, city and state, or store number). Prices and promotions differ by store: a Publix Chicken Tender Sub measured $12.09 in Miami (store 1614) and $11.99 in Atlanta (store 1825).
- Publix does not show regular shelf prices online. price is a number only for items on promotion (weekly ad, BOGO, multi-buy, Extra Savings) and for order-ahead items, and null otherwise; it is never estimated. Multi-buys (2 for $5.00) carry bundle {quantity, price}.
- **Get Weekly Ad** returns about 700 items per store, about 230 of them BOGO, with the ad's start and end dates. Ads run Thursday to Wednesday in Florida and Wednesday to Tuesday in Georgia and North Carolina (weekly_ad_break_day per store); English ad only.
- **Search Products** and **Get Category Products** serve 48 items per page with sort and on-sale, BOGO and brand filters; **Get Order Ahead Menu** 60 per page. Products are keyed by Publix item code: Publix does not publish UPCs, ingredients, allergens or reviews online.
- **Get Coupons** lists the store's digital coupons; nothing is clipped and no account is used. No cart or ordering.

Every Publix operation carries a 120-second request timeout. Failed calls are not charged; an unknown item code or store ID is a charged not-found.

## What changed in 0.52.0

**Kroger: QFC and Fred Meyer banners and 6 new operations.** Nothing else changed.

- Every Kroger operation has a **Banner** option: Kroger (kroger.com), QFC (qfc.com: Washington and Oregon) or Fred Meyer (fredmeyer.com: the Pacific Northwest and Alaska, grocery plus general merchandise, apparel and home). **Auto**, the default, sends none: Kroger, unless a product or category URL or a store ID sets it, so existing workflows behave as before. Other Kroger banners (Ralphs, King Soopers, Fry's, Harris Teeter, Smith's...) are not supported yet.
- New: **Get Store Prices** (price, promotion, stock, available quantity, aisle and fulfillment for up to 25 UPCs at one store you choose, 3 credits), **Find Stores**, **Get Category Products**, **Get Weekly Digital Deals**, **Get Coupons** (listed, never clipped; no account) and **Get Search Suggestions**, 1 credit each.
- Prices are integer cents (price 399 = $3.99) and differ by banner and by store. **Search Products**, **Get Product**, **Get Category Products** and **Get Weekly Digital Deals** return the prices of a store the site chooses for the request (returned in store); for one specific store, take a location_id from **Find Stores** and use it in **Get Store Prices**.
- **Search Products**, **Get Category Products** and **Get Weekly Digital Deals** serve the first page only (up to 24 products), with no sort; a page above 1 is refused before any charge. Ratings are average, count and star distribution; review text is not available. Fuel center locations are returned, fuel prices are not. The printed weekly ad circular is not available.

Every Kroger operation now carries a 120-second request timeout. Failed calls are not charged; an unknown UPC or store ID is a charged not-found.

## What changed in 0.51.0

**New resource: OLX, 9 operations, 1 credit each.** OLX Europe classifieds: used goods, cars, real estate and jobs, with sellers, category filters and similar ads. Nothing else changed.

- OLX Europe only. **Country** picks the site: Poland (olx.pl, PLN, default), Romania (olx.ro, RON), Portugal (olx.pt, EUR), Bulgaria (olx.bg, EUR), Ukraine (olx.ua, UAH), Kazakhstan (olx.kz, KZT) or Uzbekistan (olx.uz, UZS). **Get Category Filters** and **Get Similar Ads** are not available on Kazakhstan or Uzbekistan. OLX Brasil, olx.in and other OLX-branded sites are not covered.
- Titles, parameters and labels come back in the site's language: Polish on Poland, Russian by default on Kazakhstan and Uzbekistan, where **Language** switches **Search Ads**, **Get Seller Ads** and **Get Ad** to Kazakh or Uzbek.
- **Search Ads** and **Get Seller Ads** share one grid: up to 50 ads per page (default 40; promoted ads are interleaved on top, each flagged is_promoted with promoted_position). OLX lets anyone page through the first 1,000 results only (total_capped); Kazakhstan and Uzbekistan hide large totals (total null). **Newest** orders by last refresh, not first posting. Filter by price, condition, private or business seller, OLX delivery (not on Kazakhstan or Uzbekistan), photos, region / city / district with a radius, and the category's own filter_* keys from **Get Category Filters** (Category Filters (JSON)).
- When the site converts a price (olx.uz y.e. to UZS, EUR to RON on Romania, USD / EUR to UAH on Ukraine), price.value is the converted figure and original_value / original_currency keep what the seller entered. Jobs carry salary.
- Private sellers' names, phone numbers, emails, exact map positions, last-seen times and car VINs are never returned, and phone numbers and emails in ad text are replaced; business_name is set for business sellers only. OLX shows no seller ratings or reviews.
- An ended ad answers the same 404 as a missing one (not found or no longer active). No view counts, phone numbers, messaging, delivery prices, checkout, average prices, notifications or price history: to watch for new listings or track prices, poll Newest and store your own.

Every operation carries a 120-second request timeout. Failed calls are not charged; a not-found is a charged error.

## What changed in 0.50.0

**New resource: Company (Enrich), 1 operation.** Find a company's contact details and its owner from its website or a Google Maps place ID. Nothing else changed.

- **Enrich** takes **Website** (a bare domain works; social profile URLs are rejected) or **Place ID** (from the Google resource's **Maps Search**, `local_results[].place_id`). Each field is optional on its own, but at least one is required: an empty call is a free 400. If both are set, Website is the site that gets read.
- Returns `data.company` (name, website, domain, emails, phones in E.164 when they validate, socials, contact_page, address, place_id), `data.owner` (name, title, source_url, email and email_status, or null when no page names one). `owner.email_status` is `published` when an address on the site matches the owner's name, else `not_found` with email null.
- 10 credits from a website, 20 from a place ID. A place ID whose listing has no readable website returns the listing data for 1 credit. A website that cannot be reached (502) is not charged.
- Calls usually take 10-45 seconds, up to about 2 minutes on a slow site, so the operation carries a 180-second request timeout.

## What changed in 0.49.0

**New resource: Allegro, 7 operations, 2 credits each.** Offers, every seller's price for one product, sellers, sold counts and auctions. Nothing else changed.

- **Country** picks the Allegro site on every operation: Poland (allegro.pl, PLN, default), Czechia (allegro.cz, CZK), Slovakia (allegro.sk, EUR) or Hungary (allegro.hu, HUF). Titles, parameters and labels come back in the site's language: Polish on Poland.
- An offer is one seller's listing (**Get Offer**, by offer number or link); a catalogue product groups many sellers' offers (**Get Product**, by product ID or link). **Get Product Offers** lists every seller's offer for one product with price, price with delivery, condition, seller, Allegro Smart! and the buy box flag: the price-monitoring operation.
- **Search Offers**, **Get Category Offers** and **Get Seller Offers** share one grid: 60 organic offers per page (sponsored slots on top), exact total and every facet; 8 sorts (price, price with delivery, popularity, ending soonest, newest); price, condition and Allegro Smart! filters, plus Buying Format (buy now / auction) and Deals Only (Allegro's deals zone, Black Weeks included while it runs) on Poland only. Each item carries price, price_with_delivery, sold_count, discount_percent, lowest_price_30d, the seller's super seller flag, positive feedback percent and business flag, and placement (regular, promoted, sponsored or featured).
- lowest_price_30d is the EU disclosure Allegro shows next to a discount (the lowest price in the 30 days before it): null without a discount, and not a price history. sold_count is null on auctions and on Czechia, Slovakia and Hungary offer pages.
- **Get Offer** adds the auction state (current price, minimum next bid, ends at, has bids; no bid history), every parameter with GTIN, delivery methods, returns, warranty and the company name of business sellers. **Get Product** returns the lowest price, offer count, featured offer, star distribution, review aspects and the first 20 reviews as shown.
- **Get Seller Offers** returns the seller's ID, login, business flag and categories (the slug feeds Seller Category); super seller status, positive percent and member since come from **Get Seller Feedback** (20 ratings per page, no buyer identity).
- No search suggestions, bidding, buying or checkout, Allegro Lokalnie as its own source, Smart! account data, seller revenue, seller addresses or tax IDs, price history or reviews past the first 20: to track prices, poll and store your own.

Every operation carries a 120-second request timeout (Slovakia and Hungary calls can take up to about a minute). Failed calls are not charged; a not-found is a charged error.

## What changed in 0.48.0

**New resource: Carrefour, 9 operations, 1 credit each.** Grocery prices by store, promotions, Nutri-Score and stores. Nothing else changed.

- **Country** picks the national site for Search Products and Get Product: France (carrefour.fr, EUR, default), Argentina (ARS), Romania (RON) or Belgium (EUR; Language French or Dutch; 2 credits). Every other operation is France only. Data comes back in the market's language: French titles, labels and ingredients on France.
- **Store Ref** (Additional Options, France) scopes Search Products, Get Product, Get Category Products and Get Promotions to one store's shelf price and assortment; without it a price is carrefour.fr's national online price (Nutella 400 g: 3.99 national, 3.69 at two stores, 4.61 at another). Take the ref from Find Stores (store_ref or pickup_refs[].ref) or Get Store Availability (stores[].store.ref).
- **Search Products**, **Get Category Products** and **Get Promotions** share one grid (30 items per page on France) with brand, promotion, Nutri-Score, organic, Carrefour brands and price filters and price, unit price or top-rated sorts. Each item carries price, unit_price (per kg / L), nutriscore, ecoscore and promotion with loyalty_only (loyalty-card price) and start / end dates; on multi-buy deals ("Le 2ème à -50%") the prices cover quantity items and discounted_price is null when the site does not price the deal.
- **Get Product** adds ingredients, allergens, nutrition per 100 g and per portion, the marketplace seller and the rating distribution. **Get Reviews** returns 1-50 verified-purchase reviews with 4 sorts, a star filter and offset paging.
- **Get Promotions** lists catalogue, immediate, loyalty-card or the site's festive selection, optionally for one aisle.
- **Find Stores** (postal code or latitude / longitude, optional service filter), **Get Store Availability** (yes / no per nearby store, no price) and **Get Store** (services, hours, next pickup slots as shown, fuel prices per litre at stores with a fuel station).
- No Q&A, printed leaflet, delivery-slot booking, cart, loyalty account data or price history: to track prices, poll and store your own. Spain, Italy, Poland, Brazil and the Middle East sites are not covered.

Every operation carries a 120-second request timeout. Failed calls are not charged; a not-found is a charged error.

## What changed in 0.47.1

Fanatics wording fixes only, no new operations: price sorts order by the current price (before any promo code), not the with-code price; department and filter IDs are per store (Jerseys is 8011 on fanatics.com, 14012 on NFL Shop); the players facet appears only on some pages (e.g. Lakers), otherwise take player IDs from a product's player field; price_label coupon means coupon-eligible, and a null with_code_price means the code does not apply; Get Product's on_sale is true for clearance markdowns.

## What changed in 0.47.0

**New resource: Fanatics, 5 operations, 1 credit each.** Merchandise and product data (jerseys, hats, fan gear, collectibles), not sportsbook odds. Nothing else changed.

- **Country** picks the storefront for Search Products, Get Product, Browse Listing and Get Deals: United States (fanatics.com, USD, default), United Kingdom (GBP), Germany, France, Spain, Italy (EUR), Japan (JPY) or Canada (CAD; Language English or French). Titles come in the storefront's language, prices in its currency. **League Store** (US) reads NFL Shop, MLB Shop, NHL Shop or MLS Store; the same product IDs work on every store, but department and filter IDs are per store, so take them from the facets of the store you query.
- **Search Products**, **Browse Listing** and **Get Deals** share one grid: 24, 48 or 72 items per page (default 72) with total (the US site counts at most 9000: total_capped), sorted by top sellers, price (the current price, before any code) or newest. Facet values feed Other Filters (JSON) as {filter: value}; facet IDs feed Browse Listing (team, player, department, brand, collection). Price Band and On Sale Only are on Browse Listing (no price bands in Japan). data_as_of says when Fanatics built each listing; misspellings come back as corrected_query.
- Each item carries price, regular_price, sale_price, clearance_price, with_code_price (the price with the site-wide promo code shown on the page) and price_label (coupon means coupon-eligible; a null with_code_price means the code does not lower that item).
- **Get Product** lists every size with stock_level (low / out: a level, never a unit count), ship-by and delivery estimates, the current promo code, personalization fields with the team roster (prices already include personalization), and jersey assurance / authentic flags.
- **Get Deals** reads Sale, Clearance or Under 25 (not in Japan), optionally for one league, team, department or brand.
- **Get Reviews** (US only) returns real text with 4 sorts and a star filter (1-50, default 10), fit / quality / value and the site's own AI-written summary. Fanatics pools reviews across a style, so check each review's product_id.
- No search suggestions, store locator or store stock, Q&A, FanCash, member pricing, unit counts, price history or checkout: to track jersey sale prices, poll and store your own.

Get Reviews usually takes 20-90 seconds, up to about 4 minutes, so it carries a 300-second request timeout; every other operation carries 120 seconds. Failed calls are not charged; unknown products are a charged error.

## What changed in 0.46.0

**New resource: Foot Locker, 10 operations, 1 credit each.** Nothing else changed.

- **Country** picks the storefront for Search Products, Get Product, Get Category Products, Get Brand Products and Get Deals: United States (footlocker.com, USD, default), Canada (CAD; Language English or French), United Kingdom (GBP), Germany, France, Italy, Spain, Netherlands, Belgium (Language Dutch or French), Austria, Ireland (EUR), Australia (AUD) or New Zealand (NZD). Titles come in the storefront's language, prices in its currency.
- **Search Products**, **Get Category Products**, **Get Brand Products** and **Get Deals** share one grid: 48 items per page with total and total_pages, sorted by relevance, price, new arrivals, top rated, name or brand. Filter by Brands (comma-separated, any case), Genders, Colors, Price Ranges, On Sale Only or any facet through Other Filters (JSON), e.g. {"mensShoesSize": "10.0"}. Listings can be a few hours old: data_as_of says when each one was built. A bare brand keyword (nike, hoka) returns that brand's listing, reported as redirected_to.
- **Get Deals** reads Sale (every storefront), Foot Locker Exclusives (US and Canada) or the items a promo code applies to.
- **Get Product** lists every colorway with its price and every size with available, ship, pickup and stores_available (a store count, not units): availability is yes / no, Foot Locker publishes no unit counts. European storefronts add lowest_price_30d.
- **Get Release Calendar** (US, Canada, UK) is the release calendar as monitoring data: launch date and time, retail price (not in the UK), colorway, style code, heat level, size run and reservation windows where the storefront runs them. Nothing here enters, reserves or buys a release.
- **Find Stores**, **Get Store Availability** (which nearby Foot Locker stores show a product or one size as available, yes / no), **Get Reviews** and **Get Questions** are US only. Foot Locker banner stores only (no Kids Foot Locker or Champs).
- No search suggestions, member (FLX) prices, price history or checkout: to track prices, poll and store your own.

Get Reviews and Get Questions usually take 25-90 seconds, up to about 3-4 minutes, so they carry a 240-second request timeout; every other operation carries 120 seconds. Failed calls are not charged; unknown SKUs, categories and brands are a charged error.

## What changed in 0.45.0

**New resource: Dick's Sporting Goods, 9 operations, 1 credit each except Get Product and Get Reviews (2 credits).** dickssportinggoods.com, US only, prices in USD. Nothing else changed.

- **Search Products**, **Get Category Products**, **Get Brand Products** and **Get Deals** share one grid: 48 items per page by default, up to 144 (Page Size), with total and total_pages, sorted by relevance, top sellers, savings, price, featured, new arrivals or brand A-Z. Filter by Brands (comma-separated), an approximate Min / Max Price, or any facet through Other Filters (JSON), e.g. {"5495": "Men's"}. Search returns did_you_mean for a misspelled query and follows keywords Dick's sends to a landing page (clearance, golf balls), reported as redirected_to. Merchandised items are flagged is_pinned and can make page 1 a few items longer than Page Size. scheduled_prices are the retailer's own planned price windows and can change: not a forecast or price history.
- **Get Category Products** takes a /f/ or /c/ path, a URL or a category ID. **Get Deals** reads Clearance (default), Sale or This Week's Deals.
- **Get Product** lists every SKU with its own price, list price, percent off, is_clearance, online units, UPC and buyable flag: prices differ per size and color. **Get Products Summary** is the cheap style-level check for up to 5 product IDs.
- **Get Reviews** returns the 15 newest reviews with full text plus rating stats and distribution: no paging, sort or star filter, and questions and answers are counts only.
- **Get Store Availability** takes SKUs (from Get Product) and a ZIP code or coordinates; it returns unit counts at up to 100 DICK'S, Golf Galaxy or Public Lands stores with address, phone, hours and distance. There is no standalone store locator, and an unknown SKU reads 0 everywhere.
- No price history: to track clearance prices, poll and store your own.

Get Product and Get Reviews usually take 20-75 seconds, up to about 2.5 minutes, so they carry a 240-second request timeout; every other operation carries 120 seconds. Failed calls are not charged.

## What changed in 0.44.0

**JCPenney: Get Reviews and Get Questions, 1 credit each (11 operations).** Both take a Product ID or a Product URL. Nothing else changed.

- **Get Reviews** returns real review text, up to 98 per call (default 38), sorted most recent (default), most helpful, highest or lowest rating, or relevance, optionally one star rating. total_reviews counts every language, displayed_reviews the English reviews JCPenney lists, matching_reviews those under the sort and filter. Each review carries verified_purchaser, incentivized, syndicated with syndication_source, photos, videos, secondary ratings (Quality, Value...) and the brand's response.
- **Get Questions** returns up to 50 questions (default 10; no sort option) with every answer's author_type (brand, retailer for JCPenney staff, ai, customer) and ai_label (AI-Generated / AI-Assisted).
- Reviewer age, gender and IP addresses are never returned.

Both are slower than the other operations: usually 15-90 seconds, up to about 3 minutes, so they carry a 240-second request timeout. Failed calls are not charged.

## What changed in 0.43.0

**New resource: JCPenney, 9 operations, 1 credit each.** jcpenney.com, US only (Puerto Rico stores included), prices in USD. Nothing else changed.

- **Search Products**, **Get Category Products**, **Get Brand Products** and **Get Deals** share one grid: 48 products per page, at most 25 pages (1,200 items deep), with total and total_pages. Filter by Brands, Colors, Sizes, Price Ranges and Deal Labels (comma-separated; several match any of them), or by any facet through Other Filters (JSON), e.g. {"gender": "women"}. Search returns corrected_query when the site autocorrects a keyword and redirected_to when it sends a keyword (doorbusters) to a deal or category listing; Exact Keyword skips the automatic category narrowing.
- **Get Category Products** takes a jcpenney.com /g/ path or URL that carries its id=cat... A department page lists no products without a deal or another filter.
- **Get Deals** reads Clearance (default), Sale, Black Friday deals, Big Buy, Limited Time Special, Best Value, Gotta Have It, Closeout or Buy 1 Get 1, or any Deal Label verbatim, optionally in one department.
- Prices are product-level ranges (regular, sale and clearance min / max, percent_off, price_type) plus the after-coupon price and its code: JCPenney does not expose a price per size or color.
- **Get Product** takes a Product ID, a URL or up to 20 Product IDs. Variants carry SKU, UPC, color, size and an online stock level (high / low / out), not a count. Review text and Q&A arrived in 0.44.0 (Get Reviews, Get Questions).
- **Get Store Availability** takes a SKU (from Get Product) and a ZIP code or coordinates; it returns real unit counts at the 5 nearest stores.
- **Get Coupon Codes** lists today's public JCPenney coupon codes. No price history: to track clearance prices, poll and store your own.

Every operation carries a 120-second request timeout.

## What changed in 0.42.0

**New resource: Kohl's, 9 operations, 2 credits each except Find Stores (1 credit).** kohls.com, US only, prices in USD. Nothing else changed.

- **Search Products**, **Get Category Products**, **Get Brand Products** and **Get Deals** share one grid: 120 products per page with total and total_pages. Up to about 8 sponsored items stay in the list, flagged is_sponsored and counted in sponsored_count. Filter by Brand, Color, Size, On Sale Only, Clearance Only, or any facet value ID through Facet Filters (one per line). Price is a facet bucket ("Price:$25 to $50"), not a free min / max. Sorts include Percent Off and Highest Rated. Search returns corrected_query when the site autocorrects a keyword.
- **Get Category Products** takes a kohls.com catalog path or URL that carries its CN= filter (a product's breadcrumbs[].url works).
- **Get Deals** reads Clearance (default), Sale, items that earn Kohl's Cash now, or Sephora at Kohl's.
- Prices carry price_label (sale, clearance, clearance+regular), percent_off, with_code_price (the price after a public offer code, with the code) and price_suppressed + price_note for cart-only prices.
- **Get Product** takes a Product ID or URL, with an optional Store ID for that store's availability and price per variant. It returns Kohl's Cash earn and redeem windows and public offer codes when the product has them, and dept. Rating and review count only: review text is not available.
- **Get Store Availability** takes a SKU (from Get Product), a ZIP code and optionally the department code; it returns real pickup_units and a stock_level at every store within about 50 miles.
- **Get Coupon Codes** lists today's public Kohl's coupon codes. No price history: to track clearance prices, poll and store your own.

Every operation carries a 120-second request timeout.

## What changed in 0.41.0

**New resource: Saks Fifth Avenue, 9 operations, 2 credits each.** saksfifthavenue.com, US only, prices in USD. Nothing else changed.

- **Search Products**, **Get Category Products**, **Get Brand Products** and **Get Deals** share one grid: 24 positions per page with total, total_pages, start and next_start. An editorial tile can take a grid position, so a page may carry 22-23 items: put the previous next_start in Start to miss nothing (Page also works). Filter by Designers, Colors, Sizes (the facet label, "Medium" not "M"), a price range, On Sale Only, New Arrivals Only, or any facet value through Other Filters (JSON). A keyword the site maps to a designer or category page returns redirected_to.
- **Get Deals** reads Sale, Women's Clothing Sale, Men's Sale, Women's New Arrivals or Men's New Arrivals. Saks has no clearance or final-sale list (items carry is_clearance / is_final_sale flags).
- **Get Product** takes a Product ID (master or variant) or URL, with an optional Color and Size to resolve one variant; every SKU carries its online warehouse unit count. Rating and review count only: review text is not available.
- **Get Store Availability** takes a variant SKU (from Get Product) and a ZIP code or coordinates; units_at_store is present only when the site shows a count, otherwise null. **Find Stores** flags the stores that offer pickup.
- **Get Designers** returns the A-Z designer index (about 1,200 names) with the slugs Get Brand Products takes.

Every operation carries a 120-second request timeout.

## What changed in 0.40.0

**New resource: Macy's, 9 operations, 1 credit each.** macys.com, US only, prices in USD. Nothing else changed.

- **Search Products**, **Get Category Products**, **Get Brand Products** and **Get Deals** share one grid: 60 organic items per page with total and total_pages (totals can differ between sorts, as on the site), filtered by Brands, Colors, Special Offers, a price range, a Pickup Store ID, or any facet value through Other Filters (JSON). Ad-only sponsored tiles are dropped (sponsored_dropped counts them) unless Include Sponsored is on; organic items that also hold a paid slot stay, flagged is_sponsored. A keyword Macy's maps to a category returns redirected_to_category.
- **Get Deals** reads Sales & Offers, Clearance, Today Only, Last Act, Limited-Time Specials or Black Friday Deals.
- **Get Product** takes a Product ID or URL, or up to 10 Product IDs in one call (Macy's summary view: no rating histogram, and a collection without its members' variants). review_count includes ratings without text; **Get Reviews** returns written reviews only.
- **Find Stores** and **Get Store Availability** take a ZIP code, a city and state, or coordinates; Get Store Availability can also check one Store ID per variant (pickup_available, in_store_available). Macy's publishes no unit quantities, so there are no stock counts.

Every operation carries a 120-second request timeout.

## What changed in 0.39.1

**Vinted: corrected market wording.** The Country help text no longer says the United Kingdom, United States and Australia are separate catalogs: every Vinted site can show listings from sellers in other countries, with the price converted to the site's currency, and Get Product returns the seller's own price and currency. Get Filter Options with a Category ID now returns only that category's options (a server-side fix). No parameters changed.

## What changed in 0.39.0

**New resource: Vinted, 9 operations, 1 credit each.** Every operation has a **Country** option covering the 27 Vinted country sites (France by default; United Kingdom, United States, Germany, Poland, Spain, Italy, the Netherlands, Australia and more). Category, condition and filter names come back in the site's language. Nothing else changed.

- **Search Listings** returns 96 items per page, pages 1 to 10 (total_is_capped is true past 960 matches), with price, currency, service_fee (the Vinted fee the buyer pays on top of the price, formerly the Buyer Protection fee), total_price, brand, size, condition, favourites, photos and the seller ID. Every site, United Kingdom (GBP), United States (USD) and Australia (AUD) included, can show listings from sellers in other countries, with the price converted to the site's currency; the EU sites share one cross-border pool. **Get Product** returns the seller's own price and currency. Price sorts surface loosely matching cheap listings, so pair them with a category or price range.
- **Find Brands**, **Get Filter Options** and **Get Categories** return the IDs the Brand IDs, Condition, Size IDs, Color IDs, Material IDs and Category ID options of Search Listings take.
- **Get Product** takes an Item ID or a Vinted item URL (the URL's own site wins) and is priced in the seller's currency.
- **Get Seller**, **Get Seller Listings** and **Get Seller Feedback** take the member ID from a listing's seller. Seller data is limited to public, buyer-relevant fields; feedback carries no reviewer identity.
- Live listings only: no sold-item search, shipping prices, pickup points or similar items.

Every operation carries a 120-second request timeout.

## What changed in 0.38.0

**New resource: TCGplayer, 13 operations, 1 credit each.** tcgplayer.com, US marketplace, prices in USD, every game TCGplayer lists (Pokemon, Magic: The Gathering, Yu-Gi-Oh!, One Piece, Lorcana and 60+ more). Nothing else changed.

- **Get Product** returns the market price per SKU (condition x printing x language, e.g. Near Mint / Normal / English) with the recent sale range (lowest_sale_price, highest_sale_price, sale_count). Those are SALE statistics, not live listings; **Get Listings** returns the live seller offers, up to 50 per page, filtered by condition, printing, language, verified or Direct sellers.
- **Get Price History** returns up to a year of sold volume per SKU (month, quarter, semi-annual, annual); low and high sale prices are null in a bucket with no sales. **Get Recent Sales** returns only the 5 most recent sales.
- **Get Games** -> **Get Sets** -> **Get Price Guide**: a whole set's price table, cards or sealed, up to 500 rows per page.
- **Get Seller**, **Get Seller Feedback** and **Get Seller Products** take the 8-character seller.key from a listing. Feedback buyers appear only as the site's masked nickname.
- Get Product, Get Listings, Get Price History and Get Recent Sales take a Product ID or a tcgplayer.com product URL. An unknown product ID is an error and is not billed.

Every operation carries a 120-second request timeout.

## What changed in 0.37.0

**New resource: Best Buy, 9 operations.** bestbuy.com, US site only. Credits: Search Products, Get Product, Get Reviews and Get Prices 2; Get Category Products 2 for an abcat ID and 3 for a pcmcat page; Get Deal of the Day 3; Find Stores and Get Search Suggestions 1; Get Availability 2 flat. Nothing else changed.

- **Search Products** and **Get Category Products** return 18 organic products per page with filters for brand, on sale, clearance, open box and a price range (set Min Price and Max Price together). Sponsored tiles only with Include Sponsored.
- **Get Product** returns every open-box offer by condition (fair, good, excellent) with savings against new and against the regular price, plus UPC, model and the full spec table.
- **Get Availability** returns store pickup status at up to 8 stores (nearest a ZIP code, or the store IDs you pass): in_stock, limited, ship_to_store, out_of_stock, not_available_for_pickup or unknown. Quantity is set only for limited (Best Buy's "only N left") and is null for in_stock.
- **Get Prices** takes up to 15 SKUs in one call, 2 credits whatever the count.
- **Get Deal of the Day** takes no parameters: today's deal plus the more-deals row, up to 15 products.

Every operation carries a 120-second request timeout.

## What changed in 0.36.0

**New resource: Nordstrom Rack, 8 operations.** nordstromrack.com, US site only, a separate resource from Nordstrom with the same operations, fields and credits: 5 each, Get Availability and Get Reviews 10. Nothing else changed.

- **Get Category Products** takes Rack's /shop and /clearance paths: departments, deals, new arrivals, Clear the Rack (/clearance, /clearance/women/clothing) and flash events (/shop/flash lists the live events as subcategories, /shop/flash/event-7 opens one). There is no /browse on Rack.
- **Get Brand Products** takes /brands/<slug> (/brands/adidas); Rack brand pages carry no brand ID.
- Every product row carries the clearance price range, and during Clear the Rack a clearance item can carry an extra percent off on top: promotion_price_range is the price after it and promotion_percent_off the extra percent. No response carries event start or end dates.
- **Find Stores** and **Get Availability** cover Rack stores only; pickup quantities are chain-wide.
- **Get Reviews** returns Rack's own review pool, separate from nordstrom.com's.

Every operation carries a 120-second request timeout; Get Reviews (15-60 seconds, up to about 100 at 200 reviews) carries 150 seconds.

## What changed in 0.35.0

**Nordstrom: Get Reviews (8 operations in total).** 10 credits. Nothing else changed.

- **Get Reviews**: by **Product URL** or **Style ID**, a product's full review history, up to 200 per call (default 60). Sort by most helpful (default), most recent, highest rated or lowest rated; filter by star ratings, verified purchases, photos or a search text (search text cannot be combined with a sort). Returns the review summary (average rating, total reviews, histogram, size and width rating, praised and criticized features with a quote, rating-only count), the AI review summary, total results, returned and has_more. Rating-only reviews are included with title and text null. Get Product still returns only the reviews shown on the product page (up to about 13).

Get Reviews takes 20-60 seconds (up to about 100 at 200 reviews), so it carries a 150-second request timeout; the other Nordstrom operations keep 120 seconds.

## What changed in 0.34.0

**Nordstrom: 5 new operations (7 in total).** 5 credits each, Get Availability 10. Nothing else changed.

- **Get Category Products**: any nordstrom.com /browse category by path or URL, including sale sections (sale/women), new arrivals (/browse/new) and top-level departments. Same 24-a-page product grid and 6 sorts as Search Products, plus the category's name, title, path, breadcrumbs and subcategories, and the filter sidebar with product counts per option (top 100 options per group). Filters inside a category URL are ignored.
- **Get Brand Products**: a brand page by /brands path or URL (a product's brand_url works). Same grid, sorts and filters, plus the brand's name, path, breadcrumbs and sub-pages.
- **Find Stores**: Nordstrom stores near a ZIP code or latitude/longitude (up to 100 miles), or by store number. Address, phone, hours, the next 8 days' open and close times, coordinates, pickup and curbside flags, and amenities. A ZIP with no store nearby returns an empty list (still billed).
- **Get Availability**: by **Product URL** or **Style ID**, optionally one **SKU ID**. Per SKU: ship quantity, pickup available, pick quantity (chain-wide, not per store) and the named stores that can do in-store pickup (yes or no per store; Nordstrom gives no per-store unit count). 10 credits (two lookups).
- **Get Search Suggestions**: the nordstrom.com search-box autocomplete for a partial term, up to 20 strings.

Every Nordstrom operation carries a 120-second request timeout.

## What changed in 0.33.0

**New resource: Nordstrom, 2 operations, 5 credits each.** nordstrom.com, US site only. Nothing else changed.

- **Search Products**: 24 products a page with style ID, brand, current and original price ranges, percent off, on-sale flag, rating, review count, badges, low-inventory flag, marketplace seller and colors. Sort by relevance, rating, price, newest or percent off.
- **Get Product**: by **Product URL** or **Style ID**. Every color and size as a SKU with UPC, price, price type (regular, clearance, promotion), in stock (can be shipped or picked up in a store) and the quantity available to ship online, so a store-only SKU reads in stock with quantity 0; star histogram, size-fit distribution, praised and criticized features, and the reviews shown on the product page (up to about 13, with the total review count and histogram; Get Reviews, added in 0.35.0, returns the rest). An unknown style ID is an error.

Both operations carry a 120-second request timeout.

## What changed in 0.32.0

**Menards: Search Products.** Search menards.com at one store (Store ID required), 40 products a page, each with price, sale price, the mail-in rebate, final price and that store's stock count. Sort by relevance, price or brand; filter to in stock today or a price range. 2 credits. Nothing else changed.

## What changed in 0.31.0

**New resources: Whole Foods Market, Harbor Freight, PetSmart, Petco, iHerb, Chewy and Menards, 33 operations.** Nothing else changed.

- **Whole Foods Market** (1 credit): Search Products, Get Category Products, Get Deals, Get Product, Find Stores, Get Store and Get Sales Flyer. Prices are per store: pass a 5-digit **Store ID** from Find Stores (listings default to 10145, Austin). Each item carries the regular, sale and Prime member price. Get Product returns the in-store and online prices as two separate blocks, and only when a Store ID is set. No ratings, reviews, UPC or per-store unit stock. Search Products sorts by relevance or price only.
- **Harbor Freight** (1 credit): Search Products, Find Clearance Items, Get Product, Get Prices, Find Stores, Get Availability and Get Reviews. Prices are national and include the sale price with its end date, the public coupon price, the Inside Track Club member price and the compare-at price. Get Prices checks up to 50 item numbers in one call. Get Availability reports a stock status per store (in_stock, limited, out_of_stock or not_carried) with the aisle, from a daily snapshot, not unit counts.
- **PetSmart** (1 credit): Search Products, Get Product, Find Stores, Get Store Stock, Get Availability and Get Deals. Prices are national, with the Autoship first-order and recurring price on Get Product. Stock is a unit count per store: Get Store Stock checks up to 20 SKUs at one store, Get Availability up to 20 **store:SKU** pairs. Get Deals rows carry `on_sale`, because the Sale section also lists promotions that do not reduce the price.
- **Petco** (1 credit): Search Products, Get Category Products, Get Product, Find Stores and Get Store Inventory. Prices are national, with the Repeat Delivery (autoship) price. Get Store Inventory takes `cat_entry_id` values from search or product results, not part numbers. Get Product and Get Category Products can take 10-30 seconds; both carry a 120-second request timeout.
- **iHerb** (2 credits): Search Products, Get Product, Get Prices and Get Reviews. US store, USD, online only (no stores). Get Prices checks up to 50 product IDs in one call. Get Reviews is a summary: rating, star histogram and the top positive and top critical review, not a full review list.
- **Chewy** (10 credits): Search Products and Get Product. One-time, Autoship and first-Autoship prices, MAP fields and ratings. A broad keyword can land on a category page; `redirect` then names the category. No stores.
- **Menards** (1 credit; Get Product with a Store ID 2): Get Product and Find Stores. There is no search: look a product up by **Item ID** or URL. Get Product returns mail-in rebates such as the 11% rebate and the final price after rebates. A **Store ID** adds that store's stock quantity and aisle, costs 2 credits and can take 10-40 seconds; Get Product carries a 120-second request timeout.

## What changed in 0.30.1

CVS Search Products: `same_day_delivery` is now always empty, as on Get Store Stock. CVS reports one same-day count per SKU whichever store is sent, so it was not the store's number.

## What changed in 0.30.0

**New resources: Sephora, Ulta Beauty, ALDI, Micro Center, Walgreens and CVS, 20 operations.** Nothing else changed.

- **Sephora** (1 credit, Get Product 2): Search Products, Get Category Products and Get Product. Get Product takes a **Product URL** (faster) or a **Product ID** and returns every shade or size as a SKU with price and stock, plus a summary of what reviews say with pro and con sentiment counts. It carries no review text. Set a **ZIP Code** in Search Products for same-day delivery eligibility.
- **Ulta Beauty** (1 credit): Search Products, Get Category Products, Get Product and Get Store Availability. Get Store Availability reports in stock or out of stock for one shade or size at the 10 stores nearest a ZIP code, not unit counts. Search and category pages carry sponsored placements that can repeat across pages; dedupe by `product_id`.
- **ALDI** (1 credit): Search Products, Get Product and Find Stores. Prices are per store and per **Shopping Mode**: In Store (the shelf price, default), Pickup or Delivery (online prices, often higher). Pass a **Store ID** from Find Stores, or a **ZIP Code** to use the nearest store. ALDI has no product ratings.
- **Micro Center** (2 credits; Get Stores 1): Search Products, Get Product and Get Stores. Stock is per 3-digit **Store ID** from Get Stores; leave it empty for the web store (029), which lists shippable items only. Stock counts are capped at 25+ (`quantity_capped`). Get Product adds open-box units and an in-stock yes/no for every store.
- **Walgreens** (2 credits; Get Store Stock 4): Search Products, Get Product, Find Stores and Get Store Stock. Prices are national. Get Store Stock returns one product's unit count at up to 20 stores in one call.
- **CVS** (1 credit): Search Products, Get Product and Get Store Stock. There is no store locator: the store number is on every cvs.com store page. Search stock defaults to store 7019 (New York) and prices are the same at every store. Get Store Stock checks up to 20 SKUs at one store. Get Product can take 10-30 seconds or more; it carries a 120-second request timeout.

## What changed in 0.29.0

**New resources: Lowe's, Sam's Club, Canadian Tire and Dollar General, 21 operations.** Each returns prices and stock for the one store or club you choose. Nothing else changed.

- **Lowe's** (2 credits; Get Reviews 1): Search Products, Get Product, Find Stores and Get Reviews. Search and Get Product take a required **Store ID** and that store's **ZIP code**, both from Find Stores. Turn on **On Sale Only** in Search Products for the store's deals. Get Product adds on-hand stock per fulfillment method, stock at nearby stores, and aisle and bay.
- **Sam's Club** (2 credits, Find Clubs 1): Search Products, Get Product, Find Clubs, Get Instant Savings, Get Category Products and Get Reviews. Search, Instant Savings and Category Products price a nearby club chosen by location (echoed in `club`); for a specific club, use Get Product with a **Club ID** from Find Clubs. Clearance is category `1150109`. `available_quantity` is capped at 8 (8 means 8 or more).
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
| Company (Enrich) | Google > Maps Search | A niche plus a place into the `place_id` Enrich takes (or pass the business's website directly) |
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
- **Company Enrich usually takes 10-45 seconds**, up to about 2 minutes on a slow site, and costs 10 credits from a website, 20 from a place ID. The operation carries a 180-second timeout; run large Maps lists in batches rather than raising concurrency.
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
