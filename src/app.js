$(document).ready(function() {
	
	setInterval(function() {
			getPolicy();
		}, 30000); 

	
	if (typeof web3 !== 'undefined') {
		console.warn("Using web3 detected from external source like Metamask")
		// Use Mist/MetaMask's provider
		window.web3 = new Web3(web3.currentProvider);
	} else {
		console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
		// fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
		window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	}
  
	const schedulingNode = 'http://35.244.76.127:8080'; 

	
	const DAY_IN_SECONDS = 60;    //How many seconds in a day. 60 for testing, 86400 for Production
	const ETHER = 1000000000000000000; 
    const contractFactoryAddress = "0x88fA9aD18910ce61412AF3041D263F471F843E19";
	
	const contractFactoryABI = [{"constant":true,"inputs":[{"name":"_contract","type":"address"}],"name":"getContract","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_address","type":"address"}],"name":"getContractStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"ORACLE_CONTRACT","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getInsurer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DAY_IN_SECONDS","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"JOB_ID","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getContractBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"endContractProvider","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"LINK_ROPSTEN","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"insurer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_client","type":"address"},{"name":"_duration","type":"uint256"},{"name":"_premium","type":"uint256"},{"name":"_totalCover","type":"uint256"},{"name":"_cropLocation","type":"string"}],"name":"newContract","outputs":[{"name":"","type":"address"}],"payable":true,"stateMutability":"payable","type":"function"},{"inputs":[],"payable":true,"stateMutability":"payable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_insuranceContract","type":"address"},{"indexed":false,"name":"_premium","type":"uint256"},{"indexed":false,"name":"_totalCover","type":"uint256"}],"name":"contractCreated","type":"event"}];
	
	const policyABI = [{"constant":true,"inputs":[],"name":"getCurrentRainfall","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getChainlinkToken","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"checkContract","outputs":[{"name":"requestId","type":"bytes32"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getRequestCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getCurrentRainfallDateChecked","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DAY_IN_SECONDS","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getContractBalance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"renounceOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getDaysWithoutRain","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getTotalCover","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getDuration","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getContractPaid","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"DROUGHT_DAYS_THRESDHOLD","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getNow","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getContractStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getPremium","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getLocation","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_requestId","type":"bytes32"},{"name":"_rainfall","type":"uint256"}],"name":"checkContractCallBack","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"insurer","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getContractStartDate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_client","type":"address"},{"name":"_duration","type":"uint256"},{"name":"_premium","type":"uint256"},{"name":"_totalCover","type":"uint256"},{"name":"_cropLocation","type":"string"},{"name":"_link","type":"address"},{"name":"_oracle","type":"address"},{"name":"_job_id","type":"string"},{"name":"_oraclePaymentAmount","type":"uint256"}],"payable":true,"stateMutability":"payable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_insurer","type":"address"},{"indexed":false,"name":"_client","type":"address"},{"indexed":false,"name":"_duration","type":"uint256"},{"indexed":false,"name":"_premium","type":"uint256"},{"indexed":false,"name":"_totalCover","type":"uint256"}],"name":"contractCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_paidTime","type":"uint256"},{"indexed":false,"name":"_totalPaid","type":"uint256"},{"indexed":false,"name":"_finalRainfall","type":"uint256"}],"name":"contractPaidOut","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_endTime","type":"uint256"},{"indexed":false,"name":"_totalReturned","type":"uint256"}],"name":"contractEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_rainfall","type":"uint256"}],"name":"ranfallThresholdReset","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"requestId","type":"bytes32"}],"name":"dataRequestSent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_rainfall","type":"uint256"}],"name":"dataReceived","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"}],"name":"OwnershipRenounced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"previousOwner","type":"address"},{"indexed":true,"name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"bytes32"}],"name":"ChainlinkRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"bytes32"}],"name":"ChainlinkFulfilled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"id","type":"bytes32"}],"name":"ChainlinkCancelled","type":"event"}];
	const contractFactory = new web3.eth.Contract(contractFactoryABI,contractFactoryAddress);	
	
	
	$('#linkHome').click(function () {
		showView("viewHome")
	});
	$('#linkPurchaseInsurance').click(function () {
		showView("purchaseInsurance")
	});

	$('#linkPolicy').click(function () {
		getPolicy();
		showView("viewPolicy")
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
	
	Date.prototype.toIsoString = function() {
		var tzo = -this.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
		return this.getFullYear() +
        '-' + pad(this.getMonth() + 1) +
        '-' + pad(this.getDate()) +
        'T' + pad(this.getHours()) +
        ':' + pad(this.getMinutes()) +
        ':' + pad(this.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
	}
	
	async function getPolicy() {
		await window.ethereum.enable();	
		
		web3.eth.getAccounts(async function(error, accounts) {
			if (error) {console.log(error);}
			var policyHolder = accounts[0];
			console.log ('policy holder account: ' + policyHolder);
			
			//let contractFactory = new web3.eth.Contract(contractFactoryABI,contractFactoryAddress);	
			
			//first, check to make sure current account has a policy
			let policyAddr = await contractFactory.methods.getContract(policyHolder).call();
			console.log(policyAddr);
			
			var divobj = document.getElementById('policyDetails');
			
			if (policyAddr == 0) {
				console.log('No policy found for account: ' + policyHolder);
				divobj.innerHTML = "Policy Details not found for Address: <b>" + policyHolder + "</b>";
				
			} else {
					console.log('getting details');
					//we have a policy, get details
					let policy = new web3.eth.Contract(policyABI,policyAddr);
					
					let cropLocation = await policy.methods.getLocation().call();
					//console.log(cropLocation);
					
					let totalCover = await policy.methods.getTotalCover().call();
					//console.log(totalCover);
					
					let premium = await policy.methods.getPremium().call();
					//console.log(premium);
					
					let contractStatus = await policy.methods.getContractStatus().call();
					//console.log(contractStatus);
					
					let currentRain = await policy.methods.getCurrentRainfall().call();
					//console.log(currentRain);
					
					let daysWithoutRain = await policy.methods.getDaysWithoutRain().call();
					//console.log(daysWithoutRain);
					
					let requestCount = await policy.methods.getRequestCount().call();
					//console.log(requestCount);
					
					let lastTimeRainChecked = await policy.methods.getCurrentRainfallDateChecked().call();
					//console.log(lastTimeRainChecked);
					
					let duration = await policy.methods.getDuration().call();
					//console.log(duration);
					
					let startDateSecs = await policy.methods.getContractStartDate().call();
					//console.log(startDateSecs);
					var st;
					let contractPaid = await policy.methods.getContractPaid().call();
					if (contractStatus == true)
						st = 'Active';
					else if (contractStatus == false && contractPaid == true)
						st = 'Paid';
					else 
						st = 'Expired';
					
					
					//convert dates
					var startDate = new Date(startDateSecs*1000).toISOString();
					var endDate = new Date(startDateSecs * 1000 + duration * 1000).toISOString();
					var dateLastChecked = new Date(lastTimeRainChecked*1000).toISOString();

					//set div output
					divobj.innerHTML = "Policy: <b><a href = 'https://ropsten.etherscan.io/address/" + policyAddr + "'>" + policyAddr + "</a></b><BR>" +
										"<form action=&quot;&quot;>" + 
										"Location: <input type=&quot;text&quot; name=&quot;location&quot; value=" + cropLocation  + " readonly><br>" + 
										"Total Cover in ETH: <input type=&quot;text&quot; name=&quot;cover&quot; value=" + totalCover / ETHER  + " readonly><br>" + 
										"Premium in ETH: <input type=&quot;text&quot; name=&quot;premium&quot; value=" + premium / ETHER + " readonly><br>" + 
										"Start Date: <input type=&quot;text&quot; name=&quot;startDate&quot; value=" + startDate  + " readonly><br>" + 
										"End Date: <input type=&quot;text&quot; name=&quot;endDate&quot; value=" + endDate  + " readonly><br>" + 
										"Contract Currently Active?: <input type=&quot;text&quot; name=&quot;status&quot; value=" + st  + " readonly><br>" + 
										"Current no of days without precipitation: <input type=&quot;text&quot; name=&quot;daysWithoutRain&quot; value=" + daysWithoutRain  + " readonly><br>" + 
										"Current precipitation in mm: <input type=&quot;text&quot; name=&quot;currentRainfall&quot; value=" + currentRain  + " readonly><br>" + 
										"Number of Data requests completed: <input type=&quot;text&quot; name=&quot;requestCount&quot; value=" + requestCount  + " readonly><br>" + 
										"Last time precipitation was checked: <input type=&quot;text&quot; name=&quot;lastTimeChecked&quot; value=" + dateLastChecked  + " readonly><br>" +
										"</form>";
		
				
			}
			document.getElementById('policyDetails').style.display= 'block' ;
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
		
		web3.eth.getAccounts(async function(error, accounts) {
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
			var eventCaptured = false;
			
			console.log('calling contract factory');
			//let contractFactory = new web3.eth.Contract(contractFactoryABI,contractFactoryAddress);
			var obj = contractFactory.methods.newContract(fromAccount, 
																document.getElementById("duration").value * DAY_IN_SECONDS,           //duration in seconds for presentation purposes, 1 day is 60 seconds, so x by 60 
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
																	
																	// Start watching for event - there is only 1 that can be raised
																	var event = contractFactory.events.allEvents()
																	.on('data', async  (event) => {
																		//console.log(event);
																		//var contractAddress = result.events.contractCreated.returnValues['_insuranceContract']
																		var contractAddress = event.returnValues['_insuranceContract'];
																		console.log('generated address is: ' +  contractAddress);
																		
																		//now that we have address, we can build up the string for the job spec to be created for scheduling the data requests
																		//There must be 1 request per day, so we need the start date/time and end date/time. There may be a lag of a minute, so we need to account for this
																		var jobStartDate = new Date();
																		var jobStartDateStr = jobStartDate.toIsoString();
																		var jobEndDate = jobStartDate;
																		jobEndDate.setSeconds( jobEndDate.getSeconds() + (DAY_IN_SECONDS * 2) + document.getElementById("duration").value * DAY_IN_SECONDS);
																		var jobEndDateStr = jobEndDate.toIsoString();
																		console.log('startDate: ' + jobStartDateStr);
																		console.log('EndDate: ' + jobEndDateStr);
																		
																		//now that we have all parameters, we can build up the job spec string
																		var jobSpec = '{"address":"' + contractAddress + '",' +
																						'"startAt": "' + jobStartDateStr + '",' +
																						'"endAt": "' + jobEndDateStr + '"}';
 

																		console.log('jobspec is: ' + jobSpec);
																		//now that we have the jobspec, we do a POST to the Chainlink Scheduling node to authenticate the request, then another to send the request
																		
																		//authentication with scheduling node
																		//try { await axios.post(schedulingNode + '/sessions', schedulingNodeCred); } catch(error) {console.log('connect error: ' + error);}
																		if (!(eventCaptured)) {
																			console.log('trying to push jobspec');
																			//posting the new jobSpec
																			try { await axios.post(schedulingNode + '/schedule', jobSpec, {headers: {"Content-Type": "application/json"}}); } catch(error) {console.log('job spec create error: ' + error);}
																			eventCaptured = true;
																		}
																		
																		
																		console.log('job spec creation complete')
																	})
																	.on('error', console.error);
																});			
		});		
	}
});