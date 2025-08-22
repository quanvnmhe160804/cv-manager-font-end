import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Candidate, CreateCandidateData } from '../lib/supabase'
import { CandidateService } from '../services/candidateService'
import { RealtimeService } from '../services/realtimeService'
import { AuthService } from '../services/authService'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import StatisticsCards from '../components/dashboard/StatisticsCards'
import { Plus, Upload, Eye, Edit, Trash2, Search, Filter, Calendar, Briefcase, User, FileText, Award, Wifi, WifiOff, X } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState<CreateCandidateData>({
    full_name: '',
    applied_position: '',
    status: 'New',
    resume_url: ''
  })
  const [uploading, setUploading] = useState(false)
  
  // Realtime states
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [realtimeError, setRealtimeError] = useState<string>('')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [updateCount, setUpdateCount] = useState(0)
  
  // Refs for cleanup
  const realtimeServiceRef = useRef<RealtimeService | null>(null)

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await CandidateService.fetchCandidates()
      
      if (response.success) {
        setCandidates(response.data || [])
        setLastUpdate(new Date())
        setUpdateCount(prev => prev + 1)
      } else {
        setRealtimeError(response.error || 'Không thể tải danh sách ứng viên')
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error)
      setRealtimeError('Không thể tải danh sách ứng viên')
    } finally {
      setLoading(false)
    }
  }, [])

  const setupRealtimeSubscription = useCallback(() => {
    const handlers = {
      onInsert: (newCandidate: Candidate) => {
        setCandidates(prev => {
          if (prev.some(c => c.id === newCandidate.id)) return prev
          return [newCandidate, ...prev]
        })
        showNotification(`Ứng viên mới: ${newCandidate.full_name}`, 'success')
      },
      onUpdate: (oldCandidate: Candidate, newCandidate: Candidate) => {
        setCandidates(prev => prev.map(candidate => 
          candidate.id === newCandidate.id ? newCandidate : candidate
        ))
        showNotification(`Cập nhật: ${newCandidate.full_name}`, 'info')
      },
      onDelete: (deletedCandidate: Candidate) => {
        if (deletedCandidate && deletedCandidate.id) {
          setCandidates(prev => prev.filter(candidate => candidate.id !== deletedCandidate.id))
          const candidateName = deletedCandidate.full_name || 'Ứng viên'
          showNotification(`Đã xóa: ${candidateName}`, 'warning')
        } else {
          setCandidates(prev => prev.filter(candidate => candidate.id !== deletedCandidate?.id))
          showNotification('Đã xóa ứng viên', 'warning')
        }
      },
      onStatusChange: (status: 'connected' | 'disconnected' | 'connecting', error?: string) => {
        setRealtimeStatus(status)
        setRealtimeError(error || '')
      }
    }

    realtimeServiceRef.current = new RealtimeService(handlers)
    realtimeServiceRef.current.setupSubscription()
  }, [])

  const handleManualReconnect = useCallback(async () => {
    if (realtimeServiceRef.current) {
      await fetchCandidates()
      realtimeServiceRef.current.manualReconnect()
    }
  }, [fetchCandidates])

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error') => {
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'info' ? 'bg-blue-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-red-500 text-white'
    }`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }, [])

  const cleanup = useCallback(() => {
    if (realtimeServiceRef.current) {
      realtimeServiceRef.current.cleanup()
      realtimeServiceRef.current = null
    }
  }, [])

  useEffect(() => {
    console.log('Dashboard mounted, setting up realtime...')
    fetchCandidates()
    setupRealtimeSubscription()
    
    return () => {
      console.log('Dashboard unmounting, cleaning up...')
      cleanup()
    }
  }, []) // Remove dependencies to prevent re-runs

  // Add effect to handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, checking realtime connection...')
        if (realtimeStatus === 'disconnected') {
          console.log('Realtime was disconnected, reconnecting...')
          handleManualReconnect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [realtimeStatus, handleManualReconnect])

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      const response = await CandidateService.uploadResume(file)
      
      if (response.success) {
        setFormData(prev => ({ ...prev, resume_url: response.data.publicUrl }))
        
        if (realtimeServiceRef.current) {
          realtimeServiceRef.current.sendEvent({
            type: 'broadcast',
            event: 'file_uploaded',
            payload: { fileName: response.data.fileName, fileSize: file.size }
          })
        }
      } else {
        showNotification(`Lỗi upload: ${response.error}`, 'error')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      showNotification('Lỗi khi tải lên file', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { user, error: userError } = await AuthService.getCurrentUser()
      
      if (userError || !user) {
        throw userError || new Error('User not authenticated')
      }

      // Trim and validate client-side to avoid whitespace-only values
      const fullName = formData.full_name.trim()
      const appliedPosition = formData.applied_position.trim()
      const statusVal = formData.status.trim() as Candidate['status']
      const resumeUrl = formData.resume_url.trim()

      const missing: string[] = []
      if (!fullName) missing.push('Họ và tên')
      if (!appliedPosition) missing.push('Vị trí ứng tuyển')
      if (!statusVal) missing.push('Trạng thái')
      if (!resumeUrl) missing.push('CV/Hồ sơ')
      if (missing.length) {
        showNotification(`Vui lòng nhập: ${missing.join(', ')}`, 'error')
        return
      }

      // Optimistic update
      const optimisticCandidate: Candidate = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        full_name: fullName,
        applied_position: appliedPosition,
        status: statusVal,
        resume_url: resumeUrl,
        created_at: new Date().toISOString()
      }
      
      setCandidates(prev => [optimisticCandidate, ...prev])

      // Get access token and create candidate
      const { session } = await AuthService.getSession()
      const accessToken = session?.access_token || ''

      const response = await CandidateService.createCandidate({
        full_name: fullName,
        applied_position: appliedPosition,
        status: statusVal,
        resume_url: resumeUrl
      }, accessToken)

      if (!response.success) {
        // Rollback and show error
        setCandidates(prev => prev.filter(c => c.id !== optimisticCandidate.id))
        showNotification(`Lỗi khi thêm: ${response.error}`, 'error')
        return
      }

      // Replace optimistic candidate with real data
      if (response.data) {
        setCandidates(prev => prev.map(c => 
          c.id === optimisticCandidate.id ? response.data : c
        ))
      }
      
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.sendEvent({
          type: 'broadcast',
          event: 'candidate_created',
          payload: { 
            candidate: response.data,
            user: user.email,
            timestamp: new Date().toISOString()
          }
        })
      }
      
      setFormData({
        full_name: '',
        applied_position: '',
        status: 'New',
        resume_url: ''
      })
      setShowForm(false)
      showNotification('Thêm ứng viên thành công', 'success')
      
    } catch (error) {
      console.error('Error creating candidate:', error)
      showNotification(`Lỗi khi thêm ứng viên: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const updateStatus = async (id: string, status: Candidate['status']) => {
    try {
      console.log('Updating status for candidate:', id, 'to:', status)
      
      const response = await CandidateService.updateStatus(id, status)
      
      if (!response.success) {
        showNotification(`Lỗi cập nhật: ${response.error}`, 'error')
        return
      }

      console.log('Status updated successfully:', response.data)

      // Update local state immediately
      setCandidates(prev => prev.map(candidate => 
        candidate.id === id ? { ...candidate, status } : candidate
      ))

      // Send realtime broadcast
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.sendEvent({
          type: 'broadcast',
          event: 'status_updated',
          payload: { id, status, timestamp: new Date().toISOString() }
        })
      }

      showNotification(`Đã cập nhật trạng thái thành: ${status}`, 'success')
    } catch (error) {
      console.error('Error updating status:', error)
      showNotification(`Lỗi cập nhật trạng thái: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const deleteCandidate = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa ứng viên này?')) return

    try {
      const response = await CandidateService.deleteCandidate(id)
      
      if (!response.success) {
        showNotification(`Lỗi khi xóa: ${response.error}`, 'error')
        return
      }

      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.sendEvent({
          type: 'broadcast',
          event: 'candidate_deleted',
          payload: { id, timestamp: new Date().toISOString() }
        })
      }

      showNotification('Xóa ứng viên thành công', 'success')
    } catch (error) {
      console.error('Error deleting candidate:', error)
      showNotification('Lỗi khi xóa ứng viên', 'error')
    }
  }

  const handleLogout = async () => {
    cleanup()
    await AuthService.signOut()
    navigate('/auth')
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.applied_position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: candidates.length,
    new: candidates.filter(c => c.status === 'New').length,
    interviewing: candidates.filter(c => c.status === 'Interviewing').length,
    hired: candidates.filter(c => c.status === 'Hired').length,
    rejected: candidates.filter(c => c.status === 'Rejected').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Interviewing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Hired': return 'bg-green-100 text-green-800 border-green-200'
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New': return <User className="h-3 w-3" />
      case 'Interviewing': return <Calendar className="h-3 w-3" />
      case 'Hired': return <Award className="h-3 w-3" />
      case 'Rejected': return <X className="h-3 w-3" />
      default: return <User className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Đang tải dữ liệu...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <DashboardHeader 
        realtimeStatus={realtimeStatus}
        realtimeError={realtimeError}
        onManualReconnect={handleManualReconnect}
        onLogout={handleLogout}
      />

      {/* Realtime Error Banner */}
      {realtimeError && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <WifiOff className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-sm text-red-800">{realtimeError}</span>
              </div>
              <button
                onClick={handleManualReconnect}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <StatisticsCards stats={stats} />

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ứng viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="New">Mới</option>
                  <option value="Interviewing">Phỏng vấn</option>
                  <option value="Hired">Đã tuyển</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Thêm Ứng viên
              </button>
            </div>
          </div>
        </div>

        {/* Add Candidate Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-primary-100 rounded-lg mr-3">
                <Plus className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Thêm Ứng viên mới</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nhập họ và tên ứng viên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí ứng tuyển</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    value={formData.applied_position}
                    onChange={(e) => setFormData(prev => ({ ...prev, applied_position: e.target.value }))}
                    placeholder="Nhập vị trí ứng tuyển"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Candidate['status'] }))}
                >
                  <option value="New">Mới</option>
                  <option value="Interviewing">Phỏng vấn</option>
                  <option value="Hired">Đã tuyển</option>
                  <option value="Rejected">Từ chối</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CV/Hồ sơ</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors duration-200">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="text-gray-600">
                      <span className="font-medium text-primary-600 hover:text-primary-500">
                        Chọn file
                      </span>
                      <span className="text-gray-500"> hoặc kéo thả vào đây</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX (tối đa 10MB)</p>
                  </label>
                  {uploading && (
                    <div className="mt-4 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Đang tải lên...</span>
                    </div>
                  )}
                  {formData.resume_url && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm text-green-800">File đã được tải lên thành công!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!formData.resume_url}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Thêm Ứng viên
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Candidates List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách ứng viên ({filteredCandidates.length})</h3>
          </div>
          
          {filteredCandidates.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Chưa có ứng viên nào</p>
              <p className="text-gray-400">Hãy thêm ứng viên đầu tiên để bắt đầu!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCandidates.map((candidate, index) => (
                <div 
                  key={candidate.id} 
                  className="px-6 py-6 hover:bg-gray-50 transition-all duration-200 animate-in slide-in-from-top-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {candidate.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">
                              {candidate.full_name}
                            </h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(candidate.status)}`}>
                              {getStatusIcon(candidate.status)}
                              <span className="ml-1">
                                {candidate.status === 'New' ? 'Mới' :
                                 candidate.status === 'Interviewing' ? 'Phỏng vấn' :
                                 candidate.status === 'Hired' ? 'Đã tuyển' : 'Từ chối'}
                              </span>
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Briefcase className="h-4 w-4 mr-1" />
                              {candidate.applied_position}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(candidate.created_at).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-6">
                      <a
                        href={candidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200"
                        title="Xem CV"
                      >
                        <Eye className="h-5 w-5" />
                      </a>
                      
                      <select
                        value={candidate.status}
                        onChange={(e) => updateStatus(candidate.id, e.target.value as Candidate['status'])}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="New">Mới</option>
                        <option value="Interviewing">Phỏng vấn</option>
                        <option value="Hired">Đã tuyển</option>
                        <option value="Rejected">Từ chối</option>
                      </select>
                      
                      <button
                        onClick={() => deleteCandidate(candidate.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Xóa"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}