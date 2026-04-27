import { describe, expect, it } from 'vitest'

import { renderDotMatrixPlainText } from './DotMatrixFormatter'

function createModel(overrides = {}) {
  return {
    charsPerLine: 30,
    company: { name: '', address: '', phone: '' },
    meta: { number: '', dateFormatted: '', cashier: '', warehouse: '' },
    itemRows: [],
    paymentRows: [],
    summary: { subtotal: 0, originalTotal: 0, discount: 0, tax: 0, total: 0, paid: 0, change: 0 },
    showPpn: false,
    ppnPercentage: 11,
    footerText: '',
    ...overrides,
  }
}

describe('DotMatrixFormatter', () => {
  it('menjaga spasi antar token dan align subtotal dengan [R]', () => {
    const model = createModel({
      itemRows: [
        {
          index: 1,
          name: 'Contoh Produk A',
          quantity: 2,
          unitPrice: 7500,
          subtotal: 15000,
          discount: 0,
        },
      ],
    })

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '{{#each items}}[R3]{{quantity}} {{name}}[R]{{subtotal}}{{/each items}}',
    })

    expect(result).toBe('  2 Contoh Produk A     15.000')
  })

  it('tidak menghapus teks setelah marker [R] pada level baris', () => {
    const model = createModel()

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '[R]TOTAL',
    })

    expect(result).toBe('                         TOTAL')
  })
})
