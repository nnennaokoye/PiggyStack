import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  const [owner, user1] = await ethers.getSigners();
  console.log("Creating individual PiggyBank with account:", user1.address);

  // Deploy a new factory since we're on hardhat network
  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed at:", factoryAddress);
  
  // Create an individual PiggyBank
  console.log("\nCreating PiggyBank...");
  const lockDuration = time.duration.days(30); // 30 days
  const targetAmount = ethers.parseEther("1"); // 1 ETH
  
  const tx = await factory.connect(user1).createIndividualPiggy(
    ethers.ZeroAddress, // Using ETH
    targetAmount,
    lockDuration
  );
  const receipt = await tx.wait();
  
  // Get the PiggyBank address from the event logs
  const factoryInterface = PiggyBankFactory.interface;
  const log = receipt?.logs.find(log => {
    try {
      const parsed = factoryInterface.parseLog(log);
      return parsed?.name === "PiggyBankCreated";
    } catch {
      return false;
    }
  });
  
  if (!log) throw new Error("Failed to find PiggyBankCreated event");
  const parsedLog = factoryInterface.parseLog(log);
  const piggyBankAddress = parsedLog?.args[0];
  
  console.log("PiggyBank created at:", piggyBankAddress);
  
  // Get the PiggyBank contract
  const piggyBank = await ethers.getContractAt("PiggyBank", piggyBankAddress);
  
  // Make a deposit
  console.log("\nMaking deposit...");
  const depositAmount = ethers.parseEther("0.5"); // 0.5 ETH
  await piggyBank.connect(user1).deposit({ value: depositAmount });
  
  // Check progress
  const [currentAmount, targetAmt] = await piggyBank.getProgress();
  console.log("Current amount:", ethers.formatEther(currentAmount), "ETH");
  console.log("Target amount:", ethers.formatEther(targetAmt), "ETH");

  // Test emergency withdrawal
  console.log("\nTesting emergency withdrawal...");
  const balanceBefore = await ethers.provider.getBalance(user1.address);
  console.log("Balance before emergency withdrawal:", ethers.formatEther(balanceBefore), "ETH");

  // Perform emergency withdrawal
  const emergencyTx = await piggyBank.connect(user1).emergencyWithdraw();
  await emergencyTx.wait();

  const balanceAfter = await ethers.provider.getBalance(user1.address);
  console.log("Balance after emergency withdrawal:", ethers.formatEther(balanceAfter), "ETH");

  // Verify the PiggyBank is empty
  const [finalAmount] = await piggyBank.getProgress();
  console.log("Final PiggyBank balance:", ethers.formatEther(finalAmount), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 