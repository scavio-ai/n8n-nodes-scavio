import { NodeConnectionTypes } from 'n8n-workflow';
import type { INodeType, INodeTypeDescription } from 'n8n-workflow';

import { googleOperations, googleFields } from './descriptions/GoogleDescription';
import { amazonOperations, amazonFields } from './descriptions/AmazonDescription';
import { walmartOperations, walmartFields } from './descriptions/WalmartDescription';
import { youtubeOperations, youtubeFields } from './descriptions/YouTubeDescription';
import { redditOperations, redditFields } from './descriptions/RedditDescription';
import { tiktokOperations, tiktokFields } from './descriptions/TikTokDescription';
import { tiktokShopOperations, tiktokShopFields } from './descriptions/TikTokShopDescription';
import { instagramOperations, instagramFields } from './descriptions/InstagramDescription';
import { xOperations, xFields } from './descriptions/XDescription';
import { linkedinOperations, linkedinFields } from './descriptions/LinkedInDescription';
import { threadsOperations, threadsFields } from './descriptions/ThreadsDescription';
import { kuaishouOperations, kuaishouFields } from './descriptions/KuaishouDescription';
import { ebayOperations, ebayFields } from './descriptions/EbayDescription';
import { targetOperations, targetFields } from './descriptions/TargetDescription';
import { homeDepotOperations, homeDepotFields } from './descriptions/HomeDepotDescription';
import { zillowOperations, zillowFields } from './descriptions/ZillowDescription';
import { bookingOperations, bookingFields } from './descriptions/BookingDescription';
import { tripadvisorOperations, tripadvisorFields } from './descriptions/TripadvisorDescription';
import { indeedOperations, indeedFields } from './descriptions/IndeedDescription';
import { airbnbOperations, airbnbFields } from './descriptions/AirbnbDescription';
import { glassdoorOperations, glassdoorFields } from './descriptions/GlassdoorDescription';
import { yelpOperations, yelpFields } from './descriptions/YelpDescription';
import { appStoreOperations, appStoreFields } from './descriptions/AppStoreDescription';
import { googlePlayOperations, googlePlayFields } from './descriptions/GooglePlayDescription';
import { secOperations, secFields } from './descriptions/SecDescription';
import { redfinOperations, redfinFields } from './descriptions/RedfinDescription';
import {
	companiesHouseOperations,
	companiesHouseFields,
} from './descriptions/CompaniesHouseDescription';
import { g2Operations, g2Fields } from './descriptions/G2Description';
import { capterraOperations, capterraFields } from './descriptions/CapterraDescription';
import { googleAdsOperations, googleAdsFields } from './descriptions/GoogleAdsDescription';
import { metaAdsOperations, metaAdsFields } from './descriptions/MetaAdsDescription';
import { extractOperations, extractFields } from './descriptions/ExtractDescription';
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
			'Real-time structured data from Google, Amazon, Walmart, eBay, Target, Home Depot, YouTube, Reddit, TikTok, Instagram, X, LinkedIn, Threads, Kuaishou, Zillow, Redfin, Booking.com, Airbnb, Tripadvisor, Yelp, Indeed, Glassdoor, the App Store, Google Play, SEC EDGAR, Companies House, G2, Capterra, ad libraries, and any URL',
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
					{ name: 'Airbnb', value: 'airbnb' },
					{ name: 'Amazon', value: 'amazon' },
					{ name: 'Apple App Store', value: 'appStore' },
					{ name: 'Booking.com', value: 'booking' },
					{ name: 'Capterra (Software Reviews)', value: 'capterra' },
					{ name: 'Companies House (UK)', value: 'companiesHouse' },
					{ name: 'eBay', value: 'ebay' },
					{ name: 'Extract (Any URL)', value: 'extract' },
					{ name: 'G2 (Software Reviews)', value: 'g2' },
					{ name: 'Glassdoor', value: 'glassdoor' },
					{ name: 'Google', value: 'google' },
					{ name: 'Google Ads Transparency', value: 'googleAds' },
					{ name: 'Google Play', value: 'googlePlay' },
					{ name: 'Home Depot', value: 'homeDepot' },
					{ name: 'Indeed', value: 'indeed' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'Kuaishou (China)', value: 'kuaishou' },
					{ name: 'LinkedIn', value: 'linkedin' },
					{ name: 'Meta Ad Library', value: 'metaAds' },
					{ name: 'Reddit', value: 'reddit' },
					{ name: 'Redfin', value: 'redfin' },
					{ name: 'SEC EDGAR', value: 'sec' },
					{ name: 'Target', value: 'target' },
					// Threads is Meta's brand name, not a plural noun. Singularizing it to
					// "Thread" would misname the product, and the `threads` value is frozen
					// because it is saved inside user workflows.
					// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
					{ name: 'Threads', value: 'threads' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'TikTok Shop', value: 'tiktokShop' },
					{ name: 'Tripadvisor', value: 'tripadvisor' },
					{ name: 'Walmart', value: 'walmart' },
					{ name: 'X', value: 'x' },
					{ name: 'Yelp', value: 'yelp' },
					{ name: 'YouTube', value: 'youtube' },
					{ name: 'Zillow', value: 'zillow' },
				],
				default: 'google',
			},
			...googleOperations,
			...googleFields,
			...amazonOperations,
			...amazonFields,
			...walmartOperations,
			...walmartFields,
			...ebayOperations,
			...ebayFields,
			...targetOperations,
			...targetFields,
			...homeDepotOperations,
			...homeDepotFields,
			...youtubeOperations,
			...youtubeFields,
			...redditOperations,
			...redditFields,
			...tiktokOperations,
			...tiktokFields,
			...tiktokShopOperations,
			...tiktokShopFields,
			...instagramOperations,
			...instagramFields,
			...xOperations,
			...xFields,
			...linkedinOperations,
			...linkedinFields,
			...threadsOperations,
			...threadsFields,
			...kuaishouOperations,
			...kuaishouFields,
			...zillowOperations,
			...zillowFields,
			...redfinOperations,
			...redfinFields,
			...bookingOperations,
			...bookingFields,
			...airbnbOperations,
			...airbnbFields,
			...tripadvisorOperations,
			...tripadvisorFields,
			...yelpOperations,
			...yelpFields,
			...indeedOperations,
			...indeedFields,
			...glassdoorOperations,
			...glassdoorFields,
			...appStoreOperations,
			...appStoreFields,
			...googlePlayOperations,
			...googlePlayFields,
			...secOperations,
			...secFields,
			...companiesHouseOperations,
			...companiesHouseFields,
			...g2Operations,
			...g2Fields,
			...capterraOperations,
			...capterraFields,
			...googleAdsOperations,
			...googleAdsFields,
			...metaAdsOperations,
			...metaAdsFields,
			...extractOperations,
			...extractFields,
			...accountOperations,
			...accountFields,
		],
	};
}
