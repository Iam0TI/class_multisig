const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const factoryAddr = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
  const Web3CXItokenAddr = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

  const walletFactory = await ethers.getContractAt(
    "MultiSigFactory",
    factoryAddr
  );

  const [owner, addr1, addr2, addr3, addr4, addr5] =
    await hre.ethers.getSigners();
  const signers = [
    owner.address,
    addr1.address,
    addr2.address,
    addr3.address,
    addr4.address,
    addr5.address,
  ];

  // Create MultiSignature Wallet
  const createWallet = await walletFactory.createMultisigWallet(3, signers);
  const wallet = await createWallet.wait();
  console.log("Create MultiSig Clone:", wallet);

  const walletClone = await walletFactory.getMultiSigClones();
  console.log("New Wallet clone addresses: ", walletClone);

  const walletClone1 = walletClone[0];

  const sig1 = await ethers.getContractAt("MultiSig", walletClone1);

  const Web3CXIToken = await ethers.getContractAt("Web3CXI", Web3CXItokenAddr);
  const amount = ethers.parseUnits("500", 18);
  const trToken = await Web3CXIToken.transfer(walletClone1, amount);
  await trToken.wait();
  console.log("Transfer 500 Token to wallet:", trToken);

  // Interact with transfer function
  const amountToTransfer = ethers.parseUnits("50", 18);
  const trf = await sig1.proposeTransfer(
    amountToTransfer,
    addr1.address,
    Web3CXItokenAddr
  );
  console.log("propose Transfer from multisig wallet initiated: ", trf);

  const approveone = await sig1.connect(addr1).approveTransaction(1);
  approveone.wait();
  const approve2 = await sig1.connect(addr2).approveTransaction(1);
  approve2.wait();
  const approve3 = await sig1.connect(addr3).approveTransaction(1);
  approve3.wait();
  console.log(approve3);
  const approve4 = await sig1.connect(addr4).approveTransaction(1);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
