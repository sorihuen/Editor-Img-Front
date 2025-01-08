<script setup>
import { ref, watch } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

// Referencias y estado
const selectedFile = ref(null)
const selectedOperation = ref('cambiar_tamaño')
const loading = ref(false)
const error = ref(null)
const processedImageUrl = ref(null)
const originalImageUrl = ref(null)
const fileInput = ref(null)
const isDragging = ref(false)
const cropperRef = ref(null)
const showCropper = ref(false)
const cropData = ref(null)

// Imágenes de muestra (ajusta las rutas según tu proyecto)
const sampleImages = ref([
    '/src/assets/img/borroso.jpg',
    '/src/assets/img/blanco-negro.jpg',
    '/src/assets/img/recorte.jpg',
    '/src/assets/img/filtro.jpg',
    '/src/assets/img/sinfondo.jpg',
])

// Observar cambios en la operación seleccionada
watch(selectedOperation, (newValue) => {
    showCropper.value = newValue === 'recortar'
})

// Manejadores de archivos
const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
        handleFile(file)
    }
}

const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
        selectedFile.value = file
        originalImageUrl.value = URL.createObjectURL(file)
        processedImageUrl.value = null
        error.value = null
        cropData.value = null
    } else {
        error.value = 'Por favor, selecciona un archivo de imagen válido'
    }
}

// Manejadores de arrastrar y soltar
const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = true
}

const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = false
}

const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
}

const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.value = false
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
        handleFile(files[0])
    }
}

// Funciones auxiliares
const openFileSelector = () => {
    fileInput.value.click()
}

const handleCrop = (cropData) => {
    const { coordinates, canvas } = cropData
    cropData.value = coordinates
}

// Procesar imagen
const processImage = async () => {
    if (!selectedFile.value) return

    loading.value = true
    error.value = null

    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('operacion', selectedOperation.value)

    if (selectedOperation.value === 'recortar' && cropData.value) {
        formData.append('crop_data', JSON.stringify(cropData.value))
    }

    try {
        const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error('Error al procesar la imagen')
        }

        const data = await response.json()
        processedImageUrl.value = `http://localhost:5000${data.url}`
    } catch (err) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}

const selectSampleImage = (imageSrc) => {
    originalImageUrl.value = imageSrc
    processedImageUrl.value = null
    error.value = null
    cropData.value = null
}
</script>

<template>
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-lg">
                <h1 class="text-3xl font-extrabold text-white text-center">Editor de imágenes</h1>
            </div>

            <!-- Main Content -->
            <div class="bg-white rounded-b-lg shadow-xl overflow-hidden">
                <div class="flex flex-col md:flex-row">
                    <!-- Left Section: Image Processor -->
                    <div class="md:w-3/4 p-6 space-y-6 border-r border-gray-200">
                        <!-- Hidden File Input -->
                        <input 
                            type="file" 
                            id="file-upload" 
                            ref="fileInput" 
                            @change="handleFileChange"
                            accept="image/jpeg, image/png, image/gif" 
                            class="hidden" 
                        />

                        <!-- Drag & Drop Area / Image Preview -->
                        <div v-if="!showCropper" class="flex items-center justify-center">
                            <div
                                @click="openFileSelector"
                                @dragenter="handleDragEnter"
                                @dragleave="handleDragLeave"
                                @dragover="handleDragOver"
                                @drop="handleDrop"
                                :class="[
                                    'w-full min-h-[400px] border-4 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                    isDragging ? 'border-blue-500 bg-blue-50 scale-[0.99] shadow-lg' : 'border-gray-300 hover:border-blue-500'
                                ]"
                            >
                                <div v-if="!originalImageUrl" class="text-center p-8">
                                    <svg class="mx-auto h-24 w-24 text-gray-400" stroke="currentColor" fill="none"
                                        viewBox="0 0 48 48" aria-hidden="true">
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
                                        />
                                    </svg>
                                    <p class="mt-4 text-xl text-gray-600 font-medium">
                                        {{ isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar' }}
                                    </p>
                                    <p class="mt-2 text-sm text-gray-500">
                                        Formatos soportados: JPG, PNG, GIF
                                    </p>
                                </div>
                                <img 
                                    v-else 
                                    :src="originalImageUrl" 
                                    class="max-h-[400px] object-contain p-4"
                                    alt="Imagen seleccionada" 
                                />
                            </div>
                        </div>

                        <!-- Cropper Component -->
                        <div v-if="showCropper && originalImageUrl" class="w-full min-h-[400px]">
                            <Cropper
                                ref="cropperRef"
                                :src="originalImageUrl"
                                :stencil-props="{
                                    aspect: 1
                                }"
                                class="min-h-[400px]"
                                @change="handleCrop"
                            />
                        </div>

                        <!-- Operation Selector -->
                        <div class="space-y-2">
                            <label for="operation" class="block text-sm font-medium text-gray-700">
                                Operación:
                            </label>
                            <select 
                                id="operation" 
                                v-model="selectedOperation"
                                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="cambiar_tamaño">Cambiar Tamaño</option>
                                <option value="convertir_a_jpg">Convertir a JPG</option>
                                <option value="recortar">Recortar</option>
                                <option value="rotar">Rotar</option>
                            </select>
                        </div>

                        <!-- Process Button -->
                        <button 
                            @click="processImage" 
                            :disabled="!originalImageUrl"
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                            {{ selectedOperation === 'recortar' ? 'Aplicar Recorte' : 'Procesar Imagen' }}
                        </button>

                        <!-- Loading State -->
                        <div v-if="loading" class="text-center text-gray-600">
                            Procesando imagen...
                        </div>

                        <!-- Error Message -->
                        <div v-if="error" class="text-center text-red-600">
                            {{ error }}
                        </div>

                        <!-- Results -->
                        <div v-if="processedImageUrl" class="mt-6 space-y-4">
                            <h2 class="text-xl font-bold text-gray-900">Resultado:</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <h3 class="text-lg font-medium text-gray-900">Imagen Original:</h3>
                                    <img 
                                        :src="originalImageUrl" 
                                        class="w-full h-auto rounded-lg shadow-md"
                                        alt="Imagen original" 
                                    />
                                </div>
                                <div class="space-y-2">
                                    <h3 class="text-lg font-medium text-gray-900">Imagen Procesada:</h3>
                                    <img 
                                        :src="processedImageUrl" 
                                        class="w-full h-auto rounded-lg shadow-md"
                                        alt="Imagen procesada" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Section: Sample Images -->
                    <div class="md:w-1/4 p-6 space-y-6">
                        <h2 class="text-xl font-bold text-gray-900">Imágenes de muestra</h2>
                        <div class="grid grid-cols-2 gap-4">
                            <button 
                                v-for="(image, index) in sampleImages" 
                                :key="index"
                                @click="selectSampleImage(image)"
                                class="w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
                            >
                                <img 
                                    :src="image" 
                                    class="w-full h-full object-cover"
                                    :alt="`Imagen de muestra ${index + 1}`" 
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>