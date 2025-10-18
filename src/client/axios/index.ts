import axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';

const instanceCache = new Map<string, AxiosInstance>();

export function createAxiosInstance(baseURL: string, config?: CreateAxiosDefaults): AxiosInstance {
  if (instanceCache.has(baseURL)) {
    return instanceCache.get(baseURL)!;
  }

  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  instanceCache.set(baseURL, instance);

  return instance;
}