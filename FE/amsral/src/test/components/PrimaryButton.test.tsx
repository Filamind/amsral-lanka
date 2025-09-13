import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PrimaryButton from '../../components/common/PrimaryButton'

describe('PrimaryButton', () => {
    it('should render with children', () => {
        render(<PrimaryButton>Click me</PrimaryButton>)

        expect(screen.getByRole('button')).toBeInTheDocument()
        expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('should handle click events', () => {
        const handleClick = vi.fn()
        render(<PrimaryButton onClick={handleClick}>Click me</PrimaryButton>)

        fireEvent.click(screen.getByRole('button'))
        expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should be disabled when disabled prop is true', () => {
        render(<PrimaryButton disabled>Click me</PrimaryButton>)

        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should show loading state', () => {
        render(<PrimaryButton loading>Click me</PrimaryButton>)

        expect(screen.getByRole('button')).toBeDisabled()
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should be disabled when loading', () => {
        render(<PrimaryButton loading>Click me</PrimaryButton>)

        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should apply custom className', () => {
        render(<PrimaryButton className="custom-class">Click me</PrimaryButton>)

        expect(screen.getByRole('button')).toHaveClass('custom-class')
    })

    it('should apply custom style', () => {
        const customStyle = { backgroundColor: 'red' }
        render(<PrimaryButton style={customStyle}>Click me</PrimaryButton>)

        expect(screen.getByRole('button')).toHaveStyle('background-color: red')
    })

    it('should handle different button types', () => {
        render(<PrimaryButton type="submit">Submit</PrimaryButton>)

        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
    })

    it('should not show loading spinner when not loading', () => {
        render(<PrimaryButton>Click me</PrimaryButton>)

        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
})
