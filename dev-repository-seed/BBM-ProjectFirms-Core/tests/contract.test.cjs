'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/index.cjs');

test('new source contract preserves original firm identity and independent private people',()=>{
  assert.equal(core.CORE_ID,'@bbm/project-firms-core');
  assert.deepEqual(core.PARTY_KINDS,['global_firm','project_firm','private_person']);
  assert.ok(core.DEFAULT_ROLE_CODES.includes('bauherr'));
});

test('refuses to run before trusted CoreHost ports and canonical schema are ready',()=>{
  assert.throws(()=>core.createProjectFirmsCoreV2({}),/COREHOST_VERIFIED_ADAPTER_REQUIRED/);
  const adapter={
    getDb(){},getProject(){},requireVerifiedPeer(){},
    requireEntitlement(){},requireProjectAccess(){}
  };
  assert.throws(()=>core.createProjectFirmsCoreV2(adapter),/CORE_V2_IMPLEMENTATION_NOT_APPROVED/);
});
