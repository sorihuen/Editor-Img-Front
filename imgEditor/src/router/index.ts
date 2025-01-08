import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../components/ImageProcessor.vue'),
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
