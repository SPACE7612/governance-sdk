/**
 * Score a project's compliance posture across all governance rails.
 *
 * Returns a 0-100 score, letter grade, and per-rail clearance status.
 * Every call emits a kernel event and is provenance-anchored.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
  sdkSecret: process.env.BUILDPAID_SDK_SECRET,
});

async function main() {
  // Score compliance for a project
  const result = await client.score.compliance({
    project_id: 'prj_bronx_dev_center',
  });

  console.log('Compliance Score:', result.data.score);
  console.log('Grade:', result.data.grade);
  console.log('Rails:', result.data.rails);
  console.log('Kernel Event:', result.kernel_event);
  console.log('Provenance:', result.data.provenance_hash);

  // Check fundability
  const fundability = await client.score.fundability({
    contract_id: 'CTR-001',
  });

  console.log('\nFundability Verdict:', fundability.data.verdict);
  console.log('PRAL Decision:', fundability.data.pral_decision);

  // Get BPI score with 6 dimensions
  const bpi = await client.score.bpi({
    project_id: 'prj_bronx_dev_center',
  });

  console.log('\nBPI Score:', bpi.data.score);
  console.log('BPI Tier:', bpi.data.grade);
}

main().catch(console.error);
