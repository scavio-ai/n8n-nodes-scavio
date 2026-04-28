import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ScavioApi implements ICredentialType {
	name = 'scavioApi';

	displayName = 'Scavio API';

	documentationUrl = 'https://scavio.dev/docs/quickstart';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your Scavio API key. Get one at https://dashboard.scavio.dev.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.scavio.dev',
			url: '/api/v1/usage',
			method: 'GET',
		},
	};
}
