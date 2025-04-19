import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("GroupPiggyBank", function () {
    let TestToken: any;
    let testToken: Contract;
    let PiggyBankFactory: any;
    let factory: Contract;
    let GroupPiggyBank: any;
    let groupPiggy: Contract;
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

        // Whitelist token
        await factory.whitelistToken(testToken.getAddress(), ethers.parseEther("1000"));

        // Create Group PiggyBank
        const participants = [addr1.address, addr2.address, addr3.address];
        const targetAmount = ethers.parseEther("100");
        const lockDuration = 7 * 24 * 60 * 60; // 1 week
        const requiredApprovals = 2;

        await factory.createGroupPiggy(
            testToken.getAddress(),
            targetAmount,
            lockDuration,
            participants,
            requiredApprovals
        );

        const groupPiggyAddress = await factory.getLastDeployedPiggy();
        groupPiggy = await ethers.getContractAt("GroupPiggyBank", groupPiggyAddress);

        // Mint tokens to participants
        await testToken.mint(addr1.address, ethers.parseEther("100"));
        await testToken.mint(addr2.address, ethers.parseEther("100"));
        await testToken.mint(addr3.address, ethers.parseEther("100"));

        // Approve tokens
        await testToken.connect(addr1).approve(groupPiggyAddress, ethers.parseEther("100"));
        await testToken.connect(addr2).approve(groupPiggyAddress, ethers.parseEther("100"));
        await testToken.connect(addr3).approve(groupPiggyAddress, ethers.parseEther("100"));
    });

    describe("Emergency Withdrawal", function () {
        beforeEach(async function () {
            // Make deposits
            await groupPiggy.connect(addr1).deposit(ethers.parseEther("50"));
            await groupPiggy.connect(addr2).deposit(ethers.parseEther("30"));
            await groupPiggy.connect(addr3).deposit(ethers.parseEther("20"));
        });

        it("Should allow emergency withdrawal with penalty", async function () {
            // Propose emergency withdrawal
            await groupPiggy.connect(addr1).proposeWithdrawal(true);

            // Get approvals
            await groupPiggy.connect(addr1).approveWithdrawal();
            await groupPiggy.connect(addr2).approveWithdrawal();

            // Check balances before withdrawal
            const addr1BalanceBefore = await testToken.balanceOf(addr1.address);
            const addr2BalanceBefore = await testToken.balanceOf(addr2.address);
            const addr3BalanceBefore = await testToken.balanceOf(addr3.address);

            // Execute withdrawal
            await groupPiggy.connect(addr1).withdraw();

            // Calculate expected amounts (10% penalty)
            const totalAmount = ethers.parseEther("100");
            const penalty = totalAmount * BigInt(10) / BigInt(100);
            const remainingAmount = totalAmount - penalty;

            // Check balances after withdrawal
            const addr1BalanceAfter = await testToken.balanceOf(addr1.address);
            const addr2BalanceAfter = await testToken.balanceOf(addr2.address);
            const addr3BalanceAfter = await testToken.balanceOf(addr3.address);

            // Verify each participant got their share minus penalty
            expect(addr1BalanceAfter - addr1BalanceBefore).to.equal(
                (remainingAmount * BigInt(50)) / BigInt(100)
            );
            expect(addr2BalanceAfter - addr2BalanceBefore).to.equal(
                (remainingAmount * BigInt(30)) / BigInt(100)
            );
            expect(addr3BalanceAfter - addr3BalanceBefore).to.equal(
                (remainingAmount * BigInt(20)) / BigInt(100)
            );
        });

        it("Should require multiple approvals for emergency withdrawal", async function () {
            await groupPiggy.connect(addr1).proposeWithdrawal(true);
            await groupPiggy.connect(addr1).approveWithdrawal();

            // Should fail with only one approval
            await expect(
                groupPiggy.connect(addr1).withdraw()
            ).to.be.revertedWith("Insufficient approvals");

            // Should succeed with required approvals
            await groupPiggy.connect(addr2).approveWithdrawal();
            await expect(
                groupPiggy.connect(addr1).withdraw()
            ).not.to.be.reverted;
        });

        it("Should not allow emergency withdrawal without proposal", async function () {
            await expect(
                groupPiggy.connect(addr1).withdraw()
            ).to.be.revertedWith("No withdrawal proposed");
        });
    });
}); 