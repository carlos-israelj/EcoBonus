import { useEffect } from 'react'
import { Wallet, Zap, AlertCircle, X } from 'lucide-react'
import { useWallet, formatAddress } from './useWallet'
import { useEco } from './store'
import { checkSorobanHealth } from './soroban'

export function WalletConnect() {
  const wallet = useWallet()
  const { setWalletAddress, setBlockchainEnabled, blockchainEnabled } = useEco()

  useEffect(() => {
    if (wallet.isConnected && wallet.publicKey) {
      setWalletAddress(wallet.publicKey)
      setBlockchainEnabled(true)
    } else {
      setWalletAddress(null)
      setBlockchainEnabled(false)
    }
  }, [wallet.isConnected, wallet.publicKey, setWalletAddress, setBlockchainEnabled])

  // Check Soroban health on mount
  useEffect(() => {
    checkSorobanHealth().then(health => {
      console.log('Soroban Health:', health)
    })
  }, [])

  if (!wallet.isInstalled) {
    return (
      <div className="wallet-banner warning">
        <AlertCircle size={20} />
        <div>
          <strong>Freighter Wallet no detectada</strong>
          <p>Instala <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">Freighter</a> para usar blockchain</p>
        </div>
      </div>
    )
  }

  if (wallet.error) {
    return (
      <div className="wallet-banner error">
        <AlertCircle size={20} />
        <div>
          <strong>Error de wallet</strong>
          <p>{wallet.error}</p>
        </div>
        <button className="icon-button" onClick={wallet.clearError}>
          <X size={16} />
        </button>
      </div>
    )
  }

  if (!wallet.isConnected) {
    return (
      <button
        className="button secondary wallet-button"
        onClick={wallet.connect}
        disabled={wallet.connecting}
      >
        <Wallet size={17} />
        {wallet.connecting ? 'Conectando...' : 'Conectar Wallet'}
      </button>
    )
  }

  return (
    <div className="wallet-connected">
      <div className="wallet-info">
        <div className="wallet-status">
          <Zap size={14} className="wallet-active" />
          <span>Blockchain activo</span>
        </div>
        <code className="wallet-address">{formatAddress(wallet.publicKey)}</code>
      </div>
      <button className="button text-button small" onClick={wallet.disconnect}>
        Desconectar
      </button>
    </div>
  )
}

export function WalletBadge() {
  const { blockchainEnabled } = useEco()

  if (!blockchainEnabled) return null

  return (
    <span className="wallet-badge">
      <Zap size={12} />
      On-chain
    </span>
  )
}
