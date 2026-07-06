import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Prisma } from "@prisma/client";

const execFileAsync = promisify(execFile);

let schemaSetupPromise: Promise<void> | null = null;

export function isMissingDatabaseSchemaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export async function ensureDatabaseSchema(error: unknown) {
  if (!isMissingDatabaseSchemaError(error)) {
    return false;
  }

  if (!process.env.DATABASE_URL) {
    return false;
  }

  if (!schemaSetupPromise) {
    schemaSetupPromise = execFileAsync(
      "npx",
      ["prisma", "db", "push", "--skip-generate"],
      {
        cwd: process.cwd(),
        env: process.env,
        timeout: 120_000,
        maxBuffer: 1024 * 1024,
      },
    )
      .then(({ stdout, stderr }) => {
        if (stdout) console.log("Prisma auto schema setup:", stdout);
        if (stderr) console.warn("Prisma auto schema setup warnings:", stderr);
      })
      .catch((setupError) => {
        schemaSetupPromise = null;
        console.error("Prisma auto schema setup failed:", setupError);
        throw setupError;
      });
  }

  await schemaSetupPromise;
  return true;
}
