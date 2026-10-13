// =====================================================================
// utils/dsc/pdfSigner.js
// PDF वर खरा PAdES-style digital signature (adbe.pkcs7.detached) - Node मध्येच.
// वेगळी Python / sign-service लागत नाही.
//
// तीन टप्पे (USB token आल्यावरही हेच राहतात):
//   1. preparePdf()   -> PDF च्या शेवटी (incremental update) signature field + जागा जोडतो
//                        आणि "toBeSigned" bytes (signed attributes) परत देतो.
//   2. token.sign()   -> toBeSigned वर RSA-SHA256 सही. (आत्ता dummy token - server वर,
//                        नंतर officer च्या PC वरचा USB token / signer utility)
//   3. finishPdf()    -> CMS (PKCS#7) बनवून PDF मधील रिकाम्या जागेत बसवतो.
//
// नियम: PDF कधीही पुन्हा save (rewrite) करायची नाही - फक्त शेवटी जोडायचे.
// त्यामुळे आधीच्या सर्व सह्या valid राहतात.
// =====================================================================
const crypto = require("crypto");
const forge = require("node-forge");
const {
  PDFDocument,
  PDFName,
  PDFRef,
  PDFArray,
  PDFDict,
  PDFNumber,
  StandardFontEmbedder,
  StandardFonts,
} = require("pdf-lib");

const asn1 = forge.asn1;
const OIDS = forge.pki.oids;

// CMS साठी राखीव जागा (bytes). Certificate chain + signature साठी पुरेशी.
const SIGNATURE_MAX_BYTES = 16384;
const BYTE_RANGE_PLACEHOLDER = "[" + " ".repeat(58) + "]";

const helvetica = StandardFontEmbedder.for(StandardFonts.Helvetica);

// ---------------------------------------------------------------- helpers
const pdfLiteral = (s) =>
  "(" +
  String(s)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "") // Helvetica/WinAnsi मध्ये न येणारे अक्षरे वगळा
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)") +
  ")";

const pdfDate = (d) => {
  // D:YYYYMMDDHHmmSS+05'30'  (IST)
  const ist = new Date(d.getTime() + 330 * 60000);
  const p = (n) => String(n).padStart(2, "0");
  return (
    `D:${ist.getUTCFullYear()}${p(ist.getUTCMonth() + 1)}${p(ist.getUTCDate())}` +
    `${p(ist.getUTCHours())}${p(ist.getUTCMinutes())}${p(ist.getUTCSeconds())}+05'30'`
  );
};

