// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CriminalRegistry {

    struct Criminal {
        string  criminalId;
        string  name;
        uint256 age;
        string  crimeHistory;
        string  embeddingHash;
        uint256 registeredAt;
        address registeredBy;
        bool    isActive;
    }

    struct IdentificationLog {
        string  criminalId;
        string  videoFile;
        uint256 timestamp;
        uint256 confidence;
        uint256 frameCount;
        uint256 detectedAt;
    }

    mapping(string => Criminal) private criminals;
    string[] private criminalIds;
    IdentificationLog[] private identificationLogs;
    mapping(address => bool) public authorizedOfficers;
    address public admin;

    event CriminalRegistered(
        string  criminalId,
        string  name,
        address officer,
        uint256 timestamp
    );

    event CriminalIdentified(
        string  criminalId,
        string  videoFile,
        uint256 confidence,
        uint256 timestamp
    );

    event OfficerAdded(address officer, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can do this");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedOfficers[msg.sender] || msg.sender == admin,
            "Not authorized officer"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedOfficers[msg.sender] = true;
    }

    function addOfficer(address officer) external onlyAdmin {
        authorizedOfficers[officer] = true;
        emit OfficerAdded(officer, block.timestamp);
    }

    function removeOfficer(address officer) external onlyAdmin {
        authorizedOfficers[officer] = false;
    }

    function registerCriminal(
        string memory criminalId,
        string memory name,
        uint256 age,
        string memory crimeHistory,
        string memory embeddingHash
    ) external onlyAuthorized {
        require(
            bytes(criminals[criminalId].criminalId).length == 0,
            "Criminal ID already exists"
        );
        criminals[criminalId] = Criminal({
            criminalId   : criminalId,
            name         : name,
            age          : age,
            crimeHistory : crimeHistory,
            embeddingHash: embeddingHash,
            registeredAt : block.timestamp,
            registeredBy : msg.sender,
            isActive     : true
        });
        criminalIds.push(criminalId);
        emit CriminalRegistered(
            criminalId, name, msg.sender, block.timestamp
        );
    }

    function logIdentification(
        string memory criminalId,
        string memory videoFile,
        uint256 timestamp,
        uint256 confidence,
        uint256 frameCount
    ) external onlyAuthorized {
        require(
            bytes(criminals[criminalId].criminalId).length != 0,
            "Criminal not found"
        );
        identificationLogs.push(IdentificationLog({
            criminalId : criminalId,
            videoFile  : videoFile,
            timestamp  : timestamp,
            confidence : confidence,
            frameCount : frameCount,
            detectedAt : block.timestamp
        }));
        emit CriminalIdentified(
            criminalId, videoFile, confidence, block.timestamp
        );
    }

    function getCriminal(string memory criminalId)
        external view returns (Criminal memory) {
        require(
            bytes(criminals[criminalId].criminalId).length != 0,
            "Criminal not found"
        );
        return criminals[criminalId];
    }

    function getAllCriminalIds()
        external view returns (string[] memory) {
        return criminalIds;
    }

    function getTotalCriminals()
        external view returns (uint256) {
        return criminalIds.length;
    }

    function getIdentificationLogs()
        external view returns (IdentificationLog[] memory) {
        return identificationLogs;
    }

    function getTotalIdentifications()
        external view returns (uint256) {
        return identificationLogs.length;
    }

    function isCriminalRegistered(string memory criminalId)
        external view returns (bool) {
        return bytes(criminals[criminalId].criminalId).length != 0;
    }
}