import { Router } from 'express';
import { AssessmentEngine } from '../assessment-engine';
import { ScoringSystem } from '../scoring-system';

const router = Router();
const assessmentEngine = new AssessmentEngine();
const scoringSystem = new ScoringSystem();

let lastAssessment: any = null;

router.post('/run', async (req, res) => {
  try {
    console.log('Assessment triggered via API');
    const result = await assessmentEngine.runAssessment();
    lastAssessment = result;
    
    res.json({
      success: true,
      assessment: result
    });
  } catch (error) {
    console.error('Assessment failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/latest', (req, res) => {
  if (lastAssessment) {
    res.json({
      success: true,
      assessment: lastAssessment
    });
  } else {
    res.json({
      success: false,
      message: 'No assessment available'
    });
  }
});

router.get('/report', (req, res) => {
  if (lastAssessment) {
    const report = scoringSystem.generateReport(lastAssessment);
    res.type('text/plain').send(report);
  } else {
    res.status(404).send('No assessment available');
  }
});

export default router;
