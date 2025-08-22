import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthService, type AuthData } from '../services/authService'
import AuthHeader from '../components/auth/AuthHeader'
import AuthMethodTabs from '../components/auth/AuthMethodTabs'
import SocialLoginButtons from '../components/auth/SocialLoginButtons'
import { User, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, Shield, Sparkles, Phone, Building, MapPin, Calendar } from 'lucide-react'

export default function Auth() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'social'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [position, setPosition] = useState('')
  const [location, setLocation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tabsNotice, setTabsNotice] = useState<string | undefined>(undefined)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setTabsNotice(undefined)

    try {
      if (isLogin) {
        const response = await AuthService.signIn(email.trim().toLowerCase(), password)
        if (response.success) {
          setSuccess(response.message)
          setTimeout(() => navigate('/dashboard'), 800)
        } else {
          setError(response.error || 'Đăng nhập thất bại')
        }
      } else {
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp')
          return
        }

        const normalizedEmail = email.trim().toLowerCase()

        const authData: AuthData = {
          email: normalizedEmail,
          password,
          fullName,
          company,
          position,
          location,
          phone,
        }

        const response = await AuthService.signUp(authData)
        if (response.success) {
          if (response.session) {
            // User created and session available - immediate login
            navigate('/dashboard')
            return
          }
          // User created but needs email confirmation
          setIsLogin(true)
          setAuthMethod('email')
          setTabsNotice('Đăng ký thành công. Vui lòng kiểm tra Gmail để xác thực tài khoản, sau đó đăng nhập.')
          resetForm()
        } else {
          // Check for duplicate email error
          if (response.error && response.error.includes('Email đã tồn tại')) {
            setIsLogin(true)
            setAuthMethod('email')
            setTabsNotice('Email đã tồn tại. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.')
            setPassword('')
            setConfirmPassword('')
          } else {
            setError(response.error || 'Đăng ký thất bại')
          }
        }
      }
    } catch (error: any) {
      setError(error.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github' | 'facebook') => {
    try {
      setLoading(true)
      setError('')
      
      const response = await AuthService.signInWithOAuth(provider)
      if (!response.success) {
        setError(response.error || `Lỗi đăng nhập với ${provider}`)
      }
    } catch (error: any) {
      setError(`Lỗi đăng nhập với ${provider}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneAuth = async () => {
    if (!phone) {
      setError('Vui lòng nhập số điện thoại')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      setError('Xác thực qua điện thoại đang được phát triển')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setCompany('')
    setPosition('')
    setLocation('')
    setError('')
    setSuccess('')
  }

  const toggleAuthMode = () => {
    setIsLogin(!isLogin)
    setAuthMethod('email')
    setTabsNotice(undefined)
    resetForm()
  }

  const tabsError = !isLogin && authMethod === 'email' && error && error.includes('Email đã tồn tại')
    ? 'Email đã tồn tại. Vui lòng dùng email khác.'
    : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        <AuthHeader isLogin={isLogin} />

        {!isLogin && (
          <AuthMethodTabs 
            authMethod={authMethod} 
            onMethodChange={setAuthMethod} 
            error={tabsError}
            notice={tabsNotice}
          />
        )}

        {isLogin && tabsNotice && (
          <div className="bg-white rounded-xl shadow-md p-3 mb-6 border border-blue-200">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">{tabsNotice}</p>
            </div>
          </div>
        )}


        {authMethod === 'social' && !isLogin && (
          <SocialLoginButtons 
            loading={loading} 
            onSocialLogin={handleSocialLogin} 
          />
        )}

        {/* Phone Auth Form */}
        {authMethod === 'phone' && !isLogin && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="text-center mb-6">
              <Phone className="h-12 w-12 text-primary-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-900">Đăng ký qua điện thoại</h3>
              <p className="text-gray-600 text-sm">Nhập số điện thoại để nhận mã xác thực</p>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handlePhoneAuth(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="+84 123 456 789"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </div>
                ) : (
                  <>
                    <Phone className="h-5 w-5 mr-2" />
                    Gửi mã xác thực
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Email Auth Form */}
        {authMethod === 'email' && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6 border border-gray-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg mr-3">
                {isLogin ? <LogIn className="h-6 w-6 text-primary-600" /> : <UserPlus className="h-6 w-6 text-primary-600" />}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {isLogin ? 'Đăng nhập với Email' : 'Đăng ký với Email'}
              </h3>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {/* Full Name - Only for registration */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập họ và tên đầy đủ"
                    />
                  </div>
                </div>
              )}

              {/* Company - Only for registration */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Công ty</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Tên công ty (tùy chọn)"
                    />
                  </div>
                </div>
              )}

              {/* Position - Only for registration */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí công việc</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Vị trí công việc (tùy chọn)"
                    />
                  </div>
                </div>
              )}

              {/* Location - Only for registration */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Thành phố, quốc gia (tùy chọn)"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nhập email của bạn"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500 mt-1">Mật khẩu phải có ít nhất 6 ký tự</p>
                )}
              </div>

              {/* Confirm Password - Only for registration */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-5 w-5 bg-red-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-5 w-5 bg-green-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isLogin ? (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Đăng nhập
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" />
                        Đăng ký
                      </>
                    )}
                  </div>
                )}
              </button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={toggleAuthMode}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                {isLogin 
                  ? 'Chưa có tài khoản? Đăng ký ngay' 
                  : 'Đã có tài khoản? Đăng nhập'
                }
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Bảo mật cao</h3>
            <p className="text-xs text-gray-500">Dữ liệu được mã hóa và bảo vệ</p>
          </div>
          
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Đa dạng đăng ký</h3>
            <p className="text-xs text-gray-500">Email, điện thoại, mạng xã hội</p>
          </div>
          
          <div className="text-center p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-white/20">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-2">
              <User className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Quản lý hiệu quả</h3>
            <p className="text-xs text-gray-500">Tối ưu quy trình tuyển dụng</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 HR Dashboard. Được xây dựng với ❤️
          </p>
        </div>
      </div>
    </div>
  )
}
