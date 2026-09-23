# EcoBonus - Testnet Deployment

**Fecha**: 2026-09-23
**Red**: Stellar Testnet
**Admin**: `GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W`

---

## Contratos Desplegados

### MissionContract
- **Contract ID**: `CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V`
- **WASM Hash**: `a354e2c2ad009f332a3a3aa508e65d8df51d436c5739b45bd9e855a547f71169`
- **Deploy TX**: [8267e445...](https://stellar.expert/explorer/testnet/tx/8267e44588813036f6162a4addafdba596e722199dbbdff028b9569bcc9f31c9)
- **Init TX**: [71d53cad...](https://stellar.expert/explorer/testnet/tx/71d53cad5a95140c7e5d346c4551955446c07c2a462b2b3ad862013649152491)
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V
- **Stellar Lab**: https://lab.stellar.org/r/testnet/contract/CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V

### RewardContract (XLM Native)
- **Contract ID**: `CCSIBFDFBOY5SXUAUB4DRJUH7DS34QVWLESMQGAZOVU33YZYKLD2M5NG`
- **WASM Hash**: `93284c30a4c0967d6c7f086f1fdb639996c26c34e6e193f3db2a6cb88298a390`
- **Deploy TX**: [0dec6830...](https://stellar.expert/explorer/testnet/tx/0dec6830a9e3720282c24005dc46109f15e153001d7b75b652a221b5b5bfdd61)
- **Init TX**: [461444f4...](https://stellar.expert/explorer/testnet/tx/461444f4245d5dcdb0043bfdb68b49abdaaaf2fbbfaae6d3cb64492168332da4)
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CCSIBFDFBOY5SXUAUB4DRJUH7DS34QVWLESMQGAZOVU33YZYKLD2M5NG
- **Stellar Lab**: https://lab.stellar.org/r/testnet/contract/CCSIBFDFBOY5SXUAUB4DRJUH7DS34QVWLESMQGAZOVU33YZYKLD2M5NG
- **Nota**: Usa XLM nativo en lugar de USDC (más simple para MVP)

### CertificateNFT
- **Contract ID**: `CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS`
- **WASM Hash**: `4e4e7185501e196bd13c0aba2d33a51a3cdca4a7ed2b2d485b12d4b86ff75fe2`
- **Deploy TX**: [d85f011d...](https://stellar.expert/explorer/testnet/tx/d85f011d9614069c1736bc2ea329b83b1a0fa00c2ac8f302cd46287521bb9271)
- **Init TX**: [f8b25547...](https://stellar.expert/explorer/testnet/tx/f8b2554781aa5196c6aa3beb42820b80542b5f41180f2b3b8397c7fcd54f00ae)
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS
- **Stellar Lab**: https://lab.stellar.org/r/testnet/contract/CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS

---

## Comandos de Interacción

### Consultar contratos

```bash
# MissionContract
stellar contract invoke \
  --id CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_mission_count

# RewardContract
stellar contract invoke \
  --id CAQK5BHS42OCAV6JLUE3ABNALB3OWWI664BOQWYSQEVBLKWULF7RQ5JT \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_admin

# CertificateNFT
stellar contract invoke \
  --id CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS \
  --source-account ecobonus-admin \
  --network testnet \
  -- get_total_minted
```

---

## TypeScript Bindings

Los bindings se han generado en:
- `contracts-bindings/mission-contract/`
- `contracts-bindings/reward-contract/`
- `contracts-bindings/certificate-nft/`

Para usarlos en el frontend:

```bash
cd contracts-bindings/mission-contract
npm install && npm run build

cd ../reward-contract
npm install && npm run build

cd ../certificate-nft
npm install && npm run build
```

---

## Variables de Entorno

Actualiza tu `.env` con:

```bash
VITE_STELLAR_NETWORK=testnet
VITE_MISSION_CONTRACT_ID=CAIFF4NMRTSM3C25NXBX35EULVWTHKLEIC5C2GHC35IJBFQC5JZIR47V
VITE_REWARD_CONTRACT_ID=CAQK5BHS42OCAV6JLUE3ABNALB3OWWI664BOQWYSQEVBLKWULF7RQ5JT
VITE_CERTIFICATE_NFT_CONTRACT_ID=CCM2NUS74BODRZNCVPVRCXML4M6P4FXR2BUW726Z6URQZDFX7UN7B5LS
VITE_ADMIN_PUBLIC_KEY=GDUGXNI3GIFJSIHVML4DRUFXBWVVJR2PXUIHR4VB7XDT3J7ZPWZKU32W
```

---

## Próximos Pasos

1. ✅ Contratos desplegados en Testnet
2. ✅ Contratos inicializados
3. ✅ TypeScript bindings generados
4. ⏳ Crear pool de recompensas de prueba
5. ⏳ Crear misiones de ejemplo en Lima
6. ⏳ Testing end-to-end
7. ⏳ Integración con frontend

---

**Última actualización**: 2026-09-23
