// =====================================================================
// utils/dsc/dummyToken.js
// DUMMY "USB token" - फक्त testing साठी.
//
// खऱ्या Class-3 DSC token सारखेच वागते:
//   * प्रत्येक officer चा स्वतःचा token (key + certificate)
//   * Private key PIN ने lock (encrypt) केलेली असते. PIN शिवाय sign होत नाही.
//   * PIN server वर save होत नाही. चुकीचा PIN = key उघडत नाही.
//   * सलग चुकीचे PIN (default 5) -> token LOCK. Admin reset करेपर्यंत sign नाही.
//
// खरा token कोणत्या प्रकारचा येईल ते माहीत नाही (ePass / ProxKey / HYP2003 ...),
// म्हणून बाकीचा code फक्त हा "token" interface वापरतो:
//     { provider, tokenSerial, subjectName, certChainDer: [Buffer], sign(Buffer) -> Buffer }
// खरा token आल्यावर हा file बदलायचा (किंवा नवीन provider जोडायचा). Workflow, PDF slots,
// frontend PIN popup तसेच राहतील.
// =====================================================================
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const DscToken = require("../../models/dscToken");

const DATA_DIR = path.resolve(process.env.DSC_DATA_DIR || path.join(__dirname, "..", "..", "dsc-data"));
const CA_KEY = path.join(DATA_DIR, "dummy-ca.key.pem");
const CA_CRT = path.join(DATA_DIR, "dummy-ca.crt.pem");
const MAX_PIN_ATTEMPTS = parseInt(process.env.DSC_MAX_PIN_ATTEMPTS || "5", 10);
const PIN_RE = /^[A-Za-z0-9]{6,12}$/;
const ORG = "Vasai-Virar City Municipal Corporation";

class DscError extends Error {
  constructor(code, message, status = 400, extra = {}) {
    super(message);
    this.code = code;
    this.status = status;
    Object.assign(this, extra);
  }
}

// ---------------------------------------------------------------- dummy CA
let caCache = null;
function getDummyCA() {
  if (caCache) return caCache;
  if (!fs.existsSync(CA_KEY) || !fs.existsSync(CA_CRT)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
    const keyPem = privateKey.export({ type: "pkcs8", format: "pem" });
    const fKey = forge.pki.privateKeyFromPem(keyPem);
    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.setRsaPublicKey(fKey.n, fKey.e);
    cert.serialNumber = "01" + crypto.randomBytes(8).toString("hex");
    cert.validity.notBefore = new Date(Date.now() - 60000);
    cert.validity.notAfter = new Date(Date.now() + 10 * 365 * 864e5);
    const attrs = [
      { name: "commonName", value: "VVCMC Dummy DSC CA (TESTING ONLY)" },
      { name: "organizationName", value: ORG },
      { name: "countryName", value: "IN" },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      { name: "basicConstraints", cA: true, critical: true },
      { name: "keyUsage", keyCertSign: true, cRLSign: true, critical: true },
      { name: "subjectKeyIdentifier" },
    ]);
    cert.sign(fKey, forge.md.sha256.create());
    fs.writeFileSync(CA_KEY, keyPem, { mode: 0o600 });
    fs.writeFileSync(CA_CRT, forge.pki.certificateToPem(cert));
    console.log("[DSC] Dummy CA तयार केला:", CA_CRT);
  }
  const keyPem = fs.readFileSync(CA_KEY, "utf8");
  const crtPem = fs.readFileSync(CA_CRT, "utf8");
  caCache = {
    keyPem,
    crtPem,
    fKey: forge.pki.privateKeyFromPem(keyPem),
    fCert: forge.pki.certificateFromPem(crtPem),
    x509: new crypto.X509Certificate(crtPem),
    der: new crypto.X509Certificate(crtPem).raw,
  };
  return caCache;
}

const pemToDer = (pem) => new crypto.X509Certificate(pem).raw;

