import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../shared/auth'
import { listProducts } from '../../features/master/product/product.api'
import { getCurrentCompany, listCompanies } from '../../features/master/company/company.api'
import { listWarehouses } from '../../features/master/warehouse/warehouse.api'
import { openCashDrawer, getCurrentCashDrawer, getCashDrawerSummary, closeCashDrawer, cashInDrawer, cashOutDrawer } from '../../features/transaksi/cash-drawer/cashDrawer.api'
import { createSale, listSales, getSaleById } from '../../features/transaksi/sales/sales.api'
import { DEFAULT_RECEIPT_SETTINGS, loadReceiptSettings, resetReceiptSettings, saveReceiptSettings } from '../../features/setting/receiptSetting.storage'
import { RECEIPT_LAYOUT_OPTIONS, getReceiptPaperClass, renderReceiptContent, DEFAULT_CUSTOM_TEMPLATE_HTML, DEFAULT_CUSTOM_TEMPLATE_CSS, RECEIPT_TEMPLATE_TOKENS } from './ReceiptLayouts'
import { ReceiptPreview } from './ReceiptPreview'
import { Toast } from '../../components/Toast'
import './POS.css'

export function POS() {
  const { auth, clearAuth } = useAuth()
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [productResults, setProductResults] = useState([])
  const [popupSelectedIndex, setPopupSelectedIndex] = useState(0)
  const [showActionPopup, setShowActionPopup] = useState(false)
  const [actionPopupIndex, setActionPopupIndex] = useState(0)
  const [PENDING_NOTAS, _setPendingNotas] = useState([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [paymentMethodIndex, setPaymentMethodIndex] = useState(0)
  const [transferAccount, setTransferAccount] = useState('')
  const paymentMethodCashRef = useRef(null)
  const paymentMethodQrisRef = useRef(null)
  const paymentMethodTransferRef = useRef(null)
  const transferInputRef = useRef(null)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteButtonIndex, setDeleteButtonIndex] = useState(1)
  const searchInputRef = useRef(null)
  const paymentInputRef = useRef(null)
  const deleteConfirmBtnRef = useRef(null)
  const deleteCancelBtnRef = useRef(null)
  const [showCashDrawerForm, setShowCashDrawerForm] = useState(false)
  const [openingBalance, setOpeningBalance] = useState('')
  const [cashDrawerNotes, setCashDrawerNotes] = useState('')
  const [mainWarehouse, setMainWarehouse] = useState(null)
  const [isOpeningDrawer, setIsOpeningDrawer] = useState(false)
  const openingBalanceRef = useRef(null)
  const [showClosingForm, setShowClosingForm] = useState(false)
  const [closingBalance, setClosingBalance] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [cashDrawerSummary, setCashDrawerSummary] = useState(null)
  const [currentCashDrawer, setCurrentCashDrawer] = useState(null)
  const [isClosingDrawer, setIsClosingDrawer] = useState(false)
  const [closingButtonIndex, setClosingButtonIndex] = useState(1)
  const closingBalanceRef = useRef(null)
  const closeBtnRef = useRef(null)
  const cancelCloseBtnRef = useRef(null)
  const logoutCloseBtnRef = useRef(null)
  const [showCashInForm, setShowCashInForm] = useState(false)
  const [cashInAmount, setCashInAmount] = useState('')
  const [cashInReason, setCashInReason] = useState('')
  const [isCashInSubmitting, setIsCashInSubmitting] = useState(false)
  const [cashInButtonIndex, setCashInButtonIndex] = useState(1)
  const cashInAmountRef = useRef(null)
  const cashInConfirmBtnRef = useRef(null)
  const cashInCancelBtnRef = useRef(null)
  const [showCashOutForm, setShowCashOutForm] = useState(false)
  const [cashOutAmount, setCashOutAmount] = useState('')
  const [cashOutReason, setCashOutReason] = useState('')
  const [isCashOutSubmitting, setIsCashOutSubmitting] = useState(false)
  const [cashOutButtonIndex, setCashOutButtonIndex] = useState(1)
  const cashOutAmountRef = useRef(null)
  const cashOutConfirmBtnRef = useRef(null)
  const cashOutCancelBtnRef = useRef(null)
  const [pendingNotes, setPendingNotes] = useState([])
  const [showPendingPopup, setShowPendingPopup] = useState(false)
  const [pendingSelectedIndex, setPendingSelectedIndex] = useState(0)
  const [showPrintPopup, setShowPrintPopup] = useState(false)
  const [printNotes, setPrintNotes] = useState([])
  const [printSelectedIndex, setPrintSelectedIndex] = useState(0)
  const [isLoadingPrintNotes, setIsLoadingPrintNotes] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showReceiptSettingsPopup, setShowReceiptSettingsPopup] = useState(false)
  const [receiptSettings, setReceiptSettings] = useState(DEFAULT_RECEIPT_SETTINGS)
  const [receiptSettingsDraft, setReceiptSettingsDraft] = useState(DEFAULT_RECEIPT_SETTINGS)
  const [companyProfile, setCompanyProfile] = useState({ name: '', address: '', phone: '' })
  const wysiwygEditorRef = useRef(null)
  const codeEditorRef = useRef(null)
  const [showTemplateCode, setShowTemplateCode] = useState(false)
  const [templateCodeHtml, setTemplateCodeHtml] = useState('')
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('pos_pending_notes')
    if (saved) {
      try {
        setPendingNotes(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse pending notes:', e)
      }
    }
  }, [])

  useEffect(() => {
    const loaded = loadReceiptSettings()
    setReceiptSettings(loaded)
    setReceiptSettingsDraft(loaded)
  }, [])

  useEffect(() => {
    if (
      wysiwygEditorRef.current &&
      receiptSettingsDraft.template_mode === 'custom' &&
      showReceiptSettingsPopup
    ) {
      const currentHtml = wysiwygEditorRef.current.innerHTML
      const targetHtml = receiptSettingsDraft.custom_template_html || ''
      if (currentHtml !== targetHtml) {
        wysiwygEditorRef.current.innerHTML = targetHtml
      }
    }
  }, [receiptSettingsDraft.custom_template_html, receiptSettingsDraft.template_mode, showReceiptSettingsPopup])

  useEffect(() => {
    const loadCompanyProfile = async () => {
      if (!auth.token) return

      try {
        const current = await getCurrentCompany(auth.token)
        const first = current?.data
        if (!first) {
          throw new Error('Current company not found')
        }
        const mapped = {
          name: first?.nama || first?.name || auth.companyName || '',
          address: first?.address || '',
          phone: first?.telp || first?.phone || '',
        }
        setCompanyProfile(mapped)
      } catch {
        try {
          const result = await listCompanies(auth.token, { limit: 1, offset: 0 })
          const first = result?.items?.[0]
          if (!first) {
            setCompanyProfile((prev) => ({ ...prev, name: auth.companyName || prev.name }))
            return
          }

          const mapped = {
            name: first?.nama || first?.name || auth.companyName || '',
            address: first?.address || '',
            phone: first?.telp || first?.phone || '',
          }
          setCompanyProfile(mapped)
        } catch {
          setCompanyProfile((prev) => ({ ...prev, name: auth.companyName || prev.name }))
        }
      }
    }

    loadCompanyProfile()
  }, [auth.token, auth.companyName])

  useEffect(() => {
    const loadWarehouse = async () => {
      try {
        const warehouseResult = await listWarehouses(auth.token, { limit: 100 })
        const main = warehouseResult.items.find(w => w.type === 'MAIN')
        if (main) {
          setMainWarehouse(main)
        }
      } catch (err) {
        console.error('Failed to load warehouse:', err)
      }
    }

    const checkCashDrawerStatus = async () => {
      try {
        const result = await getCurrentCashDrawer(auth.token)
        if (result.success && result.data) {
          setCurrentCashDrawer(result.data)
          setShowCashDrawerForm(false)
          await loadWarehouse()
        } else {
          await loadWarehouse()
          setShowCashDrawerForm(true)
        }
      } catch (err) {
        console.error('Failed to check cash drawer:', err)
        setShowCashDrawerForm(false)
      }
    }
    checkCashDrawerStatus()
  }, [auth.token])

  useEffect(() => {
    if (showCashDrawerForm && openingBalanceRef.current) {
      openingBalanceRef.current.focus()
    }
  }, [showCashDrawerForm])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (showPaymentForm) {
      setPaymentMethodIndex(0)
      setPaymentMethod('CASH')
      setTimeout(() => {
        if (paymentInputRef.current) {
          paymentInputRef.current.focus()
        }
      }, 100)
    }
  }, [showPaymentForm])

  const navigatePaymentMethod = (direction) => {
    const methods = ['CASH', 'QRIS', 'TRANSFER']
    let newIndex
    if (direction === 'left') {
      newIndex = paymentMethodIndex > 0 ? paymentMethodIndex - 1 : methods.length - 1
    } else {
      newIndex = paymentMethodIndex < methods.length - 1 ? paymentMethodIndex + 1 : 0
    }
    setPaymentMethodIndex(newIndex)
    setPaymentMethod(methods[newIndex])
    const refs = [paymentMethodCashRef, paymentMethodQrisRef, paymentMethodTransferRef]
    if (refs[newIndex].current) refs[newIndex].current.focus()
  }

  useEffect(() => {
    if (showDeleteConfirm && deleteCancelBtnRef.current) {
      deleteCancelBtnRef.current.focus()
      setDeleteButtonIndex(1)
    }
  }, [showDeleteConfirm])

  const handleLogout = () => {
    handleShowClosingForm()
  }

  const handleShowClosingForm = async () => {
    try {
      const result = await getCurrentCashDrawer(auth.token)
      if (result.success && result.data) {
        setCurrentCashDrawer(result.data)
        const summary = await getCashDrawerSummary(auth.token, result.data.id)
        if (summary.success) {
          setCashDrawerSummary(summary.data)
          setClosingBalance(String(summary.data.expected_balance || 0))
        }
        setShowClosingForm(true)
        setClosingButtonIndex(1)
      } else {
        clearAuth()
      }
    } catch (err) {
      console.error('Failed to get cash drawer summary:', err)
      clearAuth()
    }
  }

  const handleCloseDrawer = useCallback(async () => {
    if (!currentCashDrawer) return
    setIsClosingDrawer(true)
    try {
      await closeCashDrawer(auth.token, currentCashDrawer.id, parseFloat(closingBalance) || 0, closingNotes)
      setShowClosingForm(false)
      clearAuth()
    } catch (err) {
      console.error('Failed to close cash drawer:', err)
      alert('Gagal menutup cash drawer: ' + (err.message || 'Unknown error'))
    } finally {
      setIsClosingDrawer(false)
    }
  }, [auth.token, currentCashDrawer, closingBalance, closingNotes, clearAuth])

  const handleCancelClose = useCallback(() => {
    setShowClosingForm(false)
    setClosingBalance('')
    setClosingNotes('')
  }, [])

  const handleShowCashInForm = async () => {
    try {
      const result = await getCurrentCashDrawer(auth.token)
      if (result.success && result.data) {
        setCurrentCashDrawer(result.data)
        setShowCashInForm(true)
        setCashInAmount('')
        setCashInReason('')
        setCashInButtonIndex(1)
        setTimeout(() => cashInAmountRef.current?.focus(), 100)
      }
    } catch (err) {
      console.error('Failed to get cash drawer:', err)
    }
  }

  const handleCashIn = useCallback(async () => {
    if (!currentCashDrawer || !cashInAmount || parseFloat(cashInAmount) <= 0) {
      alert('Masukkan jumlah yang valid')
      return
    }
    setIsCashInSubmitting(true)
    try {
      await cashInDrawer(auth.token, currentCashDrawer.id, parseFloat(cashInAmount), cashInReason)
      alert('Cash In berhasil!')
      setShowCashInForm(false)
      setCashInAmount('')
      setCashInReason('')
    } catch (err) {
      console.error('Failed to cash in:', err)
      alert('Gagal cash in: ' + (err.message || 'Unknown error'))
    } finally {
      setIsCashInSubmitting(false)
    }
  }, [auth.token, currentCashDrawer, cashInAmount, cashInReason])

  const handleCancelCashIn = useCallback(() => {
    setShowCashInForm(false)
    setCashInAmount('')
    setCashInReason('')
  }, [])

  const handleShowCashOutForm = async () => {
    try {
      const result = await getCurrentCashDrawer(auth.token)
      if (result.success) {
        setCurrentCashDrawer(result.data)
        setShowCashOutForm(true)
        setCashOutAmount('')
        setCashOutReason('')
        setTimeout(() => cashOutAmountRef.current?.focus(), 100)
      } else {
        alert('Cash drawer belum dibuka')
      }
    } catch (err) {
      console.error('Failed to get cash drawer:', err)
    }
  }

  const handleCashOut = useCallback(async () => {
    if (!currentCashDrawer || !cashOutAmount || parseFloat(cashOutAmount) <= 0) {
      alert('Masukkan jumlah yang valid')
      return
    }
    setIsCashOutSubmitting(true)
    try {
      await cashOutDrawer(auth.token, currentCashDrawer.id, parseFloat(cashOutAmount), cashOutReason)
      alert('Cash Out berhasil!')
      setShowCashOutForm(false)
      setCashOutAmount('')
      setCashOutReason('')
    } catch (err) {
      console.error('Failed to cash out:', err)
      alert('Gagal cash out: ' + (err.message || 'Unknown error'))
    } finally {
      setIsCashOutSubmitting(false)
    }
  }, [auth.token, currentCashDrawer, cashOutAmount, cashOutReason])

  const handleCancelCashOut = useCallback(() => {
    setShowCashOutForm(false)
    setCashOutAmount('')
    setCashOutReason('')
  }, [])

  const handleOpenCashDrawer = async () => {
    if (!mainWarehouse) {
      alert('Warehouse utama tidak ditemukan')
      return
    }
    setIsOpeningDrawer(true)
    try {
      const result = await openCashDrawer(auth.token, {
        opening_balance: parseFloat(openingBalance) || 0,
        notes: cashDrawerNotes,
        warehouse_id: mainWarehouse.id,
      })
      if (result.success && result.data) {
        setCurrentCashDrawer(result.data)
      }
      setShowCashDrawerForm(false)
    } catch (err) {
      console.error('Failed to open cash drawer:', err)
      alert('Gagal membuka cash drawer: ' + (err.message || 'Unknown error'))
    } finally {
      setIsOpeningDrawer(false)
    }
  }

  const handleSkipCashDrawer = () => {
    setShowCashDrawerForm(false)
  }

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }, [])

  const formatDateTime = useCallback((value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  const escapeHtml = useCallback((value) => {
    const text = String(value ?? '')
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }, [])

  const openPrintWindow = useCallback((sale) => {
    const effectiveCompanyName = companyProfile.name || auth.companyName || sale.company_name || '-'
    const effectiveCompanyAddress = receiptSettings.company_address?.trim() || companyProfile.address || sale.company_address || ''
    const effectiveCompanyPhone = receiptSettings.company_phone?.trim() || companyProfile.phone || sale.company_phone || ''
    const effectiveReceiptSettings = {
      ...receiptSettings,
      company_address: effectiveCompanyAddress,
      company_phone: effectiveCompanyPhone,
    }

    const saleWithCompany = {
      ...sale,
      company_name: effectiveCompanyName,
      company_address: effectiveCompanyAddress,
      company_phone: effectiveCompanyPhone,
    }

    const paperSizeMm = receiptSettings.paper_size === '80mm' ? 80 : 58
    const contentWidthMm = paperSizeMm === 80 ? 76 : 56
    const paperClass = getReceiptPaperClass(receiptSettings.paper_size)
    const isDotMatrix = receiptSettings.printer_type === 'dot_matrix'
    const fontFamily = isDotMatrix ? "'Courier New', monospace" : "Arial, sans-serif"
    const borderStyle = isDotMatrix ? '1px dotted #94a3b8' : '1px solid #e2e8f0'
    const lineBorder = isDotMatrix ? '1px dotted #cbd5e1' : '1px dashed #cbd5e1'
    const fontSize = paperSizeMm === 80 ? '12px' : '11px'
    const showCalibration = Boolean(receiptSettings.calibration_mode)
    const calibrationLabel = `Calibration 50mm (${paperSizeMm}mm mode)`

    const receiptResult = renderReceiptContent(saleWithCompany, effectiveReceiptSettings, {
      escapeHtml,
      formatCurrency,
      formatDateTime,
    })
    const receiptBody = receiptResult.bodyHtml
    const isCustomTemplate = receiptResult.isCustom
    const customCss = receiptResult.customCss

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Nota ${escapeHtml(sale.sale_number || sale.id || '')}</title>
        <style>
          @page {
            size: ${paperSizeMm}mm auto;
            margin: 0;
          }
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            width: ${paperSizeMm}mm;
            min-width: ${paperSizeMm}mm;
            font-family: ${fontFamily};
            color: #0f172a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            background: #fff;
            font-size: ${fontSize};
            line-height: 1.35;
          }
          .receipt-wrap {
            margin: 0 auto;
            width: ${contentWidthMm}mm;
            max-width: ${contentWidthMm}mm;
            background: white;
            border: ${borderStyle};
            padding: 2mm;
            overflow: hidden;
          }
          .receipt-wrap.paper-58 { font-size: 11px; }
          .receipt-wrap.paper-80 { font-size: 12px; }
          .receipt-logo { width: 24px; height: 24px; border-radius: 50%; background: #0ea5e9; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-weight: 700; font-size: 10px; }
          h1 { margin: 0 0 8px; text-align: center; font-size: 16px; letter-spacing: 0.08em; }
          .subtitle { text-align: center; margin-bottom: 8px; font-weight: 700; }
          .receipt-header-wrap { border-bottom: ${lineBorder}; margin-bottom: 8px; padding-bottom: 8px; }
          .receipt-header-wrap.brand { padding: 8px 0; margin-bottom: 10px; }
          .meta-row { margin: 2px 0; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          th, td { border-bottom: ${lineBorder}; padding: 4px 2px; }
          th { text-align: left; }
          .line-items-wrap { border-bottom: ${lineBorder}; padding: 6px 0; margin: 8px 0; }
          .line-item { margin-bottom: 6px; }
          .line-title { font-weight: 700; white-space: normal; overflow-wrap: anywhere; word-break: break-word; }
          .line-detail { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
          .line-detail span { flex: 1; min-width: 0; }
          .line-detail strong { flex-shrink: 0; text-align: right; padding-left: 8px; }
          .summary { margin-top: 8px; }
          .summary div { display: flex; justify-content: space-between; margin: 2px 0; }
          .summary .total { padding-top: 4px; margin-top: 4px; font-weight: 700; }
          .payments-block { margin-top: 8px; border-top: ${lineBorder}; padding-top: 6px; }
          .pay-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .footer { margin-top: 8px; text-align: center; border-top: ${lineBorder}; padding-top: 6px; color: #334155; }
          .calibration-block { margin-top: 10px; padding-top: 6px; border-top: ${lineBorder}; text-align: center; }
          .calibration-label { font-size: 10px; color: #475569; margin-bottom: 4px; }
          .calibration-line { width: 50mm; max-width: 100%; border-top: 1px solid #0f172a; margin: 0 auto; height: 0; }
          .calibration-scale { width: 50mm; max-width: 100%; margin: 2px auto 0; display: flex; justify-content: space-between; font-size: 9px; color: #475569; }
          ${isCustomTemplate ? customCss : ''}
          @media print {
            html, body {
              width: ${paperSizeMm}mm;
              min-width: ${paperSizeMm}mm;
              background: white;
            }
            .receipt-wrap {
              border: none;
              width: ${contentWidthMm}mm;
              max-width: ${contentWidthMm}mm;
              margin: 0 auto;
              padding: 2mm 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-wrap ${paperClass}">
          ${receiptBody}
          ${showCalibration ? `<div class="calibration-block"><div class="calibration-label">${calibrationLabel}</div><div class="calibration-line"></div><div class="calibration-scale"><span>0</span><span>50mm</span></div></div>` : ''}
        </div>
        <script>
          window.onload = () => {
            window.print()
            setTimeout(() => window.close(), 200)
          }
        </script>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) {
      throw new Error('Popup cetak diblokir browser')
    }
    printWindow.document.write(html)
    printWindow.document.close()
  }, [auth.companyName, companyProfile.address, companyProfile.name, companyProfile.phone, escapeHtml, formatCurrency, formatDateTime, receiptSettings])

  const handleOpenReceiptSettings = useCallback(() => {
    setReceiptSettingsDraft(receiptSettings)
    setShowTemplateCode(false)
    setTemplateCodeHtml(receiptSettings.custom_template_html || '')
    setShowReceiptSettingsPopup(true)
  }, [receiptSettings])

  const handleSaveReceiptSettings = useCallback(() => {
    const currentHtml = wysiwygEditorRef.current?.innerHTML || receiptSettingsDraft.custom_template_html
    const toSave = { ...receiptSettingsDraft, custom_template_html: currentHtml }
    const saved = saveReceiptSettings(toSave)
    setReceiptSettings(saved)
    setShowReceiptSettingsPopup(false)
    setToast({ isOpen: true, message: 'Setting nota jual disimpan', type: 'success' })
  }, [receiptSettingsDraft])

  const handleResetReceiptSettings = useCallback(() => {
    const defaults = resetReceiptSettings()
    setReceiptSettingsDraft({
      ...defaults,
      custom_template_html: DEFAULT_CUSTOM_TEMPLATE_HTML,
    })
    setToast({ isOpen: true, message: 'Setting dikembalikan ke default', type: 'info' })
  }, [])

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = subtotal * 0.11
  const total = subtotal + tax
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null
  const displayItem = selectedItem || items[items.length - 1]

  const selectedPrintNote = printNotes[printSelectedIndex]
  const previewNote = {
    ...selectedPrintNote,
    company_name: selectedPrintNote?.company_name || companyProfile.name || auth.companyName || '-',
    company_address: selectedPrintNote?.company_address || companyProfile.address || '',
    company_phone: selectedPrintNote?.company_phone || companyProfile.phone || '',
    sale_number: selectedPrintNote?.sale_number || 'PREVIEW-001',
    sale_date: selectedPrintNote?.sale_date || new Date().toISOString(),
    cashier_name: selectedPrintNote?.cashier_name || auth.username || '-',
    warehouse_name: selectedPrintNote?.warehouse_name || mainWarehouse?.name || '-',
    items: selectedPrintNote?.items || items.map((item) => ({
      product_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
    })),
    subtotal: selectedPrintNote?.subtotal ?? subtotal,
    tax_amount: selectedPrintNote?.tax_amount ?? tax,
    total_amount: selectedPrintNote?.total_amount ?? total,
    paid_amount: selectedPrintNote?.paid_amount ?? total,
    change_amount: selectedPrintNote?.change_amount ?? 0,
    payments: selectedPrintNote?.payments || [{ method: 'CASH', amount: total }],
  }

  const handleItemClick = (item, index) => {
    setSelectedIndex(index)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleSearchChange = (value) => {
    setSearch(value)
  }

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'F7') {
      e.preventDefault()
      handleShowPrintPopup()
    } else if (e.key === 'F11') {
      e.preventDefault()
      handleOpenReceiptSettings()
    } else if (e.key === 'F8') {
      e.preventDefault()
      handleShowCashInForm()
    } else if (e.key === 'F9') {
      e.preventDefault()
      handleShowCashOutForm()
    } else if (e.key === 'F10') {
      e.preventDefault()
      if (items.length > 0) {
        setShowPaymentForm(true)
        setPaymentAmount('')
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showPrintPopup && printNotes.length > 0) {
        handlePrintSale(printNotes[printSelectedIndex]?.id)
      } else if (showPendingPopup && pendingNotes.length > 0) {
        handleRestorePending(pendingNotes[pendingSelectedIndex])
      } else if (showProductPopup && productResults.length > 0) {
        handleSelectProduct(productResults[popupSelectedIndex])
      } else if (showActionPopup) {
        handleActionSelect(actionPopupIndex)
      } else {
        const qtyMatch = search.match(/^\+(\d+)$/)
        if (qtyMatch && selectedIndex >= 0) {
          const newQty = parseInt(qtyMatch[1], 10)
          if (newQty === 0) {
            setItemToDelete({ index: selectedIndex, item: items[selectedIndex] })
            setShowDeleteConfirm(true)
          } else {
            setItems((prevItems) =>
              prevItems.map((item, idx) =>
                idx === selectedIndex ? { ...item, qty: newQty } : item
              )
            )
          }
          setSearch('')
        } else if (search.startsWith('?')) {
          const filterText = search.substring(1).trim()
          if (filterText) {
            setIsLoadingProducts(true)
            try {
              const result = await listProducts(auth.token, { search: filterText, limit: 50 })
              const products = result.items.map(p => ({
                id: p.id,
                name: p.name,
                unit: p.unit_name || p.unit || 'Pcs',
                price: p.retail_price || 0,
              }))
              setProductResults(products)
              setPopupSelectedIndex(0)
              setShowProductPopup(true)
            } catch (err) {
              console.error('Failed to load products:', err)
              setProductResults([])
            } finally {
              setIsLoadingProducts(false)
            }
          }
        } else if (search.trim()) {
          setIsLoadingProducts(true)
          try {
            const result = await listProducts(auth.token, { search: search.trim(), limit: 50 })
            const products = result.items.map(p => ({
              id: p.id,
              name: p.name,
              unit: p.unit_name || p.unit || 'Pcs',
              price: p.retail_price || 0,
            }))
            if (products.length === 1) {
              handleSelectProduct(products[0])
            } else if (products.length > 1) {
              setProductResults(products)
              setPopupSelectedIndex(0)
              setShowProductPopup(true)
            } else {
              setToast({ isOpen: true, message: 'Produk tidak ditemukan', type: 'warning' })
            }
          } catch (err) {
            console.error('Failed to load products:', err)
            setProductResults([])
          } finally {
            setIsLoadingProducts(false)
          }
        } else if (search === '' && items.length > 0) {
          setShowActionPopup(true)
          setActionPopupIndex(0)
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showProductPopup) {
        if (popupSelectedIndex < productResults.length - 1) {
          setPopupSelectedIndex(popupSelectedIndex + 1)
        }
      } else if (showActionPopup) {
        if (actionPopupIndex < 2) {
          setActionPopupIndex(actionPopupIndex + 1)
        }
      } else if (items.length > 0) {
        const nextIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : items.length - 1
        setSelectedIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showProductPopup) {
        if (popupSelectedIndex > 0) {
          setPopupSelectedIndex(popupSelectedIndex - 1)
        }
      } else if (showActionPopup) {
        if (actionPopupIndex > 0) {
          setActionPopupIndex(actionPopupIndex - 1)
        }
      } else if (items.length > 0) {
        const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : 0
        setSelectedIndex(prevIndex)
      }
    } else if (e.key === 'Escape') {
      if (showProductPopup) {
        setShowProductPopup(false)
        setSearch('')
      } else if (showActionPopup) {
        setShowActionPopup(false)
      }
    }
  }

  const handleSelectProduct = (product) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.name === product.name)
      if (existingIndex >= 0) {
        const updated = prev.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: item.qty + 1 } : item
        )
        setSelectedIndex(existingIndex)
        return updated
      }
      const newIndex = prev.length
      const newItem = {
        id: `${product.id}-${newIndex}`,
        product_id: product.id,
        name: product.name,
        qty: 1,
        price: product.price,
      }
      setSelectedIndex(newIndex)
      return [...prev, newItem]
    })
    setShowProductPopup(false)
    setSearch('')
  }

  const handleShowPrintPopup = useCallback(async () => {
    try {
      setIsLoadingPrintNotes(true)

      let activeDrawer = currentCashDrawer
      if (!activeDrawer?.id) {
        const drawerResult = await getCurrentCashDrawer(auth.token)
        if (drawerResult.success && drawerResult.data) {
          activeDrawer = drawerResult.data
          setCurrentCashDrawer(drawerResult.data)
        }
      }

      if (!activeDrawer?.id) {
        setToast({ isOpen: true, message: 'Cash drawer aktif tidak ditemukan', type: 'warning' })
        return
      }

      const result = await listSales(auth.token, {
        status: 'DONE',
        cash_drawer_id: activeDrawer.id,
        limit: 100,
      })

      const source = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.items)
          ? result.items
          : Array.isArray(result.data?.items)
            ? result.data.items
            : []

      const normalized = source.filter((sale) => sale?.status === 'DONE' && sale?.cash_drawer_id === activeDrawer.id)

      if (normalized.length === 0) {
        setToast({ isOpen: true, message: 'Tidak ada nota DONE untuk drawer aktif', type: 'info' })
        return
      }

      setPrintNotes(normalized)
      setPrintSelectedIndex(0)
      setShowPrintPopup(true)
    } catch (err) {
      console.error('Failed to load print sales:', err)
      setToast({ isOpen: true, message: 'Gagal memuat daftar nota cetak', type: 'error' })
    } finally {
      setIsLoadingPrintNotes(false)
    }
  }, [auth.token, currentCashDrawer])

  const handlePrintSale = useCallback(async (saleId) => {
    if (!saleId || isPrinting) return
    try {
      setIsPrinting(true)
      const result = await getSaleById(auth.token, saleId)
      if (!result?.data) {
        throw new Error('Data nota tidak ditemukan')
      }
      openPrintWindow(result.data)
      setShowPrintPopup(false)
      setToast({ isOpen: true, message: 'Cetak nota diproses', type: 'success' })
    } catch (err) {
      console.error('Failed to print sale:', err)
      setToast({ isOpen: true, message: 'Gagal cetak nota penjualan', type: 'error' })
    } finally {
      setIsPrinting(false)
    }
  }, [auth.token, isPrinting, openPrintWindow])

  const handleSavePending = () => {
    if (items.length === 0) {
      setToast({ isOpen: true, message: 'Tidak ada item untuk di pending', type: 'warning' })
      return
    }

    const pendingNote = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(items)),
      subtotal,
      tax,
      total,
      cashier: auth.username,
    }

    const updated = [...pendingNotes, pendingNote]
    setPendingNotes(updated)
    localStorage.setItem('pos_pending_notes', JSON.stringify(updated))

    setToast({ isOpen: true, message: 'Data di pending', type: 'success' })

    setItems([])
    setSelectedIndex(-1)
    setSearch('')
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 0)
  }

  const handleRestorePending = useCallback((pendingNote) => {
    if (items.length > 0) {
      setShowPendingPopup(false)
      setToast({ isOpen: true, message: 'Nota penjualan masih ada transaksi', type: 'warning' })
      return
    }

    setItems(pendingNote.items)
    setSelectedIndex(-1)

    const updated = pendingNotes.filter(n => n.id !== pendingNote.id)
    setPendingNotes(updated)
    localStorage.setItem('pos_pending_notes', JSON.stringify(updated))

    setShowPendingPopup(false)
    setToast({ isOpen: true, message: 'Restore data pending', type: 'success' })
  }, [pendingNotes, items.length])

  const handleActionSelect = (index) => {
    setShowActionPopup(false)
    if (index === 0) {
      setShowPaymentForm(true)
      setPaymentAmount('')
    } else if (index === 1) {
      handleSavePending()
    } else if (index === 2) {
      setItems([])
      setSelectedIndex(-1)
      setSearch('')
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 0)
    }
  }

  const handlePayment = async () => {
    const payment = parseFloat(paymentAmount) || 0
    if (paymentMethod === 'CASH' && payment < total) {
      alert('Jumlah pembayaran kurang dari total')
      return
    }
    if (paymentMethod === 'TRANSFER' && !transferAccount.trim()) {
      alert('Masukkan nomor rekening tujuan')
      return
    }

    try {
      const currentItems = [...items]
      const currentSubtotal = subtotal
      const currentTax = tax
      const currentTotal = total

      const saleItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.qty,
      }))

      const paymentData = {
        amount: paymentMethod === 'CASH' ? payment : total,
        method: paymentMethod,
      }

      if (paymentMethod === 'TRANSFER') {
        paymentData.reference_number = transferAccount
      }

      const salePayload = {
        warehouse_id: mainWarehouse?.id,
        cash_drawer_id: currentCashDrawer?.id,
        status: 'DONE',
        items: saleItems,
        payments: [paymentData],
      }

      const result = await createSale(auth.token, salePayload)

      const change = payment - total
      const successNote = paymentMethod === 'CASH'
        ? `Pembayaran berhasil - Kembalian ${formatCurrency(change)}`
        : 'Pembayaran berhasil'
      setToast({ isOpen: true, message: successNote, type: 'success' })

      if (receiptSettings.auto_print_after_payment) {
        try {
          let saleForPrint = null
          const createdId = result?.data?.id || result?.data?.sale_id

          if (createdId) {
            const detail = await getSaleById(auth.token, createdId)
            saleForPrint = detail?.data || null
          }

          if (!saleForPrint) {
            saleForPrint = {
              id: createdId || Date.now(),
              sale_number: result?.data?.sale_number || result?.data?.invoice_number || '-',
              sale_date: new Date().toISOString(),
              cashier_name: auth.username || '-',
              warehouse_name: mainWarehouse?.name || '-',
              items: currentItems.map((item) => ({
                product_name: item.name,
                quantity: item.qty,
                unit_price: item.price,
              })),
              subtotal: currentSubtotal,
              tax_amount: currentTax,
              total_amount: currentTotal,
              paid_amount: paymentMethod === 'CASH' ? payment : currentTotal,
              change_amount: paymentMethod === 'CASH' ? payment - currentTotal : 0,
              payments: [{
                payment_method: paymentMethod,
                amount: paymentMethod === 'CASH' ? payment : currentTotal,
              }],
            }
          }

          openPrintWindow(saleForPrint)
          setToast({ isOpen: true, message: 'Cetak nota diproses', type: 'success' })
        } catch (printErr) {
          console.error('Failed to print sale after payment:', printErr)
          setToast({ isOpen: true, message: 'Pembayaran sukses, tapi cetak nota gagal', type: 'warning' })
        }
      }

      setItems([])
      setSelectedIndex(-1)
      setShowPaymentForm(false)
      setPaymentAmount('')
      setPaymentMethod('CASH')
      setPaymentMethodIndex(0)
      setTransferAccount('')
    } catch (err) {
      console.error('Failed to save sale:', err)
      const errorMsg = err.message || 'Unknown error'
      alert('Gagal menyimpan penjualan: ' + errorMsg)
    }
  }

  const handleDeleteConfirm = useCallback(() => {
    if (itemToDelete) {
      setItems((prev) => prev.filter((_, idx) => idx !== itemToDelete.index))
      setSelectedIndex(-1)
    }
    setShowDeleteConfirm(false)
    setItemToDelete(null)
    setSearch('')
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 0)
  }, [itemToDelete])

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
    setSearch('')
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 0)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showCashInForm) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setCashInButtonIndex(cashInButtonIndex > 0 ? cashInButtonIndex - 1 : 1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setCashInButtonIndex(cashInButtonIndex < 1 ? cashInButtonIndex + 1 : 0)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleCancelCashIn()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (cashInButtonIndex === 0) {
            handleCashIn()
          } else {
            handleCancelCashIn()
          }
        }
        return
      }
      if (showReceiptSettingsPopup) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowReceiptSettingsPopup(false)
        } else if (e.key === 'F11') {
          e.preventDefault()
          setShowReceiptSettingsPopup(false)
        }
        return
      }
      if (showCashOutForm) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setCashOutButtonIndex(cashOutButtonIndex > 0 ? cashOutButtonIndex - 1 : 1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setCashOutButtonIndex(cashOutButtonIndex < 1 ? cashOutButtonIndex + 1 : 0)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleCancelCashOut()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (cashOutButtonIndex === 0) {
            handleCashOut()
          } else {
            handleCancelCashOut()
          }
        }
        return
      }
      if (showPendingPopup) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setPendingSelectedIndex(pendingSelectedIndex > 0 ? pendingSelectedIndex - 1 : pendingNotes.length - 1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setPendingSelectedIndex(pendingSelectedIndex < pendingNotes.length - 1 ? pendingSelectedIndex + 1 : 0)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setShowPendingPopup(false)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (pendingNotes[pendingSelectedIndex]) {
            handleRestorePending(pendingNotes[pendingSelectedIndex])
          }
        }
        return
      }
      if (showPrintPopup) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setPrintSelectedIndex(printSelectedIndex > 0 ? printSelectedIndex - 1 : printNotes.length - 1)
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setPrintSelectedIndex(printSelectedIndex < printNotes.length - 1 ? printSelectedIndex + 1 : 0)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setShowPrintPopup(false)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (printNotes[printSelectedIndex]) {
            handlePrintSale(printNotes[printSelectedIndex].id)
          }
        }
        return
      }
      if (showClosingForm) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setClosingButtonIndex(closingButtonIndex > 0 ? closingButtonIndex - 1 : 2)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setClosingButtonIndex(closingButtonIndex < 2 ? closingButtonIndex + 1 : 0)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleCancelClose()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (closingButtonIndex === 0) {
            handleCancelClose()
          } else if (closingButtonIndex === 1) {
            clearAuth()
          } else if (closingButtonIndex === 2) {
            handleCloseDrawer()
          }
        }
        return
      }
      if (showDeleteConfirm) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setDeleteButtonIndex(1)
          if (deleteCancelBtnRef.current) deleteCancelBtnRef.current.focus()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setDeleteButtonIndex(0)
          if (deleteConfirmBtnRef.current) deleteConfirmBtnRef.current.focus()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          handleDeleteConfirm()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          handleDeleteCancel()
        }
        return
      }
      if (e.key === 'F6') {
        e.preventDefault()
        if (pendingNotes.length > 0) {
          setShowPendingPopup(true)
          setPendingSelectedIndex(0)
        } else {
          setToast({ isOpen: true, message: 'Tidak ada nota pending', type: 'info' })
        }
      } else if (e.key === 'F7') {
        e.preventDefault()
        handleShowPrintPopup()
      } else if (e.key === 'F11') {
        e.preventDefault()
        handleOpenReceiptSettings()
      } else if (e.key === 'F10') {
        e.preventDefault()
        if (items.length > 0) {
          setShowPaymentForm(true)
          setPaymentAmount('')
        }
      } else if (e.key === 'Escape') {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items.length, showCashInForm, showCashOutForm, showReceiptSettingsPopup, cashInButtonIndex, cashOutButtonIndex, showDeleteConfirm, showClosingForm, closingButtonIndex, showPendingPopup, pendingNotes, pendingSelectedIndex, showPrintPopup, printNotes, printSelectedIndex, handleCashIn, handleCancelCashIn, handleCashOut, handleCancelCashOut, handleDeleteConfirm, handleDeleteCancel, handleCloseDrawer, handleCancelClose, handleRestorePending, handleShowPrintPopup, handlePrintSale, handleOpenReceiptSettings, clearAuth])

  const promos = [
    'Beli 2 Kopi Gratis 1',
    'Diskon 10% Khusus Member Baru',
    'Flash Sale Jam 3 Sore!',
    'Voucher Cashback Rp 25rb',
    'Belanja min. 200rb dapat kupon undian',
    'Weekend Special: Coffee Beans Buy 1 Get 1',
    'Extra Point for reusable cup users',
    'Free Cookies for purchase over 300k',
  ]

  const company = `${auth.companyName || ''}`
  const merk = 'PosXpress' 

  return (    
    <div className="pos-screen">
      {/* Top Header 
      <header className="pos-header">
        <div className="pos-header-left">
          <span className="desktop-dot" aria-hidden="true" />
          <strong>{title}</strong>
        </div>
        <div className="pos-header-right">
          <div className="pos-cashier">Cashier: <strong>{auth.username?.toUpperCase()}</strong></div>
          <div className="pos-status-badge"> Online</div>
        </div>
      </header>
      */}

      {showCashDrawerForm && (
        <div className="product-popup-overlay">
          <div className="cash-drawer-popup">
            <div className="cash-drawer-popup-header">
              <span className="material-icons">point_of_sale</span>
              <h3>Buka Cash Drawer</h3>
            </div>
            <div className="cash-drawer-popup-body">
              <div className="cash-drawer-warehouse">
                <span className="material-icons">inventory_2</span>
                <span>{mainWarehouse?.name || 'Loading...'}</span>
              </div>
              <div className="payment-form-group">
                <label>Opening Balance:</label>
                <input
                  ref={openingBalanceRef}
                  type="number"
                  className="payment-input"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleOpenCashDrawer()
                    } else if (e.key === 'Escape') {
                      handleSkipCashDrawer()
                    }
                  }}
                />
              </div>
              <div className="payment-form-group">
                <label>Catatan:</label>
                <input
                  type="text"
                  className="payment-input"
                  value={cashDrawerNotes}
                  onChange={(e) => setCashDrawerNotes(e.target.value)}
                  placeholder="Opsional"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleOpenCashDrawer()
                    } else if (e.key === 'Escape') {
                      handleSkipCashDrawer()
                    }
                  }}
                />
              </div>
            </div>
            <div className="cash-drawer-popup-footer">
              <button 
                className="payment-btn-cancel" 
                onClick={handleSkipCashDrawer}
                disabled={isOpeningDrawer}
              >
                Lewati
              </button>
              <button 
                className="payment-btn-confirm" 
                onClick={handleOpenCashDrawer}
                disabled={isOpeningDrawer}
              >
                {isOpeningDrawer ? 'Membuka...' : 'Buka Kasir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClosingForm && (
        <div className="product-popup-overlay">
          <div className="closing-drawer-popup">
            <div className="closing-drawer-popup-header">
              <span className="material-icons">point_of_sale</span>
              <h3>Summary Cash Drawer</h3>
            </div>
            <div className="closing-drawer-popup-body">
              <div className="closing-summary-grid">
                <div className="closing-summary-item">
                  <span className="closing-label">Opening Balance</span>
                  <span className="closing-value">{formatCurrency(cashDrawerSummary?.opening_balance || 0)}</span>
                </div>
                <div className="closing-summary-item">
                  <span className="closing-label">Expected Balance</span>
                  <span className="closing-value">{formatCurrency(cashDrawerSummary?.expected_balance || 0)}</span>
                </div>
                <div className="closing-summary-item">
                  <span className="closing-label">Sales Total</span>
                  <span className="closing-value">{formatCurrency(cashDrawerSummary?.sales_total || 0)}</span>
                </div>
                <div className="closing-summary-item">
                  <span className="closing-label">Cash In</span>
                  <span className="closing-value">{formatCurrency(cashDrawerSummary?.cash_in_total || 0)}</span>
                </div>
                <div className="closing-summary-item">
                  <span className="closing-label">Cash Out</span>
                  <span className="closing-value">{formatCurrency(cashDrawerSummary?.cash_out_total || 0)}</span>
                </div>
                <div className="closing-summary-item">
                  <span className="closing-label">Transaction</span>
                  <span className="closing-value">{cashDrawerSummary?.transaction_count || 0} transaksi</span>
                </div>
              </div>
              <div className="payment-form-group">
                <label>Closing Balance:</label>
                <input
                  ref={closingBalanceRef}
                  type="number"
                  className="payment-input"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCloseDrawer()
                    } else if (e.key === 'Escape') {
                      handleCancelClose()
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      setClosingButtonIndex(2)
                      if (logoutCloseBtnRef.current) logoutCloseBtnRef.current.focus()
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      setClosingButtonIndex(0)
                      if (closeBtnRef.current) closeBtnRef.current.focus()
                    }
                  }}
                />
              </div>
              {cashDrawerSummary && closingBalance && (
                <div className="closing-summary-item variance">
                  <span className="closing-label">Variance</span>
                  <span className={`closing-value ${parseFloat(closingBalance) - cashDrawerSummary.expected_balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(parseFloat(closingBalance) - cashDrawerSummary.expected_balance)}
                  </span>
                </div>
              )}
              <div className="payment-form-group">
                <label>Catatan:</label>
                <input
                  type="text"
                  className="payment-input"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="Opsional"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCloseDrawer()
                    } else if (e.key === 'Escape') {
                      handleCancelClose()
                    }
                  }}
                />
              </div>
            </div>
            <div className="closing-drawer-popup-footer">
              <button
                ref={cancelCloseBtnRef}
                className={`closing-btn ${closingButtonIndex === 0 ? 'is-focused' : ''}`}
                onClick={handleCancelClose}
                disabled={isClosingDrawer}
                onMouseEnter={() => setClosingButtonIndex(0)}
              >
                Cancel
              </button>
              <button
                ref={logoutCloseBtnRef}
                className={`closing-btn logout ${closingButtonIndex === 1 ? 'is-focused' : ''}`}
                onClick={() => clearAuth()}
                disabled={isClosingDrawer}
                onMouseEnter={() => setClosingButtonIndex(1)}
              >
                Logout
              </button>
              <button
                ref={closeBtnRef}
                className={`closing-btn confirm ${closingButtonIndex === 2 ? 'is-focused' : ''}`}
                onClick={handleCloseDrawer}
                disabled={isClosingDrawer}
                onMouseEnter={() => setClosingButtonIndex(2)}
              >
                {isClosingDrawer ? 'Menutup...' : 'Closing Drawer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCashInForm && (
        <div className="product-popup-overlay">
          <div className="cash-in-popup">
            <div className="cash-in-popup-header">
              <span className="material-icons">add_card</span>
              <h3>Cash In</h3>
            </div>
            <div className="cash-in-popup-body">
              <div className="payment-form-group">
                <label>Jumlah:</label>
                <input
                  ref={cashInAmountRef}
                  type="number"
                  className="payment-input"
                  value={cashInAmount}
                  onChange={(e) => setCashInAmount(e.target.value)}
                  placeholder="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCashIn()
                    } else if (e.key === 'Escape') {
                      handleCancelCashIn()
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      setCashInButtonIndex(1)
                      if (cashInCancelBtnRef.current) cashInCancelBtnRef.current.focus()
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      setCashInButtonIndex(0)
                      if (cashInConfirmBtnRef.current) cashInConfirmBtnRef.current.focus()
                    }
                  }}
                />
              </div>
              <div className="payment-form-group">
                <label>Keterangan:</label>
                <input
                  type="text"
                  className="payment-input"
                  value={cashInReason}
                  onChange={(e) => setCashInReason(e.target.value)}
                  placeholder="Opsional"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCashIn()
                    } else if (e.key === 'Escape') {
                      handleCancelCashIn()
                    }
                  }}
                />
              </div>
            </div>
            <div className="cash-in-popup-footer">
              <button
                ref={cashInCancelBtnRef}
                className={`cash-in-btn cancel ${cashInButtonIndex === 1 ? 'is-focused' : ''}`}
                onClick={handleCancelCashIn}
                disabled={isCashInSubmitting}
                onMouseEnter={() => setCashInButtonIndex(1)}
              >
                Batal
              </button>
              <button
                ref={cashInConfirmBtnRef}
                className={`cash-in-btn confirm ${cashInButtonIndex === 0 ? 'is-focused' : ''}`}
                onClick={handleCashIn}
                disabled={isCashInSubmitting}
                onMouseEnter={() => setCashInButtonIndex(0)}
              >
                {isCashInSubmitting ? 'Memproses...' : 'Cash In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCashOutForm && (
        <div className="product-popup-overlay">
          <div className="cash-out-popup">
            <div className="cash-out-popup-header">
              <span className="material-icons">remove_card</span>
              <h3>Cash Out</h3>
            </div>
            <div className="cash-out-popup-body">
              <div className="payment-form-group">
                <label>Jumlah:</label>
                <input
                  ref={cashOutAmountRef}
                  type="number"
                  className="payment-input"
                  value={cashOutAmount}
                  onChange={(e) => setCashOutAmount(e.target.value)}
                  placeholder="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCashOut()
                    } else if (e.key === 'Escape') {
                      handleCancelCashOut()
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      setCashOutButtonIndex(1)
                      if (cashOutCancelBtnRef.current) cashOutCancelBtnRef.current.focus()
                    } else if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      setCashOutButtonIndex(0)
                      if (cashOutConfirmBtnRef.current) cashOutConfirmBtnRef.current.focus()
                    }
                  }}
                />
              </div>
              <div className="payment-form-group">
                <label>Keterangan:</label>
                <input
                  type="text"
                  className="payment-input"
                  value={cashOutReason}
                  onChange={(e) => setCashOutReason(e.target.value)}
                  placeholder="Opsional"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCashOut()
                    } else if (e.key === 'Escape') {
                      handleCancelCashOut()
                    }
                  }}
                />
              </div>
            </div>
            <div className="cash-out-popup-footer">
              <button
                ref={cashOutCancelBtnRef}
                className={`cash-out-btn cancel ${cashOutButtonIndex === 1 ? 'is-focused' : ''}`}
                onClick={handleCancelCashOut}
                disabled={isCashOutSubmitting}
                onMouseEnter={() => setCashOutButtonIndex(1)}
              >
                Batal
              </button>
              <button
                ref={cashOutConfirmBtnRef}
                className={`cash-out-btn confirm ${cashOutButtonIndex === 0 ? 'is-focused' : ''}`}
                onClick={handleCashOut}
                disabled={isCashOutSubmitting}
                onMouseEnter={() => setCashOutButtonIndex(0)}
              >
                {isCashOutSubmitting ? 'Memproses...' : 'Cash Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingPopup && (
        <div className="product-popup-overlay" onClick={() => setShowPendingPopup(false)}>
          <div className="pending-popup" onClick={(e) => e.stopPropagation()}>
            <div className="pending-popup-header">
              <span className="material-icons">pending_actions</span>
              <h3>Daftar Nota Pending</h3>
              <span className="pending-count">{pendingNotes.length}</span>
            </div>
            <div className="pending-popup-body">
              {pendingNotes.length === 0 ? (
                <div className="pending-empty">Tidak ada nota pending</div>
              ) : (
                <div className="pending-list">
                  {pendingNotes.map((note, idx) => (
                    <div
                      key={note.id}
                      className={`pending-item ${pendingSelectedIndex === idx ? 'is-selected' : ''}`}
                      onClick={() => handleRestorePending(note)}
                      onMouseEnter={() => setPendingSelectedIndex(idx)}
                    >
                      <div className="pending-item-info">
                        <span className="pending-item-date">
                          {new Date(note.createdAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="pending-item-cashier">{note.cashier}</span>
                      </div>
                      <div className="pending-item-details">
                        <span className="pending-item-items">{note.items.length} item</span>
                        <span className="pending-item-total">{formatCurrency(note.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pending-popup-footer">
              <span className="pending-hint">
                <span className="material-icons-round">keyboard</span>
                Arrow Up/Down: Pilih | Enter: Restore | Escape: Tutup
              </span>
            </div>
          </div>
        </div>
      )}

      {showPrintPopup && (
        <div className="product-popup-overlay" onClick={() => setShowPrintPopup(false)}>
          <div className="print-popup" onClick={(e) => e.stopPropagation()}>
            <div className="print-popup-header">
              <span className="material-icons">print</span>
              <h3>Daftar Nota Penjualan</h3>
              <span className="print-count">{printNotes.length}</span>
            </div>
            <div className="print-popup-body">
              {isLoadingPrintNotes ? (
                <div className="print-empty">Memuat nota...</div>
              ) : printNotes.length === 0 ? (
                <div className="print-empty">Tidak ada nota untuk dicetak</div>
              ) : (
                <div className="print-list">
                  {printNotes.map((sale, idx) => (
                    <div
                      key={sale.id}
                      className={`print-item ${printSelectedIndex === idx ? 'is-selected' : ''}`}
                      onClick={() => handlePrintSale(sale.id)}
                      onMouseEnter={() => setPrintSelectedIndex(idx)}
                    >
                      <div className="print-item-info">
                        <span className="print-item-number">{sale.sale_number || sale.invoice_number || '-'}</span>
                        <span className="print-item-date">{formatDateTime(sale.sale_date || sale.created_at)}</span>
                      </div>
                      <div className="print-item-details">
                        <span className="print-item-cashier">{sale.cashier_name || '-'}</span>
                        <span className="print-item-total">{formatCurrency(sale.total_amount || sale.total || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="print-popup-footer">
              <span className="print-hint">
                <span className="material-icons-round">keyboard</span>
                Arrow Up/Down: Pilih | Enter: Cetak | Escape: Tutup
              </span>
            </div>
          </div>
        </div>
      )}

      {showReceiptSettingsPopup && (
        <div className="product-popup-overlay" onClick={() => setShowReceiptSettingsPopup(false)}>
          <div className="receipt-setting-popup" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-setting-header">
              <span className="material-icons">settings</span>
              <h3>Setting Nota Jual</h3>
              <button className="product-popup-close" onClick={() => setShowReceiptSettingsPopup(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="receipt-setting-body">

            
              <div className="receipt-setting-form">
                <div className="receipt-setting-section">
                  <h4>Tata Letak</h4>
                  <div className="receipt-template-mode">
                    <label className="receipt-radio-option">
                      <input
                        type="radio"
                        name="template-mode"
                        checked={receiptSettingsDraft.template_mode === 'default'}
                        onChange={() => setReceiptSettingsDraft((prev) => ({ ...prev, template_mode: 'default' }))}
                      />
                      <span>Default Template</span>
                    </label>
                    <label className="receipt-radio-option">
                      <input
                        type="radio"
                        name="template-mode"
                        checked={receiptSettingsDraft.template_mode === 'custom'}
                        onChange={() => {
                          setReceiptSettingsDraft((prev) => ({
                            ...prev,
                            template_mode: 'custom',
                            custom_template_html: prev.custom_template_html || DEFAULT_CUSTOM_TEMPLATE_HTML,
                            custom_template_css: prev.custom_template_css || DEFAULT_CUSTOM_TEMPLATE_CSS,
                          }))
                        }}
                      />
                      <span>Custom Template</span>
                    </label>
                  </div>

                  {receiptSettingsDraft.template_mode === 'default' ? (
                    <div className="receipt-layout-grid">
                      {RECEIPT_LAYOUT_OPTIONS.map((layout) => (
                        <button
                          key={layout.id}
                          type="button"
                          className={`receipt-layout-card ${receiptSettingsDraft.layout_type === layout.id ? 'is-selected' : ''}`}
                          onClick={() => setReceiptSettingsDraft((prev) => ({ ...prev, layout_type: layout.id }))}
                        >
                          <strong>{layout.label}</strong>
                          <span>{layout.description}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="receipt-setting-template-panel in-form">
                      <div className="receipt-template-section">
                        <div className="receipt-template-section-header">
                          <span>HTML Template</span>
                          <div className="receipt-template-actions">
                            <button
                              type="button"
                              className="receipt-template-btn"
                              onClick={() => {
                                const currentHtml = showTemplateCode
                                  ? templateCodeHtml
                                  : (wysiwygEditorRef.current?.innerHTML || receiptSettingsDraft.custom_template_html || '')
                                setReceiptSettingsDraft((prev) => ({
                                  ...prev,
                                  custom_template_html: currentHtml,
                                }))
                                setTemplateCodeHtml(currentHtml)
                              }}
                            >
                              Apply
                            </button>
                            <button
                              type="button"
                              className="receipt-template-btn"
                              onClick={() => {
                                const currentHtml = showTemplateCode
                                  ? templateCodeHtml
                                  : (wysiwygEditorRef.current?.innerHTML || receiptSettingsDraft.custom_template_html || '')
                                setTemplateCodeHtml(currentHtml)
                                if (showTemplateCode && wysiwygEditorRef.current) {
                                  wysiwygEditorRef.current.innerHTML = currentHtml
                                }
                                setShowTemplateCode((prev) => !prev)
                              }}
                            >
                              {showTemplateCode ? 'Hide Code' : 'Code'}
                            </button>
                            <button
                              type="button"
                              className="receipt-template-btn"
                              onClick={() => {
                                if (wysiwygEditorRef.current) {
                                  wysiwygEditorRef.current.innerHTML = DEFAULT_CUSTOM_TEMPLATE_HTML
                                }
                                setReceiptSettingsDraft((prev) => ({
                                  ...prev,
                                  custom_template_html: DEFAULT_CUSTOM_TEMPLATE_HTML,
                                }))
                                setTemplateCodeHtml(DEFAULT_CUSTOM_TEMPLATE_HTML)
                                if (codeEditorRef.current) {
                                  codeEditorRef.current.focus()
                                }
                              }}
                            >
                              Reset
                            </button>
                          </div>
                        </div>
                        {!showTemplateCode ? (
                          <>
                            <div className="receipt-wysiwyg-toolbar">
                              <button type="button" className="receipt-wysiwyg-btn" title="Bold" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('bold', false, null) }}>
                                <strong>B</strong>
                              </button>
                              <button type="button" className="receipt-wysiwyg-btn" title="Italic" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('italic', false, null) }}>
                                <em>I</em>
                              </button>
                              <button type="button" className="receipt-wysiwyg-btn" title="Underline" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('underline', false, null) }}>
                                <u>U</u>
                              </button>
                              <span className="receipt-wysiwyg-sep" />
                              <button type="button" className="receipt-wysiwyg-btn" title="Font Size Small" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('fontSize', false, '2') }} style={{ fontSize: '10px' }}>A</button>
                              <button type="button" className="receipt-wysiwyg-btn" title="Font Size Normal" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('fontSize', false, '3') }} style={{ fontSize: '13px' }}>A</button>
                              <span className="receipt-wysiwyg-sep" />
                              <button type="button" className="receipt-wysiwyg-btn" title="Align Left" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('justifyLeft', false, null) }}>
                                <span style={{ fontFamily: 'sans-serif' }}>&#8676;</span>
                              </button>
                              <button type="button" className="receipt-wysiwyg-btn" title="Align Center" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) wysiwygEditorRef.current.focus(); document.execCommand('justifyCenter', false, null) }}>
                                <span style={{ fontFamily: 'sans-serif' }}>&#8596;</span>
                              </button>
                              <span className="receipt-wysiwyg-sep" />
                              <button type="button" className="receipt-wysiwyg-btn" title="Insert Line Break" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) { wysiwygEditorRef.current.focus(); document.execCommand('insertHTML', false, '<br>') } }}>
                                <span style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>&#8629;</span>
                              </button>
                              <button type="button" className="receipt-wysiwyg-btn" title="Insert Line" onMouseDown={(e) => { e.preventDefault(); if (wysiwygEditorRef.current) { wysiwygEditorRef.current.focus(); document.execCommand('insertHTML', false, '<div class=&quot;tpl-garis&quot;></div>') } }}>
                                <span style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>&#9135;</span>
                              </button>
                            </div>
                            <div
                              ref={wysiwygEditorRef}
                              className="receipt-wysiwyg-editor"
                              contentEditable
                              suppressContentEditableWarning
                            />
                          </>
                        ) : (
                          <div className="receipt-setting-code-panel">
                            <textarea
                              ref={codeEditorRef}
                              className="receipt-setting-code-editor"
                              value={templateCodeHtml}
                              onChange={(e) => setTemplateCodeHtml(e.target.value)}
                              spellCheck={false}
                            />
                          </div>
                        )}
                      </div>

                      <div className="receipt-template-tokens">
                        <div className="receipt-template-tokens-title">Data - klik untuk menyisipkan:</div>
                        <div className="receipt-template-tokens-list">
                          {RECEIPT_TEMPLATE_TOKENS.map((token) => (
                            <button
                              key={token}
                              type="button"
                              className="receipt-template-token"
                              onClick={() => {
                                if (showTemplateCode && codeEditorRef.current) {
                                  const textarea = codeEditorRef.current
                                  const start = textarea.selectionStart ?? templateCodeHtml.length
                                  const end = textarea.selectionEnd ?? templateCodeHtml.length
                                  const next = `${templateCodeHtml.slice(0, start)}${token}${templateCodeHtml.slice(end)}`
                                  setTemplateCodeHtml(next)
                                  setTimeout(() => {
                                    textarea.focus()
                                    const cursorPos = start + token.length
                                    textarea.setSelectionRange(cursorPos, cursorPos)
                                  }, 0)
                                  return
                                }
                                if (wysiwygEditorRef.current) {
                                  wysiwygEditorRef.current.focus()
                                  const sel = window.getSelection()
                                  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                                    sel.deleteFromDocument()
                                  }
                                  document.execCommand('insertHTML', false, token)
                                  setTemplateCodeHtml(wysiwygEditorRef.current.innerHTML)
                                }
                              }}
                            >
                              {token}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>



              
                <div className="receipt-setting-row-two-col">
                  <div className="receipt-setting-section">
                    <h4>Ukuran Kertas</h4>
                    <label className="receipt-radio-option">
                      <input
                        type="radio"
                        name="paper-size"
                        checked={receiptSettingsDraft.paper_size === '58mm'}
                        onChange={() => setReceiptSettingsDraft((prev) => ({ ...prev, paper_size: '58mm' }))}
                      />
                      <span>58mm</span>
                    </label>
                    <label className="receipt-radio-option">
                      <input
                        type="radio"
                        name="paper-size"
                        checked={receiptSettingsDraft.paper_size === '80mm'}
                        onChange={() => setReceiptSettingsDraft((prev) => ({ ...prev, paper_size: '80mm' }))}
                      />
                      <span>80mm</span>
                    </label>
                  </div>

                  <div className="receipt-setting-section">
                    <h4>Jenis Printer</h4>
                    <label className="receipt-radio-option">
                      <input
                        type="radio"
                        name="printer-type"
                        checked={receiptSettingsDraft.printer_type === 'thermal'}
                        onChange={() => setReceiptSettingsDraft((prev) => ({ ...prev, printer_type: 'thermal' }))}
                      />
                      <span>Thermal</span>
                    </label>
                    <label className="receipt-radio-option">
                      <input
                        type="radio"
                        name="printer-type"
                        checked={receiptSettingsDraft.printer_type === 'dot_matrix'}
                        onChange={() => setReceiptSettingsDraft((prev) => ({ ...prev, printer_type: 'dot_matrix' }))}
                      />
                      <span>Dot Matrix</span>
                    </label>
                  </div>
                </div>

               
                <div className="receipt-setting-section">
                  <h4>Tampilan</h4>
                  <label className="receipt-checkbox-option">
                    <input
                      type="checkbox"
                      checked={receiptSettingsDraft.show_logo}
                      onChange={(e) => setReceiptSettingsDraft((prev) => ({ ...prev, show_logo: e.target.checked }))}
                    />
                    <span>Tampilkan logo</span>
                  </label>
                  <label className="receipt-checkbox-option">
                    <input
                      type="checkbox"
                      checked={receiptSettingsDraft.show_footer}
                      onChange={(e) => setReceiptSettingsDraft((prev) => ({ ...prev, show_footer: e.target.checked }))}
                    />
                    <span>Tampilkan footer</span>
                  </label>
                  <label className="receipt-checkbox-option">
                    <input
                      type="checkbox"
                      checked={receiptSettingsDraft.auto_print_after_payment}
                      onChange={(e) => setReceiptSettingsDraft((prev) => ({ ...prev, auto_print_after_payment: e.target.checked }))}
                    />
                    <span>Auto print setelah pembayaran</span>
                  </label>
                  <label className="receipt-checkbox-option">
                    <input
                      type="checkbox"
                      checked={receiptSettingsDraft.calibration_mode}
                      onChange={(e) => setReceiptSettingsDraft((prev) => ({ ...prev, calibration_mode: e.target.checked }))}
                    />
                    <span>Calibration line mode (50mm)</span>
                  </label>
                  <div className="receipt-footer-text-wrap">
                    <label htmlFor="receipt-footer-text">Text footer</label>
                    <textarea
                      id="receipt-footer-text"
                      className="receipt-footer-text-input"
                      value={receiptSettingsDraft.footer_text}
                      onChange={(e) => setReceiptSettingsDraft((prev) => ({ ...prev, footer_text: e.target.value }))}
                      rows={3}
                      placeholder="Contoh: Terima kasih sudah berbelanja"
                    />
                  </div>
                </div>
              </div>

              <div className="receipt-setting-preview-wrap">
                <div className="receipt-setting-preview-panel">
                  <ReceiptPreview
                    sale={previewNote}
                    settings={{
                      ...receiptSettingsDraft,
                      company_address: receiptSettingsDraft.company_address?.trim() || companyProfile.address || '',
                      company_phone: receiptSettingsDraft.company_phone?.trim() || companyProfile.phone || '',
                    }}
                    formatCurrency={formatCurrency}
                    formatDateTime={formatDateTime}
                  />
                </div>
              </div>
            </div>
            <div className="receipt-setting-footer">
              <button className="payment-btn-cancel" onClick={handleResetReceiptSettings}>Reset Default</button>
              <button className="payment-btn-confirm" onClick={handleSaveReceiptSettings}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pos-content">
        {/* Left: Receipt Paper (40%) */}
        <main className="pos-main-left">
          <div className="receipt-paper">
            <div className="receipt-header">
              <h2 className="receipt-title">NOTA PENJUALAN</h2>
              <div>
              <div className="receipt-subtitle">{company}
              </div>
             
              <div className="receipt-meta">              
                <span>INV/20231024/001</span> <strong> {(auth.username || '').toUpperCase()}</strong>
                <span>{currentTime.toLocaleDateString('en-GB')} {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              </div>
            </div>

            <div className="receipt-items-wrapper">
              <div className="receipt-items">
                {items.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`receipt-item ${selectedIndex === idx ? 'is-selected' : ''}`}
                    onClick={() => handleItemClick(item, idx)}
                  >
                    <div className="receipt-item-no">{idx + 1}</div>
                    <div className="receipt-item-info">
                      <div className="receipt-item-name">{item.name}</div>
                      <div className="receipt-item-price">{item.qty} x {formatCurrency(item.price)}</div>
                    </div>
                    <div className="receipt-item-total">{formatCurrency(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="receipt-summary">
              <div className="receipt-total-row">
                <span>TOTAL ({items.length} item)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="receipt-tax-row">
                <span>Tax (PPN 11%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <div className="pos-search-container">
                <span className="material-icons">search</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Cari barang atau scan barcode..."
                  className="pos-search-input"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
                <span className="material-icons barcode-icon">qr_code_scanner</span>
              </div>
              <button className="pos-btn-bayar" onClick={() => {
                setShowPaymentForm(true)
                setPaymentAmount('')
              }}>
                <span className="material-icons">payments</span>
                <span className="pos-btn-bayar-text">BAYAR</span>
                <span className="shortcut-badge">F10</span>
              </button>
            </div>

            {showProductPopup && (
              <div 
                className="product-popup-overlay" 
                onClick={(e) => { 
                  if (e.target === e.currentTarget) {
                    setShowProductPopup(false); 
                    setSearch('')
                  }
                }}
              >
                <div className="product-popup" onClick={(e) => e.stopPropagation()}>
                  <div className="product-popup-header">
                    <h3>Daftar Produk</h3>
                    <button className="product-popup-close" onClick={() => { setShowProductPopup(false); setSearch('') }}>
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  <div className="product-popup-table-wrapper">
                    <table className="product-popup-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Nama</th>
                          <th>Satuan</th>
                          <th>Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingProducts ? (
                          <tr>
                            <td colSpan="4" className="product-popup-empty">Memuat produk...</td>
                          </tr>
                        ) : productResults.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="product-popup-empty">Produk tidak ditemukan</td>
                          </tr>
                        ) : (
                          productResults.map((product, idx) => (
                            <tr
                              key={product.id}
                              className={idx === popupSelectedIndex ? 'is-selected' : ''}
                              onClick={() => handleSelectProduct(product)}
                            >
                              <td>{idx + 1}</td>
                              <td>{product.name}</td>
                              <td>{product.unit}</td>
                              <td className="text-right">{formatCurrency(product.price)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="product-popup-footer">
                    <span>Pilih dengan Enter / Klik</span>
                    <span>Esc untuk tutup</span>
                  </div>
                </div>
              </div>
            )}

            {showActionPopup && (
              <div 
                className="product-popup-overlay" 
                onClick={(e) => { 
                  if (e.target === e.currentTarget) {
                    setShowActionPopup(false); 
                  }
                }}
              >
                <div className="action-popup" onClick={(e) => e.stopPropagation()}>
                  <div className="action-popup-header">
                    <h3>Pilih Aksi</h3>
                  </div>
                  <div className="action-popup-list">
                    <div 
                      className={`action-popup-item ${actionPopupIndex === 0 ? 'is-selected' : ''}`}
                      onClick={() => handleActionSelect(0)}
                    >
                      <span className="material-icons">payments</span>
                      <span>Bayar</span>
                    </div>
                    <div 
                      className={`action-popup-item ${actionPopupIndex === 1 ? 'is-selected' : ''}`}
                      onClick={() => handleActionSelect(1)}
                    >
                      <span className="material-icons">pause_circle</span>
                      <span>Pending</span>
                    </div>
                    <div 
                      className={`action-popup-item ${actionPopupIndex === 2 ? 'is-selected' : ''}`}
                      onClick={() => handleActionSelect(2)}
                    >
                      <span className="material-icons">cancel</span>
                      <span>Batal</span>
                    </div>
                  </div>
                  <div className="product-popup-footer">
                    <span>Pilih dengan Enter / Klik</span>
                    <span>Esc untuk tutup</span>
                  </div>
                </div>
              </div>
            )}

            {showPaymentForm && (
              <div className="product-popup-overlay">
                <div className="payment-popup">
                  <div className="payment-popup-header">
                    <h3>Pembayaran</h3>
                    <button className="product-popup-close" onClick={() => setShowPaymentForm(false)}>
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                  <div className="payment-popup-body">
                    <div className="payment-row">
                      <span>Total Bayar:</span>
                      <span className="payment-total">{formatCurrency(total)}</span>
                    </div>
                    <div className="payment-form-group">
                      <label>Metode Pembayaran:</label>
                      <div className="payment-method-buttons">
                        <button 
                          ref={paymentMethodCashRef}
                          type="button"
                          className={`payment-method-btn ${paymentMethod === 'CASH' ? 'is-selected' : ''}`}
                          onClick={() => { setPaymentMethod('CASH'); setPaymentMethodIndex(0) }}
                          onFocus={() => { setPaymentMethod('CASH'); setPaymentMethodIndex(0) }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') navigatePaymentMethod('left')
                            else if (e.key === 'ArrowRight') navigatePaymentMethod('right')
                            else if (e.key === 'Enter') {
                              setPaymentMethod('CASH')
                              setTimeout(() => paymentInputRef.current?.focus(), 50)
                            }
                            else if (e.key === 'Escape') setShowPaymentForm(false)
                          }}
                        >
                          <span className="material-icons">payments</span>
                          <span>CASH</span>
                        </button>
                        <button 
                          ref={paymentMethodQrisRef}
                          type="button"
                          className={`payment-method-btn ${paymentMethod === 'QRIS' ? 'is-selected' : ''}`}
                          onClick={() => { setPaymentMethod('QRIS'); setPaymentMethodIndex(1) }}
                          onFocus={() => { setPaymentMethod('QRIS'); setPaymentMethodIndex(1) }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') navigatePaymentMethod('left')
                            else if (e.key === 'ArrowRight') navigatePaymentMethod('right')
                            else if (e.key === 'Escape') setShowPaymentForm(false)
                          }}
                        >
                          <span className="material-icons">qr_code</span>
                          <span>QRIS</span>
                        </button>
                        <button 
                          ref={paymentMethodTransferRef}
                          type="button"
                          className={`payment-method-btn ${paymentMethod === 'TRANSFER' ? 'is-selected' : ''}`}
                          onClick={() => { setPaymentMethod('TRANSFER'); setPaymentMethodIndex(2) }}
                          onFocus={() => { setPaymentMethod('TRANSFER'); setPaymentMethodIndex(2) }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') navigatePaymentMethod('left')
                            else if (e.key === 'ArrowRight') navigatePaymentMethod('right')
                            else if (e.key === 'Enter') {
                              setPaymentMethod('TRANSFER')
                              setTimeout(() => transferInputRef.current?.focus(), 50)
                            }
                            else if (e.key === 'Escape') setShowPaymentForm(false)
                          }}
                        >
                          <span className="material-icons">account_balance</span>
                          <span>TRANSFER</span>
                        </button>
                      </div>
                    </div>
                    {paymentMethod === 'CASH' && (
                      <div className="payment-form-group">
                        <label>Jumlah Bayar:</label>
                        <input
                          ref={paymentInputRef}
                          type="number"
                          className="payment-input"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Masukkan jumlah"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handlePayment()
                            } else if (e.key === 'Escape') {
                              setShowPaymentForm(false)
                            } else if (e.key === 'ArrowLeft') {
                              navigatePaymentMethod('left')
                            } else if (e.key === 'ArrowRight') {
                              navigatePaymentMethod('right')
                            }
                          }}
                        />
                      </div>
                    )}
                    {paymentMethod === 'CASH' && paymentAmount && parseFloat(paymentAmount) >= total && (
                      <div className="payment-row payment-change">
                        <span>Kembalian:</span>
                        <span>{formatCurrency(parseFloat(paymentAmount) - total)}</span>
                      </div>
                    )}
                    {paymentMethod === 'QRIS' && (
                      <div className="payment-form-group">
                        <label>Scan QR Code:</label>
                        <div className="qris-display">
                          <div className="qris-placeholder">
                            <span className="material-icons">qr_code_2</span>
                            <span className="qris-amount">{formatCurrency(total)}</span>
                          </div>
                          <p className="qris-info">Tunjukkan kode QRIS ini kepada pelanggan</p>
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'TRANSFER' && (
                      <div className="payment-form-group">
                        <label>No Rekening Tujuan:</label>
                        <input
                          ref={transferInputRef}
                          type="text"
                          className="payment-input"
                          value={transferAccount}
                          onChange={(e) => setTransferAccount(e.target.value)}
                          placeholder="Masukkan nomor rekening"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handlePayment()
                            } else if (e.key === 'Escape') {
                              setShowPaymentForm(false)
                            } else if (e.key === 'ArrowLeft') {
                              navigatePaymentMethod('left')
                            } else if (e.key === 'ArrowRight') {
                              navigatePaymentMethod('right')
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="payment-popup-footer">
                    <button className="payment-btn-cancel" onClick={() => setShowPaymentForm(false)}>
                      Batal
                    </button>
                    <button className="payment-btn-confirm" onClick={handlePayment}>
                      Konfirmasi Bayar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="product-popup-overlay">
                <div className="delete-confirm-popup">
                  <div className="delete-confirm-header">
                    <span className="material-icons">warning</span>
                    <h3>Konfirmasi Hapus</h3>
                  </div>
                  <div className="delete-confirm-body">
                    <p>Hapus item ini dari nota?</p>
                    <p className="delete-confirm-item">{itemToDelete?.item?.name}</p>
                  </div>
                  <div className="delete-confirm-footer">
                    <button 
                      ref={deleteCancelBtnRef}
                      className={`delete-btn-cancel ${deleteButtonIndex === 1 ? 'is-focused' : ''}`} 
                      onClick={handleDeleteCancel}
                      onMouseEnter={() => setDeleteButtonIndex(1)}
                    >
                      Batal
                    </button>
                    <button 
                      ref={deleteConfirmBtnRef}
                      className={`delete-btn-confirm ${deleteButtonIndex === 0 ? 'is-focused' : ''}`} 
                      onClick={handleDeleteConfirm}
                      onMouseEnter={() => setDeleteButtonIndex(0)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right: Monitor + Promo (60%) */}
        <section className="pos-main-right">
          {/* Customer Display Monitor */}
          <div className="monitor-frame">
            <div className="monitor-screen">
              <div className="monitor-top">
                <div className="monitor-status">
          <strong>{merk}</strong>  <div className="pos-status-badge"> Online</div>
      
                </div>
  <div className="pos-header-right">
          <div className="pos-cashier"></div>
           <div className="monitor-time">{currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              </div>
        </div>
                
               
              <div className="monitor-item">
                <div className="monitor-item-name">{displayItem?.name || 'No Item'}</div>
                {displayItem && (
                  <div className="monitor-item-price-row">
                    <span className="monitor-item-qty-price">{displayItem.qty} x {formatCurrency(displayItem.price)}</span>
                    <span className="monitor-item-total">{formatCurrency(displayItem.price * displayItem.qty)}</span>
                  </div>
                )}
              </div>
              <div className="monitor-bottom">
                  <div className="monitor-count"> <div className="monitor-total"> Total</div>    {/*  ITEMS: {String(items.length).padStart(2, '0')}  */}</div>  
                <div className="monitor-amount">
               {/*    <div className="monitor-amount-label">AMOUNT DUE</div> */}
                  <div className="monitor-amount-value">{formatCurrency(total)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Promo Sticky Note */}
          <div className="sticky-note">
            <div className="push-pin"></div>
            <div className="sticky-note-content">
              <span className="promo-title">PROMO HARI INI</span>
              <ul className="promo-list">
                {promos.map((promo, idx) => (
                  <li key={idx}>{promo}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Right Sidebar (Action Keys) */}
        <aside className="pos-sidebar">
          <button className="action-key action-key-amber" onClick={() => {
            if (pendingNotes.length > 0) {
              setShowPendingPopup(true)
              setPendingSelectedIndex(0)
            } else {
              setToast({ isOpen: true, message: 'Tidak ada nota pending', type: 'info' })
            }
          }}>
            <span className="material-icons">pause_circle</span>
            <span>Pending</span>
            <span className="shortcut-badge">F6</span>
          </button>
          <button className="action-key action-key-slate" onClick={handleShowPrintPopup} disabled={isLoadingPrintNotes || isPrinting}>
            <span className="material-icons">print</span>
            <span>Cetak</span>
            <span className="shortcut-badge">F7</span>
          </button>
          <button className="action-key action-key-emerald" onClick={handleShowCashInForm}>
            <span className="material-icons">account_balance_wallet</span>
            <span>Cash In</span>
            <span className="shortcut-badge">F8</span>
          </button>
          <button className="action-key action-key-rose" onClick={handleShowCashOutForm}>
            <span className="material-icons">account_balance_wallet</span>
            <span>Cash Out</span>
            <span className="shortcut-badge">F9</span>
          </button>
          <button className="action-key action-key-gray" onClick={handleOpenReceiptSettings}>
            <span className="material-icons">settings</span>
            <span>Setting</span>
            <span className="shortcut-badge">F11</span>
          </button>
          <button className="action-key action-key-indigo">
            <span className="material-icons">help_outline</span>
            <span>Help</span>
            <span className="shortcut-badge">F12</span>
          </button>
          <button className="action-key action-key-dark" onClick={handleLogout}>
            <span className="material-icons power-icon">power_settings_new</span>
            <span>Close</span>
          </button>
        </aside>
      </div>
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        duration={2000}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
