import { Mail, Phone, User } from 'lucide-react'

interface AuthMethodTabsProps {
  authMethod: 'email' | 'phone' | 'social'
  onMethodChange: (method: 'email' | 'phone' | 'social') => void
  error?: string
  notice?: string
}

export default function AuthMethodTabs({ authMethod, onMethodChange, error, notice }: AuthMethodTabsProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-2 mb-6 border border-gray-100">
      <div className="flex space-x-1">
        <button
          onClick={() => onMethodChange('email')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            authMethod === 'email'
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="h-4 w-4 inline mr-1" />
          Email
        </button>
      </div>
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {notice && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">{notice}</p>
        </div>
      )}
    </div>
  )
}
