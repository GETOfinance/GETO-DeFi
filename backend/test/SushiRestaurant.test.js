const { expectRevert, time } = require('@openzeppelin/test-helpers');
const GetoToken = artifacts.require('GetoToken');
const GetoBroker = artifacts.require('GetoBroker');

contract('GetoBroker', ([alice, bob, carol]) => {
    beforeEach(async () => {
        this.geto = await GetoToken.new({ from: alice });
        // 10% reduction per 1000 blocks
        this.rest = await GetoBroker.new(this.geto.address, '999894645034566400', { from: alice });
        this.geto.mint(alice, '1000', { from: alice });
        this.geto.mint(bob, '1000', { from: alice });
        this.geto.mint(carol, '1000', { from: alice });
    });

    it('should work properly', async () => {
        await this.geto.approve(this.rest.address, '1000', { from: alice });
        await this.geto.approve(this.rest.address, '1000', { from: bob });
        // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
        await this.rest.enter('200', { from: alice });
        await this.rest.enter('100', { from: bob });
        assert.equal((await this.rest.userInfo(alice)).amount.valueOf(), '200');
        assert.equal((await this.rest.userInfo(bob)).amount.valueOf(), '100');
        assert.equal((await this.rest.userInfo(alice)).share.valueOf(), '199');
        assert.equal((await this.rest.userInfo(bob)).share.valueOf(), '99');
        // GetoBank get 200 more GETO from an external source.
        await this.geto.transfer(this.rest.address, '200', { from: carol });
        // Pending rewards should be correct
        await this.rest.cleanup();
        assert.equal((await this.rest.getPendingReward(alice)).valueOf(), '133');
        assert.equal((await this.rest.getPendingReward(bob)).valueOf(), '66');
        // Advance 1000 blocks.
        for (let i = 0; i < 1000; ++i) {
            await time.advanceBlock();
        }
        // Alice deposits 200 more GETO. But it's worth 10% less
        await this.rest.enter('200', { from: alice });
        assert.equal((await this.geto.balanceOf(alice)).valueOf(), '733');
        assert.equal((await this.geto.balanceOf(bob)).valueOf(), '900');
        assert.equal((await this.rest.userInfo(alice)).amount.valueOf(), '400');
        assert.equal((await this.rest.userInfo(bob)).amount.valueOf(), '100');
        assert.equal((await this.rest.userInfo(alice)).share.valueOf(), '378');
        assert.equal((await this.rest.userInfo(bob)).share.valueOf(), '99');
        assert.equal((await this.rest.getPendingReward(alice)).valueOf(), '0');
        assert.equal((await this.rest.getPendingReward(bob)).valueOf(), '66');
        // GetoBank get 200 more GETO from an external source.
        await this.geto.transfer(this.rest.address, '200', { from: carol });
        await this.rest.cleanup();
        assert.equal((await this.rest.getPendingReward(alice)).valueOf(), '159'); // 378/477*200
        assert.equal((await this.rest.getPendingReward(bob)).valueOf(), '107'); // 66+99/477*200
        // Alice withdraw half and Bob withdraw all.
        await this.rest.leave('200', { from: alice });
        await this.rest.leave('100', { from: bob });
        assert.equal((await this.geto.balanceOf(alice)).valueOf(), '1092');
        assert.equal((await this.geto.balanceOf(bob)).valueOf(), '1107');
        assert.equal((await this.rest.userInfo(alice)).amount.valueOf(), '200');
        assert.equal((await this.rest.userInfo(bob)).amount.valueOf(), '0');
        assert.equal((await this.rest.userInfo(alice)).share.valueOf(), '189');
        assert.equal((await this.rest.userInfo(bob)).share.valueOf(), '0');
        assert.equal((await this.rest.getPendingReward(alice)).valueOf(), '0');
        assert.equal((await this.rest.getPendingReward(bob)).valueOf(), '0');
    });
});
