async function checkParticipantExists(participantRegistry, participantId) {
  if (!(await participantRegistry.exists(participantId))) {
    throw new Error("Participant for given ID doesn't exist");
  }
}

async function checkParticipantRole(participant, role) {
  if (participant.role !== role) {
    throw new Error(
      `Participant ${participant.name} is not authorized to perform the task for role ${role}`
    );
  }
}

async function checkAssetExists(assetRegistry, assetId, assetName) {
  if (!(await assetRegistry.exists(assetId))) {
    throw new Error(`The ${assetName} for given id doesn't exist`);
  }
}

async function checkAssetStatus(asset, expectedStatus) {
  if (asset.status !== expectedStatus) {
    throw new Error("You are not authorized to perform this task");
  }
}

async function checkRelationshipExists(contract, relationship, inverted) {
  if (!inverted && !contract.hasOwnProperty(relationship)) {
    throw new Error(`There is no ${relationship} in this contract`);
  } else if (inverted && contract.hasOwnProperty(relationship)) {
    throw new Error(`The ${relationship} already exists in this contract`);
  }
}
