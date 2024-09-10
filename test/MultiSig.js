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
  async function deployMultiSigFixture() {
    // Load the token fixture to get the deployed token contract
    const { token } = await loadFixture(deployTokenFixture);

    // Get three signers: owner, other, and acct1
    const [owner, signer1, signer2, signer3, external] =
      await hre.ethers.getSigners();

    const quorum = 3;
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
    return {
      token,
      owner,
      signer1,
      signer2,
      signer3,
      external,
      MultiSigAddress,
    };
  }

  // Tests for the token deployment
  describe("token Deployment", function () {
    it("Should mint the right 1 Million tokens", async function () {
      // Load the token fixture
      const { token, owner } = await loadFixture(deployTokenFixture);

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
    it("Should have the mint 1m to owner", async function () {
      // Load the token fixture
      const { token, owner } = await loadFixture(deployTokenFixture);

      // Define the expected total supply (1 million tokens with 18 decimals)
      const tokenSymbol = "Web3CXI";

      const bal = await token.balanceOf(owner.address);
      // Assert that the total supply is correct
      await expect(await token.totalSupply()).to.equal(bal);
    });
  });

  describe("Deployment", function () {
    it("Should set the correct quorum", async function () {
      const { MultiSigAddress } = await loadFixture(deployMultiSigFixture);
      await expect(await MultiSigAddress.quorum()).to.equal(3n);
    });

    it("Should set the correct number of valid signers", async function () {
      const { MultiSigAddress } = await loadFixture(deployMultiSigFixture);
      await expect(await MultiSigAddress.noOfValidSigners()).to.equal(4n);
    });
  });

  //const tokenTotalSupply = ethers.parseUnits("1000000", 18);
  describe("Token Transfer", function () {
    it("Should create a token transfer transaction", async function () {
      const { MultiSigAddress, token, signer1, external, owner } =
        await loadFixture(deployMultiSigFixture);

      await token.transfer(MultiSigAddress, ethers.parseUnits("1000000", 18));
      // creating a transaction with signer1
      await MultiSigAddress.connect(signer1).transfer(
        ethers.parseUnits("10000", 18),
        external.address,
        token,
        0,
        0
      );

      const tx = await MultiSigAddress.connect(signer1).returnTransaction(1);
      expect(tx.amount).to.equal(ethers.parseUnits("10000", 18));
      expect(tx.recipient).to.equal(external.address);
      expect(tx.tokenAddress).to.equal(token);
      expect(tx.txType).to.equal(0); // TokenTransfer
    });

    it("Should approve and execute a token transfer transaction", async function () {
      const { MultiSigAddress, token, signer2, signer1, external } =
        await loadFixture(deployMultiSigFixture);
      await token.transfer(MultiSigAddress, ethers.parseUnits("1000000", 18));
      // creating a transaction with signer1
      await MultiSigAddress.connect(signer1).transfer(
        ethers.parseUnits("10000", 18),
        external.address,
        token,
        0,
        0
      );

      await MultiSigAddress.connect(signer2).approveTx(1);
      await MultiSigAddress.approveTx(1);
      const tx = await MultiSigAddress.returnTransaction(1);

      expect(tx.isCompleted).to.be.true;

      const balance = await token.balanceOf(external.address);
      expect(balance).to.equal(ethers.parseUnits("10000", 18));
    });
  });

  describe("Update Quorum", function () {
    it("Should create an update quorum transaction", async function () {
      const { MultiSigAddress } = await loadFixture(deployMultiSigFixture);
      await MultiSigAddress.transfer(
        0,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        1,
        2
      );

      const tx = await MultiSigAddress.returnTransaction(1);
      expect(tx.txType).to.equal(1); // UpdateQuorum
      expect(tx.newQuorum).to.equal(2);
    });

    it("Should approve and execute an update quorum transaction", async function () {
      const { MultiSigAddress, signer2, signer1 } = await loadFixture(
        deployMultiSigFixture
      );
      await MultiSigAddress.transfer(
        0,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        1,
        2
      );

      await MultiSigAddress.connect(signer2).approveTx(1);
      await MultiSigAddress.connect(signer1).approveTx(1);

      const newQuorum = await MultiSigAddress.quorum();
      expect(newQuorum).to.equal(2);
    });
  });

  describe("Error cases", function () {
    it("Should revert when trying to transfer more than the contract balance", async function () {
      const { MultiSigAddress, token, signer1 } = await loadFixture(
        deployMultiSigFixture
      );
      await expect(
        MultiSigAddress.transfer(
          ethers.parseUnits("10000", 18),
          signer1.address,
          token,
          0,
          0
        )
      ).to.be.revertedWith("insufficient funds");
    });

    it("Should revert when non-signer tries to create a transaction", async function () {
      const { MultiSigAddress, token, external, signer2 } = await loadFixture(
        deployMultiSigFixture
      );
      token.transfer(MultiSigAddress, ethers.parseUnits("100000", 18));
      await expect(
        MultiSigAddress.connect(external).transfer(
          ethers.parseUnits("10000", 18),
          signer2.address,
          token,
          0,
          0
        )
      ).to.be.revertedWith("invalid signer");
    });

    it("Should revert when trying to approve an invalid transaction", async function () {
      const { MultiSigAddress } = await loadFixture(deployMultiSigFixture);
      await expect(MultiSigAddress.approveTx(99)).to.be.revertedWith(
        "tx id out-of-bounds"
      );
    });
  });
});

