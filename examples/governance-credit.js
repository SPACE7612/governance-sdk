/**
 * Governance credit scoring — rate any entity by governed behavior.
 *
 * Unlike traditional credit scores (payment history + debt ratio),
 * governance credit scores measure how an entity behaves under
 * deterministic governance: compliance history, documentation quality,
 * dispute frequency, provenance integrity, and temporal reliability.
 *
 * A subcontractor with perfect payment history but poor compliance
 * documentation scores lower than one with occasional late payments
 * but flawless governance records.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
});

async function main() {
  // Score a subcontractor
  const { data: sub } = await client.score.credit({
    entity_id: 'sub_rivera_electrical',
  });

  console.log('Governance Credit Score');
  console.log('═'.repeat(60));
  console.log(`  Entity:  ${sub.entity_id} (${sub.entity_type})`);
  console.log(`  Score:   ${sub.credit_score}/100`);
  console.log(`  Tier:    ${sub.tier}`);
  console.log(`  Trend:   ${sub.trend}`);
  console.log(`  Window:  ${sub.observation_window_days} days`);

  console.log('\n  Factors:');
  console.log(`    Compliance history:     ${sub.factors.compliance_history}/100`);
  console.log(`    Payment velocity:       ${sub.factors.payment_velocity}/100`);
  console.log(`    Documentation quality:  ${sub.factors.documentation_quality}/100`);
  console.log(`    Dispute frequency:      ${sub.factors.dispute_frequency}/100`);
  console.log(`    Provenance integrity:   ${sub.factors.provenance_integrity}/100`);
  console.log(`    Temporal reliability:   ${sub.factors.temporal_reliability}/100`);

  // Score a GC for comparison
  const { data: gc } = await client.score.credit({
    entity_id: 'gc_apex_construction',
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`  Entity:  ${gc.entity_id} (${gc.entity_type})`);
  console.log(`  Score:   ${gc.credit_score}/100`);
  console.log(`  Tier:    ${gc.tier}`);

  // Score a project
  const { data: proj } = await client.score.credit({
    entity_id: 'prj_bronx_dev_center',
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`  Entity:  ${proj.entity_id} (${proj.entity_type})`);
  console.log(`  Score:   ${proj.credit_score}/100`);
  console.log(`  Tier:    ${proj.tier}`);

  // Adequacy vector — 6-dimensional governance fitness
  console.log('\n\nAdequacy Vector');
  console.log('═'.repeat(60));

  const { data: adequacy } = await client.score.adequacy({
    entity_id: 'prj_bronx_dev_center',
  });

  console.log(`  Composite:      ${adequacy.composite_score}/100`);
  console.log(`  Sufficient:     ${adequacy.sufficient ? '✓ YES' : '✗ NO'}`);
  console.log(`  Threshold:      ${adequacy.threshold}/100`);
  console.log('\n  Dimensions:');
  console.log(`    Documentation: ${adequacy.dimensions.documentation}/100`);
  console.log(`    Compliance:    ${adequacy.dimensions.compliance}/100`);
  console.log(`    Financial:     ${adequacy.dimensions.financial}/100`);
  console.log(`    Temporal:      ${adequacy.dimensions.temporal}/100`);
  console.log(`    Labor:         ${adequacy.dimensions.labor}/100`);
  console.log(`    Provenance:    ${adequacy.dimensions.provenance}/100`);
}

main().catch(console.error);
