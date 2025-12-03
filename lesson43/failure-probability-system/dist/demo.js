"use strict";
// Demonstration script showcasing failure prediction capabilities
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
async function runDemo() {
    console.log('='.repeat(60));
    console.log('Failure Probability Analysis System - Live Demo');
    console.log('='.repeat(60));
    const system = new index_1.FailureProbabilitySystem();
    await system.start(3000);
    console.log('\n📊 Demo Scenario: Gradual System Degradation');
    console.log('   Watch as the system detects and predicts failures\n');
    console.log('Phase 1: Normal Operation (30 seconds)');
    console.log('   - Low load, system healthy');
    console.log('   - Building baseline metrics\n');
    await new Promise(resolve => setTimeout(resolve, 30000));
    console.log('Phase 2: Increasing Load (30 seconds)');
    console.log('   - Gradually increasing system stress');
    console.log('   - Monitoring failure probability increase\n');
    // Simulate gradual load increase
    for (let load = 20; load <= 80; load += 10) {
        await fetch('http://localhost:3000/api/simulate-load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ load })
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log('Phase 3: Critical Conditions (20 seconds)');
    console.log('   - High load sustained');
    console.log('   - System should trigger preventive actions\n');
    await new Promise(resolve => setTimeout(resolve, 20000));
    console.log('\n✓ Demo Complete!');
    console.log('  View detailed analytics at: http://localhost:3000');
    console.log('  Press Ctrl+C to stop\n');
}
runDemo().catch(console.error);
