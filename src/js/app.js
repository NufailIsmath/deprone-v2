//const ipfsClient = require("ipfs-mini");
const ipfs = new IPFS({ host: "ipfs.infura.io", port: "5001", protocol: 'https' });
App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',

    init: function() {
        return App.initWeb3();
    },

    initWeb3: function() {
        // TODO: refactor conditional
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function() {
        $.getJSON("IPFSHash.json", function(ipfsHash) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.IPFSHash = TruffleContract(ipfsHash);
            // Connect provider to interact with contract
            App.contracts.IPFSHash.setProvider(App.web3Provider);

            //calling event function when a contract is initialized
            App.listenEvents();

            return App.render();
        });
        /* $.getJSON("IPFSHash.json", function(ipfsHash) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.IPFSHash = TruffleContract(ipfsHash);
            // Connect provider to interact with contract
            App.contracts.IPFSHash.setProvider(App.web3Provider);

            //calling event function when a contract is initialized
            App.listenEvents();
            return App.render();
        }); */
    },

    //listen for events from contract to reload
    listenEvents: function() {},

    render: function() {
        var newsArticleInstance;
        var hashInstance;
        var loader = $("#loader");
        var content = $("#content");
        var newsArticlesResult = $("#newsArticlesResult");
        var newsArticleTemplate;
        var votedArticlesId = [];
        var totalNewsArticleCount;



        loader.show();
        content.hide();
        // Load account data
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                console.log(" Account", App.account);
                $("#userAccountAddress").html("Your Account: " + account);
            }
        });

        //Render all the news article hash -- later the news article.
        App.contracts.IPFSHash.deployed().then(function(instance) {
            hashInstance = instance;
            return hashInstance.hashesOfArticleCount();
        }).then(function(hashCount) {
            //get the hashes From IPFS
            for (var i = 1; i <= hashCount; i++) {
                hashInstance.hashesOfArticle(i).then(function(hash) {
                    console.log("Hashes", hash);
                    //Retrieving data from the IPFS using Hash
                    ipfs.cat(hash, (err, result) => {
                        if (err) {
                            console.err(err);
                        }
                        console.log(result);
                        let newsArticle = JSON.parse(result);


                        newsArticleTemplate = "<tr><th>" + newsArticle.id + "</th><td>" + newsArticle.headline + "</td><td>" + newsArticle.newsInfo + "</td><td>" + newsArticle.voteCount + "</td> <td> <button id='" + newsArticle.id + "btn' type='submit' onclick='App.castVote(" + result + ")' class='btn btn-primary'>Vote</button> </td> <td> <button id='" + newsArticle.id + "validatBtn' type='submit' onclick='App.validateArticle(" + result + ", " + 1 + ")' class='btn btn-success'> Validate </button><button id='" + newsArticle.id + "inValidatBtn' type='submit' onclick='App.validateArticle(" + result + ", " + 0 + ")' class='btn btn-danger'> Invalidate </button> </td></tr>";
                        newsArticlesResult.append(newsArticleTemplate);
                    });
                });
            }
        }).then(function(result) {
            loader.hide();
            content.show();
        }).catch(function(err) {
            console.err(err);
        });


    },

    castVote: async function(newsArticle) {
        var hasVoted = false;
        for (var i = 0; i < newsArticle.votedAccounts.length; i++) {
            if (newsArticle.votedAccounts[i] == App.account) {
                hasVoted = true;
            }
        }
        if (!hasVoted) {
            if (App.account != newsArticle.publishedBy) {
                newsArticle.voteCount++;
                newsArticle.votedAccounts.push(App.account);
                console.log("Can vote");
                console.log(JSON.stringify(newsArticle));
                let updatedArticle = JSON.stringify(newsArticle);

                ipfs.add(updatedArticle, (err, updatedHash) => {
                    if (err) {
                        console.log(err);
                    }

                    App.contracts.IPFSHash.deployed().then(function(instance) {
                        return instance.updateHash(newsArticle.id, updatedHash, { from: App.account });
                    }).then(function(result) {
                        $('#content').hide();
                        $('#loader').show();
                    }).catch(function(err) {
                        console.err(err);
                    });
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Publisher Cannot Vote',
                    text: 'The publisher of the article is not allowed to vote!'
                })
            }
        }
        console.log("Has Voted");

    },

    //validate article
    validateArticle: function(article, validityResponse) {
        console.log(article, validityResponse);
        //check validator Score
        App.checkValidatorScore();
    },

    //publish article
    publishArticle: async function() {

        var newsHeadline = $('#newsHeadline').val();
        var newsDescription = $('#newsDescription').val();
        var articleId = 0;
        App.contracts.IPFSHash.deployed().then(function(instance) {
            return instance.hashesOfArticleCount();
        }).then(function(articleCount) {
            articleId = articleCount.toNumber();
            articleId++;

            let article = JSON.stringify({
                id: articleId,
                headline: newsHeadline,
                newsInfo: newsDescription,
                voteCount: 0,
                isValidated: "",
                publishedBy: App.account,
                votedAccounts: []
            });
            console.log(article);

            ipfs.add(article, (err, hash) => {
                if (err) {
                    console.err(err);
                }

                App.contracts.IPFSHash.deployed().then(function(inst) {
                    inst.storeHash(hash, { from: App.account });
                }).then(function(result) {
                    $('#content').hide();
                    $('#loader').show();
                }).catch(function(err) {
                    console.err(err);
                });
                //console.log(hash);
                App.closePopUp();
            });
        }).then(function(res) {
            $('#content').hide();
            $('#loader').show();
        }).catch(function(err) {
            console.err(err);
        });
    },

    //check Validator Score
    checkValidatorScore: function() {

    },

    //calculate the validator score
    calculateValidatorScore: function() {

    },


    /*openPopUp: function(){
      document.getElementById("myForm").style.display = "block";
    },*/

    closePopUp: function() {
        $('#newsHeadline').val("");
        $('#newsDescription').val("");
        $('#myModal').modal('hide');
    },


};

$(function() {
    $(window).load(function() {
        App.init();
    });
});