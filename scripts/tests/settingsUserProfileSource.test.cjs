const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runSettingsUserProfileSourceTests(run) {
  const { default: SettingsView } = await importEsmFromFile(
    path.join(__dirname, "../../src/renderer/views/SettingsView.js")
  );
  const view = new SettingsView({});

  await run("UserProfile: Profilwerte gewinnen gegen Legacy app_settings", () => {
    const savedProfile = view._normalizeUserProfileRecord({
      name1: "  Musterweg 1  ",
      name2: "  Wohnung 2 ",
      street: " Beispielstrasse 7 ",
      zip: " 12345 ",
      city: " Musterstadt ",
    });

    const loadedProfile = { ...savedProfile };
    const resolved = view._resolveUserSettingsState({
      data: {
        user_name: "Legacy Nutzer",
        user_company: "Legacy Firma",
        user_name1: "Alte Zeile 1",
        user_name2: "Alte Zeile 2",
        user_street: "Alte Strasse 9",
        user_zip: "99999",
        user_city: "Altstadt",
      },
      profile: loadedProfile,
    });

    assert.deepEqual(
      {
        name1: resolved.userName1,
        name2: resolved.userName2,
        street: resolved.userStreet,
        zip: resolved.userZip,
        city: resolved.userCity,
      },
      {
        name1: "Musterweg 1",
        name2: "Wohnung 2",
        street: "Beispielstrasse 7",
        zip: "12345",
        city: "Musterstadt",
      }
    );
    assert.equal(resolved.userName, "Legacy Nutzer");
    assert.equal(resolved.userCompany, "Legacy Firma");
    assert.equal(resolved.profileHasAny, true);
    assert.equal(resolved.profileFallbackUsed, false);
  });

  await run("UserProfile: leeres Profil faellt auf Legacy-Werte zurueck", () => {
    const savedProfile = view._normalizeUserProfileRecord({
      name1: "",
      name2: "",
      street: "",
      zip: "",
      city: "",
    });
    const loadedProfile = { ...savedProfile };
    const resolved = view._resolveUserSettingsState({
      data: {
        user_name: "Legacy Nutzer",
        user_company: "Legacy Firma",
        user_name1: "Alt Name 1",
        user_name2: "Alt Name 2",
        user_street: "Alt Strasse 1",
        user_zip: "54321",
        user_city: "Altstadt",
      },
      profile: loadedProfile,
    });

    assert.equal(resolved.profileHasAny, false);
    assert.equal(resolved.profileFallbackUsed, true);
    assert.deepEqual(
      {
        name1: resolved.userName1,
        name2: resolved.userName2,
        street: resolved.userStreet,
        zip: resolved.userZip,
        city: resolved.userCity,
      },
      {
        name1: "Alt Name 1",
        name2: "Alt Name 2",
        street: "Alt Strasse 1",
        zip: "54321",
        city: "Altstadt",
      }
    );
    assert.equal(resolved.userName, "Legacy Nutzer");
    assert.equal(resolved.userCompany, "Legacy Firma");
  });
}

module.exports = { runSettingsUserProfileSourceTests };
