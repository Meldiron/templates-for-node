const validate = require("./validate");

async function setup() {
  console.log("Executing setup script...");

  const { missing, warnings } = validate();
  missing.forEach((variable) =>
    console.error(`Missing required environment variable: ${variable}`)
  );
  warnings.forEach((warning) => console.log(`WARNING: ${warning}`));
}

await setup();