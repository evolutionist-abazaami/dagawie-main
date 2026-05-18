#!/usr/bin/env node

/**
 * Dagawie Smoke Test Suite
 * 
 * This script validates that all deployed Supabase functions are working correctly.
 * Run AFTER deploying functions and setting secrets.
 * 
 * Usage:
 *   node smoke-test.mjs <SUPABASE_URL> <SUPABASE_ANON_KEY> <TEST_USER_TOKEN>
 */

import fetch from 'node-fetch';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node smoke-test.mjs <SUPABASE_URL> <SUPABASE_ANON_KEY> <TEST_USER_TOKEN>');
  console.error('');
  console.error('Get values from:');
  console.error('  SUPABASE_URL: Supabase Dashboard → Settings → API → URL');
  console.error('  SUPABASE_ANON_KEY: Supabase Dashboard → Settings → API → anon key');
  console.error('  TEST_USER_TOKEN: Log in via frontend, check browser localStorage → sb-xxx-auth-token');
  process.exit(1);
}

const [supabaseUrl, anonKey, userToken] = args;
const projectRef = supabaseUrl.split('.')[0].split('//')[1];

console.log('🧪 Dagawie Smoke Test Suite');
console.log(`📍 Project: ${projectRef}`);
console.log('---');

const tests = [];

async function test(name, fn) {
  tests.push({ name, fn });
}

test('✓ Ingest Weather', async () => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/ingest-weather`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data));
  console.log(`  → Ingested ${data.ingested} locations`);
});

test('✓ Evaluate Hazards', async () => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/evaluate-hazards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data));
  console.log(`  → Evaluated ${data.thresholds_evaluated} thresholds, created ${data.alerts_created} alerts`);
});

test('✓ Process Search (DagaSearch)', async () => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/process-search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'What environmental changes are happening in Ghana?',
      selectedLocation: { name: 'Ghana', lat: 6.5244, lng: -1.6244 },
    }),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data));
  console.log(`  → Got AI response (${Math.min(100, data.interpretation?.length || 0)} chars)`);
});

test('✓ Analyze Satellite (DagaWitness)', async () => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/analyze-satellite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      region: 'Ghana',
      startDate: '2024-01-01',
      endDate: '2024-06-01',
      eventType: ['deforestation'],
      lat: 6.5244,
      lng: -1.6244,
    }),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data));
  console.log(`  → Analysis complete (assessment: ${data.assessment?.substring(0, 50)}...)`);
});

test('✓ Generate Visualization', async () => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/generate-visualization`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      visualizationType: 'map',
      region: 'Ghana',
      eventType: 'deforestation',
      changePercent: 5.2,
      severity: 'moderate',
    }),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (!data.success && !data.imageUrl) throw new Error('No image generated');
  console.log(`  → Visualization generated (${data.cached ? 'cached' : 'fresh'})`);
});

test('✓ AI Assistant', async () => {
  const resp = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'What are the key environmental challenges in West Africa?',
    }),
  });
  if (!resp.ok) throw new Error(`Status ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  if (!data.success) throw new Error(JSON.stringify(data));
  console.log(`  → Got AI response`);
});

// Run all tests
(async () => {
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
      console.log(`${name} PASS`);
    } catch (error) {
      failed++;
      console.log(`${name} FAIL: ${error.message}`);
    }
  }

  console.log('---');
  console.log(`✅ ${passed}/${tests.length} tests passed`);
  if (failed > 0) {
    console.log(`❌ ${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log('🎉 All smoke tests passed! Project is ready for deployment.');
  }
})();
