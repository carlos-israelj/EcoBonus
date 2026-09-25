import { labPrefix } from "@stellar-scaffold/app-lib"
import { NavLink, Outlet, Route, Routes } from "react-router-dom"
import styles from "./App.module.css"
import ConnectAccount from "./components/ConnectAccount"
import Debug from "./pages/Debug"
import Home from "./pages/Home"
import TrustlessWorkDemo from "./pages/TrustlessWorkDemo"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/debug" element={<Debug />} />
				<Route path="/debug/:contractName" element={<Debug />} />
				<Route path="/trustless-work-demo" element={<TrustlessWorkDemo />} />
			</Route>
		</Routes>
	)
}

const AppLayout = () => (
	<div className={styles.AppLayout}>
		<header className={styles.header}>
			<span className={styles.logo}>EcoBonus</span>
			<nav className={styles.headerNav}>
				<NavLink
					to="/"
					className={({ isActive }) => (isActive ? styles.active : "")}
				>
					Home
				</NavLink>
				<NavLink
					to="/trustless-work-demo"
					className={({ isActive }) => (isActive ? styles.active : "")}
				>
					Trustless Work Demo
				</NavLink>
				<NavLink
					to="/debug"
					className={({ isActive }) => (isActive ? styles.active : "")}
				>
					Contract Explorer
				</NavLink>
				<a href={labPrefix()} target="_blank" rel="noreferrer">
					Transaction Explorer
				</a>
			</nav>
			<ConnectAccount />
		</header>

		<main className={styles.main}>
			<Outlet />
		</main>

		<footer className={styles.footer}>
			<nav className={styles.footerNav}>
				<a
					href="https://github.com/carlos-israelj/EcoBonus"
					target="_blank"
					rel="noreferrer"
				>
					GitHub
				</a>
				<a
					href="https://docs.trustlesswork.com"
					target="_blank"
					rel="noreferrer"
				>
					Trustless Work Docs
				</a>
				<a href="https://scaffoldstellar.org" target="_blank" rel="noreferrer">
					Scaffold Docs
				</a>
			</nav>
		</footer>
	</div>
)

export default App