// ---------------------------------------------------------------- issue
/**
 * Officer साठी नवीन dummy token "issue" करतो (CA कडून token मिळाल्यासारखे).
 * @param user {_id, username, email, role, ward}
 * @param designation "Junior Engineer (Ward)" इ.
 * @param pin officer ने निवडलेला PIN
 */
async function issueToken(user, designation, pin) {
  if (!PIN_RE.test(String(pin || ""))) {
    throw new DscError("DSC_PIN_FORMAT", "PIN 6 ते 12 अक्षरे/अंक असावा (फक्त A-Z, a-z, 0-9).");
  }
  const existing = await DscToken.findOne({ userId: user._id });
  if (existing && existing.status !== "REVOKED") {
    throw new DscError("DSC_TOKEN_EXISTS", "या user चा DSC token आधीच आहे.", 409);
  }

  const ca = getDummyCA();
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const pubPem = publicKey.export({ type: "spki", format: "pem" });
  const tokenSerial = "DT" + crypto.randomBytes(5).toString("hex").toUpperCase();
  const name = (user.username || user.email || "Officer").trim();

  const cert = forge.pki.createCertificate();
  cert.publicKey = forge.pki.publicKeyFromPem(pubPem);
  cert.serialNumber = "01" + crypto.randomBytes(8).toString("hex");
  cert.validity.notBefore = new Date(Date.now() - 60000);
  cert.validity.notAfter = new Date(Date.now() + 2 * 365 * 864e5);
  cert.setSubject([
    { name: "commonName", value: name, valueTagClass: forge.asn1.Type.UTF8 },
    { type: forge.pki.oids.title, value: designation, valueTagClass: forge.asn1.Type.UTF8 },
    { name: "organizationalUnitName", value: "Electrical Department" },
    { name: "organizationName", value: ORG },
    { name: "stateOrProvinceName", value: "Maharashtra" },
    { name: "countryName", value: "IN" },
  ]);
  cert.setIssuer(ca.fCert.subject.attributes);
  cert.setExtensions([
    { name: "basicConstraints", cA: false },
    { name: "keyUsage", digitalSignature: true, nonRepudiation: true, critical: true },
    { name: "subjectKeyIdentifier" },
    { name: "authorityKeyIdentifier", keyIdentifier: ca.fCert.generateSubjectKeyIdentifier().getBytes() },
  ]);
  cert.sign(ca.fKey, forge.md.sha256.create());
  const certPem = forge.pki.certificateToPem(cert);

  // Private key PIN ने encrypt (PIN स्वतः कुठेही save होत नाही)
  const encryptedKeyPem = privateKey.export({
    type: "pkcs8",
    format: "pem",
    cipher: "aes-256-cbc",
    passphrase: String(pin),
  });

  const x = new crypto.X509Certificate(certPem);
  const data = {
    userId: user._id,
    provider: "DUMMY",
    tokenSerial,
    subjectName: name,
    designation,
    certPem,
    certSerial: x.serialNumber,
    validFrom: new Date(x.validFrom),
    validTo: new Date(x.validTo),
    encryptedKeyPem,
    failedAttempts: 0,
    status: "ACTIVE",
    issuedAt: new Date(),
  };
  if (existing) {
    Object.assign(existing, data);
    await existing.save();
    return existing;
  }
  return DscToken.create(data);
}

// ---------------------------------------------------------------- unlock
/**
 * PIN टाकून token उघडतो. बरोबर PIN -> sign करू शकणारा token object.
 * चुकीचा PIN -> DscError (attemptsLeft सह). सलग MAX वेळा चुकल्यास LOCK.
 */
