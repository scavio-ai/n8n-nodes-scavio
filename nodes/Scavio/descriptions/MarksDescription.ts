import type { INodeProperties } from 'n8n-workflow';
import { ctcBannerDescription } from './CtcBannerDescription';

// Mark's: 8 operations, 1 credit each, CAD; Language fr reads L'Equipeur on Search Products, Get
// List Page, Get Product, Get Brands and Get Categories. Shapes: CtcBannerDescription.ts.
const marks = ctcBannerDescription({
	id: 'marks',
	name: "Mark's",
	first:
		"Mark's (marks.com, the Canadian workwear, casual clothing and footwear retailer, a Canadian Tire Corporation banner; L'Equipeur in French)",
	french: true,
	feedback: 'questions',
	notAvailable:
		'Not available: choosing a store for price or stock, stores near a postal code, customer reviews, the flyer, Triangle Rewards or CT Money prices, price history (poll and store the answers), UPC or barcodes (the site shows none), cart or checkout.',
	exampleQuery: 'work boots',
	exampleCode: '75983776F',
	exampleList: '/en/cat/work-boots-shoes-DC3000008.html',
	exampleStore: '589',
	exampleSuggest: 'dakota',
	exampleBrand: 'Dakota Workpro Series',
	capturedSearch:
		"Captured 2026-11-25: work boots listed 1001 products; the first, Aggressor Men's Lynx II Steel Toe Steel Plate 6 Inch Leather Work Boots, at 69.99 CAD with a was price of 99.99 and sale_ends November 25, 2026.",
	capturedProduct:
		"Captured 2026-11-25: Dakota WorkPro Series 6114 work boots (75983776F) at 124.99 CAD with a was price of 199.99 and sale_ends November 25, 2026; the same code in French (L'Equipeur) at the same 124.99 CAD.",
});

export const marksOperations: INodeProperties[] = marks.operations;
export const marksFields: INodeProperties[] = marks.fields;
