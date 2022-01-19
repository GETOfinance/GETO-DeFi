const { expectRevert } = require('@openzeppelin/test-helpers');
const GetoToken = artifacts.require('GetoToken');

contract('GetoToken', ([alice, bob, carol]) => {
    beforeEach(async () => {
        this.geto = await GetoToken.new({ from: alice });
    });

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.geto.name();
        const symbol = await this.geto.symbol();
        const decimals = await this.geto.decimals();
        assert.equal(name.valueOf(), 'GetoToken');
        assert.equal(symbol.valueOf(), 'GETO');
        assert.equal(decimals.valueOf(), '18');
    });

    it('should only allow owner to mint token', async () => {
        await this.geto.mint(alice, '100', { from: alice });
        await this.geto.mint(bob, '1000', { from: alice });
        await expectRevert(
            this.geto.mint(carol, '1000', { from: bob }),
            'Ownable: caller is not the owner',
        );
        const totalSupply = await this.geto.totalSupply();
        const aliceBal = await this.geto.balanceOf(alice);
        const bobBal = await this.geto.balanceOf(bob);
        const carolBal = await this.geto.balanceOf(carol);
        assert.equal(totalSupply.valueOf(), '1100');
        assert.equal(aliceBal.valueOf(), '100');
        assert.equal(bobBal.valueOf(), '1000');
        assert.equal(carolBal.valueOf(), '0');
    });

    it('should supply token transfers properly', async () => {
        await this.geto.mint(alice, '100', { from: alice });
        await this.geto.mint(bob, '1000', { from: alice });
        await this.geto.transfer(carol, '10', { from: alice });
        await this.geto.transfer(carol, '100', { from: bob });
        const totalSupply = await this.geto.totalSupply();
        const aliceBal = await this.geto.balanceOf(alice);
        const bobBal = await this.geto.balanceOf(bob);
        const carolBal = await this.geto.balanceOf(carol);
        assert.equal(totalSupply.valueOf(), '1100');
        assert.equal(aliceBal.valueOf(), '90');
        assert.equal(bobBal.valueOf(), '900');
        assert.equal(carolBal.valueOf(), '110');
    });

    it('should fail if you try to do bad transfers', async () => {
        await this.geto.mint(alice, '100', { from: alice });
        await expectRevert(
            this.geto.transfer(carol, '110', { from: alice }),
            'BEP20: transfer amount exceeds balance',
        );
        await expectRevert(
            this.geto.transfer(carol, '1', { from: bob }),
            'BEP20: transfer amount exceeds balance',
        );
    });
  });
