import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  const [owner, user1, user2, user3] = await ethers.getSigners();
  console.log("Creating group PiggyBank with participants:");
  console.log("- User1:", user1.address);
  console.log("- User2:", user2.address);
  console.log("- User3:", user3.address);

  // Deploy TestToken
  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy("Test Token", "TST");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("\nTestToken deployed at:", tokenAddress);

  // Deploy PiggyBankFactory
  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed at:", factoryAddress);
  
  // Whitelist the token
  await factory.whitelistToken(tokenAddress, ethers.parseEther("1000000"));
  console.log("Token whitelisted in factory");
  
  // Mint some tokens to participants
  const mintAmount = ethers.parseEther("10");
  await token.mint(user1.address, mintAmount);
  await token.mint(user2.address, mintAmount);
  await token.mint(user3.address, mintAmount);
  console.log("\nTokens minted to participants");
  
  // Create a group PiggyBank
  console.log("\nCreating Group PiggyBank...");
  const participants = [user1.address, user2.address, user3.address];
  const requiredApprovals = 2; // Need 2 out of 3 approvals
  const lockDuration = time.duration.days(30);
  const targetAmount = ethers.parseEther("3"); // 3 tokens
  
  const tx = await factory.connect(user1).createGroupPiggy(
    "Test Group",
    participants,
    requiredApprovals,
    tokenAddress,
    targetAmount,
    lockDuration
  );
  const receipt = await tx.wait();
  
  // Get the GroupPiggyBank address from the event logs
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
  const groupPiggyAddress = parsedLog?.args[0];
  console.log("GroupPiggyBank created at:", groupPiggyAddress);
  
  // Get the GroupPiggyBank contract
  const groupPiggy = await ethers.getContractAt("GroupPiggyBank", groupPiggyAddress);
  
  // Approve token spending
  console.log("\nApproving token spending...");
  await token.connect(user1).approve(groupPiggyAddress, ethers.parseEther("1"));
  await token.connect(user2).approve(groupPiggyAddress, ethers.parseEther("1"));
  await token.connect(user3).approve(groupPiggyAddress, ethers.parseEther("1"));
  
  // Make deposits
  console.log("\nMaking deposits...");
  await groupPiggy.connect(user1).depositToken(ethers.parseEther("1"));
  await groupPiggy.connect(user2).depositToken(ethers.parseEther("1"));
  await groupPiggy.connect(user3).depositToken(ethers.parseEther("1"));
  
  // Check progress
  const [currentAmount, targetAmt] = await groupPiggy.getProgress();
  console.log("Current amount:", ethers.formatEther(currentAmount), "tokens");
  console.log("Target amount:", ethers.formatEther(targetAmt), "tokens");
  
  // Advance time
  console.log("\nAdvancing time by 31 days...");
  await time.increase(time.duration.days(31));
  
  // Propose and approve withdrawal
  console.log("\nProposing withdrawal...");
  await groupPiggy.connect(user1).proposeWithdrawal();
  
  console.log("User1 approving withdrawal...");
  await groupPiggy.connect(user1).approveWithdrawal();
  
  console.log("User2 approving withdrawal...");
  await groupPiggy.connect(user2).approveWithdrawal();
  
  // Check final balance
  const [finalAmount] = await groupPiggy.getProgress();
  console.log("\nFinal amount:", ethers.formatEther(finalAmount), "tokens");
  
  // Check participants' token balances
  console.log("\nFinal token balances:");
  console.log("User1:", ethers.formatEther(await token.balanceOf(user1.address)));
  console.log("User2:", ethers.formatEther(await token.balanceOf(user2.address)));
  console.log("User3:", ethers.formatEther(await token.balanceOf(user3.address)));

  return { groupPiggyAddress, tokenAddress, factoryAddress };
}

// Export the main function
export { main };

// Only run if this script is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} 