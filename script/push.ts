import { neon } from "@neondatabase/serverless";
import fs from "fs";

async function push() {
    if (!process.env.DATABASE_URL) throw new Error("Missing DATABASE_URL");

    const sql = neon(process.env.DATABASE_URL);
    const query = fs.readFileSync("migrations/0000_charming_ben_grimm.sql", "utf-8");

    console.log("Applying migration...");
    await sql(query);
    console.log("Migration applied successfully!");
}

push().catch(console.error);
