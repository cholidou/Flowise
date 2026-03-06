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
    InputAdornment,
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
    IconPlus,
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

import { fetchWeclappAggregatedData, mapWeclappOrderToProject } from './services/weclappService'

const STORAGE_KEYS = {
    projects: 'ops_hub_projects',
    notifications: 'ops_hub_notifications',
    workflowBoard: 'ops_hub_workflow_board',
    weclappConfig: 'ops_hub_weclapp_config',
    lastSyncAt: 'ops_hub_last_sync'
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

const INITIAL_TICKETS = [
    { id: 't1', projectId: 'p1', subject: 'SSO Login Issue', status: 'OPEN', priority: 'High' },
    { id: 't2', projectId: 'p1', subject: 'Data Mapping Validation', status: 'IN_PROGRESS', priority: 'Medium' },
    { id: 't3', projectId: 'p2', subject: 'Customer Migration Blocker', status: 'OPEN', priority: 'High' },
    { id: 't4', projectId: 'p3', subject: 'Pipeline Monitoring', status: 'DONE', priority: 'Low' }
]

const INITIAL_OKRS = [
    { id: 'o1', objective: 'ERP Stabilisierung', target: 85, current: 72, linkedProjectId: 'p1' },
    { id: 'o2', objective: 'CRM Adoptionsrate', target: 70, current: 48, linkedProjectId: 'p2' },
    { id: 'o3', objective: 'Data Reliability', target: 95, current: 89, linkedProjectId: 'p3' }
]

const INITIAL_NOTIFICATIONS = [
    { id: 'n1', type: 'info', message: 'Portfolio-Report wurde erstellt.' },
    { id: 'n2', type: 'warning', message: 'QA-Auslastung in Sprint 34 kritisch.' }
]

const DEFAULT_WORKFLOW_BOARD = {
    backlog: [
        { id: 'w1', title: 'Anforderung erfassen' },
        { id: 'w2', title: 'Scope Review' }
    ],
    inprogress: [{ id: 'w3', title: 'Implementierung ERP Connector' }],
    done: [{ id: 'w4', title: 'Sicherheitsprüfung abgeschlossen' }]
}

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

const WORKFLOW_COLUMNS = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'inprogress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
]