// // const {
// //   time,
// //   loadFixture,
// // } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// // const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
// // const { expect } = require("chai");

// // describe("Lock", function () {
// //   // We define a fixture to reuse the same setup in every test.
// //   // We use loadFixture to run this setup once, snapshot that state,
// //   // and reset Hardhat Network to that snapshot in every test.
// //   async function deployOneYearLockFixture() {
// //     const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
// //     const ONE_GWEI = 1_000_000_000;

// //     const lockedAmount = ONE_GWEI;
// //     const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

// //     // Contracts are deployed using the first signer/account by default
// //     const [owner, otherAccount] = await ethers.getSigners();

// //     const Lock = await ethers.getContractFactory("Lock");
// //     const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

// //     return { lock, unlockTime, lockedAmount, owner, otherAccount };
// //   }

// //   describe("Deployment", function () {
// //     it("Should set the right unlockTime", async function () {
// //       const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

// //       expect(await lock.unlockTime()).to.equal(unlockTime);
// //     });

// //     it("Should set the right owner", async function () {
// //       const { lock, owner } = await loadFixture(deployOneYearLockFixture);

// //       expect(await lock.owner()).to.equal(owner.address);
// //     });

// //     it("Should receive and store the funds to lock", async function () {
// //       const { lock, lockedAmount } = await loadFixture(
// //         deployOneYearLockFixture
// //       );

// //       expect(await ethers.provider.getBalance(lock.target)).to.equal(
// //         lockedAmount
// //       );
// //     });

// //     it("Should fail if the unlockTime is not in the future", async function () {
// //       // We don't use the fixture here because we want a different deployment
// //       const latestTime = await time.latest();
// //       const Lock = await ethers.getContractFactory("Lock");
// //       await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
// //         "Unlock time should be in the future"
// //       );
// //     });
// //   });

// //   describe("Withdrawals", function () {
// //     describe("Validations", function () {
// //       it("Should revert with the right error if called too soon", async function () {
// //         const { lock } = await loadFixture(deployOneYearLockFixture);

// //         await expect(lock.withdraw()).to.be.revertedWith(
// //           "You can't withdraw yet"
// //         );
// //       });

// //       it("Should revert with the right error if called from another account", async function () {
// //         const { lock, unlockTime, otherAccount } = await loadFixture(
// //           deployOneYearLockFixture
// //         );

// //         // We can increase the time in Hardhat Network
// //         await time.increaseTo(unlockTime);

// //         // We use lock.connect() to send a transaction from another account
// //         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
// //           "You aren't the owner"
// //         );
// //       });

// //       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
// //         const { lock, unlockTime } = await loadFixture(
// //           deployOneYearLockFixture
// //         );

// //         // Transactions are sent using the first signer by default
// //         await time.increaseTo(unlockTime);

// //         await expect(lock.withdraw()).not.to.be.reverted;
// //       });
// //     });

// //     describe("Events", function () {
// //       it("Should emit an event on withdrawals", async function () {
// //         const { lock, unlockTime, lockedAmount } = await loadFixture(
// //           deployOneYearLockFixture
// //         );

// //         await time.increaseTo(unlockTime);

// //         await expect(lock.withdraw())
// //           .to.emit(lock, "Withdrawal")
// //           .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
// //       });
// //     });

// //     describe("Transfers", function () {
// //       it("Should transfer the funds to the owner", async function () {
// //         const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
// //           deployOneYearLockFixture
// //         );

// //         await time.increaseTo(unlockTime);

// //         await expect(lock.withdraw()).to.changeEtherBalances(
// //           [owner, lock],
// //           [lockedAmount, -lockedAmount]
// //         );
// //       });
// //     });
// //   });
// // });
