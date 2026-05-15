const assert = require("node:assert/strict");
const path = require("node:path");
const { importEsmFromFile } = require("./_esmLoader.cjs");

async function runPrintUserDataResolverTests(run) {
  const { resolvePrintUserData } = await importEsmFromFile(
    path.join(__dirname, "../../src/shared/print/userDataResolver.mjs")
  );

  await run("Print-Resolver: Profilwerte schlagen Legacy app_settings", () => {
    const resolved = resolvePrintUserData({
      settings: {
        user_name: "Legacy Nutzer",
        user_company: "Legacy Firma",
        user_name1: "Legacy Zeile 1",
        user_name2: "Legacy Zeile 2",
        user_street: "Legacy Strasse 9",
        user_zip: "99999",
        user_city: "Legacystadt",
        "pdf.footerUseUserData": "true",
      },
      userProfile: {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      },
    });

    assert.deepEqual(
      {
        name1: resolved.settings.user_name1,
        name2: resolved.settings.user_name2,
        street: resolved.settings.user_street,
        zip: resolved.settings.user_zip,
        city: resolved.settings.user_city,
      },
      {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      }
    );
    assert.deepEqual(
      {
        name1: resolved.settings["pdf.footerName1"],
        name2: resolved.settings["pdf.footerName2"],
        street: resolved.settings["pdf.footerStreet"],
        zip: resolved.settings["pdf.footerZip"],
        city: resolved.settings["pdf.footerCity"],
      },
      {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      }
    );
    assert.equal(resolved.header.userName, "Legacy Nutzer");
    assert.equal(resolved.header.userCompany, "Legacy Firma");
    assert.equal(resolved.footer.baseSource, "profile");
    assert.equal(resolved.footer.useUserData, true);
  });

  await run("Print-Resolver: Legacy app_settings greift, wenn Profil leer ist", () => {
    const resolved = resolvePrintUserData({
      settings: {
        user_name1: "Legacy Name 1",
        user_name2: "Legacy Name 2",
        user_street: "Legacy Strasse 1",
        user_zip: "54321",
        user_city: "Legacyort",
        "pdf.footerUseUserData": "true",
      },
      userProfile: {
        name1: " ",
        name2: "",
        street: " ",
        zip: "",
        city: " ",
      },
    });

    assert.equal(resolved.footer.baseSource, "legacy");
    assert.deepEqual(
      {
        name1: resolved.settings.user_name1,
        name2: resolved.settings.user_name2,
        street: resolved.settings.user_street,
        zip: resolved.settings.user_zip,
        city: resolved.settings.user_city,
      },
      {
        name1: "Legacy Name 1",
        name2: "Legacy Name 2",
        street: "Legacy Strasse 1",
        zip: "54321",
        city: "Legacyort",
      }
    );
    assert.deepEqual(
      {
        name1: resolved.settings["pdf.footerName1"],
        name2: resolved.settings["pdf.footerName2"],
        street: resolved.settings["pdf.footerStreet"],
        zip: resolved.settings["pdf.footerZip"],
        city: resolved.settings["pdf.footerCity"],
      },
      {
        name1: "Legacy Name 1",
        name2: "Legacy Name 2",
        street: "Legacy Strasse 1",
        zip: "54321",
        city: "Legacyort",
      }
    );
  });

  await run("Print-Resolver: manuelle Footer-Felder haben Vorrang vor Profil-Footer", () => {
    const resolved = resolvePrintUserData({
      settings: {
        "pdf.footerUseUserData": "true",
        "pdf.footerName1": "Manuell 1",
        "pdf.footerName2": "",
        "pdf.footerStreet": "Manuell Strasse 9",
        "pdf.footerZip": "33333",
        "pdf.footerCity": "",
        "pdf.footerRecorder": "Protokollant",
      },
      userProfile: {
        name1: "Profil Name 1",
        name2: "Profil Name 2",
        street: "Profilstrasse 3",
        zip: "22222",
        city: "Profilstadt",
      },
    });

    assert.equal(resolved.footer.hasManualFields, true);
    assert.equal(resolved.footer.useUserData, true);
    assert.deepEqual(
      {
        name1: resolved.settings["pdf.footerName1"],
        name2: resolved.settings["pdf.footerName2"],
        street: resolved.settings["pdf.footerStreet"],
        zip: resolved.settings["pdf.footerZip"],
        city: resolved.settings["pdf.footerCity"],
        recorder: resolved.settings["pdf.footerRecorder"],
      },
      {
        name1: "Manuell 1",
        name2: "Profil Name 2",
        street: "Manuell Strasse 9",
        zip: "33333",
        city: "Profilstadt",
        recorder: "Protokollant",
      }
    );
  });

  await run("Print-Resolver: leere Footer-Felder zaehlen nicht als manuelle Werte", () => {
    const resolved = resolvePrintUserData({
      settings: {
        "pdf.footerUseUserData": "true",
        "pdf.footerName1": "   ",
        "pdf.footerName2": "",
        "pdf.footerStreet": " ",
        "pdf.footerZip": "",
        "pdf.footerCity": " ",
      },
      userProfile: {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      },
    });

    assert.equal(resolved.footer.hasManualFields, false);
    assert.equal(resolved.footer.baseSource, "profile");
    assert.deepEqual(
      {
        name1: resolved.settings["pdf.footerName1"],
        name2: resolved.settings["pdf.footerName2"],
        street: resolved.settings["pdf.footerStreet"],
        zip: resolved.settings["pdf.footerZip"],
        city: resolved.settings["pdf.footerCity"],
      },
      {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      }
    );
  });

  await run("Print-Resolver: pdf.footerUseUserData fuehrt nachvollziehbar zu Profil-/Adressdaten im Footer", () => {
    const resolved = resolvePrintUserData({
      settings: {
        "pdf.footerUseUserData": "true",
      },
      userProfile: {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      },
    });

    assert.equal(resolved.footer.useUserData, true);
    assert.equal(resolved.settings["pdf.footerUseUserData"], "true");
    assert.deepEqual(
      {
        name1: resolved.settings["pdf.footerName1"],
        name2: resolved.settings["pdf.footerName2"],
        street: resolved.settings["pdf.footerStreet"],
        zip: resolved.settings["pdf.footerZip"],
        city: resolved.settings["pdf.footerCity"],
      },
      {
        name1: "Profil Zeile 1",
        name2: "Profil Zeile 2",
        street: "Profilstrasse 7",
        zip: "12345",
        city: "Profilstadt",
      }
    );
  });
}

module.exports = { runPrintUserDataResolverTests };
