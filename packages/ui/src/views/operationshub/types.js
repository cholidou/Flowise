/**
 * @typedef {Object} WeclappAggregatedData
 * @property {{orders: Array<any>, activeWorkItems: Array<any>}} operationalData
 * @property {{totalOpenTickets: number, totalActiveTasks: number}} analytics
 */

export const defaultWeclappAggregatedData = {
    operationalData: {
        orders: [],
        activeWorkItems: []
    },
    analytics: {
        totalOpenTickets: 0,
        totalActiveTasks: 0
    }
}
