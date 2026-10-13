// DSC token APIs (dummy token + PIN). सर्व routes ला login (Bearer token) लागतो.
const dummyToken = require("../utils/dsc/dummyToken");
const { getRoleKey, DESIGNATION } = require("../utils/digitalSignature");

const sendError = (res, e) => {
  if (e instanceof dummyToken.DscError) {
    return res.status(e.status).json({ message: e.message, code: e.code, attemptsLeft: e.attemptsLeft });
  }
  console.error("DSC error:", e);
  return res.status(500).json({ message: "DSC error", error: e.message });
};

const designationFor = (user) => {
  const key = getRoleKey(user.role, user.ward);
  return key ? DESIGNATION[key] : user.role || "Officer";
};

// GET /api/dsc/token  -> लॉगिन user च्या token ची माहिती
exports.getMyToken = async (req, res) => {
  try {
    const status = await dummyToken.tokenStatus(req.user._id);
    res.json({ ...status, signingRole: !!getRoleKey(req.user.role, req.user.ward) });
  } catch (e) {
    sendError(res, e);
  }
};

// POST /api/dsc/token/register { pin, confirmPin }
exports.registerToken = async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;
    if (pin !== confirmPin) {
      return res.status(400).json({ message: "दोन्ही PIN जुळत नाहीत.", code: "DSC_PIN_MISMATCH" });
    }
    if (!getRoleKey(req.user.role, req.user.ward)) {
      return res.status(403).json({ message: "या role ला DSC token लागत नाही.", code: "DSC_ROLE_NOT_ALLOWED" });
    }
    await dummyToken.issueToken(req.user, designationFor(req.user), pin);
    res.status(201).json({ message: "DSC token तयार झाला.", ...(await dummyToken.tokenStatus(req.user._id)) });
  } catch (e) {
    sendError(res, e);
  }
};

// POST /api/dsc/token/verify-pin { pin }   (फक्त PIN बरोबर आहे का ते तपासण्यासाठी)
exports.verifyPin = async (req, res) => {
  try {
    await dummyToken.unlockToken(req.user._id, req.body.pin);
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
};

// POST /api/dsc/token/change-pin { oldPin, newPin, confirmPin }
exports.changePin = async (req, res) => {
  try {
    const { oldPin, newPin, confirmPin } = req.body;
    if (newPin !== confirmPin) {
      return res.status(400).json({ message: "नवीन PIN जुळत नाहीत.", code: "DSC_PIN_MISMATCH" });
    }
    await dummyToken.changePin(req.user._id, oldPin, newPin);
    res.json({ message: "PIN बदलला." });
  } catch (e) {
    sendError(res, e);
  }
};

// POST /api/dsc/token/reset { userId }   (फक्त Admin) - lock झालेला token काढतो
exports.resetToken = async (req, res) => {
  try {
    if (!["Admin", "Super Admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "फक्त Admin token reset करू शकतो." });
    }
    const ok = await dummyToken.resetToken(req.body.userId);
    res.json({ message: ok ? "Token reset झाला. Officer पुन्हा register करू शकतो." : "Token सापडला नाही." });
  } catch (e) {
    sendError(res, e);
  }
};

// GET /api/dsc/ca.crt  -> Dummy CA certificate (Adobe मध्ये trust करण्यासाठी)
exports.downloadCaCert = (req, res) => {
  res.setHeader("Content-Type", "application/x-x509-ca-cert");
  res.setHeader("Content-Disposition", 'attachment; filename="vvcmc-dummy-ca.crt"');
  res.send(dummyToken.getDummyCA().crtPem);
};