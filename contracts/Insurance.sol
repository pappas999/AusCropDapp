pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;


//Truffle Imports
import "chainlink/contracts/ChainlinkClient.sol";
import "chainlink/contracts/vendor/Ownable.sol";
import "chainlink/contracts/interfaces/LinkTokenInterface.sol";


contract InsuranceProvider {
    
    using SafeMath_Chainlink for uint;
    address public insurer = msg.sender;

    uint public constant DAY_IN_SECONDS = 60; //How many seconds in a day. 60 for testing, 86400 for Production
    
    uint256 constant private ORACLE_PAYMENT = 0.1 * 1 ether;
    address public constant LINK_ROPSTEN = 0x20fE562d797A42Dcb3399062AE9546cd06f63280; //address of LINK token on Ropsten
    address public constant ORACLE_CONTRACT = 0x4a3fbbb385b5efeb4bc84a25aaadcd644bd09721;
    string public constant JOB_ID = '6e34d8df2b864393a1f6b7e38917706b';
    
        
    //here is where all the insurance contracts are stored. 1 contract allowed per customer/address
    mapping (address => Insurance) contracts; 
    
    
    constructor()   public payable {
        
    }

    
    modifier onlyOwner() {
		require(insurer == msg.sender,'Only Insurance provider can do this');
        _;
    }
    
    event contractCreated(address _insurer, uint _premium, uint _totalCover);
    
    //create a new contract for client, automatically approved and deployed to the blockchain
    function newContract(address _client, uint _duration, uint _premium, uint _totalCover, string _cropLocation) public payable returns(address) {
        
        //to do extra validation to ensure preimium paid matches with total _totalCover
        require (msg.value > _totalCover.div(100),'Incorrect premium paid');
        
        //create contract, send payout amount plus some extra ether so contract has enough gas to do payout tranasctions 
        Insurance i = (new Insurance).value(_totalCover)(_client, _duration, _premium, _totalCover, _cropLocation,
                                                         LINK_ROPSTEN, ORACLE_CONTRACT,JOB_ID, ORACLE_PAYMENT);
          
        contracts[_client] = i;  //store contract in contracts Map
        
        emit contractCreated(address(i), msg.value, _totalCover);
        
        //now that contract has been created, we need to fund it with enough LINK tokens to fulfil 1 Oracle request per day
        LinkTokenInterface link = LinkTokenInterface(i.getChainlinkToken());
        link.transfer(address(i), (_duration.div(DAY_IN_SECONDS)) * 1 ether);
        
        return address(i);
        
    }
    
    //view functions used for viewing contract status on the frontend
    function getContract(address _contract) external view returns (Insurance) {
        return contracts[_contract];
    }
    
    function getInsurer() external view returns (address) {
        return insurer;
    }
    
    function getContractStatus(address _address) external view returns (bool) {
        Insurance i = Insurance(_address);
        return i.getContractStatus();
    }
    
    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    }
    
    //function to end provider contract, in case of bugs or needing to update logic etc, funds are returned to insurance provider, including any remaining LINK tokens
    function endContractProvider() external payable onlyOwner() {
        LinkTokenInterface link = LinkTokenInterface(LINK_ROPSTEN);
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
        selfdestruct(insurer);
    }
    
    //fallback function, to receive ether
    function() external payable {  }

}