const OperationsHub = () => {
    const theme = useTheme()
    const showContextRail = useMediaQuery(theme.breakpoints.up('xl'))

    const [activeView, setActiveView] = useState('integrations')
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [projects, setProjects] = useState(() => safeLoad(STORAGE_KEYS.projects, INITIAL_PROJECTS))
    const [tickets] = useState(INITIAL_TICKETS)
    const [okrs] = useState(INITIAL_OKRS)
    const [notifications, setNotifications] = useState(() => safeLoad(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS))
    const [syncLogs, setSyncLogs] = useState(['[INFO] System initialized. Waiting for handshake...'])
    const [isSyncing, setIsSyncing] = useState(false)
    const [statusTab, setStatusTab] = useState(0)
    const [riskFilter, setRiskFilter] = useState('All')
    const [projectQuery, setProjectQuery] = useState('')
    const [weclappConfig, setWeclappConfig] = useState(() => safeLoad(STORAGE_KEYS.weclappConfig, { baseUrl: '', apiToken: '' }))
    const [lastSyncAt, setLastSyncAt] = useState(() => safeLoad(STORAGE_KEYS.lastSyncAt, null))
    const [dragItem, setDragItem] = useState(null)
    const [workflowBoard, setWorkflowBoard] = useState(() => safeLoad(STORAGE_KEYS.workflowBoard, DEFAULT_WORKFLOW_BOARD))
    const [newWorkflowStep, setNewWorkflowStep] = useState({ backlog: '', inprogress: '', done: '' })

    const syncTimeoutRef = useRef(null)

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects))
    }, [projects])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notifications))
    }, [notifications])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.workflowBoard, JSON.stringify(workflowBoard))
    }, [workflowBoard])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.weclappConfig, JSON.stringify(weclappConfig))
    }, [weclappConfig])

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.lastSyncAt, JSON.stringify(lastSyncAt))
    }, [lastSyncAt])

    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
        }
    }, [])

    const addLog = useCallback((message) => {
        const time = new Date().toLocaleTimeString('de-DE')
        setSyncLogs((prev) => [...prev, `[${time}] ${message}`].slice(-120))
    }, [])

    const handleFullSync = useCallback(async () => {
        if (isSyncing) return

        setIsSyncing(true)
        addLog('[SYNC] Initializing full data sweep for weclapp...')

        if (!weclappConfig.baseUrl || !weclappConfig.apiToken) {
            syncTimeoutRef.current = setTimeout(() => {
                addLog('[KERNEL] Initiating weclapp ERP data fetch...')
                addLog('[DATA] Fetched 3 projects, 21 tickets, 13 tasks.')
                addLog('[ANALYTICS] Open Tickets: 7, Active Tasks: 11.')
                addLog('[USER] Manual matching required for 2 entities.')

                setNotifications((prev) => [{ id: `n-${Date.now()}`, type: 'info', message: 'Sync abgeschlossen. 37 Datensätze aktualisiert.' }, ...prev])
                setProjects((prev) => prev.map((project) => ({ ...project, progress: Math.min(project.progress + 1, 100) })))
                setLastSyncAt(new Date().toISOString())
                setIsSyncing(false)
            }, 900)
            return
        }

        try {
            const aggregated = await fetchWeclappAggregatedData(weclappConfig.baseUrl, weclappConfig.apiToken)
            const orders = aggregated?.operationalData?.orders || []
            const workItems = aggregated?.operationalData?.activeWorkItems || []
            const mappedProjects = orders.map(mapWeclappOrderToProject)

            if (mappedProjects.length > 0) {
                setProjects((prev) => {
                    const previousById = new Map(prev.map((project) => [project.id, project]))
                    mappedProjects.forEach((project) => {
                        previousById.set(project.id, { ...previousById.get(project.id), ...project })
                    })
                    return Array.from(previousById.values())
                })
                addLog(`[DATA] Project portfolio updated with ${mappedProjects.length} orders.`)
            }

            addLog(`[KERNEL] Aggregation complete: ${orders.length} orders / ${workItems.length} work items.`)
            addLog(`[ANALYTICS] Open Tickets: ${aggregated?.analytics?.totalOpenTickets || 0}, Active Tasks: ${aggregated?.analytics?.totalActiveTasks || 0}.`)

            setLastSyncAt(new Date().toISOString())
            setNotifications((prev) => [
                {
                    id: `n-${Date.now()}`,
                    type: 'info',
                    message: `Sync abgeschlossen. ${orders.length + workItems.length} Datensätze aus weclapp verarbeitet.`
                },
                ...prev
            ])
        } catch (error) {
            addLog(`[ERROR] ${error.message}`)
            setNotifications((prev) => [{ id: `n-${Date.now()}`, type: 'warning', message: `Sync fehlgeschlagen: ${error.message}` }, ...prev])
        }

        setIsSyncing(false)
    }, [addLog, isSyncing, weclappConfig])

    const budgetFormatter = useMemo(() => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }), [])

    const activeViewLabel = useMemo(() => {
        const allItems = NAV_SECTIONS.flatMap((section) => section.items)
        return allItems.find((item) => item.key === activeView)?.label ?? activeView.replace('-', ' ')
    }, [activeView])

    const filteredProjects = useMemo(() => {
        const normalizedQuery = projectQuery.trim().toLowerCase()

        return projects
            .filter((project) => (riskFilter === 'All' ? true : project.risk === riskFilter))
            .filter((project) =>
                normalizedQuery ? project.name.toLowerCase().includes(normalizedQuery) || project.owner.toLowerCase().includes(normalizedQuery) : true
            )
            .sort((a, b) => b.progress - a.progress)
    }, [projectQuery, projects, riskFilter])

    const linkedInsights = useMemo(() => {
        return projects.map((project) => {
            const relatedTickets = tickets.filter((ticket) => ticket.projectId === project.id)
            const openTickets = relatedTickets.filter((ticket) => ticket.status !== 'DONE').length
            const relatedOkr = okrs.find((okr) => okr.linkedProjectId === project.id)
            const kpiScore = Math.round((project.progress + (relatedOkr?.current || 0)) / 2)

            return {
                ...project,
                openTickets,
                relatedObjective: relatedOkr?.objective || 'Nicht definiert',
                okrProgress: relatedOkr?.current || 0,
                kpiScore
            }
        })
    }, [okrs, projects, tickets])


    const biChartData = useMemo(() => {
        return linkedInsights.map((row) => ({
            id: row.id,
            name: row.name,
            progress: row.progress,
            okr: row.okrProgress,
            tickets: Math.min(row.openTickets * 20, 100),
            kpi: row.kpiScore
        }))
    }, [linkedInsights])

    const kpis = useMemo(() => {
        const avgProgress = projects.length ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0
        const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
        const openTickets = tickets.filter((ticket) => ticket.status !== 'DONE').length

        return [
            { title: 'System Health', value: 'Active / Secure', info: '99.98% Uptime', icon: IconActivity, color: '#12B76A' },
            { title: 'API Latenz', value: '124ms', info: 'Optimal', icon: IconFocus2, color: '#7C4DFF' },
            { title: 'Offene Tickets', value: `${openTickets}`, info: 'Projektübergreifend', icon: IconChecklist, color: '#1570EF' },
            { title: 'Budget Volumen', value: budgetFormatter.format(totalBudget), info: `${avgProgress}% Portfolio Fortschritt`, icon: IconDatabase, color: '#F79009' }
        ]
    }, [budgetFormatter, projects, tickets])

    const dataRegistryMetrics = useMemo(
        () => [
            { label: 'Mappbare Datensätze', value: 217, color: theme.palette.info.main },
            { label: 'Duplikate', value: 9, color: theme.palette.warning.main },
            { label: 'Fehlende Owner', value: 4, color: theme.palette.error.main }
        ],
        [theme]
    )

    const onDragStart = (columnId, itemId) => setDragItem({ columnId, itemId })

    const onDropToColumn = (targetColumnId) => {
        if (!dragItem || dragItem.columnId === targetColumnId) return

        setWorkflowBoard((prev) => {
            const sourceColumn = prev[dragItem.columnId] || []
            const targetColumn = prev[targetColumnId] || []
            const movedItem = sourceColumn.find((item) => item.id === dragItem.itemId)
            if (!movedItem) return prev

            return {
                ...prev,
                [dragItem.columnId]: sourceColumn.filter((item) => item.id !== dragItem.itemId),
                [targetColumnId]: [...targetColumn, movedItem]
            }
        })

        addLog(`[WORKFLOW] Step ${dragItem.itemId} moved to ${targetColumnId}.`)
        setDragItem(null)
    }

    const addWorkflowStep = (columnId) => {
        const title = (newWorkflowStep[columnId] || '').trim()
        if (!title) return

        setWorkflowBoard((prev) => ({
            ...prev,
            [columnId]: [...(prev[columnId] || []), { id: `w-${Date.now()}`, title }]
        }))
        setNewWorkflowStep((prev) => ({ ...prev, [columnId]: '' }))
        addLog(`[WORKFLOW] New step added in ${columnId}: ${title}`)
    }

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
                        <Box sx={{ height: 8, borderRadius: 99, backgroundColor: alpha(theme.palette.primary.main, 0.15), mt: 0.8, overflow: 'hidden' }}>
                            <Box sx={{ width: `${project.progress}%`, height: '100%', backgroundColor: theme.palette.primary.main }} />
                        </Box>
                    </Box>
                </Box>
            ))}
            {filteredProjects.length === 0 && <Typography variant='body2' color='text.secondary'>Keine Projekte für den gewählten Filter.</Typography>}
        </Stack>
    )

    const renderBiDashboard = () => (
        <Grid container spacing={gridSpacing} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Typography variant='h3' sx={{ mb: 2 }}>
                            BI Reporting: Projekte · Tickets · OKR · KPI (verknüpft)
                        </Typography>
                        <Grid container spacing={gridSpacing}>
                            {linkedInsights.map((row) => (
                                <Grid item xs={12} md={6} xl={4} key={row.id}>
                                    <Box sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                        <Typography variant='h4'>{row.name}</Typography>
                                        <Typography variant='body2' color='text.secondary'>Owner: {row.owner}</Typography>
                                        <Stack direction='row' spacing={1} mt={1} flexWrap='wrap'>
                                            <Chip label={`Open Tickets: ${row.openTickets}`} size='small' color='warning' />
                                            <Chip label={`OKR: ${row.okrProgress}%`} size='small' color='info' />
                                            <Chip label={`KPI Score: ${row.kpiScore}`} size='small' color='success' />
                                        </Stack>
                                        <Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
                                            Objective: {row.relatedObjective}
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: 4, height: '100%' }}>
                    <CardContent>
                        <Typography variant='h4' sx={{ mb: 2 }}>
                            Balkendiagramm: Projektfortschritt vs. OKR
                        </Typography>
                        <Stack spacing={1.5}>
                            {biChartData.map((row) => (
                                <Box key={row.id}>
                                    <Stack direction='row' justifyContent='space-between'>
                                        <Typography variant='caption'>{row.name}</Typography>
                                        <Typography variant='caption'>KPI {row.kpi}</Typography>
                                    </Stack>
                                    <Box sx={{ mt: 0.6, mb: 0.6, height: 8, borderRadius: 99, backgroundColor: alpha(theme.palette.primary.main, 0.16), overflow: 'hidden' }}>
                                        <Box sx={{ width: `${row.progress}%`, height: '100%', backgroundColor: theme.palette.primary.main }} />
                                    </Box>
                                    <Box sx={{ height: 8, borderRadius: 99, backgroundColor: alpha(theme.palette.info.main, 0.16), overflow: 'hidden' }}>
                                        <Box sx={{ width: `${row.okr}%`, height: '100%', backgroundColor: theme.palette.info.main }} />
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 4, height: '100%' }}>
                    <CardContent>
                        <Typography variant='h4' sx={{ mb: 2 }}>
                            Verknüpfungsmatrix Projekt ↔ Tickets ↔ OKR
                        </Typography>
                        <Stack spacing={1}>
                            {linkedInsights.map((row) => (
                                <Stack key={row.id} direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ p: 1.2, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                    <Chip label={row.name} size='small' color='primary' />
                                    <Chip label={`${row.openTickets} offene Tickets`} size='small' color='warning' />
                                    <Chip label={`Objective: ${row.relatedObjective}`} size='small' color='info' />
                                    <Chip label={`KPI ${row.kpiScore}`} size='small' color='success' />
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Typography variant='h4' sx={{ mb: 2 }}>
                            Ticket Last (visualisiert)
                        </Typography>
                        <Stack spacing={1.5}>
                            {biChartData.map((row) => (
                                <Box key={`tickets-${row.id}`}>
                                    <Stack direction='row' justifyContent='space-between'>
                                        <Typography variant='caption'>{row.name}</Typography>
                                        <Typography variant='caption'>{Math.round(row.tickets / 20)} Tickets offen</Typography>
                                    </Stack>
                                    <Box sx={{ mt: 0.6, height: 10, borderRadius: 99, backgroundColor: alpha(theme.palette.warning.main, 0.15), overflow: 'hidden' }}>
                                        <Box sx={{ width: `${row.tickets}%`, height: '100%', backgroundColor: theme.palette.warning.main }} />
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    )

    const renderWorkflowBuilder = () => (
        <Grid container spacing={gridSpacing} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Typography variant='h3' sx={{ mb: 2 }}>
                            Workflow Builder (Drag & Drop)
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                            Prozesse per Drag & Drop zwischen Backlog, In Progress und Done verschieben und neue Steps direkt hinzufügen.
                        </Typography>
                        <Grid container spacing={gridSpacing}>
                            {WORKFLOW_COLUMNS.map((column) => (
                                <Grid item xs={12} md={4} key={column.id}>
                                    <Box
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={() => onDropToColumn(column.id)}
                                        sx={{
                                            minHeight: 320,
                                            p: 1.5,
                                            borderRadius: 3,
                                            border: `1px dashed ${theme.palette.divider}`,
                                            backgroundColor: alpha(theme.palette.background.default, 0.45)
                                        }}
                                    >
                                        <Typography variant='subtitle2' sx={{ mb: 1.2, textTransform: 'uppercase' }}>
                                            {column.title}
                                        </Typography>

                                        <Stack direction='row' spacing={1} sx={{ mb: 1.2 }}>
                                            <TextField
                                                size='small'
                                                placeholder='Neuer Schritt...'
                                                value={newWorkflowStep[column.id] || ''}
                                                onChange={(event) => setNewWorkflowStep((prev) => ({ ...prev, [column.id]: event.target.value }))}
                                                fullWidth
                                            />
                                            <IconButton color='primary' onClick={() => addWorkflowStep(column.id)}>
                                                <IconPlus size={17} />
                                            </IconButton>
                                        </Stack>

                                        <Stack spacing={1}>
                                            {(workflowBoard[column.id] || []).map((item) => (
                                                <Box
                                                    key={item.id}
                                                    draggable
                                                    onDragStart={() => onDragStart(column.id, item.id)}
                                                    sx={{
                                                        p: 1.2,
                                                        borderRadius: 2,
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        backgroundColor: 'white',
                                                        cursor: 'grab'
                                                    }}
                                                >
                                                    <Typography variant='body2'>{item.title}</Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
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

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
                            <TextField
                                size='small'
                                label='weclapp Base URL'
                                placeholder='https://.../webapp/api/v1'
                                value={weclappConfig.baseUrl}
                                onChange={(event) => setWeclappConfig((prev) => ({ ...prev, baseUrl: event.target.value }))}
                                sx={{ width: { xs: '100%', md: 280 } }}
                            />
                            <TextField
                                size='small'
                                label='API Token'
                                type='password'
                                value={weclappConfig.apiToken}
                                onChange={(event) => setWeclappConfig((prev) => ({ ...prev, apiToken: event.target.value }))}
                                sx={{ width: { xs: '100%', md: 280 } }}
                            />
                        </Stack>

                        <TextField
                            size='small'
                            placeholder='Projekt oder Verantwortliche suchen...'
                            value={projectQuery}
                            onChange={(event) => setProjectQuery(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <IconSearch size={16} />
                                    </InputAdornment>
                                )
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
        if (activeView === 'workflows') return renderWorkflowBuilder()
        if (['dashboard', 'controlling', 'reporting', 'okr', 'projects', 'resources'].includes(activeView)) return renderBiDashboard()

        if (activeView !== 'integrations') {
            return (
                <Card sx={{ borderRadius: 4 }}>
                    <CardContent>
                        <Stack spacing={1}>
                            <Typography variant='h3'>{activeViewLabel}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                                Diese Domain-Ansicht ist vorbereitet. Schwerpunkt: Integrations-Hub, BI-Verknüpfungen und Workflow-Automation.
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
                                    CRP<span style={{ color: '#B8D548' }}>flow</span>
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
                                                    '&:hover': { bgcolor: active ? alpha('#C8F560', 0.85) : alpha('#fff', 0.06) }
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
                            {lastSyncAt && <Chip label={`Last Sync: ${new Date(lastSyncAt).toLocaleTimeString('de-DE')}`} color='primary' variant='outlined' size='small' />}
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
                            {notifications.map((notification) => (
                                <Box
                                    key={notification.id}
                                    sx={{
                                        p: 1.2,
                                        borderRadius: 2,
                                        border: `1px solid ${theme.palette.divider}`,
                                        bgcolor: notification.type === 'warning' ? alpha(theme.palette.warning.light, 0.2) : alpha(theme.palette.info.light, 0.18)
                                    }}
                                >
                                    <Stack direction='row' spacing={1} alignItems='flex-start'>
                                        <IconUser size={15} style={{ marginTop: 2 }} />
                                        <Typography variant='body2' sx={{ flex: 1 }}>
                                            {notification.message}
                                        </Typography>
                                        <IconButton size='small' onClick={() => setNotifications((prev) => prev.filter((entry) => entry.id !== notification.id))}>
                                            <IconX size={14} />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            ))}
                            {notifications.length === 0 && <Typography variant='body2' color='text.secondary'>Keine offenen Meldungen.</Typography>}
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </MainCard>
    )
}

export default OperationsHub
