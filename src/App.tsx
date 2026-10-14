import { useEffect, useState } from 'react'
import { App as AntApp, Button, Card, ConfigProvider, Layout, Menu, Select, Typography } from 'antd'
import faIR from 'antd/locale/fa_IR'
import { AppstoreOutlined, MessageOutlined, CustomerServiceOutlined, TagsOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { ProfilePage } from './pages/ProfilePage'
import { TicketDetailPage, TicketsPage } from './pages/TicketsPage'
import { ConversationsPage, ConversationDetailPage } from './pages/ConversationsPage'
import { PlansPage } from './pages/PlansPage'
import { AdminDashboardPage } from './pages/AdminPage'
import { UsageDashboard } from './pages/DashboardPage'
import { getAccessToken, logout } from './api/auth'
import { getCurrentUser } from './api/users'
import type { UserDTO } from './api/users'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import './App.css'

const { Header, Sider, Content } = Layout
const { Text } = Typography

function Workspace() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<UserDTO | null>(null)
  const [roleLoading, setRoleLoading] = useState(() => Boolean(getAccessToken()))
  const rtl = i18n.language === 'fa'
  const authenticated = Boolean(getAccessToken())

  useEffect(() => {
    document.documentElement.lang = rtl ? 'fa' : 'en'
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [rtl])

  useEffect(() => {
    let active = true
    if (!authenticated) {
      void Promise.resolve().then(() => { if (active) { setUser(null); setRoleLoading(false) } })
      return () => { active = false }
    }
    getCurrentUser()
      .then((current) => { if (active) { setUser(current); setRoleLoading(false) } })
      .catch(() => {
        if (active) {
          setUser(null)
          setRoleLoading(false)
          logout()
          navigate('/login', { replace: true })
        }
      })
    return () => { active = false }
  }, [authenticated, navigate])

  const isAdmin = user?.userRole === 'ADMIN'
  const items = [
    ...(authenticated ? [
      { key: '/', icon: <AppstoreOutlined />, label: <NavLink to="/">{t('dashboard')}</NavLink> },
      { key: '/conversations', icon: <MessageOutlined />, label: <NavLink to="/conversations">{t('conversations')}</NavLink> },
      { key: isAdmin ? '/admin/tickets' : '/tickets', icon: <CustomerServiceOutlined />, label: <NavLink to={isAdmin ? '/admin/tickets' : '/tickets'}>{t('tickets')}</NavLink> },
      ...(isAdmin ? [{ key: '/admin', icon: <BarChartOutlined />, label: <NavLink to="/admin">{t('admin')}</NavLink> }] : []),
    ] : []),
    { key: '/plans', icon: <TagsOutlined />, label: <NavLink to="/plans">{t('plans')}</NavLink> },
    ...(authenticated ? [{ key: '/profile', icon: <UserOutlined />, label: <NavLink to="/profile">{t('account')}</NavLink> }] : []),
  ]

  return <Layout className="workspace" hasSider>
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" className="sidebar">
      <div className="brand-mark">{t('appName')}</div><div className="menu-caption">{t('navigation')}</div>
      <Menu mode="inline" selectedKeys={[location.pathname.startsWith('/tickets/') ? (isAdmin ? '/admin/tickets' : '/tickets') : location.pathname]} items={items} />
    </Sider>
    <Layout>
      <Header className="topbar"><Text strong>{t('appName')}</Text><div className="topbar-actions">
        {authenticated ? <Button onClick={() => { logout(); setUser(null); navigate('/login', { replace: true }) }}>{t('logout')}</Button> : <NavLink to="/login">{t('signIn')}</NavLink>}
        <Select aria-label={t('language')} className="language-select" value={rtl ? 'fa' : 'en'} onChange={(language: string) => void i18n.changeLanguage(language)} options={[{ value: 'en', label: t('english') }, { value: 'fa', label: t('persian') }]} />
      </div></Header>
      <Content className="page-content">
        <Routes>
          <Route path="/login" element={authenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={authenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/" element={authenticated ? <UsageDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/conversations" element={authenticated ? <ConversationsPage /> : <Navigate to="/login" replace />} />
          <Route path="/conversations/:conversationId" element={authenticated ? <ConversationDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/tickets" element={authenticated ? <TicketsPage /> : <Navigate to="/login" replace />} />
          <Route path="/tickets/:ticketId" element={authenticated ? <TicketDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={!authenticated ? <Navigate to="/login" replace /> : roleLoading ? <Card loading /> : isAdmin ? <AdminDashboardPage /> : <Navigate to="/" replace />} />
          <Route path="/admin/tickets" element={!authenticated ? <Navigate to="/login" replace /> : roleLoading ? <Card loading /> : isAdmin ? <TicketsPage adminMode /> : <Navigate to="/" replace />} />
          <Route path="/admin/tickets/:ticketId" element={!authenticated ? <Navigate to="/login" replace /> : roleLoading ? <Card loading /> : isAdmin ? <TicketDetailPage /> : <Navigate to="/" replace />} />
          <Route path="/profile" element={authenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
    </Layout>
  </Layout>
}

function App() {
  const rtl = i18n.language === 'fa'
  return <ConfigProvider direction={rtl ? 'rtl' : 'ltr'} locale={rtl ? faIR : undefined}><AntApp><BrowserRouter><Workspace /></BrowserRouter></AntApp></ConfigProvider>
}

export default App
