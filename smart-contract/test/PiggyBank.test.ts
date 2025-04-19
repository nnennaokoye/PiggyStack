import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  PiggyBankFactory,
  GroupPiggyBank,
  PiggyBank,
  TestToken
} from "../typechain-types";
import { Contract } from "ethers";

describe("PiggyBank System", function () {
  let TestToken: any;
  let testToken: Contract;
  let PiggyBankFactory: any;
  let factory: Contract;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;
  let addrs: any[];

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // Deploy TestToken
    TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy();

    // Deploy Factory
    PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    factory = await PiggyBankFactory.deploy();
  });

  describe("PiggyBankFactory", function () {
    it("Should deploy with ETH whitelisted", async function () {
      expect(await factory.whitelistedTokens(ethers.ZeroAddress)).to.equal(ethers.MaxUint256);
    });

    it("Should whitelist tokens correctly", async function () {
      const maxAmount = ethers.parseEther("1000");
      await factory.whitelistToken(await testToken.getAddress(), maxAmount);
      expect(await factory.whitelistedTokens(await testToken.getAddress())).to.equal(maxAmount);
    });

    it("Should create individual piggy bank", async function () {
      const targetAmount = ethers.parseEther("1");
      const lockDuration = 7 * 24 * 60 * 60; // 1 week

      await factory.createIndividualPiggy(
        ethers.ZeroAddress,
        targetAmount,
        lockDuration
      );

      const piggyAddress = await factory.getLastDeployedPiggy();
      expect(await factory.isPiggyBank(piggyAddress)).to.be.true;
    });
  });

  describe("Individual PiggyBank", function () {
    let piggyBank: Contract;
    const targetAmount = ethers.parseEther("1");
    const lockDuration = 7 * 24 * 60 * 60; // 1 week

    beforeEach(async function () {
      await factory.createIndividualPiggy(
        ethers.ZeroAddress,
        targetAmount,
        lockDuration
      );

      const piggyAddress = await factory.getLastDeployedPiggy();
      piggyBank = await ethers.getContractAt("PiggyBank", piggyAddress);
    });

    it("Should accept deposits", async function () {
      const depositAmount = ethers.parseEther("0.5");
      await piggyBank.deposit({ value: depositAmount });
      expect(await ethers.provider.getBalance(piggyBank.getAddress())).to.equal(depositAmount);
    });

    it("Should not allow withdrawals before lock period", async function () {
      const depositAmount = ethers.parseEther("0.5");
      await piggyBank.deposit({ value: depositAmount });
      await expect(piggyBank.withdraw()).to.be.revertedWith("Lock period active");
    });
  });

  describe("GroupPiggy", function () {
    let groupPiggy: Contract;
    const targetAmount = ethers.parseEther("1");
    const lockDuration = 24 * 60 * 60; // 1 day

    beforeEach(async function () {
      const participants = [addr1.address, addr2.address, addr3.address];
      const requiredApprovals = 2;

      await factory.createGroupPiggy(
        ethers.ZeroAddress,
        targetAmount,
        lockDuration,
        participants,
        requiredApprovals
      );

      const groupPiggyAddress = await factory.getLastDeployedPiggy();
      groupPiggy = await ethers.getContractAt("GroupPiggyBank", groupPiggyAddress);
    });

    it("Should accept deposits from participants", async function () {
      const depositAmount = ethers.parseEther("0.5");
      await groupPiggy.connect(addr1).deposit(depositAmount, { value: depositAmount });
      await groupPiggy.connect(addr2).deposit(depositAmount, { value: depositAmount });
      expect(await ethers.provider.getBalance(groupPiggy.getAddress())).to.equal(depositAmount * BigInt(2));
    });

    it("Should require multiple approvals for withdrawal", async function () {
      const depositAmount = ethers.parseEther("0.5");
      await groupPiggy.connect(addr1).deposit(depositAmount, { value: depositAmount });
      await groupPiggy.connect(addr2).deposit(depositAmount, { value: depositAmount });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Propose withdrawal
      await groupPiggy.connect(addr1).proposeWithdrawal(false);

      // First approval
      await groupPiggy.connect(addr1).approveWithdrawal();
      await expect(groupPiggy.connect(addr1).withdraw()).to.be.revertedWith("Insufficient approvals");

      // Second approval and withdrawal
      await groupPiggy.connect(addr2).approveWithdrawal();
      await expect(groupPiggy.connect(addr1).withdraw()).not.to.be.reverted;
    });
  });
}); 