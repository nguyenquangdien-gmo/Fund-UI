<template>
    <div class="register-container">
        <Card class="p-4 shadow-lg">
            <template #content>
                <div class="text-center mb-3">
                    <h3>REGISTER</h3>
                </div>
                <form @submit.prevent="handleRegister">

                    <div class="mb-3">
                        <span class="p-inputgroup w-100">

                            <InputText v-model="name" type="text" size="large" placeholder="Full name"
                                class="w-100 p-inputtext-sm" />
                        </span>
                        <small class="text-danger">{{ errors.name }}</small>
                    </div>
                    <div class="mb-3">
                        <span class="p-inputgroup w-100">

                            <InputText v-model="email" type="email" size="large" placeholder="Email"
                                class="w-100 p-inputtext-sm" />
                        </span>
                        <small class="text-danger">{{ errors.email }}</small>
                    </div>

                    <div class="mb-3">
                        <span class="p-inputgroup w-100">

                            <Password v-model="password" placeholder="Password" size="large" toggleMask
                                class="w-100 p-inputtext-sm input-password" />
                        </span>
                        <small class="text-danger">{{ errors.password }}</small>
                    </div>


                    <div class="mb-3">
                        <span class="p-inputgroup w-100">

                            <Password v-model="confirmPassword" placeholder="Confirm Password" size="large" toggleMask
                                class="w-100 p-inputtext-sm input-password" />
                        </span>
                        <small class="text-danger">{{ errors.confirmPassword }}</small>
                    </div>

                    <Button label="REGISTER" class="w-100 p-button-dark" type="submit" />
                </form>
            </template>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import axiosInstance from '@/router/Interceptor';
import type { Error } from '@/types/Error'

// const baseURL = "http://localhost:8080/api/v1";
const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')

const errors = ref<Error>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
})

const handleRegister = async () => {
    let isValid = true;
    errors.value.name = '';
    errors.value.email = '';
    errors.value.password = '';
    errors.value.confirmPassword = '';

    if (!email.value.trim()) {
        errors.value.email = 'Email is required';
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email.value)) {
        errors.value.email = 'Please enter a valid email';
        isValid = false;
    }
    if (!name.value.trim()) {
        errors.value.name = 'Name is required';
        isValid = false;
    }

    if (!password.value.trim()) {
        errors.value.password = 'Password is required';
        isValid = false;
    } else if (password.value.length < 6) {
        errors.value.password = 'Password must be at least 6 characters';
        isValid = false;
    }

    if (!confirmPassword.value.trim()) {
        errors.value.confirmPassword = 'Confirm Password is required';
        isValid = false;
    } else if (password.value !== confirmPassword.value) {
        errors.value.confirmPassword = 'Passwords do not match!';
        isValid = false;
    }

    if (isValid) {
        try {
            const response = await axiosInstance.post(`/auth/register`, {
                fullName: name.value,
                email: email.value,
                password: password.value,
                role: 'MEMBER'
            });
            if (response.data) {
                router.push('/login');
            } else {
                errors.value.email = 'Registration failed. Please try again.';
            }
        } catch (error) {
            errors.value.email = 'An error occurred. Please try again later.';
        }
    }
}
</script>

<style scoped>
.register-container {
    max-width: 400px;
    margin: auto;
    padding: 20px;
}

:deep(.p-password) {
    padding: 0;
}

:deep(.p-password input) {
    width: 100%;
}
</style>