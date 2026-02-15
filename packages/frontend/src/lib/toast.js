import { reactive } from 'vue'

export const toastState = reactive({
    toasts: []
})

export const toast = {
    success(message) {
        this.add({ message, type: 'success' })
    },
    error(message) {
        this.add({ message, type: 'error' })
    },
    info(message) {
        this.add({ message, type: 'info' })
    },
    add(notification) {
        const id = Date.now()
        toastState.toasts.push({ ...notification, id })
        setTimeout(() => {
            this.remove(id)
        }, 5000)
    },
    remove(id) {
        const index = toastState.toasts.findIndex(t => t.id === id)
        if (index !== -1) {
            toastState.toasts.splice(index, 1)
        }
    }
}
