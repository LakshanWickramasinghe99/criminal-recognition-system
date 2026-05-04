async function main() {
    const { ethers } = require("hardhat");
    
    console.log("Deploying CriminalRegistry contract...");

    const CriminalRegistry = await ethers.getContractFactory(
        "CriminalRegistry"
    );
    const registry = await CriminalRegistry.deploy();
    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log("CriminalRegistry deployed to:", address);

    const fs = require("fs");
    const data = {
        address: address,
        abi: JSON.parse(
            fs.readFileSync(
                "artifacts/contracts/CriminalRegistry.sol/CriminalRegistry.json"
            )
        ).abi
    };
    fs.writeFileSync(
        "../contract_info.json",
        JSON.stringify(data, null, 2)
    );
    console.log("Contract info saved to contract_info.json ✅");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});