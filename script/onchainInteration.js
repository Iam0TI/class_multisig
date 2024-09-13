const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const factoryAddr = "0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9";
  const Web3CXItokenAddr = "0x51A1ceB83B83F1985a81C295d1fF28Afef186E02";

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

  //Create MultiSignature Wallet
  const createWallet = await walletFactory.createMultisigWallet(3, signers);
  const wallet = await createWallet.wait();
  console.log("Create MultiSig Clone:", wallet);

  const walletClone = await walletFactory.getMultiSigClones();
  console.log("New Wallet clone addresses: ", walletClone);

  const walletClone1 = walletClone[0];

  const sig1 = await ethers.getContractAt("MultiSig", walletClone1);

  const Web3CXIToken = await ethers.getContractAt("Web3CXI", Web3CXItokenAddr);
  const amount = ethers.parseUnits("50000", 18);
  const trToken = await Web3CXIToken.transfer(walletClone1, amount);
  await trToken.wait();
  const quorum = await sig1.quorum();
  console.log(quorum);
  //   console.log("Transfer 500 Token to wallet:", trToken);

  //   // Interact with transfer function
  const amountToTransfer = ethers.parseUnits("50", 18);
  const trf = await sig1.proposeTransfer(
    amountToTransfer,
    addr5.address,
    Web3CXItokenAddr
  );
  console.log("propose Transfer from multisig wallet initiated: ", trf);

  // checking address one balance before  approval
  const balance = await Web3CXIToken.balanceOf(addr5.address);

  console.log(`The balance of ${addr5.address} before approval is ${balance}`);
  const txc = await sig1.txCount();
  console.log(txc);

  // approving transaction
  const approveone = await sig1.connect(addr1).approveTransaction(1);
  approveone.wait();

  const approve2 = await sig1.connect(addr2).approveTransaction(1);
  approve2.wait();

  // checking address one balance after approval
  const balance2 = await Web3CXIToken.balanceOf(addr5.address);
  console.log(`The balance of ${addr5.address} after approve is ${balance2}`);

  // updating  quorum
  const quorumUpdate = await sig1.connect(addr3).proposeQuorumUpdate(4);
  quorumUpdate.wait();
  console.log(quorumUpdate);

  const approvequorum1 = await sig1.connect(addr1).approveTransaction(2);
  approveone.wait();

  const approvequorum2 = await sig1.connect(addr2).approveTransaction(2);
  approve2.wait();

  // Interact with transfer function after quorum  update
  console.log("Interact with transfer function after quorum  update");
  const trf2 = await sig1.proposeTransfer(
    amountToTransfer,
    addr1.address,
    Web3CXItokenAddr
  );
  console.log("propose Transfer from multisig wallet initiated: ", trf2);

  // checking address one balance before  approval
  const balance1 = await Web3CXIToken.balanceOf(addr1.address);

  console.log(`The balance of ${addr1.address} before approval is ${balance1}`);
  const tx = await sig1.txCount();
  console.log(tx);
  const quorumx = await sig1.quorum();
  console.log(quorumx);

  //approving transaction
  const approveo = await sig1.connect(addr1).approveTransaction(3);
  approveo.wait();

  const approve21 = await sig1.connect(addr2).approveTransaction(3);
  approve21.wait();

  const approve22 = await sig1.connect(addr2).approveTransaction(3);
  approve22.wait();
  // checking address one balance after approval
  const balance3 = await Web3CXIToken.balanceOf(addr1.address);
  console.log(`The balance of ${addr1.address} after approve is ${balance3}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
