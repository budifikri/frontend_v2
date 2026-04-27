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

  it('mendukung marker [L] pada level baris tanpa menghapus isi', () => {
    const model = createModel()

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '[L]TOTAL',
    })

    expect(result).toBe('TOTAL                         ')
  })

  it('mendukung marker [C] pada level baris tanpa menghapus isi', () => {
    const model = createModel()

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '[C]TOTAL',
    })

    expect(result).toBe('            TOTAL             ')
  })

  it('merender token {{garis}} dengan fallback chars per line saat model belum punya charsPerLine', () => {
    const model = createModel({ charsPerLine: undefined })

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      chars_per_line: 32,
      custom_template_text_dot_matrix: '{{garis}}',
    })

    expect(result).toBe('================================')
  })

  it('tidak menambah baris kosong ekstra antar item pada loop multi-line', () => {
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
        {
          index: 2,
          name: 'Contoh Produk B',
          quantity: 1,
          unitPrice: 12000,
          subtotal: 12000,
          discount: 0,
        },
      ],
    })

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '{{#each items}}\n[R3]{{quantity}} {{name}}[R]{{subtotal}}\n  Disc: {{discount}}\n{{/each items}}',
    })

    expect(result).toBe([
      '  2 Contoh Produk A     15.000',
      '  Disc: 0',
      '  1 Contoh Produk B     12.000',
      '  Disc: 0',
    ].join('\n'))
  })

  it('merender spacer [SP10] menghasilkan tepat 10 spasi', () => {
    const model = createModel()

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '[SP10]Subtotal',
    })

    expect(result).toBe('          Subtotal')
  })

  it('merender format kolom [SP10][L12]Label : [R10]{{subtotal}} secara konsisten', () => {
    const model = createModel({
      charsPerLine: 30,
      summary: {
        subtotal: 27000,
        originalTotal: 27000,
        discount: 0,
        tax: 0,
        total: 27000,
        paid: 90000,
        change: 63000,
      },
    })

    const result = renderDotMatrixPlainText(model, {
      template_mode: 'custom',
      custom_template_text_dot_matrix: '[SP10][L12]Subtotal : [R10]{{subtotal}}\n[SP10][L12]Diskon   : [R10]{{discount}}\n[SP10][L12]PPN      : [R10]{{tax_amount}}\n[SP10][L12]TOTAL    : [R10]{{total_amount}}\n[SP10][L12]Bayar    : [R10]{{paid_amount}}\n[SP10][L12]Kembali  : [R10]{{change_amount}}',
    })

    const lines = result.split('\n')
    expect(lines.length).toBe(6)
    expect(lines[0]).toBe('          Subtotal :      27.000')
    expect(lines[3]).toBe('          TOTAL    :      27.000')
    expect(lines[5]).toBe('          Kembali  :      63.000')
  })
})
