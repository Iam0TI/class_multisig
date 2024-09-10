const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Define the expected total supply (1 million tokens with 18 decimals)
const tokenTotalSupply = ethers.parseUnits("1000000", 18);
describe("MultiSig", function () {
  // Fixture for deploying the Web3CXI token contract
  async function deployTokenFixture() {
    // Get the first signer (account) as the owner
    const [owner] = await hre.ethers.getSigners();

    // Deploy the ERC20 token contract (Web3CXI)
    const erc20Token = await hre.ethers.getContractFactory("Web3CXI");
    const token = await erc20Token.deploy();

    // Return the deployed token contract and owner
    return { token, owner };
  }

  // Fixture for deploying the MultiSig contract
  async function delpoyMultiSigFixture() {
    // Load the token fixture to get the deployed token contract
    const { token } = await loadFixture(deployTokenFixture);

    // Get three signers: owner, other, and acct1
    const [owner, signer1, signer2, signer3] = await hre.ethers.getSigners();

    const quorum = 3n;
    const validSigners = [
      owner.address,
      signer1.address,
      signer2.address,
      signer3.address,
    ];
    // Deploy the MultiSig contract with the quorum and  array of valid signers
    const MultiSig = await hre.ethers.getContractFactory("MultiSig");
    const MultiSigAddress = await MultiSig.deploy(quorum, validSigners);

    // Return the deployed contracts and other relevant data
    return { token, owner, signer1, signer2, signer3, MultiSigAddress };
  }

  // Tests for the token deployment
  describe("token Deployment", function () {
    it("Should mint the right 1 Million tokens", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Assert that the total supply is correct
      await expect(await token.totalSupply()).to.equal(tokenTotalSupply);
    });
    it("Should have the right name", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Define the expected total supply (1 million tokens with 18 decimals)
      const tokenName = "Web3CXI Token";

      // Assert that the total supply is correct
      await expect(await token.name()).to.equal(tokenName);
    });
    it("Should have the right symbol", async function () {
      // Load the token fixture
      const { token } = await loadFixture(deployTokenFixture);

      // Define the expected total supply (1 million tokens with 18 decimals)
      const tokenSymbol = "Web3CXI";

      // Assert that the total supply is correct
      await expect(await token.symbol()).to.equal(tokenSymbol);
    });
  });
});
