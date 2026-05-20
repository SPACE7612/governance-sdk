/**
 * Governance-gated payment execution.
 *
 * A payment instruction is a compilation artifact. It either exists
 * fully governed or does not exist. There is no partial payment,
 * no override, no manual release.
 *
 * Flow: compile verdict → verdict produces payment instruction →
 * payment instruction is EXECUTABLE or GATED → if gated, the gate
 * conditions must clear before the instruction becomes executable.
 *
 * This replaces manual draw approval workflows entirely.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
  sdkSecret: process.env.BUILDPAID_SDK_SECRET,
});

async function executeGovernedPayment(projectId) {
  console.log(`Governance-Gated Payment: ${projectId}\n`);

  // Step 1: Compile a verdict
  const { data: verdict } = await client.governance.compile({
    project_id: projectId,
    profile: 'CONSTRUCTION',
  });

  console.log('1. Verdict Compilation');
  console.log(`   Result:    ${verdict.verdict}`);
  console.log(`   Score:     ${verdict.score}/100`);
  console.log(`   Engines:   ${verdict.engines_invoked}`);
  console.log(`   Findings:  ${verdict.findings.length}`);

  if (verdict.verdict === 'BLOCKED') {
    const blocks = verdict.findings.filter(f => f.severity === 'BLOCK');
    console.log('\n   ✗ BLOCKED — payment instruction not compiled');
    blocks.forEach(b => {
      console.log(`     → ${b.engine}: ${b.description}`);
    });
    return;
  }

  // Step 2: Extract payment instruction from verdict
  const { data: payment } = await client.governance.payment({
    verdict_id: verdict.verdict_id,
  });

  console.log('\n2. Payment Instruction');
  console.log(`   ID:        ${payment.instruction_id}`);
  console.log(`   Amount:    $${payment.amount.toLocaleString()}`);
  console.log(`   Rail:      ${payment.rail}`);
  console.log(`   Status:    ${payment.status}`);
  console.log(`   Retainage: $${payment.retainage_held.toLocaleString()} held`);

  if (payment.lien_waiver_required) {
    console.log('   Lien waiver: REQUIRED before execution');
  }

  if (payment.status === 'GATED') {
    console.log('\n   ⚠ GATED — conditions must clear:');
    payment.gate_conditions.forEach(c => console.log(`     → ${c}`));
    return;
  }

  if (payment.status === 'EXECUTABLE') {
    // Step 3: Verify provenance before execution
    const { data: proof } = await client.provenance.verify({
      hash: payment.provenance.sha256,
    });

    console.log('\n3. Provenance Verification');
    console.log(`   Status:    ${proof.status}`);
    console.log(`   Depth:     ${proof.chain_depth} events`);

    if (proof.status !== 'AUTHENTIC') {
      console.log('\n   ✗ PROVENANCE TAMPERED — do not execute');
      return;
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  PAYMENT INSTRUCTION: EXECUTABLE');
    console.log(`  Amount:  $${payment.amount.toLocaleString()}`);
    console.log(`  Rail:    ${payment.rail}`);
    console.log(`  Hash:    ${payment.provenance.sha256.slice(0, 24)}...`);
    console.log('  Status:  FULLY GOVERNED');
    console.log('═══════════════════════════════════════');
    console.log('\n  The instruction exists because the compiler');
    console.log('  produced it. No human approved this payment.');
    console.log('  The governance kernel approved it.');
  }
}

executeGovernedPayment('prj_bronx_dev_center').catch(console.error);
