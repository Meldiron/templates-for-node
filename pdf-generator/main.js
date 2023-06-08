const { PDFDocument, PageSizes } = require("pdf-lib");

async function createPdf({ name, items }) {
  const document = PDFDocument.create();
  const page = document.addPage(PageSizes.A4);

  page.drawText(new Date().toLocaleDateString(), { x: 50, y: 550, size: 25 });

  page.drawText(`Hello ${name}!`, { x: 50, y: 450, size: 50 });

  const orderList = items
    .map(
      ({ description, quantity, cost }) =>
        `${description} x ${quantity} = ${cost}`
    )
    .join("\n");

  page.drawText(orderList, { x: 50, y: 350, size: 25 });

  return await document.save();
}

module.exports = async ({ req, res, log, error }) => {
  log("We have a new request!");

  if (!req.body) {
    error("Invalid request body");
    return res.json({ ok: false, msg: "Invalid request body" }, 400);
  }

  const pdfBytes = await createPdf(req.body);

  res.header("content-type", "application/pdf");
  return res.send(pdfBytes);
};
