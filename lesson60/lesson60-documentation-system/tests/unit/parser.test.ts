import { CodeParser } from '../../src/parsers/codeParser';

describe('CodeParser', () => {
  const parser = new CodeParser();

  test('should parse component annotations', () => {
    const source = `
      /**
       * @component TestComponent
       * @purpose Testing parser
       * @dependencies Redis, PostgreSQL
       */
    `;

    const doc = parser.parseComponentAnnotations(source, 'test.tsx');
    
    expect(doc).not.toBeNull();
    expect(doc?.name).toBe('TestComponent');
    expect(doc?.purpose).toBe('Testing parser');
    expect(doc?.dependencies).toContain('Redis');
  });

  test('should return null for non-annotated code', () => {
    const source = 'const x = 5;';
    const doc = parser.parseComponentAnnotations(source, 'test.tsx');
    
    expect(doc).toBeNull();
  });
});
