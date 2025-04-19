import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("Interacting with contracts using account:", owner.address);

  // Get deployed contract instances
  const TestToken = await ethers.getContractFactory("TestToken");
  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const StableDEX = await ethers.getContractFactory("StableDEX");

  const testToken = TestToken.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const factory = PiggyBankFactory.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  const dex = StableDEX.attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");

  console.log("\n1. Testing Individual PiggyBank");
  console.log("--------------------------------");
  
  // Create individual PiggyBank
  const targetAmount = ethers.parseEther("1");
  const lockDuration = 7 * 24 * 60 * 60; // 7 days
  console.log("Creating individual PiggyBank...");
  const tx1 = await factory.createIndividualPiggy(
    await testToken.getAddress(),
    targetAmount,
    lockDuration
  );
  const receipt1 = await tx1.wait();
  const piggyBankAddress = receipt1?.logs[0].args?.piggyBank;
  console.log("Individual PiggyBank created at:", piggyBankAddress);

  // Mint and approve tokens
  console.log("\nMinting tokens to user...");
  await testToken.mint(user1.address, targetAmount);
  await testToken.connect(user1).approve(piggyBankAddress, targetAmount);

  // Deposit into PiggyBank
  const PiggyBank = await ethers.getContractFactory("PiggyBank");
  const piggyBank = PiggyBank.attach(piggyBankAddress);
  console.log("Depositing tokens...");
  await piggyBank.connect(user1).depositToken(targetAmount);
  console.log("Deposit successful");

  console.log("\n2. Testing Group PiggyBank");
  console.log("---------------------------");
  
  // Create group PiggyBank
  const participants = [user1.address, user2.address];
  const groupTargetAmount = ethers.parseEther("2");
  console.log("Creating group PiggyBank...");
  const tx2 = await factory.createGroupPiggy(
    await testToken.getAddress(),
    groupTargetAmount,
    lockDuration,
    participants,
    2 // Required approvals
  );
  const receipt2 = await tx2.wait();
  const groupPiggyAddress = receipt2?.logs[0].args?.piggyBank;
  console.log("Group PiggyBank created at:", groupPiggyAddress);

  // Mint and approve tokens for both users
  const userAmount = groupTargetAmount / BigInt(2);
  console.log("\nMinting tokens to participants...");
  await testToken.mint(user1.address, userAmount);
  await testToken.mint(user2.address, userAmount);
  await testToken.connect(user1).approve(groupPiggyAddress, userAmount);
  await testToken.connect(user2).approve(groupPiggyAddress, userAmount);

  // Deposit from both users
  const GroupPiggyBank = await ethers.getContractFactory("GroupPiggyBank");
  const groupPiggy = GroupPiggyBank.attach(groupPiggyAddress);
  console.log("Participants depositing tokens...");
  await groupPiggy.connect(user1).deposit(userAmount);
  await groupPiggy.connect(user2).deposit(userAmount);
  console.log("Group deposits successful");

  // Test group withdrawal process
  console.log("\nTesting group withdrawal process...");
  console.log("1. Proposing withdrawal...");
  await groupPiggy.connect(user1).proposeWithdrawal(true); // Emergency withdrawal
  console.log("2. Approving withdrawal...");
  await groupPiggy.connect(user1).approveWithdrawal();
  await groupPiggy.connect(user2).approveWithdrawal();
  console.log("3. Executing withdrawal...");
  await groupPiggy.connect(user1).withdraw();
  console.log("Group withdrawal successful");

  console.log("\n3. Testing StableDEX");
  console.log("---------------------");

  // Add liquidity to DEX
  const liquidityAmount = ethers.parseEther("10");
  console.log("\nAdding liquidity to DEX...");
  await testToken.mint(owner.address, liquidityAmount);
  await testToken.approve(await dex.getAddress(), liquidityAmount);
  await dex.addLiquidity(await testToken.getAddress(), { value: liquidityAmount });
  console.log("Liquidity added successfully");

  // Perform a swap
  console.log("\nPerforming token swap...");
  const swapAmount = ethers.parseEther("1");
  await dex.swapExactETHForTokens(await testToken.getAddress(), { value: swapAmount });
  console.log("Swap completed successfully");

  console.log("\nInteractions completed successfully!");
}

// Execute the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 