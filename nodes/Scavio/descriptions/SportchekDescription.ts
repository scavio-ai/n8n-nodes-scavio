import type { INodeProperties } from 'n8n-workflow';
import { ctcBannerDescription } from './CtcBannerDescription';

// SportChek: 8 operations, 1 credit each, English only, CAD. Shapes: CtcBannerDescription.ts.
const sportchek = ctcBannerDescription({
	id: 'sportchek',
	name: 'SportChek',
	first:
		"SportChek (sportchek.ca, Canada's sporting goods retailer, a Canadian Tire Corporation banner)",
	french: false,
	feedback: 'reviews',
	notAvailable:
		'Not available: choosing a store for price or stock, stores near a postal code, customer questions, the flyer, Triangle Rewards or CT Money prices, price history (poll and store the answers), UPC or barcodes (the site shows none), a French storefront, cart or checkout.',
	exampleQuery: 'winter jacket',
	exampleCode: '84166659F',
	exampleList: '/en/sale-clearance/clearance.html',
	exampleStore: '272',
	exampleSuggest: 'bauer',
	exampleBrand: 'BAUER',
	capturedSearch:
		"Captured 2026-11-25: winter jacket listed 664 products; the first, a Ripzone Men's Berkley Quilted Parka Jacket, at 124.97 CAD with a was price of 249.99.",
	capturedProduct:
		'Captured 2026-11-25: the Columbia Women\'s Amaze Puff Down Jacket (84166659F) at 206.24 CAD with the promotion "25% Off* - Discount Applied. See details." and sale_ends December 1, 2026; assigned store 237 (Cornwall, ON).',
});

export const sportchekOperations: INodeProperties[] = sportchek.operations;
export const sportchekFields: INodeProperties[] = sportchek.fields;
