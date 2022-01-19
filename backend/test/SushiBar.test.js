const { expectRevert } = require('@openzeppelin/test-helpers');
const GetoToken = artifacts.require('GetoToken');
const GetoBank = artifacts.require('GetoBank');

contract('GetoBank', ([alice, bob, carol]) => {
    beforeEach(async () => {
        this.geto = await GetoToken.new({ from: alice });
        this.bank = await GetoBank.new(this.geto.address, { from: alice });
        this.geto.mint(alice, '100', { from: alice });
        this.geto.mint(bob, '100', { from: alice });
        this.geto.mint(carol, '100', { from: alice });
    });

    it('should not allow enter if not enough approve', async () => {
        await expectRevert(
            this.bank.enter('100', { from: alice }),
            'BEP20: transfer amount exceeds allowance',
        );
        await this.geto.approve(this.bank.address, '50', { from: alice });
        await expectRevert(
            this.bank.enter('100', { from: alice }),
            'BEP20: transfer amount exceeds allowance',
        );
        await this.geto.approve(this.bank.address, '100', { from: alice });
        await this.bank.enter('100', { from: alice });
        assert.equal((await this.bank.balanceOf(alice)).valueOf(), '100');
    });

    it('should not allow withraw more than what you have', async () => {
        await this.geto.approve(this.bank.address, '100', { from: alice });
        await this.bank.enter('100', { from: alice });
        await expectRevert(
            this.bank.leave('200', { from: alice }),
            'BEP20: burn amount exceeds balance',
        );
    });

    it('should work with more than one participant', async () => {
        await this.geto.approve(this.bank.address, '100', { from: alice });
        await this.geto.approve(this.bank.address, '100', { from: bob });
        // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
        await this.bank.enter('20', { from: alice });
        await this.bank.enter('10', { from: bob });
        assert.equal((await this.bank.balanceOf(alice)).valueOf(), '20');
        assert.equal((await this.bank.balanceOf(bob)).valueOf(), '10');
        assert.equal((await this.geto.balanceOf(this.bank.address)).valueOf(), '30');
        // GetoBank get 20 more GETO from an external source.
        await this.geto.transfer(this.bank.address, '20', { from: carol });
        // Alice deposits 10 more GETO. She should receive 10*30/50 = 6 shares.
        await this.bank.enter('10', { from: alice });
        assert.equal((await this.bank.balanceOf(alice)).valueOf(), '26');
        assert.equal((await this.bank.balanceOf(bob)).valueOf(), '10');
        // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
        await this.bank.leave('5', { from: bob });
        assert.equal((await this.bank.balanceOf(alice)).valueOf(), '26');
        assert.equal((await this.bank.balanceOf(bob)).valueOf(), '5');
        assert.equal((await this.geto.balanceOf(this.bank.address)).valueOf(), '52');
        assert.equal((await this.geto.balanceOf(alice)).valueOf(), '70');
        assert.equal((await this.geto.balanceOf(bob)).valueOf(), '98');
    });
});
