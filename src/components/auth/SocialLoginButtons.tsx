import { Mail, Github, Facebook } from 'lucide-react'

interface SocialLoginButtonsProps {
  loading: boolean
  onSocialLogin: (provider: 'google' | 'github' | 'facebook') => void
}

export default function SocialLoginButtons({ loading, onSocialLogin }: SocialLoginButtonsProps) {
  return (
    <div className="space-y-3 mb-6">
      <button
        onClick={() => onSocialLogin('google')}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Mail className="h-5 w-5 mr-3 text-red-500" />
        Tiếp tục với Google
      </button>
      
      <button
        onClick={() => onSocialLogin('github')}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Github className="h-5 w-5 mr-3 text-gray-800" />
        Tiếp tục với GitHub
      </button>
      
      <button
        onClick={() => onSocialLogin('facebook')}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Facebook className="h-5 w-5 mr-3 text-blue-600" />
        Tiếp tục với Facebook
      </button>
    </div>
  )
}
