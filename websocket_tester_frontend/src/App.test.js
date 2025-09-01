import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

/**
 * Tests for the existing App component focusing on:
 * - Smoke render
 * - Theme toggle controls and applied attribute on documentElement
 * - Presence of key UI elements in the planned layout (basic navbar/hero substitute)
 */

describe('App component', () => {
  test('smoke: renders without crashing and shows link', () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });

  test('shows current theme and toggle control', () => {
    render(<App />);
    // Initial theme is light
    expect(screen.getByText(/Current theme:/i)).toHaveTextContent('Current theme: light');
    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(toggleBtn).toBeInTheDocument();
    // Check button label text for visual cue
    expect(toggleBtn).toHaveTextContent('Dark');
  });

  test('toggles theme: updates documentElement data-theme and UI text', () => {
    render(<App />);

    // Initial attribute
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(toggleBtn);

    // After toggle, expect dark
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(screen.getByText(/Current theme:/i)).toHaveTextContent('Current theme: dark');

    // Button aria-label and text update back to light mode
    const backToLightBtn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(backToLightBtn).toBeInTheDocument();
    expect(backToLightBtn).toHaveTextContent('Light');
  });

  test('basic UI structure exists (acts as placeholder for planned layout)', () => {
    render(<App />);
    // The header acts as top area; verify it exists
    const header = document.querySelector('.App-header');
    expect(header).toBeTruthy();

    // There is a main logo and primary link which can be part of the top/main panel
    expect(screen.getByAltText(/logo/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /learn react/i })).toBeInTheDocument();

    // Theme toggle button positioned in header
    expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeInTheDocument();
  });
});
