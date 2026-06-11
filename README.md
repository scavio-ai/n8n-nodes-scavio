# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev) — a real-time search API for Google, Amazon, Walmart, YouTube, Reddit, TikTok, and Instagram — in your n8n workflows.

Scavio returns clean, structured JSON from organic search across the major discovery surfaces. Use it to power product research, sentiment monitoring, AI agent retrieval, lead enrichment, and content workflows.

[Installation](#installation) - [Operations](#operations) - [Credentials](#credentials) - [Compatibility](#compatibility) - [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n: **Settings -> Community Nodes -> Install** -> enter `n8n-nodes-scavio`.

## Operations

| Resource | Operations |
| --- | --- |
| Google | Search |
| Amazon | Search Products, Get Product |
| Walmart | Search Products, Get Product |
| YouTube | Search, Get Metadata |
| Reddit | Search Posts, Get Post |
| TikTok | Get Profile, Get User Posts, Get Video, Get Video Comments, Get Comment Replies, Search Videos, Search Users, Get Hashtag, Get Hashtag Videos, Get User Followers, Get User Followings |
| Instagram | Get Profile, Get User Posts, Get User Reels, Get User Tagged, Get User Stories, Get Post, Get Post Comments, Get Comment Replies, Search Users, Search Hashtags, Get User Followers, Get User Followings |
| Account | Get Usage |

## Credentials

You need a Scavio API key. Sign up at [scavio.dev](https://scavio.dev), grab your key from the dashboard, and paste it into the `Scavio API` credential in n8n.

The credential test calls `GET /api/v1/usage` (free) so you get instant feedback that your key works.

## Compatibility

- Requires n8n version 1.0 or later.
- Tested against Scavio API v1 (`https://api.scavio.dev`).

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction)
- [Scavio dashboard](https://dashboard.scavio.dev)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)


## About Scavio

[Scavio](https://scavio.dev) is a unified [search API](https://scavio.dev/docs/search-api) built for AI agents — one API key, structured JSON, no scraping or proxies. A real-time [Tavily alternative](https://scavio.dev) and [SerpAPI alternative](https://scavio.dev) with data from:

- [Google Search API](https://scavio.dev/docs/search-api) — SERP results, news, images, maps, and knowledge graph
- [Amazon Product API](https://scavio.dev/docs/amazon-api) and [Walmart API](https://scavio.dev/docs/walmart-api) — product search and details
- [YouTube API](https://scavio.dev/docs/youtube-api), [TikTok API](https://scavio.dev/docs/tiktok-api), and [Instagram API](https://scavio.dev/docs/instagram-api) — video and social media data
- [Reddit API](https://scavio.dev/docs/reddit-api) — posts and threaded comments

Get a free [API key](https://dashboard.scavio.dev) and explore the [documentation](https://scavio.dev/docs/introduction).
