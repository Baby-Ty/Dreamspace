import React, { useState } from 'react';
import { Users, MapPin, TrendingUp, Award, AlertCircle, Filter, Settings } from 'lucide-react';
import { allUsers, offices, dreamCategories } from '../data/mockData';
import UserManagementModal from '../components/UserManagementModal';

const AdminDashboard = () => {
  const [anonymizeNames, setAnonymizeNames] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'users'
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Calculate stats
  const totalUsers = allUsers.length;
  const usersWithDreamBooks = allUsers.filter(user => user.dreamsCount > 0).length;
  const dreamBookPercentage = Math.round((usersWithDreamBooks / totalUsers) * 100);
  
  // Category popularity
  const categoryStats = dreamCategories.map(category => {
    const usersWithCategory = allUsers.filter(user => 
      user.dreamCategories.includes(category)
    ).length;
    return {
      category,
      count: usersWithCategory,
      percentage: Math.round((usersWithCategory / totalUsers) * 100)
    };
  }).sort((a, b) => b.count - a.count);

  // Most active connectors
  const topConnectors = [...allUsers]
    .sort((a, b) => b.connectsCount - a.connectsCount)
    .slice(0, 5);

  // Low engagement users (users with score < 20)
  const lowEngagementUsers = allUsers.filter(user => user.score < 20);

  // Filter users by office
  const filteredUsers = selectedOffice === 'all' 
    ? allUsers 
    : allUsers.filter(user => user.office === selectedOffice);

  const anonymizeName = (name) => {
    if (!anonymizeNames) return name;
    const parts = name.split(' ');
    return `${parts[0][0]}. ${parts[1] ? parts[1][0] + '.' : ''}`;
  };

  const anonymizeEmail = (email) => {
    if (!anonymizeNames) return email;
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  };

  const handleOpenUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-100 via-blue-50 to-pink-100 rounded-xl px-3 py-2 shadow-sm border border-white/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-1">
              Admin Dashboard 📊
            </h1>
            <p className="text-xs text-gray-500">
              Monitor Dreams Program engagement and user activity across the organization.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* View Mode Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                  viewMode === 'overview'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('users')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                  viewMode === 'users'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Users
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <OverviewMode 
          totalUsers={totalUsers}
          dreamBookPercentage={dreamBookPercentage}
          categoryStats={categoryStats}
          topConnectors={topConnectors}
          lowEngagementUsers={lowEngagementUsers}
          anonymizeName={anonymizeName}
          onOpenUserModal={handleOpenUserModal}
        />
      ) : (
        <UsersMode
          filteredUsers={filteredUsers}
          selectedOffice={selectedOffice}
          setSelectedOffice={setSelectedOffice}
          anonymizeName={anonymizeName}
          anonymizeEmail={anonymizeEmail}
          onOpenUserModal={handleOpenUserModal}
        />
      )}

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <UserManagementModal
          user={selectedUser}
          onClose={handleCloseUserModal}
        />
      )}
    </div>
  );
};

const OverviewMode = ({ 
  totalUsers, 
  dreamBookPercentage, 
  categoryStats, 
  topConnectors, 
  lowEngagementUsers,
  anonymizeName,
  onOpenUserModal 
}) => {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dream Book Adoption</p>
              <p className="text-2xl font-bold text-gray-900">{dreamBookPercentage}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(allUsers.reduce((sum, user) => sum + user.score, 0) / totalUsers)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{lowEngagementUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Categories */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Popular Dream Categories
          </h3>
          <div className="space-y-4">
            {categoryStats.slice(0, 6).map((stat, index) => (
              <div key={stat.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-gray-900">{stat.category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-dream-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {stat.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Connectors */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Most Active Connectors
          </h3>
          <div className="space-y-4">
            {topConnectors.map((user, index) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onOpenUserModal(user)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    #{index + 1}
                  </span>
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=100`;
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {anonymizeName(user.name)}
                    </p>
                    <p className="text-xs text-gray-500">{user.office}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.connectsCount} connects
                  </p>
                  <p className="text-xs text-gray-500">{user.score} points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Engagement Alert */}
      {lowEngagementUsers.length > 0 && (
        <div className="bg-red-50 rounded-2xl border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Low Engagement Alert
              </h3>
              <p className="text-red-700 mb-4">
                {lowEngagementUsers.length} users have scores below 20 points and may need encouragement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowEngagementUsers.slice(0, 6).map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center space-x-2 text-sm p-2 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                    onClick={() => onOpenUserModal(user)}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=100`;
                      }}
                    />
                    <span className="text-red-900">{anonymizeName(user.name)}</span>
                    <span className="text-red-600">({user.score} pts)</span>
                  </div>
                ))}
              </div>
              {lowEngagementUsers.length > 6 && (
                <p className="text-red-600 text-sm mt-2">
                  +{lowEngagementUsers.length - 6} more users
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UsersMode = ({ 
  filteredUsers, 
  selectedOffice, 
  setSelectedOffice, 
  anonymizeName, 
  anonymizeEmail,
  onOpenUserModal 
}) => {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Office:</label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-dream-blue"
            >
              <option value="all">All Offices</option>
              {offices.map(office => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Office
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dreams
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Connects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=100`;
                        }}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {anonymizeName(user.name)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {anonymizeEmail(user.email)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {user.office}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.dreamsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.connectsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.score >= 50
                        ? 'bg-green-100 text-green-800'
                        : user.score >= 25
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.score} pts
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.dreamCategories.slice(0, 3).map((category) => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-dream-blue bg-opacity-10 text-dream-blue text-xs rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                      {user.dreamCategories.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{user.dreamCategories.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => onOpenUserModal(user)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;