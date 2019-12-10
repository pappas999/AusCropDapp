

$(document).ready(function() {
	
	if (typeof web3 !== 'undefined') {
		console.warn("Using web3 detected from external source like Metamask")
		// Use Mist/MetaMask's provider
		window.web3 = new Web3(web3.currentProvider);
	} else {
		console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
		// fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
		window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	}
  
	const ETHER = 1000000000000000000; 
    const contractFactoryAddress = "0x802e60388E2E93C37593D8624772649189e59812";
	const contractFactoryABI = [
	{
		"constant": false,
		"inputs": [],
		"name": "endContractProvider",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_client",
				"type": "address"
			},
			{
				"name": "_duration",
				"type": "uint256"
			},
			{
				"name": "_premium",
				"type": "uint256"
			},
			{
				"name": "_totalCover",
				"type": "uint256"
			},
			{
				"name": "_cropLocation",
				"type": "string"
			}
		],
		"name": "newContract",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "constructor"
	},
	{
		"payable": true,
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "_insuranceContract",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "_premium",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "_totalCover",
				"type": "uint256"
			}
		],
		"name": "contractCreated",
		"type": "event"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "DAY_IN_SECONDS",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_contract",
				"type": "address"
			}
		],
		"name": "getContract",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getContractBalance",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "_address",
				"type": "address"
			}
		],
		"name": "getContractStatus",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getInsurer",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "insurer",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "JOB_ID",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "LINK_ROPSTEN",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "ORACLE_CONTRACT",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
];
	//const INSURER_ADDRESS = "0x32a4a9d725AEb0a8b992d2878De92D3a6CC7E3de";
	
	$('#linkHome').click(function () {
		showView("viewHome")
	});
	$('#linkPurchaseInsurance').click(function () {
		showView("purchaseInsurance")
	});

	$('#calculatePremium').click(calculatePremium);
	$('#submitInsuranceApplication').click(createInsuranceContract);

	// Attach AJAX "loading" event listener
	$(document).on({
		ajaxStart: function () {
			$("#loadingBox").show()
		},
		ajaxStop: function () {
			$("#loadingBox").hide()
		}
	});

	function showView(viewName) {
		// Hide all views and show the selected view only
		$('main > section').hide();
		$('#' + viewName).show();
	}

	function showInfo(message) {
		$('#infoBox>p').html(message);
		$('#infoBox').show();
		$('#infoBox>header').click(function () {
			$('#infoBox').hide();
		});
	}

	function showError(errorMsg) {
		$('#errorBox>p').html("Error: " + errorMsg);
		$('#errorBox').show();
		$('#errorBox>header').click(function () {
			$('#errorBox').hide();
		});
	}

	function calculatePremium() {

		var premium = document.getElementById("totalCover").value * .01;
		if (premium < 0.000001) return showError("Incorrect Premium, please adjust the Total Cover");
		//now update premium field on screen
		var divobj = document.getElementById('calculatedPremium');
		divobj.innerHTML = "Calculated Premium in ETH: <b>" + premium + "</b>";
		document.getElementById('calculatedPremium').style.display= 'block' ;
	}

    
	async function createInsuranceContract() {
		
		var txHash;
		
		//first validate fields
        if (document.getElementById("cropLocation").value == null || document.getElementById("cropLocation").value == "" )
            return showError("Please select a Crop Location");
		
		if (document.getElementById("duration").value == null || document.getElementById("duration").value == "" )
            return showError("Please select a Duration");
		
		if (document.getElementById("totalCover").value == null || document.getElementById("totalCover").value == "" )
            return showError("Please input total cover, must be >0");
		
		//now that fields are validated, generate transaction to send to Insurance provider to pay the premium and generate the contract. We should get back an Etherscan LINK to display on the screen
		
		await window.ethereum.enable();	
		
		web3.eth.getAccounts(function(error, accounts) {
			if (error) {console.log(error);}
			var fromAccount = accounts[0];
			console.log ('from accounts: ' + fromAccount);
			
			
			var premium = (document.getElementById("totalCover").value * 0.01) * ETHER;
			var totalCover = document.getElementById("totalCover").value * ETHER;
			
			//console.log('premium: ' + premium);
			//console.log('total cover: ' + totalCover);
			
			//now that we have validated the fields, we can call the ContractFactory newContract function, which will generate a new instance of the Insurance Smart Contract, passig in all values required
			//to generate a new fully funded insurance contract
			//parameters required: function newContract(address payable _client, uint _duration, uint _premium, uint _totalCover, uint _cropLocation)
			
			console.log('calling contract factory');
			let contractFactory = new web3.eth.Contract(contractFactoryABI,contractFactoryAddress);
			var obj = contractFactory.methods.newContract(fromAccount, 
																document.getElementById("duration").value * 60,           //duration in seconds for presentation purposes, 1 day is 60 seconds, so x by 60 
																premium,                                             //premium
																totalCover,                                          //total cover
																document.getElementById("cropLocation").value)       //crop location
																.send({from: fromAccount, value: premium + premium * 0.01, gasPrice: '20000000000', gasLimit: 8000000  })          //send premium amount as the transaction - premium gets paid to the contract factory					 
																 .on('transactionHash', function(hash){
																	console.log('called contract factory, generated hash is: ' + hash);
																	txHash = hash;
																	
																	//now show link to trans hash
																	var divobj = document.getElementById('transactionHash');
																	divobj.innerHTML = "Insurance Contract created, Transaction Hash: <b><a href = 'https://ropsten.etherscan.io/tx/" + txHash + "'>" + txHash + "</a></b>";
																	document.getElementById('transactionHash').style.display= 'block' ;
																	
																	//get generated contract address
																	//console.log('generated address is: ' + obj);
																	
																	// Or pass a callback to start watching immediately
																	var event = contractFactory.events.allEvents()
																	.on('data', (event) => {
																		console.log(event);
																		 var contractAddress = result.events.contractCreated.returnValues['_insuranceContract']
																		console.log('generated address is: ' +  contractAddress);
																	})
																	.on('error', console.error);

																	/*var myEvent = contractFactory.events.contractCreated({}, {fromBlock: 0, toBlock: 'latest'});
																		myEvent.watch(function(error, result){
																			    var contractAddress = result.events.contractCreated.returnValues['_insuranceContract']
																				console.log('generated address is: ' +  contractAddress);
																	});*/


																	

																});			
		
		});
					
	}

});