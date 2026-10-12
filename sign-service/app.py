"""
VVCMC Lightbill - Sign Service (FastAPI, फक्त localhost वर चालवा)

Node backend ->  POST http://127.0.0.1:7001/sign   -> PDF वर DSC लावून नवीन file लिहितो
Node backend ->  POST http://127.0.0.1:7001/verify -> PDF मधील सर्व signatures ची माहिती

Run:
    pip install -r requirements.txt
    SIGN_SERVICE_KEY=<random> UPLOADS_DIR=/path/to/lightbillBackend/uploads \
        uvicorn app:app --host 127.0.0.1 --port 7001
"""
import json
import os
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from sign_core import SignRequest, sign_with_pfx, list_signatures

BASE = Path(__file__).parent
UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", BASE.parent / "uploads")).resolve()
SERVICE_KEY = os.environ.get("SIGN_SERVICE_KEY", "")
# signerKey -> {pfx, pass}.  आत्ता dummy; खरे USB token आल्यावर हे server वरून काढून टाकायचे.
CERTS = json.loads((BASE / "certs.json").read_text(encoding="utf-8"))

app = FastAPI(title="VVCMC Sign Service")


def _safe(p: str) -> Path:
    """फक्त uploads folder मधील files ना परवानगी (path traversal बंद)."""
    # Node कडून "uploads/abc.pdf", "/uploads/abc.pdf" किंवा "uploads\\abc.pdf" येऊ शकते -
    # uploads folder flat आहे, म्हणून फक्त file name घेतो.
    name = p.replace("\\", "/").split("/")[-1]
    if not name.lower().endswith(".pdf"):
        raise HTTPException(400, f"Only .pdf allowed: {p}")
    return (UPLOADS_DIR / name).resolve()


def _auth(key):
    if SERVICE_KEY and key != SERVICE_KEY:
        raise HTTPException(401, "bad service key")


class SignBody(BaseModel):
    inputPath: str
    outputPath: str
    signerKey: str                       # उदा. "LIPIK" (dummy mode मध्ये role key)
    fieldName: str                       # उदा. "SIG_LIPIK"
    page: int = -1                       # 0-based, -1 = शेवटचे page
    box: list[float] = Field(min_length=4, max_length=4)   # [x1,y1,x2,y2] PDF points
    designation: str
    reason: str = "Approved"


@app.post("/sign")
def sign(body: SignBody, x_sign_key: str | None = Header(default=None)):
    _auth(x_sign_key)
    cert = CERTS.get(body.signerKey)
    if not cert:
        raise HTTPException(400, f"No certificate configured for signerKey={body.signerKey}")
    src, dst = _safe(body.inputPath), _safe(body.outputPath)
    pdf = src.read_bytes()
    try:
        out = sign_with_pfx(
            pdf,
            SignRequest(body.fieldName, body.page, tuple(body.box), body.designation, body.reason),
            str((BASE / cert["pfx"]).resolve()),
            cert.get("pass", ""),
        )
    except Exception as e:  # field आधीच signed, चुकीचा page इ.
        raise HTTPException(422, f"Signing failed: {e}")
    dst.write_bytes(out)
    return {"ok": True, "outputPath": body.outputPath, "bytes": len(out)}


class VerifyBody(BaseModel):
    path: str


@app.post("/verify")
def verify(body: VerifyBody, x_sign_key: str | None = Header(default=None)):
    _auth(x_sign_key)
    return {"signatures": list_signatures(_safe(body.path).read_bytes())}


@app.get("/health")
def health():
    return {"ok": True, "uploads": str(UPLOADS_DIR), "signers": list(CERTS)}
