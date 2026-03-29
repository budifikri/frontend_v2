import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../shared/auth'
import { listProducts } from '../../features/master/product/product.api'
import { listWarehouses } from '../../features/master/warehouse/warehouse.api'
import { openCashDrawer, getCurrentCashDrawer, getCashDrawerSummary, closeCashDrawer, cashInDrawer, cashOutDrawer } from '../../features/transaksi/cash-drawer/cashDrawer.api'
import { createSale } from '../../features/transaksi/sales/sales.api'
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = subtotal * 0.11
  const total = subtotal + tax
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null
  const displayItem = selectedItem || items[items.length - 1]

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
    if (e.key === 'F8') {
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
      if (showPendingPopup && pendingNotes.length > 0) {
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
      let message = `Pembayaran berhasil!\nMetode: ${paymentMethod}\nTotal: ${formatCurrency(total)}`
      if (paymentMethod === 'CASH') {
        message += `\nBayar: ${formatCurrency(payment)}\nKembalian: ${formatCurrency(change)}`
      } else if (paymentMethod === 'TRANSFER') {
        message += `\nNo Rekening: ${transferAccount}`
      }
      if (result.data?.invoice_number) {
        message += `\nInvoice: ${result.data.invoice_number}`
      }
      alert(message)

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
  }, [items.length, showCashInForm, showCashOutForm, cashInButtonIndex, cashOutButtonIndex, showDeleteConfirm, showClosingForm, closingButtonIndex, showPendingPopup, pendingNotes, pendingSelectedIndex, handleCashIn, handleCancelCashIn, handleCashOut, handleCancelCashOut, handleDeleteConfirm, handleDeleteCancel, handleCloseDrawer, handleCancelClose, handleRestorePending, clearAuth])

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
          <button className="action-key action-key-slate">
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
          <button className="action-key action-key-gray">
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
