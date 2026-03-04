import { useMemo, useState } from 'react'

// material-ui
import { Box, Button, Card, CardContent, Chip, Divider, Grid, List, ListItem, ListItemText, Stack, Tab, Tabs, Typography, alpha, useTheme } from '@mui/material'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import { gridSpacing } from 'store/constant'

// icons
import {
    IconActivityHeartbeat,
    IconAdjustments,
    IconArrowsExchange,
    IconBolt,
    IconBriefcase,
    IconCalendarEvent,
    IconChartBar,
    IconChecklist,
    IconClock,
    IconDatabase,
    IconMessages,
    IconShieldLock,
    IconUsersGroup
} from '@tabler/icons'

const navSections = [
    {
        title: 'Operative Exzellenz',
        items: [
            { icon: IconAdjustments, label: 'Mein Fokus' },
            { icon: IconBriefcase, label: 'Projekt Hub' },
            { icon: IconCalendarEvent, label: 'Kalender' },
            { icon: IconChecklist, label: 'Sprint Planner' }
        ]
    },
    {
        title: 'Management & BI',
        items: [
            { icon: IconChartBar, label: 'Dashboard' },
            { icon: IconUsersGroup, label: 'Ressourcen' },
            { icon: IconMessages, label: 'Reporting' }
        ]
    },
    {
        title: 'System-Architektur',
        items: [
            { icon: IconDatabase, label: 'Daten-Registry' },
            { icon: IconArrowsExchange, label: 'Workflows' },
            { icon: IconShieldLock, label: 'Security' }
        ]
    }
]

const statusCards = [
    { title: 'System Health', value: 'Active / Secure', info: '99.98% Uptime', icon: IconActivityHeartbeat, color: '#12B76A' },
    { title: 'API Latenz', value: '124ms', info: 'Optimal', icon: IconBolt, color: '#7C4DFF' },
    { title: 'Error Rate (24h)', value: '0.02%', info: 'Niedrig', icon: IconActivityHeartbeat, color: '#F04438' }
]

const projects = [
    { name: 'ERP Migration', manager: 'A. Becker', progress: 78, budget: '312.000 €', risk: 'Low' },
    { name: 'CRM Rollout', manager: 'M. Silva', progress: 54, budget: '198.500 €', risk: 'Medium' },
    { name: 'Data Lake Setup', manager: 'L. Novák', progress: 91, budget: '440.000 €', risk: 'Low' }
]

const resourceFeed = [
    '[10:36:37] [SYNC] Neue Zeiterfassung aus Team Nord importiert.',
    '[10:38:14] [CAPACITY] Auslastung im DevOps Team: 86%.',
    '[10:41:02] [BUDGET] Projekt CRM Rollout erreicht 54% Budgetverbrauch.',
    '[10:43:27] [ALERT] QA Ressourcen in Sprint 34 unterbesetzt.',
    '[10:45:39] [INFO] Portfolio-Report erfolgreich erstellt.'
]

const OperationsHub = () => {
    const theme = useTheme()
    const [tab, setTab] = useState(0)

    const riskChipColor = useMemo(
        () => ({
            Low: 'success',
            Medium: 'warning',
            High: 'error'
        }),
        []
    )

    return (
        <MainCard sx={{ p: 0, overflow: 'hidden', borderRadius: 4 }}>
            <Grid container sx={{ minHeight: '78vh' }}>
                <Grid
                    item
                    md={3}
                    lg={2.5}
                    sx={{
                        background: 'linear-gradient(180deg, #051a31 0%, #031325 100%)',
                        color: theme.palette.common.white,
                        p: 3,
                        borderRight: `1px solid ${alpha(theme.palette.common.white, 0.08)}`
                    }}
                >
                    <Typography variant='h3' sx={{ mb: 4, color: '#C8F560' }}>
                        Orbit PMO
                    </Typography>
                    <Stack spacing={3}>
                        {navSections.map((section) => (
                            <Box key={section.title}>
                                <Typography variant='caption' sx={{ color: alpha(theme.palette.common.white, 0.45), textTransform: 'uppercase' }}>
                                    {section.title}
                                </Typography>
                                <List sx={{ mt: 1, p: 0 }}>
                                    {section.items.map((item, index) => {
                                        const Icon = item.icon
                                        const isActive = section.title === 'Management & BI' && index === 1

                                        return (
                                            <ListItem
                                                key={item.label}
                                                sx={{
                                                    borderRadius: 2,
                                                    mb: 0.5,
                                                    backgroundColor: isActive ? alpha('#C8F560', 0.85) : 'transparent',
                                                    color: isActive ? '#031325' : alpha(theme.palette.common.white, 0.9)
                                                }}
                                            >
                                                <Icon size={18} />
                                                <ListItemText
                                                    primary={item.label}
                                                    primaryTypographyProps={{ ml: 1.5, fontWeight: 600, fontSize: '0.85rem' }}
                                                />
                                            </ListItem>
                                        )
                                    })}
                                </List>
                            </Box>
                        ))}
                    </Stack>
                </Grid>

                <Grid item md={9} lg={9.5} sx={{ background: '#f5f7fb' }}>
                    <Box sx={{ p: 3 }}>
                        <Stack direction='row' justifyContent='space-between' alignItems='center' mb={3}>
                            <Typography variant='h2'>Project & Resource Command Center</Typography>
                            <Chip label='Status: Live Ops' color='success' variant='outlined' />
                        </Stack>

                        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
                            <Tab label='Sync Center' />
                            <Tab label='Data Registry' />
                            <Tab label='Security Vault' />
                        </Tabs>

                        <Grid container spacing={gridSpacing}>
                            {statusCards.map((card) => {
                                const Icon = card.icon

                                return (
                                    <Grid item xs={12} md={4} key={card.title}>
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
                                        <Stack direction='row' justifyContent='space-between' mb={2}>
                                            <Typography variant='h3'>Top Projekte</Typography>
                                            <Button variant='contained'>Neues Projekt</Button>
                                        </Stack>
                                        <Stack spacing={2}>
                                            {projects.map((project) => (
                                                <Box key={project.name} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                                                    <Stack direction='row' justifyContent='space-between' alignItems='center'>
                                                        <Box>
                                                            <Typography variant='h4'>{project.name}</Typography>
                                                            <Typography variant='body2' color='text.secondary'>
                                                                Projektleitung: {project.manager} · Budget: {project.budget}
                                                            </Typography>
                                                        </Box>
                                                        <Chip label={project.risk} color={riskChipColor[project.risk]} size='small' />
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
                                                fontFamily: 'monospace',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {resourceFeed.map((line) => (
                                                <Typography key={line} sx={{ fontFamily: 'inherit', fontSize: 'inherit', mb: 1 }}>
                                                    {line}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default OperationsHub
