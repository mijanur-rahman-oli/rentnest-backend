import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { prisma } from "./config/db";

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to database");

    app.listen(PORT, () => {
      console.log(`🚀 RentNest API listening on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

main();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
