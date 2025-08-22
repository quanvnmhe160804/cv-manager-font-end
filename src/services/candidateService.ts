import { supabase } from '../lib/supabase'
import type { Candidate, CreateCandidateData } from '../lib/supabase'

export interface UpdateStatusData {
  id: string
  status: Candidate['status']
}

export interface CandidateResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
}

export class CandidateService {
  static async fetchCandidates(): Promise<CandidateResponse> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      return {
        success: true,
        data: data || [],
        message: 'Lấy danh sách ứng viên thành công'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Không thể tải danh sách ứng viên',
        error: error.message
      }
    }
  }

  static async createCandidate(candidateData: CreateCandidateData, accessToken: string): Promise<CandidateResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('add-candidate', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: candidateData
      })

      if (error) throw error

      if (data?.error) {
        return {
          success: false,
          message: 'Lỗi khi tạo ứng viên',
          error: data.details || data.error
        }
      }

      return {
        success: true,
        data: data?.candidate,
        message: 'Tạo ứng viên thành công'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Lỗi khi tạo ứng viên',
        error: error.message
      }
    }
  }

  static async updateStatus(id: string, status: Candidate['status']): Promise<CandidateResponse> {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .update({ status })
        .eq('id', id)
        .select()

      if (error) throw error

      return {
        success: true,
        data,
        message: 'Cập nhật trạng thái thành công'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Lỗi khi cập nhật trạng thái',
        error: error.message
      }
    }
  }

  static async deleteCandidate(id: string): Promise<CandidateResponse> {
    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)

      if (error) throw error

      return {
        success: true,
        message: 'Xóa ứng viên thành công'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Lỗi khi xóa ứng viên',
        error: error.message
      }
    }
  }

  static async uploadResume(file: File): Promise<CandidateResponse> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      return {
        success: true,
        data: { publicUrl, fileName },
        message: 'Tải lên file thành công'
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Lỗi khi tải lên file',
        error: error.message
      }
    }
  }
}
