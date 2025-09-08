'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { BlogPost, BlogCategory, BlogComment, BlogStats, BlogSearchFilters, BlogSearchResult, BlogService } from '@/lib/blog/blog-service';

interface BlogState {
  posts: BlogPost[];
  categories: BlogCategory[];
  currentPost: BlogPost | null;
  searchResult: BlogSearchResult | null;
  stats: BlogStats | null;
  loading: boolean;
  error: string | null;
}

type BlogAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_POSTS'; payload: BlogPost[] }
  | { type: 'SET_CATEGORIES'; payload: BlogCategory[] }
  | { type: 'SET_CURRENT_POST'; payload: BlogPost | null }
  | { type: 'SET_SEARCH_RESULT'; payload: BlogSearchResult }
  | { type: 'SET_STATS'; payload: BlogStats }
  | { type: 'ADD_POST'; payload: BlogPost }
  | { type: 'UPDATE_POST'; payload: BlogPost }
  | { type: 'REMOVE_POST'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: BlogCategory }
  | { type: 'UPDATE_CATEGORY'; payload: BlogCategory }
  | { type: 'REMOVE_CATEGORY'; payload: string }
  | { type: 'ADD_COMMENT'; payload: { postId: string; comment: BlogComment } }
  | { type: 'UPDATE_COMMENT'; payload: { postId: string; comment: BlogComment } }
  | { type: 'REMOVE_COMMENT'; payload: { postId: string; commentId: string } };

const initialState: BlogState = {
  posts: [],
  categories: [],
  currentPost: null,
  searchResult: null,
  stats: null,
  loading: false,
  error: null,
};

function blogReducer(state: BlogState, action: BlogAction): BlogState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_POSTS':
      return { ...state, posts: action.payload, loading: false, error: null };
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, loading: false, error: null };
    
    case 'SET_CURRENT_POST':
      return { ...state, currentPost: action.payload, loading: false, error: null };
    
    case 'SET_SEARCH_RESULT':
      return { ...state, searchResult: action.payload, loading: false, error: null };
    
    case 'SET_STATS':
      return { ...state, stats: action.payload, loading: false, error: null };
    
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
        searchResult: state.searchResult ? {
          ...state.searchResult,
          posts: [action.payload, ...state.searchResult.posts],
          total: state.searchResult.total + 1,
        } : null,
      };
    
    case 'UPDATE_POST':
      const updatedPosts = state.posts.map(post => 
        post.id === action.payload.id ? action.payload : post
      );
      return {
        ...state,
        posts: updatedPosts,
        currentPost: state.currentPost?.id === action.payload.id ? action.payload : state.currentPost,
        searchResult: state.searchResult ? {
          ...state.searchResult,
          posts: state.searchResult.posts.map(post => 
            post.id === action.payload.id ? action.payload : post
          ),
        } : null,
      };
    
    case 'REMOVE_POST':
      const filteredPosts = state.posts.filter(post => post.id !== action.payload);
      return {
        ...state,
        posts: filteredPosts,
        currentPost: state.currentPost?.id === action.payload ? null : state.currentPost,
        searchResult: state.searchResult ? {
          ...state.searchResult,
          posts: state.searchResult.posts.filter(post => post.id !== action.payload),
          total: state.searchResult.total - 1,
        } : null,
      };
    
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(category => 
          category.id === action.payload.id ? action.payload : category
        ),
      };
    
    case 'REMOVE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };
    
    case 'ADD_COMMENT':
      const postWithNewComment = state.posts.find(post => post.id === action.payload.postId);
      if (postWithNewComment) {
        const updatedPost = {
          ...postWithNewComment,
          comments: [...postWithNewComment.comments, action.payload.comment],
        };
        return {
          ...state,
          posts: state.posts.map(post => 
            post.id === action.payload.postId ? updatedPost : post
          ),
          currentPost: state.currentPost?.id === action.payload.postId ? updatedPost : state.currentPost,
        };
      }
      return state;
    
    case 'UPDATE_COMMENT':
      const postWithUpdatedComment = state.posts.find(post => post.id === action.payload.postId);
      if (postWithUpdatedComment) {
        const updatedPost = {
          ...postWithUpdatedComment,
          comments: postWithUpdatedComment.comments.map(comment => 
            comment.id === action.payload.comment.id ? action.payload.comment : comment
          ),
        };
        return {
          ...state,
          posts: state.posts.map(post => 
            post.id === action.payload.postId ? updatedPost : post
          ),
          currentPost: state.currentPost?.id === action.payload.postId ? updatedPost : state.currentPost,
        };
      }
      return state;
    
    case 'REMOVE_COMMENT':
      const postWithRemovedComment = state.posts.find(post => post.id === action.payload.postId);
      if (postWithRemovedComment) {
        const updatedPost = {
          ...postWithRemovedComment,
          comments: postWithRemovedComment.comments.filter(comment => 
            comment.id !== action.payload.commentId
          ),
        };
        return {
          ...state,
          posts: state.posts.map(post => 
            post.id === action.payload.postId ? updatedPost : post
          ),
          currentPost: state.currentPost?.id === action.payload.postId ? updatedPost : state.currentPost,
        };
      }
      return state;
    
    default:
      return state;
  }
}