const istStamp = (d) => {
  const ist = new Date(d.getTime() + 330 * 60000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(ist.getUTCDate())}-${p(ist.getUTCMonth() + 1)}-${ist.getUTCFullYear()} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())} IST`;
};

const lastStartXref = (buf) => {
  const tail = buf.slice(Math.max(0, buf.length - 2048)).toString("latin1");
  const m = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(tail);
  if (!m) throw new Error("PDF startxref सापडला नाही (PDF खराब आहे?)");
  return parseInt(m[1], 10);
};

const trailerSize = (buf) => {
  const tail = buf.slice(Math.max(0, buf.length - 4096)).toString("latin1");
  const all = [...tail.matchAll(/\/Size\s+(\d+)/g)];
  return all.length ? parseInt(all[all.length - 1][1], 10) : 0;
};

const usesClassicXref = (buf) => {
  const off = lastStartXref(buf);
  return buf.slice(off, off + 4).toString("latin1") === "xref";
};

const fitFontSize = (lines, w, h) => {
  let size = Math.min(9, (h - 6) / (lines.length * 1.18));
  for (const l of lines) {
    const tw = helvetica.widthOfTextAtSize(l, 1);
    if (tw > 0) size = Math.min(size, (w - 6) / tw);
  }
  return Math.max(4, Math.floor(size * 10) / 10);
};

const appearanceStream = (lines, w, h) => {
  const clean = lines.map((l) => l.replace(/[^\x20-\x7E\xA0-\xFF]/g, "").trim()).filter(Boolean);
  const fs = fitFontSize(clean, w, h);
  const lead = fs * 1.18;
  const blockH = lead * clean.length;
  const startY = (h + blockH) / 2 - fs; // vertically centred
  let s = "q\n0 0.45 0 RG 0.8 w 0.4 0.4 " + (w - 0.8).toFixed(2) + " " + (h - 0.8).toFixed(2) + " re S\n";
  s += `BT\n/F1 ${fs} Tf\n${lead.toFixed(2)} TL\n0 0 0 rg\n3 ${startY.toFixed(2)} Td\n`;
  clean.forEach((l, i) => {
    s += (i === 0 ? "" : "T*\n") + `${pdfLiteral(l)} Tj\n`;
  });
  s += "ET\nQ\n";
  return s;
};

const toForgeBuf = (buf) => forge.util.createBuffer(buf.toString("binary"));
const derOf = (node) => Buffer.from(asn1.toDer(node).getBytes(), "binary");

// ---------------------------------------------------------------- 1. prepare
/**
 * @param {Buffer} pdfBytes  सध्याची PDF
 * @param {object} o
 *   fieldName  "SIG_LIPIK"
 *   page       0-based, -1 = शेवटचे page
 *   box        [x1,y1,x2,y2] PDF points (origin खाली-डावीकडे)
 *   lines      stamp वरील ओळी
 *   reason, location, signerName, signingTime(Date)
 * @returns {{pdf:Buffer, byteRange:number[], contentsStart:number, contentsEnd:number, digest:Buffer}}
 */
async function preparePdf(pdfBytes, o) {
  let src = Buffer.from(pdfBytes);
  let doc = await PDFDocument.load(src, { updateMetadata: false });

  if (doc.context.trailerInfo.Encrypt) throw new Error("Encrypted PDF वर sign करता येत नाही");

  const existing = listSigFields(doc);
  if (existing.some((f) => f.name === o.fieldName && f.signed)) {
    throw new Error(`${o.fieldName} आधीच signed आहे`);
  }

  // xref stream (compressed) असलेली PDF: अजून एकही सही नसेल तर एकदाच साधी करून घ्या
  if (!usesClassicXref(src)) {
    if (existing.some((f) => f.signed)) {
      throw new Error("ही PDF compressed xref वापरते आणि आधीच signed आहे - incremental sign शक्य नाही");
    }
    src = Buffer.from(await doc.save({ useObjectStreams: false, updateFieldAppearances: false }));
    doc = await PDFDocument.load(src, { updateMetadata: false });
  }

  const ctx = doc.context;
  const pages = doc.getPages();
  const pageIdx = o.page < 0 ? pages.length + o.page : o.page;
  if (pageIdx < 0 || pageIdx >= pages.length) throw new Error(`Page ${o.page} नाही (एकूण ${pages.length})`);
  const page = pages[pageIdx];

  const [x1, y1, x2, y2] = o.box.map(Number);
  const rect = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
  const w = rect[2] - rect[0];
  const h = rect[3] - rect[1];

  let next = Math.max(ctx.largestObjectNumber + 1, trailerSize(src));
  const alloc = () => next++;
  const fontNum = alloc();
  const apNum = alloc();
  const sigNum = alloc();
  const widgetNum = alloc();

  const out = []; // [{num, gen, body:string}]
  const signingTime = o.signingTime || new Date();

  out.push({
    num: fontNum,
    gen: 0,
    body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  });

  const ap = appearanceStream(o.lines, w, h);
  out.push({
    num: apNum,
    gen: 0,
    body:
      `<< /Type /XObject /Subtype /Form /BBox [0 0 ${w.toFixed(2)} ${h.toFixed(2)}] ` +
      `/Resources << /Font << /F1 ${fontNum} 0 R >> /ProcSet [/PDF /Text] >> /Length ${Buffer.byteLength(ap, "latin1")} >>\n` +
      `stream\n${ap}endstream`,
  });

  const contentsPlaceholder = "<" + "0".repeat(SIGNATURE_MAX_BYTES * 2) + ">";
  out.push({
    num: sigNum,
    gen: 0,
    body:
      `<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached\n` +
      `/ByteRange ${BYTE_RANGE_PLACEHOLDER}\n` +
      `/Contents ${contentsPlaceholder}\n` +
      `/Reason ${pdfLiteral(o.reason || "Approved")} /Location ${pdfLiteral(o.location || "")}\n` +
      `/Name ${pdfLiteral(o.signerName || "")} /M ${pdfLiteral(pdfDate(signingTime))}\n` +
      `/Prop_Build << /App << /Name /VVCMC.Lightbill >> >> >>`,
  });

  out.push({
    num: widgetNum,
    gen: 0,
    body:
      `<< /Type /Annot /Subtype /Widget /FT /Sig /F 132 /T ${pdfLiteral(o.fieldName)} ` +
      `/V ${sigNum} 0 R /P ${page.ref.objectNumber} ${page.ref.generationNumber} R ` +
      `/Rect [${rect.map((v) => v.toFixed(2)).join(" ")}] /AP << /N ${apNum} 0 R >> >>`,
  });

  const widgetRef = PDFRef.of(widgetNum);

  // ---- page /Annots मध्ये widget जोडा
  const annots = page.node.get(PDFName.of("Annots"));
  if (annots instanceof PDFRef) {
    const arr = ctx.lookup(annots, PDFArray);
    arr.push(widgetRef);
    out.push({ num: annots.objectNumber, gen: annots.generationNumber, body: arr.toString() });
  } else {
    if (annots instanceof PDFArray) annots.push(widgetRef);
    else page.node.set(PDFName.of("Annots"), ctx.obj([widgetRef]));
    out.push({ num: page.ref.objectNumber, gen: page.ref.generationNumber, body: page.node.toString() });
  }

  // ---- AcroForm /Fields मध्ये field जोडा, SigFlags 3
  const rootRef = ctx.trailerInfo.Root;
  const catalog = doc.catalog;
  const acroVal = catalog.get(PDFName.of("AcroForm"));
  const addToAcro = (acro) => {
    const fieldsVal = acro.get(PDFName.of("Fields"));
    if (fieldsVal instanceof PDFRef) {
      const arr = ctx.lookup(fieldsVal, PDFArray);
      arr.push(widgetRef);
      out.push({ num: fieldsVal.objectNumber, gen: fieldsVal.generationNumber, body: arr.toString() });
    } else if (fieldsVal instanceof PDFArray) {
      fieldsVal.push(widgetRef);
    } else {
      acro.set(PDFName.of("Fields"), ctx.obj([widgetRef]));
    }
    acro.set(PDFName.of("SigFlags"), PDFNumber.of(3));
  };
  if (acroVal instanceof PDFRef) {
    const acro = ctx.lookup(acroVal, PDFDict);
    addToAcro(acro);
    out.push({ num: acroVal.objectNumber, gen: acroVal.generationNumber, body: acro.toString() });
  } else if (acroVal instanceof PDFDict) {
    addToAcro(acroVal);
    out.push({ num: rootRef.objectNumber, gen: rootRef.generationNumber, body: catalog.toString() });
  } else {
    const acroNum = alloc();
    out.push({ num: acroNum, gen: 0, body: `<< /Fields [${widgetNum} 0 R] /SigFlags 3 >>` });
    catalog.set(PDFName.of("AcroForm"), PDFRef.of(acroNum));
    out.push({ num: rootRef.objectNumber, gen: rootRef.generationNumber, body: catalog.toString() });
  }

  // ---- incremental section लिहा
  const prev = lastStartXref(src);
  const parts = [src];
  let pos = src.length;
  const push = (s) => {
    const b = Buffer.from(s, "latin1");
    parts.push(b);
    pos += b.length;
  };
  if (src[src.length - 1] !== 0x0a) push("\n");

  const offsets = new Map();
  let sigObjOffset = 0;
  for (const obj of out) {
    offsets.set(obj.num, { off: pos, gen: obj.gen });
    if (obj.num === sigNum) sigObjOffset = pos;
    push(`${obj.num} ${obj.gen} obj\n${obj.body}\nendobj\n`);
  }

  const xrefOff = pos;
  const nums = [...offsets.keys()].sort((a, b) => a - b);
  let xref = "xref\n";
  for (let i = 0; i < nums.length; ) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
    xref += `${nums[i]} ${j - i + 1}\n`;
    for (let k = i; k <= j; k++) {
      const e = offsets.get(nums[k]);
      xref += `${String(e.off).padStart(10, "0")} ${String(e.gen).padStart(5, "0")} n\r\n`;
    }
    i = j + 1;
  }
  const t = ctx.trailerInfo;
  let trailer = `trailer\n<< /Size ${next} /Root ${t.Root.toString()}`;
  if (t.Info) trailer += ` /Info ${t.Info.toString()}`;
  if (t.ID) trailer += ` /ID ${t.ID.toString()}`;
  trailer += ` /Prev ${prev} >>\nstartxref\n${xrefOff}\n%%EOF\n`;
  push(xref + trailer);

  const pdf = Buffer.concat(parts);

  // ---- ByteRange भरा
  const sigObjText = pdf.slice(sigObjOffset, sigObjOffset + 400).toString("latin1");
  const brPos = sigObjOffset + sigObjText.indexOf(BYTE_RANGE_PLACEHOLDER);
  const contentsStart = sigObjOffset + sigObjText.indexOf("/Contents <") + "/Contents ".length;
  const contentsEnd = contentsStart + contentsPlaceholder.length;
  const byteRange = [0, contentsStart, contentsEnd, pdf.length - contentsEnd];
  let br = `[${byteRange.join(" ")}`;
  br = br + " ".repeat(BYTE_RANGE_PLACEHOLDER.length - br.length - 1) + "]";
  pdf.write(br, brPos, "latin1");

  const digest = crypto
    .createHash("sha256")
    .update(pdf.slice(0, contentsStart))
    .update(pdf.slice(contentsEnd))
    .digest();

  return { pdf, byteRange, contentsStart, contentsEnd, digest, signingTime };
}

// ---------------------------------------------------------------- CMS
/** Signed attributes (हेच token sign करतो). */
function buildSignedAttrs(digest, signingTime) {
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(OIDS.contentType).getBytes()),
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(OIDS.data).getBytes()),
      ]),
    ]),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(OIDS.signingTime).getBytes()),
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.UTCTIME, false, asn1.dateToUtcTime(signingTime)),
      ]),
    ]),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(OIDS.messageDigest).getBytes()),
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [
        asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, digest.toString("binary")),
      ]),
    ]),
  ]);
}

/** prepare नंतर: token ने sign करायचे bytes */
function toBeSigned(prepared) {
  return derOf(buildSignedAttrs(prepared.digest, prepared.signingTime));
}

const algId = (oid) =>
  asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(oid).getBytes()),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.NULL, false, ""),
  ]);

function buildCms({ signedAttrsDer, signature, certChainDer }) {
  const signerCert = asn1.fromDer(toForgeBuf(certChainDer[0]));
  const tbs = signerCert.value[0];
  const i0 = tbs.value[0].tagClass === asn1.Class.CONTEXT_SPECIFIC ? 1 : 0;
  const serial = tbs.value[i0];
  const issuer = tbs.value[i0 + 2];

  const attrs = asn1.fromDer(toForgeBuf(signedAttrsDer));
  const signedAttrsImplicit = asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, attrs.value);

  const signerInfo = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(1).getBytes()),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [issuer, serial]),
    algId(OIDS.sha256),
    signedAttrsImplicit,
    algId(OIDS.rsaEncryption),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OCTETSTRING, false, signature.toString("binary")),
  ]);

  const signedData = asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false, asn1.integerToDer(1).getBytes()),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [algId(OIDS.sha256)]),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(OIDS.data).getBytes()),
    ]),
    asn1.create(
      asn1.Class.CONTEXT_SPECIFIC,
      0,
      true,
      certChainDer.map((d) => asn1.fromDer(toForgeBuf(d)))
    ),
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SET, true, [signerInfo]),
  ]);

  return derOf(
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
      asn1.create(asn1.Class.UNIVERSAL, asn1.Type.OID, false, asn1.oidToDer(OIDS.signedData).getBytes()),
      asn1.create(asn1.Class.CONTEXT_SPECIFIC, 0, true, [signedData]),
    ])
  );
}

// ---------------------------------------------------------------- 3. finish
/**
 * @param prepared     preparePdf() चा result
 * @param signature    Buffer - token ने toBeSigned(prepared) वर केलेली RSA-SHA256 सही
 * @param certChainDer [signerCertDer, ...caCertsDer]
 */
function finishPdf(prepared, signature, certChainDer) {
  const cms = buildCms({ signedAttrsDer: toBeSigned(prepared), signature, certChainDer });
  const hex = cms.toString("hex");
  const room = prepared.contentsEnd - prepared.contentsStart - 2;
  if (hex.length > room) throw new Error(`Signature खूप मोठी (${hex.length / 2} bytes)`);
  const pdf = Buffer.from(prepared.pdf);
  pdf.write(hex, prepared.contentsStart + 1, "latin1");
  return pdf;
}

/** एकाच call मध्ये: prepare -> token.sign -> finish */
async function signPdf(pdfBytes, opts, token) {
  const prepared = await preparePdf(pdfBytes, opts);
  const signature = await token.sign(toBeSigned(prepared));
  return finishPdf(prepared, signature, token.certChainDer);
}

// ---------------------------------------------------------------- verify
function listSigFields(doc) {
  const ctx = doc.context;
  const acroVal = doc.catalog.get(PDFName.of("AcroForm"));
  if (!acroVal) return [];
  const acro = ctx.lookup(acroVal, PDFDict);
  const fieldsVal = acro.get(PDFName.of("Fields"));
  const fields = fieldsVal ? ctx.lookup(fieldsVal, PDFArray) : null;
  if (!fields) return [];
  const res = [];
  for (let i = 0; i < fields.size(); i++) {
    const f = ctx.lookup(fields.get(i), PDFDict);
    if (!f) continue;
    const ft = f.get(PDFName.of("FT"));
    if (!ft || ft.toString() !== "/Sig") continue;
    const t = f.get(PDFName.of("T"));
    const name = t ? (t.decodeText ? t.decodeText() : t.toString()) : "";
    const v = f.get(PDFName.of("V"));
    const vDict = v ? ctx.lookup(v, PDFDict) : null;
    let byteRange = null;
    if (vDict) {
      const br = vDict.get(PDFName.of("ByteRange"));
      const arr = br ? ctx.lookup(br, PDFArray) : null;
      if (arr) byteRange = arr.asArray().map((n) => n.asNumber());
    }
    res.push({ name, signed: !!vDict, byteRange });
  }
  return res;
}

const attrValue = (signedAttrs, oid) => {
  for (const a of signedAttrs.value) {
    if (asn1.derToOid(a.value[0].value) === oid) return a.value[1].value[0];
  }
  return null;
};

/**
 * PDF मधील प्रत्येक signature तपासतो.
 * @param {Buffer} pdfBytes
 * @param {crypto.X509Certificate[]} trustedRoots  (dummy mode मध्ये dummy CA)
 */
async function verifyPdfSignatures(pdfBytes, trustedRoots = []) {
  const buf = Buffer.from(pdfBytes);
  const doc = await PDFDocument.load(buf, { updateMetadata: false });
  const result = [];
  for (const f of listSigFields(doc)) {
    if (!f.signed || !f.byteRange) continue;
    const [a, b, c, d] = f.byteRange;
    const item = { field: f.name, byteRange: f.byteRange };
    try {
      const hex = buf.slice(a + b + 1, c - 1).toString("latin1");
      const cms = asn1.fromDer(forge.util.createBuffer(forge.util.hexToBytes(hex)), { parseAllBytes: false });
      const sd = cms.value[1].value[0];
      let idx = 3;
      const certs = [];
      if (sd.value[idx].tagClass === asn1.Class.CONTEXT_SPECIFIC && sd.value[idx].type === 0) {
        for (const cn of sd.value[idx].value) certs.push(new crypto.X509Certificate(derOf(cn)));
        idx++;
      }
      while (sd.value[idx].tagClass === asn1.Class.CONTEXT_SPECIFIC) idx++; // crls
      const si = sd.value[idx].value[0];
      const serialHex = Buffer.from(si.value[1].value[1].value, "binary").toString("hex").replace(/^0+/, "").toUpperCase();
      const cert = certs.find((x) => x.serialNumber.replace(/^0+/, "").toUpperCase() === serialHex) || certs[0];

      const signedAttrsNode = si.value[3];
      const attrsDer = derOf(signedAttrsNode);
      attrsDer[0] = 0x31; // [0] IMPLICIT -> SET (hash याच bytes वर होतो)
      const sigValue = Buffer.from(si.value[5].value, "binary");

      const md = Buffer.from(attrValue(signedAttrsNode, OIDS.messageDigest).value, "binary");
      const actual = crypto.createHash("sha256").update(buf.slice(a, a + b)).update(buf.slice(c, c + d)).digest();
      const st = attrValue(signedAttrsNode, OIDS.signingTime);

      item.signer = cert.subject.split("\n").find((l) => l.startsWith("CN="))?.slice(3) || cert.subject;
      item.subject = cert.subject.replace(/\n/g, ", ");
      item.issuer = cert.issuer.replace(/\n/g, ", ");
      item.certSerial = cert.serialNumber;
      item.signedAt = st ? asn1.utcTimeToDate(st.value) : null;
      item.intact = md.equals(actual); // PDF बदलली नाही?
      item.valid = item.intact && crypto.verify("sha256", attrsDer, cert.publicKey, sigValue);
      item.trusted = trustedRoots.length
        ? trustedRoots.some((r) => cert.checkIssued(r) && cert.verify(r.publicKey))
        : null;
      item.coverage = c + d === buf.length ? "ENTIRE_FILE" : "REVISION";
    } catch (e) {
      item.valid = false;
      item.error = e.message;
    }
    result.push(item);
  }
  return result;
}

module.exports = {
  preparePdf,
  toBeSigned,
  finishPdf,
  signPdf,
  verifyPdfSignatures,
  istStamp,
  SIGNATURE_MAX_BYTES,
};