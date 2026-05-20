/**
 * Verify a provenance hash against the governance chain.
 *
 * Any provenance hash produced by the BuildPaid kernel can be independently
 * verified. Returns AUTHENTIC or TAMPERED with chain depth and anchor time.
 */

const BuildPaid = require('../src/index');

const client = new BuildPaid({
  apiKey: process.env.BUILDPAID_API_KEY,
});

async function main() {
  // Verify a specific provenance hash
  const result = await client.provenance.verify({
    hash: 'd77400ae439a8b2c1f3e5d6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
  });

  if (result.data.status === 'AUTHENTIC') {
    console.log('✓ Hash verified — AUTHENTIC');
    console.log('  Chain depth:', result.data.chain_depth, 'events');
    console.log('  Anchored at:', result.data.anchor_time);
  } else {
    console.log('✗ Hash TAMPERED — provenance chain broken');
  }

  // Export a full audit bundle for a project
  const bundle = await client.provenance.export({
    project_id: 'prj_bronx_dev_center',
  });

  console.log('\nAudit bundle exported');
  console.log('Events in bundle:', bundle.data.event_count);
  console.log('Bundle hash:', bundle.data.bundle_hash);

  // Check chain integrity
  const chain = await client.provenance.chain({
    project_id: 'prj_bronx_dev_center',
  });

  console.log('\nChain integrity:', chain.data.status);
  console.log('Total depth:', chain.data.chain_depth);
}

main().catch(console.error);
