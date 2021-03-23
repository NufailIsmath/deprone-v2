var IPFSHash = artifacts.require("./IPFSHash.sol");

contract("IPFSHash", function(accounts) {
    var IPFSHashInstance;

    //Checking how many article hash have been stored
    it("Checking Hash count saved in Ethereum", function() {
        return IPFSHash.deployed().then(function(instance) {
            return instance.hashesOfArticleCount();
        }).then(function(count) {
            assert.equal(count, 0);
        })
    });

    //checking save hash function
    it("Checking Save Hash function with correct input", function() {
        return IPFSHash.deployed().then(function(instance) {
            IPFSHashInstance = instance;
            articleHash = "Qmmdaksiaskhdi8923jssndjbsbdj"
            return instance.storeHash(articleHash, { from: accounts[1] });
        }).then(function(data) {
            return IPFSHashInstance.hashesOfArticleCount();
        }).then(function(count) {
            assert(count, "Count will be increased by one")
            return IPFSHashInstance.hashesOfArticle(count);
        }).then(function(data) {
            assert.equal(data, "Qmmdaksiaskhdi8923jssndjbsbdj", "Has the saved hash")
        });
    });

});