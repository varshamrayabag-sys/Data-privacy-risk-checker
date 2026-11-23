import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { ScannerPage } from '../pages/ScannerPage';

describe('ScannerPage Component', () => {
  it('renders input tabs and action buttons properly', () => {
    render(
      <BrowserRouter>
        <ScannerPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/manual text entry/i)).toBeInTheDocument();
    expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/paste text/i)).toBeInTheDocument();
  });

  it('switches between Manual Text and Document tabs', () => {
    render(
      <BrowserRouter>
        <ScannerPage />
      </BrowserRouter>
    );

    const docTab = screen.getByText(/upload document/i);
    fireEvent.click(docTab);

    expect(screen.getByText(/drop document to inspect/i)).toBeInTheDocument();
    expect(screen.getByText(/supported:/i)).toBeInTheDocument();
  });

  it('populates textarea when sample preset button is clicked', () => {
    render(
      <BrowserRouter>
        <ScannerPage />
      </BrowserRouter>
    );

    const presetBtn = screen.getByText(/kyc dossier/i);
    fireEvent.click(presetBtn);

    const textarea = screen.getByPlaceholderText(/paste text/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Rajesh V. Sharma');
    expect(textarea.value).toContain('9999 4105 1543');
  });
});
