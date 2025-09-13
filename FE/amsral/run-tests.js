#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");

console.log("🧪 Running AMSRAL Test Suite...\n");

try {
  // Install dependencies if node_modules doesn't exist
  console.log("📦 Checking dependencies...");
  execSync("npm install", { stdio: "inherit" });

  // Run tests
  console.log("\n🚀 Running tests...");
  execSync("npm run test:run", { stdio: "inherit" });

  console.log("\n✅ All tests completed successfully!");
} catch (error) {
  console.error("\n❌ Test execution failed:", error.message);
  process.exit(1);
}
