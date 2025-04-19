import { ethers } from "hardhat";
import { execSync } from "child_process";
import { main as deployMain } from "./deploy";
import { main as individualMain } from "./individual-piggy";
import { main as groupMain } from "./group-piggy";
import { main as dexMain } from "./test-dex";

async function main() {
  console.log("Running complete test suite for PiggyBank system...\n");

  // Run the test suite
  console.log("1. Running contract tests...");
  try {
    execSync("npx hardhat test", { stdio: "inherit" });
  } catch (error) {
    console.error("Tests failed!");
    process.exit(1);
  }

  // Deploy contracts
  console.log("\n2. Deploying contracts...");
  const { factoryAddress, tokenAddress } = await deployMain();

  // Test individual PiggyBank
  console.log("\n3. Testing individual PiggyBank...");
  await individualMain();
  console.log("Individual PiggyBank test completed");

  // Test group PiggyBank
  console.log("\n4. Testing group PiggyBank...");
  await groupMain();
  console.log("Group PiggyBank test completed");

  // Test DEX functionality
  console.log("\n5. Testing StableDEX...");
  const { dexAddress, tokenAAddress, tokenBAddress } = await dexMain();
  console.log("StableDEX test completed");

  console.log("\nAll tests and interactions completed successfully!");
  console.log("\nDeployed contract addresses:");
  console.log("- Factory:", factoryAddress);
  console.log("- Token:", tokenAddress);
  console.log("- DEX:", dexAddress);
  console.log("- Token A:", tokenAAddress);
  console.log("- Token B:", tokenBAddress);
}

// Only run if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} 