import useSWR from 'swr'
import { fetcher } from './client'

export const SESSION_KEY = '/api/auth/me'

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR(SESSION_KEY, fetcher, { shouldRetryOnError: false })
  return { user: data?.user ?? null, error, isLoading, mutate }
}
