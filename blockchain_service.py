# blockchain_service.py
import json
import hashlib
import numpy as np
from web3 import Web3

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
        if not self.w3.is_connected():
            raise Exception("Cannot connect to blockchain!")
        print(f"Blockchain connected! Block: {self.w3.eth.block_number}")

        with open("contract_info.json") as f:
            info = json.load(f)

        self.contract = self.w3.eth.contract(
            address=info["address"], abi=info["abi"]
        )
        self.account = self.w3.eth.accounts[0]
        print(f"Using account: {self.account}")

    def embedding_to_hash(self, embedding: np.ndarray) -> str:
        return hashlib.sha256(embedding.tobytes()).hexdigest()

    def register_criminal(self, criminal_id, name, age,
                          crime_history, embedding):
        embedding_hash = self.embedding_to_hash(embedding)
        try:
            tx = self.contract.functions.registerCriminal(
                criminal_id, name, age,
                crime_history, embedding_hash
            ).transact({"from": self.account})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            print(f"Criminal registered on blockchain!")
            print(f"TX: {receipt.transactionHash.hex()}")
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"Blockchain error: {e}")
            return None

    def log_evidence(self, criminal_id, evidence_id,
                     evidence_type, file_hash, description):
        try:
            tx = self.contract.functions.logEvidence(
                criminal_id, evidence_id,
                evidence_type, file_hash or "",
                description or ""
            ).transact({"from": self.account})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            print(f"Evidence logged on blockchain!")
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"Blockchain error: {e}")
            return None

    def log_court_decision(self, criminal_id, decision_id,
                           court_name, verdict, sentence,
                           hearing_date_ts=0):
        try:
            tx = self.contract.functions.logCourtDecision(
                criminal_id, decision_id, court_name,
                verdict or "", sentence or "",
                int(hearing_date_ts)
            ).transact({"from": self.account})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            print(f"Court decision logged on blockchain!")
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"Blockchain error: {e}")
            return None

    def log_identification(self, criminal_id, video_file,
                           timestamp, confidence, frame_count):
        try:
            tx = self.contract.functions.logIdentification(
                criminal_id, video_file,
                int(timestamp),
                int(confidence * 10000),
                frame_count
            ).transact({"from": self.account})
            receipt = self.w3.eth.wait_for_transaction_receipt(tx)
            print(f"Identification logged on blockchain!")
            return receipt.transactionHash.hex()
        except Exception as e:
            print(f"Blockchain error: {e}")
            return None

    def get_criminal(self, criminal_id):
        try:
            r = self.contract.functions.getCriminal(
                criminal_id
            ).call()
            return {
                "criminal_id"   : r[0],
                "name"          : r[1],
                "age"           : r[2],
                "crime_history" : r[3],
                "embedding_hash": r[4],
                "registered_at" : r[5],
                "registered_by" : r[6],
                "is_active"     : r[7]
            }
        except Exception as e:
            print(f"Error: {e}")
            return None

    def get_all_ids(self):
        return self.contract.functions.getAllCriminalIds().call()

    def get_total_criminals(self):
        return self.contract.functions.getTotalCriminals().call()

    def get_evidence_for_criminal(self, criminal_id):
        try:
            logs = self.contract.functions\
                .getEvidenceForCriminal(criminal_id).call()
            return [{
                "criminal_id"  : l[0],
                "evidence_id"  : l[1],
                "evidence_type": l[2],
                "file_hash"    : l[3],
                "description"  : l[4],
                "logged_at"    : l[5],
                "logged_by"    : l[6],
            } for l in logs]
        except:
            return []

    def get_court_decisions_for_criminal(self, criminal_id):
        try:
            logs = self.contract.functions\
                .getCourtDecisionsForCriminal(criminal_id).call()
            return [{
                "criminal_id" : l[0],
                "decision_id" : l[1],
                "court_name"  : l[2],
                "verdict"     : l[3],
                "sentence"    : l[4],
                "hearing_date": l[5],
                "logged_at"   : l[6],
                "logged_by"   : l[7],
            } for l in logs]
        except:
            return []

    def get_identification_logs(self):
        try:
            logs = self.contract.functions\
                .getIdentificationLogs().call()
            return logs
        except:
            return []

    def is_criminal_registered(self, criminal_id):
        return self.contract.functions\
            .isCriminalRegistered(criminal_id).call()