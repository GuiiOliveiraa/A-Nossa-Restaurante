const { MongoClient, ServerApiVersion } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "anossa_db";

let client;
let clientPromise;

if (MONGODB_URI) {
  client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    },
    connectTimeoutMS: 10000
  });
}

async function getClient() {
  if (!client) {
    throw new Error("Variavel MONGODB_URI nao configurada.");
  }

  if (!clientPromise) {
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      throw error;
    });
  }

  try {
    const connectedClient = await clientPromise;
    await connectedClient.db(MONGODB_DB_NAME).command({ ping: 1 });
    return connectedClient;
  } catch (error) {
    clientPromise = null;
    throw error;
  }
}

async function getDb() {
  const connectedClient = await getClient();
  return connectedClient.db(MONGODB_DB_NAME);
}

async function getProductsCollection() {
  const db = await getDb();
  return db.collection("products");
}

module.exports = {
  getClient,
  getDb,
  getProductsCollection,
  MONGODB_DB_NAME
};
