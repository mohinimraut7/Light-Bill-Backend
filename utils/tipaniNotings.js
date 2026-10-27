// =====================================================================
// 27-Oct-2026: कार्यालयीन टिपणी — eOffice प्रमाणे "Notings" (शेरे)
//  • प्रत्येक officer चा निर्णय (Approved / Send Back / Rejected) टिपणीच्या PDF मध्ये
//    पुढच्या page वर "Note # n" म्हणून: शेरा (remark) + सही + नाव + पद + दिनांक.
//  • मराठी मजकूर browser मध्येच image (PNG) म्हणून तयार होतो (अक्षरे बरोबर जुळतात),
//    backend फक्त ती image PDF मध्ये खाली-खाली लावतो.
//  • Notings DB मध्ये (doc.notings) राहतात -> Clerk ने नवीन PDF upload केली तरी परत लावले जातात.
//  • मूळ टिपणीचा पहिला page आणि सहीच्या जागा (slots) बदलत नाहीत.
// =====================================================================
const fs = require("fs");
const path = require("path");
const PDFLib = require("pdf-lib");

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads"));
const NOTE_IMAGE_RE = /^data:image\/png;base64,/i;
const isNoteImage = (v) => typeof v === "string" && NOTE_IMAGE_RE.test(v);

const MM = 72 / 25.4;
// टिपणी page (Legal) — मूळ टिपणी प्रमाणे डावीकडे उभी रेषा 31.6mm वर
const PAGE_W = 215.9 * MM;
const PAGE_H = 355.6 * MM;
const LINE_X = 31.6 * MM;
const CONTENT_X = 33.5 * MM;
const CONTENT_W = 176 * MM;
const TOP = 14 * MM;
const BOTTOM = 14 * MM;
const LABEL_H = 14;   // "Note # n" ओळ (pt)
const GAP = 10;       // दोन notes मधील जागा (pt)

const safeName = (p) => String(p || "").replace(/\\/g, "/").split("/").pop();

const uploadPdfPath = (p) => {
  const name = safeName(p);
  if (!name || !name.toLowerCase().endsWith(".pdf")) throw new Error(`Only .pdf allowed: ${p}`);
  return path.join(UPLOADS_DIR, name);
};

/** browser मधून आलेली note image uploads मध्ये save -> "uploads/<file>.png" */
const saveNoteImage = (dataUri, formNumber, roleKey) => {
  if (!isNoteImage(dataUri)) return null;
  const outName = `noting_${String(formNumber || "doc").replace(/[^\w-]/g, "")}_${roleKey}_${Date.now()}.png`;
  fs.writeFileSync(path.join(UPLOADS_DIR, outName), Buffer.from(dataUri.split(",")[1], "base64"));
  return path.posix.join("uploads", outName);
};

const newNotingPage = (pdfDoc) => {
  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  page.drawLine({
    start: { x: LINE_X, y: PAGE_H - 8.6 * MM },
    end: { x: LINE_X, y: 0 },
    thickness: 0.75,
    color: PDFLib.rgb(0, 0, 0),
  });
  return page;
};

/**
 * notes PDF मध्ये खाली-खाली लावतो.
 * cursor = { page, y }  (y = वरून pt). cursor नसेल तर नवीन page पासून.
 * @returns नवीन cursor
 */
const drawNotes = async (pdfDoc, notes, cursor) => {
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  let pageIdx = cursor && Number.isInteger(cursor.page) && cursor.page < pdfDoc.getPageCount() ? cursor.page : null;
  let y = pageIdx !== null ? Number(cursor.y) || TOP : TOP;
  let page = pageIdx !== null ? pdfDoc.getPage(pageIdx) : null;

  for (const note of notes) {
    let img = null;
    try {
      const file = path.join(UPLOADS_DIR, safeName(note.image));
      if (note.image && fs.existsSync(file)) img = await pdfDoc.embedPng(fs.readFileSync(file));
    } catch (e) {
      console.warn("noting image skip:", e.message);
    }

    const scale = img ? Math.min(1, CONTENT_W / img.width) : 1;
    const iw = img ? img.width * scale : 0;
    const ih = img ? img.height * scale : 0;
    const need = LABEL_H + ih + GAP;

    if (!page || y + need > PAGE_H - BOTTOM) {
      page = newNotingPage(pdfDoc);
      pageIdx = pdfDoc.getPageCount() - 1;
      y = TOP;
    }

    // Note # n (underline)
    const label = `Note # ${note.noteNo}`;
    const size = 9;
    const lw = font.widthOfTextAtSize(label, size);
    const baseY = PAGE_H - y - size;
    page.drawText(label, { x: CONTENT_X, y: baseY, size, font, color: PDFLib.rgb(0.1, 0.1, 0.45) });
    page.drawLine({
      start: { x: CONTENT_X, y: baseY - 1.5 },
      end: { x: CONTENT_X + lw, y: baseY - 1.5 },
      thickness: 0.5,
      color: PDFLib.rgb(0.1, 0.1, 0.45),
    });
    y += LABEL_H;

    if (img) {
      page.drawImage(img, { x: CONTENT_X, y: PAGE_H - y - ih, width: iw, height: ih });
      y += ih;
    }

    // notes मधील पातळ रेषा
    page.drawLine({
      start: { x: CONTENT_X, y: PAGE_H - y - GAP / 2 },
      end: { x: CONTENT_X + CONTENT_W, y: PAGE_H - y - GAP / 2 },
      thickness: 0.4,
      color: PDFLib.rgb(0.75, 0.75, 0.75),
    });
    y += GAP;
  }
  return { page: pageIdx, y };
};

const writeOut = async (doc, pdfDoc, tag) => {
  const outName = `noted_${String(doc.formNumber || "doc").replace(/[^\w-]/g, "")}_${tag}_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(UPLOADS_DIR, outName), await pdfDoc.save());
  doc.pdfFile = path.posix.join("uploads", outName);
  doc.lastUpdated = new Date();
};

/** एक नवीन note (doc.notings मध्ये आधीच push केलेली) PDF मध्ये लावा */
const appendNoting = async (doc, note) => {
  const pdfDoc = await PDFLib.PDFDocument.load(fs.readFileSync(uploadPdfPath(doc.pdfFile)), { ignoreEncryption: true });
  doc.notingCursor = await drawNotes(pdfDoc, [note], doc.notingCursor);
  await writeOut(doc, pdfDoc, note.roleKey || "NOTE");
};

/** Clerk ने नवीन PDF upload केली -> आधीच्या सर्व notes परत लावा */
const reapplyNotings = async (doc) => {
  doc.notingCursor = null;
  const notes = (doc.notings || []).filter((n) => n && n.image);
  if (!notes.length) return;
  const pdfDoc = await PDFLib.PDFDocument.load(fs.readFileSync(uploadPdfPath(doc.pdfFile)), { ignoreEncryption: true });
  doc.notingCursor = await drawNotes(pdfDoc, notes, null);
  await writeOut(doc, pdfDoc, "ALL");
};

module.exports = { isNoteImage, saveNoteImage, appendNoting, reapplyNotings };