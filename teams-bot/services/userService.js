const { getContainer } = require('./cosmosService');

/**
 * Get a user by their Azure AD Object ID
 * @param {string} aadObjectId - Azure AD Object ID
 * @returns {Promise<object|null>} User object or null if not found
 */
async function getUserByAadId(aadObjectId) {
  if (!aadObjectId) {
    return null;
  }
  
  try {
    const usersContainer = getContainer('users');
    
    const query = {
      query: 'SELECT * FROM c WHERE c.id = @aadObjectId',
      parameters: [
        { name: '@aadObjectId', value: aadObjectId }
      ]
    };
    
    const { resources } = await usersContainer.items.query(query).fetchAll();
    
    if (resources && resources.length > 0) {
      return resources[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user by AAD ID:', error);
    throw error;
  }
}

/**
 * Validate if a user exists in the system
 * @param {string} aadObjectId - Azure AD Object ID
 * @returns {Promise<boolean>} True if user exists
 */
async function userExists(aadObjectId) {
  const user = await getUserByAadId(aadObjectId);
  return user !== null;
}

module.exports = {
  getUserByAadId,
  userExists
};

