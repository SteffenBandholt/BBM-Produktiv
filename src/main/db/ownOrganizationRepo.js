const { getUserProfile, upsertUserProfile } = require("./userProfileRepo");
const { createOwnOrganization, toUserProfilePatch } = require("../../shared/identity/ownOrganization.cjs");

function getOwnOrganization({ dbConn = null } = {}) {
  const source = dbConn
    ? dbConn.prepare("SELECT * FROM user_profile WHERE id = 1").get()
    : getUserProfile();
  return createOwnOrganization(source || {});
}

function upsertOwnOrganization(input = {}) {
  return createOwnOrganization(upsertUserProfile(toUserProfilePatch(input)) || {});
}

module.exports = Object.freeze({ getOwnOrganization, upsertOwnOrganization });
