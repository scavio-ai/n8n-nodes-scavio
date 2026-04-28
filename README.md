# n8n-nodes-scavio

This is an n8n community node. It lets you use [Scavio](https://scavio.dev) — a real-time search API for Google, Amazon, Walmart, YouTube, and Reddit — in your n8n workflows.

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
| Account | Get Usage |

## Credentials

You need a Scavio API key. Sign up at [scavio.dev](https://scavio.dev), grab your key from the dashboard, and paste it into the `Scavio API` credential in n8n.

The credential test calls `GET /api/v1/usage` (free) so you get instant feedback that your key works.

## Example: Amazon Price-Drop Alert

Track any number of ASINs every 6 hours and email when a price hits your target.

**1. Set up the spreadsheet** (one-time)

Create a Google Sheet with one tab named **Watchlist**, columns: `asin | email | targetPrice | title`. Add one row per product you want to track and set `targetPrice` to the max price you'd pay.

**2. Import the workflow**

In n8n: **Workflows -> Import from File** -> [`workflows/amazon-price-drop.json`](workflows/amazon-price-drop.json).

**3. Wire credentials**

- **Get Watchlist** -> spreadsheet ID + Google Sheets OAuth credential.
- **Scavio: Get Product** -> Scavio API credential.
- **Send Email** -> SMTP credential and `fromEmail`.

**4. Activate.** Every 6 hours, the workflow checks each row. If the current price is at or below `targetPrice`, it emails the address in that row. **Delete the row from the sheet once you buy** — otherwise you'll keep getting reminders while the deal is still on.

Five nodes: Schedule -> Sheets read -> Scavio Amazon Get Product -> IF (price <= target) -> Email. n8n iterates per row automatically.

Same shape works for Walmart (swap the Scavio operation), YouTube view-count alerts, Reddit thread monitoring, etc.

## Compatibility

- Requires n8n version 1.0 or later.
- Tested against Scavio API v1 (`https://api.scavio.dev`).

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction)
- [Scavio dashboard](https://dashboard.scavio.dev)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
