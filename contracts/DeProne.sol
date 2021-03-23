//SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DeProne is ERC20 {

    uint256 initialSupply = 100000000000;

    //address owner of the deployed contract
    address public owner;
    
    //address owner balance
    uint public ownerBalance;

    //count of validators
    uint256 public validtorCount;
    
    //count of calculated validator score
    uint256 public calculatedScoreCountValidator;

    //mapping of validators with initial score;
    mapping(address => uint256) public RegisteredValidators;
    
    //mapping of validators calculated score
    mapping(address => uint256) public validatorScore;
    

    constructor(string memory _tokenName, string memory _tokenSymbol) ERC20(_tokenName, _tokenSymbol) public  {
        owner = msg.sender;
        ownerBalance = owner.balance;
        _mint(owner, initialSupply);
    }

    function transferDep(address _recepient, uint256 _amount) public{
        require(owner != _recepient);
        transfer(_recepient, _amount);
    }
    
    function validatorRegistration(address _validatorAddress) public  payable {
        //check the value
        require(msg.value == 0.0056 ether);
        validtorCount++;
        ownerBalance+= msg.value;
        RegisteredValidators[_validatorAddress] = 60000;
        transferDep(_validatorAddress,5);
    }

    
}