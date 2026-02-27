import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders minimarket login form', () => {
    render(<App />)

    expect(screen.getByText('Minimarket Ver 2.16.01')).toBeTruthy()
    expect(screen.getByLabelText('USER ID')).toBeTruthy()
    expect(screen.getByLabelText('PASSWORD')).toBeTruthy()
  })
})
