declare module 'react-query' {
  export interface QueryClientConfig {
    defaultOptions?: {
      queries?: {
        staleTime?: number;
        cacheTime?: number;
        retry?: number | boolean;
      };
    };
  }

  export class QueryClient {
    constructor(config?: QueryClientConfig);
    getQueryCache(): any;
    getMutationCache(): any;
    invalidateQueries(queryKey?: any): Promise<void>;
    clear(): void;
  }

  export interface QueryClientProviderProps {
    client: QueryClient;
    children: React.ReactNode;
  }

  export declare const QueryClientProvider: React.FC<QueryClientProviderProps>;

  export interface UseQueryOptions<TData = any, TError = any> {
    queryKey: any;
    queryFn: () => Promise<TData>;
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    retry?: number | boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
  }

  export interface UseQueryResult<TData = any, TError = any> {
    data: TData | undefined;
    error: TError | null;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    refetch: () => Promise<any>;
  }

  export declare function useQuery<TData = any, TError = any>(
    options: UseQueryOptions<TData, TError>
  ): UseQueryResult<TData, TError>;

  export declare function useQuery<TData = any, TError = any>(
    queryKey: any,
    queryFn: () => Promise<TData>,
    options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
  ): UseQueryResult<TData, TError>;
}




