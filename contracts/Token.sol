// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Web3CXI is ERC20("Web3CXI Token", "Web3CXI") {
    // address public owner;

    constructor() {
        // owner = msg.sender;
        // minting a total supply of one million token
        _mint(msg.sender, 1000000e18);
    }
}
