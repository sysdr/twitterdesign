import { DatabaseService } from '../src/services/database.service';
import { DeltaSyncService } from '../src/services/delta-sync.service';

describe('DeltaSyncService', () => {
  let db: DatabaseService;
  let deltaSync: DeltaSyncService;
  
  beforeEach(() => {
    db = new DatabaseService(':memory:');
    deltaSync = new DeltaSyncService(db);
  });
  
  afterEach(() => {
    db.close();
  });
  
  test('should return empty delta for initial sync', async () => {
    const delta = await deltaSync.getTimelineDelta(Date.now() + 1000);
    
    expect(delta.added).toHaveLength(0);
    expect(delta.modified).toHaveLength(0);
    expect(delta.deleted).toHaveLength(0);
  });
  
  test('should return added tweets since last sync', async () => {
    const initialTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    
    db.createTweet({
      content: 'New tweet',
      authorId: 'user1',
      authorName: 'Test User',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0
    });
    
    const delta = await deltaSync.getTimelineDelta(initialTime);
    
    expect(delta.added.length).toBeGreaterThan(0);
    expect(delta.added[0].content).toBe('New tweet');
  });
  
  test('should calculate data savings correctly', async () => {
    const fullResponse = { tweets: Array(50).fill({ id: '1', content: 'test' }) };
    const deltaResponse = { added: [{ id: '1', content: 'test' }], modified: [], deleted: [], syncTime: Date.now(), hasMore: false };
    
    const savings = deltaSync.calculateDataSavings(fullResponse, deltaResponse);
    
    expect(savings).toBeGreaterThan(50);
  });
});
