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

Track any number of ASINs every 6 hours and email the user when prices drop. State + history live in a Google Sheet so you can edit your watchlist by editing rows, and chart price history with one click.

**1. Set up the spreadsheet** (one-time)

Create a Google Sheet with two tabs:

- **Watchlist** — columns: `asin | email | domain | lastPrice | title`
  Add one row per product you want to track. Leave `lastPrice` blank — the workflow fills it on the first run.
- **History** — columns: `asin | price | timestamp | title | url`
  Append-only log; powers price-history charts.

**2. Import the workflow**

In n8n: **Workflows -> Import from File** -> pick [`workflows/amazon-price-drop.json`](workflows/amazon-price-drop.json).

**3. Wire credentials and the spreadsheet ID**

- **Get Watchlist**, **Update Watchlist**, **Append History** -> set the spreadsheet (`REPLACE_WITH_SPREADSHEET_ID`) and attach a Google Sheets OAuth credential.
- **Scavio: Get Product** -> attach your Scavio API credential.
- **Send Email** -> attach an SMTP credential and set `fromEmail`.

**4. Activate.** First run seeds `lastPrice` for every row; every subsequent run compares the current price against it, appends a history row, updates the watchlist, and emails on a drop.

Eight nodes: Schedule -> Sheets read -> Scavio Amazon Get Product -> Code (compute drop) -> Sheets update + Sheets append -> IF -> Email. n8n iterates per watchlist row automatically.

Same shape works for Walmart (swap the Scavio operation), YouTube view-count tracking, Reddit thread monitoring, etc.

## Compatibility

- Requires n8n version 1.0 or later.
- Tested against Scavio API v1 (`https://api.scavio.dev`).

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction)
- [Scavio dashboard](https://dashboard.scavio.dev)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
