// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";

contract VestingContract is VestingWallet, AccessControl {
    uint64 private _cliff;

    constructor(
        address _to,
        uint64 startTimestamp,
        uint64 cliffDuration,
        uint64 vestingDuration
    ) VestingWallet(_to, startTimestamp, vestingDuration) {
        _grantRole(DEFAULT_ADMIN_ROLE, _to);
        _cliff = cliffDuration + vestingDuration;
    }


    function cliff() public view virtual returns (uint256) {
        return _cliff;
    }

}
