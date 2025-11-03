const { CosmosClient } = require("@azure/cosmos");
const fs = require("fs");
const settings = JSON.parse(fs.readFileSync("./local.settings.json", "utf8"));
const client = new CosmosClient({ endpoint: settings.Values.COSMOS_ENDPOINT, key: settings.Values.COSMOS_KEY });
const db = client.database("dreamspace");
const items = db.container("items");

const GUID = "af103e6b-2c5d-4d9a-b080-227f08d33e73";
const EMAIL = "Tyler.Stewart@netsurit.com";

(async () => {
  console.log("Checking for items with GUID userId...");
  const { resources } = await items.items.query({ query: "SELECT * FROM c WHERE c.userId = @id", parameters: [{ name: "@id", value: GUID }] }).fetchAll();
  console.log(`Found ${resources.length} items with GUID`);
  
  for (const item of resources) {
    console.log(`Migrating ${item.type}: ${item.title || item.id}`);
    await items.item(item.id, GUID).delete();
    const { _rid, _self, _etag, _attachments, _ts, ...clean } = item;
    await items.items.create({ ...clean, userId: EMAIL });
  }
  
  console.log("Migration complete!");
})();