interface BlogContextType {
  state: BlogState;
  // Post methods
  loadPosts: (filters?: BlogSearchFilters) => Promise<void>;
  loadPost: (slug: string) => Promise<void>;
  createPost: (postData: Partial<BlogPost>) => Promise<void>;
  updatePost: (postId: string, postData: Partial<BlogPost>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  publishPost: (postId: string) => Promise<void>;
  unpublishPost: (postId: string) => Promise<void>;
  incrementViews: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  // Category methods
  loadCategories: () => Promise<void>;
  createCategory: (categoryData: Partial<BlogCategory>) => Promise<void>;
  updateCategory: (categoryId: string, categoryData: Partial<BlogCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // Comment methods
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, commentData: Partial<BlogComment>) => Promise<void>;
  updateComment: (postId: string, commentId: string, commentData: Partial<BlogComment>) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  approveComment: (postId: string, commentId: string) => Promise<void>;
  rejectComment: (postId: string, commentId: string) => Promise<void>;
  // Stats methods
  loadStats: () => Promise<void>;
  // Utility methods
  getRelatedPosts: (postId: string, limit?: number) => Promise<void>;
  getAllTags: () => Promise<string[]>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(blogReducer, initialState);
  const blogService = new BlogService();

  // Post methods
  const loadPosts = useCallback(async (filters?: BlogSearchFilters) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await blogService.searchPosts(filters);
      dispatch({ type: 'SET_SEARCH_RESULT', payload: result });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load posts' });
    }
  }, [blogService]);

  const loadPost = useCallback(async (slug: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const post = await blogService.getPostBySlug(slug);
      dispatch({ type: 'SET_CURRENT_POST', payload: post });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load post' });
    }
  }, [blogService]);

  const createPost = useCallback(async (postData: Partial<BlogPost>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newPost = await blogService.createPost(postData);
      dispatch({ type: 'ADD_POST', payload: newPost });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create post' });
      throw error;
    }
  }, [blogService]);

  const updatePost = useCallback(async (postId: string, postData: Partial<BlogPost>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedPost = await blogService.updatePost(postId, postData);
      dispatch({ type: 'UPDATE_POST', payload: updatedPost });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update post' });
      throw error;
    }
  }, [blogService]);

  const deletePost = useCallback(async (postId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await blogService.deletePost(postId);
      dispatch({ type: 'REMOVE_POST', payload: postId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete post' });
      throw error;
    }
  }, [blogService]);

  const publishPost = useCallback(async (postId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const publishedPost = await blogService.publishPost(postId);
      dispatch({ type: 'UPDATE_POST', payload: publishedPost });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to publish post' });
      throw error;
    }
  }, [blogService]);

  const unpublishPost = useCallback(async (postId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const unpublishedPost = await blogService.unpublishPost(postId);
      dispatch({ type: 'UPDATE_POST', payload: unpublishedPost });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to unpublish post' });
      throw error;
    }
  }, [blogService]);

  const incrementViews = useCallback(async (postId: string) => {
    try {
      await blogService.incrementViews(postId);
      // Update the post in state with incremented views
      const currentPost = state.posts.find(post => post.id === postId) || state.currentPost;
      if (currentPost) {
        const updatedPost = { ...currentPost, views: currentPost.views + 1 };
        dispatch({ type: 'UPDATE_POST', payload: updatedPost });
      }
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }, [blogService, state.posts, state.currentPost]);

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const updatedPost = await blogService.toggleLike(postId);
      dispatch({ type: 'UPDATE_POST', payload: updatedPost });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to toggle like' });
      throw error;
    }
  }, [blogService]);

  // Category methods
  const loadCategories = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const categories = await blogService.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load categories' });
    }
  }, [blogService]);

  const createCategory = useCallback(async (categoryData: Partial<BlogCategory>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newCategory = await blogService.createCategory(categoryData);
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create category' });
      throw error;
    }
  }, [blogService]);

  const updateCategory = useCallback(async (categoryId: string, categoryData: Partial<BlogCategory>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedCategory = await blogService.updateCategory(categoryId, categoryData);
      dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update category' });
      throw error;
    }
  }, [blogService]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await blogService.deleteCategory(categoryId);
      dispatch({ type: 'REMOVE_CATEGORY', payload: categoryId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete category' });
      throw error;
    }
  }, [blogService]);

  // Comment methods
  const loadComments = useCallback(async (postId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const comments = await blogService.getComments(postId);
      // Update the post with loaded comments
      const post = state.posts.find(p => p.id === postId) || state.currentPost;
      if (post) {
        const updatedPost = { ...post, comments };
        dispatch({ type: 'UPDATE_POST', payload: updatedPost });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load comments' });
    }
  }, [blogService, state.posts, state.currentPost]);

  const addComment = useCallback(async (postId: string, commentData: Partial<BlogComment>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const newComment = await blogService.addComment(postId, commentData);
      dispatch({ type: 'ADD_COMMENT', payload: { postId, comment: newComment } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add comment' });
      throw error;
    }
  }, [blogService]);

  const updateComment = useCallback(async (postId: string, commentId: string, commentData: Partial<BlogComment>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedComment = await blogService.updateComment(postId, commentId, commentData);
      dispatch({ type: 'UPDATE_COMMENT', payload: { postId, comment: updatedComment } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update comment' });
      throw error;
    }
  }, [blogService]);

  const deleteComment = useCallback(async (postId: string, commentId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await blogService.deleteComment(postId, commentId);
      dispatch({ type: 'REMOVE_COMMENT', payload: { postId, commentId } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete comment' });
      throw error;
    }
  }, [blogService]);

  const approveComment = useCallback(async (postId: string, commentId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const approvedComment = await blogService.approveComment(postId, commentId);
      dispatch({ type: 'UPDATE_COMMENT', payload: { postId, comment: approvedComment } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to approve comment' });
      throw error;
    }
  }, [blogService]);

  const rejectComment = useCallback(async (postId: string, commentId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const rejectedComment = await blogService.rejectComment(postId, commentId);
      dispatch({ type: 'UPDATE_COMMENT', payload: { postId, comment: rejectedComment } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to reject comment' });
      throw error;
    }
  }, [blogService]);

  // Stats methods
  const loadStats = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const stats = await blogService.getStats();
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load stats' });
    }
  }, [blogService]);

  // Utility methods
  const getRelatedPosts = useCallback(async (postId: string, limit = 5) => {
    try {
      const relatedPosts = await blogService.getRelatedPosts(postId, limit);
      // You might want to store these in a separate state or return them directly
      return relatedPosts;
    } catch (error) {
      console.error('Failed to get related posts:', error);
      return [];
    }
  }, [blogService]);

  const getAllTags = useCallback(async () => {
    try {
      return await blogService.getAllTags();
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  }, [blogService]);

  const value: BlogContextType = {
    state,
    // Post methods
    loadPosts,
    loadPost,
    createPost,
    updatePost,
    deletePost,
    publishPost,
    unpublishPost,
    incrementViews,
    toggleLike,
    // Category methods
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // Comment methods
    loadComments,
    addComment,
    updateComment,
    deleteComment,
    approveComment,
    rejectComment,
    // Stats methods
    loadStats,
    // Utility methods
    getRelatedPosts,
    getAllTags,
  };

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}