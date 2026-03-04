import { defaultWeclappAggregatedData } from '../types'

const CLOSED_PROJECT_STATUSES = ['CLOSED', 'GESCHLOSSEN', 'ABGESCHLOSSEN', 'DONE', 'ARCHIVED']
const CLOSED_TICKET_STATUSES = ['CLOSED', 'GESCHLOSSEN', 'ABGESCHLOSSEN', 'DONE', 'FINISHED']
const CLOSED_TASK_STATUSES = ['CLOSED', 'DONE', 'FINISHED', 'ABGESCHLOSSEN']

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

const isClosedStatus = (status, closedStatuses) => {
    const normalizedStatus = status?.toUpperCase() || ''
    return closedStatuses.includes(normalizedStatus)
}

export const mapWeclappOrderToProject = (order) => {
    const orderId = String(order?.id ?? '')
    const orderNumber = order?.orderNumber || order?.projectNumber || orderId
    const customerName = order?.customerName || order?.customer?.name || 'Unknown Customer'

    return {
        id: orderId || `order-${Date.now()}`,
        name: order?.name || `${orderNumber} - ${customerName}`,
        owner: order?.lead || order?.assignedTo || 'n/a',
        progress: typeof order?.progress === 'number' ? Math.max(0, Math.min(100, Math.round(order.progress))) : 0,
        budget: Number(order?.budget || 0),
        risk: order?.risk || 'Medium',
        weclappOrderNumber: orderNumber,
        customerName,
        status: order?.status || 'OPEN'
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
        return allProjects.filter((project) => !isClosedStatus(project.status, CLOSED_PROJECT_STATUSES))
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
        return allTickets.filter((ticket) => !isClosedStatus(ticket.status, CLOSED_TICKET_STATUSES))
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
        return allTasks.filter((task) => !isClosedStatus(task.status, CLOSED_TASK_STATUSES))
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
