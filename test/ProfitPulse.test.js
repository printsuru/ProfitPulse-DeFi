const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfitPulse", function () {
  let ProfitPulse;
  let profitPulse;
  let MockBUSD;
  let busd;
  let MultiSigWallet;
  let multiSigWallet;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addrs;

  // Constants
  const MIN_DEPOSIT = ethers.parseUnits("10", 18); // 10 BUSD
  const TIER1_DEPOSIT = ethers.parseUnits("400", 18); // $400 (Tier 1)
  const TIER2_DEPOSIT = ethers.parseUnits("800", 18); // $800 (Tier 2)
  const TIER3_DEPOSIT = ethers.parseUnits("1500", 18); // $1500 (Tier 3)
  const TIER4_DEPOSIT = ethers.parseUnits("3000", 18); // $3000 (Tier 4)

  beforeEach(async function () {
    // Deploy mock BUSD token
    MockBUSD = await ethers.getContractFactory("MockBUSD");
    busd = await MockBUSD.deploy();

    // Get signers
    [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

    // Deploy MultiSigWallet with 3 owners and 2 required confirmations
    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy(
      [owner.address, addr1.address, addr2.address],
      2
    );

    // Deploy ProfitPulse
    ProfitPulse = await ethers.getContractFactory("ProfitPulse");
    profitPulse = await ProfitPulse.deploy(
      await busd.getAddress(),
      await multiSigWallet.getAddress()
    );

    // Mint BUSD to test accounts
    await busd.mint(owner.address, ethers.parseUnits("1000000", 18)); // 1M BUSD
    await busd.mint(addr1.address, ethers.parseUnits("10000", 18)); // 10K BUSD
    await busd.mint(addr2.address, ethers.parseUnits("10000", 18)); // 10K BUSD
    await busd.mint(addr3.address, ethers.parseUnits("10000", 18)); // 10K BUSD
    await busd.mint(addr4.address, ethers.parseUnits("10000", 18)); // 10K BUSD

    // Add initial liquidity to the contract
    await busd.connect(owner).approve(profitPulse.getAddress(), ethers.parseUnits("100000", 18));
    
    // Create transaction in multisig to add liquidity
    const addLiquidityData = profitPulse.interface.encodeFunctionData(
      "addLiquidity",
      [ethers.parseUnits("100000", 18)]
    );
    
    await multiSigWallet.connect(owner).submitTransaction(
      await profitPulse.getAddress(),
      0,
      addLiquidityData
    );
    
    // Second confirmation
    await multiSigWallet.connect(addr1).confirmTransaction(0);
  });

  describe("Deployment", function () {
    it("Should set the right BUSD token", async function () {
      expect(await profitPulse.busdToken()).to.equal(await busd.getAddress());
    });

    it("Should set the right owner (multisig wallet)", async function () {
      expect(await profitPulse.owner()).to.equal(await multiSigWallet.getAddress());
    });

    it("Should have the correct initial profit rates", async function () {
      expect(await profitPulse.tier1Rate()).to.equal(200); // 2%
      expect(await profitPulse.tier2Rate()).to.equal(300); // 3%
      expect(await profitPulse.tier3Rate()).to.equal(350); // 3.5%
      expect(await profitPulse.tier4Rate()).to.equal(400); // 4%
    });

    it("Should have the correct initial referral rates", async function () {
      expect(await profitPulse.level1RefRate()).to.equal(1000); // 10%
      expect(await profitPulse.level2RefRate()).to.equal(300); // 3%
      expect(await profitPulse.level3RefRate()).to.equal(200); // 2%
    });
  });

  describe("Deposits", function () {
    it("Should allow users to deposit BUSD", async function () {
      // Approve BUSD for deposit
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      
      // Deposit
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      
      // Check user's investment
      const userDetails = await profitPulse.getUserDetails(addr1.address);
      expect(userDetails[0]).to.equal(TIER1_DEPOSIT); // investment
      expect(userDetails[2]).to.equal(1); // tier
    });

    it("Should reject deposits below minimum", async function () {
      const smallDeposit = ethers.parseUnits("5", 18); // 5 BUSD
      
      // Approve BUSD for deposit
      await busd.connect(addr1).approve(profitPulse.getAddress(), smallDeposit);
      
      // Attempt deposit
      await expect(
        profitPulse.connect(addr1).deposit(ethers.ZeroAddress)
      ).to.be.revertedWith("Insufficient BUSD balance");
    });

    it("Should assign the correct tier based on deposit amount", async function () {
      // Tier 1 deposit
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      let userDetails = await profitPulse.getUserDetails(addr1.address);
      expect(userDetails[2]).to.equal(1); // tier
      
      // Tier 2 deposit
      await busd.connect(addr2).approve(profitPulse.getAddress(), TIER2_DEPOSIT);
      await profitPulse.connect(addr2).deposit(ethers.ZeroAddress);
      userDetails = await profitPulse.getUserDetails(addr2.address);
      expect(userDetails[2]).to.equal(2); // tier
      
      // Tier 3 deposit
      await busd.connect(addr3).approve(profitPulse.getAddress(), TIER3_DEPOSIT);
      await profitPulse.connect(addr3).deposit(ethers.ZeroAddress);
      userDetails = await profitPulse.getUserDetails(addr3.address);
      expect(userDetails[2]).to.equal(3); // tier
      
      // Tier 4 deposit
      await busd.connect(addr4).approve(profitPulse.getAddress(), TIER4_DEPOSIT);
      await profitPulse.connect(addr4).deposit(ethers.ZeroAddress);
      userDetails = await profitPulse.getUserDetails(addr4.address);
      expect(userDetails[2]).to.equal(4); // tier
    });
  });

  describe("Referrals", function () {
    it("Should correctly handle referrals and distribute rewards", async function () {
      // Setup referral chain: addr1 <- addr2 <- addr3 <- addr4
      
      // First deposit by addr1 (no referrer)
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      
      // Second deposit by addr2 (referred by addr1)
      await busd.connect(addr2).approve(profitPulse.getAddress(), TIER2_DEPOSIT);
      await profitPulse.connect(addr2).deposit(addr1.address);
      
      // Third deposit by addr3 (referred by addr2)
      await busd.connect(addr3).approve(profitPulse.getAddress(), TIER3_DEPOSIT);
      await profitPulse.connect(addr3).deposit(addr2.address);
      
      // Fourth deposit by addr4 (referred by addr3)
      await busd.connect(addr4).approve(profitPulse.getAddress(), TIER4_DEPOSIT);
      await profitPulse.connect(addr4).deposit(addr3.address);
      
      // Check referral rewards
      // addr1 should get 10% of addr2's deposit + 3% of addr3's deposit + 2% of addr4's deposit
      const addr1Details = await profitPulse.getUserDetails(addr1.address);
      const expectedAddr1Reward = TIER2_DEPOSIT * BigInt(1000) / BigInt(10000) + 
                                 TIER3_DEPOSIT * BigInt(300) / BigInt(10000) + 
                                 TIER4_DEPOSIT * BigInt(200) / BigInt(10000);
      
      // Allow for small rounding differences
      const tolerance = ethers.parseUnits("0.01", 18); // 0.01 BUSD tolerance
      expect(addr1Details[5]).to.be.closeTo(expectedAddr1Reward, tolerance); // referralRewards
      
      // addr2 should get 10% of addr3's deposit + 3% of addr4's deposit
      const addr2Details = await profitPulse.getUserDetails(addr2.address);
      const expectedAddr2Reward = TIER3_DEPOSIT * BigInt(1000) / BigInt(10000) + 
                                 TIER4_DEPOSIT * BigInt(300) / BigInt(10000);
      expect(addr2Details[5]).to.be.closeTo(expectedAddr2Reward, tolerance); // referralRewards
      
      // addr3 should get 10% of addr4's deposit
      const addr3Details = await profitPulse.getUserDetails(addr3.address);
      const expectedAddr3Reward = TIER4_DEPOSIT * BigInt(1000) / BigInt(10000);
      expect(addr3Details[5]).to.be.closeTo(expectedAddr3Reward, tolerance); // referralRewards
    });

    it("Should track referrals correctly", async function () {
      // Setup referrals
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      
      await busd.connect(addr2).approve(profitPulse.getAddress(), TIER2_DEPOSIT);
      await profitPulse.connect(addr2).deposit(addr1.address);
      
      await busd.connect(addr3).approve(profitPulse.getAddress(), TIER2_DEPOSIT);
      await profitPulse.connect(addr3).deposit(addr1.address);
      
      // Check referral count
      const addr1Details = await profitPulse.getUserDetails(addr1.address);
      expect(addr1Details[4]).to.equal(2); // referralCount
      
      // Check referral list
      const referrals = await profitPulse.getUserReferrals(addr1.address);
      expect(referrals.length).to.equal(2);
      expect(referrals).to.include(addr2.address);
      expect(referrals).to.include(addr3.address);
    });
  });

  describe("Profit Calculation", function () {
    it("Should calculate profits correctly based on tier", async function () {
      // Make deposits at different tiers
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      
      await busd.connect(addr2).approve(profitPulse.getAddress(), TIER2_DEPOSIT);
      await profitPulse.connect(addr2).deposit(ethers.ZeroAddress);
      
      await busd.connect(addr3).approve(profitPulse.getAddress(), TIER3_DEPOSIT);
      await profitPulse.connect(addr3).deposit(ethers.ZeroAddress);
      
      await busd.connect(addr4).approve(profitPulse.getAddress(), TIER4_DEPOSIT);
      await profitPulse.connect(addr4).deposit(ethers.ZeroAddress);
      
      // Advance time by 1 day (86400 seconds)
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      // Calculate profits for each user
      await profitPulse.calculateProfit(addr1.address);
      await profitPulse.calculateProfit(addr2.address);
      await profitPulse.calculateProfit(addr3.address);
      await profitPulse.calculateProfit(addr4.address);
      
      // Check profits
      const addr1Details = await profitPulse.getUserDetails(addr1.address);
      const addr2Details = await profitPulse.getUserDetails(addr2.address);
      const addr3Details = await profitPulse.getUserDetails(addr3.address);
      const addr4Details = await profitPulse.getUserDetails(addr4.address);
      
      // Expected daily profits
      const expectedAddr1Profit = TIER1_DEPOSIT * BigInt(200) / BigInt(10000); // 2%
      const expectedAddr2Profit = TIER2_DEPOSIT * BigInt(300) / BigInt(10000); // 3%
      const expectedAddr3Profit = TIER3_DEPOSIT * BigInt(350) / BigInt(10000); // 3.5%
      const expectedAddr4Profit = TIER4_DEPOSIT * BigInt(400) / BigInt(10000); // 4%
      
      // Allow for small rounding differences
      const tolerance = ethers.parseUnits("0.01", 18); // 0.01 BUSD tolerance
      expect(addr1Details[1]).to.be.closeTo(expectedAddr1Profit, tolerance); // profits
      expect(addr2Details[1]).to.be.closeTo(expectedAddr2Profit, tolerance); // profits
      expect(addr3Details[1]).to.be.closeTo(expectedAddr3Profit, tolerance); // profits
      expect(addr4Details[1]).to.be.closeTo(expectedAddr4Profit, tolerance); // profits
    });
  });

  describe("Withdrawals", function () {
    it("Should allow users to withdraw profits", async function () {
      // Make deposit
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      
      // Advance time by 1 day
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      // Calculate profit
      await profitPulse.calculateProfit(addr1.address);
      
      // Get profit amount
      const userDetails = await profitPulse.getUserDetails(addr1.address);
      const profitAmount = userDetails[1];
      
      // Initial BUSD balance
      const initialBalance = await busd.balanceOf(addr1.address);
      
      // Withdraw profit
      await profitPulse.connect(addr1).withdraw(profitAmount);
      
      // Check BUSD balance increased by profit amount
      const newBalance = await busd.balanceOf(addr1.address);
      expect(newBalance - initialBalance).to.equal(profitAmount);
      
      // Check profit reset to 0
      const updatedDetails = await profitPulse.getUserDetails(addr1.address);
      expect(updatedDetails[1]).to.equal(0); // profits
      expect(updatedDetails[0]).to.equal(TIER1_DEPOSIT); // investment unchanged
    });

    it("Should allow users to withdraw all funds", async function () {
      // Make deposit
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      
      // Advance time by 1 day
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      // Calculate profit
      await profitPulse.calculateProfit(addr1.address);
      
      // Get total balance (investment + profit)
      const userDetails = await profitPulse.getUserDetails(addr1.address);
      const totalAmount = userDetails[0] + userDetails[1];
      
      // Initial BUSD balance
      const initialBalance = await busd.balanceOf(addr1.address);
      
      // Withdraw all
      await profitPulse.connect(addr1).withdrawAll();
      
      // Check BUSD balance increased by total amount
      const newBalance = await busd.balanceOf(addr1.address);
      expect(newBalance - initialBalance).to.equal(totalAmount);
      
      // Check investment and profit reset to 0
      const updatedDetails = await profitPulse.getUserDetails(addr1.address);
      expect(updatedDetails[0]).to.equal(0); // investment
      expect(updatedDetails[1]).to.equal(0); // profits
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update profit rates", async function () {
      // Create transaction in multisig to update profit rate
      const updateRateData = profitPulse.interface.encodeFunctionData(
        "updateProfitRate",
        [1, 250] // Update Tier 1 rate to 2.5%
      );
      
      await multiSigWallet.connect(owner).submitTransaction(
        await profitPulse.getAddress(),
        0,
        updateRateData
      );
      
      // Second confirmation
      await multiSigWallet.connect(addr1).confirmTransaction(1);
      
      // Check updated rate
      expect(await profitPulse.tier1Rate()).to.equal(250);
    });

    it("Should allow owner to update referral rates", async function () {
      // Create transaction in multisig to update referral rate
      const updateRefRateData = profitPulse.interface.encodeFunctionData(
        "updateReferralRate",
        [1, 1200] // Update Level 1 rate to 12%
      );
      
      await multiSigWallet.connect(owner).submitTransaction(
        await profitPulse.getAddress(),
        0,
        updateRefRateData
      );
      
      // Second confirmation
      await multiSigWallet.connect(addr1).confirmTransaction(2);
      
      // Check updated rate
      expect(await profitPulse.level1RefRate()).to.equal(1200);
    });

    it("Should allow owner to pause and unpause the contract", async function () {
      // Create transaction in multisig to pause
      const pauseData = profitPulse.interface.encodeFunctionData(
        "pause",
        [true]
      );
      
      await multiSigWallet.connect(owner).submitTransaction(
        await profitPulse.getAddress(),
        0,
        pauseData
      );
      
      // Second confirmation
      await multiSigWallet.connect(addr1).confirmTransaction(3);
      
      // Check paused status
      expect(await profitPulse.paused()).to.equal(true);
      
      // Try to deposit while paused
      await busd.connect(addr1).approve(profitPulse.getAddress(), TIER1_DEPOSIT);
      await expect(
        profitPulse.connect(addr1).deposit(ethers.ZeroAddress)
      ).to.be.revertedWith("Contract is paused");
      
      // Create transaction in multisig to unpause
      const unpauseData = profitPulse.interface.encodeFunctionData(
        "pause",
        [false]
      );
      
      await multiSigWallet.connect(owner).submitTransaction(
        await profitPulse.getAddress(),
        0,
        unpauseData
      );
      
      // Second confirmation
      await multiSigWallet.connect(addr1).confirmTransaction(4);
      
      // Check paused status
      expect(await profitPulse.paused()).to.equal(false);
      
      // Try to deposit after unpausing
      await profitPulse.connect(addr1).deposit(ethers.ZeroAddress);
      const userDetails = await profitPulse.getUserDetails(addr1.address);
      expect(userDetails[0]).to.equal(TIER1_DEPOSIT);
    });
  });
});
