import { useCallback, useEffect, useMemo, useState } from 'react'

// material-ui
import {
    alpha,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Tab,
    Tabs,
    Typography,
    useTheme
} from '@mui/material'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { gridSpacing } from 'store/constant'

// icons
import {
    IconActivity,
    IconArrowsExchange,
    IconBriefcase,
    IconBuilding,
    IconCalendarEvent,
    IconChartBar,
    IconChartPie,
    IconChecklist,
    IconClock,
    IconCpu,
    IconDatabase,
    IconFileExport,
    IconFileReport,
    IconFocus2,
    IconLayoutDashboard,
    IconLayoutKanban,
    IconNetwork,
    IconRefresh,
    IconRoute,
    IconShieldLock,
    IconStar,
    IconTargetArrow,
    IconUser,
    IconUsers
} from '@tabler/icons'

const NAV_SECTIONS = [
    {
        title: 'Operative Exzellenz',
        items: [
            { key: 'my-focus', label: 'My Focus', icon: IconStar },
            { key: 'projects', label: 'Projekt Hub', icon: IconBriefcase },
            { key: 'calendar', label: 'Kalender', icon: IconCalendarEvent },
            { key: 'roadmap', label: 'Roadmap', icon: IconRoute },
            { key: 'sprint', label: 'Sprint Planner', icon: IconChecklist }
        ]
    },
    {
        title: 'Management & BI',
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
            { key: 'resources', label: 'Ressourcen', icon: IconUsers },
            { key: 'controlling', label: 'Controlling', icon: IconChartBar },
            { key: 'reporting', label: 'Reporting', icon: IconFileReport }
        ]
    },
    {
        title: 'Strategie',
        items: [
            { key: 'okr', label: 'OKR Hub', icon: IconTargetArrow },
            { key: 'customers', label: 'Kunden', icon: IconBuilding }
        ]
    },
    {
        title: 'System-Architektur',
        items: [
            { key: 'transfer', label: 'Datentransfer', icon: IconFileExport },
            { key: 'workflows', label: 'Workflows', icon: IconLayoutKanban },
            { key: 'integrations', label: 'Schnittstellen', icon: IconNetwork },
            { key: 'kernel', label: 'System-Kern', icon: IconCpu },
            { key: 'security', label: 'Security', icon: IconShieldLock }
        ]
    }
]

const INITIAL_PROJECTS = [
    { id: 'p1', name: 'ERP Migration', owner: 'A. Becker', progress: 78, budget: 312000, risk: 'Low' },
    { id: 'p2', name: 'CRM Rollout', owner: 'M. Silva', progress: 54, budget: 198500, risk: 'Medium' },
    { id: 'p3', name: 'Data Lake Setup', owner: 'L. Novák', progress: 91, budget: 440000, risk: 'Low' }
]

const INITIAL_NOTIFICATIONS = [
    { id: 'n1', type: 'info', message: 'Portfolio-Report wurde erstellt.' },
    { id: 'n2', type: 'warning', message: 'QA-Auslastung in Sprint 34 kritisch.' }
]

