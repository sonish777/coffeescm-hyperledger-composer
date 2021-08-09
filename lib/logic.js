const NS = "org.coffeescm";

/**
	* Create a new contract
    * @param {org.coffeescm.CreateContract} createContract
    * @transaction
*/

async function createContract(contract) {
  const factory = getFactory();  
  try {
    const growerRegistry = await getParticipantRegistry(`${NS}.Grower`);
    const contractRegistry = await getAssetRegistry(`${NS}.Contract`);
    const batchRegistry = await getAssetRegistry(`${NS}.Batch`);
    
    await checkParticipantExists(growerRegistry, contract.grower.userId);
    await checkParticipantRole(contract.grower, "GROWER");
    
    if (await batchRegistry.exists(contract.batchId)) {
      throw new Error("This batch has already been created");
    }
    
   	if (await contractRegistry.exists(contract.contractId)) {
      throw new Error("This contract has already been created");
    }
    
    const newContract = factory.newResource(NS, "Contract", contract.contractId);
  	const newBatch = factory.newResource(NS, "Batch", contract.batchId);
    newContract.createdDateTime = contract.timestamp;
  	newContract.grower = factory.newRelationship(NS, "Grower", contract.grower.userId);
  	newContract.batch = factory.newRelationship(NS, "Batch", contract.batchId);
    newBatch.contract = factory.newRelationship(NS, "Contract", contract.contractId);
    
    await batchRegistry.add(newBatch);
    await contractRegistry.add(newContract);
    
  } catch(error) {
  	console.log(error);
    throw new Error(error);
  }
}

/**
	* Add participants to a contract.
    * @param {org.coffeescm.AddContractParticipants} addContractParticipants
    * @transaction
*/

async function addContractParticipants(tx) {
   const factory = getFactory();
   const { farmInspector, shipper, processor, currentContract } = tx;
    try {
      if(!farmInspector && !shipper && !processor) {
          throw new Error("At least one participant should be included");
      }
	  const contractRegistry = await getAssetRegistry(`${NS}.Contract`);
      await checkAssetExists(contractRegistry, tx.currentContract.contractId, "contract");
      if(farmInspector) {
        const farmInspectorRegistry = await getParticipantRegistry(`${NS}.FarmInspector`);
        await checkRelationshipExists(tx.currentContract, "farmInspector", true);
        await checkParticipantExists(farmInspectorRegistry, tx.farmInspector.userId);
        await checkParticipantRole(tx.farmInspector, "FARMINSPECTOR");
        tx.currentContract.farmInspector = factory.newRelationship(NS, "FarmInspector", tx.farmInspector.userId);
        await contractRegistry.update(tx.currentContract);
      }
      if(shipper) {
        const shipperRegistry = await getParticipantRegistry(`${NS}.Shipper`);
        await checkRelationshipExists(tx.currentContract, "shipper", true);
        await checkParticipantExists(shipperRegistry, tx.shipper.userId);
        await checkParticipantRole(tx.shipper, "SHIPPER");
        tx.currentContract.shipper = factory.newRelationship(NS, "Shipper", tx.shipper.userId);
        await contractRegistry.update(tx.currentContract);
      }
      if(processor) {
        const processorRegistry = await getParticipantRegistry(`${NS}.Processor`);
        await checkRelationshipExists(tx.currentContract, "processor", true);
        await checkParticipantExists(processorRegistry, tx.processor.userId);
        await checkParticipantRole(tx.processor, "PROCESSOR");
        tx.currentContract.processor = factory.newRelationship(NS, "Processor", tx.processor.userId);
        await contractRegistry.update(tx.currentContract);
      }
    } catch(error) {
      console.log(error);
      throw new Error(error);
    }
}

/**
 * Inspect the grown coffee for its seedTypes, family and fertilizers used
 * @param {org.coffeescm.InspectBatch} inspectBatch
 * @transaction
 */

