/**
 * Freighter Wallet Integration Hook
 * Manages wallet connection and transaction signing
 */

import { useState, useEffect, useCallback } from 'react'
import freighter from '@stellar/freighter-api'

interface WalletState {
  isInstalled: boolean
  isConnected: boolean
  publicKey: string | null
  error: string | null
  connecting: boolean
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    isInstalled: false,
    isConnected: false,
    publicKey: null,
    error: null,
    connecting: false,
  })

  // Check if Freighter is installed
  useEffect(() => {
    const checkInstalled = async () => {
      const installedResult = await freighter.isConnected()
      const installed = !('error' in installedResult) && installedResult.isConnected
      setWallet(prev => ({ ...prev, isInstalled: installed }))

      if (installed) {
        // Check if already connected
        const allowedResult = await freighter.isAllowed()
        const allowed = !('error' in allowedResult) && allowedResult.isAllowed
        if (allowed) {
          try {
            const keyResult = await freighter.getPublicKey()
            if (!('error' in keyResult)) {
              setWallet(prev => ({
                ...prev,
                isConnected: true,
                publicKey: keyResult.publicKey,
              }))
            }
          } catch (error) {
            console.error('Failed to get public key:', error)
          }
        }
      }
    }

    checkInstalled()
  }, [])

  // Connect wallet
  const connect = useCallback(async () => {
    if (!wallet.isInstalled) {
      setWallet(prev => ({
        ...prev,
        error: 'Freighter wallet not installed. Please install it from freighter.app',
      }))
      return false
    }

    setWallet(prev => ({ ...prev, connecting: true, error: null }))

    try {
      const allowedResult = await freighter.setAllowed()
      if ('error' in allowedResult) {
        throw new Error(allowedResult.error)
      }

      const keyResult = await freighter.getPublicKey()
      if ('error' in keyResult) {
        throw new Error(keyResult.error)
      }

      setWallet(prev => ({
        ...prev,
        isConnected: true,
        publicKey: keyResult.publicKey,
        connecting: false,
        error: null,
      }))

      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect wallet'
      setWallet(prev => ({
        ...prev,
        isConnected: false,
        publicKey: null,
        connecting: false,
        error: errorMsg,
      }))
      return false
    }
  }, [wallet.isInstalled])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet(prev => ({
      ...prev,
      isConnected: false,
      publicKey: null,
      error: null,
    }))
  }, [])

  // Sign a transaction
  const sign = useCallback(
    async (xdr: string): Promise<string> => {
      if (!wallet.isConnected || !wallet.publicKey) {
        throw new Error('Wallet not connected')
      }

      try {
        const signResult = await freighter.signTransaction(xdr, {
          networkPassphrase: 'Test SDF Network ; September 2015',
        })

        if ('error' in signResult) {
          throw new Error(signResult.error)
        }

        return signResult.signedTxXdr
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to sign transaction'
        throw new Error(errorMsg)
      }
    },
    [wallet.isConnected, wallet.publicKey]
  )

  // Clear error
  const clearError = useCallback(() => {
    setWallet(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...wallet,
    connect,
    disconnect,
    sign,
    clearError,
  }
}

/**
 * Format Stellar address for display
 */
export function formatAddress(address: string | null): string {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

/**
 * Check if Freighter extension is installed
 */
export async function isFreighterInstalled(): Promise<boolean> {
  const result = await freighter.isConnected()
  return !('error' in result) && result.isConnected
}
