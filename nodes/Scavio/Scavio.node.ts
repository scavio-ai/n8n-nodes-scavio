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
import { costcoOperations, costcoFields } from './descriptions/CostcoDescription';
import { hebOperations, hebFields } from './descriptions/HebDescription';
import { krogerOperations, krogerFields } from './descriptions/KrogerDescription';
import { publixOperations, publixFields } from './descriptions/PublixDescription';
import { ikeaOperations, ikeaFields } from './descriptions/IkeaDescription';
import { wayfairOperations, wayfairFields } from './descriptions/WayfairDescription';
import { ashleyOperations, ashleyFields } from './descriptions/AshleyDescription';
import {
	maisonsDuMondeOperations,
	maisonsDuMondeFields,
} from './descriptions/MaisonsDuMondeDescription';
import { decathlonOperations, decathlonFields } from './descriptions/DecathlonDescription';
import { specsOperations, specsFields } from './descriptions/SpecsDescription';
import { lowesOperations, lowesFields } from './descriptions/LowesDescription';
import { acehardwareOperations, acehardwareFields } from './descriptions/AcehardwareDescription';
import { tractorsupplyOperations, tractorsupplyFields } from './descriptions/TractorsupplyDescription';
import { samsClubOperations, samsClubFields } from './descriptions/SamsClubDescription';
import {
	canadianTireOperations,
	canadianTireFields,
} from './descriptions/CanadianTireDescription';
import {
	dollarGeneralOperations,
	dollarGeneralFields,
} from './descriptions/DollarGeneralDescription';
import { sephoraOperations, sephoraFields } from './descriptions/SephoraDescription';
import { ultaOperations, ultaFields } from './descriptions/UltaDescription';
import { aldiOperations, aldiFields } from './descriptions/AldiDescription';
import { instacartOperations, instacartFields } from './descriptions/InstacartDescription';
import { microCenterOperations, microCenterFields } from './descriptions/MicroCenterDescription';
import { walgreensOperations, walgreensFields } from './descriptions/WalgreensDescription';
import { cvsOperations, cvsFields } from './descriptions/CvsDescription';
import { wholeFoodsOperations, wholeFoodsFields } from './descriptions/WholeFoodsDescription';
import {
	harborFreightOperations,
	harborFreightFields,
} from './descriptions/HarborFreightDescription';
import { petsmartOperations, petsmartFields } from './descriptions/PetSmartDescription';
import { petcoOperations, petcoFields } from './descriptions/PetcoDescription';
import { iherbOperations, iherbFields } from './descriptions/IherbDescription';
import { chewyOperations, chewyFields } from './descriptions/ChewyDescription';
import { menardsOperations, menardsFields } from './descriptions/MenardsDescription';
import { nordstromOperations, nordstromFields } from './descriptions/NordstromDescription';
import {
	nordstromRackOperations,
	nordstromRackFields,
} from './descriptions/NordstromRackDescription';
import { bestBuyOperations, bestBuyFields } from './descriptions/BestBuyDescription';
import { tcgplayerOperations, tcgplayerFields } from './descriptions/TcgplayerDescription';
import { nintendoOperations, nintendoFields } from './descriptions/NintendoDescription';
import { hmOperations, hmFields } from './descriptions/HmDescription';
import { zaraOperations, zaraFields } from './descriptions/ZaraDescription';
import { asosOperations, asosFields } from './descriptions/AsosDescription';
import { vintedOperations, vintedFields } from './descriptions/VintedDescription';
import { mercariOperations, mercariFields } from './descriptions/MercariDescription';
import { macysOperations, macysFields } from './descriptions/MacysDescription';
import { saksOperations, saksFields } from './descriptions/SaksDescription';
import { kohlsOperations, kohlsFields } from './descriptions/KohlsDescription';
import { jcpenneyOperations, jcpenneyFields } from './descriptions/JcpenneyDescription';
import { dicksOperations, dicksFields } from './descriptions/DicksDescription';
import { footlockerOperations, footlockerFields } from './descriptions/FootlockerDescription';
import { fanaticsOperations, fanaticsFields } from './descriptions/FanaticsDescription';
import { fashionnovaOperations, fashionnovaFields } from './descriptions/FashionnovaDescription';
import { argosOperations, argosFields } from './descriptions/ArgosDescription';
import { mediaexpertOperations, mediaexpertFields } from './descriptions/MediaexpertDescription';
import { actionOperations, actionFields } from './descriptions/ActionDescription';
import { hemaOperations, hemaFields } from './descriptions/HemaDescription';
import { autozoneOperations, autozoneFields } from './descriptions/AutozoneDescription';
import { oreillyOperations, oreillyFields } from './descriptions/OreillyDescription';
import { carrefourOperations, carrefourFields } from './descriptions/CarrefourDescription';
import { allegroOperations, allegroFields } from './descriptions/AllegroDescription';
import { bolcomOperations, bolcomFields } from './descriptions/BolcomDescription';
import { uniqloOperations, uniqloFields } from './descriptions/UniqloDescription';
import { depopOperations, depopFields } from './descriptions/DepopDescription';
import { poshmarkOperations, poshmarkFields } from './descriptions/PoshmarkDescription';
import { thredupOperations, thredupFields } from './descriptions/ThredupDescription';
import { olxOperations, olxFields } from './descriptions/OlxDescription';
import { trendyolOperations, trendyolFields } from './descriptions/TrendyolDescription';
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
import { realtorOperations, realtorFields } from './descriptions/RealtorDescription';
import { rightmoveOperations, rightmoveFields } from './descriptions/RightmoveDescription';
import {
	mercadoLibreOperations,
	mercadoLibreFields,
} from './descriptions/MercadoLibreDescription';
import {
	companiesHouseOperations,
	companiesHouseFields,
} from './descriptions/CompaniesHouseDescription';
import { companyOperations, companyFields } from './descriptions/CompanyDescription';
import { g2Operations, g2Fields } from './descriptions/G2Description';
import { capterraOperations, capterraFields } from './descriptions/CapterraDescription';
import { trustpilotOperations, trustpilotFields } from './descriptions/TrustpilotDescription';
import {
	chatgptOperations,
	chatgptFields,
	geminiOperations,
	geminiFields,
} from './descriptions/AiChatDescription';
import { googleAdsOperations, googleAdsFields } from './descriptions/GoogleAdsDescription';
import { metaAdsOperations, metaAdsFields } from './descriptions/MetaAdsDescription';
import { extractOperations, extractFields } from './descriptions/ExtractDescription';
import { accountOperations, accountFields } from './descriptions/AccountDescription';
import { aliexpressOperations, aliexpressFields } from './descriptions/AliExpressDescription';
import { douyinOperations, douyinFields } from './descriptions/DouyinDescription';
import { etsyOperations, etsyFields } from './descriptions/EtsyDescription';
import { facebookOperations, facebookFields } from './descriptions/FacebookDescription';
import { githubOperations, githubFields } from './descriptions/GitHubDescription';
import { legistarOperations, legistarFields } from './descriptions/LegistarDescription';
import { pinterestOperations, pinterestFields } from './descriptions/PinterestDescription';
import { twitchOperations, twitchFields } from './descriptions/TwitchDescription';
import { weiboOperations, weiboFields } from './descriptions/WeiboDescription';
import { adsIntelOperations, adsIntelFields } from './descriptions/AdsIntelDescription';
import { NODE_PACKAGE_VERSION } from './version';