async function inspectBatch(tx) {
  const factory = getFactory();

  try {
    const farmInspectorRegistry = await getParticipantRegistry(
      `${NS}.FarmInspector`
    );
    const contractRegistry = await getAssetRegistry(`${NS}.Contract`);
    const batchRegistry = await getAssetRegistry(`${NS}.Batch`);
    
    await checkAssetExists(contractRegistry, tx.currentContract.contractId, "contract");
    await checkAssetExists(batchRegistry, tx.currentContract.batch.batchId, "batch");
    await checkRelationshipExists(tx.currentContract, "farmInspector");
    await checkAssetStatus(tx.currentContract.batch, "GROWING");
    await checkParticipantExists(farmInspectorRegistry, tx.currentContract.farmInspector.userId);
    await checkParticipantRole(tx.currentContract.farmInspector, "FARMINSPECTOR");

    const updatedBatch = await batchRegistry.get(tx.currentContract.batch.batchId);
    updatedBatch.typeOfSeed = tx.typeOfSeed;
    updatedBatch.coffeeFamily = tx.coffeeFamily;
    updatedBatch.fertilizersUsed = tx.fertilizersUsed;
    updatedBatch.status = "INSPECTION";

    await batchRegistry.update(updatedBatch);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

/**
	* harvested.
    * @param {org.coffeescm.Harvest} harvest
    * @transaction
*/

async function harvest(tx) {
  const factory = getFactory();
  try {
    const growerRegistry = await getParticipantRegistry(`${NS}.Grower`);
	const contractRegistry = await getAssetRegistry(`${NS}.Contract`);
    const batchRegistry = await getAssetRegistry(`${NS}.Batch`);
    
    await checkAssetExists(contractRegistry, tx.currentContract.contractId, "contract");
    await checkAssetExists(batchRegistry, tx.currentContract.batch.batchId, "batch");
    await checkRelationshipExists(tx.currentContract, "grower");
    await checkAssetStatus(tx.currentContract.batch, "INSPECTION");
    await checkParticipantExists(growerRegistry, tx.currentContract.grower.userId);
    await checkParticipantRole(tx.currentContract.grower, "GROWER");

    const updatedBatch = await batchRegistry.get(tx.currentContract.batch.batchId);
    updatedBatch.status = "HARVESTED";
    updatedBatch.harvestedDateTime = tx.timestamp;
    
    await batchRegistry.update(updatedBatch);
    
  } catch(error) {
  	console.log(error);
    throw new Error(error);
  }
  
}

/**
 * batch ready for shipment, update the shipping details
 * @param {org.coffeescm.ShipBatch} shipBatch
 * @transaction
 */

async function shipBatch(tx) {
  const factory = getFactory();

  try {
    const shipperRegistry = await getParticipantRegistry(`${NS}.Shipper`);
	const contractRegistry = await getAssetRegistry(`${NS}.Contract`);
    const batchRegistry = await getAssetRegistry(`${NS}.Batch`);

    await checkAssetExists(contractRegistry, tx.currentContract.contractId, "contract");
    await checkAssetExists(batchRegistry, tx.currentContract.batch.batchId, "batch");
    await checkRelationshipExists(tx.currentContract, "shipper");
    await checkAssetStatus(tx.currentContract.batch, "HARVESTED");
    await checkParticipantExists(shipperRegistry, tx.currentContract.shipper.userId);
    await checkParticipantRole(tx.currentContract.shipper, "SHIPPER");

    const updatedBatch = await batchRegistry.get(tx.currentContract.batch.batchId);
    updatedBatch.status = "SHIPPING";
    updatedBatch.warehouseName = tx.warehouseName;
    updatedBatch.warehouseAddress = tx.warehouseAddress;
    updatedBatch.shipName = tx.shipName;
    updatedBatch.shipId = tx.shipId;
    updatedBatch.shippingQuantity = tx.shippingQuantity;
    updatedBatch.estimatedDateTime = tx.estimatedDateTime;

    await batchRegistry.update(updatedBatch);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

/**
 * Shipped batch are now processed, and the processed details are updated.
 * @param {org.coffeescm.ProcessBatch} processBatch
 * @transaction
 */

async function processBatch(tx) {
  const factory = getFactory();
  try {
    const batchRegistry = await getAssetRegistry(`${NS}.Batch`);
	const contractRegistry = await getAssetRegistry(`${NS}.Contract`);
    const processorRegistry = await getParticipantRegistry(`${NS}.Processor`);

    await checkAssetExists(contractRegistry, tx.currentContract.contractId, "contract");
    await checkAssetExists(batchRegistry, tx.currentContract.batch.batchId, "batch");
    await checkRelationshipExists(tx.currentContract, "processor");
    await checkAssetStatus(tx.currentContract.batch, "SHIPPING");
    await checkParticipantExists(processorRegistry, tx.currentContract.processor.userId);
    await checkParticipantRole(tx.currentContract.processor, "PROCESSOR");

    const updatedBatch = await batchRegistry.get(tx.currentContract.batch.batchId);
    updatedBatch.status = "PROCESSING";
    updatedBatch.packagingDateTime = tx.packagingDateTime;
    updatedBatch.packagedCount = tx.packagedCount;
    updatedBatch.temperature = tx.temperature;
    updatedBatch.roastingTime = tx.roastingTime;

    await batchRegistry.update(updatedBatch);
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
