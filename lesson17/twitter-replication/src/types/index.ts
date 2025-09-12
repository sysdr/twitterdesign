export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Tweet {
  id: number;
  user_id: number;
  username?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseStats {
  master: {
    status: 'healthy' | 'degraded' | 'down';
    connections: number;
    lag: number;
  };
  slaves: Array<{
    id: string;
    status: 'healthy' | 'lagging' | 'down';
    connections: number;
    replication_lag: number;
    last_sync: string;
  }>;
}

export interface ReplicationConfig {
  master: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  slaves: Array<{
    id: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    weight: number;
  }>;
}