export class Scavio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Scavio',
		name: 'scavio',
		icon: 'file:scavio.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description:
			'Real-time structured data from Google, ChatGPT, Gemini, Amazon, Walmart, eBay, Target, Home Depot, Costco, HEB, Kroger, Publix, IKEA, Wayfair, Ashley Furniture, Maisons du Monde, Decathlon, Spec\'s, Lowe\'s, Ace Hardware, Tractor Supply, Sam\'s Club, Canadian Tire, Dollar General, Sephora, Ulta Beauty, ALDI, Micro Center, Walgreens, CVS, Whole Foods Market, Harbor Freight, AutoZone, O\'Reilly Auto Parts, Instacart, PetSmart, Petco, iHerb, Chewy, Menards, Nordstrom, Nordstrom Rack, Best Buy, TCGplayer, Nintendo eShop, H&M, Zara, Uniqlo, ASOS, Fashion Nova, Vinted, Mercari, Depop, Poshmark, thredUP, Macy\'s, Saks Fifth Avenue, Kohl\'s, JCPenney, Dick\'s Sporting Goods, Foot Locker, Fanatics, Argos, Media Expert, Action, HEMA, Carrefour, Allegro, bol.com, OLX, Trendyol, Mercado Libre, YouTube, Reddit, TikTok, Instagram, X, LinkedIn, Facebook, Pinterest, Threads, Kuaishou, Douyin, Weibo, Twitch, GitHub, Etsy, AliExpress, Zillow, Redfin, Realtor.com, Rightmove, Booking.com, Airbnb, Tripadvisor, Yelp, Indeed, Glassdoor, the App Store, Google Play, SEC EDGAR, Companies House, Legistar, company websites (contact and owner enrichment), G2, Capterra, Trustpilot, ad libraries, and any URL',
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
				'User-Agent': `n8n-nodes-scavio/${NODE_PACKAGE_VERSION}`,
				'X-Client-Source': 'n8n-nodes-scavio',
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
					{ name: 'Ace Hardware', value: 'acehardware' },
					{ name: 'Action', value: 'action' },
					{ name: 'Ads Intel (Cross-Platform)', value: 'adsIntel' },
					{ name: 'Airbnb', value: 'airbnb' },
					{ name: 'ALDI', value: 'aldi' },
					{ name: 'AliExpress', value: 'aliexpress' },
					{ name: 'Allegro', value: 'allegro' },
					{ name: 'Amazon', value: 'amazon' },
					{ name: 'Apple App Store', value: 'appStore' },
					// Argos, ASOS and CVS are retailers' brand names, not plural nouns, and their
					// values are frozen once saved in user workflows. The rule reports only
					// the first plural-looking option in this list, so the disable lives here.
					// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
					{ name: 'Argos', value: 'argos' },
					{ name: 'Ashley Furniture', value: 'ashley' },
					{ name: 'ASOS', value: 'asos' },
					{ name: 'AutoZone', value: 'autozone' },
					{ name: 'Best Buy', value: 'bestBuy' },
					{ name: 'bol.com', value: 'bolcom' },
					{ name: 'Booking.com', value: 'booking' },
					{ name: 'Canadian Tire', value: 'canadianTire' },
					{ name: 'Capterra (Software Reviews)', value: 'capterra' },
					{ name: 'Carrefour', value: 'carrefour' },
					{ name: 'ChatGPT', value: 'chatgpt' },
					{ name: 'Chewy', value: 'chewy' },
					{ name: 'Companies House (UK)', value: 'companiesHouse' },
					{ name: 'Company (Enrich)', value: 'company' },
					{ name: 'Costco', value: 'costco' },
					{ name: 'CVS', value: 'cvs' },
					{ name: 'Decathlon', value: 'decathlon' },
					{ name: 'Depop', value: 'depop' },
					{ name: "Dick's Sporting Goods", value: 'dicks' },
					{ name: 'Dollar General', value: 'dollarGeneral' },
					{ name: 'Douyin (China)', value: 'douyin' },
					{ name: 'eBay', value: 'ebay' },
					{ name: 'Etsy', value: 'etsy' },
					{ name: 'Extract (Any URL)', value: 'extract' },
					{ name: 'Facebook', value: 'facebook' },
					{ name: 'Fanatics', value: 'fanatics' },
					{ name: 'Fashion Nova', value: 'fashionnova' },
					{ name: 'Foot Locker', value: 'footlocker' },
					{ name: 'G2 (Software Reviews)', value: 'g2' },
					{ name: 'Gemini', value: 'gemini' },
					{ name: 'GitHub', value: 'github' },
					{ name: 'Glassdoor', value: 'glassdoor' },
					{ name: 'Google', value: 'google' },
					{ name: 'Google Ads Transparency', value: 'googleAds' },
					{ name: 'Google Play', value: 'googlePlay' },
					{ name: 'H&M', value: 'hm' },
					{ name: 'Harbor Freight', value: 'harborFreight' },
					{ name: 'HEB', value: 'heb' },
					{ name: 'HEMA', value: 'hema' },
					{ name: 'Home Depot', value: 'homeDepot' },
					{ name: 'iHerb', value: 'iherb' },
					{ name: 'IKEA', value: 'ikea' },
					{ name: 'Indeed', value: 'indeed' },
					{ name: 'Instacart', value: 'instacart' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'JCPenney', value: 'jcpenney' },
					{ name: "Kohl's", value: 'kohls' },
					{ name: 'Kroger', value: 'kroger' },
					{ name: 'Kuaishou (China)', value: 'kuaishou' },
					{ name: 'Legistar (Municipal)', value: 'legistar' },
					{ name: 'LinkedIn', value: 'linkedin' },
					// Lowe's is the retailer's brand name, not a plural noun, and `lowes` is
					// frozen once saved in user workflows.
					{ name: "Lowe's", value: 'lowes' },
					// Macy's is the retailer's brand name; `macys` is frozen once saved in user
					// workflows.
					{ name: "Macy's", value: 'macys' },
					// Maisons du Monde is the retailer's brand name; title case would misspell it.
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'Maisons du Monde', value: 'maisonsDuMonde' },
					{ name: 'Media Expert', value: 'mediaexpert' },
					// Menards is the retailer's brand name, not a plural noun, and `menards` is
					// frozen once saved in user workflows.
					{ name: 'Menards', value: 'menards' },
					{ name: 'Mercado Libre', value: 'mercadoLibre' },
					{ name: 'Mercari', value: 'mercari' },
					{ name: 'Meta Ad Library', value: 'metaAds' },
					{ name: 'Micro Center', value: 'microCenter' },
					{ name: 'Nintendo', value: 'nintendo' },
					{ name: 'Nordstrom', value: 'nordstrom' },
					{ name: 'Nordstrom Rack', value: 'nordstromRack' },
					{ name: "O'Reilly Auto Parts", value: 'oreilly' },
					{ name: 'OLX', value: 'olx' },
					{ name: 'Petco', value: 'petco' },
					{ name: 'PetSmart', value: 'petsmart' },
					{ name: 'Pinterest', value: 'pinterest' },
					{ name: 'Poshmark', value: 'poshmark' },
					{ name: 'Publix', value: 'publix' },
					{ name: 'Realtor.com', value: 'realtor' },
					{ name: 'Reddit', value: 'reddit' },
					{ name: 'Redfin', value: 'redfin' },
					{ name: 'Rightmove (UK)', value: 'rightmove' },
					{ name: 'Saks Fifth Avenue', value: 'saks' },
					{ name: "Sam's Club", value: 'samsClub' },
					{ name: 'SEC EDGAR', value: 'sec' },
					{ name: 'Sephora', value: 'sephora' },
					// Spec's is the retailer's brand name, not a plural noun, and `specs` is
					// frozen once saved in user workflows.
					{ name: "Spec's", value: 'specs' },
					{ name: 'Target', value: 'target' },
					{ name: 'TCGplayer', value: 'tcgplayer' },
					// Threads is Meta's brand name, not a plural noun. Singularizing it to
					// "Thread" would misname the product, and the `threads` value is frozen
					// because it is saved inside user workflows.
					{ name: 'Threads', value: 'threads' },
					{ name: 'thredUP', value: 'thredup' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'TikTok Shop', value: 'tiktokShop' },
					{ name: 'Tractor Supply', value: 'tractorsupply' },
					{ name: 'Trendyol', value: 'trendyol' },
					{ name: 'Tripadvisor', value: 'tripadvisor' },
					{ name: 'Trustpilot', value: 'trustpilot' },
					{ name: 'Twitch', value: 'twitch' },
					{ name: 'Ulta Beauty', value: 'ulta' },
					{ name: 'Uniqlo', value: 'uniqlo' },
					{ name: 'Vinted', value: 'vinted' },
					{ name: 'Walgreens', value: 'walgreens' },
					{ name: 'Walmart', value: 'walmart' },
					{ name: 'Wayfair', value: 'wayfair' },
					{ name: 'Weibo (China)', value: 'weibo' },
					// Whole Foods is the retailer's brand name, not a plural noun, and
					// `wholeFoods` is frozen once saved in user workflows.
					{ name: 'Whole Foods Market', value: 'wholeFoods' },
					{ name: 'X', value: 'x' },
					{ name: 'Yelp', value: 'yelp' },
					{ name: 'YouTube', value: 'youtube' },
					{ name: 'Zara', value: 'zara' },
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
			...costcoOperations,
			...costcoFields,
			...hebOperations,
			...hebFields,
			...krogerOperations,
			...krogerFields,
			...publixOperations,
			...publixFields,
			...ikeaOperations,
			...ikeaFields,
			...wayfairOperations,
			...wayfairFields,
			...ashleyOperations,
			...ashleyFields,
			...maisonsDuMondeOperations,
			...maisonsDuMondeFields,
			...decathlonOperations,
			...decathlonFields,
			...specsOperations,
			...specsFields,
			...lowesOperations,
			...lowesFields,
			...acehardwareOperations,
			...acehardwareFields,
			...tractorsupplyOperations,
			...tractorsupplyFields,
			...samsClubOperations,
			...samsClubFields,
			...canadianTireOperations,
			...canadianTireFields,
			...dollarGeneralOperations,
			...dollarGeneralFields,
			...sephoraOperations,
			...sephoraFields,
			...ultaOperations,
			...ultaFields,
			...aldiOperations,
			...aldiFields,
			...instacartOperations,
			...instacartFields,
			...microCenterOperations,
			...microCenterFields,
			...walgreensOperations,
			...walgreensFields,
			...cvsOperations,
			...cvsFields,
			...wholeFoodsOperations,
			...wholeFoodsFields,
			...harborFreightOperations,
			...harborFreightFields,
			...autozoneOperations,
			...autozoneFields,
			...oreillyOperations,
			...oreillyFields,
			...petsmartOperations,
			...petsmartFields,
			...petcoOperations,
			...petcoFields,
			...iherbOperations,
			...iherbFields,
			...chewyOperations,
			...chewyFields,
			...menardsOperations,
			...menardsFields,
			...nordstromOperations,
			...nordstromFields,
			...nordstromRackOperations,
			...nordstromRackFields,
			...bestBuyOperations,
			...bestBuyFields,
			...tcgplayerOperations,
			...tcgplayerFields,
			...nintendoOperations,
			...nintendoFields,
			...hmOperations,
			...hmFields,
			...zaraOperations,
			...zaraFields,
			...asosOperations,
			...asosFields,
			...fashionnovaOperations,
			...fashionnovaFields,
			...vintedOperations,
			...vintedFields,
			...mercariOperations,
			...mercariFields,
			...macysOperations,
			...macysFields,
			...saksOperations,
			...saksFields,
			...kohlsOperations,
			...kohlsFields,
			...jcpenneyOperations,
			...jcpenneyFields,
			...dicksOperations,
			...dicksFields,
			...footlockerOperations,
			...footlockerFields,
			...fanaticsOperations,
			...fanaticsFields,
			...argosOperations,
			...argosFields,
			...mediaexpertOperations,
			...mediaexpertFields,
			...actionOperations,
			...actionFields,
			...hemaOperations,
			...hemaFields,
			...carrefourOperations,
			...carrefourFields,
			...allegroOperations,
			...allegroFields,
			...bolcomOperations,
			...bolcomFields,
			...uniqloOperations,
			...uniqloFields,
			...depopOperations,
			...depopFields,
			...poshmarkOperations,
			...poshmarkFields,
			...thredupOperations,
			...thredupFields,
			...olxOperations,
			...olxFields,
			...trendyolOperations,
			...trendyolFields,
			...mercadoLibreOperations,
			...mercadoLibreFields,
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
			...realtorOperations,
			...realtorFields,
			...rightmoveOperations,
			...rightmoveFields,
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
			...companyOperations,
			...companyFields,
			...g2Operations,
			...g2Fields,
			...capterraOperations,
			...capterraFields,
			...trustpilotOperations,
			...trustpilotFields,
			...chatgptOperations,
			...chatgptFields,
			...geminiOperations,
			...geminiFields,
			...googleAdsOperations,
			...googleAdsFields,
			...metaAdsOperations,
			...metaAdsFields,
			...adsIntelOperations,
			...adsIntelFields,
			...aliexpressOperations,
			...aliexpressFields,
			...douyinOperations,
			...douyinFields,
			...etsyOperations,
			...etsyFields,
			...facebookOperations,
			...facebookFields,
			...githubOperations,
			...githubFields,
			...legistarOperations,
			...legistarFields,
			...pinterestOperations,
			...pinterestFields,
			...twitchOperations,
			...twitchFields,
			...weiboOperations,
			...weiboFields,
			...extractOperations,
			...extractFields,
			...accountOperations,
			...accountFields,
		],
	};
}
