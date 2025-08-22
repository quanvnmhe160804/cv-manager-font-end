import { Users, LogOut, RefreshCw } from 'lucide-react'
import type { RealtimeStatus } from '../../services/realtimeService'

interface DashboardHeaderProps {
  realtimeStatus: RealtimeStatus
  realtimeError: string
  onManualReconnect: () => void
  onLogout: () => void
}

export default function DashboardHeader({ 
  realtimeStatus, 
  realtimeError, 
  onManualReconnect, 
  onLogout 
}: DashboardHeaderProps) {
  return (
    <div className="bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                HR Dashboard
              </h1>
              <p className="text-gray-500 text-sm">Quản lý hồ sơ ứng viên chuyên nghiệp</p>
            </div>
          </div>
          
          {/* Realtime Status Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'connected' ? 'bg-green-500' :
                realtimeStatus === 'connecting' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className={`text-sm ${
                realtimeStatus === 'connected' ? 'text-green-600' :
                realtimeStatus === 'connecting' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {realtimeStatus === 'connected' ? 'Online' :
                 realtimeStatus === 'connecting' ? 'Kết nối...' :
                 'Mất kết nối'}
              </span>
            </div>
            
            {realtimeStatus === 'disconnected' && (
              <button
                onClick={onManualReconnect}
                className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Kết nối lại
              </button>
            )}
            
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
