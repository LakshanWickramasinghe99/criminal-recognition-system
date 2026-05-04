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

    struct EvidenceLog {
        string  criminalId;
        string  evidenceId;
        string  evidenceType;
        string  fileHash;
        string  description;
        uint256 loggedAt;
        address loggedBy;
    }

    struct CourtDecisionLog {
        string  criminalId;
        string  decisionId;
        string  courtName;
        string  verdict;
        string  sentence;
        uint256 hearingDate;
        uint256 loggedAt;
        address loggedBy;
    }

    struct IdentificationLog {
        string  criminalId;
        string  videoFile;
        uint256 timestamp;
        uint256 confidence;
        uint256 frameCount;
        uint256 detectedAt;
    }

    mapping(string => Criminal)  private criminals;
    string[]                     private criminalIds;
    EvidenceLog[]                private evidenceLogs;
    CourtDecisionLog[]           private courtDecisionLogs;
    IdentificationLog[]          private identificationLogs;
    mapping(address => bool)     public  authorizedOfficers;
    address                      public  admin;

    event CriminalRegistered(string criminalId, string name,
                             address officer, uint256 timestamp);
    event EvidenceLogged(string criminalId, string evidenceId,
                         string fileHash, uint256 timestamp);
    event CourtDecisionLogged(string criminalId, string decisionId,
                              string verdict, uint256 timestamp);
    event CriminalIdentified(string criminalId, string videoFile,
                             uint256 confidence, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    modifier onlyAuthorized() {
        require(authorizedOfficers[msg.sender] ||
                msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedOfficers[msg.sender] = true;
    }

    function addOfficer(address officer) external onlyAdmin {
        authorizedOfficers[officer] = true;
    }

    function removeOfficer(address officer) external onlyAdmin {
        authorizedOfficers[officer] = false;
    }

    // ── Register criminal ─────────────────────────────────
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
        emit CriminalRegistered(criminalId, name,
                                msg.sender, block.timestamp);
    }

    // ── Log evidence ──────────────────────────────────────
    function logEvidence(
        string memory criminalId,
        string memory evidenceId,
        string memory evidenceType,
        string memory fileHash,
        string memory description
    ) external onlyAuthorized {
        require(
            bytes(criminals[criminalId].criminalId).length != 0,
            "Criminal not found"
        );
        evidenceLogs.push(EvidenceLog({
            criminalId  : criminalId,
            evidenceId  : evidenceId,
            evidenceType: evidenceType,
            fileHash    : fileHash,
            description : description,
            loggedAt    : block.timestamp,
            loggedBy    : msg.sender
        }));
        emit EvidenceLogged(criminalId, evidenceId,
                            fileHash, block.timestamp);
    }

    // ── Log court decision ────────────────────────────────
    function logCourtDecision(
        string memory criminalId,
        string memory decisionId,
        string memory courtName,
        string memory verdict,
        string memory sentence,
        uint256 hearingDate
    ) external onlyAuthorized {
        require(
            bytes(criminals[criminalId].criminalId).length != 0,
            "Criminal not found"
        );
        courtDecisionLogs.push(CourtDecisionLog({
            criminalId : criminalId,
            decisionId : decisionId,
            courtName  : courtName,
            verdict    : verdict,
            sentence   : sentence,
            hearingDate: hearingDate,
            loggedAt   : block.timestamp,
            loggedBy   : msg.sender
        }));
        emit CourtDecisionLogged(criminalId, decisionId,
                                 verdict, block.timestamp);
    }

    // ── Log identification ────────────────────────────────
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
            criminalId: criminalId,
            videoFile : videoFile,
            timestamp : timestamp,
            confidence: confidence,
            frameCount: frameCount,
            detectedAt: block.timestamp
        }));
        emit CriminalIdentified(criminalId, videoFile,
                                confidence, block.timestamp);
    }

    // ── Read functions ────────────────────────────────────
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

    function getEvidenceLogs()
        external view returns (EvidenceLog[] memory) {
        return evidenceLogs;
    }

    function getEvidenceForCriminal(string memory criminalId)
        external view returns (EvidenceLog[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < evidenceLogs.length; i++) {
            if (keccak256(bytes(evidenceLogs[i].criminalId)) ==
                keccak256(bytes(criminalId))) count++;
        }
        EvidenceLog[] memory result = new EvidenceLog[](count);
        uint256 idx = 0;
        for (uint i = 0; i < evidenceLogs.length; i++) {
            if (keccak256(bytes(evidenceLogs[i].criminalId)) ==
                keccak256(bytes(criminalId))) {
                result[idx++] = evidenceLogs[i];
            }
        }
        return result;
    }

    function getCourtDecisions()
        external view returns (CourtDecisionLog[] memory) {
        return courtDecisionLogs;
    }

    function getCourtDecisionsForCriminal(string memory criminalId)
        external view returns (CourtDecisionLog[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < courtDecisionLogs.length; i++) {
            if (keccak256(bytes(courtDecisionLogs[i].criminalId)) ==
                keccak256(bytes(criminalId))) count++;
        }
        CourtDecisionLog[] memory result =
            new CourtDecisionLog[](count);
        uint256 idx = 0;
        for (uint i = 0; i < courtDecisionLogs.length; i++) {
            if (keccak256(bytes(courtDecisionLogs[i].criminalId)) ==
                keccak256(bytes(criminalId))) {
                result[idx++] = courtDecisionLogs[i];
            }
        }
        return result;
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