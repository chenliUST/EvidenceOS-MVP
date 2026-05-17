import { expect, test } from "@playwright/test";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { spawn } from "node:child_process";
import { join } from "node:path";

let server: ChildProcessWithoutNullStreams | undefined;

test.beforeAll(async () => {
  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  server = spawn(process.execPath, [nextCli, "dev", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  let log = "";
  server.stdout.on("data", (chunk) => {
    log += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    log += chunk.toString();
  });

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next dev server exited early.\n${log}`);
    }
    try {
      const response = await fetch("http://localhost:3000");
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until Next finishes compiling.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Next dev server did not become ready.\n${log}`);
});

test.afterAll(async () => {
  if (!server || server.exitCode !== null) {
    return;
  }

  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 2_000);
    server?.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    server?.kill();
  });
});

test("creates an Investor case and opens the workspace", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Case Title").fill("Acme AI Seed");
  await page.getByLabel("Mode").selectOption("investor");
  await page.getByRole("button", { name: "Create Case" }).click();

  await expect(page.getByRole("heading", { name: "Acme AI Seed" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Investor Mode")).toBeVisible({ timeout: 20_000 });
});
