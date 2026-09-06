const { getUserProfile, upsertUserProfile } = require("./userProfileRepo");
const { createOwnOrganization, toUserProfilePatch } = require("../../shared/identity/ownOrganization.cjs");

function getOwnOrganization() {
  return createOwnOrganization(getUserProfile() || {});
}

function upsertOwnOrganization(input = {}) {
  return createOwnOrganization(upsertUserProfile(toUserProfilePatch(input)) || {});
}

module.exports = Object.freeze({ getOwnOrganization, upsertOwnOrganization });
