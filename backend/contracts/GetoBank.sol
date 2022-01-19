pragma solidity 0.6.12;

import "./openzeppelin/contracts/token/BEP20/IBEP20.sol";
import "./openzeppelin/contracts/token/BEP20/BEP20.sol";
import "./openzeppelin/contracts/math/SafeMath.sol";


contract GetoBank is BEP20("DeFi", "DEFI"){
    using SafeMath for uint256;
    IBEP20 public geto;

    constructor(IBEP20 _geto) public {
        geto = _geto;
    }

    // Enter the Bank. Pay some GETO. Earn some shares.
    function enter(uint256 _amount) public {
        uint256 totalGeto = geto.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalGeto == 0) {
            _mint(msg.sender, _amount);
        } else {
            uint256 what = _amount.mul(totalShares).div(totalGeto);
            _mint(msg.sender, what);
        }
        geto.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the Bank. Claim back your GETO plus the acumulative Shares.
    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint256 what = _share.mul(geto.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        geto.transfer(msg.sender, what);
    }
}