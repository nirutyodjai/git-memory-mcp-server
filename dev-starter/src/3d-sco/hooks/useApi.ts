import { useState, useEffect, useCallback } from 'react'

// Types
export interface User {
  id: string
  email: string
  username: string
  name?: string
  avatar?: string
  bio?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR'
  verified: boolean
  createdAt: string
  _count?: {
    posts: number
    comments: number
    likes: number
  }
}

export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  slug: string
  published: boolean
  featured: boolean
  tags: string[]
  metadata?: Record<string, any>
  authorId: string
  author: {
    id: string
    username: string
    name?: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  publishedAt?: string
  _count: {
    comments: number
    likes: number
  }
}

export interface Comment {
  id: string
  content: string
  postId: string
  authorId: string
  parentId?: string
  author: {
    id: string
    username: string
    name?: string
    avatar?: string
  }
  post: {
    id: string
    title: string
    slug: string
  }
  parent?: {
    id: string
    content: string
    author: {
      username: string
      name?: string
    }
  }
  replies?: Comment[]
  createdAt: string
  updatedAt: string
  _count: {
    likes: number
    replies: number
  }
}

export interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  loading: boolean
  error: string | null
  refetch: () => void
  loadMore: () => void
  hasMore: boolean
}

// Generic API hook
export function useApi<T>(url: string, options?: RequestInit): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [url, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

// Paginated API hook
export function usePaginatedApi<T>(
  baseUrl: string,
  initialParams: Record<string, any> = {}
): PaginatedResponse<T> {
  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState(initialParams)

  const fetchData = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const currentPage = reset ? 1 : pagination.page
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pagination.limit.toString(),
        ...params
      })

      const response = await fetch(`${baseUrl}?${searchParams}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (reset) {
        setData(result.data || result.users || result.posts || result.comments || [])
      } else {
        setData(prev => [...prev, ...(result.data || result.users || result.posts || result.comments || [])])
      }
      
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [baseUrl, params, pagination.page, pagination.limit])

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }, [pagination.page, pagination.pages])

  const refetch = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData(pagination.page === 1)
  }, [params, pagination.page])

  return {
    data,
    pagination,
    loading,
    error,
    refetch,
    loadMore,
    hasMore: pagination.page < pagination.pages
  }
}

// Specific hooks for different entities
export function useUsers(params: Record<string, any> = {}) {
  return usePaginatedApi<User>('/api/users', params)
}

export function usePosts(params: Record<string, any> = {}) {
  return usePaginatedApi<Post>('/api/posts', params)
}

export function useComments(params: Record<string, any> = {}) {
  return usePaginatedApi<Comment>('/api/comments', params)
}

export function useHealthCheck() {
  return useApi<{
    status: string
    timestamp: string
    services: {
      database: {
        status: string
        timestamp: string
      }
      server: {
        status: string
        uptime: number
        memory: any
        version: string
      }
    }
  }>('/api/health')
}

// Analytics hooks
export function useAnalytics(type?: string, params: Record<string, any> = {}) {
  const searchParams = new URLSearchParams({
    ...(type && { type }),
    ...params
  })
  
  return useApi<{
    analytics?: any[]
    summary?: {
      userEvents: number
      postEvents: number
      systemEvents: number
      total: number
    }
    total?: number
    type: string
    pagination?: {
      page: number
      limit: number
      pages: number
    }
  }>(`/api/analytics?${searchParams}`)
}

// Mutation hooks
export function useCreateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = useCallback(async (userData: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createUser, loading, error }
}

export function useCreatePost() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPost = useCallback(async (postData: Partial<Post>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createPost, loading, error }
}

export function useCreateComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createComment = useCallback(async (commentData: Partial<Comment>) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { createComment, loading, error }
}

// Analytics tracking hook
export function useTrackAnalytics() {
  const trackEvent = useCallback(async (
    type: 'user' | 'post' | 'system',
    data: Record<string, any>
  ) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, ...data })
      })
    } catch (error) {
      console.error('Failed to track analytics:', error)
    }
  }, [])

  return { trackEvent }
}