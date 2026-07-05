import { Prisma } from "@prisma/client";

const LOCAL_DATABASE_HOST_PATTERN = /@(localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i;

function getDatabaseHost() {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

function usesLocalDatabaseHost() {
  return LOCAL_DATABASE_HOST_PATTERN.test(process.env.DATABASE_URL ?? "");
}

export function getDatabaseSetupError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Prisma database initialization failed:", error.message);

    if (process.env.NODE_ENV === "production" && getDatabaseHost() === "postgres") {
      return "DATABASE_URL host is set to postgres, which only works when the app runs inside the same Docker Compose network. Use 127.0.0.1 for same-server PostgreSQL, or the database host from your hosting panel.";
    }

    if (process.env.NODE_ENV === "production" && usesLocalDatabaseHost()) {
      return "Database is not reachable from the live server. Update DATABASE_URL to the live PostgreSQL host, or run PostgreSQL on the same server.";
    }

    return "Database connection failed. Please check the server database configuration.";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("Prisma database request failed:", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "P2021" || error.code === "P2022") {
      return "Database tables are missing. Run the Prisma database setup on the server.";
    }

    return "Database error. Ensure the server database is configured and migrated.";
  }

  return null;
}
