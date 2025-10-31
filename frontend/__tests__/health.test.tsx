/**
 * Basic health tests for the frontend application.
 * Tests that components render and basic functionality works.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../src/app/page'
import Login from '../src/app/login/page'
import Register from '../src/app/register/page'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      prefetch: () => null,
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  }
}))

describe('App Health Tests', () => {
  describe('Page Rendering', () => {
    it('renders home page without crashing', () => {
      render(<Home />)
      // Just ensure it renders without throwing
      expect(document.body).toBeDefined()
    })

    it('renders login page without crashing', () => {
      render(<Login />)
      expect(document.body).toBeDefined()
    })

    it('renders register page without crashing', () => {
      render(<Register />)
      expect(document.body).toBeDefined()
    })
  })

  describe('Basic Functionality', () => {
    it('should have a title or heading on home page', () => {
      render(<Home />)
      // Look for common heading elements
      const headings = screen.queryAllByRole('heading')
      const title = document.title
      
      // Either should have headings or a title
      expect(headings.length > 0 || title.length > 0).toBe(true)
    })

    it('login page should have appropriate content', () => {
      render(<Login />)
      
      // Should have heading indicating it's a login page
      const headings = screen.queryAllByRole('heading')
      const loginTexts = screen.queryAllByText(/login/i)
      
      // Should have either a heading or text mentioning login
      expect(headings.length > 0 || loginTexts.length > 0).toBeTruthy()
    })

    it('register page should have appropriate content', () => {
      render(<Register />)
      
      // Should have heading indicating it's a register page
      const headings = screen.queryAllByRole('heading')
      const registerText = screen.queryByText(/register/i)
      
      // Should have either a heading or text mentioning register
      expect(headings.length > 0 || registerText).toBeTruthy()
    })
  })

  describe('Component Structure', () => {
    it('should render React components properly', () => {
      const { container } = render(<Home />)
      expect(container.firstChild).toBeTruthy()
    })

    it('should not have console errors during rendering', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Home />)
      render(<Login />)
      render(<Register />)
      
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Environment Setup', () => {
    it('should have access to required globals', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
      expect(typeof React).toBe('object')
    })

    it('should run in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test')
    })
  })
})