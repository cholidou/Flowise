import { defaultWeclappAggregatedData } from '../types'

const CLOSED_PROJECT_STATUSES = ['CLOSED', 'GESCHLOSSEN', 'ABGESCHLOSSEN', 'DONE', 'ARCHIVED']
const CLOSED_TICKET_STATUSES = ['CLOSED', 'GESCHLOSSEN', 'ABGESCHLOSSEN', 'DONE', 'FINISHED']
const CLOSED_TASK_STATUSES = ['CLOSED', 'DONE', 'FINISHED', 'ABGESCHLOSSEN']
const SAFE_ENDPOINT_PATTERN = /^[a-zA-Z0-9/_-]+$/

const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '')

const validateConfig = (baseUrl, token) => {
    if (!normalizeValue(baseUrl) || !normalizeValue(token)) {
        throw new Error('Missing Weclapp configuration')
    }
}

const validateApiUrl = (baseUrl) => {
    const normalizedBaseUrl = normalizeValue(baseUrl)

    let parsed
    try {
        parsed = new URL(normalizedBaseUrl)
    } catch (error) {
        throw new Error('Ungültige weclapp URL. Bitte eine vollständige URL angeben.')
    }

    const isSecureProtocol = parsed.protocol === 'https:' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
    if (!isSecureProtocol) {
        throw new Error('Unsichere weclapp URL. Bitte HTTPS verwenden.')
    }

    const isSupportedPath = parsed.pathname.includes('/webapp/api/') || parsed.pathname.includes('/api/v2')
    if (!isSupportedPath) {
        throw new Error('Ungültige weclapp URL. Die API-URL muss normalerweise auf "/webapp/api/v1" oder "/api/v2" enden.')
    }
}

const validateEndpoint = (endpoint) => {
    const normalizedEndpoint = normalizeValue(endpoint)
    if (!normalizedEndpoint || !SAFE_ENDPOINT_PATTERN.test(normalizedEndpoint) || normalizedEndpoint.includes('..')) {
        throw new Error('Ungültiger API-Endpoint')
    }
    return normalizedEndpoint
}

const isClosedStatus = (status, closedStatuses) => {
    const normalizedStatus = status?.toUpperCase() || ''
    return closedStatuses.includes(normalizedStatus)
}

const getSafeErrorMessage = (error, fallback = 'Request failed') => {
    if (error instanceof Error && error.message) return error.message
    if (typeof error === 'string') return error
    return fallback
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
    const normalizedBaseUrl = normalizeValue(baseUrl)
    const normalizedToken = normalizeValue(token)
    const normalizedEndpoint = validateEndpoint(endpoint)

    validateConfig(normalizedBaseUrl, normalizedToken)
    validateApiUrl(normalizedBaseUrl)

    const response = await fetch('/api/weclapp/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            baseUrl: normalizedBaseUrl,
            token: normalizedToken,
            endpoint: normalizedEndpoint
        })
    })

    const data = await response.json().catch(() => ({ error: 'Invalid response from proxy' }))

    if (!response.ok || data.error) {
        throw new Error(data.error || `Weclapp API error: ${response.statusText}`)
    }

    return data.result || []
}

export const fetchWeclappAggregatedData = async (baseUrl, token) => {
    const normalizedBaseUrl = normalizeValue(baseUrl)
    const normalizedToken = normalizeValue(token)

    validateConfig(normalizedBaseUrl, normalizedToken)
    validateApiUrl(normalizedBaseUrl)

    const response = await fetch('/api/weclapp/aggregate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            baseUrl: normalizedBaseUrl,
            token: normalizedToken
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
    if (!normalizeValue(baseUrl) || !normalizeValue(token)) {
        return [
            { id: 'W-PROJ-001', name: 'Weclapp Project Alpha', customerName: 'Global Corp', projectNumber: 'P100', status: 'ONGOING' },
            { id: 'W-PROJ-002', name: 'Weclapp Project Beta', customerName: 'Tech Solutions', projectNumber: 'P101', status: 'ONGOING' },
            { id: 'W-PROJ-003', name: 'New Weclapp Project', customerName: 'Startup Inc', projectNumber: 'P102', status: 'NEW' }
        ]
    }

    try {
        const allProjects = await fetchFromProxy(baseUrl, token, 'project')
        return allProjects.filter((project) => !isClosedStatus(project.status, CLOSED_PROJECT_STATUSES))
    } catch (error) {
        console.error('Failed to fetch weclapp projects:', getSafeErrorMessage(error))
        return []
    }
}

export const fetchWeclappTickets = async (baseUrl, token) => {
    if (!normalizeValue(baseUrl) || !normalizeValue(token)) {
        return [
            { id: 'W-TICK-101', ticketNumber: 'T101', subject: 'Fix Login Issue', status: 'OPEN' },
            { id: 'W-TICK-102', ticketNumber: 'T102', subject: 'Update Documentation', status: 'IN_PROGRESS' },
            { id: 'W-TICK-103', ticketNumber: 'T103', subject: 'New Feature Request', status: 'OPEN' }
        ]
    }

    try {
        const allTickets = await fetchFromProxy(baseUrl, token, 'ticket')
        return allTickets.filter((ticket) => !isClosedStatus(ticket.status, CLOSED_TICKET_STATUSES))
    } catch (error) {
        console.error('Failed to fetch weclapp tickets:', getSafeErrorMessage(error))
        return []
    }
}

export const fetchWeclappProjectTasks = async (baseUrl, token) => {
    if (!normalizeValue(baseUrl) || !normalizeValue(token)) {
        return [
            { id: 'W-TASK-001', name: 'Design Phase', status: 'OPEN' },
            { id: 'W-TASK-002', name: 'Implementation', status: 'IN_PROGRESS' }
        ]
    }

    try {
        const allTasks = await fetchFromProxy(baseUrl, token, 'projectTask')
        return allTasks.filter((task) => !isClosedStatus(task.status, CLOSED_TASK_STATUSES))
    } catch (error) {
        console.error('Failed to fetch weclapp project tasks:', getSafeErrorMessage(error))
        return []
    }
}

export class WeclappService {
    constructor(config) {
        this.config = config
    }

    async request(endpoint, method = 'GET', body) {
        const normalizedBaseUrl = normalizeValue(this.config?.baseUrl)
        const normalizedToken = normalizeValue(this.config?.apiToken)

        try {
            validateConfig(normalizedBaseUrl, normalizedToken)
            validateApiUrl(normalizedBaseUrl)

            const safeEndpoint = validateEndpoint(endpoint)
            const response = await fetch('/api/weclapp/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    baseUrl: normalizedBaseUrl,
                    token: normalizedToken,
                    endpoint: safeEndpoint,
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
            const message = getSafeErrorMessage(error)
            console.error(`[WeclappService] Request failed for ${endpoint}: ${message}`)
            return { status: 'error', message }
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
