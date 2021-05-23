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

        }).done(function() {
            $.getJSON("DeProne.json", function(deprone) {

                App.contracts.DeProne = TruffleContract(deprone);

                App.contracts.DeProne.setProvider(App.web3Provider);

            });

        }).done(function() {
            App.listenEvents();
            return App.render();
        });


    },

    //listen for events from contract to reload
    listenEvents: function() {},

    render: function() {
        var hashInstance;
        var loader = $("#loader");
        var content = $("#content");
        var newsArticlesResult = $("#newsArticlesResult");
        var newsArticleTemplate;
        var depInst;
        var newsArticlesSorted = [];
        var totalNewsArticleCount;

        loader.show();
        content.hide();
        // Load account data
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                console.log(" Account", App.account);
                $("#userAccountAddress").html("Your Account: " + account);

                App.contracts.DeProne.deployed().then(function(inst) {
                    depInst = inst;
                    return depInst.balanceOf(App.account);
                }).then(function(depToken) {
                    $("#DEPToken").html("DEP Token Earned: " + depToken);
                    return depInst.validatorScore(App.account);
                }).then(function(score) {
                    var validatorScore = score / 100;
                    $("#validatorScore").html("Validator Score: " + validatorScore);
                }).catch(function(err) {
                    console.log(err);
                });
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
                    //console.log("Hashes", hash);
                    //Retrieving data from the IPFS using Hash
                    ipfs.cat(hash, (err, result) => {
                        if (err) {
                            console.log(err);
                        }
                        console.log(result);
                        let newsArticle = JSON.parse(result);

                        if (newsArticle.isValidated == "true") {
                            newsArticleTemplate = "<tr><th>" + newsArticle.id + "</th><td>" + newsArticle.headline + "</td><td>" + newsArticle.newsInfo + "</td><td>" + newsArticle.newsDate + "</td><td>" + newsArticle.voteCount + "</td> <td> </td> <td>" + newsArticle.isValidated.toUpperCase() + "</td></tr>";
                        } else {
                            newsArticleTemplate = "<tr><th>" + newsArticle.id + "</th><td>" + newsArticle.headline + "</td><td>" + newsArticle.newsInfo + "</td><td>" + newsArticle.newsDate + "</td><td>" + newsArticle.voteCount + "</td> <td> <button id='" + newsArticle.id + "btn' type='submit' onclick='App.castVote(" + result + ")' class='btn btn-primary'>Vote</button> </td> <td> <button id='" + newsArticle.id + "validatBtn' type='submit' onclick='App.validateArticle(" + result + ", " + 1 + ")' class='btn btn-success'> True </button><button id='" + newsArticle.id + "inValidatBtn' type='submit' onclick='App.validateArticle(" + result + ", " + 0 + ")' class='btn btn-danger'> False </button> </td></tr>";
                        }

                        newsArticlesResult.append(newsArticleTemplate);
                        //console.warn(newsArticlesSorted.length);
                    });
                });
            }
            return hashInstance.hashesOfArticleCount();
        }).then(() => {
            loader.hide();
            content.show();
        }).catch(function(err) {
            console.log(err);
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
                        if (result) {
                            console.log("done");
                            App.contracts.DeProne.deployed().then(function(dInst) {
                                return dInst.transferDep(App.account, 1, { from: App.account });
                            }).then(function(details) {
                                if (details) {
                                    location.reload();
                                }
                            })
                        }
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
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Already voted',
                text: 'You have already voted to this article!'
            })
        }

    },

    //validate article
    validateArticle: function(article, validityResponse) {
        var attentionScore;
        var validity = "";
        if (validityResponse == 1) {
            validity = "true";
        } else if (validityResponse == 0) {
            validity = "false";
        }
        console.log(article, validity);
        App.contracts.DeProne.deployed().then(function(instance) {
            return instance.RegisteredValidators(App.account);
        }).then(function(score) {
            attentionScore = score.toNumber();
            if (App.account != article.publishedBy) {
                if (attentionScore >= 60000) {
                    article.isValidated = validity;
                    let validatedArticle = JSON.stringify(article);

                    var validatorScore = App.calculateValidatorScore(attentionScore);
                    console.log(validatorScore);

                    ipfs.add(validatedArticle, (err, updatedHash) => {
                        if (err) {
                            console.log(err);
                        }

                        App.contracts.IPFSHash.deployed().then(function(instance) {
                            return instance.updateHash(article.id, updatedHash, { from: App.account });
                        }).then(function(result) {
                            //reward user here ---------|||||---------
                            App.contracts.DeProne.deployed().then(function(depInstance) {
                                return depInstance.rewardValidator(App.account, validatorScore, article.publishedBy, validity, { from: App.account });
                            }).then(function(result) {
                                if (result) {
                                    location.reload();
                                }
                                //console.log("Reward transaction detail : ", result);
                            });
                        }).catch(function(err) {
                            console.err(err);
                        });
                    });
                } else {
                    //pop up and do register as validator.
                    Swal.fire({
                        title: 'You should be a validator',
                        text: "Do you want to register as validator?",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, Register'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            App.contracts.DeProne.deployed().then(function(instance) {
                                    //restart the system and try again
                                    return instance.validatorRegistration(App.account, { from: App.account, value: 2400000000000000 })
                                }).then(function(result) {
                                    if (result) {
                                        Swal.fire({
                                            title: "Success",
                                            text: "Successfully registered as validator",
                                            icon: "success",
                                            showCancelButton: false,
                                            confirmButtonColor: '#3085d6',
                                            confirmButtonText: "Ok"
                                        }).then((result) => {
                                            App.validateArticle(article, validityResponse);
                                        });

                                    }
                                    console.log(result);
                                })
                                /* Swal.fire(
                                  'Deleted!',
                                  'Your file has been deleted.',
                                  'success'
                                ) */
                        }
                    });
                }

            } else {
                Swal.fire({
                    title: 'Cannot Validate!',
                    text: "You cannot validate your own article!",
                    icon: "error"
                });
            }
        });
    },

    //publish article
    publishArticle: async function() {

        var newsHeadline = $('#newsHeadline').val();
        var newsDescription = $('#newsDescription').val();

        var articleId = 0;
        var date = $("#datetimepicker1").data("DateTimePicker").date().toDate();
        var formattedDate = App.formatDate(date);
        App.contracts.IPFSHash.deployed().then(function(instance) {
            return instance.hashesOfArticleCount();
        }).then(function(articleCount) {
            articleId = articleCount.toNumber();
            articleId++;

            let article = JSON.stringify({
                id: articleId,
                headline: newsHeadline,
                newsInfo: newsDescription,
                newsDate: formattedDate,
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
                    return inst.storeHash(hash, { from: App.account });
                }).then(function(result) {
                    if (result) {
                        App.closePopUp();
                        location.reload();

                    }
                    $('#content').hide();
                    $('#loader').show();
                }).catch(function(err) {
                    console.err(err);
                });
            });
        }).catch(function(err) {
            console.err(err);
        });
    },

    //check Validator Score
    checkValidatorScore: function() {
        var validatorAttentionPoints;
        App.contracts.DeProne.deployed().then(function(instance) {
            return instance.validtorCount();
            //instance.RegisteredValidators(App.account, { from: App.account });
        }).then(function(validatorCount) {
            //console.log('Attention Score', attentionScore);
            if (typeof validatorCount !== 'undefined') {
                console.log(validatorCount.toNumber())
            }

        })
    },

    //calculate the validator score
    calculateValidatorScore: function(attentionScore) {
        var a = 14000;
        var b = 40000;
        //equation to calculate the score
        var scoreResult = (-1 * b + Math.sqrt(Math.pow(b, 2) + (4 * a * attentionScore))) / (2 * a);
        //getting the value in 2 decimal place
        var value = parseFloat(scoreResult).toFixed(2);
        //Solidity does not support decimal values, alternate solution
        var intValue = value * 100;
        var finalScore = intValue.toFixed(0);
        return finalScore;

    },

    closePopUp: function() {
        $('#newsHeadline').val("");
        $('#newsDescription').val("");
        $('#myModal').modal('hide');
    },

    formatDate: function(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    }


};

$(function() {
    $(window).load(function() {
        $('#datetimepicker1').datetimepicker();
        App.init();
    });
});