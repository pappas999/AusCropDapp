var InsuranceProvider = artifacts.require("InsuranceProvider");
var Oracle = artifacts.require("Oracle");
var chainlinkRopsten = "0x20fE562d797A42Dcb3399062AE9546cd06f63280"; //address of the LINK token on Ropsten
var chainlinkNode = "0x2814aebe13fe9C554F096276B98B97C171912A2F";  //change this to your chainlink node to be used for scheduling requests

module.exports = async function(deployer) {
  deployer.deploy(InsuranceProvider);
  deployer.deploy(Oracle,chainlinkRopsten).then(async () => {
	  var or =  await Oracle.deployed();
	  await or.setFulfillmentPermission(chainlinkNode, true);  
  });
};