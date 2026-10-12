"""
VVCMC Lightbill - PDF Digital Signature core (pyHanko)

हे module PDF वर *खरा* PAdES digital signature (PKCS#7 / CMS) लावतो:
  * Incremental update  -> आधीचे signatures valid राहतात (Lipik -> JE -> ... -> DMC)
  * Visible stamp       -> दिलेल्या page + box मध्ये "Digitally signed by ..." stamp
  * आत्ता  : .pfx (dummy certificate) ने server वर sign
  * नंतर   : USB token (Class-3 DSC) - खाली prepare_external / finish_external पहा
"""
from __future__ import annotations

import io
import os
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta

from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from pyhanko.pdf_utils.reader import PdfFileReader
from pyhanko.sign import signers, fields
from pyhanko.sign.validation import validate_pdf_signature
from pyhanko.stamp import TextStampStyle
from pyhanko.pdf_utils.text import TextBoxStyle
from pyhanko.pdf_utils.layout import SimpleBoxLayoutRule, AxisAlignment, Margins
from pyhanko_certvalidator import ValidationContext

IST = timezone(timedelta(hours=5, minutes=30))
import logging
# dummy CA trusted नसल्यामुळे येणारे मोठे traceback logs बंद
logging.getLogger("pyhanko.sign.validation").setLevel(logging.CRITICAL)
logging.getLogger("pyhanko_certvalidator").setLevel(logging.CRITICAL)
# Stamp वरची वेळ IST मध्ये यावी (आणि 'Asia/Calcutta' सारख्या जुन्या नावाने crash होऊ नये)
os.environ["TZ"] = "Asia/Kolkata"


@dataclass
class SignRequest:
    field_name: str            # unique per role, e.g. "SIG_LIPIK"
    page: int                  # 0-based page index; -1 = last page
    box: tuple                 # (x1, y1, x2, y2) PDF points, origin bottom-left
    designation: str           # "Lipik, Electrical Dept" etc.
    reason: str = "Approved"
    location: str = "Vasai-Virar City Municipal Corporation"


def _stamp_style(designation: str) -> TextStampStyle:
    return TextStampStyle(
        stamp_text=(
            "Digitally signed by\n%(signer)s\n"
            + designation.replace("%", "%%")
            + "\nDate: %(ts)s"
        ),
        timestamp_format="%d-%m-%Y %H:%M IST",
        border_width=1,
        text_box_style=TextBoxStyle(font_size=8),
        inner_content_layout=SimpleBoxLayoutRule(
            x_align=AxisAlignment.ALIGN_MIN,
            y_align=AxisAlignment.ALIGN_MID,
            margins=Margins.uniform(3),
        ),
    )


def _resolve_page(pdf_bytes: bytes, page: int) -> int:
    if page >= 0:
        return page
    r = PdfFileReader(io.BytesIO(pdf_bytes))
    return int(r.root["/Pages"]["/Count"]) + page


def sign_with_pfx(pdf_bytes: bytes, req: SignRequest, pfx_path: str, pfx_pass: str) -> bytes:
    """Dummy / server-side signing using a .pfx file."""
    signer = signers.SimpleSigner.load_pkcs12(
        pfx_file=pfx_path, passphrase=pfx_pass.encode() if pfx_pass else None
    )
    if signer is None:
        raise ValueError("Could not load PFX (wrong password?)")
    return _sign(pdf_bytes, req, signer)


def _sign(pdf_bytes: bytes, req: SignRequest, signer) -> bytes:
    page = _resolve_page(pdf_bytes, req.page)
    w = IncrementalPdfFileWriter(io.BytesIO(pdf_bytes), strict=False)

    # Field आधीच नसेल तर तयार करा (visible box सह)
    existing = {f[0] for f in fields.enumerate_sig_fields(w)}
    if req.field_name not in existing:
        fields.append_signature_field(
            w,
            fields.SigFieldSpec(
                sig_field_name=req.field_name,
                on_page=page,
                box=tuple(int(round(v)) for v in req.box),
            ),
        )

    meta = signers.PdfSignatureMetadata(
        field_name=req.field_name,
        reason=req.reason,
        location=req.location,
        md_algorithm="sha256",
        subfilter=fields.SigSeedSubFilter.ADOBE_PKCS7_DETACHED,
    )
    pdf_signer = signers.PdfSigner(meta, signer=signer, stamp_style=_stamp_style(req.designation))
    out = io.BytesIO()
    pdf_signer.sign_pdf(w, output=out)
    return out.getvalue()


def list_signatures(pdf_bytes: bytes, trust_roots=None) -> list[dict]:
    """प्रत्येक signature: कोणी, केव्हा, intact आहे का, नंतर बदल झाला का."""
    r = PdfFileReader(io.BytesIO(pdf_bytes), strict=False)
    vc = ValidationContext(trust_roots=trust_roots or [], allow_fetching=False)
    result = []
    for emb in r.embedded_signatures:
        st = validate_pdf_signature(emb, vc)
        result.append({
            "field": emb.field_name,
            "signer": st.signing_cert.subject.human_friendly,
            "signedAt": str(emb.self_reported_timestamp),
            "intact": st.intact,             # hash जुळतो?
            "valid": st.valid,               # cryptographic signature बरोबर?
            "trusted": st.trusted,           # CA trusted? (dummy साठी false/true)
            "coverage": st.coverage.name,    # ENTIRE_REVISION / ENTIRE_FILE
            "modificationLevel": st.modification_level.name if st.modification_level else None,
        })
    return result
