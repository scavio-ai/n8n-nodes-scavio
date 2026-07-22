# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev) — a real-time search API for Google, Amazon, Walmart, YouTube, Reddit, TikTok, and Instagram — in your n8n workflows.

Scavio returns clean, structured JSON from organic search across the major discovery surfaces. Use it to power product research, sentiment monitoring, AI agent retrieval, lead enrichment, and content workflows.

[Installation](#installation) - [Operations](#operations) - [Templates](#templates) - [Credentials](#credentials) - [Compatibility](#compatibility) - [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n: **Settings -> Community Nodes -> Install** -> enter `n8n-nodes-scavio`.

## Operations

| Resource | Operations |
| --- | --- |
| Google | Search, AI Mode, Maps Search |
| Amazon | Search Products, Get Product |
| Walmart | Search Products, Get Product |
| YouTube | Search, Get Metadata |
| Reddit | Search Posts, Get Post |
| TikTok | Get Profile, Get User Posts, Get Video, Get Video Comments, Get Comment Replies, Search Videos, Search Users, Get Hashtag, Get Hashtag Videos, Get User Followers, Get User Followings |
| Instagram | Get Profile, Get User Posts, Get User Reels, Get User Tagged, Get User Stories, Get Post, Get Post Comments, Get Comment Replies, Search Users, Search Hashtags, Get User Followers, Get User Followings |
| Account | Get Usage |

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
- Tested against Scavio API v1 (`https://api.scavio.dev`).

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction)
- [Scavio dashboard](https://dashboard.scavio.dev/sign-up)
- [Compare Scavio vs alternatives](https://scavio.dev/compare)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)


## About Scavio

[Scavio](https://scavio.dev) is a unified [search API for AI agents](https://scavio.dev/search-api-for-ai-agents) — one API key, structured JSON, no scraping or proxies. A real-time [Tavily alternative](https://scavio.dev/alternatives/tavily) and [SerpAPI alternative](https://scavio.dev/alternatives/serpapi) with data from:

- [Google Search API](https://scavio.dev/google-search-api) — SERP results, news, images, maps, and knowledge graph
- [Amazon Product API](https://scavio.dev/amazon-product-api) and [Walmart Product API](https://scavio.dev/walmart-product-api) — product search and details
- [YouTube API](https://scavio.dev/youtube-transcript-api), [TikTok API](https://scavio.dev/tiktok-api), and [Instagram API](https://scavio.dev/instagram-api) — video and social media data
- [Reddit API](https://scavio.dev/reddit-api) — posts and threaded comments

Get a free [API key](https://dashboard.scavio.dev/sign-up) and explore the [documentation](https://scavio.dev/docs/introduction).
