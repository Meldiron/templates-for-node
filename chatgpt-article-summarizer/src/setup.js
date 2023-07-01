const AppwriteService = require("./appwrite");

async function setup() {
  console.log("Executing setup script...");

  const appwrite = AppwriteService();

  if (await appwrite.doesArticlesDatabaseExist()) {
    console.log(`Database exists.`);
    return;
  }

  await appwrite.createArticlesDatabase();
  console.log(`Database created.`);
}

setup();
