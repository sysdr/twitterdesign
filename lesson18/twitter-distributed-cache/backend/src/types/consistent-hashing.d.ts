declare module 'consistent-hashing' {
  interface ConsistentHashing {
    addNode(node: string): void;
    removeNode(node: string): void;
    getNode(key: string): string;
    getNodePosition(key: string): number;
    getRingLength(): number;
  }
  
  interface ConsistentHashingConstructor {
    new (nodes?: string[], options?: { replicas?: number; algorithm?: string }): ConsistentHashing;
    (nodes?: string[], options?: { replicas?: number; algorithm?: string }): ConsistentHashing;
  }
  
  const ConsistentHashing: ConsistentHashingConstructor;
  export = ConsistentHashing;
}
