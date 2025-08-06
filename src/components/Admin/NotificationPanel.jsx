import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import toast from 'react-hot-toast';

function AdminNotificationPanel() {
  const [formData, setFormData] = useState({
    version: '',
    updateMessage: '',
    features: [''],
    forcedUpdate: false,
    targetUsers: 'all' // 'all', 'admin', 'employee'
  });
  
  const [currentVersion, setCurrentVersion] = useState('');
  const [updateHistory, setUpdateHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load current version and update history
  useEffect(() => {
    loadCurrentVersion();
    loadUpdateHistory();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));
      if (versionDoc.exists()) {
        const data = versionDoc.data();
        setCurrentVersion(data.latest || '1.0.0');
        setFormData(prev => ({
          ...prev,
          version: data.latest || '1.0.0'
        }));
      }
    } catch (error) {
      console.error('Failed to load current version:', error);
    }
  };

  const loadUpdateHistory = async () => {
    try {
      const historyQuery = query(
        collection(db, 'updateLogs'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setUpdateHistory(history);
    } catch (error) {
      console.error('Failed to load update history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.version || !formData.updateMessage) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Update version in appConfig
      await setDoc(doc(db, 'appConfig', 'version'), {
        latest: formData.version,
        previous: currentVersion,
        updatedAt: new Date(),
        updateMessage: formData.updateMessage,
        features: formData.features.filter(f => f.trim() !== ''),
        forcedUpdate: formData.forcedUpdate
      });

      // Send notification to users
      await setDoc(doc(db, 'notifications', 'global'), {
        active: true,
        type: 'update',
        title: 'App Update Available',
        message: formData.updateMessage,
        timestamp: new Date(),
        forced: formData.forcedUpdate,
        features: formData.features.filter(f => f.trim() !== ''),
        targetUsers: formData.targetUsers
      });

      // Log the update
      await setDoc(doc(db, 'updateLogs', `admin_${Date.now()}`), {
        adminId: 'admin',
        fromVersion: currentVersion,
        toVersion: formData.version,
        updateMessage: formData.updateMessage,
        features: formData.features.filter(f => f.trim() !== ''),
        forcedUpdate: formData.forcedUpdate,
        targetUsers: formData.targetUsers,
        timestamp: new Date(),
        method: 'admin-push'
      });

      toast.success('Update notification sent successfully!');
      
      // Reset form
      setFormData({
        version: '',
        updateMessage: '',
        features: [''],
        forcedUpdate: false,
        targetUsers: 'all'
      });
      
      // Reload data
      loadCurrentVersion();
      loadUpdateHistory();

    } catch (error) {
      console.error('Failed to send update notification:', error);
      toast.error('Failed to send update notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-600 mx-auto"></div>
        <p className="text-center mt-2 text-gray-600">Loading notification panel...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">App Update Management</h3>
        <p className="text-sm text-gray-600">
          Send update notifications to all users or specific user groups
        </p>
      </div>

      {/* Current Version Info */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Version</h4>
        <div className="flex items-center space-x-4">
          <span className="text-2xl font-bold text-blue-600">{currentVersion}</span>
          <span className="text-sm text-blue-600">Latest deployed version</span>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Send Update Notification</h4>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Version *
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1.0.1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Users
              </label>
              <select
                value={formData.targetUsers}
                onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="admin">Admins Only</option>
                <option value="employee">Employees Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Message *
            </label>
            <textarea
              value={formData.updateMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, updateMessage: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Describe what's new in this update..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Features
            </label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Feature ${index + 1}`}
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Feature
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="forcedUpdate"
              checked={formData.forcedUpdate}
              onChange={(e) => setFormData(prev => ({ ...prev, forcedUpdate: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="forcedUpdate" className="text-sm text-gray-700">
              Force Update (users must update immediately)
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isSubmitting ? 'Sending...' : 'Send Update Notification'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setFormData({
                  version: '',
                  updateMessage: '',
                  features: [''],
                  forcedUpdate: false,
                  targetUsers: 'all'
                });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* Update History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Update History</h4>
        
        {updateHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No update history available</p>
        ) : (
          <div className="space-y-3">
            {updateHistory.map((update) => (
              <div key={update.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">
                        {update.fromVersion} → {update.toVersion}
                      </span>
                      {update.forcedUpdate && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Forced
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{update.updateMessage}</p>
                    {update.features && update.features.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Features:</p>
                        <ul className="text-xs text-gray-600">
                          {update.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(update.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminNotificationPanel; 