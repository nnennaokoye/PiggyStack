import { ethers } from "hardhat";

async function main() {
  const [owner, user1] = await ethers.getSigners();
  console.log("Testing StableDEX with account:", user1.address);

  // Deploy StableDEX
  const StableDEX = await ethers.getContractFactory("StableDEX");
  const dex = await StableDEX.deploy();
  await dex.waitForDeployment();
  const dexAddress = await dex.getAddress();
  console.log("StableDEX deployed at:", dexAddress);

  // Deploy test token
  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("TestToken deployed at:", tokenAddress);

  // Add liquidity with ETH
  console.log("\nAdding ETH liquidity...");
  const ethLiquidity = ethers.parseEther("1"); // 1 ETH
  await dex.connect(user1).addLiquidity(ethers.ZeroAddress, { value: ethLiquidity });
  console.log("Added", ethers.formatEther(ethLiquidity), "ETH as liquidity");

  // Add liquidity with test token
  console.log("\nAdding token liquidity...");
  const tokenLiquidity = ethers.parseEther("1000"); // 1000 tokens
  await token.connect(user1).approve(dexAddress, tokenLiquidity);
  await dex.connect(user1).addLiquidity(tokenAddress, { value: ethLiquidity });
  console.log("Added", ethers.formatEther(tokenLiquidity), "tokens as liquidity");

  // Check liquidity
  const ethBalance = await ethers.provider.getBalance(dexAddress);
  console.log("\nDEX ETH balance:", ethers.formatEther(ethBalance), "ETH");
  const tokenBalance = await token.balanceOf(dexAddress);
  console.log("DEX token balance:", ethers.formatEther(tokenBalance), "tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 