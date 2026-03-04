import { defaultWeclappAggregatedData } from '../types'

const validateConfig = (baseUrl, token) => {
    if (!baseUrl || !token) {
        throw new Error('Missing Weclapp configuration')
    }
}

const validateApiUrl = (baseUrl) => {
    if (!baseUrl.includes('/webapp/api/')) {
        throw new Error('Ungültige weclapp URL. Die API-URL muss normalerweise auf "/webapp/api/v1" oder "/api/v2" enden.')
    }
}

const fetchFromProxy = async (baseUrl, token, endpoint) => {
    const response = await fetch('/api/weclapp/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            baseUrl,
            token,
            endpoint
        })
    })

    const data = await response.json().catch(() => ({ error: 'Invalid response from proxy' }))

    if (!response.ok || data.error) {
        throw new Error(data.error || `Weclapp API error: ${response.statusText}`)
    }

    return data.result || []
}

export const fetchWeclappAggregatedData = async (baseUrl, token) => {
    validateConfig(baseUrl, token)

    const response = await fetch('/api/weclapp/aggregate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            baseUrl,
            token
        })
    })

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `Aggregation failed: ${response.statusText}`)
    }

    const payload = await response.json()
    return payload || defaultWeclappAggregatedData
}

export const fetchWeclappProjects = async (baseUrl, token) => {
    if (!baseUrl || !token) {
        return [
            { id: 'W-PROJ-001', name: 'Weclapp Project Alpha', customerName: 'Global Corp', projectNumber: 'P100', status: 'ONGOING' },
            { id: 'W-PROJ-002', name: 'Weclapp Project Beta', customerName: 'Tech Solutions', projectNumber: 'P101', status: 'ONGOING' },
            { id: 'W-PROJ-003', name: 'New Weclapp Project', customerName: 'Startup Inc', projectNumber: 'P102', status: 'NEW' }
        ]
    }

    validateApiUrl(baseUrl)

    try {
        const allProjects = await fetchFromProxy(baseUrl, token, 'project')
        const closedStatuses = ['CLOSED', 'GESCHLOSSEN', 'ABGESCHLOSSEN', 'DONE', 'ARCHIVED']

        return allProjects.filter((project) => {
            const status = project.status?.toUpperCase() || ''
            return !closedStatuses.includes(status)
        })
    } catch (error) {
        console.error('Failed to fetch weclapp projects:', error)
        return []
    }
}

export const fetchWeclappTickets = async (baseUrl, token) => {
    if (!baseUrl || !token) {
        return [
            { id: 'W-TICK-101', ticketNumber: 'T101', subject: 'Fix Login Issue', status: 'OPEN' },
            { id: 'W-TICK-102', ticketNumber: 'T102', subject: 'Update Documentation', status: 'IN_PROGRESS' },
            { id: 'W-TICK-103', ticketNumber: 'T103', subject: 'New Feature Request', status: 'OPEN' }
        ]
    }

    validateApiUrl(baseUrl)

    try {
        const allTickets = await fetchFromProxy(baseUrl, token, 'ticket')
        const closedStatuses = ['CLOSED', 'GESCHLOSSEN', 'ABGESCHLOSSEN', 'DONE', 'FINISHED']

        return allTickets.filter((ticket) => {
            const status = ticket.status?.toUpperCase() || ''
            return !closedStatuses.includes(status)
        })
    } catch (error) {
        console.error('Failed to fetch weclapp tickets:', error)
        return []
    }
}

export const fetchWeclappProjectTasks = async (baseUrl, token) => {
    if (!baseUrl || !token) {
        return [
            { id: 'W-TASK-001', name: 'Design Phase', status: 'OPEN' },
            { id: 'W-TASK-002', name: 'Implementation', status: 'IN_PROGRESS' }
        ]
    }

    validateApiUrl(baseUrl)

    try {
        const allTasks = await fetchFromProxy(baseUrl, token, 'projectTask')
        const closedStatuses = ['CLOSED', 'DONE', 'FINISHED', 'ABGESCHLOSSEN']

        return allTasks.filter((task) => {
            const status = task.status?.toUpperCase() || ''
            return !closedStatuses.includes(status)
        })
    } catch (error) {
        console.error('Failed to fetch weclapp project tasks:', error)
        return []
    }
}

export class WeclappService {
    constructor(config) {
        this.config = config
    }

    async request(endpoint, method = 'GET', body) {
        try {
            const response = await fetch('/api/weclapp/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    baseUrl: this.config.baseUrl,
                    token: this.config.apiToken,
                    endpoint,
                    method,
                    body
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Weclapp Proxy error: ${response.statusText}`)
            }

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error + (data.details ? `: ${data.details}` : ''))
            }

            return { status: 'success', data }
        } catch (error) {
            console.error(`[WeclappService] Request failed for ${endpoint}:`, error)
            return { status: 'error', message: error.message }
        }
    }

    async getAllProjects() {
        return this.request('project')
    }

    async syncProject(projectId, projectData) {
        return this.request(`project/id/${projectId}`, 'PUT', projectData)
    }

    async getAllTickets() {
        return this.request('ticket')
    }

    async syncTicket(ticketId, ticketData) {
        return this.request(`ticket/id/${ticketId}`, 'PUT', ticketData)
    }

    async syncTimeLog(logData) {
        return this.request('remoteServiceLog', 'POST', logData)
    }
}

export default WeclappService
