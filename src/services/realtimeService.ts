import { supabase } from '../lib/supabase'
import type { Candidate } from '../lib/supabase'

export type RealtimeStatus = 'connected' | 'disconnected' | 'connecting'

export interface RealtimeEvent {
  type: 'broadcast'
  event: string
  payload: any
}

export interface RealtimeHandlers {
  onInsert: (candidate: Candidate) => void
  onUpdate: (oldCandidate: Candidate, newCandidate: Candidate) => void
  onDelete: (candidate: Candidate) => void
  onStatusChange: (status: RealtimeStatus, error?: string) => void
}

export class RealtimeService {
  private subscription: any = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private handlers: RealtimeHandlers

  constructor(handlers: RealtimeHandlers) {
    this.handlers = handlers
  }

  setupSubscription() {
    try {
      if (this.subscription) {
        this.subscription.unsubscribe()
        this.subscription = null
      }

      this.handlers.onStatusChange('connecting')
      
      this.subscription = supabase
        .channel('candidates_realtime')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'candidates' 
          },
          (payload: any) => {
            console.log('Realtime event received:', payload.eventType, payload)
            switch (payload.eventType) {
              case 'INSERT':
                this.handlers.onInsert(payload.new as Candidate)
                break
              case 'UPDATE':
                this.handlers.onUpdate(payload.old as Candidate, payload.new as Candidate)
                break
              case 'DELETE':
                this.handlers.onDelete(payload.old as Candidate)
                break
              default:
                console.log('Unknown event type')
            }
          }
        )
        .subscribe((status: any, err: any) => {
          console.log('Realtime subscription status:', status, err)
          if (err) {
            console.error('Realtime subscription error:', err)
            this.handlers.onStatusChange('disconnected', err.message)
            this.scheduleReconnect()
          } else {
            this.handlers.onStatusChange('connected')
            console.log('Realtime connected successfully')
          }
        })

      this.setupHeartbeat()
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error)
      this.handlers.onStatusChange('disconnected', 'Không thể thiết lập kết nối realtime')
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    
    console.log('Scheduling reconnect in 5 seconds...')
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.setupSubscription()
    }, 5000)
  }

  private setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.subscription) {
        this.subscription.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: Date.now() }
        })
      }
    }, 30000)
  }

  manualReconnect() {
    console.log('Manual reconnect requested')
    this.handlers.onStatusChange('connecting')
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    this.setupSubscription()
  }

  sendEvent(event: RealtimeEvent) {
    if (this.subscription) {
      this.subscription.send(event)
    }
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}
