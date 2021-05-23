// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;
//pragma experimental ABIEncoderV2;

contract IPFSHash {
    
    struct IPFSHashes {
        string hash;
    }
    
    mapping (uint => IPFSHashes) public hashesOfArticle;
    
    uint public hashesOfArticleCount;
    
    function storeHash(string memory articleHash) public {
        hashesOfArticleCount++;
        hashesOfArticle[hashesOfArticleCount] = IPFSHashes(articleHash);
    }
    
    function updateHash(uint articleId, string memory updatedArticleHash) public {
        require(articleId > 0 && articleId <= hashesOfArticleCount);
        hashesOfArticle[articleId] = IPFSHashes(updatedArticleHash);
    }
    
    
}