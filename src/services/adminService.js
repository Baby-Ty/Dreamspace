// Admin service for DreamSpace - handles admin analytics and user management data
import { ok, fail } from '../utils/errorHandling.js';
import { ERR, ErrorCodes } from '../constants/errors.js';

class AdminService {
  constructor() {
    const isLiveSite = window.location.hostname === 'dreamspace.tylerstewart.co.za';
    this.apiBase = isLiveSite ? 'https://func-dreamspace-prod.azurewebsites.net/api' : '/api';
    this.useCosmosDB = isLiveSite || !!(import.meta.env.VITE_COSMOS_ENDPOINT && import.meta.env.VITE_APP_ENV === 'production');
    
    console.log('🛡️ Admin Service initialized:', {
      useCosmosDB: this.useCosmosDB,
      apiBase: this.apiBase,
      environment: import.meta.env.VITE_APP_ENV
    });
  }

  // Get all users with complete analytics data
  async getAllUsersForAdmin() {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/getAllUsers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Retrieved users for admin from Cosmos DB:', result.users?.length || 0);
        return ok(result.users || []);
      } else {
        // Fallback to localStorage for development
        const users = await this.getLocalStorageUsers();
        console.log('📱 Retrieved users for admin from localStorage:', users.length);
        return ok(users);
      }
    } catch (error) {
      console.error('❌ Error fetching users for admin:', error);
      // Fallback to localStorage on error
      const users = await this.getLocalStorageUsers();
      return ok(users);
    }
  }

  // Calculate admin analytics from user data
  async getAdminAnalytics() {
    try {
      const result = await this.getAllUsersForAdmin();
      if (!result.success) {
        return result;
      }
      const users = result.data;
      
      // Calculate basic stats
      const totalUsers = users.length;
      const usersWithDreamBooks = users.filter(user => 
        (user.dreamBook && user.dreamBook.length > 0) || (user.dreamsCount > 0)
      ).length;
      const dreamBookPercentage = totalUsers > 0 ? Math.round((usersWithDreamBooks / totalUsers) * 100) : 0;
      
      // Get all dream categories from users
      const allCategories = [...new Set(
        users.flatMap(user => user.dreamCategories || [])
      )];
      
      // Category popularity stats
      const categoryStats = allCategories.map(category => {
        const usersWithCategory = users.filter(user => 
          user.dreamCategories && user.dreamCategories.includes(category)
        ).length;
        return {
          category,
          count: usersWithCategory,
          percentage: totalUsers > 0 ? Math.round((usersWithCategory / totalUsers) * 100) : 0
        };
      }).sort((a, b) => b.count - a.count);

      // Most active connectors
      const topConnectors = [...users]
        .sort((a, b) => (b.connectsCount || 0) - (a.connectsCount || 0))
        .slice(0, 5);

      // Low engagement users (users with score < 20)
      const lowEngagementUsers = users.filter(user => (user.score || 0) < 20);

      // Office distribution
      const officeStats = {};
      users.forEach(user => {
        const office = user.office || 'Unknown';
        officeStats[office] = (officeStats[office] || 0) + 1;
      });

      // Active vs inactive users
      const activeUsers = users.filter(user => (user.score || 0) > 0);
      const inactiveUsers = users.filter(user => (user.score || 0) === 0);

      const analytics = {
        totalUsers,
        usersWithDreamBooks,
        dreamBookPercentage,
        categoryStats,
        topConnectors,
        lowEngagementUsers,
        officeStats,
        activeUsers: activeUsers.length,
        inactiveUsers: inactiveUsers.length,
        engagementRate: totalUsers > 0 ? Math.round((activeUsers.length / totalUsers) * 100) : 0,
        averageScore: totalUsers > 0 ? Math.round(users.reduce((sum, user) => sum + (user.score || 0), 0) / totalUsers) : 0,
        totalDreams: users.reduce((sum, user) => sum + (user.dreamsCount || 0), 0),
        totalConnects: users.reduce((sum, user) => sum + (user.connectsCount || 0), 0),
        lastUpdated: new Date().toISOString()
      };

      console.log('📊 Calculated admin analytics:', {
        totalUsers: analytics.totalUsers,
        dreamBookPercentage: analytics.dreamBookPercentage,
        engagementRate: analytics.engagementRate,
        categoriesFound: categoryStats.length
      });

      return ok(analytics);
    } catch (error) {
      console.error('❌ Error calculating admin analytics:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to calculate analytics');
    }
  }

  // Get available offices for filtering
  async getOffices() {
    try {
      const result = await this.getAllUsersForAdmin();
      if (!result.success) {
        return result;
      }
      const users = result.data;
      const offices = [...new Set(users.map(user => user.office).filter(office => office))];
      return ok(offices.sort());
    } catch (error) {
      console.error('❌ Error fetching offices:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to fetch offices');
    }
  }

  // Update user data (for admin management)
  async updateUserData(userId, userData) {
    try {
      if (this.useCosmosDB) {
        const response = await fetch(`${this.apiBase}/saveUserData/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        if (!response.ok) {
          return fail(ErrorCodes.NETWORK, `HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Updated user data via admin:', userId);
        return ok(result);
      } else {
        // Handle locally for development
        console.log('📱 Updated user data in localStorage:', userId);
        return ok(null);
      }
    } catch (error) {
      console.error('❌ Error updating user data:', error);
      return fail(ErrorCodes.UNKNOWN, error.message || 'Failed to update user data');
    }
  }

  // === LOCAL STORAGE FALLBACK METHODS (Development Mode) ===

  async getLocalStorageUsers() {
    const stored = localStorage.getItem('dreamspace_all_users');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Import mock data as fallback
    try {
      const { allUsers } = await import('../data/mockData.js');
      localStorage.setItem('dreamspace_all_users', JSON.stringify(allUsers));
      return allUsers;
    } catch (error) {
      console.error('Error loading mock user data:', error);
      return [];
    }
  }
}

// Create and export singleton instance
export const adminService = new AdminService();
export default adminService;
