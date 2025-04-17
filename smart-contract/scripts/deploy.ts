import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy PiggyBankFactory
  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("PiggyBankFactory deployed to:", factoryAddress);

  // Create an individual PiggyBank for testing
  const lockDuration = process.env.LOCK_DURATION || "2592000"; // 30 days in seconds
  const targetAmount = process.env.TARGET_AMOUNT || "1000000000000000000"; // 1 ETH in wei

  const tx = await factory.createIndividualPiggyBank(
    ethers.ZeroAddress, // Using ETH
    targetAmount,
    lockDuration
  );
  const receipt = await tx.wait();

  // Get the PiggyBank address from the event
  const event = receipt?.logs.find(
    (log: any) => log.eventName === "PiggyBankCreated"
  );
  
  if (event) {
    const [piggyBankAddress] = event.args;
    console.log("Individual PiggyBank deployed to:", piggyBankAddress);
  }

  // Verify contracts on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Verifying contracts on Etherscan...");
    try {
      await run("verify:verify", {
        address: factoryAddress,
        constructorArguments: []
      });
      console.log("Factory contract verified on Etherscan");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 