// Fachlicher Settings-Vertrag des Main-Moduls Protokoll.
// Die persistierten Schluessel bleiben aus Bestandskompatibilitaet unveraendert.
const PROTOKOLL_GLOBAL_SETTING_KEYS = Object.freeze([
  "pdf.protocolTitle",
  "pdf.preRemarks",
  "pdf.trafficLightAllEnabled",
  "pdf.footerPlace",
  "pdf.footerDate",
  "pdf.footerName1",
  "pdf.footerName2",
  "pdf.footerRecorder",
  "pdf.footerStreet",
  "pdf.footerZip",
  "pdf.footerCity",
  "pdf.footerUseUserData",
  "pdf.protocolsDir",
  "print.preRemarks.enabled",
  "tops.ampelEnabled",
  "tops.level1Collapsed",
  "tops.showLongtextInList",
  "tops.fontscale.list",
  "tops.fontscale.editbox",
  "email_subject",
  "email_body",
  "firm_role_order",
  "firm_role_labels",
]);

const PROTOKOLL_PROJECT_SETTING_KEYS = Object.freeze([
  "pdf.protocolTitle",
  "pdf.footerPlace",
  "pdf.footerDate",
  "pdf.footerName1",
  "pdf.footerName2",
  "pdf.footerRecorder",
  "pdf.footerStreet",
  "pdf.footerZip",
  "pdf.footerCity",
]);

module.exports = Object.freeze({
  PROTOKOLL_GLOBAL_SETTING_KEYS,
  PROTOKOLL_PROJECT_SETTING_KEYS,
});
