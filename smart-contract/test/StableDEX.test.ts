import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("StableDEX", function () {
  let StableDEX: ContractFactory;
  let MockToken: ContractFactory;
  let dex: Contract;
  let usdc: Contract;
  let usdt: Contract;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const INITIAL_LIQUIDITY = ethers.parseEther("1000");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock tokens
    MockToken = await ethers.getContractFactory("MockERC20");
    usdc = await MockToken.deploy("USD Coin", "USDC", INITIAL_SUPPLY);
    usdt = await MockToken.deploy("Tether", "USDT", INITIAL_SUPPLY);
    await usdc.waitForDeployment();
    await usdt.waitForDeployment();

    // Deploy DEX
    StableDEX = await ethers.getContractFactory("StableDEX");
    dex = await StableDEX.deploy();
    await dex.waitForDeployment();

    // Setup initial token distribution
    await usdc.transfer(user1.address, ethers.parseEther("10000"));
    await usdt.transfer(user1.address, ethers.parseEther("10000"));
    await usdc.transfer(user2.address, ethers.parseEther("10000"));
    await usdt.transfer(user2.address, ethers.parseEther("10000"));

    // Approve DEX to spend tokens
    await usdc.approve(dex.getAddress(), INITIAL_SUPPLY);
    await usdt.approve(dex.getAddress(), INITIAL_SUPPLY);
    await usdc.connect(user1).approve(dex.getAddress(), INITIAL_SUPPLY);
    await usdt.connect(user1).approve(dex.getAddress(), INITIAL_SUPPLY);
    await usdc.connect(user2).approve(dex.getAddress(), INITIAL_SUPPLY);
    await usdt.connect(user2).approve(dex.getAddress(), INITIAL_SUPPLY);
  });

  describe("Deployment & Setup", function () {
    it("Should deploy with correct owner", async function () {
      expect(await dex.owner()).to.equal(owner.address);
    });

    it("Should add supported tokens", async function () {
      await dex.addSupportedToken(await usdc.getAddress());
      await dex.addSupportedToken(await usdt.getAddress());
      
      const tokens = await dex.getTokens();
      expect(tokens).to.include(await usdc.getAddress());
      expect(tokens).to.include(await usdt.getAddress());
    });

    it("Should not allow non-owner to add tokens", async function () {
      await expect(
        dex.connect(user1).addSupportedToken(await usdc.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Liquidity Management", function () {
    beforeEach(async function () {
      await dex.addSupportedToken(await usdc.getAddress());
      await dex.addSupportedToken(await usdt.getAddress());
    });

    it("Should add initial liquidity", async function () {
      await dex.addLiquidity(await usdc.getAddress(), { value: INITIAL_LIQUIDITY });
      
      const liquidity = await dex.getLiquidity(await usdc.getAddress(), owner.address);
      expect(liquidity).to.equal(INITIAL_LIQUIDITY);
    });

    it("Should fail to add liquidity for unsupported token", async function () {
      const randomAddress = ethers.Wallet.createRandom().address;
      await expect(
        dex.addLiquidity(randomAddress, { value: INITIAL_LIQUIDITY })
      ).to.be.revertedWith("Token not supported");
    });

    it("Should remove liquidity correctly", async function () {
      await dex.addLiquidity(await usdc.getAddress(), { value: INITIAL_LIQUIDITY });
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await dex.removeLiquidity(await usdc.getAddress(), INITIAL_LIQUIDITY);
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Swapping", function () {
    beforeEach(async function () {
      await dex.addSupportedToken(await usdc.getAddress());
      await dex.addSupportedToken(await usdt.getAddress());
      await dex.addLiquidity(await usdc.getAddress(), { value: INITIAL_LIQUIDITY });
      await dex.addLiquidity(await usdt.getAddress(), { value: INITIAL_LIQUIDITY });
    });

    it("Should swap ETH for tokens", async function () {
      const swapAmount = ethers.parseEther("1");
      const initialBalance = await usdc.balanceOf(user1.address);
      
      await dex.connect(user1).swapExactETHForTokens(await usdc.getAddress(), { value: swapAmount });
      
      const finalBalance = await usdc.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should swap tokens for ETH", async function () {
      const swapAmount = ethers.parseEther("1");
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await dex.connect(user1).swapExactTokensForETH(await usdc.getAddress(), swapAmount);
      
      const finalBalance = await ethers.provider.getBalance(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should swap between tokens", async function () {
      const swapAmount = ethers.parseEther("1");
      const initialBalance = await usdt.balanceOf(user1.address);
      
      await dex.connect(user1).swapExactTokensForTokens(
        await usdc.getAddress(),
        await usdt.getAddress(),
        swapAmount
      );
      
      const finalBalance = await usdt.balanceOf(user1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Admin Functions", function () {
    it("Should set swap fee", async function () {
      await dex.setSwapFee(5); // 0.5%
      expect(await dex.swapFee()).to.equal(5);
    });

    it("Should not allow setting fee above maximum", async function () {
      await expect(dex.setSwapFee(51)).to.be.revertedWith("Fee too high");
    });

    it("Should pause and unpause", async function () {
      // Add token support first
      await dex.addSupportedToken(await usdc.getAddress());
      
      await dex.pause();
      await expect(
        dex.addLiquidity(await usdc.getAddress(), { value: INITIAL_LIQUIDITY })
      ).to.be.revertedWith("Pausable: paused");

      await dex.unpause();
      await expect(
        dex.addLiquidity(await usdc.getAddress(), { value: INITIAL_LIQUIDITY })
      ).to.not.be.reverted;
    });

    it("Should allow emergency withdrawal", async function () {
      await dex.addSupportedToken(await usdc.getAddress());
      await dex.addLiquidity(await usdc.getAddress(), { value: INITIAL_LIQUIDITY });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      await dex.emergencyWithdraw(ethers.ZeroAddress);
      const finalBalance = await ethers.provider.getBalance(owner.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Price Calculation", function () {
    it("Should calculate swap output correctly", async function () {
      const amountIn = ethers.parseEther("1");
      const reserveIn = ethers.parseEther("100");
      const reserveOut = ethers.parseEther("100");
      
      const output = await dex.calculateSwapOutput(amountIn, reserveIn, reserveOut);
      expect(output).to.be.gt(0);
    });

    it("Should fail with zero input amount", async function () {
      await expect(
        dex.calculateSwapOutput(0, 100, 100)
      ).to.be.revertedWith("Invalid input amount");
    });

    it("Should fail with zero reserves", async function () {
      await expect(
        dex.calculateSwapOutput(100, 0, 100)
      ).to.be.revertedWith("Invalid reserves");
    });
  });
}); 