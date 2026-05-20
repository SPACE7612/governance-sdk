/**
 * Governance profiles — switch compilation rules by industry.
 *
 * The same kernel compiles verdicts across construction, treasury,
 * insurance, government, and supply chain. The compilation logic
 * is invariant; the profile determines which engines fire and
 * what thresholds apply.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
});

async function main() {
  // Compare profiles across industries
  const industries = ['CONSTRUCTION', 'TREASURY', 'INSURANCE', 'GOVERNMENT', 'SUPPLY_CHAIN'];

  console.log('Governance Profiles');
  console.log('═'.repeat(60));

  for (const industry of industries) {
    const { data: profile } = await client.governance.profile({ industry });

    console.log(`\n  ${industry}`);
    console.log(`    Engines:    ${profile.engine_count}`);
    console.log(`    Rules:      ${profile.compilation_rules}`);
    console.log(`    Threshold:  ${profile.adequacy_threshold}/100`);
    console.log(`    Rails:      ${profile.payment_rails.join(', ')}`);
    console.log(`    Framework:  ${profile.regulatory_framework}`);
  }

  // Compile a verdict using a specific profile
  console.log('\n\nCompiling with CONSTRUCTION profile...');
  const { data: verdict } = await client.governance.compile({
    project_id: 'prj_bronx_dev_center',
    profile: 'CONSTRUCTION',
  });

  console.log(`  Verdict:    ${verdict.verdict}`);
  console.log(`  Score:      ${verdict.score}/100`);
  console.log(`  Engines:    ${verdict.engines_invoked}`);
  console.log(`  Findings:   ${verdict.findings.length}`);
  console.log(`  Evidence:   ${verdict.evidence.length} records`);
  console.log(`  Provenance: ${verdict.provenance.sha256.slice(0, 16)}...`);

  // Same project, different profile
  console.log('\nCompiling with GOVERNMENT profile...');
  const { data: govVerdict } = await client.governance.compile({
    project_id: 'prj_bronx_dev_center',
    profile: 'GOVERNMENT',
  });

  console.log(`  Verdict:    ${govVerdict.verdict}`);
  console.log(`  Score:      ${govVerdict.score}/100`);
  console.log(`  Engines:    ${govVerdict.engines_invoked}`);
  console.log('\n  Same kernel. Same data. Different governance lens.');
}

main().catch(console.error);
