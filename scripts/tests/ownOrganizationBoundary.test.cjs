const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

async function runOwnOrganizationBoundaryTests(run) {
  const {
    OWN_ORGANIZATION_ID,
    createOwnOrganization,
    toUserProfilePatch,
  } = require(path.join(process.cwd(), "src/shared/identity/ownOrganization.cjs"));

  await run("Paket 7: OwnOrganization besitzt einen neutralen kanonischen Vertrag", () => {
    const organization = createOwnOrganization({
      name1: "BBM Betrieb",
      street: "Werkweg 2",
      zip: "54321",
      city: "Sitzstadt",
      email: "info@example.test",
      iban: "DE001",
    });
    assert.equal(organization.identityType, "own-organization");
    assert.equal(organization.id, OWN_ORGANIZATION_ID);
    assert.equal(organization.legalName, "BBM Betrieb");
    assert.deepEqual(organization.address, { street: "Werkweg 2", zip: "54321", city: "Sitzstadt", country: "" });
    assert.equal(organization.contact.email, "info@example.test");
    assert.equal(organization.bank.iban, "DE001");
    assert.equal(Object.isFrozen(organization), true);
  });

  await run("Paket 7: LicenseSubject wird nicht als OwnOrganization interpretiert", () => {
    const licenseSubject = Object.freeze({ customerName: "Lizenzkunde AG", licenseId: "LIC-7" });
    const organization = createOwnOrganization(licenseSubject);
    assert.equal(organization.legalName, "");
    assert.equal(Object.hasOwn(organization, "customerName"), false);
    assert.equal(Object.hasOwn(organization, "licenseId"), false);
    assert.notStrictEqual(organization, licenseSubject);
  });

  await run("Paket 7: bestehendes user_profile bleibt persistente Core-Quelle", () => {
    const patch = toUserProfilePatch({ legalName: "Eigene GmbH", address: { city: "Wedel" }, bank: { iban: "DE777" } });
    assert.equal(patch.name1, "Eigene GmbH");
    assert.equal(patch.city, "Wedel");
    assert.equal(patch.iban, "DE777");
    const repo = read("src/main/db/ownOrganizationRepo.js");
    assert.match(repo, /getUserProfile/);
    assert.match(repo, /upsertUserProfile/);
    assert.equal(repo.includes("invoice"), false);
  });

  await run("Paket 7: Core-IPC stellt OwnOrganization getrennt vom Lizenzstatus bereit", () => {
    const ipc = read("src/main/ipc/settingsIpc.js");
    const preload = read("src/main/preload.js");
    assert.match(ipc, /ownOrganization:get/);
    assert.match(ipc, /ownOrganization:upsert/);
    assert.match(preload, /ownOrganizationGet/);
    assert.match(preload, /ownOrganizationUpsert/);
    assert.equal(read("src/shared/identity/ownOrganization.cjs").includes("licensing"), false);
  });

  await run("Paket 7: Rechnungsspezifische Identitaeten und Snapshots bleiben ausserhalb", () => {
    const contract = read("src/shared/identity/ownOrganization.cjs");
    const repo = read("src/main/db/ownOrganizationRepo.js");
    for (const forbidden of ["InvoiceIssuerProfile", "issuer_snapshot", "recipient_snapshot", "invoiceRepository"]) {
      assert.equal(contract.includes(forbidden), false, forbidden);
      assert.equal(repo.includes(forbidden), false, forbidden);
    }
  });
}

module.exports = { runOwnOrganizationBoundaryTests };
