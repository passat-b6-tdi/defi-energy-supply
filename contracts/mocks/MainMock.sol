// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Escrow } from "../Escrow.sol";

contract MainMock {
    Escrow public escrow;
    address public mgt;
    constructor(Escrow _escrow, address _MGT) {
        escrow = _escrow;
        mgt = _MGT;
    }

    function send(address user, uint256 tokenId, uint256 paidAmount) public {
        escrow.sendFundsToSupplier(user, tokenId);
    }
}
