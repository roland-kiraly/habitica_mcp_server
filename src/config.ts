import 'dotenv/config';

export interface HabiticaConfig {
  userId: string;
  apiToken: string;
  client: string;
  baseUrl?: string;
}

export function loadConfig(): HabiticaConfig {
  const userId = process.env.HABITICA_USER_ID;
  const apiToken = process.env.HABITICA_API_TOKEN;

  if (!userId || !apiToken) {
    throw new Error(
      'Missing Habitica credentials. Please set HABITICA_USER_ID and HABITICA_API_TOKEN environment variables.',
    );
  }

  return {
    userId,
    apiToken,
    client: process.env.HABITICA_CLIENT ?? 'habitica-mcp-server',
    baseUrl: process.env.HABITICA_API_BASE_URL,
  };
}

