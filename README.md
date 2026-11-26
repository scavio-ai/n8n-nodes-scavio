# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) — a real-time structured-data API for search, AI assistant answers, retail, social, travel, real estate, jobs, app stores, software reviews, ad libraries, public company filings, and any URL — in your n8n workflows.

Scavio returns clean, structured JSON from 148 resources and 1,193 operations. Use it to power product research, price and review monitoring, AI agent retrieval, lead enrichment, competitive and ad intelligence, and content workflows.

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
| [Home Depot (US; Canada via Country)](https://scavio.dev/docs/home-depot-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2, Get Delivery Quote 4; 1 for Home Depot Canada | Search Products, Get Product, Get Reviews, Find Stores, Get Availability, Get Delivery Quote (US only); Canada only: Get Category Products, Get Categories, Get Store Stock, Get Store, Get Search Suggestions |
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
| [Ace Hardware (US)](https://scavio.dev/docs/acehardware-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Products 2 (3 on a category redirect); Get Product 2; Get Store Stock 1 per 5 stores (Nearby 6); Find Nearest Stores with details 1 per store lookup (25 stores 6) | Search Products, Get Product, Get Store Stock, Get Store, Find Nearest Stores, Get Category Products, Get Categories, Get Brand Products, Get Deals, Get Weekly Ad, Get Paint Colors |
| [Tractor Supply (US)](https://scavio.dev/docs/tractorsupply-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Product 2 on the first call for a store not yet looked up; Get Store Prices 1 per 5 lookups (25 new stores 11) | Search Products, Get Product, Get Store Prices, Get Store Stock, Get Fulfillment, Find Stores, Get Store, Get Category Products, Get Categories, Get Brand Products, Get Deals, Get Promotions |
| [Michaels (US, Canada)](https://scavio.dev/docs/michaels-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Category Products and Get Deals 4 with a /shop/ category | Search Products, Get Product, Get Store Stock, Get Store Inventory, Find Stores, Get Store, Get Category Products, Get Categories, Get Brand Products, Get Deals, Get Search Suggestions |
| [Nike (62 storefronts)](https://scavio.dev/docs/nike-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Deals, Get Releases, Get Release, Get Reviews |
| [Staples (US; Canada search and product)](https://scavio.dev/docs/staples-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Get Category Products, Get Categories, Get Deals, Get Coupons, Get Store Stock, Find Stores, Get Store, Get Reviews, Get Questions, Get Trending Searches |
| [Sam's Club](https://scavio.dev/docs/samsclub-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Find Clubs 1 | Search Products, Get Product, Find Clubs, Get Instant Savings, Get Category Products, Get Reviews |
| [Canadian Tire](https://scavio.dev/docs/canadiantire-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Availability, Find Clearance Items, Get Deals |
| [SportChek (Canada)](https://scavio.dev/docs/sportchek-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get List Page, Get Product, Get Reviews, Get Search Suggestions, Get Store, Get Brands, Get Categories |
| [Mark's (Canada; French via L'Equipeur)](https://scavio.dev/docs/marks-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get List Page, Get Product, Get Questions, Get Search Suggestions, Get Store, Get Brands, Get Categories |
| [RONA (Canada)](https://scavio.dev/docs/rona-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | Get Store Prices, Get Categories, Find Stores and Get Store 1; Search Products and Get Deals 2 (3 with a Store ID; Search Products 2 more when RONA redirects the term); Get Product 3; Get Store Stock 3; Get Category Products 2 (3 with a Store ID), or 1 with a Family ID and a Store ID | Search Products, Get Product, Get Store Prices, Get Category Products, Get Categories, Find Stores, Get Store, Get Store Stock, Get Deals |
| [Dollar General](https://scavio.dev/docs/dollargeneral-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Deals, Get Coupons |
| [Dollar Tree (US; Canada store pages)](https://scavio.dev/docs/dollartree-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Find Stores 5 | Search Products, Get Product, Get Category Products, Get Categories, Get Brand Products, Get Deals, Get Store Stock, Find Stores, Get Store, Get Reviews |
| [Discount Tire (US)](https://scavio.dev/docs/discounttire-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Tires by Size, Get Vehicle Fitment, Get Tires for Vehicle, Get Product, Get Model, Get Store Stock, Find Stores, Get Store, Get Reviews, Get Store Reviews, Get Wheels, Browse Tire Models, Get Categories, Get Suggestions, Get Appointment Availability |
| [Vevor (13 storefronts)](https://scavio.dev/docs/vevor-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Prices Across Storefronts 3 | Search Products, Get Product, Get Shipping, Get Reviews, Get Questions, Get Search Suggestions, Get Categories, Get Category Products, Get Collection, Get Deals, Get Prices Across Storefronts |
| [Nellis Auction (6 US shopping locations)](https://scavio.dev/docs/nellis-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Lots, Get Lot, Get Locations, Get Categories |
| [Bring a Trailer](https://scavio.dev/docs/bringatrailer-results?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Auction Results, Get Price History, Get Listing, Get Live Auctions, Get Make, Get Model, Get Location, Get Suggestions |
| [Sephora (US; Canada via Country)](https://scavio.dev/docs/sephora-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Product and Get Offers 2 (the same for Canada) | Search Products, Get Category Products, Get Product; Canada only: Get Brand Products, Get Brands, Get Search Suggestions, Get Offers, Find Stores, Get Store |
| [Ulta Beauty](https://scavio.dev/docs/ulta-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Product, Get Store Availability |
| [Dermstore (US and Canada)](https://scavio.dev/docs/dermstore-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get List Page, Get Product, Get Suggestions, Get Offers, Get Brands, Get Categories |
| [Space NK (UK, Ireland, Netherlands, Australia)](https://scavio.dev/docs/spacenk-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (listings with Fill All Products up to 5) | Search Products, Get Category Products, Get Brand Products, Get Brands, Get Product, Get Reviews, Get Suggestions, Get Stores, Get Offers |
| [Lookfantastic (10 country sites)](https://scavio.dev/docs/lookfantastic-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get List Page, Get Product, Get Suggestions, Get Offers, Get Brands, Get Categories |
| [Cult Beauty (UK and international)](https://scavio.dev/docs/cultbeauty-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get List Page, Get Product, Get Suggestions, Get Offers, Get Brands, Get Categories |
| [YesStyle (39 countries; reviews and suggestions 153)](https://scavio.dev/docs/yesstyle-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1-3 | Search Products, Get Category Products, Get Brand Products, Get Deals, Get Product, Get Reviews, Get Suggestions, Get Brands, Get Markets |
| [Notino (27 storefronts)](https://scavio.dev/docs/notino-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (gb 2); paged lists 3 (gb 4) | Search Products, Get Product, Get Reviews, Get Category Products, Get Brand Products, Get Promo Products, Get Brands, Get Suggestions, Find Stores, Get Store |
| [Douglas (15 storefronts in Europe)](https://scavio.dev/docs/douglas-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (Italy 2; Variant EANs +1 per variant) | Search Products, Get Category Products, Get Brand Products, Get Deals, Get Product, Find Stores, Get Store, Get Review Summary, Get Suggestions, Get Brands |
| [Boots (UK and Ireland)](https://scavio.dev/docs/boots-product?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (2 when answered on a second attempt; 3 for two-step lookups) | Get Product, Get Store Stock, Find Stores, Get Store |
| [ALDI](https://scavio.dev/docs/aldi-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores |
| [Instacart (US; Canada in English or French, except Search Across Stores and Get Reviews)](https://scavio.dev/docs/instacart-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Search Products 3 (2 when the page fits in the first answer); Search Across Stores 3 up to 5 stores, 4 for 6 to 10 | Get Retailers, Search Products, Search Across Stores, Get Product, Compare Prices Across Stores, Get Categories, Get Category Products, Get Deals, Find Pickup Stores, Get Suggestions, Get Reviews |
| [PC Express (Canada: Real Canadian Superstore, No Frills, Loblaws, Zehrs, Fortinos, Valu-mart, Your Independent Grocer, Wholesale Club, Provigo, Maxi)](https://scavio.dev/docs/pcexpress-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Product 5 (1 when it answers from the search listing); Get Store 5 | Search Products, Get Category Products, Get Collection, Get Product, Find Stores, Get Store, Get Search Suggestions |
| [Micro Center](https://scavio.dev/docs/microcenter-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Stores 1 | Search Products, Get Product, Get Stores |
| [Walgreens](https://scavio.dev/docs/walgreens-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Store Stock 4 | Search Products, Get Product, Find Stores, Get Store Stock |
| [CVS](https://scavio.dev/docs/cvs-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (Get Product 2) | Search Products, Get Product, Get Store Stock |
| [Whole Foods Market](https://scavio.dev/docs/wholefoods-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Deals, Get Product, Find Stores, Get Store, Get Sales Flyer |
| [Harbor Freight](https://scavio.dev/docs/harborfreight-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Find Clearance Items, Get Product, Get Prices, Find Stores, Get Availability, Get Reviews |
| [AutoZone (US; Brazil search, product and store stock; Mexico vehicles and stores)](https://scavio.dev/docs/autozone-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Brazil Search Products and Get Product 2; Get Store Stock (Brazil) 2 | Search Products, Get Product, Get Category Products, Get Brand Products, Get Vehicles, Get Reviews, Find Stores, Get Store, Get Categories, Get Clearance, Get Rebates, Get Store Stock (Brazil) |
| [O'Reilly Auto Parts (US; Mexico store directory on Find Stores and Get Store)](https://scavio.dev/docs/oreilly-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Product by line code and part number 4; Cross-Reference Part Number 2 / 4 / 6 by inputs; Get Brand Products brand index 4; Get Store Stock and Find Stores by ZIP 4; Get Deals 4 | Search Products, Cross-Reference Part Number, Get Product, Get Vehicles, Get Compatibility, Get Category Products, Get Categories, Get Brand Products, Get Store Stock, Find Stores, Get Store, Get Suggestions, Get Rebates, Get Deals |
| [RockAuto (US catalog, 15 currencies)](https://scavio.dev/docs/rockauto-vehicles?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Get Vehicles, Get Vehicle Categories, Get Vehicle Parts, Search Part Number, Get Brand Parts, Get Brands, Get Part, Get Suggestions, Resolve Vehicle, Get Tools Catalog, Get Promotions |
| [Cars.com (US)](https://scavio.dev/docs/carscom-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Listing, Get Dealer, Get Dealer Inventory, Get Dealer Reviews, Get Model Reviews, Find Dealers, Get Research |
| [Autotrader (US)](https://scavio.dev/docs/autotrader-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Listings, Get Listing, Find Dealers, Get Dealer, Get Make Models |
| [CarGurus (US, Canada, UK; Spanish and French pages)](https://scavio.dev/docs/cargurus-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Dealer, Find Dealers, Get Price Trends, Get Research Page, Get Expert Reviews, Get Makes, Get Models |
| [CarMax (US)](https://scavio.dev/docs/carmax-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Cars, Get Listing, Get Photos, Get Stores, Get Store, Get Store Inventory, Get Reviews, Get Review Summary, Get Suggestions, Get Makes, Get Models, Get Car Value |
| [Carvana (US)](https://scavio.dev/docs/carvana-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Vehicles, Get Vehicle, Get Model Year Guide, Get Trims, Get Lineup, Get Makes |
| [TrueCar (US)](https://scavio.dev/docs/truecar-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Vehicles, Get Listing, Get Model Overview, Get Owner Reviews, Get Dealer, Get Dealer Inventory, Get Suggestions, Get Makes, Get Models |
| [Edmunds (US)](https://scavio.dev/docs/edmunds-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Listings, Get Listing, Get Consumer Reviews, Get Dealer, Get Model, Get MSRP and Price, Get Appraisal Values, Get Makes and Models |
| [Kelley Blue Book (US)](https://scavio.dev/docs/kbb-car-value?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 (Get Car Value with ZIP Code 2, up to 6; deeper Get Reviews pages 1 or 5) | Get Car Value, Get Model Year, Search Cars for Sale, Get Listing, Get Reviews, Find Dealers, Get Dealer, Get Makes and Models |
| [PetSmart](https://scavio.dev/docs/petsmart-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Product, Find Stores, Get Store Stock, Get Availability, Get Deals |
| [Petco](https://scavio.dev/docs/petco-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Products, Get Category Products, Get Product, Find Stores, Get Store Inventory |
| [iHerb](https://scavio.dev/docs/iherb-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 | Search Products, Get Product, Get Prices, Get Reviews |
| [Chewy](https://scavio.dev/docs/chewy-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 10 | Search Products, Get Product |
| [Menards](https://scavio.dev/docs/menards-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | Search Products 2; Get Product 1, 2 with a Store ID; Find Stores 1 | Search Products, Get Product, Find Stores |
| [Nordstrom](https://scavio.dev/docs/nordstrom-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5; Get Availability and Get Reviews 10 | Search Products, Get Product, Get Reviews, Get Category Products, Get Brand Products, Find Stores, Get Availability, Get Search Suggestions |
| [Nordstrom Rack](https://scavio.dev/docs/nordstromrack-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 5; Get Availability and Get Reviews 10 | Search Products, Get Product, Get Reviews, Get Category Products, Get Brand Products, Find Stores, Get Availability, Get Search Suggestions |
| [Best Buy (US; Canada via Country)](https://scavio.dev/docs/bestbuy-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2; Get Category Products 3 on a pcmcat page; Get Deal of the Day 3; Find Stores and Get Search Suggestions 1; 1 for Best Buy Canada | Search Products, Get Product, Get Reviews, Get Category Products, Get Deal of the Day, Find Stores, Get Availability, Get Search Suggestions, Get Prices; Canada only: Get Questions |
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
| [OfferUp (US)](https://scavio.dev/docs/offerup-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1; Get Listing 1, or 2 when the listing needs a second, costlier fetch | Search Listings, Get Listing, Get Category Listings, Get Categories, Get Seller |
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
| [Rent.com (US; Apartment Guide via Site)](https://scavio.dev/docs/rentcom-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Rentals, Get Listing, Get Building, Get Rent Trends, Get Suggestions, Get Cities |
| [Trulia (US; Spanish rental pages)](https://scavio.dev/docs/trulia-neighborhood?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Get Neighborhood, Search Homes, Get Property, Get School, Get Suggestions |
| [StreetEasy (NYC and North NJ)](https://scavio.dev/docs/streeteasy-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Listings, Get Listing, Get Building, Get Buildings, Get Market Data |
| [RentCafe (US and Canada; French pages)](https://scavio.dev/docs/rentcafe-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Rentals, Get Property, Get Floor Plan Units, Get Reviews, Get Suggestions, Get Rent Trends |
| [Booking.com](https://scavio.dev/docs/booking-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Properties, Get Hotel, Get Hotel Reviews |
| [Airbnb](https://scavio.dev/docs/airbnb-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 1 | Search Stays, Get Listing, Get Reviews |
| [Vrbo (20 market-languages)](https://scavio.dev/docs/vrbo-search?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) | 2 (Search Properties 2 per attempt, 2-8) | Search Properties, Get Property, Get Suggestions |
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

## What changed in 0.95.0

**8 new resources, 50 operations:** Rent.com, Trulia, StreetEasy, RentCafe, Vrbo, TrueCar, Edmunds, Kelley Blue Book. All are new resources; no existing operation changed.

**New resource: Rent.com, 6 operations.** Rent.com (rent.com) and Apartment Guide (apartmentguide.com, the same rentals), the US rental listing sites run by Redfin: rentals by city and state, ZIP or neighborhood with the listed rent, rent by bed count, units available, rent specials and price drops; one rental in full with floor plans and their units, fees, pet policies, parking and amenities; the unit listings in one building; Rent.com's average rent per bed count with its year-on-year change and monthly series; search-box suggestions; and the cities of a state. See the [Rent.com API page](https://scavio.dev/rentcom-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Search Rentals**: City and State (optionally a Neighborhood) or a ZIP Code; property type, beds, baths, monthly rent range, minimum square feet, pets, cheap or luxury, rent specials, up to 8 amenities, 6 sorts; 30 a page on Rent.com, 50 on Apartment Guide (captured 2026-11-26: 2-bed apartments in Austin, TX by lowest price gave 1819 listings and 20380 available units, the first from 624 USD a month).
- **Site**: Rent.com (default) or Apartment Guide on Search Rentals, Get Listing and Get Suggestions. Apartment Guide takes City and State (with one Beds value) or a ZIP Code, and Page; every other filter is Rent.com only.
- **Get Listing**: floor plans with their units, fees, pet policies, parking, amenities, office hours, rent specials, price drops, lease terms, schools, nearby places and walk score. Apartment Guide's 5898701 and Rent.com's lc5898701 are the same listing.
- **Get Rent Trends**: the current average rent per bed count with its year-on-year change and the monthly series as Rent.com publishes it on the page; series_range says which months it covers, and it can end well before today (captured 2026-11-26: Los Angeles, CA, 2024-04 to 2025-05).
- No phone number, email or agent or landlord name is returned; the management company is given only for listings a property manager pays to list.
- Not available: rental applications or tours, price history beyond the listed price drops, homes for sale.

Every Rent.com operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged, and a page past the last one is an empty page with a note (charged).

**New resource: Trulia, 5 operations.** Trulia (trulia.com, Zillow Group's home and neighborhood site): one neighborhood with Trulia's "What Locals Say" survey results and safety statements, resident reviews, homes for sale and for rent, the commute, amenities, schools and Trulia's market snapshot; homes for sale, for rent or recently sold; one home or rental building in full; one school with its GreatSchools ratings; and place suggestions. See the [Trulia API page](https://scavio.dev/trulia-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Get Neighborhood**: survey results and safety statements with their percentages, resident reviews (up to 40 shown; the total and category counts cover all), facts, amenities, schools and (on by default, same credit) the market snapshot and median sale price history with the scope Trulia gives them (captured 2026-11-26: Upper East Side, New York, 1480 survey responses, 277 resident reviews, average sale price $1.47M in October 2026). Crime data is no longer on Trulia.
- **Search Homes**: a ZIP code, "City, ST" or "Neighborhood, City, ST"; for sale (default), for rent or recently sold; bed, bath, price, square-foot, year-built and HOA filters, property types, keyword, pets on rentals, 7 sorts, 40 a page up to page 50 (captured 2026-11-26: homes for sale in Austin, TX gave 2146).
- **Get Property**: a home by zpid, a rental building by building ID, or either by link: Zestimate and Rent Zestimate as Trulia shows them, price and tax history, payment estimate, the neighborhood's location ID, and for buildings floor plans with units, fees and special offers.
- **Language**: English or Spanish where Trulia publishes Spanish pages: rental searches, buildings and neighborhoods.
- No listing-agent names, phones, emails or license numbers and no reviewer names are returned; brokerage company names are.
- Not available: crime data, agent profiles, more than 50 pages of one search.

Every Trulia operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: StreetEasy, 5 operations.** StreetEasy (streeteasy.com, Zillow Group's New York City real estate site, covering NYC's five boroughs and North New Jersey): homes for sale, rentals and past sales with StreetEasy's own filters and sorts, net effective rent and months free on rentals, one listing in full with its price changes, monthly charges and the unit's past listings, one building with its policies and per-bedroom inventory, the building directory of an area, and the monthly market data StreetEasy publishes for New York City. StreetEasy publishes no public API for its listings. See the [StreetEasy API page](https://scavio.dev/streeteasy-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Area** is required on Search Listings and Get Buildings: a borough, a neighborhood, a North NJ city, nyc, or a StreetEasy area ID (captured 2026-11-26: rentals in Jersey City gave 2927 listings).
- **Search Listings**: Mode For Sale, For Rent or Sold; price, bedrooms, bathrooms, size, home type, sale type, year built, amenities, pets, ZIP, by owner (rent), in contract (sale), 7 sorts, up to 100 pages. Featured and sponsored cards come first, with their placement.
- **Get Listing**: by link or path, or by ID with a Listing Type (sale or rent). Price changes, monthly maintenance, taxes and common charges, net effective rent and months free, move-in fees, the unit's past listings and the area's recent-listing prices for that bedroom count (captured 2026-11-26: a one-bedroom at 99 Provost Street, Jersey City, at 4730 USD a month, net effective 4336 USD with 2 months free).
- **Get Market Data**: New York City only (New Jersey areas have no published series); sales by home type or rentals by bedrooms, monthly from 2010-01 (captured 2026-11-26: Williamsburg median sale price 1450000 USD in 2026-10).
- No agent or private landlord names, emails, phones or photos are returned; the brokerage is.
- Not available: agent profiles, reviews (StreetEasy has none), search suggestions, the Hamptons.

Every StreetEasy operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: RentCafe, 6 operations.** RentCafe (rentcafe.com, Yardi's US and Canada rental listing site): rental search in any US or Canadian city, ZIP code, neighborhood or state, rents in USD or CAD, English or French pages; one listing in full with every floor plan, its fees and pet policy, amenities and RentCafe's own renters summary; every unit of a floor plan with its base rent and move-in date; resident reviews; location and property suggestions; and the rent trends RentCafe publishes for US cities. See the [RentCafe API page](https://scavio.dev/rentcafe-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Search Rentals**: by Location (austin-tx, 78704-tx, downtown-toronto-toronto-on, a state), City and State, or ZIP Code and State; property type, ONE Filter per search (beds, rent specials, short-term, furnished, utilities included or an amenity) plus price range and pet-friendly, 5 sorts, 25 a page (captured 2026-11-26: 2-bedroom apartments in austin-tx gave 4228 listings; toronto-on 8559 in CAD).
- **Market and Language**: United States (USD) or Canada (CAD), read from the location when left as is; French returns RentCafe's French pages with the same listings and prices.
- **Get Property**: floor plans with their units and rents, policies (deposit, application and pet fees), amenities, category ratings, RentCafe's renters summary and reviews (captured 2026-11-26: Bridge At Indigo in Austin, 1130 to 2880 USD across 9 floor plans, rated 4 from 39 reviews). Get Floor Plan Units lists every unit of one floor plan with its base rent and move-in date.
- **Get Reviews**: 10 a page in RentCafe's order; RentCafe offers no review sort or star filter. No reviewer names.
- **Get Rent Trends**: US cities only (captured 2026-11-26: Austin, TX averaged 1643 USD, 1664 a year earlier); a city without a rent trends page is a not-found, not charged.
- Not available: tours, contact or application forms, price alerts, price history.

Every RentCafe operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged (except Get Rent Trends).

**New resource: Vrbo, 3 operations.** Vrbo (vrbo.com, Expedia Group's vacation rental site) in 20 vrbo.com market-languages: vacation-rental search by place or region ID for your dates and guests, with the nightly price, the total for the stay, the was price, Vrbo's fees line and refund deadline, the guest rating and Premier Host badges; one property in full with every amenity group, house rules, highlights, photos and what is nearby; and Vrbo's destination suggestions. Vrbo's own API (Expedia Group's partner program) is for approved partners, not self-serve. See the [Vrbo API page](https://scavio.dev/vrbo-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: United States (default, USD), United Kingdom (GBP), Canada in English or French (CAD), Mexico (MXN), Brazil (BRL), Spain, Italy, Portugal, Netherlands, Austria, Greece, Finland (EUR), Denmark (DKK), Sweden (SEK), Norway (NOK), Japan (JPY), Singapore (SGD), Australia (AUD), New Zealand (NZD), each in its own language and currency. abritel.fr, fewo-direkt.de, stayz.com.au and bookabach.co.nz are separate sites and are not covered.
- **Search Properties**: Destination or Region ID plus Check-In and Check-Out (at most 90 nights); adults, children's ages, 5 sorts and Vrbo's filters (property type, amenity, house rule, pets, location type, Premier Host, minimum bedrooms). The first 50 results only: Vrbo's results pages carry no further page. Vrbo sometimes answers with a 3-result page; Scavio asks again (up to 4 attempts) and returns those 3 with partial: true if that is all Vrbo gives (captured 2026-11-26: Destin, Florida for 2027-01-15 to 2027-01-18 with 2 adults gave 50 of 394 matched properties, the first at 264 USD a night, 792 USD for 3 nights).
- **Get Property**: read without dates; default_price is the site's own default stay, not a quote. Host: Premier Host flag and languages only (no host name, biography or photo).
- Not available: reviews, the availability calendar, dated prices on a property (use Search Properties), results past the first 50, booking.

Get Property and Get Suggestions cost 2 credits; Search Properties costs 2 per attempt, 2 to 8 (usually 2 to 6). credits_used says what was charged. Every operation carries a 240-second request timeout (a search can take about 3 minutes). Failed calls are not charged; a not-found is charged.

**New resource: TrueCar, 9 operations.** TrueCar (truecar.com, the US car-buying marketplace): new and used dealer inventory around any US ZIP with the price, MSRP, TrueCar's own price label and rating as given, mileage, history counts and the dealer; one listing in full by VIN or link with TrueCar's price summary, dealer fees, specs, warranties and history flags; TrueCar's model overviews with trims, starting MSRP and the starting market average; owner reviews per generation; dealer profiles and one dealer's lot; makes, models and suggestions. TrueCar has no public API. See the [TrueCar API page](https://scavio.dev/truecar-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **ZIP Code** is required on Search Vehicles (US only, USD; captured 2026-11-26: a used Toyota RAV4 around 10001 gave 2440 vehicles, the first a 2017 RAV4 Hybrid XLE at 16485 USD with 125334 miles, 5.8 miles away). TrueCar also lists far-away vehicles offered with delivery: read distance_miles.
- **Search Vehicles**: make and model (names or slugs), 30 a page, TrueCar's ten sorts, radius, year, price, maximum mileage, trim, body style, drivetrains, colours, fuel types, accident-free and certified pre-owned; total is capped at 10,000 by TrueCar. Get Dealer Inventory lists one dealer's lot the same way.
- **Get Listing**: by VIN or truecar.com listing link. The VIN is an input only and is never returned: Search Vehicles and Get Dealer Inventory carry no VIN or listing link, so their results cannot be passed to Get Listing.
- **Get Model Overview**: trims with starting MSRP and TrueCar's Starting Market Average as labelled (captured 2026-11-26: 2026 Toyota RAV4 LE from 33495 USD MSRP, starting market average 32766.12 USD, owner rating 4.38 from 5069).
- **Get Owner Reviews**: grouped by generation as TrueCar groups them, star and text filters, up to 100 a page in TrueCar's own order; no reviewer names, initials or states.
- Not available: keyword search, a mileage minimum, private sellers, a review sort, dealer reviews, delivery quotes, payment estimates, price history.

Every TrueCar operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Edmunds, 8 operations.** Edmunds (edmunds.com, the US car research and shopping site owned by CarMax): new and used car listings around any US city with the price, price change, MSRP and Edmunds' own local and national deal rating as given; one listing in full with dealer fees and price history; owner reviews per model year; dealer pages with sales and service ratings and reviews; a model year's research page with Edmunds' expert review; MSRP, invoice and Edmunds Suggested Price per trim; and Edmunds' used-car values per condition. Edmunds' own API is for partners and dealers only. See the [Edmunds API page](https://scavio.dev/edmunds-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **City and State** are required on Search Listings (US only, USD); a ZIP is not accepted, because Edmunds places a search by its own city pages (captured 2026-11-26: a used Toyota RAV4 around New York, NY gave 3124 listings, among them a 2015 RAV4 Limited at 7995 USD with 157526 miles, rated Great against Edmunds' local estimate of 13201 USD).
- **Search Listings**: make and model or every make (used), radius 10-500 miles, 5 sorts, year, price and mileage ranges, trim, drivetrain, exterior colour, body type, deal rating and no accidents, 21 a page.
- **Get Listing**: by VIN with make, model and year, or by its edmunds.com link. The VIN is an input only and is never returned anywhere; listing photos are not returned.
- **Get MSRP and Price** and **Get Appraisal Values**: Edmunds computes its Suggested Price and its used-car values for a place of its own and names it (suggested_price_near, values_near); read it with the figures (captured 2026-11-26: 2025 Toyota RAV4 XLE, Edmunds Suggested Price 30140 USD near Paramus, NJ 07652). Appraisal values are Edmunds' estimates, not an offer.
- **Get Consumer Reviews** and **Get Dealer**: no reviewer names; names are also taken out of dealer replies. Private sellers show city and state only.
- Not available: ZIP-based search, a VIN-specific appraisal, stock numbers, listing photos.

Every Edmunds operation costs 2 credits; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Kelley Blue Book, 8 operations.** Kelley Blue Book (kbb.com, Cox Automotive's car value and research site): a car's Kelley Blue Book values by make, model, year, trim, condition and mileage, every price type KBB gives (17 for a used car) with KBB's adjustments, optionally for a US ZIP code; one model year's trims, depreciation, specs and rankings; cars for sale around a ZIP with KBB's deal rating; one listing in full; owner reviews; dealers near a ZIP and one dealer's inventory; and KBB's make and model directory. KBB's own data feed is a business contract, not a self-serve API. See the [Kelley Blue Book API page](https://scavio.dev/kbb-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Get Car Value**: Make, Model (KBB's slug), Model Year and Trim (trim slug from Get Model Year, vehicle ID or a unique trim name); Intent, Condition, Mileage and ZIP Code are optional. Without a ZIP code the values are for KBB's default location; ZIP Code needs Mileage and works for Buy Used and Trade In or Sell, not Buy New (captured 2026-11-26: a 2021 Toyota RAV4 LE Sport Utility 4D at 40000 miles in good condition had a Fair Purchase Price of 25950 USD at KBB's default ZIP 92620 and 25410 USD at ZIP 10001).
- **Search Cars for Sale**: ZIP Code required; used, new or all, make and model (never widened to the whole make), radius, 4 sorts, year, price and mileage ranges, drivetrain, exterior colour, dealer or private seller, 25 or 100 a page (captured 2026-11-26: used Toyota RAV4 around 10001 gave 574 listings).
- **Get Reviews**: 8 a page, pages 1 to 10, 3 sorts and a star filter; no reviewer name, nickname or location.
- **Find Dealers**: up to 50 nearest a ZIP code; no paging, so narrow with Radius or Make. Dealer details are the dealer's public business details.
- No VIN or stock number is returned; private sellers carry city, state and distance only.
- Not available: dealer reviews (rating and count only), a VIN lookup, review pages past 10, Kelley Blue Book Canada or Brazil.

Every Kelley Blue Book operation costs 1 credit; Get Car Value with a ZIP code costs 2 (up to 6), and Get Reviews past page 1, with another sort or a star filter 1 or 5. credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.94.0

**14 new resources, 114 operations:** Space NK, Lookfantastic, Cult Beauty, YesStyle, Notino, Douglas, Boots, RockAuto, Cars.com, Autotrader, CarGurus, CarMax, Carvana, Bring a Trailer. All are new resources; no existing operation changed.

**New resource: Space NK, 9 operations.** Space NK (spacenk.com, the London-based luxury beauty retailer, owned by Ulta Beauty): product search, category and brand lists with Space NK's ten sorts, price next to the struck-through price and Space NK's badges, the online stock count of a shade or size, customer reviews with star distribution and skin context, the UK stores near a postcode with in-store and Click & Collect flags for one product, and the gifts with purchase on the offers page. Space NK has no public API. See the [Space NK API page](https://scavio.dev/spacenk-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: United Kingdom (default, GBP), Ireland (EUR), Netherlands (EUR, Dutch copy) or Australia (AUD), each in its own currency as Space NK prices it. The US is not offered (Space NK's US path shows UK prices).
- **Search Products, Get Category Products, Get Brand Products**: 36 a page, 10 sorts, a Brand filter (not on Get Brand Products); Fill All Products returns all 36 in full instead of the first 12 plus 24 IDs.
- **Get Reviews**: takes the product ID starting with M (not a shade or size ID); up to 100 a page, 4 sorts, star filter, text search; one English review pool on every market; no reviewer names.
- **Get Stores**: UK only; one product plus a full UK postcode, or latitude and longitude; Space NK's in-store and Click & Collect flags, not counts.
- **Get Offers**: UK or Ireland only (the Netherlands and Australia pages show the UK offers in GBP); the page's own validity line.
- Not available: the US market, a price filter (the site ignores it; sort by price instead), store stock counts, price history, cart or checkout.

Every Space NK operation costs 1 credit; Search Products, Get Category Products and Get Brand Products with Fill All Products cost up to 5 (one extra call per product filled). credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Lookfantastic, 7 operations.** Lookfantastic (lookfantastic.com, THG's beauty retailer with 10 country sites): price, RRP as Lookfantastic gives it and the site's offer text per product, every shade or size with its own price, stock and barcode (EAN), the 10 latest reviews, the current offers with their end times, and the same SKU priced on each site and in each currency the site offers. Lookfantastic has no public API; its product feeds are for approved affiliate publishers only. See the [Lookfantastic API page](https://scavio.dev/lookfantastic-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: UK and International (lookfantastic.com, default), Germany, France, Spain, Italy, Netherlands, Poland, Austria, Ireland or the EU site, each in its own language and prices.
- **Currency**: on lookfantastic.com one of 22 (GBP default, USD, EUR, AUD, CAD, JPY and more); Poland PLN (default) or EUR; the other sites EUR. Nothing is converted.
- **Search Products**: keywords (in the site's language) or a SKU, up to 40 a page, 7 sorts, filters by brand, skin type, concern, SPF band, key ingredient, formulation, price, rating, discount and any other site filter (Other Filters), facets on request. A mapped keyword returns the page Lookfantastic sends it to, reported in resolved_from.
- **Get List Page**: any list page by path or link: a category, brand (/brands/cerave) or offer page (/black-friday), up to 200 a page (captured 2026-11-26: PIXI Glow Tonic 250ml at 12.6 GBP, RRP 18, on lookfantastic.com and 14.49 EUR on lookfantastic.fr).
- **Get Offers**: the end time Lookfantastic states (ends); no start date.
- Not available: full review paging (only the 10 latest via Get Product), cart or checkout prices, price history, offer start dates.

Every Lookfantastic operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Cult Beauty, 7 operations.** Cult Beauty (cultbeauty.co.uk, THG's beauty retailer): price, RRP as Cult Beauty gives it and the site's offer text per product, every shade or size with its own price, stock and barcode, the 10 latest reviews, the current offers with their end times, and the same SKU on the UK and international sites in 12 currencies. Cult Beauty has no public API; its product feeds are for approved affiliate publishers only. See the [Cult Beauty API page](https://scavio.dev/cultbeauty-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: UK (cultbeauty.co.uk, default, GBP) or International (cultbeauty.com, EUR), both in English.
- **Currency**: the same 12 on both sites (GBP, EUR, USD, AUD, CHF, AED, SAR, ILS, HKD, SGD, JPY, CNY), each with its own price list; nothing is converted.
- **Search Products and Get List Page**: up to 40 (search) or 200 (list) a page, 7 sorts, filters by brand, skin type, concern, SPF content, key ingredient, formulation, a brand's range, price, rating, discount and any other site filter (Other Filters), facets on request.
- **Get Offers**: UK only; International has no voucher-codes page (a 400, not charged). The end time Cult Beauty states (ends); no start date.
- Captured 2026-11-26: PIXI Glow Tonic 250ml at 12.6 GBP (RRP 18) on cultbeauty.co.uk and 14.21 EUR on cultbeauty.com.
- Not available: full review paging (only the 10 latest via Get Product), cart or checkout prices, price history, offer start dates.

Every Cult Beauty operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: YesStyle, 9 operations.** YesStyle (yesstyle.com, the Hong Kong-based online store for Asian beauty and fashion, shipping to 150+ countries): YesStyle's own price, list price and discount for the shipping country in that country's currency, flash-sale and Black Friday labels, the site coupon with its tiers and expiry, every shade and size with its own price, ingredients, brand satisfaction and customer reviews with skin type and photos (no reviewer names). YesStyle has no public API; its affiliate programme runs through Commission Factory and Awin. See the [YesStyle API page](https://scavio.dev/yesstyle-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Country**: search, category, brand, deals and product serve 39 shipping countries (Brazil is held back); Get Reviews and Get Suggestions take any of the 153 countries YesStyle ships to. Language defaults to the country's own on YesStyle (11 languages).
- **Prices per country**: YesStyle keeps regional price lists, and every answer is checked for its country (captured 2026-11-26: COSRX Advanced Snail 96 Mucin Power Essence 100ml at GBP 10.96 in the United Kingdom and JPY 2,497 in Japan).
- **Search Products, Get Category Products, Get Brand Products, Get Deals**: 100 a page, seven sorts, YesStyle's Featured filters (in stock, flash sales, Black Friday, clearance, Korean / Japanese brands, cruelty-free, vegan ...), price band and any facet as JSON; Type, Region and Ingredients on category, brand and deals.
- **Get Product**: sale end date and deal claimed share, availability, ingredients, bestseller ranks, packs, shipping and returns; Include Variants adds every shade and size with its own price.
- **Get Reviews**: 15 a page, four sorts, star, positive, negative, photo and video filters, with the star counts and satisfaction summary.
- Not available: stores, a currency other than the country's, cart or checkout, price history, EAN / UPC.

Search Products, Get Category Products, Get Brand Products, Get Deals and Get Product cost 2 credits (Get Product with Include Variants 3); Get Brands, Get Reviews, Get Suggestions and Get Markets cost 1; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls and a page that came back for another country are not charged; a not-found is charged.

**New resource: Notino, 10 operations.** Notino (notino.com, the Brno-based online perfume and cosmetics store with 27 country shops): every size and shade with its own price, EAN, the lowest price of the last 30 days Notino shows under EU price rules, the RRP where a storefront shows one and the stock level; the voucher code, discount and discounted price on every listed item; promo lists with their terms; customer reviews (no reviewer names); and Notino's stores in 8 countries. Notino has no public API; its affiliate programme runs on the CJ network. See the [Notino API page](https://scavio.dev/notino-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: 27 storefronts (default Germany), each in its own language and currency with its own prices; a product or listing link picks its own storefront. The United Kingdom storefront costs more per call.
- **Get Product**: every variant with price, EAN, lowest_price_30d and stock (captured 2026-11-26: DIOR Sauvage Eau de Parfum 200 ml at 180 EUR on notino.de, 30-day low 170, and 805 PLN on notino.pl), plus deliveries, gift campaigns and the same product on other storefronts.
- **Search Products, Get Category Products, Get Brand Products, Get Promo Products**: 24 a page, six sorts, facet filter IDs; each item carries its deal (e.g. the Black Friday code black with the discounted price). Sorted by relevance, Notino stops a search near 500 products.
- **Get Reviews**: 8 a page, five sorts and a star filter, with rating buckets and per-storefront counts.
- **Find Stores / Get Store**: Czech Republic, Slovakia, Poland, Austria, Hungary, Romania, Bulgaria and Croatia, by city, with 7 days of opening hours.
- Not available: per-store stock (a store count per variant only), postcode store search, cart or checkout prices, price history.

Every Notino operation costs 1 credit (2 on the United Kingdom storefront); a paged, sorted or filtered category, brand or promo list costs 3 (4 on gb), as does a search Notino answers with a brand or category page that drops the page, sort or filters; credits_used says what was charged. Every operation carries a 250-second request timeout (review views past the first page can take up to about 4 minutes). Failed calls are not charged; a not-found is charged.

**New resource: Douglas, 10 operations.** Douglas (douglas.de, the Dusseldorf-based beauty retailer with about 1,960 stores in Europe), on 15 storefronts in 13 countries: the price, Douglas' struck-through price, the discount, the 30-day lowest price Douglas shows beside a reduction and the RRP / UVP, per product and per variant, in each storefront's own currency and language. Douglas has no public API; its affiliate programme runs on Awin. See the [Douglas API page](https://scavio.dev/douglas-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: Germany (default), Austria, Switzerland (German or French, CHF), Netherlands, Belgium (Dutch or French), Spain, Italy, Poland (PLN), Czechia (CZK), Slovakia, Hungary (HUF), Romania (RON) and Lithuania, on every operation. Prices and assortment differ per storefront.
- **Search Products, Get Category Products, Get Brand Products**: 48 a page, 6 sorts, brand codes, the sale badge and any facet of the page (Filters as JSON); redirected_to when Douglas sends a keyword to a category or brand page.
- **Get Deals**: the sale department, the Beauty / Black Friday list or any category's sale-badged products, with the storefront's promotions and their legal text (Germany, Austria, Switzerland, Poland). Captured 2026-11-26: Beauty Friday on Germany listed 2,670 products.
- **Get Product**: price, was_price, discount, lowest_price_30d, rrp, unit price, EAN, ingredients, scent notes and every variant; Variant EANs adds each variant's EAN (captured 2026-11-26: Yves Saint Laurent Libre Eau de Parfum 30 ml at 52.99 EUR, was 59.99, 30-day low 52.99, RRP 87).
- **Find Stores, Get Store, Get Review Summary, Get Suggestions, Get Brands**: stores near a city or postcode with opening and holiday hours, Douglas' own review summary, search suggestions and the brand index (about 1,890 brands on Germany).
- Not available: review texts, review paging, per-store stock, store reservation, price history, cart or checkout; Portugal, Croatia, Slovenia, Latvia, Estonia, Bulgaria and France (Nocibe) are not offered.

Every Douglas operation costs 1 credit, 2 on Italy (Find Stores and Get Store stay 1); Variant EANs adds 1 credit per variant looked up (2 on Italy), up to 10; credits_used says what was charged. A listing page takes 5 to 210 seconds, so every operation carries a 250-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Boots, 4 operations.** Boots (boots.com, the UK health and beauty retailer with over 1,800 stores, and boots.ie in Ireland): one product with the price, Boots' was price and Save amount, unit price, every shade or size, the offers and promo codes on the page and the Advantage Card offers, in GBP or EUR, and whether the stores near a place have it. Boots search is not available yet: start from a Boots product link or its 8-digit product ID. Boots has no public API; its affiliate programme runs on Awin. See the [Boots API page](https://scavio.dev/boots-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: United Kingdom (boots.com, GBP, default) or Ireland (boots.ie, EUR: its own prices, and some UK products are not sold there), on every operation; a product link sets the market itself.
- **Get Product**: by link or product ID; returns the catentry_id and each shade or size's item_code that Get Store Stock takes (captured 2026-11-26: CeraVe AM Facial Moisturising Lotion SPF30 52ml at 11.62 GBP on UK and 13.50 EUR on Ireland).
- **Get Store Stock**: in stock or out of stock at the stores near a full UK postcode or a latitude and longitude (Ireland: coordinates, from Find Stores with a town), nearest first; no unit counts. An empty answer is charged.
- **Find Stores, Get Store**: stores near a postcode or town with their services; one store by page slug, store number (UK) or exact name, with opening and pharmacy hours.
- Not available: search, category, brand and deal lists, reviews, ratings, type-ahead, stock counts, price history.

Every Boots operation costs 1 credit; 2 when Boots answered only on a second attempt (3 for two-step lookups: a product by ID, a store by number or name); credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: RockAuto, 11 operations.** RockAuto (rockauto.com, the online auto parts catalog based in Madison, Wisconsin): every brand's listing for one part type on one vehicle with RockAuto's price, tier, fitment notes, pack prices, core charge and closeout flags, part number and OE / interchange search across brands, one part's specifications, OE numbers and warranty, the tools and universal parts catalog, and RockAuto's manufacturer rebates with their printed end dates. RockAuto has no public API. See the [RockAuto API page](https://scavio.dev/rockauto-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a part number with the AutoZone and O'Reilly resources for the same part at US store chains.

- **Vehicle chain**: Get Vehicles walks make, year, model and engine; each engine carries its carcode. Get Vehicle Categories and Get Vehicle Parts take make, year, model, engine and carcode together as Get Vehicles answers them (a carcode that answers another vehicle answers 400, not charged). Get Suggestions and Resolve Vehicle also return vehicles with a carcode.
- **Currency and Language**: one US catalog; 15 display currencies (USD default, as RockAuto converts them) and English, Spanish, French or German pages. Get Part is English in every language.
- **Get Vehicle Parts**: captured 2026-11-26, brake pads for the 2010 HONDA ACCORD 2.4L L4 listed 114 items, from 10.23 USD; NGK spark plug 97390 was 4.79 EUR each, or 4.57 EUR each in a pack of 4.
- **Search Part Number**: matches across brands, OE and interchange numbers included (captured 2026-11-26: BOSCH BP1084 at 29.79 USD, or 583.71 MXN in Spanish).
- **Get Promotions**: offers and rebates with the printed expiry, its date and the read date; RockAuto publishes no coupon codes.
- Not available: sort or paging on lists (RockAuto's own order), shipping costs (priced per warehouse in RockAuto's cart), checkout, price history.

Every RockAuto operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout (large part listings can take 80-100 seconds). Failed calls are not charged; a not-found is charged.

**New resource: Cars.com, 8 operations.** Cars.com (cars.com, the US car marketplace run by Cars Commerce): new, used and certified car listings around a US ZIP with Cars.com's sorts and filters, one listing with its price breakdown, deal rating, good deal range and price history, dealer profiles, inventories and customer reviews, owner reviews of a model year, a dealer locator and Cars.com's research pages. Cars.com has no public API for reading listings. See the [Cars.com API page](https://scavio.dev/carscom-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a listing with the OfferUp resource for local private-party asking prices on the same model and year.

- **Search Listings**: ZIP and radius, 24 a page up to page 417, Cars.com's 11 sorts, filters for make, model, year, price, mileage, trims, drivetrain, color, deal rating, body style, seller type and keyword; facets on request. total is Cars.com's count, capped at 10,000. Captured 2026-11-26: Ford F-150 around 75201 (Dallas) sorted by lowest price gave 4401 listings, the first a 2005 F-150 XL at 3900 USD.
- **Get Listing**: price breakdown (vehicle price, listed fees, all-in price), Cars.com's deal rating and good deal range as stated, price history, features, vehicle history and CPO terms (captured 2026-11-26: a used 2018 Toyota RAV4 XLE at 21799 USD, rated a good deal, listed at 22399 and dropped twice).
- **Dealers**: Find Dealers by ZIP, make, minimum rating and name; Get Dealer, Get Dealer Inventory (24 a page) and Get Dealer Reviews (10-40 a page, 4 sorts).
- **Get Model Reviews**: owner reviews of one model year, 10-200 a page, with rating, recommend percent and category ratings (captured 2026-11-26: 2019 Toyota RAV4, 4.4 from 458 reviews).
- **Privacy**: no VINs, stock numbers, private-seller names or contact details, reviewer names or towns, or dealer employee names; the dealer's business details are kept.
- Not available: a star filter on reviews (the site has none), sold prices, messaging or checkout.

Every Cars.com operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Autotrader, 5 operations.** Autotrader (autotrader.com, the US car marketplace run by Cox Automotive): new, used and certified cars for sale around any US ZIP code with Autotrader's own deal label next to the Kelley Blue Book Fair Purchase Price range as given, dealer fees and price history per listing, dealer and private-seller listings, dealers near a ZIP with their inventory, and each make's models with the price range per model year. Autotrader has no public API for reading listings. See the [Autotrader API page](https://scavio.dev/autotrader-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Search Listings**: around a US ZIP (required) with a radius, by make, model and trim code, 5 sorts, filters by model year, price, mileage, body style, drivetrain, colours, dealer or private seller, new / used / certified, fuel, transmission, vehicle history, Good or Great deal, a feature, doors and seats; 25 or 100 a page up to page 100, with price / mileage / year stats for the whole result set.
- **Deal label**: deal_label is Autotrader's own label (Great, Good), based on the Kelley Blue Book Fair Purchase Price range, returned as given in kbb_fair_purchase_price (captured 2026-11-26: a used 2018 Honda Civic LX around Los Angeles at 18881 USD, labelled Great against a KBB Fair Purchase Price of 19440, range 18690-20140).
- **Get Listing**: description, features, specifications, warranties with what remains, Kelley Blue Book owner rating, price history, dealer fees, and the dealer's address, phone, website and hours.
- **Find Dealers** and **Get Dealer**: the first 50 dealers near a ZIP, nearest first (the finder does not page: narrow with radius or make); one dealer with rating, hours, home services, listing count and the first page of its inventory.
- Private sellers: city, state and distance only (no name, phone or street address). No VINs or stock numbers. Not available: dealer reviews (rating and rating count only), autotrader.co.uk or autotrader.ca (separate sites).

Every Autotrader operation costs 2 credits; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: CarGurus, 8 operations.** CarGurus (cargurus.com, the car marketplace run by CarGurus, Inc., in the US, Canada and the UK): car listings around a ZIP, postal code or postcode with CarGurus' own deal rating and expected price next to the asking price, dealers with their reviews and inventory, CarGurus' price trends, model-year research pages and expert reviews. CarGurus has no public API for reading listings. See the [CarGurus API page](https://scavio.dev/cargurus-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Market**: United States (default; cargurus.com, USD, miles), United States in Spanish, Canada (cargurus.ca, CAD, km), Canada in French, United Kingdom (cargurus.co.uk, GBP, miles); data in the market's language and currency. Find Dealers takes the US site only; Get Price Trends and Get Expert Reviews take US, Canada, UK; Get Research Page reads the US site.
- **Search Listings**: around a ZIP / postal code / postcode (required) with the site's radii or nationwide, 11 sorts, filters by year, price, mileage, drivetrain, colour, body type, condition, seller type, deal rating, fuel, transmission, single owner, no accidents, price drops and other CarGurus filter keys; 24 tiles a page up to page 500.
- **Deal rating**: deal_rating, deal_rating_label, deal_score and expected_price are CarGurus' own price analysis, as CarGurus labels it (captured 2026-11-26: a 2024 Toyota RAV4 LE AWD around New York at 27000 USD against an expected 27763, rated Good Deal).
- **Get Price Trends**: the CarGurus Index, a make or a model, with averages with and without fees and the change against 30, 90 and 365 days ago (captured 2026-11-26: US CarGurus Index 28289 USD).
- **Get Dealer**: address, phones, hours, rating, the reviews the page embeds (no reviewer names) and the dealer's inventory, filtered like Search Listings.
- No listing detail operation: each listing already carries the price, expected price, deal rating, mileage, options and specs. No VINs, stock numbers or private-seller details.

Every CarGurus operation costs 1 credit, also when a make or model name is resolved with a first page; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: CarMax, 12 operations.** CarMax (carmax.com, the largest US used-car retailer, with 263 stores in 42 states and no-haggle prices): used-car inventory within a radius of any US ZIP or nationwide, with the price, CarMax's price drops, mileage, features, the store holding the car and the shipping fee and dates to that ZIP; one car in full with CarMax's history callouts and warranties; every photo; the stores and one store's lot; owner reviews per model-year; and the recent CarMax instant offers for a model-year as CarMax shows them. CarMax publishes no public API or affiliate feed for its inventory. See the [CarMax API page](https://scavio.dev/carmax-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **ZIP Code** is required on Search Cars and Get Store Inventory (US only, USD): CarMax prices each car's shipping fee and dates to it (captured 2026-11-26: Ford F-150 within 100 miles of 75201 gave 49 cars, among them a 2026 F150 STX at 44998 USD with 1971 miles and a 49 USD shipping fee).
- **Search Cars**: make and model (F-150 and F150 both work), body type, keyword, up to 8 facet filters, year, price and mileage ranges, max shipping fee, radius 5-500 miles or nationwide, 8 sorts, up to 100 cars a page, facets on request. Get Store Inventory takes the same filters for one store's lot (no keyword, no radius).
- **Get Listing**: price, previous price and price-drop text as CarMax words it, accident and owner counts and CarMax's callouts as given, warranties, features, specifications. Shipping is not part of it: use Search Cars with a ZIP.
- **Get Car Value**: what CarMax offered for cars of that model-year, not an appraisal of any one car; offer_range and the page's headline_range can differ (captured 2026-11-26: 2019 Ford F150, 10 recent offers from 11000 to 20000 USD, headline $16,400-$25,400).
- **Get Reviews**: owner reviews per model-year, 10 a page, 5 sorts and an exact star filter, with no reviewer name or identity. No VIN is returned anywhere.
- Not available: a deal rating or price analysis (CarMax prices are no-haggle), private sellers, store reviews, price history beyond the previous price and drop date, a trim filter.

Every CarMax operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout (a 100-car page can take CarMax about 80 seconds). Failed calls are not charged; a not-found is charged.

**New resource: Carvana, 6 operations.** Carvana (carvana.com, the US online used-car retailer): its national used-car inventory by make and model with Carvana's price, previous price and the Kelley Blue Book value it shows next to the price, Carvana's own tags, shipping cost to a Carvana city page, one vehicle in full with its inspection checklist, imperfections and warranty, and Carvana's model-year guides, trim guides and model lineups. Carvana has no public API. See the [Carvana API page](https://scavio.dev/carvana-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Search Vehicles**: by make and model, 24 a page, 6 sorts, filters by model year, price, maximum mileage, trims, drive types, colours, body styles, fuel types, Carvana's tags (Great Deal, New Price, No Reported Accidents, Single Owner, Recently Added, Low Miles Per Year) and free shipping (captured 2026-11-26: Ford F-150 from 2019 tagged Great Deal, lowest price first: 578 vehicles; a 2019 F-150 XLT at 21990 USD next to a KBB value of 23600).
- **Location**: no ZIP targeting. City takes one of Carvana's own city pages (new-york-ny) and works only without filters or a sort; otherwise the location is the one Carvana sets for the visit. Inventory is national: the location changes shipping costs and delivery flags only.
- **Get Vehicle**: price, previous price, KBB value, powertrain, warranty and what remains, prior use, recalls, the inspection checklist, imperfections with photos, features and packages. No VIN.
- **Get Model Year Guide**, **Get Trims**, **Get Lineup**, **Get Makes**: Carvana's research pages, trim guides, model lineups and in-stock counts per make.
- Not available: keyword search, a minimum-mileage filter, new vehicles, delivery or shipping quotes for an address, monthly payments, taxes and fees.

Every Carvana operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

**New resource: Bring a Trailer, 8 operations.** Bring a Trailer (bringatrailer.com, the online collector-car auction site owned by Hearst): completed auction results with the sale price or the high bid of a lot that ended under its reserve, a model's or make's full price history with sell-through rate and median sold price per currency, one auction in full with its bid history and comments, every live auction, and the make, model and location pages. Bring a Trailer has no public API. See the [Bring a Trailer API page](https://scavio.dev/bringatrailer-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Currency**: amounts are in each lot's own currency as the site shows it (USD, EUR, GBP and others), before the site's buyer's fee (captured 2026-11-26: a 1988 BMW M3 sold for 80000 USD after 29 bids; a Euro 1994 BMW 850CSi sold for 109000 EUR).
- **Search Auction Results**: keywords (or none), 4 sorts, sold or reserve not met, recency, model years, max bid, category, origin, era, no reserve or Premium (not both), and one make, model ID or location ID; up to 60 a page through the first 10,000 results of a query.
- **Get Price History**: every completed result of one model (or a model family's IDs) or make in one call, with sell-through rate and min, max, median and average per currency, capped at 10,000 results (captured 2026-11-26: BMW E30 M3 over the last year, 70 results, 58 sold, median sold price 59250 USD).
- **Get Listing**: sold price or high bid, bid count, views, watchers, location (no ZIP), seller type, the full bid history and paged comments, without usernames, member profile links, chassis numbers / VINs or seller ZIP codes.
- **Get Live Auctions**: every live auction (about 1,000) in one call that takes 20 seconds to 3 minutes, filtered by keyword, make, country, ending within N hours, no reserve and Premium.
- **Get Make / Get Model / Get Location / Get Suggestions** return the make name, model IDs and location ID that Search Auction Results and Get Price History take.

Every Bring a Trailer operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.93.0

**New resource: PC Express, 7 operations.** PC Express (Loblaw's online grocery for Real Canadian Superstore, No Frills, Loblaws, Zehrs, Fortinos, Valu-mart, Your Independent Grocer, Wholesale Club, Provigo and Maxi; Loblaw operates 2,504 stores per its 2025 annual report): what each Loblaw banner charges for the same product code at its default store on one date, with the deal end date and the PC Optimum offer as shown. PC Express has no public API. See the [PC Express API page](https://scavio.dev/pcexpress-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). For national brands, pair it with the Walmart resource on the Walmart.ca (Canada) domain.

- **Banner** on every operation: Real Canadian Superstore (default), No Frills, Loblaws, Zehrs, Fortinos, Valu-mart, Your Independent Grocer, Real Canadian Wholesale Club, Provigo, Maxi. **Language**: English, or French on Provigo (French only) and Maxi (French by default, English too).
- Prices are each banner's default online store's; choosing a store is not offered, and every answer says which store priced it (store.requested false). The same product code is priced per banner: captured 2026-11-26, No Name Large Size Eggs 12 Pack (20812144001_EA) was 3.93 CAD at Real Canadian Superstore's default store 1033 and 4.17 at Maxi's default store 8976.
- **Search Products**, **Get Category Products** and **Get Collection** (deals-centre, black-friday, no-name, pc-value ...): 48 a page, five sorts, brand codes (No Name, President's Choice), deal types (price reduction, PC Optimum points, multi-buy, member-only price, $1-$5), price band, Prepared in Canada, dietary and aisle filters, Include Facets. Deals carry the end date as shown (expiry_date), no start date; member_only_price is the price the site shows publicly on the item.
- **Get Product**: GTIN, ingredients, nutrition, comparison prices and stock status as given; when the product page does not answer, the item comes from the search listing (source search) at 1 credit. **Find Stores**: a banner's pickup stores by city, postal code start or province, or nearest a latitude and longitude. **Get Store**: 7 dated days of store, pharmacy, clinic and optical hours. **Get Search Suggestions**: the terms PC Express suggests.
- Not available: choosing a store, review text (rating and count only), the printed flyer, Shoppers Drug Mart, Atlantic Superstore, City Market and T&T, cart or checkout, PC Optimum prices behind a login, price history (poll and store the answers).

Credits: 1 per operation; Get Product 5 (1 from the search listing); Get Store 5. credits_used says what was charged. Get Product, Get Store, Find Stores and Get Search Suggestions can take up to 2 minutes, so every operation carries a 240-second request timeout. Failed calls and refused inputs are not charged; a not-found is charged.

## What changed in 0.92.0

**New resource: RONA, 9 operations.** RONA (rona.ca, the Canadian home improvement retailer: RONA+ and RONA stores, about 425 corporate and affiliated dealer stores per RONA inc.): store prices in CAD for up to 60 article numbers at one store in one call, with the regular price, rebate and exact store units, so the same lumber, panels or tools can be priced store by store and next to Home Depot Canada; keyword search, category and weekly deals lists priced at the store you choose; one product with the sale end RONA shows; the 403 stores on RONA's store locator; one store's hours; and which stores near a store have an article. RONA has no public API. See the [RONA API page](https://scavio.dev/rona-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a RONA item with the Home Depot resource and Country Canada for Home Depot Canada in the same city: match the same grade and length, or the same model.

- **Get Store Prices**: up to 60 article numbers (comma-separated) at one Store ID: price, regular price, rebate, on sale, exact units, DC and parcel units, aisle, UPC and model. RONA prices some goods per store: captured 2026-11-26, 2-in x 4-in x 8-ft SPF Select Lumber (0971073) was 4.35 CAD at store 41460 (Quebec), 4.22 at 55130 (Ontario) and 4.19 at 62860 (Alberta), while the DEWALT 20 V MAX Brushless Compact Drill/Driver Kit on sale (00277649) was 118 at all three.
- **Search Products**, **Get Category Products** and **Get Deals**: without a Store ID the prices and units are for the store RONA's site picks for the visit (store.requested false); with a Store ID they are that store's. Sorts (not on Get Deals), RONA's filters from Include Facets, On Sale Only, Clearance Only, 24, 48 or 96 a page.
- **Get Product**: sale_ends_text as RONA shows it ("until Dec 10th, 2026") and sale_ends as an ISO date only when unambiguous; units, aisle, nearby stores with units; rating and review count only.
- **Find Stores**: RONA+ and RONA stores, corporate and dealer, by province, city and banner, or nearest a latitude and longitude. **Get Store Stock**: which stores near a store or a point have one article; RONA offers no nearby-store list for some articles (lumber), and the list can come back empty now and then (run it once more).
- units are exact store units; null means RONA showed no count, not zero. Article numbers keep their leading zeros. Language: English (default) or French on every operation.
- Not available: review text, search suggestions, postal-code store lookup (use a latitude and longitude, or a city or province), the printed flyer, cart or checkout, price history (poll and store the answers).

credits_used says what was charged. Answers can take up to about a minute, so every operation carries a 240-second request timeout. Failed calls and refused inputs are not charged; a not-found is charged.

## What changed in 0.91.0

**Sephora Canada on the Sephora resource, 6 new operations.** Sephora Canada (sephora.com/ca, Sephora's Canadian store: 152 stores per its store list on Nov 25, 2026): Canadian beauty prices in CAD (The Ordinary, Dior, Rare Beauty, Supergoop and the rest of the catalogue) with sale prices and dated offers. Sephora publishes no public product or store API. See the [Sephora API page](https://scavio.dev/sephora-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). For the same product at other Canadian retailers use the Dermstore (Country Canada), Amazon (Amazon.ca) and Walmart (walmart.ca) resources; match on brand, name and size.

- **Country** on Search Products, Get Category Products and Get Product: United States (default, sephora.com, unchanged: a US workflow sends the same request as before) or Canada. Canada Options on the two listings: Sort By, Brand, On Sale Only, New Only, Clean at Sephora Only, Minimum Rating, Minimum and Maximum Price (CAD), Facet Filters (JSON), Include Facets and Language (English or French: the same product and SKU IDs and CAD prices, French names and descriptions). ZIP Code is US only.
- **Same product and SKU IDs as sephora.com**, with CAD prices as Sephora Canada gives them (French prices such as 33,00 $ are read as 33.00). Get Product returns every SKU with price, list and sale price, in stock and only few left, the 10 latest reviews without reviewer names, and Sephora's own AI-generated summary of customer reviews, labelled as Sephora's (read it as Sephora's summary, not as a fact). Captured 2026-11-26: Dior Sauvage Eau de Parfum (P428500), the 3.4 oz / 100 ml SKU 2038131 at 200 CAD, in stock; the Sephora Collection Oil Infusion Hydrating Lip Oil (P518068) at a sale price of 10.50 CAD (list 15.00).
- **New, Canada only:** Get Brand Products (one brand's products with the Canada listing options), Get Brands (the A-Z brand directory), Get Search Suggestions, Get Offers (eligibility, promo code, threshold and the end date as given, no start date; app-only offers flagged; 26 offers on 2026-11-26, among them 30% off Sephora Collection ending 2026-11-30 23:59 PT), Find Stores (152 stores on the store list, by province) and Get Store (address, phone, coordinates, weekly and holiday hours, services; public business data, returned as captured).
- Not available for Canada: stock per store, a store finder by postal code, the full review list with its sorts or a star filter, UPC, Beauty Insider prices, cart or checkout, price history (poll and store the answers).

Credits are the same in both countries: 1 per call, Get Product and Get Offers 2. credits_used says what was charged. Failed calls and refused inputs are not charged; a not-found is charged for Canada. Every Sephora operation now carries a 240s timeout.

## What changed in 0.90.0

**Best Buy Canada on the Best Buy resource, 1 new operation.** Best Buy Canada (bestbuy.ca, Best Buy's Canadian store: 142 stores across Canada per Best Buy's FY2026 10-K, plus a marketplace of third-party sellers): Canadian electronics prices with exact units per store, sale end dates and the environmental handling fee (EHF) by province. Best Buy's developer API (developer.bestbuy.com) covers bestbuy.com only. See the [Best Buy API page](https://scavio.dev/bestbuy-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). For the same model at other Canadian retailers use the Amazon (Amazon.ca), Walmart (walmart.ca), Costco (costco.ca) and Canadian Tire resources; match on brand and model.

- **Country** on all nine Best Buy operations: United States (default, bestbuy.com, unchanged: a US workflow sends the same request as before) or Canada. Canada Options on Search Products, Get Category Products and Get Deal of the Day: Page Size 1-100, four sorts (Best Match, Price, Customer Rating), the US filters plus Minimum Rating, Sold By, Seller, In Stock Online Only and Facet Filters (JSON), Province and Language (English or French: the same SKUs and CAD prices, French names and links). Results are capped at the first 2,000 of a query (results_capped).
- **Prices are national** (the same in every province and store); only the EHF varies by province. Get Product returns the UPC, sale start and end (UTC), ehf_by_province, and the Geek Squad open-box, open-box and refurbished SKUs with their own prices; its rating and review count are null for Canada (use Get Reviews or Get Prices).
- **Get Availability** for Canada: exact units per store for up to 20 SKUs at the stores nearest a postal code (Max Stores 1-50) or up to 50 store IDs. Captured 2026-11-25: the Apple MacBook Air 13.6" (2026, M5, 16GB / 512GB, SKU 19791103) at 35 units in the Centreville store in Montreal (store 651), at 1589.99 CAD (regular 1789.99, sale ending 2026-12-03 07:00 UTC). A store with no stock record comes back status unknown with units null, never out of stock.
- **Get Deal of the Day** for Canada lists a deal collection instead (Best Buy Canada has none): Black Friday, Top Deals, Clearance, Open Box or Refurbished, with dates_text when the collection's page states its dates ("Sale kicking off November 19 and running until December 3" on Black Friday).
- **Find Stores** for Canada: near a postal code (Radius 1-100 km), in a city, or near a latitude and longitude, with 7 dated days of hours. **Get Reviews** for Canada: Page Size 1-100, Verified Purchases Only, With Photos Only, French-only reviews; no reviewer names.
- **New, Canada only: Get Questions**: customer questions about one product, each with its answer count and top answer, most answered or newest; no asker or answerer names.
- Not available for Canada: per-store prices (the price is national), a Deal of the Day, results past 2,000 per query, review photos hosted off Best Buy, cart or checkout, price history (poll and store the answers).

Every Best Buy Canada operation costs 1 credit; US credits are unchanged. credits_used says what was charged. Failed calls and refused inputs are not charged; a not-found is charged.

## What changed in 0.89.0

**Home Depot Canada on the Home Depot resource, 8 new operations.** Home Depot Canada (homedepot.ca, The Home Depot's Canadian store: 182 stores in 10 provinces): Canadian home improvement prices per store, so the same item's price and exact units at stores in different provinces, and a store's price next to the online price. Home Depot Canada has no public API. See the [Home Depot API page](https://scavio.dev/homedepot-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). For the same item at other Canadian retailers use the Canadian Tire resource and the Walmart (walmart.ca) and Amazon (Amazon.ca) resources; match on brand and model.

- **New for both countries:** Find Stores (US: near a ZIP code, city or address, up to 20; Canada: near a postal code or city, or latitude and longitude, up to 50, with 7 dated days of hours) and Get Availability (US: price, promotions and pickup stock at a store and delivery to a ZIP code, either or both; Canada: Store ID required, the store's price with exact units and aisle and bay). **Get Delivery Quote** (US only): every delivery option to a ZIP code for a quantity; not available for Home Depot Canada. US credits: Find Stores 2, Get Availability 2, Get Delivery Quote 4.
- **Country** on Search Products, Get Product, Get Reviews, Find Stores and Get Availability: United States (default, homedepot.com, unchanged: a US workflow sends the same request as before) or Canada. Canada Options: Store ID (default store 7274; data.store says which), Page Size 1-40, four sorts (Home Depot Canada has no Top Sellers), Deals (Special Buy, New Lower Price, Savings), Filters (JSON) from an earlier response's facets (Include Facets), Category ID and Language (English or French: the same IDs and CAD prices, French names and links). With a Category ID or Deals the query is optional.
- **Get Product** with a Store ID: price is that store's price (price_source store) and online_price the online price, which can differ, with store_units (exact units), aisle and bay. Captured 2026-11-25: the 2-inch x 4-inch x 8-ft SPF Premium Stud (1000112108) at store 7128 (ST-HENRI, QC) at 4.14 CAD with 2858 units in aisle 19, bay 001, next to an online_price of 6.58. Prices can differ by store (lumber does; the tools, Christmas tree and fridge sampled had one price everywhere).
- **Get Reviews** for Canada: the first 8 reviews per language and the first page of questions; no reviewer names.
- **New, Canada only:** Get Category Products (a category or collection page, priced at a store), Get Categories (the department tree and the current event pages), Get Store Stock (exact units of one item at every store near a postal code or city, no prices), Get Store (one store with 7 dated days of hours and nearby stores) and Get Search Suggestions.
- When Home Depot Canada has no store record for an item that exists, Get Product returns the online price with store_price_returned false, and Get Availability and Get Store Stock answer an unbilled 502.
- Not available for Canada: UPC or barcodes (Home Depot Canada shows none), structured sale end dates (the price badge and Home Depot's promotion text only), reviews past the first 8 per language, delivery quotes, the flyer, cart or checkout, price history (poll and store the answers).

Every Home Depot Canada operation costs 1 credit; the US stays at 2 (Get Delivery Quote 4). credits_used says what was charged. Failed calls and refused inputs are not charged; a not-found is charged.

## What changed in 0.88.0

**New resources: SportChek and Mark's, 8 operations each.** SportChek (sportchek.ca, Canada's sporting goods retailer, a Canadian Tire Corporation banner) and Mark's (marks.com, the Canadian workwear, casual clothing and footwear retailer, a Canadian Tire Corporation banner; L'Equipeur in French): prices in CAD with the was price, sale label and the sale's posted end date each banner shows, filters from the site's own facets, one product's sizes and colours with online units and the units at the store the site assigns, SportChek customer reviews, Mark's customer questions, search suggestions, one store's hours and nearby stores, and the brand and category lists. Neither banner has a public API. See the [SportChek API page](https://scavio.dev/sportchek-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme) and the [Mark's API page](https://scavio.dev/marks-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a product with the Amazon and Walmart resources for the same model at Amazon.ca and Walmart.ca (match on brand, model, colour and size).

- **Search Products** and **Get List Page** (a category or deals page path from Get Categories, or a sale, clearance or Black Friday page): 24 products a page (12 on Mark's category pages), sorts, Brand, Deals and Filters (JSON) from an earlier response's facets (Include Facets). Deals on a deals page is a 400, not charged.
- **was_price** is the site's was price as given, only where the site shows one; **footnote** is the site's own sentence on it ("Was price reflects the last national regular price this product was sold for.", English pages). A percent off is not returned: compute it from price and was_price and label it computed. **sale_ends** is the sale end date the site shows, as given.
- **Get Product**: variants with their own price, was price and sale_ends, units_at_store and units_online. units_at_store are the units at the store the site assigns to the request's region (assigned_store); a caller cannot choose a store. In our checks prices were the same at every store sampled.
- **Get Reviews** (SportChek): a summary, then page 1 the first 8, pages 2-4 the next 30 each; no reviewer names. **Get Questions** (Mark's): the newest 10 with answers; no asker names.
- **Language** (Mark's): French reads L'Equipeur (lequipeur.com) on Search Products, Get List Page, Get Product, Get Brands and Get Categories: the same product codes and CAD prices, French titles. SportChek is English only.
- Not available: choosing a store for price or stock, stores near a postal code, the flyer, Triangle Rewards or CT Money prices, price history (poll and store the answers), UPC or barcodes (the site shows none), cart or checkout.

Every SportChek and Mark's operation costs 1 credit; credits_used says what was charged. Answers take about 10-90 seconds, so every operation carries a 240-second request timeout. Failed calls and refused inputs are not charged; a not-found is charged.

## What changed in 0.87.0

**New resource: OfferUp, 5 operations.** OfferUp (offerup.com, the US local marketplace for buying and selling used items, cars and trucks): asking prices around any US ZIP code, so the same item's asking prices in different US metros, with the area OfferUp resolved the ZIP to; cars and trucks filtered by dealer or private seller, make, model year and mileage; one listing in full with condition, posted date and vehicle details (no VIN); the category tree; and a seller's public profile numbers. OfferUp has no public API for reading listings; OfferUp for Business (OfferUp Motors, Storefronts) is seller-side tooling that syncs a dealer's own inventory into OfferUp. See the [OfferUp API page](https://scavio.dev/offerup-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a listing with the Amazon and Walmart resources for the same item's new price and with Mercari's sold search for sold prices (match on model and title).

- **ZIP Code** is required on Search Listings and Get Category Listings (US only, USD). location.resolved is the area OfferUp named for the ZIP and radius_miles the radius it applied (captured 2026-11-25: 98101 resolved to Seattle, 60601 to Chicago).
- **Search Listings**: keywords, radius, 5 sorts plus newest model year and lowest mileage for vehicles, filters by asking price, condition and category, and in Cars & Trucks by seller type (dealer or private), make, year range and max mileage. About 48 a page up to page 50, has_more, no total count. filters_not_applied lists any filter OfferUp did not apply; Seller Type limits a search to Cars & Trucks (category ID 5.1). Promoted OfferUp listings are marked sponsored.
- **Get Listing**: asking price, original price, firm, status, condition, posted and updated dates, description, photos, attributes, vehicle details (no VIN), local pickup and the seller's public numbers. Listings from search carry no posted date or condition.
- **Get Seller**: seller type, rating, rating count, items sold, joined, response time, last active, badges and the first 20 listings; dealer and business accounts also name, website and opening hours.
- Prices are asking prices, not sold prices. No seller names for individuals (a dealer or business account's name only), usernames, avatars, phone numbers, emails, street addresses, coordinates or VINs; phone numbers, emails and VIN-like codes in titles and descriptions read [removed].
- Not available: sold listings or sold prices (OfferUp does not show them publicly), shipping (OfferUp ended nationwide shipping in 2025; listings are local pickup), search suggestions, a total result count, a seller's listings past the first 20, messaging or offers.

Every OfferUp operation costs 1 credit; Get Listing is 1, or 2 when the listing needs a second, costlier fetch; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.86.0

**New resource: Dermstore, 7 operations.** Dermstore (dermstore.com, the US skincare and beauty retailer, shipping to the US and Canada): price, RRP as Dermstore gives it and Dermstore's offer text per product and per brand, every shade, size or strength with its own price and stock, UPC, auto-replenish discounts, the 10 latest reviews, the current offers with their end times, and US vs Canada prices for the same SKU. Dermstore has no public API; its affiliate programme runs on Awin and offers product feeds to approved publishers. See the [Dermstore API page](https://scavio.dev/dermstore-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a product with the Sephora, Ulta Beauty and Amazon resources for the same product and size elsewhere (match on UPC, or brand + name + size).

- **Country**: United States (default, USD) or Canada (Dermstore's own Canadian dollar prices, not converted), on every operation.
- **Search Products**: keywords or a SKU, up to 200 a page, 7 sorts, filters by brand, skin type, concern, SPF band, key ingredient, preference, gender, price, rating and discount, facets on request. A mapped keyword (sunscreen, retinol, eltamd) returns the page Dermstore sends it to, reported in resolved_from.
- **Get List Page**: any Dermstore list page by path or link: a category, brand, /sale, an offer page (/shop/black-friday/30-off), /gift-sets or an ingredient page.
- **RRP and discount**: rrp is Dermstore's RRP as given; discount_percent is computed by Scavio from price and RRP, only when the RRP is above the price. offer is Dermstore's own promotion text, as given; code rates differ by brand (captured 2026-11-25: EltaMD UV Clear SPF 46, 1.7 fl. oz., at 46 USD and 65.78 CAD; SkinCeuticals offered "Earn 10% Back + $25 Gift", double points as Dermstore states it).
- **Get Offers**: the end time Dermstore states (ends); Dermstore gives no start date.
- Not available: a full review feed or review paging (only the 10 latest via Get Product), Q&A, member (VIP) prices, cart or checkout prices, price history, offer start dates.

Every Dermstore operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.85.0

**New resource: Nellis Auction, 4 operations.** Nellis Auction (nellisauction.com, the liquidation auction marketplace with pickup warehouses in Las Vegas, Phoenix, Houston, Philadelphia, Denver and Dallas): a lot's current bid and bid count next to Nellis's own Estimated Retail Price, the buyer's premium percent, open and close times, Nellis's condition grade, the pickup warehouse, the bid history without bidder names, and a sold lot's final price by ID. Nellis Auction has no public API. See the [Nellis Auction API page](https://scavio.dev/nellis-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair a lot with the Amazon and Walmart resources for the same item's new price and with eBay for sold prices (match on title and brand: Nellis shows no UPC).

- **Shopping Location**: Las Vegas (default), Phoenix, Houston, Philadelphia (pickup in Delran, NJ), Denver and Dallas (run by Lots Of Auctions), with 13 pickup warehouses in all (Get Locations, with opening hours).
- **Search Lots**: open auctions only, as Nellis's own search shows; 48, 120 or 240 a page, 9 sorts, filters by category, brand, pickup warehouse, condition stars, estimated retail range, auction event, color and size, with Nellis's counts (facets).
- **Get Lot**: one lot by ID or link, open, closed or sold. A sold lot's final_price is the winning bid before Nellis's buyer's premium and tax (captured 2026-11-25: a sold lot, ID 141100004, Estimated Retail Price 9.99, closed at 6 after 5 bids). bid_history gives time, amount and Winning or Outbid, with no bidder names.
- **Estimated Retail Price**: retail_price is Nellis's own estimate, as Nellis labels it, not an MSRP. The buyer's premium is, in Nellis's words, "typically 15% but may vary based on the auction event" (buyer_premium_percent per lot).
- Not available: closed or sold lots in search, search suggestions, shipping (pickup only), UPC or model numbers, buy-now, reserve prices, live bid updates, bidding, watchlists, checkout.

Every Nellis Auction operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.84.0

**New resource: Vevor, 11 operations.** VEVOR (vevor.com, the tools and equipment seller with storefronts in 13 countries): VEVOR's price on each storefront in its own currency, the was price only while a VEVOR deal is active (with VEVOR's deal start and end), every variant with its own price and stock, the shipping fee and delivery date by US state or Canadian province, and the same SKU on all 13 storefronts in one call. VEVOR has no public product API (it runs an affiliate programme through Awin and other networks; the Pro Member, Dealer & Distributor and dropshipping programmes are sign-up forms, not APIs). See the [Vevor API page](https://scavio.dev/vevor-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme).

- **Country and Language**: United States (www.vevor.com, USD; English or Spanish), Canada (www.vevor.ca, CAD; English or French), United Kingdom (GBP), Australia (AUD), Germany, France, Spain, Italy, Netherlands (EUR, each in its own language), Poland (PLN), Mexico (MXN, Spanish), Norway (www.vevor.co.no, EUR) and Other Europe (eur.vevor.com, EUR; English, Swedish, Danish, Finnish, Norwegian, Portuguese, Czech, Greek, Slovak, Hungarian or Romanian). Each storefront language has its own search index: send the search term in that language.
- **Price per storefront**: measured 2026-11-25, one SKU (GYQXJBMQJQYPKEO1LV0) was 195.01 USD on www.vevor.com, 233.90 CAD on www.vevor.ca, 175.90 GBP on www.vevor.co.uk, 170.90 EUR on www.vevor.de, 261.99 EUR on www.vevor.co.no and 721.90 PLN on www.vevor.pl. Get Prices Across Storefronts returns all 13 in one call (3 credits) and takes the SKU only.
- **Shipping by state**: price and stock do not change by ZIP; Get Shipping needs State on the US storefront and Province on the Canadian one, which drive the fee and delivery date (a welder to Alaska, AK 99501, had a $130 fee; contiguous states were measured free).
- **Was price**: given only while a VEVOR deal is active (deal start and end as VEVOR gives them) or when VEVOR's page shows its own strikethrough price, otherwise null; never compute a discount from it.
- **Lists**: 60 items a page; totals are exact up to 100, then "100+" (total_is_lower_bound).
- **Reviews**: one pool shared across storefronts and a product's variants, so they come in many languages; up to 100 a page, sorts, star and photo filters; no reviewer names.
- Not available: coupon codes (VEVOR shows them only after a claim), the pickup store, Pro or bulk prices, financing, the ships-from warehouse, VEVOR's listings on other marketplaces (use the Amazon, Walmart, Home Depot, Tractor Supply, TikTok Shop or eBay resources), price history, checkout.

Every Vevor operation costs 1 credit except Get Prices Across Storefronts (3); credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.83.0

**New resource: Discount Tire, 15 operations.** Discount Tire (discounttire.com, the US tire and wheel retailer, America's Tire in parts of CA, PA, NJ and NY): the price of a tire at a named store, the same tire at other Discount Tire and America's Tire stores, the tires that fit a vehicle with the original-equipment tire flagged and staggered front / rear sets, and the exact units at the stores near a ZIP; plus tires by size, wheels, models with every size, promotions with their end dates, categories, search suggestions, stores, store hours, tire and store reviews, and the read-only appointment calendar. Discount Tire has no public product API (it runs an affiliate programme through CJ, and fleet customers use an account portal). See the [Discount Tire API page](https://scavio.dev/discounttire-api?utm_source=n8n-node&utm_medium=package&utm_campaign=readme). Pair it with the Walmart, Sam's Club and Amazon resources for the same tire (match on manufacturer part number or GTIN), and with AutoZone and O'Reilly Auto Parts for parts.

- **Country**: United States only (www.discounttire.com, USD); Discount Tire and America's Tire are one catalog.
- **Prices are per store**: Search Tires by Size, Get Tires for Vehicle, Get Product, Get Model, Get Wheels and Browse Tire Models take Price At: a store code (Find Stores lists them) or a ZIP code (the nearest store is used), and the response names the store used. Price can differ between stores and is not different at every store: measured 2026-11-25, Michelin Defender 2 225/65R17 (item 108547) was $206 a tire at 9 stores in 8 states and $205 at an America's Tire store in New Jersey; across 45 tires, the stores measured in Texas, Florida and Washington showed no differences, a California store 1, a Michigan store 3 and the New Jersey store 13 of 32.
- **Per tire, not per set**: price is per tire or wheel; Discount Tire publishes no set-of-four price, so 4 x price is arithmetic, not a Discount Tire price. Promotions are Discount Tire's own title and text with its end date (ISO 8601 UTC and as given); no start date.
- **Vehicle fitment**: Get Vehicle Fitment is one step per call (years, makes, models with vehicle_id, trims with trim_id, size options with assembly_id, then the fitment). The 2022 Ford F-150 XLT Crew Cab 2WD is vehicle_id 17361, trim_id 52455, assembly 0000E28B (245/70R17). Get Tires for Vehicle and Get Wheels take the same three IDs; staggered vehicles come back as front / rear sets, each tire with its own per-tire price (a set is 2 front + 2 rear). Ranking Treadwell adds Discount Tire's Treadwell ranking fields, Discount Tire's own estimates, as given.
- **Get Store Stock** gives the exact units of 1-4 items at the stores near a ZIP (5 stores per page, 10-150 miles); a store with 0 units can still say "Available as soon as" with a date.
- **Reviews**: Discount Tire's own tire and store reviews with sorts, a star filter and full paging; no reviewer names.
- **Get Appointment Availability** is read only (Scavio never books); slot start and end are the store's local time (YYYY-MM-DDTHH:MM, no time zone).
- Not available: the deals page text, road hazard and certificate prices, financing, installation and fee amounts, the Treadwell chat, fleet accounts, Tire Rack, price history, checkout and booking.

Every Discount Tire operation costs 1 credit; credits_used says what was charged. Every operation carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.82.1

**Dollar Tree response shape.** split_case is {available, multiple} (available computed as minimum_quantity < case_pack; fee and store_brand removed), Get Product adds split_case_fee (raw, not a fee) and banner_code (DT or FD), and Get Store Stock replaces ship_to_home.units with max_order_units and adds dc_number to ship_to_home and ship_to_store.

## What changed in 0.82.0

**New resource: Dollar Tree, 10 operations.** Dollar Tree (dollartree.com, the US and Canada discount variety store chain): an item's online case price next to its unit price, case pack, minimum order and split-case multiple as Dollar Tree gives them, and the units of one item at a Dollar Tree store plus its nearby stores; plus search, categories, brands, sale, clearance, New Arrivals and More Choices listings, stores with hours and services, and reviews. Dollar Tree has no public API for its catalog, prices or store stock (suppliers work through its vendor portal and EDI). Pair it with the Dollar General, Walmart, Target and Instacart resources for a price check on the same item.

- **Country**: every operation is United States only (www.dollartree.com, USD) except Get Store, which also takes Canada (Dollar Tree Canada store pages, English, no prices). Dollar Tree Canada has no shopping site.
- **Prices** are Dollar Tree's online unit prices from one national online price list (the same at every store and ZIP measured); Dollar Tree notes that prices and availability may vary between stores and online, and in-store shelf prices are not published online. Online orders are by the case: item 221159 (9-in. White Paper Plates, 40-ct. Packs) was $1.50 a unit, case_pack 30, case_price $45.00, minimum_quantity 5 (captured 2026-11-24). A case pack or case price Dollar Tree gives as 0 is null; stores sell single units.
- **Get Store Stock** needs a store number (Find Stores gives the store numbers near a ZIP; a ZIP alone does not pick a store) and returns the units at that store, up to about 63 nearby stores by store number, ship-to-home cases and the most units orderable for delivery (max_order_units) with an ETA, and ship-to-store with its distribution centre and ETA: item 221159 showed 116 units at store 5126 (New York) and 63 nearby stores, 59 of them with stock.
- **Search Products** matches item numbers, not UPCs. **Get Deals** lists Sale, Clearance, New Arrivals or More Choices (Dollar Tree's multi-price assortment); Dollar Tree publishes no validity dates and no weekly ad.
- **Get Reviews** returns the newest English reviews (up to about 98 per call), many syndicated from brand sites and flagged; no other sort, no star filter, no Q&A, no reviewer names.
- Not available: search suggestions, the weekly ad, deal validity dates, Quick Order / bulk ordering, gift cards, Canada products and prices, price history, checkout.

Every Dollar Tree operation costs 1 credit except Find Stores (5); credits_used says what was charged. Every operation carries a 240-second request timeout, and Get Store Stock, Find Stores and Get Reviews (usually 10-35 s, up to about 2.5 minutes) 300 seconds. Failed calls are not charged; a not-found is charged.

## What changed in 0.81.0

**New resource: Staples, 12 operations.** Staples (staples.com, the US office supply retailer; Staples Canada at staples.ca): an ink cartridge's price next to Staples' own cost per page and the stated page yield, copy paper per ream, and the units of one item at the Staples stores near a ZIP exactly as Staples reports them; plus search, categories, On Promotion and Clearance deals, coupons with Staples' own end dates, stores, reviews with full paging, customer Q&A and trending searches. Staples has no public API for its catalog, prices or store stock (Staples Business Advantage connects contract buyers' purchasing systems). Pair it with the Amazon, Walmart, Target and Best Buy resources for a price check on the same item.

- **Country** is United States (www.staples.com, USD, the default) or Canada (www.staples.ca, Staples Canada, CAD) and **Language** English or French (Canada only), on Search Products and Get Product; every other operation is US only. Canada search returns Staples Canada's top matches (about 5, no paging, sort or filters).
- **Prices** are national: the ZIP changes delivery availability and dates, the store changes pickup units, neither changes the price. Hammermill Copy Plus (item 122374, 10 reams) was $49.99 next to Staples' Regular $83.19, at "$5.00/Ream", with "Offer Expires on 11/28/2026"; the HP 64XL Black High Yield cartridge (item 2724258, "Prints Up to 600 Pages") carried Staples' own "$0.10 Cost Per Page" (captured 2026-11-24).
- **Get Store Stock** lists only the stores near a US ZIP that have the item for pickup, with units as Staples reports them and the pickup text (Ready in 30 mins): the same HP 64XL showed 7 stores near ZIP 60540 with 63 units in all. An empty list means no nearby store has it or it is not offered for store pickup. Staples returns a threshold value beside the units; it is passed through as given.
- **Get Product** adds page_yield, sheets_per_ream, promotions and offer_expires (Staples' own texts and expiry), coupon codes and ream / carton variants. staples.com publishes no UPC (model is the manufacturer part number); Staples Canada products carry a barcode.
- **Get Reviews** pages up to 100 a page with sorts, star and photo filters and verified and incentivized flags; **Get Questions** returns 10 a page with their answers. No reviewer names.
- Not available: the weekly ad, search suggestions, print and tech service prices, ink recycling rewards, Rewards member prices, price match requests, Staples Business Advantage contract prices, price history, checkout.

Every Staples operation costs 1 credit (credits_used says what was charged) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.80.0

**New resource: Nike, 8 operations.** Nike (nike.com, including Jordan Brand): Nike's sale price next to its own full price and discount percent as Nike gives them, every size with its GTIN, and Nike's launch calendar with price, release start, method and a per-size level for each launch item; the same style code priced on 62 storefronts in 42 countries, each in its own currency. Plus search, listings, Jordan / ACG / SB, the Sale listing and review summaries. Nike has no public API for catalog, prices or launches. Pair it with the Foot Locker, Dick's Sporting Goods, Amazon and eBay resources for a price check on the same style code.

- **Country** picks the storefront (United States by default; China is www.nike.com.cn) and **Language** the storefront language where a country has several (Switzerland, Belgium, Luxembourg, Canada, the United States, Japan, Spain and others). Get Releases and Get Release are not offered on Vietnam, China or Japan in English; Get Reviews is not offered on China.
- **Prices** are per storefront and differ between markets, also inside the euro zone: the same Nike Dunk Low (style color DD1503-103) was $78.97 next to a $120 full price (34%) on www.nike.com, £54.99 next to £109.99 (50%) on nike.com/gb, €59.99 next to €119.99 (50%) on nike.com/fr and ¥17,050 on nike.com/jp (captured 2026-11-24). promotions carry Nike's offer text with its dates.
- **Lists** (Search Products, Get Category Products, Get Brand Products, Get Deals) return Nike's first page only: the 24 product groups Nike's page shows first. Filter tokens come from an earlier response's facets.
- **Get Product** lists every size with its GTIN and Nike's status: sizes, not stock levels. **Get Releases** and **Get Release** carry method (LINE or DRAW, as Nike labels it) and a per-size level (HIGH, MEDIUM, LOW or OOS as Nike gives it) for launch items; before a launch Nike can show LOW on every size. Read-only data: no entry or purchase.
- Not available: store locator, in-store or pickup stock, stock levels for regular products, review paging or Q&A (Get Reviews is the summary and the 3 newest reviews), search suggestions, pages past the first, member prices, gift cards, Nike Factory store prices, Converse, checkout.

Every Nike operation costs 1 credit (credits_used says what was charged) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.79.0

**New resource: Michaels, 11 operations.** Michaels (michaels.com), the US and Canada arts and crafts retailer: units of one SKU at the Michaels stores near a ZIP or postal code exactly as Michaels reports them, units of up to 30 SKUs at one store, a product with every colour and size, its price next to Michaels' own "Reg." label and its promotions with Michaels' own start and end dates; plus search, categories, brands, deals (Sale, New, Clearance, Great Buy), stores and search suggestions. Pair it with the Walmart and Amazon resources for a price check on the same item.

- **Country**: United States (www.michaels.com, USD, default) or Canada (canada.michaels.com, CAD), in English or French (Canada). Find Stores, Get Categories and Get Search Suggestions are United States only. With Canada a category is a code path (search facets list them).
- **Prices** are national per country: the store does not change them, it matters for stock. The same Cricut Explore 5 bundle (SKU 10816737) was $199.00 next to "Reg.$249.00" on www.michaels.com and CAD 269.99 next to "Reg.$349.99" on canada.michaels.com. discount_percent is arithmetic on the two prices.
- **Get Store Stock** returns units of one SKU at the stores near a ZIP or postal code as Michaels reports them (not a promise); pop-up stores appear with 0 units and virtual true. **Get Store Inventory** returns units of up to 30 SKUs at one store (Soft Classic Solid Yarn, SKU 10228177: 85 units at store 1191, New York). online_stock on Get Product is Michaels' online stock, not a store's.
- **Lists** mix Michaels items and Marketplace items (seller_type); Marketplace items carry a seller id, no seller name. A UPC search answers with the product group's lead SKU.
- Not available: review or Q&A text (rating and count only), the weekly ad, coupons, classes and events, aisle locations, Marketplace seller names, custom framing, price history (schedule a workflow to track changes), checkout.

Every Michaels operation costs 2 credits (Get Category Products and Get Deals 4 with a /shop/ category; credits_used says what was charged) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.78.0

**New resource: Tractor Supply, 12 operations.** Tractor Supply (tractorsupply.com), the US rural lifestyle retailer: an item's price at the store you pick (named in priced_for with the store's price zone), one item's price at up to 25 stores in one call, exact units per store with in-transit stock and its pickup date, and pickup and delivery options for a ZIP; plus search, categories, brands, deals, promotions with dates and store details. Pair it with the Ace Hardware, Walmart and Chewy resources for a price check on the same item.

- **Country**: United States only; no operation takes a country.
- **Prices**: Tractor Supply prices by store, so Search Products, Get Product, Get Category Products, Get Brand Products and Get Deals need a **Store Number** or a **ZIP Code** (Price For; the nearest store Tractor Supply lists for the ZIP is used). Every price answer carries priced_for (store_id, zone, city, state). Tractor Supply's terms note that prices may vary in different geographic markets, and the same item can be priced differently at different stores: the same 50 lb bag of Producer's Pride 16% Layer Pellets (item 2340147) was $14.49 at store 1933 Glendive MT (zone 81) and $20.19 at store 1923 Port Orchard WA (zone 92). Some items carry a manufacturer's minimum advertised price (mapp), reported as given; flagged items can still show different prices at different stores.
- **Get Store Prices** returns one item's price at up to 25 stores, or at the stores nearest a ZIP, with each store's zone and the price range. **Get Store Stock** returns units per store as Tractor Supply reports them, with in-transit units and their pickup date. **Get Fulfillment** returns pickup units and the delivery options (standard, same day, ship to store) with dates for one item at one store and a ZIP.
- **Item numbers** are 7 digits (item_number from a list, e.g. 2340147). **Find Stores** lists the stores nearest a ZIP with hours, price zone, services and dated store events.
- Not available: review or Q&A text (rating and count only), search suggestions, the weekly ad, a clearance list, price history (schedule a workflow to track changes), Neighbor's Club member prices, live chick availability, Petsense, checkout.

Every Tractor Supply operation costs 1 credit (Get Product 2 on the first call for a store not yet looked up; Get Store Prices 1 per 5 lookups, 25 new stores 11; credits_used says what was charged) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

## What changed in 0.77.0

**New resource: Ace Hardware, 11 operations.** Ace Hardware (acehardware.com), the US hardware cooperative: Ace Hardware prices by store. An item's price at the Ace store you pick (named in priced_for), exact units on hand at that store and its 25 nearest, and that store's weekly ad; plus search, categories, brands, deals with promo codes, store details and Ace's paint colours. Pair it with the Home Depot and Lowe's resources for a local hardware price check on the same item (brand + model).

- **Country**: United States only; no operation takes a country.
- **Prices**: Ace stores are independently owned and operated, and the same item can be priced differently at different stores (Ace's terms: pricing varies by location). **Get Product** with a **Store Number** returns the price as Ace shows it for that store, with priced_for (store_id, price_list); without one, priced_for names the price list Ace used (CORP is Ace's online price). msrp is reported as Ace gives it and can be below a store's price. Listing prices (Search Products, Get Category Products, Get Brand Products, Get Deals) are the price Ace shows in its listing, not a store's price.
- **Store numbers**: 5 digits (e.g. 18250 or 03085), shown in every Ace store page link (acehardware.com/store-details/NUMBER). There is no store search by ZIP or city; **Find Nearest Stores** lists the 25 stores Ace names as nearest to one store.
- **Get Store Stock** returns exact units on hand (units_in_stock, soft_units, shelf location_code, regional distribution centre units) at 1-25 stores, or at one store and its 25 nearest (Nearby). Ace answers 0 for a store number or product it does not know, exactly as for one out of stock. **Get Weekly Ad** returns one store's circular with valid_from / valid_to and the ad's own price text.
- Not available: review or Q&A text (rating and count only), search suggestions, ZIP or city store search, pickup or delivery dates, price history (schedule a workflow to track changes), Ace Rewards member prices, Ace Handyman, rentals, Ace-licensed stores outside the US, checkout.

Every Ace Hardware operation costs 1 credit (Search Products 2, or 3 when Ace redirects the search to a category and the list options are applied to it; Get Product 2; Get Store Stock 1 per 5 stores, Nearby 6; Find Nearest Stores with details 1 lookup per store, 25 stores 6; an occasional call costs 2 instead of 1, and credits_used says what was charged) and carries a 240-second request timeout. Failed calls are not charged; a not-found is charged.

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
- **CVS** (1 credit, Get Product 2): Search Products, Get Product and Get Store Stock. There is no store locator: the store number is on every cvs.com store page. Search stock defaults to store 7019 (New York) and prices are the same at every store. Get Store Stock checks up to 20 SKUs at one store. Get Product can take 10-30 seconds or more; it carries a 120-second request timeout.

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
