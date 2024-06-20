// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Escrow } from "../Escrow.sol";
import { MGT } from "../tokens/MGT.sol";

contract MainMock {
    Escrow public escrow;
    MGT public mgt;
    constructor(Escrow _escrow, MGT _MGT) {
        escrow = _escrow;
        mgt = _MGT;
    }

    function send(address user, uint256 tokenId, uint256 paidAmount) public {
        escrow.sendFundsToSupplier(user, tokenId);
    }
}
