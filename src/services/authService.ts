import { supabase } from '../lib/supabase'

export interface AuthData {
  email: string
  password: string
  fullName?: string
  company?: string
  position?: string
  location?: string
  phone?: string
}

export interface AuthResponse {
  success: boolean
  message: string
  error?: string
  session?: any
  requiresEmailConfirmation?: boolean
}

export class AuthService {
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      return {
        success: true,
        message: 'Đăng nhập thành công!',
        session: data.session,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Đăng nhập thất bại',
        error: error.message
      }
    }
  }

  static async signUp(authData: AuthData): Promise<AuthResponse> {
    try {
      if (authData.password.length < 6) {
        throw new Error('Mật khẩu phải có ít nhất 6 ký tự')
      }

      const { data, error } = await supabase.auth.signUp({
        email: authData.email,
        password: authData.password,
        options: {
          data: {
            full_name: authData.fullName,
            company: authData.company,
            position: authData.position,
            location: authData.location,
            phone: authData.phone,
          }
        }
      })
      
      if (error) {
        // Check if it's a duplicate email error
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('User already')) {
          return {
            success: false,
            message: 'Email đã tồn tại',
            error: 'Email đã tồn tại. Vui lòng dùng email khác hoặc đăng nhập.',
            requiresEmailConfirmation: false
          }
        }
        throw error
      }
      
      // Check if user was created but needs email confirmation
      if (data.user && !data.session) {
        return {
          success: true,
          message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
          session: data.session,
          requiresEmailConfirmation: true,
        }
      }
      
      // User created and session available (immediate login)
      return {
        success: true,
        message: 'Đăng ký thành công!',
        session: data.session,
        requiresEmailConfirmation: false,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Đăng ký thất bại',
        error: error.message
      }
    }
  }

  static async signInWithOAuth(provider: 'google' | 'github' | 'facebook'): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
      
      return {
        success: true,
        message: `Đang chuyển hướng đến ${provider}...`
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi đăng nhập với ${provider}`,
        error: error.message
      }
    }
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  }

  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  }
}
