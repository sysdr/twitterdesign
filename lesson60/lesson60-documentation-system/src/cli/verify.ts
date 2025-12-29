import { RunbookTester } from '../validators/runbookTester';
import { RunbookGenerator } from '../generators/runbookGenerator';

async function verifyDocumentation() {
  console.log('\n=== Documentation Verification ===\n');

  const runbookGen = new RunbookGenerator();
  
  // Generate sample runbooks
  const runbook1 = runbookGen.generateFromTemplate('High latency', 'API');
  const runbook2 = runbookGen.generateFromTemplate('Connection timeout', 'Database');
  const runbook3 = runbookGen.generateFromTemplate('Cache miss storm', 'Cache');
  
  runbookGen.addRunbook(runbook1);
  runbookGen.addRunbook(runbook2);
  runbookGen.addRunbook(runbook3);

  const tester = new RunbookTester();
  await tester.testAllRunbooks(runbookGen.getAllRunbooks());
}

verifyDocumentation().catch(console.error);
