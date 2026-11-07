const fs=require("fs"),path=require("path");
const PUBLIC_KEY_PATH=path.join(__dirname,"public_key.pem");
function readPublicKey() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    const err = new Error(`PUBLIC_KEY_MISSING:${PUBLIC_KEY_PATH}`);
    err.code = "PUBLIC_KEY_MISSING";
    throw err;
  }

  const publicKey = String(fs.readFileSync(PUBLIC_KEY_PATH, "utf8") || "").trim();
  if (
    !publicKey ||
    !publicKey.includes("-----BEGIN PUBLIC KEY-----") ||
    publicKey.includes("PLACEHOLDER_REPLACE_WITH_REAL_PUBLIC_KEY")
  ) {
    const err = new Error(`PUBLIC_KEY_INVALID:${PUBLIC_KEY_PATH}`);
    err.code = "PUBLIC_KEY_INVALID";
    throw err;
  }

  return publicKey;
}


module.exports=require("../../../packages/family-host-ports/src/licenseVerifier.cjs").create({readPublicKey,getMachineId:require("./deviceIdentity").getMachineId,isLicensedProduct:require("./licenseFeatures").isLicensedProduct});
