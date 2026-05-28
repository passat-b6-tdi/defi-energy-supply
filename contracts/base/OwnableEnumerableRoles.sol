// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "solady/src/auth/Ownable.sol";
import { EnumerableRoles } from "solady/src/auth/EnumerableRoles.sol";

contract OwnableEnumerableRoles is Ownable, EnumerableRoles {
    constructor() {
        _setOwner(msg.sender);
    }
}
