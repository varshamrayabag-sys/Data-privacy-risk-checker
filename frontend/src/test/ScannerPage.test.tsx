import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ScannerPage } from '../pages/ScannerPage';

describe('ScannerPage Component', () => {
  it('renders input tabs and action buttons properly', () => {
    render(
      <BrowserRouter>
        <ScannerPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Manual Text Entry')).toBeInTheDocument();
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste raw text/i)).toBeInTheDocument();
  });

  it('switches between Manual Text and Document tabs', () => {
    render(
      <BrowserRouter>
        <ScannerPage />
      </BrowserRouter>
    );

    const docTab = screen.getByText('Upload Document');
    fireEvent.click(docTab);

    expect(screen.getByText(/Drag and drop your document here/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats:/i)).toBeInTheDocument();
  });

  it('populates textarea when sample preset button is clicked', () => {
    render(
      <BrowserRouter>
        <ScannerPage />
      </BrowserRouter>
    );

    const presetBtn = screen.getByText('KYC Onboarding');
    fireEvent.click(presetBtn);

    const textarea = screen.getByPlaceholderText(/Paste raw text/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Rajesh V. Sharma');
    expect(textarea.value).toContain('9999 4105 1543');
  });
});
