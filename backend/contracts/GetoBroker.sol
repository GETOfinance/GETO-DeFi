pragma solidity 0.6.12;

import "./openzeppelin/contracts/token/BEP20/IBEP20.sol";
import "./openzeppelin/contracts/math/SafeMath.sol";


contract GetoBroker {
    using SafeMath for uint256;
    event Enter(address indexed user, uint256 amount);
    event Leave(address indexed user, uint256 amount);

    IBEP20 public geto;

    uint256 public reductionPerBlock;
    uint256 public multiplier;
    uint256 public lastMultiplerProcessBlock;

    uint256 public accGetoPerShare;
    uint256 public ackGetoBalance;
    uint256 public totalShares;

    struct UserInfo {
        uint256 amount; // GETO stake amount
        uint256 share;
        uint256 rewardDebt;
    }

    mapping (address => UserInfo) public userInfo;

    constructor(IBEP20 _geto, uint256 _reductionPerBlock) public {
        geto = _geto;
        reductionPerBlock = _reductionPerBlock; // Use 999999390274979584 for 10% per month
        multiplier = 1e18; // Should be good for 20 years
        lastMultiplerProcessBlock = block.number;
    }

    // Clean the brokerage. Called whenever someone enters or leaves.
    function cleanup() public {
        // Update multiplier
        uint256 reductionTimes = block.number.sub(lastMultiplerProcessBlock);
        uint256 fraction = 1e18;
        uint256 acc = reductionPerBlock;
        while (reductionTimes > 0) {
            if (reductionTimes & 1 != 0) {
                fraction = fraction.mul(acc).div(1e18);
            }
            acc = acc.mul(acc).div(1e18);
            reductionTimes = reductionTimes / 2;
        }
        multiplier = multiplier.mul(fraction).div(1e18);
        lastMultiplerProcessBlock = block.number;
        // Update accGetoPerShare / ackGetoBalance
        if (totalShares > 0) {
            uint256 additionalGeto = geto.balanceOf(address(this)).sub(ackGetoBalance);
            accGetoPerShare = accGetoPerShare.add(additionalGeto.mul(1e12).div(totalShares));
            ackGetoBalance = ackGetoBalance.add(additionalGeto);
        }
    }

    // Get user pending reward. May be outdated until someone calls cleanup.
    function getPendingReward(address _user) public view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        return user.share.mul(accGetoPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Enter the brokerage. Pay some GETO. Earn some shares.
    function enter(uint256 _amount) public {
        cleanup();
        safeGetoTransfer(msg.sender, getPendingReward(msg.sender));
        geto.transferFrom(msg.sender, address(this), _amount);
        ackGetoBalance = ackGetoBalance.add(_amount);
        UserInfo storage user = userInfo[msg.sender];
        uint256 moreShare = _amount.mul(multiplier).div(1e18);
        user.amount = user.amount.add(_amount);
        totalShares = totalShares.add(moreShare);
        user.share = user.share.add(moreShare);
        user.rewardDebt = user.share.mul(accGetoPerShare).div(1e12);
        emit Enter(msg.sender, _amount);
    }

    // Leave the brokerage. Claim back your GETO.
    function leave(uint256 _amount) public {
        cleanup();
        safeGetoTransfer(msg.sender, getPendingReward(msg.sender));
        UserInfo storage user = userInfo[msg.sender];
        uint256 lessShare = user.share.mul(_amount).div(user.amount);
        user.amount = user.amount.sub(_amount);
        totalShares = totalShares.sub(lessShare);
        user.share = user.share.sub(lessShare);
        user.rewardDebt = user.share.mul(accGetoPerShare).div(1e12);
        safeGetoTransfer(msg.sender, _amount);
        emit Leave(msg.sender, _amount);
    }

    // Safe geto transfer function, just in case if rounding error causes pool to not have enough GETO.
    function safeGetoTransfer(address _to, uint256 _amount) internal {
        uint256 getoBal = geto.balanceOf(address(this));
        if (_amount > getoBal) {
            geto.transfer(_to, getoBal);
            ackGetoBalance = ackGetoBalance.sub(getoBal);
        } else {
            geto.transfer(_to, _amount);
            ackGetoBalance = ackGetoBalance.sub(_amount);
        }
    }
}