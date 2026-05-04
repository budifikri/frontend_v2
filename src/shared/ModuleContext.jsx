import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from './auth'
import { getMyModules } from '../features/setting/module/module.api'

const ModuleContext = createContext(null)

function getDefaultModulesByBusinessType(businessType) {
  if (businessType === 'retail') return ['retail_basic']
  if (businessType === 'clinic') return ['clinic_core']
  return []
}

export function ModuleProvider({ children }) {
  const { auth } = useAuth()
  const [companyConfig, setCompanyConfig] = useState({ businessType: auth.businessType ?? null, modules: getDefaultModulesByBusinessType(auth.businessType) })
  const [loading, setLoading] = useState(false)

  const refreshModules = useCallback(async () => {
    if (!auth.token) {
      setCompanyConfig({ businessType: auth.businessType ?? null, modules: getDefaultModulesByBusinessType(auth.businessType) })
      return
    }

    setLoading(true)
    try {
      const result = await getMyModules(auth.token)
      const businessType = result.business_type ?? auth.businessType ?? null
      const modules = Array.isArray(result.modules) && result.modules.length > 0
        ? result.modules
        : getDefaultModulesByBusinessType(businessType)

      setCompanyConfig({
        businessType,
        modules,
      })
    } catch {
      setCompanyConfig({ businessType: auth.businessType ?? null, modules: getDefaultModulesByBusinessType(auth.businessType) })
    } finally {
      setLoading(false)
    }
  }, [auth.businessType, auth.token])

  useEffect(() => {
    refreshModules()
  }, [refreshModules])

  const hasModule = useCallback((code) => companyConfig.modules.includes(code), [companyConfig.modules])

  const value = useMemo(() => ({ companyConfig, hasModule, loading, refreshModules }), [companyConfig, hasModule, loading, refreshModules])
  return <ModuleContext.Provider value={value}>{children}</ModuleContext.Provider>
}

export { ModuleContext }
