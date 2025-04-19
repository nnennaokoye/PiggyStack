import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function updateEnvFile(addresses: { [key: string]: string }) {
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = "";

  try {
    envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  } catch (error) {
    console.error("Error reading .env file:", error);
  }

  // Update or add addresses
  for (const [key, value] of Object.entries(addresses)) {
    const addressLine = `${key}=${value}`;
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(new RegExp(`${key}=.*\\n?`), addressLine + "\n");
    } else {
      envContent += envContent.endsWith("\n") ? addressLine + "\n" : "\n" + addressLine + "\n";
    }
  }

  try {
    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env file with addresses");
  } catch (error) {
    console.error("Error writing to .env file:", error);
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy TestToken
  console.log("\nDeploying TestToken...");
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("TestToken deployed to:", testTokenAddress);

  // Deploy PiggyBankFactory
  console.log("\nDeploying PiggyBankFactory...");
  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("PiggyBankFactory deployed to:", factoryAddress);

  // Deploy StableDEX
  console.log("\nDeploying StableDEX...");
  const StableDEX = await ethers.getContractFactory("StableDEX");
  const dex = await StableDEX.deploy();
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("StableDEX deployed to:", dexAddress);

  // Initialize contracts
  console.log("\nInitializing contracts...");

  // Whitelist TestToken in PiggyBankFactory
  const maxAmount = ethers.parseEther("1000000"); // 1M tokens
  await factory.whitelistToken(testTokenAddress, maxAmount);
  console.log("TestToken whitelisted in PiggyBankFactory");

  // Add TestToken to StableDEX
  await dex.addSupportedToken(testTokenAddress);
  console.log("TestToken added to StableDEX");

  // Save addresses to .env
  await updateEnvFile({
    FACTORY_ADDRESS: factoryAddress,
    TEST_TOKEN_ADDRESS: testTokenAddress,
    DEX_ADDRESS: dexAddress
  });

  // Return the addresses
  return { factoryAddress, testTokenAddress, dexAddress };
}

// Export the main function
export { main };

// Only run if this script is run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}