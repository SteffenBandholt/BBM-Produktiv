'use strict';

// Deliberately no operational database implementation in the seed.
// Source transfer from the original ProjectFirms Core and the tested V2
// candidate must be verified first. No auto-migration or security bypass.
const CORE_ID = '@bbm/project-firms-core';
const CORE_VERSION = '0.2.0-dev.0';
const PARTY_KINDS = Object.freeze(['global_firm', 'project_firm', 'private_person']);
const DEFAULT_ROLE_CODES = Object.freeze(['bauherr', 'bauleiter', 'ansprechpartner']);

function assertCoreHostAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object' ||
      typeof adapter.getDb !== 'function' ||
      typeof adapter.getProject !== 'function' ||
      typeof adapter.requireVerifiedPeer !== 'function' ||
      typeof adapter.requireEntitlement !== 'function' ||
      typeof adapter.requireProjectAccess !== 'function') {
    throw new Error('COREHOST_VERIFIED_ADAPTER_REQUIRED');
  }
  return adapter;
}

function createProjectFirmsCoreV2(options) {
  assertCoreHostAdapter(options);
  // Intentional strict stop: the versioned canonical DB schema, migration,
  // and tested CoreHost authorizer are not yet ported.
  throw new Error('CORE_V2_IMPLEMENTATION_NOT_APPROVED');
}

module.exports = {
  CORE_ID, CORE_VERSION, PARTY_KINDS, DEFAULT_ROLE_CODES,
  assertCoreHostAdapter, createProjectFirmsCoreV2
};
