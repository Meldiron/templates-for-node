const { PDFDocument, PageSizes } = require("pdf-lib");

async function createPdf({ name, items }) {
  const document = await PDFDocument.create();
  const page = document.addPage(PageSizes.A4); //[595.28, 841.89]

  page.drawText(new Date().toLocaleDateString(), { x: 50, y: 800, size: 25 });

  page.drawText(`Hello ${name}!`, { x: 50, y: 700, size: 50 });

  const orderList = items
    .map(
      ({ description, quantity, cost }) =>
        `${description} x ${quantity} = ${cost}`
    )
    .join("\n");

  page.drawText(orderList, { x: 50, y: 450, size: 25 });

  const pdfBytes = await document.save();

  return Buffer.from(pdfBytes.buffer);
}

module.exports = async ({ req, res, log, error }) => {
  if (!req.body) {
    error("Invalid request body");
    return res.json({ ok: false, msg: "Invalid request body" }, 400);
  }

  const pdfBuffer = await createPdf(req.body);

  return res.send(pdfBuffer, 200, { "Content-Type": "application/pdf" });
};
