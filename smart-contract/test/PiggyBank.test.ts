import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  PiggyBankFactory,
  GroupPiggy,
  PiggyBank,
  TestToken
} from "../typechain-types";

describe("PiggyBank System", function () {
  let PiggyBankFactory;
  let TestToken;
  let factory: PiggyBankFactory;
  let token: TestToken;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let addrs: SignerWithAddress[];

  beforeEach(async function () {
    // Deploy test ERC20 token
    TestToken = await ethers.getContractFactory("TestToken");
    token = await TestToken.deploy("Test Token", "TST");
    await token.waitForDeployment();

    // Deploy factory
    PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
    factory = await PiggyBankFactory.deploy();
    await factory.waitForDeployment();

    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // Whitelist token
    await factory.whitelistToken(await token.getAddress(), ethers.parseEther("1000000"));
  });

  describe("PiggyBankFactory", function () {
    it("Should deploy with ETH whitelisted", async function () {
      expect(await factory.isValidToken(ethers.ZeroAddress)).to.be.true;
    });

    it("Should whitelist tokens correctly", async function () {
      const tokenAddress = await token.getAddress();
      expect(await factory.isValidToken(tokenAddress)).to.be.true;
    });

    it("Should create individual piggy bank", async function () {
      const tx = await factory.createIndividualPiggy(
        ethers.ZeroAddress,
        ethers.parseEther("1"),
        6
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(x => x.fragment && x.fragment.name === "PiggyBankCreated");
      expect(event).to.not.be.undefined;
    });
  });

  describe("Individual PiggyBank", function () {
    let piggyBank: PiggyBank;
    let piggyBankAddress: string;

    beforeEach(async function () {
      const tx = await factory.connect(addr1).createIndividualPiggy(
        ethers.ZeroAddress,
        ethers.parseEther("1"),
        6
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(x => x.fragment && x.fragment.name === "PiggyBankCreated");
      piggyBankAddress = event!.args![1];
      piggyBank = await ethers.getContractAt("PiggyBank", piggyBankAddress) as PiggyBank;
    });

    it("Should accept deposits", async function () {
      await piggyBank.connect(addr1).deposit({ value: ethers.parseEther("0.1") });
      const [currentAmount, targetAmount] = await piggyBank.getProgress();
      expect(currentAmount).to.equal(ethers.parseEther("0.1"));
    });

    it("Should not allow withdrawals before lock period", async function () {
      await piggyBank.connect(addr1).deposit({ value: ethers.parseEther("0.1") });
      // Try to withdraw as addr1 (the owner)
      await expect(
        piggyBank.connect(addr1).withdraw(ethers.parseEther("0.1"))
      ).to.be.revertedWith("Still locked");
    });
  });

  describe("GroupPiggy", function () {
    let groupPiggy: GroupPiggy;
    let participants: string[];

    beforeEach(async function () {
      participants = [addr1.address, addr2.address, addr3.address];
      const tx = await factory.connect(addr1).createGroupPiggy(
        "Test Group",
        participants,
        2, // Required signatures
        await token.getAddress(), // Using ERC20 token instead of ETH
        ethers.parseEther("1"),
        6
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(x => x.fragment && x.fragment.name === "PiggyBankCreated");
      const groupPiggyAddress = event!.args![1];
      groupPiggy = await ethers.getContractAt("GroupPiggy", groupPiggyAddress) as GroupPiggy;

      // Mint tokens to addr1 and approve spending
      await token.mint(addr1.address, ethers.parseEther("1"));
      await token.connect(addr1).approve(groupPiggyAddress, ethers.parseEther("1"));
    });

    it("Should accept deposits from participants", async function () {
      await groupPiggy.connect(addr1).depositToken(ethers.parseEther("0.1"));
      const [contribution, isActive, hasApproved] = await groupPiggy.getParticipantInfo(addr1.address);
      expect(contribution).to.equal(ethers.parseEther("0.1"));
    });

    it("Should require multiple approvals for withdrawal", async function () {
      await groupPiggy.connect(addr1).depositToken(ethers.parseEther("0.3"));
      
      // Advance time past lock period
      await time.increase(time.duration.days(180));

      // Request withdrawal
      await groupPiggy.connect(addr1).requestWithdrawal(ethers.parseEther("0.1"));
      
      // First approval (from requester) is automatic
      // Second approval
      await groupPiggy.connect(addr2).approveWithdrawal(0);
      
      const [requester, amount, approvals, executed] = await groupPiggy.getWithdrawalRequest(0);
      expect(executed).to.be.true;
    });
  });
}); 