async function unlockToken(userId, pin) {
  if (!userId) throw new DscError("DSC_TOKEN_NOT_REGISTERED", "User माहीत नाही.", 400);
  const tok = await DscToken.findOne({ userId }).select("+encryptedKeyPem");
  if (!tok || tok.status === "REVOKED") {
    throw new DscError("DSC_TOKEN_NOT_REGISTERED", "तुमचा DSC token register केलेला नाही. आधी token register करा.", 428);
  }
  if (tok.status === "LOCKED") {
    throw new DscError("DSC_TOKEN_LOCKED", "चुकीच्या PIN मुळे तुमचा DSC token lock झाला आहे. Admin कडून reset करून घ्या.", 423);
  }
  if (tok.validTo && tok.validTo < new Date()) {
    throw new DscError("DSC_CERT_EXPIRED", "तुमच्या DSC certificate ची मुदत संपली आहे.", 403);
  }
  if (!pin) throw new DscError("DSC_PIN_REQUIRED", "DSC PIN टाका.", 401);

  let key;
  try {
    key = crypto.createPrivateKey({ key: tok.encryptedKeyPem, format: "pem", passphrase: String(pin) });
  } catch (e) {
    const upd = await DscToken.findOneAndUpdate({ _id: tok._id }, { $inc: { failedAttempts: 1 } }, { new: true });
    const left = Math.max(0, MAX_PIN_ATTEMPTS - upd.failedAttempts);
    if (left === 0) {
      await DscToken.updateOne({ _id: tok._id }, { status: "LOCKED", lockedAt: new Date() });
      throw new DscError("DSC_TOKEN_LOCKED", "चुकीच्या PIN मुळे तुमचा DSC token lock झाला आहे. Admin कडून reset करून घ्या.", 423);
    }
    throw new DscError("DSC_PIN_INVALID", `चुकीचा PIN. अजून ${left} प्रयत्न बाकी.`, 401, { attemptsLeft: left });
  }

  await DscToken.updateOne({ _id: tok._id }, { failedAttempts: 0, lastUsedAt: new Date() });
  const ca = getDummyCA();
  return {
    provider: "DUMMY",
    tokenSerial: tok.tokenSerial,
    subjectName: tok.subjectName,
    certSerial: tok.certSerial,
    certChainDer: [pemToDer(tok.certPem), ca.der],
    sign: async (data) => crypto.sign("sha256", data, key),
  };
}

async function changePin(userId, oldPin, newPin) {
  if (!PIN_RE.test(String(newPin || ""))) {
    throw new DscError("DSC_PIN_FORMAT", "नवीन PIN 6 ते 12 अक्षरे/अंक असावा (फक्त A-Z, a-z, 0-9).");
  }
  await unlockToken(userId, oldPin); // जुना PIN तपासतो (चुकल्यास attempts वाढतात)
  const tok = await DscToken.findOne({ userId }).select("+encryptedKeyPem");
  const key = crypto.createPrivateKey({ key: tok.encryptedKeyPem, format: "pem", passphrase: String(oldPin) });
  tok.encryptedKeyPem = key.export({ type: "pkcs8", format: "pem", cipher: "aes-256-cbc", passphrase: String(newPin) });
  await tok.save();
}

/** Admin: lock झालेला / हरवलेला token काढून टाकतो. Officer पुन्हा register करेल. */
async function resetToken(userId) {
  const r = await DscToken.updateOne({ userId }, { status: "REVOKED", revokedAt: new Date() });
  return r.matchedCount > 0;
}

async function tokenStatus(userId) {
  const tok = await DscToken.findOne({ userId });
  if (!tok || tok.status === "REVOKED") return { registered: false, maxAttempts: MAX_PIN_ATTEMPTS };
  return {
    registered: true,
    provider: tok.provider,
    tokenSerial: tok.tokenSerial,
    subjectName: tok.subjectName,
    designation: tok.designation,
    certSerial: tok.certSerial,
    validFrom: tok.validFrom,
    validTo: tok.validTo,
    status: tok.status,
    attemptsLeft: Math.max(0, MAX_PIN_ATTEMPTS - (tok.failedAttempts || 0)),
    maxAttempts: MAX_PIN_ATTEMPTS,
    lastUsedAt: tok.lastUsedAt,
  };
}

const trustedRoots = () => [getDummyCA().x509];

module.exports = {
  DscError,
  issueToken,
  unlockToken,
  changePin,
  resetToken,
  tokenStatus,
  getDummyCA,
  trustedRoots,
  PIN_RE,
};