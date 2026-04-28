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

Track an ASIN every 6 hours and email the user when the price drops.

1. In n8n: **Workflows -> Import from File** -> pick [`workflows/amazon-price-drop.json`](workflows/amazon-price-drop.json).
2. Open the **Config** node and set your `asin`, recipient `email`, and Amazon `domain`.
3. Open **Scavio: Get Product** -> attach your Scavio API credential.
4. Open **Send Email** -> attach your SMTP credential.
5. Activate the workflow. The first run seeds the baseline price; every subsequent run compares against it and emails on a drop.

Five nodes total: Schedule -> Config -> Scavio (Amazon Get Product) -> Code (compare) -> IF -> Email. State persists in `$workflow.staticData.lastPrice` (no external DB needed).

Same shape works for Walmart (swap the Scavio operation), YouTube view-count tracking, Reddit thread monitoring, etc.

## Compatibility

- Requires n8n version 1.0 or later.
- Tested against Scavio API v1 (`https://api.scavio.dev`).

## Resources

- [Scavio docs](https://scavio.dev/docs/introduction)
- [Scavio dashboard](https://dashboard.scavio.dev)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
