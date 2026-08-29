import LicenseAdminScreenV2 from "./LicenseAdminScreenV2.js";

export default class LicenseAdminScreenV3 extends LicenseAdminScreenV2 {
  constructor(options = {}) {
    super(options);
    this.isDevelopment = false;
  }

  async _loadBaseData() {
    const keyStatus = await super._loadBaseData();
    try {
      const access = await this._api().licenseAdminAccessStatus();
      this.isDevelopment = access?.development === true;
    } catch (_error) {
      this.isDevelopment = false;
    }
    return keyStatus;
  }

  _renderProductOptions() {
    super._renderProductOptions();

    // Das Recht zur Lizenzvergabe darf nur aus der DEV-Version an die eigene
    // kaufmännische Vollversion vergeben werden. In einer installierten
    // Vollversion ist diese Option bewusst nie sichtbar und damit nicht
    // an normale Lizenzkunden delegierbar.
    if (!this.isDevelopment || !this.featureWrap || this.featureInputs.has("license_admin")) return;

    const product = this._selectedProduct();
    if (!Array.isArray(product?.featureIds) || !product.featureIds.includes("license_admin")) return;

    const label = document.createElement("label");
    label.style.display = "inline-flex";
    label.style.gap = "6px";
    label.style.alignItems = "center";
    label.style.marginRight = "14px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    checkbox.style.width = "auto";

    label.append(
      checkbox,
      document.createTextNode("Lizenzverwaltung – eigene Vollversion")
    );
    this.featureWrap.appendChild(label);
    this.featureInputs.set("license_admin", checkbox);
  }
}
