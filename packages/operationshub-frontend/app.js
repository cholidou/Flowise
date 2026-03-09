const logView = document.getElementById('logView')
const syncBtn = document.getElementById('syncBtn')

syncBtn?.addEventListener('click', () => {
    const entries = [
        '[SYNC] Initializing full data sweep for ERP connector...',
        '[KERNEL] Aggregation complete: 4 data sets / 21 work items.',
        '[ANALYTICS] Open Tickets: 7, Active Tasks: 11.',
        '[DATA] Project portfolio updated with latest orders.'
    ]
    logView.textContent += `\n${entries.join('\n')}`
})

let dragging = null
document.querySelectorAll('.task').forEach((task) => {
    task.addEventListener('dragstart', () => {
        dragging = task
    })
})

document.querySelectorAll('.lane').forEach((lane) => {
    lane.addEventListener('dragover', (event) => event.preventDefault())
    lane.addEventListener('drop', () => {
        if (dragging) lane.appendChild(dragging)
        dragging = null
    })
})
