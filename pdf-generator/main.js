const { PDFDocument, PageSizes } = require("pdf-lib");
import { faker } from "@faker-js/faker";

module.exports = async ({ res }) => {
  const fakeOrder = generateFakeOrder();
  const pdfBuffer = await createPdf(fakeOrder);
  return res.send(pdfBuffer, 200, { "Content-Type": "application/pdf" });
};

function generateFakeOrder() {
  return {
    id: faker.string.uuid(),
    date: faker.date.past(),
    name: faker.person.fullName(),
    items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => ({
      description: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 10 }),
      cost: faker.commerce.price(),
    })),
  };
}

async function createPdf({ id, date, name, items }) {
  const document = await PDFDocument.create();
  const page = document.addPage(PageSizes.A4); //[595.28, 841.89]

  page.drawText("Sample Invoice", { x: 50, y: 800, size: 50 });
  page.drawText(new Date(date).toLocaleDateString(), {
    x: 500,
    y: 800,
    size: 25,
  });

  page.drawText(`Hello ${name}!`, {
    x: 50,
    y: 700,
    size: 50,
  });

  page.drawText(`Order ID: ${id}`, {
    x: 50,
    y: 650,
    size: 25,
  });

  const orderList = items
    .map(
      ({ description, quantity, cost }) =>
        `${description} x ${quantity} = $${cost}`
    )
    .join("\n");

  page.drawText(orderList, { x: 50, y: 450, size: 25 });

  const pdfBytes = await document.save();

  return Buffer.from(pdfBytes.buffer);
}
