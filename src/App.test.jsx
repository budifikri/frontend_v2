import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders minimarket login form', () => {
    render(<App />)

    expect(screen.getByText('Minimarket Ver 2.16.01')).toBeTruthy()
    expect(screen.getByLabelText('USER ID')).toBeTruthy()
    expect(screen.getByLabelText('PASSWORD')).toBeTruthy()
  })

  it('opens dashboard when login button is clicked', () => {
    render(<App />)

    fireEvent.click(screen.getByLabelText('Masuk'))

    expect(screen.getByText('POS Admin Menu Dashboard')).toBeTruthy()
    expect(screen.getByText('System Connected')).toBeTruthy()
  })
})
