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

### RewardContract
- **Contract ID**: `CAQK5BHS42OCAV6JLUE3ABNALB3OWWI664BOQWYSQEVBLKWULF7RQ5JT`
- **WASM Hash**: `12c10caedb39b3fce7f40f573f2cc092a2278bd9e7707d2d161b9c7cd052ce39`
- **Deploy TX**: [94336b81...](https://stellar.expert/explorer/testnet/tx/94336b814fe7cca813edb5f5c4050fc0cdc87881c791b7c644b72e67ca8b4f53)
- **Init TX**: [9097c5e5...](https://stellar.expert/explorer/testnet/tx/9097c5e51b92cce032e4646d7816ca216378ce8b153a5347a4abb4c2cbc3cee6)
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CAQK5BHS42OCAV6JLUE3ABNALB3OWWI664BOQWYSQEVBLKWULF7RQ5JT
- **Stellar Lab**: https://lab.stellar.org/r/testnet/contract/CAQK5BHS42OCAV6JLUE3ABNALB3OWWI664BOQWYSQEVBLKWULF7RQ5JT

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
