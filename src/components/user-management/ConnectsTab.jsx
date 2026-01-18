import { Users } from 'lucide-react';

/**
 * Connects tab component for UserManagementModal
 */
export default function ConnectsTab({ user }) {
  const connects = user.connects || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-bold text-professional-gray-900">Dream Connects</h3>
        <span className="text-sm text-professional-gray-600">{connects.length} connections</span>
      </div>

      {connects.length > 0 ? (
        <div className="space-y-4">
          {connects.map((connect) => (
            <div key={connect.id} className="bg-white rounded-2xl border border-professional-gray-200 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="p-4 sm:p-5">
                <div className="flex items-start space-x-4">
                  <img
                    src={connect.avatar}
                    alt={connect.withWhom}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-professional-gray-900">{connect.withWhom}</h4>
                      <span className="text-sm text-professional-gray-600">{new Date(connect.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-professional-gray-600 mt-2">{connect.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-professional-gray-300" />
          <p className="text-professional-gray-500">No connections yet</p>
        </div>
      )}
    </div>
  );
}