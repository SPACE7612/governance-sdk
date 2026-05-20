/**
 * Minimal integration — 10 lines to govern a draw.
 *
 * This is all a lender needs to verify a project
 * before releasing capital.
 */

const BuildPaid = require('../src/index');
const bp = new BuildPaid({ apiKey: process.env.BUILDPAID_API_KEY });

async function shouldRelease(projectId) {
  const { data } = await bp.score.fundability({ contract_id: projectId });
  if (data.verdict !== 'FUNDABLE') return { release: false, reason: data.pral_decision };
  const { data: proof } = await bp.provenance.verify({ hash: data.provenance_hash });
  if (proof.status !== 'AUTHENTIC') return { release: false, reason: 'PROVENANCE_TAMPERED' };
  return { release: true, score: data.score, verdict: data.verdict };
}

shouldRelease('prj_bronx_dev_center').then(console.log).catch(console.error);
// → { release: true, score: 91, verdict: 'FUNDABLE' }
