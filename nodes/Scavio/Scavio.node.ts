import { NodeConnectionTypes } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

import { googleOperations, googleFields } from './descriptions/GoogleDescription';
import { amazonOperations, amazonFields } from './descriptions/AmazonDescription';
import { walmartOperations, walmartFields } from './descriptions/WalmartDescription';
import { youtubeOperations, youtubeFields } from './descriptions/YouTubeDescription';
import { redditOperations, redditFields } from './descriptions/RedditDescription';
import { tiktokOperations, tiktokFields } from './descriptions/TikTokDescription';
import { instagramOperations, instagramFields } from './descriptions/InstagramDescription';
import { twitterOperations, twitterFields } from './descriptions/TwitterDescription';
import { linkedinOperations, linkedinFields } from './descriptions/LinkedInDescription';
import { accountOperations, accountFields } from './descriptions/AccountDescription';

export class Scavio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Scavio',
		name: 'scavio',
		icon: 'file:scavio.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description:
			'Real-time search across Google, Amazon, Walmart, YouTube, Reddit, TikTok, Instagram, Twitter, and LinkedIn',
		defaults: { name: 'Scavio' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'scavioApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.scavio.dev',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Amazon', value: 'amazon' },
					{ name: 'Google', value: 'google' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'LinkedIn', value: 'linkedin' },
					{ name: 'Reddit', value: 'reddit' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'Twitter', value: 'twitter' },
					{ name: 'Walmart', value: 'walmart' },
					{ name: 'YouTube', value: 'youtube' },
				],
				default: 'google',
			},
			...googleOperations,
			...googleFields,
			...amazonOperations,
			...amazonFields,
			...walmartOperations,
			...walmartFields,
			...youtubeOperations,
			...youtubeFields,
			...redditOperations,
			...redditFields,
			...tiktokOperations,
			...tiktokFields,
			...instagramOperations,
			...instagramFields,
			...twitterOperations,
			...twitterFields,
			...linkedinOperations,
			...linkedinFields,
			...accountOperations,
			...accountFields,
		],
	};
}
