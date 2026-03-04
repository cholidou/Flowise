import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
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
    IconLock,
    IconNetwork,
    IconRefresh,
    IconRoute,
    IconSearch,
    IconShieldLock,
    IconStar,
    IconTargetArrow,
    IconUser,
    IconUsers,
    IconX
} from '@tabler/icons'

const STORAGE_KEYS = {
    projects: 'ops_hub_projects',
    notifications: 'ops_hub_notifications'
}

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

const safeLoad = (storageKey, fallback) => {
    try {
        const raw = localStorage.getItem(storageKey)
        return raw ? JSON.parse(raw) : fallback
    } catch (e) {
        return fallback
    }
}

const riskToMuiColor = (risk) => {
    if (risk === 'Low') return 'success'
    if (risk === 'Medium') return 'warning'
    return 'error'
}

const OperationsHub = () => {
    const theme = useTheme()
    const showContextRail = useMediaQuery(theme.breakpoints.up('xl'))

    const [activeView, setActiveView] = useState('integrations')
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [projects, setProjects] = useState(() => safeLoad(STORAGE_KEYS.projects, INITIAL_PROJECTS))
    const [notifications, setNotifications] = useState(() => safeLoad(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS))
    const [syncLogs, setSyncLogs] = useState(['[INFO] System initialized. Waiting for handshake...'])
    const [isSyncing, setIsSyncing] = useState(false)
    const [statusTab, setStatusTab] = useState(0)
    const [riskFilter, setRiskFilter] = useState('All')
    const [projectQuery, setProjectQuery] = useState('')

    const syncTimeoutRef = useRef(null)

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects))
        } catch (e) {
            // ignore write issues
        }
    }, [projects])

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications))
        } catch (e) {
            // ignore write issues
        }
    }, [notifications])

    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        }
    }, [])

    const addLog = useCallback((message) => {
        const time = new Date().toLocaleTimeString('de-DE')
        setSyncLogs((prev) => [...prev, `[${time}] ${message}`].slice(-60))
    }, [])

    const handleFullSync = useCallback(() => {
        if (isSyncing) return

        setIsSyncing(true)
        addLog('[SYNC] Initializing full data sweep for weclapp...')

        syncTimeoutRef.current = setTimeout(() => {
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

            setProjects((prev) =>
                prev.map((project) => ({
                    ...project,
                    progress: Math.min(project.progress + 1, 100)
                }))
            )
            setIsSyncing(false)
        }, 900)
    }, [addLog, isSyncing])

    const budgetFormatter = useMemo(
        () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
        []
    )

    const activeViewLabel = useMemo(() => {
        const allItems = NAV_SECTIONS.flatMap((section) => section.items)
        return allItems.find((item) => item.key === activeView)?.label ?? activeView.replace('-', ' ')
    }, [activeView])

    const filteredProjects = useMemo(() => {
        const normalizedQuery = projectQuery.trim().toLowerCase()

        return projects
            .filter((project) => (riskFilter === 'All' ? true : project.risk === riskFilter))
            .filter((project) => (normalizedQuery ? project.name.toLowerCase().includes(normalizedQuery) || project.owner.toLowerCase().includes(normalizedQuery) : true))
            .sort((a, b) => b.progress - a.progress)
    }, [projects, projectQuery, riskFilter])

    const kpis = useMemo(() => {
        const avgProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0
        const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)

        return [
            { title: 'System Health', value: 'Active / Secure', info: '99.98% Uptime', icon: IconActivity, color: '#12B76A' },
            { title: 'API Latenz', value: '124ms', info: 'Optimal', icon: IconFocus2, color: '#7C4DFF' },
            { title: 'Portfolio Fortschritt', value: `${avgProgress}%`, info: `${projects.length} Projekte`, icon: IconChartPie, color: '#1570EF' },
            {
                title: 'Budget Volumen',
                value: budgetFormatter.format(totalBudget),
                info: 'Aktives Gesamtbudget',
                icon: IconDatabase,
                color: '#F79009'
            }
        ]
    }, [budgetFormatter, projects])

    const dataRegistryMetrics = useMemo(
        () => [
            { label: 'Mappbare Datensätze', value: 217, color: theme.palette.info.main },
            { label: 'Duplikate', value: 9, color: theme.palette.warning.main },
            { label: 'Fehlende Owner', value: 4, color: theme.palette.error.main }
        ],
        [theme]
    )

    const renderProjectList = () => (
        <Stack spacing={2}>
            {filteredProjects.map((project) => (
                <Box key={project.id} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                        <Box>
                            <Typography variant='h4'>{project.name}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Projektleitung: {project.owner} · Budget: {budgetFormatter.format(project.budget)}
                            </Typography>
                        </Box>
                        <Chip label={project.risk} color={riskToMuiColor(project.risk)} size='small' />
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
            {filteredProjects.length === 0 && (
                <Typography variant='body2' color='text.secondary'>
                    Keine Projekte für den gewählten Filter.
                </Typography>
            )}
        </Stack>
    )

    const renderSyncCenter = () => (
        <Grid container spacing={gridSpacing} sx={{ mt: 0.5 }}>
            <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={2}>
                            <Typography variant='h3'>Top Projekte</Typography>
                            <Stack direction='row' spacing={1}>
                                <Button startIcon={<IconRefresh size={17} />} variant='outlined' onClick={handleFullSync} disabled={isSyncing}>
                                    {isSyncing ? 'Sync läuft…' : 'Full Repository Sync'}
                                </Button>
                                <Button variant='contained'>Neues Projekt</Button>
                            </Stack>
                        </Stack>

                        <TextField
                            size='small'
                            placeholder='Projekt oder Verantwortliche suchen...'
                            value={projectQuery}
                            onChange={(e) => setProjectQuery(e.target.value)}
                            InputProps={{
                                startAdornment: <IconSearch size={16} style={{ marginRight: 8 }} />
                            }}
                            sx={{ mb: 2, width: { xs: '100%', md: 360 } }}
                        />

                        {renderProjectList()}
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
                            {syncLogs.map((line, index) => (
                                <Typography key={`${line}-${index}`} sx={{ fontFamily: 'inherit', fontSize: 'inherit', mb: 1 }}>
                                    {line}
                                </Typography>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )

    const renderDataRegistry = () => (
        <Grid container spacing={gridSpacing} sx={{ mt: 0.5 }}>
            {dataRegistryMetrics.map((metric) => (
                <Grid item xs={12} sm={4} key={metric.label}>
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography variant='caption' sx={{ textTransform: 'uppercase' }}>
                                {metric.label}
                            </Typography>
                            <Typography variant='h2' sx={{ color: metric.color }}>
                                {metric.value}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
            <Grid item xs={12}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Typography variant='h3' sx={{ mb: 2 }}>
                            Data Registry Vorschau
                        </Typography>
                        <Stack spacing={1.2}>
                            {projects.map((project) => (
                                <Stack key={project.id} direction='row' justifyContent='space-between' sx={{ p: 1.3, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant='body2'>{project.name}</Typography>
                                    <Chip label='Ready for Match' color='info' size='small' />
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )

    const renderSecurityVault = () => (
        <Grid container spacing={gridSpacing} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
                            <IconShieldLock size={18} />
                            <Typography variant='h4'>Security Posture</Typography>
                        </Stack>
                        <Typography variant='body2' color='text.secondary'>
                            2FA aktiv, API-Tokens rotiert, Berechtigungsmodell zuletzt vor 7 Tagen geprüft.
                        </Typography>
                        <Chip label='Compliant' color='success' size='small' sx={{ mt: 1.5 }} />
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1 }}>
                            <IconLock size={18} />
                            <Typography variant='h4'>Vault Health</Typography>
                        </Stack>
                        <Typography variant='body2' color='text.secondary'>
                            12 Secrets hinterlegt, 0 abgelaufen, 1 Rotation geplant innerhalb der nächsten 24h.
                        </Typography>
                        <Button size='small' variant='outlined' sx={{ mt: 1.5 }}>
                            Rotation planen
                        </Button>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )

    const renderMainPanel = () => {
        if (activeView !== 'integrations') {
            return (
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography variant='h3'>{activeViewLabel}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Diese Domain-Ansicht ist vorbereitet. Der Schwerpunkt dieses Prototyps liegt aktuell auf dem Integrations-Hub,
                                inklusive KPI-Übersicht, Live-Feed und Projektsteuerung.
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            )
        }

        return (
            <>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} mb={2} spacing={1}>
                    <Tabs value={statusTab} onChange={(_, value) => setStatusTab(value)}>
                        <Tab label='Sync Center' />
                        <Tab label='Data Registry' />
                        <Tab label='Security Vault' />
                    </Tabs>
                    <Stack direction='row' spacing={1}>
                        {['All', 'Low', 'Medium', 'High'].map((risk) => (
                            <Chip
                                key={risk}
                                label={risk === 'All' ? 'Alle Risiken' : risk}
                                size='small'
                                color={risk === riskFilter ? 'primary' : 'default'}
                                variant={risk === riskFilter ? 'filled' : 'outlined'}
                                onClick={() => setRiskFilter(risk)}
                            />
                        ))}
                    </Stack>
                </Stack>

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

                {statusTab === 0 && renderSyncCenter()}
                {statusTab === 1 && renderDataRegistry()}
                {statusTab === 2 && renderSecurityVault()}
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
                        <Tooltip title={sidebarOpen ? 'Sidebar einklappen' : 'Sidebar ausklappen'}>
                            <IconButton size='small' onClick={() => setSidebarOpen((prev) => !prev)} sx={{ color: 'white' }}>
                                <IconLayoutDashboard size={17} />
                            </IconButton>
                        </Tooltip>
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
                                {activeViewLabel}
                            </Typography>
                        </Stack>
                        <Stack direction='row' spacing={1.5} alignItems='center'>
                            <Chip label='Status: Live Ops' color='success' variant='outlined' size='small' />
                            <Avatar src='https://api.dicebear.com/7.x/personas/svg?seed=Flowise' />
                        </Stack>
                    </Stack>

                    <Box sx={{ p: 3 }}>{renderMainPanel()}</Box>
                </Grid>

                {showContextRail && (
                    <Grid item sx={{ width: 300, borderLeft: `1px solid ${theme.palette.divider}`, p: 2.2, bgcolor: 'white' }}>
                        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1.5 }}>
                            <Typography variant='h4'>Kontext & Meldungen</Typography>
                            <Button size='small' onClick={() => setNotifications([])} disabled={notifications.length === 0}>
                                Leeren
                            </Button>
                        </Stack>
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
                                        <Typography variant='body2' sx={{ flex: 1 }}>
                                            {n.message}
                                        </Typography>
                                        <IconButton size='small' onClick={() => setNotifications((prev) => prev.filter((entry) => entry.id !== n.id))}>
                                            <IconX size={14} />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            ))}
                            {notifications.length === 0 && (
                                <Typography variant='body2' color='text.secondary'>
                                    Keine offenen Meldungen.
                                </Typography>
                            )}
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </MainCard>
    )
}

export default OperationsHub
