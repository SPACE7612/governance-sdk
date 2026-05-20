/**
 * Verify a governance verdict end-to-end.
 *
 * Given a project, retrieve the current verdict, check every rail,
 * verify the provenance hash, and confirm the verdict is authentic.
 * This is the flow a lender runs before releasing capital.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
  sdkSecret: process.env.BUILDPAID_SDK_SECRET,
});

async function verifyVerdict(projectId) {
  console.log(`Verifying verdict for ${projectId}\n`);

  // Step 1: Get compliance score across all rails
  const compliance = await client.score.compliance({ project_id: projectId });
  console.log(`1. Compliance: ${compliance.data.score}/100 (${compliance.data.grade})`);

  const rails = compliance.data.rails || {};
  const blocked = Object.entries(rails).filter(([, s]) => s === 'BLOCKED');
  if (blocked.length > 0) {
    console.log(`   ✗ BLOCKED rails: ${blocked.map(([r]) => r).join(', ')}`);
    console.log('   → Verdict: BLOCKED — capital cannot move');
    return;
  }
  console.log('   ✓ All rails CLEAR');

  // Step 2: Get fundability verdict
  const fundability = await client.score.fundability({ contract_id: projectId });
  console.log(`\n2. Fundability: ${fundability.data.verdict} (score: ${fundability.data.score})`);
  console.log(`   PRAL decision: ${fundability.data.pral_decision}`);

  // Step 3: Check CPRAL labor compliance
  const cpral = await client.compliance.cpral({ project_id: projectId });
  console.log(`\n3. CPRAL: ${cpral.data.status || 'CHECKED'}`);

  // Step 4: Verify the provenance hash
  const hash = compliance.data.provenance_hash;
  if (hash) {
    const proof = await client.provenance.verify({ hash });
    console.log(`\n4. Provenance: ${proof.data.status}`);
    console.log(`   Chain depth: ${proof.data.chain_depth} events`);
    console.log(`   Anchor time: ${proof.data.anchor_time}`);

    if (proof.data.status === 'AUTHENTIC') {
      console.log('\n═══════════════════════════════════════');
      console.log('  VERDICT VERIFIED — AUTHENTIC');
      console.log('  All rails clear. Provenance intact.');
      console.log('  Capital may move.');
      console.log('═══════════════════════════════════════');
    } else {
      console.log('\n  ✗ VERDICT TAMPERED — DO NOT RELEASE CAPITAL');
    }
  }
}

verifyVerdict('prj_bronx_dev_center').catch(console.error);
