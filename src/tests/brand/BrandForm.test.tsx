import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrandForm } from '../../components/brand/BrandForm';
import '@testing-library/jest-dom';
import { Brand } from '../../types/brand';
import userEvent from '@testing-library/user-event';

describe('BrandForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create form correctly', () => {
    render(
      <BrandForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/brand name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/choose color/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Check help text
    expect(screen.getByText(/letters, numbers, spaces, hyphens, and ampersands only/i)).toBeInTheDocument();
    expect(screen.getByText(/unique identifier using uppercase letters/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a color that represents your brand/i)).toBeInTheDocument();
  });

  describe('Brand Name Validation', () => {
    test('validates minimum length', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/brand name/i);
      await userEvent.type(nameInput, 'A');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    test('validates maximum length', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/brand name/i);
      await userEvent.type(nameInput, 'A'.repeat(51));
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/must be at most 50 characters/i)).toBeInTheDocument();
      });
    });

    test('validates character set', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/brand name/i);
      await userEvent.type(nameInput, 'Invalid@Name!');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/can only contain letters, numbers, spaces, hyphens, and ampersands/i)).toBeInTheDocument();
      });
    });

    test('validates whitespace-only names', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/brand name/i);
      await userEvent.type(nameInput, '   ');
      fireEvent.blur(nameInput);

      await waitFor(() => {
        expect(screen.getByText(/cannot be only whitespace/i)).toBeInTheDocument();
      });
    });
  });

  describe('Brand Code Validation', () => {
    test('validates minimum length', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const codeInput = screen.getByLabelText(/brand code/i);
      await userEvent.type(codeInput, 'A');
      fireEvent.blur(codeInput);

      await waitFor(() => {
        expect(screen.getByText(/must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    test('validates maximum length', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const codeInput = screen.getByLabelText(/brand code/i);
      await userEvent.type(codeInput, 'A'.repeat(11));
      fireEvent.blur(codeInput);

      await waitFor(() => {
        expect(screen.getByText(/must be at most 10 characters/i)).toBeInTheDocument();
      });
    });

    test('validates character set', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const codeInput = screen.getByLabelText(/brand code/i);
      await userEvent.type(codeInput, 'invalid-code');
      fireEvent.blur(codeInput);

      await waitFor(() => {
        expect(screen.getByText(/must contain only uppercase letters, numbers, and underscores/i)).toBeInTheDocument();
      });
    });

    test('validates underscore rules', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const codeInput = screen.getByLabelText(/brand code/i);
      
      // Test starting underscore
      await userEvent.clear(codeInput);
      await userEvent.type(codeInput, '_CODE');
      fireEvent.blur(codeInput);
      await waitFor(() => {
        expect(screen.getByText(/cannot start or end with an underscore/i)).toBeInTheDocument();
      });

      // Test ending underscore
      await userEvent.clear(codeInput);
      await userEvent.type(codeInput, 'CODE_');
      fireEvent.blur(codeInput);
      await waitFor(() => {
        expect(screen.getByText(/cannot start or end with an underscore/i)).toBeInTheDocument();
      });

      // Test consecutive underscores
      await userEvent.clear(codeInput);
      await userEvent.type(codeInput, 'CO__DE');
      fireEvent.blur(codeInput);
      await waitFor(() => {
        expect(screen.getByText(/cannot contain consecutive underscores/i)).toBeInTheDocument();
      });
    });
  });

  describe('Color Validation', () => {
    test('validates color format', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const colorInput = screen.getByDisplayValue('#FF0000');
      await userEvent.clear(colorInput);
      await userEvent.type(colorInput, 'invalid');
      fireEvent.blur(colorInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid color format/i)).toBeInTheDocument();
      });
    });

    test('validates color contrast', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const colorInput = screen.getByDisplayValue('#FF0000');
      
      // Test too light color
      await userEvent.clear(colorInput);
      await userEvent.type(colorInput, '#FFFFFF');
      fireEvent.blur(colorInput);
      await waitFor(() => {
        expect(screen.getByText(/better contrast/i)).toBeInTheDocument();
      });

      // Test too dark color
      await userEvent.clear(colorInput);
      await userEvent.type(colorInput, '#000000');
      fireEvent.blur(colorInput);
      await waitFor(() => {
        expect(screen.getByText(/better contrast/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cross-field Validation', () => {
    test('validates brand code not matching name', async () => {
      render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const nameInput = screen.getByLabelText(/brand name/i);
      const codeInput = screen.getByLabelText(/brand code/i);

      await userEvent.type(nameInput, 'TEST123');
      await userEvent.type(codeInput, 'TEST123');
      fireEvent.blur(codeInput);

      await waitFor(() => {
        expect(screen.getByText(/brand code should not be identical to the brand name/i)).toBeInTheDocument();
      });
    });
  });

  test('submits form with valid data', async () => {
    render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await userEvent.type(screen.getByLabelText(/brand code/i), 'TEST_1');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Brand',
        code: 'TEST_1',
        color: expect.any(String),
      });
    });
  });

  test('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<BrandForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await userEvent.type(screen.getByLabelText(/brand name/i), 'Test Brand');
    await userEvent.type(screen.getByLabelText(/brand code/i), 'TEST_1');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
}); 