contract Insurance is ChainlinkClient, Ownable  {
    
    using SafeMath_Chainlink for uint;
    
    uint public constant DAY_IN_SECONDS = 60; //How many seconds in a day. 60 for testing, 86400 for Production
    uint public constant DROUGHT_DAYS_THRESDHOLD = 10;  //Number of consecutive days without rainfall to be defined as a drought
    //uint public constant DROUGHT_RAINFALL_THRESDHOLD = 3;  //3 days above the temp is the trigger for contract conditions to be reached
    string constant OPEN_WEATHER_URL = "https://openweathermap.org/data/2.5/weather?";
    string constant OPEN_WEATHER_KEY = "b6907d289e10d714a6e88b30761fae22";
    uint256 private oraclePaymentAmount;
    string private jobId;

    
    address public insurer;
    address  client;
    uint contractStartDate;
    uint startDate;
    uint duration;
    uint premium;
    uint totalCover;
    string cropLocation;
    

    uint daysWithoutRain;                   //how many days there has been with 0 rain
    bool contractActive;                    //is the contract currently active, or has it ended
    uint currentRainfall = 0;               //what is the current rainfall for the location
    uint currentRainfallDateChecked = now;  //when the last rainfall check was performed
    uint requestCount = 0;                  //how many requests for rainfall data have been made so far for this insurance contract
    

    /**
     * @dev Prevents a function being run unless it's called by Insurance Provider
     */
    modifier onlyOwner() {
		require(insurer == msg.sender,'Only Insurance provider can do this');
        _;
    }
    
    /**
     * @dev Prevents a function being run unless the Insurance Contract duration has been reached
     */
    modifier onContractEnded() {
        if (contractStartDate + duration < now) {
          _;  
        } 
    }
    
    /**
     * @dev Prevents a function being run unless contract is still active
     */
    modifier onContractActive() {
        require(contractActive == true ,'Contract has ended, cant interact with it anymore');
        _;
    }

    /**
     * @dev Prevents a data request to be called unless it's been a day since the last call (to avoid spamming and spoofing results)
     */    
    modifier callFrequencyOncePerDay() {
        require(now - currentRainfallDateChecked > DAY_IN_SECONDS,'Can only check temeprature once per day');
        _;
    }
    
    event contractCreated(address _insurer, address _client, uint _duration, uint _premium, uint _totalCover);
    event contractPaidOut(uint _paidTime, uint _totalPaid, uint _finalRainfall);
    event contractEnded(uint _endTime, uint _totalReturned);
    event ranfallThresholdReached(uint _rainfall);
    event dataRequestSent(bytes32 requestId);
    event dataReceived(uint _rainfall);

    /**
     * @dev Creates a new Insurance contract
     * @param _client The client address that is purchasing the insurance contract
     */ 
    constructor(address _client, uint _duration, uint _premium, uint _totalCover, string _cropLocation, 
                address _link, address _oracle, string _job_id, uint256 _oraclePaymentAmount)  payable Ownable() public {
        
        //initialize variables required for Chainlink Node interaction
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        jobId = _job_id;
        oraclePaymentAmount = _oraclePaymentAmount;
        
        //first ensure insurer has fully funded the contract
        require(msg.value > _totalCover, "Not enough funds sent to contract");
        
        //now initialize values for the contract
        insurer= msg.sender;
        client = _client;
        startDate = now;
        duration = _duration;
        premium = _premium;
        totalCover = _totalCover;
        daysWithoutRain = 0;
        contractActive = true;
        cropLocation = _cropLocation;
        contractStartDate = now;
        
        emit contractCreated(insurer,
                             client,
                             duration,
                             premium,
                             totalCover);
    }
    
    /**
     * @dev Calls out to an Oracle to obtain weather data
     */ 
    function checkContract() external onContractActive() returns (bytes32 requestId)   {
        //first call end contract in case of insurance contract duration expiring, if it hasn't won't do anything
        endContract();
        
        //contract may have been marked inactive above, only do request if needed
        if (contractActive) {
        
            //grab updated weather info via Oracle request, should update currentRainfall
            // newRequest takes a JobID, a callback address, and callback function as input
            Chainlink.Request memory req = buildChainlinkRequest(stringToBytes32(jobId), address(this), this.checkContractCallBack.selector);

        
            // Adds an integer with the key "city" to the request parameters, to be used by the Oracle node as a parameter when making a REST request
            //string memory url = string(abi.encodePacked(OPEN_WEATHER_URL, "id=",uint2str(cropLocation),"&appid=",OPEN_WEATHER_KEY));
            //req.add("get", url); //sends the GET request to the oracle
            //req.add("path", "main.temp");  //sends the path to be traversed when the GET returns data
            //req.addInt("times", 100);     //tells the Oracle to * the result by 100 
            
            req.add("q", cropLocation);
            req.add("copyPath","data.current_condition.0.precipMM");
        
            //sends the request to the Oracle Contract which will emit an event that the Oracle Node will pick up and action
            requestId = sendChainlinkRequestTo(chainlinkOracleAddress(), req, oraclePaymentAmount); 
            
            requestCount +=1;
            emit dataRequestSent(requestId);
        }
    }
    
    
    /**
     * @dev Callback function - This gets called by the Oracle Contract when the Oracle Node passes data back to the Oracle Contract/
     * The function will take the rainfall given by the Oracle and updated the Inusrance Contract state
     */ 
    function checkContractCallBack(bytes32 _requestId, uint256 _rainfall) public payable recordChainlinkFulfillment(_requestId) onContractActive() callFrequencyOncePerDay()  {
        //set current temperature to value returned from Oracle, and store date this was retrieved (to avoid spam and gaming the contract)
        currentRainfall = _rainfall;
        currentRainfallDateChecked = now;
        emit dataReceived(_rainfall);
        
        //check if payout conditions have been met, if so call payoutcontract, which should also end/kill contract at the end
        if (currentRainfall == 0 ) { //temp threshold has been  met, add a day of over threshold
            daysWithoutRain += 1;
        } else {
            //there was rain today, so reset daysWithoutRain parameter 
            daysWithoutRain = 0;
            emit ranfallThresholdReached(currentRainfall);
        }
        
        if (daysWithoutRain >= DROUGHT_DAYS_THRESDHOLD) {  // day threshold has been met
            //need to pay client out insurance amount
            payOutContract();
        }
    }
    
    
    /**
     * @dev Insurance conditions have been met, do payout of total cover amount to client
     */ 
    function payOutContract() private onContractActive()  {
        
        //Transfer agreed amount to client
        client.transfer(totalCover);
        
        //Transfer any remaining funds (premium) back to Insurer
        insurer.transfer(address(this).balance);
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(insurer, link.balanceOf(address(this))), "Unable to transfer");
        
        emit contractPaidOut(now, totalCover, currentRainfall);
        
        //now that amount has been transferred, can end the contract 
        //mark contract as ended, so no future calls can be done
        contractActive = false;
    
    }  
    
    /**
     * @dev Insurance conditions have not been met, and contract expired, end contract and return funds
     */ 
    function endContract() private onContractEnded()   {
        //Insurer needs to have performed at least 1 weather call per day to be eligible to retrieve funds back.
        //We will allow for 1 missed weather call to account for unexpected issues on a given day.
        if (requestCount >= (duration.div(DAY_IN_SECONDS) - 1)) {
            //return funds back to insurance provider then end/kill the contract
            insurer.transfer(address(this).balance);
        } else { //insurer hasn't done the minimum number of data requests, client is eligible to receive his premium back
            client.transfer(premium);
            insurer.transfer(address(this).balance);
        }
        
        //transfer any remaining LINK tokens back to the insurer
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(insurer, link.balanceOf(address(this))), "Unable to transfer remaining LINK tokens");
        
        //mark contract as ended, so no future state changes can occur on the contract
        contractActive = false;
        emit contractEnded(now, address(this).balance);
    }
    
    
    /**
     * @dev Get the balance of the contract
     */ 
    function getContractBalance() external view returns (uint) {
        return address(this).balance;
    } 
    
    /**
     * @dev Get the status of the contract
     */ 
    function getContractStatus() external view returns (bool) {
        return contractActive;
    }
    
    /**
     * @dev Get the current recorded rainfall for the contract
     */ 
    function getCurrentRainfall() external view returns (uint) {
        return currentRainfall;
    }
    
    /**
     * @dev Get the recorded number of days without rain
     */ 
    function getDaysWithoutRain() external view returns (uint) {
        return daysWithoutRain;
    }
    
    /**
     * @dev Get the count of requests that has occured for the Insurance Contract
     */ 
    function getRequestCount() external view returns (uint) {
        return requestCount;
    }
    
    /**
     * @dev Get the last time that the rainfall was checked for the contract
     */ 
    function getCurrentRainfallDateChecked() external view returns (uint) {
        return currentRainfallDateChecked;
    }
    
    /**
     * @dev Get the contract duration
     */ 
    function getDuration() external view returns (uint) {
        return duration;
    }
    
    /**
     * @dev Get the contract start date
     */ 
    function getContractStartDate() external view returns (uint) {
        return startDate;
    }
    
    /**
     * @dev Get the current date/time according to the blockchain
     */ 
    function getNow() external view returns (uint) {
        return now;
    }
    
    /**
     * @dev Get address of the chainlink token
     */ 
    function getChainlinkToken() public view returns (address) {
        return chainlinkTokenAddress();
    }
    
    /**
     * @dev Helper function for converting a string to a bytes32 object
     */ 
    function stringToBytes32(string memory source) private pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
         return 0x0;
        }

        assembly { // solhint-disable-line no-inline-assembly
        result := mload(add(source, 32))
        }
    }
    
    
    /**
     * @dev Helper function for converting uint to a string
     */ 
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
    
    /**
     * @dev Fallback function so contrat can receive ether when required
     */ 
    function() external payable {  }

    
}