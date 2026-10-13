const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const dsc = require("../controller/dsc");

const router = express.Router();

router.get("/dsc/token", authMiddleware, dsc.getMyToken);
router.post("/dsc/token/register", authMiddleware, dsc.registerToken);
router.post("/dsc/token/verify-pin", authMiddleware, dsc.verifyPin);
router.post("/dsc/token/change-pin", authMiddleware, dsc.changePin);
router.post("/dsc/token/reset", authMiddleware, dsc.resetToken);
router.get("/dsc/ca.crt", dsc.downloadCaCert);

module.exports = router;