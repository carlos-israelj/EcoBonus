import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './eco/ui'
import Layout from './eco/Layout'
import Explore from './eco/Explore'
import { Missions, MissionPage, SpotDetail } from './eco/Missions'
import { Rewards, RewardDetail, VoucherPage } from './eco/Rewards'
import { Community, Certificate, Profile } from './eco/Community'
import { Admin, Sponsor, Validator } from './eco/Management'
import { AuthPage, Help, ReportSpot, Settings, Welcome } from './eco/UtilityPages'
import { useEco } from './eco/store'
import './eco/styles.css'

function FallbackRoute() {
	const joined = useEco(state => state.joined)
	return <Navigate to={joined ? '/' : '/login'} replace />
}

function App() {
	return <ToastProvider><Routes>
		<Route path="/auth" element={<AuthPage />} />
		<Route path="/login" element={<AuthPage mode="login" />} />
		<Route path="/register" element={<AuthPage mode="register" />} />
		<Route path="/bienvenida" element={<Welcome />} />
		<Route element={<Layout />}>
			<Route path="/" element={<Explore />} />
			<Route path="/foco/:id" element={<SpotDetail />} />
			<Route path="/misiones" element={<Missions />} />
			<Route path="/mision/:id" element={<MissionPage />} />
			<Route path="/recompensas" element={<Rewards />} />
			<Route path="/recompensa/:id" element={<RewardDetail />} />
			<Route path="/voucher/:id" element={<VoucherPage />} />
			<Route path="/comunidad" element={<Community />} />
			<Route path="/perfil" element={<Profile />} />
			<Route path="/certificado/:id" element={<Certificate />} />
			<Route path="/reportar" element={<ReportSpot />} />
			<Route path="/validador" element={<Validator />} />
			<Route path="/sponsor" element={<Sponsor />} />
			<Route path="/admin" element={<Admin />} />
			<Route path="/ajustes" element={<Settings />} />
			<Route path="/ayuda" element={<Help />} />
		</Route>
		<Route path="*" element={<FallbackRoute />} />
	</Routes></ToastProvider>
}

export default App
