var DeProne = artifacts.require("./DeProne.sol");

contract("DeProne", function(accounts) {

    var DeProneInstance;

    //checking transfer DEP token
    it("Checking the DEP token Transaction", function() {
        return DeProne.deployed().then(function(instance) {
            DeProneInstance = instance;
            DeProneInstance.transferDep(accounts[1], 100, { from: accounts[0] });
            return DeProneInstance.balanceOf(accounts[1], { from: accounts[0] });
        }).then(function(tokenBalance) {
            assert.equal(tokenBalance, 100, "Token transfered to the user");
        })
    });


    //checking validator Registration
    it("Checking validator registration and Balance of the account", function() {
        var transactionAmount;
        return DeProne.deployed().then(function(instance) {
            DeProneInstance = instance;
            transactionAmount = 5600000000000000;
            return DeProneInstance.validatorRegistration(accounts[1], { from: accounts[1], value: 5600000000000000 });
        }).then(function(result) {
            return DeProneInstance.balanceOf(accounts[1], { from: accounts[1] });
        }).then(function(depBalance) {
            assert(depBalance, "DEP Balance Increases");
            return DeProneInstance.ownerBalance();
        }).then(function(ownerAmount) {
            assert.equal(ownerAmount, ownerAmount, "Contract capital increases");
        })
    });

})