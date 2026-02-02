import { OpenAPI } from './api';

// Configure the API client with the base URL from environment variables
OpenAPI.BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export * from './api';
