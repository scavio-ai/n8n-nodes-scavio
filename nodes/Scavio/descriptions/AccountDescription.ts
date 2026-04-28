import type { INodeProperties } from 'n8n-workflow';

export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['account'] } },
		options: [
			{
				name: 'Get Usage',
				value: 'usage',
				action: 'Get account usage',
				description: 'Return current plan, credit balance, usage count, and auto-recharge settings',
				routing: { request: { method: 'GET', url: '/api/v1/usage' } },
			},
		],
		default: 'usage',
	},
];

export const accountFields: INodeProperties[] = [];
