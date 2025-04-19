import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

async function main() {
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("Testing StableDEX with accounts:");
  console.log("- Owner:", owner.address);
  console.log("- User1:", user1.address);
  console.log("- User2:", user2.address);

  // Deploy test tokens
  console.log("\nDeploying test tokens...");
  const TestToken = await ethers.getContractFactory("TestToken");
  
  const tokenA = await TestToken.deploy("Token A", "TKA");
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("Token A deployed at:", tokenAAddress);
  
  const tokenB = await TestToken.deploy("Token B", "TKB");
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("Token B deployed at:", tokenBAddress);

  // Deploy StableDEX
  console.log("\nDeploying StableDEX...");
  const StableDEX = await ethers.getContractFactory("StableDEX");
  const dex = await StableDEX.deploy();
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("StableDEX deployed at:", dexAddress);

  // Add supported tokens
  console.log("\nAdding supported tokens...");
  await dex.addSupportedToken(tokenAAddress);
  await dex.addSupportedToken(tokenBAddress);
  console.log("Tokens added to DEX");

  // Mint tokens to users
  const mintAmount = ethers.parseEther("1000");
  await tokenA.mint(user1.address, mintAmount);
  await tokenA.mint(user2.address, mintAmount);
  await tokenB.mint(user1.address, mintAmount);
  await tokenB.mint(user2.address, mintAmount);
  console.log("\nTokens minted to users");

  // Add initial liquidity
  console.log("\nAdding initial liquidity...");
  const liquidityAmount = ethers.parseEther("100");
  await tokenA.connect(user1).approve(dexAddress, liquidityAmount);
  await tokenB.connect(user1).approve(dexAddress, liquidityAmount);
  
  await dex.connect(user1).addLiquidity(tokenAAddress, liquidityAmount);
  await dex.connect(user1).addLiquidity(tokenBAddress, liquidityAmount);
  console.log("Initial liquidity added");

  // Test ETH to token swap
  console.log("\nTesting ETH to Token A swap...");
  const ethAmount = ethers.parseEther("1");
  await dex.connect(user2).swapExactETHForTokens(
    tokenAAddress,
    0, // Min output amount (0 for testing)
    { value: ethAmount }
  );
  console.log("Swapped 1 ETH for Token A");
  console.log("User2 Token A balance:", ethers.formatEther(await tokenA.balanceOf(user2.address)));

  // Test token to ETH swap
  console.log("\nTesting Token B to ETH swap...");
  const tokenAmount = ethers.parseEther("1");
  await tokenB.connect(user2).approve(dexAddress, tokenAmount);
  await dex.connect(user2).swapExactTokensForETH(
    tokenBAddress,
    tokenAmount,
    0 // Min output amount (0 for testing)
  );
  console.log("Swapped 1 Token B for ETH");

  // Test token to token swap
  console.log("\nTesting Token A to Token B swap...");
  await tokenA.connect(user2).approve(dexAddress, tokenAmount);
  await dex.connect(user2).swapExactTokensForTokens(
    tokenAAddress,
    tokenBAddress,
    tokenAmount,
    0 // Min output amount (0 for testing)
  );
  console.log("Swapped 1 Token A for Token B");
  console.log("User2 Token B balance:", ethers.formatEther(await tokenB.balanceOf(user2.address)));

  // Test admin functions
  console.log("\nTesting admin functions...");
  
  // Set swap fee
  const newFee = 30; // 0.3%
  await dex.setSwapFee(newFee);
  console.log("Swap fee set to 0.3%");

  // Test pause/unpause
  await dex.pause();
  console.log("DEX paused");
  
  await dex.unpause();
  console.log("DEX unpaused");

  // Remove liquidity
  console.log("\nTesting liquidity removal...");
  await dex.connect(user1).removeLiquidity(tokenAAddress, liquidityAmount);
  console.log("Liquidity removed for Token A");

  return { dexAddress, tokenAAddress, tokenBAddress };
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