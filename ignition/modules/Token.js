const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("Web3CXIFactoryModule", (m) => {
  const Web3CXI = m.contract("Web3CXI");

  return { Web3CXI };
});
