import { Shield } from 'lucide-react'

interface AuthHeaderProps {
  isLogin: boolean
}

export default function AuthHeader({ isLogin }: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
        <Shield className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
        {isLogin ? 'Đăng nhập' : 'Đăng ký'}
      </h1>
      <p className="text-gray-600">
        {isLogin 
          ? 'Chào mừng bạn quay trở lại!' 
          : 'Tạo tài khoản mới để bắt đầu'
        }
      </p>
    </div>
  )
}
