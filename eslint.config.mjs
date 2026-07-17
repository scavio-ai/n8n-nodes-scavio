import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		files: ['package.json'],
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.community.rules,
		},
	},
	{
		files: ['credentials/**/*.ts'],
		languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.credentials.rules,
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
		},
	},
	{
		files: ['nodes/**/*.ts'],
		languageOptions: { parser: tsParser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
		plugins: { 'n8n-nodes-base': n8nNodesBase },
		rules: {
			...n8nNodesBase.configs.nodes.rules,
			// The legacy n8n-nodes-base ruleset wants inputs/outputs as the string
			// literal ['main']; the newer @n8n/community-nodes verification scanner
			// requires NodeConnectionTypes.Main. Follow the scanner and disable the
			// two conflicting legacy rules.
			'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
			'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
		},
	},
];