const OperationsHub = () => {
    const theme = useTheme()

    const [activeView, setActiveView] = useState('integrations')
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [projects, setProjects] = useState(() => {
        const saved = localStorage.getItem('ops_hub_projects')
        return saved ? JSON.parse(saved) : INITIAL_PROJECTS
    })
    const [notifications, setNotifications] = useState(() => {
        const saved = localStorage.getItem('ops_hub_notifications')
        return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS
    })
    const [syncLogs, setSyncLogs] = useState(['[INFO] System initialized. Waiting for handshake...'])
    const [isSyncing, setIsSyncing] = useState(false)
    const [statusTab, setStatusTab] = useState(0)

    useEffect(() => {
        localStorage.setItem('ops_hub_projects', JSON.stringify(projects))
    }, [projects])

    useEffect(() => {
        localStorage.setItem('ops_hub_notifications', JSON.stringify(notifications))
    }, [notifications])

    const addLog = useCallback((message) => {
        const time = new Date().toLocaleTimeString('de-DE')
        setSyncLogs((prev) => [...prev, `[${time}] ${message}`].slice(-60))
    }, [])

    const handleFullSync = useCallback(() => {
        setIsSyncing(true)
        addLog('[SYNC] Initializing full data sweep for weclapp...')

        setTimeout(() => {
            addLog('[KERNEL] Initiating weclapp ERP data fetch...')
            addLog('[DATA] Fetched 3 projects, 21 tickets, 13 tasks.')
            addLog('[ANALYTICS] Open Tickets: 7, Active Tasks: 11.')
            addLog('[USER] Manual matching required for 2 entities.')
            setNotifications((prev) => [
                {
                    id: `n-${Date.now()}`,
                    type: 'info',
                    message: 'Sync abgeschlossen. 37 Datensätze aktualisiert.'
                },
                ...prev
            ])
            setIsSyncing(false)
        }, 800)
    }, [addLog])

    const kpis = useMemo(() => {
        const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
        const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)

        return [
            { title: 'System Health', value: 'Active / Secure', info: '99.98% Uptime', icon: IconActivity, color: '#12B76A' },
            { title: 'API Latenz', value: '124ms', info: 'Optimal', icon: IconFocus2, color: '#7C4DFF' },
            { title: 'Portfolio Fortschritt', value: `${avgProgress}%`, info: `${projects.length} Projekte`, icon: IconChartPie, color: '#1570EF' },
            {
                title: 'Budget Volumen',
                value: `${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(totalBudget)}`,
                info: 'Aktives Gesamtbudget',
                icon: IconDatabase,
                color: '#F79009'
            }
        ]
    }, [projects])

    const riskColor = (risk) => {
        if (risk === 'Low') return 'success'
        if (risk === 'Medium') return 'warning'
        return 'error'
    }

    const renderMainPanel = () => {
        if (activeView !== 'integrations') {
            return (
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography variant='h3'>{NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.key === activeView)?.label}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Diese Domain-Ansicht ist vorbereitet. Der Schwerpunkt dieses Prototyps liegt aktuell auf dem "Schnittstellen / Integrations"-Hub,
                                inklusive KPI-Übersicht, Live-Feed und Projektsteuerung.
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            )
        }

        return (
            <>
                <Tabs value={statusTab} onChange={(_, value) => setStatusTab(value)} sx={{ mb: 3 }}>
                    <Tab label='Sync Center' />
                    <Tab label='Data Registry' />
                    <Tab label='Security Vault' />
                </Tabs>

                <Grid container spacing={gridSpacing}>
                    {kpis.map((card) => {
                        const Icon = card.icon

                        return (
                            <Grid item xs={12} sm={6} lg={3} key={card.title}>
                                <Card sx={{ borderRadius: 4 }}>
                                    <CardContent>
                                        <Stack direction='row' justifyContent='space-between'>
                                            <Box>
                                                <Typography variant='caption' sx={{ textTransform: 'uppercase' }}>
                                                    {card.title}
                                                </Typography>
                                                <Typography variant='h3'>{card.value}</Typography>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {card.info}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 2,
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                    backgroundColor: alpha(card.color, 0.12),
                                                    color: card.color
                                                }}
                                            >
                                                <Icon />
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )
                    })}
                </Grid>

                <Grid container spacing={gridSpacing} sx={{ mt: 0.5 }}>
                    <Grid item xs={12} lg={8}>
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                                    <Typography variant='h3'>Top Projekte</Typography>
                                    <Stack direction='row' spacing={1}>
                                        <Button
                                            startIcon={<IconRefresh size={17} />}
                                            variant='outlined'
                                            onClick={handleFullSync}
                                            disabled={isSyncing}
                                        >
                                            {isSyncing ? 'Sync läuft…' : 'Full Repository Sync'}
                                        </Button>
                                        <Button variant='contained'>Neues Projekt</Button>
                                    </Stack>
                                </Stack>

                                <Stack spacing={2}>
                                    {projects.map((project) => (
                                        <Box key={project.id} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                                <Box>
                                                    <Typography variant='h4'>{project.name}</Typography>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        Projektleitung: {project.owner} · Budget:{' '}
                                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                                                            project.budget
                                                        )}
                                                    </Typography>
                                                </Box>
                                                <Chip label={project.risk} color={riskColor(project.risk)} size='small' />
                                            </Stack>

                                            <Box sx={{ mt: 1.5 }}>
                                                <Typography variant='caption'>Fortschritt: {project.progress}%</Typography>
                                                <Box
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 99,
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                                        mt: 0.8,
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${project.progress}%`,
                                                            height: '100%',
                                                            backgroundColor: theme.palette.primary.main
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} lg={4}>
                        <Card sx={{ borderRadius: 4, height: '100%' }}>
                            <CardContent>
                                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                    <Typography variant='h3'>Live Integration Feed</Typography>
                                    <IconClock size={18} />
                                </Stack>
                                <Divider sx={{ my: 2 }} />
                                <Box
                                    sx={{
                                        background: '#041a33',
                                        color: '#7ed0ff',
                                        borderRadius: 3,
                                        p: 2,
                                        minHeight: 240,
                                        maxHeight: 320,
                                        overflowY: 'auto',
                                        fontFamily: 'monospace',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    {syncLogs.map((line) => (
                                        <Typography key={line} sx={{ fontFamily: 'inherit', fontSize: 'inherit', mb: 1 }}>
                                            {line}
                                        </Typography>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </>
        )
    }

    return (
        <MainCard sx={{ p: 0, overflow: 'hidden', borderRadius: 4 }}>
            <Grid container sx={{ minHeight: '78vh' }}>
                <Grid
                    item
                    sx={{
                        width: sidebarOpen ? 280 : 90,
                        transition: 'width 250ms ease',
                        background: 'linear-gradient(180deg, #051a31 0%, #031325 100%)',
                        color: theme.palette.common.white,
                        p: 2,
                        borderRight: `1px solid ${alpha(theme.palette.common.white, 0.08)}`
                    }}
                >
                    <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ px: 1, pb: 2, mb: 2, borderBottom: `1px solid ${alpha('#fff', 0.08)}` }}>
                        <Stack direction='row' alignItems='center' spacing={1.2}>
                            <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: alpha('#fff', 0.08) }}>
                                <IconArrowsExchange size={20} color='#C8F560' />
                            </Box>
                            {sidebarOpen && (
                                <Typography variant='h3' sx={{ color: 'white' }}>
                                    CRP<span style={{ color: '#C8F560' }}>flow</span>
                                </Typography>
                            )}
                        </Stack>
                        <IconButton size='small' onClick={() => setSidebarOpen((prev) => !prev)} sx={{ color: 'white' }}>
                            <IconLayoutDashboard size={17} />
                        </IconButton>
                    </Stack>

                    <Stack spacing={2.5}>
                        {NAV_SECTIONS.map((section) => (
                            <Box key={section.title}>
                                {sidebarOpen && (
                                    <Typography variant='caption' sx={{ color: alpha(theme.palette.common.white, 0.45), textTransform: 'uppercase', px: 1.5 }}>
                                        {section.title}
                                    </Typography>
                                )}
                                <List sx={{ mt: 1, p: 0 }}>
                                    {section.items.map((item) => {
                                        const Icon = item.icon
                                        const active = item.key === activeView

                                        return (
                                            <ListItemButton
                                                key={item.key}
                                                onClick={() => setActiveView(item.key)}
                                                sx={{
                                                    borderRadius: 2,
                                                    mb: 0.6,
                                                    py: 1,
                                                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                                                    bgcolor: active ? alpha('#C8F560', 0.85) : 'transparent',
                                                    color: active ? '#031325' : alpha(theme.palette.common.white, 0.92),
                                                    '&:hover': {
                                                        bgcolor: active ? alpha('#C8F560', 0.85) : alpha('#fff', 0.06)
                                                    }
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: sidebarOpen ? 30 : 'auto', color: 'inherit' }}>
                                                    <Icon size={18} />
                                                </ListItemIcon>
                                                {sidebarOpen && <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700, fontSize: '0.8rem' }} />}
                                            </ListItemButton>
                                        )
                                    })}
                                </List>
                            </Box>
                        ))}
                    </Stack>
                </Grid>

                <Grid item xs sx={{ background: '#f5f7fb' }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ p: 2.5, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: 'white' }}>
                        <Stack direction='row' spacing={1.2} alignItems='center'>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f6f8fb', display: 'grid', placeItems: 'center' }}>
                                <IconActivity size={15} color='#031325' />
                            </Box>
                            <Typography variant='subtitle2' sx={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>
                                {activeView.replace('-', ' ')}
                            </Typography>
                        </Stack>
                        <Stack direction='row' spacing={1.5} alignItems='center'>
                            <Chip label='Status: Live Ops' color='success' variant='outlined' size='small' />
                            <Avatar src='https://api.dicebear.com/7.x/personas/svg?seed=Flowise' />
                        </Stack>
                    </Stack>

                    <Box sx={{ p: 3 }}>{renderMainPanel()}</Box>
                </Grid>

                <Grid
                    item
                    sx={{ width: 300, borderLeft: `1px solid ${theme.palette.divider}`, p: 2.2, bgcolor: 'white' }}
                >
                    <Typography variant='h4' sx={{ mb: 1.5 }}>
                        Kontext & Meldungen
                    </Typography>
                    <Stack spacing={1}>
                        {notifications.map((n) => (
                            <Box
                                key={n.id}
                                sx={{
                                    p: 1.2,
                                    borderRadius: 2,
                                    border: `1px solid ${theme.palette.divider}`,
                                    bgcolor: n.type === 'warning' ? alpha(theme.palette.warning.light, 0.2) : alpha(theme.palette.info.light, 0.18)
                                }}
                            >
                                <Stack direction='row' spacing={1} alignItems='flex-start'>
                                    <IconUser size={15} style={{ marginTop: 2 }} />
                                    <Typography variant='body2'>{n.message}</Typography>
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default OperationsHub
