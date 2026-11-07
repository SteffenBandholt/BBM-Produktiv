const {getCanonicalModuleIds, getCapabilityIds} = require("../moduleRegistry");
module.exports = require("../../../packages/entitlement-core/src/features.cjs").createFeatureModel({moduleIds:getCanonicalModuleIds(),capabilityIds:getCapabilityIds()});
