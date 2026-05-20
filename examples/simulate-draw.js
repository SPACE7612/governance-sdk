/**
 * Simulate a draw request before submission.
 *
 * Runs the full 17-engine governance compiler against a project
 * WITHOUT committing a kernel event. Shows what would happen
 * if a draw were submitted right now — which gates would block,
 * which rails would fire, what the verdict would be.
 *
 * This is the "what-if" button for construction lenders.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
});

async function simulateDraw(projectId, drawAmount) {
  console.log(`Simulating $${drawAmount.toLocaleString()} draw on ${projectId}\n`);

  // Step 1: Check current compliance state
  const compliance = await client.score.compliance({ project_id: projectId });
  console.log('Current State');
  console.log(`  Compliance: ${compliance.data.score}/100`);

  const rails = compliance.data.rails || {};
  Object.entries(rails).forEach(([rail, status]) => {
    const icon = status === 'CLEAR' ? '✓' : status === 'BLOCKED' ? '✗' : '○';
    console.log(`  ${icon} ${rail}: ${status}`);
  });

  // Step 2: Check gate activation
  const gates = await client.compliance.gates({ project_id: projectId });
  console.log(`\nActive Gates: ${gates.data.active_gates || 0}`);

  // Step 3: Get capital exposure
  const exposure = await client.score.exposure({ project_id: projectId });
  console.log(`\nExposure Before Draw`);
  console.log(`  Capital at risk: $${(exposure.data.capital_at_risk || 0).toLocaleString()}`);
  console.log(`  Portfolio posture: ${exposure.data.posture || 'UNKNOWN'}`);

  // Step 4: Get fundability verdict
  const fundability = await client.score.fundability({ contract_id: projectId });

  // Step 5: Get BPI score
  const bpi = await client.score.bpi({ project_id: projectId });

  // Simulation result
  console.log('\n═══════════════════════════════════════');
  console.log('  DRAW SIMULATION RESULT');
  console.log('═══════════════════════════════════════');
  console.log(`  Amount:     $${drawAmount.toLocaleString()}`);
  console.log(`  Verdict:    ${fundability.data.verdict}`);
  console.log(`  PRAL:       ${fundability.data.pral_decision}`);
  console.log(`  BPI Score:  ${bpi.data.score}/100 (${bpi.data.grade})`);
  console.log(`  Compliance: ${compliance.data.score}/100`);

  const blocked = Object.entries(rails).filter(([, s]) => s === 'BLOCKED');
  if (blocked.length > 0) {
    console.log(`\n  ⚠ BLOCKED — resolve before submitting:`);
    blocked.forEach(([rail]) => console.log(`    → ${rail}`));
  } else if (fundability.data.verdict === 'FUNDABLE') {
    console.log('\n  ✓ CLEAR TO SUBMIT — all gates open');
  }
  console.log('═══════════════════════════════════════');
}

simulateDraw('prj_bronx_dev_center', 84250).catch(console.error);
