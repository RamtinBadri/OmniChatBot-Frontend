import { useEffect, useState } from 'react'
import { App as AntApp, Button, ConfigProvider, Layout, Menu, Select, Typography } from 'antd'
import faIR from 'antd/locale/fa_IR'
import { AppstoreOutlined, MessageOutlined, CustomerServiceOutlined, TagsOutlined, UserOutlined } from '@ant-design/icons'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { ProfilePage } from './pages/ProfilePage'
import { getAccessToken, logout } from './api/auth'
import { getCurrentUser } from './api/users'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import './App.css'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

function Dashboard() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<import('./api/users').UserDTO | null>(null)

  useEffect(() => {
    let active = true
    getCurrentUser()
      .then((user) => { if (active) setProfile(user) })
      .catch(() => { if (active) setProfile(null) })
    return () => { active = false }
  }, [])

  return (
    <section className="welcome-panel">
      <Text className="eyebrow">{t('overview')}</Text>
      <Title level={2}>{t('dashboard')}</Title>
      <Text type="secondary">{profile ? `${profile.firstName} ${profile.lastName} · ${profile.email} · ${profile.status}` : t('dashboardDescription')}</Text>
    </section>
  )
}

function Placeholder({ title }: { title: string }) {
  const { t } = useTranslation()
  return (
    <section className="welcome-panel">
      <Title level={2}>{title}</Title>
      <Text type="secondary">{t('sectionComing')}</Text>
    </section>
  )
}

function Workspace() {
  const { t } = useTranslation()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const rtl = i18n.language === 'fa'
  const authenticated = Boolean(getAccessToken())
  useEffect(() => {
    document.documentElement.lang = rtl ? 'fa' : 'en'
    document.documentElement.dir = rtl ? 'rtl' : 'ltr'
  }, [rtl])
  const items = [
    ...(authenticated ? [
      { key: '/', icon: <AppstoreOutlined />, label: <NavLink to="/">{t('dashboard')}</NavLink> },
      { key: '/conversations', icon: <MessageOutlined />, label: <NavLink to="/conversations">{t('conversations')}</NavLink> },
      { key: '/tickets', icon: <CustomerServiceOutlined />, label: <NavLink to="/tickets">{t('tickets')}</NavLink> },
    ] : []),
    { key: '/plans', icon: <TagsOutlined />, label: <NavLink to="/plans">{t('plans')}</NavLink> },
    ...(authenticated ? [{ key: '/profile', icon: <UserOutlined />, label: <NavLink to="/profile">{t('account')}</NavLink> }] : []),
  ]

  return (
    <Layout className="workspace" hasSider>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" className="sidebar">
        <div className="brand-mark">{t('appName')}</div>
        <div className="menu-caption">{t('navigation')}</div>
        <Menu mode="inline" selectedKeys={[location.pathname]} items={items} />
      </Sider>
      <Layout>
        <Header className="topbar">
          <Text strong>{t('appName')}</Text>
          <div className="topbar-actions">
            {authenticated ? <Button onClick={() => { logout(); window.location.assign('/login') }}>{t('logout')}</Button> : <NavLink to="/login">{t('signIn')}</NavLink>}
            <Select
              aria-label={t('language')}
              className="language-select"
              value={rtl ? 'fa' : 'en'}
              onChange={(language: string) => void i18n.changeLanguage(language)}
              options={[
                { value: 'en', label: t('english') },
                { value: 'fa', label: t('persian') },
              ]}
            />
          </div>
        </Header>
        <Content className="page-content">
          <Routes>
            <Route path="/login" element={authenticated ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={authenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/" element={authenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="/conversations" element={authenticated ? <Placeholder title={t('conversations')} /> : <Navigate to="/login" replace />} />
            <Route path="/tickets" element={authenticated ? <Placeholder title={t('tickets')} /> : <Navigate to="/login" replace />} />
            <Route path="/profile" element={authenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
            <Route path="/plans" element={<Placeholder title={t('plans')} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function App() {
  const rtl = i18n.language === 'fa'

  return (
    <ConfigProvider direction={rtl ? 'rtl' : 'ltr'} locale={rtl ? faIR : undefined}>
      <AntApp>
        <BrowserRouter>
          <Workspace />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
