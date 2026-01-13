/**
 * Role determination utilities
 * Extracts user role from various sources (Cosmos DB, Entra ID, profile)
 */

/**
 * Determine user role from multiple sources with priority order
 * @param {object} account - MSAL account
 * @param {object} profile - Microsoft Graph profile
 * @param {object} userData - User data from database
 * @returns {string} Role: 'admin' | 'coach' | 'employee'
 */
export function determineUserRole(account, profile, userData) {
  try {
    // PRIORITY 1: Check role from Cosmos DB userData (set via People Hub promotion)
    if (userData?.role) {
      console.log('User role from Cosmos DB:', userData.role);
      if (userData.role === 'admin') return 'admin';
      if (userData.role === 'coach' || userData.role === 'manager') return 'coach';
      if (userData.role === 'user' || userData.role === 'employee') return 'employee';
    }
    
    // PRIORITY 2: Check if user has isCoach flag (legacy support)
    if (userData?.isCoach === true) {
      console.log('User has isCoach flag set to true');
      return 'coach';
    }
    
    // PRIORITY 3: Get roles from the ID token claims (Entra App Roles)
    const idTokenClaims = account?.idTokenClaims;
    const roles = idTokenClaims?.roles || [];
    
    console.log('User roles from Entra ID:', roles);
    
    // Map Entra roles to application roles
    // Priority order: admin > manager > coach > employee
    if (roles.includes('DreamSpace.Admin') || roles.includes('Admin')) {
      return 'admin';
    } else if (roles.includes('DreamSpace.Manager') || roles.includes('Manager')) {
      return 'coach';
    } else if (roles.includes('DreamSpace.Coach') || roles.includes('Coach')) {
      return 'coach';
    }
    
    // PRIORITY 4: Fallback to job title-based logic if no app roles are assigned
    if (profile) {
      const jobTitle = profile.jobTitle?.toLowerCase() || '';
      const department = profile.department?.toLowerCase() || '';
      
      if (jobTitle.includes('admin') || jobTitle.includes('administrator')) {
        return 'admin';
      } else if (jobTitle.includes('manager') || jobTitle.includes('lead') || department.includes('management')) {
        return 'coach';
      } else if (jobTitle.includes('coach') || jobTitle.includes('mentor')) {
        return 'coach';
      }
    }
    
    // Default role
    return 'employee';
  } catch (error) {
    console.error('Error determining user role:', error);
    return 'employee';
  }
}

/**
 * Determine office location from profile
 * @param {object} profile - Microsoft Graph profile
 * @returns {string} Office location
 */
export function determineOfficeFromProfile(profile) {
  if (profile.officeLocation) return profile.officeLocation;
  if (profile.city) return profile.city;
  if (profile.country === 'South Africa') {
    return 'Cape Town'; // Default for SA users
  }
  return 'Remote';
}
