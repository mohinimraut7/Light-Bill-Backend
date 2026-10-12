"""
Dummy DSC certificates (.pfx) तयार करतो - फक्त TESTING साठी.
Windows/Linux दोन्हीवर चालते, openssl लागत नाही.

    python make_dummy_certs.py          (dummy-certs folder मध्ये चालवा)
Password: test1234
"""
import datetime
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID, ExtendedKeyUsageOID, ObjectIdentifier

HERE = Path(__file__).parent
PASSWORD = b"test1234"
now = datetime.datetime.now(datetime.timezone.utc)


def name(cn, ou=None, o="Vasai Virar City Municipal Corporation"):
    attrs = [x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
             x509.NameAttribute(NameOID.ORGANIZATION_NAME, o)]
    if ou:
        attrs.append(x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, ou))
    attrs.append(x509.NameAttribute(NameOID.COMMON_NAME, cn))
    return x509.Name(attrs)


# --- Dummy CA ---
ca_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
ca_name = name("VVCMC Dummy CA (NOT VALID)", o="VVCMC TEST ONLY")
ca_cert = (
    x509.CertificateBuilder()
    .subject_name(ca_name).issuer_name(ca_name)
    .public_key(ca_key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(now).not_valid_after(now + datetime.timedelta(days=1825))
    .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
    .add_extension(x509.KeyUsage(False, False, False, False, False, True, True, False, False), critical=True)
    .sign(ca_key, hashes.SHA256())
)
(HERE / "ca.crt").write_bytes(ca_cert.public_bytes(serialization.Encoding.PEM))

OFFICERS = {
    "lipik":      ("DUMMY LIPIK",             "Lipik Electrical Dept"),
    "je_ward":    ("DUMMY JE WARD",           "Junior Engineer Ward"),
    "je_ho":      ("DUMMY JE HEAD OFFICE",    "Junior Engineer Head Office"),
    "accountant": ("DUMMY ACCOUNTANT",        "Accountant"),
    "amc":        ("DUMMY ASST COMMISSIONER", "Assistant Municipal Commissioner"),
    "dmc":        ("DUMMY DY COMMISSIONER",   "Dy Municipal Commissioner"),
}

for fid, (cn, ou) in OFFICERS.items():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    cert = (
        x509.CertificateBuilder()
        .subject_name(name(cn, ou)).issuer_name(ca_name)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now).not_valid_after(now + datetime.timedelta(days=730))
        .add_extension(x509.KeyUsage(True, True, False, False, False, False, False, False, False), critical=True)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.EMAIL_PROTECTION,
                                              ObjectIdentifier("1.3.6.1.4.1.311.10.3.12")]), critical=False)
        .sign(ca_key, hashes.SHA256())
    )
    pfx = pkcs12.serialize_key_and_certificates(
        cn.encode(), key, cert, [ca_cert], serialization.BestAvailableEncryption(PASSWORD))
    (HERE / f"{fid}.pfx").write_bytes(pfx)
    print("created", f"{fid}.pfx", "->", cn)

print("Done. Password: test1234")
