/**
 * Scan an entire portfolio for contradictions and exposure.
 *
 * Uses score.exposure for portfolio-level capital risk,
 * then drills into individual projects for compliance detail.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
});

const PROJECT_IDS = [
  'prj_bronx_dev_center',
  'prj_queens_mixed_use',
  'prj_manhattan_reno',
];

async function main() {
  // Portfolio-level exposure
  const exposure = await client.score.exposure({});
  console.log('Portfolio Exposure');
  console.log('  Capital at risk: $' + (exposure.data.capital_at_risk || 0).toLocaleString());
  console.log('  Projects governed:', exposure.data.projects_governed);
  console.log('  Overall posture:', exposure.data.posture);

  console.log('\nPer-Project Compliance');
  console.log('─'.repeat(60));

  // Scan each project
  for (const project_id of PROJECT_IDS) {
    const compliance = await client.score.compliance({ project_id });
    const gates = await client.compliance.gates({ project_id });

    const blocked = Object.entries(compliance.data.rails || {})
      .filter(([, status]) => status === 'BLOCKED')
      .map(([rail]) => rail);

    console.log(`\n  ${project_id}`);
    console.log(`    Score: ${compliance.data.score}/100 (${compliance.data.grade})`);
    console.log(`    Blocked rails: ${blocked.length > 0 ? blocked.join(', ') : 'none'}`);
    console.log(`    Active gates: ${gates.data.active_gates || 0}`);

    if (blocked.length > 0) {
      console.log(`    ⚠ Action required: clear ${blocked.join(', ')} before next draw`);
    }
  }

  // Recent kernel events across portfolio
  console.log('\n\nRecent Kernel Events');
  console.log('─'.repeat(60));

  for (const project_id of PROJECT_IDS) {
    const events = await client.events.recent({
      entity_id: project_id,
      limit: 3,
    });

    for (const evt of (events.data.events || [])) {
      console.log(`  ${evt.timestamp}  ${evt.type}  ${project_id}`);
    }
  }
}

main().catch(console.error);
