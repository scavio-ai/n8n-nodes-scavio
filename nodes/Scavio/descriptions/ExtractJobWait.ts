import { NodeApiError, sleep } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';

import { NODE_PACKAGE_VERSION } from '../version';

// "Wait for Completion" on Start Crawl / Start Batch. The create call returns
// 202 with a job id; when the toggle is on, this postReceive hook polls the
// job's status endpoint until it finishes or the wait cap is reached, then
// returns the status (first page of results plus next_cursor) in place of the
// 202 body. A timeout is not an error: the latest status comes back with
// wait.timed_out = true so the workflow can carry on polling with Get Status.

const BASE_URL = 'https://api.scavio.dev';
const FINISHED = new Set(['completed', 'failed', 'cancelled']);
export const MAX_WAIT_SECONDS = 600;
export const DEFAULT_WAIT_SECONDS = 300;
export const DEFAULT_POLL_SECONDS = 5;
const MAX_CONSECUTIVE_POLL_ERRORS = 3;

function clamp(value: unknown, min: number, max: number, fallback: number): number {
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(Math.max(n, min), max);
}

export function waitForJob(type: 'crawl' | 'batch') {
	return async function (
		this: IExecuteSingleFunctions,
		items: INodeExecutionData[],
		_response: IN8nHttpFullResponse,
	): Promise<INodeExecutionData[]> {
		if (!(this.getNodeParameter('waitForCompletion', false) as boolean)) return items;

		const maxWait = clamp(
			this.getNodeParameter('maxWaitSeconds', DEFAULT_WAIT_SECONDS),
			10,
			MAX_WAIT_SECONDS,
			DEFAULT_WAIT_SECONDS,
		);
		const interval = clamp(
			this.getNodeParameter('pollIntervalSeconds', DEFAULT_POLL_SECONDS),
			2,
			60,
			DEFAULT_POLL_SECONDS,
		);

		const out: INodeExecutionData[] = [];
		for (const item of items) {
			const created = (item.json.data ?? {}) as IDataObject;
			const id = created.id;
			if (typeof id !== 'string' || !id) {
				out.push(item);
				continue;
			}

			const started = Date.now();
			const deadline = started + maxWait * 1000;
			let latest: IDataObject | undefined;
			let errors = 0;
			let finished = false;

			for (;;) {
				try {
					latest = (await this.helpers.httpRequestWithAuthentication.call(this, 'scavioApi', {
						method: 'GET',
						url: `${BASE_URL}/api/v1/extract/${type}/${encodeURIComponent(id)}`,
						headers: {
							Accept: 'application/json',
							'User-Agent': `n8n-nodes-scavio/${NODE_PACKAGE_VERSION}`,
							'X-Client-Source': 'n8n-nodes-scavio',
						},
						json: true,
					})) as IDataObject;
					errors = 0;
				} catch (error) {
					errors++;
					if (errors >= MAX_CONSECUTIVE_POLL_ERRORS) {
						throw new NodeApiError(this.getNode(), error as JsonObject);
					}
				}
				const status = (latest?.data as IDataObject | undefined)?.status;
				if (typeof status === 'string' && FINISHED.has(status)) {
					finished = true;
					break;
				}
				if (Date.now() + interval * 1000 > deadline) break;
				await sleep(interval * 1000);
			}

			out.push({
				json: {
					...(latest ?? item.json),
					// The create response carries webhook_secret exactly once; keep it.
					created,
					wait: {
						completed: finished,
						timed_out: !finished,
						waited_seconds: Math.round((Date.now() - started) / 1000),
					},
				},
				pairedItem: item.pairedItem,
			});
		}
		return out;
	};
}
