<template>
    <div class="login-container">
        <!-- Existing login form -->

        <!-- Token Expiration Message -->
        <Message v-if="showTokenExpired" severity="warn" :closable="false">
            Your session has expired. Please log in again.
        </Message>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Message from 'primevue/message';

const route = useRoute();
const showTokenExpired = ref(false);

onMounted(() => {
    // Check if expired query parameter exists
    showTokenExpired.value = route.query.expired === 'true';
});
</script>