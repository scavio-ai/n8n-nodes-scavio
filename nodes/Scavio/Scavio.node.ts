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
import { michaelsOperations, michaelsFields } from './descriptions/MichaelsDescription';
import { nikeOperations, nikeFields } from './descriptions/NikeDescription';
import { staplesOperations, staplesFields } from './descriptions/StaplesDescription';
import { samsClubOperations, samsClubFields } from './descriptions/SamsClubDescription';
import { bjsOperations, bjsFields } from './descriptions/BjsDescription';
import {
	canadianTireOperations,
	canadianTireFields,
} from './descriptions/CanadianTireDescription';
import { sportchekOperations, sportchekFields } from './descriptions/SportchekDescription';
import { marksOperations, marksFields } from './descriptions/MarksDescription';
import { ronaOperations, ronaFields } from './descriptions/RonaDescription';
import {
	dollarGeneralOperations,
	dollarGeneralFields,
} from './descriptions/DollarGeneralDescription';
import { dollartreeOperations, dollartreeFields } from './descriptions/DollarTreeDescription';
import { discounttireOperations, discounttireFields } from './descriptions/DiscountTireDescription';
import { vevorOperations, vevorFields } from './descriptions/VevorDescription';
import { nellisOperations, nellisFields } from './descriptions/NellisDescription';
import { estatesalesOperations, estatesalesFields } from './descriptions/EstatesalesDescription';
import { bringatrailerOperations, bringatrailerFields } from './descriptions/BringatrailerDescription';
import { sephoraOperations, sephoraFields } from './descriptions/SephoraDescription';
import { ultaOperations, ultaFields } from './descriptions/UltaDescription';
import { dermstoreOperations, dermstoreFields } from './descriptions/DermstoreDescription';
import { bathandbodyworksOperations, bathandbodyworksFields } from './descriptions/BathandbodyworksDescription';
import { spacenkOperations, spacenkFields } from './descriptions/SpacenkDescription';
import { lookfantasticOperations, lookfantasticFields } from './descriptions/LookfantasticDescription';
import { cultbeautyOperations, cultbeautyFields } from './descriptions/CultbeautyDescription';
import { yesstyleOperations, yesstyleFields } from './descriptions/YesstyleDescription';
import { notinoOperations, notinoFields } from './descriptions/NotinoDescription';
import { douglasOperations, douglasFields } from './descriptions/DouglasDescription';
import { bootsOperations, bootsFields } from './descriptions/BootsDescription';
import { aldiOperations, aldiFields } from './descriptions/AldiDescription';
import { instacartOperations, instacartFields } from './descriptions/InstacartDescription';
import { pcexpressOperations, pcexpressFields } from './descriptions/PcexpressDescription';
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
import { academyOperations, academyFields } from './descriptions/AcademyDescription';
import { reiOperations, reiFields } from './descriptions/ReiDescription';
import { qvcOperations, qvcFields } from './descriptions/QvcDescription';
import { barnesandnobleOperations, barnesandnobleFields } from './descriptions/BarnesandnobleDescription';
import { thriftbooksOperations, thriftbooksFields } from './descriptions/ThriftbooksDescription';
import { belkOperations, belkFields } from './descriptions/BelkDescription';
import { abercrombieOperations, abercrombieFields } from './descriptions/AbercrombieDescription';
import { llbeanOperations, llbeanFields } from './descriptions/LlbeanDescription';
import { sweetwaterOperations, sweetwaterFields } from './descriptions/SweetwaterDescription';
import { kabumOperations, kabumFields } from './descriptions/KabumDescription';
import { magaluOperations, magaluFields } from './descriptions/MagaluDescription';
import { casasbahiaOperations, casasbahiaFields } from './descriptions/CasasbahiaDescription';
import { buscapeOperations, buscapeFields } from './descriptions/BuscapeDescription';
import { rdsaudeOperations, rdsaudeFields } from './descriptions/RdsaudeDescription';
import { reclameaquiOperations, reclameaquiFields } from './descriptions/ReclameaquiDescription';
import { leroymerlinOperations, leroymerlinFields } from './descriptions/LeroymerlinDescription';
import { naturaOperations, naturaFields } from './descriptions/NaturaDescription';
import { boticarioOperations, boticarioFields } from './descriptions/BoticarioDescription';
import { centauroOperations, centauroFields } from './descriptions/CentauroDescription';
import { williamssonomaOperations, williamssonomaFields } from './descriptions/WilliamssonomaDescription';
import { bedbathbeyondOperations, bedbathbeyondFields } from './descriptions/BedbathbeyondDescription';
import { fashionnovaOperations, fashionnovaFields } from './descriptions/FashionnovaDescription';
import { gapOperations, gapFields } from './descriptions/GapDescription';
import { zapposOperations, zapposFields } from './descriptions/ZapposDescription';
import { argosOperations, argosFields } from './descriptions/ArgosDescription';
import { mediaexpertOperations, mediaexpertFields } from './descriptions/MediaexpertDescription';
import { actionOperations, actionFields } from './descriptions/ActionDescription';
import { hemaOperations, hemaFields } from './descriptions/HemaDescription';
import { autozoneOperations, autozoneFields } from './descriptions/AutozoneDescription';
import { oreillyOperations, oreillyFields } from './descriptions/OreillyDescription';
import { rockautoOperations, rockautoFields } from './descriptions/RockautoDescription';
import { carscomOperations, carscomFields } from './descriptions/CarscomDescription';
import { autotraderOperations, autotraderFields } from './descriptions/AutotraderDescription';
import { cargurusOperations, cargurusFields } from './descriptions/CargurusDescription';
import { carmaxOperations, carmaxFields } from './descriptions/CarmaxDescription';
import { carvanaOperations, carvanaFields } from './descriptions/CarvanaDescription';
import { truecarOperations, truecarFields } from './descriptions/TruecarDescription';
import { edmundsOperations, edmundsFields } from './descriptions/EdmundsDescription';
import { kbbOperations, kbbFields } from './descriptions/KbbDescription';
import { carrefourOperations, carrefourFields } from './descriptions/CarrefourDescription';
import { allegroOperations, allegroFields } from './descriptions/AllegroDescription';
import { bolcomOperations, bolcomFields } from './descriptions/BolcomDescription';
import { uniqloOperations, uniqloFields } from './descriptions/UniqloDescription';
import { depopOperations, depopFields } from './descriptions/DepopDescription';
import { poshmarkOperations, poshmarkFields } from './descriptions/PoshmarkDescription';
import { offerupOperations, offerupFields } from './descriptions/OfferupDescription';
import { thredupOperations, thredupFields } from './descriptions/ThredupDescription';
import { olxOperations, olxFields } from './descriptions/OlxDescription';
import { trendyolOperations, trendyolFields } from './descriptions/TrendyolDescription';
import { zillowOperations, zillowFields } from './descriptions/ZillowDescription';
import { bookingOperations, bookingFields } from './descriptions/BookingDescription';
import { tripadvisorOperations, tripadvisorFields } from './descriptions/TripadvisorDescription';
import { indeedOperations, indeedFields } from './descriptions/IndeedDescription';
import { airbnbOperations, airbnbFields } from './descriptions/AirbnbDescription';
import { vrboOperations, vrboFields } from './descriptions/VrboDescription';
import { expediaOperations, expediaFields } from './descriptions/ExpediaDescription';
import { glassdoorOperations, glassdoorFields } from './descriptions/GlassdoorDescription';
import { yelpOperations, yelpFields } from './descriptions/YelpDescription';
import { appStoreOperations, appStoreFields } from './descriptions/AppStoreDescription';
import { googlePlayOperations, googlePlayFields } from './descriptions/GooglePlayDescription';
import { secOperations, secFields } from './descriptions/SecDescription';
import { redfinOperations, redfinFields } from './descriptions/RedfinDescription';
import { realtorOperations, realtorFields } from './descriptions/RealtorDescription';
import { rightmoveOperations, rightmoveFields } from './descriptions/RightmoveDescription';
import { rentcomOperations, rentcomFields } from './descriptions/RentcomDescription';
import { truliaOperations, truliaFields } from './descriptions/TruliaDescription';
import { streeteasyOperations, streeteasyFields } from './descriptions/StreeteasyDescription';
import { rentcafeOperations, rentcafeFields } from './descriptions/RentcafeDescription';
import { movotoOperations, movotoFields } from './descriptions/MovotoDescription';
import { hotpadsOperations, hotpadsFields } from './descriptions/HotpadsDescription';
import { apartmentlistOperations, apartmentlistFields } from './descriptions/ApartmentlistDescription';
import { compassOperations, compassFields } from './descriptions/CompassDescription';
import { affordablehousingOperations, affordablehousingFields } from './descriptions/AffordablehousingDescription';
import { lennarOperations, lennarFields } from './descriptions/LennarDescription';
import { extraspaceOperations, extraspaceFields } from './descriptions/ExtraspaceDescription';
import { publicstorageOperations, publicstorageFields } from './descriptions/PublicstorageDescription';
import { uhaulOperations, uhaulFields } from './descriptions/UhaulDescription';
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
import { goodreadsOperations, goodreadsFields } from './descriptions/GoodreadsDescription';
import { neweggOperations, neweggFields } from './descriptions/NeweggDescription';
import { rakutenOperations, rakutenFields } from './descriptions/RakutenDescription';
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
			'Real-time structured data from Google, ChatGPT, Gemini, Amazon, Walmart, eBay, Target, Home Depot, Costco, HEB, Kroger, Publix, IKEA, Wayfair, Ashley Furniture, Maisons du Monde, Williams-Sonoma, Pottery Barn, West Elm, Decathlon, Spec\'s, Lowe\'s, Ace Hardware, Tractor Supply, Michaels, Nike, Staples, Sam\'s Club, BJ\'s Wholesale Club, Canadian Tire, SportChek, Mark\'s, RONA, Dollar General, Dollar Tree, Discount Tire, Vevor, Nellis Auction, EstateSales.net, Bring a Trailer, Sephora, Ulta Beauty, Dermstore, Bath & Body Works, Space NK, Lookfantastic, Cult Beauty, YesStyle, Notino, Douglas, Boots, ALDI, Micro Center, Walgreens, CVS, Whole Foods Market, Harbor Freight, AutoZone, O\'Reilly Auto Parts, RockAuto, Cars.com, Autotrader, CarGurus, CarMax, Carvana, TrueCar, Edmunds, Kelley Blue Book, Instacart, PC Express, PetSmart, Petco, iHerb, Chewy, Menards, Nordstrom, Nordstrom Rack, Best Buy, Newegg, TCGplayer, Nintendo eShop, H&M, Zara, Uniqlo, ASOS, Fashion Nova, Gap, Old Navy, Banana Republic, Athleta, Zappos, 6pm, Vinted, Mercari, Depop, Poshmark, OfferUp, thredUP, Macy\'s, Saks Fifth Avenue, Kohl\'s, JCPenney, Dick\'s Sporting Goods, Foot Locker, Fanatics, Academy Sports + Outdoors, REI, Argos, Media Expert, Action, HEMA, Carrefour, Allegro, bol.com, OLX, Trendyol, Mercado Libre, Rakuten, QVC, HSN, Barnes & Noble, ThriftBooks, Belk, Abercrombie & Fitch, Hollister, L.L.Bean, Sweetwater, Bed Bath & Beyond, KaBuM!, Magazine Luiza, Casas Bahia, Extra, Ponto, Buscape, Zoom, Drogasil, Droga Raia, Reclame Aqui, Leroy Merlin, Natura, O Boticario, Eudora, Centauro, YouTube, Reddit, TikTok, Instagram, X, LinkedIn, Facebook, Pinterest, Threads, Kuaishou, Douyin, Weibo, Twitch, GitHub, Etsy, AliExpress, Zillow, Redfin, Realtor.com, Rightmove, Rent.com, Trulia, StreetEasy, RentCafe, Movoto, HotPads, Apartment List, Compass, AffordableHousing.com, Lennar, Extra Space Storage, Public Storage, U-Haul, Booking.com, Airbnb, Vrbo, Expedia, Tripadvisor, Yelp, Indeed, Glassdoor, the App Store, Google Play, SEC EDGAR, Companies House, Legistar, company websites (contact and owner enrichment), G2, Capterra, Trustpilot, Goodreads, ad libraries, and any URL',
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
					{ name: 'Abercrombie & Fitch', value: 'abercrombie' },
					// Academy Sports + Outdoors, Argos, ASOS and CVS are retailers' brand names, not plural
					// nouns, and their values are frozen once saved in user workflows. The rule reports only
					// the first plural-looking option in this list, so the disable lives here.
					// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
					{ name: 'Academy Sports + Outdoors', value: 'academy' },
					{ name: 'Account', value: 'account' },
					{ name: 'Ace Hardware', value: 'acehardware' },
					{ name: 'Action', value: 'action' },
					{ name: 'Ads Intel (Cross-Platform)', value: 'adsIntel' },
					{ name: 'AffordableHousing.com', value: 'affordablehousing' },
					{ name: 'Airbnb', value: 'airbnb' },
					{ name: 'ALDI', value: 'aldi' },
					{ name: 'AliExpress', value: 'aliexpress' },
					{ name: 'Allegro', value: 'allegro' },
					{ name: 'Amazon', value: 'amazon' },
					{ name: 'Apartment List', value: 'apartmentlist' },
					{ name: 'Apple App Store', value: 'appStore' },
					{ name: 'Argos', value: 'argos' },
					{ name: 'Ashley Furniture', value: 'ashley' },
					{ name: 'ASOS', value: 'asos' },
					{ name: 'Autotrader', value: 'autotrader' },
					{ name: 'AutoZone', value: 'autozone' },
					{ name: 'Barnes & Noble', value: 'barnesandnoble' },
					{ name: 'Bath & Body Works', value: 'bathandbodyworks' },
					{ name: 'Bed Bath & Beyond', value: 'bedbathbeyond' },
					{ name: 'Belk', value: 'belk' },
					{ name: 'Best Buy', value: 'bestBuy' },
					{ name: "BJ's Wholesale Club", value: 'bjs' },
					{ name: 'bol.com', value: 'bolcom' },
					{ name: 'Booking.com', value: 'booking' },
					{ name: 'Boots', value: 'boots' },
					{ name: 'Bring a Trailer', value: 'bringatrailer' },
					{ name: 'Buscape + Zoom', value: 'buscape' },
					{ name: 'Canadian Tire', value: 'canadianTire' },
					{ name: 'Capterra (Software Reviews)', value: 'capterra' },
					{ name: 'CarGurus', value: 'cargurus' },
					{ name: 'CarMax', value: 'carmax' },
					{ name: 'Carrefour', value: 'carrefour' },
					{ name: 'Cars.com', value: 'carscom' },
					{ name: 'Carvana', value: 'carvana' },
					{ name: 'Casas Bahia', value: 'casasbahia' },
					{ name: 'Centauro', value: 'centauro' },
					{ name: 'ChatGPT', value: 'chatgpt' },
					{ name: 'Chewy', value: 'chewy' },
					{ name: 'Companies House (UK)', value: 'companiesHouse' },
					{ name: 'Company (Enrich)', value: 'company' },
					{ name: 'Compass', value: 'compass' },
					{ name: 'Costco', value: 'costco' },
					{ name: 'Cult Beauty', value: 'cultbeauty' },
					{ name: 'CVS', value: 'cvs' },
					{ name: 'Decathlon', value: 'decathlon' },
					{ name: 'Depop', value: 'depop' },
					{ name: 'Dermstore', value: 'dermstore' },
					{ name: "Dick's Sporting Goods", value: 'dicks' },
					{ name: 'Discount Tire', value: 'discounttire' },
					{ name: 'Dollar General', value: 'dollarGeneral' },
					{ name: 'Dollar Tree', value: 'dollartree' },
					{ name: 'Douglas', value: 'douglas' },
					{ name: 'Douyin (China)', value: 'douyin' },
					{ name: 'Drogasil + Droga Raia', value: 'rdsaude' },
					{ name: 'eBay', value: 'ebay' },
					{ name: 'Edmunds', value: 'edmunds' },
					{ name: 'EstateSales.net', value: 'estatesales' },
					{ name: 'Etsy', value: 'etsy' },
					{ name: 'Expedia', value: 'expedia' },
					{ name: 'Extra Space Storage', value: 'extraspace' },
					{ name: 'Extract (Any URL)', value: 'extract' },
					{ name: 'Facebook', value: 'facebook' },
					{ name: 'Fanatics', value: 'fanatics' },
					{ name: 'Fashion Nova', value: 'fashionnova' },
					{ name: 'Foot Locker', value: 'footlocker' },
					{ name: 'G2 (Software Reviews)', value: 'g2' },
					{ name: 'Gap Inc.', value: 'gap' },
					{ name: 'Gemini', value: 'gemini' },
					{ name: 'GitHub', value: 'github' },
					{ name: 'Glassdoor', value: 'glassdoor' },
					{ name: 'Goodreads', value: 'goodreads' },
					{ name: 'Google', value: 'google' },
					{ name: 'Google Ads Transparency', value: 'googleAds' },
					{ name: 'Google Play', value: 'googlePlay' },
					{ name: 'H&M', value: 'hm' },
					{ name: 'Harbor Freight', value: 'harborFreight' },
					{ name: 'HEB', value: 'heb' },
					{ name: 'HEMA', value: 'hema' },
					{ name: 'Home Depot', value: 'homeDepot' },
					{ name: 'HotPads', value: 'hotpads' },
					{ name: 'iHerb', value: 'iherb' },
					{ name: 'IKEA', value: 'ikea' },
					{ name: 'Indeed', value: 'indeed' },
					{ name: 'Instacart', value: 'instacart' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'JCPenney', value: 'jcpenney' },
					{ name: 'KaBuM!', value: 'kabum' },
					{ name: 'Kelley Blue Book', value: 'kbb' },
					{ name: "Kohl's", value: 'kohls' },
					{ name: 'Kroger', value: 'kroger' },
					{ name: 'Kuaishou (China)', value: 'kuaishou' },
					{ name: 'L.L.Bean', value: 'llbean' },
					{ name: 'Legistar (Municipal)', value: 'legistar' },
					{ name: 'Lennar', value: 'lennar' },
					{ name: 'Leroy Merlin', value: 'leroymerlin' },
					{ name: 'LinkedIn', value: 'linkedin' },
					// Lowe's is the retailer's brand name, not a plural noun, and `lowes` is
					// frozen once saved in user workflows.
					{ name: 'Lookfantastic', value: 'lookfantastic' },
					{ name: "Lowe's", value: 'lowes' },
					// Macy's is the retailer's brand name; `macys` is frozen once saved in user
					// workflows.
					{ name: "Macy's", value: 'macys' },
					{ name: 'Magazine Luiza (Magalu)', value: 'magalu' },
					// Maisons du Monde is the retailer's brand name; title case would misspell it.
					// eslint-disable-next-line n8n-nodes-base/node-param-display-name-miscased
					{ name: 'Maisons du Monde', value: 'maisonsDuMonde' },
					// Mark's is the retailer's brand name; `marks` is frozen once saved in user workflows.
					{ name: "Mark's", value: 'marks' },
					{ name: 'Media Expert', value: 'mediaexpert' },
					// Menards is the retailer's brand name, not a plural noun, and `menards` is
					// frozen once saved in user workflows.
					{ name: 'Menards', value: 'menards' },
					{ name: 'Mercado Libre', value: 'mercadoLibre' },
					{ name: 'Mercari', value: 'mercari' },
					{ name: 'Meta Ad Library', value: 'metaAds' },
					{ name: 'Michaels', value: 'michaels' },
					{ name: 'Micro Center', value: 'microCenter' },
					{ name: 'Movoto', value: 'movoto' },
					{ name: 'Natura', value: 'natura' },
					{ name: 'Nellis Auction', value: 'nellis' },
					{ name: 'Newegg', value: 'newegg' },
					{ name: 'Nike', value: 'nike' },
					{ name: 'Nintendo', value: 'nintendo' },
					{ name: 'Nordstrom', value: 'nordstrom' },
					{ name: 'Nordstrom Rack', value: 'nordstromRack' },
					{ name: 'Notino', value: 'notino' },
					{ name: 'O Boticario + Eudora', value: 'boticario' },
					{ name: "O'Reilly Auto Parts", value: 'oreilly' },
					{ name: 'OfferUp', value: 'offerup' },
					{ name: 'OLX', value: 'olx' },
					{ name: 'PC Express', value: 'pcexpress' },
					{ name: 'Petco', value: 'petco' },
					{ name: 'PetSmart', value: 'petsmart' },
					{ name: 'Pinterest', value: 'pinterest' },
					{ name: 'Poshmark', value: 'poshmark' },
					{ name: 'Public Storage', value: 'publicstorage' },
					{ name: 'Publix', value: 'publix' },
					{ name: 'QVC + HSN', value: 'qvc' },
					{ name: 'Rakuten', value: 'rakuten' },
					{ name: 'Realtor.com', value: 'realtor' },
					{ name: 'Reclame Aqui', value: 'reclameaqui' },
					{ name: 'Reddit', value: 'reddit' },
					{ name: 'Redfin', value: 'redfin' },
					{ name: 'REI', value: 'rei' },
					{ name: 'Rent.com', value: 'rentcom' },
					{ name: 'RentCafe', value: 'rentcafe' },
					{ name: 'Rightmove (UK)', value: 'rightmove' },
					{ name: 'RockAuto', value: 'rockauto' },
					{ name: 'RONA', value: 'rona' },
					{ name: 'Saks Fifth Avenue', value: 'saks' },
					{ name: "Sam's Club", value: 'samsClub' },
					{ name: 'SEC EDGAR', value: 'sec' },
					{ name: 'Sephora', value: 'sephora' },
					// Spec's is the retailer's brand name, not a plural noun, and `specs` is
					// frozen once saved in user workflows.
					{ name: 'Space NK', value: 'spacenk' },
					{ name: "Spec's", value: 'specs' },
					// SportChek is the retailer's brand name (one word, capital C).
					{ name: 'SportChek', value: 'sportchek' },
					// Staples is the retailer's brand name, not a plural noun.
					{ name: 'Staples', value: 'staples' },
					{ name: 'StreetEasy', value: 'streeteasy' },
					{ name: 'Sweetwater', value: 'sweetwater' },
					{ name: 'Target', value: 'target' },
					{ name: 'TCGplayer', value: 'tcgplayer' },
					// Threads is Meta's brand name, not a plural noun. Singularizing it to
					// "Thread" would misname the product, and the `threads` value is frozen
					// because it is saved inside user workflows.
					{ name: 'Threads', value: 'threads' },
					{ name: 'thredUP', value: 'thredup' },
					{ name: 'ThriftBooks', value: 'thriftbooks' },
					{ name: 'TikTok', value: 'tiktok' },
					{ name: 'TikTok Shop', value: 'tiktokShop' },
					{ name: 'Tractor Supply', value: 'tractorsupply' },
					{ name: 'Trendyol', value: 'trendyol' },
					{ name: 'Tripadvisor', value: 'tripadvisor' },
					{ name: 'TrueCar', value: 'truecar' },
					{ name: 'Trulia', value: 'trulia' },
					{ name: 'Trustpilot', value: 'trustpilot' },
					{ name: 'Twitch', value: 'twitch' },
					{ name: 'U-Haul', value: 'uhaul' },
					{ name: 'Ulta Beauty', value: 'ulta' },
					{ name: 'Uniqlo', value: 'uniqlo' },
					{ name: 'Vevor', value: 'vevor' },
					{ name: 'Vinted', value: 'vinted' },
					{ name: 'Vrbo', value: 'vrbo' },
					{ name: 'Walgreens', value: 'walgreens' },
					{ name: 'Walmart', value: 'walmart' },
					{ name: 'Wayfair', value: 'wayfair' },
					{ name: 'Weibo (China)', value: 'weibo' },
					// Whole Foods is the retailer's brand name, not a plural noun, and
					// `wholeFoods` is frozen once saved in user workflows.
					{ name: 'Whole Foods Market', value: 'wholeFoods' },
					{ name: 'Williams-Sonoma', value: 'williamssonoma' },
					{ name: 'X', value: 'x' },
					{ name: 'Yelp', value: 'yelp' },
					{ name: 'YesStyle', value: 'yesstyle' },
					{ name: 'YouTube', value: 'youtube' },
					{ name: 'Zappos', value: 'zappos' },
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
			...williamssonomaOperations,
			...williamssonomaFields,
			...bedbathbeyondOperations,
			...bedbathbeyondFields,
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
			...michaelsOperations,
			...michaelsFields,
			...nikeOperations,
			...nikeFields,
			...staplesOperations,
			...staplesFields,
			...samsClubOperations,
			...samsClubFields,
			...bjsOperations,
			...bjsFields,
			...canadianTireOperations,
			...canadianTireFields,
			...sportchekOperations,
			...sportchekFields,
			...marksOperations,
			...marksFields,
			...ronaOperations,
			...ronaFields,
			...dollarGeneralOperations,
			...dollarGeneralFields,
			...dollartreeOperations,
			...dollartreeFields,
			...discounttireOperations,
			...discounttireFields,
			...vevorOperations,
			...vevorFields,
			...nellisOperations,
			...nellisFields,
			...estatesalesOperations,
			...estatesalesFields,
			...bringatrailerOperations,
			...bringatrailerFields,
			...sephoraOperations,
			...sephoraFields,
			...ultaOperations,
			...ultaFields,
			...dermstoreOperations,
			...dermstoreFields,
			...bathandbodyworksOperations,
			...bathandbodyworksFields,
			...spacenkOperations,
			...spacenkFields,
			...lookfantasticOperations,
			...lookfantasticFields,
			...cultbeautyOperations,
			...cultbeautyFields,
			...yesstyleOperations,
			...yesstyleFields,
			...notinoOperations,
			...notinoFields,
			...douglasOperations,
			...douglasFields,
			...bootsOperations,
			...bootsFields,
			...aldiOperations,
			...aldiFields,
			...instacartOperations,
			...instacartFields,
			...pcexpressOperations,
			...pcexpressFields,
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
			...rockautoOperations,
			...rockautoFields,
			...carscomOperations,
			...carscomFields,
			...autotraderOperations,
			...autotraderFields,
			...cargurusOperations,
			...cargurusFields,
			...carmaxOperations,
			...carmaxFields,
			...carvanaOperations,
			...carvanaFields,
			...truecarOperations,
			...truecarFields,
			...edmundsOperations,
			...edmundsFields,
			...kbbOperations,
			...kbbFields,
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
			...neweggOperations,
			...neweggFields,
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
			...gapOperations,
			...gapFields,
			...zapposOperations,
			...zapposFields,
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
			...academyOperations,
			...academyFields,
			...reiOperations,
			...reiFields,
			...qvcOperations,
			...qvcFields,
			...barnesandnobleOperations,
			...barnesandnobleFields,
			...thriftbooksOperations,
			...thriftbooksFields,
			...belkOperations,
			...belkFields,
			...abercrombieOperations,
			...abercrombieFields,
			...llbeanOperations,
			...llbeanFields,
			...sweetwaterOperations,
			...sweetwaterFields,
			...kabumOperations,
			...kabumFields,
			...magaluOperations,
			...magaluFields,
			...casasbahiaOperations,
			...casasbahiaFields,
			...buscapeOperations,
			...buscapeFields,
			...rdsaudeOperations,
			...rdsaudeFields,
			...reclameaquiOperations,
			...reclameaquiFields,
			...leroymerlinOperations,
			...leroymerlinFields,
			...naturaOperations,
			...naturaFields,
			...boticarioOperations,
			...boticarioFields,
			...centauroOperations,
			...centauroFields,
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
			...offerupOperations,
			...offerupFields,
			...thredupOperations,
			...thredupFields,
			...olxOperations,
			...olxFields,
			...trendyolOperations,
			...trendyolFields,
			...mercadoLibreOperations,
			...mercadoLibreFields,
			...rakutenOperations,
			...rakutenFields,
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
			...rentcomOperations,
			...rentcomFields,
			...truliaOperations,
			...truliaFields,
			...streeteasyOperations,
			...streeteasyFields,
			...rentcafeOperations,
			...rentcafeFields,
			...movotoOperations,
			...movotoFields,
			...hotpadsOperations,
			...hotpadsFields,
			...apartmentlistOperations,
			...apartmentlistFields,
			...compassOperations,
			...compassFields,
			...affordablehousingOperations,
			...affordablehousingFields,
			...lennarOperations,
			...lennarFields,
			...extraspaceOperations,
			...extraspaceFields,
			...publicstorageOperations,
			...publicstorageFields,
			...uhaulOperations,
			...uhaulFields,
			...bookingOperations,
			...bookingFields,
			...airbnbOperations,
			...airbnbFields,
			...vrboOperations,
			...vrboFields,
			...expediaOperations,
			...expediaFields,
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
			...goodreadsOperations,
			...goodreadsFields,
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
