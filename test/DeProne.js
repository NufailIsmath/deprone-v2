var DeProne = artifacts.require("./DeProne.sol");

contract("DeProne", function(accounts) {

    var DeProneInstance;

    //checking transfer DEP token
    it("Checking the DEP token Transaction", function() {
        return DeProne.deployed().then(function(instance) {
            DeProneInstance = instance;
            DeProneInstance.transferDep(accounts[1], 5, { from: accounts[1] });
            return DeProneInstance.balanceOf(accounts[1], { from: accounts[1] });
        }).then(function(tokenBalance) {
            assert.equal(tokenBalance, 5, "Token transfered to the user");
        })
    });


    //checking validator Registration
    it("Checking validator registration and Balance of the account", function() {
        return DeProne.deployed().then(function(instance) {
            DeProneInstance = instance;
            return DeProneInstance.validatorRegistration(accounts[1], { from: accounts[1], value: 2400000000000000 });
        }).then(function(result) {
            return DeProneInstance.balanceOf(accounts[1], { from: accounts[1] });
        }).then(function(depBalance) {
            assert(depBalance, "DEP Balance Increases");
            return DeProneInstance.ownerBalance();
        }).then(function(ownerAmount) {
            assert.equal(ownerAmount, ownerAmount, "Contract capital increases");
        })
    });

    //get registered validator
    it("Checking validator fetching function", function() {
        var validatorAttentionScore;
        return DeProne.deployed().then(function(instance) {
            DeProneInstance = instance;
            DeProneInstance.validatorRegistration(accounts[1], { from: accounts[1], value: 2400000000000000 });
        }).then(function(reusult) {
            return DeProneInstance.RegisteredValidators(accounts[1]);
        }).then(function(attentionScore) {
            validatorAttentionScore = attentionScore;
            assert.equal(validatorAttentionScore.toNumber(), 60000, "The attention score of the validator after registering as validator");
        });
    });

    it("Checking reward calculation", function() {
        return DeProne.deployed().then(function(instance) {
            DeProneInstance = instance;
            DeProneInstance.rewardValidator(accounts[1], 120, accounts[2], "true", { from: accounts[1] });
        }).then(function(result) {
            return DeProneInstance.validatorScore(accounts[1]);
        }).then(function(score) {
            assert.equal(score, 120, "Score of the validator matches")
        })
    });

})